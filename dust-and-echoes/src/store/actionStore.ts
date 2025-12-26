/**
 * 行动系统状态管理
 * Action System State Management
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4
 */

import { create } from 'zustand';
import type { 
  Phase, 
  ResourceId,
  BuildingId
} from '../types';
import {
  type ActionId,
  type ShortActionId,
  type StandardActionId,
  type ActionDefinition,
  type ActionResult,
  type ActionRequirements,
  type ResourceChange,
  ACTIONS,
  SHORT_ACTIONS,
  STANDARD_ACTIONS,
  SHORT_ACTION_PHASES,
  SHORT_ACTION_AU_COST,
  STANDARD_ACTION_AU_COST,
  getActionById,
  isShortAction,
  isStandardAction,
  canPerformActionInPhase,
  getAvailableActionsForPhase,
} from '../config/actions';

// ============================================
// 行动验证结果接口
// Action Validation Result Interface
// ============================================

/** 行动验证结果 */
export interface ActionValidationResult {
  valid: boolean;
  reason?: string;
  reasonZh?: string;
  missingResources?: { resourceId: ResourceId; required: number; current: number }[];
  missingBuildings?: { buildingId: string; requiredLevel: number; currentLevel: number }[];
  missingTechnologies?: string[];
}

/** 行动预览结果 */
export interface ActionPreview {
  action: ActionDefinition;
  validation: ActionValidationResult;
  estimatedResults?: {
    resourceChanges?: ResourceChange[];
    description: string;
    descriptionZh: string;
  };
}

// ============================================
// 游戏状态上下文接口
// Game State Context Interface
// ============================================

/** 行动执行所需的游戏状态上下文 */
export interface ActionContext {
  day: number;
  phase: Phase;
  phaseAU: number;
  resources: Record<ResourceId, number>;
  buildingLevels: Partial<Record<BuildingId, number>>;
  researchedTechs: string[];
  workerCount: number;
  jobAssignments: Record<string, string[]>;
}

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 检查阶段是否允许短行动
 * Requirements: 17.1 - 短行动现在可以在任意阶段执行
 */
function isShortActionPhaseCheck(_phase: Phase): boolean {
  // Parameter intentionally unused - all phases allow short actions
  void _phase;
  return true; // 所有阶段都可以执行短行动
}

/**
 * 验证行动需求
 * Requirements: 17.3 - 检查需求
 */
function validateActionRequirementsInternal(
  requirements: ActionRequirements,
  context: ActionContext
): ActionValidationResult {
  const result: ActionValidationResult = { valid: true };
  
  // 检查资源需求
  if (requirements.resources && requirements.resources.length > 0) {
    const missingResources: { resourceId: ResourceId; required: number; current: number }[] = [];
    
    for (const req of requirements.resources) {
      const current = context.resources[req.resourceId] ?? 0;
      if (current < req.amount) {
        missingResources.push({
          resourceId: req.resourceId,
          required: req.amount,
          current,
        });
      }
    }
    
    if (missingResources.length > 0) {
      result.valid = false;
      result.missingResources = missingResources;
      result.reason = `Insufficient resources: ${missingResources.map(r => r.resourceId).join(', ')}`;
      result.reasonZh = `资源不足: ${missingResources.map(r => r.resourceId).join(', ')}`;
    }
  }
  
  // 检查建筑需求
  if (requirements.buildings && requirements.buildings.length > 0) {
    const missingBuildings: { buildingId: string; requiredLevel: number; currentLevel: number }[] = [];
    
    for (const req of requirements.buildings) {
      const currentLevel = context.buildingLevels[req.buildingId as BuildingId] ?? 0;
      if (currentLevel < req.minLevel) {
        missingBuildings.push({
          buildingId: req.buildingId,
          requiredLevel: req.minLevel,
          currentLevel,
        });
      }
    }
    
    if (missingBuildings.length > 0) {
      result.valid = false;
      result.missingBuildings = missingBuildings;
      const buildingNames = missingBuildings.map(b => `${b.buildingId} L${b.requiredLevel}`).join(', ');
      result.reason = `Missing buildings: ${buildingNames}`;
      result.reasonZh = `缺少建筑: ${buildingNames}`;
    }
  }
  
  // 检查科技需求
  if (requirements.technologies && requirements.technologies.length > 0) {
    const missingTechs = requirements.technologies.filter(
      tech => !context.researchedTechs.includes(tech)
    );
    
    if (missingTechs.length > 0) {
      result.valid = false;
      result.missingTechnologies = missingTechs;
      result.reason = `Missing technologies: ${missingTechs.join(', ')}`;
      result.reasonZh = `缺少科技: ${missingTechs.join(', ')}`;
    }
  }
  
  // 检查工人需求
  if (requirements.minWorkers !== undefined && context.workerCount < requirements.minWorkers) {
    result.valid = false;
    result.reason = `Need at least ${requirements.minWorkers} workers`;
    result.reasonZh = `需要至少 ${requirements.minWorkers} 名工人`;
  }
  
  return result;
}

/**
 * 验证行动是否可执行
 * Requirements: 17.3 - 检查需求
 */
function validateActionInternal(
  actionId: ActionId,
  context: ActionContext
): ActionValidationResult {
  const action = getActionById(actionId);
  
  if (!action) {
    return {
      valid: false,
      reason: 'Action not found',
      reasonZh: '行动不存在',
    };
  }
  
  // 检查阶段限制
  // Requirements: 17.1 - 短行动仅清晨/中午可用
  if (!canPerformActionInPhase(actionId, context.phase)) {
    if (isShortAction(actionId)) {
      return {
        valid: false,
        reason: 'Short actions can only be performed during Dawn and Noon phases',
        reasonZh: '短行动仅可在清晨和中午阶段执行',
      };
    }
    return {
      valid: false,
      reason: `This action cannot be performed during ${context.phase} phase`,
      reasonZh: `此行动无法在${context.phase}阶段执行`,
    };
  }
  
  // 验证行动需求
  return validateActionRequirementsInternal(action.requirements, context);
}

/**
 * 生成预期结果
 */
function generateEstimatedResults(
  action: ActionDefinition
): { resourceChanges?: ResourceChange[]; description: string; descriptionZh: string } {
  const resourceChanges: ResourceChange[] = [];
  let description = '';
  let descriptionZh = '';
  
  // 根据行动类型生成预期结果
  switch (action.id) {
    case 'quick_scavenge':
      resourceChanges.push({ resourceId: 'scrap', amount: 3 }); // 基础产出
      description = 'Gather ~3 scrap with chance for materials';
      descriptionZh = '收集约3废料，有机会获得材料';
      break;
    
    case 'gather_wood':
      resourceChanges.push({ resourceId: 'wood', amount: 1 }); // 基础产出
      description = 'Gather ~1-2 wood from nearby debris';
      descriptionZh = '从附近废墟收集约1-2木材';
      break;
    
    case 'quick_cook':
      resourceChanges.push({ resourceId: 'raw_meat', amount: -1 });
      resourceChanges.push({ resourceId: 'food', amount: 1 });
      description = 'Convert 1 raw meat to 1 food';
      descriptionZh = '将1生肉转化为1食物';
      break;
    
    case 'purify_small':
      resourceChanges.push({ resourceId: 'dirty_water', amount: -2 });
      resourceChanges.push({ resourceId: 'water', amount: 1 });
      description = 'Convert 2 dirty water to 1 clean water';
      descriptionZh = '将2脏水转化为1净水';
      break;
    
    case 'treat_wound':
      description = 'Use bandage to stop bleeding and restore health';
      descriptionZh = '使用绷带止血并恢复健康';
      break;
    
    case 'minor_repair':
      description = 'Restore 5 durability to equipment';
      descriptionZh = '恢复装备5点耐久';
      break;
    
    case 'organize_inventory':
      description = 'Sort and organize inventory items';
      descriptionZh = '整理库存物品';
      break;
    
    case 'hunt':
      resourceChanges.push({ resourceId: 'food', amount: 3 });
      description = 'Hunt for food (~3 food)';
      descriptionZh = '狩猎获取食物（约3食物）';
      break;
    
    case 'salvage':
      description = 'Break down items for 20-40% material value';
      descriptionZh = '拆解物品获得20-40%材料价值';
      break;
    
    default:
      description = action.description;
      descriptionZh = action.descriptionZh;
  }
  
  if (resourceChanges.length > 0) {
    return {
      resourceChanges,
      description,
      descriptionZh,
    };
  }
  
  return {
    description,
    descriptionZh,
  };
}

/**
 * 获取行动预览
 * Requirements: 17.3 - 显示预期结果
 */
function getActionPreviewInternal(
  actionId: ActionId,
  context: ActionContext
): ActionPreview {
  const action = getActionById(actionId);
  
  if (!action) {
    return {
      action: {
        id: actionId,
        name: 'Unknown',
        nameZh: '未知',
        description: '',
        descriptionZh: '',
        type: 'standard',
        auCost: 0,
        allowedPhases: null,
        requirements: {},
        repeatable: false,
      },
      validation: {
        valid: false,
        reason: 'Action not found',
        reasonZh: '行动不存在',
      },
    };
  }
  
  const validation = validateActionInternal(actionId, context);
  
  // 生成预期结果描述
  const estimatedResults = generateEstimatedResults(action);
  
  return {
    action,
    validation,
    estimatedResults,
  };
}

// ============================================
// 行动执行函数
// Action Execution Functions
// ============================================

/**
 * 执行行动逻辑
 */
function executeActionLogic(
  actionId: ActionId,
  consumeResources: (changes: ResourceChange[]) => boolean,
  addResources: (changes: ResourceChange[]) => void
): ActionResult {
  const resourceChanges: ResourceChange[] = [];
  
  switch (actionId) {
    // ============================================
    // 短行动 (0.5 AU)
    // ============================================
    
    case 'organize_inventory':
      return {
        success: true,
        message: 'Inventory organized',
        messageZh: '库存已整理',
      };
    
    case 'quick_scavenge': {
      // 基础产出 2-4 废料
      const scrapAmount = 2 + Math.floor(Math.random() * 3);
      resourceChanges.push({ resourceId: 'scrap', amount: scrapAmount });
      
      // 10% 概率获得额外材料
      if (Math.random() < 0.1) {
        const materials: ResourceId[] = ['cloth', 'plastic', 'glass'];
        const material = materials[Math.floor(Math.random() * materials.length)]!;
        resourceChanges.push({ resourceId: material, amount: 1 });
      }
      
      addResources(resourceChanges.filter(c => c.amount > 0));
      
      return {
        success: true,
        message: `Gathered ${scrapAmount} scrap`,
        messageZh: `收集了 ${scrapAmount} 废料`,
        resourceChanges,
      };
    }
    
    case 'gather_wood': {
      // 基础产出 1-2 木材
      const woodAmount = 1 + Math.floor(Math.random() * 2);
      resourceChanges.push({ resourceId: 'wood', amount: woodAmount });
      
      // 20% 概率额外获得 1 废料
      if (Math.random() < 0.2) {
        resourceChanges.push({ resourceId: 'scrap', amount: 1 });
      }
      
      addResources(resourceChanges.filter(c => c.amount > 0));
      
      return {
        success: true,
        message: `Gathered ${woodAmount} wood`,
        messageZh: `收集了 ${woodAmount} 木材`,
        resourceChanges,
      };
    }
    
    case 'treat_wound':
      // 治疗逻辑由调用方处理（需要选择工人和物品）
      return {
        success: true,
        message: 'Wound treated',
        messageZh: '伤口已处理',
      };
    
    case 'quick_cook': {
      // 消耗 1 生肉，产出 1 食物（低效率）
      const consumed = consumeResources([{ resourceId: 'raw_meat', amount: -1 }]);
      if (!consumed) {
        return {
          success: false,
          message: 'Not enough raw meat',
          messageZh: '生肉不足',
        };
      }
      
      resourceChanges.push({ resourceId: 'raw_meat', amount: -1 });
      resourceChanges.push({ resourceId: 'food', amount: 1 });
      addResources([{ resourceId: 'food', amount: 1 }]);
      
      return {
        success: true,
        message: 'Cooked 1 food from raw meat',
        messageZh: '用生肉烹饪了1份食物',
        resourceChanges,
      };
    }
    
    case 'minor_repair':
      // 修理逻辑由调用方处理（需要选择装备）
      return {
        success: true,
        message: 'Equipment repaired (+5 durability)',
        messageZh: '装备已修理（+5耐久）',
      };
    
    case 'purify_small': {
      // 消耗 2 脏水，产出 1 净水
      const consumed = consumeResources([{ resourceId: 'dirty_water', amount: -2 }]);
      if (!consumed) {
        return {
          success: false,
          message: 'Not enough dirty water',
          messageZh: '脏水不足',
        };
      }
      
      resourceChanges.push({ resourceId: 'dirty_water', amount: -2 });
      resourceChanges.push({ resourceId: 'water', amount: 1 });
      addResources([{ resourceId: 'water', amount: 1 }]);
      
      return {
        success: true,
        message: 'Purified 1 water from dirty water',
        messageZh: '净化了1份净水',
        resourceChanges,
      };
    }
    
    // ============================================
    // 标准行动 (1 AU)
    // ============================================
    
    case 'salvage':
      // 拆解逻辑由调用方处理（需要选择物品）
      return {
        success: true,
        message: 'Item salvaged',
        messageZh: '物品已拆解',
      };
    
    case 'workshop_craft':
      // 制造逻辑由 craftingStore 处理
      return {
        success: true,
        message: 'Crafting in progress',
        messageZh: '制造进行中',
      };
    
    case 'batch_ammo':
      // 弹药制造逻辑由 craftingStore 处理
      return {
        success: true,
        message: 'Ammunition produced',
        messageZh: '弹药已生产',
      };
    
    case 'hunt': {
      // 狩猎产出 2-4 食物
      const foodAmount = 2 + Math.floor(Math.random() * 3);
      resourceChanges.push({ resourceId: 'food', amount: foodAmount });
      
      // 30% 概率获得生肉
      if (Math.random() < 0.3) {
        resourceChanges.push({ resourceId: 'raw_meat', amount: 1 });
      }
      
      addResources(resourceChanges.filter(c => c.amount > 0));
      
      return {
        success: true,
        message: `Hunted ${foodAmount} food`,
        messageZh: `狩猎获得 ${foodAmount} 食物`,
        resourceChanges,
      };
    }
    
    case 'explore':
      // 探索逻辑由 explorationStore 处理
      return {
        success: true,
        message: 'Exploration started',
        messageZh: '探索已开始',
      };
    
    case 'trade':
      // 贸易逻辑由 tradeStore 处理
      return {
        success: true,
        message: 'Trade completed',
        messageZh: '交易完成',
      };
    
    case 'research':
      // 研究逻辑由 techStore 处理
      return {
        success: true,
        message: 'Research in progress',
        messageZh: '研究进行中',
      };
    
    case 'build':
      // 建造逻辑由 buildingStore 处理
      return {
        success: true,
        message: 'Construction in progress',
        messageZh: '建造进行中',
      };
    
    case 'assign_workers':
      // 分配工人逻辑由 populationStore 处理
      return {
        success: true,
        message: 'Workers assigned',
        messageZh: '工人已分配',
      };
    
    default:
      return {
        success: false,
        message: 'Unknown action',
        messageZh: '未知行动',
      };
  }
}

/**
 * 执行短行动
 * Requirements: 17.1 - 0.5AU行动，仅清晨/中午可用
 */
function executeShortActionInternal(
  actionId: ShortActionId,
  context: ActionContext,
  consumeResources: (changes: ResourceChange[]) => boolean,
  addResources: (changes: ResourceChange[]) => void
): ActionResult {
  const action = SHORT_ACTIONS[actionId];
  
  if (!action) {
    return {
      success: false,
      message: 'Action not found',
      messageZh: '行动不存在',
    };
  }
  
  // 验证行动
  const validation = validateActionInternal(actionId, context);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.reason ?? 'Validation failed',
      messageZh: validation.reasonZh ?? '验证失败',
    };
  }
  
  // 执行具体行动逻辑
  return executeActionLogic(actionId, consumeResources, addResources);
}

/**
 * 执行标准行动
 * Requirements: 17.2 - 1AU行动，所有阶段可用
 */
function executeStandardActionInternal(
  actionId: StandardActionId,
  context: ActionContext,
  consumeResources: (changes: ResourceChange[]) => boolean,
  addResources: (changes: ResourceChange[]) => void
): ActionResult {
  const action = STANDARD_ACTIONS[actionId];
  
  if (!action) {
    return {
      success: false,
      message: 'Action not found',
      messageZh: '行动不存在',
    };
  }
  
  // 验证行动
  const validation = validateActionInternal(actionId, context);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.reason ?? 'Validation failed',
      messageZh: validation.reasonZh ?? '验证失败',
    };
  }
  
  // 执行具体行动逻辑
  return executeActionLogic(actionId, consumeResources, addResources);
}

// ============================================
// 行动Store接口
// Action Store Interface
// ============================================

interface ActionStore {
  // 状态
  /** 行动冷却记录 (actionId -> lastExecutedPhase) */
  actionCooldowns: Record<string, { day: number; phase: Phase }>;
  /** 当前阶段已执行的行动 */
  executedActionsThisPhase: ActionId[];
  /** 最近执行的行动结果 */
  lastActionResult: ActionResult | null;
  /** 当前阶段已消耗的AU */
  usedAUThisPhase: number;
  
  // 行动验证
  /** 验证行动是否可执行 */
  validateAction: (actionId: ActionId, context: ActionContext) => ActionValidationResult;
  /** 获取行动预览 */
  getActionPreview: (actionId: ActionId, context: ActionContext) => ActionPreview;
  /** 获取当前阶段可用的行动列表 */
  getAvailableActions: (context: ActionContext) => ActionDefinition[];
  
  // 行动执行
  /** 执行行动 */
  executeAction: (
    actionId: ActionId,
    context: ActionContext,
    consumeResources: (changes: ResourceChange[]) => boolean,
    addResources: (changes: ResourceChange[]) => void
  ) => ActionResult;
  
  // AU管理
  /** 获取当前阶段已消耗的AU */
  getUsedAU: () => number;
  /** 获取当前阶段剩余AU */
  getRemainingAU: (phaseAU: number) => number;
  /** 检查是否有足够的AU执行行动 */
  hasEnoughAU: (actionId: ActionId, phaseAU: number) => boolean;
  
  // 阶段管理
  /** 重置阶段行动记录（阶段结束时调用） */
  resetPhaseActions: () => void;
  
  // 冷却管理
  /** 检查行动是否在冷却中 */
  isActionOnCooldown: (actionId: ActionId, currentDay: number, currentPhase: Phase) => boolean;
  /** 设置行动冷却 */
  setActionCooldown: (actionId: ActionId, day: number, phase: Phase) => void;
  
  // 重置
  /** 重置行动状态 */
  resetActions: () => void;
}

/**
 * 行动状态Store
 */
export const useActionStore = create<ActionStore>((set, get) => ({
  // 初始状态
  actionCooldowns: {},
  executedActionsThisPhase: [],
  lastActionResult: null,
  usedAUThisPhase: 0,
  
  // ============================================
  // 行动验证
  // ============================================
  
  validateAction: (actionId: ActionId, context: ActionContext): ActionValidationResult => {
    return validateActionInternal(actionId, context);
  },
  
  getActionPreview: (actionId: ActionId, context: ActionContext): ActionPreview => {
    return getActionPreviewInternal(actionId, context);
  },
  
  getAvailableActions: (context: ActionContext): ActionDefinition[] => {
    const phaseActions = getAvailableActionsForPhase(context.phase);
    
    // 过滤掉不满足需求的行动
    return phaseActions.filter(action => {
      const validation = validateActionInternal(action.id, context);
      return validation.valid;
    });
  },
  
  // ============================================
  // 行动执行
  // ============================================
  
  executeAction: (
    actionId: ActionId,
    context: ActionContext,
    consumeResources: (changes: ResourceChange[]) => boolean,
    addResources: (changes: ResourceChange[]) => void
  ): ActionResult => {
    const state = get();
    const action = getActionById(actionId);
    
    if (!action) {
      const result: ActionResult = {
        success: false,
        message: 'Action not found',
        messageZh: '行动不存在',
      };
      set({ lastActionResult: result });
      return result;
    }
    
    // 检查AU是否足够
    const remainingAU = context.phaseAU - state.usedAUThisPhase;
    if (remainingAU < action.auCost) {
      const result: ActionResult = {
        success: false,
        message: `Not enough AU (need ${action.auCost}, have ${remainingAU.toFixed(1)})`,
        messageZh: `行动点不足（需要 ${action.auCost}，剩余 ${remainingAU.toFixed(1)}）`,
      };
      set({ lastActionResult: result });
      return result;
    }
    
    // 检查冷却
    if (state.isActionOnCooldown(actionId, context.day, context.phase)) {
      const result: ActionResult = {
        success: false,
        message: 'Action is on cooldown',
        messageZh: '行动正在冷却中',
      };
      set({ lastActionResult: result });
      return result;
    }
    
    // 执行行动
    let result: ActionResult;
    
    if (isShortAction(actionId)) {
      result = executeShortActionInternal(
        actionId as ShortActionId,
        context,
        consumeResources,
        addResources
      );
    } else if (isStandardAction(actionId)) {
      result = executeStandardActionInternal(
        actionId as StandardActionId,
        context,
        consumeResources,
        addResources
      );
    } else {
      result = {
        success: false,
        message: 'Unknown action type',
        messageZh: '未知行动类型',
      };
    }
    
    // 记录执行结果
    if (result.success) {
      // 消耗AU并记录已执行的行动
      set((s) => ({
        executedActionsThisPhase: [...s.executedActionsThisPhase, actionId],
        lastActionResult: result,
        usedAUThisPhase: s.usedAUThisPhase + action.auCost,
      }));
      
      // 设置冷却（如果有）
      if (action?.cooldownPhases) {
        state.setActionCooldown(actionId, context.day, context.phase);
      }
    } else {
      set({ lastActionResult: result });
    }
    
    return result;
  },
  
  // ============================================
  // AU管理
  // ============================================
  
  getUsedAU: (): number => {
    return get().usedAUThisPhase;
  },
  
  getRemainingAU: (phaseAU: number): number => {
    return Math.max(0, phaseAU - get().usedAUThisPhase);
  },
  
  hasEnoughAU: (actionId: ActionId, phaseAU: number): boolean => {
    const action = getActionById(actionId);
    if (!action) return false;
    
    const remainingAU = phaseAU - get().usedAUThisPhase;
    return remainingAU >= action.auCost;
  },
  
  // ============================================
  // 阶段管理
  // ============================================
  
  resetPhaseActions: (): void => {
    set({ executedActionsThisPhase: [], usedAUThisPhase: 0 });
  },
  
  // ============================================
  // 冷却管理
  // ============================================
  
  isActionOnCooldown: (actionId: ActionId, currentDay: number, currentPhase: Phase): boolean => {
    const state = get();
    const action = getActionById(actionId);
    
    if (!action?.cooldownPhases) return false;
    
    const cooldown = state.actionCooldowns[actionId];
    if (!cooldown) return false;
    
    // 简化的冷却检查：同一天同一阶段不能重复执行
    // 更复杂的冷却逻辑可以根据需要扩展
    return cooldown.day === currentDay && cooldown.phase === currentPhase;
  },
  
  setActionCooldown: (actionId: ActionId, day: number, phase: Phase): void => {
    set((s) => ({
      actionCooldowns: {
        ...s.actionCooldowns,
        [actionId]: { day, phase },
      },
    }));
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetActions: (): void => {
    set({
      actionCooldowns: {},
      executedActionsThisPhase: [],
      lastActionResult: null,
      usedAUThisPhase: 0,
    });
  },
}));

// ============================================
// 导出辅助函数
// Export Helper Functions
// ============================================

export {
  isShortActionPhaseCheck as isShortActionPhase,
  validateActionRequirementsInternal as validateActionRequirements,
  validateActionInternal as validateAction,
  getActionPreviewInternal as getActionPreview,
  executeShortActionInternal as executeShortAction,
  executeStandardActionInternal as executeStandardAction,
};

// 重新导出配置中的类型
export type {
  ActionId,
  ShortActionId,
  StandardActionId,
  ActionDefinition,
  ActionResult,
  ActionRequirements,
  ResourceChange,
};

// 重新导出配置中的常量和函数
export {
  ACTIONS,
  SHORT_ACTIONS,
  STANDARD_ACTIONS,
  SHORT_ACTION_PHASES,
  SHORT_ACTION_AU_COST,
  STANDARD_ACTION_AU_COST,
  getActionById,
  isShortAction,
  isStandardAction,
  canPerformActionInPhase,
  getAvailableActionsForPhase,
};
