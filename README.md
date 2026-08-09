# badNET - Adaptive Video Quality Chrome Extension

**badNET** is a state-of-the-art Manifest V3 Chrome Extension engineered to dynamically monitor real-time internet bandwidth and latency, automatically optimizing video playback quality across YouTube, HTML5 video players, and single-source video elements.

---

## ⚡ Key Features

- **🌐 Real-Time Bandwidth & Latency Monitoring**: Combines browser `Network Information API` metrics with periodic background pings to compute precise real-time Mbps.
- **🎬 Auto Ad-Quality Saver**: Detects video advertisements (YouTube & general HTML5) and automatically drops quality to **360p** during ads, restoring HD quality once the video resumes.
- **⌨️ Global Keyboard Shortcuts**:
  - `Alt + A`: Instantly toggle Audio-Only / Radio Mode from anywhere in Chrome.
  - `Alt + S`: Force an immediate network speed re-test.
- **🚨 Speed Drop Desktop Notifications**: Displays Chrome OS / Windows desktop notifications when internet bandwidth experiences a sudden drop to inform you of quality adjustments.
- **🎵 Audio-Only / Radio Mode**: Toggle Audio-Only mode to hide video displays while listening to music or podcasts, yielding up to **95% internet data savings**.
- **⏱️ Sleep Timer (Auto Pause)**: Set a 15 min, 30 min, or 1 hour sleep timer to automatically pause playing videos if you fall asleep, protecting your quota.
- **📊 Live Canvas Speed Graph**: Renders a smooth, real-time connection speed graph inside the popup dashboard.
- **💾 Data & Quota Saver Counter**: Tracks saved bandwidth (MB / GB) in real-time.
- **🔋 Battery Saver Mode**: Dynamically caps maximum video quality at 720p to reduce GPU load, heating, and battery consumption on laptops.
- **⚙️ Max Quality Ceiling**: User-definable ceiling (`No Limit`, `1080p`, `720p`, `480p`, `360p`) preventing quality spikes on unstable connections.
- **📈 EMA Speed Smoothing & Safety Margin**: Smooths out sudden network fluctuations using Exponential Moving Average (EMA) and applies a 25% safety margin.
- **▶️ YouTube Player API Integration**: Direct main-world injection to control YouTube player resolutions (`setPlaybackQualityRange`, `setVideoQuality`).
- **🛡️ Single-Source Video Fallbacks**:
  - **Canvas Downscaling**: Renders single-source HD videos onto a downscaled HTML5 Canvas on slow connections.
  - **Smart Pre-Bufferer**: Monitors video buffer health (`buffered.end`) and dynamically adjusts `playbackRate` to prevent micro-stuttering.

---

## 📊 Resolution & Bandwidth Thresholds

| Internet Speed (Mbps) | Target Resolution | YouTube Quality Tag | Estimated Data Usage |
| :--- | :--- | :--- | :--- |
| **>= 25 Mbps** | `2160p` (4K) | `hd2160` | ~120 MB / min |
| **14 - 25 Mbps** | `1440p` (2K) | `hd1440` | ~60 MB / min |
| **8 - 14 Mbps** | `1080p` (Full HD) | `hd1080` | ~30 MB / min |
| **3.5 - 8 Mbps** | `720p` (HD) | `hd720` | ~15 MB / min |
| **1.5 - 3.5 Mbps** | `480p` | `large` | ~7 MB / min |
| **< 1.5 Mbps** | `360p` / `240p` | `medium` / `small` | ~4 MB / min |

---

## ⌨️ Keyboard Shortcuts

- `Alt + A` — Toggle Audio-Only Mode on/off.
- `Alt + S` — Force immediate network speed re-test.

---

## 📦 Installation Guide

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked**.
5. Select the `badNET` root directory.

---

## 📂 Architecture & Project Structure

```
badNET/
├── manifest.json                # Manifest V3 extension configuration & shortcuts
├── README.md                    # Comprehensive documentation
└── src/
    ├── background/
    │   ├── service-worker.js    # Service worker handling notifications & shortcuts
    │   ├── speed-tester.js      # EMA speed measurement & resolution decision engine
    │   ├── data-saver.js        # Data savings counter & quota estimator
    │   └── sleep-timer.js      # Sleep timer manager for auto video pausing
    ├── content/
    │   ├── content-script.js    # Combined content script, ad-detector & fallbacks
    │   └── youtube-inject.js    # Main-world script for YouTube Player API integration
    ├── popup/
    │   ├── popup.html           # Dark-themed extension popup markup with Plus Jakarta Sans
    │   ├── popup.css            # Extension popup styling
    │   └── popup.js             # Extension popup interactive logic with Canvas graph
    ├── icons/
    │   ├── icon-16.png          # Chrome Toolbar Icon 16x16
    │   ├── icon-32.png          # Chrome Toolbar Icon 32x32
    │   ├── icon-48.png          # Extensions Management Icon 48x48
    │   └── icon-128.png         # Web Store Icon 128x128
    └── shared/
        └── constants.js         # Resolution mappings & messaging constants
```

---

## 📄 License

MIT License. Free for personal and commercial use.
