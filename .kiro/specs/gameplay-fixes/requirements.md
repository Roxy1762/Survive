# Requirements Document

## Introduction

本文档定义了《尘埃与回响》游戏的功能修复需求，主要涵盖：建筑功能修复、工人分配系统、制造系统UI改进、探索功能修复、以及AU自动进阶功能。

## Glossary

- **Game_System**: 游戏核心系统
- **Building_System**: 建筑系统
- **Worker_System**: 工人管理系统
- **Crafting_System**: 制造系统
- **Exploration_System**: 探索系统
- **Time_System**: 时间/阶段系统
- **UI_System**: 用户界面系统
- **AU (Action Unit)**: 行动时长单位
- **Phase**: 游戏阶段（dawn/morning/noon/afternoon/evening/midnight）

## Requirements

### Requirement 1: 建筑功能修复

**User Story:** As a player, I want buildings to provide their effects after construction, so that I can benefit from building upgrades.

#### Acceptance Criteria

1. WHEN a building is constructed or upgraded, THE Building_System SHALL immediately apply all building effects
2. WHEN a production building (集水器/陷阱/拾荒站) is built, THE Building_System SHALL unlock the corresponding job slot
3. WHEN a workshop is built, THE Building_System SHALL enable crafting functionality
4. WHEN a radio tower is built, THE Building_System SHALL unlock exploration regions based on tower level
5. WHEN a shelter is built or upgraded, THE Building_System SHALL increase population cap by 2 per level
6. WHEN a warehouse is built or upgraded, THE Building_System SHALL increase resource storage caps
7. WHEN a bonfire is built, THE Building_System SHALL enable bonfire intensity controls

### Requirement 2: 工人分配系统

**User Story:** As a player, I want to assign workers to jobs without consuming AU, so that I can manage my workforce efficiently.

#### Acceptance Criteria

1. THE UI_System SHALL provide a worker assignment interface in the population tab
2. WHEN a player assigns a worker to a job, THE Worker_System SHALL NOT consume any AU
3. WHEN a player assigns a worker to a job, THE Worker_System SHALL validate job slot availability
4. WHEN a job slot is full, THE UI_System SHALL display the slot as unavailable
5. WHEN a worker is assigned to a job, THE Worker_System SHALL update the worker's job status immediately
6. WHEN a worker is unassigned from a job, THE Worker_System SHALL set the worker to idle status
7. THE UI_System SHALL display available job slots based on building levels
8. IF a worker cannot work (health < 20 or bleeding), THEN THE UI_System SHALL disable assignment for that worker

### Requirement 3: 制造系统UI改进

**User Story:** As a player, I want to browse crafting recipes in a menu and confirm before spending AU, so that I can make informed crafting decisions.

#### Acceptance Criteria

1. WHEN a player clicks the craft action, THE UI_System SHALL display a crafting menu modal
2. THE crafting menu SHALL display all available recipes with their costs and outputs
3. THE crafting menu SHALL show required materials and current inventory amounts
4. THE crafting menu SHALL show required Work points and current accumulated Work
5. WHEN a player selects a recipe, THE UI_System SHALL display recipe details and quantity selector
6. WHEN a player confirms crafting, THE Crafting_System SHALL consume materials and Work points
7. WHEN a player confirms crafting, THE Crafting_System SHALL consume AU based on the action cost
8. IF materials or Work are insufficient, THEN THE UI_System SHALL disable the confirm button
9. WHEN crafting is successful, THE Crafting_System SHALL add the crafted item to inventory

### Requirement 4: 探索功能修复

**User Story:** As a player, I want to explore map nodes and gather resources, so that I can expand my territory and find supplies.

#### Acceptance Criteria

1. WHEN a player clicks the explore action, THE UI_System SHALL display an exploration menu
2. THE exploration menu SHALL display available map nodes based on radio tower level
3. THE exploration menu SHALL show node information (name, tier, distance, risk)
4. THE exploration menu SHALL show required supplies (water, food) for the expedition
5. WHEN a player selects a node and workers, THE UI_System SHALL display expedition preview
6. WHEN a player confirms exploration, THE Exploration_System SHALL start an expedition
7. WHEN an expedition is started, THE Exploration_System SHALL consume required supplies
8. WHEN an expedition completes, THE Exploration_System SHALL generate loot based on node tier
9. WHEN an expedition completes, THE Exploration_System SHALL update node state to explored
10. IF no radio tower is built, THEN THE Exploration_System SHALL only allow T1 (近郊) exploration

### Requirement 5: AU自动进阶功能

**User Story:** As a player, I want the game to automatically advance to the next phase when AU is depleted, so that gameplay flows smoothly.

#### Acceptance Criteria

1. THE Game_System SHALL support an auto-advance setting that can be toggled on/off
2. WHEN auto-advance is enabled AND remaining AU reaches 0, THE Time_System SHALL automatically advance to the next phase
3. WHEN auto-advance triggers, THE Game_System SHALL process all phase-end calculations
4. THE UI_System SHALL provide a toggle for auto-advance in the settings tab
5. THE auto-advance setting SHALL default to disabled (off)
6. WHEN auto-advance is disabled, THE player SHALL manually click "结束阶段" to advance
7. THE Game_System SHALL persist the auto-advance setting with save data

### Requirement 6: 建筑效果同步

**User Story:** As a player, I want building effects to be properly synchronized across all game systems, so that upgrades work correctly.

#### Acceptance Criteria

1. WHEN a building level changes, THE Building_System SHALL notify all dependent systems
2. WHEN population cap changes, THE Worker_System SHALL update available worker slots
3. WHEN storage cap changes, THE Resource_System SHALL update resource limits
4. WHEN job slots change, THE Worker_System SHALL validate current assignments
5. IF a job slot is reduced below current workers, THEN THE Worker_System SHALL unassign excess workers

