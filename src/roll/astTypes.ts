// #region Imports
import type { DieType } from "./dieTypes";
// #endregion

// #region Node Union
// Future kinds (explode, reroll, successCount, constant, binaryOp) slot in here.
export type KeepDropMode = "kh" | "kl" | "dh" | "dl";

export type PoolNode = {
  kind: "pool";
  id: string;
  dieType: DieType;
  count: number;
};

export type KeepDropNode = {
  kind: "keepDrop";
  id: string;
  mode: KeepDropMode;
  n: number;
  child: RollNode;
};

export type SumNode = {
  kind: "sum";
  id: string;
  children: RollNode[];
};

export type RollNode = PoolNode | KeepDropNode | SumNode;
// #endregion
