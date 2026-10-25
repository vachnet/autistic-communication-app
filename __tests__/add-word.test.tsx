import React from 'react';
import { AppState } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { AudioModule } from 'expo-audio';
import AddWord from '../src/AddWord';
import { keepMedia } from '../src/storage';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] })),
}));
jest.mock('../src/playback', () => ({ speakWords: jest.fn(async () => {}), stopSpeaking: jest.fn() }));
jest.mock('../src/storage', () => ({ keepMedia: jest.fn((_uri: string, name: string) => `file:///saved/${name}`), deleteMedia: jest.fn() }));
jest.mock('expo-audio', () => {
  const state = { durationMillis: 0, isRecording: false };
  const recorder = {
    uri: 'file:///voice.m4a', get isRecording() { return state.isRecording; },
    prepareToRecordAsync: jest.fn(async () => {}),
    record: jest.fn(() => { state.isRecording = true; }),
    stop: jest.fn(async () => { state.isRecording = false; }),
  };
  return {
    AudioModule: { requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })) },
    RecordingPresets: { HIGH_QUALITY: {} },
    useAudioRecorder: () => recorder, useAudioRecorderState: () => state,
    setAudioModeAsync: jest.fn(async () => {}),
    __reset: () => { state.isRecording = false; state.durationMillis = 0; },
  };
});
const originalAppState = AppState.currentState;
beforeEach(() => {
  AppState.currentState = 'active';
  jest.requireMock('expo-audio').__reset();
});
afterEach(() => { AppState.currentState = originalAppState; });
test('photo, recording and save screens create a card without typed text', async () => {
  const save = jest.fn(async () => {});
  await render(<AddWord stage="object" onSave={save} onClose={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: '📷 ถ่ายรูป' }));
  expect(await screen.findByText('2. บันทึกเสียง')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: '● บันทึกเสียง' }));
  await fireEvent.press(await screen.findByRole('button', { name: '■ หยุดบันทึก' }));
  await fireEvent.press(await screen.findByRole('button', { name: '✓ เพิ่มบัตรคำนี้' }));
  expect(keepMedia).toHaveBeenCalledTimes(2);
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ stage: 'object', label: '', imageUri: expect.stringContaining('file:///saved/'), audioUri: expect.stringContaining('file:///saved/') }));
});
test('camera denial provides a library alternative', async () => {
  jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce({ granted: false } as Awaited<ReturnType<typeof ImagePicker.requestCameraPermissionsAsync>>);
  await render(<AddWord stage="subject" onSave={jest.fn()} onClose={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: '📷 ถ่ายรูป' }));
  expect(await screen.findByText(/ต้องอนุญาตกล้อง/)).toBeTruthy();
  expect(screen.getByRole('button', { name: '▧ เลือกจากคลังภาพ' })).toBeTruthy();
});
test('microphone denial never offers to save an incomplete card', async () => {
  jest.mocked(AudioModule.requestRecordingPermissionsAsync).mockResolvedValueOnce({ granted: false } as Awaited<ReturnType<typeof AudioModule.requestRecordingPermissionsAsync>>);
  await render(<AddWord stage="subject" onSave={jest.fn()} onClose={jest.fn()} />);
  await fireEvent.press(screen.getByRole('button', { name: '▧ เลือกจากคลังภาพ' }));
  await fireEvent.press(await screen.findByRole('button', { name: '● บันทึกเสียง' }));
  expect(await screen.findByText(/ต้องอนุญาตไมโครโฟน/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: '✓ เพิ่มบัตรคำนี้' })).toBeNull();
});
