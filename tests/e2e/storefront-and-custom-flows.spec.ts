import { test, expect } from "@playwright/test";

test.describe("Eshaal Bakes E2E — Cart Checkout Flow & Custom Cake Quote Flow", () => {
  test("Flow 1: Fixed-price product browse, add to cart, guest checkout, confirmation, and live tracking", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /Handcrafted Cakes & Gourmet Bakes Delivered Across Karachi/i,
      })
    ).toBeVisible();

    // Navigate to a fixed-price product page
    await page
      .getByRole("link", { name: /Belgian Double Chocolate Truffle Cake/i })
      .first()
      .click();

    await expect(page).toHaveURL(
      /\/products\/belgian-double-chocolate-truffle-cake/
    );

    // Add to cart
    await page.getByTestId("add-to-cart-button").click();

    // Cart ResponsiveDialog opens; click Proceed to Guest Checkout
    await page
      .getByRole("link", { name: /Proceed to Guest Checkout/i })
      .click();

    await expect(page).toHaveURL(/\/checkout/);

    // Fill Guest Checkout Form
    await page.getByLabel(/Full Name/i).fill("Amina Rasheed");
    await page
      .getByLabel(/Pakistani Mobile Number/i)
      .fill("03001234567");
    await page
      .getByLabel(/Complete Street Address/i)
      .fill("House 55, Street 9, Phase 6 DHA Karachi");

    await page.getByTestId("place-order-submit").click();

    // Confirmation page shows non-sequential order code EB-XXXXXX
    await expect(page).toHaveURL(/\/orders\/confirmation\/EB-/);
    const orderCode = await page
      .getByTestId("confirmation-order-code")
      .textContent();
    expect(orderCode).toMatch(/^EB-[A-Z0-9]{6}$/);

    // Open private tracking page
    await page.getByTestId("open-tracking-link").click();
    await expect(page.getByTestId("tracked-order-card")).toBeVisible();
    await expect(page.getByText(orderCode!)).toBeVisible();
  });

  test("Flow 2: Custom cake request -> Admin sends quote -> Customer approves quote -> Live tracking shows Confirmed", async ({
    page,
  }) => {
    await page.goto("/custom-order");
    await expect(
      page.getByRole("heading", { name: /Request a Custom Cake Quote/i })
    ).toBeVisible();

    await page
      .getByLabel(/Cake Writing \/ Message on Board/i)
      .fill("Nikkah Mubarak Zoya & Hamza");
    await page
      .getByLabel(/Design & Theme Details/i)
      .fill(
        "Two-tier ivory fondant cake with white sugar roses and gold monogram."
      );
    await page
      .getByLabel(/Complete Street Address/i)
      .fill("Plot 14-C, Bukhari Commercial, Phase 6 DHA Karachi");
    await page.getByLabel(/Full Name/i).fill("Zoya Mirza");
    await page.getByLabel(/Pakistani Mobile Number/i).fill("03217654321");

    await page.getByTestId("submit-custom-cake-request").click();

    await expect(page).toHaveURL(/\/orders\/confirmation\/EB-/);
    const customOrderCode = (
      await page.getByTestId("confirmation-order-code").textContent()
    )?.trim();
    expect(customOrderCode).toMatch(/^EB-[A-Z0-9]{6}$/);

    // Log into Admin Panel
    await page.goto("/admin/login");
    await page.getByLabel(/Admin Email/i).fill("admin@eshalbakes.pk");
    await page.getByLabel(/Password/i).fill("KarachiBaker#2026!");
    await page
      .getByRole("button", { name: /Sign In to Kitchen Portal/i })
      .click();

    await expect(page).toHaveURL(/\/admin$/);

    // Go to Quote Requests and send a quote for the newly created custom cake order
    await page.goto("/admin/quotes");
    await expect(page.getByText(customOrderCode!)).toBeVisible();

    await page
      .getByRole("button", { name: /Send Quote/i })
      .first()
      .click();
    await page.getByTestId("send-quote-submit").click();

    // Extract the generated tokenized quote URL from the modal
    const quoteUrlElement = page.locator("code", { hasText: "/quotes/" });
    await expect(quoteUrlElement).toBeVisible();
    const fullQuoteUrl = (await quoteUrlElement.textContent())?.trim() ?? "";
    const quotePath = new URL(fullQuoteUrl).pathname;

    // Customer opens the tokenized quote approval link
    await page.goto(quotePath);
    await expect(
      page.getByRole("heading", { name: /Custom Cake Price Quote/i })
    ).toBeVisible();
    await expect(page.getByTestId("quote-countdown")).toBeVisible();

    // Customer clicks Approve Quote & Confirm Order -> ConfirmDialog opens -> Confirm
    await page.getByTestId("approve-quote-button").click();
    await page.getByRole("button", { name: /Yes, Approve Quote/i }).click();

    await expect(
      page.getByText(/Quote Approved! Your order is confirmed/i)
    ).toBeVisible();

    // Navigate from approved quote to live tracking page
    await page.getByTestId("quote-to-tracking-link").click();
    await expect(page.getByTestId("tracked-order-card")).toBeVisible();
    await expect(page.getByText(customOrderCode!)).toBeVisible();
  });
});
