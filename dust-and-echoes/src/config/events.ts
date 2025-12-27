/**
 * 事件系统配置
 * Event System Configuration
 * 
 * Requirements: 20.1, 20.2
 */

import type { Phase, ResourceId, EventType } from '../types';

// ============================================
// 事件触发条件类型
// Event Trigger Condition Types
// ============================================

/** 事件触发条件类型 */
export type EventConditionType =
  | 'phase'              // 特定阶段
  | 'bonfire_lit'        // 篝火点燃
  | 'population_space'   // 有人口空间
  | 'radio_tower_level'  // 无线电台等级
  | 'resource_low'       // 资源低于阈值
  | 'resource_high'      // 资源高于阈值
  | 'day_range'          // 天数范围
  | 'random';            // 随机概率

/** 事件触发条件 */
export interface EventCondition {
  type: EventConditionType;
  /** 阶段条件 */
  phases?: Phase[];
  /** 建筑等级条件 */
  buildingLevel?: number;
  /** 资源条件 */
  resourceId?: ResourceId;
  resourceThreshold?: number;
  /** 天数范围 */
  minDay?: number;
  maxDay?: number;
  /** 随机概率 (0-1) */
  probability?: number;
}

// ============================================
// 事件选项与结果
// Event Choices and Outcomes
// ============================================

/** 资源变化 */
export interface ResourceChange {
  resourceId: ResourceId;
  amount: number; // 正数增加，负数减少
}

/** 事件结果 */
export interface EventOutcome {
  /** 资源变化 */
  resourceChanges?: ResourceChange[];
  /** 人口变化 */
  populationChange?: number;
  /** 士气变化 */
  moraleChange?: number;
  /** 健康变化（对所有工人） */
  healthChange?: number;
  /** 触发战斗 */
  triggerCombat?: boolean;
  /** 触发贸易 */
  triggerTrade?: boolean;
  /** 后续事件ID */
  followUpEventId?: string;
  /** 结果描述 */
  description: string;
  descriptionZh: string;
}

/** 事件选项 */
export interface EventChoice {
  id: string;
  text: string;
  textZh: string;
  /** 选项条件（可选） */
  conditions?: EventCondition[];
  /** 选项结果 */
  outcomes: EventOutcome[];
  /** 结果权重（用于随机选择） */
  outcomeWeights?: number[];
}

// ============================================
// 事件定义
// Event Definition
// ============================================

/** 事件定义 */
export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  nameZh: string;
  /** 事件描述/叙事文本 */
  description: string;
  descriptionZh: string;
  /** 触发条件（所有条件必须满足） */
  conditions: EventCondition[];
  /** 事件选项（如果为空则自动处理） */
  choices?: EventChoice[];
  /** 无选项时的默认结果 */
  defaultOutcome?: EventOutcome;
  /** 事件优先级（越高越优先） */
  priority: number;
  /** 是否可重复触发 */
  repeatable: boolean;
  /** 冷却天数（重复触发间隔） */
  cooldownDays?: number;
}

// ============================================
// 阶段事件配置
// Phase Event Configuration
// Requirements: 20.1
// ============================================

/** 阶段事件权重配置 */
export const PHASE_EVENT_WEIGHTS: Record<Phase, Partial<Record<EventType, number>>> = {
  dawn: {
    weather: 0.3,
    resource_discovery: 0.2,
    wanderer_arrival: 0.1,
  },
  morning: {
    resource_discovery: 0.15,
    wanderer_arrival: 0.1,
  },
  noon: {
    weather: 0.1,
    resource_discovery: 0.1,
  },
  afternoon: {
    resource_discovery: 0.15,
    trader_visit: 0.1,
  },
  evening: {
    raid: 0.2,
    trader_visit: 0.25,
    wanderer_arrival: 0.15,
  },
  midnight: {
    raid: 0.3,
    resource_discovery: 0.1,
    story_signal: 0.1,
  },
};

// ============================================
// 预定义事件
// Predefined Events
// Requirements: 20.2
// ============================================

export const EVENTS: GameEvent[] = [
  // ============================================
  // 资源发现事件 (Resource Discovery)
  // ============================================
  {
    id: 'resource_discovery_scrap',
    type: 'resource_discovery',
    name: 'Scrap Discovery',
    nameZh: '废料发现',
    description: 'You find some useful scrap materials nearby.',
    descriptionZh: '你在附近发现了一些有用的废料。',
    conditions: [
      { type: 'phase', phases: ['dawn', 'morning', 'afternoon'] },
      { type: 'random', probability: 0.15 },
    ],
    defaultOutcome: {
      resourceChanges: [{ resourceId: 'scrap', amount: 5 }],
      description: 'Found 5 scrap.',
      descriptionZh: '获得了5个废料。',
    },
    priority: 1,
    repeatable: true,
  },
  {
    id: 'resource_discovery_water',
    type: 'resource_discovery',
    name: 'Water Source',
    nameZh: '水源发现',
    description: 'You discover a small cache of clean water.',
    descriptionZh: '你发现了一小批干净的水。',
    conditions: [
      { type: 'phase', phases: ['dawn', 'morning'] },
      { type: 'random', probability: 0.1 },
    ],
    defaultOutcome: {
      resourceChanges: [{ resourceId: 'water', amount: 2 }],
      description: 'Found 2 water.',
      descriptionZh: '获得了2份净水。',
    },
    priority: 1,
    repeatable: true,
  },
  {
    id: 'resource_discovery_food',
    type: 'resource_discovery',
    name: 'Food Cache',
    nameZh: '食物储藏',
    description: 'You stumble upon an old food cache.',
    descriptionZh: '你偶然发现了一个旧的食物储藏点。',
    conditions: [
      { type: 'phase', phases: ['morning', 'afternoon'] },
      { type: 'random', probability: 0.1 },
    ],
    choices: [
      {
        id: 'take_all',
        text: 'Take everything',
        textZh: '全部拿走',
        outcomes: [
          {
            resourceChanges: [{ resourceId: 'food', amount: 3 }],
            description: 'You take all the food.',
            descriptionZh: '你拿走了所有食物。',
          },
        ],
      },
      {
        id: 'take_some',
        text: 'Take only what you need',
        textZh: '只拿需要的',
        outcomes: [
          {
            resourceChanges: [{ resourceId: 'food', amount: 1 }],
            moraleChange: 1,
            description: 'You take only what you need, feeling good about your restraint.',
            descriptionZh: '你只拿了需要的，对自己的克制感到满意。',
          },
        ],
      },
    ],
    priority: 2,
    repeatable: true,
    cooldownDays: 2,
  },

  // ============================================
  // 流浪者到来事件 (Wanderer Arrival)
  // ============================================
  {
    id: 'wanderer_arrival_basic',
    type: 'wanderer_arrival',
    name: 'Wanderer Approaches',
    nameZh: '流浪者到来',
    description: 'A weary traveler approaches your camp, drawn by the light of your fire.',
    descriptionZh: '一个疲惫的旅行者被你的篝火吸引，向营地走来。',
    conditions: [
      { type: 'bonfire_lit' },
      { type: 'population_space' },
      { type: 'random', probability: 0.25 },
    ],
    choices: [
      {
        id: 'welcome',
        text: 'Welcome them',
        textZh: '欢迎他们',
        outcomes: [
          {
            populationChange: 1,
            moraleChange: 1,
            description: 'The wanderer joins your settlement.',
            descriptionZh: '流浪者加入了你的定居点。',
          },
        ],
      },
      {
        id: 'turn_away',
        text: 'Turn them away',
        textZh: '拒绝他们',
        outcomes: [
          {
            moraleChange: -1,
            description: 'You turn the wanderer away. Some of your people look disappointed.',
            descriptionZh: '你拒绝了流浪者。你的一些人看起来很失望。',
          },
        ],
      },
    ],
    priority: 5,
    repeatable: true,
    cooldownDays: 1,
  },
  {
    id: 'wanderer_skilled',
    type: 'wanderer_arrival',
    name: 'Skilled Survivor',
    nameZh: '技术幸存者',
    description: 'A survivor with useful skills seeks refuge at your camp.',
    descriptionZh: '一个有技能的幸存者在你的营地寻求庇护。',
    conditions: [
      { type: 'bonfire_lit' },
      { type: 'population_space' },
      { type: 'day_range', minDay: 5 },
      { type: 'random', probability: 0.15 },
    ],
    choices: [
      {
        id: 'welcome',
        text: 'Welcome them',
        textZh: '欢迎他们',
        outcomes: [
          {
            populationChange: 1,
            moraleChange: 2,
            resourceChanges: [{ resourceId: 'scrap', amount: 10 }],
            description: 'The skilled survivor joins and brings supplies.',
            descriptionZh: '技术幸存者加入并带来了补给。',
          },
        ],
      },
      {
        id: 'trade_info',
        text: 'Trade for information',
        textZh: '交换信息',
        outcomes: [
          {
            resourceChanges: [
              { resourceId: 'food', amount: -2 },
              { resourceId: 'data_tape', amount: 1 },
            ],
            description: 'You trade food for valuable information.',
            descriptionZh: '你用食物交换了有价值的信息。',
          },
        ],
      },
    ],
    priority: 6,
    repeatable: true,
    cooldownDays: 3,
  },
  {
    id: 'wanderer_trader',
    type: 'wanderer_arrival',
    name: 'Wandering Trader',
    nameZh: '流浪商人',
    description: 'A wandering trader passes by your camp, offering to barter goods.',
    descriptionZh: '一个流浪商人路过你的营地，愿意以物易物。',
    conditions: [
      { type: 'random', probability: 0.2 },
    ],
    choices: [
      {
        id: 'trade_scrap_for_water',
        text: 'Trade 10 scrap for 3 water',
        textZh: '用10废料换3净水',
        conditions: [{ type: 'resource_high', resourceId: 'scrap', resourceThreshold: 10 }],
        outcomes: [
          {
            resourceChanges: [
              { resourceId: 'scrap', amount: -10 },
              { resourceId: 'water', amount: 3 },
            ],
            description: 'You trade scrap for clean water.',
            descriptionZh: '你用废料换取了净水。',
          },
        ],
      },
      {
        id: 'trade_scrap_for_food',
        text: 'Trade 10 scrap for 3 food',
        textZh: '用10废料换3食物',
        conditions: [{ type: 'resource_high', resourceId: 'scrap', resourceThreshold: 10 }],
        outcomes: [
          {
            resourceChanges: [
              { resourceId: 'scrap', amount: -10 },
              { resourceId: 'food', amount: 3 },
            ],
            description: 'You trade scrap for food.',
            descriptionZh: '你用废料换取了食物。',
          },
        ],
      },
      {
        id: 'trade_wood_for_metal',
        text: 'Trade 8 wood for 2 metal',
        textZh: '用8木材换2金属',
        conditions: [{ type: 'resource_high', resourceId: 'wood', resourceThreshold: 8 }],
        outcomes: [
          {
            resourceChanges: [
              { resourceId: 'wood', amount: -8 },
              { resourceId: 'metal', amount: 2 },
            ],
            description: 'You trade wood for metal.',
            descriptionZh: '你用木材换取了金属。',
          },
        ],
      },
      {
        id: 'decline_trade',
        text: 'Decline to trade',
        textZh: '拒绝交易',
        outcomes: [
          {
            description: 'The trader moves on.',
            descriptionZh: '商人继续赶路了。',
          },
        ],
      },
    ],
    priority: 4,
    repeatable: true,
    cooldownDays: 1,
  },
  {
    id: 'wanderer_group',
    type: 'wanderer_arrival',
    name: 'Survivor Group',
    nameZh: '幸存者小队',
    description: 'A small group of survivors approaches, looking for a place to stay.',
    descriptionZh: '一小群幸存者走来，寻找落脚之处。',
    conditions: [
      { type: 'bonfire_lit' },
      { type: 'population_space' },
      { type: 'day_range', minDay: 3 },
      { type: 'random', probability: 0.12 },
    ],
    choices: [
      {
        id: 'welcome_all',
        text: 'Welcome them all (need 2 population space)',
        textZh: '全部接纳（需要2人口空间）',
        outcomes: [
          {
            populationChange: 2,
            moraleChange: 2,
            resourceChanges: [{ resourceId: 'food', amount: -4 }],
            description: 'The group joins your settlement. They need food to recover.',
            descriptionZh: '这群人加入了你的定居点。他们需要食物恢复体力。',
          },
        ],
      },
      {
        id: 'welcome_one',
        text: 'Accept only one',
        textZh: '只接纳一人',
        outcomes: [
          {
            populationChange: 1,
            moraleChange: -1,
            description: 'You accept one survivor. The others leave disappointed.',
            descriptionZh: '你接纳了一名幸存者。其他人失望地离开了。',
          },
        ],
      },
      {
        id: 'turn_away',
        text: 'Turn them away',
        textZh: '拒绝他们',
        outcomes: [
          {
            moraleChange: -2,
            description: 'You turn the group away. Your people are troubled.',
            descriptionZh: '你拒绝了这群人。你的人感到不安。',
          },
        ],
      },
    ],
    priority: 5,
    repeatable: true,
    cooldownDays: 2,
  },
  {
    id: 'wanderer_injured',
    type: 'wanderer_arrival',
    name: 'Injured Survivor',
    nameZh: '受伤的幸存者',
    description: 'An injured survivor stumbles into your camp, barely conscious.',
    descriptionZh: '一个受伤的幸存者跌跌撞撞地走进营地，几乎失去意识。',
    conditions: [
      { type: 'population_space' },
      { type: 'random', probability: 0.15 },
    ],
    choices: [
      {
        id: 'help_with_meds',
        text: 'Use medicine to help (1 meds)',
        textZh: '用药物救治（消耗1药品）',
        conditions: [{ type: 'resource_high', resourceId: 'meds', resourceThreshold: 1 }],
        outcomes: [
          {
            populationChange: 1,
            moraleChange: 2,
            resourceChanges: [{ resourceId: 'meds', amount: -1 }],
            description: 'You save the survivor. They are grateful and join your settlement.',
            descriptionZh: '你救活了幸存者。他们非常感激并加入了定居点。',
          },
        ],
      },
      {
        id: 'help_without_meds',
        text: 'Try to help without medicine',
        textZh: '尝试不用药物救治',
        outcomes: [
          {
            populationChange: 1,
            moraleChange: 1,
            description: 'The survivor recovers slowly but joins your settlement.',
            descriptionZh: '幸存者慢慢恢复并加入了定居点。',
          },
          {
            moraleChange: -1,
            description: 'Despite your efforts, the survivor does not make it.',
            descriptionZh: '尽管你尽力了，幸存者还是没能挺过来。',
          },
        ],
        outcomeWeights: [0.5, 0.5],
      },
      {
        id: 'turn_away',
        text: 'Cannot help them',
        textZh: '无法帮助他们',
        outcomes: [
          {
            moraleChange: -2,
            description: 'You leave the survivor to their fate. Your people are disturbed.',
            descriptionZh: '你让幸存者听天由命。你的人感到不安。',
          },
        ],
      },
    ],
    priority: 5,
    repeatable: true,
    cooldownDays: 2,
  },
  {
    id: 'wanderer_with_supplies',
    type: 'wanderer_arrival',
    name: 'Survivor with Supplies',
    nameZh: '带补给的幸存者',
    description: 'A survivor arrives carrying valuable supplies, willing to trade or join.',
    descriptionZh: '一个幸存者带着宝贵的补给到来，愿意交易或加入。',
    conditions: [
      { type: 'day_range', minDay: 2 },
      { type: 'random', probability: 0.15 },
    ],
    choices: [
      {
        id: 'recruit',
        text: 'Recruit them (they keep half supplies)',
        textZh: '招募他们（他们保留一半补给）',
        conditions: [{ type: 'population_space' }],
        outcomes: [
          {
            populationChange: 1,
            resourceChanges: [
              { resourceId: 'water', amount: 2 },
              { resourceId: 'food', amount: 2 },
            ],
            description: 'The survivor joins with some supplies.',
            descriptionZh: '幸存者带着一些补给加入了。',
          },
        ],
      },
      {
        id: 'trade_supplies',
        text: 'Trade: give 15 scrap for all supplies',
        textZh: '交易：用15废料换取全部补给',
        conditions: [{ type: 'resource_high', resourceId: 'scrap', resourceThreshold: 15 }],
        outcomes: [
          {
            resourceChanges: [
              { resourceId: 'scrap', amount: -15 },
              { resourceId: 'water', amount: 5 },
              { resourceId: 'food', amount: 5 },
            ],
            description: 'You trade scrap for their supplies.',
            descriptionZh: '你用废料换取了他们的补给。',
          },
        ],
      },
      {
        id: 'let_go',
        text: 'Let them pass',
        textZh: '让他们离开',
        outcomes: [
          {
            description: 'The survivor continues on their way.',
            descriptionZh: '幸存者继续赶路了。',
          },
        ],
      },
    ],
    priority: 4,
    repeatable: true,
    cooldownDays: 1,
  },

  // ============================================
  // 袭击事件 (Raid)
  // ============================================
  {
    id: 'raid_small',
    type: 'raid',
    name: 'Small Raid',
    nameZh: '小规模袭击',
    description: 'A small group of raiders approaches your settlement!',
    descriptionZh: '一小群掠夺者正在接近你的定居点！',
    conditions: [
      { type: 'phase', phases: ['evening', 'midnight'] },
      { type: 'day_range', minDay: 3 },
      { type: 'random', probability: 0.15 },
    ],
    choices: [
      {
        id: 'fight',
        text: 'Fight them off',
        textZh: '击退他们',
        outcomes: [
          {
            healthChange: -10,
            resourceChanges: [{ resourceId: 'scrap', amount: 8 }],
            description: 'You fight off the raiders but take some injuries. You loot their supplies.',
            descriptionZh: '你击退了掠夺者但受了一些伤。你搜刮了他们的补给。',
          },
          {
            healthChange: -20,
            resourceChanges: [{ resourceId: 'scrap', amount: -5 }],
            description: 'The fight goes poorly. You lose some supplies.',
            descriptionZh: '战斗进行得不顺利。你损失了一些补给。',
          },
        ],
        outcomeWeights: [0.7, 0.3],
      },
      {
        id: 'hide',
        text: 'Hide and wait',
        textZh: '躲藏等待',
        outcomes: [
          {
            resourceChanges: [{ resourceId: 'scrap', amount: -3 }],
            description: 'The raiders take some supplies but leave without finding you.',
            descriptionZh: '掠夺者拿走了一些补给但没有发现你。',
          },
        ],
      },
      {
        id: 'bribe',
        text: 'Offer tribute',
        textZh: '献上贡品',
        conditions: [{ type: 'resource_high', resourceId: 'food', resourceThreshold: 5 }],
        outcomes: [
          {
            resourceChanges: [{ resourceId: 'food', amount: -3 }],
            moraleChange: -1,
            description: 'You give them food and they leave peacefully.',
            descriptionZh: '你给了他们食物，他们和平离开了。',
          },
        ],
      },
    ],
    priority: 8,
    repeatable: true,
    cooldownDays: 2,
  },

  // ============================================
  // 商人来访事件 (Trader Visit)
  // ============================================
  {
    id: 'trader_visit_basic',
    type: 'trader_visit',
    name: 'Traveling Merchant',
    nameZh: '旅行商人',
    description: 'A traveling merchant arrives at your settlement.',
    descriptionZh: '一个旅行商人来到了你的定居点。',
    conditions: [
      { type: 'phase', phases: ['afternoon', 'evening'] },
      { type: 'radio_tower_level', buildingLevel: 1 },
      { type: 'random', probability: 0.2 },
    ],
    defaultOutcome: {
      triggerTrade: true,
      description: 'A merchant is available for trading.',
      descriptionZh: '商人可以进行交易。',
    },
    priority: 4,
    repeatable: true,
    cooldownDays: 1,
  },
  {
    id: 'trader_black_market',
    type: 'trader_visit',
    name: 'Black Market Dealer',
    nameZh: '黑市商人',
    description: 'A shady figure offers rare goods at steep prices.',
    descriptionZh: '一个可疑的人物以高价提供稀有物品。',
    conditions: [
      { type: 'phase', phases: ['evening', 'midnight'] },
      { type: 'radio_tower_level', buildingLevel: 1 },
      { type: 'day_range', minDay: 7 },
      { type: 'random', probability: 0.1 },
    ],
    choices: [
      {
        id: 'trade',
        text: 'See their wares',
        textZh: '查看商品',
        outcomes: [
          {
            triggerTrade: true,
            description: 'The dealer shows you their special inventory.',
            descriptionZh: '商人向你展示了他们的特殊库存。',
          },
        ],
      },
      {
        id: 'decline',
        text: 'Send them away',
        textZh: '让他们离开',
        outcomes: [
          {
            description: 'You decline their offer.',
            descriptionZh: '你拒绝了他们的提议。',
          },
        ],
      },
    ],
    priority: 5,
    repeatable: true,
    cooldownDays: 3,
  },

  // ============================================
  // 天气事件 (Weather)
  // ============================================
  {
    id: 'weather_rain',
    type: 'weather',
    name: 'Rainfall',
    nameZh: '降雨',
    description: 'Rain clouds gather overhead.',
    descriptionZh: '雨云在头顶聚集。',
    conditions: [
      { type: 'phase', phases: ['dawn', 'morning'] },
      { type: 'random', probability: 0.15 },
    ],
    defaultOutcome: {
      resourceChanges: [{ resourceId: 'dirty_water', amount: 3 }],
      description: 'The rain provides some dirty water that can be purified.',
      descriptionZh: '雨水提供了一些可以净化的脏水。',
    },
    priority: 2,
    repeatable: true,
  },
  {
    id: 'weather_dust_storm',
    type: 'weather',
    name: 'Dust Storm',
    nameZh: '沙尘暴',
    description: 'A dust storm sweeps through the area.',
    descriptionZh: '一场沙尘暴席卷了该地区。',
    conditions: [
      { type: 'phase', phases: ['noon', 'afternoon'] },
      { type: 'random', probability: 0.1 },
    ],
    defaultOutcome: {
      healthChange: -5,
      moraleChange: -1,
      description: 'The dust storm causes minor health issues and dampens spirits.',
      descriptionZh: '沙尘暴造成了轻微的健康问题并打击了士气。',
    },
    priority: 3,
    repeatable: true,
    cooldownDays: 2,
  },

  // ============================================
  // 故事信号事件 (Story Signal)
  // ============================================
  {
    id: 'story_signal_first',
    type: 'story_signal',
    name: 'Strange Signal',
    nameZh: '奇怪的信号',
    description: 'Your radio picks up a strange, repeating signal from the north.',
    descriptionZh: '你的无线电接收到了来自北方的奇怪重复信号。',
    conditions: [
      { type: 'radio_tower_level', buildingLevel: 1 },
      { type: 'phase', phases: ['midnight'] },
      { type: 'random', probability: 0.15 },
    ],
    choices: [
      {
        id: 'investigate',
        text: 'Mark the location for investigation',
        textZh: '标记位置以供调查',
        outcomes: [
          {
            resourceChanges: [{ resourceId: 'data_tape', amount: 1 }],
            description: 'You record the signal coordinates. This could lead to something important.',
            descriptionZh: '你记录了信号坐标。这可能会引向重要的东西。',
          },
        ],
      },
      {
        id: 'ignore',
        text: 'Ignore it',
        textZh: '忽略它',
        outcomes: [
          {
            description: 'You decide to focus on more immediate concerns.',
            descriptionZh: '你决定专注于更紧迫的事情。',
          },
        ],
      },
    ],
    priority: 7,
    repeatable: false,
  },
  {
    id: 'story_signal_distress',
    type: 'story_signal',
    name: 'Distress Call',
    nameZh: '求救信号',
    description: 'A desperate voice crackles through the radio, calling for help.',
    descriptionZh: '一个绝望的声音通过无线电传来，呼救着。',
    conditions: [
      { type: 'radio_tower_level', buildingLevel: 2 },
      { type: 'phase', phases: ['evening', 'midnight'] },
      { type: 'day_range', minDay: 10 },
      { type: 'random', probability: 0.1 },
    ],
    choices: [
      {
        id: 'respond',
        text: 'Respond to the call',
        textZh: '回应呼救',
        outcomes: [
          {
            populationChange: 2,
            resourceChanges: [{ resourceId: 'meds', amount: 1 }],
            moraleChange: 2,
            description: 'You rescue survivors who join your settlement with medical supplies.',
            descriptionZh: '你救出了幸存者，他们带着医疗用品加入了你的定居点。',
          },
          {
            healthChange: -15,
            resourceChanges: [{ resourceId: 'scrap', amount: -10 }],
            description: 'It was a trap! You barely escape with your life.',
            descriptionZh: '这是个陷阱！你勉强逃脱。',
          },
        ],
        outcomeWeights: [0.6, 0.4],
      },
      {
        id: 'ignore',
        text: 'Ignore the call',
        textZh: '忽略呼救',
        outcomes: [
          {
            moraleChange: -1,
            description: 'You ignore the call. Some of your people seem troubled by this decision.',
            descriptionZh: '你忽略了呼救。你的一些人似乎对这个决定感到不安。',
          },
        ],
      },
    ],
    priority: 8,
    repeatable: true,
    cooldownDays: 5,
  },
];

/**
 * 根据ID获取事件
 */
export function getEventById(eventId: string): GameEvent | undefined {
  return EVENTS.find(e => e.id === eventId);
}

/**
 * 根据类型获取事件
 */
export function getEventsByType(type: EventType): GameEvent[] {
  return EVENTS.filter(e => e.type === type);
}

/**
 * 获取特定阶段可能触发的事件类型权重
 */
export function getPhaseEventWeights(phase: Phase): Partial<Record<EventType, number>> {
  return PHASE_EVENT_WEIGHTS[phase] || {};
}
