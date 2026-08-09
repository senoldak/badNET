import { RESOLUTION_THRESHOLDS } from '../shared/constants.js';

let smoothedSpeed = null;

export async function measureSpeed() {
  const startTime = performance.now();
  const testUrl = 'https://www.gstatic.com/generate_204?' + Date.now();
  let instantMbps = 10;

  try {
    const response = await fetch(testUrl, { cache: 'no-store' });
    const endTime = performance.now();
    const durationSec = (endTime - startTime) / 1000;
    
    let navDownlink = (navigator && navigator.connection) ? navigator.connection.downlink : 10;
    instantMbps = Math.max(navDownlink, 2 / durationSec);
  } catch (err) {
    console.warn('Speed measurement fallback:', err);
    instantMbps = (navigator && navigator.connection) ? navigator.connection.downlink : 5;
  }

  // Apply Exponential Moving Average (EMA) smoothing (alpha = 0.3)
  if (smoothedSpeed === null) {
    smoothedSpeed = instantMbps;
  } else {
    smoothedSpeed = (instantMbps * 0.3) + (smoothedSpeed * 0.7);
  }

  // Apply 25% conservative safety margin for fluctuating networks
  const safeMbps = smoothedSpeed * 0.75;
  return Math.round(safeMbps * 10) / 10;
}

export function determineQuality(mbps, maxCapHeight = 2160) {
  let selected = RESOLUTION_THRESHOLDS[RESOLUTION_THRESHOLDS.length - 1];

  for (const threshold of RESOLUTION_THRESHOLDS) {
    if (mbps >= threshold.minMbps) {
      selected = threshold;
      break;
    }
  }

  // Enforce Max Quality Cap
  if (selected.height > maxCapHeight) {
    const capped = RESOLUTION_THRESHOLDS.find(t => t.height <= maxCapHeight);
    return capped || selected;
  }

  return selected;
}
