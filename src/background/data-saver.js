export class DataSaverTracker {
  constructor() {
    this.totalSavedMB = 0;
    this.loadStats();
  }

  async loadStats() {
    try {
      const data = await chrome.storage.local.get(['totalSavedMB']);
      this.totalSavedMB = data.totalSavedMB || 0;
    } catch (e) {}
  }

  // Calculate saved MB when downscaling from high potential quality to actual target quality
  recordSavings(actualQualityHeight) {
    // Standard baseline assumes 1080p stream if unlimited
    const baselineMB = 30; // 1080p ~30MB/min
    const actualMB = actualQualityHeight >= 1080 ? 30 : actualQualityHeight >= 720 ? 15 : 7;
    const saved = Math.max(0, (baselineMB - actualMB) / 4); // Recorded per sample cycle
    
    this.totalSavedMB += saved;
    try {
      chrome.storage.local.set({ totalSavedMB: Math.round(this.totalSavedMB * 10) / 10 });
    } catch (e) {}
  }
}
