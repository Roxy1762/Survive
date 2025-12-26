/**
 * 装备配置数据
 * Equipment Configuration Data
 * 
 * 武器、护甲、工具的定义
 * Requirements: 14.1, 15.1, 15.2, 16.1
 */

import type { ResourceAmount } from '../types';

// ============================================
// 装备类型定义 (Equipment Type Definitions)
// ============================================

/** 装备类型 */
export type EquipmentType = 'weapon' | 'armor' | 'tool';

/** 武器子类型 */
export type WeaponSubtype = 'melee' | 'ranged' | 'firearm';

/** 装备状态 */
export type EquipmentStatus = 'functional' | 'damaged' | 'broken';

/** 特殊效果类型 */
export type SpecialEffectType = 
  | 'ambush_bonus'      // 伏击加成
  | 'initiative_bonus'  // 先手加成
  | 'bleed_chance'      // 流血几率
  | 'accuracy_bonus'    // 命中加成
  | 'area_effect'       // 范围效果
  | 'cold_resistance'   // 寒冷抗性
  | 'movement_penalty'  // 移动惩罚
  | 'bleed_resistance'  // 流血抗性
  | 'infection_resistance' // 感染抗性
  | 'lock_success'      // 开锁成功率
  | 'workshop_efficiency' // 工坊效率
  | 'ambush_resistance' // 伏击抗性
  | 'water_purify'      // 净水效率
  | 'scavenger_bonus';  // 拾荒加成

/** 特殊效果 */
export interface SpecialEffect {
  type: SpecialEffectType;
  value: number; // 百分比或固定值
}

/** 弹药需求 */
export interface AmmoRequirement {
  ammoId: string;
  perUse: number;
}

// ============================================
// 基础装备定义 (Base Equipment Definition)
// ============================================

/** 装备配置基础接口 */
export interface EquipmentConfig {
  id: string;
  type: EquipmentType;
  name: string;
  nameZh: string;
  vu: number;
  maxDurability: number;
  atk?: number;
  def?: number;
  efficiency?: number;
  specialEffects?: SpecialEffect[];
  ammoRequirement?: AmmoRequirement;
  subtype?: WeaponSubtype;
  craftRecipe?: {
    inputs: ResourceAmount[];
    workRequired: number;
  };
}

/** 装备实例（带当前耐久度） */
export interface EquipmentInstance {
  instanceId: string;
  configId: string;
  durability: number;
  status: EquipmentStatus;
}

// ============================================
// 武器配置 (Weapon Configurations)
// Requirements: 15.1, 15.2
// ============================================

export const MELEE_WEAPONS: Record<string, EquipmentConfig> = {
  rusty_pipe: {
    id: 'rusty_pipe',
    type: 'weapon',
    subtype: 'melee',
    name: 'Rusty Pipe',
    nameZh: '生锈铁管',
    vu: 10, // 0-20 VU range, using midpoint
    maxDurability: 60,
    atk: 2,
  },
  scrap_dagger: {
    id: 'scrap_dagger',
    type: 'weapon',
    subtype: 'melee',
    name: 'Scrap Dagger',
    nameZh: '废铁匕首',
    vu: 24,
    maxDurability: 50,
    atk: 3,
    specialEffects: [{ type: 'ambush_bonus', value: 5 }],
  },
  spear: {
    id: 'spear',
    type: 'weapon',
    subtype: 'melee',
    name: 'Spear',
    nameZh: '简易长矛',
    vu: 36,
    maxDurability: 70,
    atk: 4,
    specialEffects: [{ type: 'initiative_bonus', value: 10 }],
  },
  nail_bat: {
    id: 'nail_bat',
    type: 'weapon',
    subtype: 'melee',
    name: 'Nail Bat',
    nameZh: '钉刺球棒',
    vu: 35,
    maxDurability: 80,
    atk: 5,
    specialEffects: [{ type: 'bleed_chance', value: 10 }],
  },
  scrap_crossbow: {
    id: 'scrap_crossbow',
    type: 'weapon',
    subtype: 'ranged',
    name: 'Scrap Crossbow',
    nameZh: '简易弩',
    vu: 33,
    maxDurability: 50,
    atk: 6,
    ammoRequirement: { ammoId: 'bolts', perUse: 1 },
  },
};

export const FIREARMS: Record<string, EquipmentConfig> = {
  pistol: {
    id: 'pistol',
    type: 'weapon',
    subtype: 'firearm',
    name: 'Pistol',
    nameZh: '手枪',
    vu: 84,
    maxDurability: 80,
    atk: 7,
    ammoRequirement: { ammoId: 'ammo_9mm', perUse: 1 },
  },
  shotgun: {
    id: 'shotgun',
    type: 'weapon',
    subtype: 'firearm',
    name: 'Shotgun',
    nameZh: '霰弹枪',
    vu: 130,
    maxDurability: 70,
    atk: 9,
    specialEffects: [{ type: 'area_effect', value: 1 }],
    ammoRequirement: { ammoId: 'ammo_12ga', perUse: 1 },
  },
  rifle: {
    id: 'rifle',
    type: 'weapon',
    subtype: 'firearm',
    name: 'Rifle',
    nameZh: '步枪',
    vu: 174,
    maxDurability: 100,
    atk: 10,
    specialEffects: [{ type: 'accuracy_bonus', value: 5 }],
    ammoRequirement: { ammoId: 'rifle_ammo', perUse: 1 },
  },
};

// ============================================
// 护甲配置 (Armor Configurations)
// Requirements: 16.1
// ============================================

export const ARMOR: Record<string, EquipmentConfig> = {
  rag_coat: {
    id: 'rag_coat',
    type: 'armor',
    name: 'Rag Coat',
    nameZh: '破布外套',
    vu: 8, // 0-15 VU range, using midpoint
    maxDurability: 80,
    def: 1,
  },
  leather_armor: {
    id: 'leather_armor',
    type: 'armor',
    name: 'Leather Armor',
    nameZh: '皮质护甲',
    vu: 23,
    maxDurability: 90,
    def: 2,
    specialEffects: [{ type: 'cold_resistance', value: 1 }],
  },
  scrap_plate: {
    id: 'scrap_plate',
    type: 'armor',
    name: 'Scrap Plate',
    nameZh: '废铁板甲',
    vu: 67,
    maxDurability: 100,
    def: 3,
    specialEffects: [{ type: 'movement_penalty', value: -5 }],
  },
  reinforced_armor: {
    id: 'reinforced_armor',
    type: 'armor',
    name: 'Reinforced Armor',
    nameZh: '加固护甲',
    vu: 79,
    maxDurability: 120,
    def: 4,
    specialEffects: [{ type: 'bleed_resistance', value: 10 }],
  },
  combat_armor: {
    id: 'combat_armor',
    type: 'armor',
    name: 'Combat Armor',
    nameZh: '战斗护甲',
    vu: 128,
    maxDurability: 150,
    def: 6,
    specialEffects: [{ type: 'infection_resistance', value: 10 }],
  },
};

// ============================================
// 工具配置 (Tool Configurations)
// Requirements: 14.1
// ============================================

export const TOOLS: Record<string, EquipmentConfig> = {
  shovel: {
    id: 'shovel',
    type: 'tool',
    name: 'Shovel',
    nameZh: '简易铲',
    vu: 27,
    maxDurability: 40,
    specialEffects: [{ type: 'scavenger_bonus', value: 10 }],
  },
  crowbar: {
    id: 'crowbar',
    type: 'tool',
    name: 'Crowbar',
    nameZh: '撬棍',
    vu: 18,
    maxDurability: 50,
    atk: 1, // +1 ATK temp
    specialEffects: [{ type: 'lock_success', value: 15 }],
  },
  multi_tool: {
    id: 'multi_tool',
    type: 'tool',
    name: 'Multi-tool',
    nameZh: '多用工具',
    vu: 29,
    maxDurability: 60,
    specialEffects: [{ type: 'workshop_efficiency', value: 15 }],
  },
  binoculars: {
    id: 'binoculars',
    type: 'tool',
    name: 'Binoculars',
    nameZh: '望远镜',
    vu: 18,
    maxDurability: 80,
    specialEffects: [{ type: 'ambush_resistance', value: 20 }],
  },
  lockpick_set: {
    id: 'lockpick_set',
    type: 'tool',
    name: 'Lockpick Set',
    nameZh: '开锁器',
    vu: 29,
    maxDurability: 30,
    specialEffects: [{ type: 'lock_success', value: 35 }],
  },
  portable_filter: {
    id: 'portable_filter',
    type: 'tool',
    name: 'Portable Filter',
    nameZh: '便携滤水器',
    vu: 27,
    maxDurability: 50,
    specialEffects: [{ type: 'water_purify', value: 80 }],
  },
  repair_kit: {
    id: 'repair_kit',
    type: 'tool',
    name: 'Repair Kit',
    nameZh: '修理包',
    vu: 22,
    maxDurability: 10, // 10 uses
    efficiency: 10, // restores 10 Dur per use
  },
};

// ============================================
// 弹药配置 (Ammunition Configurations)
// Requirements: 15.3
// ============================================

export interface AmmoConfig {
  id: string;
  name: string;
  nameZh: string;
  vu: number;
  amount: number; // per stack
  forWeapon: string[];
}

export const AMMUNITION: Record<string, AmmoConfig> = {
  ammo_9mm: {
    id: 'ammo_9mm',
    name: '9mm Rounds',
    nameZh: '9mm弹药',
    vu: 178,
    amount: 10,
    forWeapon: ['pistol'],
  },
  ammo_12ga: {
    id: 'ammo_12ga',
    name: '12GA Shells',
    nameZh: '12GA霰弹',
    vu: 242,
    amount: 10,
    forWeapon: ['shotgun'],
  },
  rifle_ammo: {
    id: 'rifle_ammo',
    name: 'Rifle Ammo',
    nameZh: '步枪弹药',
    vu: 224,
    amount: 10,
    forWeapon: ['rifle'],
  },
  bolts: {
    id: 'bolts',
    name: 'Crossbow Bolts',
    nameZh: '弩箭',
    vu: 50,
    amount: 10,
    forWeapon: ['scrap_crossbow'],
  },
};

// ============================================
// 合并所有装备配置
// ============================================

export const ALL_WEAPONS: Record<string, EquipmentConfig> = {
  ...MELEE_WEAPONS,
  ...FIREARMS,
};

export const ALL_EQUIPMENT: Record<string, EquipmentConfig> = {
  ...MELEE_WEAPONS,
  ...FIREARMS,
  ...ARMOR,
  ...TOOLS,
};

// ============================================
// 辅助函数 (Helper Functions)
// ============================================

/**
 * 获取装备配置
 */
export function getEquipmentConfig(equipmentId: string): EquipmentConfig | undefined {
  return ALL_EQUIPMENT[equipmentId];
}

/**
 * 获取武器配置
 */
export function getWeaponConfig(weaponId: string): EquipmentConfig | undefined {
  return ALL_WEAPONS[weaponId];
}

/**
 * 获取护甲配置
 */
export function getArmorConfig(armorId: string): EquipmentConfig | undefined {
  return ARMOR[armorId];
}

/**
 * 获取工具配置
 */
export function getToolConfig(toolId: string): EquipmentConfig | undefined {
  return TOOLS[toolId];
}

/**
 * 获取弹药配置
 */
export function getAmmoConfig(ammoId: string): AmmoConfig | undefined {
  return AMMUNITION[ammoId];
}

/**
 * 检查装备是否需要弹药
 */
export function requiresAmmo(equipmentId: string): boolean {
  const config = getEquipmentConfig(equipmentId);
  return config?.ammoRequirement !== undefined;
}

/**
 * 获取所有武器ID
 */
export function getAllWeaponIds(): string[] {
  return Object.keys(ALL_WEAPONS);
}

/**
 * 获取所有护甲ID
 */
export function getAllArmorIds(): string[] {
  return Object.keys(ARMOR);
}

/**
 * 获取所有工具ID
 */
export function getAllToolIds(): string[] {
  return Object.keys(TOOLS);
}

/**
 * 按类型获取装备
 */
export function getEquipmentByType(type: EquipmentType): EquipmentConfig[] {
  return Object.values(ALL_EQUIPMENT).filter(e => e.type === type);
}
