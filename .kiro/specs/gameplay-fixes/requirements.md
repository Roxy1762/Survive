# Requirements Document

## Introduction

本文档定义了"尘埃与回响"游戏中需要修复的多个gameplay问题，包括探索系统bug、建筑功能问题、初始工具缺失等。

## Glossary

- **Exploration_System**: 探索系统，负责地图节点探索和探险队管理
- **Building_System**: 建筑系统，负责建筑建造和效果应用
- **Action_System**: 行动系统，负责执行玩家行动并产生效果
- **Resource_System**: 资源系统，负责资源的生产和消耗
- **Production_System**: 生产系统，负责岗位工人的资源产出计算
- **Job_System**: 岗位系统，负责工人分配和岗位槽位管理
- **Radio_Tower**: 无线电塔，解锁更远区域探索的建筑
- **Water_Collector**: 集水器，提升集水者岗位效率的建筑
- **T1_Region**: 近郊区域，距离1-2的低风险区域
- **Base_Efficiency**: 基础效率，无建筑时的生产效率（1.0x）
- **Building_Efficiency**: 建筑效率，公式为 1 + 0.10 × (Level - 1)

## Requirements

### Requirement 1: T1近郊探索无需电塔

**User Story:** As a player, I want to explore T1 suburban areas without building a radio tower, so that I can start exploring early in the game.

#### Acceptance Criteria

1. WHEN the radio tower level is 0, THE Exploration_System SHALL allow access to T1 regions (distance 1-2)
2. WHEN displaying the map view with radio tower level 0, THE Map_View SHALL show T1 nodes as accessible (not show "需要建造无线电塔")
3. WHEN opening the exploration modal with radio tower level 0, THE Exploration_Modal SHALL display T1 nodes as explorable
4. WHEN radio tower level is 0, THE Map_View SHALL filter nodes by max distance 2 instead of hiding all nodes

### Requirement 2: 探索行动正确执行

**User Story:** As a player, I want exploration actions to produce actual results, so that I can gather resources from explored areas.

#### Acceptance Criteria

1. WHEN an expedition is started, THE Exploration_System SHALL consume the required supplies (water and food)
2. WHEN an expedition completes, THE Exploration_System SHALL generate loot based on the node's tier and risk coefficient
3. WHEN an expedition completes, THE Resource_System SHALL add the generated loot to player resources
4. WHEN an expedition is in progress, THE Exploration_System SHALL update expedition status each phase

### Requirement 3: 岗位系统改进（无建筑可工作，有建筑加成）

**User Story:** As a player, I want to assign workers to basic jobs without requiring buildings first, so that I can survive the early game without being blocked by resource loops.

#### Acceptance Criteria

1. THE Job_System SHALL allow workers to be assigned to basic jobs (water_collector, hunter, scavenger) without requiring corresponding buildings
2. WHEN workers are assigned to jobs without buildings, THE Production_System SHALL produce resources at base efficiency (1.0x)
3. WHEN corresponding building is built (level >= 1), THE Production_System SHALL apply efficiency multiplier (1 + 0.10 × (Level - 1)) to production
4. WHEN corresponding building level increases, THE Production_System SHALL increase job slot capacity (Water/Food: 2 + 2L, Scrap: 3 + 3L)
5. WHEN no building exists, THE Job_System SHALL provide 2 base slots for water_collector and hunter, 3 base slots for scavenger

### Requirement 4: 玩家初始工具

**User Story:** As a player, I want to start with basic tools, so that I can perform initial actions more effectively.

#### Acceptance Criteria

1. WHEN a new game starts, THE Game_System SHALL provide initial tools based on scenario
2. THE initial tools SHALL include basic gathering and survival equipment
3. WHEN loading a saved game, THE Game_System SHALL preserve the player's tool inventory

### Requirement 5: 行动正确产生效果

**User Story:** As a player, I want all actions to produce their intended effects, so that my gameplay decisions have meaningful outcomes.

#### Acceptance Criteria

1. WHEN quick_scavenge action is executed, THE Action_System SHALL add 2-4 scrap to resources
2. WHEN gather_wood action is executed, THE Action_System SHALL add 1-2 wood to resources
3. WHEN hunt action is executed, THE Action_System SHALL add 2-4 food to resources
4. WHEN purify_small action is executed, THE Action_System SHALL consume 2 dirty_water and add 1 water
5. WHEN quick_cook action is executed, THE Action_System SHALL consume 1 raw_meat and add 1 food

### Requirement 6: 建筑提供岗位加成

**User Story:** As a player, I want buildings to enhance job productivity, so that my base development provides meaningful progression.

#### Acceptance Criteria

1. WHEN trap building is built, THE Production_System SHALL apply efficiency bonus to hunter job
2. WHEN scavenge_post building is built, THE Production_System SHALL apply efficiency bonus to scavenger job
3. WHEN water_collector building is built, THE Production_System SHALL apply efficiency bonus to water_collector job
4. WHEN workshop building is built, THE Building_System SHALL unlock the engineer job (requires building)
5. WHEN research_desk building is built, THE Building_System SHALL unlock the researcher job (requires building)
6. WHEN workers are assigned to jobs with buildings, THE Production_System SHALL produce resources with building efficiency multiplier

### Requirement 7: 增加获得人口的渠道

**User Story:** As a player, I want multiple ways to gain population, so that I can grow my settlement.

#### Acceptance Criteria

1. WHEN bonfire is lit (intensity > off), THE Population_System SHALL have a chance to attract wanderers
2. WHEN exploring certain nodes, THE Exploration_System SHALL have a chance to encounter recruitable survivors
3. WHEN trading with certain traders, THE Trade_System SHALL offer recruitment opportunities
