/** Pure sentence-building rules. All vocabulary and learning stay on device. */
export const STAGES = ['subject', 'verb', 'object', 'modifier'] as const;
export type Stage = (typeof STAGES)[number];

export interface Word {
  id: string;
  label: string;
  emoji: string;
  stage: Stage;
  /** Meaning categories passed to the next stage. */
  tags?: string[];
  /** Categories accepted from the preceding word; omitted means unrestricted. */
  accepts?: string[];
  imageUri?: string;
  audioUri?: string;
}

export type Selection = Partial<Record<Stage, Word>>;
export type Usage = Record<string, number>;

// A curated starter set, not a claim to be a statistically ranked top-100 list.
export const SEED_WORDS: Word[] = [
  { id: 'i', label: 'ฉัน', emoji: '🙋', stage: 'subject', tags: ['human'] },
  { id: 'mother', label: 'แม่', emoji: '👩', stage: 'subject', tags: ['human'] },
  { id: 'father', label: 'พ่อ', emoji: '👨', stage: 'subject', tags: ['human'] },
  { id: 'teacher', label: 'ครู', emoji: '🧑‍🏫', stage: 'subject', tags: ['human'] },
  { id: 'friend', label: 'เพื่อน', emoji: '🧒', stage: 'subject', tags: ['human'] },
  { id: 'dog', label: 'หมา', emoji: '🐕', stage: 'subject', tags: ['animal'] },
  { id: 'cat', label: 'แมว', emoji: '🐈', stage: 'subject', tags: ['animal'] },
  { id: 'building', label: 'ตึก', emoji: '🏢', stage: 'subject', tags: ['building'] },

  { id: 'eat', label: 'กิน', emoji: '🍽️', stage: 'verb', accepts: ['human', 'animal'], tags: ['eat'] },
  { id: 'drink', label: 'ดื่ม', emoji: '🥤', stage: 'verb', accepts: ['human', 'animal'], tags: ['drink'] },
  { id: 'want', label: 'ต้องการ', emoji: '🤲', stage: 'verb', accepts: ['human'], tags: ['want'] },
  { id: 'go', label: 'ไป', emoji: '🚶', stage: 'verb', accepts: ['human', 'animal'], tags: ['go'] },
  { id: 'play', label: 'เล่น', emoji: '🧸', stage: 'verb', accepts: ['human', 'animal'], tags: ['play'] },
  { id: 'read', label: 'อ่าน', emoji: '📖', stage: 'verb', accepts: ['human'], tags: ['read'] },
  { id: 'sleep', label: 'นอน', emoji: '😴', stage: 'verb', accepts: ['human', 'animal'], tags: ['rest'] },
  { id: 'stay', label: 'อยู่', emoji: '📍', stage: 'verb', accepts: ['human', 'animal', 'building'], tags: ['stay'] },
  { id: 'have', label: 'มี', emoji: '👐', stage: 'verb', accepts: ['human', 'building'], tags: ['have'] },

  { id: 'rice', label: 'ข้าว', emoji: '🍚', stage: 'object', accepts: ['eat', 'want', 'have'], tags: ['food'] },
  { id: 'noodles', label: 'ก๋วยเตี๋ยว', emoji: '🍜', stage: 'object', accepts: ['eat', 'want', 'have'], tags: ['food'] },
  { id: 'banana', label: 'กล้วย', emoji: '🍌', stage: 'object', accepts: ['eat', 'want', 'have'], tags: ['food'] },
  { id: 'apple', label: 'แอปเปิล', emoji: '🍎', stage: 'object', accepts: ['eat', 'want', 'have'], tags: ['food'] },
  { id: 'water', label: 'น้ำ', emoji: '💧', stage: 'object', accepts: ['drink', 'want', 'have'], tags: ['drink'] },
  { id: 'milk', label: 'นม', emoji: '🥛', stage: 'object', accepts: ['drink', 'want', 'have'], tags: ['drink'] },
  { id: 'juice', label: 'น้ำผลไม้', emoji: '🧃', stage: 'object', accepts: ['drink', 'want', 'have'], tags: ['drink'] },
  { id: 'home', label: 'บ้าน', emoji: '🏠', stage: 'object', accepts: ['go', 'stay', 'have'], tags: ['place'] },
  { id: 'school', label: 'โรงเรียน', emoji: '🏫', stage: 'object', accepts: ['go', 'stay'], tags: ['place'] },
  { id: 'park', label: 'สวน', emoji: '🌳', stage: 'object', accepts: ['go', 'stay'], tags: ['place'] },
  { id: 'toilet', label: 'ห้องน้ำ', emoji: '🚻', stage: 'object', accepts: ['go', 'stay', 'have'], tags: ['place'] },
  { id: 'ball', label: 'บอล', emoji: '⚽', stage: 'object', accepts: ['play', 'want', 'have'], tags: ['toy'] },
  { id: 'doll', label: 'ตุ๊กตา', emoji: '🧸', stage: 'object', accepts: ['play', 'want', 'have'], tags: ['toy'] },
  { id: 'book', label: 'หนังสือ', emoji: '📚', stage: 'object', accepts: ['read', 'want', 'have'], tags: ['book'] },
  { id: 'bed', label: 'บนเตียง', emoji: '🛏️', stage: 'object', accepts: ['rest'], tags: ['place'] },

  { id: 'hot', label: 'ร้อน', emoji: '♨️', stage: 'modifier', accepts: ['food', 'drink'], tags: ['quality'] },
  { id: 'cold', label: 'เย็น', emoji: '🧊', stage: 'modifier', accepts: ['food', 'drink'], tags: ['quality'] },
  { id: 'delicious', label: 'อร่อย', emoji: '😋', stage: 'modifier', accepts: ['food', 'drink'], tags: ['quality'] },
  { id: 'sweet', label: 'หวาน', emoji: '🍯', stage: 'modifier', accepts: ['food', 'drink'], tags: ['quality'] },
  { id: 'big', label: 'ใหญ่', emoji: '🐘', stage: 'modifier', accepts: ['food', 'place', 'toy', 'book'], tags: ['quality'] },
  { id: 'small', label: 'เล็ก', emoji: '🐜', stage: 'modifier', accepts: ['food', 'place', 'toy', 'book'], tags: ['quality'] },
  { id: 'red', label: 'สีแดง', emoji: '🔴', stage: 'modifier', accepts: ['food', 'toy', 'book'], tags: ['quality'] },
  { id: 'blue', label: 'สีฟ้า', emoji: '🔵', stage: 'modifier', accepts: ['toy', 'book'], tags: ['quality'] },
];

function compatible(previous: Word, candidate: Word): boolean {
  // Photo/audio cards added by a child need no written category metadata.
  if (!previous.tags?.length || !candidate.accepts?.length) return true;
  return candidate.accepts.some((tag) => previous.tags!.includes(tag));
}

export function getOptions(
  stage: Stage,
  selection: Selection,
  words: readonly Word[] = SEED_WORDS,
  usage: Usage = {},
): Word[] {
  const index = STAGES.indexOf(stage);
  const previous = index > 0 ? selection[STAGES[index - 1]] : undefined;
  if (index > 0 && !previous) return [];
  return words
    .filter((word) => word.stage === stage && (!previous || compatible(previous, word)))
    .map((word, order) => ({ word, order }))
    .sort((a, b) => (usage[b.word.id] || 0) - (usage[a.word.id] || 0) || a.order - b.order)
    .map(({ word }) => word);
}

/** Remove this word and everything depending on it, preserving earlier choices. */
export function removeFrom(selection: Selection, stage: Stage): Selection {
  const next = { ...selection };
  for (const key of STAGES.slice(STAGES.indexOf(stage))) delete next[key];
  return next;
}

export function selectWord(selection: Selection, word: Word): Selection {
  const index = STAGES.indexOf(word.stage);
  const previous = index > 0 ? selection[STAGES[index - 1]] : undefined;
  if (index > 0 && (!previous || !compatible(previous, word))) return selection;
  return { ...removeFrom(selection, word.stage), [word.stage]: word };
}

/** The stop card is available after a subject and verb, including two-word sentences. */
export function canFinish(selection: Selection): boolean {
  return !!selection.subject && !!selection.verb;
}

export function sentenceText(selection: Selection): string {
  return STAGES.flatMap((stage) => selection[stage] ? [selection[stage]!.label] : []).join(' ');
}
