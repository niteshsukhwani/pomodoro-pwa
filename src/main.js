import './styles.css';
import {
  PHASES,
  advanceIfElapsed,
  pause,
  remaining,
  reset,
  resume,
  start,
} from './timer.js';
import { loadState, saveState } from './storage.js';

const phaseLabel = document.querySelector('#phase-label');
const timeDisplay = document.querySelector('#time');
const sessionDots = [...document.querySelectorAll('#session-dots span')];
const sessionDotsContainer = document.querySelector('#session-dots');
const sessionCount = document.querySelector('#session-count');
const toggleButton = document.querySelector('#toggle-button');
const resetButton = document.querySelector('#reset-button');

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
    return 4;
  }

  return state.completedFocusSessions % 4;
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
    `${completedDots} of 4 focus sessions completed in this set`,
  );

  sessionDots.forEach((dot, index) => {
    dot.classList.toggle('complete', index < completedDots);
  });

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
