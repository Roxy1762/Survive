/**
 * 探索系统配置数据
 * Exploration System Configuration Data
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 18.1, 18.2
 */

import type { 
  MapNode, 
  RegionTier, 
  LootEntry, 
  ResourceId,
  MapNodeState 
} from '../types';

// ============================================
// 区域层级配置
// Region Tier Configuration
// ============================================

/** 区域风险系数 - Requirements: 18.2 */
export const REGION_RISK_COEFFICIENTS: Record<RegionTier, number> = {
  T0: 0,      // 基地 - 无风险
  T1: 0.10,   // 近郊 - 低风险
  T2: 0.25,   // 外环 - 中等风险
  T3: 0.45,   // 危险区 - 高风险
  T4: 0.70,   // 高危设施 - 极高风险
  T5: 1.10,   // 禁区核心 - 极端风险
};

/** 区域基础战利品价值 (VU) */
export const REGION_BASE_LOOT_VALUE: Record<RegionTier, number> = {
  T0: 0,
  T1: 20,
  T2: 50,
  T3: 100,
  T4: 200,
  T5: 500,
};

/** 区域难度系数 - Requirements: 7.4 */
export function calculateRegionDifficulty(distance: number): number {
  return 6 + 1.5 * distance;
}

// ============================================
// 探索补给消耗常量
// Exploration Supply Consumption Constants
// ============================================

/** 每探索者每AU水消耗 - Requirements: 6.2 */
export const EXPLORATION_WATER_PER_EXPLORER_PER_AU = 1.5;

/** 每探索者每AU食物消耗 - Requirements: 6.2 */
export const EXPLORATION_FOOD_PER_EXPLORER_PER_AU = 1.8;

// ============================================
// 旅行时间计算
// Travel Time Calculation
// ============================================

/**
 * 计算搜索时间
 * @param distance 距离
 * @returns 搜索时间 (AU)
 */
export function calculateSearchTime(distance: number): number {
  return 2 + Math.floor(distance / 3);
}

/**
 * 计算总旅行时间 - Requirements: 6.3
 * Total_Time = 2 × distance + search_time
 * @param distance 距离 (AU)
 * @returns 总时间 (AU)
 */
export function calculateTotalTravelTime(distance: number): number {
  const travelTime = 2 * distance;
  const searchTime = calculateSearchTime(distance);
  return travelTime + searchTime;
}

// ============================================
// 探索补给计算
// Exploration Supply Calculation
// ============================================

/**
 * 计算探索补给消耗 - Requirements: 6.2
 * Water = 1.5/AU per explorer
 * Food = 1.8/AU per explorer
 * @param explorerCount 探索者数量
 * @param totalAU 总时间 (AU)
 * @returns 水和食物消耗量
 */
export function calculateExplorationSupplies(
  explorerCount: number,
  totalAU: number
): { water: number; food: number } {
  return {
    water: explorerCount * EXPLORATION_WATER_PER_EXPLORER_PER_AU * totalAU,
    food: explorerCount * EXPLORATION_FOOD_PER_EXPLORER_PER_AU * totalAU,
  };
}

// ============================================
// 战利品生成
// Loot Generation
// ============================================

/** 区域战利品表配置 */
export const REGION_LOOT_TABLES: Record<RegionTier, LootEntry[]> = {
  T0: [], // 基地无战利品
  T1: [
    // 近郊 - 基础资源为主
    { resourceId: 'scrap', minAmount: 5, maxAmount: 15, probability: 0.8 },
    { resourceId: 'dirty_water', minAmount: 1, maxAmount: 3, probability: 0.5 },
    { resourceId: 'raw_meat', minAmount: 1, maxAmount: 2, probability: 0.3 },
    { resourceId: 'vegetables', minAmount: 1, maxAmount: 2, probability: 0.2 },
    { resourceId: 'cloth', minAmount: 1, maxAmount: 2, probability: 0.15 },
  ],
  T2: [
    // 外环 - 二级材料开始出现
    { resourceId: 'scrap', minAmount: 10, maxAmount: 25, probability: 0.7 },
    { resourceId: 'wood', minAmount: 2, maxAmount: 5, probability: 0.4 },
    { resourceId: 'metal', minAmount: 1, maxAmount: 3, probability: 0.3 },
    { resourceId: 'cloth', minAmount: 2, maxAmount: 4, probability: 0.35 },
    { resourceId: 'leather', minAmount: 1, maxAmount: 3, probability: 0.25 },
    { resourceId: 'canned_food', minAmount: 1, maxAmount: 2, probability: 0.2 },
    { resourceId: 'fasteners', minAmount: 2, maxAmount: 5, probability: 0.2 },
  ],
  T3: [
    // 危险区 - 组件和化工材料
    { resourceId: 'scrap', minAmount: 15, maxAmount: 35, probability: 0.6 },
    { resourceId: 'metal', minAmount: 3, maxAmount: 8, probability: 0.45 },
    { resourceId: 'gear', minAmount: 1, maxAmount: 3, probability: 0.3 },
    { resourceId: 'pipe', minAmount: 1, maxAmount: 3, probability: 0.3 },
    { resourceId: 'spring', minAmount: 1, maxAmount: 2, probability: 0.25 },
    { resourceId: 'solvent', minAmount: 1, maxAmount: 2, probability: 0.2 },
    { resourceId: 'fuel', minAmount: 1, maxAmount: 2, probability: 0.15 },
    { resourceId: 'data_tape', minAmount: 1, maxAmount: 1, probability: 0.1 },
  ],
  T4: [
    // 高危设施 - 稀有资源
    { resourceId: 'metal', minAmount: 5, maxAmount: 12, probability: 0.5 },
    { resourceId: 'bearing', minAmount: 1, maxAmount: 3, probability: 0.35 },
    { resourceId: 'battery_cell', minAmount: 1, maxAmount: 2, probability: 0.25 },
    { resourceId: 'solvent', minAmount: 2, maxAmount: 4, probability: 0.3 },
    { resourceId: 'acid', minAmount: 1, maxAmount: 2, probability: 0.2 },
    { resourceId: 'data_tape', minAmount: 1, maxAmount: 2, probability: 0.25 },
    { resourceId: 'radio_parts', minAmount: 1, maxAmount: 1, probability: 0.15 },
    { resourceId: 'microchips', minAmount: 1, maxAmount: 1, probability: 0.1 },
    { resourceId: 'meds', minAmount: 1, maxAmount: 1, probability: 0.1 },
  ],
  T5: [
    // 禁区核心 - 顶级稀有资源
    { resourceId: 'rare_alloy', minAmount: 1, maxAmount: 3, probability: 0.4 },
    { resourceId: 'microchips', minAmount: 1, maxAmount: 2, probability: 0.35 },
    { resourceId: 'solar_cell', minAmount: 1, maxAmount: 1, probability: 0.2 },
    { resourceId: 'nanofiber', minAmount: 1, maxAmount: 1, probability: 0.15 },
    { resourceId: 'power_core', minAmount: 1, maxAmount: 1, probability: 0.05 },
    { resourceId: 'meds', minAmount: 1, maxAmount: 2, probability: 0.25 },
    { resourceId: 'battery_pack', minAmount: 1, maxAmount: 1, probability: 0.2 },
  ],
};

/**
 * 生成战利品 - Requirements: 6.4
 * @param tier 区域层级
 * @param riskCoefficient 风险系数
 * @returns 生成的战利品
 */
export function generateLoot(
  tier: RegionTier,
  riskCoefficient: number
): { resourceId: ResourceId; amount: number }[] {
  const lootTable = REGION_LOOT_TABLES[tier];
  const loot: { resourceId: ResourceId; amount: number }[] = [];
  
  // 风险系数影响战利品数量倍率
  // Expected_Value = Base_Value × (1 + Risk_Coefficient)
  const lootMultiplier = 1 + riskCoefficient;
  
  for (const entry of lootTable) {
    // 检查是否掉落
    if (Math.random() < entry.probability) {
      // 计算数量（应用风险倍率）
      const baseAmount = Math.floor(
        Math.random() * (entry.maxAmount - entry.minAmount + 1) + entry.minAmount
      );
      const finalAmount = Math.max(1, Math.round(baseAmount * lootMultiplier));
      
      loot.push({
        resourceId: entry.resourceId,
        amount: finalAmount,
      });
    }
  }
  
  return loot;
}

/**
 * 计算期望战利品价值 - Requirements: 18.3
 * Expected_Value = Base_Value × (1 + Risk_Coefficient)
 */
export function calculateExpectedLootValue(
  tier: RegionTier,
  riskCoefficient: number
): number {
  const baseValue = REGION_BASE_LOOT_VALUE[tier];
  return baseValue * (1 + riskCoefficient);
}

// ============================================
// 地图节点配置 - Requirements: 18.1, 18.2
// Map Node Configuration
// ============================================

/** 创建地图节点 */
export function createMapNode(
  id: string,
  name: string,
  nameZh: string,
  tier: RegionTier,
  distance: number,
  events: string[] = [],
  state: MapNodeState = 'undiscovered'
): MapNode {
  return {
    id,
    name,
    nameZh,
    tier,
    distance,
    state,
    riskCoefficient: REGION_RISK_COEFFICIENTS[tier],
    lootTable: REGION_LOOT_TABLES[tier],
    events,
  };
}

/** 默认地图节点配置 - Requirements: 18.1 */
export const DEFAULT_MAP_NODES: MapNode[] = [
  // T0 - 基地
  createMapNode('base', 'Base Camp', '营地', 'T0', 0, [], 'cleared'),
  
  // T1 - 近郊 (距离 1-2)
  createMapNode('collapsed_highway', 'Collapsed Highway', '塌陷公路', 'T1', 1, ['scavenge', 'ambush']),
  createMapNode('dried_riverbed', 'Dried Riverbed', '干涸河床', 'T1', 1, ['water_source', 'creature']),
  createMapNode('abandoned_farm', 'Abandoned Farm', '废弃农庄', 'T1', 2, ['food_cache', 'wanderer']),
  createMapNode('town_edge', 'Town Edge', '小镇边缘', 'T1', 2, ['trader', 'scavenge']),
  
  // T2 - 外环 (距离 3-4)
  createMapNode('ruined_suburb', 'Ruined Suburb', '破败社区', 'T2', 3, ['scavenge', 'raider']),
  createMapNode('old_gas_station', 'Old Gas Station', '旧加油站', 'T2', 3, ['fuel_cache', 'ambush']),
  createMapNode('underground_drainage', 'Underground Drainage', '地下排水道', 'T2', 4, ['water_source', 'creature', 'hidden_cache']),
  createMapNode('bandit_outpost', 'Bandit Outpost', '匪徒哨站', 'T2', 4, ['combat', 'loot_cache']),
  
  // T3 - 危险区 (距离 5-6)
  createMapNode('old_factory', 'Old Factory District', '旧工厂区', 'T3', 5, ['industrial_loot', 'hazard']),
  createMapNode('military_checkpoint', 'Military Checkpoint', '军事检查站', 'T3', 5, ['military_loot', 'combat']),
  createMapNode('crashed_helicopter', 'Crashed Helicopter', '坠毁直升机', 'T3', 6, ['rare_loot', 'radiation']),
  createMapNode('signal_tower_ruins', 'Signal Tower Ruins', '信号塔废墟', 'T3', 6, ['tech_loot', 'signal']),
  
  // T4 - 高危设施 (距离 7-8)
  createMapNode('research_bunker', 'Research Bunker', '研究避难所', 'T4', 7, ['tech_loot', 'hazard', 'data']),
  createMapNode('data_center', 'Data Center', '数据中心', 'T4', 7, ['tech_loot', 'data', 'power']),
  createMapNode('deep_metro', 'Deep Metro', '地铁深层', 'T4', 8, ['hidden_cache', 'creature', 'hazard']),
  createMapNode('water_plant_core', 'Water Plant Core', '净水厂核心区', 'T4', 8, ['water_tech', 'hazard', 'rare_loot']),
  
  // T5 - 禁区核心 (距离 9-10)
  createMapNode('reactor_heart', 'Reactor Heart', '反应堆心脏', 'T5', 9, ['power_core', 'radiation', 'extreme_hazard']),
  createMapNode('ai_control_room', 'AI Control Room', 'AI控制室', 'T5', 10, ['tech_loot', 'data', 'extreme_hazard']),
  createMapNode('core_lab', 'Core Laboratory', '核心实验舱', 'T5', 10, ['nanotech', 'extreme_hazard', 'story']),
];

/**
 * 获取区域层级的所有节点
 */
export function getNodesByTier(tier: RegionTier): MapNode[] {
  return DEFAULT_MAP_NODES.filter(node => node.tier === tier);
}

/**
 * 获取指定距离范围内的节点
 */
export function getNodesInRange(minDistance: number, maxDistance: number): MapNode[] {
  return DEFAULT_MAP_NODES.filter(
    node => node.distance >= minDistance && node.distance <= maxDistance
  );
}

/**
 * 根据无线电塔等级获取可探索的最大距离
 * Requirements: 6.5
 * 
 * T1 区域（距离 1-2）无需电塔即可探索
 * 更远的区域需要电塔：
 * - L0: 距离 0-2 (T1 近郊)
 * - L1: 距离 0-4 (T2 外环)
 * - L2: 距离 0-7 (T3 危险区)
 * - L3: 距离 0-10 (T4/T5 高危设施和禁区)
 */
export function getMaxExplorationDistance(radioTowerLevel: number): number {
  switch (radioTowerLevel) {
    case 0: return 2;  // 未建造 - 可探索 T1 近郊
    case 1: return 4;  // L1 - 外环
    case 2: return 7;  // L2 - 危险区
    case 3: return 10; // L3 - 高危设施和禁区
    default: return 10;
  }
}

/**
 * 获取可探索的节点
 */
export function getExplorableNodes(
  radioTowerLevel: number,
  discoveredNodeIds: string[]
): MapNode[] {
  const maxDistance = getMaxExplorationDistance(radioTowerLevel);
  
  return DEFAULT_MAP_NODES.filter(node => {
    // 基地不可探索
    if (node.id === 'base') return false;
    // 距离限制
    if (node.distance > maxDistance) return false;
    // 已发现的节点可以再次探索
    if (discoveredNodeIds.includes(node.id)) return true;
    // 未发现的节点需要相邻节点已发现
    // 简化逻辑：距离小于等于当前最大已发现距离+1的节点可发现
    const maxDiscoveredDistance = Math.max(
      0,
      ...DEFAULT_MAP_NODES
        .filter(n => discoveredNodeIds.includes(n.id))
        .map(n => n.distance)
    );
    return node.distance <= maxDiscoveredDistance + 1;
  });
}
