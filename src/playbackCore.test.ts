import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayback, type PlaybackAdapter } from './playbackCore.ts';
import { SEED_WORDS, type Word } from './domain.ts';

const word = (id: string) => SEED_WORDS.find(w => w.id === id)!;
const recorded: Word = { ...word('i'), audioUri: 'file:///custom.m4a' };
const flush = async () => { await new Promise<void>(r => setImmediate(r)); };
function harness(overrides: Partial<PlaybackAdapter> = {}) {
  const spoken: string[] = [];
  const completions: (() => void)[] = [];
  const failures: (() => void)[] = [];
  const timers = new Set<() => void>();
  const events: string[] = [];
  const adapter: PlaybackAdapter = {
    stopSpeech: async () => { events.push('stop'); },
    prepare: async () => { events.push('prepare'); },
    speak: (text, done, fail) => { spoken.push(text); completions.push(done); failures.push(fail); },
    player: () => ({
      play: () => { events.push('play'); }, remove: () => { events.push('remove'); },
      subscribe: done => { completions.push(done); return { remove: () => { events.push('unsubscribe'); } }; },
    }),
    schedule: cb => { timers.add(cb); return cb; },
    clearTimer: timer => { timers.delete(timer as () => void); },
    ...overrides,
  };
  return { controller: createPlayback(adapter), spoken, completions, failures, events, timers };
}
test('sentence audio is sequential and never repeats after completion', async () => {
  const h = harness(); const result = h.controller.play([word('i'), word('sleep')]);
  await flush(); assert.deepEqual(h.spoken, ['ฉัน']);
  h.completions[0](); await flush(); assert.deepEqual(h.spoken, ['ฉัน', 'นอน']);
  h.completions[1](); await result; await flush();
  assert.equal(h.spoken.length, 2); assert.equal(h.timers.size, 0);
});
test('cancel resolves current playback and never starts remaining words', async () => {
  const h = harness(); const result = h.controller.play([word('i'), word('sleep')]);
  await flush(); h.controller.stop(); await result;
  h.completions[0](); await flush();
  assert.deepEqual(h.spoken, ['ฉัน']); assert.equal(h.timers.size, 0);
});
test('replay replaces the old sentence rather than overlapping its remaining words', async () => {
  const h = harness(); const old = h.controller.play([word('i'), word('sleep')]);
  await flush(); const replay = h.controller.play([word('mother')]);
  await flush(); h.completions[0](); await flush();
  assert.deepEqual(h.spoken, ['ฉัน', 'แม่']);
  h.completions[1](); await Promise.all([old, replay]);
});
test('cancel while native preparation is pending prevents any sound', async () => {
  let ready!: () => void;
  const gate = new Promise<void>(r => { ready = r; });
  const h = harness({ prepare: () => gate });
  const result = h.controller.play([word('i')]);
  await flush(); h.controller.stop(); ready(); await result;
  assert.deepEqual(h.spoken, []);
});
test('recorded player and listener are released on completion', async () => {
  const h = harness(); const result = h.controller.play([recorded, word('sleep')]);
  await flush(); assert.ok(h.events.includes('play')); assert.deepEqual(h.spoken, []);
  h.completions[0](); await flush(); assert.deepEqual(h.spoken, ['นอน']);
  assert.equal(h.events.filter(e => e === 'remove').length, 1);
  assert.equal(h.events.filter(e => e === 'unsubscribe').length, 1);
  h.completions[1](); await result;
});
test('recorded player is released once when canceled', async () => {
  const h = harness(); const result = h.controller.play([recorded]);
  await flush(); h.controller.stop(); h.controller.stop(); await result;
  assert.equal(h.events.filter(e => e === 'remove').length, 1);
  assert.equal(h.events.filter(e => e === 'unsubscribe').length, 1);
  assert.equal(h.timers.size, 0);
});
test('missing voice rejects and prevents downstream playback', async () => {
  const h = harness(); const result = h.controller.play([word('i'), word('sleep')]);
  const rejected = assert.rejects(result, /Thai speech unavailable/);
  await flush(); h.failures[0](); await rejected;
  assert.deepEqual(h.spoken, ['ฉัน']); assert.equal(h.timers.size, 0);
});
test('watchdog rejects hung native playback and releases resources', async () => {
  const h = harness(); const result = h.controller.play([recorded]);
  const rejected = assert.rejects(result, /Audio timed out/);
  await flush(); [...h.timers][0](); await rejected;
  assert.equal(h.events.filter(e => e === 'remove').length, 1);
  assert.equal(h.timers.size, 0);
});
test('native player setup failure still releases the allocated player', async () => {
  let removed = 0;
  const h = harness({ player: () => ({ play: () => {}, remove: () => { removed++; }, subscribe: () => { throw new Error('listener failure'); } }) });
  await assert.rejects(h.controller.play([recorded]), /listener failure/);
  assert.equal(removed, 1);
});
test('synchronous speech failures clear the watchdog and remain visible', async () => {
  const h = harness({ speak: () => { throw new Error('native speech failure'); } });
  await assert.rejects(h.controller.play([word('i')]), /native speech failure/);
  assert.equal(h.timers.size, 0);
});
