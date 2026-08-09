export const RESOLUTION_THRESHOLDS = [
  { minMbps: 25, quality: '2160p', ytQuality: 'hd2160', height: 2160, mbPerMin: 120 },
  { minMbps: 14, quality: '1440p', ytQuality: 'hd1440', height: 1440, mbPerMin: 60 },
  { minMbps: 8, quality: '1080p', ytQuality: 'hd1080', height: 1080, mbPerMin: 30 },
  { minMbps: 3.5, quality: '720p', ytQuality: 'hd720', height: 720, mbPerMin: 15 },
  { minMbps: 1.5, quality: '480p', ytQuality: 'large', height: 480, mbPerMin: 7 },
  { minMbps: 0, quality: '360p', ytQuality: 'medium', height: 360, mbPerMin: 4 }
];

export const MESSAGE_TYPES = {
  SPEED_UPDATED: 'SPEED_UPDATED',
  GET_SPEED_STATUS: 'GET_SPEED_STATUS',
  SET_MANUAL_OVERRIDE: 'SET_MANUAL_OVERRIDE',
  SET_MAX_CAP: 'SET_MAX_CAP',
  GET_STATS: 'GET_STATS',
  TOGGLE_BATTERY_SAVER: 'TOGGLE_BATTERY_SAVER',
  FORCE_SPEED_TEST: 'FORCE_SPEED_TEST',
  TOGGLE_AUDIO_ONLY: 'TOGGLE_AUDIO_ONLY',
  SET_SLEEP_TIMER: 'SET_SLEEP_TIMER',
  STOP_ALL_VIDEOS: 'STOP_ALL_VIDEOS',
  TOGGLE_SITE_EXEMPTION: 'TOGGLE_SITE_EXEMPTION'
};
