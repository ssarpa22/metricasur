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
