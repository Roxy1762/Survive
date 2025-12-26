/**
 * 先锋营地系统测试
 * Outpost System Tests
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useOutpostStore } from './outpostStore';
import {
  calculateSupplyLineStability,
  isSupplyLineCritical,
  isSupplyLineWarning,
  canEstablishOutpost,
  canUpgradeOutpost,
  canBuildModule,
  getOutpostBuildCost,
  getModuleBuildCost,
  SUPPLY_LINE_CONFIG,
  OUTPOST_REQUIRED_TECH,
  OUTPOST_L2_REQUIRED_TECH,
} from '../config/outpost';

describe('Outpost Configuration', () => {
  describe('Supply Line Stability - Requirements: 9.4', () => {
    it('should have base stability of 70', () => {
      expect(SUPPLY_LINE_CONFIG.baseStability).toBe(70);
    });

    it('should calculate stability with distance decay', () => {
      // Base 70, decay 5 per distance
      const stability = calculateSupplyLineStability(2, 0, 1);
      expect(stability).toBe(70 - 2 * 5); // 60
    });

    it('should apply relay bonus to stability', () => {
      const stabilityWithoutRelay = calculateSupplyLineStability(4, 0, 1);
      const stabilityWithRelay = calculateSupplyLineStability(4, 1, 1);
      expect(stabilityWithRelay).toBeGreaterThan(stabilityWithoutRelay);
      expect(stabilityWithRelay - stabilityWithoutRelay).toBe(SUPPLY_LINE_CONFIG.relayStabilityBonus);
    });

    it('should not go below minimum stability', () => {
      const stability = calculateSupplyLineStability(20, 0, 1); // Very far
      expect(stability).toBe(SUPPLY_LINE_CONFIG.minStability);
    });

    it('should not exceed 100', () => {
      const stability = calculateSupplyLineStability(0, 5, 3); // Close with many relays
      expect(stability).toBeLessThanOrEqual(100);
    });
  });

  describe('Supply Line Crisis Detection - Requirements: 9.5', () => {
    it('should detect critical state below threshold 40', () => {
      expect(isSupplyLineCritical(39)).toBe(true);
      expect(isSupplyLineCritical(40)).toBe(false);
    });

    it('should detect warning state between 40 and 50', () => {
      expect(isSupplyLineWarning(45)).toBe(true);
      expect(isSupplyLineWarning(39)).toBe(false);
      expect(isSupplyLineWarning(50)).toBe(false);
    });
  });

  describe('Outpost Establishment - Requirements: 9.1, 9.2', () => {
    it('should require vanguard_camp_1 tech', () => {
      const result = canEstablishOutpost('node1', 'discovered', [], []);
      expect(result.canEstablish).toBe(false);
      expect(result.reason).toContain('先锋营地 I');
    });

    it('should allow establishment with required tech', () => {
      const result = canEstablishOutpost(
        'node1',
        'discovered',
        [OUTPOST_REQUIRED_TECH],
        []
      );
      expect(result.canEstablish).toBe(true);
    });

    it('should not allow establishment on undiscovered nodes', () => {
      const result = canEstablishOutpost(
        'node1',
        'undiscovered',
        [OUTPOST_REQUIRED_TECH],
        []
      );
      expect(result.canEstablish).toBe(false);
      expect(result.reason).toContain('尚未发现');
    });

    it('should not allow establishment on base', () => {
      const result = canEstablishOutpost(
        'base',
        'cleared',
        [OUTPOST_REQUIRED_TECH],
        []
      );
      expect(result.canEstablish).toBe(false);
    });

    it('should not allow duplicate outposts on same node', () => {
      const result = canEstablishOutpost(
        'node1',
        'discovered',
        [OUTPOST_REQUIRED_TECH],
        ['node1']
      );
      expect(result.canEstablish).toBe(false);
      expect(result.reason).toContain('已有营地');
    });

    it('should return build cost for level 1', () => {
      const cost = getOutpostBuildCost(1);
      expect(cost.length).toBeGreaterThan(0);
      expect(cost.some(c => c.resourceId === 'scrap')).toBe(true);
    });
  });

  describe('Outpost Upgrade - Requirements: 9.3', () => {
    it('should not allow upgrade beyond level 3', () => {
      const result = canUpgradeOutpost(3, [OUTPOST_L2_REQUIRED_TECH]);
      expect(result.canUpgrade).toBe(false);
      expect(result.reason).toContain('最高等级');
    });

    it('should require vanguard_camp_2 tech for L2', () => {
      const result = canUpgradeOutpost(1, []);
      expect(result.canUpgrade).toBe(false);
      expect(result.reason).toContain('先锋营地 II');
    });

    it('should allow upgrade with required tech', () => {
      const result = canUpgradeOutpost(1, [OUTPOST_L2_REQUIRED_TECH]);
      expect(result.canUpgrade).toBe(true);
    });
  });

  describe('Module Building - Requirements: 9.6', () => {
    it('should check outpost level requirement', () => {
      const result = canBuildModule('radio_relay', 1, 0, [], []);
      expect(result.canBuild).toBe(false);
      expect(result.reason).toContain('营地等级');
    });

    it('should check tech requirement', () => {
      const result = canBuildModule('watchtower', 1, 0, [], []);
      expect(result.canBuild).toBe(false);
      expect(result.reason).toContain('科技');
    });

    it('should check module count limit', () => {
      // L1 outpost has max 2 modules
      const result = canBuildModule('storage', 1, 2, [], []);
      expect(result.canBuild).toBe(false);
      expect(result.reason).toContain('上限');
    });

    it('should allow building storage module', () => {
      const result = canBuildModule('storage', 1, 0, [], []);
      expect(result.canBuild).toBe(true);
    });

    it('should return module build cost', () => {
      const cost = getModuleBuildCost('storage', 1);
      expect(cost.length).toBeGreaterThan(0);
    });

    it('should increase cost for higher levels', () => {
      const costL1 = getModuleBuildCost('storage', 1);
      const costL2 = getModuleBuildCost('storage', 2);
      
      const totalL1 = costL1.reduce((sum, c) => sum + c.amount, 0);
      const totalL2 = costL2.reduce((sum, c) => sum + c.amount, 0);
      
      expect(totalL2).toBeGreaterThan(totalL1);
    });
  });
});

describe('Outpost Store', () => {
  beforeEach(() => {
    useOutpostStore.getState().resetOutposts();
  });

  describe('Outpost Creation', () => {
    it('should create an outpost', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 3);
      
      expect(outpost).not.toBeNull();
      expect(outpost?.nodeId).toBe('node1');
      expect(outpost?.level).toBe(1);
      expect(outpost?.modules).toHaveLength(0);
      expect(outpost?.garrison).toHaveLength(0);
    });

    it('should calculate initial stability based on distance', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 4);
      
      // Base 70 - 4 * 5 = 50
      expect(outpost?.stability).toBe(50);
    });

    it('should track multiple outposts', () => {
      const store = useOutpostStore.getState();
      store.establishOutpost('node1', 2);
      store.establishOutpost('node2', 4);
      
      expect(store.getOutpostCount()).toBe(2);
      expect(store.getOutpostNodeIds()).toContain('node1');
      expect(store.getOutpostNodeIds()).toContain('node2');
    });
  });

  describe('Outpost Upgrade', () => {
    it('should upgrade outpost level', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      const success = store.upgradeOutpost(outpost!.id);
      expect(success).toBe(true);
      
      const upgraded = store.getOutpost(outpost!.id);
      expect(upgraded?.level).toBe(2);
    });

    it('should not upgrade beyond level 3', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      store.upgradeOutpost(outpost!.id); // L2
      store.upgradeOutpost(outpost!.id); // L3
      const success = store.upgradeOutpost(outpost!.id); // Should fail
      
      expect(success).toBe(false);
      expect(store.getOutpost(outpost!.id)?.level).toBe(3);
    });
  });

  describe('Module Management', () => {
    it('should build a module', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      const success = store.buildModule(outpost!.id, 'storage');
      expect(success).toBe(true);
      
      const updated = store.getOutpost(outpost!.id);
      expect(updated?.modules).toHaveLength(1);
      expect(updated?.modules[0].type).toBe('storage');
      expect(updated?.modules[0].level).toBe(1);
    });

    it('should upgrade existing module', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      store.buildModule(outpost!.id, 'storage');
      store.upgradeModule(outpost!.id, 'storage');
      
      const updated = store.getOutpost(outpost!.id);
      expect(updated?.modules[0].level).toBe(2);
    });

    it('should calculate module effects', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      store.buildModule(outpost!.id, 'storage');
      store.buildModule(outpost!.id, 'infirmary');
      
      const effects = store.getModuleEffects(outpost!.id);
      expect(effects.storageBonus).toBeGreaterThan(0);
      expect(effects.healingRate).toBeGreaterThan(0);
    });
  });

  describe('Garrison Management', () => {
    it('should assign garrison', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      const success = store.assignGarrison(outpost!.id, ['worker1', 'worker2']);
      expect(success).toBe(true);
      expect(store.getGarrisonCount(outpost!.id)).toBe(2);
    });

    it('should not exceed max garrison', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      // L1 max garrison is 3
      const success = store.assignGarrison(outpost!.id, ['w1', 'w2', 'w3', 'w4']);
      expect(success).toBe(false);
    });

    it('should remove garrison', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      store.assignGarrison(outpost!.id, ['worker1', 'worker2']);
      store.removeGarrison(outpost!.id, 'worker1');
      
      expect(store.getGarrisonCount(outpost!.id)).toBe(1);
    });
  });

  describe('Stability Updates', () => {
    it('should update stability', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      // Add relay module to increase stability
      store.buildModule(outpost!.id, 'storage');
      store.updateStability(outpost!.id, 2);
      
      const updated = store.getOutpost(outpost!.id);
      expect(updated?.stability).toBeDefined();
    });

    it('should detect crisis state', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 10); // Far away
      
      // Stability should be low: 70 - 10*5 = 20
      expect(store.isInCrisis(outpost!.id)).toBe(true);
    });
  });

  describe('Outpost Removal', () => {
    it('should remove outpost', () => {
      const store = useOutpostStore.getState();
      const outpost = store.establishOutpost('node1', 2);
      
      const success = store.removeOutpost(outpost!.id);
      expect(success).toBe(true);
      expect(store.getOutpostCount()).toBe(0);
    });

    it('should reset all outposts', () => {
      const store = useOutpostStore.getState();
      store.establishOutpost('node1', 2);
      store.establishOutpost('node2', 3);
      
      store.resetOutposts();
      expect(store.getOutpostCount()).toBe(0);
    });
  });
});
