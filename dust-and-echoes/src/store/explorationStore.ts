/**
 * 探索系统状态管理
 * Exploration System State Management
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 18.1, 18.2
 */

import { create } from 'zustand';
import type { 
  MapNode, 
  MapNodeState,
  Expedition, 
  Outpost,
  Phase,
  ResourceId,
  RegionTier,
} from '../types';
import { PHASE_AU } from '../types';
import {
  DEFAULT_MAP_NODES,
  calculateTotalTravelTime,
  calculateExplorationSupplies,
  generateLoot,
  getMaxExplorationDistance,
  getExplorableNodes,
  EXPLORATION_WATER_PER_EXPLORER_PER_AU,
  EXPLORATION_FOOD_PER_EXPLORER_PER_AU,
} from '../config/exploration';

// ============================================
// 探索状态类型
// Exploration State Types
// ============================================

/** 探索结果 */
export interface ExplorationResult {
  success: boolean;
  nodeId: string;
  loot: { resourceId: ResourceId; amount: number }[];
  events: string[];
  casualties: string[]; // 伤亡工人ID
  healthChanges: { workerId: string; change: number }[];
}

/** 探索预览 */
export interface ExplorationPreview {
  nodeId: string;
  nodeName: string;
  tier: RegionTier;
  distance: number;
  totalTime: number;
  suppliesNeeded: { water: number; food: number };
  riskCoefficient: number;
  expectedLootValue: number;
}

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 生成探险队ID
 */
export function generateExpeditionId(): string {
  return `expedition_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 计算探索预览信息
 */
export function calculateExplorationPreview(
  node: MapNode,
  explorerCount: number
): ExplorationPreview {
  const totalTime = calculateTotalTravelTime(node.distance);
  const supplies = calculateExplorationSupplies(explorerCount, totalTime);
  
  // 计算期望战利品价值
  const baseValue = getBaseValueForTier(node.tier);
  const expectedLootValue = baseValue * (1 + node.riskCoefficient);
  
  return {
    nodeId: node.id,
    nodeName: node.nameZh,
    tier: node.tier,
    distance: node.distance,
    totalTime,
    suppliesNeeded: supplies,
    riskCoefficient: node.riskCoefficient,
    expectedLootValue,
  };
}

/**
 * 获取区域层级基础价值
 */
function getBaseValueForTier(tier: RegionTier): number {
  const values: Record<RegionTier, number> = {
    T0: 0,
    T1: 20,
    T2: 50,
    T3: 100,
    T4: 200,
    T5: 500,
  };
  return values[tier];
}

/**
 * 计算从当前时间到返回所需的AU数
 */
export function calculateRemainingAU(
  startDay: number,
  startPhase: Phase,
  currentDay: number,
  currentPhase: Phase,
  totalTime: number
): number {
  // 计算已经过去的AU
  const phaseOrder: Phase[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'];
  
  let elapsedAU = 0;
  
  // 计算天数差异
  const dayDiff = currentDay - startDay;
  elapsedAU += dayDiff * 5; // 每天5 AU
  
  // 计算阶段差异
  const startPhaseIndex = phaseOrder.indexOf(startPhase);
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
  
  for (let i = startPhaseIndex; i < currentPhaseIndex; i++) {
    const phase = phaseOrder[i];
    if (phase) {
      elapsedAU += PHASE_AU[phase];
    }
  }
  
  return Math.max(0, totalTime - elapsedAU);
}

// ============================================
// 探索Store接口
// Exploration Store Interface
// ============================================

interface ExplorationStore {
  // 状态
  mapNodes: MapNode[];
  activeExpedition: Expedition | null;
  outposts: Outpost[];
  radioTowerLevel: number;
  
  // 地图节点操作
  /** 获取所有地图节点 */
  getAllNodes: () => MapNode[];
  /** 获取节点 */
  getNode: (nodeId: string) => MapNode | undefined;
  /** 更新节点状态 */
  updateNodeState: (nodeId: string, state: MapNodeState) => void;
  /** 发现节点 */
  discoverNode: (nodeId: string) => void;
  /** 获取已发现的节点 */
  getDiscoveredNodes: () => MapNode[];
  /** 获取可探索的节点 */
  getExplorableNodes: () => MapNode[];
  
  // 探索操作
  /** 计算探索预览 */
  getExplorationPreview: (nodeId: string, explorerCount: number) => ExplorationPreview | null;
  /** 开始探索 */
  startExpedition: (
    nodeId: string,
    workerIds: string[],
    currentDay: number,
    currentPhase: Phase,
    supplies: { water: number; food: number }
  ) => Expedition | null;
  /** 获取当前探险队 */
  getActiveExpedition: () => Expedition | null;
  /** 更新探险队状态 */
  updateExpeditionStatus: (status: Expedition['status']) => void;
  /** 处理探索进度（每阶段调用） */
  processExpeditionProgress: (currentDay: number, currentPhase: Phase) => {
    completed: boolean;
    suppliesConsumed: { water: number; food: number };
  };
  /** 完成探索并生成结果 */
  completeExpedition: () => ExplorationResult | null;
  /** 取消探索 */
  cancelExpedition: () => void;
  
  // 补给计算
  /** 计算探索所需补给 - Requirements: 6.2 */
  calculateSuppliesNeeded: (nodeId: string, explorerCount: number) => { water: number; food: number } | null;
  /** 计算旅行时间 - Requirements: 6.3 */
  calculateTravelTime: (nodeId: string) => number | null;
  
  // 战利品生成
  /** 生成战利品 - Requirements: 6.4 */
  generateNodeLoot: (nodeId: string) => { resourceId: ResourceId; amount: number }[];
  
  // 无线电塔等级
  /** 设置无线电塔等级 */
  setRadioTowerLevel: (level: number) => void;
  /** 获取最大探索距离 */
  getMaxExplorationDistance: () => number;
  
  // 先锋营地（基础实现）
  /** 获取所有先锋营地 */
  getOutposts: () => Outpost[];
  
  // 重置
  /** 重置探索状态 */
  resetExploration: () => void;
}

/**
 * 探索状态Store
 */
export const useExplorationStore = create<ExplorationStore>((set, get) => ({
  // 初始状态
  mapNodes: DEFAULT_MAP_NODES.map(node => ({ ...node })),
  activeExpedition: null,
  outposts: [],
  radioTowerLevel: 0,
  
  // ============================================
  // 地图节点操作
  // ============================================
  
  getAllNodes: (): MapNode[] => {
    return get().mapNodes;
  },
  
  getNode: (nodeId: string): MapNode | undefined => {
    return get().mapNodes.find(n => n.id === nodeId);
  },
  
  updateNodeState: (nodeId: string, state: MapNodeState): void => {
    set((s) => ({
      mapNodes: s.mapNodes.map(n => 
        n.id === nodeId ? { ...n, state } : n
      ),
    }));
  },
  
  discoverNode: (nodeId: string): void => {
    const node = get().getNode(nodeId);
    if (node && node.state === 'undiscovered') {
      get().updateNodeState(nodeId, 'discovered');
    }
  },
  
  getDiscoveredNodes: (): MapNode[] => {
    return get().mapNodes.filter(n => 
      n.state === 'discovered' || n.state === 'explored' || n.state === 'cleared'
    );
  },
  
  getExplorableNodes: (): MapNode[] => {
    const state = get();
    const discoveredIds = state.getDiscoveredNodes().map(n => n.id);
    return getExplorableNodes(state.radioTowerLevel, discoveredIds);
  },
  
  // ============================================
  // 探索操作
  // ============================================
  
  getExplorationPreview: (nodeId: string, explorerCount: number): ExplorationPreview | null => {
    const node = get().getNode(nodeId);
    if (!node) return null;
    return calculateExplorationPreview(node, explorerCount);
  },
  
  startExpedition: (
    nodeId: string,
    workerIds: string[],
    currentDay: number,
    currentPhase: Phase,
    supplies: { water: number; food: number }
  ): Expedition | null => {
    const state = get();
    
    // 检查是否已有探险队
    if (state.activeExpedition) {
      return null;
    }
    
    const node = state.getNode(nodeId);
    if (!node) return null;
    
    // 检查无线电塔等级
    const maxDistance = getMaxExplorationDistance(state.radioTowerLevel);
    if (node.distance > maxDistance) {
      return null;
    }
    
    const totalTime = calculateTotalTravelTime(node.distance);
    
    const expedition: Expedition = {
      id: generateExpeditionId(),
      workerIds,
      targetNodeId: nodeId,
      startDay: currentDay,
      startPhase: currentPhase,
      estimatedReturnAU: totalTime,
      supplies,
      status: 'traveling',
    };
    
    set({ activeExpedition: expedition });
    
    // 发现目标节点
    if (node.state === 'undiscovered') {
      state.discoverNode(nodeId);
    }
    
    return expedition;
  },
  
  getActiveExpedition: (): Expedition | null => {
    return get().activeExpedition;
  },
  
  updateExpeditionStatus: (status: Expedition['status']): void => {
    set((s) => ({
      activeExpedition: s.activeExpedition 
        ? { ...s.activeExpedition, status }
        : null,
    }));
  },
  
  processExpeditionProgress: (currentDay: number, currentPhase: Phase) => {
    const state = get();
    const expedition = state.activeExpedition;
    
    if (!expedition) {
      return { completed: false, suppliesConsumed: { water: 0, food: 0 } };
    }
    
    const phaseAU = PHASE_AU[currentPhase];
    const explorerCount = expedition.workerIds.length;
    
    // 计算本阶段补给消耗
    const suppliesConsumed = {
      water: explorerCount * EXPLORATION_WATER_PER_EXPLORER_PER_AU * phaseAU,
      food: explorerCount * EXPLORATION_FOOD_PER_EXPLORER_PER_AU * phaseAU,
    };
    
    // 更新剩余补给
    const newSupplies = {
      water: Math.max(0, expedition.supplies.water - suppliesConsumed.water),
      food: Math.max(0, expedition.supplies.food - suppliesConsumed.food),
    };
    
    // 计算剩余时间
    const node = state.getNode(expedition.targetNodeId);
    if (!node) {
      return { completed: false, suppliesConsumed };
    }
    
    const totalTime = calculateTotalTravelTime(node.distance);
    const remainingAU = calculateRemainingAU(
      expedition.startDay,
      expedition.startPhase,
      currentDay,
      currentPhase,
      totalTime
    );
    
    // 更新探险队状态
    let newStatus = expedition.status;
    const travelTime = 2 * node.distance;
    
    // 计算已经过去的AU
    const elapsedAU = totalTime - remainingAU + phaseAU;
    
    if (elapsedAU < travelTime) {
      newStatus = 'traveling';
    } else if (elapsedAU < travelTime + 2) {
      newStatus = 'exploring';
    } else if (remainingAU > 0) {
      newStatus = 'returning';
    } else {
      newStatus = 'completed';
    }
    
    set((s) => ({
      activeExpedition: s.activeExpedition 
        ? { ...s.activeExpedition, supplies: newSupplies, status: newStatus }
        : null,
    }));
    
    return { 
      completed: newStatus === 'completed', 
      suppliesConsumed 
    };
  },
  
  completeExpedition: (): ExplorationResult | null => {
    const state = get();
    const expedition = state.activeExpedition;
    
    if (!expedition) return null;
    
    const node = state.getNode(expedition.targetNodeId);
    if (!node) return null;
    
    // 生成战利品
    const loot = generateLoot(node.tier, node.riskCoefficient);
    
    // 更新节点状态
    if (node.state === 'discovered') {
      state.updateNodeState(node.id, 'explored');
    }
    
    const result: ExplorationResult = {
      success: true,
      nodeId: node.id,
      loot,
      events: node.events,
      casualties: [],
      healthChanges: [],
    };
    
    // 清除探险队
    set({ activeExpedition: null });
    
    return result;
  },
  
  cancelExpedition: (): void => {
    set({ activeExpedition: null });
  },
  
  // ============================================
  // 补给计算
  // ============================================
  
  calculateSuppliesNeeded: (nodeId: string, explorerCount: number) => {
    const node = get().getNode(nodeId);
    if (!node) return null;
    
    const totalTime = calculateTotalTravelTime(node.distance);
    return calculateExplorationSupplies(explorerCount, totalTime);
  },
  
  calculateTravelTime: (nodeId: string): number | null => {
    const node = get().getNode(nodeId);
    if (!node) return null;
    return calculateTotalTravelTime(node.distance);
  },
  
  // ============================================
  // 战利品生成
  // ============================================
  
  generateNodeLoot: (nodeId: string) => {
    const node = get().getNode(nodeId);
    if (!node) return [];
    return generateLoot(node.tier, node.riskCoefficient);
  },
  
  // ============================================
  // 无线电塔等级
  // ============================================
  
  setRadioTowerLevel: (level: number): void => {
    set({ radioTowerLevel: level });
  },
  
  getMaxExplorationDistance: (): number => {
    return getMaxExplorationDistance(get().radioTowerLevel);
  },
  
  // ============================================
  // 先锋营地
  // ============================================
  
  getOutposts: (): Outpost[] => {
    return get().outposts;
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetExploration: (): void => {
    set({
      mapNodes: DEFAULT_MAP_NODES.map(node => ({ ...node })),
      activeExpedition: null,
      outposts: [],
      radioTowerLevel: 0,
    });
  },
}));
