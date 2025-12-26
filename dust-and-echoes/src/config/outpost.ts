/**
 * 先锋营地配置数据
 * Outpost System Configuration Data
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { 
  OutpostModuleType, 
  ResourceAmount 
} from '../types';

// ============================================
// 营地等级配置
// Outpost Level Configuration
// ============================================

/** 营地等级配置 */
export interface OutpostLevelConfig {
  level: number;
  maxModules: number;
  maxGarrison: number;
  baseStability: number;
  buildCost: ResourceAmount[];
  totalVU: number;
}

/** 营地等级配置 - Requirements: 9.3 */
export const OUTPOST_LEVEL_CONFIGS: OutpostLevelConfig[] = [
  {
    level: 1,
    maxModules: 2,
    maxGarrison: 3,
    baseStability: 70,
    buildCost: [
      { resourceId: 'scrap', amount: 120 },
      { resourceId: 'wood', amount: 60 },
      { resourceId: 'metal', amount: 25 },
      { resourceId: 'fasteners', amount: 8 },
    ],
    totalVU: 120 + 60 * 8 + 25 * 16 + 8 * 6, // 120 + 480 + 400 + 48 = 1048 VU
  },
  {
    level: 2,
    maxModules: 4,
    maxGarrison: 5,
    baseStability: 75,
    buildCost: [
      { resourceId: 'scrap', amount: 200 },
      { resourceId: 'wood', amount: 100 },
      { resourceId: 'metal', amount: 50 },
      { resourceId: 'fasteners', amount: 15 },
      { resourceId: 'gear', amount: 3 },
    ],
    totalVU: 200 + 100 * 8 + 50 * 16 + 15 * 6 + 3 * 15, // 200 + 800 + 800 + 90 + 45 = 1935 VU
  },
  {
    level: 3,
    maxModules: 6,
    maxGarrison: 8,
    baseStability: 80,
    buildCost: [
      { resourceId: 'scrap', amount: 350 },
      { resourceId: 'wood', amount: 150 },
      { resourceId: 'metal', amount: 80 },
      { resourceId: 'fasteners', amount: 25 },
      { resourceId: 'gear', amount: 6 },
      { resourceId: 'radio_parts', amount: 1 },
    ],
    totalVU: 350 + 150 * 8 + 80 * 16 + 25 * 6 + 6 * 15 + 1 * 240, // 350 + 1200 + 1280 + 150 + 90 + 240 = 3310 VU
  },
];

// ============================================
// 模块配置
// Module Configuration
// ============================================

/** 模块配置 */
export interface OutpostModuleConfig {
  type: OutpostModuleType;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  maxLevel: number;
  buildCost: ResourceAmount[];
  effects: ModuleEffect[];
  requiredOutpostLevel: number;
  requiredTech?: string;
}

/** 模块效果 */
export interface ModuleEffect {
  type: 'storage_bonus' | 'stability_bonus' | 'detection_range' | 'repair_efficiency' | 'healing_rate' | 'relay_range';
  value: number;
  perLevel?: boolean; // 是否每级递增
}

/** 模块配置 - Requirements: 9.6 */
export const OUTPOST_MODULE_CONFIGS: Record<OutpostModuleType, OutpostModuleConfig> = {
  storage: {
    type: 'storage',
    name: 'Storage Module',
    nameZh: '仓储模块',
    description: 'Increases outpost storage capacity',
    descriptionZh: '增加营地存储容量',
    maxLevel: 3,
    buildCost: [
      { resourceId: 'scrap', amount: 40 },
      { resourceId: 'wood', amount: 20 },
    ],
    effects: [
      { type: 'storage_bonus', value: 50, perLevel: true },
    ],
    requiredOutpostLevel: 1,
  },
  workshop: {
    type: 'workshop',
    name: 'Field Workshop',
    nameZh: '野战工坊',
    description: 'Allows basic repairs and crafting at the outpost',
    descriptionZh: '允许在营地进行基础修理和制造',
    maxLevel: 2,
    buildCost: [
      { resourceId: 'scrap', amount: 60 },
      { resourceId: 'metal', amount: 15 },
      { resourceId: 'gear', amount: 2 },
    ],
    effects: [
      { type: 'repair_efficiency', value: 0.5, perLevel: true },
    ],
    requiredOutpostLevel: 1,
    requiredTech: 'workshop_basics',
  },
  infirmary: {
    type: 'infirmary',
    name: 'Field Infirmary',
    nameZh: '医疗帐篷',
    description: 'Provides medical treatment at the outpost',
    descriptionZh: '在营地提供医疗救治',
    maxLevel: 2,
    buildCost: [
      { resourceId: 'scrap', amount: 50 },
      { resourceId: 'cloth', amount: 10 },
      { resourceId: 'meds', amount: 1 },
    ],
    effects: [
      { type: 'healing_rate', value: 5, perLevel: true },
    ],
    requiredOutpostLevel: 1,
  },
  watchtower: {
    type: 'watchtower',
    name: 'Watchtower',
    nameZh: '瞭望塔',
    description: 'Increases detection range and stability',
    descriptionZh: '增加侦测范围和稳定度',
    maxLevel: 3,
    buildCost: [
      { resourceId: 'scrap', amount: 45 },
      { resourceId: 'wood', amount: 30 },
      { resourceId: 'metal', amount: 10 },
    ],
    effects: [
      { type: 'detection_range', value: 1, perLevel: true },
      { type: 'stability_bonus', value: 5, perLevel: true },
    ],
    requiredOutpostLevel: 1,
    requiredTech: 'militia_training',
  },
  radio_relay: {
    type: 'radio_relay',
    name: 'Radio Relay',
    nameZh: '无线电中继',
    description: 'Extends communication range and improves supply line stability',
    descriptionZh: '扩展通讯范围，提高补给线稳定度',
    maxLevel: 2,
    buildCost: [
      { resourceId: 'scrap', amount: 80 },
      { resourceId: 'wire', amount: 8 },
      { resourceId: 'radio_parts', amount: 1 },
    ],
    effects: [
      { type: 'relay_range', value: 2, perLevel: true },
      { type: 'stability_bonus', value: 10, perLevel: true },
    ],
    requiredOutpostLevel: 2,
    requiredTech: 'simple_radio',
  },
};

// ============================================
// 补给线配置
// Supply Line Configuration
// ============================================

/** 补给线稳定度衰减配置 - Requirements: 9.4, 9.5 */
export const SUPPLY_LINE_CONFIG = {
  /** 基础稳定度 */
  baseStability: 70,
  /** 每单位距离稳定度衰减 */
  stabilityDecayPerDistance: 5,
  /** 最小稳定度 */
  minStability: 10,
  /** 稳定度警告阈值 */
  warningThreshold: 50,
  /** 稳定度危机阈值 - Requirements: 9.5 */
  criticalThreshold: 40,
  /** 中继站稳定度加成 */
  relayStabilityBonus: 10,
};

/**
 * 计算补给线稳定度 - Requirements: 9.4
 * @param distance 距离基地的距离
 * @param relayCount 中继站数量
 * @param outpostLevel 营地等级
 * @returns 稳定度 (0-100)
 */
export function calculateSupplyLineStability(
  distance: number,
  relayCount: number = 0,
  outpostLevel: number = 1
): number {
  const levelConfig = OUTPOST_LEVEL_CONFIGS.find(c => c.level === outpostLevel);
  const baseStability = levelConfig?.baseStability ?? SUPPLY_LINE_CONFIG.baseStability;
  
  // 基础稳定度 - 距离衰减 + 中继加成
  const distanceDecay = distance * SUPPLY_LINE_CONFIG.stabilityDecayPerDistance;
  const relayBonus = relayCount * SUPPLY_LINE_CONFIG.relayStabilityBonus;
  
  const stability = baseStability - distanceDecay + relayBonus;
  
  return Math.max(SUPPLY_LINE_CONFIG.minStability, Math.min(100, stability));
}

/**
 * 检查补给线是否处于危机状态 - Requirements: 9.5
 */
export function isSupplyLineCritical(stability: number): boolean {
  return stability < SUPPLY_LINE_CONFIG.criticalThreshold;
}

/**
 * 检查补给线是否处于警告状态
 */
export function isSupplyLineWarning(stability: number): boolean {
  return stability < SUPPLY_LINE_CONFIG.warningThreshold && stability >= SUPPLY_LINE_CONFIG.criticalThreshold;
}

// ============================================
// 营地建立需求
// Outpost Establishment Requirements
// ============================================

/** 建立营地所需的科技 - Requirements: 9.1 */
export const OUTPOST_REQUIRED_TECH = 'vanguard_camp_1';

/** 升级到L2所需的科技 */
export const OUTPOST_L2_REQUIRED_TECH = 'vanguard_camp_2';

/**
 * 获取营地等级配置
 */
export function getOutpostLevelConfig(level: number): OutpostLevelConfig | undefined {
  return OUTPOST_LEVEL_CONFIGS.find(c => c.level === level);
}

/**
 * 获取模块配置
 */
export function getModuleConfig(type: OutpostModuleType): OutpostModuleConfig {
  return OUTPOST_MODULE_CONFIGS[type];
}

/**
 * 获取建立营地所需资源 - Requirements: 9.2
 */
export function getOutpostBuildCost(level: number): ResourceAmount[] {
  const config = getOutpostLevelConfig(level);
  return config?.buildCost ?? [];
}

/**
 * 获取模块建造成本（按等级递增）
 */
export function getModuleBuildCost(type: OutpostModuleType, targetLevel: number): ResourceAmount[] {
  const config = getModuleConfig(type);
  // 每级成本递增 50%
  const multiplier = Math.pow(1.5, targetLevel - 1);
  
  return config.buildCost.map(cost => ({
    resourceId: cost.resourceId,
    amount: Math.ceil(cost.amount * multiplier),
  }));
}

/**
 * 检查是否可以在指定节点建立营地
 */
export function canEstablishOutpost(
  nodeId: string,
  nodeState: string,
  researchedTechs: string[],
  existingOutpostNodeIds: string[]
): { canEstablish: boolean; reason?: string } {
  // 检查科技
  if (!researchedTechs.includes(OUTPOST_REQUIRED_TECH)) {
    return { canEstablish: false, reason: '需要研究先锋营地 I 科技' };
  }
  
  // 检查节点状态
  if (nodeState === 'undiscovered') {
    return { canEstablish: false, reason: '节点尚未发现' };
  }
  
  // 检查是否已有营地
  if (existingOutpostNodeIds.includes(nodeId)) {
    return { canEstablish: false, reason: '该节点已有营地' };
  }
  
  // 不能在基地建立营地
  if (nodeId === 'base') {
    return { canEstablish: false, reason: '不能在基地建立营地' };
  }
  
  return { canEstablish: true };
}

/**
 * 检查是否可以升级营地
 */
export function canUpgradeOutpost(
  currentLevel: number,
  researchedTechs: string[]
): { canUpgrade: boolean; reason?: string } {
  if (currentLevel >= 3) {
    return { canUpgrade: false, reason: '已达最高等级' };
  }
  
  // L2需要特定科技
  if (currentLevel === 1 && !researchedTechs.includes(OUTPOST_L2_REQUIRED_TECH)) {
    return { canUpgrade: false, reason: '需要研究先锋营地 II 科技' };
  }
  
  return { canUpgrade: true };
}

/**
 * 检查是否可以建造模块
 */
export function canBuildModule(
  moduleType: OutpostModuleType,
  outpostLevel: number,
  currentModuleCount: number,
  existingModules: { type: OutpostModuleType; level: number }[],
  researchedTechs: string[]
): { canBuild: boolean; reason?: string } {
  const moduleConfig = getModuleConfig(moduleType);
  const levelConfig = getOutpostLevelConfig(outpostLevel);
  
  if (!levelConfig) {
    return { canBuild: false, reason: '无效的营地等级' };
  }
  
  // 检查模块数量上限
  if (currentModuleCount >= levelConfig.maxModules) {
    return { canBuild: false, reason: '已达模块数量上限' };
  }
  
  // 检查营地等级要求
  if (outpostLevel < moduleConfig.requiredOutpostLevel) {
    return { canBuild: false, reason: `需要营地等级 ${moduleConfig.requiredOutpostLevel}` };
  }
  
  // 检查科技要求
  if (moduleConfig.requiredTech && !researchedTechs.includes(moduleConfig.requiredTech)) {
    return { canBuild: false, reason: '缺少所需科技' };
  }
  
  // 检查现有模块等级
  const existingModule = existingModules.find(m => m.type === moduleType);
  if (existingModule && existingModule.level >= moduleConfig.maxLevel) {
    return { canBuild: false, reason: '该模块已达最高等级' };
  }
  
  return { canBuild: true };
}
