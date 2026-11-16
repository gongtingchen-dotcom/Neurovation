/** Wilson score interval for a binomial proportion. */
export function wilson(successes: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1];
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

export interface ThresholdPoint {
  threshold: number;
  flagged: number;
  tp: number;
  fp: number;
  fn: number;
  recall: number;
  precision: number;
  /** Share of charts a human still has to open. */
  workload: number;
}

/** Sweep a decision threshold over scores; `labels[i]` is ground-truth eligibility. */
export function sweep(scores: number[], labels: boolean[], thresholds: number[]): ThresholdPoint[] {
  const positives = labels.filter(Boolean).length;
  return thresholds.map((t) => {
    let tp = 0, fp = 0;
    scores.forEach((s, i) => {
      if (s >= t && s > 0) { if (labels[i]) tp++; else fp++; }
    });
    const flagged = tp + fp;
    return {
      threshold: t,
      flagged,
      tp,
      fp,
      fn: positives - tp,
      recall: positives ? tp / positives : 0,
      precision: flagged ? tp / flagged : 0,
      workload: scores.length ? flagged / scores.length : 0,
    };
  });
}

/** Area under the precision–recall curve via step interpolation (average precision). */
export function averagePrecision(scores: number[], labels: boolean[]): number {
  const idx = scores.map((s, i) => [s, labels[i]] as const).sort((a, b) => b[0] - a[0]);
  const P = labels.filter(Boolean).length;
  let tp = 0, ap = 0;
  idx.forEach(([, y], k) => {
    if (y) { tp++; ap += tp / (k + 1); }
  });
  return P ? ap / P : 0;
}
