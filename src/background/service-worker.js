import { measureSpeed, determineQuality } from './speed-tester.js';
import { MESSAGE_TYPES } from '../shared/constants.js';
import { DataSaverTracker } from './data-saver.js';
import { SleepTimerManager } from './sleep-timer.js';

const dataSaver = new DataSaverTracker();
const sleepTimer = new SleepTimerManager(() => {
  currentStatus.sleepTimerMinutes = 0;
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({}).then(tabs => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type: MESSAGE_TYPES.STOP_ALL_VIDEOS }).catch(() => {});
      }
    });
  }
});

let currentStatus = {
  mbps: 10,
  rawMbps: 10,
  pingMs: 25,
  targetQuality: determineQuality(10, 360),
  autoMode: true,
  maxCapHeight: 360,
  batterySaver: false,
  audioOnly: false,
  notificationsEnabled: true,
  sleepTimerMinutes: 0,
  exemptedDomains: [], // Array of whitelisted/disabled domain strings
  speedHistory: [10, 12, 11, 14, 10, 13, 15]
};

let previousQualityHeight = null;

async function updateNetworkStatus() {
  const speedMetrics = await measureSpeed();
  const mbps = typeof speedMetrics === 'object' ? speedMetrics.safeMbps : speedMetrics;
  
  currentStatus.rawMbps = typeof speedMetrics === 'object' ? speedMetrics.rawMbps : mbps;
  currentStatus.pingMs = typeof speedMetrics === 'object' ? speedMetrics.pingMs : 25;

  currentStatus.speedHistory.push(mbps);
  if (currentStatus.speedHistory.length > 10) {
    currentStatus.speedHistory.shift();
  }

  let effectiveCap = currentStatus.maxCapHeight;
  if (currentStatus.batterySaver) {
    effectiveCap = Math.min(effectiveCap, 360);
  }

  const targetQuality = determineQuality(mbps, effectiveCap);
  currentStatus.mbps = mbps;
  if (currentStatus.autoMode) {
    currentStatus.targetQuality = targetQuality;
  }

  if (previousQualityHeight && targetQuality.height < previousQualityHeight && currentStatus.notificationsEnabled) {
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('src/icons/icon-48.png'),
        title: 'badNET - Speed Drop Detected',
        message: `Network bandwidth dropped (${mbps} Mbps). Adjusted quality to ${targetQuality.quality} to prevent buffering.`
      }).catch(() => {});
    }
  }
  previousQualityHeight = targetQuality.height;

  dataSaver.recordSavings(currentStatus.audioOnly ? 240 : currentStatus.targetQuality.height);

  try {
    await chrome.storage.local.set({ 
      speedStatus: currentStatus,
      totalSavedMB: dataSaver.totalSavedMB 
    });
  } catch (e) {}

  if (typeof chrome !== 'undefined' && chrome.tabs) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.SPEED_UPDATED,
          payload: { ...currentStatus, totalSavedMB: dataSaver.totalSavedMB }
        }).catch(() => {});
      }
    }
  }
}

if (typeof chrome !== 'undefined' && chrome.commands) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-audio-only') {
      currentStatus.audioOnly = !currentStatus.audioOnly;
      updateNetworkStatus();
    } else if (command === 'force-speed-test') {
      updateNetworkStatus();
    }
  });
}

updateNetworkStatus();
setInterval(updateNetworkStatus, 15000);

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === MESSAGE_TYPES.GET_SPEED_STATUS) {
      sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
    } else if (message.type === MESSAGE_TYPES.FORCE_SPEED_TEST) {
      updateNetworkStatus().then(() => {
        sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
      });
      return true;
    } else if (message.type === MESSAGE_TYPES.TOGGLE_AUDIO_ONLY) {
      currentStatus.audioOnly = message.payload.audioOnly;
      updateNetworkStatus();
      sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
    } else if (message.type === MESSAGE_TYPES.SET_SLEEP_TIMER) {
      currentStatus.sleepTimerMinutes = message.payload.minutes;
      sleepTimer.setTimer(currentStatus.sleepTimerMinutes);
      sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
    } else if (message.type === MESSAGE_TYPES.TOGGLE_SITE_EXEMPTION) {
      const domain = message.payload.domain;
      if (domain) {
        const index = currentStatus.exemptedDomains.indexOf(domain);
        if (index > -1) {
          currentStatus.exemptedDomains.splice(index, 1);
        } else {
          currentStatus.exemptedDomains.push(domain);
        }
        updateNetworkStatus();
      }
      sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
    } else if (message.type === MESSAGE_TYPES.SET_MANUAL_OVERRIDE) {
      currentStatus.autoMode = message.payload.autoMode;
      if (!currentStatus.autoMode && message.payload.quality) {
        currentStatus.targetQuality = message.payload.quality;
      }
      updateNetworkStatus();
      sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
    } else if (message.type === MESSAGE_TYPES.SET_MAX_CAP) {
      currentStatus.maxCapHeight = message.payload.maxCapHeight;
      updateNetworkStatus();
      sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
    } else if (message.type === MESSAGE_TYPES.TOGGLE_BATTERY_SAVER) {
      currentStatus.batterySaver = message.payload.batterySaver;
      updateNetworkStatus();
      sendResponse({ ...currentStatus, totalSavedMB: dataSaver.totalSavedMB });
    }
    return true;
  });
}
