/**
 * ===================================================================
 * D3 FORCE GRAPH - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides the main graph visualization interface using
 * D3 force simulation for physics-based positioning. It replaces the
 * React Flow implementation with native D3 for better control over
 * force-directed layouts.
 * 
 * Key Features:
 * - D3 force simulation for natural node positioning
 * - Interactive node clicking for conversation expansion
 * - Real-time graph updates with smooth animations
 * - Personality-based color coding and styling
 * - Drag support for manual node positioning
 * - Responsive design with loading states
 * - Dynamic rounded rectangle nodes that resize to fit text
 * 
 * Force Features:
 * - Center force: Keeps graph centered
 * - Charge force: Node repulsion for spacing
 * - Link force: Edge constraints
 * - Collision force: Prevents node overlap with dynamic sizing
 * 
 * Dependencies:
 * - D3 force simulation libraries
 * - Zustand store for state management
 * - API service for server communication
 * - Shared types for data structures
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
  Simulation
} from 'd3-force';
import { select, Selection } from 'd3-selection';
import { drag } from 'd3-drag';
import { useGraphStore } from '../store/graphStore';
import { brainstormApi } from '../services/api';
import type { Node as GraphNode, Edge as GraphEdge, PersonalityName } from '../../../shared/types';

// ===================================================================
// D3 TYPES AND INTERFACES
// ===================================================================

/**
 * Extended node interface for D3 force simulation with dynamic sizing
 */
interface D3Node extends SimulationNodeDatum {
  id: string;
  text: string;
  parentId?: string;
  type: 'prompt' | 'response';
  persona?: PersonalityName;
  color?: string;
  width?: number;
  height?: number;
  radius?: number; // For collision detection
}

/**
 * Extended link interface for D3 force simulation
 */
interface D3Link extends SimulationLinkDatum<D3Node> {
  id: string;
  source: string | D3Node;
  target: string | D3Node;
}

// ===================================================================
// FORCE SIMULATION CONFIGURATION
// ===================================================================

const FORCE_CONFIG = {
  CENTER_STRENGTH: 0.1,
  CHARGE_STRENGTH: -400,
  LINK_DISTANCE: 200,
  BASE_COLLISION_RADIUS: 60,
  MIN_NODE_WIDTH: 120,
  MAX_NODE_WIDTH: 300,
  NODE_HEIGHT: 80,
  NODE_PADDING: 16,
  ALPHA_DECAY: 0.02,
  VELOCITY_DECAY: 0.4,
  BORDER_RADIUS: 12
};

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Estimates text width based on character count and font size
 */
const estimateTextWidth = (text: string, fontSize: number = 11): number => {
  // Rough estimation: average character width is about 0.6 * fontSize
  return text.length * fontSize * 0.6;
};

/**
 * Calculates optimal node dimensions based on text content
 */
const calculateNodeDimensions = (text: string, isPrompt: boolean = false): { width: number, height: number, radius: number } => {
  const fontSize = 11;
  const lineHeight = 14;
  const maxCharsPerLine = 30; // Approximate characters per line
  
  // Calculate how many lines we'll need
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  
  // Limit to max 4 lines and add ellipsis if needed
  if (lines.length > 4) {
    lines = lines.slice(0, 4);
    lines[3] = lines[3].substring(0, maxCharsPerLine - 3) + '...';
  }
  
  // Calculate dimensions
  const longestLine = lines.reduce((longest, line) => 
    line.length > longest.length ? line : longest, '');
  
  const textWidth = estimateTextWidth(longestLine, fontSize);
  const width = Math.max(
    FORCE_CONFIG.MIN_NODE_WIDTH,
    Math.min(FORCE_CONFIG.MAX_NODE_WIDTH, textWidth + FORCE_CONFIG.NODE_PADDING * 2)
  );
  
  const height = Math.max(
    FORCE_CONFIG.NODE_HEIGHT,
    lines.length * lineHeight + FORCE_CONFIG.NODE_PADDING * 2
  );
  
  // Collision radius should be based on the larger dimension
  const radius = Math.max(width, height) / 2 + 10;
  
  return { width, height, radius };
};

/**
 * Converts internal graph nodes to D3 nodes with dynamic sizing
 */
const convertToD3Nodes = (nodes: GraphNode[]): D3Node[] => {
  return nodes.map(node => {
    const dimensions = calculateNodeDimensions(node.text, node.type === 'prompt');
    return {
      ...node,
      x: node.position.x || 0,
      y: node.position.y || 0,
      width: dimensions.width,
      height: dimensions.height,
      radius: dimensions.radius
    };
  });
};

/**
 * Converts internal graph edges to D3 links
 */
const convertToD3Links = (edges: GraphEdge[]): D3Link[] => {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target
  }));
};

/**
 * Gets node color based on personality or type
 */
const getNodeColor = (node: D3Node): string => {
  if (node.type === 'prompt') return '#667eea';
  
  switch (node.persona) {
    case 'optimist':
      return '#10b981';
    case 'pessimist':
      return '#ef4444';
    case 'realist':
      return '#6b7280';
    default:
      return '#94a3b8';
  }
};

/**
 * Wraps text into multiple lines for better display
 */
const wrapText = (text: string, maxCharsPerLine: number = 30): string[] => {
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  
  // Limit to max 4 lines
  if (lines.length > 4) {
    lines = lines.slice(0, 4);
    lines[3] = lines[3].substring(0, maxCharsPerLine - 3) + '...';
  }
  
  return lines;
};

// ===================================================================
// MAIN D3 FORCE GRAPH COMPONENT
// ===================================================================

/**
 * Main D3ForceGraph component for rendering the conversation graph.
 * 
 * This component provides a complete D3-based graph visualization,
 * including force simulation, interactive node expansion, and
 * real-time updates with dynamically sized rounded rectangle nodes.
 */
export const D3ForceGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<Simulation<D3Node, D3Link> | null>(null);
  
  const {
    nodes: graphNodes,
    edges: graphEdges,
    sessionId,
    isLoading,
    error,
    addNodes,
    setLoading,
    setError
  } = useGraphStore();

  /**
   * Handles node click events to expand personality responses.
   */
  const handleNodeClick = useCallback(async (event: MouseEvent, node: D3Node) => {
    // Only allow clicking on personality response nodes (not prompt nodes)
    if (node.type === 'prompt' || isLoading) return;

    console.info(`🎯 Expanding ${node.persona} response:`, node.text.substring(0, 100));

    try {
      setLoading(true);
      setError(null);

      if (!sessionId) {
        throw new Error('No active session');
      }

      // Forum expansion always generates 3 personality responses
      const response = await brainstormApi.expandNode(sessionId, node.id);
      addNodes(response.newNodes, response.newEdges);
      
      console.info(`✅ Added ${response.newNodes.length} new nodes from personality expansion`);
    } catch (err) {
      console.error('❌ Failed to expand node:', err);
      setError('Failed to expand idea. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sessionId, isLoading, addNodes, setLoading, setError]);

  /**
   * Creates and manages the D3 force simulation with dynamic node sizing
   */
  useEffect(() => {
    if (!svgRef.current || graphNodes.length === 0) return;

    const svg = select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Clear previous content
    svg.selectAll('*').remove();

    // Convert data to D3 format
    const d3Nodes = convertToD3Nodes(graphNodes);
    const d3Links = convertToD3Links(graphEdges);

    // Create force simulation with dynamic collision detection
    const simulation = forceSimulation<D3Node>(d3Nodes)
      .force('link', forceLink<D3Node, D3Link>(d3Links)
        .id((d) => d.id)
        .distance(FORCE_CONFIG.LINK_DISTANCE)
      )
      .force('charge', forceManyBody().strength(FORCE_CONFIG.CHARGE_STRENGTH))
      .force('center', forceCenter(width / 2, height / 2).strength(FORCE_CONFIG.CENTER_STRENGTH))
      .force('collision', forceCollide<D3Node>().radius((d) => d.radius || FORCE_CONFIG.BASE_COLLISION_RADIUS))
      .alphaDecay(FORCE_CONFIG.ALPHA_DECAY)
      .velocityDecay(FORCE_CONFIG.VELOCITY_DECAY);

    simulationRef.current = simulation;

    // Create container groups
    const container = svg.append('g').attr('class', 'graph-container');
    const linksGroup = container.append('g').attr('class', 'links');
    const nodesGroup = container.append('g').attr('class', 'nodes');

    // Create links
    const links = linksGroup
      .selectAll('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.7);

    // Create node groups
    const nodeGroups = nodesGroup
      .selectAll('g')
      .data(d3Nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', (d) => d.type === 'response' ? 'pointer' : 'default');

    // Add rounded rectangles to nodes
    nodeGroups
      .append('rect')
      .attr('width', (d) => d.width || FORCE_CONFIG.MIN_NODE_WIDTH)
      .attr('height', (d) => d.height || FORCE_CONFIG.NODE_HEIGHT)
      .attr('x', (d) => -(d.width || FORCE_CONFIG.MIN_NODE_WIDTH) / 2)
      .attr('y', (d) => -(d.height || FORCE_CONFIG.NODE_HEIGHT) / 2)
      .attr('rx', FORCE_CONFIG.BORDER_RADIUS)
      .attr('ry', FORCE_CONFIG.BORDER_RADIUS)
      .attr('fill', getNodeColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add text to nodes with proper wrapping
    nodeGroups.each(function(d) {
      const nodeGroup = select(this);
      const lines = wrapText(d.text);
      const lineHeight = 14;
      const startY = -(lines.length - 1) * lineHeight / 2;
      
      // Add persona label for response nodes
      if (d.type === 'response' && d.persona) {
        nodeGroup
          .append('text')
          .attr('y', startY - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', 'bold')
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('pointer-events', 'none')
          .text(d.persona.toUpperCase());
      }
      
      // Add main text lines
      lines.forEach((line, i) => {
        nodeGroup
          .append('text')
          .attr('y', startY + i * lineHeight + (d.type === 'response' ? 8 : 0))
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', d.type === 'prompt' ? 'bold' : 'normal')
          .attr('fill', 'white')
          .attr('pointer-events', 'none')
          .text(line);
      });
    });

    // Add drag behavior
    const dragBehavior = drag<SVGGElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroups.call(dragBehavior);

    // Add click behavior for expansion
    nodeGroups.on('click', handleNodeClick);

    // Update positions on each tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroups
        .attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [graphNodes, graphEdges, handleNodeClick]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      if (simulationRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        simulationRef.current
          .force('center', forceCenter(width / 2, height / 2).strength(FORCE_CONFIG.CENTER_STRENGTH))
          .alpha(0.3)
          .restart();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===================================================================
  // RENDER STATES
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
      
      {/* D3 SVG Canvas - Fullscreen */}
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
    </div>
  );
};

export default D3ForceGraph; 