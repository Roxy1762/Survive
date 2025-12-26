/**
 * 先锋营地系统状态管理
 * Outpost System State Management
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { create } from 'zustand';
import type { 
  Outpost, 
  OutpostModule, 
  OutpostModuleType,
  ResourceAmount,
} from '../types';
import {
  OUTPOST_LEVEL_CONFIGS,
  OUTPOST_MODULE_CONFIGS,
  SUPPLY_LINE_CONFIG,
  calculateSupplyLineStability,
  isSupplyLineCritical,
  isSupplyLineWarning,
  canEstablishOutpost,
  canUpgradeOutpost,
  canBuildModule,
  getOutpostBuildCost,
  getModuleBuildCost,
  getOutpostLevelConfig,
  getModuleConfig,
  OUTPOST_REQUIRED_TECH,
} from '../config/outpost';

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 生成营地ID
 */
export function generateOutpostId(): string {
  return `outpost_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================
// 营地事件类型
// Outpost Event Types
// ============================================

export type OutpostEventType = 
  | 'supply_disruption'
  | 'stability_warning'
  | 'stability_critical'
  | 'module_completed'
  | 'upgrade_completed';

export interface OutpostEvent {
  type: OutpostEventType;
  outpostId: string;
  message: string;
  messageZh: string;
  day: number;
}

// ============================================
// 营地Store接口
// Outpost Store Interface
// ============================================

interface OutpostStore {
  // 状态
  outposts: Outpost[];
  events: OutpostEvent[];
  
  // 查询操作
  /** 获取所有营地 */
  getAllOutposts: () => Outpost[];
  /** 根据ID获取营地 */
  getOutpost: (outpostId: string) => Outpost | undefined;
  /** 根据节点ID获取营地 */
  getOutpostByNodeId: (nodeId: string) => Outpost | undefined;
  /** 获取营地数量 */
  getOutpostCount: () => number;
  /** 获取所有营地所在的节点ID */
  getOutpostNodeIds: () => string[];
  
  // 建立营地 - Requirements: 9.1, 9.2
  /** 检查是否可以建立营地 */
  canEstablish: (
    nodeId: string,
    nodeState: string,
    researchedTechs: string[]
  ) => { canEstablish: boolean; reason?: string };
  /** 获取建立营地所需资源 */
  getEstablishCost: (level?: number) => ResourceAmount[];
  /** 建立营地 */
  establishOutpost: (
    nodeId: string,
    distance: number
  ) => Outpost | null;
  
  // 升级营地 - Requirements: 9.3
  /** 检查是否可以升级营地 */
  canUpgrade: (
    outpostId: string,
    researchedTechs: string[]
  ) => { canUpgrade: boolean; reason?: string };
  /** 获取升级所需资源 */
  getUpgradeCost: (outpostId: string) => ResourceAmount[];
  /** 升级营地 */
  upgradeOutpost: (outpostId: string) => boolean;
  
  // 补给线稳定度 - Requirements: 9.4, 9.5
  /** 计算营地稳定度 */
  calculateStability: (outpostId: string, distance: number) => number;
  /** 更新营地稳定度 */
  updateStability: (outpostId: string, distance: number) => void;
  /** 更新所有营地稳定度 */
  updateAllStabilities: (nodeDistances: Record<string, number>) => void;
  /** 检查是否处于危机状态 */
  isInCrisis: (outpostId: string) => boolean;
  /** 检查是否处于警告状态 */
  isInWarning: (outpostId: string) => boolean;
  /** 处理补给线中断事件 - Requirements: 9.5 */
  processSupplyDisruption: (outpostId: string, day: number) => OutpostEvent | null;
  
  // 模块管理 - Requirements: 9.6
  /** 检查是否可以建造模块 */
  canBuildModule: (
    outpostId: string,
    moduleType: OutpostModuleType,
    researchedTechs: string[]
  ) => { canBuild: boolean; reason?: string };
  /** 获取模块建造成本 */
  getModuleCost: (
    outpostId: string,
    moduleType: OutpostModuleType
  ) => ResourceAmount[];
  /** 建造模块 */
  buildModule: (
    outpostId: string,
    moduleType: OutpostModuleType
  ) => boolean;
  /** 升级模块 */
  upgradeModule: (
    outpostId: string,
    moduleType: OutpostModuleType
  ) => boolean;
  /** 获取模块效果 */
  getModuleEffects: (outpostId: string) => {
    storageBonus: number;
    stabilityBonus: number;
    detectionRange: number;
    repairEfficiency: number;
    healingRate: number;
    relayRange: number;
  };
  
  // 驻军管理
  /** 分配驻军 */
  assignGarrison: (outpostId: string, workerIds: string[]) => boolean;
  /** 移除驻军 */
  removeGarrison: (outpostId: string, workerId: string) => boolean;
  /** 获取驻军数量 */
  getGarrisonCount: (outpostId: string) => number;
  /** 获取最大驻军数量 */
  getMaxGarrison: (outpostId: string) => number;
  
  // 事件管理
  /** 获取事件 */
  getEvents: () => OutpostEvent[];
  /** 清除事件 */
  clearEvents: () => void;
  
  // 重置
  /** 移除营地 */
  removeOutpost: (outpostId: string) => boolean;
  /** 重置所有营地 */
  resetOutposts: () => void;
}

/**
 * 先锋营地状态Store
 */
export const useOutpostStore = create<OutpostStore>((set, get) => ({
  // 初始状态
  outposts: [],
  events: [],
  
  // ============================================
  // 查询操作
  // ============================================
  
  getAllOutposts: (): Outpost[] => {
    return get().outposts;
  },
  
  getOutpost: (outpostId: string): Outpost | undefined => {
    return get().outposts.find(o => o.id === outpostId);
  },
  
  getOutpostByNodeId: (nodeId: string): Outpost | undefined => {
    return get().outposts.find(o => o.nodeId === nodeId);
  },
  
  getOutpostCount: (): number => {
    return get().outposts.length;
  },
  
  getOutpostNodeIds: (): string[] => {
    return get().outposts.map(o => o.nodeId);
  },
  
  // ============================================
  // 建立营地 - Requirements: 9.1, 9.2
  // ============================================
  
  canEstablish: (
    nodeId: string,
    nodeState: string,
    researchedTechs: string[]
  ) => {
    const existingNodeIds = get().getOutpostNodeIds();
    return canEstablishOutpost(nodeId, nodeState, researchedTechs, existingNodeIds);
  },
  
  getEstablishCost: (level: number = 1): ResourceAmount[] => {
    return getOutpostBuildCost(level);
  },
  
  establishOutpost: (
    nodeId: string,
    distance: number
  ): Outpost | null => {
    // 计算初始稳定度
    const stability = calculateSupplyLineStability(distance, 0, 1);
    
    const newOutpost: Outpost = {
      id: generateOutpostId(),
      nodeId,
      level: 1,
      stability,
      modules: [],
      garrison: [],
    };
    
    set((state) => ({
      outposts: [...state.outposts, newOutpost],
    }));
    
    return newOutpost;
  },
  
  // ============================================
  // 升级营地 - Requirements: 9.3
  // ============================================
  
  canUpgrade: (
    outpostId: string,
    researchedTechs: string[]
  ) => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) {
      return { canUpgrade: false, reason: '营地不存在' };
    }
    return canUpgradeOutpost(outpost.level, researchedTechs);
  },
  
  getUpgradeCost: (outpostId: string): ResourceAmount[] => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return [];
    return getOutpostBuildCost(outpost.level + 1);
  },
  
  upgradeOutpost: (outpostId: string): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost || outpost.level >= 3) return false;
    
    set((state) => ({
      outposts: state.outposts.map(o =>
        o.id === outpostId
          ? { ...o, level: o.level + 1 }
          : o
      ),
    }));
    
    return true;
  },
  
  // ============================================
  // 补给线稳定度 - Requirements: 9.4, 9.5
  // ============================================
  
  calculateStability: (outpostId: string, distance: number): number => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return 0;
    
    // 计算中继站数量（来自radio_relay模块）
    const relayModule = outpost.modules.find(m => m.type === 'radio_relay');
    const relayCount = relayModule?.level ?? 0;
    
    // 计算瞭望塔稳定度加成
    const watchtowerModule = outpost.modules.find(m => m.type === 'watchtower');
    const watchtowerBonus = watchtowerModule ? watchtowerModule.level * 5 : 0;
    
    const baseStability = calculateSupplyLineStability(distance, relayCount, outpost.level);
    return Math.min(100, baseStability + watchtowerBonus);
  },
  
  updateStability: (outpostId: string, distance: number): void => {
    const stability = get().calculateStability(outpostId, distance);
    
    set((state) => ({
      outposts: state.outposts.map(o =>
        o.id === outpostId
          ? { ...o, stability }
          : o
      ),
    }));
  },
  
  updateAllStabilities: (nodeDistances: Record<string, number>): void => {
    set((state) => ({
      outposts: state.outposts.map(o => {
        const distance = nodeDistances[o.nodeId] ?? 0;
        const stability = get().calculateStability(o.id, distance);
        return { ...o, stability };
      }),
    }));
  },
  
  isInCrisis: (outpostId: string): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return false;
    return isSupplyLineCritical(outpost.stability);
  },
  
  isInWarning: (outpostId: string): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return false;
    return isSupplyLineWarning(outpost.stability);
  },
  
  processSupplyDisruption: (outpostId: string, day: number): OutpostEvent | null => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return null;
    
    if (isSupplyLineCritical(outpost.stability)) {
      const event: OutpostEvent = {
        type: 'supply_disruption',
        outpostId,
        message: `Supply line to outpost at ${outpost.nodeId} is disrupted! Stability: ${outpost.stability}%`,
        messageZh: `前往 ${outpost.nodeId} 营地的补给线中断！稳定度: ${outpost.stability}%`,
        day,
      };
      
      set((state) => ({
        events: [...state.events, event],
      }));
      
      return event;
    }
    
    return null;
  },
  
  // ============================================
  // 模块管理 - Requirements: 9.6
  // ============================================
  
  canBuildModule: (
    outpostId: string,
    moduleType: OutpostModuleType,
    researchedTechs: string[]
  ) => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) {
      return { canBuild: false, reason: '营地不存在' };
    }
    
    return canBuildModule(
      moduleType,
      outpost.level,
      outpost.modules.length,
      outpost.modules,
      researchedTechs
    );
  },
  
  getModuleCost: (
    outpostId: string,
    moduleType: OutpostModuleType
  ): ResourceAmount[] => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return [];
    
    const existingModule = outpost.modules.find(m => m.type === moduleType);
    const targetLevel = existingModule ? existingModule.level + 1 : 1;
    
    return getModuleBuildCost(moduleType, targetLevel);
  },
  
  buildModule: (
    outpostId: string,
    moduleType: OutpostModuleType
  ): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return false;
    
    // 检查是否已有该模块
    const existingModule = outpost.modules.find(m => m.type === moduleType);
    if (existingModule) {
      // 如果已有，则升级
      return get().upgradeModule(outpostId, moduleType);
    }
    
    // 新建模块
    const newModule: OutpostModule = {
      type: moduleType,
      level: 1,
    };
    
    set((state) => ({
      outposts: state.outposts.map(o =>
        o.id === outpostId
          ? { ...o, modules: [...o.modules, newModule] }
          : o
      ),
    }));
    
    return true;
  },
  
  upgradeModule: (
    outpostId: string,
    moduleType: OutpostModuleType
  ): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return false;
    
    const moduleConfig = getModuleConfig(moduleType);
    const existingModule = outpost.modules.find(m => m.type === moduleType);
    
    if (!existingModule || existingModule.level >= moduleConfig.maxLevel) {
      return false;
    }
    
    set((state) => ({
      outposts: state.outposts.map(o =>
        o.id === outpostId
          ? {
              ...o,
              modules: o.modules.map(m =>
                m.type === moduleType
                  ? { ...m, level: m.level + 1 }
                  : m
              ),
            }
          : o
      ),
    }));
    
    return true;
  },
  
  getModuleEffects: (outpostId: string) => {
    const outpost = get().getOutpost(outpostId);
    const effects = {
      storageBonus: 0,
      stabilityBonus: 0,
      detectionRange: 0,
      repairEfficiency: 0,
      healingRate: 0,
      relayRange: 0,
    };
    
    if (!outpost) return effects;
    
    for (const module of outpost.modules) {
      const config = OUTPOST_MODULE_CONFIGS[module.type];
      
      for (const effect of config.effects) {
        const value = effect.perLevel ? effect.value * module.level : effect.value;
        
        switch (effect.type) {
          case 'storage_bonus':
            effects.storageBonus += value;
            break;
          case 'stability_bonus':
            effects.stabilityBonus += value;
            break;
          case 'detection_range':
            effects.detectionRange += value;
            break;
          case 'repair_efficiency':
            effects.repairEfficiency += value;
            break;
          case 'healing_rate':
            effects.healingRate += value;
            break;
          case 'relay_range':
            effects.relayRange += value;
            break;
        }
      }
    }
    
    return effects;
  },
  
  // ============================================
  // 驻军管理
  // ============================================
  
  assignGarrison: (outpostId: string, workerIds: string[]): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return false;
    
    const levelConfig = getOutpostLevelConfig(outpost.level);
    if (!levelConfig) return false;
    
    const newGarrison = [...new Set([...outpost.garrison, ...workerIds])];
    
    // 检查是否超过上限
    if (newGarrison.length > levelConfig.maxGarrison) {
      return false;
    }
    
    set((state) => ({
      outposts: state.outposts.map(o =>
        o.id === outpostId
          ? { ...o, garrison: newGarrison }
          : o
      ),
    }));
    
    return true;
  },
  
  removeGarrison: (outpostId: string, workerId: string): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return false;
    
    set((state) => ({
      outposts: state.outposts.map(o =>
        o.id === outpostId
          ? { ...o, garrison: o.garrison.filter(id => id !== workerId) }
          : o
      ),
    }));
    
    return true;
  },
  
  getGarrisonCount: (outpostId: string): number => {
    const outpost = get().getOutpost(outpostId);
    return outpost?.garrison.length ?? 0;
  },
  
  getMaxGarrison: (outpostId: string): number => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return 0;
    
    const levelConfig = getOutpostLevelConfig(outpost.level);
    return levelConfig?.maxGarrison ?? 0;
  },
  
  // ============================================
  // 事件管理
  // ============================================
  
  getEvents: (): OutpostEvent[] => {
    return get().events;
  },
  
  clearEvents: (): void => {
    set({ events: [] });
  },
  
  // ============================================
  // 重置
  // ============================================
  
  removeOutpost: (outpostId: string): boolean => {
    const outpost = get().getOutpost(outpostId);
    if (!outpost) return false;
    
    set((state) => ({
      outposts: state.outposts.filter(o => o.id !== outpostId),
    }));
    
    return true;
  },
  
  resetOutposts: (): void => {
    set({
      outposts: [],
      events: [],
    });
  },
}));

// ============================================
// 辅助函数导出
// Helper Function Exports
// ============================================

/**
 * 获取建立营地所需的科技
 */
export function getRequiredTechForOutpost(): string {
  return OUTPOST_REQUIRED_TECH;
}

/**
 * 获取补给线配置
 */
export function getSupplyLineConfig() {
  return SUPPLY_LINE_CONFIG;
}

/**
 * 获取营地等级配置
 */
export function getOutpostLevelConfigs() {
  return OUTPOST_LEVEL_CONFIGS;
}

/**
 * 获取模块配置
 */
export function getOutpostModuleConfigs() {
  return OUTPOST_MODULE_CONFIGS;
}
