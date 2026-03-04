/**
 * 列表对象
 * 对应 Java 版本的 GeoList
 */

import type { GeoElement, GeoListElement } from './GeoElement';

export class GeoList {
  static create(items: GeoElement[] = []): Partial<GeoListElement> {
    return {
      type: 'list',
      items,
      isClosed: false,
      showDOM: true,
    };
  }

  static add(list: GeoListElement, item: GeoElement): GeoElement[] {
    return [...list.items, item];
  }

  static remove(list: GeoListElement, index: number): GeoElement[] {
    return list.items.filter((_, i) => i !== index);
  }

  static get(list: GeoListElement, index: number): GeoElement | undefined {
    return list.items[index];
  }

  static size(list: GeoListElement): number {
    return list.items.length;
  }

  static isEmpty(list: GeoListElement): boolean {
    return list.items.length === 0;
  }

  static clear(): GeoElement[] {
    return [];
  }

  static contains(list: GeoListElement, item: GeoElement): boolean {
    return list.items.some(i => i.id === item.id);
  }

  static indexOf(list: GeoListElement, item: GeoElement): number {
    return list.items.findIndex(i => i.id === item.id);
  }

  static map<T>(list: GeoListElement, fn: (item: GeoElement, index: number) => T): T[] {
    return list.items.map(fn);
  }

  static filter(list: GeoListElement, predicate: (item: GeoElement, index: number) => boolean): GeoElement[] {
    return list.items.filter(predicate);
  }

  static reduce<T>(list: GeoListElement, fn: (acc: T, item: GeoElement, index: number) => T, initialValue: T): T {
    return list.items.reduce(fn, initialValue);
  }

  static forEach(list: GeoListElement, fn: (item: GeoElement, index: number) => void): void {
    list.items.forEach(fn);
  }

  static reverse(list: GeoListElement): GeoElement[] {
    return [...list.items].reverse();
  }

  static sort(list: GeoListElement, compareFn?: (a: GeoElement, b: GeoElement) => number): GeoElement[] {
    return [...list.items].sort(compareFn);
  }

  static concat(list1: GeoListElement, list2: GeoListElement): GeoElement[] {
    return [...list1.items, ...list2.items];
  }

  static slice(list: GeoListElement, start: number, end?: number): GeoElement[] {
    return list.items.slice(start, end);
  }

  static join(list: GeoListElement, separator: string = ', '): string {
    return list.items.map(item => item.label).join(separator);
  }
}
