/**
 * ===================================================================
 * GRAPH CANVAS - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides the main graph visualization interface for the
 * Forum application. It renders the conversation graph using React Flow
 * and enables interactive exploration of AI personality responses.
 * 
 * The GraphCanvas displays conversation nodes and edges in an interactive
 * graph format, allowing users to click on personality responses to
 * generate deeper explorations of topics.
 * 
 * Key Features:
 * - Interactive graph visualization with React Flow
 * - Click-to-expand personality responses
 * - Real-time graph updates for branching conversations
 * - Responsive design with loading states and error handling
 * - Personality-based color coding and styling
 * - Empty state with helpful instructions
 * - Minimap and controls for navigation
 * 
 * Graph Structure:
 * - Prompt nodes: User-submitted topics (input type)
 * - Response nodes: AI personality responses (default type)
 * - Edges: Connections showing conversation flow
 * 
 * Personality System:
 * - Optimist: Green nodes with opportunity focus
 * - Pessimist: Red nodes with risk analysis
 * - Realist: Gray nodes with balanced perspective
 * 
 * Dependencies:
 * - React Flow for graph visualization
 * - Zustand store for state management
 * - API service for server communication
 * - Shared types for data structures
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  Panel,
  useStore,
} from '@xyflow/react';
import { useGraphStore } from '../store/graphStore';
import { brainstormApi } from '../services/api';
import { CustomNode } from './CustomNode';
import { FloatingEdge } from './FloatingEdge';
import { ContentOverlay } from './ContentOverlay';
import type { Node as GraphNode, Edge as GraphEdge, PersonalityName } from '../../../shared/types';
// import './GraphCanvas.css'; // REMOVED FOR TESTING

import '@xyflow/react/dist/style.css';

// ===================================================================
// NODE TYPES DEFINITION
// ===================================================================

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  floating: FloatingEdge,
};

// ===================================================================
// GRAPH CONVERSION UTILITIES
// ===================================================================

/**
 * Converts internal graph nodes to React Flow nodes with appropriate styling.
 * 
 * This function transforms the application's graph data structure into
 * React Flow compatible nodes with personality-based styling and labels.
 * 
 * Node Types:
 * - Prompt nodes: Input type with blue styling
 * - Response nodes: Default type with personality-based colors
 * 
 * Styling Features:
 * - Personality color coding (green/red/gray)
 * - Truncated text display for readability
 * - Consistent sizing and border radius
 * - Accessibility-friendly color contrast
 * 
 * @param {GraphNode[]} nodes - Array of internal graph nodes
 * @returns {Node[]} Array of React Flow compatible nodes
 */
const convertToReactFlowNodes = (nodes: GraphNode[]): Node[] => {
  return nodes.map(node => {
    const isPrompt = node.type === 'prompt';
    
    // Simplified text display for readability
    const displayText = node.text.length > 100 ? node.text.substring(0, 100) + '...' : node.text;
    
    // Create label for custom node
    const nodeLabel = isPrompt 
      ? displayText
      : `${node.persona?.toUpperCase()}: ${displayText}`;

    return {
      id: node.id,
      type: 'custom',
      position: node.position,
      data: { 
        label: nodeLabel,
        persona: node.persona,
        isPrompt: isPrompt
      }
    };
  });
};

/**
 * Converts internal graph edges to React Flow edges with floating edge styling.
 * 
 * This function transforms the application's edge data structure into
 * React Flow compatible edges with floating edge calculations.
 * 
 * Edge Features:
 * - Floating edges that calculate optimal connection points
 * - Clean lines without arrows
 * - Consistent color and stroke width
 * - Source and target node data for positioning calculations
 * 
 * @param {GraphEdge[]} edges - Array of internal graph edges
 * @param {Node[]} nodes - Array of React Flow nodes for data lookup
 * @returns {Edge[]} Array of React Flow compatible floating edges
 */
const convertToReactFlowEdges = (edges: GraphEdge[], nodes: Node[]): Edge[] => {
  return edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'floating',
      style: { 
        stroke: '#94a3b8', 
        strokeWidth: 2,
      },
      data: {
        sourceNode,
        targetNode,
      },
    };
  });
};

// ===================================================================
// MAIN GRAPH CANVAS COMPONENT
// ===================================================================

/**
 * Main GraphCanvas component for rendering the conversation graph.
 * 
 * This component provides the complete graph visualization interface,
 * including interactive node expansion, loading states, error handling,
 * and empty state guidance.
 * 
 * Component Features:
 * - Real-time graph updates from Zustand store
 * - Click-to-expand personality responses
 * - Loading overlay during async operations
 * - Error banner with dismiss functionality
 * - Empty state with personality introductions
 * - Minimap and controls for navigation
 * 
 * User Interactions:
 * - Click on personality nodes to expand conversations
 * - Use controls for zooming and panning
 * - Dismiss errors with close button
 * - Navigate using minimap
 * 
 * @returns {JSX.Element} The complete graph canvas interface
 */
export const GraphCanvas: React.FC = () => {
  const {
    nodes: graphNodes,
    edges: graphEdges,
    sessionId,
    isLoading,
    error,
    addNodes,
    setLoading,
    setError,
    overlayNode,
    isOverlayVisible,
    showOverlay,
    hideOverlay
  } = useGraphStore();

  const [nodes, setNodesState, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState<Edge>([]);
  const { getNodes } = useReactFlow();

  /**
   * Memoized conversion functions to prevent unnecessary recalculations
   */
  const reactFlowNodes = React.useMemo(() => 
    convertToReactFlowNodes(graphNodes), 
    [graphNodes]
  );

  const reactFlowEdges = React.useMemo(() => 
    convertToReactFlowEdges(graphEdges, reactFlowNodes), 
    [graphEdges, reactFlowNodes]
  );

  /**
   * Updates React Flow nodes and edges when graph state changes.
   * Skip updates when overlay is visible to improve performance.
   */
  useEffect(() => {
    // Skip expensive state updates when overlay is open
    if (isOverlayVisible) return;
    
    setNodesState(reactFlowNodes);
    setEdgesState(reactFlowEdges);
  }, [reactFlowNodes, reactFlowEdges, setNodesState, setEdgesState, isOverlayVisible]);

  /**
   * Updates floating edges when nodes change position
   * Skip updates when overlay is visible to improve performance
   */
  useEffect(() => {
    // Skip expensive edge calculations when overlay is open
    if (isOverlayVisible) return;
    
    const currentNodes = getNodes();
    if (currentNodes.length > 0 && graphEdges.length > 0) {
      const updatedEdges = convertToReactFlowEdges(graphEdges, currentNodes);
      setEdgesState(updatedEdges);
    }
  }, [nodes, graphEdges, getNodes, setEdgesState, isOverlayVisible]);

  /**
   * Handles node click events to show content overlay.
   * 
   * This function manages the core interaction for viewing detailed
   * content of personality responses in an overlay format.
   * 
   * Click Behavior:
   * - Only personality response nodes are clickable
   * - Prompt nodes and loading states are ignored
   * - Shows content overlay with full markdown-formatted text
   * - Keeps prompt input visible for follow-up questions
   * 
   * @param {any} event - React Flow click event
   * @param {any} node - Clicked node object
   */
  const onNodeClick = React.useCallback((event: any, node: any) => {
    // Only allow clicking on personality response nodes (not prompt nodes)
    if (node.data.isPrompt || isLoading || isOverlayVisible) return;

    // Find the original graph node to get full content
    const originalNode = graphNodes.find(n => n.id === node.id);
    if (!originalNode || !originalNode.persona) return;

    console.info(`👁️ Showing overlay for ${originalNode.persona} response`);
    showOverlay(originalNode);
  }, [isLoading, isOverlayVisible, graphNodes, showOverlay]);

  // ===================================================================
  // RENDER STATES
  // ===================================================================

  /**
   * Renders the empty state when no conversation has been started.
   * Provides a minimal fullscreen canvas ready for interaction.
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
          <p style={{ margin: '0', fontSize: '1.1rem' }}>Ready for AI personality exploration</p>
        </div>
      </div>
    );
  }

  /**
   * Renders the fullscreen graph interface with minimal UI elements.
   * Includes error handling, loading states, and the React Flow canvas.
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
      
      {/* React Flow Canvas - Fullscreen */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isOverlayVisible ? undefined : onNodesChange}
        onEdgesChange={isOverlayVisible ? undefined : onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!isOverlayVisible}
        nodesConnectable={false}
        elementsSelectable={!isOverlayVisible}
        fitView
        attributionPosition="bottom-right"
        style={{ 
          width: '100%', 
          height: '100%',
          pointerEvents: isOverlayVisible ? 'none' : 'auto'
        }}
      >
        {!isOverlayVisible && <Background />}
        {!isOverlayVisible && <Controls />}
        {!isOverlayVisible && (
          <MiniMap 
            position="top-right"
            nodeColor={(node: Node) => {
              const nodeData = node.data as any;
              if (nodeData.isPrompt) {
                return '#667eea'; // Indigo for prompt nodes
              }
              
              switch (nodeData.persona) {
                case 'optimist':
                  return '#10b981'; // Emerald green for optimist
                case 'pessimist':
                  return '#ef4444'; // Red for pessimist
                case 'realist':
                  return '#6b7280'; // Gray for realist
                default:
                  return '#e5e7eb'; // Light gray default
              }
            }}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              background: 'white'
            }}
            pannable={true}
            zoomable={true}
          />
        )}
        <ViewportLogger />
      </ReactFlow>
      
      {/* Content Overlay */}
      {isOverlayVisible && overlayNode && (
        <ContentOverlay
          node={overlayNode}
          onClose={hideOverlay}
        />
      )}
    </div>
  );
};

// Add the component at the bottom
const ViewportLogger = () => {
  const [x, y, zoom] = useStore((state) => state.transform);
  return (
    <Panel position="top-left">
      x: {x.toFixed(2)}, y: {y.toFixed(2)}, zoom: {zoom.toFixed(2)}
    </Panel>
  );
};

export default GraphCanvas;
