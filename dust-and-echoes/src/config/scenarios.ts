/**
 * 开局场景配置数据
 * Starting Scenario Configuration Data
 * 
 * 定义游戏开局场景和初始条件
 * Requirements: 7.2
 */

import type { ResourceId } from '../types';

/**
 * 开局场景接口
 */
export interface StartingScenario {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  startingWorkers: number;
  startingResources: Partial<Record<ResourceId, number>>;
}

/**
 * 开局场景配置数组
 * 
 * 三种开局场景:
 * - 孤独幸存者: 1人，资源均衡
 * - 废墟拾荒者: 2人，废料多但补给少
 * - 避难所遗民: 2人，补给多但材料少
 */
export const STARTING_SCENARIOS: StartingScenario[] = [
  {
    id: 'lone_survivor',
    name: 'Lone Survivor',
    nameZh: '孤独幸存者',
    description: 'One worker with balanced resources',
    descriptionZh: '独自一人，资源均衡',
    startingWorkers: 1,
    startingResources: {
      scrap: 30,
      water: 12,
      food: 12,
      dirty_water: 5,
      wood: 5,
    },
  },
  {
    id: 'scavenger',
    name: 'Scavenger',
    nameZh: '废墟拾荒者',
    description: 'Two workers, rich in scrap but low on supplies',
    descriptionZh: '两人小队，废料丰富但补给紧张',
    startingWorkers: 2,
    startingResources: {
      scrap: 50,
      water: 6,
      food: 6,
      dirty_water: 10,
      wood: 10,
    },
  },
  {
    id: 'shelter_remnant',
    name: 'Shelter Remnant',
    nameZh: '避难所遗民',
    description: 'Two workers with good supplies but little materials',
    descriptionZh: '两人小队，补给充足但材料匮乏',
    startingWorkers: 2,
    startingResources: {
      scrap: 15,
      water: 20,
      food: 20,
      canned_food: 5,
      wood: 3,
    },
  },
];

/**
 * 获取场景配置
 */
export function getScenarioConfig(scenarioId: string): StartingScenario | undefined {
  return STARTING_SCENARIOS.find(s => s.id === scenarioId);
}

/**
 * 获取所有场景ID
 */
export function getAllScenarioIds(): string[] {
  return STARTING_SCENARIOS.map(s => s.id);
}

/**
 * 获取场景中文名
 */
export function getScenarioNameZh(scenarioId: string): string {
  const scenario = getScenarioConfig(scenarioId);
  return scenario?.nameZh ?? scenarioId;
}
