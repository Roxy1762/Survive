/**
 * 时间显示组件
 * Time Display Component
 */

import { useTimeStore } from '../../store/timeStore';
import type { Phase } from '../../types';

/** 阶段中文名映射 */
const PHASE_NAMES_ZH: Record<Phase, string> = {
  dawn: '清晨',
  morning: '上午',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  midnight: '午夜',
};

/** 阶段图标 */
const PHASE_ICONS: Record<Phase, string> = {
  dawn: '🌅',
  morning: '☀️',
  noon: '🌞',
  afternoon: '🌤️',
  evening: '🌆',
  midnight: '🌙',
};

interface TimeDisplayProps {
  showIcon?: boolean;
  compact?: boolean;
}

export function TimeDisplay({ showIcon = true, compact = false }: TimeDisplayProps) {
  const time = useTimeStore(state => state.time);
  
  const phaseNameZh = PHASE_NAMES_ZH[time.phase];
  const phaseIcon = PHASE_ICONS[time.phase];

  if (compact) {
    return (
      <span className="text-terminal-amber">
        {showIcon && <span className="mr-1">{phaseIcon}</span>}
        D{time.day} {phaseNameZh}
      </span>
    );
  }

  return (
    <div className="text-center">
      <div className="text-2xl font-bold mb-1">
        {showIcon && <span className="mr-2">{phaseIcon}</span>}
        第 {time.day} 天
      </div>
      <div className="text-lg text-terminal-amber/80">
        {phaseNameZh}
      </div>
      <div className="text-sm text-terminal-amber/60">
        {time.phaseAU} AU
      </div>
    </div>
  );
}

export default TimeDisplay;
