/**
 * useToast — ergonomic helper over the toast store. Returns `show`
 * plus per-variant convenience methods so call sites read like:
 *   const toast = useToast();
 *   toast.success('Saved');
 */

import { useMemo } from 'react';

import {
  useToastStore,
  type ShowToastInput,
  type ToastVariant,
} from '../store/toastStore';

export interface UseToastApi {
  show: (input: ShowToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const buildVariant =
  (show: (i: ShowToastInput) => string, variant: ToastVariant) =>
  (title: string, description?: string) =>
    show({ variant, title, description });

export const useToast = (): UseToastApi => {
  const show = useToastStore((s) => s.show);
  const dismiss = useToastStore((s) => s.dismiss);

  return useMemo(
    () => ({
      show,
      success: buildVariant(show, 'success'),
      error: buildVariant(show, 'error'),
      info: buildVariant(show, 'info'),
      warning: buildVariant(show, 'warning'),
      dismiss,
    }),
    [show, dismiss]
  );
};
