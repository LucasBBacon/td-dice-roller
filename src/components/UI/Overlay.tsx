import "./Overlay.css";
import { useDiceStore } from "../../store/useDiceStore";

export const Overlay = () => {
  const { rollDice, rollHistory, skipAnimation, setSkipAnimation, isRolling } =
    useDiceStore();

  return (
    <div className="ui-container">
      <div className="controls">
        <button onClick={rollDice}>
          {isRolling ? "Rolling..." : "Roll D6"}
        </button>
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
          {rollHistory.map((val, i) => (
            <li key={i}>D6: {val}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
