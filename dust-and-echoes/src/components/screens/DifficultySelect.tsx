/**
 * 难度选择画面组件
 * Difficulty Selection Screen Component
 * 
 * Requirements: 6.5
 * - 显示三个难度选项
 * - 点击后传递选择到父组件
 */

import { DIFFICULTY_CONFIGS, type DifficultyLevel } from '../../config/difficulty';
import { Button } from '../common';

interface DifficultySelectProps {
  onSelect: (difficulty: DifficultyLevel) => void;
  onBack?: () => void;
}

export function DifficultySelect({ onSelect, onBack }: DifficultySelectProps) {
  const difficulties = Object.values(DIFFICULTY_CONFIGS);

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-4">
      {/* 标题 */}
      <h2 className="text-2xl sm:text-3xl text-terminal-amber font-mono mb-8 text-glow">
        选择难度
      </h2>

      {/* 难度选项 */}
      <div className="flex flex-col gap-4 w-80 sm:w-96">
        {difficulties.map((config) => (
          <button
            key={config.id}
            onClick={() => onSelect(config.id)}
            className="border border-terminal-amber/50 p-4 hover:bg-terminal-amber/10 
                       hover:border-terminal-amber transition-all duration-200 text-left
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-terminal-amber"
          >
            <div className="text-terminal-amber text-lg font-mono">
              {config.nameZh}
              <span className="text-terminal-dim text-sm ml-2">({config.name})</span>
            </div>
            <div className="text-terminal-dim text-sm mt-1">
              {config.descriptionZh}
            </div>
            <div className="text-terminal-dim/70 text-xs mt-2 flex flex-wrap gap-2">
              <span>消耗: {config.modifiers.consumptionMultiplier}x</span>
              <span>·</span>
              <span>初始资源: {config.modifiers.startingResourceMultiplier}x</span>
              <span>·</span>
              <span>危险: {config.modifiers.eventDangerMultiplier}x</span>
            </div>
          </button>
        ))}
      </div>

      {/* 返回按钮 */}
      {onBack && (
        <div className="mt-8">
          <Button variant="secondary" onClick={onBack}>
            返回
          </Button>
        </div>
      )}
    </div>
  );
}

export default DifficultySelect;
