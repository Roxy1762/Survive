[下载工程代码（可运行Demo）](sandbox:/mnt/data/dust_echoes_demo.zip)

下面这套代码是**可直接落地**的“网页文字冒险（AU行动阶段 + 事件库/选项集 + 检定 + 预算结算 + 战斗/噪音/Alert 耦合）”最小工程：  
你把自己那套完整事件库（每区 30~50 条）和敌人/装备表塞进 JSON，就能跑；再逐步把基地建筑/科技树/更复杂的 SP 与 ρ 曲线往里补。

---

## 你拿到的工程是什么

### 1) 技术栈与运行方式
- **TypeScript + Vite**（不依赖 React/Vue，先把“底层系统”跑通）
- 浏览器端本地存档：`localStorage`
- 配置驱动：`items/events/optionsets/enemies/equipment/map` 全部 JSON

运行（你本地有网装依赖即可）：
```bash
npm install
npm run dev
```

---

## 项目结构一眼看懂

```
dust_echoes_demo/
  index.html
  package.json
  tsconfig.json
  src/
    main.ts                      # 纯DOM UI：左状态/中日志/右行动菜单
    engine/
      game.ts                    # 引擎入口：dispatch动作、时间推进、事件挂起/结算、战斗触发、存档
      types.ts                   # 强类型：Action/State/Event/OptionSet/Enemy/Equipment/Map
      constants.ts               # AU阶段(0.5/1/0.5/1/1/1)、价值锚点(VU)、消耗模型、Action成本与Scale
      time.ts                    # advanceTimeWithTicks：推进AU并分段tick（保证0.5AU相位严谨）
      rng.ts                     # Mulberry32可复现RNG（用于平衡测试/回放）
      inventory.ts               # 仓库与重量计算
      state.ts                   # newGameState、items索引
      config/loader.ts           # JSON加载
      data/
        items.json
        events.json
        optionsets.json
        enemies.json
        equipment.json
        map.json
      systems/
        base.ts                  # 基地AU tick：生产/消耗/状态衰减
        expedition.ts            # 外出：补给消耗、移动、扎营、休息、撤退
        map.ts                   # region定位、Alert/Fatigue clamp
        checks.ts                # d100检定（Alert/疲劳/超重影响DC）
        economy.ts               # 预算计算、SP衰减因子、掉落分配、损耗预算->后果
        eventEngine.ts           # 事件抽取/模板渲染/选项结算（预算倍率+显式效果）
        combat.ts                # 战斗（ATK/AR/ACC/EVA/耐久/噪音->Alert）
        daily.ts                 # 日结：SP回补、Alert/疲劳自然恢复
  scripts/
    validate-config.mjs          # 基础配置校验（事件引用的OptionSet是否存在等）
```

---

## 关键机制已经按你前面体系落到代码里

### A) AU行动阶段（0.5/1/0.5/1/1/1）严格执行
- `constants.ts`：
  - 清晨 0.5、上午 1.0、中午 0.5、下午 1.0、傍晚 1.0、午夜 1.0 → **总 5 AU/天**
- `time.ts` 的 `advanceTimeWithTicks()` 会把一个动作的 AU 消耗**切成多个小段**，保证跨相位时 Tick 不丢失。

### B) 价值锚点（VU体系）被写进常量与预算系统
- `ECON`：
  - `1 VU = 1 Scrap`
  - `1 Person-AU = 15 VU`
  - `Work = 0.25 VU`
  - `Water = 5 VU`
  - `Food = 25/6 VU`
- 探索收益采用“区域净值 spine + 损耗比例”模型：
  - `Region.valueVUPerAU`（净期望，默认以 **Search=1AU** 为基准）
  - `Region.lossRatio`（损耗与净值关系：loot = net*(1+lossRatio)）

### C) 探索行动菜单（侦查/潜入/扎营/撤退/负重/警戒/疲劳）全部可用
右侧面板在外出时提供：
- 移动 `EXP_MOVE`（0.5AU/格）
- 冲刺 `EXP_SPRINT`（0.5AU 两格；demo 里要求沿 `map.roads(kind=HIGHWAY)`）
- 侦查 `EXP_SCOUT`（1AU）
- 搜索 `EXP_SEARCH`（1AU）
- 深搜 `EXP_DEEP_SEARCH`（1AU，Scale更高）
- 潜入 `EXP_SNEAK`（1AU）
- 撬锁 `EXP_PICKLOCK`（1AU）
- 黑入 `EXP_HACK`（1AU）
- 扎营 `EXP_CAMP`（1AU，可选择生火→疲劳恢复更强但Alert上升）
- 休息 `EXP_REST`（0.5AU）
- 撤退 `EXP_RETREAT`（0.5AU，Alert高可能触发伏击战）
- **负重**：背包重量超过 `capacity` → 检定DC更高、战斗后Alert额外+1（已写死）
- **警戒 Alert**：影响事件抽取权重与检定DC，战斗噪音会推高Alert
- **疲劳 Fatigue**：影响检定（effectiveSkill乘衰减系数）与战斗表现

### D) 事件库 + 选项集 + 检定 + 预算倍率 → 真正“结算机制”
核心在：
- `events.json`：事件条目（biomeClass + allowedActions + weight + 文案模板 + optionSetId + budget倍率）
- `optionsets.json`：一个事件引用一个 OptionSet，里面每个选项都有：
  - 可选的 `check`（技能/基准DC/Alert&疲劳&超重影响）
  - `SUCCESS/PARTIAL/FAIL` 三档效果：`lootMult/lossMult` + 显式 gain/lose/hp/status/alert/fatigue/intel + `startCombat`

引擎工作流（关键点：**先花AU，再挂事件，再选项结算**）：
1) 你点“搜索/深搜/潜入/撬锁/黑入…”
2) `game.ts dispatch()` 先 `advanceTimeWithTicks()` 花AU → 同时执行基地/外出补给 Tick
3) `eventEngine.pickEvent()` 抽事件 → 写入 `state.pendingEvent`
4) UI 显示事件文本 + 选项按钮
5) 你点选项 → `EVT_CHOOSE_OPTION`
6) `eventEngine.resolveOption()`：
   - d100检定（DC会被 Alert / Fatigue / 超重 放大）
   - 计算预算（区域spFactor + actionScale + 事件倍率 + 选项倍率）
   - `allocateLoot()` 把 LootBudget 分配为具体物品
   - `lossToConsequences()` 把 LossBudget 转成水/食物/HP损耗
   - 应用显式效果（hp/status/alert/fatigue/intel/额外掉落/额外损失）
   - 如果触发 `startCombat` → 战斗系统接管

### E) 战斗系统（ATK/AR/ACC/EVA/耐久/噪音）已实现且与Alert耦合
- `equipment.json` 定义武器/护甲：
  - Weapon：`dmgBase/dmgVar/accBonus/noise/durabilityMax/durabilityPerAttack/ammoItemId`
  - Armor：`ar/evaBonus/noise/durabilityMax/durabilityPerHit`
- `enemies.json` 定义敌人：
  - `hp/ar/acc/eva/dmgBase/dmgVar/noise/tier/lootTags`
- `combat.ts`：
  - 命中率：基于 `ACC vs EVA`，并受疲劳系数衰减
  - 伤害：`(dmgBase ± var) - AR`（至少1）
  - **耐久**：武器每次攻击扣耐久；护甲被击中扣耐久；耐久为0进入“徒手/无甲”劣化分支
  - **噪音**：每回合统计 `maxNoise`，战斗结束后 `Alert += 1 + maxNoise`
  - 胜利给战利品预算（按敌人Tier与数量），失败则可能随机掉落部分背包并强制回基地（demo简化）

---

## 你如何把“完整版设计”灌进这套工程（最重要）

### 1) 扩充事件库（每区 30~50 条）
把你自己的大事件库直接追加到：
- `src/engine/data/events.json`

每条事件长这样（字段都能直接对应你之前的模板）：
```json
{
  "id": "E_R2_17_STAIRWELL",
  "biomeClass": "SUBURB",
  "allowedActions": ["EXP_SEARCH", "EXP_DEEP_SEARCH", "EXP_SNEAK"],
  "weight": 6,
  "textTemplate": "楼梯间的风带着霉味……{hint}",
  "optionSetId": "OS_SEARCH_SIMPLE",
  "lootMult": 1.05,
  "lossMult": 1.10,
  "tags": ["LOOT"]
}
```

### 2) 扩充选项集（OptionSet）——你真正的“事件结算机制”
在：
- `src/engine/data/optionsets.json`

一个选项的三档结果：
- `lootMult/lossMult` → 预算倍率（核心数值平衡点）
- `gain/lose/hpDelta/addStatus/alertDelta/fatigueDelta/intelDelta/startCombat` → 叙事与后果

### 3) 区域曲线与 ρ/Alert 对齐
在这套代码里，区域曲线由 `map.json -> regions[]` 控制：
- `valueVUPerAU`：该区“标准搜索(1AU)”净收益 spine
- `lossRatio`：该区风险/损耗强度（你的 ρ 可以等价映射到这里，或额外加字段）
- `lootTags`：掉落结构（scrap/food/water/cloth/metal/electronics/rare…）
- `enemyTier`：区内敌人基础Tier（你可以据此在 `pickEvent` 里做更复杂的敌人池选择）

**Alert 完全参与：**
- 抽事件权重：HOSTILE tag 权重随 Alert 增加
- 检定DC：`dcPerAlert` 放大
- 战斗后 Alert 因噪音上升（weapon.noise/enemy.noise）

---

## 这套工程已经做了哪些“策划级防坑”处理（你后续扩展不会崩）

1) **事件必须结算**：有 `pendingEvent` 时禁止执行其它动作（避免“事件预算被绕过”导致刷资源）
2) **AU tick 分段**：0.5AU相位不会被粗暴跳过（对网页主线长期运营特别重要）
3) **RNG可复现**：同一个种子可以复盘某个事件链 → 你调参/做A/B曲线非常省时间
4) **预算桥接**（最关键）：  
   区域 spine（VU/AU） → `lootBudget/lossBudget` → `物品掉落 + 水食损耗 + HP损失`  
   你调一个区域，只要改 `valueVUPerAU/lossRatio/lootTags`，全区事件自然跟着走，不需要手改 50 条事件数值。

---

## 你接下来怎么把它升级成“完整主线网页文字冒险”

这套Demo现在已经把“探索事件结算机制 + 战斗 + 时间资源系统”打通了。你要变成完整版，只需要继续往里加：

- **建筑/配方/科技树**：  
  把你那套 building/recipe/tech JSON 加进去，在 `base.ts` 的生产模型里从“固定产出”升级为“建筑槽位 + 模组倍率 + upkeep + 维护停机”。
- **SP 从区域池升级到节点池**：  
  现在是 `region:<id>`；你要精确到节点就把 key 换成 `node:<nodeId>`，并在 `findNode()` 后用 node 的 spMax/spRegen。
- **撤退/扎营更复杂**：  
  撤退可以改成“按距离花AU + 沿路事件 + 超重概率掉落 + Alert阈值触发追击”。

---

如果你希望我下一步直接把你“完整版设计文档里”的：
- **30~50 事件/区域**（含文案模板、选项、检定、预算倍率）
- **按 Tier 分层的敌人模板与武器/护甲表**（ATK/AR/ACC/EVA/耐久/噪音）
完整灌入这套工程，并补齐：
- 区域 ρ 与 Alert 的公式化映射
- 敌人池随 ρ/Alert 动态变种
- 装备成长曲线与区域 spine 严格对齐

我也可以在同一个工程里直接生成对应 JSON（含校验脚本的约束），让你拿去就能继续迭代。