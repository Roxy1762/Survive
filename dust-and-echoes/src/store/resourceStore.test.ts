/**
 * 资源管理系统属性测试
 * Resource Management System Property Tests
 * 
 * Feature: dust-and-echoes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  useResourceStore, 
  calculatePhaseConsumption,
  WATER_CONSUMPTION_PER_POP_PER_AU,
  FOOD_CONSUMPTION_PER_POP_PER_AU,
} from './resourceStore';
import { getAllResourceIds } from '../config/resources';
import type { ResourceId } from '../types';

// 重置store状态
beforeEach(() => {
  useResourceStore.getState().resetResources();
});

/**
 * Property 4: Storage Cap Enforcement
 * **Validates: Requirements 2.8**
 * 
 * For any resource addition operation, the resulting resource amount 
 * SHALL NOT exceed the storage cap for that resource type.
 */
describe('Property 4: Storage Cap Enforcement', () => {
  /**
   * Property 4.1: 添加资源后数量不超过上限
   * After adding resources, the amount should not exceed the cap
   */
  it('should not exceed storage cap when adding resources', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        fc.integer({ min: 1, max: 10000 }),
        (resourceId: ResourceId, amountToAdd: number) => {
          const store = useResourceStore.getState();
          store.resetResources();
          
          const cap = store.getResourceCap(resourceId);
          store.addResource(resourceId, amountToAdd);
          const finalAmount = store.getResource(resourceId);
          
          // 最终数量不应超过上限
          expect(finalAmount).toBeLessThanOrEqual(cap);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.2: 多次添加资源后数量不超过上限
   * After multiple additions, the amount should not exceed the cap
   */
  it('should not exceed storage cap after multiple additions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }),
        (resourceId: ResourceId, amounts: number[]) => {
          const store = useResourceStore.getState();
          store.resetResources();
          
          const cap = store.getResourceCap(resourceId);
          
          for (const amount of amounts) {
            store.addResource(resourceId, amount);
          }
          
          const finalAmount = store.getResource(resourceId);
          expect(finalAmount).toBeLessThanOrEqual(cap);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.3: setResource也应受上限限制
   * setResource should also respect the cap
   */
  it('should clamp setResource to storage cap', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        fc.integer({ min: 0, max: 10000 }),
        (resourceId: ResourceId, amount: number) => {
          const store = useResourceStore.getState();
          store.resetResources();
          
          const cap = store.getResourceCap(resourceId);
          store.setResource(resourceId, amount);
          const finalAmount = store.getResource(resourceId);
          
          expect(finalAmount).toBeLessThanOrEqual(cap);
          expect(finalAmount).toBeGreaterThanOrEqual(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4.4: 添加资源返回实际添加的数量
   * addResource should return the actual amount added
   */
  it('should return actual amount added respecting cap', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        fc.integer({ min: 0, max: 500 }),
        fc.integer({ min: 1, max: 1000 }),
        (resourceId: ResourceId, initialAmount: number, amountToAdd: number) => {
          const store = useResourceStore.getState();
          store.resetResources();
          
          const cap = store.getResourceCap(resourceId);
          // 先设置初始值
          store.setResource(resourceId, Math.min(initialAmount, cap));
          const beforeAdd = store.getResource(resourceId);
          
          const actualAdded = store.addResource(resourceId, amountToAdd);
          const afterAdd = store.getResource(resourceId);
          
          // 实际添加的数量应该等于前后差值
          expect(actualAdded).toBe(afterAdd - beforeAdd);
          // 实际添加的数量不应超过请求添加的数量
          expect(actualAdded).toBeLessThanOrEqual(amountToAdd);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Consumption Calculation Correctness
 * **Validates: Requirements 2.7**
 * 
 * For any phase transition with population P and phase AU value A,
 * water consumption SHALL equal P × 1.0 × A and 
 * food consumption SHALL equal P × 1.2 × A.
 */
describe('Property 3: Consumption Calculation Correctness', () => {
  /**
   * Property 3.1: 消耗计算公式正确性
   * Consumption calculation formula correctness
   */
  it('should calculate consumption correctly: Water = pop × 1.0 × AU, Food = pop × 1.2 × AU', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),  // population
        fc.constantFrom(0.5, 1.0),          // phaseAU (only valid values)
        (population: number, phaseAU: number) => {
          const { water, food } = calculatePhaseConsumption(population, phaseAU);
          
          const expectedWater = population * WATER_CONSUMPTION_PER_POP_PER_AU * phaseAU;
          const expectedFood = population * FOOD_CONSUMPTION_PER_POP_PER_AU * phaseAU;
          
          expect(water).toBeCloseTo(expectedWater, 10);
          expect(food).toBeCloseTo(expectedFood, 10);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.2: 消耗与人口成正比
   * Consumption is proportional to population
   */
  it('should have consumption proportional to population', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.constantFrom(0.5, 1.0),
        (population: number, phaseAU: number) => {
          const single = calculatePhaseConsumption(1, phaseAU);
          const multiple = calculatePhaseConsumption(population, phaseAU);
          
          expect(multiple.water).toBeCloseTo(single.water * population, 10);
          expect(multiple.food).toBeCloseTo(single.food * population, 10);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.3: 消耗与AU成正比
   * Consumption is proportional to AU
   */
  it('should have consumption proportional to AU', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (population: number) => {
          const halfAU = calculatePhaseConsumption(population, 0.5);
          const fullAU = calculatePhaseConsumption(population, 1.0);
          
          // 1.0 AU的消耗应该是0.5 AU的两倍
          expect(fullAU.water).toBeCloseTo(halfAU.water * 2, 10);
          expect(fullAU.food).toBeCloseTo(halfAU.food * 2, 10);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.4: 食物消耗比水消耗高20%
   * Food consumption is 20% higher than water consumption
   */
  it('should have food consumption 20% higher than water consumption', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.constantFrom(0.5, 1.0),
        (population: number, phaseAU: number) => {
          const { water, food } = calculatePhaseConsumption(population, phaseAU);
          
          // food = water × 1.2
          expect(food).toBeCloseTo(water * 1.2, 10);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3.5: processPhaseConsumption正确消耗资源
   * processPhaseConsumption correctly consumes resources
   */
  it('should correctly consume resources during phase transition', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.constantFrom(0.5, 1.0),
        fc.integer({ min: 10, max: 50 }),
        fc.integer({ min: 10, max: 50 }),
        (population: number, phaseAU: number, initialWater: number, initialFood: number) => {
          const store = useResourceStore.getState();
          store.resetResources();
          
          // 设置初始资源
          store.setResource('water', initialWater);
          store.setResource('food', initialFood);
          
          const waterBefore = store.getResource('water');
          const foodBefore = store.getResource('food');
          
          const result = store.processPhaseConsumption(population, phaseAU, 1, 'morning');
          
          const waterAfter = store.getResource('water');
          const foodAfter = store.getResource('food');
          
          // 验证消耗量
          expect(result.waterConsumed).toBeCloseTo(waterBefore - waterAfter, 10);
          expect(result.foodConsumed).toBeCloseTo(foodBefore - foodAfter, 10);
          
          // 资源不应为负
          expect(waterAfter).toBeGreaterThanOrEqual(0);
          expect(foodAfter).toBeGreaterThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
