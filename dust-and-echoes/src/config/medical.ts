/**
 * 医疗物品与状态效果配置
 * Medical Items and Status Effects Configuration
 * 
 * Requirements: 13.2, 13.3
 */

import type { StatusEffectType, StatusSeverity } from '../types';

// ============================================
// 状态效果配置 (Status Effect Configuration)
// Requirements: 13.2
// ============================================

/** 状态效果每AU健康变化 */
export const STATUS_HEALTH_DAMAGE: Record<StatusEffectType, number> = {
  bleed: 5,      // 流血: 每AU -5 Health
  infection: 3,  // 感染: 每AU -3 Health
  poisoned: 2,   // 中毒: 每AU -2 Health
  radiation: 1,  // 辐射: 每AU -1 Health
};

/** 状态效果描述 */
export const STATUS_DESCRIPTIONS: Record<StatusEffectType, { name: string; nameZh: string; description: string }> = {
  bleed: {
    name: 'Bleeding',
    nameZh: '流血',
    description: 'Loses 5 Health per AU until treated with Bandage',
  },
  infection: {
    name: 'Infection',
    nameZh: '感染',
    description: 'Loses 3 Health per AU, spreads if untreated',
  },
  poisoned: {
    name: 'Poisoned',
    nameZh: '中毒',
    description: 'Loses 2 Health per AU, reduced efficiency',
  },
  radiation: {
    name: 'Radiation',
    nameZh: '辐射',
    description: 'Loses 1 Health per AU, cumulative damage',
  },
};

/** 中毒效率惩罚 */
export const POISONED_EFFICIENCY_PENALTY = 0.2; // 20% efficiency reduction

// ============================================
// 医疗物品配置 (Medical Item Configuration)
// Requirements: 13.3
// ============================================

/** 医疗物品类型 */
export type MedicalItemId = 
  | 'bandage'      // 绷带
  | 'antiseptic'   // 消毒剂
  | 'painkillers'  // 止痛片
  | 'medkit'       // 医疗包
  | 'meds'         // 药品
  | 'stimulant'    // 兴奋剂
  | 'antitoxin';   // 解毒剂

/** 医疗物品效果 */
export interface MedicalItemEffect {
  healthRestore?: number;           // 恢复健康值
  clearsStatus?: StatusEffectType[]; // 清除的状态效果
  clearsSeverity?: StatusSeverity;   // 可清除的最大严重程度
  moraleChange?: number;             // 士气变化
  efficiencyBoost?: number;          // 效率提升 (百分比)
  efficiencyDuration?: number;       // 效率提升持续时间 (AU)
  damageReduction?: number;          // 伤害减免 (百分比)
  damageDuration?: number;           // 伤害减免持续时间 (AU)
  immunity?: number;                 // 免疫时间 (AU)
  sideEffectHealthLoss?: number;     // 副作用健康损失
  sideEffectDelay?: number;          // 副作用延迟 (AU)
}

/** 医疗物品配置 */
export interface MedicalItemConfig {
  id: MedicalItemId;
  name: string;
  nameZh: string;
  vu: number;
  effects: MedicalItemEffect;
  description: string;
  descriptionZh: string;
}

/** 医疗物品配置表 */
export const MEDICAL_ITEMS: Record<MedicalItemId, MedicalItemConfig> = {
  bandage: {
    id: 'bandage',
    name: 'Bandage',
    nameZh: '绷带',
    vu: 6,
    effects: {
      healthRestore: 8,
      clearsStatus: ['bleed'],
      clearsSeverity: 'severe', // Can clear any severity of bleed
    },
    description: 'Stops bleeding and restores 8 Health',
    descriptionZh: '止血并恢复8点健康值',
  },
  antiseptic: {
    id: 'antiseptic',
    name: 'Antiseptic',
    nameZh: '消毒剂',
    vu: 24,
    effects: {
      healthRestore: 5,
      clearsStatus: ['infection'],
      clearsSeverity: 'light', // Only clears light infection
    },
    description: 'Clears light infection and restores 5 Health',
    descriptionZh: '清除轻度感染并恢复5点健康值',
  },
  painkillers: {
    id: 'painkillers',
    name: 'Painkillers',
    nameZh: '止痛片',
    vu: 9,
    effects: {
      damageReduction: 50, // Halves damage this AU
      damageDuration: 1,
      moraleChange: 1,
    },
    description: 'Halves damage for 1 AU and +1 Morale',
    descriptionZh: '1AU内伤害减半，士气+1',
  },
  medkit: {
    id: 'medkit',
    name: 'Medkit',
    nameZh: '医疗包',
    vu: 41,
    effects: {
      healthRestore: 35,
      clearsStatus: ['infection'],
      clearsSeverity: 'medium', // Clears medium infection
    },
    description: 'Restores 35 Health and clears medium infection',
    descriptionZh: '恢复35点健康值，清除中度感染',
  },
  meds: {
    id: 'meds',
    name: 'Meds',
    nameZh: '药品',
    vu: 320,
    effects: {
      healthRestore: 80,
      clearsStatus: ['infection'],
      clearsSeverity: 'severe', // Clears severe infection
      immunity: 1, // 1 AU immunity
    },
    description: 'Restores 80 Health, clears severe infection, 1 AU immunity',
    descriptionZh: '恢复80点健康值，清除重度感染，1AU免疫',
  },
  stimulant: {
    id: 'stimulant',
    name: 'Stimulant',
    nameZh: '兴奋剂',
    vu: 30,
    effects: {
      efficiencyBoost: 20, // +20% efficiency
      efficiencyDuration: 1, // for 1 AU
      sideEffectHealthLoss: 10, // -10 Health after
      sideEffectDelay: 1, // after 1 AU
    },
    description: '+20% efficiency for 1 AU, then -10 Health',
    descriptionZh: '1AU内效率+20%，之后健康-10',
  },
  antitoxin: {
    id: 'antitoxin',
    name: 'Antitoxin',
    nameZh: '解毒剂',
    vu: 45,
    effects: {
      clearsStatus: ['poisoned', 'radiation'],
      clearsSeverity: 'medium', // Clears poisoned (any severity) and light radiation
    },
    description: 'Clears Poisoned and light Radiation',
    descriptionZh: '清除中毒和轻度辐射',
  },
};

// ============================================
// 辅助函数 (Helper Functions)
// ============================================

/**
 * 获取医疗物品配置
 */
export function getMedicalItemConfig(itemId: MedicalItemId): MedicalItemConfig | undefined {
  return MEDICAL_ITEMS[itemId];
}

/**
 * 获取所有医疗物品ID
 */
export function getAllMedicalItemIds(): MedicalItemId[] {
  return Object.keys(MEDICAL_ITEMS) as MedicalItemId[];
}

/**
 * 检查医疗物品是否可以清除指定状态
 */
export function canClearStatus(
  itemId: MedicalItemId,
  statusType: StatusEffectType,
  severity: StatusSeverity
): boolean {
  const config = MEDICAL_ITEMS[itemId];
  if (!config) return false;
  
  const { clearsStatus, clearsSeverity } = config.effects;
  if (!clearsStatus || !clearsStatus.includes(statusType)) return false;
  if (!clearsSeverity) return false;
  
  const severityOrder: StatusSeverity[] = ['light', 'medium', 'severe'];
  const maxSeverityIndex = severityOrder.indexOf(clearsSeverity);
  const currentSeverityIndex = severityOrder.indexOf(severity);
  
  return currentSeverityIndex <= maxSeverityIndex;
}

/**
 * 计算状态效果造成的健康损失
 */
export function calculateStatusHealthDamage(
  statusType: StatusEffectType,
  phaseAU: number
): number {
  return STATUS_HEALTH_DAMAGE[statusType] * phaseAU;
}

/**
 * 获取状态效果描述
 */
export function getStatusDescription(statusType: StatusEffectType): { name: string; nameZh: string; description: string } {
  return STATUS_DESCRIPTIONS[statusType];
}
