/**
 * 资源配置数据
 * Resource Configuration Data
 * 
 * 所有资源的VU值和属性定义
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import type { Resource, ResourceId } from '../types';

/**
 * 资源配置常量
 * 
 * VU (Value Unit) 价值体系:
 * - 1 VU = 1 Scrap (废料)
 * - 1 Work = 0.25 VU
 * - 工程师 1人/1AU 产出 60 Work = 15 VU
 */
export const RESOURCES: Record<ResourceId, Resource> = {
  // ============================================
  // 一级资源 (Primary Resources)
  // Requirements: 2.1
  // ============================================
  scrap: {
    id: 'scrap',
    name: 'Scrap',
    nameZh: '废料',
    vu: 1,
    category: 'primary',
  },
  water: {
    id: 'water',
    name: 'Water',
    nameZh: '净水',
    vu: 5,
    category: 'primary',
  },
  dirty_water: {
    id: 'dirty_water',
    name: 'Dirty Water',
    nameZh: '脏水',
    vu: 3,
    category: 'primary',
  },
  food: {
    id: 'food',
    name: 'Food',
    nameZh: '口粮',
    vu: 4.167, // 25/6 ≈ 4.167
    category: 'primary',
  },
  raw_meat: {
    id: 'raw_meat',
    name: 'Raw Meat',
    nameZh: '生肉',
    vu: 3,
    category: 'primary',
    perishable: true,
  },
  canned_food: {
    id: 'canned_food',
    name: 'Canned Food',
    nameZh: '罐头',
    vu: 14.5,
    category: 'primary',
  },
  vegetables: {
    id: 'vegetables',
    name: 'Vegetables',
    nameZh: '蔬菜',
    vu: 4,
    category: 'primary',
    perishable: true,
  },
  seeds: {
    id: 'seeds',
    name: 'Seeds',
    nameZh: '种子',
    vu: 20,
    category: 'primary',
  },
  fertilizer: {
    id: 'fertilizer',
    name: 'Fertilizer',
    nameZh: '肥料',
    vu: 18,
    category: 'primary',
  },

  // ============================================
  // 二级材料 (Secondary Materials)
  // Requirements: 2.2
  // 配方: Scrap + Work → Material
  // VU = Scrap_VU + Work × 0.25
  // ============================================
  wood: {
    id: 'wood',
    name: 'Wood',
    nameZh: '木材',
    vu: 8, // 4 Scrap (4 VU) + 16 Work (4 VU) = 8 VU
    category: 'secondary',
  },
  metal: {
    id: 'metal',
    name: 'Metal',
    nameZh: '金属',
    vu: 16, // 8 Scrap (8 VU) + 32 Work (8 VU) = 16 VU
    category: 'secondary',
  },
  cloth: {
    id: 'cloth',
    name: 'Cloth',
    nameZh: '布料',
    vu: 5, // 3 Scrap (3 VU) + 8 Work (2 VU) = 5 VU
    category: 'secondary',
  },
  leather: {
    id: 'leather',
    name: 'Leather',
    nameZh: '皮革',
    vu: 7, // 4 Scrap (4 VU) + 12 Work (3 VU) = 7 VU
    category: 'secondary',
  },
  plastic: {
    id: 'plastic',
    name: 'Plastic',
    nameZh: '塑料',
    vu: 7, // 4 Scrap (4 VU) + 12 Work (3 VU) = 7 VU
    category: 'secondary',
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    nameZh: '玻璃',
    vu: 7, // 4 Scrap (4 VU) + 12 Work (3 VU) = 7 VU
    category: 'secondary',
  },
  rubber: {
    id: 'rubber',
    name: 'Rubber',
    nameZh: '橡胶',
    vu: 9, // 5 Scrap (5 VU) + 16 Work (4 VU) = 9 VU
    category: 'secondary',
  },
  wire: {
    id: 'wire',
    name: 'Wire',
    nameZh: '线材',
    vu: 11, // 6 Scrap (6 VU) + 20 Work (5 VU) = 11 VU
    category: 'secondary',
  },
  rope: {
    id: 'rope',
    name: 'Rope',
    nameZh: '绳索',
    vu: 7, // 1 Cloth (5 VU) + 8 Work (2 VU) = 7 VU
    category: 'secondary',
  },
  duct_tape: {
    id: 'duct_tape',
    name: 'Duct Tape',
    nameZh: '胶带',
    vu: 14, // 1 Plastic (7 VU) + 1 Cloth (5 VU) + 8 Work (2 VU) = 14 VU
    category: 'secondary',
  },

  // ============================================
  // 组件 (Components)
  // Requirements: 2.3
  // ============================================
  gear: {
    id: 'gear',
    name: 'Gear',
    nameZh: '机械齿轮',
    vu: 15, // 8 Scrap (8 VU) + 28 Work (7 VU) = 15 VU
    category: 'component',
  },
  pipe: {
    id: 'pipe',
    name: 'Pipe',
    nameZh: '管件',
    vu: 15, // 8 Scrap (8 VU) + 28 Work (7 VU) = 15 VU
    category: 'component',
  },
  spring: {
    id: 'spring',
    name: 'Spring',
    nameZh: '弹簧',
    vu: 12, // 6 Scrap (6 VU) + 24 Work (6 VU) = 12 VU
    category: 'component',
  },
  bearing: {
    id: 'bearing',
    name: 'Bearing',
    nameZh: '轴承',
    vu: 18, // 10 Scrap (10 VU) + 32 Work (8 VU) = 18 VU
    category: 'component',
  },
  fasteners: {
    id: 'fasteners',
    name: 'Fasteners',
    nameZh: '紧固件',
    vu: 6, // 4 Scrap (4 VU) + 8 Work (2 VU) = 6 VU
    category: 'component',
  },

  // ============================================
  // 化工材料 (Chemicals)
  // Requirements: 2.4
  // ============================================
  solvent: {
    id: 'solvent',
    name: 'Solvent',
    nameZh: '溶剂',
    vu: 22, // 10 Scrap (10 VU) + 24 Work (6 VU) + 2 Dirty_Water (6 VU) = 22 VU
    category: 'chemical',
  },
  acid: {
    id: 'acid',
    name: 'Acid',
    nameZh: '强酸',
    vu: 25, // 1 Solvent (22 VU) + 12 Work (3 VU) = 25 VU
    category: 'chemical',
  },
  gunpowder: {
    id: 'gunpowder',
    name: 'Gunpowder',
    nameZh: '火药',
    vu: 33, // 1 Solvent (22 VU) + 6 Scrap (6 VU) + 20 Work (5 VU) = 33 VU
    category: 'chemical',
  },
  fuel: {
    id: 'fuel',
    name: 'Fuel',
    nameZh: '燃料',
    vu: 42, // 12 Scrap (12 VU) + 32 Work (8 VU) + 1 Solvent (22 VU) = 42 VU
    category: 'chemical',
  },

  // ============================================
  // 能源组件 (Energy Components)
  // Requirements: 2.5
  // ============================================
  battery_cell: {
    id: 'battery_cell',
    name: 'Battery Cell',
    nameZh: '电芯',
    vu: 45, // 1 Metal (16 VU) + 1 Acid (25 VU) + 16 Work (4 VU) = 45 VU
    category: 'energy',
  },
  battery_pack: {
    id: 'battery_pack',
    name: 'Battery Pack',
    nameZh: '电池包',
    vu: 102, // 2 Battery_Cell (90 VU) + 1 Plastic (7 VU) + 20 Work (5 VU) = 102 VU
    category: 'energy',
  },
  filter: {
    id: 'filter',
    name: 'Filter',
    nameZh: '过滤芯',
    vu: 17, // 1 Cloth (5 VU) + 1 Rubber (9 VU) + 12 Work (3 VU) = 17 VU
    category: 'energy',
  },
  seal_ring: {
    id: 'seal_ring',
    name: 'Seal Ring',
    nameZh: '密封圈',
    vu: 11, // 1 Rubber (9 VU) + 8 Work (2 VU) = 11 VU
    category: 'energy',
  },

  // ============================================
  // 三级稀有资源 (Rare/Tech Resources)
  // Requirements: 2.6
  // 主要来源: 探索/贸易
  // ============================================
  meds: {
    id: 'meds',
    name: 'Meds',
    nameZh: '药品',
    vu: 320,
    category: 'rare',
  },
  data_tape: {
    id: 'data_tape',
    name: 'Data Tape',
    nameZh: '数据磁带',
    vu: 160, // T2-T4探索
    category: 'rare',
  },
  radio_parts: {
    id: 'radio_parts',
    name: 'Radio Parts',
    nameZh: '无线电组件',
    vu: 240, // T3探索
    category: 'rare',
  },
  solar_cell: {
    id: 'solar_cell',
    name: 'Solar Cell',
    nameZh: '太阳能板',
    vu: 320, // T4探索
    category: 'rare',
  },
  rare_alloy: {
    id: 'rare_alloy',
    name: 'Rare Alloy',
    nameZh: '稀有合金',
    vu: 400, // T4-T5探索
    category: 'rare',
  },
  microchips: {
    id: 'microchips',
    name: 'Microchips',
    nameZh: '旧世界芯片',
    vu: 640, // T3-T4探索
    category: 'rare',
  },
  nanofiber: {
    id: 'nanofiber',
    name: 'Nanofiber',
    nameZh: '纳米纤维',
    vu: 800, // T5探索
    category: 'rare',
  },
  power_core: {
    id: 'power_core',
    name: 'Power Core',
    nameZh: '能源核心',
    vu: 2560, // T5探索
    category: 'rare',
  },
};

/**
 * 获取资源VU值
 */
export function getResourceVU(resourceId: ResourceId): number {
  return RESOURCES[resourceId].vu;
}

/**
 * 获取资源类别
 */
export function getResourceCategory(resourceId: ResourceId): string {
  return RESOURCES[resourceId].category;
}

/**
 * 检查资源是否易腐
 */
export function isPerishable(resourceId: ResourceId): boolean {
  return RESOURCES[resourceId].perishable === true;
}

/**
 * 获取所有资源ID列表
 */
export function getAllResourceIds(): ResourceId[] {
  return Object.keys(RESOURCES) as ResourceId[];
}

/**
 * 按类别获取资源
 */
export function getResourcesByCategory(category: string): Resource[] {
  return Object.values(RESOURCES).filter(r => r.category === category);
}

/**
 * 获取资源中文名
 */
export function getResourceNameZh(resourceId: ResourceId): string {
  return RESOURCES[resourceId]?.nameZh ?? resourceId;
}
