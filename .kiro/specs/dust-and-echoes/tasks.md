# Implementation Plan: 尘埃与回响 (Dust & Echoes)

## Overview

本实现计划将《尘埃与回响》废土生存网页文字游戏分解为可执行的开发任务。采用React + TypeScript + Zustand技术栈，按照核心系统→数据层→UI层的顺序逐步构建。

## Tasks

- [x] 1. 项目初始化与基础配置
  - [x] 1.1 使用Vite创建React + TypeScript项目
    - 初始化项目结构
    - 配置TypeScript严格模式
    - _Requirements: 10.1_
  - [x] 1.2 安装和配置依赖
    - 安装Zustand、Tailwind CSS、fast-check
    - 配置Tailwind深色主题
    - _Requirements: 10.4_
  - [x] 1.3 创建基础类型定义文件
    - 定义所有核心TypeScript接口和类型
    - 包括ResourceId、BuildingId、Phase等
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2. 游戏配置数据层
  - [x] 2.1 实现资源配置数据
    - 创建RESOURCES常量，包含所有资源的VU值和属性
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [x] 2.2 编写资源VU一致性属性测试

    - **Property 2: Resource VU Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
  - [x] 2.3 实现配方配置数据
    - 创建RECIPES数组，包含所有制造配方
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 2.4 实现建筑配置数据
    - 创建BUILDINGS常量，包含成本和效果
    - _Requirements: 4.1, 4.2_
  - [x] 2.5 实现科技树配置数据
    - 创建TECHNOLOGIES数组，包含前置和解锁
    - _Requirements: 8.1, 8.2_

- [x] 3. Checkpoint - 配置数据验证
  - 确保所有配置数据类型正确
  - 运行属性测试验证VU一致性
  - 如有问题请询问用户

- [x] 4. 时间与阶段系统
  - [x] 4.1 实现时间状态管理
    - 创建TimeState接口和初始状态
    - 实现阶段AU值映射
    - _Requirements: 1.1_
  - [x] 4.2 编写阶段AU总和属性测试

    - **Property 1: Phase AU Sum Invariant**
    - **Validates: Requirements 1.1**
  - [x] 4.3 实现阶段推进逻辑
    - 实现advancePhase函数
    - 处理日期翻转（午夜→清晨）
    - _Requirements: 1.3, 1.8_
  - [x] 4.4 编写阶段转换属性测试

    - **Property 19: Phase Transition Correctness**
    - **Validates: Requirements 1.8**

- [x] 5. 资源管理系统
  - [x] 5.1 实现资源状态管理
    - 创建资源存储和上限状态
    - 实现addResource和consumeResource函数
    - _Requirements: 2.8_
  - [x] 5.2 编写存储上限属性测试

    - **Property 4: Storage Cap Enforcement**
    - **Validates: Requirements 2.8**
  - [x] 5.3 实现消耗计算逻辑
    - 实现阶段结束时的水/食物消耗
    - 公式：Water = pop × 1.0 × AU, Food = pop × 1.2 × AU
    - _Requirements: 2.7_
  - [x] 5.4 编写消耗计算属性测试

    - **Property 3: Consumption Calculation Correctness**
    - **Validates: Requirements 2.7**
  - [x] 5.5 实现易腐物品处理
    - 午夜阶段检查生肉腐烂
    - _Requirements: 2.10_
  - [x] 5.6 实现危机事件触发
    - 水/食物归零时触发危机
    - _Requirements: 2.9_

- [x] 6. Checkpoint - 资源系统验证
  - 运行所有资源相关属性测试
  - 验证消耗计算正确性
  - 如有问题请询问用户

- [x] 7. 人口与岗位系统
  - [x] 7.1 实现人口状态管理
    - 创建Worker接口和人口状态
    - 实现健康、状态效果追踪
    - _Requirements: 13.1, 13.2_
  - [x] 7.2 实现岗位分配逻辑
    - 实现assignJob函数
    - 验证最大岗位数限制
    - _Requirements: 3.2_
  - [x] 7.3 编写岗位槽位计算属性测试

    - **Property 6: Worker Slot Calculation**
    - **Validates: Requirements 3.2**
  - [x] 7.4 实现生产计算逻辑
    - 计算每个岗位的产出
    - 应用效率倍率
    - _Requirements: 3.1, 3.4_
  - [x] 7.5 编写岗位产出价值属性测试

    - **Property 5: Job Production Value Equivalence**
    - **Validates: Requirements 3.1**
  - [x] 7.6 编写效率倍率属性测试

    - **Property 7: Efficiency Multiplier Formula**
    - **Validates: Requirements 3.4**
  - [x] 7.7 实现最低工人计算
    - 计算维持生存所需最少工人
    - _Requirements: 3.3_

  - [x] 7.8 编写最低工人计算属性测试

    - **Property 20: Minimum Worker Calculation**
    - **Validates: Requirements 3.3**
  - [x] 7.9 实现净盈余计算
    - 计算每个有效工人的净盈余
    - _Requirements: 3.5_
  - [x] 7.10 编写净盈余属性测试

    - **Property 8: Net Surplus Calculation**
    - **Validates: Requirements 3.5**

- [x] 8. 建筑系统
  - [x] 8.1 实现建筑状态管理
    - 创建建筑等级和状态追踪
    - _Requirements: 4.1_
  - [x] 8.2 实现建造/升级逻辑
    - 实现buildOrUpgrade函数
    - 验证资源需求和前置条件
    - _Requirements: 4.4_
  - [x] 8.3 编写建筑成本递增属性测试

    - **Property 9: Building Cost Progression**
    - **Validates: Requirements 4.1, 4.2**
  - [x] 8.4 实现篝火特殊逻辑
    - 强度档位和燃料消耗
    - 流浪者招募速率
    - _Requirements: 4.1_
  - [x] 8.5 实现建筑效果应用
    - 解锁岗位、增加上限、效率加成
    - _Requirements: 4.3_

- [x] 9. 工坊与制造系统
  - [x] 9.1 实现制造状态管理
    - 追踪当前制造任务和进度
    - _Requirements: 5.5_
  - [x] 9.2 实现制造逻辑
    - 实现craft函数
    - 消耗Work点数和材料
    - _Requirements: 5.5, 5.6_
  - [x] 9.3 编写工坊效率属性测试

    - **Property 10: Workshop Efficiency Formula**
    - **Validates: Requirements 5.6**

- [x] 10. Checkpoint - 核心系统验证
  - 运行所有核心系统属性测试
  - 验证建筑、人口、制造系统集成
  - 如有问题请询问用户

- [x] 11. 装备与耐久系统
  - [x] 11.1 实现装备数据结构
    - 创建武器、护甲、工具配置
    - _Requirements: 14.1, 15.1, 15.2, 16.1_
  - [x] 11.2 实现耐久度管理
    - 追踪装备耐久度
    - 实现使用时耐久消耗
    - _Requirements: 12.1, 12.2_
  - [x] 11.3 编写耐久消耗属性测试

    - **Property 17: Durability Consumption**
    - **Validates: Requirements 12.2**
  - [x] 11.4 实现装备损坏和拆解
    - 耐久归零标记损坏
    - 拆解回收20-40%材料
    - _Requirements: 12.3, 12.4_
  - [x] 11.5 实现修理功能
    - 使用修理包恢复耐久
    - _Requirements: 12.5_

- [x] 12. 医疗与状态系统
  - [x] 12.1 实现状态效果逻辑
    - 流血、感染、中毒、辐射效果
    - 每AU结算健康变化
    - _Requirements: 13.2_
  - [x] 12.2 实现医疗物品使用
    - 绷带、消毒剂、医疗包等
    - _Requirements: 13.3_
  - [x] 12.3 实现士气系统
    - 士气影响招募和效率
    - _Requirements: 13.4_

- [x] 13. 战斗系统
  - [x] 13.1 实现战斗状态管理
    - 创建战斗回合状态
    - _Requirements: 7.1_
  - [x] 13.2 实现伤害计算
    - 公式：Damage = max(1, ATK - DEF + Random(-1, 0, 1))
    - _Requirements: 7.2_
  - [x] 13.3 编写伤害边界属性测试

    - **Property 13: Combat Damage Bounds**
    - **Validates: Requirements 7.2**
  - [x] 13.4 实现战力计算
    - 公式：CP = ATK + 0.7 × DEF + 0.3 × (HP/10)
    - _Requirements: 7.3_
  - [x] 13.5 编写战力公式属性测试

    - **Property 14: Combat Power Formula**
    - **Validates: Requirements 7.3**
  - [x] 13.6 实现区域难度计算
    - 公式：DC = 6 + 1.5 × distance
    - _Requirements: 7.4_
  - [x] 13.7 编写区域难度属性测试

    - **Property 15: Region Difficulty Formula**
    - **Validates: Requirements 7.4**
  - [x] 13.8 实现胜率计算
    - 公式：P(win) = 1 / (1 + e^(-(CP-DC)/2.5))
    - _Requirements: 7.5_
  - [x] 13.9 实现战斗结算
    - 健康变化、装备耐久、战利品
    - _Requirements: 7.6_

- [x] 14. 探索系统
  - [x] 14.1 实现地图数据结构
    - 创建MapNode和区域配置
    - _Requirements: 18.1, 18.2_
  - [x] 14.2 实现探索补给消耗
    - 公式：Water = 1.5/AU, Food = 1.8/AU per explorer
    - _Requirements: 6.2_
  - [x] 14.3 编写探索补给属性测试

    - **Property 11: Exploration Supply Consumption**
    - **Validates: Requirements 6.2**
  - [x] 14.4 实现旅行时间计算
    - 公式：Total_Time = 2 × distance + search_time
    - _Requirements: 6.3_
  - [x] 14.5 编写旅行时间属性测试

    - **Property 12: Travel Time Calculation**
    - **Validates: Requirements 6.3**
  - [x] 14.6 实现战利品生成
    - 基于区域层级和风险系数
    - _Requirements: 6.4_
  - [x] 14.7 实现探索流程
    - 出发→旅行→遭遇→搜刮→返回
    - _Requirements: 6.1, 6.5, 6.6_

- [x] 15. Checkpoint - 战斗与探索验证
  - 运行战斗和探索相关属性测试
  - 验证公式计算正确性
  - 如有问题请询问用户

- [x] 16. 科技树系统
  - [x] 16.1 实现科技状态管理
    - 追踪已研究、当前研究、进度
    - _Requirements: 8.1_
  - [x] 16.2 实现研究逻辑
    - 验证前置条件和资源
    - 消耗RP和材料
    - _Requirements: 8.2, 8.3_
  - [x] 16.3 实现解锁逻辑
    - 研究完成后解锁建筑/配方/功能
    - _Requirements: 8.4, 8.5_

- [x] 17. 先锋营地系统
  - [x] 17.1 实现营地数据结构
    - 创建Outpost接口和模块配置
    - _Requirements: 9.1, 9.6_
  - [x] 17.2 实现营地建立逻辑
    - 验证科技和资源需求
    - _Requirements: 9.2_
  - [x] 17.3 实现补给线稳定度
    - 基础70，根据距离衰减
    - _Requirements: 9.4, 9.5_
  - [x] 17.4 实现营地等级和模块
    - 1-3级，各种功能模块
    - _Requirements: 9.3, 9.6_

- [x] 18. 贸易系统
  - [x] 18.1 实现贸易状态管理
    - 追踪可用商人和库存
    - _Requirements: 19.1_
  - [x] 18.2 实现价格计算
    - 买价 = VU × 1.3, 卖价 = VU × 0.7
    - _Requirements: 19.2_
  - [x] 18.3 编写贸易价差属性测试

    - **Property 18: Trade Price Spread**
    - **Validates: Requirements 19.2**
  - [x] 18.4 实现交易逻辑
    - 验证库存和资源
    - _Requirements: 19.5_

- [x] 19. 事件系统
  - [x] 19.1 实现事件数据结构
    - 创建事件类型和触发条件
    - _Requirements: 20.1, 20.2_
  - [x] 19.2 实现事件触发逻辑
    - 基于阶段和条件触发
    - _Requirements: 20.1_
  - [x] 19.3 实现事件处理
    - 显示叙事文本，处理选择
    - _Requirements: 20.3, 20.4_

- [x] 20. 存档系统
  - [x] 20.1 实现状态序列化
    - 将游戏状态转换为JSON
    - _Requirements: 11.2_
  - [x] 20.2 实现自动存档
    - 每10秒保存到localStorage
    - _Requirements: 11.1_
  - [x] 20.3 编写存档往返属性测试

    - **Property 16: Save/Load Round Trip**
    - **Validates: Requirements 11.1, 11.2, 11.3**
  - [x] 20.4 实现手动存档/读档
    - 支持手动保存和加载
    - _Requirements: 11.4_
  - [x] 20.5 实现存档导出/导入
    - 支持备份和恢复
    - _Requirements: 11.5_

- [x] 21. Checkpoint - 系统集成验证
  - 运行所有属性测试
  - 验证系统间集成
  - 如有问题请询问用户

- [x] 22. 行动系统
  - [x] 22.1 实现短行动逻辑
    - 0.5AU行动，仅清晨/中午可用
    - _Requirements: 17.1_
  - [x] 22.2 实现标准行动逻辑
    - 1AU行动，所有阶段可用
    - _Requirements: 17.2_
  - [x] 22.3 实现行动验证和预览
    - 检查需求，显示预期结果
    - _Requirements: 17.3_
  - [x] 22.4 实现行动结果显示
    - 在事件日志中显示结果
    - _Requirements: 17.4_

- [-] 23. UI组件开发
  - [x] 23.1 实现布局框架
    - 三栏布局：资源/交互/详情
    - _Requirements: 10.1_
  - [x] 23.2 实现资源面板
    - 显示数量、产出率、上限
    - 低资源红色警告
    - _Requirements: 10.2, 10.3_
  - [x] 23.3 实现事件日志
    - 渐隐效果的叙事文本
    - _Requirements: 10.5_
  - [x] 23.4 实现操作区
    - 当前可用行动按钮
    - _Requirements: 10.1_
  - [x] 23.5 实现地图视图
    - 区域节点和状态显示
    - _Requirements: 18.5_
  - [x] 23.6 应用复古终端样式
    - 深色背景、琥珀色文字、等宽字体
    - _Requirements: 10.4_
  - [x] 23.7 实现响应式设计
    - 适配PC和移动端
    - _Requirements: 10.6_

- [x] 24. 最终集成与测试
  - [x] 24.1 集成所有系统
    - 连接UI与状态管理
    - 验证完整游戏循环
  - [x] 24.2 运行完整测试套件
    - 所有属性测试通过
    - 集成测试通过
  - [x] 24.3 性能优化
    - 确保流畅的用户体验

- [x] 25. Final Checkpoint
  - [x] 确保所有测试通过 (484 tests pass across 16 test files)
  - [x] 验证游戏可玩性 (Production build succeeds: 295.87 kB JS, 19.10 kB CSS)
  - [x] 如有问题请询问用户

## Notes

- 标记 `*` 的任务为可选的属性测试任务，可根据时间跳过以加快MVP开发
- 每个Checkpoint用于验证阶段性成果，确保质量
- 属性测试使用fast-check库，每个测试至少100次迭代
- 所有公式和计算必须与设计文档中的VU价值体系保持一致
