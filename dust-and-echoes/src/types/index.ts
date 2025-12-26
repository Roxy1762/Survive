/**
 * 尘埃与回响 - 核心类型定义
 * Dust & Echoes - Core Type Definitions
 */

// ============================================
// 时间与阶段系统 (Time & Phase System)
// ============================================

/** 游戏阶段 - 一天6个阶段，共5 AU */
export type Phase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'midnight';

/** 阶段AU值映射 */
export const PHASE_AU: Record<Phase, number> = {
  dawn: 0.5,      // 清晨 - 短行动阶段
  morning: 1.0,   // 上午 - 标准行动阶段
  noon: 0.5,      // 中午 - 短行动阶段
  afternoon: 1.0, // 下午 - 标准行动阶段
  evening: 1.0,   // 傍晚 - 标准行动阶段
  midnight: 1.0,  // 午夜 - 标准行动阶段
} as const;

/** 阶段顺序 */
export const PHASE_ORDER: readonly Phase[] = [
  'dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'
] as const;

/** 时间状态 */
export interface TimeState {
  day: number;
  phase: Phase;
  phaseAU: number;
}

// ============================================
// 资源系统 (Resource System)
// ============================================

/** 一级资源ID */
export type PrimaryResourceId =
  | 'scrap'        // 废料 - 1 VU
  | 'water'        // 净水 - 5 VU
  | 'dirty_water'  // 脏水 - 3 VU
  | 'food'         // 口粮 - 4.167 VU
  | 'raw_meat'     // 生肉 - 3 VU (易腐)
  | 'canned_food'  // 罐头 - 14.5 VU
  | 'vegetables'   // 蔬菜 - 4 VU (易腐)
  | 'seeds'        // 种子 - 20 VU
  | 'fertilizer';  // 肥料 - 18 VU

/** 二级材料ID */
export type SecondaryResourceId =
  | 'wood'       // 木材 - 8 VU
  | 'metal'      // 金属 - 16 VU
  | 'cloth'      // 布料 - 5 VU
  | 'leather'    // 皮革 - 7 VU
  | 'plastic'    // 塑料 - 7 VU
  | 'glass'      // 玻璃 - 7 VU
  | 'rubber'     // 橡胶 - 9 VU
  | 'wire'       // 线材 - 11 VU
  | 'rope'       // 绳索 - 7 VU
  | 'duct_tape'; // 胶带 - 14 VU

/** 组件ID */
export type ComponentResourceId =
  | 'gear'      // 机械齿轮 - 15 VU
  | 'pipe'      // 管件 - 15 VU
  | 'spring'    // 弹簧 - 12 VU
  | 'bearing'   // 轴承 - 18 VU
  | 'fasteners'; // 紧固件 - 6 VU

/** 化工材料ID */
export type ChemicalResourceId =
  | 'solvent'    // 溶剂 - 22 VU
  | 'acid'       // 强酸 - 25 VU
  | 'gunpowder'  // 火药 - 33 VU
  | 'fuel';      // 燃料 - 42 VU

/** 能源组件ID */
export type EnergyResourceId =
  | 'battery_cell' // 电芯 - 45 VU
  | 'battery_pack' // 电池包 - 102 VU
  | 'filter'       // 过滤芯 - 17 VU
  | 'seal_ring';   // 密封圈 - 11 VU

/** 三级稀有资源ID */
export type RareResourceId =
  | 'meds'        // 药品 - 320 VU
  | 'data_tape'   // 数据磁带 - 160 VU
  | 'radio_parts' // 无线电组件 - 240 VU
  | 'solar_cell'  // 太阳能板 - 320 VU
  | 'rare_alloy'  // 稀有合金 - 400 VU
  | 'microchips'  // 旧世界芯片 - 640 VU
  | 'nanofiber'   // 纳米纤维 - 800 VU
  | 'power_core'; // 能源核心 - 2560 VU


/** 所有资源ID */
export type ResourceId =
  | PrimaryResourceId
  | SecondaryResourceId
  | ComponentResourceId
  | ChemicalResourceId
  | EnergyResourceId
  | RareResourceId;

/** 资源类别 */
export type ResourceCategory = 'primary' | 'secondary' | 'component' | 'chemical' | 'energy' | 'rare';

/** 资源定义 */
export interface Resource {
  id: ResourceId;
  name: string;
  nameZh: string;
  vu: number;
  category: ResourceCategory;
  perishable?: boolean;
  stackLimit?: number;
}

/** 资源数量 */
export interface ResourceAmount {
  resourceId: ResourceId;
  amount: number;
}

// ============================================
// 配方系统 (Recipe System)
// ============================================

/** 配方定义 */
export interface Recipe {
  id: string;
  name: string;
  nameZh: string;
  output: ResourceAmount;
  inputs: ResourceAmount[];
  workRequired: number;
  unlockTech?: string;
  unlockBuilding?: string;
}

// ============================================
// 建筑系统 (Building System)
// ============================================

/** 建筑ID */
export type BuildingId =
  | 'bonfire'         // 篝火
  | 'shelter'         // 住所
  | 'warehouse'       // 仓库
  | 'workshop'        // 工坊
  | 'radio_tower'     // 无线电台
  | 'water_collector' // 集水器
  | 'trap'            // 陷阱
  | 'scavenge_post'   // 拾荒站
  | 'greenhouse'      // 温室
  | 'research_desk'   // 研究台
  | 'generator'       // 发电机
  | 'solar_panel'     // 太阳能板
  | 'battery_bank'    // 电池组
  | 'training_ground' // 训练场
  | 'map_room'        // 地图室
  | 'vanguard_camp';  // 先锋营地

/** 建筑效果类型 */
export type BuildingEffectType =
  | 'unlock_job'
  | 'increase_cap'
  | 'efficiency_bonus'
  | 'unlock_recipe'
  | 'unlock_region';

/** 建筑成本 */
export interface BuildingCost {
  level: number;
  resources: ResourceAmount[];
  totalVU: number;
}

/** 建筑效果 */
export interface BuildingEffect {
  level: number;
  type: BuildingEffectType;
  value: string | number;
}

/** 建筑定义 */
export interface Building {
  id: BuildingId;
  name: string;
  nameZh: string;
  maxLevel: number;
  costs: BuildingCost[];
  effects: BuildingEffect[];
  unlockTech?: string;
}

/** 建筑状态 */
export type BuildingState = 'idle' | 'active';

/** 建筑实例状态 */
export interface BuildingInstance {
  level: number;
  state: BuildingState;
}

/** 篝火强度 */
export type BonfireIntensity = 'off' | 'low' | 'medium' | 'high';


// ============================================
// 人口与岗位系统 (Population & Job System)
// ============================================

/** 岗位ID */
export type JobId =
  | 'scavenger'       // 拾荒者 - 15 Scrap/AU = 15 VU/AU
  | 'water_collector' // 集水者 - 3 Water/AU = 15 VU/AU
  | 'hunter'          // 猎人 - 3.6 Food/AU = 15 VU/AU
  | 'engineer'        // 工程师 - 60 Work/AU = 15 VU/AU
  | 'guard'           // 守卫
  | 'scout'           // 斥候
  | 'researcher';     // 研究员

/** 状态效果类型 */
export type StatusEffectType = 'bleed' | 'infection' | 'poisoned' | 'radiation';

/** 状态效果严重程度 */
export type StatusSeverity = 'light' | 'medium' | 'severe';

/** 状态效果 */
export interface StatusEffect {
  type: StatusEffectType;
  severity: StatusSeverity;
  duration?: number; // 剩余AU
}

/** 工人装备槽 */
export interface WorkerEquipment {
  weapon?: string;
  armor?: string;
  tool?: string;
}

/** 工人 */
export interface Worker {
  id: string;
  name: string;
  health: number; // 0-100
  job: JobId | null;
  statuses: StatusEffect[];
  equipment: WorkerEquipment;
}

// ============================================
// 装备系统 (Equipment System)
// ============================================

/** 装备类型 */
export type EquipmentType = 'weapon' | 'armor' | 'tool';

/** 装备属性 */
export interface EquipmentStats {
  atk?: number;
  def?: number;
  efficiency?: number;
  special?: string[];
}

/** 装备定义 */
export interface Equipment {
  id: string;
  type: EquipmentType;
  name: string;
  nameZh: string;
  durability: number;
  maxDurability: number;
  stats: EquipmentStats;
  craftRecipe?: Recipe;
  vu: number;
}

// ============================================
// 探索系统 (Exploration System)
// ============================================

/** 区域层级 */
export type RegionTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

/** 地图节点状态 */
export type MapNodeState = 'undiscovered' | 'discovered' | 'explored' | 'cleared';

/** 战利品条目 */
export interface LootEntry {
  resourceId: ResourceId;
  minAmount: number;
  maxAmount: number;
  probability: number;
}

/** 地图节点 */
export interface MapNode {
  id: string;
  name: string;
  nameZh: string;
  tier: RegionTier;
  distance: number;
  state: MapNodeState;
  riskCoefficient: number;
  lootTable: LootEntry[];
  events: string[];
}

/** 探险队 */
export interface Expedition {
  id: string;
  workerIds: string[];
  targetNodeId: string;
  startDay: number;
  startPhase: Phase;
  estimatedReturnAU: number;
  supplies: {
    water: number;
    food: number;
  };
  status: 'traveling' | 'exploring' | 'returning' | 'completed';
}

/** 先锋营地模块类型 */
export type OutpostModuleType =
  | 'storage'
  | 'workshop'
  | 'infirmary'
  | 'watchtower'
  | 'radio_relay';

/** 先锋营地模块 */
export interface OutpostModule {
  type: OutpostModuleType;
  level: number;
}

/** 先锋营地 */
export interface Outpost {
  id: string;
  nodeId: string;
  level: number;
  stability: number;
  modules: OutpostModule[];
  garrison: string[]; // worker ids
}


// ============================================
// 科技树系统 (Tech Tree System)
// ============================================

/** 科技层级 */
export type TechTier = 'T1' | 'T2' | 'T3' | 'T4';

/** 科技分支 */
export type TechBranch = 'building' | 'agriculture' | 'industry' | 'civic' | 'exploration';

/** 科技解锁类型 */
export type TechUnlockType = 'building' | 'recipe' | 'job' | 'region' | 'feature';

/** 科技解锁 */
export interface TechUnlock {
  type: TechUnlockType;
  id: string;
}

/** 科技定义 */
export interface Technology {
  id: string;
  name: string;
  nameZh: string;
  tier: TechTier;
  branch: TechBranch;
  rpCost: number;
  materialCost?: ResourceAmount[];
  prerequisites: string[];
  unlocks: TechUnlock[];
}

// ============================================
// 战斗系统 (Combat System)
// ============================================

/** 战斗者属性 */
export interface CombatantStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
}

/** 战斗者 */
export interface Combatant {
  id: string;
  name: string;
  isPlayer: boolean;
  stats: CombatantStats;
  statuses: StatusEffect[];
}

/** 战斗状态 */
export interface CombatState {
  id: string;
  turn: number;
  playerTeam: Combatant[];
  enemyTeam: Combatant[];
  log: string[];
  status: 'ongoing' | 'victory' | 'defeat' | 'fled';
}

// ============================================
// 事件系统 (Event System)
// ============================================

/** 事件类型 */
export type EventType =
  | 'resource_discovery'
  | 'wanderer_arrival'
  | 'raid'
  | 'trader_visit'
  | 'weather'
  | 'story_signal'
  | 'death';

/** 事件日志条目 */
export interface EventLogEntry {
  id: string;
  timestamp: {
    day: number;
    phase: Phase;
  };
  type: EventType | 'action' | 'system';
  message: string;
  messageZh: string;
}

// ============================================
// 贸易系统 (Trade System)
// ============================================

/** 商人库存项 */
export interface TraderInventoryItem {
  resourceId: ResourceId;
  amount: number;
  buyPrice: number;  // VU × 1.3
  sellPrice: number; // VU × 0.7
}

/** 商人 */
export interface Trader {
  id: string;
  name: string;
  nameZh: string;
  inventory: TraderInventoryItem[];
  availableUntil: {
    day: number;
    phase: Phase;
  };
}

// ============================================
// 游戏状态 (Game State)
// ============================================

/** 游戏设置 */
export interface GameSettings {
  autoSaveInterval: number; // 秒
  language: 'zh' | 'en';
  soundEnabled: boolean;
  musicEnabled: boolean;
}

/** 人口状态 */
export interface PopulationState {
  workers: Worker[];
  cap: number;
  morale: number; // -5 to +5
}

/** 探索状态 */
export interface ExplorationState {
  mapNodes: MapNode[];
  activeExpedition: Expedition | null;
  outposts: Outpost[];
}

/** 科技状态 */
export interface TechState {
  researched: string[];
  current: string | null;
  progress: number;
}

/** 完整游戏状态 */
export interface GameState {
  // 时间状态
  time: TimeState;
  
  // 资源状态
  resources: Record<ResourceId, number>;
  resourceCaps: Record<ResourceId, number>;
  
  // 建筑状态
  buildings: Record<BuildingId, BuildingInstance>;
  bonfireIntensity: BonfireIntensity;
  
  // 人口状态
  population: PopulationState;
  
  // 岗位分配
  jobs: Record<JobId, string[]>;
  
  // 装备库存
  equipment: Equipment[];
  
  // 探索状态
  exploration: ExplorationState;
  
  // 科技状态
  tech: TechState;
  
  // 贸易状态
  activeTraders: Trader[];
  
  // 战斗状态
  activeCombat: CombatState | null;
  
  // 事件日志
  eventLog: EventLogEntry[];
  
  // 游戏设置
  settings: GameSettings;
}
