import { create } from "zustand";

export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20";

export type RollResult = {
  dieType: DieType;
  value: number;
};

interface DiceState {
  rollHistory: RollResult[];
  selectedDieType: DieType;
  glbContractIssue: string | null;
  isRolling: boolean;
  triggerRoll: number;
  skipAnimation: boolean;
  addRollResult: (result: RollResult) => void;
  rollDice: () => void;
  setSelectedDieType: (dieType: DieType) => void;
  setGlbContractIssue: (issue: string | null) => void;
  setSkipAnimation: (skip: boolean) => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  rollHistory: [],
  selectedDieType: "d6",
  glbContractIssue: null,
  isRolling: false,
  triggerRoll: 0,
  skipAnimation: false,
  addRollResult: (result) => {
    set((state) => ({
      rollHistory: [result, ...state.rollHistory],
      isRolling: false,
    }));
  },
  rollDice: () => {
    set((state) => ({
      triggerRoll: state.triggerRoll + 1,
      isRolling: true,
    }));
  },
  setSelectedDieType: (selectedDieType) => {
    set({ selectedDieType });
  },
  setGlbContractIssue: (glbContractIssue) => {
    set({ glbContractIssue });
  },
  setSkipAnimation: (skip) => {
    set({ skipAnimation: skip });
  },
}));
