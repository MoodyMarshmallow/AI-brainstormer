import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useGraphStore } from '../store/graphStore';
import type { Node } from '../../../shared/types';

interface ContentOverlayProps {
  node: Node;
  onClose: () => void;
}

export const ContentOverlay: React.FC<ContentOverlayProps> = ({ node, onClose }) => {
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

  const getPersonalityEmoji = () => {
    switch (node.persona) {
      case 'optimist': return '🌟';
      case 'pessimist': return '⚠️';
      case 'realist': return '⚖️';
      default: return '💭';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close overlay if clicking on the background (not the content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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