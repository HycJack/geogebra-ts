import { GeoElement } from '../types';
import { CoordinateSystem } from '../utils/coordinates';
import { Drawable } from './DrawableBase';
import { PointDrawable } from './PointDrawable';
import { LineDrawable } from './LineDrawable';
import { SegmentDrawable } from './SegmentDrawable';
import { CircleDrawable } from './CircleDrawable';
import { PolygonDrawable } from './PolygonDrawable';
import { VectorDrawable } from './VectorDrawable';
import { TextDrawable } from './TextDrawable';

export function createDrawable(
  geo: GeoElement,
  coordSystem: CoordinateSystem,
  getGeoElement: (id: string) => GeoElement | undefined
): Drawable | null {
  switch (geo.type) {
    case 'point':
      return new PointDrawable(geo, coordSystem);
    case 'line':
      return new LineDrawable(geo, coordSystem);
    case 'segment':
      return new SegmentDrawable(geo, coordSystem, getGeoElement);
    case 'circle':
      return new CircleDrawable(geo, coordSystem, getGeoElement);
    case 'polygon':
      return new PolygonDrawable(geo, coordSystem, getGeoElement);
    case 'vector':
      return new VectorDrawable(geo, coordSystem, getGeoElement);
    case 'text':
      return new TextDrawable(geo, coordSystem);
    default:
      return null;
  }
}
