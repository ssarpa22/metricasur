import { describe, it, expect } from "vitest";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { Dialog, ConfirmDialog, useToast, ToastContainer, DataTable, FormField } from "./ui";

if (typeof window === "undefined") {
  Object.defineProperty(globalThis, "window", { value: {}, writable: true });
}

describe("Dialog", () => {
  it("renders content when open", () => {
    const html = ReactDOMServer.renderToString(
      <Dialog open={true} onClose={() => {}} title="Mi título">Contenido del diálogo</Dialog>
    );
    expect(html).toContain("Mi título");
    expect(html).toContain("Contenido del diálogo");
  });

  it("renders nothing when closed", () => {
    const html = ReactDOMServer.renderToString(
      <Dialog open={false} onClose={() => {}} title="Título">Contenido</Dialog>
    );
    expect(html).not.toContain("Contenido");
  });
});

describe("ConfirmDialog", () => {
  it("renders title and description", () => {
    const html = ReactDOMServer.renderToString(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} title="Eliminar cliente" description="¿Está seguro?" />
    );
    expect(html).toContain("Eliminar cliente");
    expect(html).toContain("¿Está seguro?");
  });

  it("renders nothing when closed", () => {
    const html = ReactDOMServer.renderToString(
      <ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} title="Test" description="Desc" />
    );
    expect(html).not.toContain("Test");
  });
});

describe("useToast", () => {
  it("returns initial state and functions", () => {
    let result: ReturnType<typeof useToast> | null = null;
    function TestComponent() {
      result = useToast();
      return null;
    }
    ReactDOMServer.renderToString(<TestComponent />);
    expect(result!.toasts).toHaveLength(0);
    expect(typeof result!.toast).toBe("function");
    expect(typeof result!.dismiss).toBe("function");
  });
});

describe("ToastContainer", () => {
  it("renders toast content", () => {
    const html = ReactDOMServer.renderToString(
      <ToastContainer
        toasts={[{ id: "1", type: "success", title: "Éxito", message: "Operación completada" }]}
        onDismiss={() => {}}
      />
    );
    expect(html).toContain("Éxito");
    expect(html).toContain("Operación completada");
  });

  it("renders nothing when no toasts", () => {
    const html = ReactDOMServer.renderToString(
      <ToastContainer toasts={[]} onDismiss={() => {}} />
    );
    expect(html).not.toContain("Éxito");
  });
});

describe("DataTable", () => {
  it("renders table with headers and rows", () => {
    type Row = { id: string; name: string; value: number };
    const columns = [
      { key: "name", label: "Nombre" },
      { key: "value", label: "Valor" },
    ];
    const data = [
      { id: "1", name: "Item 1", value: 100 },
      { id: "2", name: "Item 2", value: 200 },
    ];
    const html = ReactDOMServer.renderToString(<DataTable<Row> columns={columns} data={data} />);
    expect(html).toContain("Nombre");
    expect(html).toContain("Valor");
    expect(html).toContain("Item 1");
    expect(html).toContain("100");
    expect(html).toContain("Item 2");
    expect(html).toContain("200");
  });

  it("shows empty message when no data", () => {
    type Row = { id: string; name: string };
    const html = ReactDOMServer.renderToString(
      <DataTable<Row> columns={[]} data={[]} emptyMessage="Sin registros disponibles" />
    );
    expect(html).toContain("Sin registros disponibles");
  });

  it("uses custom render function for cells", () => {
    type Row = { id: string; status: string };
    const columns = [
      { key: "status", label: "Estado", render: (value: unknown) => <span>{String(value)}</span> },
    ];
    const data = [{ id: "1", status: "Activo" }];
    const html = ReactDOMServer.renderToString(<DataTable<Row> columns={columns} data={data} />);
    expect(html).toContain("Activo");
  });
});

describe("FormField", () => {
  it("renders label and input", () => {
    const html = ReactDOMServer.renderToString(
      <FormField label="Nombre" name="name" placeholder="Escribí tu nombre" />
    );
    expect(html).toContain("Nombre");
    expect(html).toContain("Escribí tu nombre");
    expect(html).toContain('name="name"');
  });

  it("shows error message when provided", () => {
    const html = ReactDOMServer.renderToString(
      <FormField label="Email" name="email" error="Email inválido" />
    );
    expect(html).toContain("Email inválido");
  });

  it("marks required fields with asterisk", () => {
    const html = ReactDOMServer.renderToString(
      <FormField label="Nombre" name="name" required />
    );
    expect(html).toContain("*");
  });

  it("renders textarea when multiline is true", () => {
    const html = ReactDOMServer.renderToString(
      <FormField label="Notas" name="notes" multiline rows={4} />
    );
    expect(html).toContain("Notas");
    expect(html).toContain("<textarea");
  });

  it("renders children when provided instead of input", () => {
    const html = ReactDOMServer.renderToString(
      <FormField label="Personalizado" name="custom">
        <select name="custom"><option value="a">Opción A</option></select>
      </FormField>
    );
    expect(html).toContain("Personalizado");
    expect(html).toContain("Opción A");
  });
});
