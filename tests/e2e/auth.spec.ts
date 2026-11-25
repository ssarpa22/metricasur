
import { test, expect } from "@playwright/test";

test.describe("Autenticación de MétricaSur", () => {
  test("redirige al login cuando no hay una sesión", async ({ page }) => {
    await page.goto("/app");

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Tu espacio empieza acá." })
    ).toBeVisible();
  });

  test("muestra correctamente el formulario de acceso", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Ingresar a MétricaSur" })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Crear cuenta" })
    ).toBeVisible();
  });

  test("rechaza credenciales incorrectas", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("e2e-invalid@example.test");
    await page.getByLabel("Contraseña").fill("InvalidPassword123!");

    await page
      .getByRole("button", { name: "Ingresar a MétricaSur" })
      .click();

	await expect(
		page.getByRole("alert").filter({
			hasText: "No se pudo iniciar sesión",
			})
	).toBeVisible();

    await expect(page).toHaveURL(/\/login/);
  });

  test("permite iniciar y cerrar sesión con una cuenta de pruebas", async ({
    page,
  }) => {
    const email = process.env.METRICASUR_E2E_EMAIL;
    const password = process.env.METRICASUR_E2E_PASSWORD;

    test.skip(!email || !password, "Faltan las credenciales E2E.");

    await page.goto("/login");

    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Contraseña").fill(password!);

    await page
      .getByRole("button", { name: "Ingresar a MétricaSur" })
      .click();

    await expect(page).toHaveURL(/\/app/);

    await expect(
      page.getByRole("button", { name: "Cerrar sesión" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
