/**
 * 存档导入导出UI组件
 * Save Export/Import UI Component
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { useRef, useState, useCallback, type ChangeEvent } from 'react';
import { useSaveStore } from '../store/saveStore';
import { collectGameState, restoreGameState } from '../store/gameIntegration';
import { Button } from './common/Button';

interface SaveExportUIProps {
  className?: string;
  /** 导入成功后的回调 */
  onImportSuccess?: () => void;
}

export function SaveExportUI({ className = '', onImportSuccess }: SaveExportUIProps) {
  const downloadSave = useSaveStore(state => state.downloadSave);
  const importFromFile = useSaveStore(state => state.importFromFile);
  const isLoading = useSaveStore(state => state.isLoading);
  const loadError = useSaveStore(state => state.loadError);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 清除消息
  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  // 导出存档
  const handleExport = useCallback(() => {
    try {
      downloadSave(collectGameState);
      setMessage({ type: 'success', text: '存档已导出' });
      // 3秒后清除消息
      setTimeout(clearMessage, 3000);
    } catch {
      setMessage({ type: 'error', text: '导出失败' });
      setTimeout(clearMessage, 3000);
    }
  }, [downloadSave, clearMessage]);

  // 触发文件选择
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 处理文件导入
  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const saveData = await importFromFile(file);
      
      if (saveData) {
        const restored = restoreGameState(saveData);
        if (restored) {
          setMessage({ type: 'success', text: '存档导入成功' });
          onImportSuccess?.();
        } else {
          setMessage({ type: 'error', text: '恢复游戏状态失败' });
        }
      } else {
        setMessage({ type: 'error', text: '无效的存档文件' });
      }
    } catch {
      setMessage({ type: 'error', text: '导入失败：文件读取错误' });
    }

    // 清除文件输入，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // 3秒后清除消息
    setTimeout(clearMessage, 3000);
  }, [importFromFile, onImportSuccess, clearMessage]);

  return (
    <div className={`${className}`}>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={handleExport}
          disabled={isLoading}
        >
          导出存档
        </Button>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={handleImportClick}
          disabled={isLoading}
        >
          导入存档
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {/* 状态消息 */}
      {message && (
        <div 
          className={`mt-2 text-xs ${
            message.type === 'success' 
              ? 'text-terminal-green' 
              : 'text-terminal-red'
          }`}
        >
          {message.text}
        </div>
      )}
      
      {/* 加载错误 */}
      {loadError && !message && (
        <div className="mt-2 text-xs text-terminal-red">
          {loadError}
        </div>
      )}
    </div>
  );
}

export default SaveExportUI;
