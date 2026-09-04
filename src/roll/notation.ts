// #region Imports
import type { RollNode } from "./astTypes";
// #endregion

// #region Notation
const needsParens = (node: RollNode) => node.kind === "sum" && node.children.length > 1;

export const formatAstNotation = (node: RollNode): string => {
  switch (node.kind) {
    case "pool":
      return `${node.count}${node.dieType}`;
    case "keepDrop": {
      const child = formatAstNotation(node.child);
      return `${needsParens(node.child) ? `(${child})` : child}${node.mode}${node.n}`;
    }
    case "sum":
      return node.children.length > 0
        ? node.children.map(formatAstNotation).join(" + ")
        : "0d";
  }
};
// #endregion
