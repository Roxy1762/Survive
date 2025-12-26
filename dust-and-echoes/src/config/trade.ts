/**
 * 贸易系统配置数据
 * Trade System Configuration Data
 * 
 * Requirements: 19.1, 19.2
 */

import type { ResourceId, Phase, Trader, TraderInventoryItem } from '../types';
import { getResourceVU } from './resources';

// ============================================
// 贸易价格常量
// Trade Price Constants
// Requirements: 19.2
// ============================================

/** 买入价格倍率 (玩家从商人处购买) */
export const BUY_PRICE_MULTIPLIER = 1.3;

/** 卖出价格倍率 (玩家向商人出售) */
export const SELL_PRICE_MULTIPLIER = 0.7;

// ============================================
// 价格计算函数
// Price Calculation Functions
// Requirements: 19.2
// ============================================

/**
 * 计算资源买入价格 (玩家从商人处购买)
 * Buy price = VU × 1.3
 */
export function calculateBuyPrice(resourceId: ResourceId): number {
  const vu = getResourceVU(resourceId);
  return Math.round(vu * BUY_PRICE_MULTIPLIER * 100) / 100;
}

/**
 * 计算资源卖出价格 (玩家向商人出售)
 * Sell price = VU × 0.7
 */
export function calculateSellPrice(resourceId: ResourceId): number {
  const vu = getResourceVU(resourceId);
  return Math.round(vu * SELL_PRICE_MULTIPLIER * 100) / 100;
}

/**
 * 计算指定VU值的买入价格
 */
export function calculateBuyPriceFromVU(vu: number): number {
  return Math.round(vu * BUY_PRICE_MULTIPLIER * 100) / 100;
}

/**
 * 计算指定VU值的卖出价格
 */
export function calculateSellPriceFromVU(vu: number): number {
  return Math.round(vu * SELL_PRICE_MULTIPLIER * 100) / 100;
}

// ============================================
// 商人模板
// Trader Templates
// Requirements: 19.1
// ============================================

/** 商人类型 */
export type TraderType = 'wandering' | 'caravan' | 'black_market' | 'specialist';

/** 商人模板定义 */
export interface TraderTemplate {
  id: string;
  name: string;
  nameZh: string;
  type: TraderType;
  /** 可能出售的资源及其数量范围 */
  possibleInventory: {
    resourceId: ResourceId;
    minAmount: number;
    maxAmount: number;
    probability: number; // 0-1, 出现概率
  }[];
  /** 商人停留的阶段数 */
  stayDuration: number;
  /** 出现条件 */
  requirements?: {
    minRadioTowerLevel?: number;
    phases?: Phase[]; // 只在特定阶段出现
  };
}

/** 商人模板配置 */
export const TRADER_TEMPLATES: TraderTemplate[] = [
  {
    id: 'wandering_merchant',
    name: 'Wandering Merchant',
    nameZh: '流浪商人',
    type: 'wandering',
    possibleInventory: [
      { resourceId: 'water', minAmount: 5, maxAmount: 15, probability: 0.8 },
      { resourceId: 'food', minAmount: 5, maxAmount: 12, probability: 0.8 },
      { resourceId: 'scrap', minAmount: 10, maxAmount: 30, probability: 0.9 },
      { resourceId: 'cloth', minAmount: 2, maxAmount: 6, probability: 0.5 },
      { resourceId: 'rope', minAmount: 1, maxAmount: 4, probability: 0.4 },
    ],
    stayDuration: 2,
    requirements: {
      minRadioTowerLevel: 1,
    },
  },
  {
    id: 'supply_caravan',
    name: 'Supply Caravan',
    nameZh: '补给商队',
    type: 'caravan',
    possibleInventory: [
      { resourceId: 'water', minAmount: 15, maxAmount: 30, probability: 0.9 },
      { resourceId: 'food', minAmount: 12, maxAmount: 25, probability: 0.9 },
      { resourceId: 'canned_food', minAmount: 3, maxAmount: 8, probability: 0.6 },
      { resourceId: 'wood', minAmount: 8, maxAmount: 20, probability: 0.7 },
      { resourceId: 'metal', minAmount: 4, maxAmount: 12, probability: 0.5 },
      { resourceId: 'seeds', minAmount: 1, maxAmount: 3, probability: 0.3 },
    ],
    stayDuration: 3,
    requirements: {
      minRadioTowerLevel: 1,
    },
  },
  {
    id: 'black_market_dealer',
    name: 'Black Market Dealer',
    nameZh: '黑市商人',
    type: 'black_market',
    possibleInventory: [
      { resourceId: 'gunpowder', minAmount: 2, maxAmount: 6, probability: 0.6 },
      { resourceId: 'fuel', minAmount: 2, maxAmount: 5, probability: 0.5 },
      { resourceId: 'meds', minAmount: 1, maxAmount: 2, probability: 0.3 },
      { resourceId: 'microchips', minAmount: 1, maxAmount: 1, probability: 0.1 },
      { resourceId: 'acid', minAmount: 1, maxAmount: 3, probability: 0.4 },
    ],
    stayDuration: 1,
    requirements: {
      minRadioTowerLevel: 1,
      phases: ['evening', 'midnight'],
    },
  },
  {
    id: 'tech_specialist',
    name: 'Tech Specialist',
    nameZh: '科技专家',
    type: 'specialist',
    possibleInventory: [
      { resourceId: 'battery_cell', minAmount: 1, maxAmount: 3, probability: 0.5 },
      { resourceId: 'wire', minAmount: 3, maxAmount: 8, probability: 0.7 },
      { resourceId: 'gear', minAmount: 1, maxAmount: 3, probability: 0.4 },
      { resourceId: 'data_tape', minAmount: 1, maxAmount: 2, probability: 0.2 },
      { resourceId: 'radio_parts', minAmount: 1, maxAmount: 1, probability: 0.15 },
    ],
    stayDuration: 2,
    requirements: {
      minRadioTowerLevel: 2,
    },
  },
];

// ============================================
// 商人生成函数
// Trader Generation Functions
// ============================================

/**
 * 生成商人库存项
 */
export function generateInventoryItem(
  resourceId: ResourceId,
  amount: number
): TraderInventoryItem {
  return {
    resourceId,
    amount,
    buyPrice: calculateBuyPrice(resourceId),
    sellPrice: calculateSellPrice(resourceId),
  };
}

/**
 * 从模板生成商人
 */
export function generateTraderFromTemplate(
  template: TraderTemplate,
  currentDay: number,
  currentPhase: Phase
): Trader {
  const inventory: TraderInventoryItem[] = [];
  
  // 根据概率生成库存
  for (const item of template.possibleInventory) {
    if (Math.random() < item.probability) {
      const amount = Math.floor(
        Math.random() * (item.maxAmount - item.minAmount + 1) + item.minAmount
      );
      inventory.push(generateInventoryItem(item.resourceId, amount));
    }
  }
  
  // 计算商人离开时间
  const phaseOrder: Phase[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'];
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
  let remainingDuration = template.stayDuration;
  let endDay = currentDay;
  let endPhaseIndex = currentPhaseIndex;
  
  while (remainingDuration > 0) {
    endPhaseIndex++;
    if (endPhaseIndex >= phaseOrder.length) {
      endPhaseIndex = 0;
      endDay++;
    }
    remainingDuration--;
  }
  
  const endPhase = phaseOrder[endPhaseIndex];
  if (!endPhase) {
    throw new Error(`Invalid phase index: ${endPhaseIndex}`);
  }
  
  return {
    id: `${template.id}_${currentDay}_${currentPhase}`,
    name: template.name,
    nameZh: template.nameZh,
    inventory,
    availableUntil: {
      day: endDay,
      phase: endPhase,
    },
  };
}

/**
 * 检查商人是否仍然可用
 */
export function isTraderAvailable(
  trader: Trader,
  currentDay: number,
  currentPhase: Phase
): boolean {
  const phaseOrder: Phase[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'];
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
  const endPhaseIndex = phaseOrder.indexOf(trader.availableUntil.phase);
  
  if (currentDay < trader.availableUntil.day) {
    return true;
  }
  
  if (currentDay === trader.availableUntil.day) {
    return currentPhaseIndex <= endPhaseIndex;
  }
  
  return false;
}

/**
 * 获取可用的商人模板（基于当前条件）
 */
export function getAvailableTraderTemplates(
  radioTowerLevel: number,
  currentPhase: Phase
): TraderTemplate[] {
  return TRADER_TEMPLATES.filter(template => {
    // 检查无线电台等级要求
    if (template.requirements?.minRadioTowerLevel !== undefined) {
      if (radioTowerLevel < template.requirements.minRadioTowerLevel) {
        return false;
      }
    }
    
    // 检查阶段要求
    if (template.requirements?.phases) {
      if (!template.requirements.phases.includes(currentPhase)) {
        return false;
      }
    }
    
    return true;
  });
}
