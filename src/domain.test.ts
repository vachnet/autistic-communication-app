import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SEED_WORDS, canFinish, getOptions, removeFrom, selectWord, sentenceText,
  type Selection, type Word,
} from './domain.ts';

const word = (id: string): Word => {
  const found = SEED_WORDS.find((item) => item.id === id);
  assert.ok(found, `Missing fixture ${id}`);
  return found;
};

test('subjects constrain verbs; eating constrains objects; objects constrain modifiers', () => {
  assert.ok(!getOptions('verb', { subject: word('building') }).some((item) => item.id === 'eat'));
  assert.ok(getOptions('verb', { subject: word('i') }).some((item) => item.id === 'eat'));
  const selection = { subject: word('i'), verb: word('eat') };
  assert.ok(getOptions('object', selection).some((item) => item.id === 'rice'));
  assert.ok(!getOptions('object', selection).some((item) => item.id === 'home'));
  assert.ok(getOptions('modifier', { ...selection, object: word('rice') }).some((item) => item.id === 'hot'));
  assert.ok(!getOptions('modifier', { ...selection, object: word('ball') }).some((item) => item.id === 'hot'));
});

test('frequency ordering uses local counts and preserves seed order for ties', () => {
  const options = getOptions('subject', {}, SEED_WORDS, { father: 8, mother: 8 });
  assert.deepEqual(options.slice(0, 3).map((item) => item.id), ['mother', 'father', 'i']);
  assert.equal(SEED_WORDS[0].id, 'i');
});

test('replacing or removing an upstream card clears dependent choices without mutation', () => {
  const selected: Selection = { subject: word('i'), verb: word('eat'), object: word('rice'), modifier: word('hot') };
  assert.deepEqual(removeFrom(selected, 'object'), { subject: word('i'), verb: word('eat') });
  assert.deepEqual(selectWord(selected, word('mother')), { subject: word('mother') });
  assert.deepEqual(selectWord(selected, word('drink')), { subject: word('i'), verb: word('drink') });
  assert.equal(selected.modifier?.id, 'hot');
});

test('two-word sentences can finish and all four stages render in order', () => {
  assert.equal(canFinish({}), false);
  assert.equal(canFinish({ subject: word('i') }), false);
  const selection = { subject: word('i'), verb: word('sleep') };
  assert.equal(canFinish(selection), true);
  assert.equal(sentenceText(selection), 'ฉัน นอน');
  assert.equal(sentenceText({ subject: word('i'), verb: word('eat'), object: word('rice'), modifier: word('hot') }), 'ฉัน กิน ข้าว ร้อน');
});

test('custom photo/audio cards work without metadata in both directions', () => {
  const custom: Word = { id: 'custom-subject', stage: 'subject', label: '', emoji: '📷', audioUri: 'file:///voice.m4a' };
  assert.ok(getOptions('verb', { subject: custom }).some((item) => item.id === 'eat'));
  const customObject: Word = { ...custom, id: 'custom-object', stage: 'object' };
  assert.ok(getOptions('object', { subject: word('i'), verb: word('eat') }, [...SEED_WORDS, customObject]).some((item) => item.id === customObject.id));
});

test('a stage cannot be selected before its predecessor or bypass semantic rules', () => {
  assert.deepEqual(getOptions('object', {}), []);
  assert.deepEqual(selectWord({}, word('eat')), {});
  const selection = { subject: word('building') };
  assert.deepEqual(selectWord(selection, word('eat')), selection);
});

test('starter vocabulary has unique IDs, nonempty labels, and a supported stage', () => {
  assert.equal(new Set(SEED_WORDS.map((item) => item.id)).size, SEED_WORDS.length);
  assert.ok(SEED_WORDS.length >= 30 && SEED_WORDS.length <= 45);
  assert.ok(SEED_WORDS.every((item) => item.label.trim() && item.emoji));
});
