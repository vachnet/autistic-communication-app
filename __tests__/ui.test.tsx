import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { WordCard, Action } from '../src/ui';
import { SEED_WORDS } from '../src/domain';

test('a card exposes its label, confirmation hint, selection and calculated width', async () => {
  const press = jest.fn();
  const view = await render(<WordCard word={SEED_WORDS[0]} armed width={280} onPress={press} />);
  const card = view.getByRole('button', { name: 'ฉัน' });
  expect(card).toBeSelected();
  expect(card).toHaveStyle({ width: 280 });
  expect(view.getByText('✓ แตะอีกครั้งเพื่อเลือก')).toBeTruthy();
  await fireEvent.press(card);
  expect(press).toHaveBeenCalledTimes(1);
});
test('disabled actions expose their state and ignore presses', async () => {
  const press = jest.fn();
  const view = await render(<Action title="บันทึก" disabled onPress={press} />);
  const button = view.getByRole('button', { name: 'บันทึก' });
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(press).not.toHaveBeenCalled();
});
