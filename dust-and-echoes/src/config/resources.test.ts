/**
 * 资源VU一致性属性测试
 * Resource VU Consistency Property Tests
 * 
 * **Property 2: Resource VU Consistency**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
 * 
 * Feature: dust-and-echoes, Property 2: Resource VU Consistency
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { RESOURCES, getResourceVU, getAllResourceIds } from './resources';
import { RECIPES, calculateRecipeInputVU } from './recipes';
import type { ResourceId } from '../types';

/**
 * 预期的资源VU值 (来自需求文档)
 * Expected resource VU values from requirements
 */
const EXPECTED_VU: Partial<Record<ResourceId, number>> = {
  // 一级资源 (Requirements 2.1)
  scrap: 1,
  water: 5,
  dirty_water: 3,
  food: 4.167,
  raw_meat: 3,
  canned_food: 14.5,
  vegetables: 4,
  seeds: 20,
  fertilizer: 18,
  
  // 二级材料 (Requirements 2.2)
  wood: 8,
  metal: 16,
  cloth: 5,
  leather: 7,
  plastic: 7,
  glass: 7,
  rubber: 9,
  wire: 11,
  rope: 7,
  duct_tape: 14,
  
  // 组件 (Requirements 2.3)
  gear: 15,
  pipe: 15,
  spring: 12,
  bearing: 18,
  fasteners: 6,
  
  // 化工材料 (Requirements 2.4)
  solvent: 22,
  acid: 25,
  gunpowder: 33,
  fuel: 42,
  
  // 能源组件 (Requirements 2.5)
  battery_cell: 45,
  battery_pack: 102,
  filter: 17,
  seal_ring: 11,
  
  // 三级稀有资源 (Requirements 2.6)
  meds: 320,
  data_tape: 160,
  radio_parts: 240,
  solar_cell: 320,
  rare_alloy: 400,
  microchips: 640,
  nanofiber: 800,
  power_core: 2560,
};

describe('Property 2: Resource VU Consistency', () => {
  /**
   * Property 2.1: 所有资源的VU值必须与文档定义一致
   * For any resource in the system, its VU value SHALL match the documented value
   */
  it('should have VU values matching documented values for all resources', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        (resourceId: ResourceId) => {
          const expectedVU = EXPECTED_VU[resourceId];
          if (expectedVU !== undefined) {
            const actualVU = getResourceVU(resourceId);
            // 允许浮点数误差
            expect(Math.abs(actualVU - expectedVU)).toBeLessThan(0.01);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.2: 所有可制作资源的VU必须等于输入VU总和加上Work×0.25
   * For any craftable resource, its VU SHALL equal the sum of input VU plus Work × 0.25
   */
  it('should have craftable resource VU equal to input VU + Work × 0.25', () => {
    // 获取所有有配方的资源
    const craftableRecipes = RECIPES.filter(recipe => {
      // 排除食物加工配方（这些有损耗）
      return !['cook_meat', 'cook_vegetables', 'purify_water'].includes(recipe.id);
    });

    fc.assert(
      fc.property(
        fc.constantFrom(...craftableRecipes),
        (recipe) => {
          const outputResource = RESOURCES[recipe.output.resourceId];
          const calculatedVU = calculateRecipeInputVU(recipe, getResourceVU);
          
          // 输出VU应该等于计算的输入VU（允许小误差）
          const difference = Math.abs(outputResource.vu - calculatedVU);
          expect(difference).toBeLessThan(1); // 允许1 VU的误差（四舍五入）
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.3: 所有资源必须有有效的类别
   * All resources must have a valid category
   */
  it('should have valid category for all resources', () => {
    const validCategories = ['primary', 'secondary', 'component', 'chemical', 'energy', 'rare'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        (resourceId: ResourceId) => {
          const resource = RESOURCES[resourceId];
          expect(validCategories).toContain(resource.category);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.4: 所有资源必须有正的VU值
   * All resources must have positive VU values
   */
  it('should have positive VU values for all resources', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        (resourceId: ResourceId) => {
          const vu = getResourceVU(resourceId);
          expect(vu).toBeGreaterThan(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.5: 易腐资源必须标记为perishable
   * Perishable resources must be marked as perishable
   */
  it('should mark perishable resources correctly', () => {
    const expectedPerishable: ResourceId[] = ['raw_meat', 'vegetables'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...expectedPerishable),
        (resourceId: ResourceId) => {
          const resource = RESOURCES[resourceId];
          expect(resource.perishable).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2.6: 资源ID必须与RESOURCES键一致
   * Resource ID must match the key in RESOURCES
   */
  it('should have resource ID matching the key in RESOURCES', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllResourceIds()),
        (resourceId: ResourceId) => {
          const resource = RESOURCES[resourceId];
          expect(resource.id).toBe(resourceId);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
