// #region Imports
import type { KeepDropMode, RollNode } from "./astTypes";
import type { DieType } from "./dieTypes";
import type { PlannedDie } from "./planner";
// #endregion

// #region Types
export type DieOutcome = {
  dieId: string;
  value: number;
  dropped: boolean;
};

export type PoolEval = {
  kind: "pool";
  nodeId: string;
  dieType: DieType;
  total: number;
  dice: DieOutcome[];
};

export type KeepDropEval = {
  kind: "keepDrop";
  nodeId: string;
  mode: KeepDropMode;
  n: number;
  total: number;
  child: NodeEval;
};

export type SumEval = {
  kind: "sum";
  nodeId: string;
  total: number;
  children: NodeEval[];
};

export type NodeEval = PoolEval | KeepDropEval | SumEval;
// #endregion

// #region Tree Walks
export const collectOutcomes = (node: NodeEval): DieOutcome[] => {
  switch (node.kind) {
    case "pool":
      return node.dice;
    case "keepDrop":
      return collectOutcomes(node.child);
    case "sum":
      return node.children.flatMap(collectOutcomes);
  }
};

export const collectDroppedDieIds = (node: NodeEval): string[] =>
  collectOutcomes(node)
    .filter((outcome) => outcome.dropped)
    .map((outcome) => outcome.dieId);

// Totals are refreshed after drops are stamped so ancestors see the surviving dice.
const refreshTotals = (node: NodeEval): number => {
  switch (node.kind) {
    case "pool":
      node.total = node.dice.reduce(
        (acc, outcome) => (outcome.dropped ? acc : acc + outcome.value),
        0,
      );
      return node.total;
    case "keepDrop":
      node.total = refreshTotals(node.child);
      return node.total;
    case "sum":
      node.total = node.children.reduce((acc, child) => acc + refreshTotals(child), 0);
      return node.total;
  }
};
// #endregion

// #region Keep/Drop Selection
const keptIndicesFor = (
  mode: KeepDropMode,
  n: number,
  outcomes: DieOutcome[],
): number[] => {
  const size = outcomes.length;
  const clamped = Math.max(0, Math.min(size, n));

  // Ascending by value, ties broken by plan order so results are reproducible.
  const ascending = outcomes
    .map((_, index) => index)
    .sort((a, b) => outcomes[a].value - outcomes[b].value || a - b);

  switch (mode) {
    case "kh":
      return ascending.slice(size - clamped);
    case "kl":
      return ascending.slice(0, clamped);
    case "dh":
      return ascending.slice(0, size - clamped);
    case "dl":
      return ascending.slice(clamped);
  }
};
// #endregion

// #region Evaluator
export const evaluateRoll = (
  root: RollNode,
  dice: PlannedDie[],
  valuesByDieId: Record<string, number>,
): NodeEval => {
  const diceByNodeId = new Map<string, PlannedDie[]>();

  dice.forEach((die) => {
    const bucket = diceByNodeId.get(die.nodeId);
    if (bucket) {
      bucket.push(die);
    } else {
      diceByNodeId.set(die.nodeId, [die]);
    }
  });

  const visit = (node: RollNode): NodeEval => {
    switch (node.kind) {
      case "pool":
        return {
          kind: "pool",
          nodeId: node.id,
          dieType: node.dieType,
          total: 0,
          dice: (diceByNodeId.get(node.id) ?? []).map((die) => ({
            dieId: die.id,
            value: valuesByDieId[die.id] ?? 0,
            dropped: false,
          })),
        };
      case "keepDrop": {
        const child = visit(node.child);
        const outcomes = collectOutcomes(child).filter((outcome) => !outcome.dropped);
        const kept = new Set(keptIndicesFor(node.mode, node.n, outcomes));

        outcomes.forEach((outcome, index) => {
          outcome.dropped = !kept.has(index);
        });

        return {
          kind: "keepDrop",
          nodeId: node.id,
          mode: node.mode,
          n: node.n,
          total: 0,
          child,
        };
      }
      case "sum":
        return {
          kind: "sum",
          nodeId: node.id,
          total: 0,
          children: node.children.map(visit),
        };
    }
  };

  const evaluation = visit(root);
  refreshTotals(evaluation);

  return evaluation;
};
// #endregion
