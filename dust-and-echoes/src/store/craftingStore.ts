/**
 * 工坊与制造系统状态管理
 * Workshop & Crafting System State Management
 * 
 * Requirements: 5.5, 5.6
 */

import { create } from 'zustand';
import type { ResourceId, Recipe } from '../types';
import { RECIPES, getRecipeById } from '../config/recipes';
import { getResourceVU } from '../config/resources';

// ============================================
// 常量定义
// Constants
// ============================================

/** 工程师每AU产出Work点数 */
export const ENGINEER_WORK_PER_AU = 60;

/** Work价值 (1 Work = 0.25 VU) */
export const WORK_VU_VALUE = 0.25;

// ============================================
// 类型定义
// Type Definitions
// ============================================

/** 制造任务状态 */
export type CraftingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/** 制造任务 */
export interface CraftingTask {
  id: string;
  recipeId: string;
  quantity: number;
  workRequired: number;
  workProgress: number;
  status: CraftingTaskStatus;
  createdAt: number; // timestamp
}

/** 制造结果 */
export interface CraftingResult {
  success: boolean;
  reason?: string;
  outputResourceId?: ResourceId;
  outputAmount?: number;
  workConsumed?: number;
}

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 生成唯一任务ID
 */
export function generateTaskId(): string {
  return `craft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 计算工坊效率倍率
 * Requirements: 5.6 - Work_rate = Engineers × 1 × (1 + 0.20 × (L-1))
 * @param workshopLevel 工坊等级
 * @returns 效率倍率
 */
export function calculateWorkshopEfficiencyMultiplier(workshopLevel: number): number {
  if (workshopLevel <= 0) return 0;
  return 1 + 0.20 * (workshopLevel - 1);
}

/**
 * 计算工程师Work产出
 * @param engineerCount 工程师数量
 * @param workshopLevel 工坊等级
 * @param phaseAU 阶段AU值
 * @returns Work点数
 */
export function calculateWorkOutput(
  engineerCount: number,
  workshopLevel: number,
  phaseAU: number
): number {
  const efficiency = calculateWorkshopEfficiencyMultiplier(workshopLevel);
  return engineerCount * ENGINEER_WORK_PER_AU * efficiency * phaseAU;
}

/**
 * 检查是否有足够资源进行制造
 */
export function hasEnoughResourcesForRecipe(
  recipe: Recipe,
  quantity: number,
  resources: Record<ResourceId, number>
): { hasEnough: boolean; missing: { resourceId: ResourceId; required: number; available: number }[] } {
  const missing: { resourceId: ResourceId; required: number; available: number }[] = [];
  
  for (const input of recipe.inputs) {
    const required = input.amount * quantity;
    const available = resources[input.resourceId] ?? 0;
    
    if (available < required) {
      missing.push({
        resourceId: input.resourceId,
        required,
        available,
      });
    }
  }
  
  return {
    hasEnough: missing.length === 0,
    missing,
  };
}

/**
 * 计算配方总Work需求
 */
export function calculateTotalWorkRequired(recipe: Recipe, quantity: number): number {
  return recipe.workRequired * quantity;
}

// ============================================
// 制造Store接口
// Crafting Store Interface
// ============================================

interface CraftingStore {
  // 状态
  currentTask: CraftingTask | null;
  taskHistory: CraftingTask[];
  accumulatedWork: number; // 累积的Work点数
  
  // 任务管理
  /** 创建制造任务 */
  createTask: (recipeId: string, quantity: number) => CraftingTask | null;
  /** 取消当前任务 */
  cancelTask: () => boolean;
  /** 获取当前任务 */
  getCurrentTask: () => CraftingTask | null;
  /** 获取任务历史 */
  getTaskHistory: () => CraftingTask[];
  /** 清除任务历史 */
  clearTaskHistory: () => void;
  
  // Work管理
  /** 添加Work点数 */
  addWork: (amount: number) => void;
  /** 获取累积Work */
  getAccumulatedWork: () => number;
  /** 消耗Work点数（用于制造进度） */
  consumeWork: (amount: number) => number;
  
  // 制造进度
  /** 推进制造进度 */
  advanceCraftingProgress: (workAvailable: number) => {
    workUsed: number;
    completed: boolean;
    task: CraftingTask | null;
  };
  
  // 即时制造（消耗材料和Work，立即产出）
  /** 执行即时制造 */
  craftImmediate: (
    recipeId: string,
    quantity: number,
    resources: Record<ResourceId, number>,
    workshopLevel: number,
    consumeResources: (inputs: { resourceId: ResourceId; amount: number }[]) => boolean,
    addResource: (resourceId: ResourceId, amount: number) => number
  ) => CraftingResult;
  
  // 查询
  /** 检查是否可以制造 */
  canCraft: (
    recipeId: string,
    quantity: number,
    resources: Record<ResourceId, number>,
    workshopLevel: number
  ) => { canCraft: boolean; reason?: string };
  
  /** 获取可用配方列表 */
  getAvailableRecipes: (workshopLevel: number, unlockedRecipes?: string[]) => Recipe[];
  
  /** 计算配方成本 */
  getRecipeCost: (recipeId: string, quantity: number) => {
    materials: { resourceId: ResourceId; amount: number }[];
    workRequired: number;
    totalVU: number;
  } | null;
  
  // 重置
  /** 重置制造状态 */
  resetCrafting: () => void;
}

/**
 * 制造状态Store
 */
export const useCraftingStore = create<CraftingStore>((set, get) => ({
  // 初始状态
  currentTask: null,
  taskHistory: [],
  accumulatedWork: 0,
  
  // ============================================
  // 任务管理
  // ============================================
  
  createTask: (recipeId: string, quantity: number): CraftingTask | null => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return null;
    }
    
    if (quantity <= 0) {
      return null;
    }
    
    // 如果已有进行中的任务，不能创建新任务
    const currentTask = get().currentTask;
    if (currentTask && currentTask.status === 'in_progress') {
      return null;
    }
    
    const task: CraftingTask = {
      id: generateTaskId(),
      recipeId,
      quantity,
      workRequired: calculateTotalWorkRequired(recipe, quantity),
      workProgress: 0,
      status: 'pending',
      createdAt: Date.now(),
    };
    
    set({ currentTask: task });
    return task;
  },
  
  cancelTask: (): boolean => {
    const currentTask = get().currentTask;
    if (!currentTask) {
      return false;
    }
    
    const cancelledTask: CraftingTask = {
      ...currentTask,
      status: 'cancelled',
    };
    
    set((state) => ({
      currentTask: null,
      taskHistory: [...state.taskHistory, cancelledTask],
    }));
    
    return true;
  },
  
  getCurrentTask: (): CraftingTask | null => {
    return get().currentTask;
  },
  
  getTaskHistory: (): CraftingTask[] => {
    return get().taskHistory;
  },
  
  clearTaskHistory: (): void => {
    set({ taskHistory: [] });
  },
  
  // ============================================
  // Work管理
  // ============================================
  
  addWork: (amount: number): void => {
    if (amount <= 0) return;
    set((state) => ({
      accumulatedWork: state.accumulatedWork + amount,
    }));
  },
  
  getAccumulatedWork: (): number => {
    return get().accumulatedWork;
  },
  
  consumeWork: (amount: number): number => {
    const state = get();
    const consumed = Math.min(amount, state.accumulatedWork);
    set({ accumulatedWork: state.accumulatedWork - consumed });
    return consumed;
  },
  
  // ============================================
  // 制造进度
  // ============================================
  
  advanceCraftingProgress: (workAvailable: number) => {
    const state = get();
    const task = state.currentTask;
    
    if (!task || task.status === 'completed' || task.status === 'cancelled') {
      return { workUsed: 0, completed: false, task: null };
    }
    
    const workNeeded = task.workRequired - task.workProgress;
    const workUsed = Math.min(workAvailable, workNeeded);
    const newProgress = task.workProgress + workUsed;
    const completed = newProgress >= task.workRequired;
    
    const updatedTask: CraftingTask = {
      ...task,
      workProgress: newProgress,
      status: completed ? 'completed' : 'in_progress',
    };
    
    if (completed) {
      set((state) => ({
        currentTask: null,
        taskHistory: [...state.taskHistory, updatedTask],
      }));
    } else {
      set({ currentTask: updatedTask });
    }
    
    return { workUsed, completed, task: updatedTask };
  },
  
  // ============================================
  // 即时制造
  // ============================================
  
  craftImmediate: (
    recipeId: string,
    quantity: number,
    resources: Record<ResourceId, number>,
    workshopLevel: number,
    consumeResources: (inputs: { resourceId: ResourceId; amount: number }[]) => boolean,
    addResource: (resourceId: ResourceId, amount: number) => number
  ): CraftingResult => {
    // 检查是否可以制造
    const canCraftResult = get().canCraft(recipeId, quantity, resources, workshopLevel);
    if (!canCraftResult.canCraft) {
      return { success: false, reason: canCraftResult.reason ?? '未知错误' };
    }
    
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return { success: false, reason: '配方不存在' };
    }
    
    // 计算所需材料
    const materialsNeeded = recipe.inputs.map(input => ({
      resourceId: input.resourceId,
      amount: input.amount * quantity,
    }));
    
    // 消耗材料
    const consumed = consumeResources(materialsNeeded);
    if (!consumed) {
      return { success: false, reason: '材料消耗失败' };
    }
    
    // 计算Work消耗
    const workRequired = calculateTotalWorkRequired(recipe, quantity);
    
    // 从累积Work中消耗
    const workConsumed = get().consumeWork(workRequired);
    
    // 产出资源
    const outputAmount = recipe.output.amount * quantity;
    const actualAdded = addResource(recipe.output.resourceId, outputAmount);
    
    return {
      success: true,
      outputResourceId: recipe.output.resourceId,
      outputAmount: actualAdded,
      workConsumed,
    };
  },
  
  // ============================================
  // 查询
  // ============================================
  
  canCraft: (
    recipeId: string,
    quantity: number,
    resources: Record<ResourceId, number>,
    workshopLevel: number
  ) => {
    // 检查工坊等级
    if (workshopLevel <= 0) {
      return { canCraft: false, reason: '需要建造工坊' };
    }
    
    // 检查配方是否存在
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return { canCraft: false, reason: '配方不存在' };
    }
    
    // 检查数量
    if (quantity <= 0) {
      return { canCraft: false, reason: '数量必须大于0' };
    }
    
    // 检查材料是否足够
    const resourceCheck = hasEnoughResourcesForRecipe(recipe, quantity, resources);
    if (!resourceCheck.hasEnough) {
      const missingStr = resourceCheck.missing
        .map(m => `${m.resourceId}: 需要${m.required}, 拥有${m.available}`)
        .join(', ');
      return { canCraft: false, reason: `材料不足: ${missingStr}` };
    }
    
    // 检查Work是否足够
    const workRequired = calculateTotalWorkRequired(recipe, quantity);
    const accumulatedWork = get().accumulatedWork;
    if (accumulatedWork < workRequired) {
      return { 
        canCraft: false, 
        reason: `Work不足: 需要${workRequired}, 拥有${accumulatedWork.toFixed(1)}` 
      };
    }
    
    return { canCraft: true };
  },
  
  getAvailableRecipes: (workshopLevel: number, unlockedRecipes?: string[]): Recipe[] => {
    if (workshopLevel <= 0) {
      return [];
    }
    
    return RECIPES.filter(recipe => {
      // 如果配方需要特定建筑解锁
      if (recipe.unlockBuilding) {
        // 这里简化处理，假设工坊解锁所有基础配方
        // 实际应该检查具体建筑
      }
      
      // 如果配方需要科技解锁
      if (recipe.unlockTech && unlockedRecipes) {
        if (!unlockedRecipes.includes(recipe.id)) {
          return false;
        }
      }
      
      return true;
    });
  },
  
  getRecipeCost: (recipeId: string, quantity: number) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      return null;
    }
    
    const materials = recipe.inputs.map(input => ({
      resourceId: input.resourceId,
      amount: input.amount * quantity,
    }));
    
    const workRequired = calculateTotalWorkRequired(recipe, quantity);
    
    // 计算总VU成本
    let totalVU = 0;
    for (const material of materials) {
      totalVU += getResourceVU(material.resourceId) * material.amount;
    }
    totalVU += workRequired * WORK_VU_VALUE;
    
    return {
      materials,
      workRequired,
      totalVU,
    };
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetCrafting: (): void => {
    set({
      currentTask: null,
      taskHistory: [],
      accumulatedWork: 0,
    });
  },
}));
