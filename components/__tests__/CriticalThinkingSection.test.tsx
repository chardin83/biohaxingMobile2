import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import CriticalThinkingSection from '@/components/sections/details/CriticalThinkingSection';
import { getInsightQuestionXP, MAX_TIP_EDUCATION_XP } from '@/constants/tipXP';
import { XP_FOR_CHAT_QUESTION, XP_FOR_INFORMATION_READ,XP_FOR_VERDICT } from '@/constants/XP';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: ({ name }: { name: string }) => {
  const mockReact = require('react');
  return mockReact.createElement(require('react-native').Text, null, name);
} }));

it('opens all three insight questions and only offers XP for unopened questions', () => {
  const onPress = jest.fn();
  const screen = render(<CriticalThinkingSection askedQuestions={[]} onPress={onPress} />);
  expect(screen.getAllByRole('button')).toHaveLength(3);
  expect(screen.getAllByText('+5 XP')).toHaveLength(3);
  const rows = [
    ['whatStudiesExist', 'insights.studies'],
    ['whoAreTheExperts', 'insights.experts'],
    ['whatAreTheRisks', 'insights.risks'],
  ];
  rows.forEach(([titleKey, promptKey]) => {
    fireEvent.press(screen.getByText(`common:tipDetails.${titleKey}`));
    expect(onPress).toHaveBeenLastCalledWith(promptKey);
  });
  screen.rerender(<CriticalThinkingSection askedQuestions={['studies']} onPress={onPress} />);
  expect(screen.getAllByText('+5 XP')).toHaveLength(2);
  expect(screen.getByText('checkCircle')).toBeTruthy();
  fireEvent.press(screen.getByText('common:tipDetails.whatStudiesExist'));
  expect(onPress).toHaveBeenLastCalledWith('insights.studies');
});

it('uses the central XP values and prevents repeat question rewards', () => {
  expect(getInsightQuestionXP([], 'studies')).toBe(XP_FOR_CHAT_QUESTION);
  expect(getInsightQuestionXP(['studies'], 'studies')).toBe(0);
  expect(getInsightQuestionXP(['studies'], 'experts')).toBe(XP_FOR_CHAT_QUESTION);
  expect(MAX_TIP_EDUCATION_XP).toBe(XP_FOR_INFORMATION_READ + 3 * XP_FOR_CHAT_QUESTION + XP_FOR_VERDICT);
});
