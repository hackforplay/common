let uniqueId = 0;
const timers = {};

export default function register(_global) {
  _global.setTimeout = _setTimeout;
  _global.clearTimeout = _clearTimeout;
  _global.setInterval = _setInterval;
  _global.clearInterval = _clearInterval;
}

const __setTimeout = setTimeout;
export function _setTimeout() {
  const timer = __setTimeout.apply(this, arguments);
  timers[uniqueId + 1] = timer;
  return ++uniqueId;
}

const __clearTimeout = clearTimeout;
export function _clearTimeout(timerId) {
  if (typeof timerId === "number") {
    const timer = timers[timerId];
    if (timer) {
      __clearTimeout(timer);
      delete timers[timerId];
    }
  } else {
    __clearTimeout(timerId);
  }
}

const __setInterval = setInterval;
export function _setInterval() {
  const timer = __setInterval.apply(this, arguments);
  timers[uniqueId + 1] = timer;
  return ++uniqueId;
}

const __clearInterval = clearInterval;
export function _clearInterval(timerId) {
  if (typeof timerId === "number") {
    const timer = timers[timerId];
    if (timer) {
      __clearInterval(timer);
      delete timers[timerId];
    }
  } else {
    __clearInterval(timerId);
  }
}
