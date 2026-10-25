import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Word } from './domain';
import type { Palette } from './design';
import { useTheme } from './theme';

export function Action({ title, onPress, secondary = false, disabled = false, testID }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; testID?: string;
}) {
  const colors = useTheme();
  const styles = createStyles(colors);
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [styles.action, secondary && styles.secondary, disabled && { opacity: 0.55 }, pressed && { borderColor: colors.ink }]}>
    <Text style={[styles.actionText, secondary && { color: colors.primary }]}>{title}</Text>
  </Pressable>;
}
export function WordCard({ word, armed = false, onPress, compact = false, width, position }: {
  word: Word; armed?: boolean; onPress: () => void; compact?: boolean; width?: number; position?: number;
}) {
  const colors = useTheme();
  const styles = createStyles(colors);
  return <Pressable testID={`${compact ? 'selected' : 'word'}-${word.id}`} accessibilityRole="button" accessibilityLabel={word.label || `บัตรคำรูปภาพพร้อมเสียงของฉัน ${position ?? ''}`}
    accessibilityHint={compact ? 'แตะเพื่อลบคำนี้และเลือกใหม่' : armed ? 'แตะอีกครั้งเพื่อเลือกคำนี้' : 'แตะเพื่อฟังเสียง แล้วแตะอีกครั้งเพื่อเลือก'}
    accessibilityState={{ selected: armed }} onPress={onPress}
    style={({ pressed }) => [styles.card, compact && styles.compact, armed && styles.armed, width !== undefined && { width, flex: 0 }, pressed && { borderColor: colors.ink }]}>
    {word.imageUri ? <Image source={{ uri: word.imageUri }} style={compact ? styles.smallImage : styles.image} accessibilityIgnoresInvertColors />
      : <Text style={{ fontSize: compact ? 30 : 48 }}>{word.emoji}</Text>}
    {!!word.label && <Text style={[styles.label, compact && { fontSize: 16 }]}>{word.label}</Text>}
    {!compact && <Text style={styles.hint}>{armed ? '✓ แตะอีกครั้งเพื่อเลือก' : word.audioUri ? '♫ ฟังเสียงของฉัน' : 'ฟังเสียง'}</Text>}
  </Pressable>;
}
export function Notice({ children }: { children: React.ReactNode }) {
  const colors = useTheme();
  const styles = createStyles(colors);
  return <View accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.noticeText}>{children}</Text></View>;
}
const createStyles = (colors: Palette) => StyleSheet.create({
  action: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primary, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 18, minHeight: 60, alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  secondary: { backgroundColor: colors.soft, borderWidth: 1, borderColor: colors.line },
  actionText: { color: colors.onPrimary, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  card: { flex: 1, minHeight: 160, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 8 },
  compact: { flex: 0, minHeight: 96, minWidth: 90, maxWidth: 240, borderRadius: 16, padding: 10 },
  armed: { borderColor: colors.primary, backgroundColor: colors.selected },
  image: { width: 86, height: 86, borderRadius: 14 },
  smallImage: { width: 44, height: 44, borderRadius: 10 },
  label: { color: colors.ink, fontSize: 23, fontWeight: '700', textAlign: 'center' },
  hint: { color: colors.primary, fontSize: 13, textAlign: 'center' },
  notice: { backgroundColor: colors.notice, borderRadius: 14, padding: 14, marginVertical: 8 },
  noticeText: { color: colors.noticeInk, fontSize: 16, lineHeight: 25 },
});
