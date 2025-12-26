/**
 * 开局场景选择画面组件
 * Scenario Selection Screen Component
 * 
 * Requirements: 7.1, 7.4
 * - 显示场景选项列表
 * - 显示场景名称、描述、初始条件
 */

import { STARTING_SCENARIOS } from '../../config/scenarios';
import { Button } from '../common';

interface ScenarioSelectProps {
  onSelect: (scenarioId: string) => void;
  onBack?: () => void;
}

export function ScenarioSelect({ onSelect, onBack }: ScenarioSelectProps) {
  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-4">
      {/* 标题 */}
      <h2 className="text-2xl sm:text-3xl text-terminal-amber font-mono mb-8 text-glow">
        选择开局
      </h2>

      {/* 场景选项 */}
      <div className="flex flex-col gap-4 w-80 sm:w-[28rem]">
        {STARTING_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.id)}
            className="border border-terminal-amber/50 p-4 hover:bg-terminal-amber/10 
                       hover:border-terminal-amber transition-all duration-200 text-left
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-terminal-amber"
          >
            <div className="text-terminal-amber text-lg font-mono">
              {scenario.nameZh}
              <span className="text-terminal-dim text-sm ml-2">({scenario.name})</span>
            </div>
            <div className="text-terminal-dim text-sm mt-1">
              {scenario.descriptionZh}
            </div>
            <div className="text-terminal-dim/70 text-xs mt-3 flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-terminal-amber/80">
                工人: {scenario.startingWorkers}
              </span>
              <span>|</span>
              <span>废料: {scenario.startingResources.scrap || 0}</span>
              <span>|</span>
              <span>水: {scenario.startingResources.water || 0}</span>
              <span>|</span>
              <span>食物: {scenario.startingResources.food || 0}</span>
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

export default ScenarioSelect;
