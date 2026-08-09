export class SleepTimerManager {
  constructor(onTimerExpired) {
    this.timerId = null;
    this.onTimerExpired = onTimerExpired;
  }

  setTimer(minutes) {
    this.clearTimer();
    if (minutes <= 0) return;

    this.timerId = setTimeout(() => {
      if (typeof this.onTimerExpired === 'function') {
        this.onTimerExpired();
      }
      this.timerId = null;
    }, minutes * 60 * 1000);
  }

  clearTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
