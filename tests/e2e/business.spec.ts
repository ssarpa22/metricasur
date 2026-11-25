
import { test, expect } from "@playwright/test";

test.describe("Empresas de MétricaSur", () => {
  test("permite crear una empresa desde configuración", async ({ page }) => {
    const email = process.env.METRICASUR_E2E_EMAIL;
    const password = process.env.METRICASUR_E2E_PASSWORD;

    test.skip(!email || !password, "Faltan las credenciales E2E.");

    // Iniciar sesión
    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Contraseña").fill(password!);
    await page.getByRole("button", {
      name: "Ingresar a MétricaSur",
    }).click();

    await expect(page).toHaveURL(/\/app/);

    // Ir a configuración
    await page.goto("/app?section=settings");

    // Abrir el formulario para crear otra empresa
    await page.getByText("Crear otro espacio").click();

    const businessName = `E2E Comercio ${Date.now()}`;

    await page.getByPlaceholder("Ej. Mi estudio").fill(businessName);
    await page.getByLabel("Rubro").selectOption("retail");

    await page.getByRole("button", {
      name: "Crear espacio",
    }).click();

    // Comprobar que la empresa se creó
    await expect(page).toHaveURL(/created=1/);

    await expect(
      page.getByRole("status")
    ).toContainText("Tu espacio de trabajo está creado.");

    await expect(
      page.getByText(businessName, { exact: true }).first()
    ).toBeVisible();
  });
});
