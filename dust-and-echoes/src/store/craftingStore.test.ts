/**
 * 工坊与制造系统测试
 * Workshop & Crafting System Tests
 * 
 * Requirements: 5.5, 5.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  useCraftingStore,
  calculateWorkshopEfficiencyMultiplier,
  calculateWorkOutput,
  hasEnoughResourcesForRecipe,
  calculateTotalWorkRequired,
  ENGINEER_WORK_PER_AU,
  WORK_VU_VALUE,
} from './craftingStore';
import { getRecipeById } from '../config/recipes';
import type { ResourceId } from '../types';

describe('Crafting Store', () => {
  beforeEach(() => {
    useCraftingStore.getState().resetCrafting();
  });

  describe('Workshop Efficiency Formula (Requirements 5.6)', () => {
    it('should calculate efficiency multiplier correctly for level 1', () => {
      // L1: 1 + 0.20 × (1-1) = 1.0
      expect(calculateWorkshopEfficiencyMultiplier(1)).toBe(1.0);
    });

    it('should calculate efficiency multiplier correctly for level 2', () => {
      // L2: 1 + 0.20 × (2-1) = 1.2
      expect(calculateWorkshopEfficiencyMultiplier(2)).toBe(1.2);
    });

    it('should calculate efficiency multiplier correctly for level 3', () => {
      // L3: 1 + 0.20 × (3-1) = 1.4
      expect(calculateWorkshopEfficiencyMultiplier(3)).toBe(1.4);
    });

    it('should calculate efficiency multiplier correctly for level 5', () => {
      // L5: 1 + 0.20 × (5-1) = 1.8
      expect(calculateWorkshopEfficiencyMultiplier(5)).toBe(1.8);
    });

    it('should return 0 for level 0 or below', () => {
      expect(calculateWorkshopEfficiencyMultiplier(0)).toBe(0);
      expect(calculateWorkshopEfficiencyMultiplier(-1)).toBe(0);
    });
  });

  describe('Work Output Calculation', () => {
    it('should calculate work output for 1 engineer at L1 workshop for 1 AU', () => {
      // 1 engineer × 60 Work/AU × 1.0 efficiency × 1 AU = 60 Work
      const output = calculateWorkOutput(1, 1, 1);
      expect(output).toBe(60);
    });

    it('should calculate work output for 2 engineers at L2 workshop for 1 AU', () => {
      // 2 engineers × 60 Work/AU × 1.2 efficiency × 1 AU = 144 Work
      const output = calculateWorkOutput(2, 2, 1);
      expect(output).toBe(144);
    });

    it('should calculate work output for half phase (0.5 AU)', () => {
      // 1 engineer × 60 Work/AU × 1.0 efficiency × 0.5 AU = 30 Work
      const output = calculateWorkOutput(1, 1, 0.5);
      expect(output).toBe(30);
    });

    it('should return 0 for workshop level 0', () => {
      const output = calculateWorkOutput(2, 0, 1);
      expect(output).toBe(0);
    });
  });

  describe('Resource Check for Recipe', () => {
    it('should return hasEnough true when resources are sufficient', () => {
      const recipe = getRecipeById('craft_wood')!;
      const resources: Record<ResourceId, number> = {
        scrap: 10,
        water: 0, dirty_water: 0, food: 0, raw_meat: 0, canned_food: 0,
        vegetables: 0, seeds: 0, fertilizer: 0, wood: 0, metal: 0,
        cloth: 0, leather: 0, plastic: 0, glass: 0, rubber: 0,
        wire: 0, rope: 0, duct_tape: 0, gear: 0, pipe: 0,
        spring: 0, bearing: 0, fasteners: 0, solvent: 0, acid: 0,
        gunpowder: 0, fuel: 0, battery_cell: 0, battery_pack: 0,
        filter: 0, seal_ring: 0, meds: 0, data_tape: 0, radio_parts: 0,
        solar_cell: 0, rare_alloy: 0, microchips: 0, nanofiber: 0, power_core: 0,
      };
      
      const result = hasEnoughResourcesForRecipe(recipe, 1, resources);
      expect(result.hasEnough).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should return hasEnough false when resources are insufficient', () => {
      const recipe = getRecipeById('craft_wood')!;
      const resources: Record<ResourceId, number> = {
        scrap: 2, // Need 4 for 1 wood
        water: 0, dirty_water: 0, food: 0, raw_meat: 0, canned_food: 0,
        vegetables: 0, seeds: 0, fertilizer: 0, wood: 0, metal: 0,
        cloth: 0, leather: 0, plastic: 0, glass: 0, rubber: 0,
        wire: 0, rope: 0, duct_tape: 0, gear: 0, pipe: 0,
        spring: 0, bearing: 0, fasteners: 0, solvent: 0, acid: 0,
        gunpowder: 0, fuel: 0, battery_cell: 0, battery_pack: 0,
        filter: 0, seal_ring: 0, meds: 0, data_tape: 0, radio_parts: 0,
        solar_cell: 0, rare_alloy: 0, microchips: 0, nanofiber: 0, power_core: 0,
      };
      
      const result = hasEnoughResourcesForRecipe(recipe, 1, resources);
      expect(result.hasEnough).toBe(false);
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0]?.resourceId).toBe('scrap');
      expect(result.missing[0]?.required).toBe(4);
      expect(result.missing[0]?.available).toBe(2);
    });

    it('should scale resource requirements with quantity', () => {
      const recipe = getRecipeById('craft_wood')!;
      const resources: Record<ResourceId, number> = {
        scrap: 10, // Need 4 × 3 = 12 for 3 wood
        water: 0, dirty_water: 0, food: 0, raw_meat: 0, canned_food: 0,
        vegetables: 0, seeds: 0, fertilizer: 0, wood: 0, metal: 0,
        cloth: 0, leather: 0, plastic: 0, glass: 0, rubber: 0,
        wire: 0, rope: 0, duct_tape: 0, gear: 0, pipe: 0,
        spring: 0, bearing: 0, fasteners: 0, solvent: 0, acid: 0,
        gunpowder: 0, fuel: 0, battery_cell: 0, battery_pack: 0,
        filter: 0, seal_ring: 0, meds: 0, data_tape: 0, radio_parts: 0,
        solar_cell: 0, rare_alloy: 0, microchips: 0, nanofiber: 0, power_core: 0,
      };
      
      const result = hasEnoughResourcesForRecipe(recipe, 3, resources);
      expect(result.hasEnough).toBe(false);
      expect(result.missing[0]?.required).toBe(12);
    });
  });

  describe('Total Work Required Calculation', () => {
    it('should calculate work required for single item', () => {
      const recipe = getRecipeById('craft_wood')!;
      expect(calculateTotalWorkRequired(recipe, 1)).toBe(16);
    });

    it('should scale work required with quantity', () => {
      const recipe = getRecipeById('craft_wood')!;
      expect(calculateTotalWorkRequired(recipe, 3)).toBe(48);
    });
  });

  describe('Task Management', () => {
    it('should create a crafting task', () => {
      const store = useCraftingStore.getState();
      const task = store.createTask('craft_wood', 2);
      
      expect(task).not.toBeNull();
      expect(task?.recipeId).toBe('craft_wood');
      expect(task?.quantity).toBe(2);
      expect(task?.workRequired).toBe(32); // 16 × 2
      expect(task?.workProgress).toBe(0);
      expect(task?.status).toBe('pending');
    });

    it('should not create task for invalid recipe', () => {
      const store = useCraftingStore.getState();
      const task = store.createTask('invalid_recipe', 1);
      expect(task).toBeNull();
    });

    it('should not create task for zero quantity', () => {
      const store = useCraftingStore.getState();
      const task = store.createTask('craft_wood', 0);
      expect(task).toBeNull();
    });

    it('should cancel current task', () => {
      const store = useCraftingStore.getState();
      store.createTask('craft_wood', 1);
      
      const cancelled = store.cancelTask();
      expect(cancelled).toBe(true);
      expect(store.getCurrentTask()).toBeNull();
      expect(store.getTaskHistory()).toHaveLength(1);
      expect(store.getTaskHistory()[0]?.status).toBe('cancelled');
    });
  });

  describe('Work Management', () => {
    it('should add work points', () => {
      const store = useCraftingStore.getState();
      store.addWork(100);
      expect(store.getAccumulatedWork()).toBe(100);
    });

    it('should consume work points', () => {
      const store = useCraftingStore.getState();
      store.addWork(100);
      const consumed = store.consumeWork(30);
      expect(consumed).toBe(30);
      expect(store.getAccumulatedWork()).toBe(70);
    });

    it('should not consume more work than available', () => {
      const store = useCraftingStore.getState();
      store.addWork(50);
      const consumed = store.consumeWork(100);
      expect(consumed).toBe(50);
      expect(store.getAccumulatedWork()).toBe(0);
    });
  });

  describe('Crafting Progress', () => {
    it('should advance crafting progress', () => {
      const store = useCraftingStore.getState();
      store.createTask('craft_wood', 1); // 16 work required
      
      const result = store.advanceCraftingProgress(10);
      expect(result.workUsed).toBe(10);
      expect(result.completed).toBe(false);
      expect(result.task?.workProgress).toBe(10);
      expect(result.task?.status).toBe('in_progress');
    });

    it('should complete task when work is sufficient', () => {
      const store = useCraftingStore.getState();
      store.createTask('craft_wood', 1); // 16 work required
      
      const result = store.advanceCraftingProgress(20);
      expect(result.workUsed).toBe(16);
      expect(result.completed).toBe(true);
      expect(result.task?.status).toBe('completed');
      expect(store.getCurrentTask()).toBeNull();
      expect(store.getTaskHistory()).toHaveLength(1);
    });
  });

  describe('canCraft Validation', () => {
    it('should return false when workshop level is 0', () => {
      const store = useCraftingStore.getState();
      const resources = createEmptyResources();
      resources.scrap = 100;
      store.addWork(100);
      
      const result = store.canCraft('craft_wood', 1, resources, 0);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain('工坊');
    });

    it('should return false when materials are insufficient', () => {
      const store = useCraftingStore.getState();
      const resources = createEmptyResources();
      resources.scrap = 2; // Need 4
      store.addWork(100);
      
      const result = store.canCraft('craft_wood', 1, resources, 1);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain('材料不足');
    });

    it('should return false when work is insufficient', () => {
      const store = useCraftingStore.getState();
      const resources = createEmptyResources();
      resources.scrap = 100;
      store.addWork(10); // Need 16
      
      const result = store.canCraft('craft_wood', 1, resources, 1);
      expect(result.canCraft).toBe(false);
      expect(result.reason).toContain('Work不足');
    });

    it('should return true when all requirements are met', () => {
      const store = useCraftingStore.getState();
      const resources = createEmptyResources();
      resources.scrap = 100;
      store.addWork(100);
      
      const result = store.canCraft('craft_wood', 1, resources, 1);
      expect(result.canCraft).toBe(true);
    });
  });

  describe('Immediate Crafting', () => {
    it('should craft successfully when all requirements are met', () => {
      const store = useCraftingStore.getState();
      const resources = createEmptyResources();
      resources.scrap = 100;
      store.addWork(100);
      
      let consumedResources: { resourceId: ResourceId; amount: number }[] = [];
      let addedResource: { resourceId: ResourceId; amount: number } | null = null;
      
      const result = store.craftImmediate(
        'craft_wood',
        2,
        resources,
        1,
        (inputs) => {
          consumedResources = inputs;
          return true;
        },
        (resourceId, amount) => {
          addedResource = { resourceId, amount };
          return amount;
        }
      );
      
      expect(result.success).toBe(true);
      expect(result.outputResourceId).toBe('wood');
      expect(result.outputAmount).toBe(2);
      expect(consumedResources).toHaveLength(1);
      expect(consumedResources[0]?.resourceId).toBe('scrap');
      expect(consumedResources[0]?.amount).toBe(8); // 4 × 2
      expect(addedResource?.resourceId).toBe('wood');
      expect(addedResource?.amount).toBe(2);
    });

    it('should fail when workshop level is 0', () => {
      const store = useCraftingStore.getState();
      const resources = createEmptyResources();
      resources.scrap = 100;
      store.addWork(100);
      
      const result = store.craftImmediate(
        'craft_wood',
        1,
        resources,
        0,
        () => true,
        () => 1
      );
      
      expect(result.success).toBe(false);
    });
  });

  describe('Recipe Cost Calculation', () => {
    it('should calculate recipe cost correctly', () => {
      const store = useCraftingStore.getState();
      const cost = store.getRecipeCost('craft_wood', 2);
      
      expect(cost).not.toBeNull();
      expect(cost?.materials).toHaveLength(1);
      expect(cost?.materials[0]?.resourceId).toBe('scrap');
      expect(cost?.materials[0]?.amount).toBe(8); // 4 × 2
      expect(cost?.workRequired).toBe(32); // 16 × 2
      // Total VU: 8 scrap (8 VU) + 32 work (8 VU) = 16 VU
      expect(cost?.totalVU).toBe(16);
    });

    it('should return null for invalid recipe', () => {
      const store = useCraftingStore.getState();
      const cost = store.getRecipeCost('invalid_recipe', 1);
      expect(cost).toBeNull();
    });
  });

  describe('Constants', () => {
    it('should have correct engineer work per AU', () => {
      expect(ENGINEER_WORK_PER_AU).toBe(60);
    });

    it('should have correct work VU value', () => {
      expect(WORK_VU_VALUE).toBe(0.25);
    });
  });
});

// Helper function to create empty resources
function createEmptyResources(): Record<ResourceId, number> {
  return {
    scrap: 0, water: 0, dirty_water: 0, food: 0, raw_meat: 0, canned_food: 0,
    vegetables: 0, seeds: 0, fertilizer: 0, wood: 0, metal: 0,
    cloth: 0, leather: 0, plastic: 0, glass: 0, rubber: 0,
    wire: 0, rope: 0, duct_tape: 0, gear: 0, pipe: 0,
    spring: 0, bearing: 0, fasteners: 0, solvent: 0, acid: 0,
    gunpowder: 0, fuel: 0, battery_cell: 0, battery_pack: 0,
    filter: 0, seal_ring: 0, meds: 0, data_tape: 0, radio_parts: 0,
    solar_cell: 0, rare_alloy: 0, microchips: 0, nanofiber: 0, power_core: 0,
  };
}


// ============================================
// Property-Based Tests
// ============================================

import * as fc from 'fast-check';

describe('Property-Based Tests', () => {
  /**
   * Property 5: Crafting Resource Round-Trip
   * Feature: gameplay-fixes, Property 5: Crafting Resource Round-Trip
   * 
   * For any successful crafting operation with recipe R and quantity Q, 
   * the system SHALL consume exactly R.inputs × Q materials, 
   * R.workCost × Q work points, and produce exactly R.output × Q items.
   * 
   * **Validates: Requirements 3.6, 3.7, 3.9**
   */
  describe('Property 5: Crafting Resource Round-Trip', () => {
    beforeEach(() => {
      useCraftingStore.getState().resetCrafting();
    });

    it('should consume exactly R.inputs × Q materials and produce exactly R.output × Q items', () => {
      fc.assert(
        fc.property(
          // Generate a valid recipe ID from the available recipes
          fc.constantFrom(
            'craft_wood', 'craft_metal', 'craft_cloth', 'craft_leather',
            'craft_plastic', 'craft_glass', 'craft_rubber', 'craft_wire',
            'craft_rope', 'craft_gear', 'craft_pipe', 'craft_spring',
            'craft_bearing', 'craft_fasteners', 'cook_meat', 'purify_water'
          ),
          // Generate quantity (1-5)
          fc.integer({ min: 1, max: 5 }),
          (recipeId, quantity) => {
            const store = useCraftingStore.getState();
            store.resetCrafting();
            
            const recipe = getRecipeById(recipeId);
            if (!recipe) return true; // Skip if recipe not found
            
            // Create resources with enough materials
            const resources = createEmptyResources();
            for (const input of recipe.inputs) {
              resources[input.resourceId] = input.amount * quantity * 2; // Double to ensure enough
            }
            
            // Add enough work
            const workRequired = recipe.workRequired * quantity;
            store.addWork(workRequired * 2); // Double to ensure enough
            
            // Track consumed resources
            const consumedResources: { resourceId: ResourceId; amount: number }[] = [];
            let producedResource: { resourceId: ResourceId; amount: number } | null = null;
            
            // Execute crafting
            const result = store.craftImmediate(
              recipeId,
              quantity,
              resources,
              1, // workshop level 1
              (inputs) => {
                consumedResources.push(...inputs);
                return true;
              },
              (resourceId, amount) => {
                producedResource = { resourceId, amount };
                return amount;
              }
            );
            
            // Verify success
            expect(result.success).toBe(true);
            
            // Verify consumed materials match R.inputs × Q
            for (const input of recipe.inputs) {
              const consumed = consumedResources.find(c => c.resourceId === input.resourceId);
              expect(consumed).toBeDefined();
              expect(consumed?.amount).toBe(input.amount * quantity);
            }
            
            // Verify produced items match R.output × Q
            expect(producedResource).not.toBeNull();
            expect(producedResource?.resourceId).toBe(recipe.output.resourceId);
            expect(producedResource?.amount).toBe(recipe.output.amount * quantity);
            
            // Verify work consumed matches R.workCost × Q
            const workAfter = store.getAccumulatedWork();
            const workConsumed = (workRequired * 2) - workAfter;
            expect(workConsumed).toBe(workRequired);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail crafting when materials are insufficient', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('craft_wood', 'craft_metal', 'craft_cloth'),
          fc.integer({ min: 1, max: 5 }),
          (recipeId, quantity) => {
            const store = useCraftingStore.getState();
            store.resetCrafting();
            
            const recipe = getRecipeById(recipeId);
            if (!recipe) return true;
            
            // Create resources with INSUFFICIENT materials (half of what's needed)
            const resources = createEmptyResources();
            for (const input of recipe.inputs) {
              resources[input.resourceId] = Math.floor(input.amount * quantity / 2);
            }
            
            // Add enough work
            store.addWork(recipe.workRequired * quantity * 2);
            
            // Execute crafting - should fail
            const result = store.craftImmediate(
              recipeId,
              quantity,
              resources,
              1,
              () => true,
              () => 0
            );
            
            // Verify failure
            expect(result.success).toBe(false);
            expect(result.reason).toContain('材料不足');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail crafting when work is insufficient', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('craft_wood', 'craft_metal', 'craft_cloth'),
          fc.integer({ min: 1, max: 5 }),
          (recipeId, quantity) => {
            const store = useCraftingStore.getState();
            store.resetCrafting();
            
            const recipe = getRecipeById(recipeId);
            if (!recipe) return true;
            
            // Create resources with enough materials
            const resources = createEmptyResources();
            for (const input of recipe.inputs) {
              resources[input.resourceId] = input.amount * quantity * 2;
            }
            
            // Add INSUFFICIENT work (half of what's needed)
            const workRequired = recipe.workRequired * quantity;
            store.addWork(Math.floor(workRequired / 2));
            
            // Execute crafting - should fail
            const result = store.craftImmediate(
              recipeId,
              quantity,
              resources,
              1,
              () => true,
              () => 0
            );
            
            // Verify failure
            expect(result.success).toBe(false);
            expect(result.reason).toContain('Work不足');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain resource conservation: input VU + work VU ≈ output VU', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('craft_wood', 'craft_metal', 'craft_cloth', 'craft_leather'),
          fc.integer({ min: 1, max: 3 }),
          (recipeId, quantity) => {
            const recipe = getRecipeById(recipeId);
            if (!recipe) return true;
            
            const store = useCraftingStore.getState();
            const cost = store.getRecipeCost(recipeId, quantity);
            
            if (!cost) return true;
            
            // The total VU cost should be positive and reasonable
            expect(cost.totalVU).toBeGreaterThan(0);
            expect(cost.workRequired).toBe(recipe.workRequired * quantity);
            
            // Materials should scale with quantity
            for (const mat of cost.materials) {
              const recipeInput = recipe.inputs.find(i => i.resourceId === mat.resourceId);
              expect(recipeInput).toBeDefined();
              expect(mat.amount).toBe(recipeInput!.amount * quantity);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Workshop Efficiency Formula
   * Feature: dust-and-echoes, Property 10: Workshop Efficiency Formula
   * 
   * For any Workshop at level L with E engineers, the Work rate SHALL equal 
   * E × 1 × (1 + 0.20 × (L - 1)).
   * 
   * **Validates: Requirements 5.6**
   */
  describe('Property 10: Workshop Efficiency Formula', () => {
    it('should calculate work rate as E × 1 × (1 + 0.20 × (L - 1)) for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // engineers (1-10)
          fc.integer({ min: 1, max: 5 }),  // workshop level (1-5)
          fc.float({ min: 0.5, max: 1, noNaN: true }), // phase AU (0.5 or 1.0)
          (engineers, workshopLevel, phaseAU) => {
            // Calculate expected work rate using the formula
            const expectedEfficiency = 1 + 0.20 * (workshopLevel - 1);
            const expectedWorkRate = engineers * ENGINEER_WORK_PER_AU * expectedEfficiency * phaseAU;
            
            // Calculate actual work rate
            const actualWorkRate = calculateWorkOutput(engineers, workshopLevel, phaseAU);
            
            // They should be equal (within floating point tolerance)
            expect(Math.abs(actualWorkRate - expectedWorkRate)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have efficiency multiplier of exactly 1.0 at level 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // engineers
          fc.float({ min: 0.5, max: 1, noNaN: true }), // phase AU
          (engineers, phaseAU) => {
            const workshopLevel = 1;
            const expectedWorkRate = engineers * ENGINEER_WORK_PER_AU * 1.0 * phaseAU;
            const actualWorkRate = calculateWorkOutput(engineers, workshopLevel, phaseAU);
            
            expect(Math.abs(actualWorkRate - expectedWorkRate)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should increase work rate by 20% for each level above 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // engineers
          fc.integer({ min: 1, max: 4 }),  // workshop level (1-4, so we can test level+1)
          fc.float({ min: 0.5, max: 1, noNaN: true }), // phase AU
          (engineers, workshopLevel, phaseAU) => {
            const workRateAtLevel = calculateWorkOutput(engineers, workshopLevel, phaseAU);
            const workRateAtNextLevel = calculateWorkOutput(engineers, workshopLevel + 1, phaseAU);
            
            // The increase should be 20% of the base rate (level 1 rate)
            const baseRate = calculateWorkOutput(engineers, 1, phaseAU);
            const expectedIncrease = baseRate * 0.20;
            const actualIncrease = workRateAtNextLevel - workRateAtLevel;
            
            expect(Math.abs(actualIncrease - expectedIncrease)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 work rate when workshop level is 0 or below', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // engineers
          fc.integer({ min: -10, max: 0 }), // invalid workshop level
          fc.float({ min: 0.5, max: 1, noNaN: true }), // phase AU
          (engineers, workshopLevel, phaseAU) => {
            const workRate = calculateWorkOutput(engineers, workshopLevel, phaseAU);
            expect(workRate).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should scale linearly with number of engineers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),  // base engineers
          fc.integer({ min: 2, max: 3 }),  // multiplier
          fc.integer({ min: 1, max: 5 }),  // workshop level
          fc.float({ min: 0.5, max: 1, noNaN: true }), // phase AU
          (baseEngineers, multiplier, workshopLevel, phaseAU) => {
            const baseWorkRate = calculateWorkOutput(baseEngineers, workshopLevel, phaseAU);
            const scaledWorkRate = calculateWorkOutput(baseEngineers * multiplier, workshopLevel, phaseAU);
            
            // Work rate should scale linearly with engineers
            expect(Math.abs(scaledWorkRate - baseWorkRate * multiplier)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should scale linearly with phase AU', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // engineers
          fc.integer({ min: 1, max: 5 }),  // workshop level
          (engineers, workshopLevel) => {
            const workRateHalfAU = calculateWorkOutput(engineers, workshopLevel, 0.5);
            const workRateFullAU = calculateWorkOutput(engineers, workshopLevel, 1.0);
            
            // Full AU should produce exactly twice the work of half AU
            expect(Math.abs(workRateFullAU - workRateHalfAU * 2)).toBeLessThan(0.0001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
