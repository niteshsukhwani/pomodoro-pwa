import './styles.css';
import {
  PHASES,
  advanceIfElapsed,
  applySettings,
  pause,
  remaining,
  reset,
  resume,
  start,
} from './timer.js';
import { loadState, saveState } from './storage.js';

const phaseLabel = document.querySelector('#phase-label');
const timeDisplay = document.querySelector('#time');
const sessionDotsContainer = document.querySelector('#session-dots');
const sessionCount = document.querySelector('#session-count');
const toggleButton = document.querySelector('#toggle-button');
const resetButton = document.querySelector('#reset-button');
const settingsButton = document.querySelector('#settings-button');
const settingsDialog = document.querySelector('#settings-dialog');
const settingsForm = document.querySelector('#settings-form');
const closeSettingsButton = document.querySelector('#close-settings');
const focusMinutesInput = document.querySelector('#focus-minutes');
const breakMinutesInput = document.querySelector('#break-minutes');
const sessionsPerCycleInput = document.querySelector('#sessions-per-cycle');

let state = loadState();

function commit(nextState) {
  state = nextState;
  saveState(state);
  render();
}

function formatTime(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function completedInCurrentSet() {
  if (state.phase === 'longBreak') {
    return state.settings.sessionsPerCycle;
  }

  return state.completedFocusSessions % state.settings.sessionsPerCycle;
}

function renderSessionDots(completedDots) {
  const dotCount = state.settings.sessionsPerCycle;

  if (sessionDotsContainer.children.length !== dotCount) {
    const dots = Array.from({ length: dotCount }, () =>
      document.createElement('span'),
    );
    sessionDotsContainer.replaceChildren(...dots);
  }

  [...sessionDotsContainer.children].forEach((dot, index) => {
    dot.classList.toggle('complete', index < completedDots);
  });
}

function render() {
  const now = Date.now();
  const reconciledState = advanceIfElapsed(state, now);

  if (reconciledState !== state) {
    state = reconciledState;
    saveState(state);
  }

  const milliseconds = remaining(state, now);
  const displayTime = formatTime(milliseconds);
  const completedDots = completedInCurrentSet();
  const completedLabel =
    state.completedFocusSessions === 1 ? 'focus session' : 'focus sessions';

  phaseLabel.textContent = PHASES[state.phase].label;
  timeDisplay.textContent = displayTime;
  timeDisplay.setAttribute(
    'aria-label',
    `${Math.ceil(milliseconds / 60_000)} minutes remaining`,
  );
  toggleButton.textContent = state.status === 'running' ? 'Pause' : 'Start';
  sessionCount.textContent =
    `${state.completedFocusSessions} ${completedLabel} completed`;
  sessionDotsContainer.setAttribute(
    'aria-label',
    `${completedDots} of ${state.settings.sessionsPerCycle} focus sessions completed in this set`,
  );
  renderSessionDots(completedDots);

  document.title = `${displayTime} · ${PHASES[state.phase].label}`;
}

toggleButton.addEventListener('click', () => {
  if (state.status === 'running') {
    commit(pause(state));
    return;
  }

  commit(state.status === 'paused' ? resume(state) : start(state));
});

resetButton.addEventListener('click', () => {
  commit(reset(state));
});

settingsButton.addEventListener('click', () => {
  focusMinutesInput.value = state.settings.focusMinutes;
  breakMinutesInput.value = state.settings.breakMinutes;
  sessionsPerCycleInput.value = state.settings.sessionsPerCycle;
  settingsDialog.showModal();
  focusMinutesInput.focus();
});

closeSettingsButton.addEventListener('click', () => {
  settingsDialog.close();
});

settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();

  commit(
    applySettings(state, {
      focusMinutes: Number(focusMinutesInput.value),
      breakMinutes: Number(breakMinutesInput.value),
      sessionsPerCycle: Number(sessionsPerCycleInput.value),
    }),
  );
  settingsDialog.close();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    render();
  }

  saveState(state);
});

render();
window.setInterval(render, 250);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
