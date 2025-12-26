/**
 * 装备与耐久系统测试
 * Equipment & Durability System Tests
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  useEquipmentStore,
  calculateDurabilityConsumption,
  calculateEquipmentStatus,
  calculateSalvageValue,
  createEquipmentInstance,
  resetInstanceIdCounter,
  SALVAGE_MIN_RATE,
  SALVAGE_MAX_RATE,
  REPAIR_KIT_DURABILITY_RESTORE,
} from './equipmentStore';
import { getEquipmentConfig, ALL_EQUIPMENT } from '../config/equipment';

describe('Equipment System Utility Functions', () => {
  describe('calculateDurabilityConsumption', () => {
    it('should return 1 Dur for 1 AU', () => {
      expect(calculateDurabilityConsumption(1)).toBe(1);
    });

    it('should return 0.5 Dur for 0.5 AU (half phases)', () => {
      expect(calculateDurabilityConsumption(0.5)).toBe(0.5);
    });

    it('should return 0 Dur for 0 AU', () => {
      expect(calculateDurabilityConsumption(0)).toBe(0);
    });
  });

  describe('calculateEquipmentStatus', () => {
    it('should return broken when durability is 0', () => {
      expect(calculateEquipmentStatus(0, 100)).toBe('broken');
    });

    it('should return broken when durability is negative', () => {
      expect(calculateEquipmentStatus(-5, 100)).toBe('broken');
    });

    it('should return damaged when durability is 25% or less', () => {
      expect(calculateEquipmentStatus(25, 100)).toBe('damaged');
      expect(calculateEquipmentStatus(24, 100)).toBe('damaged');
      expect(calculateEquipmentStatus(1, 100)).toBe('damaged');
    });

    it('should return functional when durability is above 25%', () => {
      expect(calculateEquipmentStatus(26, 100)).toBe('functional');
      expect(calculateEquipmentStatus(50, 100)).toBe('functional');
      expect(calculateEquipmentStatus(100, 100)).toBe('functional');
    });
  });

  describe('calculateSalvageValue', () => {
    it('should return value between 20-40% of equipment VU', () => {
      const equipmentVU = 100;
      
      // Test with min random factor
      const minValue = calculateSalvageValue(equipmentVU, 0);
      expect(minValue).toBe(Math.floor(equipmentVU * SALVAGE_MIN_RATE));
      
      // Test with max random factor
      const maxValue = calculateSalvageValue(equipmentVU, 1);
      expect(maxValue).toBe(Math.floor(equipmentVU * SALVAGE_MAX_RATE));
    });
  });

  describe('createEquipmentInstance', () => {
    beforeEach(() => {
      resetInstanceIdCounter();
    });

    it('should create instance with max durability by default', () => {
      const instance = createEquipmentInstance('rusty_pipe');
      expect(instance).not.toBeNull();
      expect(instance!.configId).toBe('rusty_pipe');
      expect(instance!.durability).toBe(60); // rusty_pipe maxDurability
      expect(instance!.status).toBe('functional');
    });

    it('should create instance with custom durability', () => {
      const instance = createEquipmentInstance('rusty_pipe', 30);
      expect(instance).not.toBeNull();
      expect(instance!.durability).toBe(30);
    });

    it('should return null for invalid config id', () => {
      const instance = createEquipmentInstance('invalid_equipment');
      expect(instance).toBeNull();
    });
  });
});

describe('Equipment Store', () => {
  beforeEach(() => {
    useEquipmentStore.getState().resetEquipment();
  });

  describe('addEquipment', () => {
    it('should add equipment with max durability', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe');
      expect(instance).not.toBeNull();
      expect(instance!.durability).toBe(60);
      expect(useEquipmentStore.getState().equipment.length).toBe(1);
    });

    it('should add equipment with custom durability', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 30);
      expect(instance).not.toBeNull();
      expect(instance!.durability).toBe(30);
    });

    it('should return null for invalid equipment id', () => {
      const instance = useEquipmentStore.getState().addEquipment('invalid');
      expect(instance).toBeNull();
    });
  });

  describe('removeEquipment', () => {
    it('should remove existing equipment', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe');
      expect(useEquipmentStore.getState().equipment.length).toBe(1);
      
      const removed = useEquipmentStore.getState().removeEquipment(instance!.instanceId);
      expect(removed).toBe(true);
      expect(useEquipmentStore.getState().equipment.length).toBe(0);
    });

    it('should return false for non-existent equipment', () => {
      const removed = useEquipmentStore.getState().removeEquipment('non_existent');
      expect(removed).toBe(false);
    });
  });

  describe('useEquipment (Durability Consumption)', () => {
    it('should consume durability based on AU cost', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe');
      const initialDurability = instance!.durability;
      
      const result = useEquipmentStore.getState().useEquipment(instance!.instanceId, 1);
      
      expect(result.success).toBe(true);
      expect(result.durabilityLost).toBe(1);
      expect(result.newDurability).toBe(initialDurability - 1);
      expect(result.broken).toBe(false);
    });

    it('should consume 0.5 durability for half phase (0.5 AU)', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe');
      const initialDurability = instance!.durability;
      
      const result = useEquipmentStore.getState().useEquipment(instance!.instanceId, 0.5);
      
      expect(result.success).toBe(true);
      expect(result.durabilityLost).toBe(0.5);
      expect(result.newDurability).toBe(initialDurability - 0.5);
    });

    it('should mark equipment as broken when durability reaches 0', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 1);
      
      const result = useEquipmentStore.getState().useEquipment(instance!.instanceId, 1);
      
      expect(result.success).toBe(true);
      expect(result.broken).toBe(true);
      expect(result.newDurability).toBe(0);
      
      const equipment = useEquipmentStore.getState().getEquipment(instance!.instanceId);
      expect(equipment!.status).toBe('broken');
    });

    it('should fail to use broken equipment', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 0);
      
      const result = useEquipmentStore.getState().useEquipment(instance!.instanceId, 1);
      
      expect(result.success).toBe(false);
      expect(result.broken).toBe(true);
    });

    it('should fail for non-existent equipment', () => {
      const result = useEquipmentStore.getState().useEquipment('non_existent', 1);
      expect(result.success).toBe(false);
    });
  });

  describe('repairEquipment', () => {
    it('should restore durability', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 30);
      
      const result = useEquipmentStore.getState().repairEquipment(
        instance!.instanceId, 
        REPAIR_KIT_DURABILITY_RESTORE
      );
      
      expect(result.success).toBe(true);
      expect(result.durabilityRestored).toBe(10);
      expect(result.newDurability).toBe(40);
    });

    it('should not exceed max durability', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 55);
      
      const result = useEquipmentStore.getState().repairEquipment(
        instance!.instanceId, 
        REPAIR_KIT_DURABILITY_RESTORE
      );
      
      expect(result.success).toBe(true);
      expect(result.durabilityRestored).toBe(5); // Only 5 needed to reach max
      expect(result.newDurability).toBe(60);
    });

    it('should repair broken equipment', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 0);
      expect(useEquipmentStore.getState().getEquipment(instance!.instanceId)!.status).toBe('broken');
      
      const result = useEquipmentStore.getState().repairEquipment(
        instance!.instanceId, 
        REPAIR_KIT_DURABILITY_RESTORE
      );
      
      expect(result.success).toBe(true);
      expect(result.newDurability).toBe(10);
      
      const equipment = useEquipmentStore.getState().getEquipment(instance!.instanceId);
      expect(equipment!.status).toBe('damaged'); // 10/60 = 16.7% < 25%
    });
  });

  describe('salvageEquipment', () => {
    it('should return materials and remove equipment', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe');
      
      const result = useEquipmentStore.getState().salvageEquipment(instance!.instanceId);
      
      expect(result.success).toBe(true);
      expect(result.materials.length).toBeGreaterThan(0);
      expect(result.totalVU).toBeGreaterThanOrEqual(Math.floor(10 * SALVAGE_MIN_RATE));
      expect(result.totalVU).toBeLessThanOrEqual(Math.floor(10 * SALVAGE_MAX_RATE));
      
      // Equipment should be removed
      expect(useEquipmentStore.getState().equipment.length).toBe(0);
    });

    it('should fail for non-existent equipment', () => {
      const result = useEquipmentStore.getState().salvageEquipment('non_existent');
      expect(result.success).toBe(false);
    });
  });

  describe('isUsable', () => {
    it('should return true for functional equipment', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe');
      expect(useEquipmentStore.getState().isUsable(instance!.instanceId)).toBe(true);
    });

    it('should return true for damaged equipment', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 10);
      expect(useEquipmentStore.getState().isUsable(instance!.instanceId)).toBe(true);
    });

    it('should return false for broken equipment', () => {
      const instance = useEquipmentStore.getState().addEquipment('rusty_pipe', 0);
      expect(useEquipmentStore.getState().isUsable(instance!.instanceId)).toBe(false);
    });

    it('should return false for non-existent equipment', () => {
      expect(useEquipmentStore.getState().isUsable('non_existent')).toBe(false);
    });
  });
});

/**
 * Property-Based Tests
 * Feature: dust-and-echoes, Property 17: Durability Consumption
 */
describe('Property-Based Tests', () => {
  beforeEach(() => {
    useEquipmentStore.getState().resetEquipment();
  });

  /**
   * Property 17: Durability Consumption
   * For any equipment used for A AU of activity, the durability loss SHALL equal A 
   * (or 0.5 × A for half phases).
   * **Validates: Requirements 12.2**
   */
  it('Property 17: Durability Consumption - durability loss equals AU cost', () => {
    // Get all valid equipment IDs
    const equipmentIds = Object.keys(ALL_EQUIPMENT);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...equipmentIds),
        fc.double({ min: 0.5, max: 10, noNaN: true }), // AU cost (0.5 for half phases, up to 10)
        (equipmentId, auCost) => {
          // Reset store for each test
          useEquipmentStore.getState().resetEquipment();
          
          const config = getEquipmentConfig(equipmentId);
          if (!config) return false;
          
          // Create equipment with enough durability
          const initialDurability = Math.max(config.maxDurability, auCost + 1);
          const instance = useEquipmentStore.getState().addEquipment(
            equipmentId, 
            Math.min(initialDurability, config.maxDurability)
          );
          
          if (!instance) return false;
          
          const durabilityBefore = instance.durability;
          
          // Use equipment
          const result = useEquipmentStore.getState().useEquipment(instance.instanceId, auCost);
          
          if (!result.success) return false;
          
          // Property: durability loss should equal AU cost (1:1 mapping)
          const expectedLoss = auCost;
          const actualLoss = result.durabilityLost;
          
          // Check that durability loss equals AU cost
          if (Math.abs(actualLoss - expectedLoss) > 0.0001) return false;
          
          // Check that new durability is correct
          const expectedNewDurability = Math.max(0, durabilityBefore - expectedLoss);
          if (Math.abs(result.newDurability - expectedNewDurability) > 0.0001) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Equipment status transitions correctly based on durability
   */
  it('Equipment status transitions correctly based on durability percentage', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // durability
        fc.integer({ min: 1, max: 100 }), // maxDurability
        (durability, maxDurability) => {
          const status = calculateEquipmentStatus(durability, maxDurability);
          const percentage = durability / maxDurability;
          
          if (durability <= 0) {
            return status === 'broken';
          } else if (percentage <= 0.25) {
            return status === 'damaged';
          } else {
            return status === 'functional';
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Salvage value is always within 20-40% range
   */
  it('Salvage value is always within 20-40% of equipment VU', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // equipment VU
        fc.double({ min: 0, max: 1, noNaN: true }), // random factor
        (equipmentVU, randomFactor) => {
          const salvageValue = calculateSalvageValue(equipmentVU, randomFactor);
          const minExpected = Math.floor(equipmentVU * SALVAGE_MIN_RATE);
          const maxExpected = Math.floor(equipmentVU * SALVAGE_MAX_RATE);
          
          return salvageValue >= minExpected && salvageValue <= maxExpected;
        }
      ),
      { numRuns: 100 }
    );
  });
});
