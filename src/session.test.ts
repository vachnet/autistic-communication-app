import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_WORDS } from './domain.ts';
import { initialSession, tapWord, finishSentence, editWord, sentenceWords, type Session } from './session.ts';

const word = (id: string) => SEED_WORDS.find(w => w.id === id)!;
const confirm = (state: Session, id: string) => tapWord(tapWord(state, word(id)).state, word(id)).state;

test('first tap previews without committing a word or advancing', () => {
  const result = tapWord(initialSession(), word('i'));
  assert.equal(result.confirmed, false);
  assert.equal(result.state.armed, 'i');
  assert.equal(result.state.stage, 'subject');
  assert.deepEqual(result.state.selection, {});
  assert.deepEqual(result.playback, [word('i')]);
});
test('second tap on the same card confirms and advances exactly one stage', () => {
  const preview = tapWord(initialSession(), word('i')).state;
  const result = tapWord(preview, word('i'));
  assert.equal(result.confirmed, true);
  assert.equal(result.state.stage, 'verb');
  assert.equal(result.state.armed, undefined);
  assert.equal(result.state.selection.subject?.id, 'i');
  assert.deepEqual(result.playback, []);
});
test('a different second card is previewed and requires its own confirmation', () => {
  const state = tapWord(initialSession(), word('i')).state;
  const next = tapWord(state, word('mother'));
  assert.equal(next.confirmed, false);
  assert.equal(next.state.armed, 'mother');
  assert.deepEqual(next.state.selection, {});
});
test('wrong-stage and semantically invalid cards cannot advance', () => {
  assert.equal(tapWord(initialSession(), word('eat')).confirmed, false);
  const state = confirm(initialSession(), 'building');
  assert.equal(tapWord(state, word('eat')).state, state);
});
test('all four stages lead to a single summary playback in sentence order', () => {
  let state = initialSession();
  for (const id of ['i', 'eat', 'rice']) state = confirm(state, id);
  const result = tapWord(tapWord(state, word('hot')).state, word('hot'));
  assert.equal(result.state.summary, true);
  assert.deepEqual(result.playback.map(w => w.id), ['i', 'eat', 'rice', 'hot']);
  assert.equal(tapWord(result.state, word('hot')).confirmed, false);
});
test('stop is unavailable before a verb and available after two or three words', () => {
  const initial = initialSession();
  assert.equal(finishSentence(initial), initial);
  const subject = confirm(initial, 'i');
  assert.equal(finishSentence(subject), subject);
  const two = confirm(subject, 'sleep');
  assert.equal(finishSentence(two).summary, true);
  assert.deepEqual(sentenceWords(two.selection).map(w => w.id), ['i', 'sleep']);
  const three = confirm(confirm(subject, 'eat'), 'rice');
  assert.equal(finishSentence(three).summary, true);
});
test('editing from summary preserves earlier words and clears every dependent word', () => {
  let state = initialSession();
  for (const id of ['i', 'eat', 'rice', 'hot']) state = confirm(state, id);
  const next = editWord(state, 'verb');
  assert.equal(next.summary, false);
  assert.equal(next.stage, 'verb');
  assert.deepEqual(sentenceWords(next.selection).map(w => w.id), ['i']);
  assert.equal(state.selection.modifier?.id, 'hot');
});
test('restart returns an independent empty session', () => {
  const first = initialSession();
  const next = confirm(first, 'i');
  assert.deepEqual(initialSession().selection, {});
  assert.equal(next.selection.subject?.id, 'i');
});
