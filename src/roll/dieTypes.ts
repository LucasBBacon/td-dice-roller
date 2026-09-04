// #region Dice Domain Types And Constants
export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];

// Cap is per pool node, so an AST may hold several pools of the same die type.
export const MAX_DICE_PER_POOL = 10;

export type DiceCountMap = Record<DieType, number>;
// #endregion
