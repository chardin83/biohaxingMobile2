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
        { name: 'Lax', amount: 100, unit: 'g' },
        { name: 'Ris', amount: 150, unit: 'g' },
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
    { name: 'Lax', amount: 125.5, unit: 'g' },
    { name: 'Ris', amount: 150, unit: 'g' },
  ]);
  fireEvent.press(screen.getByText('remove'));
  expect(onChange).toHaveBeenLastCalledWith([{ name: 'Ris', amount: 150, unit: 'g' }]);
});

test('adds a separate ingredient with its own gram amount', () => {
  const onChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Lunch"
      onMealNameChange={jest.fn()}
      value={[{ name: 'Ris', amount: 150, unit: 'g' }]}
      onChange={onChange}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  fireEvent.press(screen.getByText('add'));
  fireEvent.changeText(screen.getByLabelText('ingredientName'), 'Tofu');
  fireEvent.changeText(screen.getByLabelText('grams'), '150');
  expect(onChange).toHaveBeenLastCalledWith([
    { name: 'Ris', amount: 150, unit: 'g' },
    { name: 'Tofu', amount: 150, unit: 'g', source: 'user', identificationConfidence: 'high' },
  ]);
});

test('uses the grams field directly and preserves names containing numbers', () => {
  const screen = render(
    <FoodIdentificationModal
      mealName="Lunch"
      onMealNameChange={jest.fn()}
      value={[{ name: 'Yoghurt 3% fett', amount: 175.5, unit: 'g' }]}
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
        { name: 'Rotfrukt', amount: 60, unit: 'g', identificationConfidence: 'low', source: 'image' },
        { name: 'Morot', amount: 40, unit: 'g', identificationConfidence: 'high', source: 'user' },
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
    { name: 'Palsternacka', amount: 75, unit: 'g', identificationConfidence: 'high', source: 'user' },
    { name: 'Morot', amount: 40, unit: 'g', identificationConfidence: 'high', source: 'user' },
  ]);
});

test('shows the dish name separately from ingredients and allows renaming it', () => {
  const onMealNameChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Nötköttsgryta med potatismos"
      onMealNameChange={onMealNameChange}
      value={[
        { name: 'Nötkött', amount: 150, unit: 'g' },
        { name: 'Potatismos', amount: 200, unit: 'g' },
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

test('shows preparation separately and preserves edited preparation with the weight', () => {
  const onChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Gryta"
      onMealNameChange={jest.fn()}
      value={[{ name: 'Morot', amount: 60, unit: 'g', preparation: 'i gryta' }]}
      onChange={onChange}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByText('(i gryta)')).toBeTruthy();
  fireEvent.press(screen.getByText('Morot'));
  expect(screen.getByLabelText('preparation').props.value).toBe('i gryta');
  fireEvent.changeText(screen.getByLabelText('preparation'), 'kokt');
  fireEvent.changeText(screen.getByLabelText('grams'), '75');
  expect(onChange).toHaveBeenLastCalledWith([{ name: 'Morot', amount: 75, unit: 'g', preparation: 'kokt' }]);
});

test('shows and edits drinks in ml and lets manually added rows use ml', () => {
  const onChange = jest.fn();
  const screen = render(
    <FoodIdentificationModal
      mealName="Middag"
      onMealNameChange={jest.fn()}
      value={[
        { name: 'Rödvin', amount: 150, unit: 'ml' },
        { name: 'Morot', amount: 60, unit: 'g' },
      ]}
      onChange={onChange}
      onClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  expect(screen.getByText('150 ml')).toBeTruthy();
  expect(screen.getByText('60 g')).toBeTruthy();
  fireEvent.press(screen.getByText('Rödvin'));
  expect(screen.getByLabelText('milliliters').props.value).toBe('150');
  fireEvent.changeText(screen.getByLabelText('milliliters'), '175');
  expect(onChange).toHaveBeenLastCalledWith([
    { name: 'Rödvin', amount: 175, unit: 'ml' },
    { name: 'Morot', amount: 60, unit: 'g' },
  ]);
  fireEvent.press(screen.getByText('add'));
  fireEvent.changeText(screen.getByLabelText('ingredientName'), 'Vatten');
  fireEvent.press(screen.getByLabelText('useMilliliters'));
  fireEvent.changeText(screen.getByLabelText('milliliters'), '250');
  expect(onChange).toHaveBeenLastCalledWith([
    { name: 'Rödvin', amount: 175, unit: 'ml' },
    { name: 'Morot', amount: 60, unit: 'g' },
    { name: 'Vatten', amount: 250, unit: 'ml', source: 'user', identificationConfidence: 'high' },
  ]);
});
