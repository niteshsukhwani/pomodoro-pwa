const MINUTE = 60_000;

export const DEFAULT_SETTINGS = Object.freeze({
  focusMinutes: 25,
  breakMinutes: 5,
  sessionsPerCycle: 3,
});

export const PHASES = Object.freeze({
  focus: Object.freeze({ label: 'Focus' }),
  shortBreak: Object.freeze({ label: 'Short break' }),
  longBreak: Object.freeze({ label: 'Long break' }),
});

export function normalizeSettings(settings = {}) {
  return {
    focusMinutes: validInteger(settings.focusMinutes, 1, 120, DEFAULT_SETTINGS.focusMinutes),
    breakMinutes: validInteger(settings.breakMinutes, 1, 60, DEFAULT_SETTINGS.breakMinutes),
    sessionsPerCycle: validInteger(
      settings.sessionsPerCycle,
      1,
      12,
      DEFAULT_SETTINGS.sessionsPerCycle,
    ),
  };
}

export function phaseDurationMs(phase, settings) {
  if (phase === 'focus') {
    return settings.focusMinutes * MINUTE;
  }

  if (phase === 'shortBreak') {
    return settings.breakMinutes * MINUTE;
  }

  return 15 * MINUTE;
}

export function createInitialState(settings = DEFAULT_SETTINGS) {
  const normalizedSettings = normalizeSettings(settings);

  return {
    phase: 'focus',
    status: 'idle',
    remainingMs: phaseDurationMs('focus', normalizedSettings),
    endsAt: null,
    completedFocusSessions: 0,
    settings: normalizedSettings,
  };
}

export function remaining(state, now = Date.now()) {
  if (state.status === 'running') {
    return Math.max(0, state.endsAt - now);
  }

  return state.remainingMs;
}

export function start(state, now = Date.now()) {
  if (state.status === 'running') {
    return state;
  }

  return {
    ...state,
    status: 'running',
    remainingMs: null,
    endsAt: now + remaining(state, now),
  };
}

export function pause(state, now = Date.now()) {
  if (state.status !== 'running') {
    return state;
  }

  return {
    ...state,
    status: 'paused',
    remainingMs: remaining(state, now),
    endsAt: null,
  };
}

export function resume(state, now = Date.now()) {
  if (state.status !== 'paused') {
    return state;
  }

  return start(state, now);
}

export function reset(state) {
  return {
    ...state,
    status: 'idle',
    remainingMs: phaseDurationMs(state.phase, state.settings),
    endsAt: null,
  };
}

export function applySettings(state, settings) {
  const normalizedSettings = normalizeSettings(settings);

  return {
    ...state,
    status: 'idle',
    remainingMs: phaseDurationMs(state.phase, normalizedSettings),
    endsAt: null,
    settings: normalizedSettings,
  };
}

export function advance(state) {
  const completedFocusSessions =
    state.phase === 'focus'
      ? state.completedFocusSessions + 1
      : state.completedFocusSessions;

  const phase =
    state.phase === 'focus'
      ? completedFocusSessions % state.settings.sessionsPerCycle === 0
        ? 'longBreak'
        : 'shortBreak'
      : 'focus';

  return {
    phase,
    status: 'idle',
    remainingMs: phaseDurationMs(phase, state.settings),
    endsAt: null,
    completedFocusSessions,
    settings: state.settings,
  };
}

export function advanceIfElapsed(state, now = Date.now()) {
  if (state.status !== 'running' || remaining(state, now) > 0) {
    return state;
  }

  return advance(state);
}

function validInteger(value, minimum, maximum, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : fallback;
}
