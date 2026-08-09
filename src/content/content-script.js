class FallbackManager {
  constructor() {
    this.canvasMap = new WeakMap();
    this.bufferCheckIntervals = new WeakMap();
  }

  findClosestQuality(availableHeights, targetHeight) {
    if (!availableHeights || availableHeights.length === 0) return null;
    const sorted = [...availableHeights].sort((a, b) => b - a);
    for (const h of sorted) {
      if (h <= targetHeight) return h;
    }
    return sorted[sorted.length - 1];
  }

  enableSmartBuffering(video, targetQuality) {
    if (this.bufferCheckIntervals.has(video)) return;

    const intervalId = setInterval(() => {
      if (video.paused || video.ended) return;

      const currentTime = video.currentTime;
      let bufferedAhead = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= currentTime && video.buffered.end(i) >= currentTime) {
          bufferedAhead = video.buffered.end(i) - currentTime;
          break;
        }
      }

      if (bufferedAhead < 3 && targetQuality.height <= 480) {
        if (video.playbackRate !== 0.8) {
          video.playbackRate = 0.8;
        }
      } else {
        if (video.playbackRate !== 1.0) {
          video.playbackRate = 1.0;
        }
      }
    }, 1000);

    this.bufferCheckIntervals.set(video, intervalId);
  }

  enableCanvasDownscaler(video, targetQuality) {
    if (targetQuality.height >= 720) {
      this.disableCanvasDownscaler(video);
      return;
    }

    if (this.canvasMap.has(video)) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const aspectRatio = (video.videoWidth || 16) / (video.videoHeight || 9);
    canvas.height = targetQuality.height;
    canvas.width = Math.round(targetQuality.height * aspectRatio);

    canvas.style.position = 'relative';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.className = 'badnet-canvas-fallback';

    video.style.display = 'none';
    video.parentNode.insertBefore(canvas, video.nextSibling);

    let animationFrameId;
    const render = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    this.canvasMap.set(video, { canvas, animationFrameId });
  }

  disableCanvasDownscaler(video) {
    if (this.canvasMap.has(video)) {
      const { canvas, animationFrameId } = this.canvasMap.get(video);
      cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      video.style.display = '';
      this.canvasMap.delete(video);
    }
  }
}

const fallbackManager = new FallbackManager();

// Inject YouTube main-world helper if on YouTube
if (window.location.hostname.includes('youtube.com')) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('src/content/youtube-inject.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
}

function isAdPlaying() {
  if (window.location.hostname.includes('youtube.com')) {
    return document.querySelector('.ad-showing, .video-ads, .ytp-ad-player-overlay') !== null;
  }
  const adVideo = document.querySelector('video[src*="ad"], .ad-container video, .video-ad');
  return adVideo !== null;
}

function handleAudioOnlyMode(isAudioOnly) {
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    if (isAudioOnly) {
      video.style.visibility = 'hidden';
    } else {
      video.style.visibility = '';
    }
  });
}

function stopAllVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    try {
      video.pause();
    } catch (e) {}
  });
}

function applyQualityToGeneralVideos(targetQuality) {
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    const sources = Array.from(video.querySelectorAll('source'));
    
    if (sources.length > 0) {
      const heights = sources.map(src => {
        const resLabel = src.getAttribute('res') || src.getAttribute('label') || '';
        const match = resLabel.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      }).filter(Boolean);

      const chosenHeight = fallbackManager.findClosestQuality(heights, targetQuality.height);
      if (chosenHeight) {
        const matchedSource = sources.find(src => {
          const resLabel = src.getAttribute('res') || src.getAttribute('label') || '';
          return resLabel.includes(chosenHeight.toString());
        });
        if (matchedSource && video.src !== matchedSource.src) {
          video.src = matchedSource.src;
        }
      }
    } else {
      fallbackManager.enableSmartBuffering(video, targetQuality);
      fallbackManager.enableCanvasDownscaler(video, targetQuality);
    }
  });
}

function isCurrentSiteExempted(exemptedDomains) {
  if (!exemptedDomains || !Array.isArray(exemptedDomains)) return false;
  const currentHost = window.location.hostname;
  return exemptedDomains.some(domain => currentHost.includes(domain));
}

function applyQuality(status) {
  if (!status) return;

  // If current site is exempted/whitelisted, do not modify video quality
  if (isCurrentSiteExempted(status.exemptedDomains)) {
    handleAudioOnlyMode(false);
    return;
  }

  if (status.audioOnly !== undefined) {
    handleAudioOnlyMode(status.audioOnly);
  }

  if (isAdPlaying() && status.autoMode) {
    const adQuality = { quality: '360p', ytQuality: 'medium', height: 360 };
    if (window.location.hostname.includes('youtube.com')) {
      window.dispatchEvent(new CustomEvent('badnet_set_quality', {
        detail: { ytQuality: 'medium' }
      }));
    } else {
      applyQualityToGeneralVideos(adQuality);
    }
    return;
  }

  if (!status.targetQuality) return;

  if (window.location.hostname.includes('youtube.com')) {
    window.dispatchEvent(new CustomEvent('badnet_set_quality', {
      detail: { ytQuality: status.targetQuality.ytQuality }
    }));
  } else {
    applyQualityToGeneralVideos(status.targetQuality);
  }
}

setInterval(() => {
  if (isAdPlaying()) {
    applyQuality({ autoMode: true, targetQuality: { quality: '360p', ytQuality: 'medium', height: 360 } });
  }
}, 2000);

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.sendMessage({ type: 'GET_SPEED_STATUS' }, (response) => {
    if (response) applyQuality(response);
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SPEED_UPDATED') {
      applyQuality(message.payload);
    } else if (message.type === 'STOP_ALL_VIDEOS') {
      stopAllVideos();
    }
  });
}
