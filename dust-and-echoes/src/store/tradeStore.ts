/**
 * 贸易系统状态管理
 * Trade System State Management
 * 
 * Requirements: 19.1, 19.2, 19.5
 */

import { create } from 'zustand';
import type { ResourceId, Phase, Trader, TraderInventoryItem } from '../types';
import {
  calculateBuyPrice,
  calculateSellPrice,
  isTraderAvailable,
  generateTraderFromTemplate,
  getAvailableTraderTemplates,
} from '../config/trade';

// ============================================
// 贸易结果类型
// Trade Result Types
// ============================================

export interface TradeResult {
  success: boolean;
  reason?: string;
  resourceId?: ResourceId;
  amount?: number;
  totalPrice?: number;
}

// ============================================
// 贸易Store接口
// Trade Store Interface
// ============================================

interface TradeStore {
  // 状态
  activeTraders: Trader[];
  
  // 商人管理
  /** 添加商人 */
  addTrader: (trader: Trader) => void;
  /** 移除商人 */
  removeTrader: (traderId: string) => void;
  /** 获取所有活跃商人 */
  getActiveTraders: () => Trader[];
  /** 获取指定商人 */
  getTrader: (traderId: string) => Trader | undefined;
  /** 清理过期商人 */
  cleanupExpiredTraders: (currentDay: number, currentPhase: Phase) => string[];
  
  // 商人生成
  /** 尝试生成随机商人 */
  trySpawnTrader: (
    radioTowerLevel: number,
    currentDay: number,
    currentPhase: Phase,
    spawnChance?: number
  ) => Trader | null;
  
  // 价格查询
  /** 获取资源买入价格 */
  getBuyPrice: (resourceId: ResourceId) => number;
  /** 获取资源卖出价格 */
  getSellPrice: (resourceId: ResourceId) => number;
  
  // 交易操作
  /** 从商人处购买资源 */
  buyFromTrader: (
    traderId: string,
    resourceId: ResourceId,
    amount: number,
    playerResources: Record<ResourceId, number>,
    consumeScrap: (amount: number) => boolean,
    addResource: (id: ResourceId, amount: number) => number
  ) => TradeResult;
  
  /** 向商人出售资源 */
  sellToTrader: (
    traderId: string,
    resourceId: ResourceId,
    amount: number,
    playerResources: Record<ResourceId, number>,
    consumeResource: (id: ResourceId, amount: number) => boolean,
    addScrap: (amount: number) => number
  ) => TradeResult;
  
  // 库存查询
  /** 检查商人是否有足够库存 */
  hasTraderStock: (traderId: string, resourceId: ResourceId, amount: number) => boolean;
  /** 获取商人库存项 */
  getTraderInventoryItem: (traderId: string, resourceId: ResourceId) => TraderInventoryItem | undefined;
  /** 更新商人库存 */
  updateTraderInventory: (traderId: string, resourceId: ResourceId, newAmount: number) => void;
  
  // 重置
  /** 重置贸易状态 */
  resetTrade: () => void;
}

/**
 * 贸易状态Store
 */
export const useTradeStore = create<TradeStore>((set, get) => ({
  // 初始状态
  activeTraders: [],
  
  // ============================================
  // 商人管理
  // ============================================
  
  addTrader: (trader: Trader): void => {
    set((state) => ({
      activeTraders: [...state.activeTraders, trader],
    }));
  },
  
  removeTrader: (traderId: string): void => {
    set((state) => ({
      activeTraders: state.activeTraders.filter(t => t.id !== traderId),
    }));
  },
  
  getActiveTraders: (): Trader[] => {
    return get().activeTraders;
  },
  
  getTrader: (traderId: string): Trader | undefined => {
    return get().activeTraders.find(t => t.id === traderId);
  },
  
  cleanupExpiredTraders: (currentDay: number, currentPhase: Phase): string[] => {
    const state = get();
    const expiredIds: string[] = [];
    
    const remainingTraders = state.activeTraders.filter(trader => {
      const available = isTraderAvailable(trader, currentDay, currentPhase);
      if (!available) {
        expiredIds.push(trader.id);
      }
      return available;
    });
    
    if (expiredIds.length > 0) {
      set({ activeTraders: remainingTraders });
    }
    
    return expiredIds;
  },
  
  // ============================================
  // 商人生成
  // ============================================
  
  trySpawnTrader: (
    radioTowerLevel: number,
    currentDay: number,
    currentPhase: Phase,
    spawnChance: number = 0.15
  ): Trader | null => {
    // 无线电台必须至少1级才能有商人
    if (radioTowerLevel < 1) {
      return null;
    }
    
    // 随机决定是否生成商人
    if (Math.random() > spawnChance) {
      return null;
    }
    
    // 获取可用的商人模板
    const availableTemplates = getAvailableTraderTemplates(radioTowerLevel, currentPhase);
    if (availableTemplates.length === 0) {
      return null;
    }
    
    // 随机选择一个模板
    const templateIndex = Math.floor(Math.random() * availableTemplates.length);
    const template = availableTemplates[templateIndex];
    
    if (!template) {
      return null;
    }
    
    // 生成商人
    const trader = generateTraderFromTemplate(template, currentDay, currentPhase);
    
    // 添加到活跃商人列表
    get().addTrader(trader);
    
    return trader;
  },
  
  // ============================================
  // 价格查询
  // Requirements: 19.2
  // ============================================
  
  getBuyPrice: (resourceId: ResourceId): number => {
    return calculateBuyPrice(resourceId);
  },
  
  getSellPrice: (resourceId: ResourceId): number => {
    return calculateSellPrice(resourceId);
  },
  
  // ============================================
  // 交易操作
  // Requirements: 19.5
  // ============================================
  
  buyFromTrader: (
    traderId: string,
    resourceId: ResourceId,
    amount: number,
    playerResources: Record<ResourceId, number>,
    consumeScrap: (amount: number) => boolean,
    addResource: (id: ResourceId, amount: number) => number
  ): TradeResult => {
    if (amount <= 0) {
      return { success: false, reason: '购买数量必须大于0' };
    }
    
    const state = get();
    const trader = state.getTrader(traderId);
    
    if (!trader) {
      return { success: false, reason: '商人不存在' };
    }
    
    // 检查商人库存
    const inventoryItem = trader.inventory.find(item => item.resourceId === resourceId);
    if (!inventoryItem) {
      return { success: false, reason: '商人没有该商品' };
    }
    
    if (inventoryItem.amount < amount) {
      return { success: false, reason: `商人库存不足，仅有 ${inventoryItem.amount} 单位` };
    }
    
    // 计算总价 (使用Scrap作为货币)
    const totalPrice = Math.ceil(inventoryItem.buyPrice * amount);
    
    // 检查玩家是否有足够的Scrap
    if ((playerResources.scrap ?? 0) < totalPrice) {
      return { success: false, reason: `废料不足，需要 ${totalPrice} 废料` };
    }
    
    // 执行交易：消耗Scrap
    if (!consumeScrap(totalPrice)) {
      return { success: false, reason: '支付失败' };
    }
    
    // 添加资源给玩家
    const actualAdded = addResource(resourceId, amount);
    
    // 更新商人库存
    state.updateTraderInventory(traderId, resourceId, inventoryItem.amount - amount);
    
    return {
      success: true,
      resourceId,
      amount: actualAdded,
      totalPrice,
    };
  },
  
  sellToTrader: (
    traderId: string,
    resourceId: ResourceId,
    amount: number,
    playerResources: Record<ResourceId, number>,
    consumeResource: (id: ResourceId, amount: number) => boolean,
    addScrap: (amount: number) => number
  ): TradeResult => {
    if (amount <= 0) {
      return { success: false, reason: '出售数量必须大于0' };
    }
    
    const state = get();
    const trader = state.getTrader(traderId);
    
    if (!trader) {
      return { success: false, reason: '商人不存在' };
    }
    
    // 检查玩家是否有足够的资源
    if ((playerResources[resourceId] ?? 0) < amount) {
      return { success: false, reason: '资源不足' };
    }
    
    // 计算卖出价格
    const sellPrice = calculateSellPrice(resourceId);
    const totalPrice = Math.floor(sellPrice * amount);
    
    // 执行交易：消耗玩家资源
    if (!consumeResource(resourceId, amount)) {
      return { success: false, reason: '资源扣除失败' };
    }
    
    // 给玩家添加Scrap
    const actualAdded = addScrap(totalPrice);
    
    // 更新商人库存（增加）
    const existingItem = trader.inventory.find(item => item.resourceId === resourceId);
    if (existingItem) {
      state.updateTraderInventory(traderId, resourceId, existingItem.amount + amount);
    } else {
      // 商人原本没有这个商品，添加新的库存项
      set((state) => ({
        activeTraders: state.activeTraders.map(t => {
          if (t.id !== traderId) return t;
          return {
            ...t,
            inventory: [
              ...t.inventory,
              {
                resourceId,
                amount,
                buyPrice: calculateBuyPrice(resourceId),
                sellPrice: calculateSellPrice(resourceId),
              },
            ],
          };
        }),
      }));
    }
    
    return {
      success: true,
      resourceId,
      amount,
      totalPrice: actualAdded,
    };
  },
  
  // ============================================
  // 库存查询
  // ============================================
  
  hasTraderStock: (traderId: string, resourceId: ResourceId, amount: number): boolean => {
    const trader = get().getTrader(traderId);
    if (!trader) return false;
    
    const item = trader.inventory.find(i => i.resourceId === resourceId);
    return item !== undefined && item.amount >= amount;
  },
  
  getTraderInventoryItem: (traderId: string, resourceId: ResourceId): TraderInventoryItem | undefined => {
    const trader = get().getTrader(traderId);
    if (!trader) return undefined;
    
    return trader.inventory.find(i => i.resourceId === resourceId);
  },
  
  updateTraderInventory: (traderId: string, resourceId: ResourceId, newAmount: number): void => {
    set((state) => ({
      activeTraders: state.activeTraders.map(trader => {
        if (trader.id !== traderId) return trader;
        
        if (newAmount <= 0) {
          // 移除库存项
          return {
            ...trader,
            inventory: trader.inventory.filter(item => item.resourceId !== resourceId),
          };
        }
        
        // 更新库存数量
        return {
          ...trader,
          inventory: trader.inventory.map(item => {
            if (item.resourceId !== resourceId) return item;
            return { ...item, amount: newAmount };
          }),
        };
      }),
    }));
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetTrade: (): void => {
    set({ activeTraders: [] });
  },
}));
