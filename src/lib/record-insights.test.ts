import { describe, expect, it } from "vitest";
import { getOverdueRecords, getPendingRecords, getTodayInBuenosAires, serializeCsv } from "./record-insights";

const records = [
  { id: "old", status: "open" as const, due_date: "2026-11-22" },
  { id: "today", status: "in_progress" as const, due_date: "2026-11-23" },
  { id: "done", status: "completed" as const, due_date: "2026-11-20" },
  { id: "cancelled", status: "cancelled" as const, due_date: "2026-11-20" },
  { id: "undated", status: "open" as const, due_date: null },
];

describe("record insights", () => {
  it("uses the Buenos Aires calendar date at UTC day boundaries", () => {
    expect(getTodayInBuenosAires(new Date("2026-11-23T02:30:00.000Z"))).toBe("2026-11-22");
    expect(getTodayInBuenosAires(new Date("2026-11-23T03:30:00.000Z"))).toBe("2026-11-23");
  });

  it("counts open and in-progress records as pending", () => {
    expect(getPendingRecords(records).map((record) => record.id)).toEqual(["old", "today", "undated"]);
  });

  it("marks only past-due unfinished records as overdue", () => {
    expect(getOverdueRecords(records, "2026-11-23").map((record) => record.id)).toEqual(["old"]);
  });

  it("quotes CSV values and neutralizes spreadsheet formulas in text", () => {
    expect(serializeCsv([["=SUM(A1:A2)", "texto, con coma", "dijo \"hola\"", -12]])).toBe(
      "\"'=SUM(A1:A2)\",\"texto, con coma\",\"dijo \"\"hola\"\"\",\"-12\"",
    );
  });
});
