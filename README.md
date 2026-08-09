# badNET - Adaptive Video Quality Chrome Extension

**badNET** is a state-of-the-art Manifest V3 Chrome Extension engineered to dynamically monitor real-time internet bandwidth and latency, automatically optimizing video playback quality across YouTube, HTML5 video players, and single-source video elements.

---

## ⚡ Comprehensive Feature Suite

- **🌐 Fast.com-Style Deep Speed Benchmark**: Multi-payload streaming speed tester measuring exact bandwidth, **Ping Latency (ms)**, and **Peak Download Speed (Mbps)**.
- **🛡️ Domain Whitelist & Site Exemption Manager**: One-click **Disable on Current Site** button in the popup toolbar to easily exclude specific domains (e.g. `netflix.com`, `twitch.tv`) from quality downscaling.
- **⚙️ 360p Default Max Quality Ceiling**: Pre-configured with a default **360p Maximum Quality Ceiling** to preserve bandwidth out-of-the-box, with instant options to select 480p, 720p, 1080p, or 4K.
- **🎬 Auto Ad-Quality Saver**: Detects video advertisements (YouTube & general HTML5) and automatically drops quality to **360p** during ads, restoring HD quality once the video resumes.
- **⌨️ Global Keyboard Shortcuts**:
  - `Alt + A`: Instantly toggle Audio-Only / Radio Mode from anywhere in Chrome.
  - `Alt + S`: Force an immediate network speed re-test.
- **🚨 Speed Drop Desktop Notifications**: Displays Chrome OS / Windows desktop notifications when internet bandwidth experiences a sudden drop.
- **🎵 Audio-Only / Radio Mode**: Toggle Audio-Only mode to hide video displays while listening to music, yielding up to **95% internet data savings**.
- **⏱️ Sleep Timer (Auto Pause)**: Set a 15 min, 30 min, or 1 hour sleep timer to automatically pause playing videos if you fall asleep, protecting your quota.
- **📊 Live Canvas Speed Graph & Telemetry Strip**: Renders a smooth, real-time connection speed graph alongside detailed **Ping (ms)** and **Peak Speed (Mbps)** metrics inside the popup.
- **💾 Data & Quota Saver Counter**: Tracks saved bandwidth (MB / GB) in real-time.
- **🔋 Battery Saver Mode**: Dynamically caps maximum video quality at 360p/720p to reduce GPU load, heating, and battery consumption on laptops.
- **📈 EMA Speed Smoothing & Safety Margin**: Smooths out network fluctuations using Exponential Moving Average (EMA) and applies a 20% safety margin.

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

## 📦 Installation Guide

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top right corner.
4. Click **Load unpacked**.
5. Select the `badNET` root directory.

---

## 📄 License

MIT License. Free for personal and commercial use.
