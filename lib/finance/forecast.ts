/**
 * Revenue forecasting (spec Module 9). This is a statistics problem solved with
 * real math in code — a trailing moving average with a month-over-year seasonal
 * adjustment — NOT an LLM "prediction". Claude is used elsewhere only to narrate
 * the result.
 */

export interface MonthlyPoint {
  /** "YYYY-MM" */
  month: string;
  revenue: number;
}

export interface Forecast {
  history: MonthlyPoint[];
  nextMonth: string;
  projectedRevenue: number;
  /** Month-over-month change of the most recent actual vs the prior month. */
  momChangePct: number | null;
  /** Whether a year-ago data point was available to apply a seasonal factor. */
  seasonalApplied: boolean;
}

/** "YYYY-MM" of the month after the given one. */
function nextMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString().slice(0, 7);
}

/**
 * Project next month's revenue from a monthly revenue series.
 *   base    = mean of the last 3 actual months (trailing moving average)
 *   seasonal = (same month last year) ÷ (its own trailing average), if available
 *   forecast = base × seasonal
 */
export function forecastRevenue(history: MonthlyPoint[]): Forecast | null {
  if (history.length === 0) return null;
  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
  const byMonth = new Map(sorted.map((p) => [p.month, p.revenue]));

  const last = sorted[sorted.length - 1];
  const nextMonth = nextMonthKey(last.month);

  // Trailing 3-month moving average as the base.
  const recent = sorted.slice(-3);
  const base = recent.reduce((s, p) => s + p.revenue, 0) / recent.length;

  // Seasonal factor from the same calendar month a year ago, if we have it.
  const targetMonthNum = Number(nextMonth.split("-")[1]);
  const yearAgoKey = `${Number(nextMonth.split("-")[0]) - 1}-${String(targetMonthNum).padStart(2, "0")}`;
  let seasonal = 1;
  let seasonalApplied = false;
  if (byMonth.has(yearAgoKey)) {
    // Compare the year-ago month against the average of the whole series.
    const seriesAvg = sorted.reduce((s, p) => s + p.revenue, 0) / sorted.length;
    if (seriesAvg > 0) {
      const factor = (byMonth.get(yearAgoKey) as number) / seriesAvg;
      // Clamp so a single noisy month can't wildly swing the forecast.
      seasonal = Math.min(1.5, Math.max(0.5, factor));
      seasonalApplied = true;
    }
  }

  const projectedRevenue = Math.round(base * seasonal);

  let momChangePct: number | null = null;
  if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2].revenue;
    if (prev > 0) momChangePct = Math.round(((last.revenue - prev) / prev) * 100);
  }

  return {
    history: sorted,
    nextMonth,
    projectedRevenue,
    momChangePct,
    seasonalApplied,
  };
}
