import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import FoodIdentificationModal from '../journal/FoodIdentificationModal';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { text: '#000', border: '#ccc', primary: '#080' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key.split('.').pop() }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ThemedModal', () => ({ ThemedModal: ({ children }: any) => children }));
jest.mock('../ui/AppButton', () => ({
  __esModule: true,
  default: ({ title, onPress }: any) => {
    const { Text } = require('react-native');
    return <Text onPress={onPress}>{title}</Text>;
  },
}));

test('opens an ingredient and forwards the edited gram amount', () => {
  const onChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Lunch"
      onMealNameChange={jest.fn()}
      value={[
        { name: 'Lax', grams: 100 },
        { name: 'Ris', grams: 150 },
      ]}
      onChange={onChange}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  fireEvent.press(screen.getByText('Lax'));
  expect(screen.getByLabelText('grams').props.value).toBe('100');
  fireEvent.changeText(screen.getByLabelText('grams'), '125,5');
  expect(onChange).toHaveBeenLastCalledWith([
    { name: 'Lax', grams: 125.5 },
    { name: 'Ris', grams: 150 },
  ]);
  fireEvent.press(screen.getByText('remove'));
  expect(onChange).toHaveBeenLastCalledWith([{ name: 'Ris', grams: 150 }]);
});

test('adds a separate ingredient with its own gram amount', () => {
  const onChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Lunch"
      onMealNameChange={jest.fn()}
      value={[{ name: 'Ris', grams: 150 }]}
      onChange={onChange}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  fireEvent.press(screen.getByText('add'));
  fireEvent.changeText(screen.getByLabelText('ingredientName'), 'Tofu');
  fireEvent.changeText(screen.getByLabelText('grams'), '150');
  expect(onChange).toHaveBeenLastCalledWith([
    { name: 'Ris', grams: 150 },
    { name: 'Tofu', grams: 150, source: 'user', identificationConfidence: 'high' },
  ]);
});

test('uses the grams field directly and preserves names containing numbers', () => {
  const screen = render(
    <FoodIdentificationModal
      mealName="Lunch"
      onMealNameChange={jest.fn()}
      value={[{ name: 'Yoghurt 3% fett', grams: 175.5 }]}
      onChange={jest.fn()}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByText('175,5 g')).toBeTruthy();
  expect(screen.queryByText('setGrams')).toBeNull();
  fireEvent.press(screen.getByText('Yoghurt 3% fett'));
  expect(screen.getByLabelText('grams').props.value).toBe('175,5');
  expect(screen.getByLabelText('ingredientName').props.value).toBe('Yoghurt 3% fett');
});

test('marks uncertain ingredients and distinguishes user-supplied identities', () => {
  const onChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Lunch"
      onMealNameChange={jest.fn()}
      value={[
        { name: 'Rotfrukt', grams: 60, identificationConfidence: 'low', source: 'image' },
        { name: 'Morot', grams: 40, identificationConfidence: 'high', source: 'user' },
      ]}
      onChange={onChange}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getAllByText('uncertain')).toHaveLength(1);
  expect(screen.getAllByText('fromDescription')).toHaveLength(1);
  fireEvent.press(screen.getByText('Rotfrukt'));
  fireEvent.changeText(screen.getByLabelText('grams'), '75');
  expect(screen.getByText('uncertain')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('ingredientName'), 'Palsternacka');
  expect(screen.queryByText('uncertain')).toBeNull();
  expect(onChange).toHaveBeenLastCalledWith([
    { name: 'Palsternacka', grams: 75, identificationConfidence: 'high', source: 'user' },
    { name: 'Morot', grams: 40, identificationConfidence: 'high', source: 'user' },
  ]);
});

test('shows the dish name separately from ingredients and allows renaming it', () => {
  const onMealNameChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Nötköttsgryta med potatismos"
      onMealNameChange={onMealNameChange}
      value={[
        { name: 'Nötkött', grams: 150 },
        { name: 'Potatismos', grams: 200 },
      ]}
      onChange={jest.fn()}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByLabelText('mealNameLabel').props.value).toBe('Nötköttsgryta med potatismos');
  expect(screen.getByText('Nötkött')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('mealNameLabel'), 'Min köttgryta');
  expect(onMealNameChange).toHaveBeenCalledWith('Min köttgryta');
});
