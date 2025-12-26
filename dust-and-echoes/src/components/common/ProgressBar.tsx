/**
 * 进度条组件
 * Progress Bar Component
 */

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  color?: 'amber' | 'green' | 'red';
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({
  value,
  max,
  label,
  showValue = true,
  color = 'amber',
  size = 'sm',
  className = '',
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  
  const colorClasses = {
    amber: 'bg-terminal-amber',
    green: 'bg-terminal-green',
    red: 'bg-terminal-red',
  };
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className={`${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs mb-0.5">
          {label && <span className="text-terminal-amber/70">{label}</span>}
          {showValue && (
            <span className="text-terminal-amber/60">
              {value.toFixed(0)}/{max.toFixed(0)}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-terminal-dim/30 ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
