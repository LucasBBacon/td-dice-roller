import { create } from "zustand";

export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export const DIE_TYPES: DieType[] = ["d4", "d6", "d8", "d10", "d12", "d20"];
export const MAX_DICE_PER_TYPE = 10;

export type DiceCountMap = Record<DieType, number>;

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

interface DiceState {
  rollHistory: RollBatchHistory[];
  selectedDiceCounts: DiceCountMap;
  activeDice: RollDieInstance[];
  glbContractIssue: string | null;
  isRolling: boolean;
  triggerRoll: number;
  skipAnimation: boolean;
  activeRollId: number;
  expectedDiceCount: number;
  resolvedDiceCount: number;
  currentRollResults: RollResult[];
  addRollResult: (rollId: number, result: RollResult) => void;
  rollDice: () => void;
  setDieCount: (dieType: DieType, count: number) => void;
  setGlbContractIssue: (issue: string | null) => void;
  setSkipAnimation: (skip: boolean) => void;
}

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
  activeDice: [{ id: "0-d6-0", dieType: "d6", index: 0, rollId: 0 }],
  glbContractIssue: null,
  isRolling: false,
  triggerRoll: 0,
  skipAnimation: false,
  activeRollId: 0,
  expectedDiceCount: 0,
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

            return {
              selectedDiceCounts: normalizedCounts,
              triggerRoll: nextTriggerRoll,
              activeRollId: nextRollId,
              activeDice: buildDiceInstances(normalizedCounts, nextRollId),
              expectedDiceCount: totalDiceCount(normalizedCounts),
              resolvedDiceCount: 0,
              currentRollResults: [],
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
        ...(state.isRolling
          ? {}
          : {
              activeDice: buildDiceInstances(nextCounts, state.activeRollId),
            }),
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
