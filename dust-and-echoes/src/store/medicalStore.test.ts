/**
 * 医疗与状态系统测试
 * Medical and Status System Tests
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMedicalStore } from './medicalStore';
import type { Worker, StatusEffect } from '../types';
import { STATUS_HEALTH_DAMAGE } from '../config/medical';

// Helper to create a test worker
function createTestWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: `test_worker_${Date.now()}`,
    name: 'Test Worker',
    health: 100,
    job: null,
    statuses: [],
    equipment: {},
    ...overrides,
  };
}

describe('Medical Store', () => {
  beforeEach(() => {
    useMedicalStore.getState().resetMedical();
  });

  describe('Status Effect Processing (Requirements: 13.2)', () => {
    it('should calculate correct health damage for bleed status', () => {
      const store = useMedicalStore.getState();
      const statuses: StatusEffect[] = [{ type: 'bleed', severity: 'medium' }];
      
      const damage = store.calculateStatusDamage(statuses, 1.0);
      expect(damage).toBe(STATUS_HEALTH_DAMAGE.bleed); // 5 per AU
    });

    it('should calculate correct health damage for infection status', () => {
      const store = useMedicalStore.getState();
      const statuses: StatusEffect[] = [{ type: 'infection', severity: 'medium' }];
      
      const damage = store.calculateStatusDamage(statuses, 1.0);
      expect(damage).toBe(STATUS_HEALTH_DAMAGE.infection); // 3 per AU
    });

    it('should calculate correct health damage for poisoned status', () => {
      const store = useMedicalStore.getState();
      const statuses: StatusEffect[] = [{ type: 'poisoned', severity: 'medium' }];
      
      const damage = store.calculateStatusDamage(statuses, 1.0);
      expect(damage).toBe(STATUS_HEALTH_DAMAGE.poisoned); // 2 per AU
    });

    it('should calculate correct health damage for radiation status', () => {
      const store = useMedicalStore.getState();
      const statuses: StatusEffect[] = [{ type: 'radiation', severity: 'medium' }];
      
      const damage = store.calculateStatusDamage(statuses, 1.0);
      expect(damage).toBe(STATUS_HEALTH_DAMAGE.radiation); // 1 per AU
    });

    it('should scale damage with phase AU', () => {
      const store = useMedicalStore.getState();
      const statuses: StatusEffect[] = [{ type: 'bleed', severity: 'medium' }];
      
      const damage05 = store.calculateStatusDamage(statuses, 0.5);
      const damage10 = store.calculateStatusDamage(statuses, 1.0);
      
      expect(damage05).toBe(2.5); // 5 * 0.5
      expect(damage10).toBe(5);   // 5 * 1.0
    });

    it('should accumulate damage from multiple statuses', () => {
      const store = useMedicalStore.getState();
      const statuses: StatusEffect[] = [
        { type: 'bleed', severity: 'medium' },
        { type: 'infection', severity: 'medium' },
      ];
      
      const damage = store.calculateStatusDamage(statuses, 1.0);
      expect(damage).toBe(8); // 5 + 3
    });

    it('should process worker status effects and update health', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        health: 50,
        statuses: [{ type: 'bleed', severity: 'medium' }],
      });
      
      const result = store.processWorkerStatusEffects(worker, 1.0);
      
      expect(result.healthChange).toBe(-5);
      expect(result.newHealth).toBe(45);
      expect(result.died).toBe(false);
    });

    it('should detect worker death when health reaches 0', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        health: 3,
        statuses: [{ type: 'bleed', severity: 'medium' }],
      });
      
      const result = store.processWorkerStatusEffects(worker, 1.0);
      
      expect(result.newHealth).toBe(0);
      expect(result.died).toBe(true);
    });
  });

  describe('Medical Item Usage (Requirements: 13.3)', () => {
    it('should use bandage to stop bleeding and restore health', () => {
      const store = useMedicalStore.getState();
      let worker = createTestWorker({
        health: 50,
        statuses: [{ type: 'bleed', severity: 'medium' }],
      });
      
      const updateFn = (_id: string, updates: Partial<Worker>) => {
        worker = { ...worker, ...updates };
      };
      
      const result = store.useMedicalItem('bandage', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.healthRestored).toBe(8);
      expect(result.statusesCleared).toContain('bleed');
      expect(worker.health).toBe(58);
      expect(worker.statuses).toHaveLength(0);
    });

    it('should use antiseptic to clear light infection', () => {
      const store = useMedicalStore.getState();
      let worker = createTestWorker({
        health: 70,
        statuses: [{ type: 'infection', severity: 'light' }],
      });
      
      const updateFn = (_id: string, updates: Partial<Worker>) => {
        worker = { ...worker, ...updates };
      };
      
      const result = store.useMedicalItem('antiseptic', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.statusesCleared).toContain('infection');
    });

    it('should not clear medium infection with antiseptic', () => {
      const store = useMedicalStore.getState();
      let worker = createTestWorker({
        health: 70,
        statuses: [{ type: 'infection', severity: 'medium' }],
      });
      
      const updateFn = (_id: string, updates: Partial<Worker>) => {
        worker = { ...worker, ...updates };
      };
      
      const result = store.useMedicalItem('antiseptic', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.statusesCleared).toBeUndefined();
      expect(worker.statuses).toHaveLength(1);
    });

    it('should use medkit to restore health and clear medium infection', () => {
      const store = useMedicalStore.getState();
      let worker = createTestWorker({
        health: 30,
        statuses: [{ type: 'infection', severity: 'medium' }],
      });
      
      const updateFn = (_id: string, updates: Partial<Worker>) => {
        worker = { ...worker, ...updates };
      };
      
      const result = store.useMedicalItem('medkit', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.healthRestored).toBe(35);
      expect(result.statusesCleared).toContain('infection');
      expect(worker.health).toBe(65);
    });

    it('should use meds to restore health and clear severe infection', () => {
      const store = useMedicalStore.getState();
      let worker = createTestWorker({
        health: 20,
        statuses: [{ type: 'infection', severity: 'severe' }],
      });
      
      const updateFn = (_id: string, updates: Partial<Worker>) => {
        worker = { ...worker, ...updates };
      };
      
      const result = store.useMedicalItem('meds', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.healthRestored).toBe(80);
      expect(result.statusesCleared).toContain('infection');
      expect(worker.health).toBe(100);
    });

    it('should use antitoxin to clear poisoned and light radiation', () => {
      const store = useMedicalStore.getState();
      let worker = createTestWorker({
        health: 80,
        statuses: [
          { type: 'poisoned', severity: 'medium' },
          { type: 'radiation', severity: 'light' },
        ],
      });
      
      const updateFn = (_id: string, updates: Partial<Worker>) => {
        worker = { ...worker, ...updates };
      };
      
      const result = store.useMedicalItem('antitoxin', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.statusesCleared).toContain('poisoned');
      expect(result.statusesCleared).toContain('radiation');
      expect(worker.statuses).toHaveLength(0);
    });

    it('should add temporary effects from stimulant', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({ health: 80 });
      
      const updateFn = () => {};
      
      const result = store.useMedicalItem('stimulant', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.temporaryEffects).toBeDefined();
      expect(result.temporaryEffects?.some(e => e.type === 'efficiency_boost')).toBe(true);
      expect(result.temporaryEffects?.some(e => e.type === 'side_effect')).toBe(true);
    });

    it('should add morale from painkillers', () => {
      const worker = createTestWorker({ health: 80 });
      
      const updateFn = () => {};
      
      useMedicalStore.getState().setMorale(0);
      const result = useMedicalStore.getState().useMedicalItem('painkillers', worker, updateFn);
      
      expect(result.success).toBe(true);
      expect(result.moraleChange).toBe(1);
      expect(useMedicalStore.getState().morale).toBe(1);
    });

    it('should not use medical item on dead worker', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({ health: 0 });
      
      const updateFn = () => {};
      
      const result = store.useMedicalItem('bandage', worker, updateFn);
      
      expect(result.success).toBe(false);
    });
  });

  describe('Worker Efficiency (Requirements: 13.1, 13.2, 13.4)', () => {
    it('should return 0 efficiency for dead worker', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({ health: 0 });
      
      expect(store.calculateWorkerEfficiency(worker)).toBe(0);
    });

    it('should return 0 efficiency for worker with health below 20', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({ health: 15 });
      
      expect(store.calculateWorkerEfficiency(worker)).toBe(0);
    });

    it('should return 0 efficiency for bleeding worker', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        health: 80,
        statuses: [{ type: 'bleed', severity: 'medium' }],
      });
      
      expect(store.calculateWorkerEfficiency(worker)).toBe(0);
    });

    it('should reduce efficiency by 30% for worker with health below 50', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({ health: 40 });
      
      expect(store.calculateWorkerEfficiency(worker)).toBeCloseTo(0.7);
    });

    it('should reduce efficiency by 20% for poisoned worker', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        health: 80,
        statuses: [{ type: 'poisoned', severity: 'medium' }],
      });
      
      expect(store.calculateWorkerEfficiency(worker)).toBeCloseTo(0.8);
    });

    it('should stack efficiency penalties', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        health: 40, // -30%
        statuses: [{ type: 'poisoned', severity: 'medium' }], // -20%
      });
      
      // 0.7 * 0.8 = 0.56
      expect(store.calculateWorkerEfficiency(worker)).toBeCloseTo(0.56);
    });
  });

  describe('Morale System (Requirements: 13.4)', () => {
    it('should clamp morale between -5 and 5', () => {
      useMedicalStore.getState().setMorale(10);
      expect(useMedicalStore.getState().morale).toBe(5);
      
      useMedicalStore.getState().setMorale(-10);
      expect(useMedicalStore.getState().morale).toBe(-5);
    });

    it('should modify morale correctly', () => {
      useMedicalStore.getState().setMorale(0);
      useMedicalStore.getState().modifyMorale(2);
      expect(useMedicalStore.getState().morale).toBe(2);
      
      useMedicalStore.getState().modifyMorale(-3);
      expect(useMedicalStore.getState().morale).toBe(-1);
    });

    it('should detect desertion risk when morale < -3', () => {
      const store = useMedicalStore.getState();
      
      store.setMorale(-2);
      expect(store.hasDesertionRisk()).toBe(false);
      
      store.setMorale(-4);
      expect(store.hasDesertionRisk()).toBe(true);
    });

    it('should detect recruitment bonus when morale > 3', () => {
      const store = useMedicalStore.getState();
      
      store.setMorale(3);
      expect(store.hasRecruitmentBonus()).toBe(false);
      
      store.setMorale(4);
      expect(store.hasRecruitmentBonus()).toBe(true);
    });

    it('should calculate recruitment modifier based on morale', () => {
      const store = useMedicalStore.getState();
      
      store.setMorale(2);
      expect(store.getMoraleRecruitmentModifier()).toBeCloseTo(0.1); // 2 * 0.05
      
      store.setMorale(-3);
      expect(store.getMoraleRecruitmentModifier()).toBeCloseTo(-0.15); // -3 * 0.05
    });

    it('should only give efficiency bonus when morale > 3', () => {
      const store = useMedicalStore.getState();
      
      store.setMorale(3);
      expect(store.getMoraleEfficiencyModifier()).toBe(0);
      
      store.setMorale(5);
      expect(store.getMoraleEfficiencyModifier()).toBeCloseTo(0.04); // (5-3) * 0.02
    });
  });

  describe('Temporary Effects', () => {
    it('should add and retrieve temporary effects', () => {
      const store = useMedicalStore.getState();
      const workerId = 'test_worker';
      
      store.addTemporaryEffect(workerId, {
        id: 'test_effect',
        type: 'efficiency_boost',
        value: 20,
        remainingAU: 1,
      });
      
      const effects = store.getWorkerTemporaryEffects(workerId);
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('efficiency_boost');
    });

    it('should calculate efficiency boost from temporary effects', () => {
      const store = useMedicalStore.getState();
      const workerId = 'test_worker';
      
      store.addTemporaryEffect(workerId, {
        id: 'test_effect',
        type: 'efficiency_boost',
        value: 20,
        remainingAU: 1,
      });
      
      expect(store.getWorkerEfficiencyBoost(workerId)).toBe(20);
    });

    it('should calculate damage reduction from temporary effects', () => {
      const store = useMedicalStore.getState();
      const workerId = 'test_worker';
      
      store.addTemporaryEffect(workerId, {
        id: 'test_effect',
        type: 'damage_reduction',
        value: 50,
        remainingAU: 1,
      });
      
      expect(store.getWorkerDamageReduction(workerId)).toBe(50);
    });

    it('should detect immunity effect', () => {
      const store = useMedicalStore.getState();
      const workerId = 'test_worker';
      
      expect(store.hasImmunity(workerId)).toBe(false);
      
      store.addTemporaryEffect(workerId, {
        id: 'test_effect',
        type: 'immunity',
        value: 1,
        remainingAU: 1,
      });
      
      expect(store.hasImmunity(workerId)).toBe(true);
    });

    it('should process and expire temporary effects', () => {
      const store = useMedicalStore.getState();
      const workerId = 'test_worker';
      
      store.addTemporaryEffect(workerId, {
        id: 'test_effect',
        type: 'efficiency_boost',
        value: 20,
        remainingAU: 1,
      });
      
      store.processTemporaryEffects(1.0, () => {});
      
      const effects = store.getWorkerTemporaryEffects(workerId);
      expect(effects).toHaveLength(0);
    });

    it('should apply side effect health loss when effect expires', () => {
      const store = useMedicalStore.getState();
      const workerId = 'test_worker';
      let healthChange = 0;
      
      store.addTemporaryEffect(workerId, {
        id: 'test_effect',
        type: 'side_effect',
        value: 10,
        remainingAU: 1,
      });
      
      store.processTemporaryEffects(1.0, (_id, delta) => {
        healthChange = delta;
      });
      
      expect(healthChange).toBe(-10);
    });
  });

  describe('Recommended Medical Items', () => {
    it('should recommend bandage for bleeding worker', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        statuses: [{ type: 'bleed', severity: 'medium' }],
      });
      
      const recommendations = store.getRecommendedMedicalItems(worker);
      expect(recommendations).toContain('bandage');
    });

    it('should recommend antiseptic for light infection', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        statuses: [{ type: 'infection', severity: 'light' }],
      });
      
      const recommendations = store.getRecommendedMedicalItems(worker);
      expect(recommendations).toContain('antiseptic');
    });

    it('should recommend medkit for medium infection', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        statuses: [{ type: 'infection', severity: 'medium' }],
      });
      
      const recommendations = store.getRecommendedMedicalItems(worker);
      expect(recommendations).toContain('medkit');
    });

    it('should recommend meds for severe infection', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        statuses: [{ type: 'infection', severity: 'severe' }],
      });
      
      const recommendations = store.getRecommendedMedicalItems(worker);
      expect(recommendations).toContain('meds');
    });

    it('should recommend antitoxin for poisoned worker', () => {
      const store = useMedicalStore.getState();
      const worker = createTestWorker({
        statuses: [{ type: 'poisoned', severity: 'medium' }],
      });
      
      const recommendations = store.getRecommendedMedicalItems(worker);
      expect(recommendations).toContain('antitoxin');
    });
  });
});
