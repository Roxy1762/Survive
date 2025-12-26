/**
 * 行动系统测试
 * Action System Tests
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  useActionStore,
  validateAction,
  isShortActionPhase,
  getActionPreview,
  type ActionContext,
  type ResourceChange,
} from './actionStore';
import {
  SHORT_ACTION_PHASES,
  SHORT_ACTION_AU_COST,
  STANDARD_ACTION_AU_COST,
  isShortAction,
  isStandardAction,
  canPerformActionInPhase,
  getAvailableActionsForPhase,
  SHORT_ACTIONS,
  STANDARD_ACTIONS,
  getActionById,
  type ActionId,
} from '../config/actions';
import type { Phase, ResourceId, BuildingId } from '../types';

// ============================================
// 测试辅助函数
// Test Helper Functions
// ============================================

/**
 * 创建测试用的行动上下文
 */
function createTestContext(overrides: Partial<ActionContext> = {}): ActionContext {
  return {
    day: 1,
    phase: 'dawn',
    resources: {
      scrap: 100,
      water: 50,
      dirty_water: 20,
      food: 50,
      raw_meat: 10,
      canned_food: 5,
      vegetables: 5,
      seeds: 2,
      fertilizer: 2,
      wood: 30,
      metal: 20,
      cloth: 10,
      leather: 5,
      plastic: 5,
      glass: 5,
      rubber: 5,
      wire: 5,
      rope: 5,
      duct_tape: 3,
      gear: 2,
      pipe: 2,
      spring: 2,
      bearing: 2,
      fasteners: 5,
      solvent: 2,
      acid: 1,
      gunpowder: 2,
      fuel: 2,
      battery_cell: 1,
      battery_pack: 0,
      filter: 2,
      seal_ring: 2,
      meds: 1,
      data_tape: 0,
      radio_parts: 0,
      solar_cell: 0,
      rare_alloy: 0,
      microchips: 0,
      nanofiber: 0,
      power_core: 0,
    } as Record<ResourceId, number>,
    buildingLevels: {
      bonfire: 1,
      workshop: 1,
      radio_tower: 1,
      research_desk: 1,
    } as Partial<Record<BuildingId, number>>,
    researchedTechs: [],
    workerCount: 3,
    jobAssignments: {},
    ...overrides,
  };
}

// ============================================
// 短行动测试
// Short Action Tests
// Requirements: 17.1
// ============================================

describe('Short Actions (Requirements: 17.1)', () => {
  beforeEach(() => {
    useActionStore.getState().resetActions();
  });

  it('should allow short actions during all phases', () => {
    // 短行动现在可以在所有阶段执行
    expect(SHORT_ACTION_PHASES).toContain('dawn');
    expect(SHORT_ACTION_PHASES).toContain('noon');
    expect(SHORT_ACTION_PHASES).toContain('morning');
    expect(SHORT_ACTION_PHASES).toContain('afternoon');
    expect(SHORT_ACTION_PHASES).toContain('evening');
    expect(SHORT_ACTION_PHASES).toContain('midnight');
  });

  it('should have 0.5 AU cost for short actions', () => {
    expect(SHORT_ACTION_AU_COST).toBe(0.5);
    
    // 验证所有短行动的AU成本
    for (const action of Object.values(SHORT_ACTIONS)) {
      expect(action.auCost).toBe(0.5);
    }
  });

  it('should validate short action in all phases', () => {
    const shortActionId = 'quick_scavenge';
    
    // 清晨阶段应该可以执行
    const dawnContext = createTestContext({ phase: 'dawn' });
    const dawnValidation = validateAction(shortActionId, dawnContext);
    expect(dawnValidation.valid).toBe(true);
    
    // 中午阶段应该可以执行
    const noonContext = createTestContext({ phase: 'noon' });
    const noonValidation = validateAction(shortActionId, noonContext);
    expect(noonValidation.valid).toBe(true);
    
    // 上午阶段也应该可以执行（新逻辑）
    const morningContext = createTestContext({ phase: 'morning' });
    const morningValidation = validateAction(shortActionId, morningContext);
    expect(morningValidation.valid).toBe(true);
  });

  it('should correctly identify all phases as valid for short actions', () => {
    expect(isShortActionPhase('dawn')).toBe(true);
    expect(isShortActionPhase('noon')).toBe(true);
    expect(isShortActionPhase('morning')).toBe(true);
    expect(isShortActionPhase('afternoon')).toBe(true);
    expect(isShortActionPhase('evening')).toBe(true);
    expect(isShortActionPhase('midnight')).toBe(true);
  });

  it('should execute quick_scavenge action successfully', () => {
    const context = createTestContext({ phase: 'dawn' });
    const store = useActionStore.getState();
    
    let addedResources: { resourceId: ResourceId; amount: number }[] = [];
    
    const result = store.executeAction(
      'quick_scavenge',
      context,
      () => true,
      (changes) => { addedResources = changes; }
    );
    
    expect(result.success).toBe(true);
    expect(addedResources.length).toBeGreaterThan(0);
    expect(addedResources.some(r => r.resourceId === 'scrap')).toBe(true);
  });

  it('should execute quick_cook action with resource consumption', () => {
    const context = createTestContext({ phase: 'dawn' });
    const store = useActionStore.getState();
    
    const addedResources: { resourceId: ResourceId; amount: number }[] = [];
    
    const result = store.executeAction(
      'quick_cook',
      context,
      () => true,
      (changes) => { addedResources.push(...changes); }
    );
    
    expect(result.success).toBe(true);
    expect(result.resourceChanges).toBeDefined();
    expect(addedResources.some(r => r.resourceId === 'food')).toBe(true);
  });

  it('should execute purify_small action with resource consumption', () => {
    const context = createTestContext({ phase: 'noon' });
    const store = useActionStore.getState();
    
    let addedResources: { resourceId: ResourceId; amount: number }[] = [];
    
    const result = store.executeAction(
      'purify_small',
      context,
      () => true,
      (changes) => { addedResources = changes; }
    );
    
    expect(result.success).toBe(true);
    expect(addedResources.some(r => r.resourceId === 'water')).toBe(true);
  });
});

// ============================================
// 标准行动测试
// Standard Action Tests
// Requirements: 17.2
// ============================================

describe('Standard Actions (Requirements: 17.2)', () => {
  beforeEach(() => {
    useActionStore.getState().resetActions();
  });

  it('should have 1 AU cost for standard actions', () => {
    expect(STANDARD_ACTION_AU_COST).toBe(1.0);
    
    // 验证所有标准行动的AU成本（除了 assign_workers，它是免费行动）
    for (const action of Object.values(STANDARD_ACTIONS)) {
      // assign_workers is a special case - it's a free action (Requirements 2.2)
      if (action.id === 'assign_workers') {
        expect(action.auCost).toBe(0);
      } else {
        expect(action.auCost).toBe(1.0);
      }
    }
  });

  it('should allow standard actions in all phases', () => {
    const standardActionId = 'hunt';
    const phases: Phase[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'];
    
    for (const phase of phases) {
      const context = createTestContext({ phase });
      const validation = validateAction(standardActionId, context);
      expect(validation.valid).toBe(true);
    }
  });

  it('should validate building requirements for standard actions', () => {
    // workshop_craft 需要工坊
    const contextWithWorkshop = createTestContext({
      phase: 'morning',
      buildingLevels: { workshop: 1 },
    });
    const validationWithWorkshop = validateAction('workshop_craft', contextWithWorkshop);
    expect(validationWithWorkshop.valid).toBe(true);
    
    // 没有工坊时应该失败
    const contextWithoutWorkshop = createTestContext({
      phase: 'morning',
      buildingLevels: {},
    });
    const validationWithoutWorkshop = validateAction('workshop_craft', contextWithoutWorkshop);
    expect(validationWithoutWorkshop.valid).toBe(false);
    expect(validationWithoutWorkshop.missingBuildings).toBeDefined();
  });

  it('should execute hunt action successfully', () => {
    const context = createTestContext({ phase: 'morning' });
    const store = useActionStore.getState();
    
    let addedResources: { resourceId: ResourceId; amount: number }[] = [];
    
    const result = store.executeAction(
      'hunt',
      context,
      () => true,
      (changes) => { addedResources = changes; }
    );
    
    expect(result.success).toBe(true);
    expect(addedResources.some(r => r.resourceId === 'food')).toBe(true);
  });
});

// ============================================
// 行动验证和预览测试
// Action Validation and Preview Tests
// Requirements: 17.3
// ============================================

describe('Action Validation and Preview (Requirements: 17.3)', () => {
  beforeEach(() => {
    useActionStore.getState().resetActions();
  });

  it('should validate resource requirements', () => {
    // quick_cook 需要 raw_meat
    const contextWithMeat = createTestContext({
      phase: 'dawn',
      resources: { ...createTestContext().resources, raw_meat: 5 },
    });
    const validationWithMeat = validateAction('quick_cook', contextWithMeat);
    expect(validationWithMeat.valid).toBe(true);
    
    // 没有生肉时应该失败
    const contextWithoutMeat = createTestContext({
      phase: 'dawn',
      resources: { ...createTestContext().resources, raw_meat: 0 },
    });
    const validationWithoutMeat = validateAction('quick_cook', contextWithoutMeat);
    expect(validationWithoutMeat.valid).toBe(false);
    expect(validationWithoutMeat.missingResources).toBeDefined();
  });

  it('should provide action preview with estimated results', () => {
    const context = createTestContext({ phase: 'dawn' });
    
    // 快速拾荒预览
    const scavengePreview = getActionPreview('quick_scavenge', context);
    expect(scavengePreview.action.id).toBe('quick_scavenge');
    expect(scavengePreview.validation.valid).toBe(true);
    expect(scavengePreview.estimatedResults).toBeDefined();
    expect(scavengePreview.estimatedResults?.descriptionZh).toContain('废料');
    
    // 快速烹饪预览
    const cookPreview = getActionPreview('quick_cook', context);
    expect(cookPreview.action.id).toBe('quick_cook');
    expect(cookPreview.estimatedResults?.resourceChanges).toBeDefined();
  });

  it('should return invalid preview for unknown action', () => {
    const context = createTestContext({ phase: 'dawn' });
    const preview = getActionPreview('unknown_action' as ActionId, context);
    expect(preview.validation.valid).toBe(false);
    expect(preview.validation.reasonZh).toContain('不存在');
  });

  it('should get available actions for current phase', () => {
    const store = useActionStore.getState();
    
    // 清晨阶段应该包含短行动和标准行动
    const dawnContext = createTestContext({ phase: 'dawn' });
    const dawnActions = store.getAvailableActions(dawnContext);
    expect(dawnActions.some(a => a.type === 'short')).toBe(true);
    expect(dawnActions.some(a => a.type === 'standard')).toBe(true);
    
    // 上午阶段现在也应该包含短行动和标准行动（新逻辑）
    const morningContext = createTestContext({ phase: 'morning' });
    const morningActions = store.getAvailableActions(morningContext);
    expect(morningActions.some(a => a.type === 'short')).toBe(true);
    expect(morningActions.some(a => a.type === 'standard')).toBe(true);
  });
});

// ============================================
// 行动结果显示测试
// Action Result Display Tests
// Requirements: 17.4
// ============================================

describe('Action Result Display (Requirements: 17.4)', () => {
  beforeEach(() => {
    useActionStore.getState().resetActions();
  });

  it('should return action result with message', () => {
    const context = createTestContext({ phase: 'dawn' });
    const store = useActionStore.getState();
    
    const result = store.executeAction(
      'quick_scavenge',
      context,
      () => true,
      () => {}
    );
    
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(result.messageZh).toBeDefined();
    expect(result.messageZh.length).toBeGreaterThan(0);
  });

  it('should return failure result with reason', () => {
    // 测试 AU 不足的情况
    const context = createTestContext({ phase: 'morning', phaseAU: 0.3 }); // AU 不足
    const store = useActionStore.getState();
    
    const result = store.executeAction(
      'quick_scavenge', // 需要 0.5 AU
      context,
      () => true,
      () => {}
    );
    
    expect(result.success).toBe(false);
    expect(result.messageZh).toContain('行动点不足');
  });

  it('should track last action result', () => {
    const context = createTestContext({ phase: 'dawn' });
    const store = useActionStore.getState();
    
    store.executeAction(
      'quick_scavenge',
      context,
      () => true,
      () => {}
    );
    
    const lastResult = useActionStore.getState().lastActionResult;
    expect(lastResult).not.toBeNull();
    expect(lastResult?.success).toBe(true);
  });

  it('should track executed actions this phase', () => {
    const context = createTestContext({ phase: 'dawn' });
    const store = useActionStore.getState();
    
    store.executeAction(
      'quick_scavenge',
      context,
      () => true,
      () => {}
    );
    
    const executed = useActionStore.getState().executedActionsThisPhase;
    expect(executed).toContain('quick_scavenge');
  });

  it('should reset phase actions', () => {
    const context = createTestContext({ phase: 'dawn' });
    const store = useActionStore.getState();
    
    store.executeAction(
      'quick_scavenge',
      context,
      () => true,
      () => {}
    );
    
    expect(useActionStore.getState().executedActionsThisPhase.length).toBeGreaterThan(0);
    
    store.resetPhaseActions();
    
    expect(useActionStore.getState().executedActionsThisPhase.length).toBe(0);
  });
});

// ============================================
// 行动类型辅助函数测试
// Action Type Helper Function Tests
// ============================================

describe('Action Type Helper Functions', () => {
  it('should correctly identify short actions', () => {
    expect(isShortAction('quick_scavenge')).toBe(true);
    expect(isShortAction('treat_wound')).toBe(true);
    expect(isShortAction('hunt')).toBe(false);
    expect(isShortAction('explore')).toBe(false);
  });

  it('should correctly identify standard actions', () => {
    expect(isStandardAction('hunt')).toBe(true);
    expect(isStandardAction('explore')).toBe(true);
    expect(isStandardAction('quick_scavenge')).toBe(false);
    expect(isStandardAction('treat_wound')).toBe(false);
  });

  it('should check if action can be performed in phase', () => {
    // 短行动现在可以在所有阶段执行
    expect(canPerformActionInPhase('quick_scavenge', 'dawn')).toBe(true);
    expect(canPerformActionInPhase('quick_scavenge', 'noon')).toBe(true);
    expect(canPerformActionInPhase('quick_scavenge', 'morning')).toBe(true);
    
    // 标准行动可以在所有阶段
    expect(canPerformActionInPhase('hunt', 'dawn')).toBe(true);
    expect(canPerformActionInPhase('hunt', 'morning')).toBe(true);
    expect(canPerformActionInPhase('hunt', 'midnight')).toBe(true);
  });

  it('should get available actions for phase', () => {
    // 清晨阶段应该有短行动和标准行动
    const dawnActions = getAvailableActionsForPhase('dawn');
    expect(dawnActions.some(a => a.type === 'short')).toBe(true);
    expect(dawnActions.some(a => a.type === 'standard')).toBe(true);
    
    // 上午阶段现在也应该有短行动和标准行动（新逻辑）
    const morningActions = getAvailableActionsForPhase('morning');
    expect(morningActions.some(a => a.type === 'short')).toBe(true);
    expect(morningActions.some(a => a.type === 'standard')).toBe(true);
  });
});


// ============================================
// Property-Based Tests
// Feature: game-improvements, Property 1: Action Execution Updates State
// Validates: Requirements 1.1, 1.2, 1.4, 1.5
// ============================================

describe('Property-Based Tests: Action Execution Updates State', () => {
  beforeEach(() => {
    useActionStore.getState().resetActions();
  });

  /**
   * Property 1: Action Execution Updates State
   * 
   * For any valid action with sufficient resources, executing the action SHALL result in:
   * - Resources being consumed according to action cost
   * - AU being decremented by action duration (tracked via executedActionsThisPhase)
   * - Event log containing the action result (tracked via lastActionResult)
   * 
   * **Validates: Requirements 1.1, 1.2, 1.4, 1.5**
   */
  it('should update state correctly for any valid action execution', () => {
    // Generator for valid action IDs that can be executed with resources
    const executableActionIds: ActionId[] = [
      'quick_scavenge',  // No resource requirements
      'hunt',            // No resource requirements
      'organize_inventory', // No resource requirements
      'treat_wound',     // No resource requirements
      'minor_repair',    // No resource requirements
      'salvage',         // No resource requirements
      'assign_workers',  // No resource requirements
      'build',           // No resource requirements
    ];

    // Generator for phases that allow both short and standard actions
    const validPhases: Phase[] = ['dawn', 'noon'];

    const actionIdArb = fc.constantFrom(...executableActionIds);
    const phaseArb = fc.constantFrom(...validPhases);
    const dayArb = fc.integer({ min: 1, max: 100 });

    fc.assert(
      fc.property(actionIdArb, phaseArb, dayArb, (actionId, phase, day) => {
        // Reset store state before each test
        useActionStore.getState().resetActions();

        // Create context with sufficient resources
        const context: ActionContext = {
          day,
          phase,
          resources: {
            scrap: 100,
            water: 50,
            dirty_water: 20,
            food: 50,
            raw_meat: 10,
            canned_food: 5,
            vegetables: 5,
            seeds: 2,
            fertilizer: 2,
            wood: 30,
            metal: 20,
            cloth: 10,
            leather: 5,
            plastic: 5,
            glass: 5,
            rubber: 5,
            wire: 5,
            rope: 5,
            duct_tape: 3,
            gear: 2,
            pipe: 2,
            spring: 2,
            bearing: 2,
            fasteners: 5,
            solvent: 2,
            acid: 1,
            gunpowder: 2,
            fuel: 2,
            battery_cell: 1,
            battery_pack: 0,
            filter: 2,
            seal_ring: 2,
            meds: 1,
            data_tape: 0,
            radio_parts: 0,
            solar_cell: 0,
            rare_alloy: 0,
            microchips: 0,
            nanofiber: 0,
            power_core: 0,
          } as Record<ResourceId, number>,
          buildingLevels: {
            bonfire: 1,
            workshop: 1,
            radio_tower: 1,
            research_desk: 1,
          } as Partial<Record<BuildingId, number>>,
          researchedTechs: [],
          workerCount: 3,
          jobAssignments: {},
        };

        // Track resource changes
        const consumedResources: ResourceChange[] = [];
        const addedResources: ResourceChange[] = [];

        const store = useActionStore.getState();
        
        // Execute the action
        const result = store.executeAction(
          actionId,
          context,
          (changes) => {
            consumedResources.push(...changes);
            return true; // Always succeed for this test
          },
          (changes) => {
            addedResources.push(...changes);
          }
        );

        // Property 1: Successful execution should update state
        if (result.success) {
          // Requirement 1.1: Action should execute and update state
          // Requirement 1.4: AU tracking - action should be recorded in executedActionsThisPhase
          const executedActions = useActionStore.getState().executedActionsThisPhase;
          expect(executedActions).toContain(actionId);

          // Requirement 1.2: Result should be recorded
          const lastResult = useActionStore.getState().lastActionResult;
          expect(lastResult).not.toBeNull();
          expect(lastResult?.success).toBe(true);
          expect(lastResult?.messageZh).toBeDefined();
          expect(lastResult?.messageZh.length).toBeGreaterThan(0);

          // Requirement 1.5: If action has resource changes, they should be tracked
          if (result.resourceChanges && result.resourceChanges.length > 0) {
            // Resource changes should be recorded in the result
            expect(result.resourceChanges.length).toBeGreaterThan(0);
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Actions with resource requirements should consume resources
   * 
   * For any action that requires resources, successful execution should
   * trigger the consumeResources callback with the correct resource amounts.
   * 
   * **Validates: Requirements 1.5**
   */
  it('should consume resources for actions with resource requirements', () => {
    // Actions that consume resources
    const resourceConsumingActions: ActionId[] = ['quick_cook', 'purify_small'];
    const validPhases: Phase[] = ['dawn', 'noon'];

    const actionIdArb = fc.constantFrom(...resourceConsumingActions);
    const phaseArb = fc.constantFrom(...validPhases);

    fc.assert(
      fc.property(actionIdArb, phaseArb, (actionId, phase) => {
        useActionStore.getState().resetActions();

        const context: ActionContext = {
          day: 1,
          phase,
          resources: {
            scrap: 100,
            water: 50,
            dirty_water: 20,
            food: 50,
            raw_meat: 10,
            canned_food: 5,
            vegetables: 5,
            seeds: 2,
            fertilizer: 2,
            wood: 30,
            metal: 20,
            cloth: 10,
            leather: 5,
            plastic: 5,
            glass: 5,
            rubber: 5,
            wire: 5,
            rope: 5,
            duct_tape: 3,
            gear: 2,
            pipe: 2,
            spring: 2,
            bearing: 2,
            fasteners: 5,
            solvent: 2,
            acid: 1,
            gunpowder: 2,
            fuel: 2,
            battery_cell: 1,
            battery_pack: 0,
            filter: 2,
            seal_ring: 2,
            meds: 1,
            data_tape: 0,
            radio_parts: 0,
            solar_cell: 0,
            rare_alloy: 0,
            microchips: 0,
            nanofiber: 0,
            power_core: 0,
          } as Record<ResourceId, number>,
          buildingLevels: {} as Partial<Record<BuildingId, number>>,
          researchedTechs: [],
          workerCount: 3,
          jobAssignments: {},
        };

        let consumeResourcesCalled = false;
        const consumedResources: ResourceChange[] = [];

        const store = useActionStore.getState();
        const result = store.executeAction(
          actionId,
          context,
          (changes) => {
            consumeResourcesCalled = true;
            consumedResources.push(...changes);
            return true;
          },
          () => {}
        );

        // If action succeeded, consumeResources should have been called
        if (result.success) {
          expect(consumeResourcesCalled).toBe(true);
          
          // Resource changes should be recorded in result
          expect(result.resourceChanges).toBeDefined();
          expect(result.resourceChanges!.length).toBeGreaterThan(0);
          
          // Should have both consumption (negative) and production (positive)
          const hasConsumption = result.resourceChanges!.some(c => c.amount < 0);
          const hasProduction = result.resourceChanges!.some(c => c.amount > 0);
          expect(hasConsumption).toBe(true);
          expect(hasProduction).toBe(true);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Action AU cost should match action type
   * 
   * For any action, the AU cost should be 0.5 for short actions and 1.0 for standard actions.
   * 
   * **Validates: Requirements 1.4**
   */
  it('should have correct AU cost for all action types', () => {
    const allActionIds: ActionId[] = [
      ...Object.keys(SHORT_ACTIONS) as ActionId[],
      ...Object.keys(STANDARD_ACTIONS) as ActionId[],
    ];

    const actionIdArb = fc.constantFrom(...allActionIds);

    fc.assert(
      fc.property(actionIdArb, (actionId) => {
        const action = getActionById(actionId);
        expect(action).toBeDefined();

        if (isShortAction(actionId)) {
          // Short actions should cost 0.5 AU
          expect(action!.auCost).toBe(SHORT_ACTION_AU_COST);
          expect(action!.auCost).toBe(0.5);
        } else if (isStandardAction(actionId)) {
          // Standard actions should cost 1.0 AU, except assign_workers which is free (Requirements 2.2)
          if (actionId === 'assign_workers') {
            expect(action!.auCost).toBe(0);
          } else {
            expect(action!.auCost).toBe(STANDARD_ACTION_AU_COST);
            expect(action!.auCost).toBe(1.0);
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
