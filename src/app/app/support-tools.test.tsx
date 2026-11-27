import { describe, it, expect } from "vitest";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { ContactView, HelpView } from "./support-tools";

describe("ContactView", () => {
  it("shows the official contact address and a correctly addressed mail link", () => {
    const html = ReactDOMServer.renderToString(<ContactView/>);
    expect(html).toContain("metricasurteam@gmail.com");
    expect(html).toContain("mailto:metricasurteam@gmail.com?subject=Consulta%20sobre%20M%C3%A9tricaSur");
    expect(html).toContain("Copiar correo");
  });
});

describe("HelpView", () => {
  it("offers a way to reopen the interactive tutorial", () => {
    const html = ReactDOMServer.renderToString(<HelpView/>);
    expect(html).toContain("Abrir tutorial interactivo");
  });
});
