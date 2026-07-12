/**
 * Frame-perfect promo render: scrub CSS animations, screenshot each frame, encode MP4 @ 24fps.
 */
import { chromium } from "playwright";
import { execFileSync, execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "promo", "orwix-promo-15s.html");
const outputDir = path.join(root, "promo", "output");
const framesDir = path.join(outputDir, "frames");

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 24;
const DURATION_SEC = 15;
const TOTAL_FRAMES = FPS * DURATION_SEC;

function findFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return "ffmpeg";
  } catch {
    /* continue */
  }
  const searchRoots = [
    path.join(os.homedir(), "AppData", "Local", "Microsoft", "WinGet", "Packages"),
    path.join(os.homedir(), "AppData", "Local", "ms-playwright"),
    "C:\\Program Files\\ffmpeg",
  ];
  for (const searchRoot of searchRoots) {
    if (!fs.existsSync(searchRoot)) continue;
    const stack = [searchRoot];
    while (stack.length) {
      const current = stack.pop();
      let entries;
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules") continue;
          stack.push(fullPath);
        } else if (entry.name === "ffmpeg.exe") {
          return fullPath;
        }
      }
    }
  }
  return null;
}

async function main() {
  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    console.error("ffmpeg gerekli. winget install Gyan.FFmpeg");
    process.exit(1);
  }

  fs.mkdirSync(framesDir, { recursive: true });
  for (const f of fs.readdirSync(framesDir)) {
    fs.unlinkSync(path.join(framesDir, f));
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--hide-scrollbars"],
  });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });

  await page.setContent(html, { waitUntil: "load" });
  await page.waitForFunction(() => window.__PROMO_READY__ === true);

  // Start timeline paused at 0, hide boot immediately for clean frames
  await page.evaluate(() => {
    document.body.classList.add("is-playing");
    const boot = document.querySelector(".boot");
    if (boot) boot.style.display = "none";
    for (const a of document.getAnimations({ subtree: true })) {
      a.pause();
      a.currentTime = 0;
    }
  });

  console.log(`Capturing ${TOTAL_FRAMES} frames @ ${FPS}fps...`);
  const t0 = Date.now();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const ms = (i / FPS) * 1000;
    await page.evaluate((timeMs) => {
      for (const a of document.getAnimations({ subtree: true })) {
        a.pause();
        a.currentTime = timeMs;
      }
    }, ms);

    const file = path.join(framesDir, `frame-${String(i).padStart(4, "0")}.png`);
    await page.screenshot({
      path: file,
      type: "png",
      caret: "hide",
    });

    if (i % 24 === 0) {
      console.log(`  ${i}/${TOTAL_FRAMES} (${((i / TOTAL_FRAMES) * 100) | 0}%)`);
    }
  }

  await browser.close();
  console.log(`Frames done in ${((Date.now() - t0) / 1000) | 0}s`);

  const webmPath = path.join(outputDir, "orwix-promo-15s.webm");
  const mp4Path = path.join(outputDir, "orwix-promo-15s.mp4");
  const pattern = path.join(framesDir, "frame-%04d.png");

  console.log("Encoding MP4...");
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-framerate",
      String(FPS),
      "-i",
      pattern,
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "17",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-movflags",
      "+faststart",
      mp4Path,
    ],
    { stdio: "inherit" },
  );

  // Also webm for convenience
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      mp4Path,
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "32",
      "-row-mt",
      "1",
      webmPath,
    ],
    { stdio: "inherit" },
  );

  // cleanup frames to save disk
  for (const f of fs.readdirSync(framesDir)) {
    fs.unlinkSync(path.join(framesDir, f));
  }
  try {
    fs.rmdirSync(framesDir);
  } catch {
    /* ignore */
  }

  console.log("\nDone:");
  console.log(" ", mp4Path);
  console.log(" ", webmPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
