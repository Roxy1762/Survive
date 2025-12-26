/**
 * 尘埃与回响 - 主应用组件
 * Dust & Echoes - Main Application Component
 * 
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 * Requirements: 24.1 - 集成所有系统，连接UI与状态管理
 * Requirements: 4.5, 4.6, 7.5, 8.2 - 游戏状态画面切换
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { GameLayout } from './components/layout';
import { 
  ResourcePanel, 
  EventLog, 
  ActionPanel, 
  MapView, 
  DetailsPanel 
} from './components/panels';
import {
  TitleScreen,
  DifficultySelect,
  ScenarioSelect,
  GameOverScreen,
} from './components/screens';
import { useTimeStore } from './store/timeStore';
import { useEventStore } from './store/eventStore';
import { useSaveStore } from './store/saveStore';
import { useGameStateStore, type DifficultyLevel } from './store/gameStateStore';
import { STARTING_SCENARIOS } from './config/scenarios';
import { DIFFICULTY_CONFIGS } from './config/difficulty';
import { 
  collectGameState, 
  restoreGameState, 
  processPhaseEnd,
  resetAllStores,
} from './store/gameIntegration';
import { useResourceStore } from './store/resourceStore';
import { usePopulationStore } from './store/populationStore';
import type { ResourceId } from './types';

function App() {
  const advancePhase = useTimeStore(state => state.advancePhase);
  const time = useTimeStore(state => state.time);
  const addSystemMessage = useEventStore(state => state.addSystemMessage);
  const loadGame = useSaveStore(state => state.loadGame);
  const saveGame = useSaveStore(state => state.saveGame);
  const startAutoSave = useSaveStore(state => state.startAutoSave);
  const stopAutoSave = useSaveStore(state => state.stopAutoSave);
  
  // Game state management
  const gameState = useGameStateStore(state => state.gameState);
  const setGameState = useGameStateStore(state => state.setGameState);
  const startNewGame = useGameStateStore(state => state.startNewGame);
  const continueGame = useGameStateStore(state => state.continueGame);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [newGameStep, setNewGameStep] = useState<'difficulty' | 'scenario'>('difficulty');
  const initRef = useRef(false);
  
  // 初始化游戏
  useEffect(() => {
    // 防止重复初始化
    if (initRef.current) return;
    initRef.current = true;
    
    // 检查是否有存档，如果有则保持在标题画面
    // 如果没有存档，也保持在标题画面让用户选择新游戏
    setIsInitialized(true);
    
    // 清理函数
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);
  
  // 处理继续游戏
  const handleContinueGame = useCallback(() => {
    const saveData = loadGame();
    
    if (saveData) {
      const restored = restoreGameState(saveData);
      if (restored) {
        addSystemMessage(
          'Game Loaded',
          '存档已加载。继续你的废土生存之旅。',
          saveData.time.day,
          saveData.time.phase
        );
        continueGame();
        startAutoSave(collectGameState);
      }
    }
  }, [loadGame, addSystemMessage, continueGame, startAutoSave]);
  
  // 处理难度选择
  const handleDifficultySelect = useCallback((difficulty: DifficultyLevel) => {
    setSelectedDifficulty(difficulty);
    setNewGameStep('scenario');
  }, []);
  
  // 处理场景选择并开始新游戏
  const handleScenarioSelect = useCallback((scenarioId: string) => {
    if (!selectedDifficulty) return;
    
    // 重置所有store
    resetAllStores();
    
    // 获取场景配置
    const scenario = STARTING_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    
    // 获取难度配置
    const difficultyConfig = DIFFICULTY_CONFIGS[selectedDifficulty];
    const resourceMultiplier = difficultyConfig.modifiers.startingResourceMultiplier;
    
    // 设置初始资源（应用难度倍率）
    const resourceStore = useResourceStore.getState();
    for (const [resourceId, amount] of Object.entries(scenario.startingResources)) {
      if (amount !== undefined) {
        resourceStore.setResource(resourceId as ResourceId, Math.floor(amount * resourceMultiplier));
      }
    }
    
    // 设置初始资源上限
    resourceStore.setResourceCap('scrap', 100);
    resourceStore.setResourceCap('water', 50);
    resourceStore.setResourceCap('food', 50);
    resourceStore.setResourceCap('dirty_water', 30);
    resourceStore.setResourceCap('wood', 50);
    resourceStore.setResourceCap('metal', 30);
    resourceStore.setResourceCap('canned_food', 30);
    
    // 添加初始工人
    const populationStore = usePopulationStore.getState();
    for (let i = 0; i < scenario.startingWorkers; i++) {
      const workerName = i === 0 ? '幸存者' : `幸存者 ${i + 1}`;
      populationStore.addWorker(workerName);
    }
    populationStore.setPopulationCap(scenario.startingWorkers + 1);
    
    // 添加欢迎事件
    useEventStore.getState().addSystemMessage(
      'Game Started',
      `欢迎来到尘埃与回响。你选择了「${scenario.nameZh}」开局，难度为「${difficultyConfig.nameZh}」。`,
      1,
      'dawn'
    );
    
    // 启动自动存档
    startAutoSave(collectGameState);
    
    // 更新游戏状态
    startNewGame(selectedDifficulty, scenarioId);
    
    // 重置新游戏流程状态
    setSelectedDifficulty(null);
    setNewGameStep('difficulty');
  }, [selectedDifficulty, startAutoSave, startNewGame]);
  
  // 处理从难度选择返回
  const handleBackFromDifficulty = useCallback(() => {
    setGameState('title');
    setSelectedDifficulty(null);
    setNewGameStep('difficulty');
  }, [setGameState]);
  
  // 处理从场景选择返回
  const handleBackFromScenario = useCallback(() => {
    setNewGameStep('difficulty');
    setSelectedDifficulty(null);
  }, []);
  
  // 处理重新开始游戏
  const handleRestart = useCallback(() => {
    const currentDifficulty = useGameStateStore.getState().difficulty;
    const currentScenario = useGameStateStore.getState().scenario;
    
    // 重置所有store
    resetAllStores();
    
    // 获取场景配置
    const scenario = STARTING_SCENARIOS.find(s => s.id === currentScenario);
    if (!scenario) return;
    
    // 获取难度配置
    const difficultyConfig = DIFFICULTY_CONFIGS[currentDifficulty];
    const resourceMultiplier = difficultyConfig.modifiers.startingResourceMultiplier;
    
    // 设置初始资源（应用难度倍率）
    const resourceStore = useResourceStore.getState();
    for (const [resourceId, amount] of Object.entries(scenario.startingResources)) {
      if (amount !== undefined) {
        resourceStore.setResource(resourceId as ResourceId, Math.floor(amount * resourceMultiplier));
      }
    }
    
    // 设置初始资源上限
    resourceStore.setResourceCap('scrap', 100);
    resourceStore.setResourceCap('water', 50);
    resourceStore.setResourceCap('food', 50);
    resourceStore.setResourceCap('dirty_water', 30);
    resourceStore.setResourceCap('wood', 50);
    resourceStore.setResourceCap('metal', 30);
    resourceStore.setResourceCap('canned_food', 30);
    
    // 添加初始工人
    const populationStore = usePopulationStore.getState();
    for (let i = 0; i < scenario.startingWorkers; i++) {
      const workerName = i === 0 ? '幸存者' : `幸存者 ${i + 1}`;
      populationStore.addWorker(workerName);
    }
    populationStore.setPopulationCap(scenario.startingWorkers + 1);
    
    // 添加欢迎事件
    useEventStore.getState().addSystemMessage(
      'Game Restarted',
      `重新开始游戏。你选择了「${scenario.nameZh}」开局，难度为「${difficultyConfig.nameZh}」。`,
      1,
      'dawn'
    );
    
    // 启动自动存档
    startAutoSave(collectGameState);
    
    // 更新游戏状态
    startNewGame(currentDifficulty, currentScenario);
  }, [startAutoSave, startNewGame]);
  
  // 处理结束阶段
  const handleEndPhase = useCallback(() => {
    // 处理阶段结算
    const result = processPhaseEnd();
    
    // 显示资源消耗信息
    if (result.waterShortage > 0 || result.foodShortage > 0) {
      addSystemMessage(
        'Resource shortage!',
        `资源短缺！水: -${result.waterConsumed.toFixed(1)}, 食物: -${result.foodConsumed.toFixed(1)}`,
        time.day,
        time.phase
      );
    }
    
    // 显示生产信息
    const productionMessages: string[] = [];
    if (result.productionResults.scrap) {
      productionMessages.push(`废料 +${result.productionResults.scrap.toFixed(1)}`);
    }
    if (result.productionResults.water) {
      productionMessages.push(`净水 +${result.productionResults.water.toFixed(1)}`);
    }
    if (result.productionResults.food) {
      productionMessages.push(`食物 +${result.productionResults.food.toFixed(1)}`);
    }
    
    if (productionMessages.length > 0) {
      addSystemMessage(
        'Production',
        `生产: ${productionMessages.join(', ')}`,
        time.day,
        time.phase
      );
    }
    
    // 推进阶段
    advancePhase();
    
    // 添加阶段变化消息
    const newTime = useTimeStore.getState().time;
    addSystemMessage(
      `Phase changed to ${newTime.phase}`,
      `时间推进至第 ${newTime.day} 天 ${getPhaseNameZh(newTime.phase)}`,
      newTime.day,
      newTime.phase
    );
    
    // 手动保存（除了自动保存外）
    saveGame(collectGameState);
  }, [time.day, time.phase, advancePhase, addSystemMessage, saveGame]);
  
  // 处理探索
  const handleExplore = useCallback((nodeId: string) => {
    addSystemMessage(
      'Exploration',
      `开始探索区域: ${nodeId}`,
      time.day,
      time.phase
    );
    // 探索逻辑由 explorationStore 处理
  }, [time.day, time.phase, addSystemMessage]);

  // 如果未初始化，显示加载状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-amber font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">尘埃与回响</div>
          <div className="text-sm text-terminal-dim">加载中...</div>
        </div>
      </div>
    );
  }

  // 根据游戏状态渲染不同画面
  // Requirements: 8.2 - Game State Screen Mapping
  switch (gameState) {
    case 'title':
      return (
        <TitleScreen 
          onContinue={handleContinueGame}
          onSettings={() => {
            // TODO: 实现设置画面
          }}
        />
      );
    
    case 'new_game':
      // 新游戏流程：难度选择 → 场景选择
      // Requirements: 4.5, 7.5
      if (newGameStep === 'difficulty') {
        return (
          <DifficultySelect 
            onSelect={handleDifficultySelect}
            onBack={handleBackFromDifficulty}
          />
        );
      } else {
        return (
          <ScenarioSelect 
            onSelect={handleScenarioSelect}
            onBack={handleBackFromScenario}
          />
        );
      }
    
    case 'game_over':
      return (
        <GameOverScreen 
          onRestart={handleRestart}
        />
      );
    
    case 'playing':
    case 'paused':
    default:
      return (
        <GameLayout
          leftPanel={<ResourcePanel />}
          centerPanel={
            <CenterContent 
              onEndPhase={handleEndPhase}
              onExplore={handleExplore}
            />
          }
          rightPanel={<DetailsPanel />}
        />
      );
  }
}

interface CenterContentProps {
  onEndPhase: () => void;
  onExplore: (nodeId: string) => void;
}

function CenterContent({ onEndPhase, onExplore }: CenterContentProps) {
  const [view, setView] = useState<'actions' | 'map'>('actions');
  const [showMobileLog, setShowMobileLog] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* 视图切换标签 */}
      <div className="flex border-b border-terminal-amber/20 flex-shrink-0">
        <ViewTabButton
          active={view === 'actions'}
          onClick={() => setView('actions')}
        >
          行动
        </ViewTabButton>
        <ViewTabButton
          active={view === 'map'}
          onClick={() => setView('map')}
        >
          地图
        </ViewTabButton>
        {/* 移动端日志切换按钮 */}
        <button
          onClick={() => setShowMobileLog(!showMobileLog)}
          className={`
            lg:hidden px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm uppercase tracking-wider transition-colors
            min-h-[40px] sm:min-h-0
            ${showMobileLog 
              ? 'bg-terminal-amber/20 text-terminal-amber' 
              : 'text-terminal-dim hover:text-terminal-amber/70'
            }
          `}
        >
          日志
        </button>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧 - 行动/地图 */}
        <div className="flex-1 flex flex-col overflow-hidden lg:border-r lg:border-terminal-amber/20">
          {view === 'actions' ? (
            <ActionPanel onEndPhase={onEndPhase} />
          ) : (
            <MapView onExplore={onExplore} />
          )}
        </div>
        
        {/* 右侧 - 事件日志 (PC端) */}
        <div className="w-64 xl:w-80 flex-shrink-0 hidden lg:flex flex-col">
          <EventLog />
        </div>
      </div>
      
      {/* 移动端事件日志 (可折叠) */}
      {showMobileLog && (
        <div className="lg:hidden border-t border-terminal-amber/20 h-40 sm:h-48 overflow-hidden animate-slide-in-right">
          <EventLog maxEntries={8} compact />
        </div>
      )}
    </div>
  );
}

interface ViewTabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ViewTabButton({ active, onClick, children }: ViewTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm uppercase tracking-wider transition-colors
        min-h-[40px] sm:min-h-0
        ${active 
          ? 'bg-terminal-amber/20 text-terminal-amber border-b-2 border-terminal-amber' 
          : 'text-terminal-dim hover:text-terminal-amber/70'
        }
      `}
    >
      {children}
    </button>
  );
}

/** 获取阶段中文名 */
function getPhaseNameZh(phase: string): string {
  const names: Record<string, string> = {
    dawn: '清晨',
    morning: '上午',
    noon: '中午',
    afternoon: '下午',
    evening: '傍晚',
    midnight: '午夜',
  };
  return names[phase] ?? phase;
}

export default App;
