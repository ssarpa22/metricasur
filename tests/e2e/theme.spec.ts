import { expect, test } from "@playwright/test";

const email = process.env.METRICASUR_E2E_EMAIL;
const password = process.env.METRICASUR_E2E_PASSWORD;

test.describe("Tema visual de MétricaSur", () => {
  test("el switch y Configuración aplican los colores reales y conservan la elección", async ({ page }) => {
    test.skip(!email || !password, "Configurá METRICASUR_E2E_EMAIL y METRICASUR_E2E_PASSWORD para ejecutar la prueba autenticada.");

    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("metricasur_theme", "dark");
      const raw = localStorage.getItem("metricasur_preferences");
      const preferences = raw ? JSON.parse(raw) : {};
      localStorage.setItem("metricasur_preferences", JSON.stringify({ ...preferences, theme: "dark" }));
    });

    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Contraseña").fill(password!);
    await page.getByRole("button", { name: "Ingresar a MétricaSur" }).click();
    await expect(page).toHaveURL(/\/app/);

    const html = page.locator("html");
    const body = page.locator("body");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(11, 15, 20)");

    // The user-menu switch must change the actual page palette, not only its own thumb/icon.
    await page.locator('button[aria-label="Abrir menú de usuario"]:visible').first().click();
    await page.locator('[role="switch"][aria-label="Cambiar a modo claro"]:visible').first().click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");

    // The choice must survive a full browser reload.
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");

    // The setting in Configuración must apply the opposite theme immediately.
    await page.goto("/app?section=settings");
    await page.locator('select[name="theme"]').selectOption("dark");
    await page.getByRole("button", { name: "Guardar preferencias" }).click();
    await expect(page.getByRole("status")).toContainText("Preferencias guardadas y aplicadas.");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(11, 15, 20)");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(11, 15, 20)");
  });
});
