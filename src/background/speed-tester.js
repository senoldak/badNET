import { RESOLUTION_THRESHOLDS } from '../shared/constants.js';

let smoothedSpeed = null;

// Fast.com-style multi-payload streaming benchmark returning Mbps, Ping & Jitter
export async function measureSpeed(onProgress) {
  const testPayloads = [
    { sizeMB: 0.5, url: 'https://speed.cloudflare.com/__down?bytes=500000' },
    { sizeMB: 1.5, url: 'https://speed.cloudflare.com/__down?bytes=1500000' },
    { sizeMB: 3.0, url: 'https://speed.cloudflare.com/__down?bytes=3000000' }
  ];

  let totalBytes = 0;
  let totalDurationSec = 0;
  let measuredSpeeds = [];

  // Latency Ping & Jitter Calculation
  let pingMs = 25;
  let pingSamples = [];
  for (let i = 0; i < 3; i++) {
    try {
      const pingStart = performance.now();
      await fetch('https://www.gstatic.com/generate_204?' + Date.now() + i, { cache: 'no-store' });
      pingSamples.push(Math.round(performance.now() - pingStart));
    } catch (e) {}
  }

  if (pingSamples.length > 0) {
    pingMs = Math.round(pingSamples.reduce((a, b) => a + b, 0) / pingSamples.length);
  }

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

        if (typeof onProgress === 'function') {
          onProgress(Math.round(mbps * 10) / 10, pingMs);
        }
      }
    } catch (err) {
      console.warn('Fast.com stream test fallback on payload:', i, err);
    }
  }

  let finalMbps = 10;
  if (totalDurationSec > 0 && totalBytes > 0) {
    finalMbps = (totalBytes * 8) / (totalDurationSec * 1000000);
  } else if (navigator && navigator.connection && navigator.connection.downlink) {
    finalMbps = navigator.connection.downlink;
  }

  if (smoothedSpeed === null) {
    smoothedSpeed = finalMbps;
  } else {
    smoothedSpeed = (finalMbps * 0.4) + (smoothedSpeed * 0.6);
  }

  const safeMbps = smoothedSpeed * 0.8;
  return {
    safeMbps: Math.round(safeMbps * 10) / 10,
    rawMbps: Math.round(finalMbps * 10) / 10,
    pingMs: pingMs
  };
}

export function determineQuality(mbps, maxCapHeight = 360) {
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
