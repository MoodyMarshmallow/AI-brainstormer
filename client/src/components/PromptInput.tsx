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
  const { 
    setGraph, 
    setLoading, 
    setError, 
    isLoading,
    addNodes,
    sessionId,
    overlayNode,
    isOverlayVisible,
    hideOverlay,
    nodes
  } = useGraphStore();

  // Determine if input should be visible
  // Show when: no nodes yet (initial state) OR overlay is visible (follow-up mode)
  const shouldShow = nodes.length === 0 || isOverlayVisible;

  /**
   * Handles form submission for topic exploration or follow-up.
   * 
   * This function manages two different flows:
   * 1. Initial session creation when no overlay is visible
   * 2. Follow-up conversation when overlay is visible
   * 
   * Submission Process:
   * 1. Prevents default form submission
   * 2. Validates input for empty/whitespace-only content
   * 3. Determines if this is initial session or follow-up
   * 4. Creates new session OR expands existing conversation
   * 5. Updates graph store with returned data
   * 6. Clears input field and hides overlay on success
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
      if (isOverlayVisible && overlayNode && sessionId) {
        // Follow-up mode: expand from the selected node
        console.info(`🔄 Creating follow-up from ${overlayNode.persona} response: "${prompt.trim()}"`);
        const response = await brainstormApi.expandNode(sessionId, overlayNode.id, prompt.trim());
        addNodes(response.newNodes, response.newEdges);
        hideOverlay(); // Close the overlay
        console.info(`✅ Added ${response.newNodes.length} new nodes from follow-up`);
      } else {
        // Initial session mode
        console.info(`🎭 Starting Forum exploration for: "${prompt.trim()}"`);
        const response = await brainstormApi.createSession(prompt.trim());
        setGraph(response.nodes, response.edges, response.sessionId);
        console.info(`✅ Forum session created with ${response.nodes.length} nodes`);
      }
      setPrompt(''); // Clear input after successful submission
    } catch (error) {
      console.error('Failed to process request:', error);
      if (isOverlayVisible) {
        setError('Failed to create follow-up. Please try again.');
      } else {
        setError('Failed to generate personality perspectives. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      bottom: shouldShow ? '20px' : '-200px', // Slide down when hidden
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: isOverlayVisible ? 2100 : 1000, // Higher z-index when overlay is visible
      padding: '20px', 
      maxWidth: '800px', 
      width: 'calc(100vw - 40px)', // Responsive width with margins
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)', 
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'bottom 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease', // Smooth sliding animation
      // Enhanced shadow when overlay is visible
      ...(isOverlayVisible && {
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)'
      })
    }}>
      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              isOverlayVisible 
                ? `Ask a follow-up about this ${overlayNode?.persona || 'response'}...`
                : "Enter any topic to explore (e.g., 'Starting a sustainable business', 'Learning AI programming')"
            }
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
            {isLoading 
              ? (isOverlayVisible ? '🔄 Creating Follow-up...' : '🎭 Generating Perspectives...') 
              : (isOverlayVisible ? '🔄 Ask Follow-up' : '🎭 Explore Topic')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;
