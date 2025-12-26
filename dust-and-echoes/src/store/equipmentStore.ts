/**
 * 装备管理系统状态管理
 * Equipment Management System State Management
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { create } from 'zustand';
import type { ResourceId } from '../types';
import { 
  type EquipmentInstance, 
  type EquipmentStatus,
  getEquipmentConfig,
} from '../config/equipment';

// ============================================
// 类型定义
// Type Definitions
// ============================================

/** 装备使用结果 */
export interface EquipmentUseResult {
  success: boolean;
  durabilityLost: number;
  newDurability: number;
  broken: boolean;
  message?: string;
}

/** 拆解结果 */
export interface SalvageResult {
  success: boolean;
  materials: { resourceId: ResourceId; amount: number }[];
  totalVU: number;
  message?: string;
}

/** 修理结果 */
export interface RepairResult {
  success: boolean;
  durabilityRestored: number;
  newDurability: number;
  message?: string;
}

// ============================================
// 常量
// Constants
// ============================================

/** 拆解回收率范围 (20-40%) */
export const SALVAGE_MIN_RATE = 0.2;
export const SALVAGE_MAX_RATE = 0.4;

/** 修理包每次恢复的耐久度 */
export const REPAIR_KIT_DURABILITY_RESTORE = 10;

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 生成唯一的装备实例ID
 */
let instanceIdCounter = 0;
export function generateInstanceId(): string {
  instanceIdCounter++;
  return `equip_${Date.now()}_${instanceIdCounter}`;
}

/**
 * 重置实例ID计数器（用于测试）
 */
export function resetInstanceIdCounter(): void {
  instanceIdCounter = 0;
}

/**
 * 根据耐久度计算装备状态
 * @param durability 当前耐久度
 * @param maxDurability 最大耐久度
 */
export function calculateEquipmentStatus(
  durability: number,
  maxDurability: number
): EquipmentStatus {
  if (durability <= 0) {
    return 'broken';
  }
  if (durability <= maxDurability * 0.25) {
    return 'damaged';
  }
  return 'functional';
}

/**
 * 计算耐久度消耗
 * Requirements: 12.2 - 1 Dur per 1 AU activity (0.5 for half phases)
 * @param auCost 行动消耗的AU值
 */
export function calculateDurabilityConsumption(auCost: number): number {
  return auCost; // 1:1 mapping - 1 Dur per 1 AU
}

/**
 * 计算拆解回收的材料价值
 * Requirements: 12.4 - 20-40% material value
 * @param equipmentVU 装备的VU价值
 * @param randomFactor 随机因子 (0-1)，用于确定回收率
 */
export function calculateSalvageValue(
  equipmentVU: number,
  randomFactor: number = Math.random()
): number {
  const rate = SALVAGE_MIN_RATE + randomFactor * (SALVAGE_MAX_RATE - SALVAGE_MIN_RATE);
  return Math.floor(equipmentVU * rate);
}

/**
 * 创建装备实例
 * @param configId 装备配置ID
 * @param durability 可选的初始耐久度（默认为最大耐久度）
 */
export function createEquipmentInstance(
  configId: string,
  durability?: number
): EquipmentInstance | null {
  const config = getEquipmentConfig(configId);
  if (!config) {
    return null;
  }
  
  const actualDurability = durability ?? config.maxDurability;
  
  return {
    instanceId: generateInstanceId(),
    configId,
    durability: actualDurability,
    status: calculateEquipmentStatus(actualDurability, config.maxDurability),
  };
}

// ============================================
// 装备Store接口
// Equipment Store Interface
// ============================================

interface EquipmentStore {
  // 状态
  equipment: EquipmentInstance[];
  
  // 装备管理
  /** 添加装备实例 */
  addEquipment: (configId: string, durability?: number) => EquipmentInstance | null;
  /** 移除装备实例 */
  removeEquipment: (instanceId: string) => boolean;
  /** 获取装备实例 */
  getEquipment: (instanceId: string) => EquipmentInstance | undefined;
  /** 获取所有装备 */
  getAllEquipment: () => EquipmentInstance[];
  /** 按类型获取装备 */
  getEquipmentByType: (type: 'weapon' | 'armor' | 'tool') => EquipmentInstance[];
  
  // 耐久度管理 (Requirements: 12.1, 12.2)
  /** 使用装备（消耗耐久度） */
  useEquipment: (instanceId: string, auCost: number) => EquipmentUseResult;
  /** 设置装备耐久度 */
  setDurability: (instanceId: string, durability: number) => boolean;
  /** 获取装备耐久度 */
  getDurability: (instanceId: string) => number | undefined;
  /** 检查装备是否可用（未损坏） */
  isUsable: (instanceId: string) => boolean;
  
  // 损坏与拆解 (Requirements: 12.3, 12.4)
  /** 标记装备为损坏 */
  markAsBroken: (instanceId: string) => boolean;
  /** 拆解装备回收材料 */
  salvageEquipment: (instanceId: string) => SalvageResult;
  
  // 修理 (Requirements: 12.5)
  /** 修理装备 */
  repairEquipment: (instanceId: string, durabilityToRestore: number) => RepairResult;
  
  // 重置
  /** 重置装备状态 */
  resetEquipment: () => void;
}

/**
 * 装备状态Store
 */
export const useEquipmentStore = create<EquipmentStore>((set, get) => ({
  // 初始状态
  equipment: [],
  
  // 添加装备实例
  addEquipment: (configId: string, durability?: number): EquipmentInstance | null => {
    const instance = createEquipmentInstance(configId, durability);
    if (!instance) {
      return null;
    }
    
    set((state) => ({
      equipment: [...state.equipment, instance],
    }));
    
    return instance;
  },
  
  // 移除装备实例
  removeEquipment: (instanceId: string): boolean => {
    const state = get();
    const exists = state.equipment.some(e => e.instanceId === instanceId);
    
    if (!exists) {
      return false;
    }
    
    set((state) => ({
      equipment: state.equipment.filter(e => e.instanceId !== instanceId),
    }));
    
    return true;
  },
  
  // 获取装备实例
  getEquipment: (instanceId: string): EquipmentInstance | undefined => {
    return get().equipment.find(e => e.instanceId === instanceId);
  },
  
  // 获取所有装备
  getAllEquipment: (): EquipmentInstance[] => {
    return get().equipment;
  },
  
  // 按类型获取装备
  getEquipmentByType: (type: 'weapon' | 'armor' | 'tool'): EquipmentInstance[] => {
    return get().equipment.filter(e => {
      const config = getEquipmentConfig(e.configId);
      return config?.type === type;
    });
  },
  
  // 使用装备（消耗耐久度）
  // Requirements: 12.1, 12.2
  useEquipment: (instanceId: string, auCost: number): EquipmentUseResult => {
    const state = get();
    const equipment = state.equipment.find(e => e.instanceId === instanceId);
    
    if (!equipment) {
      return {
        success: false,
        durabilityLost: 0,
        newDurability: 0,
        broken: false,
        message: '装备不存在',
      };
    }
    
    if (equipment.status === 'broken') {
      return {
        success: false,
        durabilityLost: 0,
        newDurability: equipment.durability,
        broken: true,
        message: '装备已损坏，无法使用',
      };
    }
    
    const config = getEquipmentConfig(equipment.configId);
    if (!config) {
      return {
        success: false,
        durabilityLost: 0,
        newDurability: equipment.durability,
        broken: false,
        message: '装备配置不存在',
      };
    }
    
    // 计算耐久度消耗 (1 Dur per 1 AU)
    const durabilityLost = calculateDurabilityConsumption(auCost);
    const newDurability = Math.max(0, equipment.durability - durabilityLost);
    const newStatus = calculateEquipmentStatus(newDurability, config.maxDurability);
    const broken = newStatus === 'broken';
    
    // 更新装备状态
    set((state) => ({
      equipment: state.equipment.map(e => 
        e.instanceId === instanceId
          ? { ...e, durability: newDurability, status: newStatus }
          : e
      ),
    }));
    
    return {
      success: true,
      durabilityLost,
      newDurability,
      broken,
    };
  },
  
  // 设置装备耐久度
  setDurability: (instanceId: string, durability: number): boolean => {
    const state = get();
    const equipment = state.equipment.find(e => e.instanceId === instanceId);
    
    if (!equipment) {
      return false;
    }
    
    const config = getEquipmentConfig(equipment.configId);
    if (!config) {
      return false;
    }
    
    const clampedDurability = Math.max(0, Math.min(durability, config.maxDurability));
    const newStatus = calculateEquipmentStatus(clampedDurability, config.maxDurability);
    
    set((state) => ({
      equipment: state.equipment.map(e =>
        e.instanceId === instanceId
          ? { ...e, durability: clampedDurability, status: newStatus }
          : e
      ),
    }));
    
    return true;
  },
  
  // 获取装备耐久度
  getDurability: (instanceId: string): number | undefined => {
    const equipment = get().equipment.find(e => e.instanceId === instanceId);
    return equipment?.durability;
  },
  
  // 检查装备是否可用
  isUsable: (instanceId: string): boolean => {
    const equipment = get().equipment.find(e => e.instanceId === instanceId);
    return equipment !== undefined && equipment.status !== 'broken';
  },
  
  // 标记装备为损坏
  markAsBroken: (instanceId: string): boolean => {
    const state = get();
    const equipment = state.equipment.find(e => e.instanceId === instanceId);
    
    if (!equipment) {
      return false;
    }
    
    set((state) => ({
      equipment: state.equipment.map(e =>
        e.instanceId === instanceId
          ? { ...e, durability: 0, status: 'broken' as EquipmentStatus }
          : e
      ),
    }));
    
    return true;
  },
  
  // 拆解装备回收材料
  // Requirements: 12.4 - 20-40% material value
  salvageEquipment: (instanceId: string): SalvageResult => {
    const state = get();
    const equipment = state.equipment.find(e => e.instanceId === instanceId);
    
    if (!equipment) {
      return {
        success: false,
        materials: [],
        totalVU: 0,
        message: '装备不存在',
      };
    }
    
    const config = getEquipmentConfig(equipment.configId);
    if (!config) {
      return {
        success: false,
        materials: [],
        totalVU: 0,
        message: '装备配置不存在',
      };
    }
    
    // 计算回收价值 (20-40% of VU)
    const salvageVU = calculateSalvageValue(config.vu);
    
    // 转换为废料 (1 Scrap = 1 VU)
    const materials: { resourceId: ResourceId; amount: number }[] = [
      { resourceId: 'scrap', amount: salvageVU },
    ];
    
    // 移除装备
    set((state) => ({
      equipment: state.equipment.filter(e => e.instanceId !== instanceId),
    }));
    
    return {
      success: true,
      materials,
      totalVU: salvageVU,
      message: `拆解获得 ${salvageVU} 废料`,
    };
  },
  
  // 修理装备
  // Requirements: 12.5
  repairEquipment: (instanceId: string, durabilityToRestore: number): RepairResult => {
    const state = get();
    const equipment = state.equipment.find(e => e.instanceId === instanceId);
    
    if (!equipment) {
      return {
        success: false,
        durabilityRestored: 0,
        newDurability: 0,
        message: '装备不存在',
      };
    }
    
    const config = getEquipmentConfig(equipment.configId);
    if (!config) {
      return {
        success: false,
        durabilityRestored: 0,
        newDurability: equipment.durability,
        message: '装备配置不存在',
      };
    }
    
    // 计算实际恢复的耐久度
    const maxRestore = config.maxDurability - equipment.durability;
    const actualRestore = Math.min(durabilityToRestore, maxRestore);
    const newDurability = equipment.durability + actualRestore;
    const newStatus = calculateEquipmentStatus(newDurability, config.maxDurability);
    
    // 更新装备状态
    set((state) => ({
      equipment: state.equipment.map(e =>
        e.instanceId === instanceId
          ? { ...e, durability: newDurability, status: newStatus }
          : e
      ),
    }));
    
    return {
      success: true,
      durabilityRestored: actualRestore,
      newDurability,
      message: actualRestore > 0 
        ? `修理恢复了 ${actualRestore} 点耐久度` 
        : '装备已是满耐久度',
    };
  },
  
  // 重置装备状态
  resetEquipment: (): void => {
    set({ equipment: [] });
    resetInstanceIdCounter();
  },
}));
