const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const app = readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function createTimer() {
  let clock = 0;
  let nextFrame = 0;
  const frames = new Map();
  const elements = new Map();

  function element() {
    const listeners = new Map();
    const classes = new Set();
    return {
      value: '',
      checked: false,
      style: {},
      dataset: {},
      classList: {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        contains: (name) => classes.has(name),
        toggle(name, force) {
          if (force === undefined ? !classes.has(name) : force) classes.add(name);
          else classes.delete(name);
        },
      },
      addEventListener: (type, callback) => listeners.set(type, callback),
      click() { listeners.get('click')?.(); },
      change() { listeners.get('change')?.(); },
      input() { listeners.get('input')?.(); },
    };
  }

  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelector: () => element(),
    querySelectorAll: () => [],
    addEventListener() {},
    body: element(),
    documentElement: element(),
  };
  const window = {
    location: { search: '' },
    addEventListener() {},
  };
  const storage = new Map();
  class FakeDate extends Date {
    static now() { return clock; }
  }
  const context = {
    document,
    window,
    navigator: {},
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    Date: FakeDate,
    URLSearchParams,
    fetch: () => new Promise(() => {}),
    requestAnimationFrame(callback) {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    setTimeout() {},
  };
  vm.runInNewContext(app, context);

  return {
    get: (id) => document.getElementById(id),
    advance(ms) {
      clock += ms;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(clock));
    },
  };
}

test('pausing freezes the countdown and resuming uses the remaining time', () => {
  const timer = createTimer();
  timer.get('autoRestart').checked = false;
  timer.get('minutesInput').value = '0';
  timer.get('secondsInput').value = '15';
  timer.get('secondsInput').change();

  timer.get('startPauseBtn').click();
  timer.advance(4000);
  assert.equal(timer.get('time').textContent, '00:11');

  timer.get('startPauseBtn').click();
  timer.advance(30000);
  assert.equal(timer.get('time').textContent, '00:11');
  assert.equal(timer.get('rotationCount').textContent, '0');

  timer.get('startPauseBtn').click();
  timer.advance(10000);
  assert.equal(timer.get('time').textContent, '00:01');
  timer.advance(1000);
  assert.equal(timer.get('time').textContent, '00:00');
  assert.equal(timer.get('rotationCount').textContent, '1');
  assert.equal(timer.get('statusLabel').textContent, 'Zmiana!');

  timer.advance(5000);
  assert.equal(timer.get('rotationCount').textContent, '1');
});
