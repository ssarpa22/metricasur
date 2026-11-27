import { describe, it, expect } from "vitest";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { TutorialWidget } from "./tutorial-widget";

describe("TutorialWidget", () => {
  it("shows the first step automatically for accounts without a saved choice", () => {
    const html = ReactDOMServer.renderToString(<TutorialWidget initiallyDismissed={false}/>);
    expect(html).toContain("¡Bienvenido a MétricaSur!");
    expect(html.replace(/<!-- -->/g, "")).toContain("Paso 1 de 6");
    expect(html).toContain("Siguiente");
  });

  it("keeps the tutorial closed when the account already dismissed or completed it", () => {
    const html = ReactDOMServer.renderToString(<TutorialWidget initiallyDismissed={true}/>);
    expect(html).not.toContain("¡Bienvenido a MétricaSur!");
    expect(html).toContain("Abrir tutorial de MétricaSur");
  });
});
