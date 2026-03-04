/**
 * 导入导出工具函数
 * 支持将几何图形导出为JSON文件，以及从JSON文件导入
 */

import type { GeoElement, ViewState } from '../types';

/**
 * 导出数据格式
 */
export interface ExportData {
  version: string;
  timestamp: number;
  metadata: {
    appName: string;
    exportVersion: string;
  };
  view: ViewState;
  elements: GeoElement[];
}

/**
 * 当前导出版本
 */
const EXPORT_VERSION = '1.0.0';

/**
 * 导出几何图形为JSON
 * @param elements 几何元素Map
 * @param elementOrder 元素顺序
 * @param view 视图状态
 * @returns JSON字符串
 */
export function exportToJSON(
  elements: Map<string, GeoElement>,
  elementOrder: string[],
  view: ViewState
): string {
  const elementsArray: GeoElement[] = [];
  
  for (const id of elementOrder) {
    const element = elements.get(id);
    if (element) {
      elementsArray.push(element);
    }
  }

  const exportData: ExportData = {
    version: EXPORT_VERSION,
    timestamp: Date.now(),
    metadata: {
      appName: 'GeoGebra TS',
      exportVersion: EXPORT_VERSION,
    },
    view,
    elements: elementsArray,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * 从JSON导入几何图形
 * @param jsonString JSON字符串
 * @returns 解析后的数据
 */
export function importFromJSON(jsonString: string): {
  elements: GeoElement[];
  view: Partial<ViewState>;
} {
  const data = JSON.parse(jsonString) as ExportData;
  
  if (!data.version || !data.elements) {
    throw new Error('无效的文件格式');
  }

  return {
    elements: data.elements,
    view: data.view || {},
  };
}

/**
 * 下载JSON文件
 * @param content JSON内容
 * @param filename 文件名
 */
export function downloadJSON(content: string, filename: string = 'geogebra-export.json'): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 读取文件内容
 * @param file 文件对象
 * @returns 文件内容Promise
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('无法读取文件内容'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * 验证导入数据
 * @param data 导入数据
 * @returns 是否有效
 */
export function validateImportData(data: unknown): data is ExportData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  
  if (typeof obj.version !== 'string') {
    return false;
  }

  if (!Array.isArray(obj.elements)) {
    return false;
  }

  return true;
}

/**
 * 生成导出文件名
 * @returns 文件名
 */
export function generateExportFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `geogebra-${year}${month}${day}-${hours}${minutes}.json`;
}

/**
 * 合并导入的元素到现有状态
 * @param existingElements 现有元素
 * @param existingOrder 现有顺序
 * @param newElements 新元素
 * @returns 合并后的数据
 */
export function mergeImportedElements(
  existingElements: Map<string, GeoElement>,
  existingOrder: string[],
  newElements: GeoElement[]
): {
  elements: Map<string, GeoElement>;
  order: string[];
} {
  const mergedElements = new Map(existingElements);
  const mergedOrder = [...existingOrder];
  
  for (const element of newElements) {
    if (!mergedElements.has(element.id)) {
      mergedElements.set(element.id, element);
      mergedOrder.push(element.id);
    }
  }
  
  return {
    elements: mergedElements,
    order: mergedOrder,
  };
}
