import React from 'react';
import { GeoCircleElement, GeoElement, GeoPointElement } from '../types';
import { CoordinateSystem } from '../utils/coordinates';
import { Drawable } from './DrawableBase';

export class CircleDrawable extends Drawable {
  private geoCircle: GeoCircleElement;
  private getGeoElement: (id: string) => GeoElement | undefined;
  private centerX: number = 0;
  private centerY: number = 0;
  private screenRadius: number = 0;

  constructor(
    geo: GeoCircleElement,
    coordSystem: CoordinateSystem,
    getGeoElement: (id: string) => GeoElement | undefined
  ) {
    super(geo, coordSystem);
    this.geoCircle = geo;
    this.getGeoElement = getGeoElement;
  }

  update(): void {
    this.updateVisibility();
    if (!this.isVisible) return;

    const center = this.getGeoElement(this.geoCircle.centerId) as GeoPointElement | undefined;

    if (!center) {
      this.isVisible = false;
      return;
    }

    this.centerX = this.coordSystem.toScreenX(center.x);
    this.centerY = this.coordSystem.toScreenY(center.y);
    this.screenRadius = this.geoCircle.radius * this.coordSystem.getTransform().xScale;

    this.updateLabelPosition(this.centerX + this.screenRadius, this.centerY, 10, -10);
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

    const { strokeColor, fillColor, strokeWidth, opacity } = this.geoCircle.style;
    const effectiveStrokeWidth = isSelected || isHovered ? (strokeWidth || 2) + 1 : strokeWidth || 2;

    return (
      <g
        data-geo-id={this.geo.id}
        onPointerDown={(e) => handlers?.onPointerDown?.(e, this.geo.id)}
        onPointerEnter={(e) => handlers?.onPointerEnter?.(e, this.geo.id)}
        onPointerLeave={(e) => handlers?.onPointerLeave?.(e, this.geo.id)}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx={this.centerX}
          cy={this.centerY}
          r={this.screenRadius}
          fill={fillColor}
          fillOpacity={opacity * 0.3}
          stroke={strokeColor}
          strokeWidth={effectiveStrokeWidth}
          strokeDasharray={this.getStrokeDashArray()}
          opacity={opacity}
        />
        {(isSelected || isHovered) && (
          <circle
            cx={this.centerX}
            cy={this.centerY}
            r={this.screenRadius}
            fill="none"
            stroke={isSelected ? '#0066cc' : '#999999'}
            strokeWidth={effectiveStrokeWidth + 4}
            opacity={0.2}
          />
        )}
        {this.renderLabel()}
      </g>
    );
  }

  hitTest(screenX: number, screenY: number, threshold: number): boolean {
    const dx = screenX - this.centerX;
    const dy = screenY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.abs(distance - this.screenRadius) <= threshold;
  }
}
