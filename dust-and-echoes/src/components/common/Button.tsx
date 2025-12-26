/**
 * 按钮组件
 * Button Component
 * 
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 */

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  title,
  fullWidth = false,
}: ButtonProps) {
  const baseClasses = `
    font-mono uppercase tracking-wider transition-all duration-200 border
    select-none
    active:scale-[0.98]
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-terminal-amber focus-visible:outline-offset-2
  `;
  
  const variantClasses = {
    primary: disabled
      ? 'border-terminal-dim text-terminal-dim cursor-not-allowed'
      : 'border-terminal-amber text-terminal-amber hover:bg-terminal-amber hover:text-terminal-bg active:bg-terminal-amber/80',
    secondary: disabled
      ? 'border-terminal-dim/50 text-terminal-dim cursor-not-allowed'
      : 'border-terminal-amber/50 text-terminal-amber/70 hover:border-terminal-amber hover:text-terminal-amber',
    danger: disabled
      ? 'border-terminal-dim text-terminal-dim cursor-not-allowed'
      : 'border-terminal-red text-terminal-red hover:bg-terminal-red hover:text-terminal-bg',
  };
  
  // Responsive size classes with touch-friendly minimum heights
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs min-h-[32px] sm:min-h-[28px] sm:py-0.5',
    md: 'px-3 py-1.5 text-sm min-h-[40px] sm:min-h-[36px] sm:py-1',
    lg: 'px-4 py-2.5 text-base min-h-[48px] sm:min-h-[44px] sm:py-2',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
