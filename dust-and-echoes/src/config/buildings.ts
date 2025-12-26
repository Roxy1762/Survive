/**
 * 建筑配置数据
 * Building Configuration Data
 * 
 * 所有建筑的成本和效果定义
 * Requirements: 4.1, 4.2
 */

import type { Building, BuildingId } from '../types';

/**
 * 建筑配置常量
 * 
 * 成本递增公式 (Shelter): Cost(k) = Base × 1.25^(k-1)
 * 效率倍率公式: efficiency = 1 + 0.10 × (Level - 1)
 * 工人槽位公式: Water/Food max = 2 + 2L, Scrap max = 3 + 3L
 */
export const BUILDINGS: Record<BuildingId, Building> = {
  // ============================================
  // 核心建筑 (Core Buildings)
  // Requirements: 4.1
  // ============================================
  bonfire: {
    id: 'bonfire',
    name: 'Bonfire',
    nameZh: '篝火',
    maxLevel: 1,
    costs: [
      {
        level: 1,
        resources: [
          { resourceId: 'scrap', amount: 30 },
          { resourceId: 'wood', amount: 5 },
        ],
        totalVU: 70, // 30 Scrap (30 VU) + 5 Wood (40 VU) = 70 VU
      },
    ],
    effects: [
      { level: 1, type: 'unlock_job', value: 'recruitment' },
    ],
    // 特殊: 强度档位 (off/low/medium/high)
    // 燃料消耗: low 0.3 Wood/AU, medium 0.8 Wood/AU, high 1.6 Wood/AU
    // 来人速率: λ = 0.2 × 强度系数(1/2/3) × (cap - pop)
  },

  shelter: {
    id: 'shelter',
    name: 'Shelter',
    nameZh: '住所',
    maxLevel: 10,
    costs: [
      // Base成本: 20 Scrap + 8 Wood = 84 VU
      // 递增: Cost(k) = Base × 1.25^(k-1)
      { level: 1, resources: [{ resourceId: 'scrap', amount: 20 }, { resourceId: 'wood', amount: 8 }], totalVU: 84 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 25 }, { resourceId: 'wood', amount: 10 }], totalVU: 105 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 31 }, { resourceId: 'wood', amount: 13 }], totalVU: 135 },
      { level: 4, resources: [{ resourceId: 'scrap', amount: 39 }, { resourceId: 'wood', amount: 16 }], totalVU: 167 },
      { level: 5, resources: [{ resourceId: 'scrap', amount: 49 }, { resourceId: 'wood', amount: 20 }], totalVU: 209 },
      { level: 6, resources: [{ resourceId: 'scrap', amount: 61 }, { resourceId: 'wood', amount: 25 }], totalVU: 261 },
      { level: 7, resources: [{ resourceId: 'scrap', amount: 76 }, { resourceId: 'wood', amount: 31 }], totalVU: 324 },
      { level: 8, resources: [{ resourceId: 'scrap', amount: 95 }, { resourceId: 'wood', amount: 39 }], totalVU: 407 },
      { level: 9, resources: [{ resourceId: 'scrap', amount: 119 }, { resourceId: 'wood', amount: 49 }], totalVU: 511 },
      { level: 10, resources: [{ resourceId: 'scrap', amount: 149 }, { resourceId: 'wood', amount: 61 }], totalVU: 637 },
    ],
    effects: [
      // 每级+2人口上限
      { level: 1, type: 'increase_cap', value: 2 },
      { level: 2, type: 'increase_cap', value: 4 },
      { level: 3, type: 'increase_cap', value: 6 },
      { level: 4, type: 'increase_cap', value: 8 },
      { level: 5, type: 'increase_cap', value: 10 },
      { level: 6, type: 'increase_cap', value: 12 },
      { level: 7, type: 'increase_cap', value: 14 },
      { level: 8, type: 'increase_cap', value: 16 },
      { level: 9, type: 'increase_cap', value: 18 },
      { level: 10, type: 'increase_cap', value: 20 },
    ],
  },

  warehouse: {
    id: 'warehouse',
    name: 'Warehouse',
    nameZh: '仓库',
    maxLevel: 5,
    costs: [
      // L1: 80 Scrap + 20 Wood = 240 VU
      { level: 1, resources: [{ resourceId: 'scrap', amount: 80 }, { resourceId: 'wood', amount: 20 }], totalVU: 240 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 160 }, { resourceId: 'wood', amount: 40 }, { resourceId: 'metal', amount: 10 }], totalVU: 640 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 320 }, { resourceId: 'wood', amount: 80 }, { resourceId: 'metal', amount: 25 }], totalVU: 1360 },
      { level: 4, resources: [{ resourceId: 'scrap', amount: 640 }, { resourceId: 'wood', amount: 160 }, { resourceId: 'metal', amount: 50 }], totalVU: 2720 },
      { level: 5, resources: [{ resourceId: 'scrap', amount: 1280 }, { resourceId: 'wood', amount: 320 }, { resourceId: 'metal', amount: 100 }], totalVU: 5440 },
    ],
    effects: [
      // 每级增加: Water+50, Food+50, Scrap+150, Wood+80, Metal+40, Meds+5, Chip+3
      { level: 1, type: 'increase_cap', value: 'storage_l1' },
      { level: 2, type: 'increase_cap', value: 'storage_l2' },
      { level: 3, type: 'increase_cap', value: 'storage_l3' },
      { level: 4, type: 'increase_cap', value: 'storage_l4' },
      { level: 5, type: 'increase_cap', value: 'storage_l5' },
    ],
  },

  workshop: {
    id: 'workshop',
    name: 'Workshop',
    nameZh: '工坊',
    maxLevel: 5,
    costs: [
      // L1: 80 Scrap = 80 VU (降低成本，移除Wood需求以打破死锁)
      { level: 1, resources: [{ resourceId: 'scrap', amount: 80 }], totalVU: 80 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 160 }, { resourceId: 'wood', amount: 30 }, { resourceId: 'metal', amount: 10 }], totalVU: 560 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 320 }, { resourceId: 'wood', amount: 60 }, { resourceId: 'metal', amount: 25 }], totalVU: 1200 },
      { level: 4, resources: [{ resourceId: 'scrap', amount: 640 }, { resourceId: 'wood', amount: 120 }, { resourceId: 'metal', amount: 50 }], totalVU: 2480 },
      { level: 5, resources: [{ resourceId: 'scrap', amount: 1280 }, { resourceId: 'wood', amount: 240 }, { resourceId: 'metal', amount: 100 }], totalVU: 4960 },
    ],
    effects: [
      // 效率倍率: 1 + 0.20 × (L-1)
      { level: 1, type: 'efficiency_bonus', value: 1.0 },
      { level: 2, type: 'efficiency_bonus', value: 1.2 },
      { level: 3, type: 'efficiency_bonus', value: 1.4 },
      { level: 4, type: 'efficiency_bonus', value: 1.6 },
      { level: 5, type: 'efficiency_bonus', value: 1.8 },
      // 解锁配方
      { level: 1, type: 'unlock_recipe', value: 'basic_materials' },
      { level: 2, type: 'unlock_recipe', value: 'components' },
      { level: 3, type: 'unlock_recipe', value: 'chemicals' },
      { level: 4, type: 'unlock_recipe', value: 'energy' },
      { level: 5, type: 'unlock_recipe', value: 'advanced' },
    ],
  },

  radio_tower: {
    id: 'radio_tower',
    name: 'Radio Tower',
    nameZh: '无线电台',
    maxLevel: 3,
    costs: [
      // L1: 100 Scrap + 30 Wood + 10 Metal = 420 VU - 解锁近郊探索 (降低成本使探索更早可用)
      { level: 1, resources: [{ resourceId: 'scrap', amount: 100 }, { resourceId: 'wood', amount: 30 }, { resourceId: 'metal', amount: 10 }], totalVU: 420 },
      // L2: 400 Scrap + 100 Wood + 50 Metal + 1 Chip = 2400 VU - 解锁更深地图
      { level: 2, resources: [{ resourceId: 'scrap', amount: 400 }, { resourceId: 'wood', amount: 100 }, { resourceId: 'metal', amount: 50 }, { resourceId: 'microchips', amount: 1 }], totalVU: 2400 },
      // L3: 1000 Scrap + 250 Wood + 120 Metal + 2 Chips = 5680 VU - 解锁核心区
      { level: 3, resources: [{ resourceId: 'scrap', amount: 1000 }, { resourceId: 'wood', amount: 250 }, { resourceId: 'metal', amount: 120 }, { resourceId: 'microchips', amount: 2 }], totalVU: 5680 },
    ],
    effects: [
      { level: 1, type: 'unlock_region', value: 'T1' }, // 近郊
      { level: 2, type: 'unlock_region', value: 'T2' }, // 外环
      { level: 3, type: 'unlock_region', value: 'T3' }, // 核心区
    ],
  },

  // ============================================
  // 生产建筑 (Production Buildings)
  // Requirements: 4.2
  // 效率倍率: 1 + 0.10 × (L-1)
  // 工人槽位: Water/Food max = 2 + 2L, Scrap max = 3 + 3L
  // ============================================
  water_collector: {
    id: 'water_collector',
    name: 'Water Collector',
    nameZh: '集水器',
    maxLevel: 5,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 40 }, { resourceId: 'wood', amount: 15 }], totalVU: 160 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 100 }, { resourceId: 'wood', amount: 30 }], totalVU: 340 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 220 }, { resourceId: 'wood', amount: 60 }, { resourceId: 'metal', amount: 10 }], totalVU: 860 },
      { level: 4, resources: [{ resourceId: 'scrap', amount: 450 }, { resourceId: 'wood', amount: 120 }, { resourceId: 'metal', amount: 30 }], totalVU: 2370 },
      { level: 5, resources: [{ resourceId: 'scrap', amount: 900 }, { resourceId: 'wood', amount: 240 }, { resourceId: 'metal', amount: 80 }], totalVU: 6180 },
    ],
    effects: [
      { level: 1, type: 'unlock_job', value: 'water_collector' },
      // 效率倍率
      { level: 1, type: 'efficiency_bonus', value: 1.0 },
      { level: 2, type: 'efficiency_bonus', value: 1.1 },
      { level: 3, type: 'efficiency_bonus', value: 1.2 },
      { level: 4, type: 'efficiency_bonus', value: 1.3 },
      { level: 5, type: 'efficiency_bonus', value: 1.4 },
    ],
  },

  trap: {
    id: 'trap',
    name: 'Trap',
    nameZh: '陷阱',
    maxLevel: 5,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 40 }, { resourceId: 'wood', amount: 15 }], totalVU: 160 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 100 }, { resourceId: 'wood', amount: 30 }], totalVU: 340 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 220 }, { resourceId: 'wood', amount: 60 }, { resourceId: 'metal', amount: 10 }], totalVU: 860 },
      { level: 4, resources: [{ resourceId: 'scrap', amount: 450 }, { resourceId: 'wood', amount: 120 }, { resourceId: 'metal', amount: 30 }], totalVU: 2370 },
      { level: 5, resources: [{ resourceId: 'scrap', amount: 900 }, { resourceId: 'wood', amount: 240 }, { resourceId: 'metal', amount: 80 }], totalVU: 6180 },
    ],
    effects: [
      { level: 1, type: 'unlock_job', value: 'hunter' },
      { level: 1, type: 'efficiency_bonus', value: 1.0 },
      { level: 2, type: 'efficiency_bonus', value: 1.1 },
      { level: 3, type: 'efficiency_bonus', value: 1.2 },
      { level: 4, type: 'efficiency_bonus', value: 1.3 },
      { level: 5, type: 'efficiency_bonus', value: 1.4 },
    ],
  },

  scavenge_post: {
    id: 'scavenge_post',
    name: 'Scavenge Post',
    nameZh: '拾荒站',
    maxLevel: 5,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 40 }, { resourceId: 'wood', amount: 15 }], totalVU: 160 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 100 }, { resourceId: 'wood', amount: 30 }], totalVU: 340 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 220 }, { resourceId: 'wood', amount: 60 }, { resourceId: 'metal', amount: 10 }], totalVU: 860 },
      { level: 4, resources: [{ resourceId: 'scrap', amount: 450 }, { resourceId: 'wood', amount: 120 }, { resourceId: 'metal', amount: 30 }], totalVU: 2370 },
      { level: 5, resources: [{ resourceId: 'scrap', amount: 900 }, { resourceId: 'wood', amount: 240 }, { resourceId: 'metal', amount: 80 }], totalVU: 6180 },
    ],
    effects: [
      { level: 1, type: 'unlock_job', value: 'scavenger' },
      { level: 1, type: 'efficiency_bonus', value: 1.0 },
      { level: 2, type: 'efficiency_bonus', value: 1.1 },
      { level: 3, type: 'efficiency_bonus', value: 1.2 },
      { level: 4, type: 'efficiency_bonus', value: 1.3 },
      { level: 5, type: 'efficiency_bonus', value: 1.4 },
    ],
  },

  // ============================================
  // 高级建筑 (Advanced Buildings)
  // ============================================
  greenhouse: {
    id: 'greenhouse',
    name: 'Greenhouse',
    nameZh: '温室',
    maxLevel: 3,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 200 }, { resourceId: 'wood', amount: 100 }, { resourceId: 'glass', amount: 20 }], totalVU: 1140 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 400 }, { resourceId: 'wood', amount: 200 }, { resourceId: 'glass', amount: 40 }, { resourceId: 'metal', amount: 20 }], totalVU: 2600 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 800 }, { resourceId: 'wood', amount: 400 }, { resourceId: 'glass', amount: 80 }, { resourceId: 'metal', amount: 50 }], totalVU: 5560 },
    ],
    effects: [
      { level: 1, type: 'unlock_recipe', value: 'farming' },
      { level: 1, type: 'efficiency_bonus', value: 1.0 },
      { level: 2, type: 'efficiency_bonus', value: 1.2 },
      { level: 3, type: 'efficiency_bonus', value: 1.4 },
    ],
    unlockTech: 'greenhouse_tech',
  },

  research_desk: {
    id: 'research_desk',
    name: 'Research Desk',
    nameZh: '研究台',
    maxLevel: 3,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 100 }, { resourceId: 'wood', amount: 50 }], totalVU: 500 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 250 }, { resourceId: 'wood', amount: 100 }, { resourceId: 'metal', amount: 20 }], totalVU: 1370 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 500 }, { resourceId: 'wood', amount: 200 }, { resourceId: 'metal', amount: 50 }], totalVU: 2900 },
    ],
    effects: [
      { level: 1, type: 'unlock_job', value: 'researcher' },
      { level: 1, type: 'efficiency_bonus', value: 1.0 },
      { level: 2, type: 'efficiency_bonus', value: 1.25 },
      { level: 3, type: 'efficiency_bonus', value: 1.5 },
    ],
  },

  generator: {
    id: 'generator',
    name: 'Generator',
    nameZh: '发电机',
    maxLevel: 3,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 300 }, { resourceId: 'metal', amount: 50 }, { resourceId: 'gear', amount: 5 }], totalVU: 1175 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 600 }, { resourceId: 'metal', amount: 100 }, { resourceId: 'gear', amount: 10 }, { resourceId: 'wire', amount: 10 }], totalVU: 2560 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 1200 }, { resourceId: 'metal', amount: 200 }, { resourceId: 'gear', amount: 20 }, { resourceId: 'wire', amount: 20 }], totalVU: 5120 },
    ],
    effects: [
      { level: 1, type: 'unlock_recipe', value: 'power' },
    ],
    unlockTech: 'power_generation',
  },

  solar_panel: {
    id: 'solar_panel',
    name: 'Solar Panel',
    nameZh: '太阳能板',
    maxLevel: 3,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 200 }, { resourceId: 'glass', amount: 30 }, { resourceId: 'wire', amount: 15 }, { resourceId: 'solar_cell', amount: 2 }], totalVU: 1235 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 400 }, { resourceId: 'glass', amount: 60 }, { resourceId: 'wire', amount: 30 }, { resourceId: 'solar_cell', amount: 4 }], totalVU: 2470 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 800 }, { resourceId: 'glass', amount: 120 }, { resourceId: 'wire', amount: 60 }, { resourceId: 'solar_cell', amount: 8 }], totalVU: 4940 },
    ],
    effects: [],
    unlockTech: 'solar_power',
  },

  battery_bank: {
    id: 'battery_bank',
    name: 'Battery Bank',
    nameZh: '电池组',
    maxLevel: 3,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 150 }, { resourceId: 'metal', amount: 30 }, { resourceId: 'battery_pack', amount: 2 }], totalVU: 834 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 300 }, { resourceId: 'metal', amount: 60 }, { resourceId: 'battery_pack', amount: 4 }], totalVU: 1668 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 600 }, { resourceId: 'metal', amount: 120 }, { resourceId: 'battery_pack', amount: 8 }], totalVU: 3336 },
    ],
    effects: [],
    unlockTech: 'energy_storage',
  },

  training_ground: {
    id: 'training_ground',
    name: 'Training Ground',
    nameZh: '训练场',
    maxLevel: 3,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 150 }, { resourceId: 'wood', amount: 80 }], totalVU: 790 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 300 }, { resourceId: 'wood', amount: 160 }, { resourceId: 'metal', amount: 30 }], totalVU: 1860 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 600 }, { resourceId: 'wood', amount: 320 }, { resourceId: 'metal', amount: 80 }], totalVU: 4440 },
    ],
    effects: [
      { level: 1, type: 'unlock_job', value: 'guard' },
      { level: 2, type: 'unlock_job', value: 'scout' },
    ],
    unlockTech: 'militia_training',
  },

  map_room: {
    id: 'map_room',
    name: 'Map Room',
    nameZh: '地图室',
    maxLevel: 3,
    costs: [
      { level: 1, resources: [{ resourceId: 'scrap', amount: 100 }, { resourceId: 'wood', amount: 60 }], totalVU: 580 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 250 }, { resourceId: 'wood', amount: 120 }, { resourceId: 'metal', amount: 20 }], totalVU: 1530 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 500 }, { resourceId: 'wood', amount: 240 }, { resourceId: 'metal', amount: 50 }], totalVU: 3220 },
    ],
    effects: [
      { level: 1, type: 'unlock_region', value: 'map_view' },
    ],
    unlockTech: 'cartography',
  },

  vanguard_camp: {
    id: 'vanguard_camp',
    name: 'Vanguard Camp',
    nameZh: '先锋营地',
    maxLevel: 3,
    costs: [
      // 需要在地图节点上建造
      { level: 1, resources: [{ resourceId: 'scrap', amount: 120 }, { resourceId: 'wood', amount: 60 }, { resourceId: 'metal', amount: 25 }], totalVU: 1000 },
      { level: 2, resources: [{ resourceId: 'scrap', amount: 300 }, { resourceId: 'wood', amount: 150 }, { resourceId: 'metal', amount: 60 }], totalVU: 2520 },
      { level: 3, resources: [{ resourceId: 'scrap', amount: 600 }, { resourceId: 'wood', amount: 300 }, { resourceId: 'metal', amount: 120 }], totalVU: 5040 },
    ],
    effects: [],
    unlockTech: 'vanguard_camp_1',
  },
};

/**
 * 计算Shelter第k个的成本
 * Cost(k) = Base × 1.25^(k-1)
 */
export function calculateShelterCost(k: number): number {
  const baseVU = 84;
  return Math.round(baseVU * Math.pow(1.25, k - 1));
}

/**
 * 计算建筑效率倍率
 * efficiency = 1 + 0.10 × (Level - 1)
 */
export function calculateEfficiencyMultiplier(level: number): number {
  return 1 + 0.10 * (level - 1);
}

/**
 * 计算工坊效率倍率
 * efficiency = 1 + 0.20 × (Level - 1)
 */
export function calculateWorkshopEfficiency(level: number): number {
  return 1 + 0.20 * (level - 1);
}

/**
 * 计算最大工人槽位
 * Water/Food: 2 + 2L
 * Scrap: 3 + 3L
 */
export function calculateMaxWorkerSlots(buildingId: BuildingId, level: number): number {
  if (buildingId === 'scavenge_post') {
    return 3 + 3 * level;
  }
  // water_collector, trap (hunter)
  return 2 + 2 * level;
}

/**
 * 获取建筑成本
 */
export function getBuildingCost(buildingId: BuildingId, level: number) {
  const building = BUILDINGS[buildingId];
  return building.costs.find(c => c.level === level);
}

/**
 * 获取建筑效果
 */
export function getBuildingEffects(buildingId: BuildingId, level: number) {
  const building = BUILDINGS[buildingId];
  return building.effects.filter(e => e.level <= level);
}
