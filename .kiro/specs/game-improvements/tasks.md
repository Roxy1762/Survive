# Implementation Plan: 游戏改进 (Game Improvements)

## Overview

本实现计划将游戏改进分解为可执行的编码任务，按依赖顺序排列。优先实现核心功能（行动系统修复、资源短缺死亡），然后是UI功能（开始/结算画面、存档UI），最后是配置功能（难度、场景选择）。

## Tasks

- [-] 1. 修复行动系统执行
  - [x] 1.1 修改 ActionPanel.tsx 连接 actionStore.executeAction
    - 导入 useActionStore, useResourceStore, useEventStore
    - 修改 handleExecuteAction 调用实际的 executeAction 函数
    - 传入正确的 context 和资源回调
    - _Requirements: 1.1, 1.2, 1.5_
  - [x] 1.2 添加行动失败反馈显示
    - 当 executeAction 返回失败时，显示错误消息到事件日志
    - _Requirements: 1.3_
  - [x] 1.3 编写行动执行属性测试

    - **Property 1: Action Execution Updates State**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

- [x] 2. 实现资源短缺死亡机制
  - [x] 2.1 修改 gameIntegration.ts 添加 processResourceShortage 函数
    - 计算水短缺伤害 (10 HP/AU)
    - 计算食物短缺伤害 (8 HP/AU)
    - 按健康值排序工人，最低的先受伤
    - _Requirements: 3.1, 3.2, 3.6_
  - [x] 2.2 修改 processPhaseEnd 调用 processResourceShortage
    - 在 processPhaseConsumption 后检查短缺结果
    - 调用 processResourceShortage 处理伤害
    - _Requirements: 3.1, 3.2_
  - [x] 2.3 实现工人死亡逻辑
    - 当工人健康值为0时移除工人
    - 记录死亡事件到事件日志
    - _Requirements: 3.3, 3.4_
  - [x] 2.4 编写资源短缺伤害属性测试

    - **Property 4: Resource Shortage Health Damage**
    - **Validates: Requirements 3.1, 3.2, 3.6**
  - [x] 2.5 编写工人死亡属性测试

    - **Property 5: Worker Death on Zero Health**
    - **Validates: Requirements 3.3, 3.4**

- [x] 3. Checkpoint - 核心机制验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 4. 创建游戏状态管理 Store
  - [x] 4.1 创建 gameStateStore.ts
    - 定义 GameState 类型 ('title' | 'new_game' | 'playing' | 'paused' | 'game_over')
    - 定义 GameStatistics 接口
    - 实现状态转换函数 (setGameState, startNewGame, continueGame, triggerGameOver, returnToTitle)
    - 实现统计更新函数
    - _Requirements: 8.1, 8.3_
  - [x] 4.2 连接游戏结束触发
    - 在 processResourceShortage 中检查工人数量
    - 当所有工人死亡时调用 triggerGameOver
    - _Requirements: 5.1, 8.4_
  - [ ]* 4.3 编写游戏状态属性测试
    - **Property 6: Game Over on Total Population Loss**
    - **Validates: Requirements 5.1, 8.4**

- [x] 5. 创建难度和场景配置
  - [x] 5.1 创建 config/difficulty.ts
    - 定义 DifficultyLevel 类型
    - 定义 DifficultyConfig 接口
    - 实现 DIFFICULTY_CONFIGS 配置对象
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 5.2 创建 config/scenarios.ts
    - 定义 StartingScenario 接口
    - 实现 STARTING_SCENARIOS 配置数组
    - _Requirements: 7.2_
  - [ ]* 5.3 编写场景初始化属性测试
    - **Property 7: Scenario Initialization**
    - **Validates: Requirements 7.3**

- [x] 6. 创建开始画面组件
  - [x] 6.1 创建 components/screens/TitleScreen.tsx
    - 显示游戏标题和氛围文字
    - 实现新游戏、继续游戏、设置按钮
    - 继续按钮根据存档存在状态启用/禁用
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_
  - [x] 6.2 创建 components/screens/DifficultySelect.tsx
    - 显示三个难度选项
    - 点击后传递选择到父组件
    - _Requirements: 6.5_
  - [x] 6.3 创建 components/screens/ScenarioSelect.tsx
    - 显示场景选项列表
    - 显示场景名称、描述、初始条件
    - _Requirements: 7.1, 7.4_
  - [ ]* 6.4 编写继续按钮状态属性测试
    - **Property 10: Title Screen Continue Button State**
    - **Validates: Requirements 4.3**

- [x] 7. 创建结算画面组件
  - [x] 7.1 创建 components/screens/GameOverScreen.tsx
    - 显示游戏结束标题
    - 显示死因/失败原因
    - 显示生存统计数据
    - 实现重新开始和返回标题按钮
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [ ]* 7.2 编写统计追踪属性测试
    - **Property 9: Statistics Tracking**
    - **Validates: Requirements 8.3, 8.4**

- [x] 8. 修改 App.tsx 实现画面切换
  - [x] 8.1 修改 App.tsx 根据游戏状态渲染不同画面
    - 导入 useGameStateStore
    - 根据 gameState 渲染 TitleScreen / GameLayout / GameOverScreen
    - 实现新游戏流程 (难度选择 → 场景选择 → 开始游戏)
    - _Requirements: 4.5, 4.6, 7.5, 8.2_
  - [ ]* 8.2 编写游戏状态画面映射属性测试
    - **Property 8: Game State Screen Mapping**
    - **Validates: Requirements 8.2**

- [x] 9. Checkpoint - UI功能验证
  - 确保所有测试通过，如有问题请询问用户

- [x] 10. 实现存档导入导出UI
  - [x] 10.1 创建 components/SaveExportUI.tsx
    - 实现导出按钮，调用 saveStore.downloadSave
    - 实现导入按钮，使用隐藏的 file input
    - 处理导入结果，显示成功/失败消息
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 10.2 集成 SaveExportUI 到 DetailsPanel 或设置菜单
    - 在合适位置添加导出/导入按钮
    - _Requirements: 2.1, 2.3_
  - [ ]* 10.3 编写存档往返一致性属性测试
    - **Property 3: Save Round-Trip Consistency**
    - **Validates: Requirements 2.4, 2.5, 2.6**

- [x] 11. 集成难度修正到游戏系统
  - [x] 11.1 修改 resourceStore 应用消耗倍率
    - 在 processPhaseConsumption 中获取难度修正
    - 应用 consumptionMultiplier 到资源消耗
    - _Requirements: 6.2, 6.3, 6.4_
  - [x] 11.2 修改 initializeNewGame 应用初始资源倍率
    - 根据难度和场景计算初始资源
    - 应用 startingResourceMultiplier
    - _Requirements: 6.2, 6.3, 6.4, 7.3_
  - [x] 11.3 修改 saveStore 保存难度设置
    - 在存档数据中包含 difficulty 字段
    - 加载存档时恢复难度设置
    - _Requirements: 6.6_

- [x] 12. Final Checkpoint - 完整功能验证
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 标记 `*` 的任务为可选测试任务，可跳过以加快MVP开发
- 每个任务都引用了具体的需求条款以便追溯
- 检查点用于增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
