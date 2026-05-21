import { create } from "zustand";

interface DiceState {
  rollHistory: number[];
  isRolling: boolean;
  triggerRoll: number;
  skipAnimation: boolean;
  addRollResult: (value: number) => void;
  rollDice: () => void;
  setSkipAnimation: (skip: boolean) => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  rollHistory: [],
  isRolling: false,
  triggerRoll: 0,
  skipAnimation: false,
  addRollResult: (value) => {
    set((state) => ({
      rollHistory: [value, ...state.rollHistory],
      isRolling: false,
    }));
  },
  rollDice: () => {
    set((state) => ({
      triggerRoll: state.triggerRoll + 1,
      isRolling: true,
    }));
  },
  setSkipAnimation: (skip) => {
    set({ skipAnimation: skip });
  },
}));
