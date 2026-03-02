import React from 'react';
import { GeoPointElement } from '../types';
import { CoordinateSystem } from '../utils/coordinates';
import { Drawable } from './DrawableBase';

export class PointDrawable extends Drawable {
  private geoPoint: GeoPointElement;
  private screenX: number = 0;
  private screenY: number = 0;

  constructor(geo: GeoPointElement, coordSystem: CoordinateSystem) {
    super(geo, coordSystem);
    this.geoPoint = geo;
  }

  update(): void {
    this.updateVisibility();
    if (!this.isVisible) return;

    this.screenX = this.coordSystem.toScreenX(this.geoPoint.x);
    this.screenY = this.coordSystem.toScreenY(this.geoPoint.y);

    this.updateLabelPosition(this.screenX, this.screenY, 10, -10);
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

    const { strokeColor, fillColor } = this.geoPoint.style;
    const { pointSize, pointStyle } = this.geoPoint;
    const size = pointSize || 5;
    const effectiveSize = isSelected || isHovered ? size + 2 : size;

    let pointShape: React.ReactNode;

    switch (pointStyle) {
      case 'cross':
        pointShape = (
          <g>
            <line
              x1={this.screenX - effectiveSize}
              y1={this.screenY - effectiveSize}
              x2={this.screenX + effectiveSize}
              y2={this.screenY + effectiveSize}
              stroke={strokeColor}
              strokeWidth={2}
            />
            <line
              x1={this.screenX + effectiveSize}
              y1={this.screenY - effectiveSize}
              x2={this.screenX - effectiveSize}
              y2={this.screenY + effectiveSize}
              stroke={strokeColor}
              strokeWidth={2}
            />
          </g>
        );
        break;
      case 'circle':
        pointShape = (
          <circle
            cx={this.screenX}
            cy={this.screenY}
            r={effectiveSize}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
          />
        );
        break;
      case 'square':
        pointShape = (
          <rect
            x={this.screenX - effectiveSize}
            y={this.screenY - effectiveSize}
            width={effectiveSize * 2}
            height={effectiveSize * 2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
          />
        );
        break;
      case 'dot':
      default:
        pointShape = (
          <circle
            cx={this.screenX}
            cy={this.screenY}
            r={effectiveSize}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
          />
        );
    }

    return (
      <g
        data-geo-id={this.geo.id}
        onPointerDown={(e) => handlers?.onPointerDown?.(e, this.geo.id)}
        onPointerEnter={(e) => handlers?.onPointerEnter?.(e, this.geo.id)}
        onPointerLeave={(e) => handlers?.onPointerLeave?.(e, this.geo.id)}
        style={{ cursor: 'pointer' }}
      >
        {pointShape}
        {(isSelected || isHovered) && (
          <circle
            cx={this.screenX}
            cy={this.screenY}
            r={effectiveSize + 4}
            fill="none"
            stroke={isSelected ? '#0066cc' : '#999999'}
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.5}
          />
        )}
        {this.renderLabel()}
      </g>
    );
  }

  hitTest(screenX: number, screenY: number, threshold: number): boolean {
    const dx = screenX - this.screenX;
    const dy = screenY - this.screenY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = Math.max(threshold, (this.geoPoint.pointSize || 5) + 3);
    return distance <= hitRadius;
  }
}
