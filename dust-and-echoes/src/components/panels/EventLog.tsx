/**
 * 事件日志组件
 * Event Log Component
 * 
 * Requirements: 10.5 - 渐隐效果的叙事文本
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 */

import { useEffect, useRef } from 'react';
import { useEventStore } from '../../store/eventStore';
import type { EventLogEntry, EventType, Phase } from '../../types';

/** 事件类型图标 */
const EVENT_TYPE_ICONS: Record<EventType | 'action' | 'system', string> = {
  resource_discovery: '📦',
  wanderer_arrival: '👤',
  raid: '⚔️',
  trader_visit: '🛒',
  weather: '🌤️',
  story_signal: '📡',
  death: '💀',
  action: '▶',
  system: '⚙️',
};

/** 事件类型颜色 */
const EVENT_TYPE_COLORS: Record<EventType | 'action' | 'system', string> = {
  resource_discovery: 'text-terminal-green',
  wanderer_arrival: 'text-terminal-amber',
  raid: 'text-terminal-red',
  trader_visit: 'text-terminal-amber',
  weather: 'text-terminal-amber/70',
  story_signal: 'text-terminal-green',
  death: 'text-terminal-red',
  action: 'text-terminal-amber/80',
  system: 'text-terminal-dim',
};

/** 阶段中文名 */
const PHASE_NAMES_ZH: Record<Phase, string> = {
  dawn: '清晨',
  morning: '上午',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  midnight: '午夜',
};

interface EventLogItemProps {
  entry: EventLogEntry;
  index: number;
  totalCount: number;
  compact?: boolean;
}

function EventLogItem({ entry, index, totalCount, compact = false }: EventLogItemProps) {
  // 计算渐隐效果 - 越旧的条目越淡
  const fadeLevel = Math.min(index / Math.max(totalCount - 1, 1), 0.7);
  const opacity = 1 - fadeLevel;
  
  const icon = EVENT_TYPE_ICONS[entry.type] ?? '•';
  const colorClass = EVENT_TYPE_COLORS[entry.type] ?? 'text-terminal-amber';
  const phaseNameZh = PHASE_NAMES_ZH[entry.timestamp.phase];

  return (
    <div 
      className={`${compact ? 'mb-1.5' : 'mb-2'} transition-opacity duration-500 ${colorClass}`}
      style={{ opacity }}
    >
      <div className="flex items-start gap-1.5 sm:gap-2">
        <span className={`flex-shrink-0 ${compact ? 'w-4 text-sm' : 'w-5'} text-center`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`${compact ? 'text-[10px]' : 'text-xs'} text-terminal-dim mb-0.5`}>
            D{entry.timestamp.day} {phaseNameZh}
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed break-words`}>
            {entry.messageZh || entry.message}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EventLogProps {
  maxEntries?: number;
  className?: string;
  compact?: boolean;
}

export function EventLog({ maxEntries = 20, className = '', compact = false }: EventLogProps) {
  const eventLog = useEventStore(state => state.eventLog);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // 显示的条目（最新的在前）
  const displayedEntries = eventLog.slice(0, maxEntries);
  
  // 新条目添加时滚动到顶部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [eventLog.length]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className={`${compact ? 'px-2 py-1.5' : 'px-2 sm:px-3 py-1.5 sm:py-2'} border-b border-terminal-amber/20`}>
        <h2 className={`${compact ? 'text-xs' : 'text-xs sm:text-sm'} font-bold uppercase tracking-wider text-terminal-amber/80`}>
          事件日志
        </h2>
      </div>
      
      <div 
        ref={logContainerRef}
        className={`flex-1 overflow-y-auto ${compact ? 'p-2' : 'p-2 sm:p-3'} overscroll-contain`}
      >
        {displayedEntries.length === 0 ? (
          <div className={`text-center text-terminal-dim ${compact ? 'text-xs py-2' : 'text-xs sm:text-sm py-3 sm:py-4'}`}>
            暂无事件记录
          </div>
        ) : (
          displayedEntries.map((entry, index) => (
            <EventLogItem
              key={entry.id}
              entry={entry}
              index={index}
              totalCount={displayedEntries.length}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default EventLog;
