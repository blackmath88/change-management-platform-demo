import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function openNewCase(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /begin a new case/i }).click();
  await page.getByRole("textbox", { name: "Working title" }).fill(
    "A shared service with local judgment",
  );
  await page.getByRole("textbox", { name: "Organization or setting" }).fill(
    "Harbour Cooperative",
  );
  await page.getByRole("textbox", { name: "Present situation" }).fill(
    "Three teams need one intake path without losing authority over exceptions.",
  );
  await page.getByRole("button", { name: "Open case" }).click();
  await expect(page).toHaveURL(/\/cases\/[^/]+\/?$/);
  await expect(
    page.getByRole("heading", { name: "A shared service with local judgment" }),
  ).toBeVisible();
}

test("carries a case from framing through its record and brief", async ({ page }) => {
  await openNewCase(page);

  await page.getByRole("link", { name: /Direction$/ }).click();
  const outcome = page.getByRole("textbox", { name: "Intended outcome" });
  await outcome.fill(
    "One coherent client entry point with explicit local decision rights.",
  );
  await expect(page.getByRole("status")).toContainText("Recorded");
  await page.reload();
  await expect(outcome).toHaveValue(
    "One coherent client entry point with explicit local decision rights.",
  );

  await page.getByRole("link", { name: /Record$/ }).click();
  await page.getByRole("textbox", { name: "What was decided?" }).fill(
    "Exceptional cases remain under local authority.",
  );
  await page.getByRole("textbox", { name: "Reason and trade-off" }).fill(
    "Consistency at entry should not centralize professional judgment.",
  );
  await page.getByLabel("Related field").selectOption("direction");
  await page.getByRole("textbox", { name: "Source or setting" }).fill(
    "Regional design session",
  );
  await page.getByRole("button", { name: "Add to record" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Exceptional cases remain under local authority.",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Brief$/ }).click();
  await page.getByRole("textbox", { name: "Prepared for" }).fill("Regional leads");
  await page.getByRole("textbox", { name: "Purpose" }).fill("Pilot decision");
  const brief = page.locator(".context-brief");
  await expect(brief).toContainText("Regional leads");
  await expect(brief).toContainText("Pilot decision");
  await expect(brief).toContainText(
    "One coherent client entry point with explicit local decision rights.",
  );
  await expect(brief).toContainText(
    "Exceptional cases remain under local authority.",
  );
});

test("keeps the primary portfolio and case surfaces free of detectable WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Changefield");
  await expect(page.getByRole("heading", { name: /change becomes legible/i })).toBeVisible();

  const portfolioResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(portfolioResults.violations).toEqual([]);

  await page.getByRole("link", { name: /service model people can actually use/i }).click();
  await expect(page.getByRole("heading", { name: /service model people can actually use/i }))
    .toBeVisible();
  const caseResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(caseResults.violations).toEqual([]);
});

test("opens and dismisses the new-case sheet from the keyboard", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /begin a new case/i });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Open a case." })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Working title" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Open a case." })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("persists the optional material layer without changing case data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Surface material: Paper" }).click();
  await expect(
    page.getByRole("dialog", { name: "Choose the surface." }),
  ).toBeVisible();
  await page.getByText("Clear", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-material", "clear");

  const dialogResults = await new AxeBuilder({ page })
    .include(".material-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(dialogResults.violations).toEqual([]);

  await page.getByRole("button", { name: "Keep this surface" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-material", "clear");
  await expect(
    page.getByRole("button", { name: "Surface material: Clear" }),
  ).toBeVisible();
});
