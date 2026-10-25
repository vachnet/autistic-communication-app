import { STAGES, canFinish, removeFrom, selectWord, type Selection, type Stage, type Word } from './domain.ts';

export interface Session { selection: Selection; stage: Stage; armed?: string; summary: boolean }
export const initialSession = (): Session => ({ selection: {}, stage: 'subject', summary: false });
export function tapWord(state: Session, word: Word): { state: Session; confirmed: boolean; playback: Word[] } {
  if (state.summary || word.stage !== state.stage) return { state, confirmed: false, playback: [] };
  const selected = selectWord(state.selection, word);
  if (selected === state.selection) return { state, confirmed: false, playback: [] };
  if (state.armed !== word.id) return { state: { ...state, armed: word.id }, confirmed: false, playback: [word] };
  const index = STAGES.indexOf(state.stage);
  const summary = index === STAGES.length - 1;
  return {
    state: { selection: selected, stage: STAGES[Math.min(index + 1, 3)], summary },
    confirmed: true,
    playback: summary ? sentenceWords(selected) : [],
  };
}
export function sentenceWords(selection: Selection): Word[] { return STAGES.flatMap(stage => selection[stage] ? [selection[stage]!] : []); }
export function editWord(state: Session, stage: Stage): Session {
  return { selection: removeFrom(state.selection, stage), stage, summary: false };
}
export function finishSentence(state: Session): Session {
  return canFinish(state.selection) ? { ...state, armed: undefined, summary: true } : state;
}
