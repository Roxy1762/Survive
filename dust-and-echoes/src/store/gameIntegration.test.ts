/**
 * 游戏集成测试
 * Game Integration Tests
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
// Import gameIntegration first to ensure callback registration
import {
  processResourceShortage,
  WATER_SHORTAGE_DAMAGE_PER_AU,
  FOOD_SHORTAGE_DAMAGE_PER_AU,
  type ShortageResult,
} from './gameIntegration';
import { useBuildingStore, WAREHOUSE_STORAGE_INCREMENT } from './buildingStore';
import { usePopulationStore } from './populationStore';
import { useResourceStore, DEFAULT_RESOURCE_CAPS } from './resourceStore';
import { useExplorationStore } from './explorationStore';
import { useEventStore } from './eventStore';
import { useTimeStore } from './timeStore';
import type { ResourceId, JobId } from '../types';

// ============================================
// 测试辅助函数
// Test Helper Functions
// ============================================

/**
 * 重置所有相关store到初始状态
 */
function resetStores(): void {
  usePopulationStore.getState().resetPopulation();
  useEventStore.getState().resetEvents();
  useTimeStore.getState().resetTime();
}

/**
 * 创建测试工人
 */
function createTestWorkers(count: number, health: number = 100): void {
  const store = usePopulationStore.getState();
  store.setPopulationCap(count + 5); // Ensure we have enough cap
  for (let i = 0; i < count; i++) {
    const worker = store.addWorker(`Worker_${i}`);
    if (worker && health !== 100) {
      store.setWorkerHealth(worker.id, health);
    }
  }
}

// ============================================
// Property-Based Tests
// Feature: game-improvements, Property 4: Resource Shortage Health Damage
// Validates: Requirements 3.1, 3.2, 3.6
// ============================================

describe('Property-Based Tests: Resource Shortage Health Damage', () => {
  beforeEach(() => {
    resetStores();
  });

  /**
   * Property 4: Resource Shortage Health Damage
   * 
   * For any resource shortage event:
   * - Water shortage of N AU SHALL reduce worker health by N * 10
   * - Food shortage of N AU SHALL reduce worker health by N * 8
   * - Damage SHALL be applied to lowest-health workers first
   * 
   * **Validates: Requirements 3.1, 3.2, 3.6**
   */
  it('should calculate correct damage for water shortage', () => {
    // Generator for water shortage amounts (in AU) - use integers for simplicity
    const waterShortageArb = fc.integer({ min: 1, max: 5 });
    const workerCountArb = fc.integer({ min: 1, max: 5 });
    const workerHealthArb = fc.integer({ min: 50, max: 100 });

    fc.assert(
      fc.property(waterShortageArb, workerCountArb, workerHealthArb, (waterShortage, workerCount, workerHealth) => {
        resetStores();
        createTestWorkers(workerCount, workerHealth);

        const shortageResult: ShortageResult = {
          waterShortage,
          foodShortage: 0,
        };

        const result = processResourceShortage(shortageResult);

        // Calculate expected damage
        const expectedDamage = waterShortage * WATER_SHORTAGE_DAMAGE_PER_AU;

        // Verify total damage matches expected
        expect(result.totalDamage).toBe(expectedDamage);

        // Verify all workers received damage
        expect(result.workersInjured.length).toBe(workerCount);

        // Verify each worker received the correct damage
        for (const injured of result.workersInjured) {
          expect(injured.damage).toBe(expectedDamage);
          expect(injured.newHealth).toBe(Math.max(0, workerHealth - expectedDamage));
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should calculate correct damage for food shortage', () => {
    // Generator for food shortage amounts (in AU) - use integers for simplicity
    const foodShortageArb = fc.integer({ min: 1, max: 5 });
    const workerCountArb = fc.integer({ min: 1, max: 5 });
    const workerHealthArb = fc.integer({ min: 50, max: 100 });

    fc.assert(
      fc.property(foodShortageArb, workerCountArb, workerHealthArb, (foodShortage, workerCount, workerHealth) => {
        resetStores();
        createTestWorkers(workerCount, workerHealth);

        const shortageResult: ShortageResult = {
          waterShortage: 0,
          foodShortage,
        };

        const result = processResourceShortage(shortageResult);

        // Calculate expected damage
        const expectedDamage = foodShortage * FOOD_SHORTAGE_DAMAGE_PER_AU;

        // Verify total damage matches expected
        expect(result.totalDamage).toBe(expectedDamage);

        // Verify all workers received damage
        expect(result.workersInjured.length).toBe(workerCount);

        // Verify each worker received the correct damage
        for (const injured of result.workersInjured) {
          expect(injured.damage).toBe(expectedDamage);
          expect(injured.newHealth).toBe(Math.max(0, workerHealth - expectedDamage));
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should calculate combined damage for both water and food shortage', () => {
    // Generator for combined shortage amounts - use integers for simplicity
    const waterShortageArb = fc.integer({ min: 1, max: 3 });
    const foodShortageArb = fc.integer({ min: 1, max: 3 });
    const workerCountArb = fc.integer({ min: 1, max: 5 });

    fc.assert(
      fc.property(waterShortageArb, foodShortageArb, workerCountArb, (waterShortage, foodShortage, workerCount) => {
        resetStores();
        createTestWorkers(workerCount, 100);

        const shortageResult: ShortageResult = {
          waterShortage,
          foodShortage,
        };

        const result = processResourceShortage(shortageResult);

        // Calculate expected combined damage
        const expectedWaterDamage = waterShortage * WATER_SHORTAGE_DAMAGE_PER_AU;
        const expectedFoodDamage = foodShortage * FOOD_SHORTAGE_DAMAGE_PER_AU;
        const expectedTotalDamage = expectedWaterDamage + expectedFoodDamage;

        // Verify total damage matches expected
        expect(result.totalDamage).toBe(expectedTotalDamage);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should apply damage to lowest-health workers first', () => {
    // This test verifies that workers are sorted by health before damage is applied
    // The sorting ensures lowest-health workers are processed first
    
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 5 }), (workerCount) => {
        resetStores();
        
        // Create workers with varying health levels
        const store = usePopulationStore.getState();
        store.setPopulationCap(workerCount + 5);
        
        // Create workers with distinct health levels
        const healthLevels: number[] = [];
        for (let i = 0; i < workerCount; i++) {
          healthLevels.push(30 + i * 20); // 30, 50, 70, 90, ...
        }
        
        // Shuffle to ensure they're not in order when created
        const shuffledHealthLevels = [...healthLevels].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < workerCount; i++) {
          const worker = store.addWorker(`Worker_${i}`);
          if (worker) {
            store.setWorkerHealth(worker.id, shuffledHealthLevels[i]!);
          }
        }

        // Get the minimum health before damage
        const workers = store.workers;
        if (workers.length === 0) {
          return true; // Skip if no workers were created
        }
        
        const minHealthBefore = Math.min(...workers.map(w => w.health));

        const shortageResult: ShortageResult = {
          waterShortage: 1, // 10 damage
          foodShortage: 0,
        };

        const result = processResourceShortage(shortageResult);

        // Verify that the result contains workers sorted by health (lowest first)
        // The first injured worker should have been the one with lowest health
        if (result.workersInjured.length > 0) {
          const firstInjured = result.workersInjured[0];
          // The new health should be the lowest health minus damage
          expect(firstInjured?.newHealth).toBe(Math.max(0, minHealthBefore - 10));
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should return no damage when there is no shortage', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (workerCount) => {
        resetStores();
        createTestWorkers(workerCount, 100);

        const shortageResult: ShortageResult = {
          waterShortage: 0,
          foodShortage: 0,
        };

        const result = processResourceShortage(shortageResult);

        // No damage should be applied
        expect(result.totalDamage).toBe(0);
        expect(result.workersInjured.length).toBe(0);
        expect(result.workersDied.length).toBe(0);

        // Workers should still have full health
        const workers = usePopulationStore.getState().workers;
        for (const worker of workers) {
          expect(worker.health).toBe(100);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================
// Property-Based Tests
// Feature: game-improvements, Property 5: Worker Death on Zero Health
// Validates: Requirements 3.3, 3.4
// ============================================

describe('Property-Based Tests: Worker Death on Zero Health', () => {
  beforeEach(() => {
    resetStores();
  });

  /**
   * Property 5: Worker Death on Zero Health
   * 
   * For any worker whose health reaches 0:
   * - The worker SHALL be removed from the population
   * - A death event SHALL be logged
   * - Workers lost statistic SHALL increment (tracked in workersDied result)
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should remove worker when health reaches zero', () => {
    // Generator for shortage that will kill workers with low health
    const shortageArb = fc.float({ min: 5, max: 10, noNaN: true }); // High shortage to ensure death
    const workerCountArb = fc.integer({ min: 1, max: 3 });
    const lowHealthArb = fc.integer({ min: 1, max: 30 }); // Low health to ensure death

    fc.assert(
      fc.property(shortageArb, workerCountArb, lowHealthArb, (shortage, workerCount, lowHealth) => {
        resetStores();
        createTestWorkers(workerCount, lowHealth);

        const workerCountBefore = usePopulationStore.getState().workers.length;

        const shortageResult: ShortageResult = {
          waterShortage: shortage,
          foodShortage: 0,
        };

        const result = processResourceShortage(shortageResult);

        // Calculate expected damage
        const expectedDamage = shortage * WATER_SHORTAGE_DAMAGE_PER_AU;

        // If damage exceeds health, workers should die
        if (expectedDamage >= lowHealth) {
          // All workers should have died
          expect(result.workersDied.length).toBe(workerCount);
          
          // Workers should be removed from population
          const workersAfter = usePopulationStore.getState().workers.length;
          expect(workersAfter).toBe(workerCountBefore - result.workersDied.length);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should log death event when worker dies', () => {
    // Generator for lethal shortage
    const shortageArb = fc.float({ min: 10, max: 15, noNaN: true }); // Very high shortage

    fc.assert(
      fc.property(shortageArb, (shortage) => {
        resetStores();
        createTestWorkers(1, 50); // Worker with 50 health

        const eventLogBefore = useEventStore.getState().eventLog.length;

        const shortageResult: ShortageResult = {
          waterShortage: shortage,
          foodShortage: 0,
        };

        const result = processResourceShortage(shortageResult);

        // If worker died, a death event should be logged
        if (result.workersDied.length > 0) {
          const eventLogAfter = useEventStore.getState().eventLog;
          expect(eventLogAfter.length).toBeGreaterThan(eventLogBefore);
          
          // Find death events
          const deathEvents = eventLogAfter.filter(e => e.type === 'death');
          expect(deathEvents.length).toBe(result.workersDied.length);
          
          // Verify death event content
          for (const deathEvent of deathEvents) {
            expect(deathEvent.messageZh).toContain('死亡');
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should track death cause correctly (dehydration vs starvation)', () => {
    fc.assert(
      fc.property(fc.boolean(), (isWaterShortage) => {
        resetStores();
        createTestWorkers(1, 5); // Very low health worker

        const shortageResult: ShortageResult = {
          waterShortage: isWaterShortage ? 10 : 0,
          foodShortage: isWaterShortage ? 0 : 10,
        };

        const result = processResourceShortage(shortageResult);

        // Worker should have died
        expect(result.workersDied.length).toBe(1);

        // Check death cause
        const deadWorker = result.workersDied[0];
        if (isWaterShortage) {
          expect(deadWorker?.cause).toBe('脱水');
        } else {
          expect(deadWorker?.cause).toBe('饥饿');
        }

        // Verify event log contains correct cause
        const eventLog = useEventStore.getState().eventLog;
        const deathEvent = eventLog.find(e => e.type === 'death');
        expect(deathEvent).toBeDefined();
        
        if (isWaterShortage) {
          expect(deathEvent?.messageZh).toContain('脱水');
        } else {
          expect(deathEvent?.messageZh).toContain('饥饿');
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should not remove workers when health stays above zero', () => {
    // Generator for small shortage that won't kill healthy workers - use integers
    const smallShortageArb = fc.integer({ min: 1, max: 3 }); // Max 30 damage
    const workerCountArb = fc.integer({ min: 1, max: 5 });

    fc.assert(
      fc.property(smallShortageArb, workerCountArb, (shortage, workerCount) => {
        resetStores();
        createTestWorkers(workerCount, 100); // Full health workers

        const workerCountBefore = usePopulationStore.getState().workers.length;

        const shortageResult: ShortageResult = {
          waterShortage: shortage,
          foodShortage: 0,
        };

        const result = processResourceShortage(shortageResult);

        // Calculate expected damage
        const expectedDamage = shortage * WATER_SHORTAGE_DAMAGE_PER_AU;

        // If damage is less than health, no workers should die
        if (expectedDamage < 100) {
          expect(result.workersDied.length).toBe(0);
          
          // Worker count should remain the same
          const workersAfter = usePopulationStore.getState().workers.length;
          expect(workersAfter).toBe(workerCountBefore);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Property-Based Tests
// Feature: gameplay-fixes, Property 1: Building Effect Synchronization
// Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 6.1
// ============================================

/**
 * Reset all stores for building effect tests
 */
function resetBuildingEffectStores(): void {
  useBuildingStore.getState().resetBuildings();
  usePopulationStore.getState().resetPopulation();
  useResourceStore.getState().resetResources();
  useExplorationStore.getState().resetExploration();
}

describe('Property-Based Tests: Building Effect Synchronization', () => {
  beforeEach(() => {
    resetBuildingEffectStores();
  });

  /**
   * Property 1: Building Effect Synchronization
   * 
   * For any building at level L, all building effects for that level SHALL be active
   * in the corresponding systems (population cap, storage cap, job slots, exploration regions).
   * 
   * **Feature: gameplay-fixes, Property 1: Building Effect Synchronization**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 6.1**
   */
  it('should sync shelter population cap bonus correctly', () => {
    // Generator for shelter level (1-10)
    const shelterLevelArb = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.property(shelterLevelArb, (shelterLevel) => {
        resetBuildingEffectStores();
        
        // Build shelter to specified level
        useBuildingStore.getState().setBuildingLevel('shelter', shelterLevel);
        
        // Get fresh state after sync
        const populationCap = usePopulationStore.getState().populationCap;
        
        // Verify population cap is synced
        // Base cap (2) + shelter bonus (2 per level)
        const expectedPopCap = 2 + (shelterLevel * 2);
        expect(populationCap).toBe(expectedPopCap);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync warehouse storage caps correctly', () => {
    // Generator for warehouse level (1-5)
    const warehouseLevelArb = fc.integer({ min: 1, max: 5 });

    fc.assert(
      fc.property(warehouseLevelArb, (warehouseLevel) => {
        resetBuildingEffectStores();
        
        const buildingStore = useBuildingStore.getState();
        const resourceStore = useResourceStore.getState();
        
        // Build warehouse to specified level
        buildingStore.setBuildingLevel('warehouse', warehouseLevel);
        
        // Verify storage caps are synced for key resources
        const testResources: ResourceId[] = ['water', 'food', 'scrap', 'wood', 'metal'];
        
        for (const resourceId of testResources) {
          const baseCap = DEFAULT_RESOURCE_CAPS[resourceId] ?? 0;
          const bonus = (WAREHOUSE_STORAGE_INCREMENT[resourceId] ?? 0) * warehouseLevel;
          const expectedCap = baseCap + bonus;
          
          expect(resourceStore.getResourceCap(resourceId)).toBe(expectedCap);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync production building job slots correctly', () => {
    // Generator for production building levels
    const buildingLevelArb = fc.integer({ min: 1, max: 5 });

    fc.assert(
      fc.property(buildingLevelArb, (level) => {
        resetBuildingEffectStores();
        
        const buildingStore = useBuildingStore.getState();
        const populationStore = usePopulationStore.getState();
        
        // Build water collector
        buildingStore.setBuildingLevel('water_collector', level);
        
        // Verify job slots are synced
        // Water collector: 2 + 2L slots
        const expectedSlots = 2 + (2 * level);
        expect(populationStore.getJobMaxSlots('water_collector')).toBe(expectedSlots);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync scavenge post job slots correctly', () => {
    // Generator for scavenge post levels
    const buildingLevelArb = fc.integer({ min: 1, max: 5 });

    fc.assert(
      fc.property(buildingLevelArb, (level) => {
        resetBuildingEffectStores();
        
        const buildingStore = useBuildingStore.getState();
        const populationStore = usePopulationStore.getState();
        
        // Build scavenge post
        buildingStore.setBuildingLevel('scavenge_post', level);
        
        // Verify job slots are synced
        // Scavenge post: 3 + 3L slots
        const expectedSlots = 3 + (3 * level);
        expect(populationStore.getJobMaxSlots('scavenger')).toBe(expectedSlots);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync radio tower exploration regions correctly', () => {
    // Generator for radio tower levels (1-3)
    const radioTowerLevelArb = fc.integer({ min: 1, max: 3 });

    fc.assert(
      fc.property(radioTowerLevelArb, (level) => {
        resetBuildingEffectStores();
        
        // Build radio tower
        useBuildingStore.getState().setBuildingLevel('radio_tower', level);
        
        // Get fresh state after sync
        const radioTowerLevel = useExplorationStore.getState().radioTowerLevel;
        
        // Verify radio tower level is synced to exploration store
        expect(radioTowerLevel).toBe(level);
        
        // Verify unlocked regions based on level
        const unlockedRegions = useBuildingStore.getState().getUnlockedRegions();
        if (level >= 1) expect(unlockedRegions).toContain('T1');
        if (level >= 2) expect(unlockedRegions).toContain('T2');
        if (level >= 3) expect(unlockedRegions).toContain('T3');
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync all building effects when multiple buildings are upgraded', () => {
    // Generator for multiple building levels
    const shelterLevelArb = fc.integer({ min: 0, max: 5 });
    const warehouseLevelArb = fc.integer({ min: 0, max: 3 });
    const waterCollectorLevelArb = fc.integer({ min: 0, max: 3 });

    fc.assert(
      fc.property(
        shelterLevelArb,
        warehouseLevelArb,
        waterCollectorLevelArb,
        (shelterLevel, warehouseLevel, waterCollectorLevel) => {
          resetBuildingEffectStores();
          
          // Build multiple buildings
          if (shelterLevel > 0) useBuildingStore.getState().setBuildingLevel('shelter', shelterLevel);
          if (warehouseLevel > 0) useBuildingStore.getState().setBuildingLevel('warehouse', warehouseLevel);
          if (waterCollectorLevel > 0) useBuildingStore.getState().setBuildingLevel('water_collector', waterCollectorLevel);
          
          // Get fresh state after sync
          const populationCap = usePopulationStore.getState().populationCap;
          
          // Verify all effects are synced
          
          // Population cap
          const expectedPopCap = 2 + (shelterLevel * 2);
          expect(populationCap).toBe(expectedPopCap);
          
          // Storage caps (water as example)
          const baseWaterCap = DEFAULT_RESOURCE_CAPS['water'] ?? 0;
          const warehouseBonus = warehouseLevel > 0 ? (WAREHOUSE_STORAGE_INCREMENT['water'] ?? 0) * warehouseLevel : 0;
          const expectedWaterCap = baseWaterCap + warehouseBonus;
          expect(useResourceStore.getState().getResourceCap('water')).toBe(expectedWaterCap);
          
          // Job slots
          if (waterCollectorLevel > 0) {
            const expectedSlots = 2 + (2 * waterCollectorLevel);
            expect(usePopulationStore.getState().getJobMaxSlots('water_collector')).toBe(expectedSlots);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should immediately apply building effects after buildOrUpgrade', () => {
    // This test verifies that effects are applied immediately, not lazily
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 3 }), (upgradeCount) => {
        resetBuildingEffectStores();
        
        // Upgrade shelter multiple times
        for (let i = 0; i < upgradeCount; i++) {
          useBuildingStore.getState().buildOrUpgrade('shelter');
          
          // Verify effect is applied immediately after each upgrade
          const currentLevel = useBuildingStore.getState().getBuildingLevel('shelter');
          const expectedPopCap = 2 + (currentLevel * 2);
          expect(usePopulationStore.getState().populationCap).toBe(expectedPopCap);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Property-Based Tests
// Feature: gameplay-fixes, Property 8: Auto-Advance Behavior
// Feature: gameplay-fixes, Property 9: Auto-Advance Setting Persistence
// Validates: Requirements 5.2, 5.3, 5.7
// ============================================

import { useGameStateStore } from './gameStateStore';
import { useActionStore } from './actionStore';
import { 
  shouldAutoAdvance, 
  performAutoAdvance,
  collectGameState,
  restoreGameState,
} from './gameIntegration';
import { createEmptySaveData } from './saveStore';

/**
 * Reset stores for auto-advance tests
 */
function resetAutoAdvanceStores(): void {
  useGameStateStore.getState().resetGameState();
  useTimeStore.getState().resetTime();
  useActionStore.getState().resetActions();
  useEventStore.getState().resetEvents();
  usePopulationStore.getState().resetPopulation();
  useResourceStore.getState().resetResources();
}

describe('Property-Based Tests: Auto-Advance Behavior', () => {
  beforeEach(() => {
    resetAutoAdvanceStores();
  });

  /**
   * Property 8: Auto-Advance Behavior
   * 
   * For any phase where auto-advance is enabled AND remaining AU equals 0,
   * the system SHALL automatically advance to the next phase and process
   * all phase-end calculations.
   * 
   * **Feature: gameplay-fixes, Property 8: Auto-Advance Behavior**
   * **Validates: Requirements 5.2, 5.3**
   */
  it('should trigger auto-advance when enabled and AU is 0', () => {
    // Generator for remaining AU values - use integer to avoid float precision issues
    const remainingAUArb = fc.integer({ min: -10, max: 20 }).map(n => n / 10); // -1.0 to 2.0
    const autoAdvanceEnabledArb = fc.boolean();

    fc.assert(
      fc.property(remainingAUArb, autoAdvanceEnabledArb, (remainingAU, autoAdvanceEnabled) => {
        resetAutoAdvanceStores();
        
        // Set auto-advance setting
        useGameStateStore.getState().setAutoAdvanceEnabled(autoAdvanceEnabled);
        
        // Check if auto-advance should trigger
        const shouldTrigger = shouldAutoAdvance(remainingAU);
        
        // Verify the logic: should trigger only when enabled AND AU <= 0
        const expectedTrigger = autoAdvanceEnabled && remainingAU <= 0;
        expect(shouldTrigger).toBe(expectedTrigger);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT trigger auto-advance when disabled regardless of AU', () => {
    // Generator for remaining AU values including 0 - use integer to avoid float precision issues
    const remainingAUArb = fc.integer({ min: -10, max: 20 }).map(n => n / 10); // -1.0 to 2.0

    fc.assert(
      fc.property(remainingAUArb, (remainingAU) => {
        resetAutoAdvanceStores();
        
        // Ensure auto-advance is disabled
        useGameStateStore.getState().setAutoAdvanceEnabled(false);
        
        // Check if auto-advance should trigger
        const shouldTrigger = shouldAutoAdvance(remainingAU);
        
        // Should never trigger when disabled
        expect(shouldTrigger).toBe(false);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT trigger auto-advance when AU is positive', () => {
    // Generator for positive AU values - use integer to avoid float precision issues
    const positiveAUArb = fc.integer({ min: 1, max: 50 }).map(n => n / 10); // 0.1 to 5.0

    fc.assert(
      fc.property(positiveAUArb, (remainingAU) => {
        resetAutoAdvanceStores();
        
        // Enable auto-advance
        useGameStateStore.getState().setAutoAdvanceEnabled(true);
        
        // Check if auto-advance should trigger
        const shouldTrigger = shouldAutoAdvance(remainingAU);
        
        // Should not trigger when AU is positive
        expect(shouldTrigger).toBe(false);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should advance phase when performAutoAdvance is called', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        resetAutoAdvanceStores();
        
        // Add a worker to avoid game over during phase processing
        usePopulationStore.getState().addWorker('TestWorker');
        
        // Set some initial resources to avoid shortage damage
        useResourceStore.getState().setResource('water', 100);
        useResourceStore.getState().setResource('food', 100);
        
        // Get initial phase
        const initialPhase = useTimeStore.getState().time.phase;
        const initialDay = useTimeStore.getState().time.day;
        
        // Perform auto-advance
        performAutoAdvance();
        
        // Get new phase
        const newPhase = useTimeStore.getState().time.phase;
        const newDay = useTimeStore.getState().time.day;
        
        // Verify phase has changed
        // If it was midnight, day should increment and phase should be dawn
        if (initialPhase === 'midnight') {
          expect(newDay).toBe(initialDay + 1);
          expect(newPhase).toBe('dawn');
        } else {
          // Otherwise, phase should be the next one
          expect(newPhase).not.toBe(initialPhase);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should log auto-advance event when triggered', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        resetAutoAdvanceStores();
        
        // Add a worker to avoid game over
        usePopulationStore.getState().addWorker('TestWorker');
        
        // Set resources to avoid shortage
        useResourceStore.getState().setResource('water', 100);
        useResourceStore.getState().setResource('food', 100);
        
        const eventLogBefore = useEventStore.getState().eventLog.length;
        
        // Perform auto-advance
        performAutoAdvance();
        
        const eventLogAfter = useEventStore.getState().eventLog;
        
        // Verify an event was logged
        expect(eventLogAfter.length).toBeGreaterThan(eventLogBefore);
        
        // Find auto-advance event
        const autoAdvanceEvent = eventLogAfter.find(e => 
          e.messageZh.includes('自动进阶')
        );
        expect(autoAdvanceEvent).toBeDefined();
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property-Based Tests: Auto-Advance Setting Persistence', () => {
  beforeEach(() => {
    resetAutoAdvanceStores();
  });

  /**
   * Property 9: Auto-Advance Setting Persistence
   * 
   * For any save/load cycle, the auto-advance setting value SHALL be preserved.
   * 
   * **Feature: gameplay-fixes, Property 9: Auto-Advance Setting Persistence**
   * **Validates: Requirements 5.7**
   */
  it('should persist auto-advance setting through save/load cycle', () => {
    // Generator for auto-advance setting
    const autoAdvanceEnabledArb = fc.boolean();

    fc.assert(
      fc.property(autoAdvanceEnabledArb, (autoAdvanceEnabled) => {
        resetAutoAdvanceStores();
        
        // Set auto-advance setting
        useGameStateStore.getState().setAutoAdvanceEnabled(autoAdvanceEnabled);
        
        // Collect game state (simulates save)
        const saveData = collectGameState();
        
        // Verify save data contains the setting
        expect(saveData.autoAdvanceEnabled).toBe(autoAdvanceEnabled);
        
        // Reset stores (simulates closing game)
        resetAutoAdvanceStores();
        
        // Verify setting is reset to default
        expect(useGameStateStore.getState().autoAdvanceEnabled).toBe(false);
        
        // Restore game state (simulates load)
        restoreGameState(saveData);
        
        // Verify setting is restored
        expect(useGameStateStore.getState().autoAdvanceEnabled).toBe(autoAdvanceEnabled);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should default to false when loading save without autoAdvanceEnabled field', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        resetAutoAdvanceStores();
        
        // Create save data without autoAdvanceEnabled (simulates old save)
        const saveData = createEmptySaveData();
        // @ts-expect-error - Simulating old save format without the field
        delete saveData.autoAdvanceEnabled;
        
        // Restore game state
        restoreGameState(saveData);
        
        // Verify setting defaults to false
        expect(useGameStateStore.getState().autoAdvanceEnabled).toBe(false);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should toggle auto-advance setting correctly', () => {
    // Generator for number of toggles
    const toggleCountArb = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.property(toggleCountArb, (toggleCount) => {
        resetAutoAdvanceStores();
        
        // Initial state should be false
        expect(useGameStateStore.getState().autoAdvanceEnabled).toBe(false);
        
        // Toggle multiple times
        for (let i = 0; i < toggleCount; i++) {
          useGameStateStore.getState().toggleAutoAdvance();
        }
        
        // Final state should be true if odd number of toggles, false if even
        const expectedState = toggleCount % 2 === 1;
        expect(useGameStateStore.getState().autoAdvanceEnabled).toBe(expectedState);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve auto-advance setting across multiple save/load cycles', () => {
    // Generator for number of cycles and setting values
    const cycleCountArb = fc.integer({ min: 1, max: 5 });
    const settingsArb = fc.array(fc.boolean(), { minLength: 1, maxLength: 5 });

    fc.assert(
      fc.property(cycleCountArb, settingsArb, (cycleCount, settings) => {
        resetAutoAdvanceStores();
        
        for (let i = 0; i < Math.min(cycleCount, settings.length); i++) {
          const setting = settings[i]!;
          
          // Set the setting
          useGameStateStore.getState().setAutoAdvanceEnabled(setting);
          
          // Save
          const saveData = collectGameState();
          
          // Reset
          resetAutoAdvanceStores();
          
          // Load
          restoreGameState(saveData);
          
          // Verify
          expect(useGameStateStore.getState().autoAdvanceEnabled).toBe(setting);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});


// ============================================
// Integration Tests: Building-Job System
// Feature: gameplay-fixes
// Validates: Requirements 6.1, 6.4
// ============================================

describe('Integration Tests: Building-Job System', () => {
  beforeEach(() => {
    resetBuildingEffectStores();
  });

  /**
   * Integration Test: Building production buildings should update job slots
   * 
   * Requirements: 6.1 - WHEN a building level changes, THE Building_System SHALL notify all dependent systems
   * Requirements: 6.4 - WHEN job slots change, THE Worker_System SHALL validate current assignments
   */
  it('should update job slots when water collector is built', () => {
    const buildingStore = useBuildingStore.getState();
    const populationStore = usePopulationStore.getState();
    
    // Initially, no job slots available (building not built)
    expect(populationStore.getJobMaxSlots('water_collector')).toBe(0);
    
    // Build water collector level 1
    buildingStore.setBuildingLevel('water_collector', 1);
    
    // Job slots should be updated: 2 + 2*1 = 4
    expect(populationStore.getJobMaxSlots('water_collector')).toBe(4);
    
    // Upgrade to level 2
    buildingStore.setBuildingLevel('water_collector', 2);
    
    // Job slots should be updated: 2 + 2*2 = 6
    expect(populationStore.getJobMaxSlots('water_collector')).toBe(6);
  });

  it('should update job slots when trap is built', () => {
    const buildingStore = useBuildingStore.getState();
    const populationStore = usePopulationStore.getState();
    
    // Initially, no job slots available
    expect(populationStore.getJobMaxSlots('hunter')).toBe(0);
    
    // Build trap level 1
    buildingStore.setBuildingLevel('trap', 1);
    
    // Job slots should be updated: 2 + 2*1 = 4
    expect(populationStore.getJobMaxSlots('hunter')).toBe(4);
    
    // Upgrade to level 3
    buildingStore.setBuildingLevel('trap', 3);
    
    // Job slots should be updated: 2 + 2*3 = 8
    expect(populationStore.getJobMaxSlots('hunter')).toBe(8);
  });

  it('should update job slots when scavenge post is built', () => {
    const buildingStore = useBuildingStore.getState();
    const populationStore = usePopulationStore.getState();
    
    // Initially, no job slots available
    expect(populationStore.getJobMaxSlots('scavenger')).toBe(0);
    
    // Build scavenge post level 1
    buildingStore.setBuildingLevel('scavenge_post', 1);
    
    // Job slots should be updated: 3 + 3*1 = 6
    expect(populationStore.getJobMaxSlots('scavenger')).toBe(6);
    
    // Upgrade to level 2
    buildingStore.setBuildingLevel('scavenge_post', 2);
    
    // Job slots should be updated: 3 + 3*2 = 9
    expect(populationStore.getJobMaxSlots('scavenger')).toBe(9);
  });

  it('should unassign excess workers when job slots are reduced', () => {
    const buildingStore = useBuildingStore.getState();
    const populationStore = usePopulationStore.getState();
    
    // Set up population cap and add workers
    populationStore.setPopulationCap(10);
    const worker1 = populationStore.addWorker('Worker1');
    const worker2 = populationStore.addWorker('Worker2');
    const worker3 = populationStore.addWorker('Worker3');
    const worker4 = populationStore.addWorker('Worker4');
    const worker5 = populationStore.addWorker('Worker5');
    
    // Build water collector level 2 (6 slots)
    buildingStore.setBuildingLevel('water_collector', 2);
    
    // Assign 5 workers to water collector
    populationStore.assignJob(worker1!.id, 'water_collector');
    populationStore.assignJob(worker2!.id, 'water_collector');
    populationStore.assignJob(worker3!.id, 'water_collector');
    populationStore.assignJob(worker4!.id, 'water_collector');
    populationStore.assignJob(worker5!.id, 'water_collector');
    
    // Verify 5 workers assigned
    expect(populationStore.getJobWorkerCount('water_collector')).toBe(5);
    
    // Downgrade to level 1 (4 slots) - this should unassign excess workers
    buildingStore.setBuildingLevel('water_collector', 1);
    
    // Should have only 4 workers now (1 excess worker unassigned)
    expect(populationStore.getJobWorkerCount('water_collector')).toBe(4);
    expect(populationStore.getJobMaxSlots('water_collector')).toBe(4);
  });

  it('should sync all production building job slots simultaneously', () => {
    const buildingStore = useBuildingStore.getState();
    const populationStore = usePopulationStore.getState();
    
    // Build multiple production buildings
    buildingStore.setBuildingLevel('water_collector', 2);
    buildingStore.setBuildingLevel('trap', 1);
    buildingStore.setBuildingLevel('scavenge_post', 3);
    
    // Verify all job slots are correctly synced
    expect(populationStore.getJobMaxSlots('water_collector')).toBe(6); // 2 + 2*2
    expect(populationStore.getJobMaxSlots('hunter')).toBe(4);          // 2 + 2*1
    expect(populationStore.getJobMaxSlots('scavenger')).toBe(12);      // 3 + 3*3
  });

  it('should prevent worker assignment when building is not built', () => {
    const populationStore = usePopulationStore.getState();
    
    // Add a worker
    populationStore.setPopulationCap(5);
    const worker = populationStore.addWorker('TestWorker');
    
    // Try to assign to water collector (not built)
    const result = populationStore.assignJob(worker!.id, 'water_collector');
    
    // Should fail because job is full (0 slots)
    expect(result).toBe(false);
    expect(populationStore.getJobWorkerCount('water_collector')).toBe(0);
  });

  it('should allow worker assignment after building is constructed', () => {
    const buildingStore = useBuildingStore.getState();
    const populationStore = usePopulationStore.getState();
    
    // Add a worker
    populationStore.setPopulationCap(5);
    const worker = populationStore.addWorker('TestWorker');
    
    // Build water collector
    buildingStore.setBuildingLevel('water_collector', 1);
    
    // Now assignment should succeed
    const result = populationStore.assignJob(worker!.id, 'water_collector');
    
    expect(result).toBe(true);
    expect(populationStore.getJobWorkerCount('water_collector')).toBe(1);
  });

  it('should sync population cap when shelter is built', () => {
    // Initial population cap should be base (2)
    expect(usePopulationStore.getState().populationCap).toBe(2);
    
    // Build shelter level 1
    useBuildingStore.getState().setBuildingLevel('shelter', 1);
    
    // Population cap should be: 2 + 1*2 = 4
    expect(usePopulationStore.getState().populationCap).toBe(4);
    
    // Upgrade to level 3
    useBuildingStore.getState().setBuildingLevel('shelter', 3);
    
    // Population cap should be: 2 + 3*2 = 8
    expect(usePopulationStore.getState().populationCap).toBe(8);
  });

  it('should sync storage caps when warehouse is built', () => {
    const buildingStore = useBuildingStore.getState();
    const resourceStore = useResourceStore.getState();
    
    // Get initial caps
    const initialWaterCap = resourceStore.getResourceCap('water');
    const initialFoodCap = resourceStore.getResourceCap('food');
    const initialScrapCap = resourceStore.getResourceCap('scrap');
    
    // Build warehouse level 1
    buildingStore.setBuildingLevel('warehouse', 1);
    
    // Verify storage caps increased
    expect(resourceStore.getResourceCap('water')).toBe(initialWaterCap + 50);   // +50 per level
    expect(resourceStore.getResourceCap('food')).toBe(initialFoodCap + 50);     // +50 per level
    expect(resourceStore.getResourceCap('scrap')).toBe(initialScrapCap + 150);  // +150 per level
    
    // Upgrade to level 2
    buildingStore.setBuildingLevel('warehouse', 2);
    
    // Verify storage caps increased further
    expect(resourceStore.getResourceCap('water')).toBe(initialWaterCap + 100);  // +50*2
    expect(resourceStore.getResourceCap('food')).toBe(initialFoodCap + 100);    // +50*2
    expect(resourceStore.getResourceCap('scrap')).toBe(initialScrapCap + 300);  // +150*2
  });
});


// ============================================
// Property-Based Tests
// Feature: gameplay-fixes, Property 10: Building-Dependent System Sync
// Validates: Requirements 6.1, 6.2, 6.3, 6.4
// ============================================

describe('Property-Based Tests: Building-Dependent System Sync', () => {
  beforeEach(() => {
    resetBuildingEffectStores();
  });

  /**
   * Property 10: Building-Dependent System Sync
   * 
   * For any building level change, all dependent systems (population cap, storage cap, job slots)
   * SHALL reflect the new values within the same game tick.
   * 
   * **Feature: gameplay-fixes, Property 10: Building-Dependent System Sync**
   * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
   */
  it('should sync all dependent systems immediately when shelter level changes', () => {
    // Generator for shelter level changes
    const shelterLevelArb = fc.integer({ min: 0, max: 10 });

    fc.assert(
      fc.property(shelterLevelArb, (shelterLevel) => {
        resetBuildingEffectStores();
        
        // Change shelter level
        useBuildingStore.getState().setBuildingLevel('shelter', shelterLevel);
        
        // Immediately verify population cap is synced (same tick)
        const populationCap = usePopulationStore.getState().populationCap;
        const expectedPopCap = 2 + (shelterLevel * 2);
        
        expect(populationCap).toBe(expectedPopCap);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync all dependent systems immediately when warehouse level changes', () => {
    // Generator for warehouse level changes
    const warehouseLevelArb = fc.integer({ min: 0, max: 5 });

    fc.assert(
      fc.property(warehouseLevelArb, (warehouseLevel) => {
        resetBuildingEffectStores();
        
        // Change warehouse level
        useBuildingStore.getState().setBuildingLevel('warehouse', warehouseLevel);
        
        // Immediately verify storage caps are synced (same tick)
        const resourceStore = useResourceStore.getState();
        
        // Check key resources
        const testResources: ResourceId[] = ['water', 'food', 'scrap', 'wood', 'metal'];
        
        for (const resourceId of testResources) {
          const baseCap = DEFAULT_RESOURCE_CAPS[resourceId] ?? 0;
          const bonus = (WAREHOUSE_STORAGE_INCREMENT[resourceId] ?? 0) * warehouseLevel;
          const expectedCap = baseCap + bonus;
          
          expect(resourceStore.getResourceCap(resourceId)).toBe(expectedCap);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync all dependent systems immediately when production building level changes', () => {
    // Generator for production building levels
    const buildingLevelArb = fc.integer({ min: 0, max: 5 });
    const buildingTypeArb = fc.constantFrom(
      'water_collector' as const,
      'trap' as const,
      'scavenge_post' as const
    );

    fc.assert(
      fc.property(buildingLevelArb, buildingTypeArb, (level, buildingType) => {
        resetBuildingEffectStores();
        
        // Change building level
        useBuildingStore.getState().setBuildingLevel(buildingType, level);
        
        // Immediately verify job slots are synced (same tick)
        const populationStore = usePopulationStore.getState();
        
        // Map building to job
        const jobMap: Record<string, JobId> = {
          water_collector: 'water_collector',
          trap: 'hunter',
          scavenge_post: 'scavenger',
        };
        
        const jobId = jobMap[buildingType]!;
        const actualSlots = populationStore.getJobMaxSlots(jobId);
        
        // Calculate expected slots
        let expectedSlots: number;
        if (level === 0) {
          expectedSlots = 0;
        } else if (buildingType === 'scavenge_post') {
          expectedSlots = 3 + (3 * level); // Scavenge post: 3 + 3L
        } else {
          expectedSlots = 2 + (2 * level); // Water collector/Trap: 2 + 2L
        }
        
        expect(actualSlots).toBe(expectedSlots);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should sync multiple dependent systems simultaneously when multiple buildings change', () => {
    // Generator for multiple building levels
    const shelterLevelArb = fc.integer({ min: 0, max: 5 });
    const warehouseLevelArb = fc.integer({ min: 0, max: 3 });
    const waterCollectorLevelArb = fc.integer({ min: 0, max: 3 });
    const trapLevelArb = fc.integer({ min: 0, max: 3 });

    fc.assert(
      fc.property(
        shelterLevelArb,
        warehouseLevelArb,
        waterCollectorLevelArb,
        trapLevelArb,
        (shelterLevel, warehouseLevel, waterCollectorLevel, trapLevel) => {
          resetBuildingEffectStores();
          
          const buildingStore = useBuildingStore.getState();
          
          // Change multiple buildings
          buildingStore.setBuildingLevel('shelter', shelterLevel);
          buildingStore.setBuildingLevel('warehouse', warehouseLevel);
          buildingStore.setBuildingLevel('water_collector', waterCollectorLevel);
          buildingStore.setBuildingLevel('trap', trapLevel);
          
          // Immediately verify ALL dependent systems are synced
          
          // 1. Population cap (from shelter)
          const expectedPopCap = 2 + (shelterLevel * 2);
          expect(usePopulationStore.getState().populationCap).toBe(expectedPopCap);
          
          // 2. Storage caps (from warehouse)
          const baseWaterCap = DEFAULT_RESOURCE_CAPS['water'] ?? 0;
          const warehouseBonus = (WAREHOUSE_STORAGE_INCREMENT['water'] ?? 0) * warehouseLevel;
          expect(useResourceStore.getState().getResourceCap('water')).toBe(baseWaterCap + warehouseBonus);
          
          // 3. Job slots (from production buildings)
          const populationStore = usePopulationStore.getState();
          
          // Water collector slots
          const expectedWaterSlots = waterCollectorLevel === 0 ? 0 : 2 + (2 * waterCollectorLevel);
          expect(populationStore.getJobMaxSlots('water_collector')).toBe(expectedWaterSlots);
          
          // Hunter slots (from trap)
          const expectedHunterSlots = trapLevel === 0 ? 0 : 2 + (2 * trapLevel);
          expect(populationStore.getJobMaxSlots('hunter')).toBe(expectedHunterSlots);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain system consistency after rapid building level changes', () => {
    // Generator for sequence of level changes
    const levelSequenceArb = fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 1, maxLength: 10 });

    fc.assert(
      fc.property(levelSequenceArb, (levelSequence) => {
        resetBuildingEffectStores();
        
        // Apply rapid sequence of level changes
        for (const level of levelSequence) {
          useBuildingStore.getState().setBuildingLevel('shelter', level);
        }
        
        // After all changes, verify final state is consistent
        const finalLevel = levelSequence[levelSequence.length - 1]!;
        const expectedPopCap = 2 + (finalLevel * 2);
        
        expect(usePopulationStore.getState().populationCap).toBe(expectedPopCap);
        expect(useBuildingStore.getState().getBuildingLevel('shelter')).toBe(finalLevel);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should unassign excess workers when job slots are reduced below current assignments', () => {
    // Generator for initial and final levels
    const initialLevelArb = fc.integer({ min: 2, max: 5 });
    const finalLevelArb = fc.integer({ min: 0, max: 1 });
    const workerCountArb = fc.integer({ min: 3, max: 6 });

    fc.assert(
      fc.property(initialLevelArb, finalLevelArb, workerCountArb, (initialLevel, finalLevel, workerCount) => {
        resetBuildingEffectStores();
        
        const buildingStore = useBuildingStore.getState();
        const populationStore = usePopulationStore.getState();
        
        // Set up population cap and add workers
        populationStore.setPopulationCap(workerCount + 5);
        const workers: string[] = [];
        for (let i = 0; i < workerCount; i++) {
          const worker = populationStore.addWorker(`Worker_${i}`);
          if (worker) workers.push(worker.id);
        }
        
        // Build water collector to initial level
        buildingStore.setBuildingLevel('water_collector', initialLevel);
        
        // Calculate initial max slots
        const initialMaxSlots = 2 + (2 * initialLevel);
        
        // Assign workers up to max slots
        const workersToAssign = Math.min(workers.length, initialMaxSlots);
        for (let i = 0; i < workersToAssign; i++) {
          populationStore.assignJob(workers[i]!, 'water_collector');
        }
        
        const assignedBefore = populationStore.getJobWorkerCount('water_collector');
        
        // Reduce building level
        buildingStore.setBuildingLevel('water_collector', finalLevel);
        
        // Calculate new max slots
        const newMaxSlots = finalLevel === 0 ? 0 : 2 + (2 * finalLevel);
        
        // Verify workers are unassigned if exceeding new max
        const assignedAfter = populationStore.getJobWorkerCount('water_collector');
        
        // Should have at most newMaxSlots workers assigned
        expect(assignedAfter).toBeLessThanOrEqual(newMaxSlots);
        
        // If we had more workers than new max, some should have been unassigned
        if (assignedBefore > newMaxSlots) {
          expect(assignedAfter).toBe(newMaxSlots);
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
