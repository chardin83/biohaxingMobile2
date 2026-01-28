import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { StorageProvider, useStorage } from '../app/context/StorageContext';
import { Message } from '../app/domain/Message';
import { Plan } from '../app/domain/Plan';
import { askGPT, buildSystemPrompt, sendFileToAIAnalysis } from '../services/gptServices';

// Mock fetch for testing service integration
global.fetch = jest.fn();

// Mock i18next
jest.mock('i18next', () => ({
  t: (key: string, options?: any) => {
    if (key === 'prompts:system.withPlanTemplate') {
      return `You are a health assistant. Current plan: ${options?.plan}`;
    }
    if (key === 'prompts:system.noPlan') {
      return 'You are a health assistant. No current plan.';
    }
    return key;
  },
}));

// Mock config
jest.mock('@/config', () => ({
  ENDPOINTS: {
    askAIv2: 'http://test-server:7071/api/askAIv2',
    handleSupplementCheck: 'http://test-server:7071/api/handleSupplementCheck',
  },
}));

describe('Services Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('GPT Service Integration with Storage Context', () => {
    it('should build system prompt with real plan data from storage', async () => {
      let contextValues: any = {};

      const TestComponent = () => {
        const ctx = useStorage();
        React.useEffect(() => {
          contextValues = ctx;
        });
        return null;
      };

      render(
        <StorageProvider>
          <TestComponent />
        </StorageProvider>
      );

      await waitFor(() => {
        expect(contextValues.isInitialized).toBe(true);
      });

      // Create a realistic health plan
      const healthPlan: Plan = {
        name: 'Morning Health Routine',
        supplements: [
          { id: 'vitamin-d', name: 'Vitamin D3', quantity: 2000, unit: 'IU' },
          { id: 'omega-3', name: 'Omega-3', quantity: 1000, unit: 'mg' },
        ],
        prefferedTime: 'morning',
        notify: false,
      };

      // Set the plan in storage
      act(() => {
        contextValues.setPlans({ supplements: [healthPlan], training: [], nutrition: [], other: [] });
        contextValues.setShareHealthPlan(true);
      });

      // Test system prompt building with real data
      const systemPrompt = buildSystemPrompt(contextValues.plans, contextValues.shareHealthPlan);

      expect(systemPrompt).toContain('You are a health assistant');
      expect(systemPrompt).toContain('morning: Vitamin D3 (2000IU), Omega-3 (1000mg)');
    });

    it('should build system prompt without plan when sharing is disabled', async () => {
      let contextValues: any = {};

      const TestComponent = () => {
        const ctx = useStorage();
        React.useEffect(() => {
          contextValues = ctx;
        });
        return null;
      };

      render(
        <StorageProvider>
          <TestComponent />
        </StorageProvider>
      );

      await waitFor(() => {
        expect(contextValues.isInitialized).toBe(true);
      });

      // Set plan but disable sharing
      const healthPlan: Plan = {
        name: 'Test Plan',
        supplements: [{ id: 'vitamin-c', name: 'Vitamin C', quantity: 500, unit: 'mg' }],
        prefferedTime: 'morning',
        notify: false,
      };

      act(() => {
        contextValues.setPlans({ supplements: [healthPlan], training: [], nutrition: [], other: [] });
        contextValues.setShareHealthPlan(false);
      });

      const systemPrompt = buildSystemPrompt(contextValues.plans, contextValues.shareHealthPlan);

      expect(systemPrompt).toBe('You are a health assistant. No current plan.');
      expect(systemPrompt).not.toContain('Vitamin C');
    });

    it('should handle GPT API integration with real message flow', async () => {
      const mockResponse = {
        content: 'This is a helpful response about your health plan.',
        usage: { prompt_tokens: 50, completion_tokens: 30, total_tokens: 80 },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      });

      const messages: Message[] = [
        {
          role: 'system',
          content: 'You are a health assistant.',
        },
        {
          role: 'user',
          content: 'How should I take my vitamins?',
        },
      ];

      const response = await askGPT(messages);

      expect(fetch).toHaveBeenCalledWith('http://test-server:7071/api/askAIv2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      expect(response).toEqual(mockResponse);
    });

    it('should handle file analysis service integration', async () => {
      const mockAnalysisResponse = {
        type: 'supplement_detection',
        content: 'Detected Vitamin D supplement',
        confidence: 0.95,
        match: true,
      };


      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockAnalysisResponse)),
        json: () => Promise.resolve(mockAnalysisResponse),
      });

      const fileData = {
        uri: 'file://test-image.jpg',
        name: 'supplement_photo.jpg',
        type: 'image/jpeg',
        prompt: 'Analyze this supplement image',
        supplement: 'Vitamin D',
      };

      const response = await sendFileToAIAnalysis(fileData);

      expect(fetch).toHaveBeenCalledWith('http://test-server:7071/api/handleSupplementCheck', {
        method: 'POST',
        body: expect.any(FormData),
      });

      expect(response).toEqual(mockAnalysisResponse);
    });

    it('should handle API errors gracefully', async () => {

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('AI-analys misslyckades: 500'),
      });

      const fileData = {
        uri: 'file://test-image.jpg',
        name: 'supplement_photo.jpg',
        type: 'image/jpeg',
        prompt: 'Analyze this supplement image',
      };

      await expect(sendFileToAIAnalysis(fileData)).rejects.toThrow('AI-analys misslyckades: 500');
    });
  });

  describe('Full Service Integration Workflow', () => {
    it('should handle complete chat workflow with storage integration', async () => {
      let contextValues: any = {};

      const TestComponent = () => {
        const ctx = useStorage();
        React.useEffect(() => {
          contextValues = ctx;
        });
        return null;
      };

      render(
        <StorageProvider>
          <TestComponent />
        </StorageProvider>
      );

      await waitFor(() => {
        expect(contextValues.isInitialized).toBe(true);
      });

      // Setup health plan
      const healthPlan: Plan = {
        name: 'Comprehensive Health Plan',
        supplements: [
          { id: 'multivitamin', name: 'Multivitamin', quantity: 1, unit: 'tablet' },
          { id: 'fish-oil', name: 'Fish Oil', quantity: 2, unit: 'capsules' },
        ],
        prefferedTime: 'evening',
        notify: false,
      };

      act(() => {
        contextValues.setPlans({ supplements: [healthPlan], training: [], nutrition: [], other: [] });
        contextValues.setShareHealthPlan(true);
        contextValues.setHasVisitedChat(false);
      });

      // Build system prompt with real plan data
      const systemPrompt = buildSystemPrompt(contextValues.plans, contextValues.shareHealthPlan);
      expect(systemPrompt).toContain('evening: Multivitamin (1tablet), Fish Oil (2capsules)');

      // Mock GPT response
      const mockGPTResponse = {
        content:
          'Based on your evening routine with Multivitamin and Fish Oil, I recommend taking them with a meal for better absorption.',
        usage: { prompt_tokens: 75, completion_tokens: 40, total_tokens: 115 },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockGPTResponse)),
      });

      // Simulate user asking about their plan
      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'When is the best time to take my supplements?' },
      ];

      const response = await askGPT(messages);

      expect(response.content).toContain('evening routine');
      expect(response.content).toContain('better absorption');

      // Update chat visited status
      act(() => {
        contextValues.setHasVisitedChat(true);
      });

      expect(contextValues.hasVisitedChat).toBe(true);
    });

    it('should integrate supplement analysis with goal tracking', async () => {
      let contextValues: any = {};

      const TestComponent = () => {
        const ctx = useStorage();
        React.useEffect(() => {
          contextValues = ctx;
        });
        return null;
      };

      render(
        <StorageProvider>
          <TestComponent />
        </StorageProvider>
      );

      await waitFor(() => {
        expect(contextValues.isInitialized).toBe(true);
      });

      // Setup active plan entry (training placeholder)
      const planEntry = {
        mainGoalId: 'energy-boost',
        tipId: 'vitamin-d-routine',
        startedAt: new Date().toISOString(),
        planCategory: 'training' as const,
      };

      act(() => {
        contextValues.setPlans({ supplements: [], training: [planEntry], nutrition: [], other: [] });
      });

      // Mock supplement analysis response
      const mockAnalysisResponse = {
        type: 'supplement_verification',
        content: 'Confirmed: This is Vitamin D3 2000 IU',
        confidence: 0.92,
        match: true,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(mockAnalysisResponse)),
        json: () => Promise.resolve(mockAnalysisResponse),
      });

      // Analyze supplement photo for active goal
      const analysisResult = await sendFileToAIAnalysis({
        uri: 'file://vitamin-d-photo.jpg',
        name: 'vitamin_d_verification.jpg',
        type: 'image/jpeg',
        prompt: 'Verify this is the correct Vitamin D supplement for my goal',
        supplement: 'Vitamin D3',
      });

      expect(analysisResult.match).toBe(true);
      expect(analysisResult.content).toContain('Vitamin D3 2000 IU');

      // This analysis could trigger goal progress updates
      // In a real integration, this might update taken dates or progress
      const today = new Date().toISOString().split('T')[0];
      const newTakenDates = { [today]: ['vitamin-d-routine'] };

      act(() => {
        contextValues.setTakenDates(newTakenDates);
      });

      expect(contextValues.takenDates[today]).toContain('vitamin-d-routine');
    });
  });
});
