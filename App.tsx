import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { STAGES, SEED_WORDS, canFinish, getOptions, type Stage, type Usage, type Word } from './src/domain';
import { initialSession, tapWord, editWord, finishSentence, sentenceWords, type Session } from './src/session';
import { PALETTES, layoutFor, type Palette } from './src/design';
import { defaultPreferences, type Preferences as PreferenceValues } from './src/storageCore';
import { loadData, saveData } from './src/storage';
import { speakWords, stopSpeaking } from './src/playback';
import { Action, Notice, WordCard } from './src/ui';
import { ThemeContext } from './src/theme';
import AddWord from './src/AddWord';
import Preferences from './src/Preferences';

const labels: Record<Stage, string> = { subject: 'ใคร', verb: 'ทำอะไร', object: 'อะไร / ที่ไหน', modifier: 'แบบไหน' };
const descriptions: Record<Stage, string> = {
  subject: 'เริ่มจากคนหรือสิ่งที่อยากพูดถึง', verb: 'เลือกสิ่งที่อยากทำ',
  object: 'เลือกสิ่งของหรือสถานที่ หรือจบประโยคได้เลย', modifier: 'เพิ่มรายละเอียด หรือจบประโยคได้เลย',
};
export default function App() { return <SafeAreaProvider><CommunicationApp /></SafeAreaProvider>; }
function CommunicationApp() {
  const [session, setSession] = useState(initialSession);
  const sessionRef = useRef(session);
  const commitSession = (next: Session) => { sessionRef.current = next; setSession(next); };
  const { selection, stage, summary, armed } = session;
  const [custom, setCustom] = useState<Word[]>([]);
  const [usage, setUsage] = useState<Usage>({});
  const [preferences, setPreferences] = useState<PreferenceValues>(defaultPreferences);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = layoutFor(width, fontScale, insets.left, insets.right);
  const colors = PALETTES[preferences.palette];
  const s = createStyles(colors);
  const audioRun = useRef(0);
  const mounted = useRef(true);
  const list = useRef<FlatList<Word>>(null);
  const [speaking, setSpeaking] = useState(false);
  const latestData = useRef({ words: custom, usage, preferences });
  latestData.current = { words: custom, usage, preferences };

  useEffect(() => {
    mounted.current = true;
    let active = true;
    void loadData().then(data => {
      if (active) {
        setCustom(data.words); setUsage(data.usage); setPreferences(data.preferences);
        latestData.current = data; setLoaded(true);
      }
    }).catch(() => { if (active) { setLoadFailed(true); setLoaded(true); setError('อ่านข้อมูลเดิมไม่ได้ บัตรคำเดิมจะไม่ถูกเขียนทับ กรุณาปิดและเปิดแอปใหม่'); } });
    void Speech.getAvailableVoicesAsync().then(voices => {
      if (active && !voices.some(v => v.language.startsWith('th'))) setError(previous => previous || 'ไม่พบเสียงภาษาไทย กรุณาติดตั้งเสียงภาษาไทยในการตั้งค่าเสียงของอุปกรณ์ บัตรคำที่บันทึกเสียงเองยังใช้ได้');
    }).catch(() => {});
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        audioRun.current++; stopSpeaking(); setSpeaking(false);
        commitSession({ ...sessionRef.current, armed: undefined });
      }
    });
    return () => { active = false; mounted.current = false; audioRun.current++; stopSpeaking(); subscription.remove(); };
  }, []);
  useEffect(() => { list.current?.scrollToOffset({ offset: 0, animated: false }); }, [stage, summary]);

  const stop = () => { audioRun.current++; stopSpeaking(); setSpeaking(false); };
  const play = async (words: Word[]) => {
    const run = ++audioRun.current;
    setSpeaking(true);
    try { await speakWords(words); }
    catch { if (mounted.current && run === audioRun.current) setError('เล่นเสียงไม่ได้ กรุณาตรวจสอบเสียงภาษาไทยและระดับเสียงของอุปกรณ์'); }
    finally { if (mounted.current && run === audioRun.current) setSpeaking(false); }
  };
  const persist = () => {
    if (loadFailed) return;
    void saveData(latestData.current).catch(() => {
      if (mounted.current) setError('บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบพื้นที่ว่างของอุปกรณ์');
    });
  };
  const finish = () => {
    const next = finishSentence(sessionRef.current);
    commitSession(next);
    if (next.summary && preferences.autoSpeak) void play(sentenceWords(next.selection));
    else stop();
  };
  const choose = (word: Word) => {
    const next = tapWord(sessionRef.current, word);
    commitSession(next.state);
    if (next.confirmed) {
      stop();
      const counts = { ...latestData.current.usage, [word.id]: (latestData.current.usage[word.id] || 0) + 1 };
      setUsage(counts); latestData.current = { ...latestData.current, usage: counts }; persist();
      if (next.state.summary && preferences.autoSpeak) void play(next.playback);
    } else if (next.playback.length) void play(next.playback);
  };
  const reset = () => { stop(); commitSession(initialSession()); };
  const edit = (key: Stage) => { stop(); commitSession(editWord(sessionRef.current, key)); };
  const selected = sentenceWords(selection);
  const options = getOptions(stage, selection, [...SEED_WORDS, ...custom], usage);

  const header = <>
    <View style={s.brandRow}>
      <View style={s.brandLabel}><Text accessibilityRole="header" style={s.brand}>สื่อสารด้วยกัน</Text><Text style={s.small}>ทุกคำของคุณมีความหมาย</Text></View>
      <Pressable testID="preferences" accessibilityRole="button" accessibilityLabel="ปรับสีและเสียง" onPress={() => {
        stop(); commitSession({ ...sessionRef.current, armed: undefined }); setSettingsOpen(true);
      }} style={s.settings}><Text style={s.settingsText}>ปรับสีและเสียง</Text></Pressable>
    </View>
    <View style={s.steps}>{STAGES.map((key, i) => <View key={key} style={[s.step, stage === key && !summary && s.activeStep]}>
      <Text style={[s.stepText, stage === key && !summary && { color: colors.onPrimary }]}>{i + 1} · {labels[key]}</Text>
    </View>)}</View>
    <View style={s.sentenceBox}>
      <Text style={s.caption}>ประโยคของฉัน · แตะคำด้านบนเพื่อเลือกใหม่</Text>
      <ScrollView horizontal contentContainerStyle={s.sentenceRow}>
        {selected.length ? selected.map((word, i) => <WordCard key={word.id} word={word} compact onPress={() => edit(word.stage)} position={i + 1} />)
          : <Text style={s.emptySentence}>เลือกคำแรก แล้วมาเล่าเรื่องของคุณกัน</Text>}
      </ScrollView>
    </View>
    {!!error && <Notice>{error}</Notice>}
    {!summary && <View style={s.sectionHeader}>
      <Text style={s.kicker}>ขั้นตอน {STAGES.indexOf(stage) + 1} จาก 4</Text>
      <Text accessibilityRole="header" style={s.heading}>{labels[stage]}</Text>
      <Text style={s.description}>{descriptions[stage]}</Text>
      <Text accessibilityLiveRegion="polite" style={s.instruction}>{armed ? '✓ แตะรูปเดิมอีกครั้งเพื่อเลือก หรือแตะรูปอื่นเพื่อฟัง' : 'แตะรูปเพื่อฟัง · แตะรูปเดิมอีกครั้งเพื่อเลือก'}</Text>
    </View>}
  </>;

  return <ThemeContext.Provider value={colors}>
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <View style={s.container}>
        {!loaded ? <ActivityIndicator size="large" accessibilityLabel="กำลังเปิดบัตรคำ" /> : summary ?
          <ScrollView contentContainerStyle={[s.scrollContent, { paddingHorizontal: layout.padding }]}>
            {header}
            <View style={s.summary}>
              <Text accessibilityRole="header" style={s.heading}>นี่คือสิ่งที่ฉันอยากบอก</Text>
              <Text style={s.description}>แตะฟังอีกครั้งได้เสมอ</Text>
              <View style={s.summaryCards}>{selected.map((word, i) => <WordCard compact key={word.id} word={word} onPress={() => edit(word.stage)} position={i + 1} />)}</View>
              <Action title={speaking ? '■ หยุดเสียง' : '♫ พูดอีกครั้ง'} onPress={() => speaking ? stop() : void play(selected)} />
              <Action testID="restart-sentence" title="↺ เริ่มประโยคใหม่" secondary onPress={reset} />
            </View>
          </ScrollView> :
          <FlatList ref={list} key={layout.columns} data={options} numColumns={layout.columns} keyExtractor={word => word.id}
            contentContainerStyle={[s.grid, { paddingHorizontal: layout.padding }]}
            columnWrapperStyle={layout.columns > 1 ? { gap: 12 } : undefined}
            ListHeaderComponent={header}
            renderItem={({ item, index }) => <WordCard word={item} width={layout.cardWidth} armed={armed === item.id} onPress={() => choose(item)} position={index + 1} />}
            ListEmptyComponent={<Notice>ยังไม่มีคำที่เข้ากัน คุณเพิ่มบัตรคำใหม่ได้</Notice>}
            ListFooterComponent={<View style={s.footer}>
              {canFinish(selection) && <Action testID="finish-sentence" title="— จบประโยคและพูด" onPress={finish} />}
              {speaking && <Action title="■ หยุดเสียง" secondary onPress={stop} />}
              <Action testID="add-word" title="＋ เพิ่มบัตรคำ · รูปและเสียง" secondary disabled={loadFailed} onPress={() => {
                stop(); commitSession({ ...sessionRef.current, armed: undefined }); setAdding(true);
              }} />
              {selected.length > 0 && <Action title="↺ เริ่มใหม่" secondary onPress={reset} />}
              <Text style={s.footerNote}>รูปและเสียงของคุณเก็บอยู่ในอุปกรณ์นี้</Text>
            </View>} />}
      </View>
      {adding && <AddWord stage={stage} onClose={() => setAdding(false)} onSave={async word => {
        const next = { ...latestData.current, words: [...latestData.current.words, word] };
        await saveData(next);
        latestData.current = next; setCustom(next.words); setAdding(false);
      }} />}
      {settingsOpen && <Preferences value={preferences} disabled={loadFailed} onClose={() => setSettingsOpen(false)} onChange={next => {
        stop(); setPreferences(next); latestData.current = { ...latestData.current, preferences: next }; persist();
      }} />}
    </SafeAreaView>
  </ThemeContext.Provider>;
}
const createStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  container: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  scrollContent: { paddingTop: 12, paddingBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  brandLabel: { flexGrow: 1, flexShrink: 1 },
  brand: { fontSize: 21, fontWeight: '800', color: colors.ink }, small: { fontSize: 13, color: colors.muted },
  settings: { backgroundColor: colors.soft, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 12, minHeight: 48, justifyContent: 'center' },
  settingsText: { color: colors.primary, fontSize: 14 },
  steps: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  step: { flexGrow: 1, backgroundColor: colors.soft, padding: 10, borderRadius: 12 }, activeStep: { backgroundColor: colors.primary },
  stepText: { color: colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  sentenceBox: { padding: 14, borderRadius: 22, backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line },
  caption: { color: colors.muted, fontSize: 13, marginBottom: 10 }, sentenceRow: { gap: 10, alignItems: 'center', minHeight: 74 },
  emptySentence: { color: colors.muted, fontSize: 17, flexShrink: 1 },
  sectionHeader: { marginVertical: 18, gap: 6 }, kicker: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  heading: { fontSize: 29, color: colors.ink, fontWeight: '800' }, description: { fontSize: 16, color: colors.muted },
  instruction: { color: colors.primary, fontSize: 14 }, grid: { gap: 12, paddingTop: 12, paddingBottom: 24 },
  footer: { marginTop: 12, gap: 6 }, footerNote: { color: colors.muted, fontSize: 12, textAlign: 'center', marginVertical: 12 },
  summary: { paddingTop: 26, paddingBottom: 30, gap: 14 },
  summaryCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 12 },
});
