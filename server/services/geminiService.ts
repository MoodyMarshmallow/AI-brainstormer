/**
 * ===================================================================
 * GEMINI SERVICE - Forum AI Brainstorming Application
 * ===================================================================
 * 
 * This service provides a generic interface to Google's Gemini AI API
 * for generating AI responses. While the Forum application primarily uses
 * the specialized PersonalityService, this service provides additional
 * AI capabilities for future expansion and general-purpose AI operations.
 * 
 * Key Features:
 * - Multiple response generation with diverse prompting strategies
 * - Configurable number of response variants (2-5)
 * - Robust fallback system for offline/error scenarios
 * - Parallel request processing for improved performance
 * - Comprehensive error handling and logging
 * 
 * Architecture:
 * - Uses prompt templates to generate diverse perspectives
 * - Implements fallback responses matching template types
 * - Supports future manager/worker agent patterns
 * 
 * Dependencies:
 * - Google Generative AI (Gemini) for response generation
 * - Environment variable GEMINI_API_KEY for API authentication
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import { GoogleGenAI } from '@google/genai';

// ===================================================================
// GOOGLE GEMINI AI INITIALIZATION
// ===================================================================

/**
 * Initializes the Google Generative AI client with API key from environment.
 * Handles configuration validation and error scenarios gracefully.
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
  console.info(`Gemini API key configured (${apiKey.length} characters, starts with: ${apiKey.substring(0, 8)}...)`);
  
  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI:', error);
    return null;
  }
};

// ===================================================================
// PROMPT TEMPLATES CONFIGURATION
// ===================================================================

/**
 * Template prompts for generating diverse AI responses.
 * Each template approaches the user's prompt from a different angle:
 * - Practical perspective: Focus on real-world implementation
 * - Problems/challenges: Identify potential issues
 * - Creative brainstorming: Explore innovative solutions
 * - Benefits/opportunities: Highlight positive outcomes
 * - Expert analysis: Provide professional insights
 */
const PROMPT_TEMPLATES = [
  "Analyze this from a practical perspective: {prompt}",
  "What are potential problems or challenges with: {prompt}",
  "Think creatively and brainstorm innovative ideas about: {prompt}",
  "Consider the benefits and opportunities of: {prompt}",
  "What would an expert in this field say about: {prompt}"
];

// ===================================================================
// MAIN RESPONSE GENERATION FUNCTIONS
// ===================================================================

/**
 * Generates multiple AI responses for a given prompt using diverse templates.
 * This function creates varied perspectives on the same topic by using
 * different prompt templates and processing them in parallel.
 * 
 * Process:
 * 1. Validates and limits the number of variants (2-5)
 * 2. Initializes Google Gemini AI client
 * 3. Creates diverse prompts using templates
 * 4. Generates responses in parallel for better performance
 * 5. Validates and cleans up responses
 * 6. Falls back to static responses if API fails
 * 
 * @param {string} prompt - The user's topic or question to explore
 * @param {number} [numVariants=4] - Number of response variants to generate (2-5)
 * @returns {Promise<string[]>} Array of AI-generated response strings
 * 
 * @example
 * const responses = await generateResponses("Starting a tech startup", 3);
 * // Returns: ["Practical perspective...", "Challenges include...", "Creative ideas..."]
 */
export const generateResponses = async (prompt: string, numVariants: number = 4): Promise<string[]> => {
  try {
    // Limit variants to prevent API abuse
    const variants = Math.min(Math.max(numVariants, 2), 5);
    
    const genAI = initializeGenAI();
    
    // Check if API key is configured
    if (!genAI) {
      console.warn('GEMINI_API_KEY not configured, using fallback responses');
      return getFallbackResponses(prompt, variants);
    }
    
    // Create diverse prompts based on templates
    const promptVariations = PROMPT_TEMPLATES.slice(0, variants).map(template =>
      template.replace('{prompt}', prompt)
    );
    
    // Generate responses in parallel for better performance
    const responsePromises = promptVariations.map(async (variation) => {
      try {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.0-flash-001',
          contents: variation,
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
          console.warn(`Short or empty response for variation: ${variation.substring(0, 50)}...`);
          return getFallbackForPrompt(variation);
        }
        
        return cleanedText;
        
      } catch (error) {
        console.error('Individual Gemini API call failed:', error);
        // Return a fallback for this specific prompt
        return getFallbackForPrompt(variation);
      }
    });
    
    // Wait for all responses
    const responses = await Promise.all(responsePromises);
    
    // Filter out any empty responses and ensure we have valid content
    const validResponses = responses.filter(response => response && response.length > 10);
    
    if (validResponses.length === 0) {
      console.warn('No valid responses from Gemini API, using fallback');
      return getFallbackResponses(prompt, variants);
    }
    
    // If we have some valid responses but fewer than requested, log it
    if (validResponses.length < variants) {
      console.info(`Generated ${validResponses.length} valid responses out of ${variants} requested`);
    }
    
    return validResponses;
    
  } catch (error) {
    console.error('Gemini service error:', error);
    // Return fallback responses if API completely fails
    const variants = Math.min(Math.max(numVariants, 2), 5);
    return getFallbackResponses(prompt, variants);
  }
};

// ===================================================================
// FALLBACK RESPONSE SYSTEM
// ===================================================================

/**
 * Generates a single fallback response for a specific prompt variation.
 * This function matches the template type and provides appropriate
 * fallback content that maintains the intended perspective.
 * 
 * @param {string} variation - The prompt variation that failed
 * @returns {string} A fallback response matching the template type
 */
const getFallbackForPrompt = (variation: string): string => {
  // Extract the original prompt from the variation
  const promptMatch = variation.match(/: (.+)$/);
  const originalPrompt = promptMatch ? promptMatch[1] : variation;
  
  // Determine the type of perspective based on the template
  if (variation.includes('practical perspective')) {
    return `From a practical standpoint, "${originalPrompt}" involves considering real-world implementation challenges, resource requirements, and immediate actionable steps that can be taken.`;
  } else if (variation.includes('problems or challenges')) {
    return `The potential challenges with "${originalPrompt}" might include resource constraints, technical limitations, user adoption barriers, and unexpected complications that could arise during implementation.`;
  } else if (variation.includes('creatively and brainstorm')) {
    return `Creative approaches to "${originalPrompt}" could involve thinking outside conventional boundaries, exploring unconventional solutions, combining unexpected elements, or reimagining the fundamental assumptions.`;
  } else if (variation.includes('benefits and opportunities')) {
    return `The benefits and opportunities of "${originalPrompt}" may include improved efficiency, cost savings, enhanced user experience, competitive advantages, and potential for scalable growth.`;
  } else if (variation.includes('expert in this field')) {
    return `An expert perspective on "${originalPrompt}" would likely emphasize best practices, industry standards, proven methodologies, potential pitfalls to avoid, and strategic considerations for long-term success.`;
  } else {
    return `AI-generated insight: "${originalPrompt}" presents various considerations worth exploring from multiple angles and perspectives.`;
  }
};

/**
 * Generates complete fallback responses for all template types.
 * This function is called when the AI API is unavailable or fails completely.
 * Each response matches the perspective of its corresponding template.
 * 
 * @param {string} prompt - The original user prompt
 * @param {number} numVariants - Number of fallback responses to generate
 * @returns {string[]} Array of fallback response strings
 */
const getFallbackResponses = (prompt: string, numVariants: number): string[] => {
  const fallbacks = [
    `From a practical standpoint, "${prompt}" involves considering real-world implementation challenges, resource requirements, and immediate actionable steps that can be taken.`,
    `The potential challenges with "${prompt}" might include resource constraints, technical limitations, user adoption barriers, and unexpected complications that could arise during implementation.`,
    `Creative approaches to "${prompt}" could involve thinking outside conventional boundaries, exploring unconventional solutions, combining unexpected elements, or reimagining the fundamental assumptions.`,
    `The benefits and opportunities of "${prompt}" may include improved efficiency, cost savings, enhanced user experience, competitive advantages, and potential for scalable growth.`,
    `An expert perspective on "${prompt}" would likely emphasize best practices, industry standards, proven methodologies, potential pitfalls to avoid, and strategic considerations for long-term success.`
  ];
  
  return fallbacks.slice(0, numVariants);
};

// ===================================================================
// FUTURE EXPANSION - AGENT PATTERN SUPPORT
// ===================================================================

/**
 * Placeholder for manager agent functionality.
 * This function is designed for future expansion to support more complex
 * AI workflows with manager-worker agent patterns.
 * 
 * @param {string} prompt - The user's prompt to analyze
 * @returns {Promise<string[]>} Array of manager-level insights
 * 
 * @todo Implement manager agent logic for complex workflows
 * @todo Define manager-specific prompt templates
 * @todo Integrate with workflow orchestration system
 */
export const getManagerResponse = async (prompt: string) => {
  // TODO: Implement manager agent logic for more complex workflows
  return ['Angle 1', 'Angle 2', 'Angle 3'];
};

/**
 * Placeholder for worker agent functionality.
 * This function is designed for future expansion to support more complex
 * AI workflows with manager-worker agent patterns.
 * 
 * @param {string} prompt - The user's prompt to process
 * @returns {Promise<string>} Worker-level response
 * 
 * @todo Implement worker agent logic for specialized tasks
 * @todo Define worker-specific capabilities and constraints
 * @todo Integrate with task distribution system
 */
export const getWorkerResponse = async (prompt: string) => {
  // TODO: Implement worker agent logic for more complex workflows
  return `Response to ${prompt}`;
};
