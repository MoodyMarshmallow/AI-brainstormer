/**
 * ===================================================================
 * FORCE CONFIGURATION - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * Configuration constants for D3 force simulation parameters.
 * These values control the physics behavior, node sizing, and visual
 * appearance of the force-directed graph layout.
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

// ===================================================================
// FORCE SIMULATION CONFIGURATION
// ===================================================================

/**
 * Complete configuration object for D3 force simulation parameters.
 * These values have been tuned for optimal visual appearance and interaction.
 */
export const FORCE_CONFIG = {
  // Physics Forces
  /** Strength of centering force that keeps graph centered in viewport */
  CENTER_STRENGTH: 0.1,
  
  /** Strength of charge force for node repulsion (negative = repulsion) */
  CHARGE_STRENGTH: -400,
  
  /** Optimal distance between connected nodes */
  LINK_DISTANCE: 200,
  
  /** Base collision radius for nodes without calculated dimensions */
  BASE_COLLISION_RADIUS: 60,
  
  // Node Dimensions
  /** Minimum width for any node in pixels */
  MIN_NODE_WIDTH: 120,
  
  /** Maximum width for any node in pixels */
  MAX_NODE_WIDTH: 300,
  
  /** Standard height for nodes in pixels */
  NODE_HEIGHT: 80,
  
  /** Internal padding within nodes for text content */
  NODE_PADDING: 16,
  
  // Animation Parameters
  /** Rate at which simulation energy decays (higher = faster settling) */
  ALPHA_DECAY: 0.02,
  
  /** Velocity decay factor for natural movement damping */
  VELOCITY_DECAY: 0.4,
  
  // Visual Styling
  /** Border radius for rounded rectangle nodes */
  BORDER_RADIUS: 12,
} as const;

// ===================================================================
// TEXT CONFIGURATION
// ===================================================================

/**
 * Configuration for text wrapping and display within nodes.
 */
export const TEXT_CONFIG = {
  /** Default font size for node text */
  FONT_SIZE: 11,
  
  /** Line height for multi-line text display */
  LINE_HEIGHT: 14,
  
  /** Maximum characters per line before text wrapping */
  MAX_CHARS_PER_LINE: 30,
  
  /** Maximum number of lines to display in a node */
  MAX_LINES: 4,
  
  /** Character width multiplier for text width estimation */
  CHAR_WIDTH_RATIO: 0.6,
  
  /** Font size for persona labels */
  PERSONA_FONT_SIZE: 9,
  
  /** Vertical offset for persona labels */
  PERSONA_OFFSET: 8,
} as const;

// ===================================================================
// SELECTION CONFIGURATION
// ===================================================================

/**
 * Configuration for node selection visual feedback.
 */
export const SELECTION_CONFIG = {
  /** Width of selection ring stroke */
  RING_STROKE_WIDTH: 3,
  
  /** Color of selection ring */
  RING_COLOR: '#667eea',
  
  /** Dash pattern for selection ring */
  RING_DASH_ARRAY: '5,5',
  
  /** Extra padding around node for selection ring */
  RING_PADDING: 8,
  
  /** Additional border radius for selection ring */
  RING_BORDER_RADIUS: 4,
} as const;

// ===================================================================
// ZOOM CONFIGURATION
// ===================================================================

/**
 * Configuration for zoom and pan behavior.
 */
export const ZOOM_CONFIG = {
  /** Minimum zoom scale factor */
  MIN_SCALE: 0.1,
  
  /** Maximum zoom scale factor */
  MAX_SCALE: 5,
  
  /** Default zoom scale factor */
  DEFAULT_SCALE: 1,
  
  /** Zoom sensitivity for scroll wheel */
  SCROLL_SENSITIVITY: 0.002,
  
  /** Transition duration for programmatic zoom changes (ms) */
  TRANSITION_DURATION: 750,
  
  /** Scale factor when centering on a selected node */
  CENTER_SCALE: 1.2,
  
  /** Duration of centering animation (ms) */
  CENTER_DURATION: 800,
} as const;

// ===================================================================
// RENDERING CONFIGURATION
// ===================================================================

/**
 * Configuration for node rendering and settlement behavior.
 */
export const RENDERING_CONFIG = {
  /** Time to let simulation settle before showing nodes (ms) */
  SETTLEMENT_DELAY: 500,
  
  /** Duration of fade-in animation when nodes are revealed (ms) */
  FADE_IN_DURATION: 300,
  
  /** Delay before releasing fixed positions (ms) */
  FIXED_POSITION_RELEASE_DELAY: 300,
  
  /** Alpha value to restart simulation with after releasing fixed positions */
  RESTART_ALPHA: 0.1,
} as const;