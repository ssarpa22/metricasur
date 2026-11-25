import { test, expect } from "@playwright/test";

test.describe("Clientes de MétricaSur", () => {
  test("permite crear, editar, filtrar y conservar una ficha de cliente", async ({ page }) => {
    const email = process.env.METRICASUR_E2E_EMAIL;
    const password = process.env.METRICASUR_E2E_PASSWORD;

    test.skip(!email || !password, "Faltan las credenciales E2E.");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Contraseña").fill(password!);
    await page.getByRole("button", { name: "Ingresar a MétricaSur" }).click();

    await expect(page).toHaveURL(/\/app/);

    // Crear una empresa aislada para esta prueba.
    await page.goto("/app?section=settings");
    await page.getByText("Crear otro espacio").click();

    const businessName = `E2E Clientes ${Date.now()}`;
    await page.getByPlaceholder("Ej. Mi estudio").fill(businessName);
    await page.getByLabel("Rubro").selectOption("retail");
    await page.getByRole("button", { name: "Crear espacio" }).click();

    await expect(page).toHaveURL(/created=1/);

    // Abrir Clientes.
    await page.goto("/app?section=customers");
    await expect(
      page.getByRole("heading", { name: "Clientes", exact: true })
    ).toBeVisible();

    const customerName = `E2E Cliente ${Date.now()}`;
    const updatedName = `${customerName} Editado`;
    const customerEmail = `e2e.${Date.now()}@metricasur.test`;

    // Crear ficha.
    await page.getByRole("button", { name: "Nuevo cliente" }).click();
    await page.getByPlaceholder("Ej. Juan Pérez").fill(customerName);
    await page.getByPlaceholder("Nombre comercial").fill("Comercio E2E");
    await page.locator('input[name="email"]').fill(customerEmail);
    await page.locator('select[name="relationshipStatus"]').selectOption("active");
    await page.getByRole("button", { name: "Guardar cliente" }).click();

    await expect(page).toHaveURL(/saved=1/);

    let customer = page.locator("article").filter({ hasText: customerName });
    await expect(customer).toBeVisible();
    await expect(customer).toContainText(customerEmail);
    await expect(customer).toContainText("Comercio E2E");

    // Editar nombre y datos de contacto.
    await customer.getByText("Editar ficha", { exact: true }).click();

    const editForm = customer.locator("details form");
    await editForm.locator('input[name="title"]').fill(updatedName);
    await editForm.locator('input[name="phone"]').fill("2284000000");
    await editForm.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page).toHaveURL(/saved=1/);

    customer = page.locator("article").filter({ hasText: updatedName });
    await expect(customer).toBeVisible();
    await expect(customer).toContainText("2284000000");
    await expect(customer).toContainText(customerEmail);

    // Filtrar por estado comercial activo.
    await page.getByLabel("Filtrar por estado comercial").selectOption("active");
    await expect(customer).toBeVisible();

    // Buscar por nombre.
    await page.getByPlaceholder("Buscar cliente...").fill(updatedName);
    await expect(customer).toBeVisible();

    // Recargar y comprobar persistencia en base de datos.
    await page.reload();

    customer = page.locator("article").filter({ hasText: updatedName });
    await expect(customer).toBeVisible();
    await expect(customer).toContainText(customerEmail);
    await expect(customer).toContainText("2284000000");
    await expect(customer).toContainText("Comercio E2E");

    // Exportar la cartera filtrada y verificar el archivo CSV.
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("metricasur-clientes.csv");

    // Cancelar la eliminación: el cliente debe permanecer.
    page.once("dialog", dialog => dialog.dismiss());
    await customer.getByRole("button", { name: `Eliminar ${updatedName}` }).click();
    await expect(customer).toBeVisible();

    // Confirmar la eliminación del cliente creado por esta prueba.
    page.once("dialog", dialog => dialog.accept());
    await customer.getByRole("button", { name: `Eliminar ${updatedName}` }).click();
    await expect(page).toHaveURL(/deleted=1/);
    await expect(
      page.locator("article").filter({ hasText: updatedName })
    ).toHaveCount(0);
  });
});