/**
 * 游戏状态集成模块
 * Game State Integration Module
 * 
 * 负责连接所有store，提供统一的状态收集和恢复功能
 * Requirements: 24.1 - 集成所有系统，连接UI与状态管理
 */

import { useTimeStore } from './timeStore';
import { useResourceStore } from './resourceStore';
import { usePopulationStore } from './populationStore';
import { useBuildingStore } from './buildingStore';
import { useCraftingStore } from './craftingStore';
import { useEquipmentStore } from './equipmentStore';
import { useMedicalStore } from './medicalStore';
import { useCombatStore } from './combatStore';
import { useExplorationStore } from './explorationStore';
import { useTechStore } from './techStore';
import { useOutpostStore } from './outpostStore';
import { useTradeStore } from './tradeStore';
import { useEventStore } from './eventStore';
import { useActionStore } from './actionStore';
import { useGameStateStore, type DifficultyLevel } from './gameStateStore';
import { 
  type SaveData, 
  SAVE_VERSION, 
  DEFAULT_GAME_SETTINGS,
  createEmptySaveData 
} from './saveStore';
import { getScenarioConfig, STARTING_SCENARIOS } from '../config/scenarios';
import type { ResourceId, BuildingId, JobId } from '../types';
import { DEFAULT_RESOURCE_CAPS } from './resourceStore';

// ============================================
// 状态收集函数
// State Collection Function
// ============================================

/**
 * 收集所有游戏状态用于保存
 * Requirements: 11.2 - 序列化完整游戏状态
 * Requirements: 6.6 - 保存难度设置
 */
export function collectGameState(): SaveData {
  const timeState = useTimeStore.getState();
  const resourceState = useResourceStore.getState();
  const populationState = usePopulationStore.getState();
  const buildingState = useBuildingStore.getState();
  const craftingState = useCraftingStore.getState();
  const equipmentState = useEquipmentStore.getState();
  const medicalState = useMedicalStore.getState();
  const combatState = useCombatStore.getState();
  const explorationState = useExplorationStore.getState();
  const techState = useTechStore.getState();
  const outpostState = useOutpostStore.getState();
  const tradeState = useTradeStore.getState();
  const eventState = useEventStore.getState();
  const gameStateStore = useGameStateStore.getState();

  // 构建建筑等级映射
  const buildingLevels: Partial<Record<BuildingId, number>> = {};
  for (const [id, instance] of Object.entries(buildingState.buildings)) {
    buildingLevels[id as BuildingId] = instance.level;
  }

  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    
    // 难度和场景设置 - Requirements: 6.6
    difficulty: gameStateStore.difficulty,
    scenario: gameStateStore.scenario,
    
    // 自动进阶设置 - Requirements: 5.7
    autoAdvanceEnabled: gameStateStore.autoAdvanceEnabled,
    
    // 时间状态
    time: timeState.time,
    
    // 资源状态
    resources: { ...resourceState.resources },
    resourceCaps: { ...resourceState.resourceCaps },
    
    // 建筑状态
    buildings: { ...buildingState.buildings },
    bonfireIntensity: buildingState.bonfireIntensity,
    
    // 人口状态
    workers: [...populationState.workers],
    populationCap: populationState.populationCap,
    morale: populationState.morale,
    jobs: { ...populationState.jobs },
    buildingLevels,
    
    // 装备状态
    equipment: [...equipmentState.equipment],
    
    // 制造状态
    craftingTask: craftingState.currentTask,
    craftingTaskHistory: [...craftingState.taskHistory],
    accumulatedWork: craftingState.accumulatedWork,
    
    // 医疗状态
    temporaryEffects: { ...medicalState.temporaryEffects },
    medicalMorale: medicalState.morale,
    
    // 战斗状态
    activeCombat: combatState.activeCombat,
    
    // 探索状态
    mapNodes: [...explorationState.mapNodes],
    activeExpedition: explorationState.activeExpedition,
    outposts: [...outpostState.outposts],
    radioTowerLevel: explorationState.radioTowerLevel,
    
    // 科技状态
    researchedTechs: [...techState.researched],
    currentResearch: techState.current,
    researchProgress: techState.progress,
    
    // 贸易状态
    activeTraders: [...tradeState.activeTraders],
    
    // 事件状态
    eventLog: [...eventState.eventLog],
    eventCooldowns: { ...eventState.eventCooldowns },
    triggeredNonRepeatableEvents: [...eventState.triggeredNonRepeatableEvents],
    pendingEvent: eventState.pendingEvent,
    
    // 游戏设置
    settings: DEFAULT_GAME_SETTINGS,
  };
}

// ============================================
// 状态恢复函数
// State Restoration Function
// ============================================

/**
 * 从存档数据恢复所有游戏状态
 * Requirements: 11.3 - 验证存档数据完整性
 * Requirements: 6.6 - 恢复难度设置
 */
export function restoreGameState(saveData: SaveData): boolean {
  try {
    // 恢复难度和场景设置 - Requirements: 6.6
    // 恢复自动进阶设置 - Requirements: 5.7
    useGameStateStore.setState({
      difficulty: saveData.difficulty ?? 'normal',
      scenario: saveData.scenario ?? 'lone_survivor',
      autoAdvanceEnabled: saveData.autoAdvanceEnabled ?? false,
    });
    
    // 恢复时间状态
    useTimeStore.setState({ time: saveData.time });
    
    // 恢复资源状态
    useResourceStore.setState({
      resources: saveData.resources,
      resourceCaps: saveData.resourceCaps,
    });
    
    // 恢复建筑状态
    useBuildingStore.setState({
      buildings: saveData.buildings,
      bonfireIntensity: saveData.bonfireIntensity,
    });
    
    // 恢复人口状态
    usePopulationStore.setState({
      workers: saveData.workers,
      populationCap: saveData.populationCap,
      morale: saveData.morale,
      jobs: saveData.jobs,
    });
    
    // 恢复装备状态
    useEquipmentStore.setState({
      equipment: saveData.equipment,
    });
    
    // 恢复制造状态
    useCraftingStore.setState({
      currentTask: saveData.craftingTask,
      taskHistory: saveData.craftingTaskHistory,
      accumulatedWork: saveData.accumulatedWork,
    });
    
    // 恢复医疗状态
    useMedicalStore.setState({
      temporaryEffects: saveData.temporaryEffects,
      morale: saveData.medicalMorale,
    });
    
    // 恢复战斗状态
    useCombatStore.setState({
      activeCombat: saveData.activeCombat,
    });
    
    // 恢复探索状态
    useExplorationStore.setState({
      mapNodes: saveData.mapNodes,
      activeExpedition: saveData.activeExpedition,
      radioTowerLevel: saveData.radioTowerLevel,
    });
    
    // 恢复先锋营地状态
    useOutpostStore.setState({
      outposts: saveData.outposts,
    });
    
    // 恢复科技状态
    useTechStore.setState({
      researched: saveData.researchedTechs,
      current: saveData.currentResearch,
      progress: saveData.researchProgress,
    });
    
    // 恢复贸易状态
    useTradeStore.setState({
      activeTraders: saveData.activeTraders,
    });
    
    // 恢复事件状态
    useEventStore.setState({
      eventLog: saveData.eventLog,
      eventCooldowns: saveData.eventCooldowns,
      triggeredNonRepeatableEvents: saveData.triggeredNonRepeatableEvents,
      pendingEvent: saveData.pendingEvent,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to restore game state:', error);
    return false;
  }
}

// ============================================
// 游戏初始化
// Game Initialization
// ============================================

/**
 * 初始化新游戏
 * Requirements: 6.2, 6.3, 6.4, 7.3 - 根据难度和场景初始化游戏
 * 
 * @param difficulty 难度等级（可选，默认使用gameStateStore中的设置）
 * @param scenarioId 场景ID（可选，默认使用gameStateStore中的设置）
 */
export function initializeNewGame(difficulty?: DifficultyLevel, scenarioId?: string): void {
  // 重置所有store
  resetAllStores();
  
  const gameStateStore = useGameStateStore.getState();
  
  // 使用传入的参数或从gameStateStore获取
  const actualScenarioId = scenarioId ?? gameStateStore.scenario;
  
  // 如果传入了difficulty参数，更新gameStateStore
  if (difficulty) {
    gameStateStore.startNewGame(difficulty, actualScenarioId);
  }
  
  // 获取难度修正值
  const { startingResourceMultiplier } = gameStateStore.getDifficultyModifiers();
  
  // 获取场景配置，如果找不到则使用默认场景
  const scenarioConfig = getScenarioConfig(actualScenarioId);
  const scenario = scenarioConfig ?? STARTING_SCENARIOS[0]!;
  
  const resourceStore = useResourceStore.getState();
  
  // 设置初始资源（应用难度倍率）
  // Requirements: 6.2, 6.3, 6.4 - 应用 startingResourceMultiplier
  for (const [resourceId, amount] of Object.entries(scenario.startingResources)) {
    if (amount !== undefined && amount > 0) {
      const adjustedAmount = Math.floor(amount * startingResourceMultiplier);
      resourceStore.setResource(resourceId as ResourceId, adjustedAmount);
    }
  }
  
  // 设置初始资源上限
  resourceStore.setResourceCap('scrap', 100);
  resourceStore.setResourceCap('water', 50);
  resourceStore.setResourceCap('food', 50);
  resourceStore.setResourceCap('dirty_water', 30);
  resourceStore.setResourceCap('wood', 50);
  resourceStore.setResourceCap('metal', 30);
  resourceStore.setResourceCap('canned_food', 30);
  
  // 添加初始工人（根据场景配置）
  // Requirements: 7.3 - 根据场景初始化工人数量
  const populationStore = usePopulationStore.getState();
  const workerNames = ['幸存者', '流浪者', '拾荒者', '难民'];
  for (let i = 0; i < scenario.startingWorkers; i++) {
    populationStore.addWorker(workerNames[i] ?? `幸存者${i + 1}`);
  }
  populationStore.setPopulationCap(Math.max(2, scenario.startingWorkers + 1));
  
  // 探索地图已在 resetExploration 中初始化为默认节点
  // 发现 T1 近郊区域节点（距离 1-2），无需电塔即可探索
  const explorationStore = useExplorationStore.getState();
  const t1Nodes = explorationStore.mapNodes.filter(n => n.tier === 'T1');
  for (const node of t1Nodes) {
    explorationStore.discoverNode(node.id);
  }
  
  // 添加欢迎事件
  useEventStore.getState().addSystemMessage(
    'Game Started',
    '欢迎来到尘埃与回响。在这片废土上，生存是唯一的法则。',
    1,
    'dawn'
  );
}

/**
 * 重置所有store到初始状态
 */
export function resetAllStores(): void {
  useTimeStore.getState().resetTime();
  useResourceStore.getState().resetResources();
  usePopulationStore.getState().resetPopulation();
  useBuildingStore.getState().resetBuildings();
  useCraftingStore.getState().resetCrafting();
  useEquipmentStore.getState().resetEquipment();
  useMedicalStore.getState().resetMedical();
  useCombatStore.getState().resetCombat();
  useExplorationStore.getState().resetExploration();
  useTechStore.getState().resetTech();
  useOutpostStore.getState().resetOutposts();
  useTradeStore.getState().resetTrade();
  useEventStore.getState().resetEvents();
  useActionStore.getState().resetActions();
}

// ============================================
// 资源短缺伤害常量
// Resource Shortage Damage Constants
// ============================================

/** 每AU水短缺造成的伤害 */
export const WATER_SHORTAGE_DAMAGE_PER_AU = 10;

/** 每AU食物短缺造成的伤害 */
export const FOOD_SHORTAGE_DAMAGE_PER_AU = 8;

// ============================================
// 资源短缺处理结果接口
// Resource Shortage Processing Result Interface
// ============================================

export interface ShortageResult {
  waterShortage: number;
  foodShortage: number;
}

export interface ShortageProcessingResult {
  totalDamage: number;
  workersInjured: { workerId: string; damage: number; newHealth: number }[];
  workersDied: { workerId: string; name: string; cause: string }[];
}

// ============================================
// 游戏循环辅助函数
// Game Loop Helper Functions
// ============================================

/**
 * 处理资源短缺造成的伤害
 * Requirements: 3.1, 3.2, 3.6 - 资源短缺伤害机制
 * Requirements: 5.1, 8.4 - 当所有工人死亡时触发游戏结束
 * 
 * @param shortageResult 短缺结果（水和食物短缺的AU数）
 * @returns 处理结果，包括受伤和死亡的工人信息
 */
export function processResourceShortage(shortageResult: ShortageResult): ShortageProcessingResult {
  const { waterShortage, foodShortage } = shortageResult;
  
  // 计算总伤害
  const waterDamage = waterShortage * WATER_SHORTAGE_DAMAGE_PER_AU;
  const foodDamage = foodShortage * FOOD_SHORTAGE_DAMAGE_PER_AU;
  const totalDamage = waterDamage + foodDamage;
  
  const result: ShortageProcessingResult = {
    totalDamage,
    workersInjured: [],
    workersDied: [],
  };
  
  if (totalDamage <= 0) {
    return result;
  }
  
  const populationStore = usePopulationStore.getState();
  const eventStore = useEventStore.getState();
  const timeStore = useTimeStore.getState();
  const gameStateStore = useGameStateStore.getState();
  const workers = populationStore.workers;
  
  // 按健康值排序，最低的先受伤
  const sortedWorkers = [...workers].sort((a, b) => a.health - b.health);
  
  // 确定主要短缺原因（用于死亡消息）
  const primaryCause = waterShortage > foodShortage ? '脱水' : '饥饿';
  
  for (const worker of sortedWorkers) {
    const oldHealth = worker.health;
    const newHealth = Math.max(0, oldHealth - totalDamage);
    
    // 应用伤害
    populationStore.modifyWorkerHealth(worker.id, -totalDamage);
    
    result.workersInjured.push({
      workerId: worker.id,
      damage: totalDamage,
      newHealth,
    });
    
    // 检查是否死亡
    if (newHealth === 0) {
      result.workersDied.push({
        workerId: worker.id,
        name: worker.name,
        cause: primaryCause,
      });
    }
  }
  
  // 处理死亡的工人（在单独的循环中处理，避免在遍历时修改数组）
  for (const deadWorker of result.workersDied) {
    // 移除工人
    populationStore.removeWorker(deadWorker.workerId);
    
    // 更新统计：工人死亡数
    gameStateStore.incrementWorkersLost();
    
    // 记录死亡事件到事件日志
    eventStore.addLogEntry({
      id: `death_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: {
        day: timeStore.time.day,
        phase: timeStore.time.phase,
      },
      type: 'death',
      message: `${deadWorker.name} died from ${deadWorker.cause === '脱水' ? 'dehydration' : 'starvation'}`,
      messageZh: `${deadWorker.name} 因${deadWorker.cause}而死亡`,
    });
  }
  
  // 检查游戏结束条件：所有工人死亡
  // Requirements: 5.1, 8.4 - 当所有工人死亡时触发游戏结束
  const remainingWorkers = usePopulationStore.getState().workers.length;
  if (remainingWorkers === 0 && result.workersDied.length > 0) {
    gameStateStore.triggerGameOver('所有幸存者已死亡');
  }
  
  return result;
}

/**
 * 处理阶段结束时的所有结算
 * Requirements: 1.3 - 阶段结束时计算生产/消耗
 */
export function processPhaseEnd(): {
  waterConsumed: number;
  foodConsumed: number;
  waterShortage: number;
  foodShortage: number;
  productionResults: Record<ResourceId, number>;
  shortageProcessingResult?: ShortageProcessingResult;
  explorationResult?: {
    completed: boolean;
    loot?: { resourceId: ResourceId; amount: number }[];
    nodeId?: string;
    nodeName?: string;
  };
} {
  const timeState = useTimeStore.getState();
  const resourceState = useResourceStore.getState();
  const populationState = usePopulationStore.getState();
  const buildingState = useBuildingStore.getState();
  const medicalState = useMedicalStore.getState();
  const actionState = useActionStore.getState();
  
  const population = populationState.workers.length;
  const phaseAU = timeState.time.phaseAU;
  
  // 0. 重置行动状态（AU和已执行行动）
  actionState.resetPhaseActions();
  
  // 1. 处理资源消耗
  const consumptionResult = resourceState.processPhaseConsumption(
    population,
    phaseAU,
    timeState.time.day,
    timeState.time.phase
  );
  
  // 2. 处理篝火燃料消耗
  const bonfireFuel = buildingState.getBonfireFuelConsumption(phaseAU);
  if (bonfireFuel > 0) {
    resourceState.consumeResource('wood', bonfireFuel);
  }
  
  // 3. 处理岗位生产
  const productionResults = processJobProduction(phaseAU);
  
  // 4. 处理医疗状态效果 - 处理每个工人的状态效果
  for (const worker of populationState.workers) {
    if (worker.statuses.length > 0) {
      medicalState.processWorkerStatusEffects(worker, phaseAU);
    }
  }
  
  // 5. 处理临时效果
  medicalState.processTemporaryEffects(phaseAU, (workerId, delta) => {
    populationState.modifyWorkerHealth(workerId, delta);
  });
  
  // 6. 处理易腐物品（午夜阶段）
  if (timeState.time.phase === 'midnight') {
    resourceState.processPerishables();
  }
  
  // 7. 处理资源短缺伤害
  // Requirements: 3.1, 3.2 - 在消耗处理后检查短缺并造成伤害
  let shortageProcessingResult: ShortageProcessingResult | undefined = undefined;
  if (consumptionResult.waterShortage > 0 || consumptionResult.foodShortage > 0) {
    shortageProcessingResult = processResourceShortage({
      waterShortage: consumptionResult.waterShortage,
      foodShortage: consumptionResult.foodShortage,
    });
  }
  
  // 8. 处理探索进度和完成
  // Requirements: 4.7, 4.8, 4.9
  const explorationResult = processExplorationProgress();
  
  const result: {
    waterConsumed: number;
    foodConsumed: number;
    waterShortage: number;
    foodShortage: number;
    productionResults: Record<ResourceId, number>;
    shortageProcessingResult?: ShortageProcessingResult;
    explorationResult?: {
      completed: boolean;
      loot?: { resourceId: ResourceId; amount: number }[];
      nodeId?: string;
      nodeName?: string;
    };
  } = {
    waterConsumed: consumptionResult.waterConsumed,
    foodConsumed: consumptionResult.foodConsumed,
    waterShortage: consumptionResult.waterShortage,
    foodShortage: consumptionResult.foodShortage,
    productionResults,
  };
  
  if (shortageProcessingResult) {
    result.shortageProcessingResult = shortageProcessingResult;
  }
  
  if (explorationResult.completed) {
    result.explorationResult = explorationResult;
  }
  
  return result;
}

/**
 * 处理岗位生产
 */
function processJobProduction(phaseAU: number): Record<ResourceId, number> {
  const populationState = usePopulationStore.getState();
  const buildingState = useBuildingStore.getState();
  const resourceState = useResourceStore.getState();
  
  const results: Record<ResourceId, number> = {} as Record<ResourceId, number>;
  
  // 获取各岗位的工人数量
  const jobs = populationState.jobs;
  
  // 拾荒者产出 Scrap
  const scavengerCount = jobs.scavenger?.length ?? 0;
  if (scavengerCount > 0) {
    const scavengeLevel = buildingState.buildings.scavenge_post?.level ?? 1;
    const efficiency = 1 + 0.10 * (scavengeLevel - 1);
    const scrapProduced = scavengerCount * 15 * phaseAU * efficiency;
    resourceState.addResource('scrap', scrapProduced);
    results.scrap = scrapProduced;
  }
  
  // 集水者产出 Water
  const waterCollectorCount = jobs.water_collector?.length ?? 0;
  if (waterCollectorCount > 0) {
    const waterLevel = buildingState.buildings.water_collector?.level ?? 1;
    const efficiency = 1 + 0.10 * (waterLevel - 1);
    const waterProduced = waterCollectorCount * 3 * phaseAU * efficiency;
    resourceState.addResource('water', waterProduced);
    results.water = waterProduced;
  }
  
  // 猎人产出 Food
  const hunterCount = jobs.hunter?.length ?? 0;
  if (hunterCount > 0) {
    const trapLevel = buildingState.buildings.trap?.level ?? 1;
    const efficiency = 1 + 0.10 * (trapLevel - 1);
    const foodProduced = hunterCount * 3.6 * phaseAU * efficiency;
    resourceState.addResource('food', foodProduced);
    results.food = foodProduced;
  }
  
  // 工程师产出 Work（累积到制造系统）
  const engineerCount = jobs.engineer?.length ?? 0;
  if (engineerCount > 0) {
    const workshopLevel = buildingState.buildings.workshop?.level ?? 1;
    const efficiency = 1 + 0.20 * (workshopLevel - 1);
    const workProduced = engineerCount * 60 * phaseAU * efficiency;
    useCraftingStore.getState().addWork(workProduced);
  }
  
  // 研究员产出 RP
  const researcherCount = jobs.researcher?.length ?? 0;
  if (researcherCount > 0) {
    const rpProduced = researcherCount * 10 * phaseAU;
    useTechStore.getState().addProgress(rpProduced);
  }
  
  return results;
}

/**
 * 获取当前游戏状态上下文（用于行动验证）
 */
export function getActionContext() {
  const timeState = useTimeStore.getState();
  const resourceState = useResourceStore.getState();
  const buildingState = useBuildingStore.getState();
  const techState = useTechStore.getState();
  const populationState = usePopulationStore.getState();
  
  // 构建建筑等级映射
  const buildingLevels: Partial<Record<BuildingId, number>> = {};
  for (const [id, instance] of Object.entries(buildingState.buildings)) {
    buildingLevels[id as BuildingId] = instance.level;
  }
  
  return {
    day: timeState.time.day,
    phase: timeState.time.phase,
    phaseAU: timeState.time.phaseAU,
    resources: resourceState.resources,
    buildingLevels,
    researchedTechs: techState.researched,
    workerCount: populationState.workers.length,
    jobAssignments: populationState.jobs,
  };
}

// ============================================
// 建筑效果同步
// Building Effect Synchronization
// Requirements: 1.1, 6.1, 6.2, 6.3, 6.4
// ============================================

/**
 * 同步建筑效果到所有依赖系统
 * Synchronize building effects to all dependent systems
 * 
 * Requirements: 1.1, 6.1, 6.2, 6.3, 6.4
 * - 同步人口上限到 populationStore
 * - 同步存储上限到 resourceStore
 * - 同步岗位槽位到 populationStore
 * - 同步探索区域到 explorationStore
 * 
 * @param _buildingId 建筑ID（可选，保留用于未来优化，当前同步所有效果）
 */
export function syncBuildingEffects(_buildingId?: BuildingId): void {
  // Parameter intentionally unused - currently syncs all effects regardless of which building changed
  void _buildingId;
  
  const buildingStore = useBuildingStore.getState();
  const populationStore = usePopulationStore.getState();
  const resourceStore = useResourceStore.getState();
  const explorationStore = useExplorationStore.getState();
  
  // 1. 同步人口上限 (Requirements: 6.2)
  // 基础人口上限 + 住所加成
  const basePopulationCap = 2; // 初始人口上限
  const shelterBonus = buildingStore.getPopulationCapBonus();
  const newPopulationCap = basePopulationCap + shelterBonus;
  populationStore.setPopulationCap(newPopulationCap);
  
  // 2. 同步存储上限 (Requirements: 6.3)
  const storageBonus = buildingStore.getStorageCapBonus();
  for (const [resourceId, bonus] of Object.entries(storageBonus)) {
    const baseStorageCap = DEFAULT_RESOURCE_CAPS[resourceId as ResourceId] ?? 0;
    const newCap = baseStorageCap + bonus;
    resourceStore.setResourceCap(resourceId as ResourceId, newCap);
  }
  
  // 3. 同步岗位槽位到 populationStore (Requirements: 6.4)
  // 更新建筑等级缓存，用于岗位槽位计算
  const productionBuildings: BuildingId[] = ['water_collector', 'trap', 'scavenge_post', 'workshop', 'research_desk'];
  for (const bId of productionBuildings) {
    const level = buildingStore.getBuildingLevel(bId);
    populationStore.setBuildingLevel(bId, level);
  }
  
  // 4. 验证当前岗位分配 (Requirements: 6.4)
  // 如果岗位槽位减少，需要取消超出的工人分配
  validateJobAssignments();
  
  // 5. 同步无线电塔等级到探索系统
  const radioTowerLevel = buildingStore.getBuildingLevel('radio_tower');
  explorationStore.setRadioTowerLevel(radioTowerLevel);
}

/**
 * 同步人口上限
 * Requirements: 6.2
 */
export function syncPopulationCap(): void {
  const buildingStore = useBuildingStore.getState();
  const populationStore = usePopulationStore.getState();
  
  const basePopulationCap = 2;
  const shelterBonus = buildingStore.getPopulationCapBonus();
  populationStore.setPopulationCap(basePopulationCap + shelterBonus);
}

/**
 * 同步存储上限
 * Requirements: 6.3
 */
export function syncStorageCaps(): void {
  const buildingStore = useBuildingStore.getState();
  const resourceStore = useResourceStore.getState();
  
  const storageBonus = buildingStore.getStorageCapBonus();
  for (const [resourceId, bonus] of Object.entries(storageBonus)) {
    const baseStorageCap = DEFAULT_RESOURCE_CAPS[resourceId as ResourceId] ?? 0;
    resourceStore.setResourceCap(resourceId as ResourceId, baseStorageCap + bonus);
  }
}

/**
 * 同步岗位槽位
 * Requirements: 6.4
 */
export function syncJobSlots(): void {
  const buildingStore = useBuildingStore.getState();
  const populationStore = usePopulationStore.getState();
  
  const productionBuildings: BuildingId[] = ['water_collector', 'trap', 'scavenge_post', 'workshop', 'research_desk'];
  for (const bId of productionBuildings) {
    const level = buildingStore.getBuildingLevel(bId);
    populationStore.setBuildingLevel(bId, level);
  }
  
  validateJobAssignments();
}

/**
 * 验证岗位分配，取消超出槽位的工人
 * Requirements: 6.4 - IF a job slot is reduced below current workers, THEN THE Worker_System SHALL unassign excess workers
 */
function validateJobAssignments(): void {
  const populationStore = usePopulationStore.getState();
  const jobs = populationStore.jobs;
  
  const jobBuildingMap: Partial<Record<JobId, BuildingId>> = {
    water_collector: 'water_collector',
    hunter: 'trap',
    scavenger: 'scavenge_post',
  };
  
  for (const [jobId, workerIds] of Object.entries(jobs)) {
    const buildingId = jobBuildingMap[jobId as JobId];
    if (!buildingId) continue;
    
    const maxSlots = populationStore.getJobMaxSlots(jobId as JobId);
    const currentCount = workerIds.length;
    
    // 如果当前工人数超过槽位，取消多余的工人分配
    if (currentCount > maxSlots) {
      const excessCount = currentCount - maxSlots;
      const workersToUnassign = workerIds.slice(-excessCount); // 取消最后分配的工人
      
      for (const workerId of workersToUnassign) {
        populationStore.assignJob(workerId, null);
      }
    }
  }
}

// ============================================
// 探索系统处理
// Exploration System Processing
// Requirements: 4.7, 4.8, 4.9
// ============================================

/**
 * 处理探索进度和完成
 * Process exploration progress and completion
 * 
 * Requirements: 4.7 - Consume supplies during expedition
 * Requirements: 4.8 - Generate loot when expedition completes
 * Requirements: 4.9 - Update node state to explored
 * 
 * @returns 探索处理结果
 */
export function processExplorationProgress(): {
  completed: boolean;
  loot?: { resourceId: ResourceId; amount: number }[];
  nodeId?: string;
  nodeName?: string;
} {
  const timeStore = useTimeStore.getState();
  const explorationStore = useExplorationStore.getState();
  const resourceStore = useResourceStore.getState();
  const eventStore = useEventStore.getState();
  
  const expedition = explorationStore.getActiveExpedition();
  if (!expedition) {
    return { completed: false };
  }
  
  // Process expedition progress (consumes supplies, updates status)
  const progressResult = explorationStore.processExpeditionProgress(
    timeStore.time.day,
    timeStore.time.phase
  );
  
  // If expedition completed, generate loot and update node state
  if (progressResult.completed) {
    const result = explorationStore.completeExpedition();
    
    if (result) {
      // Add loot to resources
      for (const { resourceId, amount } of result.loot) {
        resourceStore.addResource(resourceId, amount);
      }
      
      // Get node name for logging
      const node = explorationStore.getNode(result.nodeId);
      const nodeName = node?.nameZh ?? result.nodeId;
      
      // Log completion event
      eventStore.addActionMessage(
        `Expedition to ${node?.name ?? result.nodeId} completed`,
        `探险队从 ${nodeName} 返回`,
        timeStore.time.day,
        timeStore.time.phase
      );
      
      // Log loot
      if (result.loot.length > 0) {
        const lootSummary = result.loot
          .map(l => `${l.resourceId}×${l.amount}`)
          .join(', ');
        eventStore.addActionMessage(
          `Loot obtained: ${lootSummary}`,
          `获得战利品: ${lootSummary}`,
          timeStore.time.day,
          timeStore.time.phase
        );
      }
      
      return {
        completed: true,
        loot: result.loot,
        nodeId: result.nodeId,
        nodeName,
      };
    }
  }
  
  return { completed: false };
}

// ============================================
// 导出
// ============================================

export {
  createEmptySaveData,
};

// ============================================
// 自动进阶检测
// Auto-Advance Detection
// Requirements: 5.2, 5.3, 5.6
// ============================================

/**
 * 检查是否应该自动进阶
 * Check if auto-advance should trigger
 * 
 * Requirements: 5.2 - WHEN auto-advance is enabled AND remaining AU reaches 0
 * 
 * @param remainingAU 当前剩余AU
 * @returns 是否应该自动进阶
 */
export function shouldAutoAdvance(remainingAU: number): boolean {
  const gameStateStore = useGameStateStore.getState();
  return gameStateStore.autoAdvanceEnabled && remainingAU <= 0;
}

/**
 * 执行自动进阶
 * Perform auto-advance to next phase
 * 
 * Requirements: 5.2 - Automatically advance to the next phase
 * Requirements: 5.3 - Process all phase-end calculations
 * 
 * @returns 阶段结束处理结果
 */
export function performAutoAdvance(): ReturnType<typeof processPhaseEnd> {
  const timeStore = useTimeStore.getState();
  const eventStore = useEventStore.getState();
  
  // Process phase end calculations (Requirements: 5.3)
  const result = processPhaseEnd();
  
  // Advance to next phase
  timeStore.advancePhase();
  
  // Get new time state
  const newTime = useTimeStore.getState().time;
  
  // Log auto-advance event
  eventStore.addSystemMessage(
    `Auto-advanced to ${newTime.phase}`,
    `[自动进阶] 时间推进至第 ${newTime.day} 天 ${getPhaseNameZhInternal(newTime.phase)}`,
    newTime.day,
    newTime.phase
  );
  
  return result;
}

/**
 * 获取阶段中文名（内部使用）
 */
function getPhaseNameZhInternal(phase: string): string {
  const names: Record<string, string> = {
    dawn: '清晨',
    morning: '上午',
    noon: '中午',
    afternoon: '下午',
    evening: '傍晚',
    midnight: '午夜',
  };
  return names[phase] ?? phase;
}

// ============================================
// 初始化建筑效果同步回调
// Initialize Building Effect Sync Callback
// ============================================

// Register the sync callback with buildingStore to avoid circular dependency
import { registerBuildingLevelChangeCallback } from './buildingStore';
registerBuildingLevelChangeCallback(syncBuildingEffects);
