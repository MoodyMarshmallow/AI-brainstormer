/**
 * ===================================================================
 * D3 FORCE GRAPH - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides the main graph visualization interface using
 * D3 force simulation for physics-based positioning. It has been refactored
 * into a clean, modular architecture with extracted types, utilities, and hooks.
 * 
 * Key Features:
 * - D3 force simulation for natural node positioning
 * - Interactive node selection for follow-up prompts
 * - Real-time graph updates with smooth animations
 * - Personality-based color coding and styling
 * - Drag support for manual node positioning
 * - Responsive design with loading states
 * - Dynamic rounded rectangle nodes that resize to fit text
 * 
 * Architecture:
 * - Types: Extracted to types/d3Types.ts
 * - Constants: Extracted to constants/forceConfig.ts
 * - Utilities: Extracted to utils/d3Utils.ts
 * - Simulation Logic: Extracted to hooks/useD3ForceSimulation.ts
 * 
 * @author Forum Development Team
 * @version 2.0.0
 * @since 2024
 */

import React, { useCallback } from 'react';
import { useGraphStore } from '../store/graphStore';
import { useD3ForceSimulation } from '../hooks/useD3ForceSimulation';
import type { D3Node } from '../types/d3Types';

// ===================================================================
// MAIN D3 FORCE GRAPH COMPONENT
// ===================================================================

/**
 * Main D3ForceGraph component for rendering the conversation graph.
 * 
 * This component provides a clean interface to the D3 force simulation,
 * with all complex logic extracted to custom hooks and utility modules.
 * Focuses on state management and user interaction handling.
 */
export const D3ForceGraph: React.FC = () => {
  const {
    nodes: graphNodes,
    edges: graphEdges,
    selectedNodeId,
    isLoading,
    error,
    setSelectedNode
  } = useGraphStore();

  /**
   * Handles node click events to select nodes for follow-up prompts.
   */
  const handleNodeClick = useCallback((event: MouseEvent, node: D3Node) => {
    // Only allow clicking on response nodes (not prompt nodes)
    if (node.type === 'prompt' || isLoading) return;

    console.info(`🎯 Node Click: ${node.persona} response:`, node.text.substring(0, 50));

    // Toggle selection: if clicking the same node, deselect it
    // Access current selectedNodeId directly from the store to avoid recreation
    const currentSelectedId = useGraphStore.getState().selectedNodeId;
    if (currentSelectedId === node.id) {
      console.info('🔄 Deselecting node:', node.id);
      setSelectedNode(null);
    } else {
      console.info(`✅ Selecting node: ${node.id}`);
      setSelectedNode(node.id);
    }
  }, [isLoading, setSelectedNode]); // Removed selectedNodeId from deps to prevent callback recreation

  /**
   * Use the custom D3 force simulation hook for all graph logic.
   */
  const { svgRef } = useD3ForceSimulation({
    nodes: graphNodes,
    edges: graphEdges,
    selectedNodeId,
    onNodeClick: handleNodeClick,
    isLoading
  });

  // ===================================================================
  // RENDER LOGIC
  // ===================================================================

  /**
   * Renders the empty state when no conversation has been started.
   */
  if (graphNodes.length === 0 && !isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f8fafc'
      }}>
        <div style={{ 
          textAlign: 'center', 
          color: '#64748b', 
          maxWidth: '400px',
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginBottom: '16px', color: '#334155', fontSize: '1.8rem', fontWeight: '700' }}>🎭 Forum</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>Enter a topic below to explore it through three distinct AI personalities</p>
        </div>
      </div>
    );
  }

  /**
   * Renders the fullscreen D3 force graph interface.
   * All simulation logic is handled by the useD3ForceSimulation hook.
   */
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh'
    }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '0', 
          left: '0', 
          right: '0', 
          bottom: '0', 
          background: 'rgba(255, 255, 255, 0.9)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: '100',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '24px 32px', 
            borderRadius: '12px', 
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)', 
            fontWeight: '600', 
            color: '#667eea', 
            fontSize: '16px', 
            border: '2px solid #e0e7ff' 
          }}>
            🎭 Generating personality perspectives...
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#fef2f2',
          color: '#dc2626',
          padding: '12px 20px',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          zIndex: '50'
        }}>
          {error}
        </div>
      )}
      
      {/* D3 SVG Canvas - Managed by useD3ForceSimulation hook */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          width: '100vw',
          height: '100vh',
          background: '#f8fafc'
        }}
      />
      
      {/* CSS Animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default D3ForceGraph; 