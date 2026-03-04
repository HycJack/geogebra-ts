import React, { useRef } from 'react';
import { 
  CircleDot, 
  Minus, 
  Slash, 
  Circle, 
  Hexagon,
  ArrowRight,
  Target,
  Trash2,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Download,
  Upload
} from 'lucide-react';
import { ToolMode } from '../types';
import { useGeoGebra } from '../core/GeoGebraContext';
import { cn } from '../lib/utils';
import { downloadJSON, readFileContent, generateExportFilename } from '../utils/importExport';

interface ToolButton {
  mode: ToolMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const tools: ToolButton[] = [
  { mode: 'move', label: '移动', icon: <MousePointer2 size={18} />, description: '移动和拖动对象' },
  { mode: 'pan', label: '抓手', icon: <Hand size={18} />, description: '拖拽坐标系' },
  { mode: 'point', label: '点', icon: <CircleDot size={18} />, description: '创建点' },
  { mode: 'segment', label: '线段', icon: <Minus size={18} />, description: '创建线段（两点）' },
  { mode: 'line', label: '直线', icon: <Slash size={18} />, description: '创建直线' },
  { mode: 'circle', label: '圆', icon: <Circle size={18} />, description: '创建圆（圆心和半径）' },
  { mode: 'polygon', label: '多边形', icon: <Hexagon size={18} />, description: '创建多边形' },
  { mode: 'vector', label: '向量', icon: <ArrowRight size={18} />, description: '创建向量' },
  { mode: 'intersect', label: '交点', icon: <Target size={18} />, description: '创建交点' },
  { mode: 'midpoint', label: '中点', icon: <CircleDot size={18} strokeWidth={1} />, description: '创建中点' },
  { mode: 'delete', label: '删除', icon: <Trash2 size={18} />, description: '删除对象' },
];

interface ToolbarProps {
  className?: string;
  style?: React.CSSProperties;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function Toolbar({ className, style, onZoomIn, onZoomOut }: ToolbarProps): React.ReactElement {
  const { state, setMode, undo, redo, canUndo, canRedo, exportData, importData } = useGeoGebra();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonContent = exportData();
    const filename = generateExportFilename();
    downloadJSON(jsonContent, filename);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileContent(file);
      importData(content);
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败: ' + (error as Error).message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200',
        className
      )}
      style={style}
    >
      {tools.map((tool) => {
        const isActive = state.interaction.mode === tool.mode;
        return (
          <button
            key={tool.mode}
            onClick={() => setMode(tool.mode)}
            title={tool.description}
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
              'hover:bg-gray-100 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isActive 
                ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-500' 
                : 'bg-white text-gray-600 hover:text-gray-900'
            )}
          >
            {tool.icon}
          </button>
        );
      })}
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      <button
        onClick={onZoomIn}
        title="放大"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <ZoomIn size={18} />
      </button>
      
      <button
        onClick={onZoomOut}
        title="缩小"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <ZoomOut size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      <button
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          canUndo
            ? 'bg-white text-gray-600 hover:text-gray-900'
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        )}
      >
        <Undo2 size={18} />
      </button>
      
      <button
        onClick={redo}
        disabled={!canRedo}
        title="重做 (Ctrl+Y)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          canRedo
            ? 'bg-white text-gray-600 hover:text-gray-900'
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        )}
      >
        <Redo2 size={18} />
      </button>
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      
      <button
        onClick={handleImportClick}
        title="导入 (从JSON文件)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <Upload size={18} />
      </button>
      
      <button
        onClick={handleExport}
        title="导出 (保存为JSON文件)"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-md transition-all duration-200',
          'hover:bg-gray-100 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          'bg-white text-gray-600 hover:text-gray-900'
        )}
      >
        <Download size={18} />
      </button>
    </div>
  );
}
