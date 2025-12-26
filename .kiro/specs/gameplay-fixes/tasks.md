# Implementation Plan: Gameplay Fixes

## Overview

本实现计划将修复《尘埃与回响》游戏的五个核心功能问题：建筑功能、工人分配、制造系统、探索功能和AU自动进阶。实现采用TypeScript，使用现有的Zustand状态管理架构。

## Tasks

- [x] 1. 修复建筑效果同步系统
  - [x] 1.1 在 gameIntegration.ts 中添加建筑效果同步函数
    - 创建 syncBuildingEffects 函数，在建筑升级后同步所有效果
    - 同步人口上限到 populationStore
    - 同步存储上限到 resourceStore
    - 同步岗位槽位到 populationStore
    - _Requirements: 1.1, 6.1, 6.2, 6.3, 6.4_
  - [x] 1.2 修复 buildingStore 的 buildOrUpgrade 函数
    - 确保升级后调用效果同步
    - 添加建筑效果立即生效的逻辑
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 1.3 编写建筑效果同步的属性测试
    - **Property 1: Building Effect Synchronization**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 6.1**

- [x] 2. 修复工人分配系统（不消耗AU）
  - [x] 2.1 修改 populationStore 的 assignJob 函数
    - 移除任何AU消耗逻辑
    - 确保分配操作是即时的
    - _Requirements: 2.2, 2.5, 2.6_
  - [x] 2.2 添加工人分配UI组件
    - 在 DetailsPanel 或新建 WorkerAssignmentPanel 中添加分配界面
    - 显示可用岗位和槽位数量
    - 显示工人列表和当前分配状态
    - 禁用无法工作的工人（健康<20或流血）
    - _Requirements: 2.1, 2.4, 2.7, 2.8_
  - [x] 2.3 添加岗位槽位验证逻辑
    - 检查岗位是否已满
    - 检查建筑是否已建造
    - _Requirements: 2.3_
  - [x] 2.4 编写工人分配的属性测试
    - **Property 2: Worker Assignment AU Invariant**
    - **Property 3: Worker Assignment State Consistency**
    - **Property 4: Job Slot Validation**
    - **Validates: Requirements 2.2, 2.3, 2.5, 2.6**

- [x] 3. Checkpoint - 确保建筑和工人系统测试通过
  - 运行所有相关测试
  - 如有问题请询问用户

- [x] 4. 修复制造系统（点击进入菜单，确认后扣AU）
  - [x] 4.1 创建 CraftingModal 组件
    - 显示所有可用配方列表
    - 显示配方所需材料和当前库存
    - 显示所需Work点数和当前累积Work
    - 添加数量选择器
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 4.2 修改 ActionPanel 中的制造行动处理
    - 点击制造按钮时打开 CraftingModal
    - 不在点击时消耗AU
    - _Requirements: 3.1_
  - [x] 4.3 实现制造确认逻辑
    - 确认时验证材料和Work是否足够
    - 确认时消耗材料、Work和AU
    - 确认时添加产出物品到库存
    - _Requirements: 3.6, 3.7, 3.8, 3.9_
  - [x] 4.4 编写制造系统的属性测试
    - **Property 5: Crafting Resource Round-Trip**
    - **Validates: Requirements 3.6, 3.7, 3.9**

- [x] 5. 修复探索功能
  - [x] 5.1 创建 ExplorationModal 组件
    - 显示可探索的地图节点列表
    - 根据无线电塔等级过滤可访问节点
    - 显示节点信息（名称、层级、距离、风险）
    - 显示所需补给（水、食物）
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 5.2 实现工人选择和探索预览
    - 添加工人选择界面
    - 显示探索预览（时间、补给消耗、预期收益）
    - _Requirements: 4.5_
  - [x] 5.3 修改 ActionPanel 中的探索行动处理
    - 点击探索按钮时打开 ExplorationModal
    - 实现探索确认逻辑
    - _Requirements: 4.6_
  - [x] 5.4 完善探索执行和完成逻辑
    - 确认时消耗补给和AU
    - 探索完成时生成战利品
    - 更新节点状态为已探索
    - _Requirements: 4.7, 4.8, 4.9_
  - [x] 5.5 实现无线电塔等级限制
    - 无塔时只能探索T1近郊
    - 根据塔等级解锁更远区域
    - _Requirements: 4.10_
  - [x] 5.6 编写探索系统的属性测试
    - **Property 6: Exploration Node Accessibility**
    - **Property 7: Exploration Lifecycle**
    - **Validates: Requirements 4.2, 4.6, 4.7, 4.8, 4.9, 4.10**

- [x] 6. Checkpoint - 确保制造和探索系统测试通过
  - 运行所有相关测试
  - 如有问题请询问用户

- [x] 7. 实现AU自动进阶功能
  - [x] 7.1 在 gameStateStore 中添加自动进阶设置
    - 添加 autoAdvanceEnabled 状态
    - 添加 toggleAutoAdvance 方法
    - 默认值设为 false
    - _Requirements: 5.1, 5.5_
  - [x] 7.2 在设置面板中添加自动进阶开关
    - 在 SettingsPanel 或 GameLayout 中添加设置UI
    - 显示当前设置状态
    - _Requirements: 5.4_
  - [x] 7.3 实现自动进阶触发逻辑
    - 在 actionStore 或 gameIntegration 中检测AU耗尽
    - 当 autoAdvanceEnabled 且 remainingAU <= 0 时自动进阶
    - 执行阶段结束计算
    - _Requirements: 5.2, 5.3, 5.6_
  - [x] 7.4 在 saveStore 中持久化自动进阶设置
    - 保存时包含 autoAdvanceEnabled
    - 加载时恢复设置
    - _Requirements: 5.7_
  - [x] 7.5 编写自动进阶的属性测试
    - **Property 8: Auto-Advance Behavior**
    - **Property 9: Auto-Advance Setting Persistence**
    - **Validates: Requirements 5.2, 5.3, 5.7**

- [x] 8. 集成测试和最终验证
  - [x] 8.1 编写建筑-岗位集成测试
    - 测试建造生产建筑后岗位槽位更新
    - _Requirements: 6.1, 6.4_
  - [x] 8.2 编写系统同步属性测试
    - **Property 10: Building-Dependent System Sync**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 9. Final Checkpoint - 确保所有测试通过
  - 运行完整测试套件
  - 如有问题请询问用户

## Notes

- 所有任务均为必需任务，包括属性测试
- 每个任务都引用了具体的需求条款以便追溯
- Checkpoint任务用于确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
