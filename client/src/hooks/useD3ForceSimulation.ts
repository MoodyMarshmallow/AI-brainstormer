/**
 * ===================================================================
 * USE D3 FORCE SIMULATION HOOK - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * Custom React hook that manages D3 force simulation for the graph visualization.
 * Handles simulation setup, node/link management, drag behavior, and updates.
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import { useCallback, useEffect, useRef } from 'react';
import { 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide,
  Simulation
} from 'd3-force';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { zoom, zoomIdentity } from 'd3-zoom';
import type { Node as GraphNode, Edge as GraphEdge } from '../../../shared/types';
import type { D3Node, D3Link } from '../types/d3Types';
import { FORCE_CONFIG, TEXT_CONFIG, SELECTION_CONFIG, ZOOM_CONFIG, RENDERING_CONFIG } from '../constants/forceConfig';
import { convertToD3Nodes, convertToD3Links, getNodeColor, wrapText } from '../utils/d3Utils';

// ===================================================================
// HOOK INTERFACE
// ===================================================================

interface UseD3ForceSimulationProps {
  /** Array of graph nodes to visualize */
  nodes: GraphNode[];
  
  /** Array of graph edges connecting nodes */
  edges: GraphEdge[];
  
  /** ID of currently selected node (for visual feedback) */
  selectedNodeId: string | null;
  
  /** Callback function when a node is clicked */
  onNodeClick: (event: MouseEvent, node: D3Node) => void;
  
  /** Whether the simulation is currently loading */
  isLoading: boolean;
}

interface UseD3ForceSimulationReturn {
  /** Ref to attach to the SVG element */
  svgRef: React.RefObject<SVGSVGElement | null>;
  
  /** Ref to the current simulation instance */
  simulationRef: React.RefObject<Simulation<D3Node, D3Link> | null>;
}

// ===================================================================
// MAIN HOOK
// ===================================================================

/**
 * Custom hook for managing D3 force simulation.
 * 
 * @param props - Configuration object with nodes, edges, and event handlers
 * @returns Object with refs for SVG element and simulation instance
 */
export const useD3ForceSimulation = ({
  nodes: graphNodes,
  edges: graphEdges,
  selectedNodeId,
  onNodeClick,
  isLoading
}: UseD3ForceSimulationProps): UseD3ForceSimulationReturn => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<Simulation<D3Node, D3Link> | null>(null);
  const nodeGroupsRef = useRef<any>(null);
  const centerOnNodeRef = useRef<{
    lockViewportToNode: (nodeId: string) => void;
    unlockViewport: (nodeId: string) => void;
  } | null>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const isViewportLockedRef = useRef<boolean>(false);
  const lockedNodeIdRef = useRef<string | null>(null);

  /**
   * Creates and manages the D3 force simulation with dynamic node sizing.
   */
  useEffect(() => {
    if (!svgRef.current || graphNodes.length === 0) return;

    console.log('🔄 D3 Simulation: Creating new simulation with', graphNodes.length, 'nodes');

    const svg = select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Capture existing node positions before recreating simulation
    const existingPositions = new Map<string, { x: number, y: number }>();
    if (simulationRef.current) {
      const existingNodes = simulationRef.current.nodes();
      existingNodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          existingPositions.set(node.id, { x: node.x, y: node.y });
        }
      });
      console.log(`🎯 D3 Hook: Captured ${existingPositions.size} existing node positions`);
    }

    // Clear previous content
    svg.selectAll('*').remove();

    // Convert data to D3 format, preserving existing positions and handling expansion
    const d3Nodes = convertToD3Nodes(graphNodes, existingPositions, selectedNodeId);
    const d3Links = convertToD3Links(graphEdges);
    
    // Debug logging for node positions and selection
    console.log(`🔄 SIMULATION CREATION DEBUG:`);
    console.log(`   Total nodes: ${d3Nodes.length}`);
    console.log(`   Selected node ID: ${selectedNodeId}`);
    if (selectedNodeId) {
      const selectedNode = d3Nodes.find(n => n.id === selectedNodeId);
      if (selectedNode) {
        console.log(`   Selected node found: ${selectedNode.id.slice(0, 8)}...`);
        console.log(`   Selected node position: (${selectedNode.x}, ${selectedNode.y})`);
        console.log(`   Selected node expanded: ${selectedNode.expanded}`);
        console.log(`   Selected node dimensions: ${selectedNode.width}x${selectedNode.height}`);
      } else {
        console.error(`   ❌ Selected node NOT found in d3Nodes!`);
      }
    }
    d3Nodes.forEach((node, index) => {
      console.log(`   Node ${index}: ${node.id.slice(0, 8)}... at (${node.x}, ${node.y}) expanded:${node.expanded}`);
    });

    // Create force simulation with dynamic collision detection
    const centerX = width / 2;
    const centerY = height / 2;
    
    console.log('🎯 D3 Hook: Force simulation center calculated as:', { centerX, centerY, width, height });
    
    const simulation = forceSimulation<D3Node>(d3Nodes)
      .force('link', forceLink<D3Node, D3Link>(d3Links)
        .id((d) => d.id)
        .distance(FORCE_CONFIG.LINK_DISTANCE)
      )
      .force('charge', forceManyBody().strength(FORCE_CONFIG.CHARGE_STRENGTH))
      .force('center', forceCenter(centerX, centerY).strength(FORCE_CONFIG.CENTER_STRENGTH))
      .force('collision', forceCollide<D3Node>().radius((d) => d.radius || FORCE_CONFIG.BASE_COLLISION_RADIUS))
      .alphaDecay(FORCE_CONFIG.ALPHA_DECAY)
      .velocityDecay(FORCE_CONFIG.VELOCITY_DECAY);

    simulationRef.current = simulation;

    // Create container groups
    const container = svg.append('g').attr('class', 'graph-container');
    const linksGroup = container.append('g').attr('class', 'links');
    const nodesGroup = container.append('g').attr('class', 'nodes');

    // Create zoom behavior for the graph (enables zooming with scroll wheel and panning by dragging background)
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_CONFIG.MIN_SCALE, ZOOM_CONFIG.MAX_SCALE])
      .filter((event) => {
        // Disable zoom/pan when viewport is locked to a selected node
        if (isViewportLockedRef.current) {
          return false;
        }
        // Allow zoom/pan unless we're dragging a node
        // This prevents zoom/pan from interfering with node dragging
        const target = event.target as Element;
        return !target.closest('.node');
      })
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    // Store zoom behavior in ref for later access
    zoomBehaviorRef.current = zoomBehavior;

    // Apply zoom behavior to SVG (enables background dragging for panning)
    svg.call(zoomBehavior);

    // Function to lock viewport to a specific node
    const lockViewportToNode = (nodeId: string) => {
      const node = d3Nodes.find(n => n.id === nodeId);
      if (!node) {
        console.error(`❌ Lock failed: Node ${nodeId.slice(0, 8)}... not found in d3Nodes`);
        return;
      }
      
      if (!node.x || !node.y) {
        console.error(`❌ Lock failed: Node ${nodeId.slice(0, 8)}... has no position (x: ${node.x}, y: ${node.y})`);
        return;
      }

      console.log(`🔒 STARTING viewport lock for node: ${nodeId.slice(0, 8)}...`);
      console.log(`📍 Node current position: (${node.x}, ${node.y})`);
      console.log(`📐 Viewport dimensions: ${width} x ${height}`);
      
      // Calculate viewport center
      const centerX = width / 2;
      const centerY = height / 2;
      console.log(`🎯 Viewport center: (${centerX}, ${centerY})`);
      
      // Calculate transform to center the node
      const k = ZOOM_CONFIG.CENTER_SCALE;
      const x = centerX - node.x * k;
      const y = centerY - node.y * k;
      
      console.log(`🔢 Transform calculation:`);
      console.log(`   Scale: ${k}`);
      console.log(`   Translate: (${x}, ${y})`);
      console.log(`   Formula: center - node_pos * scale = (${centerX} - ${node.x} * ${k}, ${centerY} - ${node.y} * ${k})`);
      
      // Get current transform for comparison
      const currentTransform = select(svg.node()).property('__zoom') || {x: 0, y: 0, k: 1};
      console.log(`🔄 Current transform: translate(${currentTransform.x}, ${currentTransform.y}) scale(${currentTransform.k})`);
      
      // Animate to center the node
      console.log(`🎬 Starting animation...`);
      svg.transition()
        .duration(ZOOM_CONFIG.CENTER_DURATION)
        .call(zoomBehavior.transform, zoomIdentity.translate(x, y).scale(k))
        .on('start', () => {
          console.log(`🎬 Animation started`);
        })
        .on('end', () => {
          console.log(`🎬 Animation completed`);
          
          // After animation completes, fix the node to center and lock viewport
          if (simulationRef.current) {
            console.log(`🔒 Fixing node position to viewport center...`);
            
            // Get the node's position after animation
            console.log(`📍 Node position after animation: (${node.x}, ${node.y})`);
            
            // Fix the selected node to the center of the viewport
            node.fx = centerX;
            node.fy = centerY;
            node.x = centerX;
            node.y = centerY;
            
            console.log(`📌 Node fixed position set: fx=${node.fx}, fy=${node.fy}`);
            console.log(`📌 Node position updated: x=${node.x}, y=${node.y}`);
            
            // Lock the viewport and track the locked node
            isViewportLockedRef.current = true;
            lockedNodeIdRef.current = nodeId;
            console.log(`🔒 Viewport locked flag set: ${isViewportLockedRef.current}`);
            console.log(`🔒 Locked node ID tracked: ${nodeId.slice(0, 8)}...`);
            
            // Restart simulation with the fixed node
            simulationRef.current.alpha(0.3).restart();
            console.log(`🔄 Simulation restarted with alpha 0.3`);
            
            console.log(`✅ VIEWPORT LOCK COMPLETE - node fixed to center (${centerX}, ${centerY})`);
          } else {
            console.error(`❌ Lock failed: simulationRef.current is null`);
          }
        })
        .on('interrupt', () => {
          console.warn(`⚠️ Animation was interrupted`);
        });
    };

    // Function to unlock viewport and release node
    const unlockViewport = (nodeId: string) => {
      const node = d3Nodes.find(n => n.id === nodeId);
      if (!node) {
        console.error(`❌ Unlock failed: Node ${nodeId.slice(0, 8)}... not found`);
        return;
      }

      console.log(`🔓 STARTING viewport unlock for node: ${nodeId.slice(0, 8)}...`);
      console.log(`📍 Node current position: (${node.x}, ${node.y})`);
      console.log(`📌 Node fixed position: fx=${node.fx}, fy=${node.fy}`);
      console.log(`🔒 Current lock state: ${isViewportLockedRef.current}`);
      
      // Release the fixed position
      node.fx = null;
      node.fy = null;
      console.log(`📌 Node fixed position cleared: fx=${node.fx}, fy=${node.fy}`);
      
      // Unlock the viewport and clear tracked node
      isViewportLockedRef.current = false;
      lockedNodeIdRef.current = null;
      console.log(`🔓 Viewport locked flag set: ${isViewportLockedRef.current}`);
      console.log(`🔓 Locked node ID cleared`);
      
      // Restart simulation to allow natural movement
      if (simulationRef.current) {
        simulationRef.current.alpha(0.1).restart();
        console.log(`🔄 Simulation restarted with alpha 0.1 for natural movement`);
      } else {
        console.error(`❌ Unlock failed: simulationRef.current is null`);
      }
      
      console.log(`✅ VIEWPORT UNLOCK COMPLETE - node can move freely`);
    };

    // Store viewport functions in ref for use in selection effect
    centerOnNodeRef.current = { lockViewportToNode, unlockViewport };

    // Create links
    const links = linksGroup
      .selectAll('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.7);

    // Determine if this is initial creation or expansion
    const isInitialCreation = existingPositions.size === 0;
    
    // Create node groups - hide new nodes during settlement, keep existing nodes visible
    const nodeGroups = nodesGroup
      .selectAll('g')
      .data(d3Nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', (d) => d.type === 'response' ? 'pointer' : 'default')
      .style('opacity', (d) => {
        // During initial creation: hide all nodes for settlement
        if (isInitialCreation) return 0;
        // During expansion: hide only new nodes (those without existing positions)
        return existingPositions.has(d.id) ? 1 : 0;
      });

    // Store nodeGroups in ref for later access
    nodeGroupsRef.current = nodeGroups;

    // Add selection rings for selected nodes (opacity will be managed by separate useEffect)
    nodeGroups
      .append('rect')
      .attr('class', 'selection-ring')
      .attr('width', (d) => (d.width || FORCE_CONFIG.MIN_NODE_WIDTH) + SELECTION_CONFIG.RING_PADDING)
      .attr('height', (d) => (d.height || FORCE_CONFIG.NODE_HEIGHT) + SELECTION_CONFIG.RING_PADDING)
      .attr('x', (d) => -((d.width || FORCE_CONFIG.MIN_NODE_WIDTH) + SELECTION_CONFIG.RING_PADDING) / 2)
      .attr('y', (d) => -((d.height || FORCE_CONFIG.NODE_HEIGHT) + SELECTION_CONFIG.RING_PADDING) / 2)
      .attr('rx', FORCE_CONFIG.BORDER_RADIUS + SELECTION_CONFIG.RING_BORDER_RADIUS)
      .attr('ry', FORCE_CONFIG.BORDER_RADIUS + SELECTION_CONFIG.RING_BORDER_RADIUS)
      .attr('fill', 'none')
      .attr('stroke', SELECTION_CONFIG.RING_COLOR)
      .attr('stroke-width', SELECTION_CONFIG.RING_STROKE_WIDTH)
      .attr('stroke-dasharray', SELECTION_CONFIG.RING_DASH_ARRAY)
      .style('opacity', 0); // Start with all rings hidden

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
      const lines = wrapText(d.text, TEXT_CONFIG.MAX_CHARS_PER_LINE, d.expanded || false);
      const startY = -(lines.length - 1) * TEXT_CONFIG.LINE_HEIGHT / 2;
      
      // Add persona label for response nodes
      if (d.type === 'response' && d.persona) {
        nodeGroup
          .append('text')
          .attr('y', startY - TEXT_CONFIG.PERSONA_OFFSET)
          .attr('text-anchor', 'middle')
          .attr('font-size', `${TEXT_CONFIG.PERSONA_FONT_SIZE}px`)
          .attr('font-weight', 'bold')
          .attr('fill', 'rgba(255, 255, 255, 0.8)')
          .attr('pointer-events', 'none')
          .text(d.persona.toUpperCase());
      }
      
      // Add main text lines
      lines.forEach((line, i) => {
        nodeGroup
          .append('text')
          .attr('y', startY + i * TEXT_CONFIG.LINE_HEIGHT + (d.type === 'response' ? TEXT_CONFIG.PERSONA_OFFSET : 0))
          .attr('text-anchor', 'middle')
          .attr('font-size', `${TEXT_CONFIG.FONT_SIZE}px`)
          .attr('font-weight', d.type === 'prompt' ? 'bold' : 'normal')
          .attr('fill', 'white')
          .attr('pointer-events', 'none')
          .text(line);
      });
    });

    // Add drag behavior
    const dragBehavior = drag<SVGGElement, D3Node>()
      .filter((event, d) => {
        // Disable dragging when viewport is locked or when dragging the locked node
        return !isViewportLockedRef.current;
      })
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

    // Add click behavior for selection
    nodeGroups.on('click', onNodeClick);

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

    // Settlement delay: Let simulation calculate positions before revealing nodes
    setTimeout(() => {
      if (nodeGroups) {
        const hiddenNodesCount = nodeGroups.nodes().filter((node: any) => {
          return parseFloat(select(node).style('opacity')) === 0;
        }).length;
        
        if (hiddenNodesCount > 0) {
          console.log(`🎭 D3 Hook: Revealing ${hiddenNodesCount} new nodes after ${RENDERING_CONFIG.SETTLEMENT_DELAY}ms settlement`);
          nodeGroups
            .filter((d: any) => {
              // Only reveal hidden nodes (new ones)
              return isInitialCreation || !existingPositions.has(d.id);
            })
            .transition()
            .duration(RENDERING_CONFIG.FADE_IN_DURATION)
            .style('opacity', 1);
        }
      }
    }, RENDERING_CONFIG.SETTLEMENT_DELAY);

    // Release fixed positions after brief stabilization to allow natural force simulation
    // This prevents the initial "teleporting" effect while ensuring smooth animation afterward
    setTimeout(() => {
      if (simulationRef.current) {
        console.log('🎯 D3 Hook: Releasing fixed positions for natural simulation');
        d3Nodes.forEach(node => {
          node.fx = null;
          node.fy = null;
        });
        // Gently restart simulation with low alpha to smoothly transition to natural forces
        simulationRef.current.alpha(RENDERING_CONFIG.RESTART_ALPHA).restart();
      }
    }, RENDERING_CONFIG.FIXED_POSITION_RELEASE_DELAY);

    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [graphNodes, graphEdges, onNodeClick, selectedNodeId]); // Include selectedNodeId to enable text expansion

  /**
   * Handle post-simulation selection updates (viewport locking after simulation recreates).
   */
  useEffect(() => {
    console.log(`🔍 SELECTION EFFECT TRIGGERED:`);
    console.log(`   selectedNodeId: ${selectedNodeId}`);
    console.log(`   centerOnNodeRef.current: ${centerOnNodeRef.current ? 'available' : 'null'}`);
    console.log(`   isViewportLockedRef.current: ${isViewportLockedRef.current}`);
    
    if (!centerOnNodeRef.current) {
      console.warn(`⚠️ Selection effect: centerOnNodeRef.current is null, cannot proceed`);
      return;
    }

    if (selectedNodeId) {
      console.log(`🔍 Selection effect: Node selected, setting up lock timeout for: ${selectedNodeId.slice(0, 8)}...`);
      
      // Lock viewport to selected node after simulation has settled
      const lockTimeout = setTimeout(() => {
        if (centerOnNodeRef.current) {
          console.log(`⏰ Lock timeout triggered: Locking viewport to selected node: ${selectedNodeId.slice(0, 8)}...`);
          centerOnNodeRef.current.lockViewportToNode(selectedNodeId);
        } else {
          console.error(`❌ Lock timeout failed: centerOnNodeRef.current became null`);
        }
      }, 600); // Wait longer for simulation to settle after recreation

      return () => {
        console.log(`🧹 Cleaning up lock timeout for: ${selectedNodeId.slice(0, 8)}...`);
        clearTimeout(lockTimeout);
      };
    } else {
      // Unlock viewport immediately when no node is selected
      if (isViewportLockedRef.current) {
        console.log(`🔍 Selection effect: No node selected, unlocking viewport...`);
        console.log(`🔓 Finding and releasing any locked nodes...`);
        
        // Find the previously locked node and unlock it
        // Since we don't have the previous nodeId, we'll unlock by setting the flag
        isViewportLockedRef.current = false;
        lockedNodeIdRef.current = null;
        console.log(`🔓 Viewport lock flag cleared: ${isViewportLockedRef.current}`);
        console.log(`🔓 Locked node ID cleared`);
        
        // Also need to release any fixed positions
        if (simulationRef.current) {
          let fixedNodesFound = 0;
          simulationRef.current.nodes().forEach(node => {
            if (node.fx !== undefined && node.fy !== undefined) {
              console.log(`📌 Releasing fixed position for node: ${node.id.slice(0, 8)}... (was at ${node.fx}, ${node.fy})`);
              node.fx = null;
              node.fy = null;
              fixedNodesFound++;
            }
          });
          console.log(`📌 Released ${fixedNodesFound} fixed node positions`);
          simulationRef.current.alpha(0.1).restart();
          console.log(`🔄 Simulation restarted for natural movement`);
        } else {
          console.error(`❌ Cannot release fixed positions: simulationRef.current is null`);
        }
      } else {
        console.log(`🔍 Selection effect: No node selected and viewport not locked, nothing to do`);
      }
    }
  }, [selectedNodeId]);

  /**
   * Handle window resize to recenter the simulation and maintain locked node position.
   */
  useEffect(() => {
    const handleResize = () => {
      console.log(`📏 RESIZE EVENT TRIGGERED`);
      console.log(`   New viewport: ${window.innerWidth} x ${window.innerHeight}`);
      console.log(`   Viewport locked: ${isViewportLockedRef.current}`);
      console.log(`   Locked node ID: ${lockedNodeIdRef.current ? lockedNodeIdRef.current.slice(0, 8) + '...' : 'none'}`);
      
      if (simulationRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const newCenterX = width / 2;
        const newCenterY = height / 2;
        
        console.log(`🎯 New viewport center: (${newCenterX}, ${newCenterY})`);
        
        // Update the center force for all nodes
        simulationRef.current
          .force('center', forceCenter(newCenterX, newCenterY).strength(FORCE_CONFIG.CENTER_STRENGTH));
        
        // Handle special case: viewport is locked to a node
        if (isViewportLockedRef.current && lockedNodeIdRef.current) {
          console.log(`🔒 Viewport is locked - maintaining node at center`);
          
          // Find the locked node
          const lockedNode = simulationRef.current.nodes().find(n => n.id === lockedNodeIdRef.current);
          if (lockedNode) {
            console.log(`📍 Found locked node: ${lockedNode.id.slice(0, 8)}...`);
            console.log(`📍 Current position: (${lockedNode.x}, ${lockedNode.y})`);
            console.log(`📌 Current fixed position: fx=${lockedNode.fx}, fy=${lockedNode.fy}`);
            
            // Update the locked node's position to the new center
            lockedNode.fx = newCenterX;
            lockedNode.fy = newCenterY;
            lockedNode.x = newCenterX;
            lockedNode.y = newCenterY;
            
            console.log(`📌 Updated locked node position: (${newCenterX}, ${newCenterY})`);
            
            // Update the zoom transform to maintain the view
            if (svgRef.current && zoomBehaviorRef.current) {
              const k = ZOOM_CONFIG.CENTER_SCALE;
              const x = newCenterX - lockedNode.x * k;
              const y = newCenterY - lockedNode.y * k;
              
              console.log(`🔄 Updating zoom transform: translate(${x}, ${y}) scale(${k})`);
              
              // Apply the transform without animation to maintain instant centering
              select(svgRef.current)
                .call(zoomBehaviorRef.current.transform, zoomIdentity.translate(x, y).scale(k));
            }
            
            // Restart simulation gently to apply the new fixed position
            simulationRef.current.alpha(0.1).restart();
            console.log(`✅ Locked node repositioned to new viewport center`);
          } else {
            console.error(`❌ Could not find locked node: ${lockedNodeIdRef.current}`);
          }
        } else {
          // Normal resize handling when no node is locked
          console.log(`🔄 Normal resize - restarting simulation with new center`);
          simulationRef.current.alpha(0.3).restart();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    svgRef,
    simulationRef
  };
}; 