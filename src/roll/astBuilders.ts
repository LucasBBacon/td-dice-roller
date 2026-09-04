// #region Imports
import type {
  KeepDropMode,
  KeepDropNode,
  PoolNode,
  RollNode,
  SumNode,
} from "./astTypes";
import {
  DIE_TYPES,
  MAX_DICE_PER_POOL,
  type DiceCountMap,
  type DieType,
} from "./dieTypes";
// #endregion

// #region Node Ids
let nodeSequence = 0;

// Node ids are embedded in die ids, so they must stay unique within a roll.
const nextNodeId = (kind: string) => {
  nodeSequence += 1;
  return `${kind}${nodeSequence}`;
};
// #endregion

// #region Builders
export const clampPoolCount = (count: number) =>
  Math.max(0, Math.min(MAX_DICE_PER_POOL, Math.floor(count)));

export const pool = (dieType: DieType, count: number, id?: string): PoolNode => ({
  kind: "pool",
  id: id ?? nextNodeId("pool"),
  dieType,
  count: clampPoolCount(count),
});

export const keepDrop = (
  mode: KeepDropMode,
  n: number,
  child: RollNode,
  id?: string,
): KeepDropNode => ({
  kind: "keepDrop",
  id: id ?? nextNodeId("keepDrop"),
  mode,
  n: Math.max(0, Math.floor(n)),
  child,
});

export const keepHighest = (n: number, child: RollNode, id?: string) =>
  keepDrop("kh", n, child, id);

export const keepLowest = (n: number, child: RollNode, id?: string) =>
  keepDrop("kl", n, child, id);

export const dropHighest = (n: number, child: RollNode, id?: string) =>
  keepDrop("dh", n, child, id);

export const dropLowest = (n: number, child: RollNode, id?: string) =>
  keepDrop("dl", n, child, id);

export const sum = (children: RollNode[], id?: string): SumNode => ({
  kind: "sum",
  id: id ?? nextNodeId("sum"),
  children,
});
// #endregion

// #region Selection To Ast
export type RollMechanic = "normal" | "advantage" | "disadvantage";

export type MechanicMap = Record<DieType, RollMechanic>;

export const DEFAULT_MECHANICS: MechanicMap = {
  d4: "normal",
  d6: "normal",
  d8: "normal",
  d10: "normal",
  d12: "normal",
  d20: "normal",
};

// Advantage/disadvantage double the pool and keep as many dice as were selected.
export const buildDieGroup = (
  dieType: DieType,
  count: number,
  mechanic: RollMechanic,
): RollNode => {
  if (mechanic === "normal") {
    return pool(dieType, count, `pool-${dieType}`);
  }

  const doubled = pool(dieType, count * 2, `pool-${dieType}`);
  // The pool cap can shrink the doubled count, so keep no more than it actually holds.
  const keepCount = Math.min(count, doubled.count);

  return mechanic === "advantage"
    ? keepHighest(keepCount, doubled, `keep-${dieType}`)
    : keepLowest(keepCount, doubled, `keep-${dieType}`);
};

export const buildRollAst = (
  counts: DiceCountMap,
  mechanics: MechanicMap,
): RollNode | null => {
  const groups = DIE_TYPES.filter(
    (dieType) => clampPoolCount(counts[dieType]) > 0,
  ).map((dieType) => buildDieGroup(dieType, counts[dieType], mechanics[dieType]));

  return groups.length > 0 ? sum(groups, "root") : null;
};
// #endregion
