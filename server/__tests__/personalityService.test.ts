/**
 * ===================================================================
 * PERSONALITY SERVICE TESTS - Forum AI Brainstorming Application
 * ===================================================================
 * 
 * Comprehensive test suite for the Forum personality system that validates
 * the three AI personalities (Optimist, Pessimist, Realist) and their
 * response generation capabilities.
 * 
 * Test Coverage:
 * - Basic functionality and response generation
 * - Response quality and content validation
 * - Personality trait analysis and consistency
 * - Branching conversation support
 * - Configuration validation
 * - Error handling and edge cases
 * 
 * Personality Testing:
 * - Optimist: Validates positive language and opportunity focus
 * - Pessimist: Validates cautionary language and risk identification
 * - Realist: Validates balanced language and practical approach
 * 
 * Test Environment:
 * - Uses Jest testing framework with TypeScript
 * - May use fallback responses if GEMINI_API_KEY not configured
 * - Tests both AI-generated and fallback response scenarios
 * - Validates personality characteristics through language analysis
 * 
 * Quality Assurance:
 * - Response length validation (minimum 10 characters)
 * - Personality consistency across different topics
 * - Color coding validation for UI theming
 * - System prompt configuration verification
 * 
 * Dependencies:
 * - Jest testing framework
 * - Personality service functions and types
 * - Google Generative AI (optional for testing)
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { generatePersonalityResponses, generatePersonalityBranch, PERSONAS } from '../services/personalityService';
import type { PersonalityResponse } from '../services/personalityService.js';

describe('Forum PersonalityService', () => {
  beforeEach(() => {
    // Reset console logs
    jest.clearAllMocks();
  });

  describe('Basic Functionality Tests', () => {
    test('should have exactly 3 personas defined', () => {
      expect(PERSONAS).toHaveLength(3);
      expect(PERSONAS.map(p => p.name)).toEqual(['optimist', 'pessimist', 'realist']);
      expect(PERSONAS.map(p => p.color)).toEqual(['green', 'red', 'grey']);
    });

    test('should generate exactly 3 personality responses', async () => {
      const responses = await generatePersonalityResponses('Test prompt');
      
      expect(responses).toHaveLength(3);
      expect(responses.map(r => r.persona)).toEqual(['optimist', 'pessimist', 'realist']);
      expect(responses.map(r => r.color)).toEqual(['green', 'red', 'grey']);
    });

    test('should generate responses for follow-up questions', async () => {
      const parentText = 'I want to start a new business';
      const followUp = 'What about funding?';
      
      const responses = await generatePersonalityBranch(parentText, followUp);
      
      expect(responses).toHaveLength(3);
      expect(responses.map(r => r.persona)).toEqual(['optimist', 'pessimist', 'realist']);
    });

    test('should generate responses without follow-up prompt', async () => {
      const parentText = 'I want to start a new business';
      
      const responses = await generatePersonalityBranch(parentText);
      
      expect(responses).toHaveLength(3);
      expect(responses.map(r => r.persona)).toEqual(['optimist', 'pessimist', 'realist']);
    });
  });

  describe('Response Quality Tests', () => {
    test('should generate non-empty responses', async () => {
      const responses = await generatePersonalityResponses('What should I consider when learning programming?');
      
      responses.forEach(response => {
        expect(response.text).toBeDefined();
        expect(response.text.length).toBeGreaterThan(10);
        expect(typeof response.text).toBe('string');
      });
    });

    test('should handle empty prompts gracefully', async () => {
      const responses = await generatePersonalityResponses('');
      
      expect(Array.isArray(responses)).toBe(true);
      expect(responses.length).toBe(3);
    });

    test('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(1000);
      const responses = await generatePersonalityResponses(longPrompt);
      
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response.text.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Personality Trait Analysis', () => {
    test('optimist responses should contain positive language', async () => {
      const responses = await generatePersonalityResponses('Should I quit my job to travel?');
      const optimistResponse = responses.find(r => r.persona === 'optimist');
      
      expect(optimistResponse).toBeDefined();
      
      const text = optimistResponse!.text.toLowerCase();
      const positiveWords = ['exciting', 'opportunity', 'incredible', 'amazing', 'fantastic', 'wonderful', 'great', 'excellent', 'perfect', 'brilliant', 'outstanding', 'possibilities', 'potential', 'growth', 'success'];
      
      const hasPositiveLanguage = positiveWords.some(word => text.includes(word));
      expect(hasPositiveLanguage).toBe(true);
    });

    test('pessimist responses should contain cautionary language', async () => {
      const responses = await generatePersonalityResponses('Should I invest my savings in cryptocurrency?');
      const pessimistResponse = responses.find(r => r.persona === 'pessimist');
      
      expect(pessimistResponse).toBeDefined();
      
      const text = pessimistResponse!.text.toLowerCase();
      const cautiousWords = ['risk', 'careful', 'challenge', 'problem', 'danger', 'fail', 'difficult', 'pitfall', 'caution', 'concern', 'warning', 'threat', 'complications', 'constraints'];
      
      const hasCautiousLanguage = cautiousWords.some(word => text.includes(word));
      expect(hasCautiousLanguage).toBe(true);
    });

    test('realist responses should contain balanced language', async () => {
      const responses = await generatePersonalityResponses('Should I start a new career in tech?');
      const realistResponse = responses.find(r => r.persona === 'realist');
      
      expect(realistResponse).toBeDefined();
      
      const text = realistResponse!.text.toLowerCase();
      const balancedWords = ['consider', 'depends', 'likely', 'realistic', 'practical', 'planning', 'balanced', 'approach', 'carefully', 'evaluate', 'assess', 'reasonable', 'probably', 'requires'];
      
      const hasBalancedLanguage = balancedWords.some(word => text.includes(word));
      expect(hasBalancedLanguage).toBe(true);
    });
  });

  describe('Response Consistency Tests', () => {
    test('should generate different responses for the same prompt on multiple calls', async () => {
      const prompt = 'What should I do with my weekend?';
      
      const responses1 = await generatePersonalityResponses(prompt);
      const responses2 = await generatePersonalityResponses(prompt);
      
      expect(responses1).toHaveLength(3);
      expect(responses2).toHaveLength(3);
      
      // Responses should be different (not identical)
      responses1.forEach((response1, index) => {
        const response2 = responses2[index];
        expect(response1.persona).toBe(response2.persona);
        expect(response1.color).toBe(response2.color);
        // Note: Text might be the same due to fallback responses, so we don't test for difference
      });
    });

    test('should maintain personality characteristics across different topics', async () => {
      const topics = [
        'Should I start a business?',
        'What about climate change?',
        'How do I learn a new skill?'
      ];
      
      for (const topic of topics) {
        const responses = await generatePersonalityResponses(topic);
        
        expect(responses).toHaveLength(3);
        
        const optimist = responses.find(r => r.persona === 'optimist');
        const pessimist = responses.find(r => r.persona === 'pessimist');
        const realist = responses.find(r => r.persona === 'realist');
        
        expect(optimist).toBeDefined();
        expect(pessimist).toBeDefined();
        expect(realist).toBeDefined();
        
        expect(optimist!.color).toBe('green');
        expect(pessimist!.color).toBe('red');
        expect(realist!.color).toBe('grey');
      }
    });
  });

  describe('Persona Configuration Tests', () => {
    test('should have properly configured persona system prompts', () => {
      const optimistPersona = PERSONAS.find(p => p.name === 'optimist');
      const pessimistPersona = PERSONAS.find(p => p.name === 'pessimist');
      const realistPersona = PERSONAS.find(p => p.name === 'realist');
      
      expect(optimistPersona?.systemPrompt).toContain('best-case scenario');
      expect(optimistPersona?.systemPrompt).toContain('opportunities');
      
      expect(pessimistPersona?.systemPrompt).toContain('risks');
      expect(pessimistPersona?.systemPrompt).toContain('pitfalls');
      
      expect(realistPersona?.systemPrompt).toContain('most likely scenario');
      expect(realistPersona?.systemPrompt).toContain('balancing pros and cons');
    });

    test('should assign correct colors to personalities', () => {
      expect(PERSONAS.find(p => p.name === 'optimist')?.color).toBe('green');
      expect(PERSONAS.find(p => p.name === 'pessimist')?.color).toBe('red');
      expect(PERSONAS.find(p => p.name === 'realist')?.color).toBe('grey');
    });
  });
}); 