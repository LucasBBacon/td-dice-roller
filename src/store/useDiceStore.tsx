// #region Imports
import { create } from "zustand";
import type { RollNode } from "../roll/astTypes";
import {
  buildRollAst,
  clampPoolCount,
  DEFAULT_MECHANICS,
  type MechanicMap,
  type RollMechanic,
} from "../roll/astBuilders";
import {
  collectDroppedDieIds,
  evaluateRoll,
  type NodeEval,
} from "../roll/evaluator";
import { formatAstNotation } from "../roll/notation";
import { planRoll, type PlannedDie } from "../roll/planner";
import type { DiceCountMap, DieType } from "../roll/dieTypes";
// #endregion

// #region Dice Domain Re-exports
export type { DiceCountMap, DieType };
// #endregion

// #region Pure Helpers
const normalizeDiceCounts = (counts: DiceCountMap): DiceCountMap => ({
  d4: clampPoolCount(counts.d4),
  d6: clampPoolCount(counts.d6),
  d8: clampPoolCount(counts.d8),
  d10: clampPoolCount(counts.d10),
  d12: clampPoolCount(counts.d12),
  d20: clampPoolCount(counts.d20),
});
// #endregion

// #region Roll State Types
export type RollDieInstance = PlannedDie;

export type RollBatchHistory = {
  rollId: number;
  notation: string;
  total: number;
  evaluation: NodeEval;
};

export type RollPhase = "idle" | "spawning" | "rolling";
// #endregion

// #region Store Contract
interface DiceState {
  rollHistory: RollBatchHistory[];
  selectedDiceCounts: DiceCountMap;
  dieMechanics: MechanicMap;
  rollAst: RollNode | null;
  activeDice: RollDieInstance[];
  previousSceneDiceSnapshot: RollDieInstance[];
  droppedDieIds: string[];
  glbContractIssue: string | null;
  isRolling: boolean;
  rollPhase: RollPhase;
  triggerRoll: number;
  triggerLaunch: number;
  skipAnimation: boolean;
  activeRollId: number;
  expectedDiceCount: number;
  readyDiceCount: number;
  readyRetryCount: number;
  readyDieIds: string[];
  resolvedDiceCount: number;
  currentRollValues: Record<string, number>;
  addRollResult: (rollId: number, dieId: string, value: number) => void;
  rollDice: () => void;
  setDieCount: (dieType: DieType, count: number) => void;
  setDieMechanic: (dieType: DieType, mechanic: RollMechanic) => void;
  registerDieReady: (rollId: number, dieId: string) => void;
  retrySpawnReadiness: (rollId: number) => void;
  beginRollLaunch: (rollId: number) => void;
  abortRoll: (rollId: number) => void;
  setGlbContractIssue: (issue: string | null) => void;
  setSkipAnimation: (skip: boolean) => void;
}
// #endregion

// #region Store Implementation
export const useDiceStore = create<DiceState>((set) => ({
  rollHistory: [],
  selectedDiceCounts: {
    d4: 0,
    d6: 1,
    d8: 0,
    d10: 0,
    d12: 0,
    d20: 0,
  },
  dieMechanics: DEFAULT_MECHANICS,
  activeDice: [],
  previousSceneDiceSnapshot: [],
  rollAst: null,
  droppedDieIds: [],
  glbContractIssue: null,
  isRolling: false,
  rollPhase: "idle",
  triggerRoll: 0,
  triggerLaunch: 0,
  skipAnimation: false,
  activeRollId: 0,
  expectedDiceCount: 0,
  readyDiceCount: 0,
  readyRetryCount: 0,
  readyDieIds: [],
  resolvedDiceCount: 0,
  currentRollValues: {},
  addRollResult: (rollId, dieId, value) => {
    set((state) => {
      if (
        !state.isRolling ||
        state.activeRollId !== rollId ||
        state.rollAst === null ||
        dieId in state.currentRollValues
      ) {
        return {};
      }

      const nextValues = { ...state.currentRollValues, [dieId]: value };
      const nextResolvedCount = state.resolvedDiceCount + 1;

      if (nextResolvedCount < state.expectedDiceCount) {
        return {
          currentRollValues: nextValues,
          resolvedDiceCount: nextResolvedCount,
        };
      }

      const evaluation = evaluateRoll(state.rollAst, state.activeDice, nextValues);
      const completedBatch: RollBatchHistory = {
        rollId,
        notation: formatAstNotation(state.rollAst),
        total: evaluation.total,
        evaluation,
      };

      return {
        rollHistory: [completedBatch, ...state.rollHistory],
        droppedDieIds: collectDroppedDieIds(evaluation),
        currentRollValues: {},
        resolvedDiceCount: 0,
        expectedDiceCount: 0,
        readyDiceCount: 0,
        readyRetryCount: 0,
        readyDieIds: [],
        previousSceneDiceSnapshot: [],
        rollPhase: "idle",
        isRolling: false,
      };
    });
  },
  rollDice: () => {
    set((state) => {
      if (state.isRolling) {
        return {};
      }

      const normalizedCounts = normalizeDiceCounts(state.selectedDiceCounts);
      const rollAst = buildRollAst(normalizedCounts, state.dieMechanics);

      if (rollAst === null) {
        return {};
      }

      const nextTriggerRoll = state.triggerRoll + 1;
      const nextRollId = nextTriggerRoll;
      const nextActiveDice = planRoll(rollAst, nextRollId);

      return {
        selectedDiceCounts: normalizedCounts,
        rollAst,
        triggerRoll: nextTriggerRoll,
        activeRollId: nextRollId,
        activeDice: nextActiveDice,
        previousSceneDiceSnapshot: state.activeDice,
        droppedDieIds: [],
        expectedDiceCount: nextActiveDice.length,
        readyDiceCount: 0,
        readyRetryCount: 0,
        readyDieIds: [],
        resolvedDiceCount: 0,
        currentRollValues: {},
        rollPhase: "spawning",
        isRolling: true,
      };
    });
  },
  setDieCount: (dieType, count) => {
    set((state) => {
      const nextCounts = normalizeDiceCounts({
        ...state.selectedDiceCounts,
        [dieType]: count,
      });

      return {
        selectedDiceCounts: nextCounts,
      };
    });
  },
  setDieMechanic: (dieType, mechanic) => {
    set((state) => ({
      dieMechanics: {
        ...state.dieMechanics,
        [dieType]: mechanic,
      },
    }));
  },
  registerDieReady: (rollId, dieId) => {
    set((state) => {
      if (
        !state.isRolling ||
        state.rollPhase !== "spawning" ||
        state.activeRollId !== rollId ||
        state.readyDieIds.includes(dieId)
      ) {
        return {};
      }

      const nextReadyDieIds = [...state.readyDieIds, dieId];

      return {
        readyDieIds: nextReadyDieIds,
        readyDiceCount: nextReadyDieIds.length,
      };
    });
  },
  retrySpawnReadiness: (rollId) => {
    set((state) => {
      if (
        !state.isRolling ||
        state.rollPhase !== "spawning" ||
        state.activeRollId !== rollId
      ) {
        return {};
      }

      return {
        readyRetryCount: state.readyRetryCount + 1,
      };
    });
  },
  beginRollLaunch: (rollId) => {
    set((state) => {
      if (
        !state.isRolling ||
        state.rollPhase !== "spawning" ||
        state.activeRollId !== rollId ||
        state.readyDiceCount < state.expectedDiceCount
      ) {
        return {};
      }

      return {
        rollPhase: "rolling",
        triggerLaunch: state.triggerLaunch + 1,
      };
    });
  },
  abortRoll: (rollId) => {
    set((state) => {
      if (!state.isRolling || state.activeRollId !== rollId) {
        return {};
      }

      return {
        isRolling: false,
        rollPhase: "idle",
        activeDice: state.previousSceneDiceSnapshot,
        previousSceneDiceSnapshot: [],
        expectedDiceCount: 0,
        resolvedDiceCount: 0,
        currentRollValues: {},
        readyDiceCount: 0,
        readyRetryCount: 0,
        readyDieIds: [],
      };
    });
  },
  setGlbContractIssue: (glbContractIssue) => {
    set({ glbContractIssue });
  },
  setSkipAnimation: (skip) => {
    set({ skipAnimation: skip });
  },
}));
// #endregion
