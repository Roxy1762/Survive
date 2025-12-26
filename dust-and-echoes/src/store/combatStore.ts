/**
 * 战斗系统状态管理
 * Combat System State Management
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { create } from 'zustand';
import type { 
  CombatState, 
  Combatant, 
  CombatantStats,
  StatusEffect,
  ResourceId,
  LootEntry
} from '../types';
import { getWeaponConfig, getArmorConfig } from '../config/equipment';

// ============================================
// 常量定义
// Constants
// ============================================

/** 最小伤害值 */
export const MIN_DAMAGE = 1;

/** 伤害随机范围 */
export const DAMAGE_RANDOM_RANGE = [-1, 0, 1] as const;

/** 战力公式系数 */
export const COMBAT_POWER_COEFFICIENTS = {
  atk: 1.0,
  def: 0.7,
  hp: 0.3,
  hpDivisor: 10,
} as const;

/** 区域难度基础值 */
export const REGION_DIFFICULTY_BASE = 6;

/** 区域难度距离系数 */
export const REGION_DIFFICULTY_DISTANCE_COEFFICIENT = 1.5;

/** 胜率公式系数 */
export const WIN_PROBABILITY_COEFFICIENT = 2.5;

// ============================================
// 战斗计算函数
// Combat Calculation Functions
// ============================================

/**
 * 计算伤害
 * Requirements: 7.2
 * 公式: Damage = max(1, ATK - DEF + Random(-1, 0, 1))
 * 
 * @param atk 攻击者攻击力
 * @param def 防御者防御力
 * @param randomValue 随机值 (-1, 0, 或 1)，如果不提供则随机生成
 * @returns 伤害值
 */
export function calculateDamage(atk: number, def: number, randomValue?: number): number {
  const randomIndex = Math.floor(Math.random() * DAMAGE_RANDOM_RANGE.length);
  const random = randomValue ?? DAMAGE_RANDOM_RANGE[randomIndex] ?? 0;
  const damage = atk - def + random;
  return Math.max(MIN_DAMAGE, damage);
}

/**
 * 计算战力 (Combat Power)
 * Requirements: 7.3
 * 公式: CP = ATK + 0.7 × DEF + 0.3 × (HP/10)
 * 
 * @param atk 攻击力
 * @param def 防御力
 * @param hp 当前生命值
 * @returns 战力值
 */
export function calculateCombatPower(atk: number, def: number, hp: number): number {
  const { atk: atkCoef, def: defCoef, hp: hpCoef, hpDivisor } = COMBAT_POWER_COEFFICIENTS;
  return atk * atkCoef + def * defCoef + (hp / hpDivisor) * hpCoef;
}

/**
 * 计算区域难度 (Difficulty Class)
 * Requirements: 7.4
 * 公式: DC = 6 + 1.5 × distance
 * 
 * @param distance 距离基地的距离
 * @returns 难度值
 */
export function calculateRegionDifficulty(distance: number): number {
  return REGION_DIFFICULTY_BASE + REGION_DIFFICULTY_DISTANCE_COEFFICIENT * distance;
}

/**
 * 计算胜率
 * Requirements: 7.5
 * 公式: P(win) = 1 / (1 + e^(-(CP-DC)/2.5))
 * 
 * @param combatPower 战力
 * @param difficulty 难度
 * @returns 胜率 (0-1)
 */
export function calculateWinProbability(combatPower: number, difficulty: number): number {
  const exponent = -(combatPower - difficulty) / WIN_PROBABILITY_COEFFICIENT;
  return 1 / (1 + Math.exp(exponent));
}


// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 生成唯一战斗ID
 */
export function generateCombatId(): string {
  return `combat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 生成唯一战斗者ID
 */
export function generateCombatantId(): string {
  return `combatant_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 从工人创建战斗者
 * 
 * @param workerId 工人ID
 * @param workerName 工人名称
 * @param health 当前健康值
 * @param weaponId 武器ID（可选）
 * @param armorId 护甲ID（可选）
 * @returns 战斗者
 */
export function createCombatantFromWorker(
  workerId: string,
  workerName: string,
  health: number,
  weaponId?: string,
  armorId?: string
): Combatant {
  // 基础属性
  let atk = 1; // 基础攻击力
  let def = 0; // 基础防御力
  
  // 武器加成
  if (weaponId) {
    const weapon = getWeaponConfig(weaponId);
    if (weapon?.atk) {
      atk += weapon.atk;
    }
  }
  
  // 护甲加成
  if (armorId) {
    const armor = getArmorConfig(armorId);
    if (armor?.def) {
      def += armor.def;
    }
  }
  
  return {
    id: workerId,
    name: workerName,
    isPlayer: true,
    stats: {
      hp: health,
      maxHp: 100,
      atk,
      def,
    },
    statuses: [],
  };
}

/**
 * 创建敌人战斗者
 * 
 * @param name 敌人名称
 * @param stats 敌人属性
 * @returns 战斗者
 */
export function createEnemyCombatant(
  name: string,
  stats: CombatantStats
): Combatant {
  return {
    id: generateCombatantId(),
    name,
    isPlayer: false,
    stats: { ...stats },
    statuses: [],
  };
}

/**
 * 检查战斗者是否存活
 */
export function isCombatantAlive(combatant: Combatant): boolean {
  return combatant.stats.hp > 0;
}

/**
 * 检查队伍是否全灭
 */
export function isTeamDefeated(team: Combatant[]): boolean {
  return team.every(c => !isCombatantAlive(c));
}

/**
 * 获取存活的战斗者
 */
export function getAliveCombatants(team: Combatant[]): Combatant[] {
  return team.filter(isCombatantAlive);
}

/**
 * 计算队伍总战力
 */
export function calculateTeamCombatPower(team: Combatant[]): number {
  return team.reduce((total, combatant) => {
    if (!isCombatantAlive(combatant)) return total;
    return total + calculateCombatPower(
      combatant.stats.atk,
      combatant.stats.def,
      combatant.stats.hp
    );
  }, 0);
}

// ============================================
// 战斗结算类型
// Combat Resolution Types
// ============================================

/** 战斗结果 */
export interface CombatResult {
  victory: boolean;
  fled: boolean;
  playerCasualties: {
    combatantId: string;
    healthLost: number;
    died: boolean;
    statusesGained: StatusEffect[];
  }[];
  enemiesDefeated: string[];
  loot: { resourceId: ResourceId; amount: number }[];
  durabilityLoss: { equipmentId: string; loss: number }[];
}

/** 战斗回合结果 */
export interface TurnResult {
  attacker: string;
  defender: string;
  damage: number;
  defenderHpAfter: number;
  defenderDied: boolean;
  message: string;
}


// ============================================
// 战斗Store接口
// Combat Store Interface
// ============================================

interface CombatStore {
  // 状态
  activeCombat: CombatState | null;
  lastCombatResult: CombatResult | null;
  
  // 战斗初始化
  /** 开始战斗 */
  startCombat: (playerTeam: Combatant[], enemyTeam: Combatant[]) => string;
  /** 结束战斗 */
  endCombat: () => void;
  
  // 战斗操作
  /** 执行一个回合 */
  executeTurn: () => TurnResult | null;
  /** 执行完整战斗（自动战斗） */
  executeFullCombat: () => CombatResult;
  /** 尝试逃跑 */
  attemptFlee: (fleeChance?: number) => boolean;
  
  // 伤害计算
  /** 计算伤害 */
  calculateDamage: (attackerId: string, defenderId: string) => number;
  /** 应用伤害 */
  applyDamage: (combatantId: string, damage: number) => void;
  
  // 状态查询
  /** 获取当前战斗状态 */
  getCombatState: () => CombatState | null;
  /** 检查战斗是否结束 */
  isCombatOver: () => boolean;
  /** 获取战斗日志 */
  getCombatLog: () => string[];
  
  // 战力计算
  /** 计算战斗者战力 */
  getCombatantPower: (combatantId: string) => number;
  /** 计算队伍战力 */
  getTeamPower: (isPlayerTeam: boolean) => number;
  
  // 战斗结算
  /** 结算战斗结果 */
  resolveCombat: (lootTable?: LootEntry[]) => CombatResult;
  
  // 重置
  /** 重置战斗状态 */
  resetCombat: () => void;
}

/**
 * 战斗状态Store
 */
export const useCombatStore = create<CombatStore>((set, get) => ({
  // 初始状态
  activeCombat: null,
  lastCombatResult: null,
  
  // ============================================
  // 战斗初始化
  // ============================================
  
  startCombat: (playerTeam: Combatant[], enemyTeam: Combatant[]): string => {
    const combatId = generateCombatId();
    
    const combatState: CombatState = {
      id: combatId,
      turn: 0,
      playerTeam: playerTeam.map(c => ({ ...c, stats: { ...c.stats } })),
      enemyTeam: enemyTeam.map(c => ({ ...c, stats: { ...c.stats } })),
      log: ['战斗开始！'],
      status: 'ongoing',
    };
    
    set({ activeCombat: combatState });
    return combatId;
  },
  
  endCombat: (): void => {
    set({ activeCombat: null });
  },
  
  // ============================================
  // 战斗操作
  // ============================================
  
  executeTurn: (): TurnResult | null => {
    const state = get();
    if (!state.activeCombat || state.activeCombat.status !== 'ongoing') {
      return null;
    }
    
    const combat = state.activeCombat;
    const alivePlayers = getAliveCombatants(combat.playerTeam);
    const aliveEnemies = getAliveCombatants(combat.enemyTeam);
    
    // 检查战斗是否已结束
    if (alivePlayers.length === 0 || aliveEnemies.length === 0) {
      return null;
    }
    
    // 确定攻击者和防御者（简单轮流制）
    const isPlayerTurn = combat.turn % 2 === 0;
    const attackerTeam = isPlayerTurn ? alivePlayers : aliveEnemies;
    const defenderTeam = isPlayerTurn ? aliveEnemies : alivePlayers;
    
    // 选择攻击者和防御者（第一个存活的）
    const attacker = attackerTeam[0];
    const defender = defenderTeam[0];
    
    if (!attacker || !defender) {
      return null;
    }
    
    // 计算伤害
    const damage = calculateDamage(attacker.stats.atk, defender.stats.def);
    const newHp = Math.max(0, defender.stats.hp - damage);
    const died = newHp === 0;
    
    // 生成消息
    const message = `${attacker.name} 攻击 ${defender.name}，造成 ${damage} 点伤害${died ? '，击杀！' : ''}`;
    
    const result: TurnResult = {
      attacker: attacker.id,
      defender: defender.id,
      damage,
      defenderHpAfter: newHp,
      defenderDied: died,
      message,
    };
    
    // 更新状态
    set((state) => {
      if (!state.activeCombat) return state;
      
      const updateTeam = (team: Combatant[]) => 
        team.map(c => c.id === defender.id 
          ? { ...c, stats: { ...c.stats, hp: newHp } }
          : c
        );
      
      const newPlayerTeam = isPlayerTurn ? combat.playerTeam : updateTeam(combat.playerTeam);
      const newEnemyTeam = isPlayerTurn ? updateTeam(combat.enemyTeam) : combat.enemyTeam;
      
      // 检查战斗是否结束
      let newStatus = combat.status;
      if (isTeamDefeated(newEnemyTeam)) {
        newStatus = 'victory';
      } else if (isTeamDefeated(newPlayerTeam)) {
        newStatus = 'defeat';
      }
      
      return {
        activeCombat: {
          ...combat,
          turn: combat.turn + 1,
          playerTeam: newPlayerTeam,
          enemyTeam: newEnemyTeam,
          log: [...combat.log, message],
          status: newStatus,
        },
      };
    });
    
    return result;
  },
  
  executeFullCombat: (): CombatResult => {
    const state = get();
    
    // 执行所有回合直到战斗结束
    while (!state.isCombatOver()) {
      state.executeTurn();
    }
    
    return state.resolveCombat();
  },
  
  attemptFlee: (fleeChance: number = 0.3): boolean => {
    const state = get();
    if (!state.activeCombat || state.activeCombat.status !== 'ongoing') {
      return false;
    }
    
    const success = Math.random() < fleeChance;
    
    set((state) => {
      if (!state.activeCombat) return state;
      
      const message = success ? '成功逃跑！' : '逃跑失败！';
      
      return {
        activeCombat: {
          ...state.activeCombat,
          log: [...state.activeCombat.log, message],
          status: success ? 'fled' : state.activeCombat.status,
        },
      };
    });
    
    return success;
  },
  
  // ============================================
  // 伤害计算
  // ============================================
  
  calculateDamage: (attackerId: string, defenderId: string): number => {
    const state = get();
    if (!state.activeCombat) return 0;
    
    const allCombatants = [...state.activeCombat.playerTeam, ...state.activeCombat.enemyTeam];
    const attacker = allCombatants.find(c => c.id === attackerId);
    const defender = allCombatants.find(c => c.id === defenderId);
    
    if (!attacker || !defender) return 0;
    
    return calculateDamage(attacker.stats.atk, defender.stats.def);
  },
  
  applyDamage: (combatantId: string, damage: number): void => {
    set((state) => {
      if (!state.activeCombat) return state;
      
      const updateTeam = (team: Combatant[]) =>
        team.map(c => c.id === combatantId
          ? { ...c, stats: { ...c.stats, hp: Math.max(0, c.stats.hp - damage) } }
          : c
        );
      
      return {
        activeCombat: {
          ...state.activeCombat,
          playerTeam: updateTeam(state.activeCombat.playerTeam),
          enemyTeam: updateTeam(state.activeCombat.enemyTeam),
        },
      };
    });
  },
  
  // ============================================
  // 状态查询
  // ============================================
  
  getCombatState: (): CombatState | null => {
    return get().activeCombat;
  },
  
  isCombatOver: (): boolean => {
    const combat = get().activeCombat;
    if (!combat) return true;
    return combat.status !== 'ongoing';
  },
  
  getCombatLog: (): string[] => {
    return get().activeCombat?.log ?? [];
  },
  
  // ============================================
  // 战力计算
  // ============================================
  
  getCombatantPower: (combatantId: string): number => {
    const state = get();
    if (!state.activeCombat) return 0;
    
    const allCombatants = [...state.activeCombat.playerTeam, ...state.activeCombat.enemyTeam];
    const combatant = allCombatants.find(c => c.id === combatantId);
    
    if (!combatant) return 0;
    
    return calculateCombatPower(
      combatant.stats.atk,
      combatant.stats.def,
      combatant.stats.hp
    );
  },
  
  getTeamPower: (isPlayerTeam: boolean): number => {
    const state = get();
    if (!state.activeCombat) return 0;
    
    const team = isPlayerTeam ? state.activeCombat.playerTeam : state.activeCombat.enemyTeam;
    return calculateTeamCombatPower(team);
  },
  
  // ============================================
  // 战斗结算
  // Requirements: 7.6
  // ============================================
  
  resolveCombat: (lootTable?: LootEntry[]): CombatResult => {
    const state = get();
    const combat = state.activeCombat;
    
    if (!combat) {
      return {
        victory: false,
        fled: false,
        playerCasualties: [],
        enemiesDefeated: [],
        loot: [],
        durabilityLoss: [],
      };
    }
    
    const victory = combat.status === 'victory';
    const fled = combat.status === 'fled';
    
    // 计算玩家伤亡
    const playerCasualties = combat.playerTeam.map(combatant => {
      const originalHp = 100; // 假设初始满血
      const healthLost = originalHp - combatant.stats.hp;
      const died = combatant.stats.hp === 0;
      
      // 战斗中可能获得的状态效果（简化：受伤可能流血）
      const statusesGained: StatusEffect[] = [];
      if (healthLost > 30 && Math.random() < 0.3) {
        statusesGained.push({ type: 'bleed', severity: 'light' });
      }
      
      return {
        combatantId: combatant.id,
        healthLost,
        died,
        statusesGained,
      };
    }).filter(c => c.healthLost > 0 || c.died);
    
    // 击败的敌人
    const enemiesDefeated = combat.enemyTeam
      .filter(e => e.stats.hp === 0)
      .map(e => e.id);
    
    // 生成战利品（仅胜利时）
    const loot: { resourceId: ResourceId; amount: number }[] = [];
    if (victory && lootTable) {
      for (const entry of lootTable) {
        if (Math.random() < entry.probability) {
          const amount = Math.floor(
            entry.minAmount + Math.random() * (entry.maxAmount - entry.minAmount + 1)
          );
          if (amount > 0) {
            loot.push({ resourceId: entry.resourceId, amount });
          }
        }
      }
    }
    
    // 装备耐久损耗（每次战斗消耗1点耐久）
    const durabilityLoss: { equipmentId: string; loss: number }[] = [];
    // 这里需要与装备系统集成，暂时返回空数组
    
    const result: CombatResult = {
      victory,
      fled,
      playerCasualties,
      enemiesDefeated,
      loot,
      durabilityLoss,
    };
    
    set({ lastCombatResult: result });
    
    return result;
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetCombat: (): void => {
    set({
      activeCombat: null,
      lastCombatResult: null,
    });
  },
}));
