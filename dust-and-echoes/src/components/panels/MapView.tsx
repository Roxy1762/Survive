/**
 * 地图视图组件
 * Map View Component
 * 
 * Requirements: 18.5 - 区域节点和状态显示
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 */

import { useState } from 'react';
import { useExplorationStore } from '../../store/explorationStore';
import type { MapNode, RegionTier, MapNodeState } from '../../types';

/** 区域层级颜色 */
const TIER_COLORS: Record<RegionTier, string> = {
  T0: 'text-terminal-green',
  T1: 'text-terminal-amber',
  T2: 'text-terminal-amber',
  T3: 'text-terminal-red/80',
  T4: 'text-terminal-red',
  T5: 'text-terminal-red animate-pulse',
};

/** 区域层级背景色 */
const TIER_BG_COLORS: Record<RegionTier, string> = {
  T0: 'bg-terminal-green/10',
  T1: 'bg-terminal-amber/10',
  T2: 'bg-terminal-amber/15',
  T3: 'bg-terminal-red/10',
  T4: 'bg-terminal-red/15',
  T5: 'bg-terminal-red/20',
};

/** 节点状态图标 */
const STATE_ICONS: Record<MapNodeState, string> = {
  undiscovered: '?',
  discovered: '◯',
  explored: '◉',
  cleared: '✓',
};

/** 节点状态颜色 */
const STATE_COLORS: Record<MapNodeState, string> = {
  undiscovered: 'text-terminal-dim',
  discovered: 'text-terminal-amber',
  explored: 'text-terminal-green',
  cleared: 'text-terminal-green',
};

/** 区域层级中文名 */
const TIER_NAMES_ZH: Record<RegionTier, string> = {
  T0: '基地',
  T1: '近郊',
  T2: '外环',
  T3: '危险区',
  T4: '高危设施',
  T5: '禁区核心',
};

interface MapNodeItemProps {
  node: MapNode;
  isSelected: boolean;
  onSelect: (node: MapNode) => void;
}

function MapNodeItem({ node, isSelected, onSelect }: MapNodeItemProps) {
  const tierColor = TIER_COLORS[node.tier];
  const tierBgColor = TIER_BG_COLORS[node.tier];
  const stateIcon = STATE_ICONS[node.state];
  const stateColor = STATE_COLORS[node.state];
  
  const isAccessible = node.state !== 'undiscovered';

  return (
    <button
      onClick={() => onSelect(node)}
      disabled={!isAccessible}
      className={`
        w-full text-left p-1.5 sm:p-2 mb-1 border transition-all duration-200
        min-h-[44px] sm:min-h-0
        ${isSelected 
          ? 'border-terminal-amber bg-terminal-amber/20' 
          : isAccessible 
            ? `border-terminal-amber/30 hover:border-terminal-amber/60 ${tierBgColor}`
            : 'border-terminal-dim/30 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className={`w-4 sm:w-5 text-center ${stateColor}`}>{stateIcon}</span>
        <span className={`flex-1 truncate text-xs sm:text-sm ${tierColor}`}>{node.nameZh}</span>
        <span className="text-[10px] sm:text-xs text-terminal-dim flex-shrink-0">{node.tier}</span>
      </div>
      {isAccessible && (
        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-terminal-dim pl-5 sm:pl-7">
          <span>距离: {node.distance}</span>
          <span className="hidden xs:inline">•</span>
          <span className="hidden xs:inline">风险: {(node.riskCoefficient * 100).toFixed(0)}%</span>
        </div>
      )}
    </button>
  );
}

interface MapNodeDetailsProps {
  node: MapNode | null;
  onExplore?: ((nodeId: string) => void) | undefined;
}

function MapNodeDetails({ node, onExplore }: MapNodeDetailsProps) {
  if (!node) {
    return (
      <div className="p-2 sm:p-3 text-center text-terminal-dim text-xs sm:text-sm">
        选择一个区域查看详情
      </div>
    );
  }

  const tierColor = TIER_COLORS[node.tier];
  const tierNameZh = TIER_NAMES_ZH[node.tier];
  const canExplore = node.state === 'discovered' || node.state === 'explored';

  return (
    <div className="p-2 sm:p-3">
      <h3 className={`text-sm sm:text-lg font-bold ${tierColor} mb-1.5 sm:mb-2 truncate`}>
        {node.nameZh}
      </h3>
      
      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
        <div className="flex justify-between">
          <span className="text-terminal-amber/70">区域类型</span>
          <span className={tierColor}>{tierNameZh} ({node.tier})</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-terminal-amber/70">距离</span>
          <span>{node.distance} AU</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-terminal-amber/70">风险系数</span>
          <span className={node.riskCoefficient > 0.5 ? 'text-terminal-red' : 'text-terminal-amber'}>
            {(node.riskCoefficient * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-terminal-amber/70">状态</span>
          <span className={STATE_COLORS[node.state]}>
            {getStateNameZh(node.state)}
          </span>
        </div>
        
        {node.events.length > 0 && (
          <div className="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-terminal-amber/20">
            <span className="text-terminal-amber/70 text-[10px] sm:text-xs">可能遭遇:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {node.events.slice(0, 6).map(event => (
                <span 
                  key={event}
                  className="px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs bg-terminal-amber/10 text-terminal-amber/80"
                >
                  {getEventNameZh(event)}
                </span>
              ))}
              {node.events.length > 6 && (
                <span className="px-1 py-0.5 text-[10px] sm:text-xs text-terminal-dim">
                  +{node.events.length - 6}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {canExplore && onExplore && (
        <button
          onClick={() => onExplore(node.id)}
          className="
            w-full mt-3 sm:mt-4 px-2 sm:px-3 py-2 sm:py-2 
            border border-terminal-amber text-terminal-amber 
            hover:bg-terminal-amber hover:text-terminal-bg 
            transition-colors
            min-h-[44px] sm:min-h-0
            text-xs sm:text-sm
          "
        >
          探索此区域
        </button>
      )}
    </div>
  );
}

interface MapViewProps {
  onExplore?: (nodeId: string) => void;
  className?: string;
}

export function MapView({ onExplore, className = '' }: MapViewProps) {
  const mapNodes = useExplorationStore(state => state.mapNodes);
  const radioTowerLevel = useExplorationStore(state => state.radioTowerLevel);
  const activeExpedition = useExplorationStore(state => state.activeExpedition);
  
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [filterTier, setFilterTier] = useState<RegionTier | 'all'>('all');
  
  // 过滤节点
  const filteredNodes = filterTier === 'all' 
    ? mapNodes.filter(n => n.id !== 'base')
    : mapNodes.filter(n => n.tier === filterTier && n.id !== 'base');
  
  // 按距离排序
  const sortedNodes = [...filteredNodes].sort((a, b) => a.distance - b.distance);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 标题栏 */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-b border-terminal-amber/20">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-terminal-amber/80">
            废土地图
          </h2>
          <span className="text-[10px] sm:text-xs text-terminal-dim">
            无线电塔 L{radioTowerLevel}
          </span>
        </div>
        
        {/* 层级过滤器 */}
        <div className="flex gap-1 mt-1.5 sm:mt-2 flex-wrap">
          <FilterButton 
            active={filterTier === 'all'} 
            onClick={() => setFilterTier('all')}
          >
            全部
          </FilterButton>
          {(['T1', 'T2', 'T3', 'T4', 'T5'] as RegionTier[]).map(tier => (
            <FilterButton
              key={tier}
              active={filterTier === tier}
              onClick={() => setFilterTier(tier)}
              className={TIER_COLORS[tier]}
            >
              {tier}
            </FilterButton>
          ))}
        </div>
      </div>
      
      {/* 当前探险状态 */}
      {activeExpedition && (
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-terminal-amber/10 border-b border-terminal-amber/20">
          <div className="text-[10px] sm:text-xs text-terminal-amber">
            探险进行中: {activeExpedition.status}
          </div>
        </div>
      )}
      
      {/* 节点列表 */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 overscroll-contain">
        {radioTowerLevel === 0 ? (
          <div className="text-center text-terminal-dim text-xs sm:text-sm py-3 sm:py-4">
            需要建造无线电塔才能探索
          </div>
        ) : sortedNodes.length === 0 ? (
          <div className="text-center text-terminal-dim text-xs sm:text-sm py-3 sm:py-4">
            没有可显示的区域
          </div>
        ) : (
          sortedNodes.map(node => (
            <MapNodeItem
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onSelect={setSelectedNode}
            />
          ))
        )}
      </div>
      
      {/* 选中节点详情 */}
      {selectedNode && (
        <div className="border-t border-terminal-amber/20 max-h-[40%] overflow-y-auto">
          <MapNodeDetails 
            node={selectedNode} 
            onExplore={onExplore}
          />
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function FilterButton({ active, onClick, children, className = '' }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs border transition-colors
        min-h-[28px] sm:min-h-0
        ${active 
          ? 'border-terminal-amber bg-terminal-amber/20 text-terminal-amber' 
          : 'border-terminal-dim/50 text-terminal-dim hover:border-terminal-amber/50 hover:text-terminal-amber/70'
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/** 获取状态中文名 */
function getStateNameZh(state: MapNodeState): string {
  const names: Record<MapNodeState, string> = {
    undiscovered: '未发现',
    discovered: '已发现',
    explored: '已探索',
    cleared: '已清理',
  };
  return names[state];
}

/** 获取事件中文名 */
function getEventNameZh(event: string): string {
  const names: Record<string, string> = {
    scavenge: '搜刮',
    ambush: '伏击',
    water_source: '水源',
    creature: '生物',
    food_cache: '食物储藏',
    wanderer: '流浪者',
    trader: '商人',
    raider: '掠夺者',
    fuel_cache: '燃料储藏',
    hidden_cache: '隐藏储藏',
    combat: '战斗',
    loot_cache: '战利品',
    industrial_loot: '工业物资',
    hazard: '危险',
    military_loot: '军用物资',
    rare_loot: '稀有物资',
    radiation: '辐射',
    tech_loot: '科技物资',
    signal: '信号',
    data: '数据',
    power: '能源',
    water_tech: '水处理技术',
    power_core: '能源核心',
    extreme_hazard: '极端危险',
    nanotech: '纳米技术',
    story: '剧情',
  };
  return names[event] ?? event;
}

export default MapView;
