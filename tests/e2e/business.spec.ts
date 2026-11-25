
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

    const originalBusinessName = (await page.locator("header p").nth(1).textContent())?.trim();
    const originalSalesButton = page.getByText("Ventas", { exact: true }).locator("..").locator("..").getByRole("button");
    const originalSalesState = (await originalSalesButton.textContent())?.trim();
    expect(originalSalesState).toMatch(/^(Activar|Desactivar)$/);
    expect(originalBusinessName).toBeTruthy();

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

    // Verificar cambio entre empresas
    const sidebar = page.locator("aside").first();

    // Volver a la empresa original
    await sidebar.getByRole("button").filter({ hasText: businessName }).first().click();
    await page.getByRole("button", { name: originalBusinessName!, exact: true }).click();

    await expect(page.locator("header p").nth(1)).toHaveText(originalBusinessName!);

    // Volver a la empresa recién creada
    await sidebar.getByRole("button").filter({ hasText: originalBusinessName! }).first().click();
    await page.getByRole("button", { name: businessName, exact: true }).click();

    await expect(page.locator("header p").nth(1)).toHaveText(businessName);
    // Verificar aislamiento de módulos entre empresas
    await page.goto("/app?section=settings");

    const newSalesButton = page.getByText("Ventas", { exact: true }).locator("..").locator("..").getByRole("button");

    // La empresa retail recién creada debe tener Ventas habilitado
    await expect(newSalesButton).toHaveText("Desactivar");

    // Desactivar Ventas solamente en la empresa nueva
    await newSalesButton.click();
    await expect(page.getByRole("status")).toContainText("La configuración de módulos se actualizó.");

    // Volver a la empresa original
    await page.goto("/app?section=settings");
    const originalBusinessRow = page.getByText(originalBusinessName!, { exact: true }).last().locator("..");
    await originalBusinessRow.getByRole("button", { name: "Cambiar" }).click();

    // Confirmar que realmente cambiamos a la empresa original
    await expect(page.locator("header p").nth(1)).toHaveText(originalBusinessName!);

    // Su configuración debe permanecer igual
    await page.goto("/app?section=settings");
    const originalSalesButtonAfterSwitch = page.getByText("Ventas", { exact: true }).locator("..").locator("..").getByRole("button");
    await expect(originalSalesButtonAfterSwitch).toHaveText(originalSalesState!);

    // Regresar a la empresa nueva
    await page.getByText(businessName, { exact: true }).last().locator("..").getByRole("button", { name: "Cambiar" }).click();

    // Ventas debe seguir desactivado en la empresa nueva
    await page.goto("/app?section=settings");
    const newSalesButtonAfterSwitch = page.getByText("Ventas", { exact: true }).locator("..").locator("..").getByRole("button");
    await expect(newSalesButtonAfterSwitch).toHaveText("Activar");
  });
});
