/**
 * The picture a learner shares after a round: a 1080 x 1350 card in the game's own look (black, a pale
 * card with the big numbers, green for the accuracy). Drawn in the browser on a canvas, so nothing is
 * uploaded or stored; the learner's device saves or shares the image. Client-only.
 */

export interface ShareCardData {
  score: number;
  accuracy: number;
  wpm: number;
  scoreLabel: string;
  accuracyLabel: string;
  speedLabel: string;
  tagline: string;
  /** A line under the numbers (the day's place, the friend's score), or null. */
  footer: string | null;
}

const BLACK = "#000000";
const LINE = "#262626";
const TILE = "#ebe7df";
const INK = "#1a1c22";
const GREEN = "#2f7d4a";
const MUTE = "#8a8d96";
const FONT = "Inter, 'Noto Sans Arabic', 'Segoe UI', system-ui, sans-serif";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderShareCard(data: ShareCardData): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, 1080, 1350);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = MUTE;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText("SENTENCESTEP  ·  WORD DROP", 90, 150);

  // The pale card with the three numbers.
  ctx.fillStyle = TILE;
  roundedRect(ctx, 90, 250, 900, 640, 48);
  ctx.fill();

  ctx.fillStyle = INK;
  ctx.font = `800 260px ${FONT}`;
  ctx.fillText(String(data.score), 150, 520);
  ctx.fillStyle = MUTE;
  ctx.font = `600 40px ${FONT}`;
  ctx.fillText(data.scoreLabel, 154, 580);

  ctx.fillStyle = GREEN;
  ctx.font = `800 150px ${FONT}`;
  ctx.fillText(`${data.accuracy}%`, 150, 760);
  ctx.fillStyle = MUTE;
  ctx.font = `600 36px ${FONT}`;
  ctx.fillText(data.accuracyLabel, 154, 815);

  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.font = `800 150px ${FONT}`;
  ctx.fillText(String(data.wpm), 930, 760);
  ctx.fillStyle = MUTE;
  ctx.font = `600 36px ${FONT}`;
  ctx.fillText(data.speedLabel, 930, 815);

  ctx.textAlign = "left";
  if (data.footer) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 44px ${FONT}`;
    ctx.fillText(data.footer, 90, 1000);
  }

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(90, 1130);
  ctx.lineTo(990, 1130);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 54px ${FONT}`;
  ctx.fillText(data.tagline, 90, 1230);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

/**
 * Hands the picture to the device: the share sheet where it can send a file, otherwise a download.
 * Returns what happened, so the screen can say so ("shared" needs no message of ours).
 */
export async function shareImage(blob: Blob, text: string): Promise<"shared" | "saved" | "failed"> {
  try {
    const file = new File([blob], "word-drop.png", { type: "image/png" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return "shared";
    }
  } catch (error) {
    // The learner closing the share sheet is not a failure.
    if (error instanceof DOMException && error.name === "AbortError") return "shared";
  }
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "word-drop.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return "saved";
  } catch {
    return "failed";
  }
}

/** Shares a link through the share sheet, or copies it. */
export async function shareLink(
  url: string,
  text: string,
): Promise<"shared" | "copied" | "failed"> {
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ text, url });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "shared";
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
