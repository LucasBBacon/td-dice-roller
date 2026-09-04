// #region Imports
import type { RollNode } from "./astTypes";
import type { DieType } from "./dieTypes";
// #endregion

// #region Types
export type PlannedDie = {
  id: string;
  dieType: DieType;
  index: number;
  rollId: number;
  nodeId: string;
};
// #endregion

// #region Planner
// Planning is separate from evaluation because physics reports face values asynchronously.
export const planRoll = (root: RollNode, rollId: number): PlannedDie[] => {
  const dice: PlannedDie[] = [];

  const visit = (node: RollNode) => {
    switch (node.kind) {
      case "pool":
        for (let i = 0; i < node.count; i += 1) {
          dice.push({
            id: `${rollId}-${node.id}-${i}`,
            dieType: node.dieType,
            index: dice.length,
            rollId,
            nodeId: node.id,
          });
        }
        break;
      case "keepDrop":
        visit(node.child);
        break;
      case "sum":
        node.children.forEach(visit);
        break;
    }
  };

  visit(root);

  return dice;
};
// #endregion
