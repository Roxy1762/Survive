/**
 * 人口与岗位系统状态管理
 * Population & Job System State Management
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 13.1, 13.2
 */

import { create } from 'zustand';
import type { 
  Worker, 
  JobId, 
  StatusEffect, 
  StatusEffectType, 
  StatusSeverity,
  BuildingId,
  ResourceId 
} from '../types';
import { calculateMaxWorkerSlots, calculateEfficiencyMultiplier } from '../config/buildings';

// ============================================
// 常量定义
// Constants
// ============================================

/** 每人每AU基础产出价值 (VU) */
export const BASE_PRODUCTION_VU_PER_AU = 15;

/** 每人每AU消耗价值 (VU) - 水5 + 食物5 = 10 */
export const BASE_CONSUMPTION_VU_PER_AU = 10;

/** 每人每AU净盈余 (VU) */
export const NET_SURPLUS_VU_PER_AU = BASE_PRODUCTION_VU_PER_AU - BASE_CONSUMPTION_VU_PER_AU; // 5

/** 岗位基础产出配置 */
export const JOB_PRODUCTION: Record<JobId, { resourceId: ResourceId | 'work'; amount: number; vuPerUnit: number }> = {
  scavenger: { resourceId: 'scrap', amount: 15, vuPerUnit: 1 },      // 15 Scrap/AU = 15 VU/AU
  water_collector: { resourceId: 'water', amount: 3, vuPerUnit: 5 }, // 3 Water/AU = 15 VU/AU
  hunter: { resourceId: 'food', amount: 3.6, vuPerUnit: 4.167 },     // 3.6 Food/AU ≈ 15 VU/AU
  engineer: { resourceId: 'work', amount: 60, vuPerUnit: 0.25 },     // 60 Work/AU = 15 VU/AU
  guard: { resourceId: 'work', amount: 0, vuPerUnit: 0 },            // 守卫不产出资源
  scout: { resourceId: 'work', amount: 0, vuPerUnit: 0 },            // 斥候不产出资源
  researcher: { resourceId: 'work', amount: 30, vuPerUnit: 0.5 },    // 30 RP/AU = 15 VU/AU (假设1 RP = 0.5 VU)
};

/** 状态效果每AU健康变化 */
export const STATUS_HEALTH_CHANGE: Record<StatusEffectType, number> = {
  bleed: -5,      // 流血: 每AU -5 Health
  infection: -3,  // 感染: 每AU -3 Health
  poisoned: -2,   // 中毒: 每AU -2 Health
  radiation: -1,  // 辐射: 每AU -1 Health
};

/** 低健康效率惩罚阈值 */
export const LOW_HEALTH_THRESHOLD = 50;

/** 低健康效率惩罚 */
export const LOW_HEALTH_EFFICIENCY_PENALTY = 0.3; // 30%

/** 无法工作的健康阈值 */
export const CANNOT_WORK_HEALTH_THRESHOLD = 20;

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 生成唯一工人ID
 */
export function generateWorkerId(): string {
  return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建新工人
 */
export function createWorker(name: string): Worker {
  return {
    id: generateWorkerId(),
    name,
    health: 100,
    job: null,
    statuses: [],
    equipment: {},
  };
}

/**
 * 检查工人是否可以工作
 * Requirements: 13.1 - Health < 20 无法工作
 * Requirements: 3.7 - 流血状态无法分配工作
 */
export function canWorkerWork(worker: Worker): boolean {
  // 健康值过低无法工作
  if (worker.health < CANNOT_WORK_HEALTH_THRESHOLD) {
    return false;
  }
  // 流血状态无法工作
  if (worker.statuses.some(s => s.type === 'bleed')) {
    return false;
  }
  return true;
}

/**
 * 计算工人效率
 * Requirements: 3.6 - Health < 50 效率降低30%
 */
export function calculateWorkerEfficiency(worker: Worker): number {
  if (!canWorkerWork(worker)) {
    return 0;
  }
  if (worker.health < LOW_HEALTH_THRESHOLD) {
    return 1 - LOW_HEALTH_EFFICIENCY_PENALTY; // 0.7
  }
  return 1;
}

/**
 * 计算建筑效率倍率
 * Requirements: 3.4 - efficiency = 1 + 0.10 × (Level - 1)
 */
export function getBuildingEfficiencyMultiplier(level: number): number {
  return calculateEfficiencyMultiplier(level);
}

/**
 * 计算最大岗位槽位
 * Requirements: 3.2 - Water/Food max = 2 + 2L, Scrap max = 3 + 3L
 */
export function getMaxJobSlots(jobId: JobId, buildingLevel: number): number {
  const buildingMap: Partial<Record<JobId, BuildingId>> = {
    water_collector: 'water_collector',
    hunter: 'trap',
    scavenger: 'scavenge_post',
  };
  
  const buildingId = buildingMap[jobId];
  if (!buildingId) {
    // 其他岗位没有槽位限制（或由其他建筑决定）
    return Infinity;
  }
  
  return calculateMaxWorkerSlots(buildingId, buildingLevel);
}

/**
 * 计算维持生存所需最少工人数
 * Requirements: 3.3
 * Water_min = ceil(population / (3 × efficiency_multiplier))
 * Food_min = ceil(population / (3 × efficiency_multiplier))
 */
export function calculateMinimumWorkers(
  population: number,
  efficiencyMultiplier: number
): { waterWorkers: number; foodWorkers: number; total: number } {
  const waterWorkers = Math.ceil(population / (3 * efficiencyMultiplier));
  const foodWorkers = Math.ceil(population / (3 * efficiencyMultiplier));
  return {
    waterWorkers,
    foodWorkers,
    total: waterWorkers + foodWorkers,
  };
}

/**
 * 计算岗位产出
 * Requirements: 3.1, 3.4
 */
export function calculateJobProduction(
  jobId: JobId,
  workerCount: number,
  buildingLevel: number,
  phaseAU: number,
  workerEfficiencies: number[] = []
): { resourceId: ResourceId | 'work'; amount: number; vuValue: number } {
  const jobConfig = JOB_PRODUCTION[jobId];
  if (!jobConfig || jobConfig.amount === 0) {
    return { resourceId: jobConfig?.resourceId || 'work', amount: 0, vuValue: 0 };
  }
  
  // 建筑效率倍率
  const buildingEfficiency = getBuildingEfficiencyMultiplier(buildingLevel);
  
  // 计算总工人效率（如果提供了个人效率，使用它们；否则假设都是1）
  let totalWorkerEfficiency = workerCount;
  if (workerEfficiencies.length > 0) {
    totalWorkerEfficiency = workerEfficiencies.reduce((sum, eff) => sum + eff, 0);
  }
  
  // 产出 = 基础产出 × 工人效率总和 × 建筑效率 × 阶段AU
  const amount = jobConfig.amount * totalWorkerEfficiency * buildingEfficiency * phaseAU;
  const vuValue = amount * jobConfig.vuPerUnit;
  
  return {
    resourceId: jobConfig.resourceId,
    amount,
    vuValue,
  };
}

/**
 * 计算净盈余
 * Requirements: 3.5
 * 净盈余 = 产出(15 VU/AU) - 消耗(10 VU/AU) = 5 VU/AU
 */
export function calculateNetSurplus(
  effectiveWorkers: number,
  phaseAU: number
): number {
  return effectiveWorkers * NET_SURPLUS_VU_PER_AU * phaseAU;
}

// ============================================
// 人口Store接口
// Population Store Interface
// ============================================

interface PopulationStore {
  // 状态
  workers: Worker[];
  populationCap: number;
  morale: number; // -5 to +5
  jobs: Record<JobId, string[]>; // jobId -> worker ids
  buildingLevels: Partial<Record<BuildingId, number>>; // 建筑等级缓存
  
  // 工人管理
  /** 添加工人 */
  addWorker: (name: string) => Worker | null;
  /** 移除工人 */
  removeWorker: (workerId: string) => boolean;
  /** 获取工人 */
  getWorker: (workerId: string) => Worker | undefined;
  /** 获取所有工人 */
  getAllWorkers: () => Worker[];
  /** 获取可工作的工人 */
  getAvailableWorkers: () => Worker[];
  
  // 健康管理
  /** 设置工人健康值 */
  setWorkerHealth: (workerId: string, health: number) => void;
  /** 修改工人健康值 */
  modifyWorkerHealth: (workerId: string, delta: number) => void;
  /** 添加状态效果 */
  addStatusEffect: (workerId: string, effect: StatusEffect) => void;
  /** 移除状态效果 */
  removeStatusEffect: (workerId: string, effectType: StatusEffectType) => void;
  /** 处理状态效果（每AU结算） */
  processStatusEffects: (phaseAU: number) => { workerId: string; healthChange: number; died: boolean }[];
  
  // 岗位管理
  /** 分配岗位 */
  assignJob: (workerId: string, jobId: JobId | null) => boolean;
  /** 获取岗位工人 */
  getJobWorkers: (jobId: JobId) => Worker[];
  /** 获取岗位工人数量 */
  getJobWorkerCount: (jobId: JobId) => number;
  /** 检查岗位是否已满 */
  isJobFull: (jobId: JobId) => boolean;
  /** 获取岗位最大槽位 */
  getJobMaxSlots: (jobId: JobId) => number;
  
  // 生产计算
  /** 计算岗位产出 */
  calculateProduction: (jobId: JobId, phaseAU: number) => { resourceId: ResourceId | 'work'; amount: number; vuValue: number };
  /** 计算所有岗位产出 */
  calculateAllProduction: (phaseAU: number) => Map<ResourceId | 'work', number>;
  
  // 最低工人计算
  /** 计算维持生存所需最少工人 */
  getMinimumWorkers: () => { waterWorkers: number; foodWorkers: number; total: number };
  
  // 净盈余计算
  /** 计算净盈余 */
  getNetSurplus: (phaseAU: number) => number;
  
  // 建筑等级
  /** 设置建筑等级 */
  setBuildingLevel: (buildingId: BuildingId, level: number) => void;
  /** 获取建筑等级 */
  getBuildingLevel: (buildingId: BuildingId) => number;
  
  // 人口上限
  /** 设置人口上限 */
  setPopulationCap: (cap: number) => void;
  
  // 士气
  /** 设置士气 */
  setMorale: (morale: number) => void;
  /** 修改士气 */
  modifyMorale: (delta: number) => void;
  
  // 重置
  /** 重置人口状态 */
  resetPopulation: () => void;
}


/**
 * 人口状态Store
 */
export const usePopulationStore = create<PopulationStore>((set, get) => ({
  // 初始状态
  workers: [],
  populationCap: 2, // 初始人口上限
  morale: 0,
  jobs: {
    scavenger: [],
    water_collector: [],
    hunter: [],
    engineer: [],
    guard: [],
    scout: [],
    researcher: [],
  },
  buildingLevels: {},
  
  // ============================================
  // 工人管理
  // ============================================
  
  addWorker: (name: string): Worker | null => {
    const state = get();
    if (state.workers.length >= state.populationCap) {
      return null; // 人口已满
    }
    
    const worker = createWorker(name);
    set((state) => ({
      workers: [...state.workers, worker],
    }));
    return worker;
  },
  
  removeWorker: (workerId: string): boolean => {
    const state = get();
    const worker = state.workers.find(w => w.id === workerId);
    if (!worker) {
      return false;
    }
    
    // 从岗位中移除
    const newJobs = { ...state.jobs };
    for (const jobId of Object.keys(newJobs) as JobId[]) {
      newJobs[jobId] = newJobs[jobId].filter(id => id !== workerId);
    }
    
    set((state) => ({
      workers: state.workers.filter(w => w.id !== workerId),
      jobs: newJobs,
    }));
    return true;
  },
  
  getWorker: (workerId: string): Worker | undefined => {
    return get().workers.find(w => w.id === workerId);
  },
  
  getAllWorkers: (): Worker[] => {
    return get().workers;
  },
  
  getAvailableWorkers: (): Worker[] => {
    return get().workers.filter(w => canWorkerWork(w) && w.job === null);
  },
  
  // ============================================
  // 健康管理
  // ============================================
  
  setWorkerHealth: (workerId: string, health: number): void => {
    set((state) => ({
      workers: state.workers.map(w => 
        w.id === workerId 
          ? { ...w, health: Math.max(0, Math.min(100, health)) }
          : w
      ),
    }));
  },
  
  modifyWorkerHealth: (workerId: string, delta: number): void => {
    set((state) => ({
      workers: state.workers.map(w => 
        w.id === workerId 
          ? { ...w, health: Math.max(0, Math.min(100, w.health + delta)) }
          : w
      ),
    }));
  },
  
  addStatusEffect: (workerId: string, effect: StatusEffect): void => {
    set((state) => ({
      workers: state.workers.map(w => {
        if (w.id !== workerId) return w;
        
        // 检查是否已有相同类型的效果
        const existingIndex = w.statuses.findIndex(s => s.type === effect.type);
        if (existingIndex >= 0) {
          // 替换为更严重的效果
          const existing = w.statuses[existingIndex];
          if (existing) {
            const severityOrder: StatusSeverity[] = ['light', 'medium', 'severe'];
            if (severityOrder.indexOf(effect.severity) > severityOrder.indexOf(existing.severity)) {
              const newStatuses = [...w.statuses];
              newStatuses[existingIndex] = effect;
              return { ...w, statuses: newStatuses };
            }
          }
          return w;
        }
        
        return { ...w, statuses: [...w.statuses, effect] };
      }),
    }));
  },
  
  removeStatusEffect: (workerId: string, effectType: StatusEffectType): void => {
    set((state) => ({
      workers: state.workers.map(w => 
        w.id === workerId 
          ? { ...w, statuses: w.statuses.filter(s => s.type !== effectType) }
          : w
      ),
    }));
  },
  
  processStatusEffects: (phaseAU: number): { workerId: string; healthChange: number; died: boolean }[] => {
    const results: { workerId: string; healthChange: number; died: boolean }[] = [];
    
    set((state) => {
      const newWorkers = state.workers.map(worker => {
        let totalHealthChange = 0;
        
        for (const status of worker.statuses) {
          const healthPerAU = STATUS_HEALTH_CHANGE[status.type];
          totalHealthChange += healthPerAU * phaseAU;
        }
        
        const newHealth = Math.max(0, Math.min(100, worker.health + totalHealthChange));
        const died = newHealth === 0 && worker.health > 0;
        
        results.push({
          workerId: worker.id,
          healthChange: totalHealthChange,
          died,
        });
        
        return { ...worker, health: newHealth };
      });
      
      return { workers: newWorkers };
    });
    
    return results.filter(r => r.healthChange !== 0 || r.died);
  },
  
  // ============================================
  // 岗位管理
  // ============================================
  
  assignJob: (workerId: string, jobId: JobId | null): boolean => {
    const state = get();
    const worker = state.workers.find(w => w.id === workerId);
    
    if (!worker) {
      return false;
    }
    
    // 检查工人是否可以工作
    if (jobId !== null && !canWorkerWork(worker)) {
      return false;
    }
    
    // 检查岗位是否已满
    if (jobId !== null && state.isJobFull(jobId)) {
      return false;
    }
    
    // 从当前岗位移除
    const newJobs = { ...state.jobs };
    for (const jId of Object.keys(newJobs) as JobId[]) {
      newJobs[jId] = newJobs[jId].filter(id => id !== workerId);
    }
    
    // 添加到新岗位
    if (jobId !== null) {
      newJobs[jobId] = [...newJobs[jobId], workerId];
    }
    
    set((state) => ({
      workers: state.workers.map(w => 
        w.id === workerId ? { ...w, job: jobId } : w
      ),
      jobs: newJobs,
    }));
    
    return true;
  },
  
  getJobWorkers: (jobId: JobId): Worker[] => {
    const state = get();
    return state.jobs[jobId]
      .map(id => state.workers.find(w => w.id === id))
      .filter((w): w is Worker => w !== undefined);
  },
  
  getJobWorkerCount: (jobId: JobId): number => {
    return get().jobs[jobId].length;
  },
  
  isJobFull: (jobId: JobId): boolean => {
    const state = get();
    const currentCount = state.jobs[jobId].length;
    const maxSlots = state.getJobMaxSlots(jobId);
    return currentCount >= maxSlots;
  },
  
  getJobMaxSlots: (jobId: JobId): number => {
    const state = get();
    const buildingMap: Partial<Record<JobId, BuildingId>> = {
      water_collector: 'water_collector',
      hunter: 'trap',
      scavenger: 'scavenge_post',
    };
    
    const buildingId = buildingMap[jobId];
    if (!buildingId) {
      return Infinity; // 无限制
    }
    
    const level = state.buildingLevels[buildingId] ?? 0;
    if (level === 0) {
      return 0; // 建筑未建造
    }
    
    return getMaxJobSlots(jobId, level);
  },
  
  // ============================================
  // 生产计算
  // ============================================
  
  calculateProduction: (jobId: JobId, phaseAU: number) => {
    const state = get();
    const workers = state.getJobWorkers(jobId);
    
    if (workers.length === 0) {
      const jobConfig = JOB_PRODUCTION[jobId];
      return { resourceId: jobConfig?.resourceId || 'work', amount: 0, vuValue: 0 };
    }
    
    // 获取建筑等级
    const buildingMap: Partial<Record<JobId, BuildingId>> = {
      water_collector: 'water_collector',
      hunter: 'trap',
      scavenger: 'scavenge_post',
      engineer: 'workshop',
      researcher: 'research_desk',
    };
    
    const buildingId = buildingMap[jobId];
    const buildingLevel = buildingId ? (state.buildingLevels[buildingId] ?? 1) : 1;
    
    // 计算每个工人的效率
    const workerEfficiencies = workers.map(w => calculateWorkerEfficiency(w));
    
    return calculateJobProduction(jobId, workers.length, buildingLevel, phaseAU, workerEfficiencies);
  },
  
  calculateAllProduction: (phaseAU: number): Map<ResourceId | 'work', number> => {
    const state = get();
    const production = new Map<ResourceId | 'work', number>();
    
    const productiveJobs: JobId[] = ['scavenger', 'water_collector', 'hunter', 'engineer', 'researcher'];
    
    for (const jobId of productiveJobs) {
      const result = state.calculateProduction(jobId, phaseAU);
      if (result.amount > 0) {
        const current = production.get(result.resourceId) ?? 0;
        production.set(result.resourceId, current + result.amount);
      }
    }
    
    return production;
  },
  
  // ============================================
  // 最低工人计算
  // ============================================
  
  getMinimumWorkers: () => {
    const state = get();
    const population = state.workers.length;
    
    // 获取效率倍率（使用集水器和陷阱的平均等级）
    const waterLevel = state.buildingLevels.water_collector ?? 1;
    const trapLevel = state.buildingLevels.trap ?? 1;
    const avgLevel = (waterLevel + trapLevel) / 2;
    const efficiencyMultiplier = getBuildingEfficiencyMultiplier(avgLevel);
    
    return calculateMinimumWorkers(population, efficiencyMultiplier);
  },
  
  // ============================================
  // 净盈余计算
  // ============================================
  
  getNetSurplus: (phaseAU: number): number => {
    const state = get();
    
    // 计算有效工人数（有工作且可以工作的工人）
    const effectiveWorkers = state.workers.filter(w => 
      w.job !== null && canWorkerWork(w)
    ).reduce((sum, w) => sum + calculateWorkerEfficiency(w), 0);
    
    return calculateNetSurplus(effectiveWorkers, phaseAU);
  },
  
  // ============================================
  // 建筑等级
  // ============================================
  
  setBuildingLevel: (buildingId: BuildingId, level: number): void => {
    set((state) => ({
      buildingLevels: {
        ...state.buildingLevels,
        [buildingId]: level,
      },
    }));
  },
  
  getBuildingLevel: (buildingId: BuildingId): number => {
    return get().buildingLevels[buildingId] ?? 0;
  },
  
  // ============================================
  // 人口上限
  // ============================================
  
  setPopulationCap: (cap: number): void => {
    set({ populationCap: Math.max(0, cap) });
  },
  
  // ============================================
  // 士气
  // ============================================
  
  setMorale: (morale: number): void => {
    set({ morale: Math.max(-5, Math.min(5, morale)) });
  },
  
  modifyMorale: (delta: number): void => {
    set((state) => ({
      morale: Math.max(-5, Math.min(5, state.morale + delta)),
    }));
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetPopulation: (): void => {
    set({
      workers: [],
      populationCap: 2,
      morale: 0,
      jobs: {
        scavenger: [],
        water_collector: [],
        hunter: [],
        engineer: [],
        guard: [],
        scout: [],
        researcher: [],
      },
      buildingLevels: {},
    });
  },
}));
