/**
 * ===================================================================
 * D3 UTILITIES - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * Utility functions for D3 force simulation graph operations.
 * Includes text processing, node conversion, dimension calculations,
 * and styling functions used by the D3ForceGraph component.
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import type { Node as GraphNode, Edge as GraphEdge } from '../../../shared/types';
import type { D3Node, D3Link, NodeDimensions } from '../types/d3Types';
import { FORCE_CONFIG, TEXT_CONFIG } from '../constants/forceConfig';

// ===================================================================
// TEXT PROCESSING UTILITIES
// ===================================================================

/**
 * Estimates text width based on character count and font size.
 * Uses a rough approximation for calculating how much horizontal space text will occupy.
 * 
 * @param text - The text to measure
 * @param fontSize - Font size in pixels (defaults to standard node font size)
 * @returns Estimated width in pixels
 */
export const estimateTextWidth = (text: string, fontSize: number = TEXT_CONFIG.FONT_SIZE): number => {
  // Rough estimation: average character width is about 0.6 * fontSize
  return text.length * fontSize * TEXT_CONFIG.CHAR_WIDTH_RATIO;
};

/**
 * Wraps text into multiple lines for better display within nodes.
 * Splits text by words and creates lines that don't exceed the maximum character limit.
 * 
 * @param text - The text to wrap
 * @param maxCharsPerLine - Maximum characters per line (defaults to config value)
 * @param expanded - Whether to show full text without line limits
 * @returns Array of text lines ready for display
 */
export const wrapText = (text: string, maxCharsPerLine: number = TEXT_CONFIG.MAX_CHARS_PER_LINE, expanded: boolean = false): string[] => {
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
  
  // If expanded, return all lines without truncation
  if (expanded) {
    return lines;
  }
  
  // Limit to max lines and add ellipsis if needed
  if (lines.length > TEXT_CONFIG.MAX_LINES) {
    lines = lines.slice(0, TEXT_CONFIG.MAX_LINES);
    lines[TEXT_CONFIG.MAX_LINES - 1] = lines[TEXT_CONFIG.MAX_LINES - 1].substring(0, maxCharsPerLine - 3) + '...';
  }
  
  return lines;
};

// ===================================================================
// NODE DIMENSION CALCULATIONS
// ===================================================================

/**
 * Calculates optimal node dimensions based on text content.
 * Determines width, height, and collision radius for proper display and physics simulation.
 * 
 * @param text - The text content that will be displayed in the node
 * @param isPrompt - Whether this is a prompt node (affects styling)
 * @param expanded - Whether this is an expanded node (shows full content)
 * @returns Object containing calculated dimensions
 */
export const calculateNodeDimensions = (text: string, isPrompt: boolean = false, expanded: boolean = false): NodeDimensions => {
  const lines = wrapText(text, TEXT_CONFIG.MAX_CHARS_PER_LINE, expanded);
  
  // Calculate dimensions
  const longestLine = lines.reduce((longest, line) => 
    line.length > longest.length ? line : longest, '');
  
  const textWidth = estimateTextWidth(longestLine, TEXT_CONFIG.FONT_SIZE);
  
  // For expanded nodes, allow wider nodes and more generous sizing
  const maxWidth = expanded ? FORCE_CONFIG.MAX_NODE_WIDTH * 1.5 : FORCE_CONFIG.MAX_NODE_WIDTH;
  const minWidth = expanded ? FORCE_CONFIG.MIN_NODE_WIDTH * 1.2 : FORCE_CONFIG.MIN_NODE_WIDTH;
  
  const width = Math.max(
    minWidth,
    Math.min(maxWidth, textWidth + FORCE_CONFIG.NODE_PADDING * 2)
  );
  
  const height = Math.max(
    FORCE_CONFIG.NODE_HEIGHT,
    lines.length * TEXT_CONFIG.LINE_HEIGHT + FORCE_CONFIG.NODE_PADDING * 2
  );
  
  // Collision radius should be based on the larger dimension, with extra padding for expanded nodes
  const radiusPadding = expanded ? 20 : 10;
  const radius = Math.max(width, height) / 2 + radiusPadding;
  
  return { width, height, radius };
};

// ===================================================================
// DATA CONVERSION UTILITIES
// ===================================================================

/**
 * Converts internal graph nodes to D3 nodes with dynamic sizing.
 * Adds D3-specific properties like calculated dimensions and collision radius.
 * Pre-positions nodes at viewport center to prevent jerky initial movement.
 * 
 * @param nodes - Array of internal graph nodes
 * @param existingPositions - Optional map of existing node positions to preserve
 * @param selectedNodeId - ID of the currently selected node for expansion
 * @returns Array of D3 nodes ready for force simulation
 */
export const convertToD3Nodes = (
  nodes: GraphNode[], 
  existingPositions?: Map<string, { x: number, y: number }>,
  selectedNodeId?: string | null
): D3Node[] => {
  // Get viewport center for initial positioning
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  console.log('🎯 D3 Utils: Viewport center calculated as:', { centerX, centerY, windowWidth: window.innerWidth, windowHeight: window.innerHeight });

  return nodes.map(node => {
    const isExpanded = selectedNodeId === node.id && node.type === 'response';
    const dimensions = calculateNodeDimensions(node.text, node.type === 'prompt', isExpanded);
    
    // Check if we have existing position data for this node (from previous simulation)
    const existingPos = existingPositions?.get(node.id);
    
    let initialX: number, initialY: number;
    
    if (existingPos) {
      // Preserve existing position to prevent jerky movement during updates
      initialX = existingPos.x;
      initialY = existingPos.y;
      console.log(`🎯 D3 Utils: Preserving existing position for node ${node.id.slice(0, 8)}... at (${initialX.toFixed(1)}, ${initialY.toFixed(1)})`);
    } else {
      // New node: check if server provided valid position, otherwise use center
      const hasValidPosition = node.position.x !== 0 || node.position.y !== 0;
      initialX = hasValidPosition ? node.position.x : centerX;
      initialY = hasValidPosition ? node.position.y : centerY;
      
      if (!hasValidPosition) {
        console.log(`🎯 D3 Utils: New node ${node.id.slice(0, 8)}... positioned at center (${initialX}, ${initialY})`);
      }
    }
    
    console.log(`🔒 D3 Utils: Setting fixed position (${initialX.toFixed(1)}, ${initialY.toFixed(1)}) for node ${node.id.slice(0, 8)}... to prevent teleporting`);
    
    
    return {
      ...node,
      x: initialX,
      y: initialY,
      fx: initialX, // Fixed position to prevent D3 internal repositioning during initialization
      fy: initialY, // Fixed position to prevent D3 internal repositioning during initialization
      width: dimensions.width,
      height: dimensions.height,
      radius: dimensions.radius,
      expanded: isExpanded
    };
  });
};

/**
 * Converts internal graph edges to D3 links.
 * Transforms edge data for use in D3 force simulation.
 * 
 * @param edges - Array of internal graph edges
 * @returns Array of D3 links ready for force simulation
 */
export const convertToD3Links = (edges: GraphEdge[]): D3Link[] => {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target
  }));
};

// ===================================================================
// STYLING UTILITIES
// ===================================================================

/**
 * Gets node color based on personality or type.
 * Returns appropriate color for visual distinction between different node types.
 * 
 * @param node - The D3 node to get color for
 * @returns Hex color string for the node
 */
export const getNodeColor = (node: D3Node): string => {
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