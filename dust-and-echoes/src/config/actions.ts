/**
 * 行动系统配置
 * Action System Configuration
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */

import type { ResourceId, Phase } from '../types';

// ============================================
// 行动类型定义
// Action Type Definitions
// ============================================

/** 行动类型 */
export type ActionType = 'short' | 'standard';

/** 行动ID - 短行动 (0.5 AU, 仅清晨/中午可用) */
export type ShortActionId =
  | 'organize_inventory'  // 整理库存
  | 'quick_scavenge'      // 快速拾荒
  | 'gather_wood'         // 收集木材
  | 'treat_wound'         // 治疗伤口
  | 'quick_cook'          // 快速烹饪
  | 'minor_repair'        // 小修理
  | 'purify_small';       // 少量净化

/** 行动ID - 标准行动 (1 AU, 所有阶段可用) */
export type StandardActionId =
  | 'salvage'             // 拆解
  | 'workshop_craft'      // 工坊制造
  | 'batch_ammo'          // 批量弹药
  | 'hunt'                // 狩猎
  | 'explore'             // 探索
  | 'trade'               // 贸易
  | 'research'            // 研究
  | 'build'               // 建造
  | 'assign_workers';     // 分配工人

/** 所有行动ID */
export type ActionId = ShortActionId | StandardActionId;

// ============================================
// 行动需求定义
// Action Requirement Definitions
// ============================================

/** 资源需求 */
export interface ResourceRequirement {
  resourceId: ResourceId;
  amount: number;
}

/** 建筑需求 */
export interface BuildingRequirement {
  buildingId: string;
  minLevel: number;
}

/** 行动需求 */
export interface ActionRequirements {
  /** 资源需求 */
  resources?: ResourceRequirement[];
  /** 建筑需求 */
  buildings?: BuildingRequirement[];
  /** 科技需求 */
  technologies?: string[];
  /** 工人需求 */
  minWorkers?: number;
  /** 特定岗位工人需求 */
  jobWorkers?: { jobId: string; minCount: number }[];
  /** 物品需求 */
  items?: { itemId: string; amount: number }[];
}

// ============================================
// 行动结果定义
// Action Result Definitions
// ============================================

/** 资源变化 */
export interface ResourceChange {
  resourceId: ResourceId;
  amount: number; // 正数为获得，负数为消耗
}

/** 行动结果 */
export interface ActionResult {
  success: boolean;
  message: string;
  messageZh: string;
  resourceChanges?: ResourceChange[];
  healthChanges?: { workerId: string; amount: number }[];
  statusEffects?: { workerId: string; effectType: string; action: 'add' | 'remove' }[];
  durabilityChanges?: { equipmentId: string; amount: number }[];
  unlocks?: { type: string; id: string }[];
}

// ============================================
// 行动定义
// Action Definitions
// ============================================

/** 行动定义 */
export interface ActionDefinition {
  id: ActionId;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  type: ActionType;
  auCost: number;
  /** 允许执行的阶段 (null = 所有阶段) */
  allowedPhases: Phase[] | null;
  /** 行动需求 */
  requirements: ActionRequirements;
  /** 是否可重复执行 */
  repeatable: boolean;
  /** 冷却时间 (阶段数) */
  cooldownPhases?: number;
}

// ============================================
// 短行动配置 (0.5 AU)
// Short Actions Configuration
// ============================================

/** 短行动允许的阶段 - 现在所有阶段都可以执行短行动 */
export const SHORT_ACTION_PHASES: Phase[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'];

/** 短行动AU成本 */
export const SHORT_ACTION_AU_COST = 0.5;

/** 短行动定义 */
export const SHORT_ACTIONS: Record<ShortActionId, ActionDefinition> = {
  organize_inventory: {
    id: 'organize_inventory',
    name: 'Organize Inventory',
    nameZh: '整理库存',
    description: 'Sort perishables and damaged items',
    descriptionZh: '整理易腐物品和损坏物品',
    type: 'short',
    auCost: SHORT_ACTION_AU_COST,
    allowedPhases: null, // 所有阶段可用
    requirements: {},
    repeatable: true,
  },
  quick_scavenge: {
    id: 'quick_scavenge',
    name: 'Quick Scavenge',
    nameZh: '快速拾荒',
    description: 'Quickly gather small amounts of scrap with chance for materials',
    descriptionZh: '快速收集少量废料，有机会获得材料',
    type: 'short',
    auCost: SHORT_ACTION_AU_COST,
    allowedPhases: null, // 所有阶段可用
    requirements: {},
    repeatable: true,
  },
  gather_wood: {
    id: 'gather_wood',
    name: 'Gather Wood',
    nameZh: '收集木材',
    description: 'Gather wood from nearby debris and fallen structures',
    descriptionZh: '从附近的废墟和倒塌建筑中收集木材',
    type: 'short',
    auCost: SHORT_ACTION_AU_COST,
    allowedPhases: null, // 所有阶段可用
    requirements: {},
    repeatable: true,
  },
  treat_wound: {
    id: 'treat_wound',
    name: 'Treat Wound',
    nameZh: '治疗伤口',
    description: 'Use bandage or antiseptic to treat wounds',
    descriptionZh: '使用绷带或消毒剂治疗伤口',
    type: 'short',
    auCost: SHORT_ACTION_AU_COST,
    allowedPhases: null, // 所有阶段可用
    requirements: {},
    repeatable: true,
  },
  quick_cook: {
    id: 'quick_cook',
    name: 'Quick Cook',
    nameZh: '快速烹饪',
    description: 'Convert raw meat or vegetables to food (low efficiency)',
    descriptionZh: '将生肉或蔬菜转化为食物（低效率）',
    type: 'short',
    auCost: SHORT_ACTION_AU_COST,
    allowedPhases: null, // 所有阶段可用
    requirements: {
      resources: [{ resourceId: 'raw_meat', amount: 1 }],
    },
    repeatable: true,
  },
  minor_repair: {
    id: 'minor_repair',
    name: 'Minor Repair',
    nameZh: '小修理',
    description: 'Use repair kit to restore 5 durability',
    descriptionZh: '使用修理包恢复5点耐久',
    type: 'short',
    auCost: SHORT_ACTION_AU_COST,
    allowedPhases: null, // 所有阶段可用
    requirements: {},
    repeatable: true,
  },
  purify_small: {
    id: 'purify_small',
    name: 'Purify Small Amount',
    nameZh: '少量净化',
    description: 'Convert dirty water to clean water (small amount)',
    descriptionZh: '将脏水转化为净水（少量）',
    type: 'short',
    auCost: SHORT_ACTION_AU_COST,
    allowedPhases: null, // 所有阶段可用
    requirements: {
      resources: [{ resourceId: 'dirty_water', amount: 2 }],
    },
    repeatable: true,
  },
};

// ============================================
// 标准行动配置 (1 AU)
// Standard Actions Configuration
// ============================================

/** 标准行动AU成本 */
export const STANDARD_ACTION_AU_COST = 1.0;

/** 标准行动定义 */
export const STANDARD_ACTIONS: Record<StandardActionId, ActionDefinition> = {
  salvage: {
    id: 'salvage',
    name: 'Salvage',
    nameZh: '拆解',
    description: 'Break down equipment or junk into materials (20-40% value)',
    descriptionZh: '将装备或废品拆解为材料（20-40%价值）',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {},
    repeatable: true,
  },
  workshop_craft: {
    id: 'workshop_craft',
    name: 'Workshop Craft',
    nameZh: '工坊制造',
    description: 'Craft materials, chemicals, or equipment at the workshop',
    descriptionZh: '在工坊制造材料、化工品或装备',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {
      buildings: [{ buildingId: 'workshop', minLevel: 1 }],
    },
    repeatable: true,
  },
  batch_ammo: {
    id: 'batch_ammo',
    name: 'Batch Ammo',
    nameZh: '批量弹药',
    description: 'Produce 10 rounds of ammunition per batch',
    descriptionZh: '每批生产10发弹药',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {
      buildings: [{ buildingId: 'workshop', minLevel: 2 }],
    },
    repeatable: true,
  },
  hunt: {
    id: 'hunt',
    name: 'Hunt',
    nameZh: '狩猎',
    description: 'Hunt for raw meat and food',
    descriptionZh: '狩猎获取生肉和食物',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {},
    repeatable: true,
  },
  explore: {
    id: 'explore',
    name: 'Explore',
    nameZh: '探索',
    description: 'Enter a map node to explore (T1 areas available, further areas need Radio Tower)',
    descriptionZh: '进入地图节点探索（T1区域可直接探索，更远区域需要无线电台）',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {
      // 移除电塔需求，T1区域可直接探索
    },
    repeatable: true,
  },
  trade: {
    id: 'trade',
    name: 'Trade',
    nameZh: '贸易',
    description: 'Exchange resources with traders',
    descriptionZh: '与商人交换资源',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {
      buildings: [{ buildingId: 'radio_tower', minLevel: 1 }],
    },
    repeatable: true,
  },
  research: {
    id: 'research',
    name: 'Research',
    nameZh: '研究',
    description: 'Spend research points on technology',
    descriptionZh: '消耗研究点进行科技研究',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {
      buildings: [{ buildingId: 'research_desk', minLevel: 1 }],
    },
    repeatable: true,
  },
  build: {
    id: 'build',
    name: 'Build',
    nameZh: '建造',
    description: 'Construct or upgrade buildings',
    descriptionZh: '建造或升级建筑',
    type: 'standard',
    auCost: STANDARD_ACTION_AU_COST,
    allowedPhases: null,
    requirements: {},
    repeatable: true,
  },
  assign_workers: {
    id: 'assign_workers',
    name: 'Assign Workers',
    nameZh: '分配工人',
    description: 'Change job assignments for workers (free action)',
    descriptionZh: '更改工人的岗位分配（免费行动）',
    type: 'standard',
    auCost: 0, // Requirements 2.2: Worker assignment does NOT consume AU
    allowedPhases: null,
    requirements: {},
    repeatable: true,
  },
};

// ============================================
// 所有行动配置
// All Actions Configuration
// ============================================

/** 所有行动定义 */
export const ACTIONS: Record<ActionId, ActionDefinition> = {
  ...SHORT_ACTIONS,
  ...STANDARD_ACTIONS,
};

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 获取行动定义
 */
export function getActionById(actionId: ActionId): ActionDefinition | undefined {
  return ACTIONS[actionId];
}

/**
 * 检查行动是否为短行动
 */
export function isShortAction(actionId: ActionId): boolean {
  return actionId in SHORT_ACTIONS;
}

/**
 * 检查行动是否为标准行动
 */
export function isStandardAction(actionId: ActionId): boolean {
  return actionId in STANDARD_ACTIONS;
}

/**
 * 获取所有短行动ID
 */
export function getShortActionIds(): ShortActionId[] {
  return Object.keys(SHORT_ACTIONS) as ShortActionId[];
}

/**
 * 获取所有标准行动ID
 */
export function getStandardActionIds(): StandardActionId[] {
  return Object.keys(STANDARD_ACTIONS) as StandardActionId[];
}

/**
 * 检查阶段是否允许短行动
 * Requirements: 17.1 - 短行动仅清晨/中午可用
 */
export function canPerformShortActionInPhase(phase: Phase): boolean {
  return SHORT_ACTION_PHASES.includes(phase);
}

/**
 * 检查阶段是否允许执行特定行动
 */
export function canPerformActionInPhase(actionId: ActionId, phase: Phase): boolean {
  const action = getActionById(actionId);
  if (!action) return false;
  
  // 如果 allowedPhases 为 null，表示所有阶段都可以
  if (action.allowedPhases === null) return true;
  
  return action.allowedPhases.includes(phase);
}

/**
 * 获取当前阶段可用的行动列表
 */
export function getAvailableActionsForPhase(phase: Phase): ActionDefinition[] {
  return Object.values(ACTIONS).filter(action => 
    canPerformActionInPhase(action.id, phase)
  );
}

/**
 * 获取行动的AU成本
 */
export function getActionAUCost(actionId: ActionId): number {
  const action = getActionById(actionId);
  return action?.auCost ?? 0;
}
