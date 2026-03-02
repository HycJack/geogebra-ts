import React from 'react';
import { GeoPolygonElement, GeoElement, GeoPointElement } from '../types';
import { CoordinateSystem } from '../utils/coordinates';
import { Drawable } from './DrawableBase';

export class PolygonDrawable extends Drawable {
  private geoPolygon: GeoPolygonElement;
  private getGeoElement: (id: string) => GeoElement | undefined;
  // private screenPoints: { x: number; y: number }[] = [];
  private pathD: string = '';

  constructor(
    geo: GeoPolygonElement,
    coordSystem: CoordinateSystem,
    getGeoElement: (id: string) => GeoElement | undefined
  ) {
    super(geo, coordSystem);
    this.geoPolygon = geo;
    this.getGeoElement = getGeoElement;
  }

  update(): void {
    this.updateVisibility();
    if (!this.isVisible) return;

    this.screenPoints = [];

    for (const pointId of this.geoPolygon.pointIds) {
      const point = this.getGeoElement(pointId) as GeoPointElement | undefined;
      if (!point) {
        this.isVisible = false;
        return;
      }
      this.screenPoints.push({
        x: this.coordSystem.toScreenX(point.x),
        y: this.coordSystem.toScreenY(point.y),
      });
    }

    if (this.screenPoints.length < 3) {
      this.isVisible = false;
      return;
    }

    const pathParts = this.screenPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`);
    pathParts.push('Z');
    this.pathD = pathParts.join(' ');

    const centerX = this.screenPoints.reduce((sum, p) => sum + p.x, 0) / this.screenPoints.length;
    const centerY = this.screenPoints.reduce((sum, p) => sum + p.y, 0) / this.screenPoints.length;
    this.updateLabelPosition(centerX, centerY, 0, 0);
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

    const { strokeColor, fillColor, strokeWidth, opacity } = this.geoPolygon.style;
    const effectiveStrokeWidth = isSelected || isHovered ? (strokeWidth || 2) + 1 : strokeWidth || 2;

    return (
      <g
        data-geo-id={this.geo.id}
        onPointerDown={(e) => handlers?.onPointerDown?.(e, this.geo.id)}
        onPointerEnter={(e) => handlers?.onPointerEnter?.(e, this.geo.id)}
        onPointerLeave={(e) => handlers?.onPointerLeave?.(e, this.geo.id)}
        style={{ cursor: 'pointer' }}
      >
        <path
          d={this.pathD}
          fill={fillColor}
          fillOpacity={opacity * 0.3}
          stroke={strokeColor}
          strokeWidth={effectiveStrokeWidth}
          strokeDasharray={this.getStrokeDashArray()}
          opacity={opacity}
          strokeLinejoin="round"
        />
        {(isSelected || isHovered) && (
          <path
            d={this.pathD}
            fill={isSelected ? '#0066cc' : '#999999'}
            fillOpacity={0.1}
            stroke={isSelected ? '#0066cc' : '#999999'}
            strokeWidth={effectiveStrokeWidth + 4}
            opacity={0.3}
          />
        )}
        {this.renderLabel()}
      </g>
    );
  }

  hitTest(screenX: number, screenY: number, threshold: number): boolean {
    return this.pointInPolygon(screenX, screenY) || this.nearEdge(screenX, screenY, threshold);
  }

  private pointInPolygon(x: number, y: number): boolean {
    let inside = false;
    const n = this.screenPoints.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.screenPoints[i].x;
      const yi = this.screenPoints[i].y;
      const xj = this.screenPoints[j].x;
      const yj = this.screenPoints[j].y;

      if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  private nearEdge(x: number, y: number, threshold: number): boolean {
    for (let i = 0; i < this.screenPoints.length; i++) {
      const j = (i + 1) % this.screenPoints.length;
      const p1 = this.screenPoints[i];
      const p2 = this.screenPoints[j];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lengthSq = dx * dx + dy * dy;

      if (lengthSq < 1e-10) continue;

      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / lengthSq));
      const closestX = p1.x + t * dx;
      const closestY = p1.y + t * dy;

      const distX = x - closestX;
      const distY = y - closestY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance <= threshold) return true;
    }

    return false;
  }
}
