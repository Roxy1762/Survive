/**
 * 面板容器组件
 * Panel Container Component
 */

import React from 'react';

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Panel({ title, children, className = '' }: PanelProps) {
  return (
    <div className={`p-3 ${className}`}>
      {title && (
        <h2 className="text-sm font-bold uppercase tracking-wider text-terminal-amber/80 border-b border-terminal-amber/20 pb-1 mb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export default Panel;
