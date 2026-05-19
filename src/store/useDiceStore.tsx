import { create } from "zustand";

interface DiceState {
  rollCount: number;
  triggerRoll: () => void;
  result: number | null;
  setResult: (val: number | null) => void;
}

export const useDiceStore = create<DiceState>((set) => ({
  rollCount: 0,
  triggerRoll: () =>
    set((state) => ({ rollCount: state.rollCount + 1, result: null })),
  result: null,
  setResult: (val) => set({ result: val }),
}));
