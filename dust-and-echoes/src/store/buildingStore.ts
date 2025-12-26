/**
 * 建筑系统状态管理
 * Building System State Management
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { create } from 'zustand';
import type { 
  BuildingId, 
  BuildingInstance, 
  BuildingState, 
  BonfireIntensity,
  ResourceId,
  ResourceAmount,
  JobId
} from '../types';
import { 
  BUILDINGS, 
  getBuildingCost, 
  getBuildingEffects,
  calculateEfficiencyMultiplier,
  calculateWorkshopEfficiency,
  calculateMaxWorkerSlots
} from '../config/buildings';

// Callback for building effect synchronization (set by gameIntegration to avoid circular dependency)
let onBuildingLevelChange: ((buildingId: BuildingId) => void) | null = null;

/**
 * Register a callback to be called when building level changes
 * This is used by gameIntegration to sync building effects
 */
export function registerBuildingLevelChangeCallback(callback: (buildingId: BuildingId) => void): void {
  onBuildingLevelChange = callback;
}

/**
 * Notify that a building level has changed
 */
function notifyBuildingLevelChange(buildingId: BuildingId): void {
  if (onBuildingLevelChange) {
    onBuildingLevelChange(buildingId);
  }
}

// ============================================
// 篝火常量
// Bonfire Constants
// Requirements: 4.1
// ============================================

/** 篝火强度系数 */
export const BONFIRE_INTENSITY_COEFFICIENT: Record<BonfireIntensity, number> = {
  off: 0,
  low: 1,
  medium: 2,
  high: 3,
};

/** 篝火燃料消耗 (Wood/AU) */
export const BONFIRE_FUEL_CONSUMPTION: Record<BonfireIntensity, number> = {
  off: 0,
  low: 0.3,
  medium: 0.8,
  high: 1.6,
};

/** 流浪者招募基础速率 */
export const WANDERER_BASE_RATE = 0.2;

// ============================================
// 仓库存储增量配置
// Warehouse Storage Increments
// Requirements: 4.1
// ============================================

/** 每级仓库增加的存储上限 */
export const WAREHOUSE_STORAGE_INCREMENT: Record<ResourceId, number> = {
  water: 50,
  food: 50,
  scrap: 150,
  wood: 80,
  metal: 40,
  meds: 5,
  microchips: 3,
  // 其他资源默认增量
  dirty_water: 30,
  raw_meat: 20,
  canned_food: 30,
  vegetables: 20,
  seeds: 10,
  fertilizer: 10,
  cloth: 20,
  leather: 20,
  plastic: 20,
  glass: 20,
  rubber: 15,
  wire: 15,
  rope: 15,
  duct_tape: 10,
  gear: 10,
  pipe: 10,
  spring: 10,
  bearing: 10,
  fasteners: 20,
  solvent: 10,
  acid: 5,
  gunpowder: 10,
  fuel: 10,
  battery_cell: 5,
  battery_pack: 3,
  filter: 10,
  seal_ring: 10,
  data_tape: 3,
  radio_parts: 3,
  solar_cell: 2,
  rare_alloy: 2,
  nanofiber: 1,
  power_core: 1,
};

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 创建初始建筑状态
 */
export function createInitialBuildingState(): Record<BuildingId, BuildingInstance> {
  const buildings: Partial<Record<BuildingId, BuildingInstance>> = {};
  
  for (const buildingId of Object.keys(BUILDINGS) as BuildingId[]) {
    buildings[buildingId] = {
      level: 0,
      state: 'idle',
    };
  }
  
  return buildings as Record<BuildingId, BuildingInstance>;
}

/**
 * 检查是否可以建造/升级建筑
 */
export function canBuildOrUpgrade(
  buildingId: BuildingId,
  currentLevel: number,
  resources: Record<ResourceId, number>,
  researchedTechs: string[] = []
): { canBuild: boolean; reason?: string; cost?: ResourceAmount[] } {
  const building = BUILDINGS[buildingId];
  
  if (!building) {
    return { canBuild: false, reason: '建筑不存在' };
  }
  
  // 检查是否已达最大等级
  const targetLevel = currentLevel + 1;
  if (targetLevel > building.maxLevel) {
    return { canBuild: false, reason: '已达最大等级' };
  }
  
  // 检查科技前置
  if (building.unlockTech && !researchedTechs.includes(building.unlockTech)) {
    return { canBuild: false, reason: `需要先研究: ${building.unlockTech}` };
  }
  
  // 获取成本
  const cost = getBuildingCost(buildingId, targetLevel);
  if (!cost) {
    return { canBuild: false, reason: '无法获取建造成本' };
  }
  
  // 检查资源是否足够
  for (const { resourceId, amount } of cost.resources) {
    if ((resources[resourceId] ?? 0) < amount) {
      return { 
        canBuild: false, 
        reason: `资源不足: ${resourceId}`,
        cost: cost.resources 
      };
    }
  }
  
  return { canBuild: true, cost: cost.resources };
}

/**
 * 计算流浪者招募速率
 * λ = 0.2 × 强度系数(1/2/3) × (cap - pop)
 */
export function calculateWandererRate(
  intensity: BonfireIntensity,
  populationCap: number,
  currentPopulation: number
): number {
  if (intensity === 'off') {
    return 0;
  }
  
  const intensityCoeff = BONFIRE_INTENSITY_COEFFICIENT[intensity];
  const availableSlots = Math.max(0, populationCap - currentPopulation);
  
  return WANDERER_BASE_RATE * intensityCoeff * availableSlots;
}

/**
 * 计算篝火燃料消耗
 */
export function calculateBonfireFuelConsumption(
  intensity: BonfireIntensity,
  phaseAU: number
): number {
  return BONFIRE_FUEL_CONSUMPTION[intensity] * phaseAU;
}

// ============================================
// 建筑Store接口
// Building Store Interface
// ============================================

interface BuildingStore {
  // 状态
  buildings: Record<BuildingId, BuildingInstance>;
  bonfireIntensity: BonfireIntensity;
  
  // 建筑查询
  /** 获取建筑等级 */
  getBuildingLevel: (buildingId: BuildingId) => number;
  /** 获取建筑状态 */
  getBuildingState: (buildingId: BuildingId) => BuildingState;
  /** 检查建筑是否已建造 */
  isBuildingBuilt: (buildingId: BuildingId) => boolean;
  /** 获取建筑效率倍率 */
  getBuildingEfficiency: (buildingId: BuildingId) => number;
  /** 获取工坊效率倍率 */
  getWorkshopEfficiency: () => number;
  /** 获取建筑最大工人槽位 */
  getBuildingMaxWorkerSlots: (buildingId: BuildingId) => number;
  
  // 建造/升级
  /** 检查是否可以建造/升级 */
  canBuild: (buildingId: BuildingId, resources: Record<ResourceId, number>, researchedTechs?: string[]) => { canBuild: boolean; reason?: string; cost?: ResourceAmount[] };
  /** 建造或升级建筑（不消耗资源，由调用方处理） */
  buildOrUpgrade: (buildingId: BuildingId) => boolean;
  /** 完整的建造/升级流程（包含资源消耗） */
  buildWithResources: (
    buildingId: BuildingId,
    resources: Record<ResourceId, number>,
    consumeResources: (costs: ResourceAmount[]) => boolean,
    researchedTechs?: string[]
  ) => { success: boolean; reason?: string };
  /** 设置建筑等级（用于加载存档等） */
  setBuildingLevel: (buildingId: BuildingId, level: number) => void;
  /** 设置建筑状态 */
  setBuildingState: (buildingId: BuildingId, state: BuildingState) => void;
  
  // 篝火特殊逻辑
  /** 设置篝火强度 */
  setBonfireIntensity: (intensity: BonfireIntensity) => void;
  /** 获取篝火强度 */
  getBonfireIntensity: () => BonfireIntensity;
  /** 计算流浪者招募速率 */
  getWandererRate: (populationCap: number, currentPopulation: number) => number;
  /** 计算篝火燃料消耗 */
  getBonfireFuelConsumption: (phaseAU: number) => number;
  
  // 建筑效果
  /** 获取人口上限加成 */
  getPopulationCapBonus: () => number;
  /** 获取仓库存储上限加成 */
  getStorageCapBonus: () => Record<ResourceId, number>;
  /** 获取已解锁的岗位 */
  getUnlockedJobs: () => JobId[];
  /** 获取已解锁的区域 */
  getUnlockedRegions: () => string[];
  /** 获取已解锁的配方类别 */
  getUnlockedRecipeCategories: () => string[];
  
  // 重置
  /** 重置建筑状态 */
  resetBuildings: () => void;
}

/**
 * 建筑状态Store
 */
export const useBuildingStore = create<BuildingStore>((set, get) => ({
  // 初始状态
  buildings: createInitialBuildingState(),
  bonfireIntensity: 'off',
  
  // ============================================
  // 建筑查询
  // ============================================
  
  getBuildingLevel: (buildingId: BuildingId): number => {
    return get().buildings[buildingId]?.level ?? 0;
  },
  
  getBuildingState: (buildingId: BuildingId): BuildingState => {
    return get().buildings[buildingId]?.state ?? 'idle';
  },
  
  isBuildingBuilt: (buildingId: BuildingId): boolean => {
    return get().getBuildingLevel(buildingId) > 0;
  },
  
  getBuildingEfficiency: (buildingId: BuildingId): number => {
    const level = get().getBuildingLevel(buildingId);
    if (level === 0) return 0;
    return calculateEfficiencyMultiplier(level);
  },
  
  getWorkshopEfficiency: (): number => {
    const level = get().getBuildingLevel('workshop');
    if (level === 0) return 0;
    return calculateWorkshopEfficiency(level);
  },
  
  getBuildingMaxWorkerSlots: (buildingId: BuildingId): number => {
    const level = get().getBuildingLevel(buildingId);
    if (level === 0) return 0;
    return calculateMaxWorkerSlots(buildingId, level);
  },
  
  // ============================================
  // 建造/升级
  // ============================================
  
  canBuild: (
    buildingId: BuildingId, 
    resources: Record<ResourceId, number>,
    researchedTechs: string[] = []
  ) => {
    const currentLevel = get().getBuildingLevel(buildingId);
    return canBuildOrUpgrade(buildingId, currentLevel, resources, researchedTechs);
  },
  
  buildOrUpgrade: (buildingId: BuildingId): boolean => {
    const state = get();
    const currentLevel = state.buildings[buildingId]?.level ?? 0;
    const building = BUILDINGS[buildingId];
    
    if (!building) return false;
    
    const targetLevel = currentLevel + 1;
    if (targetLevel > building.maxLevel) return false;
    
    set((state) => ({
      buildings: {
        ...state.buildings,
        [buildingId]: {
          level: targetLevel,
          state: 'active' as BuildingState,
        },
      },
    }));
    
    // 同步建筑效果到所有依赖系统 (Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7)
    notifyBuildingLevelChange(buildingId);
    
    return true;
  },
  
  /**
   * 完整的建造/升级流程（包含资源消耗）
   * 需要传入资源消耗回调函数
   */
  buildWithResources: (
    buildingId: BuildingId,
    resources: Record<ResourceId, number>,
    consumeResources: (costs: ResourceAmount[]) => boolean,
    researchedTechs: string[] = []
  ): { success: boolean; reason?: string } => {
    const state = get();
    
    // 检查是否可以建造
    const checkResult = state.canBuild(buildingId, resources, researchedTechs);
    if (!checkResult.canBuild) {
      return { success: false, reason: checkResult.reason ?? '未知错误' };
    }
    
    // 消耗资源
    if (checkResult.cost && !consumeResources(checkResult.cost)) {
      return { success: false, reason: '资源消耗失败' };
    }
    
    // 升级建筑
    const upgraded = state.buildOrUpgrade(buildingId);
    if (!upgraded) {
      return { success: false, reason: '建筑升级失败' };
    }
    
    return { success: true };
  },
  
  setBuildingLevel: (buildingId: BuildingId, level: number): void => {
    const building = BUILDINGS[buildingId];
    if (!building) return;
    
    const clampedLevel = Math.max(0, Math.min(level, building.maxLevel));
    
    set((state) => ({
      buildings: {
        ...state.buildings,
        [buildingId]: {
          ...state.buildings[buildingId],
          level: clampedLevel,
          state: clampedLevel > 0 ? 'active' : 'idle',
        },
      },
    }));
    
    // 同步建筑效果到所有依赖系统 (Requirements: 1.1, 6.1)
    notifyBuildingLevelChange(buildingId);
  },
  
  setBuildingState: (buildingId: BuildingId, buildingState: BuildingState): void => {
    set((state) => ({
      buildings: {
        ...state.buildings,
        [buildingId]: {
          ...state.buildings[buildingId],
          state: buildingState,
        },
      },
    }));
  },
  
  // ============================================
  // 篝火特殊逻辑
  // ============================================
  
  setBonfireIntensity: (intensity: BonfireIntensity): void => {
    // 只有篝火已建造才能设置强度
    const bonfireLevel = get().getBuildingLevel('bonfire');
    if (bonfireLevel === 0 && intensity !== 'off') {
      return;
    }
    
    set({ bonfireIntensity: intensity });
  },
  
  getBonfireIntensity: (): BonfireIntensity => {
    return get().bonfireIntensity;
  },
  
  getWandererRate: (populationCap: number, currentPopulation: number): number => {
    const state = get();
    
    // 篝火必须已建造
    if (!state.isBuildingBuilt('bonfire')) {
      return 0;
    }
    
    return calculateWandererRate(state.bonfireIntensity, populationCap, currentPopulation);
  },
  
  getBonfireFuelConsumption: (phaseAU: number): number => {
    const state = get();
    
    // 篝火必须已建造
    if (!state.isBuildingBuilt('bonfire')) {
      return 0;
    }
    
    return calculateBonfireFuelConsumption(state.bonfireIntensity, phaseAU);
  },
  
  // ============================================
  // 建筑效果
  // ============================================
  
  getPopulationCapBonus: (): number => {
    const state = get();
    let bonus = 0;
    
    // Shelter: 每级+2人口上限
    const shelterLevel = state.getBuildingLevel('shelter');
    bonus += shelterLevel * 2;
    
    return bonus;
  },
  
  getStorageCapBonus: (): Record<ResourceId, number> => {
    const state = get();
    const bonus: Partial<Record<ResourceId, number>> = {};
    
    // 初始化所有资源为0
    for (const resourceId of Object.keys(WAREHOUSE_STORAGE_INCREMENT) as ResourceId[]) {
      bonus[resourceId] = 0;
    }
    
    // Warehouse: 每级增加存储上限
    const warehouseLevel = state.getBuildingLevel('warehouse');
    if (warehouseLevel > 0) {
      for (const [resourceId, increment] of Object.entries(WAREHOUSE_STORAGE_INCREMENT)) {
        bonus[resourceId as ResourceId] = increment * warehouseLevel;
      }
    }
    
    return bonus as Record<ResourceId, number>;
  },
  
  getUnlockedJobs: (): JobId[] => {
    const state = get();
    const unlockedJobs: JobId[] = [];
    
    // 检查每个建筑的解锁效果
    for (const buildingId of Object.keys(BUILDINGS) as BuildingId[]) {
      const level = state.getBuildingLevel(buildingId);
      if (level === 0) continue;
      
      const effects = getBuildingEffects(buildingId, level);
      for (const effect of effects) {
        if (effect.type === 'unlock_job' && typeof effect.value === 'string') {
          // 特殊处理 recruitment（不是真正的岗位）
          if (effect.value !== 'recruitment' && !unlockedJobs.includes(effect.value as JobId)) {
            unlockedJobs.push(effect.value as JobId);
          }
        }
      }
    }
    
    return unlockedJobs;
  },
  
  getUnlockedRegions: (): string[] => {
    const state = get();
    const unlockedRegions: string[] = [];
    
    for (const buildingId of Object.keys(BUILDINGS) as BuildingId[]) {
      const level = state.getBuildingLevel(buildingId);
      if (level === 0) continue;
      
      const effects = getBuildingEffects(buildingId, level);
      for (const effect of effects) {
        if (effect.type === 'unlock_region' && typeof effect.value === 'string') {
          if (!unlockedRegions.includes(effect.value)) {
            unlockedRegions.push(effect.value);
          }
        }
      }
    }
    
    return unlockedRegions;
  },
  
  getUnlockedRecipeCategories: (): string[] => {
    const state = get();
    const unlockedCategories: string[] = [];
    
    for (const buildingId of Object.keys(BUILDINGS) as BuildingId[]) {
      const level = state.getBuildingLevel(buildingId);
      if (level === 0) continue;
      
      const effects = getBuildingEffects(buildingId, level);
      for (const effect of effects) {
        if (effect.type === 'unlock_recipe' && typeof effect.value === 'string') {
          if (!unlockedCategories.includes(effect.value)) {
            unlockedCategories.push(effect.value);
          }
        }
      }
    }
    
    return unlockedCategories;
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetBuildings: (): void => {
    set({
      buildings: createInitialBuildingState(),
      bonfireIntensity: 'off',
    });
  },
}));
