/**
 * 难度配置数据
 * Difficulty Configuration Data
 * 
 * 定义游戏难度等级和对应的修正值
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

/**
 * 难度等级类型
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

/**
 * 难度修正值接口
 */
export interface DifficultyModifiers {
  /** 资源消耗倍率 */
  consumptionMultiplier: number;
  /** 初始资源倍率 */
  startingResourceMultiplier: number;
  /** 事件危险倍率 */
  eventDangerMultiplier: number;
}

/**
 * 难度配置接口
 */
export interface DifficultyConfig {
  id: DifficultyLevel;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  modifiers: DifficultyModifiers;
}

/**
 * 难度配置常量
 * 
 * Easy: 降低消耗，更多初始资源，降低事件危险
 * Normal: 标准体验，无修正
 * Hard: 增加消耗，更少初始资源，增加事件危险
 */
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

/**
 * 获取难度配置
 */
export function getDifficultyConfig(level: DifficultyLevel): DifficultyConfig {
  return DIFFICULTY_CONFIGS[level];
}

/**
 * 获取难度修正值
 */
export function getDifficultyModifiers(level: DifficultyLevel): DifficultyModifiers {
  return DIFFICULTY_CONFIGS[level].modifiers;
}

/**
 * 获取所有难度等级
 */
export function getAllDifficultyLevels(): DifficultyLevel[] {
  return Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[];
}

/**
 * 获取难度中文名
 */
export function getDifficultyNameZh(level: DifficultyLevel): string {
  return DIFFICULTY_CONFIGS[level].nameZh;
}
