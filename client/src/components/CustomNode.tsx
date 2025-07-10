import React from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import type { PersonalityName } from '../../../shared/types';

interface CustomNodeData {
  label: string;
  persona?: PersonalityName;
  isPrompt?: boolean;
}

export const CustomNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as unknown as CustomNodeData;
  const isPrompt = nodeData.isPrompt;
  
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