/**
 * ===================================================================
 * FLOATING EDGE - Forum AI Brainstorming Application (Client)
 * ===================================================================
 * 
 * This component provides floating edge functionality for React Flow graphs
 * in the Forum application. It calculates optimal connection points between
 * nodes and renders smooth bezier curves that automatically adjust to node
 * positions and sizes.
 * 
 * Floating edges improve the visual appeal of the conversation graph by
 * connecting nodes at their edge boundaries rather than fixed points,
 * creating more natural-looking connections that adapt to node placement.
 * 
 * Key Features:
 * - Dynamic edge point calculation based on node positions
 * - Automatic intersection point detection at node boundaries
 * - Smooth bezier curve rendering between connection points
 * - Support for nodes with varying dimensions
 * - Fallback values for missing node measurement data
 * 
 * Mathematical Approach:
 * - Calculates closest points on rectangular node boundaries
 * - Uses geometric intersection algorithms for precise positioning
 * - Generates bezier paths for smooth curve connections
 * - Handles edge cases for missing or incomplete node data
 * 
 * Dependencies:
 * - React Flow for edge props and path utilities
 * - BaseEdge and getSimpleBezierPath for rendering
 * 
 * @author Forum Development Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import { BaseEdge, EdgeProps, getSimpleBezierPath } from '@xyflow/react';

/**
 * Calculates the closest point on a rectangle's boundary to a given external point.
 * 
 * This function uses geometric algorithms to find the optimal connection point
 * on a rectangular node's boundary when connecting to another point. It ensures
 * edges connect at the node's edge rather than its center.
 * 
 * Algorithm:
 * 1. Normalizes coordinates relative to rectangle center
 * 2. Applies mathematical transformation for boundary detection
 * 3. Calculates intersection point on rectangle perimeter
 * 4. Returns absolute coordinates of the connection point
 * 
 * @param {Object} intersectionPoint - The external point to connect to
 * @param {number} intersectionPoint.x - X coordinate of the external point
 * @param {number} intersectionPoint.y - Y coordinate of the external point
 * @param {Object} nodeRect - Rectangle representing the node's boundaries
 * @param {number} nodeRect.x - X coordinate of the rectangle's top-left corner
 * @param {number} nodeRect.y - Y coordinate of the rectangle's top-left corner
 * @param {number} nodeRect.width - Width of the rectangle
 * @param {number} nodeRect.height - Height of the rectangle
 * @returns {Object} The optimal connection point on the rectangle's boundary
 */
function getNodeIntersection(intersectionPoint: { x: number; y: number }, nodeRect: { x: number; y: number; width: number; height: number }) {
  const w = nodeRect.width / 2;
  const h = nodeRect.height / 2;
  const x2 = nodeRect.x + w;
  const y2 = nodeRect.y + h;
  const x1 = intersectionPoint.x;
  const y1 = intersectionPoint.y;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

/**
 * Calculates edge connection parameters for floating edges between two nodes.
 * 
 * This function determines the optimal connection points for drawing edges
 * between two nodes by finding the intersection points on each node's boundary
 * that create the most natural-looking connection.
 * 
 * Process:
 * 1. Extracts node positions and dimensions with fallbacks
 * 2. Calculates intersection points for both source and target nodes
 * 3. Returns coordinates for bezier curve generation
 * 
 * Fallback Values:
 * - Position: (0, 0) if not available
 * - Width: 200px default
 * - Height: 80px default
 * 
 * @param {any} source - Source node with position and dimension data
 * @param {any} target - Target node with position and dimension data
 * @returns {Object} Edge parameters with source and target coordinates
 * @returns {number} returns.sx - Source X coordinate
 * @returns {number} returns.sy - Source Y coordinate
 * @returns {number} returns.tx - Target X coordinate
 * @returns {number} returns.ty - Target Y coordinate
 */
function getEdgeParams(source: any, target: any) {
  // Use positionAbsolute if available, otherwise fall back to position
  const sourceX = source.positionAbsolute?.x ?? source.position?.x ?? 0;
  const sourceY = source.positionAbsolute?.y ?? source.position?.y ?? 0;
  const targetX = target.positionAbsolute?.x ?? target.position?.x ?? 0;
  const targetY = target.positionAbsolute?.y ?? target.position?.y ?? 0;
  
  // Default dimensions if not available
  const sourceWidth = source.width ?? source.measured?.width ?? 200;
  const sourceHeight = source.height ?? source.measured?.height ?? 80;
  const targetWidth = target.width ?? target.measured?.width ?? 200;
  const targetHeight = target.height ?? target.measured?.height ?? 80;

  const sourceIntersectionPoint = getNodeIntersection(
    {
      x: targetX + targetWidth / 2,
      y: targetY + targetHeight / 2,
    },
    {
      x: sourceX,
      y: sourceY,
      width: sourceWidth,
      height: sourceHeight,
    }
  );

  const targetIntersectionPoint = getNodeIntersection(
    {
      x: sourceX + sourceWidth / 2,
      y: sourceY + sourceHeight / 2,
    },
    {
      x: targetX,
      y: targetY,
      width: targetWidth,
      height: targetHeight,
    }
  );

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
  };
}

/**
 * Floating edge component for React Flow graphs.
 * 
 * This component renders edges that automatically adjust their connection points
 * based on node positions and sizes. It creates smooth bezier curves that connect
 * nodes at their boundaries rather than fixed anchor points.
 * 
 * Features:
 * - Dynamic edge point calculation
 * - Smooth bezier curve rendering
 * - Automatic adaptation to node movement
 * - Graceful handling of missing node data
 * - Consistent styling with the Forum theme
 * 
 * Edge Styling:
 * - Light gray color (#94a3b8)
 * - 2px stroke width
 * - Smooth bezier curves
 * - No arrow markers for clean appearance
 * 
 * @param {EdgeProps} props - React Flow edge props
 * @param {string} props.id - Unique identifier for the edge
 * @param {string} props.source - Source node ID
 * @param {string} props.target - Target node ID
 * @param {Object} [props.style] - Additional CSS styles for the edge
 * @param {any} [props.data] - Edge data containing source and target node references
 * @returns {JSX.Element | null} The rendered floating edge or null if nodes unavailable
 */
export function FloatingEdge({ id, source, target, style = {}, data }: EdgeProps) {
  const sourceNode = data?.sourceNode;
  const targetNode = data?.targetNode;

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getSimpleBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  return (
    <BaseEdge
      path={edgePath}
      style={{
        stroke: '#94a3b8',
        strokeWidth: 2,
        ...style,
      }}
    />
  );
} 