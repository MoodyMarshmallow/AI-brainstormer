/**
 * ===================================================================
 * CUSTOM NODE - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides a custom React Flow node for the Forum application.
 * It renders both user prompts and AI personality responses with distinct
 * styling and visual indicators for each personality type.
 * 
 * The CustomNode component handles the visual representation of conversation
 * elements in the graph, providing personality-specific styling and
 * interactive hover effects.
 * 
 * Key Features:
 * - Personality-based color coding and styling
 * - Visual distinction between prompts and responses
 * - Personality indicator badges with emojis
 * - Interactive hover effects with elevation
 * - Responsive design with text truncation
 * - Accessibility-friendly color contrast
 * 
 * Node Types:
 * - Prompt nodes: Blue styling with "Topic" label
 * - Response nodes: Color-coded by personality with badges
 * 
 * Personality Styling:
 * - Optimist: Green theme with star emoji (🌟)
 * - Pessimist: Red theme with warning emoji (⚠️)
 * - Realist: Gray theme with balance emoji (⚖️)
 * 
 * Dependencies:
 * - React Flow for node props and handle components
 * - Shared types for personality definitions
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import type { PersonalityName } from '../../../shared/types';

/**
 * Interface defining the data structure for custom node props.
 * Contains all information needed to render the node with appropriate styling.
 */
interface CustomNodeData {
  /** The display text for the node (truncated if too long) */
  label: string;
  
  /** The AI personality that generated this node (undefined for prompts) */
  persona?: PersonalityName;
  
  /** Whether this node represents a user prompt (true) or AI response (false) */
  isPrompt?: boolean;
}

/**
 * Custom React Flow node component for Forum conversation visualization.
 * 
 * This component renders nodes in the conversation graph with personality-specific
 * styling and interactive features. It handles both user prompts and AI responses
 * with distinct visual treatments.
 * 
 * Styling Features:
 * - Personality-based color themes
 * - Hover effects with elevation and scale
 * - Personality indicator badges with emojis
 * - Text truncation for readability
 * - Responsive dimensions and padding
 * 
 * Node Types:
 * - Prompt nodes: Clean blue styling with "Topic" label
 * - Response nodes: Personality colors with uppercase persona labels
 * 
 * Accessibility:
 * - High contrast color combinations
 * - Clear visual hierarchy with labels
 * - Keyboard navigation support through React Flow
 * 
 * @param {NodeProps} props - React Flow node props containing id and data
 * @param {string} props.id - Unique identifier for the node
 * @param {CustomNodeData} props.data - Node-specific data including label and persona
 * @returns {JSX.Element} The rendered custom node with styling and handles
 */
export const CustomNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as CustomNodeData;
  const isPrompt = nodeData.isPrompt;
  
  /**
   * Determines the color scheme for the node based on its type and personality.
   * 
   * Returns appropriate colors for backgrounds, borders, and text based on
   * whether the node is a prompt or which personality generated the response.
   * 
   * @returns {Object} Color scheme object with background, border, and text colors
   */
  const getNodeColors = () => {
    if (isPrompt) {
      return {
        background: '#ffffff',
        border: '#667eea',
        text: '#667eea'
      };
    }
    
    switch (nodeData.persona) {
      case 'optimist':
        return {
          background: '#ffffff',
          border: '#10b981',
          text: '#065f46'
        };
      case 'pessimist':
        return {
          background: '#ffffff',
          border: '#ef4444',
          text: '#991b1b'
        };
      case 'realist':
        return {
          background: '#ffffff',
          border: '#6b7280',
          text: '#374151'
        };
      default:
        return {
          background: '#ffffff',
          border: '#e5e7eb',
          text: '#374151'
        };
    }
  };
  
  const colors = getNodeColors();
  const label = nodeData.label;
  
  return (
    <div className="customNode" style={{ position: 'relative' }}>
      <div 
        className="customNodeBody"
        style={{
          background: colors.background,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          minWidth: '150px',
          maxWidth: '250px',
          minHeight: '60px',
          padding: '12px 16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease',
          cursor: isPrompt ? 'default' : 'pointer',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Persona indicator badge */}
        {!isPrompt && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: colors.border,
              border: `2px solid ${colors.background}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            {nodeData.persona === 'optimist' ? '🌟' : 
             nodeData.persona === 'pessimist' ? '⚠️' : '⚖️'}
          </div>
        )}

        {/* Content */}
        <div 
          style={{
            color: colors.text,
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '1.4',
            textAlign: 'left',
            wordWrap: 'break-word',
            hyphens: 'auto',
          }}
        >
          {isPrompt && (
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: colors.border,
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Topic
            </div>
          )}
          {!isPrompt && (
            <div style={{ 
              fontSize: '11px', 
              fontWeight: '600', 
              color: colors.border,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {nodeData.persona}
            </div>
          )}
          <div>{label}</div>
        </div>
      </div>

      {/* Invisible handles required for floating edges */}
      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
}; 