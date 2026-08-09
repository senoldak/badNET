import { MESSAGE_TYPES } from '../shared/constants.js';

const speedValue = document.getElementById('speedValue');
const qualityBadge = document.getElementById('qualityBadge');
const autoToggle = document.getElementById('autoToggle');
const maxCapSelect = document.getElementById('maxCapSelect');
const overrideSelect = document.getElementById('overrideSelect');
const savedDataValue = document.getElementById('savedDataValue');
const audioToggle = document.getElementById('audioToggle');
const sleepTimerSelect = document.getElementById('sleepTimerSelect');
const retestBtn = document.getElementById('retestBtn');
const pingVal = document.getElementById('pingVal');
const rawSpeedVal = document.getElementById('rawSpeedVal');
const graphCanvas = document.getElementById('speedGraph');
const ctx = graphCanvas ? graphCanvas.getContext('2d') : null;

function drawSpeedGraph(history = []) {
  if (!ctx || history.length === 0) return;
  const w = graphCanvas.width;
  const h = graphCanvas.height;

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  const maxVal = Math.max(...history, 25);
  const stepX = w / (history.length - 1 || 1);

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
  gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  ctx.beginPath();
  history.forEach((val, index) => {
    const x = index * stepX;
    const y = h - ((val / maxVal) * (h - 10)) - 5;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  history.forEach((val, index) => {
    const x = index * stepX;
    const y = h - ((val / maxVal) * (h - 10)) - 5;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function updateUI(status) {
  if (!status) return;
  speedValue.textContent = status.mbps || '--';
  if (pingVal) pingVal.textContent = status.pingMs ? `${status.pingMs} ms` : '-- ms';
  if (rawSpeedVal) rawSpeedVal.textContent = status.rawMbps ? `${status.rawMbps} Mbps` : '-- Mbps';

  if (status.targetQuality) {
    const badgeText = status.audioOnly 
      ? `Audio-Only Mode (Active)`
      : status.autoMode 
      ? `Auto Mode (${status.targetQuality.quality})`
      : `Manual Override (${status.targetQuality.quality})`;
    qualityBadge.querySelector('.badge-text').textContent = badgeText;
  }
  autoToggle.checked = status.autoMode;
  overrideSelect.disabled = status.autoMode;
  if (status.targetQuality) {
    overrideSelect.value = status.targetQuality.quality;
  }
  if (status.maxCapHeight) {
    maxCapSelect.value = status.maxCapHeight.toString();
  }
  if (typeof status.totalSavedMB === 'number') {
    savedDataValue.textContent = status.totalSavedMB >= 1024 
      ? `${(status.totalSavedMB / 1024).toFixed(1)} GB`
      : `${status.totalSavedMB} MB`;
  }
  if (audioToggle) audioToggle.checked = !!status.audioOnly;
  if (sleepTimerSelect && status.sleepTimerMinutes !== undefined) {
    sleepTimerSelect.value = status.sleepTimerMinutes.toString();
  }

  if (status.speedHistory) {
    drawSpeedGraph(status.speedHistory);
  }
}

function getYTQuality(quality) {
  const map = {
    '2160p': 'hd2160',
    '1440p': 'hd1440',
    '1080p': 'hd1080',
    '720p': 'hd720',
    '480p': 'large',
    '360p': 'medium'
  };
  return map[quality] || 'hd720';
}

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SPEED_STATUS }, updateUI);

  retestBtn.addEventListener('click', () => {
    retestBtn.textContent = ' Testing...';
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.FORCE_SPEED_TEST }, (status) => {
      updateUI(status);
      retestBtn.textContent = '⚡ Test Speed';
    });
  });

  autoToggle.addEventListener('change', () => {
    const autoMode = autoToggle.checked;
    overrideSelect.disabled = autoMode;
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SET_MANUAL_OVERRIDE,
      payload: { autoMode }
    }, updateUI);
  });

  maxCapSelect.addEventListener('change', () => {
    const maxCapHeight = parseInt(maxCapSelect.value, 10);
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SET_MAX_CAP,
      payload: { maxCapHeight }
    }, updateUI);
  });

  audioToggle.addEventListener('change', () => {
    const audioOnly = audioToggle.checked;
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TOGGLE_AUDIO_ONLY,
      payload: { audioOnly }
    }, updateUI);
  });

  sleepTimerSelect.addEventListener('change', () => {
    const minutes = parseInt(sleepTimerSelect.value, 10);
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SET_SLEEP_TIMER,
      payload: { minutes }
    }, updateUI);
  });

  overrideSelect.addEventListener('change', () => {
    const selectedQuality = overrideSelect.value;
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SET_MANUAL_OVERRIDE,
      payload: {
        autoMode: false,
        quality: { quality: selectedQuality, ytQuality: getYTQuality(selectedQuality) }
      }
    }, updateUI);
  });
}
