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
  
  const getNodeColor = () => {
    if (isPrompt) return '#667eea';
    
    switch (nodeData.persona) {
      case 'optimist':
        return '#10b981';
      case 'pessimist':
        return '#ef4444';
      case 'realist':
        return '#6b7280';
      default:
        return '#f0f2f5';
    }
  };
  
  return (
    <div className="customNode">
      {/* Invisible handles for edge connections - non-interactive */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          visibility: 'hidden',
          pointerEvents: 'none',
          width: '1px',
          height: '1px'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          visibility: 'hidden',
          pointerEvents: 'none',
          width: '1px',
          height: '1px'
        }}
      />
      
      <div 
        className="customNodeBody"
        style={{
          backgroundColor: getNodeColor(),
          color: 'white',
          width: '200px',
          height: '80px',
          position: 'relative',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '12px',
          textAlign: 'center',
          padding: '10px',
          border: '1px solid #ededed',
          boxShadow: '0px 3.54px 4.55px 0px #00000005, 0px 3.54px 4.55px 0px #0000000d, 0px 0.51px 1.01px 0px #0000001a',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {nodeData.label}
      </div>
    </div>
  );
}; 