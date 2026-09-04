import "./RollHistoryLog.css";
import type { CSSProperties, ReactNode } from "react";
import { useDiceStore } from "../../store/useDiceStore";
import type { NodeEval } from "../../roll/evaluator";

const MAX_VISIBLE_LINES = 7;

const renderNodeEval = (node: NodeEval): ReactNode => {
  switch (node.kind) {
    case "pool":
      return (
        <span>
          {node.dieType}[
          {node.dice.map((outcome, index) => (
            <span key={outcome.dieId}>
              {index > 0 ? ", " : null}
              {outcome.dropped ? (
                <s className="roll-history-dropped">{outcome.value}</s>
              ) : (
                outcome.value
              )}
            </span>
          ))}
          ]
        </span>
      );
    case "keepDrop":
      return (
        <span>
          {renderNodeEval(node.child)}
          <span className="roll-history-modifier">
            {node.mode}
            {node.n}
          </span>
        </span>
      );
    case "sum":
      return (
        <span>
          {node.children.map((child, index) => (
            <span key={child.nodeId}>
              {index > 0 ? " + " : null}
              {renderNodeEval(child)}
            </span>
          ))}
        </span>
      );
  }
};

const describeNodeEval = (node: NodeEval): string => {
  switch (node.kind) {
    case "pool":
      return `${node.dieType}[${node.dice
        .map((outcome) => (outcome.dropped ? `(${outcome.value})` : `${outcome.value}`))
        .join(", ")}]`;
    case "keepDrop":
      return `${describeNodeEval(node.child)}${node.mode}${node.n}`;
    case "sum":
      return node.children.map(describeNodeEval).join(" + ");
  }
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
            title={`${describeNodeEval(batch.evaluation)} = ${batch.total}`}
          >
            <span className="roll-history-text">
              {renderNodeEval(batch.evaluation)} = {batch.total}
            </span>
            <span className="roll-history-meta">#{batch.rollId}</span>
          </li>
        );
      })}
    </ol>
  );
};
