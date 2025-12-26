/**
 * 资源管理系统状态管理
 * Resource Management System State Management
 * 
 * Requirements: 2.7, 2.8, 2.9, 2.10
 */

import { create } from 'zustand';
import type { ResourceId, Phase } from '../types';
import { isPerishable, getAllResourceIds } from '../config/resources';
import { useGameStateStore } from './gameStateStore';

// ============================================
// 默认存储上限配置
// Default Storage Caps Configuration
// ============================================

/** 基础存储上限 (仓库L0) */
export const DEFAULT_RESOURCE_CAPS: Partial<Record<ResourceId, number>> = {
  // 一级资源
  scrap: 100,
  water: 50,
  dirty_water: 30,
  food: 50,
  raw_meat: 20,
  canned_food: 30,
  vegetables: 20,
  seeds: 10,
  fertilizer: 10,
  // 二级材料
  wood: 50,
  metal: 30,
  cloth: 20,
  leather: 20,
  plastic: 20,
  glass: 20,
  rubber: 15,
  wire: 15,
  rope: 15,
  duct_tape: 10,
  // 组件
  gear: 10,
  pipe: 10,
  spring: 10,
  bearing: 10,
  fasteners: 20,
  // 化工
  solvent: 10,
  acid: 5,
  gunpowder: 10,
  fuel: 10,
  // 能源组件
  battery_cell: 5,
  battery_pack: 3,
  filter: 10,
  seal_ring: 10,
  // 稀有资源
  meds: 5,
  data_tape: 3,
  radio_parts: 3,
  solar_cell: 2,
  rare_alloy: 2,
  microchips: 2,
  nanofiber: 1,
  power_core: 1,
};

// ============================================
// 消耗常量
// Consumption Constants
// ============================================

/** 每人每AU水消耗 */
export const WATER_CONSUMPTION_PER_POP_PER_AU = 1.0;

/** 每人每AU食物消耗 */
export const FOOD_CONSUMPTION_PER_POP_PER_AU = 1.2;

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 创建初始资源状态（所有资源为0）
 */
export function createInitialResources(): Record<ResourceId, number> {
  const resources: Partial<Record<ResourceId, number>> = {};
  for (const id of getAllResourceIds()) {
    resources[id] = 0;
  }
  return resources as Record<ResourceId, number>;
}

/**
 * 创建初始资源上限状态
 */
export function createInitialResourceCaps(): Record<ResourceId, number> {
  const caps: Partial<Record<ResourceId, number>> = {};
  for (const id of getAllResourceIds()) {
    caps[id] = DEFAULT_RESOURCE_CAPS[id] ?? 0;
  }
  return caps as Record<ResourceId, number>;
}

/**
 * 计算阶段消耗
 * @param population 人口数量
 * @param phaseAU 阶段AU值
 * @param consumptionMultiplier 消耗倍率（来自难度设置）
 * @returns 水和食物消耗量
 */
export function calculatePhaseConsumption(
  population: number,
  phaseAU: number,
  consumptionMultiplier: number = 1.0
): { water: number; food: number } {
  return {
    water: population * WATER_CONSUMPTION_PER_POP_PER_AU * phaseAU * consumptionMultiplier,
    food: population * FOOD_CONSUMPTION_PER_POP_PER_AU * phaseAU * consumptionMultiplier,
  };
}

/**
 * 获取所有易腐资源ID
 */
export function getPerishableResourceIds(): ResourceId[] {
  return getAllResourceIds().filter(id => isPerishable(id));
}

// ============================================
// 危机事件类型
// Crisis Event Types
// ============================================

export type CrisisType = 'water_shortage' | 'food_shortage';

export interface CrisisEvent {
  type: CrisisType;
  day: number;
  phase: Phase;
  severity: 'warning' | 'critical';
  message: string;
}

// ============================================
// 资源Store接口
// Resource Store Interface
// ============================================

interface ResourceStore {
  // 状态
  resources: Record<ResourceId, number>;
  resourceCaps: Record<ResourceId, number>;
  crisisEvents: CrisisEvent[];
  
  // 资源操作
  /** 添加资源（受上限限制） */
  addResource: (id: ResourceId, amount: number) => number;
  /** 消耗资源 */
  consumeResource: (id: ResourceId, amount: number) => boolean;
  /** 设置资源数量 */
  setResource: (id: ResourceId, amount: number) => void;
  /** 获取资源数量 */
  getResource: (id: ResourceId) => number;
  /** 检查是否有足够资源 */
  hasEnoughResource: (id: ResourceId, amount: number) => boolean;
  
  // 上限操作
  /** 设置资源上限 */
  setResourceCap: (id: ResourceId, cap: number) => void;
  /** 获取资源上限 */
  getResourceCap: (id: ResourceId) => number;
  
  // 阶段结算
  /** 处理阶段结束时的消耗 */
  processPhaseConsumption: (population: number, phaseAU: number, day: number, phase: Phase) => {
    waterConsumed: number;
    foodConsumed: number;
    waterShortage: number;
    foodShortage: number;
  };
  
  // 易腐物品处理
  /** 处理午夜阶段的易腐物品 */
  processPerishables: () => ResourceId[];
  
  // 危机事件
  /** 获取危机事件 */
  getCrisisEvents: () => CrisisEvent[];
  /** 清除危机事件 */
  clearCrisisEvents: () => void;
  
  // 重置
  /** 重置资源状态 */
  resetResources: () => void;
}

/**
 * 资源状态Store
 */
export const useResourceStore = create<ResourceStore>((set, get) => ({
  // 初始状态
  resources: createInitialResources(),
  resourceCaps: createInitialResourceCaps(),
  crisisEvents: [],
  
  // 添加资源（受上限限制）
  addResource: (id: ResourceId, amount: number): number => {
    if (amount <= 0) return 0;
    
    const state = get();
    const currentAmount = state.resources[id];
    const cap = state.resourceCaps[id];
    
    // 计算实际可添加的数量（受上限限制）
    const spaceAvailable = Math.max(0, cap - currentAmount);
    const actualAdded = Math.min(amount, spaceAvailable);
    
    if (actualAdded > 0) {
      set((state) => ({
        resources: {
          ...state.resources,
          [id]: state.resources[id] + actualAdded,
        },
      }));
    }
    
    return actualAdded;
  },
  
  // 消耗资源
  consumeResource: (id: ResourceId, amount: number): boolean => {
    if (amount <= 0) return true;
    
    const state = get();
    const currentAmount = state.resources[id];
    
    if (currentAmount < amount) {
      return false;
    }
    
    set((state) => ({
      resources: {
        ...state.resources,
        [id]: state.resources[id] - amount,
      },
    }));
    
    return true;
  },
  
  // 设置资源数量
  setResource: (id: ResourceId, amount: number): void => {
    const cap = get().resourceCaps[id];
    const clampedAmount = Math.max(0, Math.min(amount, cap));
    
    set((state) => ({
      resources: {
        ...state.resources,
        [id]: clampedAmount,
      },
    }));
  },
  
  // 获取资源数量
  getResource: (id: ResourceId): number => {
    return get().resources[id];
  },
  
  // 检查是否有足够资源
  hasEnoughResource: (id: ResourceId, amount: number): boolean => {
    return get().resources[id] >= amount;
  },
  
  // 设置资源上限
  setResourceCap: (id: ResourceId, cap: number): void => {
    set((state) => ({
      resourceCaps: {
        ...state.resourceCaps,
        [id]: Math.max(0, cap),
      },
    }));
  },
  
  // 获取资源上限
  getResourceCap: (id: ResourceId): number => {
    return get().resourceCaps[id];
  },
  
  // 处理阶段结束时的消耗
  processPhaseConsumption: (
    population: number,
    phaseAU: number,
    day: number,
    phase: Phase
  ) => {
    // 获取难度消耗倍率
    const { consumptionMultiplier } = useGameStateStore.getState().getDifficultyModifiers();
    
    const { water: waterNeeded, food: foodNeeded } = calculatePhaseConsumption(
      population,
      phaseAU,
      consumptionMultiplier
    );
    
    const state = get();
    const currentWater = state.resources.water;
    const currentFood = state.resources.food;
    
    // 计算实际消耗和短缺
    const waterConsumed = Math.min(currentWater, waterNeeded);
    const foodConsumed = Math.min(currentFood, foodNeeded);
    const waterShortage = Math.max(0, waterNeeded - currentWater);
    const foodShortage = Math.max(0, foodNeeded - currentFood);
    
    // 更新资源
    const newWater = currentWater - waterConsumed;
    const newFood = currentFood - foodConsumed;
    
    // 收集危机事件
    const newCrisisEvents: CrisisEvent[] = [];
    
    // 检查水危机
    if (newWater <= 0 && waterShortage > 0) {
      newCrisisEvents.push({
        type: 'water_shortage',
        day,
        phase,
        severity: 'critical',
        message: `水资源耗尽！短缺 ${waterShortage.toFixed(1)} 单位`,
      });
    } else if (newWater <= 0) {
      newCrisisEvents.push({
        type: 'water_shortage',
        day,
        phase,
        severity: 'warning',
        message: '水资源即将耗尽！',
      });
    }
    
    // 检查食物危机
    if (newFood <= 0 && foodShortage > 0) {
      newCrisisEvents.push({
        type: 'food_shortage',
        day,
        phase,
        severity: 'critical',
        message: `食物耗尽！短缺 ${foodShortage.toFixed(1)} 单位`,
      });
    } else if (newFood <= 0) {
      newCrisisEvents.push({
        type: 'food_shortage',
        day,
        phase,
        severity: 'warning',
        message: '食物即将耗尽！',
      });
    }
    
    set((state) => ({
      resources: {
        ...state.resources,
        water: newWater,
        food: newFood,
      },
      crisisEvents: [...state.crisisEvents, ...newCrisisEvents],
    }));
    
    return {
      waterConsumed,
      foodConsumed,
      waterShortage,
      foodShortage,
    };
  },
  
  // 处理午夜阶段的易腐物品
  processPerishables: (): ResourceId[] => {
    const perishableIds = getPerishableResourceIds();
    const spoiledResources: ResourceId[] = [];
    
    set((state) => {
      const newResources = { ...state.resources };
      
      for (const id of perishableIds) {
        if (newResources[id] > 0) {
          spoiledResources.push(id);
          newResources[id] = 0;
        }
      }
      
      return { resources: newResources };
    });
    
    return spoiledResources;
  },
  
  // 获取危机事件
  getCrisisEvents: (): CrisisEvent[] => {
    return get().crisisEvents;
  },
  
  // 清除危机事件
  clearCrisisEvents: (): void => {
    set({ crisisEvents: [] });
  },
  
  // 重置资源状态
  resetResources: (): void => {
    set({
      resources: createInitialResources(),
      resourceCaps: createInitialResourceCaps(),
      crisisEvents: [],
    });
  },
}));
