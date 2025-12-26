/**
 * 资源面板组件
 * Resource Panel Component
 * 
 * Requirements: 10.2, 10.3 - 显示数量、产出率、上限；低资源红色警告
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 * Requirements: 24.3 - 性能优化
 */

import { useState, memo, useCallback, useMemo } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import { usePopulationStore } from '../../store/populationStore';
import { useTimeStore } from '../../store/timeStore';
import { getResourceNameZh } from '../../config/resources';
import type { ResourceId } from '../../types';
import { Panel } from '../common/Panel';
import { ProgressBar } from '../common/ProgressBar';

/** 资源分类显示配置 */
const RESOURCE_CATEGORIES = [
  {
    id: 'survival',
    name: '生存资源',
    resources: ['water', 'food', 'raw_meat', 'canned_food', 'vegetables'] as ResourceId[],
  },
  {
    id: 'basic',
    name: '基础材料',
    resources: ['scrap', 'wood', 'metal', 'cloth', 'leather'] as ResourceId[],
  },
  {
    id: 'advanced',
    name: '高级材料',
    resources: ['plastic', 'glass', 'rubber', 'wire', 'rope', 'duct_tape'] as ResourceId[],
  },
  {
    id: 'components',
    name: '组件',
    resources: ['gear', 'pipe', 'spring', 'bearing', 'fasteners'] as ResourceId[],
  },
  {
    id: 'chemical',
    name: '化工材料',
    resources: ['solvent', 'acid', 'gunpowder', 'fuel'] as ResourceId[],
  },
  {
    id: 'energy',
    name: '能源组件',
    resources: ['battery_cell', 'battery_pack', 'filter', 'seal_ring'] as ResourceId[],
  },
  {
    id: 'rare',
    name: '稀有资源',
    resources: ['meds', 'data_tape', 'radio_parts', 'microchips', 'power_core'] as ResourceId[],
  },
];

/** 低资源警告阈值 (百分比) */
const LOW_RESOURCE_THRESHOLD = 0.2;

/** 危险资源警告阈值 (百分比) */
const CRITICAL_RESOURCE_THRESHOLD = 0.1;

interface ResourceItemProps {
  resourceId: ResourceId;
  amount: number;
  cap: number;
  productionRate?: number | undefined;
  compact?: boolean;
}

/** 资源项组件 - 使用memo优化 */
const ResourceItem = memo(function ResourceItem({ resourceId, amount, cap, productionRate, compact = false }: ResourceItemProps) {
  const percentage = cap > 0 ? amount / cap : 0;
  const isCritical = percentage <= CRITICAL_RESOURCE_THRESHOLD && cap > 0;
  const isLow = percentage <= LOW_RESOURCE_THRESHOLD && !isCritical && cap > 0;
  
  const nameZh = getResourceNameZh(resourceId);
  
  // 确定颜色
  let color: 'amber' | 'red' | 'green' = 'amber';
  let textColorClass = 'text-terminal-amber';
  
  if (isCritical) {
    color = 'red';
    textColorClass = 'text-terminal-red animate-pulse';
  } else if (isLow) {
    color = 'red';
    textColorClass = 'text-terminal-red';
  }

  return (
    <div className={compact ? 'mb-1.5' : 'mb-2'}>
      <div className={`flex justify-between items-center ${compact ? 'text-[11px]' : 'text-xs'}`}>
        <span className={textColorClass}>{nameZh}</span>
        <span className={`${textColorClass} tabular-nums`}>
          {amount.toFixed(amount % 1 === 0 ? 0 : 1)}
          <span className="text-terminal-dim">/{cap}</span>
          {productionRate !== undefined && productionRate !== 0 && (
            <span className={`${productionRate > 0 ? 'text-terminal-green' : 'text-terminal-red'} hidden sm:inline`}>
              {' '}{productionRate > 0 ? '+' : ''}{productionRate.toFixed(1)}/AU
            </span>
          )}
        </span>
      </div>
      <ProgressBar
        value={amount}
        max={cap}
        showValue={false}
        color={color}
        size="sm"
      />
    </div>
  );
});

interface ResourceCategoryProps {
  name: string;
  resources: ResourceId[];
  resourceAmounts: Record<ResourceId, number>;
  resourceCaps: Record<ResourceId, number>;
  productionRates?: Record<ResourceId, number>;
  isExpanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}

/** 资源分类组件 - 使用memo优化 */
const ResourceCategory = memo(function ResourceCategory({ 
  name, 
  resources, 
  resourceAmounts, 
  resourceCaps,
  productionRates,
  isExpanded,
  onToggle,
  compact = false,
}: ResourceCategoryProps) {
  // 只显示有上限或有数量的资源
  const visibleResources = useMemo(() => 
    resources.filter(
      id => (resourceCaps[id] ?? 0) > 0 || (resourceAmounts[id] ?? 0) > 0
    ),
    [resources, resourceCaps, resourceAmounts]
  );
  
  if (visibleResources.length === 0) {
    return null;
  }

  return (
    <div className={compact ? 'mb-3' : 'mb-4'}>
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between 
          ${compact ? 'text-[10px]' : 'text-xs'} 
          font-bold text-terminal-amber/60 uppercase tracking-wider 
          ${compact ? 'mb-1' : 'mb-2'}
          hover:text-terminal-amber/80 transition-colors
          min-h-[28px] sm:min-h-0
        `}
      >
        <span>{name}</span>
        <span className="text-terminal-dim">{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && visibleResources.map(resourceId => (
        <ResourceItem
          key={resourceId}
          resourceId={resourceId}
          amount={resourceAmounts[resourceId] ?? 0}
          cap={resourceCaps[resourceId] ?? 0}
          productionRate={productionRates?.[resourceId]}
          compact={compact}
        />
      ))}
    </div>
  );
});

export function ResourcePanel() {
  const resources = useResourceStore(state => state.resources);
  const resourceCaps = useResourceStore(state => state.resourceCaps);
  const workers = usePopulationStore(state => state.workers);
  const populationCap = usePopulationStore(state => state.populationCap);
  const morale = usePopulationStore(state => state.morale);
  const time = useTimeStore(state => state.time);
  
  // 分类展开状态 - 默认展开生存和基础材料
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    survival: true,
    basic: true,
    advanced: false,
    components: false,
    chemical: false,
    energy: false,
    rare: false,
  });
  
  // 使用useCallback优化切换函数
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  // 计算生产率（简化版，实际应该从 populationStore 获取）
  const productionRates: Partial<Record<ResourceId, number>> = useMemo(() => ({}), []);

  return (
    <div className="h-full flex flex-col">
      {/* 时间显示 */}
      <Panel className="border-b border-terminal-amber/20">
        <div className="text-center">
          <div className="text-base sm:text-lg font-bold">
            第 {time.day} 天
          </div>
          <div className="text-xs sm:text-sm text-terminal-amber/70">
            {getPhaseNameZh(time.phase)} ({time.phaseAU} AU)
          </div>
        </div>
      </Panel>

      {/* 人口显示 */}
      <Panel className="border-b border-terminal-amber/20">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-terminal-amber/70">人口</span>
          <span className="text-sm tabular-nums">
            {workers.length}/{populationCap}
          </span>
        </div>
        <ProgressBar
          value={workers.length}
          max={populationCap}
          showValue={false}
          color="amber"
          size="sm"
        />
        <div className="flex justify-between items-center mt-2 text-xs">
          <span className="text-terminal-amber/70">士气</span>
          <span className={morale >= 0 ? 'text-terminal-green' : 'text-terminal-red'}>
            {morale > 0 ? '+' : ''}{morale}
          </span>
        </div>
      </Panel>

      {/* 资源列表 */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 overscroll-contain">
        {RESOURCE_CATEGORIES.map(category => (
          <ResourceCategory
            key={category.id}
            name={category.name}
            resources={category.resources}
            resourceAmounts={resources}
            resourceCaps={resourceCaps}
            productionRates={productionRates as Record<ResourceId, number>}
            isExpanded={expandedCategories[category.id] ?? false}
            onToggle={() => toggleCategory(category.id)}
            compact={false}
          />
        ))}
      </div>
    </div>
  );
}

/** 获取阶段中文名 */
function getPhaseNameZh(phase: string): string {
  const names: Record<string, string> = {
    dawn: '清晨',
    morning: '上午',
    noon: '中午',
    afternoon: '下午',
    evening: '傍晚',
    midnight: '午夜',
  };
  return names[phase] ?? phase;
}

export default ResourcePanel;
