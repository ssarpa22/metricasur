import { expect, test } from "@playwright/test";

const email = process.env.METRICASUR_E2E_EMAIL;
const password = process.env.METRICASUR_E2E_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

test.describe("Tema visual de MétricaSur", () => {
  test("las variables CSS aplican la paleta clara y oscura en el navegador", async ({ page }) => {
    await page.goto("/login");
    const html = page.locator("html");
    const body = page.locator("body");

    await html.evaluate((element) => element.setAttribute("data-theme", "light"));
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");

    await html.evaluate((element) => element.setAttribute("data-theme", "dark"));
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(11, 15, 20)");
  });

  test("el switch y Configuración aplican los colores reales y conservan la elección", async ({ page }) => {
    test.skip(
      !email || !password || !supabaseUrl || !supabaseAnonKey,
      "Para probar los controles autenticados, configurá las cuatro variables E2E/Supabase en GitHub Actions.",
    );

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

    await page.locator('button[aria-label="Abrir menú de usuario"]:visible').first().click();
    await page.locator('[role="switch"][aria-label="Cambiar a modo claro"]:visible').first().click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect.poll(() => body.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(255, 255, 255)");

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
