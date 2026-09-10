'use client';

import { create } from 'zustand';
import type { DeviceType, IssueId, ServiceTier } from '@/config/services';

export type WizardStep = 0 | 1 | 2 | 3 | 4;

interface QuoteState {
  step: WizardStep;
  device: DeviceType | null;
  issues: IssueId[];
  /** Falla que el cliente escribió a mano ("otro motivo"). */
  otherIssue: string;
  tier: ServiceTier | null;
  homePickup: boolean;
  date: string | null;
  timeSlot: string | null;

  setDevice: (device: DeviceType) => void;
  toggleIssue: (issue: IssueId) => void;
  setOtherIssue: (text: string) => void;
  setTier: (tier: ServiceTier) => void;
  setHomePickup: (value: boolean) => void;
  setSchedule: (date: string, timeSlot: string) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const initial = {
  step: 0 as WizardStep,
  device: null,
  issues: [] as IssueId[],
  otherIssue: '',
  tier: null,
  homePickup: false,
  date: null,
  timeSlot: null,
};

export const useQuote = create<QuoteState>((set) => ({
  ...initial,

  setDevice: (device) => set({ device }),
  toggleIssue: (issue) =>
    set((s) => ({
      issues: s.issues.includes(issue)
        ? s.issues.filter((i) => i !== issue)
        : [...s.issues, issue],
    })),
  setOtherIssue: (otherIssue) => set({ otherIssue }),
  setTier: (tier) => set({ tier }),
  setHomePickup: (homePickup) => set({ homePickup }),
  setSchedule: (date, timeSlot) => set({ date, timeSlot }),

  next: () => set((s) => ({ step: Math.min(s.step + 1, 4) as WizardStep })),
  back: () => set((s) => ({ step: Math.max(s.step - 1, 0) as WizardStep })),
  reset: () => set(initial),
}));

// El estimado NO se calcula con un selector de Zustand: `estimateQuote`
// devuelve un objeto nuevo en cada llamada y en Zustand v5 eso dispara un
// bucle infinito de renders (la comparación es `Object.is`). Se calcula en
// el componente con `useMemo` sobre los campos primitivos. Ver quote-wizard.tsx.
