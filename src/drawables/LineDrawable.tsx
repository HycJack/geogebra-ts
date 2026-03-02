import React from 'react';
import { GeoLineElement } from '../types';
import { CoordinateSystem } from '../utils/coordinates';
import { Drawable } from './DrawableBase';

export class LineDrawable extends Drawable {
  private geoLine: GeoLineElement;
  private x1: number = 0;
  private y1: number = 0;
  private x2: number = 0;
  private y2: number = 0;

  constructor(geo: GeoLineElement, coordSystem: CoordinateSystem) {
    super(geo, coordSystem);
    this.geoLine = geo;
  }

  update(): void {
    this.updateVisibility();
    if (!this.isVisible) return;

    const bounds = this.coordSystem.getWorldBounds();
    const { a, b, c } = this.geoLine;

    const points: { x: number; y: number }[] = [];

    if (Math.abs(b) > 1e-10) {
      const yAtMinX = -(a * bounds.minX + c) / b;
      const yAtMaxX = -(a * bounds.maxX + c) / b;
      points.push({ x: bounds.minX, y: yAtMinX });
      points.push({ x: bounds.maxX, y: yAtMaxX });
    }

    if (Math.abs(a) > 1e-10) {
      const xAtMinY = -(b * bounds.minY + c) / a;
      const xAtMaxY = -(b * bounds.maxY + c) / a;
      points.push({ x: xAtMinY, y: bounds.minY });
      points.push({ x: xAtMaxY, y: bounds.maxY });
    }

    const validPoints = points.filter(
      (p) =>
        p.x >= bounds.minX - 1 &&
        p.x <= bounds.maxX + 1 &&
        p.y >= bounds.minY - 1 &&
        p.y <= bounds.maxY + 1
    );

    if (validPoints.length >= 2) {
      const screenPoints = validPoints.map((p) => ({
        x: this.coordSystem.toScreenX(p.x),
        y: this.coordSystem.toScreenY(p.y),
      }));

      let minDist = Infinity;
      let maxDist = -Infinity;
      let minPoint = screenPoints[0];
      let maxPoint = screenPoints[0];

      for (const sp of screenPoints) {
        const dist = sp.x + sp.y;
        if (dist < minDist) {
          minDist = dist;
          minPoint = sp;
        }
        if (dist > maxDist) {
          maxDist = dist;
          maxPoint = sp;
        }
      }

      this.x1 = minPoint.x;
      this.y1 = minPoint.y;
      this.x2 = maxPoint.x;
      this.y2 = maxPoint.y;

      const midX = (this.x1 + this.x2) / 2;
      const midY = (this.y1 + this.y2) / 2;
      this.updateLabelPosition(midX, midY, 10, -10);
    }
  }

  render(
    isSelected: boolean,
    isHovered: boolean,
    handlers?: {
      onPointerDown?: (e: React.PointerEvent, geoId: string) => void;
      onPointerEnter?: (e: React.PointerEvent, geoId: string) => void;
      onPointerLeave?: (e: React.PointerEvent, geoId: string) => void;
    }
  ): React.ReactNode {
    if (!this.isVisible) return null;

    const { strokeColor, strokeWidth, opacity } = this.geoLine.style;
    const effectiveStrokeWidth = isSelected || isHovered ? (strokeWidth || 2) + 1 : strokeWidth || 2;

    return (
      <g
        data-geo-id={this.geo.id}
        onPointerDown={(e) => handlers?.onPointerDown?.(e, this.geo.id)}
        onPointerEnter={(e) => handlers?.onPointerEnter?.(e, this.geo.id)}
        onPointerLeave={(e) => handlers?.onPointerLeave?.(e, this.geo.id)}
        style={{ cursor: 'pointer' }}
      >
        <line
          x1={this.x1}
          y1={this.y1}
          x2={this.x2}
          y2={this.y2}
          stroke={strokeColor}
          strokeWidth={effectiveStrokeWidth}
          strokeDasharray={this.getStrokeDashArray()}
          opacity={opacity}
        />
        {(isSelected || isHovered) && (
          <line
            x1={this.x1}
            y1={this.y1}
            x2={this.x2}
            y2={this.y2}
            stroke={isSelected ? '#0066cc' : '#999999'}
            strokeWidth={effectiveStrokeWidth + 4}
            opacity={0.2}
            strokeLinecap="round"
          />
        )}
        {this.renderLabel()}
      </g>
    );
  }

  hitTest(screenX: number, screenY: number, threshold: number): boolean {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq < 1e-10) return false;

    const t = Math.max(0, Math.min(1, ((screenX - this.x1) * dx + (screenY - this.y1) * dy) / lengthSq));

    const closestX = this.x1 + t * dx;
    const closestY = this.y1 + t * dy;

    const distX = screenX - closestX;
    const distY = screenY - closestY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    return distance <= threshold;
  }
}
