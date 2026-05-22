import "./Overlay.css";
import {
  DIE_TYPES,
  MAX_DICE_PER_TYPE,
  useDiceStore,
} from "../../store/useDiceStore";

const totalSelectedDice = (counts: Record<(typeof DIE_TYPES)[number], number>) =>
  DIE_TYPES.reduce((total, dieType) => total + counts[dieType], 0);

const selectionLabel = (counts: Record<(typeof DIE_TYPES)[number], number>) => {
  const parts = DIE_TYPES.filter((dieType) => counts[dieType] > 0).map(
    (dieType) => `${counts[dieType]}${dieType}`,
  );
  return parts.length > 0 ? parts.join(" + ") : "0d";
};

export const Overlay = () => {
  const {
    rollDice,
    rollHistory,
    selectedDiceCounts,
    setDieCount,
    glbContractIssue,
    skipAnimation,
    setSkipAnimation,
    isRolling,
  } = useDiceStore();

  const diceCount = totalSelectedDice(selectedDiceCounts);
  const label = selectionLabel(selectedDiceCounts);

  return (
    <div className="ui-container">
      <div className="controls">
        <button onClick={rollDice} disabled={isRolling || diceCount === 0}>
          {isRolling ? "Rolling..." : `Roll ${label}`}
        </button>

        <div className="dice-count-grid">
          {DIE_TYPES.map((dieType) => (
            <label key={dieType} className="dice-count-label">
              <span>{dieType.toUpperCase()}</span>
              <input
                type="number"
                min={0}
                max={MAX_DICE_PER_TYPE}
                value={selectedDiceCounts[dieType]}
                onChange={(event) => setDieCount(dieType, Number(event.target.value))}
              />
            </label>
          ))}
        </div>

        <label
          style={{
            color: "white",
            display: "flex",
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          <input
            type="checkbox"
            checked={skipAnimation}
            onChange={(e) => setSkipAnimation(e.target.checked)}
          />
          Skip Animation
        </label>
      </div>

      <div className="history">
        <h3>Roll History</h3>
        <ul>
          {rollHistory.map((result) => (
            <li key={result.rollId}>
              {result.notation} = {result.total}
            </li>
          ))}
        </ul>
      </div>

      {import.meta.env.DEV && glbContractIssue ? (
        <div
          style={{
            marginTop: 12,
            maxWidth: 420,
            padding: "10px 12px",
            border: "1px solid #ff8c00",
            background: "rgba(30, 20, 0, 0.85)",
            color: "#ffd38a",
            borderRadius: 8,
            pointerEvents: "auto",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <strong>Model Contract Warning</strong>
          <div>{glbContractIssue}</div>
        </div>
      ) : null}
    </div>
  );
};
