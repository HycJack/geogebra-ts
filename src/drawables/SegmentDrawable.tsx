import React from 'react';
import { GeoSegmentElement, GeoElement, GeoPointElement } from '../types';
import { CoordinateSystem } from '../utils/coordinates';
import { Drawable } from './DrawableBase';

export class SegmentDrawable extends Drawable {
  private geoSegment: GeoSegmentElement;
  private getGeoElement: (id: string) => GeoElement | undefined;
  private x1: number = 0;
  private y1: number = 0;
  private x2: number = 0;
  private y2: number = 0;

  constructor(
    geo: GeoSegmentElement,
    coordSystem: CoordinateSystem,
    getGeoElement: (id: string) => GeoElement | undefined
  ) {
    super(geo, coordSystem);
    this.geoSegment = geo;
    this.getGeoElement = getGeoElement;
  }

  update(): void {
    this.updateVisibility();
    if (!this.isVisible) return;

    const startPoint = this.getGeoElement(this.geoSegment.startPointId) as GeoPointElement | undefined;
    const endPoint = this.getGeoElement(this.geoSegment.endPointId) as GeoPointElement | undefined;

    if (!startPoint || !endPoint) {
      this.isVisible = false;
      return;
    }

    this.x1 = this.coordSystem.toScreenX(startPoint.x);
    this.y1 = this.coordSystem.toScreenY(startPoint.y);
    this.x2 = this.coordSystem.toScreenX(endPoint.x);
    this.y2 = this.coordSystem.toScreenY(endPoint.y);

    const midX = (this.x1 + this.x2) / 2;
    const midY = (this.y1 + this.y2) / 2;
    this.updateLabelPosition(midX, midY, 10, -10);
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

    const { strokeColor, strokeWidth, opacity } = this.geoSegment.style;
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
          strokeLinecap="round"
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
