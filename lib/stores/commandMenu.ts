import { create } from "zustand";

/**
 * Global open-state for the ⌘K command palette. Kept in a tiny store so the
 * sidebar button, the top-bar search trigger, and the global keyboard shortcut
 * can all drive the same palette without prop-drilling.
 */
interface CommandMenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandMenu = create<CommandMenuState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
