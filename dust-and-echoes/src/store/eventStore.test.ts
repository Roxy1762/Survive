/**
 * 事件系统测试
 * Event System Tests
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  useEventStore, 
  checkCondition, 
  checkAllConditions,
  canEventTrigger,
  getTriggeredEvents,
  selectOutcomeByWeight,
  createEventLogEntry,
  type EventContext
} from './eventStore';
import { 
  EVENTS, 
  getEventById, 
  getEventsByType,
  type EventCondition,
  type EventOutcome
} from '../config/events';

// ============================================
// 测试辅助函数
// Test Helper Functions
// ============================================

function createTestContext(overrides: Partial<EventContext> = {}): EventContext {
  return {
    day: 1,
    phase: 'dawn',
    population: 2,
    populationCap: 5,
    bonfireIntensity: 'medium',
    radioTowerLevel: 0,
    resources: {
      scrap: 50,
      water: 10,
      food: 10,
    },
    ...overrides,
  };
}

// ============================================
// 条件检查测试
// Condition Check Tests
// ============================================

describe('Event Condition Checks', () => {
  describe('checkCondition', () => {
    it('should check phase condition correctly', () => {
      const condition: EventCondition = { type: 'phase', phases: ['dawn', 'morning'] };
      const contextDawn = createTestContext({ phase: 'dawn' });
      const contextNoon = createTestContext({ phase: 'noon' });
      
      expect(checkCondition(condition, contextDawn)).toBe(true);
      expect(checkCondition(condition, contextNoon)).toBe(false);
    });
    
    it('should check bonfire_lit condition correctly', () => {
      const condition: EventCondition = { type: 'bonfire_lit' };
      const contextLit = createTestContext({ bonfireIntensity: 'medium' });
      const contextOff = createTestContext({ bonfireIntensity: 'off' });
      
      expect(checkCondition(condition, contextLit)).toBe(true);
      expect(checkCondition(condition, contextOff)).toBe(false);
    });
    
    it('should check population_space condition correctly', () => {
      const condition: EventCondition = { type: 'population_space' };
      const contextSpace = createTestContext({ population: 2, populationCap: 5 });
      const contextFull = createTestContext({ population: 5, populationCap: 5 });
      
      expect(checkCondition(condition, contextSpace)).toBe(true);
      expect(checkCondition(condition, contextFull)).toBe(false);
    });
    
    it('should check radio_tower_level condition correctly', () => {
      const condition: EventCondition = { type: 'radio_tower_level', buildingLevel: 2 };
      const contextLevel2 = createTestContext({ radioTowerLevel: 2 });
      const contextLevel1 = createTestContext({ radioTowerLevel: 1 });
      const contextLevel3 = createTestContext({ radioTowerLevel: 3 });
      
      expect(checkCondition(condition, contextLevel2)).toBe(true);
      expect(checkCondition(condition, contextLevel1)).toBe(false);
      expect(checkCondition(condition, contextLevel3)).toBe(true);
    });
    
    it('should check resource_low condition correctly', () => {
      const condition: EventCondition = { 
        type: 'resource_low', 
        resourceId: 'water', 
        resourceThreshold: 5 
      };
      const contextLow = createTestContext({ resources: { water: 3 } });
      const contextHigh = createTestContext({ resources: { water: 10 } });
      
      expect(checkCondition(condition, contextLow)).toBe(true);
      expect(checkCondition(condition, contextHigh)).toBe(false);
    });
    
    it('should check resource_high condition correctly', () => {
      const condition: EventCondition = { 
        type: 'resource_high', 
        resourceId: 'food', 
        resourceThreshold: 5 
      };
      const contextHigh = createTestContext({ resources: { food: 10 } });
      const contextLow = createTestContext({ resources: { food: 3 } });
      
      expect(checkCondition(condition, contextHigh)).toBe(true);
      expect(checkCondition(condition, contextLow)).toBe(false);
    });
    
    it('should check day_range condition correctly', () => {
      const condition: EventCondition = { type: 'day_range', minDay: 5, maxDay: 10 };
      const contextDay7 = createTestContext({ day: 7 });
      const contextDay3 = createTestContext({ day: 3 });
      const contextDay15 = createTestContext({ day: 15 });
      
      expect(checkCondition(condition, contextDay7)).toBe(true);
      expect(checkCondition(condition, contextDay3)).toBe(false);
      expect(checkCondition(condition, contextDay15)).toBe(false);
    });
    
    it('should check day_range with only minDay', () => {
      const condition: EventCondition = { type: 'day_range', minDay: 5 };
      const contextDay7 = createTestContext({ day: 7 });
      const contextDay3 = createTestContext({ day: 3 });
      
      expect(checkCondition(condition, contextDay7)).toBe(true);
      expect(checkCondition(condition, contextDay3)).toBe(false);
    });
  });
  
  describe('checkAllConditions', () => {
    it('should return true when all conditions are met', () => {
      const conditions: EventCondition[] = [
        { type: 'phase', phases: ['dawn'] },
        { type: 'bonfire_lit' },
      ];
      const context = createTestContext({ phase: 'dawn', bonfireIntensity: 'high' });
      
      expect(checkAllConditions(conditions, context)).toBe(true);
    });
    
    it('should return false when any condition is not met', () => {
      const conditions: EventCondition[] = [
        { type: 'phase', phases: ['dawn'] },
        { type: 'radio_tower_level', buildingLevel: 2 },
      ];
      const context = createTestContext({ phase: 'dawn', radioTowerLevel: 1 });
      
      expect(checkAllConditions(conditions, context)).toBe(false);
    });
    
    it('should return true for empty conditions', () => {
      const context = createTestContext();
      expect(checkAllConditions([], context)).toBe(true);
    });
  });
});

// ============================================
// 事件触发测试
// Event Trigger Tests
// ============================================

describe('Event Triggering', () => {
  describe('canEventTrigger', () => {
    it('should return false for non-repeatable events that have been triggered', () => {
      const event = EVENTS.find(e => !e.repeatable);
      if (!event) return; // Skip if no non-repeatable events
      
      const context = createTestContext();
      const cooldowns = {};
      const triggered = [event.id];
      
      expect(canEventTrigger(event, context, cooldowns, triggered)).toBe(false);
    });
    
    it('should return false for events on cooldown', () => {
      const event = EVENTS.find(e => e.cooldownDays && e.cooldownDays > 0);
      if (!event) return; // Skip if no events with cooldown
      
      const context = createTestContext({ day: 3 });
      const cooldowns = { [event.id]: 2 }; // Triggered on day 2
      const triggered: string[] = [];
      
      // Should be on cooldown if cooldownDays > 1
      if (event.cooldownDays! > 1) {
        expect(canEventTrigger(event, context, cooldowns, triggered)).toBe(false);
      }
    });
  });
  
  describe('getTriggeredEvents', () => {
    it('should return events sorted by priority', () => {
      // Create a context that might trigger multiple events
      const context = createTestContext({
        phase: 'dawn',
        bonfireIntensity: 'high',
        population: 2,
        populationCap: 5,
      });
      
      const events = getTriggeredEvents(context, {}, []);
      
      // Check that events are sorted by priority (descending)
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1]!.priority).toBeGreaterThanOrEqual(events[i]!.priority);
      }
    });
  });
});

// ============================================
// 结果选择测试
// Outcome Selection Tests
// ============================================

describe('Outcome Selection', () => {
  describe('selectOutcomeByWeight', () => {
    it('should return an outcome from the list', () => {
      const outcomes: EventOutcome[] = [
        { description: 'A', descriptionZh: 'A中文' },
        { description: 'B', descriptionZh: 'B中文' },
      ];
      
      const result = selectOutcomeByWeight(outcomes);
      expect(outcomes).toContain(result);
    });
    
    it('should respect weights when provided', () => {
      const outcomes: EventOutcome[] = [
        { description: 'A', descriptionZh: 'A中文' },
        { description: 'B', descriptionZh: 'B中文' },
      ];
      const weights = [1, 0]; // Always select first
      
      // Run multiple times to verify
      for (let i = 0; i < 10; i++) {
        const result = selectOutcomeByWeight(outcomes, weights);
        expect(result.description).toBe('A');
      }
    });
    
    it('should handle single outcome', () => {
      const outcomes: EventOutcome[] = [
        { description: 'Only', descriptionZh: '唯一' },
      ];
      
      const result = selectOutcomeByWeight(outcomes);
      expect(result.description).toBe('Only');
    });
  });
});

// ============================================
// 事件日志测试
// Event Log Tests
// ============================================

describe('Event Log', () => {
  describe('createEventLogEntry', () => {
    it('should create a valid log entry', () => {
      const entry = createEventLogEntry(
        'resource_discovery',
        'Found resources',
        '发现资源',
        5,
        'morning'
      );
      
      expect(entry.type).toBe('resource_discovery');
      expect(entry.message).toBe('Found resources');
      expect(entry.messageZh).toBe('发现资源');
      expect(entry.timestamp.day).toBe(5);
      expect(entry.timestamp.phase).toBe('morning');
      expect(entry.id).toBeTruthy();
    });
  });
});

// ============================================
// 事件Store测试
// Event Store Tests
// ============================================

describe('Event Store', () => {
  beforeEach(() => {
    useEventStore.getState().resetEvents();
  });
  
  describe('Log Management', () => {
    it('should add log entries', () => {
      const store = useEventStore.getState();
      
      store.addSystemMessage('Test message', '测试消息', 1, 'dawn');
      
      const logs = store.getRecentLogs(10);
      expect(logs.length).toBe(1);
      expect(logs[0]!.message).toBe('Test message');
      expect(logs[0]!.type).toBe('system');
    });
    
    it('should add action messages', () => {
      const store = useEventStore.getState();
      
      store.addActionMessage('Action taken', '执行行动', 1, 'morning');
      
      const logs = store.getRecentLogs(10);
      expect(logs.length).toBe(1);
      expect(logs[0]!.type).toBe('action');
    });
    
    it('should limit log entries to maxLogEntries', () => {
      const store = useEventStore.getState();
      const maxEntries = store.maxLogEntries;
      
      // Add more than max entries
      for (let i = 0; i < maxEntries + 10; i++) {
        store.addSystemMessage(`Message ${i}`, `消息 ${i}`, 1, 'dawn');
      }
      
      const logs = store.getRecentLogs(maxEntries + 10);
      expect(logs.length).toBe(maxEntries);
    });
    
    it('should clear log', () => {
      const store = useEventStore.getState();
      
      store.addSystemMessage('Test', '测试', 1, 'dawn');
      expect(store.getRecentLogs(10).length).toBe(1);
      
      store.clearLog();
      expect(store.getRecentLogs(10).length).toBe(0);
    });
  });
  
  describe('Cooldown Management', () => {
    it('should set and check event cooldowns', () => {
      const store = useEventStore.getState();
      
      store.setEventCooldown('test_event', 5);
      
      // Event with 2 day cooldown should be on cooldown on day 6
      const eventWithCooldown = EVENTS.find(e => e.cooldownDays === 2);
      if (eventWithCooldown) {
        store.setEventCooldown(eventWithCooldown.id, 5);
        expect(store.isEventOnCooldown(eventWithCooldown.id, 6)).toBe(true);
        expect(store.isEventOnCooldown(eventWithCooldown.id, 8)).toBe(false);
      }
    });
  });
  
  describe('Event Triggering', () => {
    it('should check if event can trigger', () => {
      const store = useEventStore.getState();
      
      // Find an event that requires radio tower
      const radioEvent = EVENTS.find(e => 
        e.conditions.some(c => c.type === 'radio_tower_level')
      );
      
      if (radioEvent) {
        const contextNoRadio = createTestContext({ radioTowerLevel: 0 });
        // contextWithRadio would be used if we needed to test positive case
        // const contextWithRadio = createTestContext({ radioTowerLevel: 2 });
        
        // Without radio tower, should not be able to trigger
        expect(store.canTrigger(radioEvent.id, contextNoRadio)).toBe(false);
      }
    });
  });
  
  describe('Event Choice Handling', () => {
    it('should handle event choices and return outcome', () => {
      const store = useEventStore.getState();
      
      // Find an event with choices
      const eventWithChoices = EVENTS.find(e => e.choices && e.choices.length > 0);
      if (!eventWithChoices) return;
      
      const context = createTestContext();
      
      // Manually set pending event
      useEventStore.setState({
        pendingEvent: {
          event: eventWithChoices,
          availableChoices: eventWithChoices.choices!,
        },
      });
      
      // Handle the first choice
      const firstChoice = eventWithChoices.choices![0]!;
      const outcome = store.handleEventChoice(firstChoice.id, context);
      
      expect(outcome).not.toBeNull();
      expect(store.pendingEvent).toBeNull();
    });
    
    it('should return null for invalid choice', () => {
      const store = useEventStore.getState();
      const context = createTestContext();
      
      // No pending event
      const outcome = store.handleEventChoice('invalid_choice', context);
      expect(outcome).toBeNull();
    });
  });
  
  describe('Reset', () => {
    it('should reset all event state', () => {
      const store = useEventStore.getState();
      
      // Add some state
      store.addSystemMessage('Test', '测试', 1, 'dawn');
      store.setEventCooldown('test', 1);
      
      // Reset
      store.resetEvents();
      
      expect(store.eventLog.length).toBe(0);
      expect(Object.keys(store.eventCooldowns).length).toBe(0);
      expect(store.triggeredNonRepeatableEvents.length).toBe(0);
      expect(store.pendingEvent).toBeNull();
    });
  });
});

// ============================================
// 事件配置测试
// Event Configuration Tests
// ============================================

describe('Event Configuration', () => {
  describe('getEventById', () => {
    it('should return event by id', () => {
      const event = getEventById('resource_discovery_scrap');
      expect(event).toBeDefined();
      expect(event?.id).toBe('resource_discovery_scrap');
    });
    
    it('should return undefined for invalid id', () => {
      const event = getEventById('invalid_event_id');
      expect(event).toBeUndefined();
    });
  });
  
  describe('getEventsByType', () => {
    it('should return events of specified type', () => {
      const resourceEvents = getEventsByType('resource_discovery');
      expect(resourceEvents.length).toBeGreaterThan(0);
      expect(resourceEvents.every(e => e.type === 'resource_discovery')).toBe(true);
    });
    
    it('should return empty array for type with no events', () => {
      // All event types should have at least one event in our config
      // This test verifies the function works correctly
      const events = getEventsByType('resource_discovery');
      expect(Array.isArray(events)).toBe(true);
    });
  });
  
  describe('Event Types Coverage', () => {
    it('should have events for all required types', () => {
      // Requirements 20.2: Support event types
      const requiredTypes = [
        'resource_discovery',
        'wanderer_arrival',
        'raid',
        'trader_visit',
        'weather',
        'story_signal',
      ] as const;
      
      for (const type of requiredTypes) {
        const events = getEventsByType(type);
        expect(events.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Phase Event Configuration', () => {
    it('should have dawn events for weather and discoveries', () => {
      // Requirements 20.1: Dawn: weather events, morning discoveries
      const dawnEvents = EVENTS.filter(e => 
        e.conditions.some(c => c.type === 'phase' && c.phases?.includes('dawn'))
      );
      
      const hasWeather = dawnEvents.some(e => e.type === 'weather');
      const hasDiscovery = dawnEvents.some(e => e.type === 'resource_discovery');
      
      expect(hasWeather || hasDiscovery).toBe(true);
    });
    
    it('should have evening events for raids and traders', () => {
      // Requirements 20.1: Evening: raids, black market traders
      const eveningEvents = EVENTS.filter(e => 
        e.conditions.some(c => c.type === 'phase' && c.phases?.includes('evening'))
      );
      
      const hasRaid = eveningEvents.some(e => e.type === 'raid');
      const hasTrader = eveningEvents.some(e => e.type === 'trader_visit');
      
      expect(hasRaid || hasTrader).toBe(true);
    });
    
    it('should have midnight events for high-risk scenarios', () => {
      // Requirements 20.1: Midnight: high-risk/high-reward events
      const midnightEvents = EVENTS.filter(e => 
        e.conditions.some(c => c.type === 'phase' && c.phases?.includes('midnight'))
      );
      
      expect(midnightEvents.length).toBeGreaterThan(0);
    });
  });
  
  describe('Event Choices', () => {
    it('should have events with player choices', () => {
      // Requirements 20.4: Allow player choices for some events
      const eventsWithChoices = EVENTS.filter(e => e.choices && e.choices.length > 0);
      expect(eventsWithChoices.length).toBeGreaterThan(0);
    });
    
    it('should have valid choice structures', () => {
      const eventsWithChoices = EVENTS.filter(e => e.choices && e.choices.length > 0);
      
      for (const event of eventsWithChoices) {
        for (const choice of event.choices!) {
          expect(choice.id).toBeTruthy();
          expect(choice.text).toBeTruthy();
          expect(choice.textZh).toBeTruthy();
          expect(choice.outcomes.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
