/**
 * 医疗与状态系统状态管理
 * Medical and Status System State Management
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4
 */

import { create } from 'zustand';
import type { 
  StatusEffectType, 
  StatusSeverity, 
  StatusEffect,
  Worker 
} from '../types';
import { 
  MEDICAL_ITEMS, 
  STATUS_HEALTH_DAMAGE,
  POISONED_EFFICIENCY_PENALTY,
  canClearStatus,
  type MedicalItemId 
} from '../config/medical';

// ============================================
// 常量定义
// Constants
// ============================================

/** 低健康效率惩罚阈值 */
export const LOW_HEALTH_THRESHOLD = 50;

/** 低健康效率惩罚 */
export const LOW_HEALTH_EFFICIENCY_PENALTY = 0.3; // 30%

/** 无法工作的健康阈值 */
export const CANNOT_WORK_HEALTH_THRESHOLD = 20;

/** 死亡健康阈值 */
export const DEATH_HEALTH_THRESHOLD = 0;

/** 士气范围 */
export const MORALE_MIN = -5;
export const MORALE_MAX = 5;

/** 士气影响招募的阈值 */
export const MORALE_DESERTION_THRESHOLD = -3;
export const MORALE_BONUS_THRESHOLD = 3;

/** 士气效率加成 (每点士气) */
export const MORALE_EFFICIENCY_BONUS_PER_POINT = 0.02; // 2% per morale point above threshold

/** 士气招募加成 (每点士气) */
export const MORALE_RECRUITMENT_BONUS_PER_POINT = 0.05; // 5% per morale point

// ============================================
// 临时效果类型
// Temporary Effect Types
// ============================================

/** 临时效果 */
export interface TemporaryEffect {
  id: string;
  type: 'efficiency_boost' | 'damage_reduction' | 'immunity' | 'side_effect';
  value: number;
  remainingAU: number;
  sourceItemId?: MedicalItemId;
}

// ============================================
// 状态效果处理结果
// Status Effect Processing Result
// ============================================

/** 状态效果处理结果 */
export interface StatusProcessingResult {
  workerId: string;
  workerName: string;
  healthChange: number;
  newHealth: number;
  died: boolean;
  statusesProcessed: StatusEffectType[];
}

/** 医疗物品使用结果 */
export interface MedicalItemUseResult {
  success: boolean;
  message: string;
  messageZh: string;
  healthRestored?: number;
  statusesCleared?: StatusEffectType[];
  moraleChange?: number;
  temporaryEffects?: TemporaryEffect[];
}

// ============================================
// 医疗Store接口
// Medical Store Interface
// ============================================

interface MedicalStore {
  // 临时效果状态 (workerId -> effects)
  temporaryEffects: Record<string, TemporaryEffect[]>;
  
  // 士气
  morale: number;
  
  // ============================================
  // 状态效果处理
  // Status Effect Processing
  // ============================================
  
  /**
   * 处理单个工人的状态效果（每AU结算）
   * Requirements: 13.2
   */
  processWorkerStatusEffects: (
    worker: Worker,
    phaseAU: number
  ) => { healthChange: number; newHealth: number; died: boolean };
  
  /**
   * 计算状态效果造成的总健康损失
   */
  calculateStatusDamage: (statuses: StatusEffect[], phaseAU: number) => number;
  
  /**
   * 检查工人是否有指定状态效果
   */
  hasStatus: (worker: Worker, statusType: StatusEffectType) => boolean;
  
  /**
   * 获取工人的状态效果严重程度
   */
  getStatusSeverity: (worker: Worker, statusType: StatusEffectType) => StatusSeverity | null;
  
  // ============================================
  // 医疗物品使用
  // Medical Item Usage
  // Requirements: 13.3
  // ============================================
  
  /**
   * 使用医疗物品
   */
  useMedicalItem: (
    itemId: MedicalItemId,
    worker: Worker,
    updateWorkerFn: (workerId: string, updates: Partial<Worker>) => void
  ) => MedicalItemUseResult;
  
  /**
   * 检查医疗物品是否可以对工人使用
   */
  canUseMedicalItem: (itemId: MedicalItemId, worker: Worker) => { canUse: boolean; reason?: string };
  
  /**
   * 获取推荐的医疗物品
   */
  getRecommendedMedicalItems: (worker: Worker) => MedicalItemId[];
  
  // ============================================
  // 临时效果管理
  // Temporary Effect Management
  // ============================================
  
  /**
   * 添加临时效果
   */
  addTemporaryEffect: (workerId: string, effect: TemporaryEffect) => void;
  
  /**
   * 处理临时效果（每AU结算）
   */
  processTemporaryEffects: (
    phaseAU: number,
    applyHealthChangeFn: (workerId: string, delta: number) => void
  ) => void;
  
  /**
   * 获取工人的临时效果
   */
  getWorkerTemporaryEffects: (workerId: string) => TemporaryEffect[];
  
  /**
   * 获取工人的效率加成（来自临时效果）
   */
  getWorkerEfficiencyBoost: (workerId: string) => number;
  
  /**
   * 获取工人的伤害减免（来自临时效果）
   */
  getWorkerDamageReduction: (workerId: string) => number;
  
  /**
   * 检查工人是否有免疫效果
   */
  hasImmunity: (workerId: string) => boolean;
  
  // ============================================
  // 士气系统
  // Morale System
  // Requirements: 13.4
  // ============================================
  
  /**
   * 设置士气
   */
  setMorale: (morale: number) => void;
  
  /**
   * 修改士气
   */
  modifyMorale: (delta: number) => void;
  
  /**
   * 获取士气对招募的影响
   */
  getMoraleRecruitmentModifier: () => number;
  
  /**
   * 获取士气对效率的影响
   */
  getMoraleEfficiencyModifier: () => number;
  
  /**
   * 检查是否有逃兵风险
   */
  hasDesertionRisk: () => boolean;
  
  /**
   * 检查是否有招募加成
   */
  hasRecruitmentBonus: () => boolean;
  
  // ============================================
  // 效率计算
  // Efficiency Calculation
  // ============================================
  
  /**
   * 计算工人总效率（考虑健康、状态、士气、临时效果）
   * Requirements: 13.1, 13.2, 13.4
   */
  calculateWorkerEfficiency: (worker: Worker) => number;
  
  /**
   * 检查工人是否可以工作
   * Requirements: 13.1
   */
  canWorkerWork: (worker: Worker) => boolean;
  
  // ============================================
  // 重置
  // Reset
  // ============================================
  
  /**
   * 重置医疗状态
   */
  resetMedical: () => void;
}

/**
 * 医疗状态Store
 */
export const useMedicalStore = create<MedicalStore>((set, get) => ({
  // 初始状态
  temporaryEffects: {},
  morale: 0,
  
  // ============================================
  // 状态效果处理
  // ============================================
  
  processWorkerStatusEffects: (worker: Worker, phaseAU: number) => {
    const state = get();
    
    // 检查是否有免疫效果
    if (state.hasImmunity(worker.id)) {
      return { healthChange: 0, newHealth: worker.health, died: false };
    }
    
    // 计算状态效果伤害
    let totalDamage = state.calculateStatusDamage(worker.statuses, phaseAU);
    
    // 应用伤害减免
    const damageReduction = state.getWorkerDamageReduction(worker.id);
    if (damageReduction > 0) {
      totalDamage = totalDamage * (1 - damageReduction / 100);
    }
    
    const healthChange = -Math.round(totalDamage);
    const newHealth = Math.max(0, Math.min(100, worker.health + healthChange));
    const died = newHealth === 0 && worker.health > 0;
    
    return { healthChange, newHealth, died };
  },
  
  calculateStatusDamage: (statuses: StatusEffect[], phaseAU: number): number => {
    let totalDamage = 0;
    for (const status of statuses) {
      const baseDamage = STATUS_HEALTH_DAMAGE[status.type];
      totalDamage += baseDamage * phaseAU;
    }
    return totalDamage;
  },
  
  hasStatus: (worker: Worker, statusType: StatusEffectType): boolean => {
    return worker.statuses.some(s => s.type === statusType);
  },
  
  getStatusSeverity: (worker: Worker, statusType: StatusEffectType): StatusSeverity | null => {
    const status = worker.statuses.find(s => s.type === statusType);
    return status?.severity ?? null;
  },
  
  // ============================================
  // 医疗物品使用
  // ============================================
  
  useMedicalItem: (
    itemId: MedicalItemId,
    worker: Worker,
    updateWorkerFn: (workerId: string, updates: Partial<Worker>) => void
  ): MedicalItemUseResult => {
    const state = get();
    const config = MEDICAL_ITEMS[itemId];
    
    if (!config) {
      return {
        success: false,
        message: `Unknown medical item: ${itemId}`,
        messageZh: `未知医疗物品: ${itemId}`,
      };
    }
    
    const canUseResult = state.canUseMedicalItem(itemId, worker);
    if (!canUseResult.canUse) {
      return {
        success: false,
        message: canUseResult.reason || 'Cannot use item',
        messageZh: canUseResult.reason || '无法使用物品',
      };
    }
    
    const result: MedicalItemUseResult = {
      success: true,
      message: `Used ${config.name} on ${worker.name}`,
      messageZh: `对${worker.name}使用了${config.nameZh}`,
    };
    
    const updates: Partial<Worker> = {};
    const { effects } = config;
    
    // 恢复健康值
    if (effects.healthRestore) {
      const newHealth = Math.min(100, worker.health + effects.healthRestore);
      updates.health = newHealth;
      result.healthRestored = effects.healthRestore;
    }
    
    // 清除状态效果
    if (effects.clearsStatus && effects.clearsSeverity) {
      const clearedStatuses: StatusEffectType[] = [];
      const newStatuses = worker.statuses.filter(status => {
        if (canClearStatus(itemId, status.type, status.severity)) {
          clearedStatuses.push(status.type);
          return false;
        }
        return true;
      });
      
      if (clearedStatuses.length > 0) {
        updates.statuses = newStatuses;
        result.statusesCleared = clearedStatuses;
      }
    }
    
    // 应用更新
    if (Object.keys(updates).length > 0) {
      updateWorkerFn(worker.id, updates);
    }
    
    // 士气变化
    if (effects.moraleChange) {
      state.modifyMorale(effects.moraleChange);
      result.moraleChange = effects.moraleChange;
    }
    
    // 添加临时效果
    const temporaryEffects: TemporaryEffect[] = [];
    
    if (effects.efficiencyBoost && effects.efficiencyDuration) {
      const effect: TemporaryEffect = {
        id: `eff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'efficiency_boost',
        value: effects.efficiencyBoost,
        remainingAU: effects.efficiencyDuration,
        sourceItemId: itemId,
      };
      state.addTemporaryEffect(worker.id, effect);
      temporaryEffects.push(effect);
    }
    
    if (effects.damageReduction && effects.damageDuration) {
      const effect: TemporaryEffect = {
        id: `dmg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'damage_reduction',
        value: effects.damageReduction,
        remainingAU: effects.damageDuration,
        sourceItemId: itemId,
      };
      state.addTemporaryEffect(worker.id, effect);
      temporaryEffects.push(effect);
    }
    
    if (effects.immunity) {
      const effect: TemporaryEffect = {
        id: `imm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'immunity',
        value: 1,
        remainingAU: effects.immunity,
        sourceItemId: itemId,
      };
      state.addTemporaryEffect(worker.id, effect);
      temporaryEffects.push(effect);
    }
    
    if (effects.sideEffectHealthLoss && effects.sideEffectDelay) {
      const effect: TemporaryEffect = {
        id: `side_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'side_effect',
        value: effects.sideEffectHealthLoss,
        remainingAU: effects.sideEffectDelay,
        sourceItemId: itemId,
      };
      state.addTemporaryEffect(worker.id, effect);
      temporaryEffects.push(effect);
    }
    
    if (temporaryEffects.length > 0) {
      result.temporaryEffects = temporaryEffects;
    }
    
    return result;
  },
  
  canUseMedicalItem: (itemId: MedicalItemId, worker: Worker): { canUse: boolean; reason?: string } => {
    const config = MEDICAL_ITEMS[itemId];
    if (!config) {
      return { canUse: false, reason: 'Unknown item' };
    }
    
    // 死亡的工人无法使用医疗物品
    if (worker.health <= 0) {
      return { canUse: false, reason: 'Worker is dead' };
    }
    
    const { effects } = config;
    
    // 检查是否有可清除的状态
    if (effects.clearsStatus && effects.clearsSeverity) {
      const hasMatchingStatus = worker.statuses.some(status => 
        canClearStatus(itemId, status.type, status.severity)
      );
      
      // 如果物品主要用于清除状态，但没有匹配的状态
      if (!effects.healthRestore && !hasMatchingStatus) {
        return { canUse: false, reason: 'No matching status to clear' };
      }
    }
    
    // 如果只恢复健康，检查是否已满血
    if (effects.healthRestore && !effects.clearsStatus && worker.health >= 100) {
      return { canUse: false, reason: 'Health is already full' };
    }
    
    return { canUse: true };
  },
  
  getRecommendedMedicalItems: (worker: Worker): MedicalItemId[] => {
    const recommendations: MedicalItemId[] = [];
    const state = get();
    
    // 检查流血 - 推荐绷带
    if (state.hasStatus(worker, 'bleed')) {
      recommendations.push('bandage');
    }
    
    // 检查感染
    if (state.hasStatus(worker, 'infection')) {
      const severity = state.getStatusSeverity(worker, 'infection');
      if (severity === 'light') {
        recommendations.push('antiseptic');
      } else if (severity === 'medium') {
        recommendations.push('medkit');
      } else if (severity === 'severe') {
        recommendations.push('meds');
      }
    }
    
    // 检查中毒或辐射
    if (state.hasStatus(worker, 'poisoned') || state.hasStatus(worker, 'radiation')) {
      const radiationSeverity = state.getStatusSeverity(worker, 'radiation');
      if (!radiationSeverity || radiationSeverity === 'light') {
        recommendations.push('antitoxin');
      }
    }
    
    // 低健康值 - 推荐医疗包或药品
    if (worker.health < 50 && !recommendations.includes('medkit') && !recommendations.includes('meds')) {
      if (worker.health < 30) {
        recommendations.push('meds');
      } else {
        recommendations.push('medkit');
      }
    }
    
    return recommendations;
  },
  
  // ============================================
  // 临时效果管理
  // ============================================
  
  addTemporaryEffect: (workerId: string, effect: TemporaryEffect): void => {
    set((state) => ({
      temporaryEffects: {
        ...state.temporaryEffects,
        [workerId]: [...(state.temporaryEffects[workerId] || []), effect],
      },
    }));
  },
  
  processTemporaryEffects: (
    phaseAU: number,
    applyHealthChangeFn: (workerId: string, delta: number) => void
  ): void => {
    set((state) => {
      const newTemporaryEffects: Record<string, TemporaryEffect[]> = {};
      
      for (const [workerId, effects] of Object.entries(state.temporaryEffects)) {
        const remainingEffects: TemporaryEffect[] = [];
        
        for (const effect of effects) {
          const newRemainingAU = effect.remainingAU - phaseAU;
          
          if (newRemainingAU <= 0) {
            // 效果结束
            if (effect.type === 'side_effect') {
              // 应用副作用
              applyHealthChangeFn(workerId, -effect.value);
            }
            // 效果移除，不添加到remainingEffects
          } else {
            // 效果继续
            remainingEffects.push({
              ...effect,
              remainingAU: newRemainingAU,
            });
          }
        }
        
        if (remainingEffects.length > 0) {
          newTemporaryEffects[workerId] = remainingEffects;
        }
      }
      
      return { temporaryEffects: newTemporaryEffects };
    });
  },
  
  getWorkerTemporaryEffects: (workerId: string): TemporaryEffect[] => {
    return get().temporaryEffects[workerId] || [];
  },
  
  getWorkerEfficiencyBoost: (workerId: string): number => {
    const effects = get().temporaryEffects[workerId] || [];
    return effects
      .filter(e => e.type === 'efficiency_boost')
      .reduce((sum, e) => sum + e.value, 0);
  },
  
  getWorkerDamageReduction: (workerId: string): number => {
    const effects = get().temporaryEffects[workerId] || [];
    return effects
      .filter(e => e.type === 'damage_reduction')
      .reduce((sum, e) => sum + e.value, 0);
  },
  
  hasImmunity: (workerId: string): boolean => {
    const effects = get().temporaryEffects[workerId] || [];
    return effects.some(e => e.type === 'immunity');
  },
  
  // ============================================
  // 士气系统
  // ============================================
  
  setMorale: (morale: number): void => {
    set({ morale: Math.max(MORALE_MIN, Math.min(MORALE_MAX, morale)) });
  },
  
  modifyMorale: (delta: number): void => {
    set((state) => ({
      morale: Math.max(MORALE_MIN, Math.min(MORALE_MAX, state.morale + delta)),
    }));
  },
  
  getMoraleRecruitmentModifier: (): number => {
    const { morale } = get();
    // 每点士气影响5%招募率
    return morale * MORALE_RECRUITMENT_BONUS_PER_POINT;
  },
  
  getMoraleEfficiencyModifier: (): number => {
    const { morale } = get();
    // 只有士气高于阈值时才有效率加成
    if (morale > MORALE_BONUS_THRESHOLD) {
      return (morale - MORALE_BONUS_THRESHOLD) * MORALE_EFFICIENCY_BONUS_PER_POINT;
    }
    return 0;
  },
  
  hasDesertionRisk: (): boolean => {
    return get().morale < MORALE_DESERTION_THRESHOLD;
  },
  
  hasRecruitmentBonus: (): boolean => {
    return get().morale > MORALE_BONUS_THRESHOLD;
  },
  
  // ============================================
  // 效率计算
  // ============================================
  
  calculateWorkerEfficiency: (worker: Worker): number => {
    const state = get();
    
    // 基础效率
    let efficiency = 1.0;
    
    // 检查是否可以工作
    if (!state.canWorkerWork(worker)) {
      return 0;
    }
    
    // 低健康惩罚 (Requirements: 13.1)
    if (worker.health < LOW_HEALTH_THRESHOLD) {
      efficiency *= (1 - LOW_HEALTH_EFFICIENCY_PENALTY);
    }
    
    // 中毒效率惩罚 (Requirements: 13.2)
    if (state.hasStatus(worker, 'poisoned')) {
      efficiency *= (1 - POISONED_EFFICIENCY_PENALTY);
    }
    
    // 临时效率加成
    const efficiencyBoost = state.getWorkerEfficiencyBoost(worker.id);
    if (efficiencyBoost > 0) {
      efficiency *= (1 + efficiencyBoost / 100);
    }
    
    // 士气效率加成 (Requirements: 13.4)
    const moraleBonus = state.getMoraleEfficiencyModifier();
    if (moraleBonus > 0) {
      efficiency *= (1 + moraleBonus);
    }
    
    return efficiency;
  },
  
  canWorkerWork: (worker: Worker): boolean => {
    // 死亡无法工作
    if (worker.health <= DEATH_HEALTH_THRESHOLD) {
      return false;
    }
    
    // 健康值过低无法工作 (Requirements: 13.1)
    if (worker.health < CANNOT_WORK_HEALTH_THRESHOLD) {
      return false;
    }
    
    // 流血状态无法工作 (Requirements: 3.7)
    if (worker.statuses.some(s => s.type === 'bleed')) {
      return false;
    }
    
    return true;
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetMedical: (): void => {
    set({
      temporaryEffects: {},
      morale: 0,
    });
  },
}));
