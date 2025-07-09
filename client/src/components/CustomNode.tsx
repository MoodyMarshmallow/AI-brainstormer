import React from 'react';
import { Handle, Position, useConnection, NodeProps } from '@xyflow/react';
import type { PersonalityName } from '../../../shared/types';

interface CustomNodeData {
  label: string;
  persona?: PersonalityName;
  isPrompt?: boolean;
}

export const CustomNode: React.FC<NodeProps> = ({ id, data }) => {
  const connection = useConnection();
  
  const isTarget = connection.inProgress && connection.fromNode?.id !== id;
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
  
  const label = isTarget ? 'Drop here' : nodeData.label;
  
  return (
    <div className="customNode">
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
        {/* Connection handles - only show when not connecting */}
        {!connection.inProgress && (
          <Handle
            className="customHandle"
            position={Position.Right}
            type="source"
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: '10px',
              transform: 'none',
              border: 'none',
              opacity: 0,
            }}
          />
        )}
        
        {/* Target handle - show when not connecting OR when this is a valid target */}
        {(!connection.inProgress || isTarget) && (
          <Handle
            className="customHandle"
            position={Position.Left}
            type="target"
            isConnectableStart={false}
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              position: 'absolute',
              top: 0,
              left: 0,
              borderRadius: '10px',
              transform: 'none',
              border: 'none',
              opacity: 0,
            }}
          />
        )}
        
        {label}
      </div>
    </div>
  );
}; 