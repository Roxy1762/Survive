/**
 * 游戏状态管理 Store
 * Game State Management Store
 * 
 * Requirements: 8.1, 8.3 - 游戏状态管理和统计追踪
 */

import { create } from 'zustand';

// ============================================
// 类型定义
// Type Definitions
// ============================================

/** 游戏状态 */
export type GameState = 'title' | 'new_game' | 'playing' | 'paused' | 'game_over';

/** 难度等级 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

/** 难度配置 */
export interface DifficultyConfig {
  id: DifficultyLevel;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  modifiers: {
    consumptionMultiplier: number;
    startingResourceMultiplier: number;
    eventDangerMultiplier: number;
  };
}

/** 游戏统计 */
export interface GameStatistics {
  daysSurvived: number;
  totalResourcesGathered: number;
  workersLost: number;
  buildingsConstructed: number;
  causeOfDeath?: string;
}

// ============================================
// 难度配置数据
// Difficulty Configuration Data
// ============================================

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    name: 'Easy',
    nameZh: '简单',
    description: 'Reduced consumption, more starting resources',
    descriptionZh: '降低消耗，更多初始资源',
    modifiers: {
      consumptionMultiplier: 0.8,
      startingResourceMultiplier: 1.5,
      eventDangerMultiplier: 0.7,
    },
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    nameZh: '普通',
    description: 'Standard survival experience',
    descriptionZh: '标准生存体验',
    modifiers: {
      consumptionMultiplier: 1.0,
      startingResourceMultiplier: 1.0,
      eventDangerMultiplier: 1.0,
    },
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    nameZh: '困难',
    description: 'Increased consumption, fewer starting resources',
    descriptionZh: '增加消耗，更少初始资源',
    modifiers: {
      consumptionMultiplier: 1.2,
      startingResourceMultiplier: 0.7,
      eventDangerMultiplier: 1.3,
    },
  },
};

// ============================================
// 默认统计数据
// Default Statistics
// ============================================

const DEFAULT_STATISTICS: GameStatistics = {
  daysSurvived: 0,
  totalResourcesGathered: 0,
  workersLost: 0,
  buildingsConstructed: 0,
};

// ============================================
// Store 接口
// Store Interface
// ============================================

interface GameStateStore {
  // 状态
  gameState: GameState;
  difficulty: DifficultyLevel;
  scenario: string;
  statistics: GameStatistics;
  /** 自动进阶设置 - Requirements: 5.1, 5.5 */
  autoAdvanceEnabled: boolean;
  
  // 状态转换
  setGameState: (state: GameState) => void;
  startNewGame: (difficulty: DifficultyLevel, scenario: string) => void;
  continueGame: () => void;
  triggerGameOver: (cause: string) => void;
  returnToTitle: () => void;
  
  // 统计更新
  incrementDaysSurvived: () => void;
  addResourcesGathered: (amount: number) => void;
  incrementWorkersLost: () => void;
  incrementBuildingsConstructed: () => void;
  
  // 难度获取
  getDifficultyModifiers: () => DifficultyConfig['modifiers'];
  
  // 自动进阶 - Requirements: 5.1
  /** 切换自动进阶设置 */
  toggleAutoAdvance: () => void;
  /** 设置自动进阶状态 */
  setAutoAdvanceEnabled: (enabled: boolean) => void;
  
  // 重置
  resetStatistics: () => void;
  resetGameState: () => void;
}

// ============================================
// Store 实现
// Store Implementation
// ============================================

export const useGameStateStore = create<GameStateStore>((set, get) => ({
  // 初始状态
  gameState: 'title',
  difficulty: 'normal',
  scenario: 'lone_survivor',
  statistics: { ...DEFAULT_STATISTICS },
  /** 自动进阶默认关闭 - Requirements: 5.5 */
  autoAdvanceEnabled: false,
  
  // ============================================
  // 状态转换
  // State Transitions
  // ============================================
  
  setGameState: (state: GameState): void => {
    set({ gameState: state });
  },
  
  startNewGame: (difficulty: DifficultyLevel, scenario: string): void => {
    set({
      gameState: 'playing',
      difficulty,
      scenario,
      statistics: { ...DEFAULT_STATISTICS },
    });
  },
  
  continueGame: (): void => {
    set({ gameState: 'playing' });
  },
  
  triggerGameOver: (cause: string): void => {
    set((state) => ({
      gameState: 'game_over',
      statistics: {
        ...state.statistics,
        causeOfDeath: cause,
      },
    }));
  },
  
  returnToTitle: (): void => {
    set({
      gameState: 'title',
      statistics: { ...DEFAULT_STATISTICS },
    });
  },
  
  // ============================================
  // 统计更新
  // Statistics Updates
  // ============================================
  
  incrementDaysSurvived: (): void => {
    set((state) => ({
      statistics: {
        ...state.statistics,
        daysSurvived: state.statistics.daysSurvived + 1,
      },
    }));
  },
  
  addResourcesGathered: (amount: number): void => {
    set((state) => ({
      statistics: {
        ...state.statistics,
        totalResourcesGathered: state.statistics.totalResourcesGathered + amount,
      },
    }));
  },
  
  incrementWorkersLost: (): void => {
    set((state) => ({
      statistics: {
        ...state.statistics,
        workersLost: state.statistics.workersLost + 1,
      },
    }));
  },
  
  incrementBuildingsConstructed: (): void => {
    set((state) => ({
      statistics: {
        ...state.statistics,
        buildingsConstructed: state.statistics.buildingsConstructed + 1,
      },
    }));
  },
  
  // ============================================
  // 难度获取
  // Difficulty Getters
  // ============================================
  
  getDifficultyModifiers: (): DifficultyConfig['modifiers'] => {
    const { difficulty } = get();
    return DIFFICULTY_CONFIGS[difficulty].modifiers;
  },
  
  // ============================================
  // 自动进阶
  // Auto-Advance - Requirements: 5.1
  // ============================================
  
  toggleAutoAdvance: (): void => {
    set((state) => ({
      autoAdvanceEnabled: !state.autoAdvanceEnabled,
    }));
  },
  
  setAutoAdvanceEnabled: (enabled: boolean): void => {
    set({ autoAdvanceEnabled: enabled });
  },
  
  // ============================================
  // 重置
  // Reset
  // ============================================
  
  resetStatistics: (): void => {
    set({ statistics: { ...DEFAULT_STATISTICS } });
  },
  
  resetGameState: (): void => {
    set({
      gameState: 'title',
      difficulty: 'normal',
      scenario: 'lone_survivor',
      statistics: { ...DEFAULT_STATISTICS },
      autoAdvanceEnabled: false, // Reset to default (off) - Requirements: 5.5
    });
  },
}));
