/**
 * 游戏主布局组件
 * Main Game Layout Component
 * 
 * Requirements: 10.1 - 三栏布局：资源/交互/详情
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 * 
 * Breakpoints:
 * - xs (< 640px): 移动端单栏 + 底部标签
 * - sm (640px - 767px): 移动端单栏 + 底部标签
 * - md (768px - 1023px): 平板双栏（资源+主内容）+ 可折叠详情
 * - lg (1024px - 1279px): PC三栏布局
 * - xl (>= 1280px): PC三栏布局（更宽的侧边栏）
 */

import { useState, useEffect } from 'react';

interface GameLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

/** 移动端标签页类型 */
type MobileTab = 'resources' | 'main' | 'details';

/** 检测是否为触摸设备 */
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  return isTouch;
}

/** 检测屏幕尺寸 */
function useScreenSize() {
  const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('lg');
  
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('xs');
      else if (width < 768) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else if (width < 1280) setScreenSize('lg');
      else setScreenSize('xl');
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  return screenSize;
}

/**
 * 三栏布局组件
 * Three-column layout: Resources (left) / Interaction (center) / Details (right)
 * 
 * PC端 (lg+): 三栏并排显示
 * 平板端 (md): 双栏 + 可折叠详情面板
 * 移动端 (xs/sm): 底部标签切换
 */
export function GameLayout({ leftPanel, centerPanel, rightPanel }: GameLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('main');
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const isTouch = useIsTouchDevice();
  const screenSize = useScreenSize();

  // 平板端详情面板切换
  const toggleDetailsPanel = () => {
    setIsDetailsPanelOpen(!isDetailsPanelOpen);
  };

  return (
    <div className={`
      min-h-screen min-h-[100dvh] bg-terminal-bg text-terminal-amber font-mono flex flex-col
      ${isTouch ? 'touch-device' : ''}
    `}>
      {/* 顶部标题栏 */}
      <header className="
        border-b border-terminal-amber/30 
        px-3 sm:px-4 
        py-2 sm:py-2.5
        flex items-center justify-between flex-shrink-0
        safe-area-top
      ">
        <h1 className="text-base sm:text-lg font-bold tracking-wider">
          <span className="hidden xs:inline sm:hidden">D&E</span>
          <span className="hidden sm:inline">尘埃与回响</span>
          <span className="xs:hidden">D&E</span>
          <span className="text-terminal-amber/60 text-xs sm:text-sm ml-2 hidden lg:inline">Dust &amp; Echoes</span>
        </h1>
        <div className="flex items-center gap-2">
          {/* 平板端详情面板切换按钮 */}
          {screenSize === 'md' && (
            <button
              onClick={toggleDetailsPanel}
              className={`
                px-2 py-1 text-xs border transition-colors
                ${isDetailsPanelOpen 
                  ? 'border-terminal-amber bg-terminal-amber/20 text-terminal-amber' 
                  : 'border-terminal-amber/50 text-terminal-amber/70 hover:border-terminal-amber'
                }
              `}
            >
              详情 {isDetailsPanelOpen ? '▼' : '▶'}
            </button>
          )}
          <div className="text-xs sm:text-sm text-terminal-amber/60 hidden sm:block">
            废土生存文字游戏
          </div>
        </div>
      </header>

      {/* 主内容区 - PC端三栏布局 (lg+) */}
      <main className="flex-1 hidden lg:flex overflow-hidden">
        {/* 左栏 - 资源面板 */}
        <aside className="w-64 xl:w-72 2xl:w-80 border-r border-terminal-amber/30 overflow-y-auto flex-shrink-0 scrollbar-thin">
          {leftPanel}
        </aside>

        {/* 中栏 - 交互区 */}
        <section className="flex-1 flex flex-col overflow-hidden min-w-0">
          {centerPanel}
        </section>

        {/* 右栏 - 详情面板 */}
        <aside className="w-64 xl:w-80 2xl:w-96 border-l border-terminal-amber/30 overflow-y-auto flex-shrink-0 scrollbar-thin">
          {rightPanel}
        </aside>
      </main>

      {/* 平板端双栏布局 (md) */}
      <main className="flex-1 hidden md:flex lg:hidden overflow-hidden">
        {/* 左栏 - 资源面板 */}
        <aside className="w-56 border-r border-terminal-amber/30 overflow-y-auto flex-shrink-0 scrollbar-thin">
          {leftPanel}
        </aside>

        {/* 中栏 - 交互区 */}
        <section className="flex-1 flex flex-col overflow-hidden min-w-0">
          {centerPanel}
        </section>

        {/* 右栏 - 详情面板 (可折叠) */}
        <aside className={`
          border-l border-terminal-amber/30 overflow-y-auto flex-shrink-0 scrollbar-thin
          transition-all duration-300 ease-in-out
          ${isDetailsPanelOpen ? 'w-64' : 'w-0 border-l-0'}
        `}>
          <div className={`w-64 ${isDetailsPanelOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {rightPanel}
          </div>
        </aside>
      </main>

      {/* 移动端内容区 - 单栏 + 底部标签 (xs/sm) */}
      <main className="flex-1 flex flex-col md:hidden overflow-hidden">
        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
          {mobileTab === 'resources' && leftPanel}
          {mobileTab === 'main' && centerPanel}
          {mobileTab === 'details' && rightPanel}
        </div>

        {/* 底部标签栏 */}
        <nav className="
          flex border-t border-terminal-amber/30 flex-shrink-0
          safe-area-bottom bg-terminal-bg
        ">
          <MobileTabButton
            active={mobileTab === 'resources'}
            onClick={() => setMobileTab('resources')}
            icon="📦"
            label="资源"
          />
          <MobileTabButton
            active={mobileTab === 'main'}
            onClick={() => setMobileTab('main')}
            icon="⚡"
            label="行动"
          />
          <MobileTabButton
            active={mobileTab === 'details'}
            onClick={() => setMobileTab('details')}
            icon="📋"
            label="详情"
          />
        </nav>
      </main>
    </div>
  );
}

interface MobileTabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function MobileTabButton({ active, onClick, icon, label }: MobileTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center justify-center 
        py-2 sm:py-2.5
        min-h-touch
        transition-colors
        active:bg-terminal-amber/30
        ${active 
          ? 'bg-terminal-amber/20 text-terminal-amber' 
          : 'text-terminal-dim hover:text-terminal-amber/70'
        }
      `}
    >
      <span className="text-lg sm:text-xl">{icon}</span>
      <span className="text-xs mt-0.5">{label}</span>
    </button>
  );
}

export default GameLayout;
