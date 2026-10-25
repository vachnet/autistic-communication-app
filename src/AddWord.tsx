import React, { useEffect, useRef, useState } from 'react';
import { AppState, Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import type { Stage, Word } from './domain';
import { deleteMedia, keepMedia } from './storage';
import { speakWords, stopSpeaking } from './playback';
import { Action, Notice } from './ui';
import { useTheme } from './theme';
import type { Palette } from './design';

export default function AddWord({ stage, onSave, onClose }: {
  stage: Stage; onSave: (word: Word) => Promise<void>; onClose: () => void;
}) {
  const colors = useTheme();
  const s = createStyles(colors);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const status = useAudioRecorderState(recorder);
  const [photo, setPhoto] = useState<string>();
  const [audio, setAudio] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  const recording = useRef(false);
  const active = useRef(AppState.currentState === 'active');
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener('change', state => {
      active.current = state === 'active';
      if (state !== 'active' && recording.current) {
        recording.current = false;
        void recorder.stop().then(() => {
          if (mounted.current) { setAudio(undefined); setError('หยุดบันทึกแล้ว กรุณาบันทึกใหม่เมื่อพร้อม'); }
        }).catch(() => {}).finally(() => { void setAudioModeAsync({ allowsRecording: false }).catch(() => {}); });
      }
      if (state !== 'active') { stopSpeaking(); setPreviewing(false); }
    });
    return () => {
      mounted.current = false;
      listener.remove();
      stopSpeaking();
      if (recording.current) void recorder.stop().catch(() => {});
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);

  const perform = async (task: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await task(); } catch {
      recording.current = false;
      try { if (recorder.isRecording) await recorder.stop(); } catch { /* Already stopped. */ }
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      if (mounted.current) setError('ทำรายการไม่สำเร็จ ลองอีกครั้ง หรือเช็กสิทธิ์กล้องและไมโครโฟนในการตั้งค่า');
    }
    finally { if (mounted.current) setBusy(false); }
  };
  const takePhoto = () => perform(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { setError('ต้องอนุญาตกล้องเพื่อถ่ายรูป คุณเลือกจากคลังภาพแทนได้'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) { setPhoto(result.assets[0].uri); setAudio(undefined); }
  });
  const choosePhoto = () => perform(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) { setPhoto(result.assets[0].uri); setAudio(undefined); }
  });
  useEffect(() => {
    if (status.durationMillis < 30000 || !recording.current) return;
    recording.current = false;
    setBusy(true);
    void recorder.stop().then(() => {
      if (mounted.current) setAudio(recorder.uri ?? undefined);
    }).catch(() => { if (mounted.current) setError('บันทึกเสียงไม่สำเร็จ กรุณาลองใหม่'); })
      .finally(() => {
        void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
        if (mounted.current) setBusy(false);
      });
  }, [status.durationMillis, recorder]);
  const toggleRecord = () => perform(async () => {
    stopSpeaking(); setPreviewing(false);
    if (recording.current) {
      await recorder.stop(); recording.current = false;
      setAudio(recorder.uri ?? undefined);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } else {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) { setError('ต้องอนุญาตไมโครโฟนเพื่อบันทึกเสียงบัตรคำ'); return; }
      if (!mounted.current || !active.current) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      setAudio(undefined);
      await recorder.prepareToRecordAsync();
      if (!mounted.current || !active.current) {
        await recorder.stop().catch(() => {});
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      recorder.record(); recording.current = true;
    }
  });
  const save = () => perform(async () => {
    if (!photo || !audio) return;
    stopSpeaking(); setPreviewing(false);
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let imageUri: string | undefined;
    let audioUri: string | undefined;
    try {
      imageUri = keepMedia(photo, `${id}.jpg`);
      const extension = audio.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'm4a';
      audioUri = keepMedia(audio, `${id}.${extension}`);
      await onSave({ id, stage, label: '', emoji: '📷', imageUri, audioUri });
    } catch (error) { deleteMedia(imageUri); deleteMedia(audioUri); throw error; }
  });
  const preview = async () => {
    if (previewing) { stopSpeaking(); setPreviewing(false); return; }
    if (!audio) return;
    setPreviewing(true); setError('');
    try { await speakWords([{ id: 'preview', label: '', emoji: '', stage, audioUri: audio }]); }
    catch { if (mounted.current) setError('เล่นเสียงไม่ได้ กรุณาบันทึกเสียงใหม่'); }
    finally { if (mounted.current) setPreviewing(false); }
  };

  return <Modal animationType="none" onRequestClose={() => { if (!busy && !status.isRecording) onClose(); }}>
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.kicker}>บัตรคำของฉัน</Text>
        <Text style={s.heading}>{photo ? '2. บันทึกเสียง' : '1. ถ่ายรูป'}</Text>
        <Text style={s.body}>ถ่ายรูป แล้วพูดคำที่ต้องการ ไม่ต้องพิมพ์ · บันทึกได้ไม่เกิน 30 วินาที</Text>
        {photo && <Image source={{ uri: photo }} style={s.photo} />}
        {!photo && <View style={s.placeholder}><Text style={{ fontSize: 80 }}>📷</Text></View>}
        {!photo ? <>
          <Action title="📷 ถ่ายรูป" onPress={takePhoto} disabled={busy} />
          <Action title="▧ เลือกจากคลังภาพ" secondary onPress={choosePhoto} disabled={busy} />
        </> : <>
          <Action title={status.isRecording ? '■ หยุดบันทึก' : '● บันทึกเสียง'} onPress={toggleRecord} disabled={busy} />
          {status.isRecording && <Text accessibilityLiveRegion="polite" style={s.body}>กำลังบันทึก · {Math.round(status.durationMillis / 1000)} วินาที</Text>}
          {!!audio && !status.isRecording && <>
            <Action title={previewing ? '■ หยุดเสียง' : '♫ ฟังเสียงของฉัน'} secondary onPress={() => { void preview(); }} disabled={busy} />
            <Action title="✓ เพิ่มบัตรคำนี้" onPress={save} disabled={busy} />
          </>}
          <Action title="ถ่ายรูปใหม่" secondary onPress={() => { stopSpeaking(); setPreviewing(false); setPhoto(undefined); setAudio(undefined); }} disabled={busy || status.isRecording} />
        </>}
        {!!error && <Notice>{error}</Notice>}
        <Action title="กลับ" secondary onPress={onClose} disabled={busy || status.isRecording} />
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const createStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24, width: '100%', maxWidth: 600, alignSelf: 'center', gap: 12 },
  kicker: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  heading: { fontSize: 32, fontWeight: '800', color: colors.ink },
  body: { color: colors.muted, fontSize: 18, lineHeight: 28 },
  photo: { width: '100%', height: 250, borderRadius: 24, resizeMode: 'contain', backgroundColor: colors.soft },
  placeholder: { alignItems: 'center', justifyContent: 'center', height: 200, backgroundColor: colors.soft, borderRadius: 24 },
});
