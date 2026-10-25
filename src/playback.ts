import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { createPlayback } from './playbackCore';

const controller = createPlayback({
  stopSpeech: () => Speech.stop(),
  prepare: () => setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }),
  speak: (text, onDone, onError) => Speech.speak(text, {
    language: 'th-TH', rate: 0.8, onDone, onStopped: onDone, onError,
  }),
  player: uri => {
    const player = createAudioPlayer(uri);
    return {
      play: () => player.play(),
      remove: () => player.remove(),
      subscribe: onFinish => player.addListener('playbackStatusUpdate', status => {
        if (status.didJustFinish) onFinish();
      }),
    };
  },
  schedule: (callback, ms) => setTimeout(callback, ms),
  clearTimer: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
});
export const speakWords = controller.play;
export const stopSpeaking = controller.stop;
