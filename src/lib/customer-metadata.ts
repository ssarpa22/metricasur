export type CustomerMetadata = {
  company: string;
  taxId: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  province: string;
  customerType: string;
  relationshipStatus: string;
  notes: string;
};

export type CustomerMetadataResult =
  | { success: true; metadata: CustomerMetadata }
  | { success: false; message: string };

function value(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}

export function validateCustomerMetadata(data: FormData): CustomerMetadataResult {
  const metadata: CustomerMetadata = {
    company: value(data, "company"),
    taxId: value(data, "taxId").replace(/[^0-9]/g, ""),
    email: value(data, "email").toLowerCase(),
    phone: value(data, "phone"),
    whatsapp: value(data, "whatsapp"),
    address: value(data, "address"),
    city: value(data, "city"),
    province: value(data, "province"),
    customerType: value(data, "customerType") || "person",
    relationshipStatus: value(data, "relationshipStatus") || "prospect",
    notes: value(data, "customerNotes"),
  };

  const limits: [string, number][] = [
    [metadata.company, 160],
    [metadata.taxId, 11],
    [metadata.email, 254],
    [metadata.phone, 40],
    [metadata.whatsapp, 40],
    [metadata.address, 200],
    [metadata.city, 100],
    [metadata.province, 100],
    [metadata.notes, 2000],
  ];

  if (limits.some(([field, max]) => field.length > max)) {
    return { success: false, message: "Uno de los datos del cliente supera el largo permitido." };
  }

  if (metadata.taxId && metadata.taxId.length < 7) {
    return { success: false, message: "El CUIT o DNI debe contener entre 7 y 11 números." };
  }

  if (metadata.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(metadata.email)) {
    return { success: false, message: "El email del cliente no tiene un formato válido." };
  }

  if (!["person", "company"].includes(metadata.customerType)) {
    return { success: false, message: "El tipo de cliente no es válido." };
  }

  if (!["prospect", "active", "inactive"].includes(metadata.relationshipStatus)) {
    return { success: false, message: "El estado comercial del cliente no es válido." };
  }

  return { success: true, metadata };
}
