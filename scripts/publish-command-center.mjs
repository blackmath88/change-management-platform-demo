import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// The original IMD release stays intact. Publish its six-unit UI at the
// product root, with Changefield branding and links to the other case formats.
const dist = "dist";
const archive = join(dist, "imd");
const workspace = join(dist, "workspace");
execFileSync("python3", ["mcp/build_example.py", join(dist, "workbook", "index.html")]);
await mkdir(workspace, { recursive: true });
await copyFile(join(dist, "index.html"), join(workspace, "index.html"));

for (const name of await readdir(archive)) {
  const source = join(archive, name);
  const target = join(dist, name);
  if (name === "index.html") {
    const original = await readFile(source, "utf8");
    const page = original
      .replaceAll("Change Management Platform", "Changefield")
      .replace("</head>", `<script>
        if (location.hash.startsWith("#/cases/")) {
          location.replace("workspace/" + location.search + location.hash);
        }
      </script></head>`)
      .replace('<button class="btn btn-quiet icon-btn" aria-label="Search">⌕</button>',
        '<a class="btn btn-quiet" href="workbook/">Chat-authored workbook</a><a class="btn btn-quiet" href="pilot/">M365 pilot</a><a class="btn btn-quiet" href="workspace/">Local case files</a>')
      .replace("Start a connected change case</h2>", "Start a connected change case</h2><p class=\"module-sub\">Projects here use the IMD demo service. For browser-local case files, open Local case files.</p>");
    await writeFile(target, page);
  } else if (name === "cmt-shell.js") {
    const shell = await readFile(source, "utf8");
    await writeFile(target, shell.replace("Change Management Platform", "Changefield"));
  } else {
    await copyFile(source, target);
  }
}
