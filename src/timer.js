const MINUTE = 60_000;

export const PHASES = Object.freeze({
  focus: Object.freeze({ label: 'Focus', durationMs: 25 * MINUTE }),
  shortBreak: Object.freeze({ label: 'Short break', durationMs: 5 * MINUTE }),
  longBreak: Object.freeze({ label: 'Long break', durationMs: 15 * MINUTE }),
});

export function createInitialState() {
  return {
    phase: 'focus',
    status: 'idle',
    remainingMs: PHASES.focus.durationMs,
    endsAt: null,
    completedFocusSessions: 0,
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
    remainingMs: PHASES[state.phase].durationMs,
    endsAt: null,
  };
}

export function advance(state) {
  const completedFocusSessions =
    state.phase === 'focus'
      ? state.completedFocusSessions + 1
      : state.completedFocusSessions;

  const phase =
    state.phase === 'focus'
      ? completedFocusSessions % 4 === 0
        ? 'longBreak'
        : 'shortBreak'
      : 'focus';

  return {
    phase,
    status: 'idle',
    remainingMs: PHASES[phase].durationMs,
    endsAt: null,
    completedFocusSessions,
  };
}

export function advanceIfElapsed(state, now = Date.now()) {
  if (state.status !== 'running' || remaining(state, now) > 0) {
    return state;
  }

  return advance(state);
}
