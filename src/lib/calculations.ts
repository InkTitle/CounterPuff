import { CURRENCIES, TOBACCO_PRODUCTS } from "./constants";

export type ProductUsage = {
  productType: string;
  quantityPerDay: number | null;
  packSize: number | null;
  pricePerPack: number | null;
  monthlySpend: number | null;
  isEstimate?: boolean;
};

export type DailyLogLike = {
  logDate: string;
  smokeFree: boolean;
  lapse: boolean;
  amountSpent: number | null;
  quantityUsed: number | null;
};

export function dailyCost(p: ProductUsage): number {
  if (
    p.quantityPerDay != null &&
    p.packSize != null &&
    p.packSize > 0 &&
    p.pricePerPack != null &&
    p.pricePerPack > 0
  ) {
    return (p.quantityPerDay / p.packSize) * p.pricePerPack;
  }
  if (p.monthlySpend != null && p.monthlySpend > 0) {
    return p.monthlySpend / 30;
  }
  return 0;
}

export function combinedDailyCost(products: ProductUsage[]): number {
  return products.reduce((sum, p) => sum + dailyCost(p), 0);
}

export function cigarettesPerDayEquivalent(products: ProductUsage[]): number {
  return products.reduce((sum, p) => {
    if (p.productType === "cigarettes" || p.productType === "bidis") {
      return sum + (p.quantityPerDay ?? 0);
    }
    return sum;
  }, 0);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function eachDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (cur <= end) {
    days.push(dateKey(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

export function savingsForRange(opts: {
  products: ProductUsage[];
  logs: DailyLogLike[];
  quitDate: string | null;
  from: Date;
  to: Date;
}): { saved: number; daysCounted: number; daysWithLapse: number; estimated: boolean } {
  const usual = combinedDailyCost(opts.products);
  const logByDate = new Map<string, DailyLogLike[]>();
  for (const log of opts.logs) {
    const list = logByDate.get(log.logDate) ?? [];
    list.push(log);
    logByDate.set(log.logDate, list);
  }
  const quit = opts.quitDate ? new Date(opts.quitDate + "T00:00:00Z") : null;
  let saved = 0;
  let daysCounted = 0;
  let daysWithLapse = 0;
  const estimated = opts.products.some((p) => p.isEstimate !== false);

  for (const key of eachDay(opts.from, opts.to)) {
    const day = new Date(key + "T00:00:00Z");
    if (quit && day < quit) continue;
    if (!quit) continue;
    const logs = logByDate.get(key) ?? [];
    const hadLapse = logs.some((l) => l.lapse || !l.smokeFree);
    if (hadLapse) {
      daysWithLapse += 1;
      const spent = logs.reduce((s, l) => s + (l.amountSpent ?? 0), 0);
      saved += Math.max(0, usual - spent);
      daysCounted += 1;
    } else {
      saved += usual;
      daysCounted += 1;
    }
  }

  return { saved: roundMoney(saved), daysCounted, daysWithLapse, estimated };
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number, currency: string): string {
  const meta = CURRENCIES[currency];
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${meta?.symbol ?? currency} ${roundMoney(amount).toFixed(2)}`;
  }
}

export function environmentalEstimates(opts: {
  products: ProductUsage[];
  smokeFreeDays: number;
}): {
  cigaretteFiltersAvoided: number;
  filterMassGrams: number;
  disposableDevicesAvoided: number;
  assumptions: string[];
} {
  const cigs = cigarettesPerDayEquivalent(opts.products);
  const cigaretteFiltersAvoided = Math.round(cigs * opts.smokeFreeDays);
  const filterMassGrams = roundMoney(cigaretteFiltersAvoided * 0.17);
  const disposable = opts.products.find((p) => p.productType === "disposable_vapes");
  let disposableDevicesAvoided = 0;
  if (disposable && disposable.quantityPerDay && disposable.packSize && disposable.packSize > 0) {
    const devicesPerDay = disposable.quantityPerDay / disposable.packSize;
    disposableDevicesAvoided = roundMoney(devicesPerDay * opts.smokeFreeDays);
  }
  return {
    cigaretteFiltersAvoided,
    filterMassGrams,
    disposableDevicesAvoided,
    assumptions: [
      "Cigarette filter count assumes one filter per cigarette not smoked, based on the user's recorded daily quantity.",
      "Filter mass uses an approximate 0.17 g per cellulose-acetate filter published in environmental litter studies. This is an estimate, not a lab measurement.",
      "Disposable-device estimates use the user's pack/device size when provided. Chemical emissions are not calculated.",
    ],
  };
}

export function classifySupportTrack(products: ProductUsage[]): {
  track: "single-product" | "multiple-product" | "higher-support" | "observation";
  explanation: string;
} {
  const active = products.filter((p) => p.productType !== "none");
  if (active.length === 0) {
    return {
      track: "observation",
      explanation:
        "No current tobacco or nicotine products were selected. This track focuses on staying prepared and using the eBook tools if urges appear.",
    };
  }
  const highVolume = active.some((p) => (p.quantityPerDay ?? 0) >= 20 || (p.monthlySpend ?? 0) >= 200);
  if (active.length >= 3 || highVolume) {
    return {
      track: "higher-support",
      explanation:
        "Several products or higher reported intake were noted. This is a personalization label only — not a diagnosis of dependence. Extra SOS practice and clinician support are encouraged.",
    };
  }
  if (active.length >= 2) {
    return {
      track: "multiple-product",
      explanation:
        "More than one product was selected. Plans and savings are tracked separately per product and combined without double-counting shared costs.",
    };
  }
  return {
    track: "single-product",
    explanation: "A single product was selected, so missions and savings focus on that habit loop.",
  };
}

export function productLabel(id: string): string {
  return TOBACCO_PRODUCTS.find((p) => p.id === id)?.label ?? id;
}

export function smokeFreeStreak(logs: DailyLogLike[], quitDate: string | null, today = new Date()): number {
  if (!quitDate) return 0;
  const logByDate = new Map(logs.map((l) => [l.logDate, l]));
  let streak = 0;
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const quit = new Date(quitDate + "T00:00:00Z");
  while (cursor >= quit) {
    const key = dateKey(cursor);
    const log = logByDate.get(key);
    if (log && (log.lapse || !log.smokeFree)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function rangeFromFilter(filter: "daily" | "weekly" | "monthly" | "yearly", now = new Date()): { from: Date; to: Date } {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);
  if (filter === "daily") {
    return { from: to, to };
  }
  if (filter === "weekly") {
    from.setUTCDate(from.getUTCDate() - 6);
  } else if (filter === "monthly") {
    from.setUTCDate(from.getUTCDate() - 29);
  } else {
    from.setUTCDate(from.getUTCDate() - 364);
  }
  return { from, to };
}
