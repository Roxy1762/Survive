/**
 * 科技树系统测试
 * Tech Tree System Tests
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useTechStore, getTechMaterialCost, getTechRPCost, hasEnoughMaterialsForTech, validateResearchRequirements } from './techStore';
import { getTechnologyById, TECHNOLOGIES } from '../config/technologies';
import type { ResourceId } from '../types';

describe('TechStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useTechStore.getState().resetTech();
  });

  describe('Initial State', () => {
    it('should start with no researched technologies', () => {
      const state = useTechStore.getState();
      expect(state.researched).toEqual([]);
      expect(state.current).toBeNull();
      expect(state.progress).toBe(0);
    });
  });

  describe('Research State Management (16.1)', () => {
    it('should track researched technologies', () => {
      const store = useTechStore.getState();
      
      // Research a T1 tech with no prerequisites
      store.startResearch('basic_division');
      store.addProgress(40); // Complete the research
      
      // Get fresh state after updates
      const updatedState = useTechStore.getState();
      expect(updatedState.isResearched('basic_division')).toBe(true);
      expect(updatedState.researched).toContain('basic_division');
    });

    it('should track current research and progress', () => {
      const store = useTechStore.getState();
      
      store.startResearch('basic_division');
      expect(useTechStore.getState().current).toBe('basic_division');
      expect(useTechStore.getState().progress).toBe(0);
      
      store.addProgress(20);
      expect(useTechStore.getState().progress).toBe(20);
      expect(useTechStore.getState().getProgressPercent()).toBe(50); // 20/40 = 50%
    });

    it('should get remaining RP correctly', () => {
      const store = useTechStore.getState();
      
      store.startResearch('basic_division'); // 40 RP cost
      expect(store.getRemainingRP()).toBe(40);
      
      store.addProgress(15);
      expect(useTechStore.getState().getRemainingRP()).toBe(25);
    });

    it('should get current research info', () => {
      const store = useTechStore.getState();
      
      expect(store.getCurrentResearch()).toBeNull();
      
      store.startResearch('basic_division');
      const current = useTechStore.getState().getCurrentResearch();
      expect(current).not.toBeNull();
      expect(current?.id).toBe('basic_division');
    });
  });

  describe('Research Logic (16.2)', () => {
    it('should validate prerequisites before starting research', () => {
      const store = useTechStore.getState();
      
      // simple_storage requires basic_division
      const result = store.canStartResearch('simple_storage');
      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('前置科技未完成');
    });

    it('should allow research when prerequisites are met', () => {
      const store = useTechStore.getState();
      
      // First research basic_division
      store.startResearch('basic_division');
      store.addProgress(40);
      
      // Now simple_storage should be available
      const result = useTechStore.getState().canStartResearch('simple_storage');
      expect(result.canStart).toBe(true);
    });

    it('should not allow researching already completed tech', () => {
      const store = useTechStore.getState();
      
      store.startResearch('basic_division');
      store.addProgress(40);
      
      const result = useTechStore.getState().canStartResearch('basic_division');
      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('该科技已研究完成');
    });

    it('should not allow starting new research while another is in progress', () => {
      const store = useTechStore.getState();
      
      store.startResearch('basic_division');
      
      const result = store.canStartResearch('basic_trapping');
      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('正在研究其他科技');
    });

    it('should complete research when progress reaches cost', () => {
      const store = useTechStore.getState();
      
      store.startResearch('basic_division');
      const result = store.addProgress(40);
      
      expect(result.completed).toBe(true);
      expect(result.techId).toBe('basic_division');
      expect(result.unlocks).toBeDefined();
      expect(useTechStore.getState().current).toBeNull();
      expect(useTechStore.getState().progress).toBe(0);
    });

    it('should handle partial progress correctly', () => {
      const store = useTechStore.getState();
      
      store.startResearch('basic_division');
      
      let result = store.addProgress(10);
      expect(result.completed).toBe(false);
      expect(useTechStore.getState().progress).toBe(10);
      
      result = useTechStore.getState().addProgress(10);
      expect(result.completed).toBe(false);
      expect(useTechStore.getState().progress).toBe(20);
      
      result = useTechStore.getState().addProgress(20);
      expect(result.completed).toBe(true);
    });

    it('should cancel research correctly', () => {
      const store = useTechStore.getState();
      
      store.startResearch('basic_division');
      store.addProgress(20);
      
      store.cancelResearch();
      
      expect(useTechStore.getState().current).toBeNull();
      expect(useTechStore.getState().progress).toBe(0);
    });

    it('should complete research directly with completeResearch', () => {
      const store = useTechStore.getState();
      
      const success = store.completeResearch('basic_division');
      expect(success).toBe(true);
      expect(store.isResearched('basic_division')).toBe(true);
    });

    it('should not complete research if prerequisites not met', () => {
      const store = useTechStore.getState();
      
      const success = store.completeResearch('simple_storage');
      expect(success).toBe(false);
      expect(store.isResearched('simple_storage')).toBe(false);
    });
  });

  describe('Unlock Logic (16.3)', () => {
    it('should unlock buildings when tech is researched', () => {
      const store = useTechStore.getState();
      
      // Research simple_storage which unlocks warehouse
      store.completeResearch('basic_division');
      store.completeResearch('simple_storage');
      
      const unlockedBuildings = useTechStore.getState().getUnlockedBuildings();
      expect(unlockedBuildings).toContain('warehouse');
    });

    it('should unlock recipes when tech is researched', () => {
      const store = useTechStore.getState();
      
      // Research workshop_basics which unlocks craft_wood and craft_metal
      store.completeResearch('basic_division');
      store.completeResearch('workshop_basics');
      
      const unlockedRecipes = useTechStore.getState().getUnlockedRecipes();
      expect(unlockedRecipes).toContain('craft_wood');
      expect(unlockedRecipes).toContain('craft_metal');
    });

    it('should unlock jobs when tech is researched', () => {
      const store = useTechStore.getState();
      
      // Research basic_trapping which unlocks hunter job
      store.completeResearch('basic_trapping');
      
      const unlockedJobs = useTechStore.getState().getUnlockedJobs();
      expect(unlockedJobs).toContain('hunter');
    });

    it('should unlock features when tech is researched', () => {
      const store = useTechStore.getState();
      
      // Research basic_division which unlocks job_assignment feature
      store.completeResearch('basic_division');
      
      const unlockedFeatures = useTechStore.getState().getUnlockedFeatures();
      expect(unlockedFeatures).toContain('job_assignment');
    });

    it('should check if specific content is unlocked', () => {
      const store = useTechStore.getState();
      
      expect(store.isUnlocked('building', 'warehouse')).toBe(false);
      
      store.completeResearch('basic_division');
      store.completeResearch('simple_storage');
      
      expect(useTechStore.getState().isUnlocked('building', 'warehouse')).toBe(true);
    });

    it('should get tech unlocks correctly', () => {
      const store = useTechStore.getState();
      
      const unlocks = store.getTechUnlocks('workshop_basics');
      expect(unlocks.length).toBeGreaterThan(0);
      expect(unlocks.some(u => u.type === 'building' && u.id === 'workshop')).toBe(true);
    });

    it('should return empty array for non-existent tech', () => {
      const store = useTechStore.getState();
      
      const unlocks = store.getTechUnlocks('non_existent_tech');
      expect(unlocks).toEqual([]);
    });
  });

  describe('Available Technologies', () => {
    it('should list technologies with no prerequisites as available initially', () => {
      const store = useTechStore.getState();
      
      const available = store.getAvailableTechs();
      
      // Technologies with no prerequisites should be available
      const availableIds = available.map(t => t.id);
      expect(availableIds).toContain('basic_division');
      expect(availableIds).toContain('basic_trapping');
      expect(availableIds).toContain('water_collection');
      expect(availableIds).toContain('scavenging');
    });

    it('should update available technologies after research', () => {
      const store = useTechStore.getState();
      
      // Initially simple_storage is not available
      let available = store.getAvailableTechs();
      expect(available.map(t => t.id)).not.toContain('simple_storage');
      
      // After researching basic_division, simple_storage becomes available
      store.completeResearch('basic_division');
      available = useTechStore.getState().getAvailableTechs();
      expect(available.map(t => t.id)).toContain('simple_storage');
    });
  });
});

describe('Tech Helper Functions', () => {
  describe('getTechMaterialCost', () => {
    it('should return empty array for tech with no material cost', () => {
      const cost = getTechMaterialCost('basic_division');
      expect(cost).toEqual([]);
    });

    it('should return material cost for tech with materials', () => {
      const cost = getTechMaterialCost('simple_radio');
      expect(cost.length).toBeGreaterThan(0);
      expect(cost[0].resourceId).toBe('wire');
      expect(cost[0].amount).toBe(4);
    });

    it('should return empty array for non-existent tech', () => {
      const cost = getTechMaterialCost('non_existent');
      expect(cost).toEqual([]);
    });
  });

  describe('getTechRPCost', () => {
    it('should return correct RP cost', () => {
      expect(getTechRPCost('basic_division')).toBe(40);
      expect(getTechRPCost('simple_storage')).toBe(60);
      expect(getTechRPCost('workshop_basics')).toBe(90);
    });

    it('should return 0 for non-existent tech', () => {
      expect(getTechRPCost('non_existent')).toBe(0);
    });
  });

  describe('hasEnoughMaterialsForTech', () => {
    it('should return true for tech with no material cost', () => {
      const resources: Partial<Record<ResourceId, number>> = { scrap: 0 };
      expect(hasEnoughMaterialsForTech('basic_division', resources)).toBe(true);
    });

    it('should return true when resources are sufficient', () => {
      const resources: Partial<Record<ResourceId, number>> = { wire: 10 };
      expect(hasEnoughMaterialsForTech('simple_radio', resources)).toBe(true);
    });

    it('should return false when resources are insufficient', () => {
      const resources: Partial<Record<ResourceId, number>> = { wire: 2 };
      expect(hasEnoughMaterialsForTech('simple_radio', resources)).toBe(false);
    });
  });

  describe('validateResearchRequirements', () => {
    it('should validate successfully for tech with met requirements', () => {
      const result = validateResearchRequirements('basic_division', [], {});
      expect(result.valid).toBe(true);
    });

    it('should fail for already researched tech', () => {
      const result = validateResearchRequirements('basic_division', ['basic_division'], {});
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('该科技已研究完成');
    });

    it('should fail for missing prerequisites', () => {
      const result = validateResearchRequirements('simple_storage', [], {});
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('缺少前置科技');
    });

    it('should fail for missing materials', () => {
      const resources: Partial<Record<ResourceId, number>> = { wire: 2 };
      const result = validateResearchRequirements('simple_radio', ['basic_division', 'workshop_basics', 'salvage_recycling'], resources);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('材料不足');
      expect(result.missingMaterials).toBeDefined();
      expect(result.missingMaterials?.length).toBeGreaterThan(0);
    });

    it('should pass when all requirements are met', () => {
      const resources: Partial<Record<ResourceId, number>> = { wire: 10 };
      const result = validateResearchRequirements('simple_radio', ['basic_division', 'workshop_basics', 'salvage_recycling'], resources);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Tech Tree Structure (Requirements 8.1)', () => {
  it('should have technologies organized into tiers T1-T4', () => {
    const tiers = new Set(TECHNOLOGIES.map(t => t.tier));
    expect(tiers.has('T1')).toBe(true);
    expect(tiers.has('T2')).toBe(true);
    expect(tiers.has('T3')).toBe(true);
    expect(tiers.has('T4')).toBe(true);
  });

  it('should have technologies organized into branches', () => {
    const branches = new Set(TECHNOLOGIES.map(t => t.branch));
    expect(branches.has('building')).toBe(true);
    expect(branches.has('agriculture')).toBe(true);
    expect(branches.has('industry')).toBe(true);
    expect(branches.has('civic')).toBe(true);
    expect(branches.has('exploration')).toBe(true);
  });

  it('should have valid prerequisites (all referenced techs exist)', () => {
    for (const tech of TECHNOLOGIES) {
      for (const prereq of tech.prerequisites) {
        const prereqTech = getTechnologyById(prereq);
        expect(prereqTech).toBeDefined();
      }
    }
  });

  it('should have no circular dependencies', () => {
    // Simple check: no tech should have itself as prerequisite
    for (const tech of TECHNOLOGIES) {
      expect(tech.prerequisites).not.toContain(tech.id);
    }
    
    // More thorough check: build dependency graph and check for cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    function hasCycle(techId: string): boolean {
      if (recursionStack.has(techId)) return true;
      if (visited.has(techId)) return false;
      
      visited.add(techId);
      recursionStack.add(techId);
      
      const tech = getTechnologyById(techId);
      if (tech) {
        for (const prereq of tech.prerequisites) {
          if (hasCycle(prereq)) return true;
        }
      }
      
      recursionStack.delete(techId);
      return false;
    }
    
    for (const tech of TECHNOLOGIES) {
      expect(hasCycle(tech.id)).toBe(false);
    }
  });
});
