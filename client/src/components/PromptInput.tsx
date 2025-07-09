/**
 * ===================================================================
 * PROMPT INPUT - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides the main input interface for the Forum application.
 * It allows users to enter topics for exploration by the AI personalities
 * and displays information about the three personality types.
 * 
 * The PromptInput component serves as the entry point for all Forum
 * conversations, handling user input validation, session creation,
 * and providing visual feedback about the personality system.
 * 
 * Key Features:
 * - Text input for topic submission
 * - Form validation with error handling
 * - Loading states during session creation
 * - Personality system introduction
 * - Responsive design with visual feedback
 * - Accessibility considerations
 * 
 * User Experience:
 * - Clear placeholder text with examples
 * - Visual state changes for focus/blur
 * - Disabled state during loading
 * - Smooth transitions and animations
 * - Error feedback for invalid inputs
 * 
 * Personality System Display:
 * - Optimist: Green styling with opportunity focus
 * - Pessimist: Red styling with risk analysis
 * - Realist: Gray styling with balanced perspective
 * 
 * Dependencies:
 * - React hooks for state management
 * - Zustand store for global state
 * - API service for session creation
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useState } from 'react';
import { useGraphStore } from '../store/graphStore';
import { brainstormApi } from '../services/api';
// import './PromptInput.css'; // REMOVED FOR TESTING

/**
 * PromptInput component for topic submission and personality introduction.
 * 
 * This component handles the initial user interaction with the Forum system,
 * providing a clean interface for topic entry and personality system education.
 * 
 * Component Features:
 * - Form-based topic submission
 * - Real-time input validation
 * - Loading states with visual feedback
 * - Error handling with user-friendly messages
 * - Personality system introduction cards
 * - Responsive design for various screen sizes
 * 
 * State Management:
 * - Local state for input value and validation
 * - Global state for graph updates and loading
 * - Error state management with automatic clearing
 * 
 * User Flow:
 * 1. User enters topic in input field
 * 2. Input validation occurs on submit
 * 3. Loading state shows progress
 * 4. Session created with personality responses
 * 5. Graph updated with new conversation
 * 6. Input cleared for next topic
 * 
 * @returns {JSX.Element} The complete prompt input interface
 */
const PromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const { setGraph, setLoading, setError, isLoading } = useGraphStore();

  /**
   * Handles form submission for topic exploration.
   * 
   * This function manages the complete flow from user input to graph update,
   * including validation, API calls, and state management.
   * 
   * Submission Process:
   * 1. Prevents default form submission
   * 2. Validates input for empty/whitespace-only content
   * 3. Sets loading state and clears previous errors
   * 4. Calls API to create new session with personalities
   * 5. Updates graph store with returned data
   * 6. Clears input field on success
   * 7. Handles errors with user-friendly messages
   * 
   * Error Handling:
   * - Client-side validation for empty inputs
   * - Server-side error handling with fallback messages
   * - Loading state management in all scenarios
   * 
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a topic to explore');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.info(`🎭 Starting Forum exploration for: "${prompt.trim()}"`);
      const response = await brainstormApi.createSession(prompt.trim());
      setGraph(response.nodes, response.edges, response.sessionId);
      setPrompt(''); // Clear input after successful submission
      console.info(`✅ Forum session created with ${response.nodes.length} nodes`);
    } catch (error) {
      console.error('Failed to create Forum session:', error);
      setError('Failed to generate personality perspectives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
      marginBottom: '20px' 
    }}>
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#667eea', 
          margin: '0 0 8px 0',
          textShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
        }}>🎭 Forum</h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: '#64748b', 
          margin: '0',
          fontWeight: '500'
        }}>Explore ideas through three distinct AI personalities</p>
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter any topic to explore (e.g., 'Starting a sustainable business', 'Learning AI programming')"
            style={{
              flex: '1',
              padding: '16px 20px',
              fontSize: '16px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              outline: 'none',
              background: isLoading ? '#f8fafc' : 'white',
              color: isLoading ? '#94a3b8' : '#1e293b',
              transition: 'all 0.2s ease-in-out'
            }}
            disabled={isLoading}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#667eea'}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#e2e8f0'}
          />
          <button 
            type="submit" 
            style={{
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: (!prompt.trim() || isLoading) ? '#94a3b8' : '#667eea',
              border: 'none',
              borderRadius: '12px',
              cursor: (!prompt.trim() || isLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              whiteSpace: 'nowrap',
              transform: (!prompt.trim() || isLoading) ? 'none' : 'scale(1)',
              boxShadow: (!prompt.trim() || isLoading) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
            disabled={isLoading || !prompt.trim()}
            onMouseEnter={(e) => {
              if (!isLoading && prompt.trim()) {
                (e.target as HTMLButtonElement).style.background = '#5a67d8';
                (e.target as HTMLButtonElement).style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && prompt.trim()) {
                (e.target as HTMLButtonElement).style.background = '#667eea';
                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
              }
            }}
          >
            {isLoading ? '🎭 Generating Perspectives...' : '🎭 Explore Topic'}
          </button>
        </div>
      </form>
      
      {/* Personality System Introduction */}
      <div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '12px',
          marginTop: '16px'
        }}>
          <span style={{ 
            padding: '12px 16px', 
            borderRadius: '10px', 
            background: '#dcfce7', 
            border: '1px solid #bbf7d0',
            color: '#166534', 
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🌟 <strong>Optimist</strong> - Highlights opportunities & best-case scenarios
          </span>
          <span style={{ 
            padding: '12px 16px', 
            borderRadius: '10px', 
            background: '#fef2f2', 
            border: '1px solid #fecaca',
            color: '#dc2626', 
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ <strong>Pessimist</strong> - Identifies risks & potential challenges  
          </span>
          <span style={{ 
            padding: '12px 16px', 
            borderRadius: '10px', 
            background: '#f3f4f6', 
            border: '1px solid #d1d5db',
            color: '#374151', 
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚖️ <strong>Realist</strong> - Provides balanced, practical perspective
          </span>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
