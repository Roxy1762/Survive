/**
 * 建筑系统测试
 * Building System Tests
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  useBuildingStore,
  canBuildOrUpgrade,
  calculateWandererRate,
  calculateBonfireFuelConsumption,
} from './buildingStore';
import { BUILDINGS, calculateShelterCost } from '../config/buildings';
import type { BuildingId } from '../types';

describe('Building Store', () => {
  beforeEach(() => {
    useBuildingStore.getState().resetBuildings();
  });

  describe('Initial State', () => {
    it('should initialize all buildings at level 0', () => {
      const state = useBuildingStore.getState();
      
      for (const buildingId of Object.keys(BUILDINGS)) {
        expect(state.getBuildingLevel(buildingId as BuildingId)).toBe(0);
      }
    });

    it('should initialize bonfire intensity to off', () => {
      const state = useBuildingStore.getState();
      expect(state.getBonfireIntensity()).toBe('off');
    });
  });

  describe('Building Level Management', () => {
    it('should set building level correctly', () => {
      const store = useBuildingStore.getState();
      
      store.setBuildingLevel('shelter', 3);
      expect(store.getBuildingLevel('shelter')).toBe(3);
    });

    it('should clamp building level to max level', () => {
      const store = useBuildingStore.getState();
      
      // Shelter max level is 10
      store.setBuildingLevel('shelter', 15);
      expect(store.getBuildingLevel('shelter')).toBe(10);
    });

    it('should not allow negative levels', () => {
      const store = useBuildingStore.getState();
      
      store.setBuildingLevel('shelter', -5);
      expect(store.getBuildingLevel('shelter')).toBe(0);
    });

    it('should report building as built when level > 0', () => {
      const store = useBuildingStore.getState();
      
      expect(store.isBuildingBuilt('shelter')).toBe(false);
      store.setBuildingLevel('shelter', 1);
      expect(store.isBuildingBuilt('shelter')).toBe(true);
    });
  });

  describe('Build/Upgrade Logic', () => {
    it('should check if building can be built with sufficient resources', () => {
      const resources: Record<ResourceId, number> = {
        scrap: 100,
        wood: 50,
        water: 0, dirty_water: 0, food: 0, raw_meat: 0, canned_food: 0,
        vegetables: 0, seeds: 0, fertilizer: 0, metal: 0, cloth: 0,
        leather: 0, plastic: 0, glass: 0, rubber: 0, wire: 0, rope: 0,
        duct_tape: 0, gear: 0, pipe: 0, spring: 0, bearing: 0, fasteners: 0,
        solvent: 0, acid: 0, gunpowder: 0, fuel: 0, battery_cell: 0,
        battery_pack: 0, filter: 0, seal_ring: 0, meds: 0, data_tape: 0,
        radio_parts: 0, solar_cell: 0, rare_alloy: 0, microchips: 0,
        nanofiber: 0, power_core: 0
      };
      
      const result = canBuildOrUpgrade('shelter', 0, resources);
      expect(result.canBuild).toBe(true);
      expect(result.cost).toBeDefined();
    });

    it('should reject building when resources are insufficient', () => {
      const resources: Record<ResourceId, number> = {
        scrap: 5, // Not enough
        wood: 2,  // Not enough
        water: 0, dirty_water: 0, food: 0, raw_meat: 0, canned_food: 0,
        vegetables: 0, seeds: 0, fertilizer: 0, metal: 0, cloth: 0,
        leather: 0, plastic: 0, glass: 0, rubber: 0, wire: 0, rope: 0,
        duct_tape: 0, gear: 0, pipe: 0, spring: 0, bearing: 0, fasteners: 0,
        solvent: 0, acid: 0, gunpowder: 0, fuel: 0, battery_cell: 0,
        battery_pack: 0, filter: 0, seal_ring: 0, meds: 0, data_tape: 0,
        radio_parts: 0, solar_cell: 0, rare_alloy: 0, microchips: 0,
        nanofiber: 0, power_core: 0
      };
      
      const result = canBuildOrUpgrade('shelter', 0, resources);
      expect(result.canBuild).toBe(false);
      expect(result.reason).toContain('资源不足');
    });

    it('should reject building when max level reached', () => {
      const resources: Record<ResourceId, number> = {
        scrap: 10000,
        wood: 5000,
        water: 0, dirty_water: 0, food: 0, raw_meat: 0, canned_food: 0,
        vegetables: 0, seeds: 0, fertilizer: 0, metal: 0, cloth: 0,
        leather: 0, plastic: 0, glass: 0, rubber: 0, wire: 0, rope: 0,
        duct_tape: 0, gear: 0, pipe: 0, spring: 0, bearing: 0, fasteners: 0,
        solvent: 0, acid: 0, gunpowder: 0, fuel: 0, battery_cell: 0,
        battery_pack: 0, filter: 0, seal_ring: 0, meds: 0, data_tape: 0,
        radio_parts: 0, solar_cell: 0, rare_alloy: 0, microchips: 0,
        nanofiber: 0, power_core: 0
      };
      
      // Shelter max level is 10
      const result = canBuildOrUpgrade('shelter', 10, resources);
      expect(result.canBuild).toBe(false);
      expect(result.reason).toBe('已达最大等级');
    });

    it('should upgrade building level', () => {
      const store = useBuildingStore.getState();
      
      expect(store.getBuildingLevel('shelter')).toBe(0);
      store.buildOrUpgrade('shelter');
      expect(store.getBuildingLevel('shelter')).toBe(1);
      store.buildOrUpgrade('shelter');
      expect(store.getBuildingLevel('shelter')).toBe(2);
    });
  });

  describe('Bonfire Special Logic', () => {
    it('should not allow setting intensity when bonfire not built', () => {
      const store = useBuildingStore.getState();
      
      store.setBonfireIntensity('high');
      expect(store.getBonfireIntensity()).toBe('off');
    });

    it('should allow setting intensity when bonfire is built', () => {
      const store = useBuildingStore.getState();
      
      store.setBuildingLevel('bonfire', 1);
      store.setBonfireIntensity('high');
      expect(store.getBonfireIntensity()).toBe('high');
    });

    it('should calculate correct fuel consumption', () => {
      const phaseAU = 1.0;
      
      expect(calculateBonfireFuelConsumption('off', phaseAU)).toBe(0);
      expect(calculateBonfireFuelConsumption('low', phaseAU)).toBe(0.3);
      expect(calculateBonfireFuelConsumption('medium', phaseAU)).toBe(0.8);
      expect(calculateBonfireFuelConsumption('high', phaseAU)).toBe(1.6);
    });

    it('should calculate correct fuel consumption for half phases', () => {
      const phaseAU = 0.5;
      
      expect(calculateBonfireFuelConsumption('low', phaseAU)).toBe(0.15);
      expect(calculateBonfireFuelConsumption('medium', phaseAU)).toBe(0.4);
      expect(calculateBonfireFuelConsumption('high', phaseAU)).toBe(0.8);
    });

    it('should calculate wanderer rate correctly', () => {
      const populationCap = 10;
      const currentPopulation = 5;
      // availableSlots = populationCap - currentPopulation = 5
      
      // λ = 0.2 × intensity × (cap - pop)
      expect(calculateWandererRate('off', populationCap, currentPopulation)).toBe(0);
      expect(calculateWandererRate('low', populationCap, currentPopulation)).toBe(0.2 * 1 * 5);
      expect(calculateWandererRate('medium', populationCap, currentPopulation)).toBe(0.2 * 2 * 5);
      expect(calculateWandererRate('high', populationCap, currentPopulation)).toBe(0.2 * 3 * 5);
    });

    it('should return 0 wanderer rate when population is at cap', () => {
      expect(calculateWandererRate('high', 10, 10)).toBe(0);
    });
  });

  describe('Building Effects', () => {
    it('should calculate population cap bonus from shelter', () => {
      const store = useBuildingStore.getState();
      
      expect(store.getPopulationCapBonus()).toBe(0);
      
      store.setBuildingLevel('shelter', 1);
      expect(store.getPopulationCapBonus()).toBe(2);
      
      store.setBuildingLevel('shelter', 5);
      expect(store.getPopulationCapBonus()).toBe(10);
    });

    it('should return unlocked jobs from buildings', () => {
      const store = useBuildingStore.getState();
      
      expect(store.getUnlockedJobs()).toEqual([]);
      
      store.setBuildingLevel('water_collector', 1);
      expect(store.getUnlockedJobs()).toContain('water_collector');
      
      store.setBuildingLevel('trap', 1);
      expect(store.getUnlockedJobs()).toContain('hunter');
      
      store.setBuildingLevel('scavenge_post', 1);
      expect(store.getUnlockedJobs()).toContain('scavenger');
    });

    it('should return unlocked regions from radio tower', () => {
      const store = useBuildingStore.getState();
      
      expect(store.getUnlockedRegions()).toEqual([]);
      
      store.setBuildingLevel('radio_tower', 1);
      expect(store.getUnlockedRegions()).toContain('T1');
      
      store.setBuildingLevel('radio_tower', 2);
      expect(store.getUnlockedRegions()).toContain('T2');
    });

    it('should calculate building efficiency multiplier', () => {
      const store = useBuildingStore.getState();
      
      // Level 0 should return 0
      expect(store.getBuildingEfficiency('water_collector')).toBe(0);
      
      store.setBuildingLevel('water_collector', 1);
      expect(store.getBuildingEfficiency('water_collector')).toBe(1.0);
      
      store.setBuildingLevel('water_collector', 2);
      expect(store.getBuildingEfficiency('water_collector')).toBe(1.1);
      
      store.setBuildingLevel('water_collector', 5);
      expect(store.getBuildingEfficiency('water_collector')).toBe(1.4);
    });

    it('should calculate workshop efficiency multiplier', () => {
      const store = useBuildingStore.getState();
      
      // Level 0 should return 0
      expect(store.getWorkshopEfficiency()).toBe(0);
      
      store.setBuildingLevel('workshop', 1);
      expect(store.getWorkshopEfficiency()).toBe(1.0);
      
      store.setBuildingLevel('workshop', 2);
      expect(store.getWorkshopEfficiency()).toBe(1.2);
      
      store.setBuildingLevel('workshop', 5);
      expect(store.getWorkshopEfficiency()).toBe(1.8);
    });

    it('should calculate max worker slots', () => {
      const store = useBuildingStore.getState();
      
      // Level 0 should return 0
      expect(store.getBuildingMaxWorkerSlots('water_collector')).toBe(0);
      
      // Water/Food: 2 + 2L
      store.setBuildingLevel('water_collector', 1);
      expect(store.getBuildingMaxWorkerSlots('water_collector')).toBe(4); // 2 + 2*1
      
      store.setBuildingLevel('water_collector', 3);
      expect(store.getBuildingMaxWorkerSlots('water_collector')).toBe(8); // 2 + 2*3
      
      // Scrap: 3 + 3L
      store.setBuildingLevel('scavenge_post', 1);
      expect(store.getBuildingMaxWorkerSlots('scavenge_post')).toBe(6); // 3 + 3*1
      
      store.setBuildingLevel('scavenge_post', 3);
      expect(store.getBuildingMaxWorkerSlots('scavenge_post')).toBe(12); // 3 + 3*3
    });
  });

  describe('Reset', () => {
    it('should reset all buildings to initial state', () => {
      const store = useBuildingStore.getState();
      
      store.setBuildingLevel('shelter', 5);
      store.setBuildingLevel('bonfire', 1);
      store.setBonfireIntensity('high');
      
      store.resetBuildings();
      
      expect(store.getBuildingLevel('shelter')).toBe(0);
      expect(store.getBuildingLevel('bonfire')).toBe(0);
      expect(store.getBonfireIntensity()).toBe('off');
    });
  });
});

describe('Shelter Cost Progression', () => {
  it('should calculate shelter cost with 1.25^(k-1) formula', () => {
    // Base VU = 84
    
    // Level 1: 84 * 1.25^0 = 84
    expect(calculateShelterCost(1)).toBe(84);
    
    // Level 2: 84 * 1.25^1 = 105
    expect(calculateShelterCost(2)).toBe(105);
    
    // Level 3: 84 * 1.25^2 ≈ 131.25 → 131
    expect(calculateShelterCost(3)).toBe(131);
    
    // Level 5: 84 * 1.25^4 ≈ 205.08 → 205
    expect(calculateShelterCost(5)).toBe(205);
  });
});


// ============================================
// Property-Based Tests
// ============================================

import * as fc from 'fast-check';

describe('Property-Based Tests', () => {
  /**
   * Property 9: Building Cost Progression
   * For any Shelter building at position k, the cost SHALL equal Base × 1.25^(k-1) where Base = 84 VU.
   * 
   * Feature: dust-and-echoes, Property 9: Building Cost Progression
   * Validates: Requirements 4.1, 4.2
   */
  describe('Property 9: Building Cost Progression', () => {
    it('should follow the formula Cost(k) = Base × 1.25^(k-1) for shelter', () => {
      const baseVU = 84;
      
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Shelter max level is 10
          (k) => {
            const expectedCost = Math.round(baseVU * Math.pow(1.25, k - 1));
            const actualCost = calculateShelterCost(k);
            
            // Allow for small rounding differences (±1)
            return Math.abs(actualCost - expectedCost) <= 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have monotonically increasing costs for shelter', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9 }), // k from 1 to 9 (so k+1 is valid)
          (k) => {
            const costK = calculateShelterCost(k);
            const costKPlus1 = calculateShelterCost(k + 1);
            
            // Cost should increase with level
            return costKPlus1 > costK;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have cost ratio approximately 1.25 between consecutive levels', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9 }),
          (k) => {
            const costK = calculateShelterCost(k);
            const costKPlus1 = calculateShelterCost(k + 1);
            
            const ratio = costKPlus1 / costK;
            
            // Ratio should be approximately 1.25 (allow for rounding: 1.20 to 1.30)
            return ratio >= 1.20 && ratio <= 1.30;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
