import {
  PHASES,
  advanceIfElapsed,
  createInitialState,
  normalizeSettings,
} from './timer.js';

const STORAGE_KEY = 'pomodoro-state-v1';
const STATUSES = new Set(['idle', 'running', 'paused']);

function isValidState(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const hasValidClock =
    value.status === 'running'
      ? Number.isFinite(value.endsAt)
      : Number.isFinite(value.remainingMs) && value.remainingMs >= 0;

  return (
    Object.hasOwn(PHASES, value.phase) &&
    STATUSES.has(value.status) &&
    hasValidClock &&
    Number.isInteger(value.completedFocusSessions) &&
    value.completedFocusSessions >= 0
  );
}

export function loadState(now = Date.now()) {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const migratedState =
      stored && typeof stored === 'object'
        ? { ...stored, settings: normalizeSettings(stored.settings) }
        : stored;

    if (!isValidState(migratedState)) {
      return createInitialState();
    }

    return advanceIfElapsed(migratedState, now);
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The timer continues to work if storage is unavailable or full.
  }
}
