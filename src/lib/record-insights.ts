type ActionableRecord = {
  status: "open" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
};

export function getTodayInBuenosAires(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getPendingRecords<T extends Pick<ActionableRecord, "status">>(records: T[]): T[] {
  return records.filter((record) => record.status === "open" || record.status === "in_progress");
}

export function getOverdueRecords<T extends ActionableRecord>(records: T[], today: string): T[] {
  return records.filter(
    (record) =>
      record.due_date !== null &&
      record.due_date < today &&
      record.status !== "completed" &&
      record.status !== "cancelled",
  );
}

export function serializeCsv(rows: readonly (readonly unknown[])[]): string {
  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

function escapeCsvCell(value: unknown): string {
  const text = String(value ?? "");
  const safeText = typeof value === "string" && /^[\t\r ]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}
/** Calculates completion rate: completed / (total - cancelled) * 100.
 *  - Excludes cancelled records from the denominator.
 *  - Returns null when denominator is zero (empty dataset or all cancelled).
 *  - Handles division by zero safely.
 */
export function getCompletionRate(
  records: { status: "open" | "in_progress" | "completed" | "cancelled" }[],
): number | null {
  const total = records.length;
  const cancelled = records.filter((r) => r.status === "cancelled").length;
  const completed = records.filter((r) => r.status === "completed").length;

  const denominator = total - cancelled;

  if (denominator === 0) {
    return null;
  }

  return (completed / denominator) * 100;
}

/** Groups operational records by module_slug and computes stats.
 *  - Handles null amounts as zero.
 *  - Handles modules without records (not included in result).
 *  - Returns { total, count, average } per module.
 */
export function getOperationalAmountBreakdown(
  records: { module_slug: string; amount: number | null }[],
): Record<string, { total: number; count: number; average: number }> {
  const breakdown: Record<string, { total: number; count: number }> = {};

  for (const record of records) {
    const moduleSlug = record.module_slug;
    if (!breakdown[moduleSlug]) {
      breakdown[moduleSlug] = { total: 0, count: 0 };
    }
    breakdown[moduleSlug].total += record.amount ?? 0;
    breakdown[moduleSlug].count += 1;
  }

  const result: Record<string, { total: number; count: number; average: number }> = {};
  for (const [moduleSlug, data] of Object.entries(breakdown)) {
    result[moduleSlug] = {
      total: data.total,
      count: data.count,
      average: data.count > 0 ? data.total / data.count : 0,
    };
  }

  return result;
}
