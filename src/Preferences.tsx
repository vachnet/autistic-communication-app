import React from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTES, type PaletteId } from './design';
import type { Preferences as PreferenceValues } from './storageCore';
import { useTheme } from './theme';
import { Action } from './ui';

export default function Preferences({ value, onChange, onClose, disabled }: {
  value: PreferenceValues; onChange: (next: PreferenceValues) => void; onClose: () => void; disabled: boolean;
}) {
  const colors = useTheme();
  return <Modal animationType="none" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={s.content}>
        <Text accessibilityRole="header" style={[s.heading, { color: colors.ink }]}>ปรับให้สบายตา</Text>
        <Text style={[s.body, { color: colors.muted }]}>เลือกสีที่คุณชอบ เปลี่ยนได้เสมอ</Text>
        {(Object.keys(PALETTES) as PaletteId[]).map(id => <Action key={id}
          title={`${value.palette === id ? '✓ ' : ''}${PALETTES[id].name}`}
          secondary={value.palette !== id} disabled={disabled}
          onPress={() => onChange({ ...value, palette: id })} />)}
        <View style={[s.setting, { borderColor: colors.line }]}>
          <Text style={[s.settingLabel, { color: colors.ink }]}>พูดประโยคอัตโนมัติเมื่อเลือกเสร็จ</Text>
          <Switch accessibilityLabel="พูดประโยคอัตโนมัติเมื่อเลือกเสร็จ" value={value.autoSpeak}
            disabled={disabled} trackColor={{ true: colors.primary }}
            onValueChange={autoSpeak => onChange({ ...value, autoSpeak })} />
        </View>
        <Text style={[s.body, { color: colors.muted }]}>เมื่อปิด คุณกดปุ่มพูดเองได้ทุกครั้ง</Text>
        <Action title="กลับไปเลือกคำ" onPress={onClose} />
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}
const s = StyleSheet.create({
  content: { padding: 20, width: '100%', maxWidth: 600, alignSelf: 'center', gap: 14 },
  heading: { fontSize: 30, fontWeight: '800' }, body: { fontSize: 18 },
  setting: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, paddingVertical: 20, borderTopWidth: 1, minHeight: 64 },
  settingLabel: { flexGrow: 1, flexShrink: 1, fontSize: 19, minWidth: 160 },
});
