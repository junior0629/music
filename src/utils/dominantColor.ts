/**
 * Dominant color extraction from an image URL.
 *
 * Web only — uses HTMLImageElement + canvas. Native would need
 * a different approach (e.g., expo-image-manipulator + a native
 * color picker, or just sampling the bundled thumbnail).
 *
 * Returns a muted, glass-friendly accent color (not the raw
 * dominant pixel — raw colors from album art are usually too
 * saturated to use as a UI background tint).
 */
import { isWeb } from '@/theme';
import { logger } from './logger';

export interface ExtractedPalette {
  /** Primary tint, used as the gradient `from` stop. */
  primary: string;
  /** Secondary tint, used as the gradient `to` stop. */
  secondary: string;
  /** Tertiary, used as the `via` stop if needed. */
  tertiary: string;
}

/**
 * Extract a 3-color palette from an image URL.
 * Returns null on native (no canvas) or on any error.
 * Caches results by URL so we don't re-extract for the same artwork.
 */
const cache = new Map<string, ExtractedPalette>();

export async function extractPalette(imageUrl: string): Promise<ExtractedPalette | null> {
  if (!isWeb || !imageUrl) return null;
  if (cache.has(imageUrl)) return cache.get(imageUrl)!;

  try {
    const img = await loadImage(imageUrl);
    const palette = await samplePalette(img);
    cache.set(imageUrl, palette);
    return palette;
  } catch (err) {
    logger.warn('extractPalette failed', { url: imageUrl.slice(0, 80), err: String(err) });
    return null;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Image load failed: ${e}`));
    img.src = url;
  });
}

function samplePalette(img: HTMLImageElement): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    // Downsample to 32x32 for fast sampling
    const sampleSize = 32;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(fallbackPalette());
      return;
    }
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    let data: Uint8ClampedArray;
    try {
      data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
    } catch {
      // CORS-tainted canvas — fall back
      resolve(fallbackPalette());
      return;
    }

    // Bucket colors into a coarse 4-bit-per-channel histogram.
    // This collapses near-identical colors and keeps the most prominent.
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue; // skip transparent
      // 4 bits per channel
      const r = data[i] & 0xf0;
      const g = data[i + 1] & 0xf0;
      const b = data[i + 2] & 0xf0;
      const key = `${r},${g},${b}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.count++;
        existing.r += data[i];
        existing.g += data[i + 1];
        existing.b += data[i + 2];
      } else {
        buckets.set(key, { count: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }

    const top = Array.from(buckets.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((b) => ({
        r: Math.round(b.r / b.count),
        g: Math.round(b.g / b.count),
        b: Math.round(b.b / b.count),
      }))
      .filter((c) => isColorfulEnough(c));

    if (top.length === 0) {
      resolve(fallbackPalette());
      return;
    }

    const primary = mute(top[0]);
    const secondary = top[1] ? mute(top[1]) : shiftHue(primary, 30);
    const tertiary = top[2] ? mute(top[2]) : shiftHue(primary, -30);
    resolve({ primary, secondary, tertiary });
  });
}

function isColorfulEnough(c: { r: number; g: number; b: number }): boolean {
  // Skip near-white and near-black pixels — they're often
  // background/border and not what we want as a UI tint.
  const brightness = (c.r + c.g + c.b) / 3;
  return brightness > 30 && brightness < 230;
}

/**
 * Mute a color: reduce saturation and clamp lightness.
 * Result is glassmorphism-friendly (won't blow out backgrounds).
 */
function mute(c: { r: number; g: number; b: number }): string {
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b);
  const newS = Math.min(0.6, s * 0.7);
  const newL = Math.max(0.4, Math.min(0.7, l));
  const rgb = hslToRgb(h, newS, newL);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function shiftHue(hex: string, degrees: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newH = (h + degrees / 360 + 1) % 1;
  const rgb = hslToRgb(newH, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function fallbackPalette(): ExtractedPalette {
  return {
    primary: '#A78BFA',
    secondary: '#C4B5FD',
    tertiary: '#8B5CF6',
  };
}

// ---- color math ----

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
