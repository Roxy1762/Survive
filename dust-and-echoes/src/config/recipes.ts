/**
 * 配方配置数据
 * Recipe Configuration Data
 * 
 * 所有制造配方定义
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type { Recipe, ResourceId } from '../types';

/**
 * 配方配置数组
 * 
 * Work价值: 1 Work = 0.25 VU
 * 配方VU = 输入材料VU总和 + Work × 0.25
 */
export const RECIPES: Recipe[] = [
  // ============================================
  // 基础材料配方 (Basic Material Recipes)
  // Requirements: 5.1
  // ============================================
  {
    id: 'craft_wood',
    name: 'Craft Wood',
    nameZh: '制作木材',
    output: { resourceId: 'wood', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 4 }],
    workRequired: 16, // 4 VU work
    // Total: 4 Scrap (4 VU) + 16 Work (4 VU) = 8 VU
  },
  {
    id: 'craft_metal',
    name: 'Craft Metal',
    nameZh: '制作金属',
    output: { resourceId: 'metal', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 8 }],
    workRequired: 32, // 8 VU work
    // Total: 8 Scrap (8 VU) + 32 Work (8 VU) = 16 VU
  },

  // ============================================
  // 材料配方 (Material Recipes)
  // Requirements: 5.2
  // ============================================
  {
    id: 'craft_cloth',
    name: 'Craft Cloth',
    nameZh: '制作布料',
    output: { resourceId: 'cloth', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 3 }],
    workRequired: 8, // 2 VU work
    // Total: 3 Scrap (3 VU) + 8 Work (2 VU) = 5 VU
  },
  {
    id: 'craft_leather',
    name: 'Craft Leather',
    nameZh: '制作皮革',
    output: { resourceId: 'leather', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 4 }],
    workRequired: 12, // 3 VU work
    // Total: 4 Scrap (4 VU) + 12 Work (3 VU) = 7 VU
  },
  {
    id: 'craft_plastic',
    name: 'Craft Plastic',
    nameZh: '制作塑料',
    output: { resourceId: 'plastic', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 4 }],
    workRequired: 12, // 3 VU work
    // Total: 4 Scrap (4 VU) + 12 Work (3 VU) = 7 VU
  },
  {
    id: 'craft_glass',
    name: 'Craft Glass',
    nameZh: '制作玻璃',
    output: { resourceId: 'glass', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 4 }],
    workRequired: 12, // 3 VU work
    // Total: 4 Scrap (4 VU) + 12 Work (3 VU) = 7 VU
  },
  {
    id: 'craft_rubber',
    name: 'Craft Rubber',
    nameZh: '制作橡胶',
    output: { resourceId: 'rubber', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 5 }],
    workRequired: 16, // 4 VU work
    // Total: 5 Scrap (5 VU) + 16 Work (4 VU) = 9 VU
  },
  {
    id: 'craft_wire',
    name: 'Craft Wire',
    nameZh: '制作线材',
    output: { resourceId: 'wire', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 6 }],
    workRequired: 20, // 5 VU work
    // Total: 6 Scrap (6 VU) + 20 Work (5 VU) = 11 VU
  },
  {
    id: 'craft_rope',
    name: 'Craft Rope',
    nameZh: '制作绳索',
    output: { resourceId: 'rope', amount: 1 },
    inputs: [{ resourceId: 'cloth', amount: 1 }],
    workRequired: 8, // 2 VU work
    // Total: 1 Cloth (5 VU) + 8 Work (2 VU) = 7 VU
  },
  {
    id: 'craft_duct_tape',
    name: 'Craft Duct Tape',
    nameZh: '制作胶带',
    output: { resourceId: 'duct_tape', amount: 1 },
    inputs: [
      { resourceId: 'plastic', amount: 1 },
      { resourceId: 'cloth', amount: 1 },
    ],
    workRequired: 8, // 2 VU work
    // Total: 1 Plastic (7 VU) + 1 Cloth (5 VU) + 8 Work (2 VU) = 14 VU
  },

  // ============================================
  // 组件配方 (Component Recipes)
  // Requirements: 5.2
  // ============================================
  {
    id: 'craft_gear',
    name: 'Craft Gear',
    nameZh: '制作齿轮',
    output: { resourceId: 'gear', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 8 }],
    workRequired: 28, // 7 VU work
    // Total: 8 Scrap (8 VU) + 28 Work (7 VU) = 15 VU
  },
  {
    id: 'craft_pipe',
    name: 'Craft Pipe',
    nameZh: '制作管件',
    output: { resourceId: 'pipe', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 8 }],
    workRequired: 28, // 7 VU work
    // Total: 8 Scrap (8 VU) + 28 Work (7 VU) = 15 VU
  },
  {
    id: 'craft_spring',
    name: 'Craft Spring',
    nameZh: '制作弹簧',
    output: { resourceId: 'spring', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 6 }],
    workRequired: 24, // 6 VU work
    // Total: 6 Scrap (6 VU) + 24 Work (6 VU) = 12 VU
  },
  {
    id: 'craft_bearing',
    name: 'Craft Bearing',
    nameZh: '制作轴承',
    output: { resourceId: 'bearing', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 10 }],
    workRequired: 32, // 8 VU work
    // Total: 10 Scrap (10 VU) + 32 Work (8 VU) = 18 VU
  },
  {
    id: 'craft_fasteners',
    name: 'Craft Fasteners',
    nameZh: '制作紧固件',
    output: { resourceId: 'fasteners', amount: 1 },
    inputs: [{ resourceId: 'scrap', amount: 4 }],
    workRequired: 8, // 2 VU work
    // Total: 4 Scrap (4 VU) + 8 Work (2 VU) = 6 VU
  },

  // ============================================
  // 化工配方 (Chemical Recipes)
  // Requirements: 5.3
  // ============================================
  {
    id: 'craft_solvent',
    name: 'Craft Solvent',
    nameZh: '制作溶剂',
    output: { resourceId: 'solvent', amount: 1 },
    inputs: [
      { resourceId: 'scrap', amount: 10 },
      { resourceId: 'dirty_water', amount: 2 },
    ],
    workRequired: 24, // 6 VU work
    // Total: 10 Scrap (10 VU) + 2 Dirty_Water (6 VU) + 24 Work (6 VU) = 22 VU
  },
  {
    id: 'craft_acid',
    name: 'Craft Acid',
    nameZh: '制作强酸',
    output: { resourceId: 'acid', amount: 1 },
    inputs: [{ resourceId: 'solvent', amount: 1 }],
    workRequired: 12, // 3 VU work
    // Total: 1 Solvent (22 VU) + 12 Work (3 VU) = 25 VU
  },
  {
    id: 'craft_gunpowder',
    name: 'Craft Gunpowder',
    nameZh: '制作火药',
    output: { resourceId: 'gunpowder', amount: 1 },
    inputs: [
      { resourceId: 'solvent', amount: 1 },
      { resourceId: 'scrap', amount: 6 },
    ],
    workRequired: 20, // 5 VU work
    // Total: 1 Solvent (22 VU) + 6 Scrap (6 VU) + 20 Work (5 VU) = 33 VU
  },
  {
    id: 'craft_fuel',
    name: 'Craft Fuel',
    nameZh: '制作燃料',
    output: { resourceId: 'fuel', amount: 1 },
    inputs: [
      { resourceId: 'scrap', amount: 12 },
      { resourceId: 'solvent', amount: 1 },
    ],
    workRequired: 32, // 8 VU work
    // Total: 12 Scrap (12 VU) + 1 Solvent (22 VU) + 32 Work (8 VU) = 42 VU
  },

  // ============================================
  // 能源组件配方 (Energy Component Recipes)
  // Requirements: 5.4
  // ============================================
  {
    id: 'craft_battery_cell',
    name: 'Craft Battery Cell',
    nameZh: '制作电芯',
    output: { resourceId: 'battery_cell', amount: 1 },
    inputs: [
      { resourceId: 'metal', amount: 1 },
      { resourceId: 'acid', amount: 1 },
    ],
    workRequired: 16, // 4 VU work
    // Total: 1 Metal (16 VU) + 1 Acid (25 VU) + 16 Work (4 VU) = 45 VU
  },
  {
    id: 'craft_battery_pack',
    name: 'Craft Battery Pack',
    nameZh: '制作电池包',
    output: { resourceId: 'battery_pack', amount: 1 },
    inputs: [
      { resourceId: 'battery_cell', amount: 2 },
      { resourceId: 'plastic', amount: 1 },
    ],
    workRequired: 20, // 5 VU work
    // Total: 2 Battery_Cell (90 VU) + 1 Plastic (7 VU) + 20 Work (5 VU) = 102 VU
  },
  {
    id: 'craft_filter',
    name: 'Craft Filter',
    nameZh: '制作过滤芯',
    output: { resourceId: 'filter', amount: 1 },
    inputs: [
      { resourceId: 'cloth', amount: 1 },
      { resourceId: 'rubber', amount: 1 },
    ],
    workRequired: 12, // 3 VU work
    // Total: 1 Cloth (5 VU) + 1 Rubber (9 VU) + 12 Work (3 VU) = 17 VU
  },
  {
    id: 'craft_seal_ring',
    name: 'Craft Seal Ring',
    nameZh: '制作密封圈',
    output: { resourceId: 'seal_ring', amount: 1 },
    inputs: [{ resourceId: 'rubber', amount: 1 }],
    workRequired: 8, // 2 VU work
    // Total: 1 Rubber (9 VU) + 8 Work (2 VU) = 11 VU
  },

  // ============================================
  // 食物加工配方 (Food Processing Recipes)
  // Requirements: 5.1
  // ============================================
  {
    id: 'cook_meat',
    name: 'Cook Meat',
    nameZh: '烹饪生肉',
    output: { resourceId: 'food', amount: 1 },
    inputs: [{ resourceId: 'raw_meat', amount: 1 }],
    workRequired: 4, // 1 VU work
    // Total: 1 Raw_Meat (3 VU) + 4 Work (1 VU) = 4 VU ≈ food VU
  },
  {
    id: 'cook_vegetables',
    name: 'Cook Vegetables',
    nameZh: '烹饪蔬菜',
    output: { resourceId: 'food', amount: 1 },
    inputs: [{ resourceId: 'vegetables', amount: 1 }],
    workRequired: 4, // 1 VU work
    // Total: 1 Vegetables (4 VU) + 4 Work (1 VU) = 5 VU ≈ food VU
  },
  {
    id: 'purify_water',
    name: 'Purify Water',
    nameZh: '净化脏水',
    output: { resourceId: 'water', amount: 1 },
    inputs: [{ resourceId: 'dirty_water', amount: 2 }],
    workRequired: 4, // 1 VU work
    // Total: 2 Dirty_Water (6 VU) - loss = ~5 VU (water)
  },
];

/**
 * 根据ID获取配方
 */
export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id);
}

/**
 * 获取产出特定资源的配方
 */
export function getRecipesForOutput(resourceId: string): Recipe[] {
  return RECIPES.filter(r => r.output.resourceId === resourceId);
}

/**
 * 计算配方的总VU成本
 */
export function calculateRecipeInputVU(recipe: Recipe, getVU: (id: ResourceId) => number): number {
  const materialVU = recipe.inputs.reduce((sum, input) => {
    return sum + getVU(input.resourceId) * input.amount;
  }, 0);
  const workVU = recipe.workRequired * 0.25;
  return materialVU + workVU;
}

/**
 * 获取所有配方ID
 */
export function getAllRecipeIds(): string[] {
  return RECIPES.map(r => r.id);
}
