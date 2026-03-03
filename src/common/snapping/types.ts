import { GeoElement, WorldPoint, ScreenPoint } from '../../types';

export type SnapType = 
  | 'point'
  | 'line'
  | 'segment'
  | 'circle'
  | 'grid'
  | 'intersection'
  | 'midpoint'
  | 'perpendicular'
  | 'parallel';

export interface SnapTarget {
  type: SnapType;
  elementId?: string;
  elementIds?: string[];
  worldPoint: WorldPoint;
  screenPoint: ScreenPoint;
  distance: number;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface SnapConfig {
  enabled: boolean;
  snapToPoint: boolean;
  snapToLine: boolean;
  snapToSegment: boolean;
  snapToCircle: boolean;
  snapToGrid: boolean;
  snapToIntersection: boolean;
  snapToMidpoint: boolean;
  pointThreshold: number;
  lineThreshold: number;
  gridThreshold: number;
  gridSpacing: number;
  showSnapIndicators: boolean;
  snapIndicatorColor: string;
  snapIndicatorSize: number;
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  enabled: true,
  snapToPoint: true,
  snapToLine: true,
  snapToSegment: true,
  snapToCircle: true,
  snapToGrid: true,
  snapToIntersection: true,
  snapToMidpoint: true,
  pointThreshold: 15,
  lineThreshold: 10,
  gridThreshold: 10,
  gridSpacing: 1,
  showSnapIndicators: true,
  snapIndicatorColor: '#0066ff',
  snapIndicatorSize: 8,
};

export interface SnapManager {
  findSnapTarget(
    screenPoint: ScreenPoint,
    worldPoint: WorldPoint,
    excludeIds?: string[]
  ): SnapTarget | null;
  
  findSnapTargets(
    screenPoint: ScreenPoint,
    worldPoint: WorldPoint,
    excludeIds?: string[]
  ): SnapTarget[];
  
  updateElements(elements: Map<string, GeoElement>): void;
  
  setConfig(config: Partial<SnapConfig>): void;
  
  getConfig(): SnapConfig;
  
  renderIndicators(
    ctx: CanvasRenderingContext2D,
    target: SnapTarget | null
  ): void;
}
