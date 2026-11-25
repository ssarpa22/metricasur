import { describe, expect, it } from "vitest";
import { validateCustomerMetadata } from "./customer-metadata";

function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("validateCustomerMetadata", () => {
  it("normalizes optional customer data", () => {
    const result = validateCustomerMetadata(form({ taxId: "20-12345678-9", email: " CLIENTE@MAIL.COM " }));
    expect(result).toEqual(expect.objectContaining({ success: true }));
    if (result.success) expect(result.metadata).toMatchObject({ taxId: "20123456789", email: "cliente@mail.com", customerType: "person", relationshipStatus: "prospect" });
  });

  it.each([
    ["email", "not-an-email", "email"],
    ["taxId", "123", "CUIT"],
    ["customerType", "other", "tipo"],
    ["relationshipStatus", "unknown", "estado"],
  ])("rejects invalid %s", (field, value, message) => {
    const result = validateCustomerMetadata(form({ [field]: value }));
    expect(result).toEqual({ success: false, message: expect.stringContaining(message) });
  });

  it("rejects values beyond server-side limits", () => {
    const result = validateCustomerMetadata(form({ customerNotes: "x".repeat(2001) }));
    expect(result).toEqual({ success: false, message: expect.stringContaining("largo") });
  });
});
