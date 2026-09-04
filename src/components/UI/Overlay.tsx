// #region Imports
import "./Overlay.css";
import { buildDieGroup, type MechanicMap, type RollMechanic } from "../../roll/astBuilders";
import { DIE_TYPES, MAX_DICE_PER_POOL, type DieType } from "../../roll/dieTypes";
import { formatAstNotation } from "../../roll/notation";
import { useDiceStore } from "../../store/useDiceStore";
import { useState } from "react";
import { DieSilhouette } from "./DieSilhouette";
import { RollHistoryLog } from "./RollHistoryLog";
// #endregion

// #region Derived UI Helpers
const MECHANIC_OPTIONS: Array<{ value: RollMechanic; label: string }> = [
  { value: "normal", label: "Normal" },
  { value: "advantage", label: "Adv" },
  { value: "disadvantage", label: "Dis" },
];

const MECHANIC_GLYPHS: Record<RollMechanic, string | null> = {
  normal: null,
  advantage: "A",
  disadvantage: "D",
};

const totalSelectedDice = (counts: Record<DieType, number>) =>
  DIE_TYPES.reduce((total, dieType) => total + counts[dieType], 0);

// Built from the same nodes the roll will use, so a clamped pool is shown honestly.
const groupNotation = (
  dieType: DieType,
  count: number,
  mechanic: RollMechanic,
) => formatAstNotation(buildDieGroup(dieType, count, mechanic));

const selectionLabel = (counts: Record<DieType, number>, mechanics: MechanicMap) => {
  const parts = DIE_TYPES.filter((dieType) => counts[dieType] > 0).map((dieType) =>
    groupNotation(dieType, counts[dieType], mechanics[dieType]),
  );

  return parts.length > 0 ? parts.join(" + ") : "0d";
};
// #endregion

// #region Component
export const Overlay = () => {
  const {
    rollDice,
    selectedDiceCounts,
    setDieCount,
    dieMechanics,
    setDieMechanic,
    isRolling,
  } = useDiceStore();

  const diceCount = totalSelectedDice(selectedDiceCounts);
  const label = selectionLabel(selectedDiceCounts, dieMechanics);

  const [isTrayExpanded, setIsTrayExpanded] = useState(true);
  const [isMechanicsOpen, setIsMechanicsOpen] = useState(false);
  const mechanicTypes = DIE_TYPES.filter((dieType) => selectedDiceCounts[dieType] > 0);

  const handleDieClick = (type: DieType) => {
    const current = selectedDiceCounts[type];
    if (current < MAX_DICE_PER_POOL) {
      setDieCount(type, current + 1);
    }
  };

  const handleDieDecrement = (e: React.MouseEvent, type: DieType) => {
    e.stopPropagation();
    const current = selectedDiceCounts[type];
    if (current > 0) {
      setDieCount(type, current - 1);
    }
  };

  const handleDieClear = (e: React.MouseEvent, type: DieType) => {
    e.preventDefault();
    setDieCount(type, 0);
  };

  return (
    <div className="ui-container">
      {/* Drawer and Roll Area */}
      <div className="dice-tray-wrapper">
        {/* Mechanics Panel */}
        {isTrayExpanded && isMechanicsOpen ? (
          <div className="mechanics-panel" aria-label="Roll mechanics">
            {mechanicTypes.length === 0 ? (
              <p className="mechanics-empty">Select dice to set a mechanic.</p>
            ) : (
              mechanicTypes.map((dieType) => {
                const count = selectedDiceCounts[dieType];
                const mechanic = dieMechanics[dieType];

                return (
                  <div key={dieType} className="mechanics-row">
                    <span className="mechanics-die">
                      {count}
                      {dieType}
                    </span>

                    <div className="mechanics-options" role="group">
                      {MECHANIC_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          className="mechanics-option"
                          aria-pressed={mechanic === option.value}
                          onClick={() => setDieMechanic(dieType, option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <span className="mechanics-preview">
                      {groupNotation(dieType, count, mechanic)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        ) : null}

        {isTrayExpanded ? (
          <div className="drawer-expanded">
            {/* Drawer Side Actions */}
            <div className="drawer-side-actions">
              <button
                className="drawer-close-btn"
                onClick={() => setIsTrayExpanded(false)}
                aria-label="Close dice tray"
              >
                &#10095;
              </button>
              <button
                className="drawer-mechanics-btn"
                onClick={() => setIsMechanicsOpen((open) => !open)}
                aria-expanded={isMechanicsOpen}
                aria-label="Toggle roll mechanics"
                title="Roll mechanics"
              >
                &#177;
              </button>
            </div>

            {/* Dice Selection */}
            <div className="drawer-dice-scroll">
              {DIE_TYPES.map((dieType) => {
                const count = selectedDiceCounts[dieType];
                const glyph = MECHANIC_GLYPHS[dieMechanics[dieType]];

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

                    {count > 0 && glyph ? (
                      <span className="die-mechanic-glyph">{glyph}</span>
                    ) : null}

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

        <div className="action-stack">
          <RollHistoryLog />

          {/* Action Button */}
          {!isTrayExpanded ? (
            <button
              className="tray-toggle-btn"
              onClick={() => setIsTrayExpanded(true)}
            >
              Dice
            </button>
          ) : (
            <button
              className="roll-btn"
              onClick={rollDice}
              disabled={isRolling || diceCount === 0}
              title={isRolling ? "Rolling..." : `Roll ${label}`}
            >
              {isRolling ? "Rolling..." : `Roll`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// #endregion
