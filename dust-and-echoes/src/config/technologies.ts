/**
 * 科技树配置数据
 * Technology Tree Configuration Data
 * 
 * 所有科技的前置条件和解锁内容
 * Requirements: 8.1, 8.2
 */

import type { Technology } from '../types';

/**
 * 科技树配置数组
 * 
 * 层级: T1(生存) → T2(加工) → T3(稳定供给) → T4(旧世界技术)
 * 分支: building(建筑), agriculture(农业), industry(工业), civic(民生), exploration(探索)
 */
export const TECHNOLOGIES: Technology[] = [
  // ============================================
  // T1 - 生存与组织 (Survival & Organization)
  // Requirements: 8.1
  // ============================================
  {
    id: 'basic_division',
    name: 'Basic Division',
    nameZh: '基础分工',
    tier: 'T1',
    branch: 'civic',
    rpCost: 40,
    prerequisites: [],
    unlocks: [
      { type: 'feature', id: 'job_assignment' },
    ],
  },
  {
    id: 'simple_storage',
    name: 'Simple Storage',
    nameZh: '简易仓储',
    tier: 'T1',
    branch: 'building',
    rpCost: 60,
    prerequisites: ['basic_division'],
    unlocks: [
      { type: 'building', id: 'warehouse' },
    ],
  },
  {
    id: 'workshop_basics',
    name: 'Workshop Basics',
    nameZh: '工坊基础',
    tier: 'T1',
    branch: 'industry',
    rpCost: 90,
    prerequisites: ['basic_division'],
    unlocks: [
      { type: 'building', id: 'workshop' },
      { type: 'recipe', id: 'craft_wood' },
      { type: 'recipe', id: 'craft_metal' },
    ],
  },
  {
    id: 'basic_trapping',
    name: 'Basic Trapping',
    nameZh: '基础陷阱',
    tier: 'T1',
    branch: 'agriculture',
    rpCost: 50,
    prerequisites: [],
    unlocks: [
      { type: 'building', id: 'trap' },
      { type: 'job', id: 'hunter' },
    ],
  },
  {
    id: 'water_collection',
    name: 'Water Collection',
    nameZh: '集水技术',
    tier: 'T1',
    branch: 'building',
    rpCost: 50,
    prerequisites: [],
    unlocks: [
      { type: 'building', id: 'water_collector' },
      { type: 'job', id: 'water_collector' },
    ],
  },
  {
    id: 'scavenging',
    name: 'Scavenging',
    nameZh: '拾荒技术',
    tier: 'T1',
    branch: 'exploration',
    rpCost: 30,
    prerequisites: [],
    unlocks: [
      { type: 'building', id: 'scavenge_post' },
      { type: 'job', id: 'scavenger' },
    ],
  },

  // ============================================
  // T2 - 加工与通讯 (Processing & Communication)
  // Requirements: 8.1, 8.2
  // ============================================
  {
    id: 'salvage_recycling',
    name: 'Salvage & Recycling',
    nameZh: '拆解与回收',
    tier: 'T2',
    branch: 'industry',
    rpCost: 180,
    prerequisites: ['workshop_basics'],
    unlocks: [
      { type: 'recipe', id: 'craft_cloth' },
      { type: 'recipe', id: 'craft_leather' },
      { type: 'recipe', id: 'craft_plastic' },
      { type: 'recipe', id: 'craft_glass' },
      { type: 'recipe', id: 'craft_rubber' },
      { type: 'feature', id: 'salvage' },
    ],
  },
  {
    id: 'simple_radio',
    name: 'Simple Radio',
    nameZh: '简易无线电',
    tier: 'T2',
    branch: 'exploration',
    rpCost: 240,
    prerequisites: ['salvage_recycling'],
    materialCost: [
      { resourceId: 'wire', amount: 4 },
    ],
    unlocks: [
      { type: 'building', id: 'radio_tower' },
      { type: 'feature', id: 'trade' },
    ],
  },
  {
    id: 'food_preservation',
    name: 'Food Preservation',
    nameZh: '食物保存',
    tier: 'T2',
    branch: 'agriculture',
    rpCost: 150,
    prerequisites: ['basic_trapping'],
    unlocks: [
      { type: 'recipe', id: 'cook_meat' },
      { type: 'recipe', id: 'cook_vegetables' },
      { type: 'feature', id: 'food_processing' },
    ],
  },
  {
    id: 'water_purification',
    name: 'Water Purification',
    nameZh: '净水技术',
    tier: 'T2',
    branch: 'building',
    rpCost: 160,
    prerequisites: ['water_collection'],
    unlocks: [
      { type: 'recipe', id: 'purify_water' },
      { type: 'recipe', id: 'craft_filter' },
    ],
  },
  {
    id: 'basic_chemistry',
    name: 'Basic Chemistry',
    nameZh: '基础化学',
    tier: 'T2',
    branch: 'industry',
    rpCost: 200,
    prerequisites: ['salvage_recycling'],
    unlocks: [
      { type: 'recipe', id: 'craft_solvent' },
      { type: 'recipe', id: 'craft_acid' },
    ],
  },
  {
    id: 'component_assembly',
    name: 'Component Assembly',
    nameZh: '组件装配',
    tier: 'T2',
    branch: 'industry',
    rpCost: 180,
    prerequisites: ['workshop_basics'],
    unlocks: [
      { type: 'recipe', id: 'craft_gear' },
      { type: 'recipe', id: 'craft_pipe' },
      { type: 'recipe', id: 'craft_spring' },
      { type: 'recipe', id: 'craft_bearing' },
      { type: 'recipe', id: 'craft_fasteners' },
    ],
  },
  {
    id: 'research_method',
    name: 'Research Method',
    nameZh: '研究方法',
    tier: 'T2',
    branch: 'civic',
    rpCost: 200,
    prerequisites: ['basic_division'],
    unlocks: [
      { type: 'building', id: 'research_desk' },
      { type: 'job', id: 'researcher' },
    ],
  },

  // ============================================
  // T3 - 稳定供给与先锋体系 (Stable Supply & Vanguard)
  // Requirements: 8.1, 8.2
  // ============================================
  {
    id: 'militia_training',
    name: 'Militia Training',
    nameZh: '民兵训练',
    tier: 'T3',
    branch: 'civic',
    rpCost: 350,
    prerequisites: ['research_method'],
    unlocks: [
      { type: 'building', id: 'training_ground' },
      { type: 'job', id: 'guard' },
    ],
  },
  {
    id: 'cartography',
    name: 'Cartography',
    nameZh: '制图学',
    tier: 'T3',
    branch: 'exploration',
    rpCost: 300,
    prerequisites: ['simple_radio'],
    unlocks: [
      { type: 'building', id: 'map_room' },
      { type: 'feature', id: 'map_view' },
    ],
  },
  {
    id: 'vanguard_camp_1',
    name: 'Vanguard Camp I',
    nameZh: '先锋营地 I',
    tier: 'T3',
    branch: 'exploration',
    rpCost: 700,
    prerequisites: ['militia_training', 'cartography'],
    materialCost: [
      { resourceId: 'metal', amount: 30 },
    ],
    unlocks: [
      { type: 'building', id: 'vanguard_camp' },
      { type: 'feature', id: 'outpost_l1' },
    ],
  },
  {
    id: 'greenhouse_tech',
    name: 'Greenhouse Technology',
    nameZh: '温室技术',
    tier: 'T3',
    branch: 'agriculture',
    rpCost: 450,
    prerequisites: ['food_preservation', 'water_purification'],
    materialCost: [
      { resourceId: 'glass', amount: 10 },
    ],
    unlocks: [
      { type: 'building', id: 'greenhouse' },
      { type: 'feature', id: 'farming' },
    ],
  },
  {
    id: 'explosives',
    name: 'Explosives',
    nameZh: '爆炸物',
    tier: 'T3',
    branch: 'industry',
    rpCost: 400,
    prerequisites: ['basic_chemistry'],
    unlocks: [
      { type: 'recipe', id: 'craft_gunpowder' },
      { type: 'feature', id: 'demolition' },
    ],
  },
  {
    id: 'fuel_refining',
    name: 'Fuel Refining',
    nameZh: '燃料精炼',
    tier: 'T3',
    branch: 'industry',
    rpCost: 500,
    prerequisites: ['basic_chemistry'],
    unlocks: [
      { type: 'recipe', id: 'craft_fuel' },
    ],
  },
  {
    id: 'advanced_scouting',
    name: 'Advanced Scouting',
    nameZh: '高级侦察',
    tier: 'T3',
    branch: 'exploration',
    rpCost: 400,
    prerequisites: ['militia_training'],
    unlocks: [
      { type: 'job', id: 'scout' },
      { type: 'feature', id: 'scouting' },
    ],
  },

  // ============================================
  // T4 - 旧世界技术 (Old World Technology)
  // Requirements: 8.1, 8.2
  // ============================================
  {
    id: 'chip_decoding',
    name: 'Chip Decoding',
    nameZh: '芯片解码',
    tier: 'T4',
    branch: 'industry',
    rpCost: 1400,
    prerequisites: ['research_method', 'simple_radio'],
    materialCost: [
      { resourceId: 'microchips', amount: 1 },
    ],
    unlocks: [
      { type: 'feature', id: 'advanced_tech' },
    ],
  },
  {
    id: 'power_generation',
    name: 'Power Generation',
    nameZh: '发电技术',
    tier: 'T4',
    branch: 'industry',
    rpCost: 1200,
    prerequisites: ['fuel_refining', 'component_assembly'],
    materialCost: [
      { resourceId: 'gear', amount: 5 },
      { resourceId: 'wire', amount: 10 },
    ],
    unlocks: [
      { type: 'building', id: 'generator' },
      { type: 'feature', id: 'power' },
    ],
  },
  {
    id: 'battery_tech',
    name: 'Battery Technology',
    nameZh: '电池技术',
    tier: 'T4',
    branch: 'industry',
    rpCost: 1000,
    prerequisites: ['basic_chemistry', 'component_assembly'],
    materialCost: [
      { resourceId: 'acid', amount: 2 },
    ],
    unlocks: [
      { type: 'recipe', id: 'craft_battery_cell' },
      { type: 'recipe', id: 'craft_battery_pack' },
    ],
  },
  {
    id: 'energy_storage',
    name: 'Energy Storage',
    nameZh: '能源存储',
    tier: 'T4',
    branch: 'industry',
    rpCost: 1100,
    prerequisites: ['battery_tech', 'power_generation'],
    materialCost: [
      { resourceId: 'battery_pack', amount: 2 },
    ],
    unlocks: [
      { type: 'building', id: 'battery_bank' },
    ],
  },
  {
    id: 'solar_power',
    name: 'Solar Power',
    nameZh: '太阳能',
    tier: 'T4',
    branch: 'industry',
    rpCost: 1500,
    prerequisites: ['power_generation'],
    materialCost: [
      { resourceId: 'solar_cell', amount: 2 },
      { resourceId: 'microchips', amount: 1 },
    ],
    unlocks: [
      { type: 'building', id: 'solar_panel' },
    ],
  },
  {
    id: 'vanguard_camp_2',
    name: 'Vanguard Camp II',
    nameZh: '先锋营地 II',
    tier: 'T4',
    branch: 'exploration',
    rpCost: 1200,
    prerequisites: ['vanguard_camp_1'],
    materialCost: [
      { resourceId: 'metal', amount: 60 },
      { resourceId: 'radio_parts', amount: 2 },
    ],
    unlocks: [
      { type: 'feature', id: 'outpost_l2' },
    ],
  },
  {
    id: 'advanced_medicine',
    name: 'Advanced Medicine',
    nameZh: '高级医疗',
    tier: 'T4',
    branch: 'civic',
    rpCost: 1300,
    prerequisites: ['research_method', 'basic_chemistry'],
    materialCost: [
      { resourceId: 'meds', amount: 1 },
    ],
    unlocks: [
      { type: 'feature', id: 'advanced_healing' },
    ],
  },
  {
    id: 'deep_exploration',
    name: 'Deep Exploration',
    nameZh: '深层探索',
    tier: 'T4',
    branch: 'exploration',
    rpCost: 1600,
    prerequisites: ['vanguard_camp_2', 'advanced_scouting'],
    materialCost: [
      { resourceId: 'data_tape', amount: 2 },
    ],
    unlocks: [
      { type: 'region', id: 'T4' },
      { type: 'region', id: 'T5' },
    ],
  },
];

/**
 * 根据ID获取科技
 */
export function getTechnologyById(id: string): Technology | undefined {
  return TECHNOLOGIES.find(t => t.id === id);
}

/**
 * 获取特定层级的科技
 */
export function getTechnologiesByTier(tier: string): Technology[] {
  return TECHNOLOGIES.filter(t => t.tier === tier);
}

/**
 * 获取特定分支的科技
 */
export function getTechnologiesByBranch(branch: string): Technology[] {
  return TECHNOLOGIES.filter(t => t.branch === branch);
}

/**
 * 检查科技前置条件是否满足
 */
export function checkPrerequisites(techId: string, researchedTechs: string[]): boolean {
  const tech = getTechnologyById(techId);
  if (!tech) return false;
  return tech.prerequisites.every(prereq => researchedTechs.includes(prereq));
}

/**
 * 获取可研究的科技列表
 */
export function getAvailableTechnologies(researchedTechs: string[]): Technology[] {
  return TECHNOLOGIES.filter(tech => {
    // 已研究的不可再研究
    if (researchedTechs.includes(tech.id)) return false;
    // 检查前置条件
    return checkPrerequisites(tech.id, researchedTechs);
  });
}

/**
 * 获取科技解锁的内容
 */
export function getTechUnlocks(techId: string) {
  const tech = getTechnologyById(techId);
  return tech?.unlocks ?? [];
}

/**
 * 计算科技总RP成本
 */
export function getTotalRPCost(techIds: string[]): number {
  return techIds.reduce((sum, id) => {
    const tech = getTechnologyById(id);
    return sum + (tech?.rpCost ?? 0);
  }, 0);
}
