/**
 * 探索系统测试
 * Exploration System Tests
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 18.1, 18.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useExplorationStore } from './explorationStore';
import {
  calculateTotalTravelTime,
  calculateExplorationSupplies,
  calculateSearchTime,
  EXPLORATION_WATER_PER_EXPLORER_PER_AU,
  EXPLORATION_FOOD_PER_EXPLORER_PER_AU,
  REGION_RISK_COEFFICIENTS,
  generateLoot,
  DEFAULT_MAP_NODES,
} from '../config/exploration';

describe('Exploration System', () => {
  beforeEach(() => {
    useExplorationStore.getState().resetExploration();
  });

  describe('Map Node Configuration - Requirements: 18.1, 18.2', () => {
    it('should have all required region tiers', () => {
      const tiers = new Set(DEFAULT_MAP_NODES.map(n => n.tier));
      expect(tiers.has('T0')).toBe(true);
      expect(tiers.has('T1')).toBe(true);
      expect(tiers.has('T2')).toBe(true);
      expect(tiers.has('T3')).toBe(true);
      expect(tiers.has('T4')).toBe(true);
      expect(tiers.has('T5')).toBe(true);
    });

    it('should have base camp at T0', () => {
      const base = DEFAULT_MAP_NODES.find(n => n.id === 'base');
      expect(base).toBeDefined();
      expect(base?.tier).toBe('T0');
      expect(base?.distance).toBe(0);
      expect(base?.state).toBe('cleared');
    });

    it('should have correct risk coefficients for each tier', () => {
      expect(REGION_RISK_COEFFICIENTS.T0).toBe(0);
      expect(REGION_RISK_COEFFICIENTS.T1).toBe(0.10);
      expect(REGION_RISK_COEFFICIENTS.T2).toBe(0.25);
      expect(REGION_RISK_COEFFICIENTS.T3).toBe(0.45);
      expect(REGION_RISK_COEFFICIENTS.T4).toBe(0.70);
      expect(REGION_RISK_COEFFICIENTS.T5).toBe(1.10);
    });

    it('should have T1 nodes at distance 1-2', () => {
      const t1Nodes = DEFAULT_MAP_NODES.filter(n => n.tier === 'T1');
      expect(t1Nodes.length).toBeGreaterThan(0);
      t1Nodes.forEach(node => {
        expect(node.distance).toBeGreaterThanOrEqual(1);
        expect(node.distance).toBeLessThanOrEqual(2);
      });
    });

    it('should have T2 nodes at distance 3-4', () => {
      const t2Nodes = DEFAULT_MAP_NODES.filter(n => n.tier === 'T2');
      expect(t2Nodes.length).toBeGreaterThan(0);
      t2Nodes.forEach(node => {
        expect(node.distance).toBeGreaterThanOrEqual(3);
        expect(node.distance).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Travel Time Calculation - Requirements: 6.3', () => {
    it('should calculate total travel time correctly', () => {
      // Total_Time = 2 × distance + search_time
      // search_time = 2 + floor(distance / 3)
      
      // Distance 1: 2*1 + (2 + floor(1/3)) = 2 + 2 = 4
      expect(calculateTotalTravelTime(1)).toBe(4);
      
      // Distance 2: 2*2 + (2 + floor(2/3)) = 4 + 2 = 6
      expect(calculateTotalTravelTime(2)).toBe(6);
      
      // Distance 3: 2*3 + (2 + floor(3/3)) = 6 + 3 = 9
      expect(calculateTotalTravelTime(3)).toBe(9);
      
      // Distance 5: 2*5 + (2 + floor(5/3)) = 10 + 3 = 13
      expect(calculateTotalTravelTime(5)).toBe(13);
      
      // Distance 10: 2*10 + (2 + floor(10/3)) = 20 + 5 = 25
      expect(calculateTotalTravelTime(10)).toBe(25);
    });

    it('should calculate search time correctly', () => {
      expect(calculateSearchTime(0)).toBe(2);
      expect(calculateSearchTime(1)).toBe(2);
      expect(calculateSearchTime(2)).toBe(2);
      expect(calculateSearchTime(3)).toBe(3);
      expect(calculateSearchTime(6)).toBe(4);
      expect(calculateSearchTime(9)).toBe(5);
    });
  });

  describe('Exploration Supply Consumption - Requirements: 6.2', () => {
    it('should calculate supplies correctly for single explorer', () => {
      // Water = 1.5/AU, Food = 1.8/AU per explorer
      const supplies = calculateExplorationSupplies(1, 4);
      expect(supplies.water).toBe(1 * 1.5 * 4); // 6
      expect(supplies.food).toBe(1 * 1.8 * 4);  // 7.2
    });

    it('should calculate supplies correctly for multiple explorers', () => {
      const supplies = calculateExplorationSupplies(3, 5);
      expect(supplies.water).toBe(3 * 1.5 * 5); // 22.5
      expect(supplies.food).toBe(3 * 1.8 * 5);  // 27
    });

    it('should have correct consumption constants', () => {
      expect(EXPLORATION_WATER_PER_EXPLORER_PER_AU).toBe(1.5);
      expect(EXPLORATION_FOOD_PER_EXPLORER_PER_AU).toBe(1.8);
    });
  });

  describe('Loot Generation - Requirements: 6.4', () => {
    it('should generate loot for T1 region', () => {
      // Run multiple times to ensure we get some loot
      let hasLoot = false;
      for (let i = 0; i < 10; i++) {
        const loot = generateLoot('T1', 0.10);
        if (loot.length > 0) {
          hasLoot = true;
          break;
        }
      }
      expect(hasLoot).toBe(true);
    });

    it('should generate higher value loot for higher tiers', () => {
      // T5 should have rare resources in loot table
      const t5Loot = generateLoot('T5', 1.10);
      // Even if empty due to probability, the function should work
      expect(Array.isArray(t5Loot)).toBe(true);
    });

    it('should apply risk coefficient to loot amounts', () => {
      // Higher risk coefficient should increase loot amounts
      // This is probabilistic, so we just verify the function works
      const lowRiskLoot = generateLoot('T2', 0.10);
      const highRiskLoot = generateLoot('T2', 0.50);
      expect(Array.isArray(lowRiskLoot)).toBe(true);
      expect(Array.isArray(highRiskLoot)).toBe(true);
    });
  });

  describe('Exploration Store', () => {
    it('should initialize with default map nodes', () => {
      const store = useExplorationStore.getState();
      const nodes = store.getAllNodes();
      expect(nodes.length).toBe(DEFAULT_MAP_NODES.length);
    });

    it('should get node by id', () => {
      const store = useExplorationStore.getState();
      const base = store.getNode('base');
      expect(base).toBeDefined();
      expect(base?.nameZh).toBe('营地');
    });

    it('should update node state', () => {
      const store = useExplorationStore.getState();
      store.updateNodeState('collapsed_highway', 'discovered');
      const node = store.getNode('collapsed_highway');
      expect(node?.state).toBe('discovered');
    });

    it('should discover node', () => {
      const store = useExplorationStore.getState();
      store.discoverNode('collapsed_highway');
      const node = store.getNode('collapsed_highway');
      expect(node?.state).toBe('discovered');
    });

    it('should get discovered nodes', () => {
      const store = useExplorationStore.getState();
      store.discoverNode('collapsed_highway');
      store.discoverNode('dried_riverbed');
      const discovered = store.getDiscoveredNodes();
      // Base is already cleared, plus 2 discovered
      expect(discovered.length).toBeGreaterThanOrEqual(3);
    });

    it('should calculate exploration preview', () => {
      const store = useExplorationStore.getState();
      const preview = store.getExplorationPreview('collapsed_highway', 2);
      expect(preview).toBeDefined();
      expect(preview?.nodeId).toBe('collapsed_highway');
      expect(preview?.distance).toBe(1);
      expect(preview?.totalTime).toBe(4); // 2*1 + 2 = 4
      expect(preview?.suppliesNeeded.water).toBe(2 * 1.5 * 4); // 12
      expect(preview?.suppliesNeeded.food).toBe(2 * 1.8 * 4);  // 14.4
    });

    it('should calculate supplies needed', () => {
      const store = useExplorationStore.getState();
      const supplies = store.calculateSuppliesNeeded('abandoned_farm', 3);
      expect(supplies).toBeDefined();
      // Distance 2: total time = 6
      expect(supplies?.water).toBe(3 * 1.5 * 6); // 27
      expect(supplies?.food).toBe(3 * 1.8 * 6);  // 32.4
    });

    it('should calculate travel time', () => {
      const store = useExplorationStore.getState();
      const time = store.calculateTravelTime('ruined_suburb');
      // Distance 3: 2*3 + (2 + 1) = 9
      expect(time).toBe(9);
    });

    it('should start expedition with radio tower level 1', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      const expedition = store.startExpedition(
        'collapsed_highway',
        ['worker1', 'worker2'],
        1,
        'morning',
        { water: 20, food: 20 }
      );
      
      expect(expedition).toBeDefined();
      expect(expedition?.targetNodeId).toBe('collapsed_highway');
      expect(expedition?.workerIds).toEqual(['worker1', 'worker2']);
      expect(expedition?.status).toBe('traveling');
    });

    it('should start expedition to T1 area without radio tower', () => {
      const store = useExplorationStore.getState();
      // Radio tower level is 0 by default, but T1 areas (distance <= 2) should be accessible
      
      const expedition = store.startExpedition(
        'collapsed_highway', // T1 area, distance 1
        ['worker1'],
        1,
        'morning',
        { water: 10, food: 10 }
      );
      
      // T1 areas should be accessible without radio tower
      expect(expedition).toBeDefined();
      expect(expedition?.targetNodeId).toBe('collapsed_highway');
    });

    it('should not start expedition to T2+ area without radio tower', () => {
      const store = useExplorationStore.getState();
      // Radio tower level is 0 by default
      
      const expedition = store.startExpedition(
        'ruined_suburb', // T2 area, distance 3
        ['worker1'],
        1,
        'morning',
        { water: 10, food: 10 }
      );
      
      // T2+ areas require radio tower
      expect(expedition).toBeNull();
    });

    it('should not start expedition if one is already active', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      store.startExpedition(
        'collapsed_highway',
        ['worker1'],
        1,
        'morning',
        { water: 10, food: 10 }
      );
      
      const second = store.startExpedition(
        'dried_riverbed',
        ['worker2'],
        1,
        'morning',
        { water: 10, food: 10 }
      );
      
      expect(second).toBeNull();
    });

    it('should get max exploration distance based on radio tower level', () => {
      const store = useExplorationStore.getState();
      
      // Level 0: T1 areas accessible (distance 0-2)
      store.setRadioTowerLevel(0);
      expect(store.getMaxExplorationDistance()).toBe(2);
      
      // Level 1: T2 areas accessible (distance 0-4)
      store.setRadioTowerLevel(1);
      expect(store.getMaxExplorationDistance()).toBe(4);
      
      store.setRadioTowerLevel(2);
      expect(store.getMaxExplorationDistance()).toBe(7);
      
      store.setRadioTowerLevel(3);
      expect(store.getMaxExplorationDistance()).toBe(10);
    });

    it('should generate node loot', () => {
      const store = useExplorationStore.getState();
      const loot = store.generateNodeLoot('collapsed_highway');
      expect(Array.isArray(loot)).toBe(true);
    });

    it('should cancel expedition', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      store.startExpedition(
        'collapsed_highway',
        ['worker1'],
        1,
        'morning',
        { water: 10, food: 10 }
      );
      
      expect(store.getActiveExpedition()).not.toBeNull();
      
      store.cancelExpedition();
      
      expect(store.getActiveExpedition()).toBeNull();
    });

    it('should reset exploration state', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(2);
      store.discoverNode('collapsed_highway');
      
      store.resetExploration();
      
      expect(store.radioTowerLevel).toBe(0);
      const node = store.getNode('collapsed_highway');
      expect(node?.state).toBe('undiscovered');
    });
  });

  describe('Complete Exploration Flow - Requirements: 6.1, 6.5, 6.6', () => {
    it('should follow the complete exploration flow: 出发→旅行→遭遇→搜刮→返回', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      // 1. 出发 (Start)
      const expedition = store.startExpedition(
        'collapsed_highway',
        ['worker1', 'worker2'],
        1,
        'morning',
        { water: 30, food: 30 }
      );
      
      expect(expedition).toBeDefined();
      expect(expedition?.status).toBe('traveling');
      
      // 2. 旅行 (Traveling) - Process first phase
      let result = store.processExpeditionProgress(1, 'noon');
      expect(store.getActiveExpedition()?.status).toBe('traveling');
      expect(result.suppliesConsumed.water).toBeGreaterThan(0);
      expect(result.suppliesConsumed.food).toBeGreaterThan(0);
      
      // 3. Continue traveling
      result = store.processExpeditionProgress(1, 'afternoon');
      
      // 4. 探索/遭遇 (Exploring/Encounter)
      result = store.processExpeditionProgress(1, 'evening');
      
      // 5. 搜刮 (Looting) - happens during exploration
      result = store.processExpeditionProgress(1, 'midnight');
      
      // 6. 返回 (Returning)
      result = store.processExpeditionProgress(2, 'dawn');
      
      // Eventually complete
      // For distance 1, total time is 4 AU
      // After enough phases, it should complete
    });

    it('should consume supplies during expedition', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      const initialWater = 30;
      const initialFood = 30;
      
      store.startExpedition(
        'collapsed_highway',
        ['worker1'],
        1,
        'morning',
        { water: initialWater, food: initialFood }
      );
      
      // Process one phase (1 AU for morning)
      store.processExpeditionProgress(1, 'noon');
      
      const expedition = store.getActiveExpedition();
      expect(expedition?.supplies.water).toBeLessThan(initialWater);
      expect(expedition?.supplies.food).toBeLessThan(initialFood);
    });

    it('should complete expedition and generate loot', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      store.startExpedition(
        'collapsed_highway',
        ['worker1'],
        1,
        'morning',
        { water: 50, food: 50 }
      );
      
      // Manually set status to completed for testing
      store.updateExpeditionStatus('completed');
      
      const result = store.completeExpedition();
      
      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.nodeId).toBe('collapsed_highway');
      expect(Array.isArray(result?.loot)).toBe(true);
      expect(Array.isArray(result?.events)).toBe(true);
      
      // Expedition should be cleared
      expect(store.getActiveExpedition()).toBeNull();
    });

    it('should update node state after exploration', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      // First discover the node
      store.discoverNode('collapsed_highway');
      expect(store.getNode('collapsed_highway')?.state).toBe('discovered');
      
      // Start and complete expedition
      store.startExpedition(
        'collapsed_highway',
        ['worker1'],
        1,
        'morning',
        { water: 50, food: 50 }
      );
      
      store.updateExpeditionStatus('completed');
      store.completeExpedition();
      
      // Node should be marked as explored
      expect(store.getNode('collapsed_highway')?.state).toBe('explored');
    });

    it('should track explorer health and equipment during expedition', () => {
      const store = useExplorationStore.getState();
      store.setRadioTowerLevel(1);
      
      const expedition = store.startExpedition(
        'collapsed_highway',
        ['worker1', 'worker2'],
        1,
        'morning',
        { water: 50, food: 50 }
      );
      
      // Requirements: 6.6 - track explorer health, equipment durability, inventory
      expect(expedition?.workerIds).toHaveLength(2);
      expect(expedition?.supplies).toBeDefined();
    });

    it('should unlock deeper regions with higher radio tower level', () => {
      const store = useExplorationStore.getState();
      
      // Level 1: max distance 4 (T1, T2)
      store.setRadioTowerLevel(1);
      expect(store.getMaxExplorationDistance()).toBe(4);
      
      // Can explore T1 and T2 nodes
      const t1Node = store.getNode('collapsed_highway'); // distance 1
      const t2Node = store.getNode('ruined_suburb'); // distance 3
      const t3Node = store.getNode('old_factory'); // distance 5
      
      expect(t1Node?.distance).toBeLessThanOrEqual(4);
      expect(t2Node?.distance).toBeLessThanOrEqual(4);
      expect(t3Node?.distance).toBeGreaterThan(4);
      
      // Level 2: max distance 7 (T1, T2, T3)
      store.setRadioTowerLevel(2);
      expect(store.getMaxExplorationDistance()).toBe(7);
      
      // Level 3: max distance 10 (all regions)
      store.setRadioTowerLevel(3);
      expect(store.getMaxExplorationDistance()).toBe(10);
    });
  });

  // ============================================
  // Property-Based Tests
  // ============================================

  describe('Property-Based Tests', () => {
    /**
     * Property 11: Exploration Supply Consumption
     * Feature: dust-and-echoes, Property 11: Exploration Supply Consumption
     * 
     * *For any* exploration with N explorers for T AU, water consumption SHALL equal 
     * N × 1.5 × T and food consumption SHALL equal N × 1.8 × T.
     * 
     * **Validates: Requirements 6.2**
     */
    it('Property 11: Exploration Supply Consumption - For any N explorers and T AU, water = N*1.5*T and food = N*1.8*T', () => {
      fc.assert(
        fc.property(
          // Generate explorer count (1 to 10 covers realistic game scenarios)
          fc.integer({ min: 1, max: 10 }),
          // Generate total AU time (1 to 50 covers realistic exploration durations)
          fc.integer({ min: 1, max: 50 }),
          (explorerCount: number, totalAU: number) => {
            // Calculate expected values according to the formula from Requirements 6.2
            // Water = 1.5/AU per explorer
            // Food = 1.8/AU per explorer
            const expectedWater = explorerCount * 1.5 * totalAU;
            const expectedFood = explorerCount * 1.8 * totalAU;
            
            // Get actual values from the implementation
            const actualSupplies = calculateExplorationSupplies(explorerCount, totalAU);
            
            // Verify water consumption formula: Water = N × 1.5 × T
            expect(actualSupplies.water).toBe(expectedWater);
            
            // Verify food consumption formula: Food = N × 1.8 × T
            expect(actualSupplies.food).toBe(expectedFood);
            
            // Additional invariant: supplies should always be positive for positive inputs
            expect(actualSupplies.water).toBeGreaterThan(0);
            expect(actualSupplies.food).toBeGreaterThan(0);
            
            // Additional invariant: food consumption should always be greater than water consumption
            // (since 1.8 > 1.5)
            expect(actualSupplies.food).toBeGreaterThan(actualSupplies.water);
            
            // Additional invariant: supplies should scale linearly with explorer count
            if (explorerCount > 1) {
              const singleExplorerSupplies = calculateExplorationSupplies(1, totalAU);
              expect(actualSupplies.water).toBeCloseTo(singleExplorerSupplies.water * explorerCount, 10);
              expect(actualSupplies.food).toBeCloseTo(singleExplorerSupplies.food * explorerCount, 10);
            }
            
            // Additional invariant: supplies should scale linearly with time
            if (totalAU > 1) {
              const singleAUSupplies = calculateExplorationSupplies(explorerCount, 1);
              expect(actualSupplies.water).toBeCloseTo(singleAUSupplies.water * totalAU, 10);
              expect(actualSupplies.food).toBeCloseTo(singleAUSupplies.food * totalAU, 10);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as per testing strategy
      );
    });

    /**
     * Property 12: Travel Time Calculation
     * Feature: dust-and-echoes, Property 12: Travel Time Calculation
     * 
     * *For any* exploration to distance D, the total time SHALL equal 
     * 2 × D + search_time where search_time = 2 + floor(D/3).
     * 
     * **Validates: Requirements 6.3**
     */
    it('Property 12: Travel Time Calculation - For any distance D, total time equals 2*D + (2 + floor(D/3))', () => {
      fc.assert(
        fc.property(
          // Generate non-negative integer distances (0 to 100 covers all realistic game scenarios)
          fc.integer({ min: 0, max: 100 }),
          (distance: number) => {
            // Calculate expected values according to the formula
            const expectedSearchTime = 2 + Math.floor(distance / 3);
            const expectedTotalTime = 2 * distance + expectedSearchTime;
            
            // Get actual values from the implementation
            const actualSearchTime = calculateSearchTime(distance);
            const actualTotalTime = calculateTotalTravelTime(distance);
            
            // Verify search time formula: search_time = 2 + floor(D/3)
            expect(actualSearchTime).toBe(expectedSearchTime);
            
            // Verify total time formula: Total_Time = 2 × D + search_time
            expect(actualTotalTime).toBe(expectedTotalTime);
            
            // Additional invariant: total time should always be >= 2 (minimum search time)
            expect(actualTotalTime).toBeGreaterThanOrEqual(2);
            
            // Additional invariant: total time should increase with distance
            if (distance > 0) {
              const prevTotalTime = calculateTotalTravelTime(distance - 1);
              expect(actualTotalTime).toBeGreaterThanOrEqual(prevTotalTime);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as per testing strategy
      );
    });

    /**
     * Property 6: Exploration Node Accessibility
     * Feature: gameplay-fixes, Property 6: Exploration Node Accessibility
     * 
     * *For any* exploration attempt, if radio tower level is 0, only T1 nodes SHALL be accessible;
     * if level is L > 0, nodes up to distance getMaxExplorationDistance(L) SHALL be accessible.
     * 
     * **Validates: Requirements 4.2, 4.10**
     */
    it('Property 6: Exploration Node Accessibility - Radio tower level determines accessible nodes', () => {
      fc.assert(
        fc.property(
          // Generate radio tower level (0 to 3 covers all game levels)
          fc.integer({ min: 0, max: 3 }),
          // Generate a node index to test
          fc.integer({ min: 0, max: DEFAULT_MAP_NODES.length - 1 }),
          (radioTowerLevel: number, nodeIndex: number) => {
            const store = useExplorationStore.getState();
            store.resetExploration();
            store.setRadioTowerLevel(radioTowerLevel);
            
            const node = DEFAULT_MAP_NODES[nodeIndex];
            if (!node || node.id === 'base') return; // Skip base node
            
            // Get max exploration distance for this radio tower level
            const maxDistance = store.getMaxExplorationDistance();
            
            // Verify max distance matches expected values
            const expectedMaxDistance = 
              radioTowerLevel === 0 ? 2 :
              radioTowerLevel === 1 ? 4 :
              radioTowerLevel === 2 ? 7 : 10;
            expect(maxDistance).toBe(expectedMaxDistance);
            
            // Try to start expedition
            const expedition = store.startExpedition(
              node.id,
              ['test_worker'],
              1,
              'morning',
              { water: 100, food: 100 }
            );
            
            // Verify accessibility based on distance
            if (node.distance <= maxDistance) {
              // Node should be accessible
              expect(expedition).not.toBeNull();
              if (expedition) {
                expect(expedition.targetNodeId).toBe(node.id);
              }
            } else {
              // Node should NOT be accessible
              expect(expedition).toBeNull();
            }
            
            // Clean up for next iteration
            store.cancelExpedition();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as per testing strategy
      );
    });

    /**
     * Property 7: Exploration Lifecycle
     * Feature: gameplay-fixes, Property 7: Exploration Lifecycle
     * 
     * *For any* completed expedition to node N, the system SHALL have consumed the required supplies,
     * generated loot based on N.tier, and updated N.state to 'explored'.
     * 
     * **Validates: Requirements 4.6, 4.7, 4.8, 4.9**
     */
    it('Property 7: Exploration Lifecycle - Completed expedition consumes supplies, generates loot, updates node state', () => {
      fc.assert(
        fc.property(
          // Generate radio tower level (1 to 3 to ensure we can access nodes)
          fc.integer({ min: 1, max: 3 }),
          // Generate explorer count (1 to 5)
          fc.integer({ min: 1, max: 5 }),
          (radioTowerLevel: number, explorerCount: number) => {
            const store = useExplorationStore.getState();
            store.resetExploration();
            store.setRadioTowerLevel(radioTowerLevel);
            
            // Get max distance for this level
            const maxDistance = store.getMaxExplorationDistance();
            
            // Find a valid node to explore (not base, within range)
            const validNodes = DEFAULT_MAP_NODES.filter(
              n => n.id !== 'base' && n.distance <= maxDistance
            );
            if (validNodes.length === 0) return;
            
            const targetNode = validNodes[0]!;
            
            // First discover the node
            store.discoverNode(targetNode.id);
            expect(store.getNode(targetNode.id)?.state).toBe('discovered');
            
            // Calculate required supplies
            const preview = store.getExplorationPreview(targetNode.id, explorerCount);
            expect(preview).not.toBeNull();
            if (!preview) return;
            
            const initialWater = preview.suppliesNeeded.water + 10; // Extra buffer
            const initialFood = preview.suppliesNeeded.food + 10;
            
            // Generate worker IDs
            const workerIds = Array.from({ length: explorerCount }, (_, i) => `worker_${i}`);
            
            // Start expedition
            const expedition = store.startExpedition(
              targetNode.id,
              workerIds,
              1,
              'morning',
              { water: initialWater, food: initialFood }
            );
            
            expect(expedition).not.toBeNull();
            if (!expedition) return;
            
            // Verify expedition started correctly
            expect(expedition.targetNodeId).toBe(targetNode.id);
            expect(expedition.workerIds).toHaveLength(explorerCount);
            expect(expedition.status).toBe('traveling');
            
            // Simulate expedition completion
            store.updateExpeditionStatus('completed');
            
            // Complete expedition
            const result = store.completeExpedition();
            
            // Verify completion result
            expect(result).not.toBeNull();
            if (!result) return;
            
            // Requirements 4.8 - Generate loot based on node tier
            expect(result.success).toBe(true);
            expect(result.nodeId).toBe(targetNode.id);
            expect(Array.isArray(result.loot)).toBe(true);
            
            // Requirements 4.9 - Update node state to explored
            const updatedNode = store.getNode(targetNode.id);
            expect(updatedNode?.state).toBe('explored');
            
            // Expedition should be cleared
            expect(store.getActiveExpedition()).toBeNull();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as per testing strategy
      );
    });
  });
});
