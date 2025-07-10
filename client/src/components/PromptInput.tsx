/**
 * ===================================================================
 * PROMPT INPUT - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * Floating input overlay component for the Forum application.
 * Provides a minimal, always-accessible input interface at the bottom center.
 * 
 * @author Forum Development Team
 * @version 2.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';
import { brainstormApi } from '../services/api';

/**
 * Floating PromptInput overlay component.
 * 
 * Features:
 * - Fixed position at bottom center of screen
 * - Enter key submission support
 * - Loading animation with spinner
 * - Simplified minimal interface
 * - Auto-focus on page load
 * 
 * @returns {JSX.Element} The floating prompt input overlay
 */
const PromptInput = () => {
  const [prompt, setPrompt] = useState('');
  const { setGraph, addNodes, selectedNodeId, sessionId, setSelectedNode, setLoading, setError, isLoading } = useGraphStore();

  /**
   * Handles form submission and Enter key presses.
   * Supports both initial prompts and follow-up prompts.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError(selectedNodeId ? 'Please enter a follow-up question' : 'Please enter a topic to explore');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedNodeId) {
        // Handle follow-up prompt for selected node
        if (!sessionId) {
          throw new Error('No active session');
        }
        console.info(`🔗 Adding follow-up to selected node: "${prompt.trim()}"`);
        const response = await brainstormApi.expandNode(sessionId, selectedNodeId, prompt.trim());
        addNodes(response.newNodes, response.newEdges);
        setSelectedNode(null); // Clear selection after follow-up
        setPrompt(''); // Clear input after successful submission
        console.info(`✅ Follow-up added with ${response.newNodes.length} new nodes`);
      } else {
        // Handle initial prompt
        console.info(`🎭 Starting Forum exploration for: "${prompt.trim()}"`);
        const response = await brainstormApi.createSession(prompt.trim());
        setGraph(response.nodes, response.edges, response.sessionId);
        setPrompt(''); // Clear input after successful submission
        console.info(`✅ Forum session created with ${response.nodes.length} nodes`);
      }
    } catch (error) {
      console.error('Failed to submit prompt:', error);
      setError(selectedNodeId ? 'Failed to add follow-up. Please try again.' : 'Failed to generate personality perspectives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles Enter key press for submission.
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && prompt.trim() && !isLoading) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Auto-focus the input when component mounts and not loading
  useEffect(() => {
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input && !isLoading) {
      input.focus();
    }
  }, [isLoading]);

  return (
    <div style={{ 
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      maxWidth: '600px',
      width: 'calc(100vw - 64px)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedNodeId ? "Enter a follow-up question about the selected response..." : "Enter any topic to explore with AI personalities..."}
            style={{
              flex: '1',
              padding: '16px 20px',
              fontSize: '16px',
              border: '2px solid transparent',
              borderRadius: '12px',
              outline: 'none',
              background: 'rgba(255, 255, 255, 0.8)',
              color: '#1e293b',
              transition: 'all 0.2s ease-in-out',
              backdropFilter: 'blur(8px)'
            }}
            disabled={isLoading}
            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#667eea'}
            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'transparent'}
          />
          <button 
            type="submit" 
            style={{
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: (!prompt.trim() || isLoading) ? '#94a3b8' : '#667eea',
              border: 'none',
              borderRadius: '12px',
              cursor: (!prompt.trim() || isLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              whiteSpace: 'nowrap',
              minWidth: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
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
            {isLoading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Exploring...
              </>
            ) : (
              <>{selectedNodeId ? '🔗 Follow-up' : '🎭 Explore'}</>
            )}
          </button>
        </div>
        
        {/* Small hint text */}
        <div style={{
          textAlign: 'center',
          marginTop: '12px',
          fontSize: '13px',
          color: '#64748b',
          opacity: 0.8
        }}>
          {selectedNodeId 
            ? 'Press Enter or click Follow-up • Add a follow-up question to the selected response'
            : 'Press Enter or click Explore • Get instant perspectives from Optimist, Pessimist & Realist'
          }
        </div>
      </form>
      
      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PromptInput;
