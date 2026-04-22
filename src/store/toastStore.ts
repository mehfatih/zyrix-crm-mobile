/**
 * Global toast store — Zustand. Screens push toasts via `useToast()`;
 * the root-level `<Toast />` component subscribes and renders them.
 * Keeping the store separate means hooks outside the render tree
 * (e.g. API error handlers) can still surface feedback.
 */

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  createdAt: number;
  durationMs: number;
}

export interface ShowToastInput {
  variant?: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastStoreState {
  toasts: ToastItem[];
  show: (input: ShowToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 3000;

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  show: ({ variant = 'info', title, description, durationMs }) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const toast: ToastItem = {
      id,
      variant,
      title,
      description,
      createdAt: Date.now(),
      durationMs: durationMs ?? DEFAULT_DURATION,
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
