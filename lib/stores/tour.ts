import { create } from "zustand";

/**
 * Open-state for the first-run product tour. Auto-opens once for new users
 * (gated on a localStorage flag inside the component) and can be re-opened any
 * time from the user menu's "Take the tour" item.
 */
interface TourState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useTour = create<TourState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
