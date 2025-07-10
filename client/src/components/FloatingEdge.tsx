import React from 'react';
import { BaseEdge, EdgeProps, getSimpleBezierPath } from '@xyflow/react';

// Function to calculate the closest point on a rectangle to another point
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

// Function to get edge parameters for floating edges
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