# Requirements Document

## Introduction

本文档定义了《尘埃与回响》游戏的改进需求，包括修复现有问题和添加新功能。主要涵盖：行动系统修复、存档导入导出UI、资源短缺死亡机制、开始/结算画面、难度选择系统。

游戏核心设计基于统一度量体系：
- **AU (Action Unit)**: 行动时长单位，一天共5 AU（清晨0.5 + 上午1 + 中午0.5 + 下午1 + 傍晚1 + 午夜1）
- **VU (Value Unit)**: 价值单位，1 VU = 1 Scrap，用于统一衡量所有资源、物品、建筑的价值
- **净盈余公式**: 15 VU/AU (产出) - 10 VU/AU (消耗) = 5 VU/AU/人

## Glossary

- **Game_System**: 游戏核心系统
- **Action_System**: 行动执行系统
- **Save_System**: 存档系统
- **Resource_System**: 资源管理系统
- **Population_System**: 人口管理系统
- **UI_System**: 用户界面系统
- **Difficulty_System**: 难度系统
- **Event_System**: 事件系统
- **Phase**: 游戏阶段（dawn/morning/noon/afternoon/evening/midnight）

## Requirements

### Requirement 1: 行动系统修复

**User Story:** As a player, I want to click action buttons and have them execute properly, so that I can interact with the game.

#### Acceptance Criteria

1. WHEN a player clicks an action button, THE Action_System SHALL execute the corresponding action logic
2. WHEN an action is executed successfully, THE Action_System SHALL update resources and display results in the event log
3. WHEN an action fails validation, THE Action_System SHALL display the failure reason to the player
4. WHEN an action consumes AU, THE Game_System SHALL track remaining AU for the current phase
5. IF an action requires specific resources, THEN THE Action_System SHALL consume those resources upon execution

### Requirement 2: 存档导入导出UI

**User Story:** As a player, I want to export and import my save data through the UI, so that I can backup my progress or transfer it between devices.

#### Acceptance Criteria

1. THE UI_System SHALL provide an "Export Save" button in the settings/menu area
2. WHEN player clicks "Export Save", THE Save_System SHALL generate a downloadable JSON file
3. THE UI_System SHALL provide an "Import Save" button in the settings/menu area
4. WHEN player selects a save file to import, THE Save_System SHALL validate and load the save data
5. IF imported save data is invalid, THEN THE Save_System SHALL display an error message
6. WHEN save is successfully imported, THE Game_System SHALL restore the game state and notify the player

### Requirement 3: 资源短缺死亡机制

**User Story:** As a player, I want resource shortages to have real consequences including population death, so that resource management feels meaningful.

#### Acceptance Criteria

1. WHEN water shortage occurs (water = 0 and consumption needed), THE Population_System SHALL reduce worker health by 10 per AU of shortage
2. WHEN food shortage occurs (food = 0 and consumption needed), THE Population_System SHALL reduce worker health by 8 per AU of shortage
3. WHEN a worker's health reaches 0, THE Population_System SHALL remove the worker (death)
4. WHEN a worker dies from resource shortage, THE Event_System SHALL log a death event with narrative text
5. THE UI_System SHALL display health warnings when workers are at risk of dying
6. WHEN multiple workers are at risk, THE Population_System SHALL apply damage to the lowest health workers first

### Requirement 4: 开始画面

**User Story:** As a player, I want to see a start screen when launching the game, so that I can choose to start a new game or continue.

#### Acceptance Criteria

1. WHEN the game loads, THE UI_System SHALL display a start screen with game title and atmosphere
2. THE start screen SHALL display "New Game" button
3. THE start screen SHALL display "Continue" button (enabled only if save exists)
4. THE start screen SHALL display "Settings" button for game options
5. WHEN player clicks "New Game", THE UI_System SHALL navigate to difficulty/scenario selection
6. WHEN player clicks "Continue", THE Game_System SHALL load the saved game and enter gameplay
7. THE start screen SHALL use the game's retro terminal aesthetic

### Requirement 5: 结算画面

**User Story:** As a player, I want to see a game over screen when I lose, so that I understand what happened and can try again.

#### Acceptance Criteria

1. WHEN all workers die, THE Game_System SHALL trigger game over state
2. WHEN game over occurs, THE UI_System SHALL display a game over screen
3. THE game over screen SHALL show survival statistics (days survived, resources gathered, etc.)
4. THE game over screen SHALL show cause of death/failure
5. THE game over screen SHALL provide "New Game" button to restart
6. THE game over screen SHALL provide "Return to Title" button
7. THE game over screen SHALL use atmospheric narrative text fitting the wasteland theme

### Requirement 6: 难度选择系统

**User Story:** As a player, I want to choose difficulty level, so that I can adjust the challenge to my preference.

#### Acceptance Criteria

1. THE Difficulty_System SHALL support three difficulty levels: Easy, Normal, Hard
2. WHEN difficulty is Easy, THE Game_System SHALL apply modifiers:
   - Resource consumption: 0.8x
   - Starting resources: 1.5x
   - Event danger: 0.7x
3. WHEN difficulty is Normal, THE Game_System SHALL apply no modifiers (1.0x all)
4. WHEN difficulty is Hard, THE Game_System SHALL apply modifiers:
   - Resource consumption: 1.2x
   - Starting resources: 0.7x
   - Event danger: 1.3x
5. THE UI_System SHALL display difficulty selection on the new game screen
6. THE Save_System SHALL persist the selected difficulty with the save data

### Requirement 7: 开局选择界面

**User Story:** As a player, I want to choose my starting scenario, so that I can have varied gameplay experiences.

#### Acceptance Criteria

1. THE UI_System SHALL display scenario selection after difficulty selection
2. THE Game_System SHALL support at least 3 starting scenarios:
   - "孤独幸存者" (Lone Survivor): 1 worker, balanced resources
   - "废墟拾荒者" (Scavenger): 2 workers, high scrap, low food/water
   - "避难所遗民" (Shelter Remnant): 2 workers, high food/water, low scrap
3. WHEN a scenario is selected, THE Game_System SHALL initialize with scenario-specific resources and workers
4. THE scenario selection screen SHALL display scenario name, description, and starting conditions
5. WHEN player confirms selection, THE Game_System SHALL start the game with chosen settings

### Requirement 8: 游戏状态管理

**User Story:** As a player, I want the game to properly track game state transitions, so that I can experience proper game flow.

#### Acceptance Criteria

1. THE Game_System SHALL support game states: 'title', 'playing', 'paused', 'game_over'
2. WHEN game state changes, THE UI_System SHALL display appropriate screens
3. THE Game_System SHALL track game statistics during gameplay:
   - Days survived
   - Total resources gathered
   - Workers lost
   - Buildings constructed
4. WHEN game ends, THE Game_System SHALL preserve statistics for display on game over screen
5. THE Game_System SHALL allow resetting to title screen from any state
