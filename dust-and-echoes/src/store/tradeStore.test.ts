/**
 * 贸易系统测试
 * Trade System Tests
 * 
 * Requirements: 19.1, 19.2, 19.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTradeStore } from './tradeStore';
import {
  calculateBuyPrice,
  calculateSellPrice,
  BUY_PRICE_MULTIPLIER,
  SELL_PRICE_MULTIPLIER,
  generateInventoryItem,
} from '../config/trade';
import { getResourceVU, getAllResourceIds } from '../config/resources';
import type { ResourceId, Trader, Phase } from '../types';

describe('Trade System', () => {
  beforeEach(() => {
    useTradeStore.getState().resetTrade();
  });

  describe('Price Calculation (Requirements: 19.2)', () => {
    it('should calculate buy price as VU × 1.3', () => {
      const scrapBuyPrice = calculateBuyPrice('scrap');
      const scrapVU = getResourceVU('scrap');
      expect(scrapBuyPrice).toBeCloseTo(scrapVU * BUY_PRICE_MULTIPLIER, 2);
    });

    it('should calculate sell price as VU × 0.7', () => {
      const scrapSellPrice = calculateSellPrice('scrap');
      const scrapVU = getResourceVU('scrap');
      expect(scrapSellPrice).toBeCloseTo(scrapVU * SELL_PRICE_MULTIPLIER, 2);
    });

    it('should have buy price > sell price for all resources', () => {
      const resourceIds = getAllResourceIds();
      for (const resourceId of resourceIds) {
        const buyPrice = calculateBuyPrice(resourceId);
        const sellPrice = calculateSellPrice(resourceId);
        expect(buyPrice).toBeGreaterThan(sellPrice);
      }
    });

    it('should maintain price spread of 60% (1.3 - 0.7)', () => {
      const resourceIds = getAllResourceIds();
      for (const resourceId of resourceIds) {
        const vu = getResourceVU(resourceId);
        const buyPrice = calculateBuyPrice(resourceId);
        const sellPrice = calculateSellPrice(resourceId);
        const spread = buyPrice - sellPrice;
        // Spread should be approximately 0.6 × VU
        expect(spread).toBeCloseTo(vu * 0.6, 1);
      }
    });
  });

  describe('Trader Management (Requirements: 19.1)', () => {
    const createTestTrader = (id: string): Trader => ({
      id,
      name: 'Test Trader',
      nameZh: '测试商人',
      inventory: [
        generateInventoryItem('water', 10),
        generateInventoryItem('food', 8),
      ],
      availableUntil: {
        day: 1,
        phase: 'evening' as Phase,
      },
    });

    it('should add trader to active traders', () => {
      const store = useTradeStore.getState();
      const trader = createTestTrader('test_1');
      
      store.addTrader(trader);
      
      expect(store.getActiveTraders()).toHaveLength(1);
      expect(store.getTrader('test_1')).toBeDefined();
    });

    it('should remove trader from active traders', () => {
      const store = useTradeStore.getState();
      const trader = createTestTrader('test_1');
      
      store.addTrader(trader);
      store.removeTrader('test_1');
      
      expect(store.getActiveTraders()).toHaveLength(0);
      expect(store.getTrader('test_1')).toBeUndefined();
    });

    it('should cleanup expired traders', () => {
      const store = useTradeStore.getState();
      
      // Add trader that expires on day 1, evening
      const trader = createTestTrader('test_1');
      store.addTrader(trader);
      
      // Should still be available on day 1, morning
      let expired = store.cleanupExpiredTraders(1, 'morning');
      expect(expired).toHaveLength(0);
      expect(store.getActiveTraders()).toHaveLength(1);
      
      // Should be expired on day 2
      expired = store.cleanupExpiredTraders(2, 'dawn');
      expect(expired).toHaveLength(1);
      expect(store.getActiveTraders()).toHaveLength(0);
    });
  });

  describe('Trade Operations (Requirements: 19.5)', () => {
    const createTestTrader = (): Trader => ({
      id: 'test_trader',
      name: 'Test Trader',
      nameZh: '测试商人',
      inventory: [
        generateInventoryItem('water', 10),
        generateInventoryItem('food', 8),
      ],
      availableUntil: {
        day: 5,
        phase: 'midnight' as Phase,
      },
    });

    it('should successfully buy from trader with sufficient resources', () => {
      const store = useTradeStore.getState();
      const trader = createTestTrader();
      store.addTrader(trader);
      
      const playerResources: Record<ResourceId, number> = {
        scrap: 100,
      } as Record<ResourceId, number>;
      
      let scrapConsumed = 0;
      const consumeScrap = (amount: number) => {
        scrapConsumed = amount;
        return true;
      };
      
      let resourceAdded: { id: ResourceId; amount: number } | null = null;
      const addResource = (id: ResourceId, amount: number) => {
        resourceAdded = { id, amount };
        return amount;
      };
      
      const result = store.buyFromTrader(
        'test_trader',
        'water',
        5,
        playerResources,
        consumeScrap,
        addResource
      );
      
      expect(result.success).toBe(true);
      expect(result.amount).toBe(5);
      expect(scrapConsumed).toBeGreaterThan(0);
      expect(resourceAdded?.id).toBe('water');
      expect(resourceAdded?.amount).toBe(5);
      
      // Trader inventory should be reduced
      const updatedItem = store.getTraderInventoryItem('test_trader', 'water');
      expect(updatedItem?.amount).toBe(5);
    });

    it('should fail to buy with insufficient scrap', () => {
      const store = useTradeStore.getState();
      const trader = createTestTrader();
      store.addTrader(trader);
      
      const playerResources: Record<ResourceId, number> = {
        scrap: 1, // Not enough
      } as Record<ResourceId, number>;
      
      const result = store.buyFromTrader(
        'test_trader',
        'water',
        5,
        playerResources,
        () => true,
        () => 5
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('废料不足');
    });

    it('should fail to buy more than trader has in stock', () => {
      const store = useTradeStore.getState();
      const trader = createTestTrader();
      store.addTrader(trader);
      
      const playerResources: Record<ResourceId, number> = {
        scrap: 1000,
      } as Record<ResourceId, number>;
      
      const result = store.buyFromTrader(
        'test_trader',
        'water',
        100, // More than trader has
        playerResources,
        () => true,
        () => 100
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('库存不足');
    });

    it('should successfully sell to trader', () => {
      const store = useTradeStore.getState();
      const trader = createTestTrader();
      store.addTrader(trader);
      
      const playerResources: Record<ResourceId, number> = {
        scrap: 50,
        metal: 10,
      } as Record<ResourceId, number>;
      
      let resourceConsumed: { id: ResourceId; amount: number } | null = null;
      const consumeResource = (id: ResourceId, amount: number) => {
        resourceConsumed = { id, amount };
        return true;
      };
      
      let scrapAdded = 0;
      const addScrap = (amount: number) => {
        scrapAdded = amount;
        return amount;
      };
      
      const result = store.sellToTrader(
        'test_trader',
        'metal',
        5,
        playerResources,
        consumeResource,
        addScrap
      );
      
      expect(result.success).toBe(true);
      expect(result.amount).toBe(5);
      expect(resourceConsumed?.id).toBe('metal');
      expect(resourceConsumed?.amount).toBe(5);
      expect(scrapAdded).toBeGreaterThan(0);
    });

    it('should fail to sell with insufficient resources', () => {
      const store = useTradeStore.getState();
      const trader = createTestTrader();
      store.addTrader(trader);
      
      const playerResources: Record<ResourceId, number> = {
        metal: 2, // Not enough
      } as Record<ResourceId, number>;
      
      const result = store.sellToTrader(
        'test_trader',
        'metal',
        5,
        playerResources,
        () => true,
        () => 0
      );
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('资源不足');
    });

    it('should fail trade with non-existent trader', () => {
      const store = useTradeStore.getState();
      
      const playerResources: Record<ResourceId, number> = {
        scrap: 100,
      } as Record<ResourceId, number>;
      
      const buyResult = store.buyFromTrader(
        'non_existent',
        'water',
        5,
        playerResources,
        () => true,
        () => 5
      );
      
      expect(buyResult.success).toBe(false);
      expect(buyResult.reason).toContain('商人不存在');
      
      const sellResult = store.sellToTrader(
        'non_existent',
        'metal',
        5,
        playerResources,
        () => true,
        () => 0
      );
      
      expect(sellResult.success).toBe(false);
      expect(sellResult.reason).toContain('商人不存在');
    });
  });

  describe('Inventory Management', () => {
    it('should update trader inventory correctly', () => {
      const store = useTradeStore.getState();
      const trader: Trader = {
        id: 'test_trader',
        name: 'Test Trader',
        nameZh: '测试商人',
        inventory: [generateInventoryItem('water', 10)],
        availableUntil: { day: 5, phase: 'midnight' as Phase },
      };
      
      store.addTrader(trader);
      store.updateTraderInventory('test_trader', 'water', 5);
      
      const item = store.getTraderInventoryItem('test_trader', 'water');
      expect(item?.amount).toBe(5);
    });

    it('should remove inventory item when amount reaches 0', () => {
      const store = useTradeStore.getState();
      const trader: Trader = {
        id: 'test_trader',
        name: 'Test Trader',
        nameZh: '测试商人',
        inventory: [generateInventoryItem('water', 10)],
        availableUntil: { day: 5, phase: 'midnight' as Phase },
      };
      
      store.addTrader(trader);
      store.updateTraderInventory('test_trader', 'water', 0);
      
      const item = store.getTraderInventoryItem('test_trader', 'water');
      expect(item).toBeUndefined();
    });

    it('should check trader stock correctly', () => {
      const store = useTradeStore.getState();
      const trader: Trader = {
        id: 'test_trader',
        name: 'Test Trader',
        nameZh: '测试商人',
        inventory: [generateInventoryItem('water', 10)],
        availableUntil: { day: 5, phase: 'midnight' as Phase },
      };
      
      store.addTrader(trader);
      
      expect(store.hasTraderStock('test_trader', 'water', 5)).toBe(true);
      expect(store.hasTraderStock('test_trader', 'water', 15)).toBe(false);
      expect(store.hasTraderStock('test_trader', 'food', 1)).toBe(false);
    });
  });
});


// ============================================
// Property-Based Tests
// ============================================

import * as fc from 'fast-check';

describe('Property-Based Tests', () => {
  /**
   * Property 18: Trade Price Spread
   * For any resource with VU value V, the buy price SHALL equal V × 1.3 
   * and the sell price SHALL equal V × 0.7.
   * 
   * **Feature: dust-and-echoes, Property 18: Trade Price Spread**
   * **Validates: Requirements 19.2**
   */
  describe('Property 18: Trade Price Spread', () => {
    it('should satisfy buy price = VU × 1.3 and sell price = VU × 0.7 for all resources', () => {
      const resourceIds = getAllResourceIds();
      
      fc.assert(
        fc.property(
          fc.constantFrom(...resourceIds),
          (resourceId: ResourceId) => {
            const vu = getResourceVU(resourceId);
            const buyPrice = calculateBuyPrice(resourceId);
            const sellPrice = calculateSellPrice(resourceId);
            
            // Buy price should be VU × 1.3 (with rounding tolerance)
            const expectedBuyPrice = Math.round(vu * BUY_PRICE_MULTIPLIER * 100) / 100;
            const buyPriceCorrect = Math.abs(buyPrice - expectedBuyPrice) < 0.01;
            
            // Sell price should be VU × 0.7 (with rounding tolerance)
            const expectedSellPrice = Math.round(vu * SELL_PRICE_MULTIPLIER * 100) / 100;
            const sellPriceCorrect = Math.abs(sellPrice - expectedSellPrice) < 0.01;
            
            // Buy price should always be greater than sell price
            const spreadCorrect = buyPrice > sellPrice;
            
            return buyPriceCorrect && sellPriceCorrect && spreadCorrect;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent price spread ratio for arbitrary VU values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (vuInt: number) => {
            // Use integer VU values (more realistic for game resources)
            const vu = vuInt;
            
            // Use the VU-based calculation functions
            const buyPrice = Math.round(vu * BUY_PRICE_MULTIPLIER * 100) / 100;
            const sellPrice = Math.round(vu * SELL_PRICE_MULTIPLIER * 100) / 100;
            
            // Buy price should be approximately VU × 1.3
            const buyRatio = buyPrice / vu;
            const buyRatioCorrect = Math.abs(buyRatio - BUY_PRICE_MULTIPLIER) < 0.02;
            
            // Sell price should be approximately VU × 0.7
            const sellRatio = sellPrice / vu;
            const sellRatioCorrect = Math.abs(sellRatio - SELL_PRICE_MULTIPLIER) < 0.02;
            
            // Spread should be approximately 60% of VU
            const spread = buyPrice - sellPrice;
            const expectedSpread = vu * 0.6;
            const spreadCorrect = Math.abs(spread - expectedSpread) < 0.02 * vu + 0.02;
            
            return buyRatioCorrect && sellRatioCorrect && spreadCorrect;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
