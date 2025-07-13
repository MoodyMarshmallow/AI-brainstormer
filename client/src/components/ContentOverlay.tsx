/**
 * ===================================================================
 * CONTENT OVERLAY - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides a full-screen overlay for displaying detailed
 * content from conversation nodes in the Forum application. It renders
 * AI personality responses with personality-specific styling and supports
 * Markdown formatting for rich text display.
 * 
 * The ContentOverlay creates an immersive reading experience for exploring
 * AI personality responses in detail, with the ability to ask follow-up
 * questions directly from the overlay interface.
 * 
 * Key Features:
 * - Full-screen modal overlay with backdrop blur
 * - Personality-specific color themes and styling
 * - Markdown rendering for rich text formatting
 * - Interactive close functionality (ESC key, backdrop click, close button)
 * - Responsive design for various screen sizes
 * - Accessibility features for keyboard navigation
 * 
 * Personality Styling:
 * - Optimist: Green gradient background with star emoji
 * - Pessimist: Red gradient background with warning emoji
 * - Realist: Gray gradient background with balance emoji
 * - Default: Blue gradient for non-personality content
 * 
 * Interaction Methods:
 * - ESC key to close overlay
 * - Click on backdrop to close overlay
 * - Click close button (✕) in header
 * - Content area clicks are ignored (don't close overlay)
 * 
 * Dependencies:
 * - React Markdown for text formatting
 * - Zustand store for state management
 * - Shared types for node data structures
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useGraphStore } from '../store/graphStore';
import type { Node } from '../../../shared/types';

/**
 * Props interface for the ContentOverlay component.
 * Defines the required data and callback functions for the overlay.
 */
interface ContentOverlayProps {
  /** The node whose content should be displayed in the overlay */
  node: Node;
  
  /** Callback function to close the overlay */
  onClose: () => void;
}

/**
 * Content overlay component for displaying detailed node content.
 * 
 * This component creates a full-screen modal overlay that displays the complete
 * text content of a conversation node with personality-specific styling and
 * Markdown formatting support.
 * 
 * Features:
 * - Immersive full-screen experience with backdrop blur
 * - Personality-themed color schemes and gradients
 * - Rich text rendering through React Markdown
 * - Multiple close interaction methods
 * - Responsive design with scroll support
 * - Accessibility considerations
 * 
 * Layout Structure:
 * - Backdrop overlay with blur effect
 * - Centered content container with personality styling
 * - Header with emoji, title, and close button
 * - Scrollable content area with Markdown rendering
 * 
 * @param {ContentOverlayProps} props - Component props
 * @param {Node} props.node - The conversation node to display
 * @param {() => void} props.onClose - Function to call when closing the overlay
 * @returns {JSX.Element} The complete overlay interface
 */
export const ContentOverlay: React.FC<ContentOverlayProps> = ({ node, onClose }) => {
  /**
   * Determines the color scheme for the overlay based on the node's personality.
   * 
   * Returns appropriate colors for background gradients, borders, and text
   * based on which AI personality generated the content.
   * 
   * @returns {Object} Color scheme object with background, border, and text colors
   */
  const getPersonalityColors = () => {
    switch (node.persona) {
      case 'optimist':
        return {
          background: 'rgba(16, 185, 129, 0.95)', // green with transparency
          border: '#10b981',
          text: '#ffffff'
        };
      case 'pessimist':
        return {
          background: 'rgba(239, 68, 68, 0.95)', // red with transparency
          border: '#ef4444',
          text: '#ffffff'
        };
      case 'realist':
        return {
          background: 'rgba(107, 114, 128, 0.95)', // gray with transparency
          border: '#6b7280',
          text: '#ffffff'
        };
      default:
        return {
          background: 'rgba(102, 126, 234, 0.95)', // blue with transparency
          border: '#667eea',
          text: '#ffffff'
        };
    }
  };

  const colors = getPersonalityColors();

  /**
   * Returns the appropriate emoji for the personality type.
   * 
   * Provides visual personality indicators using emojis that match
   * the personality characteristics and themes.
   * 
   * @returns {string} Emoji character representing the personality
   */
  const getPersonalityEmoji = () => {
    switch (node.persona) {
      case 'optimist': return '🌟';
      case 'pessimist': return '⚠️';
      case 'realist': return '⚖️';
      default: return '💭';
    }
  };

  /**
   * Handles click events on the overlay backdrop.
   * 
   * Closes the overlay when clicking on the background but prevents
   * closing when clicking on the content area itself.
   * 
   * @param {React.MouseEvent} e - Mouse click event
   */
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close overlay if clicking on the background (not the content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Handles keyboard events for overlay interactions.
   * 
   * Supports closing the overlay with the ESC key for keyboard accessibility.
   * 
   * @param {React.KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        style={{
          background: colors.background,
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '800px',
          maxHeight: '80vh',
          width: '100%',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: `3px solid ${colors.border}`,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            borderBottom: `2px solid rgba(255, 255, 255, 0.2)`,
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>{getPersonalityEmoji()}</span>
            <h2
              style={{
                margin: 0,
                color: colors.text,
                fontSize: '24px',
                fontWeight: '700',
                textTransform: 'capitalize',
              }}
            >
              {node.persona || 'Content'}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              color: colors.text,
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: '8px 12px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content with Markdown rendering */}
        <div
          style={{
            color: colors.text,
            fontSize: '16px',
            lineHeight: '1.6',
          }}
        >
          <ReactMarkdown
            components={{
              // Style markdown elements to work well with the overlay
              p: ({ children }) => (
                <p style={{ margin: '0 0 16px 0' }}>{children}</p>
              ),
              h1: ({ children }) => (
                <h1 style={{ color: colors.text, margin: '0 0 16px 0', fontSize: '28px' }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ color: colors.text, margin: '0 0 14px 0', fontSize: '24px' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ color: colors.text, margin: '0 0 12px 0', fontSize: '20px' }}>
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul style={{ margin: '0 0 16px 0', paddingLeft: '24px' }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ margin: '0 0 16px 0', paddingLeft: '24px' }}>{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ margin: '0 0 8px 0' }}>{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  style={{
                    borderLeft: `4px solid rgba(255, 255, 255, 0.5)`,
                    paddingLeft: '16px',
                    margin: '0 0 16px 0',
                    fontStyle: 'italic',
                  }}
                >
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  }}
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '16px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  }}
                >
                  {children}
                </pre>
              ),
            }}
          >
            {node.text}
          </ReactMarkdown>
        </div>

        {/* Instructions at bottom */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `2px solid rgba(255, 255, 255, 0.2)`,
            color: colors.text,
            fontSize: '14px',
            opacity: 0.8,
            textAlign: 'center',
          }}
        >
          Type a follow-up question below to continue exploring this perspective
        </div>
      </div>
    </div>
  );
}; 