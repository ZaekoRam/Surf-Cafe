import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const tones = {
  green: 'text-surf-green border-surf-green/30',
  yellow: 'text-surf-yellow border-surf-yellow/30',
  cyan: 'text-surf-cyan border-surf-cyan/30',
} as const;

/** Metrica del HUD: un dato grande, sin adornos. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'green',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <article className={cn('hud-panel flex items-start gap-4 p-5', tones[tone])}>
      <span className="clip-hud-sm border border-current/30 bg-current/10 p-2.5">
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-3xl font-black leading-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </article>
  );
}
