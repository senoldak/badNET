import { RESOLUTION_THRESHOLDS } from '../shared/constants.js';

let smoothedSpeed = null;

// Fast.com-style multi-payload streaming benchmark
export async function measureSpeed(onProgress) {
  const testPayloads = [
    { sizeMB: 0.5, url: 'https://speed.cloudflare.com/__down?bytes=500000' },
    { sizeMB: 1.5, url: 'https://speed.cloudflare.com/__down?bytes=1500000' },
    { sizeMB: 3.0, url: 'https://speed.cloudflare.com/__down?bytes=3000000' }
  ];

  let totalBytes = 0;
  let totalDurationSec = 0;
  let measuredSpeeds = [];

  // Latency Ping
  let pingMs = 25;
  try {
    const pingStart = performance.now();
    await fetch('https://www.gstatic.com/generate_204?' + Date.now(), { cache: 'no-store' });
    pingMs = Math.round(performance.now() - pingStart);
  } catch (e) {}

  for (let i = 0; i < testPayloads.length; i++) {
    const payload = testPayloads[i];
    const startTime = performance.now();

    try {
      const response = await fetch(payload.url + '&cachebust=' + Date.now(), { cache: 'no-store' });
      const blob = await response.blob();
      const endTime = performance.now();

      const durationSec = (endTime - startTime) / 1000;
      if (durationSec > 0) {
        const payloadBytes = blob.size || (payload.sizeMB * 1024 * 1024);
        const mbps = (payloadBytes * 8) / (durationSec * 1000000);
        measuredSpeeds.push(mbps);
        totalBytes += payloadBytes;
        totalDurationSec += durationSec;

        // Progress callback for live Fast.com UI updates
        if (typeof onProgress === 'function') {
          onProgress(Math.round(mbps * 10) / 10, pingMs);
        }
      }
    } catch (err) {
      console.warn('Fast.com stream test fallback on payload:', i, err);
    }
  }

  // Calculate weighted average Mbps
  let finalMbps = 10;
  if (totalDurationSec > 0 && totalBytes > 0) {
    finalMbps = (totalBytes * 8) / (totalDurationSec * 1000000);
  } else if (navigator && navigator.connection && navigator.connection.downlink) {
    finalMbps = navigator.connection.downlink;
  }

  // Apply Exponential Moving Average (EMA) smoothing
  if (smoothedSpeed === null) {
    smoothedSpeed = finalMbps;
  } else {
    smoothedSpeed = (finalMbps * 0.4) + (smoothedSpeed * 0.6);
  }

  // Apply 20% safety margin for fluctuating networks
  const safeMbps = smoothedSpeed * 0.8;
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

  if (selected.height > maxCapHeight) {
    const capped = RESOLUTION_THRESHOLDS.find(t => t.height <= maxCapHeight);
    return capped || selected;
  }

  return selected;
}
