// #region Imports
import { create } from "zustand";
// #endregion

// #region Dice Domain Types And Constants
export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];
export const MAX_DICE_PER_TYPE = 10;

export type DiceCountMap = Record<DieType, number>;
// #endregion

// #region Pure Helpers
const clampDieCount = (value: number) =>
  Math.max(0, Math.min(MAX_DICE_PER_TYPE, Math.floor(value)));

const normalizeDiceCounts = (counts: DiceCountMap): DiceCountMap => ({
  d4: clampDieCount(counts.d4),
  d6: clampDieCount(counts.d6),
  d8: clampDieCount(counts.d8),
  d10: clampDieCount(counts.d10),
  d12: clampDieCount(counts.d12),
  d20: clampDieCount(counts.d20),
});

const totalDiceCount = (counts: DiceCountMap) =>
  DIE_TYPES.reduce((acc, dieType) => acc + counts[dieType], 0);

const formatDiceNotation = (counts: DiceCountMap) => {
  const parts = DIE_TYPES.filter((dieType) => counts[dieType] > 0).map(
    (dieType) => `${counts[dieType]}${dieType}`,
  );

  return parts.length > 0 ? parts.join(" + ") : "0d";
};

const buildDiceInstances = (counts: DiceCountMap, rollId: number): RollDieInstance[] => {
  const dice: RollDieInstance[] = [];

  DIE_TYPES.forEach((dieType) => {
    for (let index = 0; index < counts[dieType]; index += 1) {
      dice.push({
        id: `${rollId}-${dieType}-${index}`,
        dieType,
        index,
        rollId,
      });
    }
  });

  return dice;
};
// #endregion

// #region Roll State Types
export type RollResult = {
  dieType: DieType;
  value: number;
};

export type RollDieInstance = {
  id: string;
  dieType: DieType;
  index: number;
  rollId: number;
};

export type RollBatchHistory = {
  rollId: number;
  notation: string;
  total: number;
  results: RollResult[];
};

export type RollPhase = "idle" | "spawning" | "rolling";
// #endregion

// #region Store Contract
interface DiceState {
  rollHistory: RollBatchHistory[];
  selectedDiceCounts: DiceCountMap;
  activeDice: RollDieInstance[];
  previousSceneDiceSnapshot: RollDieInstance[];
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
  currentRollResults: RollResult[];
  addRollResult: (rollId: number, result: RollResult) => void;
  rollDice: () => void;
  setDieCount: (dieType: DieType, count: number) => void;
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
  activeDice: [],
  previousSceneDiceSnapshot: [],
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
  currentRollResults: [],
  addRollResult: (rollId, result) => {
    set((state) => {
      if (!state.isRolling || state.activeRollId !== rollId) {
        return {};
      }

      const nextResults = [...state.currentRollResults, result];
      const nextResolvedCount = state.resolvedDiceCount + 1;

      if (nextResolvedCount < state.expectedDiceCount) {
        return {
          currentRollResults: nextResults,
          resolvedDiceCount: nextResolvedCount,
        };
      }

      const resultCounts = nextResults.reduce<DiceCountMap>(
        (acc, roll) => {
          acc[roll.dieType] += 1;
          return acc;
        },
        {
          d4: 0,
          d6: 0,
          d8: 0,
          d10: 0,
          d12: 0,
          d20: 0,
        },
      );

      const total = nextResults.reduce((acc, roll) => acc + roll.value, 0);
      const completedBatch: RollBatchHistory = {
        rollId,
        notation: formatDiceNotation(resultCounts),
        total,
        results: nextResults,
      };

      return {
        rollHistory: [completedBatch, ...state.rollHistory],
        currentRollResults: [],
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
    set((state) => ({
      ...(totalDiceCount(state.selectedDiceCounts) === 0 || state.isRolling
        ? {}
        : (() => {
            const normalizedCounts = normalizeDiceCounts(state.selectedDiceCounts);
            const nextTriggerRoll = state.triggerRoll + 1;
            const nextRollId = nextTriggerRoll;
            const nextActiveDice = buildDiceInstances(normalizedCounts, nextRollId);

            return {
              selectedDiceCounts: normalizedCounts,
              triggerRoll: nextTriggerRoll,
              triggerLaunch: state.triggerLaunch,
              activeRollId: nextRollId,
              activeDice: nextActiveDice,
              previousSceneDiceSnapshot: state.activeDice,
              expectedDiceCount: totalDiceCount(normalizedCounts),
              readyDiceCount: 0,
              readyRetryCount: 0,
              readyDieIds: [],
              resolvedDiceCount: 0,
              currentRollResults: [],
              rollPhase: "spawning",
              isRolling: true,
            };
          })()),
    }));
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
        currentRollResults: [],
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
