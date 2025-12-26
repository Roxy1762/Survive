/**
 * 开始画面组件
 * Title Screen Component
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.7
 * - 显示游戏标题和氛围文字
 * - 新游戏、继续游戏、设置按钮
 * - 继续按钮根据存档存在状态启用/禁用
 * - 使用复古终端风格
 */

import { Button } from '../common';
import { useSaveStore } from '../../store/saveStore';
import { useGameStateStore } from '../../store/gameStateStore';

interface TitleScreenProps {
  onSettings?: () => void;
  onContinue?: () => void;
}

export function TitleScreen({ onSettings, onContinue }: TitleScreenProps) {
  const hasSave = useSaveStore((state) => state.hasSave());
  const setGameState = useGameStateStore((state) => state.setGameState);
  const continueGame = useGameStateStore((state) => state.continueGame);

  const handleNewGame = () => {
    setGameState('new_game');
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      continueGame();
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg flex flex-col items-center justify-center p-4">
      {/* 标题区域 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl text-terminal-amber font-mono mb-2 text-glow">
          尘埃与回响
        </h1>
        <p className="text-terminal-dim text-sm sm:text-base tracking-widest">
          DUST & ECHOES
        </p>
      </div>

      {/* 按钮组 */}
      <div className="flex flex-col gap-4 w-64 sm:w-72">
        <Button onClick={handleNewGame} size="lg" fullWidth>
          新游戏
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!hasSave}
          variant={hasSave ? 'primary' : 'secondary'}
          size="lg"
          fullWidth
        >
          继续游戏
        </Button>
        {onSettings ? (
          <Button variant="secondary" size="lg" fullWidth onClick={onSettings}>
            设置
          </Button>
        ) : (
          <Button variant="secondary" size="lg" fullWidth>
            设置
          </Button>
        )}
      </div>

      {/* 氛围文字 */}
      <div className="mt-16 max-w-md text-center px-4">
        <p className="text-terminal-dim text-xs sm:text-sm leading-relaxed">
          在这片废土上，生存是唯一的法则。
        </p>
        <p className="text-terminal-dim text-xs sm:text-sm leading-relaxed mt-1">
          每一滴水，每一口食物，都可能决定你的命运。
        </p>
      </div>

      {/* 版本信息 */}
      <div className="absolute bottom-4 text-terminal-dim text-xs">
        v0.1.0
      </div>
    </div>
  );
}

export default TitleScreen;
