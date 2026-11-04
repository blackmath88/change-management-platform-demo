import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

test("six IMD units, offline edit, exported JSON and reopened workbook", async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), "imd-workbook-"));
  const original = join(directory, "example.html");
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", request => {
    if (/^https?:/.test(request.url())) requests.push(request.url());
  });
  page.on("pageerror", error => errors.push(error.message));
  try {
    execFileSync("python3", ["mcp/build_example.py", original]);
    await page.goto(pathToFileURL(original).href);
    for (let i = 0; i < 6; i++) {
      await page.locator("aside button").nth(i).click();
      const frame = page.frameLocator("iframe");
      await expect(frame.locator(".page-title").first()).toBeVisible();
      if (i === 0) {
        const input = frame.locator("#ctx-title");
        await expect(input).toHaveValue("Beschlüsse im Campusservice");
        await input.evaluate((node: HTMLInputElement) => {
          node.value = "Workshop update";
          node.dispatchEvent(new Event("input", { bubbles: true }));
        });
      }
      await page.locator("#home").click();
    }
    for (const [id, file] of [["json", "project.json"], ["html", "revised.html"]]) {
      const download = page.waitForEvent("download");
      await page.locator("#" + id).click();
      await (await download).saveAs(join(directory, file));
    }
    const result = JSON.parse(await readFile(join(directory, "project.json"), "utf8"));
    expect(result.modules.vision.ctx_title).toBe("Workshop update");
    expect(Object.keys(result.modules)).toHaveLength(6);
    await page.goto(pathToFileURL(join(directory, "revised.html")).href);
    await page.locator("aside button").first().click();
    await expect(page.frameLocator("iframe").locator("#ctx-title")).toHaveValue("Workshop update");
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
