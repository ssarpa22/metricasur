"use client";

import { useMemo, useState } from "react";
import { Search, Plus, X, Trash2, Mail, Phone, MapPin, Building2, UserRound } from "lucide-react";
import { serializeCsv } from "@/lib/record-insights";
import { createBusinessRecord, deleteBusinessRecord, updateBusinessRecord } from "./record-actions";

type CustomerRecord = {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "completed" | "cancelled";
  amount: number | null;
  quantity: number | null;
  due_date: string | null;
  category: string;
  reference: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type Props = {
  businessId: string;
  name: string;
  records: CustomerRecord[];
  canExport?: boolean;
};

type CustomerMetadata = {
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

const emptyMetadata: CustomerMetadata = {
  company: "",
  taxId: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  city: "",
  province: "",
  customerType: "person",
  relationshipStatus: "prospect",
  notes: "",
};

const relationshipLabels: Record<string, string> = {
  prospect: "Prospecto",
  active: "Activo",
  inactive: "Inactivo",
};

const relationshipStyles: Record<string, string> = {
  prospect: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
};

function metadataOf(record: CustomerRecord): CustomerMetadata {
  const raw = record.metadata ?? {};
  const result = { ...emptyMetadata };

  for (const key of Object.keys(result) as (keyof CustomerMetadata)[]) {
    const value = raw[key];
    if (typeof value === "string") result[key] = value;
  }

  return result;
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="text-xs font-semibold text-[#52645a]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        className="mt-1.5 w-full rounded-xl border border-[#dce5e0] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#397552]"
      />
    </label>
  );
}

function CustomerFields({ metadata }: { metadata: CustomerMetadata }) {
  return (
    <>
      <Field label="Empresa" name="company" defaultValue={metadata.company} placeholder="Nombre comercial" maxLength={160} />
      <Field label="CUIT / DNI" name="taxId" defaultValue={metadata.taxId} placeholder="Solo números" maxLength={20} />
      <Field label="Email" name="email" defaultValue={metadata.email} type="email" placeholder="cliente@correo.com" maxLength={254} />
      <Field label="Teléfono" name="phone" defaultValue={metadata.phone} placeholder="Código de área y número" maxLength={40} />
      <Field label="WhatsApp" name="whatsapp" defaultValue={metadata.whatsapp} placeholder="Número de WhatsApp" maxLength={40} />
      <Field label="Dirección" name="address" defaultValue={metadata.address} placeholder="Calle y altura" maxLength={200} />
      <Field label="Ciudad" name="city" defaultValue={metadata.city} maxLength={100} />
      <Field label="Provincia" name="province" defaultValue={metadata.province} maxLength={100} />

      <label className="text-xs font-semibold text-[#52645a]">
        Tipo de cliente
        <select name="customerType" defaultValue={metadata.customerType} className="mt-1.5 w-full rounded-xl border border-[#dce5e0] bg-white px-3 py-2.5 text-sm font-normal">
          <option value="person">Persona</option>
          <option value="company">Empresa</option>
        </select>
      </label>

      <label className="text-xs font-semibold text-[#52645a]">
        Estado comercial
        <select name="relationshipStatus" defaultValue={metadata.relationshipStatus} className="mt-1.5 w-full rounded-xl border border-[#dce5e0] bg-white px-3 py-2.5 text-sm font-normal">
          <option value="prospect">Prospecto</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </label>

      <label className="text-xs font-semibold text-[#52645a] sm:col-span-2">
        Notas internas
        <textarea name="customerNotes" defaultValue={metadata.notes} maxLength={2000} rows={3} placeholder="Información importante sobre este cliente..." className="mt-1.5 w-full rounded-xl border border-[#dce5e0] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#397552]" />
      </label>
    </>
  );
}

function HiddenFields({ businessId, recordId }: { businessId: string; recordId?: string }) {
  return (
    <>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="moduleSlug" value="customers" />
      {recordId && <input type="hidden" name="recordId" value={recordId} />}
      <input type="hidden" name="description" value="" />
      <input type="hidden" name="category" value="" />
      <input type="hidden" name="reference" value="" />
      <input type="hidden" name="amount" value="" />
      <input type="hidden" name="quantity" value="" />
      <input type="hidden" name="dueDate" value="" />
      <input type="hidden" name="status" value="open" />
    </>
  );
}

export function CustomersWorkspace({ businessId, name, records, canExport = false }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const customers = useMemo(() => records.map(record => ({
    record,
    metadata: metadataOf(record),
  })), [records]);

  const filtered = customers.filter(({ record, metadata }) => {
    const searchable = [
      record.title,
      metadata.company,
      metadata.taxId,
      metadata.email,
      metadata.phone,
      metadata.whatsapp,
      metadata.address,
      metadata.city,
      metadata.province,
      metadata.notes,
    ].join(" ").toLowerCase();

    return searchable.includes(search.trim().toLowerCase()) &&
      (statusFilter === "all" || metadata.relationshipStatus === statusFilter);
  });

  const active = customers.filter(({ metadata }) => metadata.relationshipStatus === "active").length;
  const prospects = customers.filter(({ metadata }) => metadata.relationshipStatus === "prospect").length;

  function exportCsv() {
    const rows = [
      ["Nombre", "Empresa", "CUIT/DNI", "Email", "Teléfono", "WhatsApp", "Dirección", "Ciudad", "Provincia", "Tipo", "Estado comercial", "Notas"],
      ...filtered.map(({ record, metadata }) => [
        record.title,
        metadata.company,
        metadata.taxId,
        metadata.email,
        metadata.phone,
        metadata.whatsapp,
        metadata.address,
        metadata.city,
        metadata.province,
        metadata.customerType,
        relationshipLabels[metadata.relationshipStatus] ?? metadata.relationshipStatus,
        metadata.notes,
      ]),
    ];

    const csv = serializeCsv(rows);
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "metricasur-clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#43815f]">Gestión comercial</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#263b30]">{name}</h1>
          <p className="mt-1 text-sm text-[#7d8a82]">Administrá tus clientes, contactos y relaciones comerciales.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#176b4f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#105c45]">
          <Plus size={17} /> {showForm ? "Cerrar formulario" : "Nuevo cliente"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e5ebe7] bg-white p-4">
          <p className="text-xs text-[#89958e]">Total de clientes</p>
          <p className="mt-2 text-2xl font-semibold text-[#2d4235]">{records.length}</p>
        </div>
        <div className="rounded-xl border border-[#e5ebe7] bg-white p-4">
          <p className="text-xs text-[#89958e]">Clientes activos</p>
          <p className="mt-2 text-2xl font-semibold text-[#2d4235]">{active}</p>
        </div>
        <div className="rounded-xl border border-[#e5ebe7] bg-white p-4">
          <p className="text-xs text-[#89958e]">Prospectos</p>
          <p className="mt-2 text-2xl font-semibold text-[#2d4235]">{prospects}</p>
        </div>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-[#cfe0d4] bg-white p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#304638]">Nuevo cliente</h2>
              <p className="mt-1 text-xs text-[#89958e]">Completá los datos de contacto y comerciales.</p>
            </div>
            <button onClick={() => setShowForm(false)} aria-label="Cerrar" className="rounded-lg p-2 text-[#7c8981] hover:bg-[#f3f6f4]"><X size={17} /></button>
          </div>

          <form action={createBusinessRecord} className="grid gap-4 sm:grid-cols-2">
            <HiddenFields businessId={businessId} />
            <div className="sm:col-span-2">
              <Field label="Nombre y apellido / Razón social *" name="title" placeholder="Ej. Juan Pérez" maxLength={160} />
            </div>
            <CustomerFields metadata={emptyMetadata} />
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[#dce5e0] px-4 py-2.5 text-sm font-semibold text-[#52645a]">Cancelar</button>
              <button className="rounded-xl bg-[#176b4f] px-5 py-2.5 text-sm font-semibold text-white">Guardar cliente</button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#edf0ee] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#304638]">Clientes ({filtered.length})</h2>
            <p className="mt-1 text-xs text-[#89958e]">Buscá, filtrá, editá y exportá tu cartera comercial.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89958e]" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar cliente..." className="w-full rounded-xl border border-[#e5ebe7] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#397552] sm:w-52" />
            </label>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} aria-label="Filtrar por estado comercial" className="rounded-xl border border-[#e5ebe7] bg-white px-3 py-2 text-xs text-[#52645a]">
              <option value="all">Todos los estados</option>
              <option value="prospect">Prospectos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            {canExport ? <button type="button" onClick={exportCsv} disabled={!filtered.length} className="rounded-xl border border-[#dce5e0] px-3 py-2 text-xs font-semibold text-[#52645a] disabled:opacity-40">Exportar CSV</button> : <span className="rounded-xl border border-[#263445] px-3 py-2 text-xs text-[#64748B]">Exportación: Pro</span>}
          </div>
        </div>

        {filtered.length ? (
          <div className="divide-y divide-[#edf0ee]">
            {filtered.map(({ record, metadata }) => (
              <article key={record.id} className="p-4 sm:px-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#354a3b]">{record.title}</h3>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${relationshipStyles[metadata.relationshipStatus] ?? relationshipStyles.prospect}`}>
                        {relationshipLabels[metadata.relationshipStatus] ?? "Prospecto"}
                      </span>
                      <span className="rounded-full bg-[#f3f6f4] px-2 py-1 text-[10px] text-[#718078]">
                        {metadata.customerType === "company" ? "Empresa" : "Persona"}
                      </span>
                    </div>

                    {metadata.company && <p className="mt-1 text-xs text-[#718078]"><Building2 size={12} className="mr-1 inline" />{metadata.company}</p>}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#718078]">
                      {metadata.email && <span><Mail size={12} className="mr-1 inline" />{metadata.email}</span>}
                      {metadata.phone && <span><Phone size={12} className="mr-1 inline" />{metadata.phone}</span>}
                      {metadata.whatsapp && <span>WhatsApp: {metadata.whatsapp}</span>}
                      {metadata.taxId && <span>CUIT/DNI: {metadata.taxId}</span>}
                      {(metadata.city || metadata.province) && <span><MapPin size={12} className="mr-1 inline" />{[metadata.city, metadata.province].filter(Boolean).join(", ")}</span>}
                    </div>

                    {metadata.notes && <p className="mt-2 line-clamp-2 text-xs text-[#89958e]">{metadata.notes}</p>}

                    <details className="mt-3">
                      <summary className="w-fit cursor-pointer text-[11px] font-semibold text-[#397552] hover:underline">Editar ficha</summary>
                      <form action={updateBusinessRecord} className="mt-3 grid gap-3 rounded-xl bg-[#f8faf8] p-3 sm:grid-cols-2">
                        <HiddenFields businessId={businessId} recordId={record.id} />
                        <div className="sm:col-span-2">
                          <Field label="Nombre y apellido / Razón social *" name="title" defaultValue={record.title} maxLength={160} />
                        </div>
                        <CustomerFields metadata={metadata} />
                        <button className="rounded-lg bg-[#176b4f] px-3 py-2 text-xs font-semibold text-white sm:col-span-2">Guardar cambios</button>
                      </form>
                    </details>
                  </div>

                  <form action={deleteBusinessRecord} onSubmit={event => {
                    if (!window.confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) event.preventDefault();
                  }}>
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="moduleSlug" value="customers" />
                    <input type="hidden" name="recordId" value={record.id} />
                    <button aria-label={`Eliminar ${record.title}`} title="Eliminar cliente" className="rounded-lg p-2 text-[#a0aaa3] hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-[#f0f5f1] text-[#7e9b88]"><UserRound size={20} /></span>
            <p className="mt-3 text-sm font-semibold text-[#46594d]">{search || statusFilter !== "all" ? "No encontramos clientes" : "Todavía no hay clientes"}</p>
            <p className="mt-1 text-xs text-[#89958e]">{search || statusFilter !== "all" ? "Probá modificando la búsqueda o el filtro." : "Creá tu primera ficha para empezar a gestionar tu cartera."}</p>
            {!search && statusFilter === "all" && <button onClick={() => setShowForm(true)} className="mt-4 rounded-xl bg-[#176b4f] px-4 py-2 text-xs font-semibold text-white">Crear primer cliente</button>}
          </div>
        )}
      </section>
    </div>
  );
}
