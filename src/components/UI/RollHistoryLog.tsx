import "./RollHistoryLog.css";
import type { CSSProperties } from "react";
import { DIE_TYPES, type DieType, useDiceStore } from "../../store/useDiceStore";

const MAX_VISIBLE_LINES = 7;

const formatBatchLine = (
  results: Array<{ dieType: DieType; value: number }>,
  total: number,
) => {
  const groupedValues = results.reduce<Record<DieType, number[]>>(
    (acc, result) => {
      acc[result.dieType].push(result.value);
      return acc;
    },
    {
      d4: [],
      d6: [],
      d8: [],
      d10: [],
      d12: [],
      d20: [],
    },
  );

  const details = DIE_TYPES.filter((dieType) => groupedValues[dieType].length > 0)
    .map((dieType) => `${dieType}[${groupedValues[dieType].join(",")}]`)
    .join(" ");

  return `${details} = ${total}`;
};

export const RollHistoryLog = () => {
  const rollHistory = useDiceStore((state) => state.rollHistory);

  if (rollHistory.length === 0) {
    return null;
  }

  const visibleHistory = rollHistory.slice(0, MAX_VISIBLE_LINES).reverse();
  const denominator = Math.max(1, visibleHistory.length - 1);

  return (
    <ol className="roll-history-log" aria-live="polite" aria-label="Roll history">
      {visibleHistory.map((batch, index) => {
        const line = formatBatchLine(batch.results, batch.total);
        const ageRatio = index / denominator;
        const opacity = 0.28 + Math.pow(ageRatio, 1.35) * 0.7;
        const metaOpacity = Math.max(0.22, opacity - 0.34);

        return (
          <li
            key={batch.rollId}
            className="roll-history-line"
            style={
              {
                "--history-line-opacity": opacity.toFixed(2),
                "--history-meta-opacity": metaOpacity.toFixed(2),
              } as CSSProperties
            }
            title={line}
          >
            <span className="roll-history-text">{line}</span>
            <span className="roll-history-meta">#{batch.rollId}</span>
          </li>
        );
      })}
    </ol>
  );
};