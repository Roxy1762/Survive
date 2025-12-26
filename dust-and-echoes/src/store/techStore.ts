/**
 * 科技树系统状态管理
 * Tech Tree System State Management
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { create } from 'zustand';
import type { ResourceId, TechState, TechUnlock, Technology } from '../types';
import { 
  getTechnologyById, 
  checkPrerequisites, 
  getAvailableTechnologies 
} from '../config/technologies';

// ============================================
// 研究结果类型
// Research Result Types
// ============================================

export interface ResearchStartResult {
  success: boolean;
  reason?: string;
  materialsConsumed?: { resourceId: ResourceId; amount: number }[];
}

export interface ResearchProgressResult {
  completed: boolean;
  techId?: string;
  unlocks?: TechUnlock[];
}

// ============================================
// 科技Store接口
// Tech Store Interface
// ============================================

interface TechStore extends TechState {
  // 状态查询
  /** 检查科技是否已研究 */
  isResearched: (techId: string) => boolean;
  /** 获取当前研究进度百分比 */
  getProgressPercent: () => number;
  /** 获取可研究的科技列表 */
  getAvailableTechs: () => Technology[];
  /** 检查是否可以开始研究某科技 */
  canStartResearch: (techId: string) => { canStart: boolean; reason?: string };
  /** 获取当前研究的科技信息 */
  getCurrentResearch: () => Technology | null;
  /** 获取剩余RP需求 */
  getRemainingRP: () => number;
  
  // 研究操作
  /** 开始研究科技（不消耗材料，仅设置状态） */
  startResearch: (techId: string) => boolean;
  /** 添加研究进度 (RP) */
  addProgress: (rp: number) => ResearchProgressResult;
  /** 取消当前研究 */
  cancelResearch: () => void;
  /** 直接完成科技研究（用于测试或作弊） */
  completeResearch: (techId: string) => boolean;
  
  // 解锁查询
  /** 获取已解锁的建筑ID列表 */
  getUnlockedBuildings: () => string[];
  /** 获取已解锁的配方ID列表 */
  getUnlockedRecipes: () => string[];
  /** 获取已解锁的岗位ID列表 */
  getUnlockedJobs: () => string[];
  /** 获取已解锁的区域ID列表 */
  getUnlockedRegions: () => string[];
  /** 获取已解锁的功能ID列表 */
  getUnlockedFeatures: () => string[];
  /** 检查某项内容是否已解锁 */
  isUnlocked: (type: TechUnlock['type'], id: string) => boolean;
  /** 获取科技的所有解锁内容 */
  getTechUnlocks: (techId: string) => TechUnlock[];
  
  // 重置
  /** 重置科技状态 */
  resetTech: () => void;
}

/**
 * 初始科技状态
 */
const initialTechState: TechState = {
  researched: [],
  current: null,
  progress: 0,
};

/**
 * 收集所有已研究科技的解锁内容
 */
function collectUnlocks(researchedTechs: string[]): TechUnlock[] {
  const unlocks: TechUnlock[] = [];
  for (const techId of researchedTechs) {
    const tech = getTechnologyById(techId);
    if (tech) {
      unlocks.push(...tech.unlocks);
    }
  }
  return unlocks;
}

/**
 * 科技状态Store
 */
export const useTechStore = create<TechStore>((set, get) => ({
  // 初始状态
  ...initialTechState,
  
  // 检查科技是否已研究
  isResearched: (techId: string): boolean => {
    return get().researched.includes(techId);
  },
  
  // 获取当前研究进度百分比
  getProgressPercent: (): number => {
    const { current, progress } = get();
    if (!current) return 0;
    
    const tech = getTechnologyById(current);
    if (!tech) return 0;
    
    return Math.min(100, (progress / tech.rpCost) * 100);
  },
  
  // 获取可研究的科技列表
  getAvailableTechs: (): Technology[] => {
    return getAvailableTechnologies(get().researched);
  },
  
  // 获取当前研究的科技信息
  getCurrentResearch: (): Technology | null => {
    const { current } = get();
    if (!current) return null;
    return getTechnologyById(current) ?? null;
  },
  
  // 获取剩余RP需求
  getRemainingRP: (): number => {
    const { current, progress } = get();
    if (!current) return 0;
    
    const tech = getTechnologyById(current);
    if (!tech) return 0;
    
    return Math.max(0, tech.rpCost - progress);
  },
  
  // 检查是否可以开始研究某科技
  canStartResearch: (techId: string) => {
    const state = get();
    
    // 检查科技是否存在
    const tech = getTechnologyById(techId);
    if (!tech) {
      return { canStart: false, reason: '科技不存在' };
    }
    
    // 检查是否已研究
    if (state.researched.includes(techId)) {
      return { canStart: false, reason: '该科技已研究完成' };
    }
    
    // 检查是否正在研究其他科技
    if (state.current && state.current !== techId) {
      return { canStart: false, reason: '正在研究其他科技' };
    }
    
    // 检查前置条件
    if (!checkPrerequisites(techId, state.researched)) {
      return { canStart: false, reason: '前置科技未完成' };
    }
    
    return { canStart: true };
  },
  
  // 开始研究科技（不消耗材料，仅设置状态）
  startResearch: (techId: string): boolean => {
    const { canStart } = get().canStartResearch(techId);
    if (!canStart) return false;
    
    set({
      current: techId,
      progress: 0,
    });
    
    return true;
  },
  
  // 添加研究进度
  addProgress: (rp: number): ResearchProgressResult => {
    const { current, progress } = get();
    
    if (!current || rp <= 0) {
      return { completed: false };
    }
    
    const tech = getTechnologyById(current);
    if (!tech) {
      return { completed: false };
    }
    
    const newProgress = progress + rp;
    
    // 检查是否完成研究
    if (newProgress >= tech.rpCost) {
      // 研究完成
      set((state) => ({
        researched: [...state.researched, current],
        current: null,
        progress: 0,
      }));
      
      return { 
        completed: true, 
        techId: current,
        unlocks: tech.unlocks,
      };
    }
    
    // 更新进度
    set({ progress: newProgress });
    return { completed: false };
  },
  
  // 取消当前研究
  cancelResearch: (): void => {
    set({
      current: null,
      progress: 0,
    });
  },
  
  // 直接完成科技研究（用于测试或作弊）
  completeResearch: (techId: string): boolean => {
    const state = get();
    
    // 检查科技是否存在
    const tech = getTechnologyById(techId);
    if (!tech) return false;
    
    // 检查是否已研究
    if (state.researched.includes(techId)) return false;
    
    // 检查前置条件
    if (!checkPrerequisites(techId, state.researched)) return false;
    
    // 直接添加到已研究列表
    set((state) => ({
      researched: [...state.researched, techId],
      // 如果正在研究这个科技，清除当前研究状态
      current: state.current === techId ? null : state.current,
      progress: state.current === techId ? 0 : state.progress,
    }));
    
    return true;
  },
  
  // 获取已解锁的建筑ID列表
  getUnlockedBuildings: (): string[] => {
    const unlocks = collectUnlocks(get().researched);
    return unlocks
      .filter(u => u.type === 'building')
      .map(u => u.id);
  },
  
  // 获取已解锁的配方ID列表
  getUnlockedRecipes: (): string[] => {
    const unlocks = collectUnlocks(get().researched);
    return unlocks
      .filter(u => u.type === 'recipe')
      .map(u => u.id);
  },
  
  // 获取已解锁的岗位ID列表
  getUnlockedJobs: (): string[] => {
    const unlocks = collectUnlocks(get().researched);
    return unlocks
      .filter(u => u.type === 'job')
      .map(u => u.id);
  },
  
  // 获取已解锁的区域ID列表
  getUnlockedRegions: (): string[] => {
    const unlocks = collectUnlocks(get().researched);
    return unlocks
      .filter(u => u.type === 'region')
      .map(u => u.id);
  },
  
  // 获取已解锁的功能ID列表
  getUnlockedFeatures: (): string[] => {
    const unlocks = collectUnlocks(get().researched);
    return unlocks
      .filter(u => u.type === 'feature')
      .map(u => u.id);
  },
  
  // 检查某项内容是否已解锁
  isUnlocked: (type: TechUnlock['type'], id: string): boolean => {
    const unlocks = collectUnlocks(get().researched);
    return unlocks.some(u => u.type === type && u.id === id);
  },
  
  // 获取科技的所有解锁内容
  getTechUnlocks: (techId: string): TechUnlock[] => {
    const tech = getTechnologyById(techId);
    return tech?.unlocks ?? [];
  },
  
  // 重置科技状态
  resetTech: (): void => {
    set(initialTechState);
  },
}));

// ============================================
// 辅助函数导出
// Helper Function Exports
// ============================================

/**
 * 获取科技的材料成本
 */
export function getTechMaterialCost(techId: string): { resourceId: ResourceId; amount: number }[] {
  const tech = getTechnologyById(techId);
  return (tech?.materialCost ?? []) as { resourceId: ResourceId; amount: number }[];
}

/**
 * 获取科技的RP成本
 */
export function getTechRPCost(techId: string): number {
  const tech = getTechnologyById(techId);
  return tech?.rpCost ?? 0;
}

/**
 * 检查是否有足够的材料研究科技
 * @param techId 科技ID
 * @param resources 当前资源
 */
export function hasEnoughMaterialsForTech(
  techId: string,
  resources: Record<ResourceId, number>
): boolean {
  const materialCost = getTechMaterialCost(techId);
  
  for (const { resourceId, amount } of materialCost) {
    if ((resources[resourceId] ?? 0) < amount) {
      return false;
    }
  }
  
  return true;
}

/**
 * 验证研究条件（前置科技 + 材料）
 * @param techId 科技ID
 * @param researchedTechs 已研究的科技列表
 * @param resources 当前资源
 */
export function validateResearchRequirements(
  techId: string,
  researchedTechs: string[],
  resources: Record<ResourceId, number>
): { valid: boolean; reason?: string; missingMaterials?: { resourceId: ResourceId; required: number; current: number }[] } {
  const tech = getTechnologyById(techId);
  
  if (!tech) {
    return { valid: false, reason: '科技不存在' };
  }
  
  // 检查是否已研究
  if (researchedTechs.includes(techId)) {
    return { valid: false, reason: '该科技已研究完成' };
  }
  
  // 检查前置条件
  if (!checkPrerequisites(techId, researchedTechs)) {
    const missingPrereqs = tech.prerequisites.filter(p => !researchedTechs.includes(p));
    return { valid: false, reason: `缺少前置科技: ${missingPrereqs.join(', ')}` };
  }
  
  // 检查材料
  const materialCost = getTechMaterialCost(techId);
  const missingMaterials: { resourceId: ResourceId; required: number; current: number }[] = [];
  
  for (const { resourceId, amount } of materialCost) {
    const current = resources[resourceId] ?? 0;
    if (current < amount) {
      missingMaterials.push({ resourceId, required: amount, current });
    }
  }
  
  if (missingMaterials.length > 0) {
    return { valid: false, reason: '材料不足', missingMaterials };
  }
  
  return { valid: true };
}

/**
 * 获取科技的完整信息（包含成本和解锁）
 */
export function getTechInfo(techId: string) {
  const tech = getTechnologyById(techId);
  if (!tech) return null;
  
  return {
    ...tech,
    materialCost: getTechMaterialCost(techId),
    rpCost: tech.rpCost,
  };
}
