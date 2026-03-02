import React from 'react';
import { GeoTextElement } from '../types';
import { CoordinateSystem } from '../utils/coordinates';
import { Drawable } from './DrawableBase';

export class TextDrawable extends Drawable {
  private geoText: GeoTextElement;
  private screenX: number = 0;
  private screenY: number = 0;

  constructor(geo: GeoTextElement, coordSystem: CoordinateSystem) {
    super(geo, coordSystem);
    this.geoText = geo;
  }

  update(): void {
    this.updateVisibility();
    if (!this.isVisible) return;

    this.screenX = this.coordSystem.toScreenX(this.geoText.x);
    this.screenY = this.coordSystem.toScreenY(this.geoText.y);

    this.updateLabelPosition(this.screenX, this.screenY, 5, -5);
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

    const { strokeColor, fontSize, fontFamily, opacity } = this.geoText.style;

    return (
      <g
        data-geo-id={this.geo.id}
        onPointerDown={(e) => handlers?.onPointerDown?.(e, this.geo.id)}
        onPointerEnter={(e) => handlers?.onPointerEnter?.(e, this.geo.id)}
        onPointerLeave={(e) => handlers?.onPointerLeave?.(e, this.geo.id)}
        style={{ cursor: 'pointer' }}
      >
        <text
          x={this.screenX}
          y={this.screenY}
          fill={strokeColor}
          fontSize={fontSize || 16}
          fontFamily={fontFamily || 'Arial'}
          opacity={opacity}
          style={{ userSelect: 'none' }}
        >
          {this.geoText.text}
        </text>
        {(isSelected || isHovered) && (
          <rect
            x={this.screenX - 2}
            y={this.screenY - (fontSize || 16)}
            width={(this.geoText.text.length * (fontSize || 16)) / 2 + 4}
            height={(fontSize || 16) + 4}
            fill="none"
            stroke={isSelected ? '#0066cc' : '#999999'}
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.5}
          />
        )}
      </g>
    );
  }

  hitTest(screenX: number, screenY: number, threshold: number): boolean {
    const fontSize = this.geoText.style.fontSize || 16;
    const textWidth = (this.geoText.text.length * fontSize) / 2;
    const textHeight = fontSize;

    return (
      screenX >= this.screenX - threshold &&
      screenX <= this.screenX + textWidth + threshold &&
      screenY >= this.screenY - textHeight - threshold &&
      screenY <= this.screenY + threshold
    );
  }
}
