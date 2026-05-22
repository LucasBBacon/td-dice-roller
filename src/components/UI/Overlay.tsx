// #region Imports
import "./Overlay.css";
import {
  DIE_TYPES,
  MAX_DICE_PER_TYPE,
  useDiceStore,
} from "../../store/useDiceStore";
import { useState } from "react";
import { DieSilhouette } from "./DieSilhouette";
// #endregion

// #region Derived UI Helpers
const totalSelectedDice = (
  counts: Record<(typeof DIE_TYPES)[number], number>,
) => DIE_TYPES.reduce((total, dieType) => total + counts[dieType], 0);

const selectionLabel = (counts: Record<(typeof DIE_TYPES)[number], number>) => {
  const parts = DIE_TYPES.filter((dieType) => counts[dieType] > 0).map(
    (dieType) => `${counts[dieType]}${dieType}`,
  );
  return parts.length > 0 ? parts.join(" + ") : "0d";
};
// #endregion

// #region Component
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

  const [isTrayExpanded, setIsTrayExpanded] = useState(true);

  const handleDieClick = (type: (typeof DIE_TYPES)[number]) => {
    const current = selectedDiceCounts[type];
    if (current < MAX_DICE_PER_TYPE) {
      setDieCount(type, current + 1);
    }
  };

  const handleDieDecrement = (
    e: React.MouseEvent,
    type: (typeof DIE_TYPES)[number],
  ) => {
    e.stopPropagation();
    const current = selectedDiceCounts[type];
    if (current > 0) {
      setDieCount(type, current - 1);
    }
  };

  const handleDieClear = (
    e: React.MouseEvent,
    type: (typeof DIE_TYPES)[number],
  ) => {
    e.preventDefault();
    setDieCount(type, 0);
  };

  return (
    <div className="ui-container">
      {/* Drawer and Roll Area */}
      <div className="dice-tray-wrapper">
        {isTrayExpanded ? (
          <div className="drawer-expanded">
            {/* Close Drawer Button */}
            <button
              className="drawer-close-btn"
              onClick={() => setIsTrayExpanded(false)}
              aria-label="Close dice tray"
            >
              &#10095;
            </button>

            {/* Dice Selection */}
            <div className="drawer-dice-scroll">
              {DIE_TYPES.map((dieType) => {
                const count = selectedDiceCounts[dieType];

                return (
                  <div
                    key={dieType}
                    className="die-btn-wrapper"
                    onClick={() => handleDieClick(dieType)}
                    onContextMenu={(e) => handleDieClear(e, dieType)}
                    role="button"
                    title={`Right-click to clear ${dieType}s`}
                  >
                    <DieSilhouette type={dieType} />
                    <span className="die-label">{dieType}</span>

                    {count > 0 && (
                      <button
                        className="die-badge"
                        onClick={(e) => handleDieDecrement(e, dieType)}
                        title="Click to remove one"
                      >
                        <span className="badge-count">{count}</span>
                        <span className="badge-minus">-</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Action Button */}
        {!isTrayExpanded ? (
          <button
            className="tray-toggle-btn"
            onClick={() => setIsTrayExpanded(true)}
          >
            Open Dice Tray
          </button>
        ) : (
          <button
            className="roll-btn"
            onClick={rollDice}
            disabled={isRolling || diceCount === 0}
          >
            {isRolling ? "Rolling..." : `Roll ${label}`}
          </button>
        )}
      </div>
    </div>
  );
};
// #endregion
