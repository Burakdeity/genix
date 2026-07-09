/**
 * Renders promo/orwix-promo-15s.html to promo/output/orwix-promo-15s.webm
 * Requires: npm install playwright && npx playwright install chromium
 * Optional MP4: ffmpeg -i promo/output/orwix-promo-15s.webm promo/output/orwix-promo-15s.mp4
 */
import { chromium } from "playwright";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "promo", "orwix-promo-15s.html");
const outputDir = path.join(root, "promo", "output");

const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION_MS = 15500;

function findFfmpeg() {
  const candidates = [
    process.env.PLAYWRIGHT_FFMPEG_PATH,
    "ffmpeg",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate !== "ffmpeg" && fs.existsSync(candidate)) return candidate;
  }

  const searchRoots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(os.homedir(), "AppData", "Local", "ms-playwright"),
    path.join(os.tmpdir(), "cursor-sandbox-cache"),
  ].filter(Boolean);

  for (const searchRoot of searchRoots) {
    if (!fs.existsSync(searchRoot)) continue;
    const stack = [searchRoot];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      let entries;
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
        } else if (entry.name === "ffmpeg.exe" || entry.name === "ffmpeg") {
          return fullPath;
        }
      }
    }
  }

  return null;
}

function convertToMp4(webmPath, mp4Path) {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) return false;

  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      webmPath,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      mp4Path,
    ],
    { stdio: "inherit" },
  );
  return true;
}

async function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error("Missing:", htmlPath);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: outputDir,
      size: { width: WIDTH, height: HEIGHT },
    },
  });

  const page = await context.newPage();
  const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

  console.log("Recording", fileUrl);
  await page.goto(fileUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__PROMO_DONE__ === true, {
    timeout: DURATION_MS + 5000,
  });
  await page.waitForTimeout(300);

  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) {
    console.error("No video recorded.");
    process.exit(1);
  }

  const recordedPath = await video.path();
  const finalWebm = path.join(outputDir, "orwix-promo-15s.webm");
  fs.renameSync(recordedPath, finalWebm);

  const finalMp4 = path.join(outputDir, "orwix-promo-15s.mp4");
  const mp4Ok = convertToMp4(finalWebm, finalMp4);

  console.log("\nDone:");
  console.log(" ", finalWebm);
  if (mp4Ok) {
    console.log(" ", finalMp4);
  } else {
    console.log("\nMP4 icin ffmpeg bulunamadi. WebM dosyasini CapCut / Canva ile acabilirsin.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
