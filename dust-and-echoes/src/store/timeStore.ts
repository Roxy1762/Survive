/**
 * 时间与阶段系统状态管理
 * Time & Phase System State Management
 */

import { create } from 'zustand';
import { Phase, TimeState, PHASE_AU, PHASE_ORDER } from '../types';

/**
 * 获取下一个阶段
 * @param currentPhase 当前阶段
 * @returns 下一个阶段
 */
export function getNextPhase(currentPhase: Phase): Phase {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const nextIndex = (currentIndex + 1) % PHASE_ORDER.length;
  return PHASE_ORDER[nextIndex] as Phase;
}

/**
 * 检查是否是午夜阶段（需要日期翻转）
 * @param phase 阶段
 * @returns 是否是午夜
 */
export function isMidnight(phase: Phase): boolean {
  return phase === 'midnight';
}

/**
 * 获取阶段的AU值
 * @param phase 阶段
 * @returns AU值
 */
export function getPhaseAU(phase: Phase): number {
  return PHASE_AU[phase];
}

/**
 * 创建初始时间状态
 * @returns 初始TimeState
 */
export function createInitialTimeState(): TimeState {
  const initialPhase: Phase = 'dawn';
  return {
    day: 1,
    phase: initialPhase,
    phaseAU: PHASE_AU[initialPhase],
  };
}

/** 时间Store接口 */
interface TimeStore {
  // 状态
  time: TimeState;
  
  // 操作
  /** 推进到下一个阶段 */
  advancePhase: () => void;
  /** 重置时间状态 */
  resetTime: () => void;
  /** 获取当前阶段AU值 */
  getCurrentPhaseAU: () => number;
  /** 检查是否是短行动阶段（清晨/中午） */
  isShortActionPhase: () => boolean;
}

/**
 * 时间状态Store
 */
export const useTimeStore = create<TimeStore>((set, get) => ({
  // 初始状态
  time: createInitialTimeState(),
  
  // 推进阶段
  advancePhase: () => {
    set((state) => {
      const currentPhase = state.time.phase;
      const nextPhase = getNextPhase(currentPhase);
      
      // 如果当前是午夜，下一个阶段是清晨，日期+1
      const shouldAdvanceDay = isMidnight(currentPhase);
      const newDay = shouldAdvanceDay ? state.time.day + 1 : state.time.day;
      
      return {
        time: {
          day: newDay,
          phase: nextPhase,
          phaseAU: PHASE_AU[nextPhase],
        },
      };
    });
  },
  
  // 重置时间
  resetTime: () => {
    set({ time: createInitialTimeState() });
  },
  
  // 获取当前阶段AU值
  getCurrentPhaseAU: () => {
    return get().time.phaseAU;
  },
  
  // 检查是否是短行动阶段
  isShortActionPhase: () => {
    const phase = get().time.phase;
    return phase === 'dawn' || phase === 'noon';
  },
}));
