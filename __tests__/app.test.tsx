import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import App from '../App';
import { speakWords } from '../src/playback';
import { loadData, saveData } from '../src/storage';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-speech', () => ({ getAvailableVoicesAsync: jest.fn(async () => [{ language: 'th-TH' }]) }));
jest.mock('../src/playback', () => ({ speakWords: jest.fn(async () => {}), stopSpeaking: jest.fn() }));
jest.mock('../src/storage', () => ({
  loadData: jest.fn(async () => ({ words: [], usage: {}, preferences: { palette: 'sage', autoSpeak: true } })),
  saveData: jest.fn(async () => {}), keepMedia: jest.fn(), deleteMedia: jest.fn(),
}));
jest.mock('expo-audio', () => ({
  AudioModule: {}, RecordingPresets: { HIGH_QUALITY: {} },
  useAudioRecorder: () => ({ stop: jest.fn(async () => {}) }),
  useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0 }),
  setAudioModeAsync: jest.fn(async () => {}),
}));
beforeEach(() => {
  jest.mocked(loadData).mockResolvedValue({ words: [], usage: {}, preferences: { palette: 'sage', autoSpeak: true } });
});
afterEach(() => { jest.restoreAllMocks(); });
async function tapTwice(label: string) {
  const button = await screen.findByRole('button', { name: label });
  await fireEvent.press(button); await fireEvent.press(button);
}
test('subject, verb, object and modifier screens lead to replayable summary and restart', async () => {
  await render(<App />);
  await tapTwice('ฉัน');
  await tapTwice('กิน');
  await tapTwice('ข้าว');
  await tapTwice('ร้อน');
  expect(await screen.findByText('นี่คือสิ่งที่ฉันอยากบอก')).toBeTruthy();
  expect(jest.mocked(speakWords).mock.calls.at(-1)?.[0].map(w => w.id)).toEqual(['i', 'eat', 'rice', 'hot']);
  await waitFor(() => expect(screen.getByRole('button', { name: '♫ พูดอีกครั้ง' })).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: '♫ พูดอีกครั้ง' }));
  await fireEvent.press(screen.getByRole('button', { name: '↺ เริ่มประโยคใหม่' }));
  expect(await screen.findByText('เริ่มจากคนหรือสิ่งที่อยากพูดถึง')).toBeTruthy();
});
test('a sentence can stop after two words', async () => {
  await render(<App />); await tapTwice('ฉัน'); await tapTwice('นอน');
  await fireEvent.press(screen.getByRole('button', { name: '— จบประโยคและพูด' }));
  expect(await screen.findByText('นี่คือสิ่งที่ฉันอยากบอก')).toBeTruthy();
  expect(jest.mocked(speakWords).mock.calls.at(-1)?.[0].map(w => w.id)).toEqual(['i', 'sleep']);
});
test('palette and automatic speech preferences can be changed and saved', async () => {
  await render(<App />); await screen.findByRole('button', { name: 'ฉัน' });
  await fireEvent.press(screen.getByRole('button', { name: 'ปรับสีและเสียง' }));
  await fireEvent.press(screen.getByRole('button', { name: 'ครีมอุ่น' }));
  expect(saveData).toHaveBeenLastCalledWith(expect.objectContaining({ preferences: { palette: 'sand', autoSpeak: true } }));
  await fireEvent(screen.getByRole('switch'), 'valueChange', false);
  expect(saveData).toHaveBeenLastCalledWith(expect.objectContaining({ preferences: { palette: 'sand', autoSpeak: false } }));
});
test('unreadable saved data shows an error and cannot be overwritten', async () => {
  jest.mocked(loadData).mockRejectedValueOnce(new Error('corrupt data'));
  await render(<App />);
  expect(await screen.findByText(/อ่านข้อมูลเดิมไม่ได้/)).toBeTruthy();
  await tapTwice('ฉัน');
  expect(saveData).not.toHaveBeenCalled();
});
test.each([
  [320, 568, 1], [568, 320, 1], [390, 844, 2], [844, 390, 2],
  [768, 1024, 1], [1024, 768, 2], [1024, 1366, 1], [280, 640, 3],
])('main flows render at %s×%s and font scale %s', async (width, height, fontScale) => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height, fontScale, scale: 2 });
  await render(<App />);
  await tapTwice('ฉัน'); await tapTwice('กิน'); await tapTwice('ข้าว'); await tapTwice('ร้อน');
  expect(await screen.findByText('นี่คือสิ่งที่ฉันอยากบอก')).toBeTruthy();
  expect(screen.getByRole('button', { name: '↺ เริ่มประโยคใหม่' })).toBeTruthy();
});
