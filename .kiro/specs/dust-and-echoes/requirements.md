# Requirements Document

## Introduction

《尘埃与回响》(Dust & Echoes) 是一款废土生存网页文字游戏，融合即时操作、文字冒险与资源策略玩法。玩家在极简UI下通过文字体验废土的荒凉感与生存紧迫感，所有操作即时响应，按行动阶段推进游戏进程。

核心玩法循环：
1. **采集与生存**：手动获取基础资源，维持生命体征
2. **建设与扩张**：消耗资源升级设施，解锁新功能，吸纳人口
3. **探索与叙事**：派遣探险队外出，触发随机事件，推动剧情，获取稀有科技

## Glossary

- **VU (Value Unit)**: 价值单位，1 VU = 1 Scrap，用于统一衡量所有资源、物品、建筑的价值
- **AU (Action Unit)**: 行动时长单位，一天共5 AU（清晨0.5 + 上午1 + 中午0.5 + 下午1 + 傍晚1 + 午夜1）
- **Work**: 工程点，1 Work = 0.25 VU，1名工程师每1AU产出60 Work
- **Dur (Durability)**: 耐久度，以AU为单位，每1AU活动消耗1 Dur
- **Game_System**: 游戏核心系统
- **Resource_Manager**: 资源管理系统
- **Building_System**: 建筑系统
- **Production_System**: 生产系统
- **Exploration_System**: 探索系统
- **Combat_System**: 战斗系统
- **Tech_Tree**: 科技树系统
- **Outpost_System**: 先锋营地系统
- **Health**: 健康值(0-100)，影响劳动效率与死亡风险
- **Bleed**: 流血状态，每AU结算扣血
- **Infection**: 感染状态，持续掉健康
- **Morale**: 士气(-5~+5)，影响流浪者到来、暴动/离开概率

## Requirements

### Requirement 1: 游戏时间与行动阶段系统

**User Story:** As a player, I want the game to progress through distinct time phases each day, so that I can plan my actions strategically.

#### Acceptance Criteria

1. THE Game_System SHALL divide each game day into 6 phases with AU weights:
   - Dawn (清晨): 0.5 AU - 短行动阶段
   - Morning (上午): 1.0 AU - 标准行动阶段
   - Noon (中午): 0.5 AU - 短行动阶段
   - Afternoon (下午): 1.0 AU - 标准行动阶段
   - Evening (傍晚): 1.0 AU - 标准行动阶段，更易触发袭击/黑市事件
   - Midnight (午夜): 1.0 AU - 标准行动阶段，高风险/高收益事件更多
2. WHEN player performs an action, THE Game_System SHALL immediately execute and show results
3. WHEN player clicks "End Phase", THE Game_System SHALL advance to next phase and calculate production/consumption
4. THE Game_System SHALL support short actions (0.5AU cost) during Dawn and Noon phases only
5. THE Game_System SHALL support standard actions (1AU cost) during all phases
6. WHEN displaying time, THE Game_System SHALL show current day, phase name, and available action points
7. THE Game_System SHALL NOT auto-progress time - all progression is player-initiated
8. WHEN Midnight phase ends, THE Game_System SHALL advance to next day's Dawn phase

### Requirement 2: 资源管理系统

**User Story:** As a player, I want to manage various resources with clear values, so that I can make informed decisions about production and consumption.

#### Acceptance Criteria

1. THE Resource_Manager SHALL track primary resources (一级资源):
   - Scrap (废料): 1 VU, 基础建设材料
   - Water (净水): 5 VU, 生存消耗
   - Dirty_Water (脏水): 3 VU, 可净化
   - Food (口粮): 4.167 VU, 生存消耗
   - Raw_Meat (生肉): 3 VU, 易腐，可烹饪
   - Canned_Food (罐头): 14.5 VU, 稳定食物
   - Vegetables (蔬菜): 4 VU, 易腐
   - Seeds (种子): 20 VU, 温室产能
   - Fertilizer (肥料): 18 VU, 温室增产

2. THE Resource_Manager SHALL track secondary materials (二级资源):
   - Wood (木材): 8 VU, 配方: 4 Scrap + 16 Work
   - Metal (金属): 16 VU, 配方: 8 Scrap + 32 Work
   - Cloth (布料): 5 VU, 配方: 3 Scrap + 8 Work
   - Leather (皮革): 7 VU, 配方: 4 Scrap + 12 Work
   - Plastic (塑料): 7 VU, 配方: 4 Scrap + 12 Work
   - Glass (玻璃): 7 VU, 配方: 4 Scrap + 12 Work
   - Rubber (橡胶): 9 VU, 配方: 5 Scrap + 16 Work
   - Wire (线材): 11 VU, 配方: 6 Scrap + 20 Work
   - Rope (绳索): 7 VU, 配方: 1 Cloth + 8 Work
   - Duct_Tape (胶带): 14 VU, 配方: 1 Plastic + 1 Cloth + 8 Work

3. THE Resource_Manager SHALL track components (组件):
   - Gear (机械齿轮): 15 VU, 配方: 8 Scrap + 28 Work
   - Pipe (管件): 15 VU, 配方: 8 Scrap + 28 Work
   - Spring (弹簧): 12 VU, 配方: 6 Scrap + 24 Work
   - Bearing (轴承): 18 VU, 配方: 10 Scrap + 32 Work
   - Fasteners (紧固件): 6 VU, 配方: 4 Scrap + 8 Work

4. THE Resource_Manager SHALL track chemicals (化工材料):
   - Solvent (溶剂): 22 VU, 配方: 10 Scrap + 24 Work + 2 Dirty_Water
   - Acid (强酸): 25 VU, 配方: 1 Solvent + 12 Work
   - Gunpowder (火药): 33 VU, 配方: 1 Solvent + 6 Scrap + 20 Work
   - Fuel (燃料): 42 VU, 配方: 12 Scrap + 32 Work + 1 Solvent

5. THE Resource_Manager SHALL track energy components (能源组件):
   - Battery_Cell (电芯): 45 VU, 配方: 1 Metal + 1 Acid + 16 Work
   - Battery_Pack (电池包): 102 VU, 配方: 2 Battery_Cell + 1 Plastic + 20 Work
   - Filter (过滤芯): 17 VU, 配方: 1 Cloth + 1 Rubber + 12 Work
   - Seal_Ring (密封圈): 11 VU, 配方: 1 Rubber + 8 Work

6. THE Resource_Manager SHALL track rare/tech resources (三级稀有资源):
   - Meds (药品): 320 VU, 主要来源探索/贸易
   - Data_Tape (数据磁带): 160 VU, T2-T4探索
   - Radio_Parts (无线电组件): 240 VU, T3探索
   - Solar_Cell (太阳能板): 320 VU, T4探索
   - Rare_Alloy (稀有合金): 400 VU, T4-T5探索
   - Microchips (旧世界芯片): 640 VU, T3-T4探索
   - Nanofiber (纳米纤维): 800 VU, T5探索
   - Power_Core (能源核心): 2560 VU, T5探索

7. WHEN phase ends, THE Resource_Manager SHALL calculate consumption:
   - Water consumption = population × 1.0 × phase_AU
   - Food consumption = population × 1.2 × phase_AU

8. THE Resource_Manager SHALL enforce storage limits based on Warehouse level
9. IF Water or Food reaches zero, THEN THE Game_System SHALL trigger crisis events and population death
10. WHEN Raw_Meat is not processed by Midnight, THE Resource_Manager SHALL mark it as spoiled

### Requirement 3: 人口与岗位系统

**User Story:** As a player, I want to assign workers to different jobs, so that I can optimize resource production.

#### Acceptance Criteria

1. THE Game_System SHALL support job types with base production per 1 AU:
   - Scavenger (拾荒者): 15 Scrap/AU = 15 VU/AU
   - Water_Collector (集水者): 3 Water/AU = 15 VU/AU
   - Hunter (猎人): 3.6 Food/AU = 15 VU/AU
   - Engineer (工程师): 60 Work/AU = 15 VU/AU
   - Guard (守卫): 用于先锋营地与战斗
   - Scout (斥候): 用于探索与侦察

2. WHEN assigning workers, THE Game_System SHALL enforce maximum slots:
   - Water_Collector max = 2 + 2 × Building_Level
   - Hunter max = 2 + 2 × Building_Level
   - Scavenger max = 3 + 3 × Building_Level

3. THE Game_System SHALL calculate minimum required workers to survive:
   - Water_min = ceil(population / (3 × efficiency_multiplier))
   - Food_min = ceil(population / (3 × efficiency_multiplier))

4. WHEN building level increases, THE Game_System SHALL apply efficiency multiplier:
   - efficiency_multiplier = 1 + 0.10 × (Level - 1)
   - L1: 1.0, L2: 1.1, L3: 1.2, L4: 1.3, L5: 1.4

5. THE Game_System SHALL calculate net surplus per effective worker:
   - Production: 15 VU/AU
   - Consumption: 10 VU/AU (5 VU water + 5 VU food)
   - Net surplus: 5 VU/AU per worker

6. WHEN worker health drops below 50, THE Game_System SHALL reduce their efficiency by 30%
7. WHEN worker has Bleed status, THE Game_System SHALL prevent work assignment until treated

### Requirement 4: 建筑系统

**User Story:** As a player, I want to construct and upgrade buildings, so that I can expand my settlement's capabilities.

#### Acceptance Criteria

1. THE Building_System SHALL support core buildings:
   - Bonfire (篝火): 点燃成本 30 Scrap + 5 Wood (70 VU)
     - 强度档位: 熄灭/微燃/燃烧/旺盛
     - 燃料消耗: 微燃 0.3 Wood/AU, 燃烧 0.8 Wood/AU, 旺盛 1.6 Wood/AU
     - 来人速率: λ = 0.2 × 强度系数(1/2/3) × (cap - pop)
   - Shelter (住所): 每建1个人口上限+2
     - Base成本: 20 Scrap + 8 Wood (84 VU)
     - 递增: Cost(k) = Base × 1.25^(k-1)
   - Warehouse (仓库): 扩展存储上限
     - L1: 80 Scrap + 20 Wood (240 VU)
     - 每级增加: Water+50, Food+50, Scrap+150, Wood+80, Metal+40, Meds+5, Chip+3
   - Workshop (工坊): 解锁制造配方
     - L1: 120 Scrap + 30 Wood + 5 Metal (440 VU)
     - 效率倍率: 1 + 0.20 × (L-1)
   - Radio_Tower (无线电台): 解锁地图/贸易/探索
     - L1: 300 Scrap + 80 Wood + 30 Metal (1420 VU) - 解锁近郊探索
     - L2: 800 Scrap + 180 Wood + 80 Metal + 1 Chip (4160 VU) - 解锁更深地图
     - L3: 2000 Scrap + 400 Wood + 200 Metal + 2 Chips (9680 VU) - 解锁核心区

2. THE Building_System SHALL support production buildings (L1-L5):
   - Water_Collector (集水器):
     - L1: 40 Scrap + 15 Wood (160 VU)
     - L2: 100 Scrap + 30 Wood (340 VU)
     - L3: 220 Scrap + 60 Wood + 10 Metal (860 VU)
     - L4: 450 Scrap + 120 Wood + 30 Metal (2370 VU)
     - L5: 900 Scrap + 240 Wood + 80 Metal (6180 VU)
   - Trap (陷阱): 同Water_Collector成本结构
   - Scavenge_Post (拾荒站): 同Water_Collector成本结构

3. WHEN upgrading production buildings, THE Building_System SHALL:
   - Increase efficiency: multiplier = 1 + 0.10 × (L-1)
   - Increase max workers: Water/Food max = 2 + 2L, Scrap max = 3 + 3L

4. THE Building_System SHALL validate resource requirements before construction
5. THE Building_System SHALL display construction progress and completion notification
6. WHEN Workshop level increases, THE Building_System SHALL unlock new recipes

### Requirement 5: 工坊与制造系统

**User Story:** As a player, I want to craft items and process resources, so that I can create advanced materials and equipment.

#### Acceptance Criteria

1. THE Production_System SHALL support basic recipes: Wood(4 Scrap + 16 Work), Metal(8 Scrap + 32 Work)
2. THE Production_System SHALL support material recipes for Cloth, Leather, Plastic, Glass, Rubber, Wire, Rope, Tape
3. THE Production_System SHALL support chemical recipes: Solvent, Acid, Gunpowder, Fuel
4. THE Production_System SHALL support equipment crafting: weapons, armor, tools, ammunition
5. WHEN crafting, THE Production_System SHALL consume Work points from assigned Engineers
6. THE Production_System SHALL apply Workshop level efficiency: Work_rate = Engineers × 1 × (1 + 0.20 × (L-1))

### Requirement 6: 探索系统

**User Story:** As a player, I want to explore the wasteland, so that I can discover resources, events, and advance the story.

#### Acceptance Criteria

1. THE Exploration_System SHALL support region tiers: T1(Near_Suburbs), T2(Outer_City), T3(Industrial), T4(Old_Facilities), T5(Forbidden_Zone)
2. WHEN exploring, THE Exploration_System SHALL consume supplies: Water = 1.5/AU, Food = 1.8/AU per explorer
3. THE Exploration_System SHALL calculate travel time: Total_Time = 2 × distance + search_time
4. THE Exploration_System SHALL generate loot based on region tier and risk coefficient
5. WHEN Radio_Tower level increases, THE Exploration_System SHALL unlock deeper regions
6. THE Exploration_System SHALL track explorer health, equipment durability, and inventory capacity

### Requirement 7: 战斗系统

**User Story:** As a player, I want to engage in combat encounters, so that I can defend my settlement and defeat enemies during exploration.

#### Acceptance Criteria

1. THE Combat_System SHALL use turn-based text combat with ATK, DEF, HP stats
2. THE Combat_System SHALL calculate damage: Damage = max(1, ATK - DEF + Random(-1, 0, 1))
3. THE Combat_System SHALL calculate combat power: CP = ATK + 0.7 × DEF + 0.3 × (HP/10)
4. THE Combat_System SHALL calculate region difficulty: DC = 6 + 1.5 × distance
5. THE Combat_System SHALL calculate win probability: P(win) = 1 / (1 + e^(-(CP-DC)/2.5))
6. WHEN combat ends, THE Combat_System SHALL apply health changes, equipment durability loss, and loot distribution

### Requirement 8: 科技树系统

**User Story:** As a player, I want to research technologies, so that I can unlock new buildings, recipes, and capabilities.

#### Acceptance Criteria

1. THE Tech_Tree SHALL organize technologies into tiers: T1(Survival), T2(Processing), T3(Stable_Supply), T4(Old_World_Tech)
2. THE Tech_Tree SHALL require Research Points (RP) and material costs for each technology
3. WHEN researching, THE Tech_Tree SHALL validate prerequisites and resource availability
4. THE Tech_Tree SHALL unlock buildings, recipes, and system features upon completion
5. THE Tech_Tree SHALL support branches: Building, Agriculture, Industry, Civic, Exploration

### Requirement 9: 先锋营地系统

**User Story:** As a player, I want to establish outposts, so that I can explore distant regions and extend my supply lines.

#### Acceptance Criteria

1. THE Outpost_System SHALL allow building outposts at discovered map nodes after researching Vanguard_Camp_I
2. THE Outpost_System SHALL require resources and personnel to establish: Scrap 120 + Wood 60 + Metal 25 + Parts 8 + supplies
3. THE Outpost_System SHALL support outpost levels 1-3 with increasing capacity and range
4. THE Outpost_System SHALL track supply line stability: base 70, decay rate based on distance
5. WHEN stability drops below 40, THE Outpost_System SHALL trigger supply disruption events
6. THE Outpost_System SHALL support modules: Storage, Workshop, Infirmary, Watchtower, Radio_Relay

### Requirement 10: 用户界面系统

**User Story:** As a player, I want a clear and atmospheric interface, so that I can easily manage my settlement and immerse in the wasteland experience.

#### Acceptance Criteria

1. THE UI_System SHALL use three-column layout: Resources(left), Interaction(center), Details(right)
2. THE UI_System SHALL display real-time resource quantities, production rates, and storage limits
3. WHEN resources are critically low, THE UI_System SHALL highlight warnings in red
4. THE UI_System SHALL use retro terminal aesthetic: dark background(#1a1a1a), amber text(#ffbf00), monospace font
5. THE UI_System SHALL display event log with fade effects for narrative immersion
6. THE UI_System SHALL support responsive design for PC and mobile browsers

### Requirement 11: 数据持久化系统

**User Story:** As a player, I want my game progress to be saved automatically, so that I can continue playing across sessions.

#### Acceptance Criteria

1. THE Game_System SHALL auto-save to localStorage every 10 seconds
2. THE Game_System SHALL serialize complete game state to JSON format
3. WHEN loading, THE Game_System SHALL validate save data integrity
4. THE Game_System SHALL support manual save and load operations
5. THE Game_System SHALL support save export and import for backup

### Requirement 12: 物品耐久与修理系统

**User Story:** As a player, I want equipment to have durability, so that I must maintain my gear and make strategic choices about repairs.

#### Acceptance Criteria

1. THE Game_System SHALL track durability (Dur) in AU units for all equipment
2. WHEN equipment is used, THE Game_System SHALL reduce durability: 1 Dur per 1 AU activity (0.5 for half phases)
3. WHEN durability reaches zero, THE Game_System SHALL mark equipment as broken
4. THE Game_System SHALL allow salvaging broken equipment for 20-40% material value
5. THE Game_System SHALL allow repairing equipment using Repair_Kit to restore durability

### Requirement 13: 医疗与状态系统

**User Story:** As a player, I want to manage character health and status effects, so that I can keep my settlers alive and productive.

#### Acceptance Criteria

1. THE Game_System SHALL track Health (0-100) for each character:
   - Health < 50: efficiency reduced by 30%
   - Health < 20: cannot work, risk of death
   - Health = 0: character dies

2. THE Game_System SHALL support status effects:
   - Bleed (流血): loses 5 Health per AU until treated with Bandage
   - Infection (感染): loses 3 Health per AU, spreads if untreated
   - Poisoned (中毒): loses 2 Health per AU, reduced efficiency
   - Radiation (辐射): loses 1 Health per AU, cumulative damage

3. THE Game_System SHALL support medical items:
   - Bandage (绷带): 6 VU, stops Bleed, +8 Health
   - Antiseptic (消毒剂): 24 VU, clears light Infection, +5 Health
   - Painkillers (止痛片): 9 VU, halves damage this AU, +1 Morale
   - Medkit (医疗包): 41 VU, +35 Health, clears medium Infection
   - Meds (药品): 320 VU, +80 Health, clears severe Infection, 1 AU immunity
   - Stimulant (兴奋剂): 30 VU, +20% efficiency for 1 AU, then -10 Health
   - Antitoxin (解毒剂): 45 VU, clears Poisoned/light Radiation

4. THE Game_System SHALL track Morale (-5 to +5):
   - Morale +1 ≈ 3 VU value (affects recruitment rate)
   - Morale < -3: risk of desertion
   - Morale > +3: bonus to recruitment and efficiency

### Requirement 14: 工具系统

**User Story:** As a player, I want to craft and use tools, so that I can improve efficiency and unlock new actions.

#### Acceptance Criteria

1. THE Game_System SHALL support tools with durability and effects:
   - Shovel (简易铲): 27 VU, 40 Dur, +10% Scavenger output
   - Crowbar (撬棍): 18 VU, 50 Dur, +15% lock success, +1 ATK temp
   - Multi-tool (多用工具): 29 VU, 60 Dur, +15% Workshop efficiency (1 engineer)
   - Binoculars (望远镜): 18 VU, 80 Dur, -20% ambush rate
   - Lockpick_Set (开锁器): 29 VU, 30 Dur, +35% lock success
   - Portable_Filter (便携滤水器): 27 VU, 50 Dur, 80% Dirty_Water→Water per AU
   - Repair_Kit (修理包): 22 VU, 10 uses, restores 10 Dur per use

2. WHEN tool durability reaches zero, THE Game_System SHALL mark it as broken
3. THE Game_System SHALL allow salvaging broken tools for 20-40% material value

### Requirement 15: 武器系统

**User Story:** As a player, I want to craft and equip weapons, so that I can defend against threats and explore dangerous areas.

#### Acceptance Criteria

1. THE Game_System SHALL support melee weapons:
   - Rusty_Pipe (生锈铁管): 0-20 VU, 60 Dur, ATK +2
   - Scrap_Dagger (废铁匕首): 24 VU, 50 Dur, ATK +3, +5% ambush
   - Spear (简易长矛): 36 VU, 70 Dur, ATK +4, +10% initiative
   - Nail_Bat (钉刺球棒): 35 VU, 80 Dur, ATK +5, +10% Bleed chance
   - Scrap_Crossbow (简易弩): 33 VU, 50 Dur, ATK +6, requires bolts

2. THE Game_System SHALL support firearms:
   - Pistol (手枪): 84 VU, 80 Dur, ATK +7, requires 9mm ammo
   - Shotgun (霰弹枪): 130 VU, 70 Dur, ATK +9, area effect, requires 12GA
   - Rifle (步枪): 174 VU, 100 Dur, ATK +10, +5% accuracy, requires rifle ammo

3. THE Game_System SHALL support ammunition:
   - 9mm (10 rounds): 178 VU, for Pistol
   - 12GA (10 rounds): 242 VU, for Shotgun
   - Rifle_Ammo (10 rounds): 224 VU, for Rifle
   - Bolts (10): 50 VU, for Crossbow

### Requirement 16: 护甲系统

**User Story:** As a player, I want to craft and equip armor, so that I can reduce damage taken in combat.

#### Acceptance Criteria

1. THE Game_System SHALL support armor with DEF bonuses:
   - Rag_Coat (破布外套): 0-15 VU, 80 Dur, DEF +1
   - Leather_Armor (皮质护甲): 23 VU, 90 Dur, DEF +2, cold resistance
   - Scrap_Plate (废铁板甲): 67 VU, 100 Dur, DEF +3, -5% movement
   - Reinforced_Armor (加固护甲): 79 VU, 120 Dur, DEF +4, -10% Bleed chance
   - Combat_Armor (战斗护甲): 128 VU, 150 Dur, DEF +6, -10% Infection chance

2. WHEN armor durability reaches zero, THE Game_System SHALL mark it as broken
3. THE Game_System SHALL allow salvaging broken armor for 20-40% material value

### Requirement 17: 行动系统

**User Story:** As a player, I want to perform various actions during each phase, so that I can manage my settlement effectively.

#### Acceptance Criteria

1. THE Game_System SHALL support short actions (0.5 AU, Dawn/Noon only):
   - Organize_Inventory: sort perishables and damaged items
   - Quick_Scavenge: +small Scrap, chance for materials
   - Treat_Wound: use Bandage/Antiseptic
   - Quick_Cook: Raw_Meat/Vegetables → Food (low efficiency)
   - Minor_Repair: Repair_Kit restores 5 Dur
   - Purify_Small: Dirty_Water → Water (small amount)

2. THE Game_System SHALL support standard actions (1 AU):
   - Salvage: equipment/junk → materials (20-40% value)
   - Workshop_Craft: Scrap → Wood/Metal/materials/chemicals
   - Batch_Ammo: produce 10 rounds per batch
   - Hunt: produce Raw_Meat/Food
   - Explore: enter map node (consumes supplies)
   - Trade: exchange resources with traders
   - Research: spend RP on technology
   - Build: construct or upgrade buildings
   - Assign_Workers: change job assignments

3. WHEN action is selected, THE Game_System SHALL validate requirements and show preview
4. WHEN action completes, THE Game_System SHALL display results in event log

### Requirement 18: 地图与区域系统

**User Story:** As a player, I want to explore a detailed map with multiple regions, so that I can discover resources and advance the story.

#### Acceptance Criteria

1. THE Exploration_System SHALL support map regions with tier labels:
   - T0 Base: 营地/工坊/仓库
   - T1 Near_Suburbs: 塌陷公路、干涸河床、废弃农庄、小镇边缘
   - T2 Outer_City: 破败社区、旧加油站、地下排水道、匪徒哨站
   - T3 Industrial: 旧工厂区、军事检查站、坠毁直升机、信号塔废墟
   - T4 Old_Facilities: 研究避难所、数据中心、地铁深层、净水厂核心区
   - T5 Forbidden_Zone: 反应堆心脏、AI控制室、核心实验舱

2. THE Exploration_System SHALL apply risk coefficients by tier:
   - T1: 0.10 (low risk)
   - T2: 0.25 (medium risk)
   - T3: 0.45 (high risk)
   - T4: 0.70 (very high risk)
   - T5: 1.10 (extreme risk)

3. THE Exploration_System SHALL calculate expected loot value:
   - Expected_Value = Base_Value × (1 + Risk_Coefficient)

4. THE Exploration_System SHALL support multiple spawn points near suburbs:
   - River_Community (河畔社区): Water=2, medium Fertility, low Salvage
   - Highway_Service (高速服务区): high Salvage, good Road access
   - Industrial_Edge (工业带边缘): high Salvage, medium Richness, higher risk
   - Orchard_Slope (果园缓坡): high Fertility, Water=1

5. THE Exploration_System SHALL track map node states: undiscovered, discovered, explored, cleared

### Requirement 19: 贸易系统

**User Story:** As a player, I want to trade with merchants, so that I can exchange surplus resources for needed items.

#### Acceptance Criteria

1. THE Game_System SHALL support trading after Radio_Tower L1 is built
2. THE Game_System SHALL calculate trade prices based on VU values with spread:
   - Buy price = VU × 1.3 (30% markup)
   - Sell price = VU × 0.7 (30% discount)
3. THE Game_System SHALL support special traders during Evening phase
4. THE Game_System SHALL use Meds as hard currency for high-value trades
5. WHEN trading, THE Game_System SHALL validate inventory space and resource availability

### Requirement 20: 事件系统

**User Story:** As a player, I want random events to occur, so that the game feels dynamic and unpredictable.

#### Acceptance Criteria

1. THE Game_System SHALL trigger events based on phase and conditions:
   - Dawn: weather events, morning discoveries
   - Evening: raids, black market traders
   - Midnight: high-risk/high-reward events, creature attacks

2. THE Game_System SHALL support event types:
   - Resource_Discovery: find bonus resources
   - Wanderer_Arrival: new settler joins (if Bonfire lit and space available)
   - Raid: defend against attackers
   - Trader_Visit: special trading opportunity
   - Weather: affects production and exploration
   - Story_Signal: narrative progression (requires Radio_Tower)

3. THE Game_System SHALL display events in the event log with narrative text
4. THE Game_System SHALL allow player choices for some events
# 尘埃与回响（Dust & Echoes）项目设计报告（整合版）

- 版本：V2-Integrated（综合 New Chat.md / 规划1.md / 加载上下文准备任务.md）
- 生成日期：2025-12-26

---

## 0. 文档整合说明

### 0.1 目标
将三个来源文件中的**原始信息、原始设计**进行统一编排，形成一份可执行、可落地、逻辑自洽的《项目设计报告》；在存在冲突时采用“**统一口径 + 保留原文备份**”的方式合并。

### 0.2 主要来源
- New Chat.md：总体PRD、AU/VU统一标尺、区域/探索/事件库模板、OptionSet、战斗与装备表等。
- 规划1.md：AU/VU价值推导、区域（R1~R17）示例、收益计算方法、NPC与事件池样例、弹药价值等。
- 加载上下文准备任务.md：建筑/生产/科技/先锋营地（V2）详细落表与平衡约束、以及“城建日结版本”的资源/建筑字段设计等。

### 0.3 合并方法（原则）
1. **优先统一“度量体系”**：时间 → AU；价值 → VU；制造/研究 → Work / RP；建造 → CP（施工点）；补给/运输 → TE（运力）。
2. **不丢弃原文**：对同一系统的多版本描述，正文给出“统一后的最终口径”，并在附录保留“原文配置/表格/模板”。
3. **冲突合并**：对同一概念出现不同单位或数值时，尽量通过“尺度映射、层级拆分（V1核心 vs V2扩展）、或参数可配置化”合并，而非直接删改。

---

## 1. 项目概述

### 1.1 项目定位
- 类型：Web端文字冒险 + 增量挂机（Incremental）+ 资源策略 + 节点探索  
- 对标氛围与系统：A Dark Room / Kittens Game  
- 核心差异化：更细的地图节点推进、更可扩写的事件库与OptionSet、以及“远征闭环（前哨/补给/科技/终局工程）”。

### 1.2 核心体验目标
1. **压迫感生存**：食水、疾病、噪音与警戒持续施压；胜利来自规划而非操作。
2. **可量化平衡**：所有产出/消耗/成本统一到 AU 与 VU，可计算可调参。
3. **内容规模化**：事件以模板 + OptionSet 复用结构批量扩写，降低写作与维护成本。
4. **远征闭环**：探索获得稀有/科技物 → 反哺基地与前哨 → 打开更深区域与终局。

---

## 2. 统一度量体系（最终口径）

> 这一节是“冲突合并”的关键：之后所有系统都必须引用这里的单位与公式。

### 2.1 时间：AU（Action Unit）
- 一天拆分为 6 个行动阶段，总计 **5 AU**：清晨0.5、上午1、午间0.5、下午1、傍晚1、午夜1。  
- 所有行动（移动/搜刮/战斗/扎营/治疗/修理/制作）都以 AU 计价。
- **兼容旧“分钟/秒tick”草案**：旧文档以“分钟/秒”为显示或内部tick单位；在整合版中统一将其解释为“AU粒度”或“内部实现tick”，但**设计与平衡只用 AU**（详见附录：原始PRD伪代码）。

### 2.2 价值：VU（Value Unit）+ Work（工程工作量）
- 定义：**1 VU = 1 Scrap（废料）**  
- 劳动力锚点：**1 人·AU 的有效劳动产出 = 15 VU**  
- 工程 Work：工程师 1 人 / 1 AU 产出 **60 Work**，并定义 **1 Work = 0.25 VU**。
- 生存消耗（按AU）：每人每 1 AU 消耗 Water 1.0、Food 1.2（清晨/午间因0.5AU自动减半）。  
  - 折算价值：水 5 VU、食物 25/6≈4.167 VU → 合计≈10 VU/人/AU  
  - 因此理论净盈余：**15 - 10 = 5 VU/人/AU**（难度曲线的“物理常数”）。

### 2.3 关键系统货币与状态量
- CP：施工点（Construction Points），用于建造/升级进度。
- RP：研究点（Research Points），用于科技解锁；可与“ResearchWork/RW”在实现层合并为同一数值（见科技树附录）。
- SD：勘测数据（Survey Data），来自探索/先锋营地，用于高阶科技门槛。
- TE：运力（Transport Equivalent），用于补给线/车队任务结算。
- Alert：区域警戒（越高越危险、难度越大、事件更偏战斗/封锁）。
- Fatigue：疲劳（影响检定与战斗命中等）。
- Noise：噪音（行动与战斗会抬升警戒）。

---

## 3. 核心玩法循环（闭环）

### 3.1 三大循环
1) 采集与生存：水/食/基础物资保障 → 资源不足触发危机（效率下降、人口损失事件）。
2) 建设与扩张：建筑→岗位→生产链→仓储→人口→效率提升。
3) 探索与叙事：节点推进→事件与战斗→稀有科技物→解锁新系统与终局工程。

### 3.2 阶段节奏
- 前期：紧张（供需临界、手动强）
- 中期：稳定（工坊/生产链成型、岗位解放）
- 后期：再紧（芯片/能源核心/补给线成为瓶颈）
- 终局：远征+先锋营地+科技树+终局工程回收

---

## 4. 资源与物品体系（按“层级+用途”组织）

### 4.1 分层结构（V1核心）
- 生存：Water / Food / DirtyWater / Meat / Canned / Veg 等
- 基础建设：Scrap（基准） + Wood / Metal（二级材料，来自工坊）
- 组件与材料扩展（V2）：Cloth / Plastic / Glass / Rubber / Wire / Rope / Tape / Fasteners 等
- 化工与能源：Solvent / Acid / Gunpowder / Fuel / Filter / SealRing / BatteryCell 等
- 科技硬通货：Meds / Microchip / PowerCore / DataTape / RadioParts 等

> 注：所有可制作物均建议用“Scrap + Work”方式定价，天然可平衡。

### 4.2 工坊核心配方（V1锁定）
- Wood：4 Scrap + 16 Work → 1 Wood（=8 VU）
- Metal：8 Scrap + 32 Work → 1 Metal（=16 VU）

### 4.3 仓储与堆叠
- Warehouse（仓库）按等级提升 Water/Food/Scrap/Wood/Metal 以及组件/化工/科技物的统一上限，避免溢出浪费。
- 易腐逻辑：Meat/Veg 等可在“午夜”阶段腐坏（与AU日分段系统对齐）。

---

## 5. 人口与岗位（基地经营）

### 5.1 人口上限与扩张
- 通过 Shelter 等建筑扩张人口上限；人口增长带来“净 5 VU/人/AU”的长期收益，但会同时抬升食水压力与探索补给压力。

### 5.2 岗位体系（V1）
- 拾荒者：产 Scrap（基准）
- 集水者：产 Water
- 猎人：产 Food
- 工程师：产 Work（驱动制造）
- 研究员：产 RP（驱动科技）
- 守卫/斥候：影响基地/先锋营地安全与侦查（V2深入）

---

## 6. 建筑与生产体系

> 本节分两层：  
> - **V1（核心实现）**：以 AU/VU 为主的“增量基地系统”。  
> - **V2（扩展保留）**：以“日结/原料-加工-成品/footprint/邻接”为主的“城建规格”。两者通过“资源映射层+参数可配置”合并。

### 6.1 建造与升级（V1核心口径）
- CP（施工点）推进建造队列；每个工人/建筑可提供 CP 产出，队列支持暂停与资源锁定。
- 升级曲线建议配置化：成本倍率、效率倍率、最大岗位数增长等（保留旧文档的指数曲线建议，同时兼容新文档的线性效率方案）。

### 6.2 V1核心建筑（示例清单，详细成本见附录/原文）
- Bonfire（篝火）：初始核心（吸引人口/解锁基础UI与岗位）
- Shelter（住所）：人口上限 +2/个，成本递增
- Warehouse（仓库）：扩容（基础资源 + 材料/化工/科技物）
- Water Collector / Trap / Scavenge Post：三大基础生产建筑（L1~L5，含最大岗位数与效率提升）
- Workshop（工坊）：Scrap+Work → Wood/Metal，并扩展组件/化工/能源配方
- Radio Tower：探索深度、剧情信号、远征/中继科技门槛
- Trade Post：贸易与价格锚（建议保留买卖价区间与NPC交易事件）
- Clinic / Study Desk / Archive / Research Lab：医疗与研究体系的入口

### 6.3 V2扩展：城建规格（保留）
- 完整的建筑字段定义：id/tier/category/footprint/build_cost/jobs/inputs/outputs/upkeep/storage/radius/adjacency_bonus 等。
- 资源链：Raw（Wood/Stone/Clay/Ore/Coal…）→ Processed（Planks/Bricks/Ingots…）→ Goods（Tools/Components/Medicine/Preserves…）→ Meta（RP/SD）。
- 统一策略：V2 的 Raw/Processed/Goods 资源可作为 V1 的“扩展材料”实现；V1 的 Wood/Metal 视为“加工品层级（Processed）”，并通过工坊/加工建筑实现转换。

> V2城建的详细落表（建筑清单与字段）保留在附录《城建版建筑与生产明细》。

---

## 7. 科技树与解锁体系（合并版）

### 7.1 研究货币合并
- V1：以 RP（研究点）为主，部分节点需要 SD（勘测数据）门槛。
- V2：以 ResearchWork/RW 为主，并可用 Data Tape 抵扣部分研究量（将探索成果转为研发节奏）。

**合并方案**：实现层可统一为一个数值 `RP_raw`（本质就是RW），UI显示为 RP；Data Tape 的“抵扣”逻辑保留。

### 7.2 科技树结构（主线）
- 建筑与材料（Build & Materials）
- 农业与食品（Food & Agriculture）
- 工业与能源（Industry & Power）
- 民生与管理（Civic & Logistics）
- 探索与先锋体系（Exploration & Vanguard）

> 详细节点成本/前置/效果：见附录《科技树（VU+RW）》与《科技分支节点（RP+SD）》。

---

## 8. 地图、区域与探索系统（AU驱动）

### 8.1 地图结构（内圈+外圈）
- 内圈原型：21×21（x,y∈[-10,10]），基地(0,0)，四向移动。
- 扩展：地图长宽扩大一倍 → 42×42。  
  - 原文存在坐标范围两种写法（[-20,20] vs [-21,20]），整合版建议采用 **[-21,20]** 以严格对应 42 格，并保持内圈坐标不变。

### 8.2 区域层级（T1~T5）与主干线路
- T1 近郊：R1-R4
- T2 外环：R5-R8
- T3 危险区：R9-R12 + R17
- T4 高危设施：R13-R15
- T5 禁区核心：R16
并保留三条主干推进线路（东线/西线/南线）。

### 8.3 探索行动菜单（AU成本）
- MV 移动：0.5AU / 格；疾行与勘察路线可降低移动成本
- QS 快速搜：0.5AU
- SE 标准搜：1AU
- TH 深搜：1AU（高收益高风险）
- SC 侦查：0.5AU（降低风险/提升伏击概率）
- PL 潜入：1AU（更赚但更危险，受STEALTH/DC影响）
- HK 黑入：1AU（需电芯/电池，受TECH/DC影响）
- CP 扎营：1AU（恢复/消耗/事件）
- BR 休整/修理/止血：0.5AU~1AU（按OptionSet与物品）

### 8.4 区域价值模型与调参
- 用 `ρ`（风险强度）、`m`（移动/额外成本系数）、以及 `E_loot / E_loss` 推导 `ValueVU/AU`，并用 NetA/NetB 描述“主线推进收益 vs 纯刷资源收益”的差异。
- 规划1.md 给出了多个区域的“节点SP + 搜索事件池 + 期望收益”样例，可直接作为早期内容与调参基准。

---

## 9. 事件系统（预算驱动 + OptionSet 复用）

### 9.1 总体结构
- 事件引擎按区域类别抽取事件模板；事件引用 OptionSet（选项集）获得统一的“检定/倍率/后果”。
- 预算体系：用 NetBudget 拆分 LootBudget 与 LossBudget，保证高收益伴随高风险，可计算可调参。
- DC（难度）由区域ρ、警戒Alert、疲劳Fatigue、负重等共同决定。

### 9.2 内容规模化
- 10类区域 × 30事件 = 300条事件模板（已在 New Chat.md 中完整给出）。  
- 24组 OptionSet 覆盖 90% 事件分支（OS-01~OS-24）。

> OptionSet 与事件库模板原文，整合版完整保留于附录（可直接转成 JSON 配置）。

---

## 10. 战斗系统（与ρ/Alert/Noise完全耦合）

### 10.1 目标体验
- 半自动回合制文本战斗：玩家每回合只选“战术按钮”，不做每人微操。
- 噪音与警戒：武器噪音 → 战斗后Alert上升 → 后续事件更危险，形成闭环。

### 10.2 数值要素
- 属性：HP / AR / ACC / EVA / DmgBase±Var / 状态（Bleed/Infection/Stun/Burn…）
- 遭遇等级：EL = BaseTier + 0.5ρ + 0.25Alert + Mode
- 敌人数：1 + floor(EL/2)，精英概率与Alert/EL挂钩。

### 10.3 装备表与敌人模板
- 15个敌人模板（含LootTag）
- 20把武器 + 12件护甲（含耐久/噪音/AR/ACC/EVA）
- 耐久与修理：可通过NPC或基地设施把“耐久损耗”显性化（规划1.md 的老油桶NPC设想可作为锚点）

> 敌人模板与装备表原文完整保留于附录。

---

## 11. 先锋营地（前哨/补给/远征闭环）

### 11.1 定位
先锋营地不是第二个基地，而是**可建设的前沿节点**：  
- 让玩家在外圈远征时拥有仓储/修理/医疗/侦查/通讯等能力，  
- 并通过补给线与车队系统把“距离压力”转成“网络规划乐趣”。

### 11.2 核心机制
- 营地建在地图节点上；有存储与稳定度；需要补给线维持。
- 可装模块：仓储/瞭望塔/无线电中继/野战工坊/医疗帐等。
- 断供惩罚：效率下降、稳定度下降、触发袭击/盗抢事件等。

> 先锋营地的详细规则与模块清单保留于附录（含补给线机制与科技门槛）。

---

## 12. UI/UX 与技术实现（保留原三栏终端风）

### 12.1 UI布局
- 左栏：资源与上限、产出速率、警戒等
- 中栏：日志流 + 当前场景操作区
- 右栏：建筑/人口分配/背包/探索队状态

### 12.2 技术建议
- 前端：React 或 Vue3；状态管理：Redux Toolkit / Pinia；样式：Tailwind
- 存储：localStorage 自动保存 JSON；可选云存档 Firebase/Supabase
- 工程落地建议：强数据驱动（items/buildings/tech/events/optionsets/enemies 皆为配置），方便内容扩展与平衡迭代。

---

## 13. 版本里程碑与变现（不破坏平衡）

### 13.1 路线（保留PRD意图）
- Phase 1：MVP（基地生存+基础建筑+保存/离线）
- Phase 2：探索地图与事件（T1~T2区域）
- Phase 3：战斗、工坊深度、科技树与T3区域
- Phase 4：地图×2、先锋营地、补给线、终局工程（反应堆/核心区）

### 13.2 变现建议
- 去广告/赞助（不影响数值）
- 皮肤主题（UI/字体/配色）
- 内容DLC（事件包/剧情包），避免P2W

---

# 附录（原文保留，便于直接落地成配置）

> 说明：以下附录尽量保留原始文本与表格结构，以便直接迁移为 JSON / 表格资产。

---

## 附录A：OptionSet（原文）

# B) 选项集 OptionSet（核心复用件：包含选项、检定、倍率、后果）
下面 24 组选项集覆盖 90%事件。  
**事件库只需要引用 OptionSet，就天然包含“选项+检定+预算倍率”。**

> 记号：  
> - 技能：SCOUT/STEALTH/SURVIVAL/TECH/MED/COMBAT/BARTER  
> - 成功/勉强/失败三段结果  
> - `AlertΔ / FatigueΔ / NoiseΔ / SPΔ` 均为额外变化（动作本身已有基础变化）

---

## OS-01 基础翻找（安全）
- 选项A【翻找】无检定：`L×1.00 K×1.00`，AlertΔ+0，FatigueΔ+0  
- 选项B【只拿显眼的】无检定：`L×0.70 K×0.60`，AlertΔ-0.2  
- 选项C【离开】无检定：`L×0 K×0`（无收益无损失）

## OS-02 翻找 vs 潜入（更赚但更危险）
- A【翻找】无检定：`L×1.00 K×1.00`  
- B【潜入翻找】STEALTH / `DC_M`：  
  - 成功：`L×1.25 K×0.90`，AlertΔ-0.2  
  - 勉强：`L×1.05 K×1.05`，AlertΔ+0.5  
  - 失败：触发敌对事件（同一节点立即抽一次 E 类），AlertΔ+2  
- C【离开】同 OS-01

## OS-03 上锁容器（撬锁/强拆/放弃）
- A【撬锁】TECH / `DC_M`，需 Lockpick 或 Crowbar（二选一）：  
  - 成功：`L×1.60 K×1.10`，AlertΔ+0.5  
  - 勉强：`L×1.25 K×1.25`，工具Dur-1  
  - 失败：`L×0.30 K×1.60`，触发陷阱或敌对（50/50）
- B【强拆】COMBAT / `DC_L`：  
  - 成功：`L×1.30 K×1.30`，NoiseΔ+1.0（很吵）  
  - 失败：`L×0.40 K×1.50`，AlertΔ+2  
- C【放弃】无检定：`L×0 K×0`

## OS-04 机柜/终端外设（拆/拿/走）
- A【拔线拿外设】TECH / `DC_L`：成功 `L×1.10 K×0.90`，失败 `L×0.30 K×1.20`（电击/告警）  
- B【整台搬走】无检定：`L×1.35 K×1.05`，但重量+（容易超载）  
- C【离开】无

## OS-05 取水点（过滤/装脏水/冒险喝）
- A【过滤净化】SURVIVAL / `DC_L`，需 Filter：  
  - 成功：`L×1.15 K×0.85`（更偏 Water）  
  - 失败：`L×0.60 K×1.20`（Filter耐久/损失）
- B【装脏水就走】无检定：`L×0.90 K×0.80`（偏 DirtyWater）  
- C【直接喝】无检定：`L×0.40 K×1.40`（高感染/中毒权重）

## OS-06 食物点（烹饪/带走生食/放弃）
- A【简单处理】SURVIVAL / `DC_L`：成功 `L×1.10 K×0.85`（食物腐败更慢），失败 `L×0.70 K×1.10`  
- B【带走】无：`L×1.00 K×1.00`  
- C【放弃】无

## OS-07 毒雾/异味（过滤/憋气快取/撤离）
- A【用 Filter 通过】SURVIVAL / `DC_L`，需 Filter：成功 `L×1.05 K×0.90`；失败 `L×0.60 K×1.30`（感染/HP损）  
- B【憋气冲刺】SURVIVAL / `DC_M`：成功 `L×1.20 K×1.20`；失败 `L×0.20 K×1.80`  
- C【撤离】无：`L×0 K×0`，AlertΔ-0.3（你没惊动太多）

## OS-08 坍塌/高处（绕路/攀爬/挖掘）
- A【绕路】无：`L×0.80 K×0.70`（更慢但安全）  
- B【攀爬】SURVIVAL / `DC_M`：成功 `L×1.10 K×1.05`；失败 `L×0.30 K×1.60`（流血）  
- C【挖掘】COMBAT / `DC_M`：成功 `L×1.25 K×1.20`，AlertΔ+0.8

## OS-09 电击/短路（断电/硬拔/撤离）
- A【断电再动】TECH / `DC_M`：成功 `L×1.30 K×1.00`；失败 `L×0.40 K×1.50`（眩晕/HP损/告警）  
- B【硬拔】无：`L×1.15 K×1.35`，AlertΔ+1  
- C【撤离】无

## OS-10 火灾/热源（灭火/抢物资/撤离）
- A【灭火】SURVIVAL / `DC_M`：成功 `L×1.05 K×0.95`；失败 `L×0.20 K×1.80`  
- B【抢救物资】COMBAT / `DC_L`：成功 `L×1.35 K×1.35`；失败 `L×0.30 K×1.70`  
- C【撤离】无

## OS-11 伏击前兆（侦查绕开/潜行/硬闯）
- A【绕开】SCOUT / `DC_L`：成功 `L×0.60 K×0.40`（少赚但很安全），失败转敌对  
- B【潜行通过】STEALTH / `DC_M`：成功 `L×0.85 K×0.85`（还能捡点），失败转战斗（伏击你）  
- C【硬闯】无：`L×1.05 K×1.20`，必进入战斗（你先手概率低）

## OS-12 遭遇敌对（交涉/撤退/战斗）
- A【交涉】BARTER / `DC_M`：成功 `L×0.70 K×0.70`（交点物资过关），失败进入战斗且AlertΔ+1  
- B【撤退】用撤退检定：成功脱离；失败触发追击战  
- C【战斗】进入战斗：战利品用战斗预算，Alert 增加按噪音规则

## OS-13 野兽/猎物（设陷阱/追踪/放弃）
- A【设陷阱】SURVIVAL / `DC_M`：成功 `L×1.25 K×1.00`（偏 Meat/Leather），失败 `L×0.30 K×1.30`（受伤/空）  
- B【追踪】SCOUT / `DC_M`：成功 `L×1.10 K×1.10`（更可能引战），失败 `L×0.50 K×1.10`  
- C【放弃】无

## OS-14 医疗处理（包扎/消毒/硬扛）
- A【包扎】MED / `DC_L`，消耗 Bandage 1：成功 `K×0.70`（减少后续损失），失败浪费物资  
- B【消毒】MED / `DC_M`，消耗 Antiseptic 1：成功 `K×0.55`（防感染），失败 `K×1.10`  
- C【硬扛】无：`K×1.40`

## OS-15 修理维护（修/将就/拆解）
- A【修理】TECH / `DC_L`，消耗 RepairKit 1：成功武器/护甲Dur+10（不走预算），失败 RepairKit 浪费  
- B【将就】无：`K×1.10`（后续耐久损耗更大）  
- C【拆解回收】无：把破损装备折算为 Scrap/材料（按回收率）

## OS-16 终端黑入（插电黑入/只取走/撤离）
- A【黑入】TECH / `DC_H`，消耗 Cell 1（或 Pack 0.5）：  
  - 成功：`L×1.80 K×1.20`，偏 Data/Microchips/门禁  
  - 勉强：`L×1.30 K×1.50`，AlertΔ+2（留痕）  
  - 失败：`L×0.20 K×2.00`，触发安保（战斗）+告警
- B【只取走外设】TECH / `DC_L`：`L×1.05 K×0.95`  
- C【撤离】无

## OS-17 钥匙卡终端（军区/数据区）
- A【刷卡/口令】TECH / `DC_M`，需 Keycard 或口令Flag：成功解锁“门后事件池”（不直接给VU）  
- B【暴力破门】COMBAT / `DC_H`：成功 `L×1.60 K×1.60`，NoiseΔ+1.5，AlertΔ+2  
- C【撤离】无

## OS-18 爆破/强行开道（后期可选）
- A【爆破】需 Gunpowder 或爆破物：`L×1.90 K×1.70`，NoiseΔ+2.5，AlertΔ+3  
- B【放弃】无

## OS-19 NPC交易（买/卖/问情报/离开）
- A【买】BARTER / `DC_L`：成功买入价 ×0.95；失败 ×1.05  
- B【卖】BARTER / `DC_L`：成功卖出价 ×1.05；失败 ×0.95  
- C【问情报】SCOUT / `DC_L`：成功获得“坐标/事件权重调整/门禁提示”（Flag）  
- D【离开】

## OS-20 NPC委托（接/拒/讨价）
- A【接受】无：获得任务Flag（后续事件池插入奖励卡）  
- B【讨价】BARTER / `DC_M`：成功任务奖励预算+15%；失败 NPC 好感-  
- C【拒绝】

## OS-21 剧情碎片（记录/解析/忽略）
- A【记录】无：获得 StoryFlag 或 Signal+  
- B【解析】TECH / `DC_M`：成功解锁“下一层区域可见/剧情卡”  
- C【忽略】

## OS-22 夜间扎营（生火/无火/放哨）
- A【生火】消耗 Fuel 1：疲劳恢复更好（-20→-24），但 AlertΔ+0.8  
- B【无火隐蔽】疲劳恢复 -18，AlertΔ+0.3，且“夜袭概率-15%”  
- C【放哨】额外 0.5AU，夜袭概率 -40%

## OS-23 黑市/威慑（开枪/冷兵器/交易）
- A【开枪威慑】无：`L×1.10 K×1.20`，NoiseΔ+2.0（容易引来别的敌人）  
- B【冷兵器逼退】COMBAT / `DC_L`：成功 `L×1.05 K×1.05`，失败转战斗  
- C【交易】进入 OS-19（但价格波动更大）

## OS-24 告警处置（抹除痕迹/断电/跑路）
- A【抹除痕迹】TECH / `DC_H`：成功 Alert-3 & 告警-4（DATA区神器）；失败告警+2  
- B【断电】TECH / `DC_M`，消耗 Cell 1：成功告警-3；失败触发安保  
- C【跑路】无：撤离检定 +10%，但失去一次高收益机会（L×0.4）

---

---

## 附录B：事件库模板（10类×30条=300条，原文）

# C) 事件库模板：按“区域类别”给出每类 30 个事件
下面 10 个区域类别，每类**30个事件**（总计300）。  
事件条目格式：  
`[ID] 类别|触发  文案模板  选项集  标签(影响掉落/风险)  (可选特殊)`

> 占位符示例：  
> `{place}` `{container}` `{sound}` `{smell}` `{sign}` `{npc}`  
> 每个区域类别给一套“词库”，运行时随机填充，保证重复不腻。

---

## C1) RES 居住废墟类（SUBURB/OUTER）
**词库建议**
- place：公寓走廊/车库/小超市/诊所/楼梯间/屋顶/电梯井  
- container：储物柜/床垫夹层/工具箱/药柜/收银机/背包  
- sound：玻璃碎响/脚步回声/远处犬吠/楼上拖拽声  
- smell：霉味/消毒水残味/腐臭/煤烟

**事件 30**
1. `[RES-L01] L|QS/SE` “你在{place}的{container}里摸到一层灰，底下似乎有东西。” `OS-01` `scrap,cloth,plastic`  
2. `[RES-L02] L|SE/TH` “{container}上贴着半张标签：‘别动。’” `OS-02` `locked`  
3. `[RES-L03] L|PL/SE` “一道锈蚀的铁门挡住去路，门缝里透出一点冷光。” `OS-03` `locked,rare`  
4. `[RES-L04] L|QS` “收银机卡着，硬币槽里有东西在晃。” `OS-01` `scrap`  
5. `[RES-L05] L|SE` “药柜里有几支未开封的小瓶，但标签模糊。” `OS-01` `medical`  
6. `[RES-L06] L|TH` “你找到一间上锁的储藏间，里面传来轻微的滴水声。” `OS-03` `water,locked`  
7. `[RES-L07] L|SE` “床垫夹层里塞着一包发硬的饼干。” `OS-06` `food`  
8. `[RES-L08] L|QS/SE` “你翻到一只儿童书包，夹层里有硬壳盒。” `OS-01` `plastic,tape`  
9. `[RES-L09] L|SE` “天花板垂下电线，端头有烧焦痕。” `OS-04` `electronics,wire`  
10. `[RES-L10] L|TH` “你发现一条通往屋顶的安全门，门后似乎有人动过。” `OS-02` `intel`  

11. `[RES-H01] H|MV/QS` “{sound}突然从身后响起，你脚下的地面发出空洞回音。” `OS-08` `collapse`  
12. `[RES-H02] H|SE` “{smell}变得刺鼻——像是管道漏了。” `OS-07` `chemical`  
13. `[RES-H03] H|TH` “你推开门的一瞬间，粉尘像雾一样扑面。” `OS-07` `infection`  
14. `[RES-H04] H|SE` “电梯井里有反光，你看不清下面。” `OS-08` `fall`  
15. `[RES-H05] H|QS` “楼梯间的玻璃碎满地，走一步就响。” `OS-02` `stealth`  
16. `[RES-H06] H|SE` “消防栓被撬开，积水混着铁锈。” `OS-05` `water,dirty`  
17. `[RES-H07] H|TH` “你翻动旧沙发，突然有尖锐金属刺破布面。” `OS-14` `bleed`  
18. `[RES-H08] H|MV` “一阵风把门猛地拍上，回音传遍整栋楼。” `OS-24` `alert`  

19. `[RES-E01] E|MV/SE` “{place}尽头出现一个影子，停住了。” `OS-12` `raider`  
20. `[RES-E02] E|SE/TH` “你翻箱倒柜的声音引来了两名拾荒者，他们把手放到武器上。” `OS-12` `scavenger`  
21. `[RES-E03] E|MV` “一条野狗从暗处窜出，牙齿泛黄。” `OS-11` `beast`  
22. `[RES-E04] E|SE` “一个感染者从门后扑出，指甲里全是黑泥。” `OS-12` `infected`  
23. `[RES-E05] E|TH` “你撬门的声音太大——楼上有人开始下楼。” `OS-11` `ambush`  
24. `[RES-E06] E|MV` “远处的枪声后，街角出现一支巡逻小队。” `OS-12` `armed`  
25. `[RES-E07] E|SE` “你听见{sound}越来越近——不是风。” `OS-11` `ambush`  

26. `[RES-N01] N|MV/SE` “一盏小灯在窗后闪了两下，{npc}示意你靠近。” `OS-19` `npc,trade`  
27. `[RES-N02] N|SE` “{npc}递给你一张纸条：‘我需要药。你有吗？’” `OS-20` `npc,quest`  

28. `[RES-S01] S|SC/SE` “墙上有涂鸦：‘信号塔还亮着。别去数据园区。’” `OS-21` `story,signal`  
29. `[RES-S02] S|SE` “你在抽屉里找到半页日记，提到一张‘门禁卡’。” `OS-21` `story,keycard`  
30. `[RES-S03] S|HK` “一台老旧收银系统还有电，屏幕跳出一串坐标。” `OS-16` `story,data`  

---

## C2) NAT 农牧自然类（FARMLAND/FOREST）
**词库**
- place：果园/谷仓/猎人棚/林间小屋/灌木丛/枯井/溪流旁  
- container：麻袋/木箱/陷阱夹/兽皮包/铁锅  
- sound：乌鸦叫/枝叶摩擦/远处兽吼  
- smell：潮湿泥土/烟熏/腐果

**事件 30**
1. `[NAT-L01] L|QS/SE` “你在{place}旁发现{container}，里面有干燥的种子。” `OS-01` `seed,food`  
2. `[NAT-L02] L|SE` “一只废旧工具箱埋在泥里，锁扣还算完整。” `OS-03` `tools,fasteners`  
3. `[NAT-L03] L|SE/TH` “你找到一片草药丛，叶片边缘带锯齿。” `OS-01` `medical,herb`  
4. `[NAT-L04] L|QS` “树洞里塞着几根塑料绳，像有人藏过东西。” `OS-01` `rope,plastic`  
5. `[NAT-L05] L|SE` “谷仓梁上挂着风干肉，但周围有兽粪。” `OS-06` `food,infect`  
6. `[NAT-L06] L|TH` “你看见一条隐蔽小径通向猎人棚，门是上锁的。” `OS-03` `leather,ammo`  
7. `[NAT-L07] L|SE` “你在灌木丛里找到一把破弩和一袋弩箭。” `OS-01` `weapon,ammo`  
8. `[NAT-L08] L|QS/SE` “枯井边的桶还在，里面是半桶脏水。” `OS-05` `water,dirty`  
9. `[NAT-L09] L|SE` “蜂箱残骸里有一小瓶蜂蜜（甜味能提士气）。” `OS-01` `food,morale`  
10. `[NAT-L10] L|TH` “倒下的树干下压着一只背包，背带被血染黑。” `OS-02` `medical,scrap`  

11. `[NAT-H01] H|MV` “泥地突然塌陷，你的小腿陷进冷泥。” `OS-08` `trap`  
12. `[NAT-H02] H|SE` “空气里有甜腻的腐味，苍蝇密密麻麻。” `OS-07` `infection`  
13. `[NAT-H03] H|QS` “你踩到一只旧捕兽夹，齿口合上。” `OS-14` `bleed`  
14. `[NAT-H04] H|SE` “林间起雾，方向感开始消失。” `OS-11` `lost`  
15. `[NAT-H05] H|TH` “你翻开兽皮包，里面爬出一窝虫。” `OS-07` `infection`  
16. `[NAT-H06] H|MV` “树梢落下一阵碎枝，你暴露了位置。” `OS-24` `alert`  
17. `[NAT-H07] H|SE` “你发现水边有发光藻，喝了可能中毒。” `OS-05` `toxic`  

18. `[NAT-E01] E|MV/SE` “你看到新鲜的脚印——不是人类。” `OS-13` `beast`  
19. `[NAT-E02] E|SE` “一头野猪冲出灌木，直奔你来。” `OS-12` `beast,bleed`  
20. `[NAT-E03] E|MV` “狼群在远处绕圈，像在试探。” `OS-11` `beast`  
21. `[NAT-E04] E|TH` “你闯进了别人的猎场，树后有人拉弓。” `OS-12` `human`  
22. `[NAT-E05] E|SE` “一只感染鹿踉跄靠近，眼白发灰。” `OS-12` `infected`  
23. `[NAT-E06] E|MV` “夜里有影子贴地移动，像伏击。” `OS-11` `ambush`  
24. `[NAT-E07] E|SE` “你听见‘咔哒’一声——像枪机。” `OS-12` `armed`  

25. `[NAT-N01] N|MV/SE` “林间篝火旁坐着{npc}，他示意你别靠太近。” `OS-19` `npc,trade`  
26. `[NAT-N02] N|SE` “{npc}在修陷阱：‘给我线材，我给你肉干。’” `OS-20` `npc,quest`  

27. `[NAT-S01] S|SC` “你在树皮上看到刻痕：指向一处‘旧信号塔’方向。” `OS-21` `story,signal`  
28. `[NAT-S02] S|SE` “猎人棚里有一张地图碎片，标了‘军检站’。” `OS-21` `story,mil`  
29. `[NAT-S03] S|TH` “你翻出一份旧农场账本，提到‘净水厂的配额’。” `OS-21` `story,waterwork`  
30. `[NAT-S04] S|HK` “一台旧农业监测器还能亮，显示异常辐射值。” `OS-16` `story,warning`  

---

## C3) WAT 河谷水域类（RIVER/WATERWORK）
**词库**
- place：河滩/涵洞/泵房走廊/过滤车间/储水塔/阀门间  
- container：滤芯盒/工具柜/防护柜/维修包  
- smell：氯味/藻腥/铁锈  
- sound：滴水/水泵回声/水面拍击

**事件 30**
1. `[WAT-L01] L|QS/SE` “你在{place}捞起一个漂浮的{container}。” `OS-01` `water,filter`  
2. `[WAT-L02] L|SE` “阀门旁有一包备用密封圈。” `OS-01` `seal,rubber`  
3. `[WAT-L03] L|SE/TH` “过滤车间的防护柜是上锁的。” `OS-03` `filter,medical,locked`  
4. `[WAT-L04] L|QS` “你在水边找到半瓶净水，但瓶口有泥。” `OS-05` `water`  
5. `[WAT-L05] L|SE` “泵房地上散着线材与小齿轮。” `OS-01` `wire,gear`  
6. `[WAT-L06] L|TH` “储水塔下面有暗门，门后很冷。” `OS-03` `rare,water`  
7. `[WAT-L07] L|SE` “你发现一台坏掉的蒸馏器，外设还可以拆。” `OS-04` `electronics,parts`  
8. `[WAT-L08] L|HK` “控制面板还亮着，可能能调出水质日志。” `OS-16` `data,water`  
9. `[WAT-L09] L|SE` “化学桶上写着‘溶剂’，桶盖还封着。” `OS-01` `solvent,chemical`  
10. `[WAT-L10] L|TH` “你在排水沟里摸到一小袋底火。” `OS-01` `ammo`  

11. `[WAT-H01] H|SE` “{smell}突然浓烈——氯气泄漏。” `OS-07` `chemical`  
12. `[WAT-H02] H|MV` “地面湿滑，你差点摔进深水。” `OS-08` `fall`  
13. `[WAT-H03] H|QS` “水面冒泡，像有东西在下面。” `OS-11` `threat`  
14. `[WAT-H04] H|SE` “你拧动阀门，管道发出尖叫般的响声。” `OS-24` `alert`  
15. `[WAT-H05] H|TH` “一段老旧电缆裸露，火花四溅。” `OS-09` `electric`  
16. `[WAT-H06] H|SE` “脏水里有油膜，喝了必出事。” `OS-05` `toxic`  
17. `[WAT-H07] H|MV` “夜里水声盖住脚步声，你更难判断危险。” `OS-11` `night`  

18. `[WAT-E01] E|SE` “水蛭群贴在墙上，一动就扑。” `OS-12` `beast`  
19. `[WAT-E02] E|MV` “一个‘清算者’小队巡逻到这里。” `OS-12` `human,faction`  
20. `[WAT-E03] E|TH` “你撬柜子的声音引来守卫机器人。” `OS-12` `drone`  
21. `[WAT-E04] E|SE` “一名匪徒躲在泵房角落，枪口对着你。” `OS-12` `armed`  
22. `[WAT-E05] E|MV` “阴影里有东西游动，突然跃起。” `OS-11` `ambush`  
23. `[WAT-E06] E|HK` “你黑入的瞬间，告警灯亮起。” `OS-24` `security`  
24. `[WAT-E07] E|SE` “储水塔内回声很怪——像有多人。” `OS-11` `ambush`  

25. `[WAT-N01] N|MV/SE` “水贩{npc}在阴凉处摆着水桶。” `OS-19` `npc,trade`  
26. `[WAT-N02] N|SE` “{npc}指着阀门：‘帮我换密封圈，我给你滤芯。’” `OS-20` `npc,quest,seal`  

27. `[WAT-S01] S|SC/SE` “墙上刻着一句话：‘净水配额只给听话的人。’” `OS-21` `story,faction`  
28. `[WAT-S02] S|HK` “水质日志里出现‘核心区辐射上升’的记录。” `OS-16` `story,warning`  
29. `[WAT-S03] S|TH` “你在旧文件袋里找到一张‘军检站通行口令’残页。” `OS-21` `story,mil`  
30. `[WAT-S04] S|SE` “一只防水盒里放着写满坐标的纸条：‘数据园区入口’。” `OS-21` `story,data`  

---

## C4) HWY 道路交通类（HIGHWAY）
**词库**
- place：连环车祸带/收费站/服务区/护栏下/大巴残骸/路障  
- container：后备箱/工具袋/军用箱/油桶  
- sound：风穿过车壳/金属摩擦/远处引擎回声  
- smell：汽油/橡胶/焦糊

**事件 30**
1. `[HWY-L01] L|QS/SE` “你撬开{container}，里面全是碎屑。” `OS-01` `scrap,fasteners`  
2. `[HWY-L02] L|SE` “一辆翻覆货车的侧门半开着。” `OS-02` `metal,wire`  
3. `[HWY-L03] L|PL` “收费站的小屋锁着，玻璃后有个小盒。” `OS-03` `food,medical,locked`  
4. `[HWY-L04] L|SE/TH` “路边军用箱，锁扣完好。” `OS-03` `ammo,cell`  
5. `[HWY-L05] L|SE` “你拆下两条轮胎，还能用。” `OS-04` `rubber`  
6. `[HWY-L06] L|QS` “护栏下卡着一瓶水。” `OS-01` `water`  
7. `[HWY-L07] L|SE` “服务区便利店货架倒塌，罐头散了一地。” `OS-01` `food,canned`  
8. `[HWY-L08] L|TH` “油桶里还有残余燃料，但味道很冲。” `OS-01` `fuel,solvent`  
9. `[HWY-L09] L|SE` “你在车载电箱里摸到电芯。” `OS-04` `cell,electronics`  
10. `[HWY-L10] L|SC` “高处能看到远处‘军检站’的轮廓。” `OS-21` `story,mil`  

11. `[HWY-H01] H|MV` “路面碎玻璃太多，你踩得很响。” `OS-02` `stealth`  
12. `[HWY-H02] H|SE` “汽油味越来越浓——有人在泄油。” `OS-10` `fire`  
13. `[HWY-H03] H|MV` “风沙卷起，能见度骤降。” `OS-11` `lost`  
14. `[HWY-H04] H|SE` “你试图开车门，安全气囊突然爆开。” `OS-14` `stun`  
15. `[HWY-H05] H|TH` “你搬动钢板时，下面是一枚未爆雷。” `OS-18` `mine`  
16. `[HWY-H06] H|SE` “你翻找太久，远处传来脚步。” `OS-24` `alert`  
17. `[HWY-H07] H|MV` “夜里路面更空旷，任何声音都传很远。” `OS-11` `night`  

18. `[HWY-E01] E|MV/SE` “两个路匪从车后探头：‘交点东西。’” `OS-12` `raider`  
19. `[HWY-E02] E|SE` “一支巡逻队远远盯着你。” `OS-11` `ambush`  
20. `[HWY-E03] E|TH` “你强拆军箱的声音引来持枪者。” `OS-12` `armed`  
21. `[HWY-E04] E|MV` “野狗在护栏间追逐你。” `OS-11` `beast`  
22. `[HWY-E05] E|SE` “车祸带里躲着感染者。” `OS-12` `infected`  
23. `[HWY-E06] E|MV` “无人机扫过路面，探照灯停在你身上。” `OS-12` `drone`  
24. `[HWY-E07] E|SE` “你听到枪械上膛声。” `OS-12` `armed`  

25. `[HWY-N01] N|MV` “流浪车队停在路边，{npc}朝你招手。” `OS-19` `npc,trade`  
26. `[HWY-N02] N|SE` “{npc}说：‘帮我找回丢的底火，我送你一把枪。’” `OS-20` `npc,quest,ammo`  

27. `[HWY-S01] S|SE` “路牌背面写着：‘数据园区封锁。钥匙卡在军检站。’” `OS-21` `story,data`  
28. `[HWY-S02] S|SC` “你看到一串被反复擦掉的坐标，像是有人在躲什么。” `OS-21` `story,signal`  
29. `[HWY-S03] S|HK` “车载导航竟然还能亮，显示‘信号塔’方向。” `OS-16` `story,signal`  
30. `[HWY-S04] S|TH` “你在大巴行李舱找到一份通行口令清单。” `OS-21` `story,mil`  

---

## C5) IND 工业设施类（INDUSTRY）
**词库**
- place：装配车间/配电室/仓储区/化工库/传送带/控制室  
- container：机柜/工具柜/备件箱/防护柜  
- sound：电机余响/金属叮当/链条摩擦  
- smell：机油/酸味/臭氧

**事件 30**
1. `[IND-L01] L|SE` “{container}里是齐整的紧固件。” `OS-01` `fasteners,parts`  
2. `[IND-L02] L|SE/TH` “装配车间的备件箱锁着。” `OS-03` `gear,bearing,locked`  
3. `[IND-L03] L|SE` “你在配电室找到一捆线材。” `OS-01` `wire,electronics`  
4. `[IND-L04] L|HK` “控制台还亮：也许能读出生产日志。” `OS-16` `data,microchips`  
5. `[IND-L05] L|SE` “传送带上散着弹簧与管件。” `OS-01` `spring,pipe`  
6. `[IND-L06] L|TH` “化工库残桶写着‘溶剂’。” `OS-01` `solvent,acid`  
7. `[IND-L07] L|PL` “仓储区的防护柜有机械锁。” `OS-03` `cell,pack,locked`  
8. `[IND-L08] L|SE` “叉车电瓶还能拆。” `OS-04` `cell`  
9. `[IND-L09] L|TH` “你发现一台小型无人机维修台。” `OS-04` `microchips,parts`  
10. `[IND-L10] L|SE` “办公室抽屉里有数据磁带。” `OS-01` `data`  

11. `[IND-H01] H|SE` “{smell}刺鼻，化学品泄漏。” `OS-07` `chemical`  
12. `[IND-H02] H|TH` “你踩到油污，脚下一滑。” `OS-08` `fall`  
13. `[IND-H03] H|SE` “配电室火花乱跳。” `OS-09` `electric`  
14. `[IND-H04] H|MV` “金属回声太大，你难以判断脚步来源。” `OS-11` `ambush`  
15. `[IND-H05] H|TH` “你试图开柜，夹手。” `OS-14` `bleed`  
16. `[IND-H06] H|HK` “屏幕弹出告警：‘未授权访问’。” `OS-24` `security`  
17. `[IND-H07] H|SE` “夜里机器间更冷，呼气都白了。” `OS-22` `fatigue`  

18. `[IND-E01] E|MV/SE` “拾荒者团伙在拆机器，看见你就停手。” `OS-12` `scavenger`  
19. `[IND-E02] E|SE` “巡逻无人机转向你。” `OS-12` `drone`  
20. `[IND-E03] E|TH` “你撬柜子的声音引来持枪匪徒。” `OS-12` `armed`  
21. `[IND-E04] E|MV` “暗处有人用扳手敲墙——像在给同伙信号。” `OS-11` `ambush`  
22. `[IND-E05] E|HK` “黑入后灯光转红：安保被唤醒。” `OS-24` `security`  
23. `[IND-E06] E|SE` “你听到金属刮擦声——重装的人在靠近。” `OS-12` `armored`  
24. `[IND-E07] E|SE` “感染者被机器噪音吸引，成群靠近。” `OS-11` `infected`  

25. `[IND-N01] N|SE` “老厂长{npc}躲在办公室：‘我能给你零件，但别引来无人机。’” `OS-19` `npc,trade`  
26. `[IND-N02] N|HK` “{npc}说：‘给我数据磁带，我给你访问码。’” `OS-20` `npc,quest,data`  

27. `[IND-S01] S|HK` “生产日志里出现‘数据园区配套供电’。” `OS-16` `story,data`  
28. `[IND-S02] S|SE` “你找到一张废弃的工厂通行卡（可当钥匙卡线索）。” `OS-21` `story,keycard`  
29. `[IND-S03] S|SC` “你在高处看到远处‘信号塔’轮廓。” `OS-21` `story,signal`  
30. `[IND-S04] S|TH` “机柜背后刻着一句话：‘核心区不是人能去的。’” `OS-21` `story,warning`  

---

## C6) MIL 军管遗址类（MIL）
**词库**
- place：检查站/哨所/军车残骸/弹药库/壕沟/门禁间  
- container：军用箱/钥匙柜/武器架/终端台  
- smell：火药/冷金属  
- sound：风吹旗杆/远处无线电噪声

**事件 30**
1. `[MIL-L01] L|SE` “军车后舱散着弹壳和底火。” `OS-01` `ammo`  
2. `[MIL-L02] L|PL/SE` “弹药库小门上锁。” `OS-03` `ammo,rare`  
3. `[MIL-L03] L|HK` “门禁终端还亮，需要供电。” `OS-17` `keycard,security`  
4. `[MIL-L04] L|SE` “武器架上有一把旧手枪，缺弹。” `OS-01` `weapon,ammo`  
5. `[MIL-L05] L|TH` “保险柜里可能有电池包。” `OS-03` `pack,locked`  
6. `[MIL-L06] L|SE` “哨所柜里有医疗包残件。” `OS-01` `medical`  
7. `[MIL-L07] L|HK` “你能尝试读取巡逻路线（降低本区敌对权重）。” `OS-16` `intel,data`  
8. `[MIL-L08] L|SE` “地雷拆解能拿到金属与火药。” `OS-18` `gunpowder`  
9. `[MIL-L09] L|TH` “旧电台里可能有无线电组件。” `OS-04` `radioparts,electronics`  
10. `[MIL-L10] L|SE` “壕沟里有一串密封圈与橡胶片。” `OS-01` `seal,rubber`  

11. `[MIL-H01] H|MV` “你踩到一根拉线。” `OS-18` `mine`  
12. `[MIL-H02] H|SE` “探照灯扫过，你暴露了。” `OS-24` `alert`  
13. `[MIL-H03] H|HK` “终端回传告警。” `OS-24` `security`  
14. `[MIL-H04] H|SE` “铁丝网割破手臂。” `OS-14` `bleed`  
15. `[MIL-H05] H|TH` “你强拆柜子，回声像枪响一样大。” `OS-23` `noise`  
16. `[MIL-H06] H|MV` “夜里更冷，疲劳涨得很快。” `OS-22` `fatigue`  
17. `[MIL-H07] H|SE` “毒气面罩坏了，滤芯一碰就碎。” `OS-07` `chemical`  

18. `[MIL-E01] E|MV/SE` “巡逻兵（或逃兵）把枪口抬起来。” `OS-12` `armed`  
19. `[MIL-E02] E|SE` “自动炮台残骸突然亮起。” `OS-12` `turret`  
20. `[MIL-E03] E|HK` “你黑入时安保无人机出动。” `OS-12` `drone`  
21. `[MIL-E04] E|TH` “你拆地雷的声音引来一队人。” `OS-11` `ambush`  
22. `[MIL-E05] E|MV` “军犬扑来，速度很快。” `OS-11` `beast`  
23. `[MIL-E06] E|SE` “重装匪徒占了岗亭。” `OS-12` `armored`  
24. `[MIL-E07] E|SE` “感染者在壕沟里集结。” `OS-12` `infected`  

25. `[MIL-N01] N|SE` “伍长{npc}低声说：‘我能给你口令，但要药。’” `OS-19` `npc,trade`  
26. `[MIL-N02] N|SE` “{npc}说：‘拿到钥匙卡，数据园区才有戏。’” `OS-20` `npc,quest,keycard`  

27. `[MIL-S01] S|HK` “终端里标着‘数据园区装卸口’坐标。” `OS-16` `story,data`  
28. `[MIL-S02] S|SE` “你翻到一份封锁令：‘核心区禁止进入。’” `OS-21` `story,warning`  
29. `[MIL-S03] S|SC` “你发现巡逻路线空档（下次潜入DC-10）。” `OS-21` `story,intel`  
30. `[MIL-S04] S|TH` “钥匙柜里只有一张写着‘口令’的纸条。” `OS-21` `story,keycard`  

---

## C7) SEW 地下系统类（SEWER）
**词库**
- place：排水道/维护通道/渗漏池/闸门间/检修口  
- smell：霉/酸/下水腐臭  
- sound：滴水/老鼠抓墙/远处水流

**事件 30**
1. `[SEW-L01] L|SE` “维护通道的工具柜里有管件和线材。” `OS-01` `pipe,wire`  
2. `[SEW-L02] L|QS` “你在渗漏池捞起一只滤芯盒。” `OS-01` `filter`  
3. `[SEW-L03] L|SE/TH` “闸门后有一条捷径，但锁死。” `OS-03` `locked,route`  
4. `[SEW-L04] L|SE` “你找到一瓶溶剂，瓶身滑腻。” `OS-01` `solvent`  
5. `[SEW-L05] L|HK` “维修面板还能亮，或许能关闭部分风机。” `OS-16` `intel`  
6. `[SEW-L06] L|SE` “地上散落密封圈和橡胶片。” `OS-01` `seal,rubber`  
7. `[SEW-L07] L|TH` “检修口里藏着一袋底火。” `OS-01` `ammo`  
8. `[SEW-L08] L|PL` “上锁的维修箱。” `OS-03` `tools,repair`  
9. `[SEW-L09] L|SE` “你捡到半盒止痛片。” `OS-01` `medical`  
10. `[SEW-L10] L|QS` “一只背包浮在污水里。” `OS-02` `scrap,medical`  

11. `[SEW-H01] H|SE` “毒雾压得你喘不过气。” `OS-07` `chemical`  
12. `[SEW-H02] H|MV` “脚下石板松动，你差点摔进污水。” `OS-08` `fall`  
13. `[SEW-H03] H|SE` “污水溅到伤口，感染风险飙升。” `OS-14` `infection`  
14. `[SEW-H04] H|HK` “面板短路，电击贯穿手臂。” `OS-09` `electric`  
15. `[SEW-H05] H|SE` “你打开闸门，回声把你的位置送出去。” `OS-24` `alert`  
16. `[SEW-H06] H|MV` “夜里更容易迷路。” `OS-11` `lost`  
17. `[SEW-H07] H|TH` “你挖掘管道，里面突然喷出热水。” `OS-10` `burn`  

18. `[SEW-E01] E|MV/SE` “老鼠群涌来，像黑潮。” `OS-12` `beast`  
19. `[SEW-E02] E|SE` “感染者在拐角处等待。” `OS-11` `ambush,infected`  
20. `[SEW-E03] E|TH` “你撬箱的声音引来‘鼠王’的人。” `OS-12` `human`  
21. `[SEW-E04] E|SE` “污水里有东西贴着你腿爬。” `OS-11` `beast`  
22. `[SEW-E05] E|HK` “你黑入后，通道灯光变红。” `OS-24` `security`  
23. `[SEW-E06] E|MV` “有人在远处敲管道，像在包围你。” `OS-11` `ambush`  
24. `[SEW-E07] E|SE` “一只变异水蛭跃起，咬住你。” `OS-12` `beast,bleed`  

25. `[SEW-N01] N|SE` “鼠王技师{npc}在修闸门：‘给我橡胶，我给你滤芯。’” `OS-19` `npc,trade`  
26. `[SEW-N02] N|SE` “{npc}说：‘帮我开通捷径，我给你一条直达工业区的路。’” `OS-20` `npc,quest,route`  

27. `[SEW-S01] S|SC` “墙上画着粗糙地图：一条线连到‘净水厂’。” `OS-21` `story,waterwork`  
28. `[SEW-S02] S|HK` “面板日志提到‘净水厂核心泵阀’。” `OS-16` `story,waterwork`  
29. `[SEW-S03] S|TH` “你在闸门背后发现写着‘数据园区供电’的标记。” `OS-21` `story,data`  
30. `[SEW-S04] S|SE` “一张被水泡烂的门禁卡残片。” `OS-21` `story,keycard`  

---

## C8) DATA 数据园区类（DATA）
> 这一类建议额外维护 `Alarm`（告警值 0~10），与 Alert 叠加。  
> 高告警会插入安保事件并限制继续搜索（你上一阶段已定义，我这里事件也按它写）。

**词库**
- place：机房冷通道/线缆井/配电间/门禁走廊/服务器架  
- sound：风扇呼啸/蜂鸣器/继电器咔哒  
- smell：臭氧/冷金属/塑料焦味

**事件 30**
1. `[DATA-L01] L|SE` “服务器架的面板松动，你能撬开。” `OS-02` `data,microchips`  
2. `[DATA-L02] L|PL` “一只带电子锁的机柜。” `OS-03` `microchips,locked`  
3. `[DATA-L03] L|HK` “终端请求认证，屏幕闪烁。” `OS-16` `data,security`  
4. `[DATA-L04] L|SE` “线缆井里全是线材和电芯残件。” `OS-01` `wire,cell`  
5. `[DATA-L05] L|TH` “冷通道尽头有一只封闭箱，像备份库。” `OS-03` `pack,data`  
6. `[DATA-L06] L|HK` “你可以尝试抹除痕迹，降低告警。” `OS-24` `security`  
7. `[DATA-L07] L|SE` “配电间有两块电池包（很重）。” `OS-04` `pack,heavy`  
8. `[DATA-L08] L|SE` “一排工控箱里可能有芯片。” `OS-02` `microchips`  
9. `[DATA-L09] L|HK` “你能导出门禁口令（影响后续事件池）。” `OS-16` `keycard,intel`  
10. `[DATA-L10] L|TH` “你发现一只‘黑帽工具箱’。” `OS-03` `tools,rare`  

11. `[DATA-H01] H|HK` “告警灯亮起：‘未授权访问’。” `OS-24` `alarm`  
12. `[DATA-H02] H|SE` “冷通道喷出白雾，像制冷剂泄漏。” `OS-07` `chemical`  
13. `[DATA-H03] H|MV` “门禁走廊的摄像头转向你。” `OS-11` `security`  
14. `[DATA-H04] H|SE` “电缆裸露，脚下一麻。” `OS-09` `electric`  
15. `[DATA-H05] H|TH` “你强拆机柜，蜂鸣器开始尖叫。” `OS-23` `noise`  
16. `[DATA-H06] H|HK` “系统提示：‘锁定倒计时’。” `OS-24` `alarm`  
17. `[DATA-H07] H|MV` “午夜更冷，疲劳更快攀升。” `OS-22` `fatigue`  

18. `[DATA-E01] E|MV/SE` “安保无人机在天花板轨道滑行。” `OS-12` `drone,security`  
19. `[DATA-E02] E|HK` “你黑入失败，安保门后传来脚步。” `OS-24` `security`  
20. `[DATA-E03] E|TH` “你拿走电池包后，两个‘清理者’出现。” `OS-12` `human,armed`  
21. `[DATA-E04] E|SE` “探照灯扫到你，随后是蜂鸣。” `OS-11` `ambush`  
22. `[DATA-E05] E|MV` “无人机群像蚊群一样盘旋。” `OS-12` `drone`  
23. `[DATA-E06] E|HK` “系统封锁通道，你被迫战斗或撤退。” `OS-12` `security`  
24. `[DATA-E07] E|SE` “一名黑帽入侵者也在这里搜刮。” `OS-12` `human,tech`  

25. `[DATA-N01] N|SE` “黑帽{npc}低声说：‘我有访问码，但要芯片。’” `OS-19` `npc,trade`  
26. `[DATA-N02] N|HK` “{npc}说：‘我能帮你抹除痕迹，换一卷数据带。’” `OS-20` `npc,quest,data`  

27. `[DATA-S01] S|HK` “你导出一段坐标：指向‘反应堆禁区外围’。” `OS-16` `story,core`  
28. `[DATA-S02] S|HK` “日志里出现‘核心实验舱’字样。” `OS-16` `story,core`  
29. `[DATA-S03] S|SE` “你找到一份封存报告：‘核心泄漏，封锁。’” `OS-21` `story,warning`  
30. `[DATA-S04] S|HK` “你解码到‘钥匙卡白名单’（影响 MIL/CORE 门禁）。” `OS-16` `story,keycard`  

---

## C9) CORE 禁区核心类（CORE）
> 这类强制依赖：Filter / Antitoxin / Seal / Cell（至少其一），否则事件失败权重显著上升。  
> 主线物：Power Core 在这里才有真实产出。

**词库**
- place：冷却管廊/控制室入口/密封门/反应堆心脏/废弃防护柜  
- sound：低频轰鸣/警报残响/金属呻吟  
- smell：金属灼味/药剂味/臭氧

**事件 30**
1. `[CORE-L01] L|SE` “防护柜里有抗毒剂残支。” `OS-01` `antitoxin,medical`  
2. `[CORE-L02] L|PL` “密封门后可能有核心组件。” `OS-17` `locked,core`  
3. `[CORE-L03] L|SE` “冷却管廊散着稀有合金碎片。” `OS-01` `alloy,metal`  
4. `[CORE-L04] L|HK` “控制台还能回应，你可以尝试读出反应堆状态。” `OS-16` `data,core`  
5. `[CORE-L05] L|TH` “你在废弃防护柜后发现一只重箱。” `OS-03` `pack,heavy`  
6. `[CORE-L06] L|SE` “你找到一卷纳米纤维（极轻，但价值高）。” `OS-01` `nanofiber,rare`  
7. `[CORE-L07] L|TH` “一根电缆通向深处，你能顺着走到‘心脏门’。” `OS-08` `route`  
8. `[CORE-L08] L|HK` “你可以试图抹除痕迹，降低无人机活跃度。” `OS-24` `security`  
9. `[CORE-L09] L|SE` “密封圈散落一地，像是有人匆忙维修过。” `OS-01` `seal`  
10. `[CORE-L10] L|TH` “你发现一个标着‘POWER CORE’的箱体。” `OS-03` `powercore,rare`  

11. `[CORE-H01] H|MV/SE` “辐射风暴像潮水一样压过来。” `OS-13` `radiation`  
12. `[CORE-H02] H|SE` “{sound}突然增大，你的牙齿开始发酸。” `OS-13` `radiation`  
13. `[CORE-H03] H|TH` “冷却剂泄漏，地面结霜又冒烟。” `OS-07` `chemical`  
14. `[CORE-H04] H|HK` “终端反向追踪，告警拉满。” `OS-24` `alarm`  
15. `[CORE-H05] H|SE` “密封门边缘烫手。” `OS-10` `burn`  
16. `[CORE-H06] H|MV` “你踩到碎裂护具，走一步就响。” `OS-02` `stealth`  
17. `[CORE-H07] H|SE` “你咳出带血的痰。” `OS-14` `bleed,infection`  

18. `[CORE-E01] E|MV/SE` “安保无人机群出现，灯光刺眼。” `OS-12` `security,drone`  
19. `[CORE-E02] E|SE` “一名‘核心掠夺者’穿着厚甲，盯着你。” `OS-12` `armored`  
20. `[CORE-E03] E|HK` “你黑入失败，门后‘守卫单元’启动。” `OS-12` `drone,elite`  
21. `[CORE-E04] E|TH` “你试图搬走重箱，立刻被锁定。” `OS-11` `security`  
22. `[CORE-E05] E|MV` “阴影里有人低语，然后是枪机声。” `OS-12` `armed`  
23. `[CORE-E06] E|SE` “辐射让一些生物变得疯狂，它们冲你来。” `OS-12` `mutant`  
24. `[CORE-E07] E|SE` “你听到金属爪刮墙，像机器在找你。” `OS-11` `ambush`  

25. `[CORE-N01] N|SE` “灰烬先知{npc}在墙边画符：‘想拿核心？先学会付出。’” `OS-19` `npc,story`  
26. `[CORE-N02] N|SE` “{npc}给你一个选择：用芯片换‘安全路线’。” `OS-20` `npc,quest`  

27. `[CORE-S01] S|HK` “终端里出现‘离开计划’的残缺指令。” `OS-16` `story,endgame`  
28. `[CORE-S02] S|SE` “墙上刻着：‘不要把核心带回去。’” `OS-21` `story,warning`  
29. `[CORE-S03] S|HK` “你导出‘心脏门开启序列’（降低后续门禁DC）。” `OS-16` `story,core`  
30. `[CORE-S04] S|TH` “你找到一张被烧焦的图纸：‘发电机与飞船维修’。” `OS-21` `story,blueprint`  

---

## C10) WASTE 开阔荒野/丘陵类（WASTE）
**词库**
- place：风蚀丘/碎石坡/观测点/塌陷坑/干沟/岩缝洞  
- sound：风啸/石子滚落/远处枪声回音  
- smell：尘土/干草/铁锈

**事件 30**
1. `[WASTE-L01] L|QS/SE` “你在{place}捡到一小堆废料，像是被风刮聚的。” `OS-01` `scrap`  
2. `[WASTE-L02] L|SE` “岩缝洞里有一只工具袋。” `OS-01` `tools`  
3. `[WASTE-L03] L|SE/TH` “观测点上有望远镜残件。” `OS-04` `glass,wire`  
4. `[WASTE-L04] L|SE` “你在碎石坡找到一块金属板（很重）。” `OS-04` `metal,heavy`  
5. `[WASTE-L05] L|SC` “高处能看到远处‘信号塔’的闪光。” `OS-21` `story,signal`  
6. `[WASTE-L06] L|SE` “你挖出一小包弹簧与管件。” `OS-01` `spring,pipe`  
7. `[WASTE-L07] L|QS` “干沟里有一只水壶。” `OS-05` `water`  
8. `[WASTE-L08] L|TH` “塌陷坑底部有一个上锁箱。” `OS-03` `rare,locked`  
9. `[WASTE-L09] L|SE` “你捡到一块太阳能板碎片。” `OS-01` `solar,rare`  
10. `[WASTE-L10] L|HK` “废弃测绘仪还能亮，或许能产出SD（勘测数据）。” `OS-16` `sd,story`  

11. `[WASTE-H01] H|MV` “风沙卷起，眼睛被沙砸得生疼。” `OS-11` `lost`  
12. `[WASTE-H02] H|SE` “碎石突然滑落。” `OS-08` `fall`  
13. `[WASTE-H03] H|MV` “你走过开阔地，像站在靶场。” `OS-11` `sniper`  
14. `[WASTE-H04] H|SE` “岩缝里有刺，划破手。” `OS-14` `bleed`  
15. `[WASTE-H05] H|SE` “你听见回声，分不清方向。” `OS-11` `ambush`  
16. `[WASTE-H06] H|MV` “午夜更冷，疲劳上升。” `OS-22` `fatigue`  
17. `[WASTE-H07] H|TH` “你挖掘太久，回声把你位置送出很远。” `OS-24` `alert`  

18. `[WASTE-E01] E|MV` “远处狙击手盯着你。” `OS-11` `human,armed`  
19. `[WASTE-E02] E|SE` “野狗在坡下绕圈。” `OS-11` `beast`  
20. `[WASTE-E03] E|MV` “一支拾荒队抢先到了这里。” `OS-12` `scavenger`  
21. `[WASTE-E04] E|SE` “你撬箱声音太大，引来匪徒。” `OS-12` `raider`  
22. `[WASTE-E05] E|MV` “无人机从天边飞来，像在巡线。” `OS-12` `drone`  
23. `[WASTE-E06] E|SE` “你看到一团怪影从坑里爬出。” `OS-12` `mutant`  
24. `[WASTE-E07] E|SE` “开阔地的枪声会引来更多人。” `OS-23` `noise`  

25. `[WASTE-N01] N|MV` “{npc}披着斗篷，卖望远镜与地图。” `OS-19` `npc,trade`  
26. `[WASTE-N02] N|SE` “{npc}要你护送他到先锋营地（任务）。 ” `OS-20` `npc,quest`  

27. `[WASTE-S01] S|SC` “你找到一根插在石缝的天线：‘信号来自北方。’” `OS-21` `story,signal`  
28. `[WASTE-S02] S|HK` “测绘仪记录到‘异常热源’（指向核心区外围）。 ” `OS-16` `story,core`  
29. `[WASTE-S03] S|SE` “地上有一枚烧焦徽章：军检站的标志。” `OS-21` `story,mil`  
30. `[WASTE-S04] S|TH` “你挖出一页旧世界手册：‘反应堆紧急停机流程’。” `OS-21` `story,core`  

---

---

## 附录C：敌人模板（原文）

# D) 敌人模板数值表（按 Tier 分层、对齐 ρ/Alert/EL）

## D1. 战斗公式回顾（与你上一阶段一致）
- 命中：  
  \[
  Hit = clamp(0.10,0.95,\ 0.55 + \frac{ACC - EVA}{120}) \times FatMult(F)
  \]
- 伤害：  
  \[
  Raw = DmgBase + rand(-Var,+Var)
  \]
  \[
  Dmg = max(1,\ Raw - AR)
  \]

## D2. 遭遇等级 EL 与规模（对齐区域ρ/Alert）
你之前定义：
\[
EL = BaseTier + 0.5\rho + 0.25\cdot Alert + Mode
\]

我补充一个**工程可实现**的遭遇生成规则（最关键的“完全对齐”）：

- 敌人数量：  
  \[
  n = 1 + floor(EL/2)\quad (n\in[1,4])
  \]
- 精英概率：  
  - Alert < 4：精英 0~10%  
  - 4 ≤ Alert < 7：精英 15%  
  - Alert ≥ 7：精英 30%，且至少 1 个敌人从 ElitePool 抽  
- 敌人属性缩放（当 EL 高于本区 Tier 时）：  
  \[
  Scale = 1 + 0.08\cdot max(0, EL-BaseTier)
  \]
  HP 与 DmgBase 乘 Scale（四舍五入），AR/ACC/EVA 小幅 +（见模板里的“成长”）

这让“用枪制造高 Alert”必然带来更硬/更多的敌人。

---

## D3. 敌人模板（可直接配置）
> 字段：HP / DmgBase±Var / AR / ACC / EVA / SPD / MOR / 噪音敏感 / 状态攻击  
> **噪音敏感**：用于战斗后“追击/增援”概率（DATA/CORE/MIL 尤其重要）

### T1（近郊/开阔）基础敌
1) `EN_T1_SCAV` 绝望拾荒者（人类·近战）  
- HP 22 | 7±2 | AR0 | ACC50 EVA40 SPD50 MOR45  
- 状态：10% 流血（破片）  
- 噪音敏感：中  
- LootTag：scrap/cloth

2) `EN_T1_DOG` 野狗（野兽·快）  
- HP 18 | 6±2 | AR0 | ACC55 EVA55 SPD70 MOR40  
- 状态：20% 流血  
- 噪音敏感：高（会被枪声吸引）  
- LootTag：meat/leather

3) `EN_T1_THUG` 路匪（人类·近战）  
- HP 26 | 8±2 | AR1 | ACC52 EVA38 SPD48 MOR50  
- LootTag：scrap/fasteners

### T2（外环/道路/水域）常见敌
4) `EN_T2_INFECT` 感染者（人类·撕咬）  
- HP 28 | 8±2 | AR0 | ACC50 EVA35 SPD45 MOR70（不易逃）  
- 状态：25% 感染（若流血未处理再+）  
- 噪音敏感：低（被动靠近）  
- LootTag：cloth/medical(低)

5) `EN_T2_RAIDER` 掠夺者（人类·刀）  
- HP 30 | 9±2 | AR1 | ACC55 EVA42 SPD52 MOR55  
- 状态：15% 流血  
- LootTag：scrap/metal

6) `EN_T2_PISTOL` 持枪匪徒（人类·手枪）  
- HP 28 | 10±2 | AR1 | ACC60 EVA40 SPD50 MOR55  
- 特性：噪音高，战斗后 Alert 更易上升  
- LootTag：casing/primer（少量）

### T3（工业/匪徒哨站）危险敌
7) `EN_T3_ARMORED` 重装匪徒（人类·近战/短枪）  
- HP 40 | 11±3 | AR3 | ACC58 EVA30 SPD40 MOR65  
- 状态：10% 眩晕（重击）  
- LootTag：metal/gear

8) `EN_T3_DRONE` 巡逻无人机（机械·射击）  
- HP 34 | 11±3 | AR2 | ACC62 EVA48 SPD60 MOR80  
- 状态：10% 眩晕（电击）  
- 噪音敏感：极高（会呼叫增援：Alert≥6时增援概率+）  
- LootTag：wire/cell（chip低）

9) `EN_T3_PACK` 盗团小队长（人类·战术）  
- HP 36 | 10±2 | AR2 | ACC60 EVA45 SPD55 MOR70  
- 特性：同场敌人命中+3（小队光环）  
- LootTag：ammo/medical(低)

### T4（军事/净水/数据园区）高危敌
10) `EN_T4_SEC_DRONE` 安保无人机（机械·精英）  
- HP 48 | 13±3 | AR3 | ACC68 EVA50 SPD62 MOR90  
- 状态：15% 眩晕  
- 特性：Alert≥7时优先出现  
- LootTag：cell/pack（chip中）

11) `EN_T4_TURRET` 固定炮台（机械·固定）  
- HP 55 | 14±4 | AR4 | ACC70 EVA10 SPD10 MOR100  
- 特性：无法撤退时压力大；但可被潜入/黑入削弱（事件选项）  
- LootTag：metal/gear/chip(低)

12) `EN_T4_HAZ_INF` 防化感染者（感染·耐打）  
- HP 52 | 12±3 | AR2 | ACC60 EVA30 SPD40 MOR85  
- 状态：35% 感染/中毒  
- LootTag：filter/antiseptic(低)

### T5（核心禁区）终局敌
13) `EN_T5_GUARD` 守卫单元（机械·精英）  
- HP 62 | 16±4 | AR4 | ACC72 EVA55 SPD65 MOR95  
- 状态：15% 眩晕 + 10% 流血（碎片）  
- 特性：战斗后告警+2（你被标记）  
- LootTag：microchips/pack（core极低）

14) `EN_T5_SWARM` 无人机蜂群（机械·群）  
- HP 28（单体） | 9±2 | AR1 | ACC66 EVA60 SPD75 MOR70  
- 生成规则：一次遭遇出现 2~4 个  
- 特性：命中不高但多段；撤退更难  
- LootTag：wire/cell

15) `EN_T5_MUT_BRUTE` 变异巨汉（变异·近战）  
- HP 70 | 18±4 | AR3 | ACC62 EVA25 SPD35 MOR90  
- 状态：25% 流血/击倒  
- LootTag：rare_alloy(低)/medical(低)

> 你可以用这 15 个模板覆盖全部区域：  
> - RES/NAT/WASTE 多用 T1~T2  
> - HWY/WAT/SEW 用 T2~T3  
> - IND/MIL 用 T3~T4  
> - DATA 用 T4（安保）为主 + 少量人类  
> - CORE 用 T5 为主

---

---

## 附录D：装备数值表（武器/护甲，原文）

# E) 装备数值表（武器/护甲）：ATK/AR/ACC/EVA/耐久/噪音 完整对齐

## E1. 噪音（Noise）与警戒（Alert）对齐规则
**战斗结束后 Alert 增量**建议统一为：
\[
Alert\_Delta\_{combat} = 1.0 + maxNoiseUsed + TacticNoise
\]
- `maxNoiseUsed`：本场你使用的最高噪音武器（见下表）  
- `TacticNoise`：如果使用【压制 Suppress】则 +0.5  
这样就能严格对齐你之前的经验值：  
- 近战（noise≈0.5）→ +1.5  
- 手枪（2.0）→ +3.0  
- 霰弹（3.0）→ +4.0

> 这就是“枪强，但会把后续事件变难”的数学钩子。

---

## E2. 武器表（20把，覆盖T1~T5）
> 列：ID / Tier / DmgBase±Var（=ATK表现）/ ACC加成 / 特效 / 噪音 / 耐久(AU) / 重量 / 弹药  
> Dur建议：每场战斗武器 Dur-1；强拆/破门等事件额外 Dur-1

| ID | 名称 | Tier | ATK(伤害) | ACC | 特效 | 噪音 | 耐久 | 重量 | 弹药 |
|---|---|---:|---|---:|---|---:|---:|---:|---|
| W_PIPE | 生锈铁管 | 1 | 6±2 | +0 | 10%流血 | 0.5 | 60 | 2 | - |
| W_DAG | 废铁匕首 | 1 | 5±2 | +5 | 20%流血（轻） | 0.4 | 50 | 1 | - |
| W_SPEAR | 简易长矛 | 1-2 | 7±2 | +2 | 先手+5% | 0.6 | 70 | 2 | - |
| W_BAT | 钉刺球棒 | 2 | 8±2 | -1 | 25%流血 | 0.7 | 80 | 2 | - |
| W_AXE | 小斧/砍刀 | 2 | 9±3 | -2 | 15%眩晕 | 0.8 | 70 | 3 | - |
| W_XBOW | 简易弩 | 2 | 9±2 | +3 | 低噪音；需弩箭 | 1.0 | 50 | 2 | Bolt×1 |
| W_MACH | 破旧砍刀 | 2-3 | 10±3 | +0 | 20%流血 | 0.7 | 90 | 2 | - |
| W_PIST | 手枪 | 3 | 12±3 | +3 | 可压制（耗弹+） | 2.0 | 80 | 2 | 9mm×1 |
| W_REV | 左轮 | 3 | 13±3 | +1 | 暴击+5% | 2.2 | 90 | 2 | 9mm×1 |
| W_SMG | 冲锋枪 | 3 | 11±2 | +6 | 压制更强（耗弹+1） | 2.5 | 70 | 3 | 9mm×1 |
| W_SG | 霰弹枪 | 3-4 | 15±4 | -1 | 近距+（可致眩晕10%） | 3.0 | 70 | 4 | 12GA×1 |
| W_RIF | 步枪 | 4 | 16±4 | +4 | 远距稳定 | 2.5 | 100 | 4 | RIF×1 |
| W_CARB | 卡宾枪 | 4 | 15±3 | +6 | 撤退检定+5%（更灵活） | 2.4 | 95 | 3 | RIF×1 |
| W_DMR | 精确步枪 | 4-5 | 17±4 | +8 | 侦查+5（装备被动） | 2.6 | 110 | 4 | RIF×1 |
| W_AR | 自动步枪 | 5 | 16±3 | +5 | 压制强（耗弹+1） | 2.8 | 90 | 4 | RIF×1 |
| W_STUN | 电击棍 | 4 | 10±2 | +4 | 25%眩晕 | 0.9 | 80 | 2 | Cell(耐久) |
| W_SILP | 消音手枪 | 4 | 11±3 | +2 | 噪音-1（需配件） | 1.0 | 75 | 2 | 9mm×1 |
| W_SILR | 消音步枪 | 5 | 15±4 | +4 | 噪音-1（需配件） | 1.5 | 95 | 4 | RIF×1 |
| W_MOLT | 燃烧瓶(一次性) | 2-4 | 10±0 | +0 | 灼烧(每回合-2) | 2.0 | - | 1 | - |
| W_BOMB | 简易爆破(一次性) | 4-5 | 20±6 | - | 破甲（AR-2本战） | 4.0 | - | 2 | - |

> 说明：  
> - 你会发现火器的 DmgBase 很高，但噪音会把 Alert 拉上去，后续 EL↑、敌人更多更硬。  
> - 消音武器把噪音压到 1.0~1.5，让“潜入流”能成立，但伤害略低/成本更高（由制作与掉落控制）。

---

## E3. 护甲表（12件，覆盖T1~T5）
> AR 是减伤；EVA 是闪避修正（重甲负）  
> Dur：每场战斗护甲 Dur-1；受到重击/爆炸额外 Dur-1

| ID | 名称 | Tier | AR | EVA | 特效 | 噪音 | 耐久 | 重量 |
|---|---|---:|---:|---:|---|---:|---:|---:|
| A_RAG | 破布外套 | 1 | 1 | +2 | - | 0.0 | 80 | 1 |
| A_LEATH | 皮质护甲 | 1-2 | 2 | +0 | 寒冷抗性 | 0.1 | 90 | 2 |
| A_PLATE | 废铁板甲 | 2-3 | 3 | -6 | - | 0.4 | 100 | 4 |
| A_REIN | 加固护甲 | 3 | 4 | -4 | 流血概率-10% | 0.3 | 120 | 4 |
| A_COMBAT | 战斗护甲 | 4 | 6 | -3 | 感染概率-10% | 0.3 | 150 | 5 |
| A_TACT | 战术背心 | 3-4 | 4 | -1 | 撤退+5% | 0.2 | 110 | 3 |
| A_HAZ | 防化服 | 4-5 | 3 | -2 | 毒雾/辐射损失-30% | 0.2 | 120 | 3 |
| A_HELM | 头盔 | 2-5 | +1 | -1 | 眩晕概率-10% | 0.1 | 90 | 1 |
| A_SHIELD | 临时盾牌 | 2 | +2 | -4 | 防守战术额外-10%受击 | 0.2 | 60 | 3 |
| A_PLATE2 | 合金板甲 | 5 | 7 | -4 | 破甲抵抗 | 0.4 | 160 | 5 |
| A_POWER | 动力外骨骼(终局) | 5 | 8 | -1 | 负重Cap+20 | 0.5 | 180 | 6 |
| A_CLOAK | 迷彩披风 | 3-5 | 1 | +4 | 潜入DC-10（仅夜间） | 0.0 | 70 | 1 |

---

# F) “完全对齐”的最后一块：用样例检验战斗曲线 + 区域ρ/Alert联动

## F1. 三个样例（你用来做自动化测试/模拟）
### 样例1：T2 居住废墟 RES（ρ=0.28），Alert=2，Mode=Search(0)
- EL ≈ 2 + 0.14 + 0.5 = 2.64  
- 敌人数 n = 1 + floor(1.32)=2  
- 敌人池：T2_RAIDER + T2_INFECT（或T1混入）  
- 玩家推荐装备：W_SPEAR / A_LEATH（或 W_BAT / A_PLATE）  
- 预期：3~6回合结束；消耗 0~1 Bandage；Alert 增量随武器噪音（近战约+1.5）

### 样例2：T3 工业 IND（ρ=0.45），Alert=6（你刚打过一架），Mode=Thorough(+0.5)
- EL ≈ 3 + 0.225 + 1.5 + 0.5 = 5.225  
- n = 1 + floor(2.612)=3（且精英概率 30%）  
- 敌人池：T3_DRONE + T3_ARMORED + T2_PISTOL  
- 玩家推荐装备：W_PIST/W_SG + A_REIN/A_TACT  
- 预期：战斗强度显著提升；如果继续用枪，Alert 会继续升 → 连锁变难（你想要的废土压迫感）

### 样例3：T5 CORE（ρ=1.2），Alert=7（高），Mode=Hack(+0.3)
- EL ≈ 5 + 0.6 + 1.75 + 0.3 = 7.65  
- n = 1 + floor(3.825)=4（精英至少1）  
- 敌人池：T5_GUARD + 2×T5_SWARM + T4_SEC_DRONE（或 T5_MUT_BRUTE）  
- 玩家推荐装备：消音步枪或步枪 + 战斗护甲/防化服 + 充足抗毒  
- 预期：战斗不是拖很久（4~7回合），但**资源损耗大**（Antitoxin/Medkit/耐久/补给），这才能让 Power Core 的“高VU价值”在体验上成立

---

# G) 你现在就能把它落地的最短路径（工程友好）
1) 先把 **OptionSet** 做成 JSON（24组），写通“成功/勉强/失败”分支与倍率结算。  
2) 把上面每类区域的 30 个事件录入为 JSON，字段只需：`id/category/triggers/text_tpl/option_set/tags/special`。  
3) 写一个“掉落生成器”：吃 `LootBudget` + `tags` → 产出物品（优先符合标签）。  
4) 写一个“战斗生成器”：吃 `BaseTier/ρ/Alert/Mode` → 产出敌人列表（按模板池）。  
5) 战斗结算回写：耐久-、状态、物资损失、Alert 增量按 `1 + maxNoiseUsed`。

---

如果你愿意，我下一条可以继续同一阶段把两件事一次做完（仍然不跑到建筑科技去）：  
1) **把这 300 个事件转成一份严格 JSON 配置（可直接导入）**，并补齐每个区域类别的占位词库（place/container/sound/smell/npc）。  
2) **把敌人模板与装备表也做成 JSON，并给一套“自动模拟1000次”的验收指标表**（平均净VU、死亡率、撤退成功率、Alert分布、药品消耗）。

---

user:

综合上述所有内容，总结全部上下文，深入思考游戏机制，完整地保留上面的全部信息，并进行详细整合，生成一份逻辑合理，内容清晰，结构严密，信息齐全的设计文档。一定要涵盖全部信息，保证思考强度，调用最高思考模式。

---

## 附录E：城建版建筑与生产明细（原文，按T0~T4）

## 4. 建筑与生产明细（按阶段/类别给“可直接落表”的规格）

下面我按 **T0生存 → T1定居 → T2工匠 → T3工业 → T4远征** 给“关键建筑全集”。数值可作为第一版平衡基线。

> 说明：所有产出/消耗均按 **每工作日** 结算；“岗位满配”才达到基础产量。

---

# 4A. 核心与物流类

## A1 营地核心（Camp Core）
- Tier：T0（初始）
- 占地：4×4
- 建造：木材 80、石料 40、废料 40
- 功能：
  - 解锁基础建筑队列（同时施工上限+1）
  - 提供**影响半径 12**：范围内住宅/市场效率 +10%
  - 存储：通用 200
- 升级：
  - **核心 Lv2（T1）**：存储+300，施工上限+1，影响半径+4  
  - **核心 Lv3（T2）**：解锁“规划区/分区”、全局效率+5%

## A2 道路（Path/Road）
- **土路**：1×1，成本：石料 1 或 木板 1（任选）；移速+15%
- **石路**（T1解锁）：成本：石砖 1；移速+30%，运输损耗-5%

## A3 仓储体系
1) **露天堆场 Stockpile（T0）**
   - 占地：3×3；建造：木材 20
   - 存储：原料类 300（不防腐）
2) **仓库 Warehouse（T1）**
   - 占地：4×3；建造：木板 60、石料 40
   - 存储：通用 800；岗位 2（搬运工）
3) **冷藏库 Cold Storage（T2）**
   - 占地：4×3；建造：木板 80、砖 40、零件 10
   - 存储：食物类 600；维护：燃料 2/日 或 电力 4（T3）
   - 食物腐败速度 -70%

## A4 物流节点
1) **手推车站 Cart Post（T1）**
   - 占地：2×2；建造：木板 20、工具 4
   - 岗位 2；提升附近（半径8）搬运效率 +20%
2) **货运站 Wagon Depot（T2）**
   - 占地：4×4；建造：木板 80、石砖 40、零件 12
   - 岗位 4；可生成“货运任务”（将指定物资搬到指定仓库/前哨）
3) **配送中心 Distribution Center（T3）**
   - 占地：6×4；建造：钢锭 30、零件 30、组件 20
   - 岗位 6；可设置“配给规则”（食物/水/燃料优先级）
   - 断供惩罚降低（供给率更稳定）

---

# 4B. 民生与人口（影响工人效率，避免生产链虚高）

## B1 住房
1) **帐篷 Tent（T0）**
   - 占地：2×2；建造：木材 10、织物 4
   - 容量：4人；舒适低（效率-5%）
2) **棚屋 Shack（T1）**
   - 占地：2×2；建造：木板 20、石料 10
   - 容量：4人；效率±0
3) **民居 House（T2）**
   - 占地：3×2；建造：砖 30、木板 20、工具 6
   - 容量：6人；效率+5%；冬季燃料消耗 +1/户（更保暖可减病）

## B2 基础服务
1) **取水井 Well（T0）**
   - 占地：2×2；建造：木材 20、石料 20
   - 岗位 1；产出：水 30/日（若Water=0则减半）
2) **食堂 Canteen（T1）**
   - 占地：3×3；建造：木板 40、砖 20
   - 岗位 2；消耗：食物 10/日；效果：半径10内士气+5%
3) **诊所 Clinic（T1）**
   - 占地：3×3；建造：木板 30、砖 20、药品 4
   - 岗位 2；降低疾病导致的效率损失（-50%）

---

# 4C. 采集与农业（食物/原料的源头）

## C1 伐木营 Lumber Camp（林地强）
- Tier：T0
- 占地：3×3；采集半径 8
- 建造：木材 30
- 岗位：3
- 产出：木材 60/日（森林地区系数×1.2；无林×0.6）
- 升级（T1）：**锯木点优化**（产量+20%，需要工具维护1/日）

## C2 采石场 Quarry
- Tier：T0
- 占地：3×3；采集半径 6
- 建造：木材 20、石料 10
- 岗位：3
- 产出：石料 45/日（采石山地区×1.2）
- 维护：工具 1/日（T1后启用维护，否则效率-15%）

## C3 黏土坑 Clay Pit（靠水更强）
- Tier：T1
- 占地：3×3；半径6
- 建造：木板 20、石料 20
- 岗位：2
- 产出：黏土 40/日（Water=2时 +25%）

## C4 拾荒站 Scavenger Yard（工业/废墟强）
- Tier：T0
- 占地：3×3；半径8
- 建造：木材 20
- 岗位：4
- 产出：废料 55/日（旧工业/城市废墟×1.3）
- 副产：随机“可修复零件” 1–3/日（用于T2零件生产的加速材料）

## C5 农田 Field
- Tier：T1
- 占地：4×4（可拼接成大片）
- 建造：木材 20
- 岗位：2
- 产出：谷物 40/日（Fertility 50为基准；每+10肥沃 +8%）
- 升级：
  - **灌溉农田（T2）**：Water=1/2时 +20%，维护：水 5/日（抽象为灌溉损耗）
  - **温室（T3）**：全年产出，维护：电力 6

## C6 猎人棚 Hunting Lodge
- Tier：T0
- 占地：3×3；半径10
- 建造：木材 25
- 岗位：2
- 产出：肉 20/日 + 皮革原料 10/日（林地×1.2）
- 注：作为“早期蛋白来源”，效率稳定但不易规模化

## C7 渔场 Fishery（需Water=2）
- Tier：T1
- 占地：3×3（靠岸）
- 建造：木板 30、工具 4
- 岗位：3
- 产出：鱼 45/日（冬季可下降）

---

# 4D. 加工与制造（把原料变成建材与工具，进入增长曲线）

## D1 锯木厂 Sawmill
- Tier：T1
- 占地：4×3
- 建造：木板 40、石料 30、工具 6
- 岗位：3
- 输入：木材 60/日
- 输出：木板 45/日
- 邻接：靠近伐木营/堆场（半径6）效率 +10%

## D2 石匠坊 Stonecutter
- Tier：T1
- 占地：3×3
- 建造：木板 30、石料 30、工具 4
- 岗位：2
- 输入：石料 60/日
- 输出：石砖 40/日

## D3 砖窑 Brick Kiln
- Tier：T1
- 占地：3×3
- 建造：木板 20、石料 20
- 岗位：2
- 输入：黏土 60/日 + 燃料 4/日
- 输出：砖 45/日

## D4 炭窑 Charcoal Kiln
- Tier：T1
- 占地：3×3
- 建造：木板 20
- 岗位：1
- 输入：木材 50/日
- 输出：木炭 20/日
- 备注：为“冶炼/冬季供暖”提供燃料

## D5 简易冶炼炉 Smelter（铁锭）
- Tier：T2
- 占地：4×3
- 建造：石砖 60、工具 8、砖 20
- 岗位：3
- 输入：铁矿 50/日 + 燃料 6/日
- 输出：铁锭 30/日
- 维护：工具 1/日（缺工具效率-20%）

## D6 铁匠铺 Blacksmith（工具）
- Tier：T2
- 占地：3×3
- 建造：木板 40、砖 30、工具 6
- 岗位：2
- 输入：铁锭 20/日 + 木板 10/日
- 输出：基础工具 10/日
- 作用：许多建筑升级/维护需要工具，属于“工业化门槛”

## D7 机械作坊 Machine Shop（零件/组件）
- Tier：T3
- 占地：5×4
- 建造：钢锭 20、零件 10（或废料替代）、组件 10
- 岗位：4
- 输入：铁锭 30/日 + 废料 20/日
- 输出：机械零件 12/日 + 建筑组件 8/日
- 维护：电力 6（或燃料 8/日）

## D8 面粉厂 Mill
- Tier：T2
- 占地：3×3
- 建造：木板 40、石砖 30、零件 4
- 岗位：2
- 输入：谷物 60/日
- 输出：面粉 45/日

## D9 面包房 Bakery
- Tier：T2
- 占地：3×3
- 建造：砖 40、木板 30
- 岗位：2
- 输入：面粉 40/日 + 水 20/日 + 燃料 2/日
- 输出：食物（面包） 60/日（腐败慢于生食）

## D10 烟熏房 Smokehouse（保存肉/鱼）
- Tier：T1
- 占地：3×3
- 建造：木板 30、石料 20
- 岗位：1
- 输入：肉 20/日 或 鱼 30/日 + 燃料 2/日
- 输出：保存食品 20/日 或 30/日（腐败速度-70%）

## D11 纺织作坊 Textile Workshop
- Tier：T2
- 占地：4×3
- 建造：木板 50、工具 6
- 岗位：2
- 输入：纤维作物（可由农田副产/或拾荒得到）40/日
- 输出：织物 25/日

## D12 裁缝铺 Tailor（衣物提升效率）
- Tier：T2
- 占地：3×3
- 建造：木板 40、工具 4
- 岗位：1
- 输入：织物 20/日
- 输出：衣物 10/日
- 效果：衣物配给足额 → 工人效率+5%，冬季疾病率下降

## D13 草药工坊 Herbalist（药品）
- Tier：T2
- 占地：3×3
- 建造：木板 30、砖 20
- 岗位：1
- 输入：草药 30/日 + 酒精/溶剂（可抽象为废料或特定资源）5/日
- 输出：药品 10/日

---

# 4E. 能源与公用事业（从燃料到电力，支撑T3）

## E1 燃料仓 Fuel Depot
- Tier：T1
- 占地：3×2
- 建造：木板 20、石料 20
- 存储：燃料类 300（木炭/煤/燃料统一）

## E2 煤矿 Coal Mine
- Tier：T2
- 占地：4×4；采集半径 6
- 建造：石砖 60、工具 10、零件 6
- 岗位：4
- 产出：煤 70/日（煤脉荒地×1.25）
- 维护：工具 2/日

## E3 蒸汽发电机 Steam Generator
- Tier：T3
- 占地：5×4
- 建造：钢锭 30、零件 20、组件 15
- 岗位：2（操作员）
- 输入：煤 20/日 或 木炭 30/日
- 输出：电力 40（抽象为电力点/日或持续功率）
- 副作用：污染+（影响周边住宅士气/健康）

## E4 输电站 Power Node / 电线
- Tier：T3
- 作用：把发电机电力分发到半径内建筑
- 规则建议：电网采用“区域覆盖+容量”的简化模型（利于实现）

## E5 净水厂 Water Treatment
- Tier：T2
- 占地：4×3（靠水更强）
- 建造：砖 40、石砖 40、零件 6
- 岗位：2
- 输入：原水 60/日（井/泵站提供）
- 输出：净水 60/日
- 效果：净水供应足额 → 疾病率下降，效率提升更稳定

---

# 4F. 科研建筑（产RP，用于科技树）

## F1 简易研究台 Study Desk
- Tier：T0
- 占地：2×2
- 建造：木材 20、废料 10
- 岗位：1
- 产出：RP 8/日
- 限制：只能研究T0–T1科技

## F2 图书室/学堂 Archive
- Tier：T1
- 占地：3×3
- 建造：木板 40、砖 20
- 岗位：2
- 产出：RP 18/日
- 邻接：靠近住宅/食堂（半径6）效率 +10%

## F3 研究所 Research Lab
- Tier：T3
- 占地：5×4
- 建造：钢锭 20、零件 20、组件 15
- 岗位：4
- 输入：电力 8
- 产出：RP 45/日
- 可研究T3–T4科技；部分节点需要 SD（勘测数据）

---

# 4G. 新增：先锋营地（Vanguard Camp）与前哨体系（本阶段重点新增）

先锋营地是“把地图扩张变成可玩内容”的关键：它把远端资源区变成**可驻扎、可补给、可探索、可二次生产**的前进基地。

## G1 先锋营地（核心建筑）
- Tier：T2（建议在有基础工业后解锁，避免过早外扩）
- 占地：5×5
- 建造：木板 80、石砖 60、工具 12、组件 8、保存食品 20
- 岗位：2（营地管理）
- 自带功能：
  1) **驻扎容量 12 人**（作为远征队/守备队的驻点）
  2) **营地仓储 400**（通用）
  3) 开启“**勘测任务**”：派遣小队探索半径外区域，产出 SD + 资源情报  
  4) **安全区半径 10**：在区内疲劳恢复更快、遭遇风险下降
  5) **补给线需求**：每日消耗 食物 12、水 12、燃料 4（按驻扎人数与模块浮动）

### G1-1 补给线机制（建议做成非常工程友好的简化模型）
- 先锋营地必须绑定一个“补给源”（主城仓库或另一个营地）
- 补给以“补给任务”形式运行（由 Wagon Depot / 配送中心生成）
- 断供后惩罚按阶段递进：
  - 第1天：效率-20%
  - 第2天：勘测/生产暂停
  - 第3天：驻扎士气下降、可能触发“营地受袭/撤离”事件（事件不在本阶段细做，但留接口）

## G2 先锋营地模块（像“插槽”一样扩展功能）
先锋营地默认 **2个模块槽**；升级后可到 4 个。模块都在营地周边拼装，占地较小，利于摆放。

### G2-1 模块清单（可配置）
1) **前哨仓库 Outpost Depot**
   - 占地：3×2；建造：木板 40、组件 4
   - 存储 +600；支持“资源集散”（远端矿→营地→主城）
2) **前哨工坊 Field Workshop**
   - 占地：3×3；建造：工具 8、零件 6、木板 30
   - 岗位 2；输入：废料 30/日 → 输出：简易零件 6/日 或 工具 3/日  
   - 用途：远端维修补给、减少回城依赖
3) **前哨医疗帐 Infirmary**
   - 占地：3×2；建造：药品 10、织物 10
   - 岗位 1；降低探索伤病、提高勘测成功率
4) **瞭望塔 Watchtower**
   - 占地：2×2；建造：木板 20、工具 4
   - 效果：营地安全区+6，降低袭扰概率；探索视野+1圈
5) **无线电中继 Radio Relay**
   - 占地：2×3；建造：零件 10、组件 6
   - 维护：电力 2 或 燃料 2/日
   - 效果：勘测任务时间 -20%，可把“远端发现”即时同步到主城
6) **临时驻车点 Motor Pool（偏工业后）**
   - 占地：4×3；建造：钢锭 10、零件 12
   - 效果：补给线容量+（等价于“更多车队槽位”）

## G3 先锋营地升级（营地等级）
- **营地 Lv1（T2）**：模块槽2、驻扎12、探索半径+18格
- **营地 Lv2（T3）**：模块槽3、驻扎18、探索半径+26格、仓储+200  
  - 升级成本：钢锭 15、组件 10、零件 12、保存食品 30
- **营地 Lv3（T4）**：模块槽4、驻扎24、探索半径+34格、可建立“二级营地”  
  - 升级成本：钢锭 30、组件 20、零件 25、SD 80

> 这样设计的好处：地图变大后，玩家不是“走很远挖一趟回城”，而是用营地把远端资源“纳入供应链”。

---

---

## 附录F：科技树（VU+ResearchWork 版本，原文）

# 4) 科技树（V2：用 VU+ResearchWork 把每个解锁点“算”出来）

## 4.1 科研结算规则（统一、可实现）
- 研究员产出：`ResearchWork/s = 人数 × 1 × (建筑倍率)`
- 科技条目消耗：
  - `ResearchWork`（劳动力成本，价值 = Work×0.25 VU）
  - + 若干物品（Data Tape / Microchip / Radio Parts / Battery…），全都可 VU 核算

> **Data Tape 的作用（强烈建议）**：  
> 作为“知识材料”，可用于：
> - 作为前置门槛（必须拥有）  
> - 或作为消耗品：**每消耗 1 Data Tape（160 VU），可立刻抵扣 800 ResearchWork（=200 VU）**  
>   - 这不是“白赚”，而是把探索得到的知识转成研究速度，节奏更有探索驱动力

---

## 4.2 科技树结构（分支清晰，互相咬合）
我把科技树拆成 5 条主线，每条线 3~5 个层级。每个节点都给“成本、前置、效果”。

### T0 生存与基础组织
1) **岗位制度**  
- 成本：`600 RW + 60 Scrap`（RW=ResearchWork）  
  - VU：`600×0.25 +60 = 150+60 = 210`  
- 解锁：岗位分配UI、基础日志提示（缺水/缺食阈值）

2) **基础仓储规划**  
- 成本：`900 RW + 80 Scrap + 10 Wood`  
  - VU：`225 +80 +80 =385`  
- 解锁：Warehouse L1

3) **基础工坊理论**  
- 成本：`1200 RW + 120 Scrap + 20 Wood`  
  - VU：`300 +120 +160 =580`  
- 解锁：Workshop L1、Wood/Metal 两个核心配方

---

### T1 材料与医疗
4) **多材料加工（组件谱系I）**  
- 前置：Workshop L1  
- 成本：`1800 RW + 200 Scrap`（VU=450+200=650）  
- 解锁：Cloth/Plastic/Glass/Rubber/Wire/Rope/Fasteners 等配方

5) **简易医疗与卫生**  
- 成本：`1800 RW + 1 Data Tape + 200 Scrap + 20 Cloth + 2 Filter`  
  - VU：`450 +160 +200 +100 +34 =944`  
- 解锁：基地“医疗站/止血/感染处理”相关建筑与配方入口（Meds 消耗点出现）

6) **食物加工与保鲜**  
- 成本：`1500 RW + 150 Scrap + 10 Metal + 2 Pipe`  
  - VU：`375 +150 +160 +30 =715`  
- 解锁：厨房类建筑、Raw Meat→Food、罐头/士气的小循环（探索收益更“可用”）

---

### T2 通讯与远征准备
7) **无线电基础**  
- 成本：`2400 RW + 300 Scrap + 30 Metal + 10 Wire + 1 Battery Cell`  
  - VU：`600 +300 +480 +110 +45 =1535`  
- 解锁：Radio Tower L1（或作为其科技前置）

8) **补给压缩技术**  
- 前置：Pack Station  
- 成本：`2400 RW + 1 Data Tape + 10 Plastic + 10 Cloth`  
  - VU：`600 +160 +70 +50 =880`  
- 解锁：Ration Pack / Water Canister（地图×2的关键解法之一）

9) **车队组织与护运**  
- 前置：Caravan Office  
- 成本：`3000 RW + 1 Data Tape + 1 Radio Parts`  
  - VU：`750 +160 +240 =1150`  
- 效果：车队遇袭率 -15%；车队容量 +20%

---

### T3 先锋营地与中继网络
10) **野外工事（先锋营地）**  
- 前置：Radio L1、补给压缩  
- 成本：`3600 RW + 2 Data Tape + 20 Rope + 10 Tape`  
  - VU：`900 +320 +140 +140 =1500`  
- 解锁：先锋营地 L1、基础模块（仓储/瞭望/简易修理）

11) **中继通讯**  
- 前置：Radio Parts / Battery Cell  
- 成本：`4800 RW + 1 Radio Parts + 2 Battery Cell`  
  - VU：`1200 +240 +90 =1530`  
- 解锁：营地“中继模块”、Radio Tower L2 前置、探索视野/任务刷新增强

12) **化工与燃料体系**  
- 成本：`4800 RW + 2 Data Tape + 1 Solvent + 2 Filter`  
  - VU：`1200 +320 +22 +34 =1576`  
- 解锁：Chem Bench、Fuel/Gunpowder/Acid 等关键配方与“电力门槛”

---

### T4 电子学与能源（地图深层推进）
13) **电力系统（电芯/电池包）**  
- 成本：`6000 RW + 1 Chip + 4 Battery Cell + 20 Wire`  
  - VU：`1500 +640 +180 +220 =2540`  
- 解锁：Battery Pack、研究所供电、夜间探索装备等

14) **太阳能工程**  
- 成本：`9000 RW + 2 Data Tape + 2 Solar Cell`  
  - VU：`2250 +320 +640 =3210`  
- 解锁：Solar Array（无燃料电力），为长期挂机提供稳定工业底盘

15) **营地网络与快速调度**  
- 前置：先锋营地 L2  
- 成本：`12000 RW + 2 Chip + 2 Radio Parts`  
  - VU：`3000 +1280 +480 =4760`  
- 效果：营地间“快速转移/补给协调”，把地图×2带来的距离压力转为“网络规划乐趣”

---

---

## 附录G：先锋营地（V2版本，原文）

# 5) 先锋营地（V2新增重头戏：用于驻扎并探索更远）

先锋营地不是“第二个基地”，而是一个**可建设的前沿节点**，专门解决三件事：
1) 把“远距离”变成“分段路线规划”  
2) 把“背包容量墙”变成“补给缓存+压缩补给”的策略问题  
3) 给探索提供稳定的“安全屋/中继/维修/补给”循环，让探索更好玩而不是更折磨

---

## 5.1 先锋营地核心规则
- 营地建在地图格/节点上（必须先探索到并清理）
- 每个营地有：
  - **营地库存**（独立于基地）
  - **营地半径 R**：半径内的探索任务可把营地作为出发点（距离从营地算）
  - **模块槽位**：安装仓储/瞭望/维修/医疗/中继等
  - **最低驻守**：至少 1 人（不驻守则营地“休眠”，模块不生效、库存不可用）
    - 平衡意义：营地永远有机会成本（占用人口与消耗）

---

## 5.2 营地等级（L1~L3，成本严格按 VU 体系）
> 下列成本我给出“物品清单 + 折算 VU”，你实现时可直接做成配置表字段。

### Camp L1（可用、安全屋雏形）
- 解锁：科技「野外工事」、Radio L1
- 成本（建议）：
  - `600 Scrap + 120 Wood + 40 Metal + 4 Rope + 2 Tape + 1 Radio Parts + 1 Battery Cell`
  - 折算：约 **2541 VU**
- 能力：
  - 半径 **R=3**
  - 模块槽位 **2**
  - 营地库存基础上限（建议）：
    - Water/Food 各 120，Scrap 300，Wood 120，Metal 60  
    - Components 200，Chemicals 80，TechParts 20
  - 驻守需求：1人

### Camp L2（真正的前沿枢纽）
- 前置：Camp L1 +「中继通讯」
- 成本（建议）：
  - `1200 Scrap + 200 Wood + 80 Metal + 10 Wire + 5 Gear + 1 Radio Parts + 1 Chip`
  - 折算：约 **5145 VU**
- 能力：
  - 半径 **R=5**
  - 模块槽位 **4**
  - 允许“车队定期补给”（自动化补给计划）
  - 驻守需求：2人（否则无法启用自动补给）

### Camp L3（深区作战基地）
- 前置：Camp L2 + Radio L2 +「营地网络」
- 成本（建议）：
  - `2500 Scrap + 400 Wood + 180 Metal + 20 Gear + 30 Wire + 2 Radio Parts + 2 Chip + 1 Meds`
  - 折算：约 **11290 VU**
- 能力：
  - 半径 **R=8**
  - 模块槽位 **6**
  - 启用“营地间快速调度”（网络化玩法核心）
  - 驻守需求：3人（深区维持成本上升）

---

## 5.3 营地模块（复杂但有序：每个模块都能用 VU 算价值）
我给出 6 个核心模块（足够形成丰富策略），每个模块都提供：
- **成本（物品+VU）**
- **效果**
- **平衡意义（用 VU/分钟 或 期望节省 VU 表达）**

### M1. 仓储帐篷 Storage
- 成本：`200 Scrap + 60 Wood + 2 Rope + 1 Tape` ≈ **708 VU**
- 效果：营地库存上限 +50%
- 意义：让你能在远区“囤补给/囤战利品”，减少来回跑（直接提升探索效率）

### M2. 瞭望塔 Watchtower
- 成本：`160 Scrap + 50 Wood + 10 Metal + 1 Rope` ≈ **727 VU**
- 效果：营地半径内“遭遇战/伏击”概率 -15%，撤退损失 -20%
- 意义：按你文档的“伤药是硬通货”，这模块主要收益来自**节省 Med/治疗品（320 VU 级别）**，非常值钱但不直接产资源，玩法更有味道。

### M3. 医疗棚 Infirmary
- 成本：`120 Scrap + 30 Wood + 20 Cloth + 2 Filter + 1 Meds` ≈ **814 VU**
- 效果：
  - 在营地休整：探索队恢复更快（减少 Med 消耗）
  - 允许把 Bandage/Antiseptic（若你启用医疗细分）做成“现场急救”
- 意义：把“受伤成本”从随机惩罚变成可规划变量

### M4. 前线工坊 Field Workshop
- 成本：`220 Scrap + 50 Wood + 15 Metal + 2 Gear + 1 Tape` ≈ **904 VU**
- 效果：
  - 可在营地进行基础拆解/修理（Scrap/Work 消耗）
  - 允许把探索战利品“就地减重”（比如拆成 Scrap/Components）
- 意义：直接对抗“背包重量墙”，并把探索得到的杂物转为可用价值

### M5. 中继电台 Relay
- 成本：`180 Scrap + 30 Wood + 20 Metal + 10 Wire + 1 Radio Parts + 1 Battery Cell` ≈ **1135 VU**
- 效果：
  - 基地 ⇄ 营地 车队耗时 -15%
  - 基地能更早“看到”营地半径内的特殊点（剧情/稀有）
- 意义：把远区变成“可持续经营的线路”，而不是一次性远征

### M6. 集水冷凝器 Water Condenser
- 成本：`160 Scrap + 40 Wood + 4 Pipe + 2 Seal Ring + 2 Filter` ≈ **596 VU**
- 产出：`+0.6 Water/分钟`（可升级到 1.0）
  - 折算价值：`0.6×5 = 3 VU/分钟`
- 意义：营地自给一部分水，减少运输负担；长线探索越深越赚

（可选同构：**陷阱补给点 Trap Cache**，成本≈618 VU，产出 +0.6 Food/分钟）

---

## 5.4 先锋营地的“数学收益”校验（你要的科学平衡）
用你文档的探索成本模型：
- 探索时，每人每分钟总成本近似 **10 VU/分钟/人**（你文档推导：额外补给≈5 + 机会成本≈5）

### 营地带来的核心收益 = 节省时间
设：
- 从基地出发到目标点的单次任务总时长 `T_base`
- 从营地出发的单次任务总时长 `T_camp`
- 队伍人数 P
则单次任务节省价值：
- `ΔVU = (T_base - T_camp) × 10 × P`

**示例（非常典型，且能支撑地图×2）**  
- 目标区在基地距离 d=12（你地图扩大后这是常见距离）  
  - `S = 2 + floor(12/3)=6`  
  - `T_base = 2d + S = 24 + 6 = 30 分钟`
- 你在 d=8 处建立营地（离目标还剩 4）  
  - `S = 2 + floor(4/3)=3`  
  - `T_camp = 2×4 + 3 = 11 分钟`
- P=2 人小队  
  - `ΔVU = (30-11)×10×2 = 380 VU/次`

若 Camp L1 成本约 2541 VU，则回本次数约：
- `2541 / 380 ≈ 6.7 次任务`

> 结论：营地不是“奢侈品”，而是**数学上必然出现的最优解**——这正是你要的“复杂但有序”：玩家会自然推导出营地网络策略。

---

# 6) “地图长宽×2 + 多地区”的配套（确保探索乐趣不崩）
地图扩大后，必须同时提供三条“非破坏性解法”，否则深区会被纯容量/耗时堵死：

1) **压缩补给（Pack Station）**：不改变价值，只改变重量约束  
2) **先锋营地网络**：把长距离拆成分段，形成路线经营玩法  
3) **车队/中继/电力**：把“远区经营”从手动磨变成系统化运营

这三条全都能用 VU 核算成本与收益，因此不会出现某条路线压倒性强、或某条路线完全废的情况。

---

# 7) 一组“可跑通”的中期配置示例（验证供需与节奏）

假设中期人口 **18**，水/食建筑 **L2**（m=1.1）：
- 水每工人：`3×1.1=3.3 /min`，需水：18  
  - `W_min=ceil(18/3.3)=6`
- 食每工人：`3.6×1.1=3.96 /min`，需食：`18×1.2=21.6`  
  - `H_min=ceil(21.6/3.96)=6`
- 生存岗位共 12 人，剩余 6 人做拾荒/工程/研究/车队

此时理论净盈余：
- `净VU/min = 5×18 = 90 VU/min`

那么：
- Radio L1（1420 VU）≈ **16 分钟**级目标  
- Camp L1（2541 VU）≈ **28 分钟**级目标  
- Workshop L3（2860 VU）≈ **32 分钟**级目标  

这正好落在你文档的阶段目标：
- S3（探索展开）/S4（芯片时代）所需的 20~40 分钟级关键目标区间内，节奏稳定。

---

# 8) 你接下来实现时最该“锁死”的调参旋钮（防崩盘清单）
为了让系统长期稳定，建议把下面几项当作“不能随便动”的物理常数：

1) **拾荒者 15 Scrap/min（=15 VU/min）**  
2) **水 3/min、食 3.6/min（对应 5 VU 与 4.167 VU）**  
3) **水耗 1.0/min、食耗 1.2/min → 生存成本 10 VU/min/人**  
4) **Wood 8 VU、Metal 16 VU（严格由配方算出）**  
5) **Meds/Chip/Core = 320/640/2560（倍数链保持）**  
6) 研究与工坊都用 `Work` 或 `ResearchWork`，并保持 **1 秒劳动力 = 0.25 VU** 这个换算

只要这些锚点不乱，其他所有数值（建筑成本、模块收益、科技耗时、地图距离）都能用 VU 回算，怎么扩展都不容易崩。

---


