/**
 * 优化的状态选择器
 * Optimized State Selectors
 * 
 * Requirements: 24.3 - 确保流畅的用户体验
 * 
 * 这些选择器使用浅比较来避免不必要的重渲染
 */

import { useTimeStore } from './timeStore';
import { useResourceStore } from './resourceStore';
import { usePopulationStore } from './populationStore';
import { useBuildingStore } from './buildingStore';
import { useEventStore } from './eventStore';
import { useTechStore } from './techStore';
import { useExplorationStore } from './explorationStore';
import type { ResourceId, BuildingId, JobId } from '../types';

// ============================================
// 时间选择器
// Time Selectors
// ============================================

/** 获取当前天数 */
export const useCurrentDay = () => useTimeStore(state => state.time.day);

/** 获取当前阶段 */
export const useCurrentPhase = () => useTimeStore(state => state.time.phase);

/** 获取当前阶段AU值 */
export const useCurrentPhaseAU = () => useTimeStore(state => state.time.phaseAU);

/** 获取完整时间状态 */
export const useTime = () => useTimeStore(state => state.time);

// ============================================
// 资源选择器
// Resource Selectors
// ============================================

/** 获取单个资源数量 */
export const useResource = (resourceId: ResourceId) => 
  useResourceStore(state => state.resources[resourceId] ?? 0);

/** 获取单个资源上限 */
export const useResourceCap = (resourceId: ResourceId) => 
  useResourceStore(state => state.resourceCaps[resourceId] ?? 0);

/** 获取资源百分比 */
export const useResourcePercent = (resourceId: ResourceId) => 
  useResourceStore(state => {
    const amount = state.resources[resourceId] ?? 0;
    const cap = state.resourceCaps[resourceId] ?? 1;
    return cap > 0 ? amount / cap : 0;
  });

/** 获取所有资源（用于资源面板） */
export const useAllResources = () => useResourceStore(state => state.resources);

/** 获取所有资源上限 */
export const useAllResourceCaps = () => useResourceStore(state => state.resourceCaps);

/** 检查资源是否低于阈值 */
export const useIsResourceLow = (resourceId: ResourceId, threshold = 0.2) =>
  useResourceStore(state => {
    const amount = state.resources[resourceId] ?? 0;
    const cap = state.resourceCaps[resourceId] ?? 1;
    return cap > 0 && amount / cap <= threshold;
  });

/** 检查资源是否危急 */
export const useIsResourceCritical = (resourceId: ResourceId, threshold = 0.1) =>
  useResourceStore(state => {
    const amount = state.resources[resourceId] ?? 0;
    const cap = state.resourceCaps[resourceId] ?? 1;
    return cap > 0 && amount / cap <= threshold;
  });

// ============================================
// 人口选择器
// Population Selectors
// ============================================

/** 获取工人数量 */
export const useWorkerCount = () => usePopulationStore(state => state.workers.length);

/** 获取人口上限 */
export const usePopulationCap = () => usePopulationStore(state => state.populationCap);

/** 获取士气 */
export const useMorale = () => usePopulationStore(state => state.morale);

/** 获取所有工人 */
export const useWorkers = () => usePopulationStore(state => state.workers);

/** 获取岗位分配 */
export const useJobs = () => usePopulationStore(state => state.jobs);

/** 获取特定岗位的工人数量 */
export const useJobWorkerCount = (jobId: JobId) =>
  usePopulationStore(state => state.jobs[jobId]?.length ?? 0);

/** 获取空闲工人数量 */
export const useIdleWorkerCount = () =>
  usePopulationStore(state => {
    const assignedCount = Object.values(state.jobs).reduce(
      (sum, workers) => sum + workers.length,
      0
    );
    return state.workers.length - assignedCount;
  });

// ============================================
// 建筑选择器
// Building Selectors
// ============================================

/** 获取建筑等级 */
export const useBuildingLevel = (buildingId: BuildingId) =>
  useBuildingStore(state => state.buildings[buildingId]?.level ?? 0);

/** 获取建筑状态 */
export const useBuildingState = (buildingId: BuildingId) =>
  useBuildingStore(state => state.buildings[buildingId]?.state ?? 'idle');

/** 获取篝火强度 */
export const useBonfireIntensity = () => useBuildingStore(state => state.bonfireIntensity);

/** 获取所有建筑 */
export const useAllBuildings = () => useBuildingStore(state => state.buildings);

/** 检查建筑是否已建造 */
export const useIsBuildingBuilt = (buildingId: BuildingId) =>
  useBuildingStore(state => (state.buildings[buildingId]?.level ?? 0) > 0);

// ============================================
// 事件选择器
// Event Selectors
// ============================================

/** 获取事件日志 */
export const useEventLog = () => useEventStore(state => state.eventLog);

/** 获取最近N条事件 */
export const useRecentEvents = (count: number) =>
  useEventStore(state => state.eventLog.slice(0, count));

/** 获取待处理事件 */
export const usePendingEvent = () => useEventStore(state => state.pendingEvent);

// ============================================
// 科技选择器
// Tech Selectors
// ============================================

/** 获取已研究科技列表 */
export const useResearchedTechs = () => useTechStore(state => state.researched);

/** 获取当前研究 */
export const useCurrentResearch = () => useTechStore(state => state.current);

/** 获取研究进度 */
export const useResearchProgress = () => useTechStore(state => state.progress);

/** 检查科技是否已研究 */
export const useIsTechResearched = (techId: string) =>
  useTechStore(state => state.researched.includes(techId));

// ============================================
// 探索选择器
// Exploration Selectors
// ============================================

/** 获取地图节点 */
export const useMapNodes = () => useExplorationStore(state => state.mapNodes);

/** 获取当前探险 */
export const useActiveExpedition = () => useExplorationStore(state => state.activeExpedition);

/** 获取无线电塔等级 */
export const useRadioTowerLevel = () => useExplorationStore(state => state.radioTowerLevel);

/** 检查是否有活跃探险 */
export const useHasActiveExpedition = () =>
  useExplorationStore(state => state.activeExpedition !== null);

// ============================================
// 组合选择器
// Combined Selectors
// ============================================

/** 获取游戏概览数据（用于仪表板） */
export function useGameOverview() {
  const day = useCurrentDay();
  const phase = useCurrentPhase();
  const workerCount = useWorkerCount();
  const populationCap = usePopulationCap();
  const morale = useMorale();
  
  return { day, phase, workerCount, populationCap, morale };
}

/** 获取生存资源状态 */
export function useSurvivalResources() {
  const water = useResource('water');
  const waterCap = useResourceCap('water');
  const food = useResource('food');
  const foodCap = useResourceCap('food');
  
  return {
    water,
    waterCap,
    waterPercent: waterCap > 0 ? water / waterCap : 0,
    food,
    foodCap,
    foodPercent: foodCap > 0 ? food / foodCap : 0,
  };
}
