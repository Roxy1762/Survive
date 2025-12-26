/**
 * 结算画面组件
 * Game Over Screen Component
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * - 显示游戏结束标题
 * - 显示死因/失败原因
 * - 显示生存统计数据
 * - 实现重新开始和返回标题按钮
 * - 使用废土主题的氛围叙事文字
 */

import { Button } from '../common';
import { useGameStateStore, DifficultyLevel } from '../../store/gameStateStore';

interface GameOverScreenProps {
  onRestart?: () => void;
}

export function GameOverScreen({ onRestart }: GameOverScreenProps) {
  const statistics = useGameStateStore((state) => state.statistics);
  const difficulty = useGameStateStore((state) => state.difficulty);
  const scenario = useGameStateStore((state) => state.scenario);
  const returnToTitle = useGameStateStore((state) => state.returnToTitle);
  const startNewGame = useGameStateStore((state) => state.startNewGame);

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    } else {
      // 使用相同的难度和场景重新开始
      startNewGame(difficulty as DifficultyLevel, scenario);
    }
  };

  const handleReturnToTitle = () => {
    returnToTitle();
  };

  // 根据死因生成氛围文字
  const getAtmosphereText = (): string => {
    const cause = statistics.causeOfDeath || '所有幸存者已死亡';
    
    if (cause.includes('脱水') || cause.includes('水')) {
      return '干裂的嘴唇，模糊的视线...最后一滴水早已蒸发在这片焦土之上。';
    }
    if (cause.includes('饥饿') || cause.includes('食物')) {
      return '空荡的胃，无力的四肢...在这片废墟中，饥饿是最残酷的敌人。';
    }
    return '尘埃落定，回响消散...这片废土又多了几具无名的遗骸。';
  };

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-4">
      {/* 游戏结束标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl text-terminal-red font-mono mb-2 animate-pulse">
          终 结
        </h1>
        <p className="text-terminal-dim text-sm tracking-widest">
          THE END
        </p>
      </div>

      {/* 死因/失败原因 */}
      <div className="text-center mb-8 max-w-md px-4">
        <p className="text-terminal-amber text-lg sm:text-xl mb-4">
          {statistics.causeOfDeath || '所有幸存者已死亡'}
        </p>
        <p className="text-terminal-dim text-sm leading-relaxed italic">
          {getAtmosphereText()}
        </p>
      </div>

      {/* 生存统计数据 */}
      <div className="bg-terminal-bg border border-terminal-amber/30 p-6 mb-8 w-full max-w-sm">
        <h2 className="text-terminal-amber text-center mb-4 font-mono tracking-wider">
          生存记录
        </h2>
        <div className="text-terminal-dim space-y-3 text-sm">
          <div className="flex justify-between border-b border-terminal-amber/10 pb-2">
            <span>存活天数</span>
            <span className="text-terminal-amber">{statistics.daysSurvived} 天</span>
          </div>
          <div className="flex justify-between border-b border-terminal-amber/10 pb-2">
            <span>收集资源</span>
            <span className="text-terminal-amber">{statistics.totalResourcesGathered} VU</span>
          </div>
          <div className="flex justify-between border-b border-terminal-amber/10 pb-2">
            <span>失去同伴</span>
            <span className={statistics.workersLost > 0 ? 'text-terminal-red' : 'text-terminal-amber'}>
              {statistics.workersLost} 人
            </span>
          </div>
          <div className="flex justify-between">
            <span>建造设施</span>
            <span className="text-terminal-amber">{statistics.buildingsConstructed} 座</span>
          </div>
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-md">
        <Button onClick={handleRestart} size="lg" fullWidth>
          重新开始
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={handleReturnToTitle}>
          返回标题
        </Button>
      </div>

      {/* 底部氛围文字 */}
      <div className="mt-12 text-center px-4">
        <p className="text-terminal-dim text-xs">
          "在废土上，每一次结束都是新的开始。"
        </p>
      </div>
    </div>
  );
}

export default GameOverScreen;
