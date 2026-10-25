import type { Word } from './domain.ts';

export interface PlaybackPlayer {
  play(): void;
  remove(): void;
  subscribe(onFinish: () => void): { remove(): void };
}
export interface PlaybackAdapter {
  stopSpeech(): Promise<void>;
  prepare(): Promise<void>;
  speak(text: string, done: () => void, failed: () => void): void;
  player(uri: string): PlaybackPlayer;
  schedule(callback: () => void, ms: number): unknown;
  clearTimer(timer: unknown): void;
}

/** Serial playback with cancellation even while native audio is preparing. */
export function createPlayback(adapter: PlaybackAdapter) {
  let generation = 0;
  let cancelCurrent: (() => void) | undefined;
  function stop() {
    generation++;
    cancelCurrent?.();
    cancelCurrent = undefined;
    void adapter.stopSpeech().catch(() => {});
  }
  async function play(words: readonly Word[]) {
    stop();
    const run = generation;
    await adapter.stopSpeech();
    if (run !== generation) return;
    await adapter.prepare();
    for (const word of words) {
      if (run !== generation) return;
      await new Promise<void>((resolve, reject) => {
        let finished = false;
        let player: PlaybackPlayer | undefined;
        let subscription: { remove(): void } | undefined;
        let timer: unknown;
        const finish = (error?: Error) => {
          if (finished) return;
          finished = true;
          if (timer !== undefined) adapter.clearTimer(timer);
          subscription?.remove();
          player?.remove();
          if (cancelCurrent === cancel) cancelCurrent = undefined;
          if (error) { void adapter.stopSpeech().catch(() => {}); reject(error); }
          else resolve();
        };
        const cancel = () => finish();
        cancelCurrent = cancel;
        try {
          if (word.audioUri) {
            player = adapter.player(word.audioUri);
            subscription = player.subscribe(() => finish());
            if (finished) { subscription.remove(); return; }
            timer = adapter.schedule(() => finish(new Error('Audio timed out')), 60000);
            player.play();
          } else {
            timer = adapter.schedule(() => finish(new Error('Speech timed out')), 30000);
            adapter.speak(word.label, () => finish(), () => finish(new Error('Thai speech unavailable')));
          }
        } catch (error) { finish(error instanceof Error ? error : new Error('Audio playback failed')); }
      });
    }
  }
  return { play, stop };
}
