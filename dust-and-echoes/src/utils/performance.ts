/**
 * 性能优化工具
 * Performance Optimization Utilities
 * 
 * Requirements: 24.3 - 确保流畅的用户体验
 */

/**
 * 简单的记忆化函数
 * Simple memoization function for expensive computations
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    
    // 限制缓存大小，防止内存泄漏
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

/**
 * 防抖函数
 * Debounce function for rate-limiting expensive operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数
 * Throttle function for limiting execution frequency
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 浅比较两个对象
 * Shallow comparison of two objects
 */
export function shallowEqual<T extends Record<string, unknown>>(
  obj1: T,
  obj2: T
): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

/**
 * 创建选择器，只在相关状态变化时重新计算
 * Create a selector that only recomputes when relevant state changes
 */
export function createSelector<TState, TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn: (a: TSelected, b: TSelected) => boolean = Object.is
): (state: TState) => TSelected {
  let lastState: TState | undefined;
  let lastResult: TSelected | undefined;
  
  return (state: TState): TSelected => {
    if (lastState === state) {
      return lastResult as TSelected;
    }
    
    const result = selector(state);
    
    if (lastResult !== undefined && equalityFn(result, lastResult)) {
      return lastResult;
    }
    
    lastState = state;
    lastResult = result;
    return result;
  };
}

/**
 * 批量更新状态，减少重渲染次数
 * Batch state updates to reduce re-renders
 */
export function batchUpdates(updates: (() => void)[]): void {
  // React 18+ 自动批处理，但这个函数可以用于显式批处理
  for (const update of updates) {
    update();
  }
}

/**
 * 请求空闲回调的polyfill
 * RequestIdleCallback polyfill for non-critical updates
 */
export const requestIdleCallback = 
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback
    : (cb: IdleRequestCallback): number => {
        const start = Date.now();
        return window.setTimeout(() => {
          cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, 1) as unknown as number;
      };

/**
 * 取消空闲回调
 */
export const cancelIdleCallback =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback
    : (id: number): void => {
        clearTimeout(id);
      };

/**
 * 在空闲时执行非关键任务
 * Execute non-critical tasks during idle time
 */
export function scheduleIdleTask(task: () => void, timeout = 1000): number {
  return requestIdleCallback(
    (deadline) => {
      if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
        task();
      }
    },
    { timeout }
  );
}
