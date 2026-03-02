import React from 'react';
import { GeoElement, ScreenPoint } from '../types';
import { CoordinateSystem } from '../utils/coordinates';

export interface DrawableProps {
  geo: GeoElement;
  coordSystem: CoordinateSystem;
  isSelected: boolean;
  isHovered: boolean;
  onPointerDown?: (e: React.PointerEvent, geoId: string) => void;
  onPointerEnter?: (e: React.PointerEvent, geoId: string) => void;
  onPointerLeave?: (e: React.PointerEvent, geoId: string) => void;
}

export interface DrawableState {
  isVisible: boolean;
  screenPoints: ScreenPoint[];
  labelPosition: ScreenPoint;
}

export abstract class Drawable {
  protected geo: GeoElement;
  protected coordSystem: CoordinateSystem;
  protected isVisible: boolean = true;
  protected screenPoints: ScreenPoint[] = [];
  protected labelPosition: ScreenPoint = { x: 0, y: 0 };

  constructor(geo: GeoElement, coordSystem: CoordinateSystem) {
    this.geo = geo;
    this.coordSystem = coordSystem;
  }

  abstract update(): void;
  abstract render(
    isSelected: boolean,
    isHovered: boolean,
    handlers?: {
      onPointerDown?: (e: React.PointerEvent, geoId: string) => void;
      onPointerEnter?: (e: React.PointerEvent, geoId: string) => void;
      onPointerLeave?: (e: React.PointerEvent, geoId: string) => void;
    }
  ): React.ReactNode;

  protected updateVisibility(): void {
    this.isVisible = this.geo.style.visible;
  }

  protected updateLabelPosition(baseX: number, baseY: number, offsetX: number = 10, offsetY: number = -10): void {
    this.labelPosition = {
      x: baseX + offsetX,
      y: baseY + offsetY,
    };
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }

  getLabelPosition(): ScreenPoint {
    return this.labelPosition;
  }

  getGeoId(): string {
    return this.geo.id;
  }

  abstract hitTest(screenX: number, screenY: number, threshold: number): boolean;

  protected renderLabel(): React.ReactNode {
    if (!this.geo.style.labelVisible || !this.geo.label) return null;

    return (
      <text
        x={this.labelPosition.x}
        y={this.labelPosition.y}
        fill={this.geo.style.strokeColor}
        fontSize={this.geo.style.fontSize || 14}
        fontFamily={this.geo.style.fontFamily || 'Arial'}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {this.geo.label}
      </text>
    );
  }

  protected getStrokeDashArray(): string | undefined {
    if (!this.geo.style.strokeDashArray) return undefined;
    return this.geo.style.strokeDashArray.join(',');
  }
}

// Forward declaration for createDrawable
// This will be implemented in a separate file to avoid circular dependencies
export type CreateDrawableFunction = (
  geo: GeoElement,
  coordSystem: CoordinateSystem,
  getGeoElement: (id: string) => GeoElement | undefined
) => Drawable | null;
