/**
 * ===================================================================
 * D3 TYPES - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * Type definitions and interfaces specifically for D3 force simulation
 * graph components. These types extend the base graph types with D3-specific
 * properties for positioning, sizing, and force simulation.
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import type { PersonalityName } from '../../../shared/types';

// ===================================================================
// D3 NODE AND LINK INTERFACES
// ===================================================================

/**
 * Extended node interface for D3 force simulation with dynamic sizing.
 * Includes all properties needed for physics simulation and visual rendering.
 */
export interface D3Node extends SimulationNodeDatum {
  /** Unique identifier for this node */
  id: string;
  
  /** The text content displayed in this node */
  text: string;
  
  /** Optional reference to the parent node this branches from */
  parentId?: string;
  
  /** Type of node: 'prompt' for user prompts, 'response' for AI responses */
  type: 'prompt' | 'response';
  
  /** AI personality that generated this response (only for response nodes) */
  persona?: PersonalityName;
  
  /** Color associated with this node for UI theming */
  color?: string;
  
  /** Calculated width of the node in pixels */
  width?: number;
  
  /** Calculated height of the node in pixels */
  height?: number;
  
  /** Collision radius for force simulation physics */
  radius?: number;
  
  /** Whether this node is expanded to show full content */
  expanded?: boolean;
}

/**
 * Extended link interface for D3 force simulation.
 * Represents connections between nodes in the conversation graph.
 */
export interface D3Link extends SimulationLinkDatum<D3Node> {
  /** Unique identifier for this edge */
  id: string;
  
  /** Node ID that this edge originates from (can be string or D3Node after simulation) */
  source: string | D3Node;
  
  /** Node ID that this edge connects to (can be string or D3Node after simulation) */
  target: string | D3Node;
}

// ===================================================================
// NODE DIMENSION CALCULATION TYPES
// ===================================================================

/**
 * Result type for node dimension calculations.
 * Contains all measurements needed for proper node rendering and collision detection.
 */
export interface NodeDimensions {
  /** Calculated width in pixels */
  width: number;
  
  /** Calculated height in pixels */
  height: number;
  
  /** Collision radius for physics simulation */
  radius: number;
}

// ===================================================================
// TEXT WRAPPING TYPES
// ===================================================================

/**
 * Configuration for text wrapping calculations.
 */
export interface TextWrapConfig {
  /** Maximum characters per line before wrapping */
  maxCharsPerLine: number;
  
  /** Maximum number of lines to display */
  maxLines: number;
  
  /** Font size for width calculations */
  fontSize: number;
  
  /** Line height for vertical spacing */
  lineHeight: number;
} 