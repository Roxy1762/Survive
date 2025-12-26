/**
 * 事件系统状态管理
 * Event System State Management
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */

import { create } from 'zustand';
import type { 
  Phase, 
  EventType, 
  EventLogEntry,
  ResourceId,
  BonfireIntensity
} from '../types';
import { 
  EVENTS, 
  getEventById,
  type GameEvent,
  type EventCondition,
  type EventChoice,
  type EventOutcome,
} from '../config/events';

// ============================================
// 游戏状态上下文接口
// Game State Context Interface
// ============================================

/** 事件触发所需的游戏状态上下文 */
export interface EventContext {
  day: number;
  phase: Phase;
  population: number;
  populationCap: number;
  bonfireIntensity: BonfireIntensity;
  radioTowerLevel: number;
  resources: Partial<Record<ResourceId, number>>;
}

// ============================================
// 辅助函数
// Helper Functions
// ============================================

/**
 * 生成唯一事件日志ID
 */
export function generateEventLogId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查单个条件是否满足
 */
export function checkCondition(
  condition: EventCondition,
  context: EventContext
): boolean {
  switch (condition.type) {
    case 'phase':
      return condition.phases?.includes(context.phase) ?? false;
    
    case 'bonfire_lit':
      return context.bonfireIntensity !== 'off';
    
    case 'population_space':
      return context.population < context.populationCap;
    
    case 'radio_tower_level':
      return context.radioTowerLevel >= (condition.buildingLevel ?? 1);
    
    case 'resource_low':
      if (!condition.resourceId || condition.resourceThreshold === undefined) return true;
      return (context.resources[condition.resourceId] ?? 0) < condition.resourceThreshold;
    
    case 'resource_high':
      if (!condition.resourceId || condition.resourceThreshold === undefined) return true;
      return (context.resources[condition.resourceId] ?? 0) >= condition.resourceThreshold;
    
    case 'day_range': {
      const dayOk = (condition.minDay === undefined || context.day >= condition.minDay) &&
                    (condition.maxDay === undefined || context.day <= condition.maxDay);
      return dayOk;
    }
    
    case 'random':
      return Math.random() < (condition.probability ?? 0);
    
    default:
      return true;
  }
}

/**
 * 检查所有条件是否满足
 */
export function checkAllConditions(
  conditions: EventCondition[],
  context: EventContext
): boolean {
  return conditions.every(cond => checkCondition(cond, context));
}

/**
 * 检查事件是否可以触发
 */
export function canEventTrigger(
  event: GameEvent,
  context: EventContext,
  eventCooldowns: Record<string, number>,
  triggeredNonRepeatableEvents: string[]
): boolean {
  // 检查非重复事件是否已触发
  if (!event.repeatable && triggeredNonRepeatableEvents.includes(event.id)) {
    return false;
  }
  
  // 检查冷却
  if (event.cooldownDays) {
    const lastTriggered = eventCooldowns[event.id];
    if (lastTriggered !== undefined && context.day - lastTriggered < event.cooldownDays) {
      return false;
    }
  }
  
  // 检查所有条件
  return checkAllConditions(event.conditions, context);
}

/**
 * 获取可触发的事件列表
 */
export function getTriggeredEvents(
  context: EventContext,
  eventCooldowns: Record<string, number>,
  triggeredNonRepeatableEvents: string[]
): GameEvent[] {
  const triggeredEvents: GameEvent[] = [];
  
  for (const event of EVENTS) {
    if (canEventTrigger(event, context, eventCooldowns, triggeredNonRepeatableEvents)) {
      triggeredEvents.push(event);
    }
  }
  
  // 按优先级排序（高优先级在前）
  return triggeredEvents.sort((a, b) => b.priority - a.priority);
}

/**
 * 根据权重选择结果
 */
export function selectOutcomeByWeight(
  outcomes: EventOutcome[],
  weights?: number[]
): EventOutcome {
  if (!weights || weights.length !== outcomes.length) {
    // 无权重或权重不匹配，随机选择
    return outcomes[Math.floor(Math.random() * outcomes.length)]!;
  }
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < outcomes.length; i++) {
    random -= weights[i]!;
    if (random <= 0) {
      return outcomes[i]!;
    }
  }
  
  return outcomes[outcomes.length - 1]!;
}

/**
 * 创建事件日志条目
 */
export function createEventLogEntry(
  type: EventType | 'action' | 'system',
  message: string,
  messageZh: string,
  day: number,
  phase: Phase
): EventLogEntry {
  return {
    id: generateEventLogId(),
    timestamp: { day, phase },
    type,
    message,
    messageZh,
  };
}

// ============================================
// 待处理事件接口
// Pending Event Interface
// ============================================

/** 待处理的事件（需要玩家选择） */
export interface PendingEvent {
  event: GameEvent;
  availableChoices: EventChoice[];
}

// ============================================
// 事件Store接口
// Event Store Interface
// ============================================

interface EventStore {
  // 状态
  /** 事件日志 */
  eventLog: EventLogEntry[];
  /** 事件冷却记录 (eventId -> lastTriggeredDay) */
  eventCooldowns: Record<string, number>;
  /** 已触发的非重复事件 */
  triggeredNonRepeatableEvents: string[];
  /** 当前待处理的事件（需要玩家选择） */
  pendingEvent: PendingEvent | null;
  /** 最大日志条目数 */
  maxLogEntries: number;
  
  // 事件触发
  /** 检查并触发阶段事件 */
  checkAndTriggerEvents: (context: EventContext) => GameEvent[];
  /** 手动触发特定事件 */
  triggerEvent: (eventId: string, context: EventContext) => boolean;
  /** 检查事件是否可以触发 */
  canTrigger: (eventId: string, context: EventContext) => boolean;
  
  // 事件处理
  /** 处理事件选择 */
  handleEventChoice: (choiceId: string, context: EventContext) => EventOutcome | null;
  /** 处理无选项事件的默认结果 */
  handleDefaultOutcome: (eventId: string, context: EventContext) => EventOutcome | null;
  /** 清除待处理事件 */
  clearPendingEvent: () => void;
  
  // 日志管理
  /** 添加日志条目 */
  addLogEntry: (entry: EventLogEntry) => void;
  /** 添加系统消息 */
  addSystemMessage: (message: string, messageZh: string, day: number, phase: Phase) => void;
  /** 添加行动消息 */
  addActionMessage: (message: string, messageZh: string, day: number, phase: Phase) => void;
  /** 获取最近的日志条目 */
  getRecentLogs: (count: number) => EventLogEntry[];
  /** 清除日志 */
  clearLog: () => void;
  
  // 冷却管理
  /** 设置事件冷却 */
  setEventCooldown: (eventId: string, day: number) => void;
  /** 检查事件是否在冷却中 */
  isEventOnCooldown: (eventId: string, currentDay: number) => boolean;
  
  // 重置
  /** 重置事件状态 */
  resetEvents: () => void;
}

/**
 * 事件状态Store
 */
export const useEventStore = create<EventStore>((set, get) => ({
  // 初始状态
  eventLog: [],
  eventCooldowns: {},
  triggeredNonRepeatableEvents: [],
  pendingEvent: null,
  maxLogEntries: 100,
  
  // ============================================
  // 事件触发
  // ============================================
  
  checkAndTriggerEvents: (context: EventContext): GameEvent[] => {
    const state = get();
    const triggeredEvents = getTriggeredEvents(
      context,
      state.eventCooldowns,
      state.triggeredNonRepeatableEvents
    );
    
    // 处理触发的事件
    const processedEvents: GameEvent[] = [];
    
    for (const event of triggeredEvents) {
      // 更新冷却
      if (event.cooldownDays) {
        state.setEventCooldown(event.id, context.day);
      }
      
      // 标记非重复事件
      if (!event.repeatable) {
        set((s) => ({
          triggeredNonRepeatableEvents: [...s.triggeredNonRepeatableEvents, event.id],
        }));
      }
      
      // 如果事件有选项，设置为待处理
      if (event.choices && event.choices.length > 0) {
        // 过滤可用选项
        const availableChoices = event.choices.filter(choice => {
          if (!choice.conditions) return true;
          return checkAllConditions(choice.conditions, context);
        });
        
        if (availableChoices.length > 0) {
          set({ pendingEvent: { event, availableChoices } });
          
          // 添加事件日志
          state.addLogEntry(createEventLogEntry(
            event.type,
            event.description,
            event.descriptionZh,
            context.day,
            context.phase
          ));
          
          processedEvents.push(event);
          // 一次只处理一个需要选择的事件
          break;
        }
      } else if (event.defaultOutcome) {
        // 无选项事件，直接处理默认结果
        state.addLogEntry(createEventLogEntry(
          event.type,
          event.description,
          event.descriptionZh,
          context.day,
          context.phase
        ));
        
        state.addLogEntry(createEventLogEntry(
          event.type,
          event.defaultOutcome.description,
          event.defaultOutcome.descriptionZh,
          context.day,
          context.phase
        ));
        
        processedEvents.push(event);
      }
    }
    
    return processedEvents;
  },
  
  triggerEvent: (eventId: string, context: EventContext): boolean => {
    const event = getEventById(eventId);
    if (!event) return false;
    
    const state = get();
    if (!canEventTrigger(event, context, state.eventCooldowns, state.triggeredNonRepeatableEvents)) {
      return false;
    }
    
    // 更新冷却
    if (event.cooldownDays) {
      state.setEventCooldown(event.id, context.day);
    }
    
    // 标记非重复事件
    if (!event.repeatable) {
      set((s) => ({
        triggeredNonRepeatableEvents: [...s.triggeredNonRepeatableEvents, event.id],
      }));
    }
    
    // 如果事件有选项，设置为待处理
    if (event.choices && event.choices.length > 0) {
      const availableChoices = event.choices.filter(choice => {
        if (!choice.conditions) return true;
        return checkAllConditions(choice.conditions, context);
      });
      
      if (availableChoices.length > 0) {
        set({ pendingEvent: { event, availableChoices } });
      }
    }
    
    // 添加事件日志
    state.addLogEntry(createEventLogEntry(
      event.type,
      event.description,
      event.descriptionZh,
      context.day,
      context.phase
    ));
    
    return true;
  },
  
  canTrigger: (eventId: string, context: EventContext): boolean => {
    const event = getEventById(eventId);
    if (!event) return false;
    
    const state = get();
    return canEventTrigger(event, context, state.eventCooldowns, state.triggeredNonRepeatableEvents);
  },
  
  // ============================================
  // 事件处理
  // ============================================
  
  handleEventChoice: (choiceId: string, context: EventContext): EventOutcome | null => {
    const state = get();
    const pending = state.pendingEvent;
    
    if (!pending) return null;
    
    const choice = pending.availableChoices.find(c => c.id === choiceId);
    if (!choice) return null;
    
    // 选择结果
    const outcome = selectOutcomeByWeight(choice.outcomes, choice.outcomeWeights);
    
    // 添加结果日志
    state.addLogEntry(createEventLogEntry(
      pending.event.type,
      outcome.description,
      outcome.descriptionZh,
      context.day,
      context.phase
    ));
    
    // 清除待处理事件
    set({ pendingEvent: null });
    
    return outcome;
  },
  
  handleDefaultOutcome: (eventId: string, context: EventContext): EventOutcome | null => {
    const event = getEventById(eventId);
    if (!event || !event.defaultOutcome) return null;
    
    const state = get();
    
    // 添加结果日志
    state.addLogEntry(createEventLogEntry(
      event.type,
      event.defaultOutcome.description,
      event.defaultOutcome.descriptionZh,
      context.day,
      context.phase
    ));
    
    return event.defaultOutcome;
  },
  
  clearPendingEvent: (): void => {
    set({ pendingEvent: null });
  },
  
  // ============================================
  // 日志管理
  // ============================================
  
  addLogEntry: (entry: EventLogEntry): void => {
    set((state) => {
      const newLog = [entry, ...state.eventLog];
      // 限制日志条目数
      if (newLog.length > state.maxLogEntries) {
        newLog.pop();
      }
      return { eventLog: newLog };
    });
  },
  
  addSystemMessage: (message: string, messageZh: string, day: number, phase: Phase): void => {
    const entry = createEventLogEntry('system', message, messageZh, day, phase);
    get().addLogEntry(entry);
  },
  
  addActionMessage: (message: string, messageZh: string, day: number, phase: Phase): void => {
    const entry = createEventLogEntry('action', message, messageZh, day, phase);
    get().addLogEntry(entry);
  },
  
  getRecentLogs: (count: number): EventLogEntry[] => {
    return get().eventLog.slice(0, count);
  },
  
  clearLog: (): void => {
    set({ eventLog: [] });
  },
  
  // ============================================
  // 冷却管理
  // ============================================
  
  setEventCooldown: (eventId: string, day: number): void => {
    set((state) => ({
      eventCooldowns: {
        ...state.eventCooldowns,
        [eventId]: day,
      },
    }));
  },
  
  isEventOnCooldown: (eventId: string, currentDay: number): boolean => {
    const state = get();
    const event = getEventById(eventId);
    if (!event || !event.cooldownDays) return false;
    
    const lastTriggered = state.eventCooldowns[eventId];
    if (lastTriggered === undefined) return false;
    
    return currentDay - lastTriggered < event.cooldownDays;
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetEvents: (): void => {
    set({
      eventLog: [],
      eventCooldowns: {},
      triggeredNonRepeatableEvents: [],
      pendingEvent: null,
    });
  },
}));
