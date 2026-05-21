import "./Overlay.css";
import { useDiceStore } from "../../store/useDiceStore";

const DIE_OPTIONS = ["d4", "d6", "d8", "d10", "d12", "d20"] as const;

export const Overlay = () => {
  const {
    rollDice,
    rollHistory,
    selectedDieType,
    setSelectedDieType,
    glbContractIssue,
    skipAnimation,
    setSkipAnimation,
    isRolling,
  } = useDiceStore();

  const selectedLabel = selectedDieType.toUpperCase();

  return (
    <div className="ui-container">
      <div className="controls">
        <button onClick={rollDice}>
          {isRolling ? "Rolling..." : `Roll ${selectedLabel}`}
        </button>
        <label
          style={{
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "auto",
          }}
        >
          Die
          <select
            value={selectedDieType}
            onChange={(e) =>
              setSelectedDieType(e.target.value as (typeof DIE_OPTIONS)[number])
            }
          >
            {DIE_OPTIONS.map((dieType) => (
              <option key={dieType} value={dieType}>
                {dieType.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
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
          {rollHistory.map((result, i) => (
            <li key={i}>
              {result.dieType.toUpperCase()}: {result.value}
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
