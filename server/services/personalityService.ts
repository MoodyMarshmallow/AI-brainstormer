/**
 * ===================================================================
 * PERSONALITY SERVICE - Forum AI Brainstorming Application
 * ===================================================================
 * 
 * This service manages the core personality system of the Forum application.
 * It handles the generation of responses from three distinct AI personalities
 * that provide different perspectives on user-submitted topics.
 * 
 * The Three Personalities:
 * 1. OPTIMIST - Focuses on opportunities and positive outcomes
 * 2. PESSIMIST - Identifies risks and potential challenges  
 * 3. REALIST - Provides balanced, practical analysis
 * 
 * Key Features:
 * - Parallel personality response generation using Google's Gemini API
 * - Robust fallback system for offline/error scenarios
 * - Consistent personality traits through system prompts
 * - Branching conversation support for deeper exploration
 * - Comprehensive error handling and logging
 * 
 * Dependencies:
 * - Google Generative AI (Gemini) for personality response generation
 * - Environment variable GEMINI_API_KEY for API authentication
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import { GoogleGenAI } from '@google/genai';

// ===================================================================
// PERSONALITY CONFIGURATION
// ===================================================================

/**
 * Configuration for the three fixed personalities in Forum.
 * Each personality has a unique system prompt that defines its perspective
 * and approach to analyzing user topics.
 */
export const PERSONAS = [
  {
    name: 'optimist',
    systemPrompt: 'You are an Optimist AI personality. Assume the best-case scenario and highlight bold opportunities. Focus on potential, possibilities, and positive outcomes. Be encouraging and forward-thinking, but stay grounded in reality. Respond with enthusiasm while maintaining credibility.',
    color: 'green'
  },
  {
    name: 'pessimist', 
    systemPrompt: 'You are a Pessimist AI personality. Surface risks, pitfalls, and worst-case outcomes first. Focus on challenges, obstacles, and potential failures. Be cautious and analytical, identifying what could go wrong. Provide critical perspective while being constructive.',
    color: 'red'
  },
  {
    name: 'realist',
    systemPrompt: 'You are a Realist AI personality. Project the most likely scenario, balancing pros and cons. Focus on practical considerations and realistic expectations. Provide balanced assessment considering both opportunities and constraints. Be pragmatic and evidence-based.',
    color: 'grey'
  }
];

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

/**
 * Type representing the three available AI personalities.
 * Used throughout the application for type safety and consistency.
 */
export type PersonalityName = 'optimist' | 'pessimist' | 'realist';

/**
 * Interface for personality response data.
 * Contains the personality identifier, response text, and UI color.
 */
export interface PersonalityResponse {
  /** The personality that generated this response */
  persona: PersonalityName;
  
  /** The actual response text from the AI personality */
  text: string;
  
  /** Color associated with this personality for UI theming */
  color: string;
}

// ===================================================================
// GOOGLE GEMINI AI INITIALIZATION
// ===================================================================

/**
 * Initializes the Google Generative AI client for personality response generation.
 * 
 * This function creates and configures the Google Generative AI client specifically
 * for the personality service, using the GEMINI_API_KEY environment variable.
 * It provides comprehensive logging and graceful fallback behavior.
 * 
 * Configuration Process:
 * 1. Validates GEMINI_API_KEY environment variable existence
 * 2. Logs API key configuration status with partial key for verification
 * 3. Creates GoogleGenAI client instance with error handling
 * 4. Returns null if configuration fails, triggering fallback responses
 * 
 * Security Features:
 * - Only logs first 8 characters of API key for verification
 * - Handles initialization errors without exposing sensitive data
 * - Provides clear warnings when fallback mode is activated
 * 
 * @returns {GoogleGenAI | null} Initialized GenAI client or null if API key unavailable
 */
const initializeGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, will use fallback responses');
    return null;
  }
  
  // Log that API key is configured (but don't log the actual key)
  console.info(`Gemini API key configured for PersonalityService (${apiKey.length} characters, starts with: ${apiKey.substring(0, 8)}...)`);
  
  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI for PersonalityService:', error);
    return null;
  }
};

// ===================================================================
// MAIN PERSONALITY GENERATION FUNCTIONS
// ===================================================================

/**
 * Generates responses from all three AI personalities for a given prompt.
 * This is the main function used to create the initial set of personality
 * responses when a user submits a topic for exploration.
 * 
 * Process:
 * 1. Initializes Google Gemini AI client
 * 2. Generates responses from all three personalities in parallel
 * 3. Validates and cleans up responses
 * 4. Falls back to static responses if API fails
 * 5. Ensures all three personalities are represented
 * 
 * @param {string} prompt - The user's topic or question to explore
 * @returns {Promise<PersonalityResponse[]>} Array of three personality responses
 * 
 * @example
 * const responses = await generatePersonalityResponses("Starting a tech startup");
 * // Returns: [optimist_response, pessimist_response, realist_response]
 */
export const generatePersonalityResponses = async (prompt: string): Promise<PersonalityResponse[]> => {
  try {
    const genAI = initializeGenAI();
    
    // Check if API key is configured
    if (!genAI) {
      console.warn('GEMINI_API_KEY not configured, using personality fallback responses');
      return getPersonalityFallbackResponses(prompt);
    }
    
    console.info(`Generating personality responses for prompt: "${prompt.substring(0, 50)}..."`);
    
    // Generate responses from all three personalities in parallel
    const responsePromises = PERSONAS.map(async (persona) => {
      try {
        // Combine system prompt with user prompt
        const fullPrompt = `${persona.systemPrompt}\n\nUser prompt: "${prompt}"\n\nProvide your response as the ${persona.name} personality:`;
        
        const response = await genAI.models.generateContent({
          model: 'gemini-2.0-flash-001',
          contents: fullPrompt,
          config: {
            maxOutputTokens: 500,
            temperature: 0.7,
            candidateCount: 1
          }
        });
        
        const text = response.text;
        
        // Clean up the response and ensure it's not empty
        const cleanedText = text?.trim();
        if (!cleanedText || cleanedText.length < 10) {
          console.warn(`Short or empty response from ${persona.name} personality`);
          return getPersonalityFallback(persona.name as PersonalityName, prompt);
        }
        
        console.info(`✅ Generated ${persona.name} response: ${cleanedText.substring(0, 100)}...`);
        
        return {
          persona: persona.name as PersonalityName,
          text: cleanedText,
          color: persona.color
        };
        
      } catch (error) {
        console.error(`${persona.name} personality API call failed:`, error);
        // Return a fallback for this specific personality
        return getPersonalityFallback(persona.name as PersonalityName, prompt);
      }
    });
    
    // Wait for all personality responses
    const responses = await Promise.all(responsePromises);
    
    // Filter out any invalid responses
    const validResponses = responses.filter(response => response && response.text && response.text.length > 10);
    
    if (validResponses.length === 0) {
      console.warn('No valid personality responses from Gemini API, using fallback');
      return getPersonalityFallbackResponses(prompt);
    }
    
    // Log successful generation
    console.info(`✅ Generated ${validResponses.length}/3 personality responses successfully`);
    
    // If we're missing some personalities, fill with fallbacks
    if (validResponses.length < 3) {
      const missingPersonalities = PERSONAS.filter(p => 
        !validResponses.some(r => r.persona === p.name)
      );
      
      for (const persona of missingPersonalities) {
        console.warn(`Adding fallback for missing ${persona.name} personality`);
        validResponses.push(getPersonalityFallback(persona.name as PersonalityName, prompt));
      }
    }
    
    // Ensure responses are in the correct order (optimist, pessimist, realist)
    const orderedResponses = [
      validResponses.find(r => r.persona === 'optimist'),
      validResponses.find(r => r.persona === 'pessimist'), 
      validResponses.find(r => r.persona === 'realist')
    ].filter(Boolean) as PersonalityResponse[];
    
    return orderedResponses;
    
  } catch (error) {
    console.error('PersonalityService error:', error);
    // Return fallback responses if API completely fails
    return getPersonalityFallbackResponses(prompt);
  }
};

// ===================================================================
// FALLBACK RESPONSE SYSTEM
// ===================================================================

/**
 * Generates a single fallback response for a specific personality.
 * Used when the AI API fails or returns invalid responses.
 * 
 * Each personality has a unique fallback template that maintains
 * its characteristic perspective and tone.
 * 
 * @param {PersonalityName} personality - The personality to generate fallback for
 * @param {string} prompt - The original user prompt
 * @returns {PersonalityResponse} A fallback response for the specified personality
 */
const getPersonalityFallback = (personality: PersonalityName, prompt: string): PersonalityResponse => {
  const persona = PERSONAS.find(p => p.name === personality)!;
  
  let fallbackText: string;
  
  switch (personality) {
    case 'optimist':
      fallbackText = `This is exciting! "${prompt}" presents incredible opportunities for growth and innovation. I see tremendous potential for positive impact and successful outcomes. The possibilities are endless, and with the right approach, this could lead to remarkable achievements. Let's focus on the bright side and bold opportunities ahead!`;
      break;
      
    case 'pessimist':
      fallbackText = `We need to be careful with "${prompt}". There are significant risks and potential pitfalls to consider. What could go wrong? Resource constraints, implementation challenges, and unexpected complications are likely. We should identify failure modes and prepare for worst-case scenarios before proceeding.`;
      break;
      
    case 'realist':
      fallbackText = `Looking at "${prompt}" realistically, there are both opportunities and challenges to consider. Success will likely require careful planning, adequate resources, and managing expectations. The most probable outcome involves a balanced approach that addresses practical constraints while pursuing achievable goals.`;
      break;
      
    default:
      fallbackText = `A balanced perspective on "${prompt}" suggests considering multiple angles and practical implications.`;
  }
  
  return {
    persona: personality,
    text: fallbackText,
    color: persona.color
  };
};

/**
 * Generates complete fallback responses for all three personalities.
 * This function is called when the AI API is unavailable or fails completely.
 * 
 * @param {string} prompt - The original user prompt
 * @returns {PersonalityResponse[]} Array of three fallback personality responses
 */
const getPersonalityFallbackResponses = (prompt: string): PersonalityResponse[] => {
  console.info('Using personality fallback responses');
  
  return [
    getPersonalityFallback('optimist', prompt),
    getPersonalityFallback('pessimist', prompt),
    getPersonalityFallback('realist', prompt)
  ];
};

// ===================================================================
// BRANCHING CONVERSATION SUPPORT
// ===================================================================

/**
 * Generates personality responses for follow-up questions (branching conversations).
 * This function allows users to explore deeper into any personality's response
 * by asking follow-up questions or requesting elaboration.
 * 
 * @param {string} parentText - The original personality response being expanded
 * @param {string} [followUpPrompt] - Optional follow-up question from the user
 * @returns {Promise<PersonalityResponse[]>} Array of three personality responses to the follow-up
 * 
 * @example
 * // Expanding on a previous response
 * const responses = await generatePersonalityBranch(
 *   "Starting a tech startup is exciting...",
 *   "What about funding challenges?"
 * );
 */
export const generatePersonalityBranch = async (parentText: string, followUpPrompt?: string): Promise<PersonalityResponse[]> => {
  const contextPrompt = followUpPrompt 
    ? `Building on this idea: "${parentText}"\n\nFollow-up question: "${followUpPrompt}"`
    : `Expanding on this concept: "${parentText}"`;
    
  return generatePersonalityResponses(contextPrompt);
}; 