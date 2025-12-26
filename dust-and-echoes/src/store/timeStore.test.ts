/**
 * 时间与阶段系统测试
 * Time & Phase System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { 
  useTimeStore, 
  getNextPhase, 
  isMidnight, 
  getPhaseAU,
  createInitialTimeState 
} from './timeStore';
import { Phase, PHASE_AU, PHASE_ORDER } from '../types';

describe('Time System Utility Functions', () => {
  describe('getNextPhase', () => {
    it('should return morning after dawn', () => {
      expect(getNextPhase('dawn')).toBe('morning');
    });

    it('should return noon after morning', () => {
      expect(getNextPhase('morning')).toBe('noon');
    });

    it('should return afternoon after noon', () => {
      expect(getNextPhase('noon')).toBe('afternoon');
    });

    it('should return evening after afternoon', () => {
      expect(getNextPhase('afternoon')).toBe('evening');
    });

    it('should return midnight after evening', () => {
      expect(getNextPhase('evening')).toBe('midnight');
    });

    it('should return dawn after midnight (day rollover)', () => {
      expect(getNextPhase('midnight')).toBe('dawn');
    });
  });

  describe('isMidnight', () => {
    it('should return true for midnight', () => {
      expect(isMidnight('midnight')).toBe(true);
    });

    it('should return false for other phases', () => {
      const otherPhases: Phase[] = ['dawn', 'morning', 'noon', 'afternoon', 'evening'];
      otherPhases.forEach(phase => {
        expect(isMidnight(phase)).toBe(false);
      });
    });
  });

  describe('getPhaseAU', () => {
    it('should return 0.5 for dawn', () => {
      expect(getPhaseAU('dawn')).toBe(0.5);
    });

    it('should return 1.0 for morning', () => {
      expect(getPhaseAU('morning')).toBe(1.0);
    });

    it('should return 0.5 for noon', () => {
      expect(getPhaseAU('noon')).toBe(0.5);
    });

    it('should return 1.0 for afternoon', () => {
      expect(getPhaseAU('afternoon')).toBe(1.0);
    });

    it('should return 1.0 for evening', () => {
      expect(getPhaseAU('evening')).toBe(1.0);
    });

    it('should return 1.0 for midnight', () => {
      expect(getPhaseAU('midnight')).toBe(1.0);
    });
  });

  describe('createInitialTimeState', () => {
    it('should create state starting at day 1, dawn phase', () => {
      const state = createInitialTimeState();
      expect(state.day).toBe(1);
      expect(state.phase).toBe('dawn');
      expect(state.phaseAU).toBe(0.5);
    });
  });
});

describe('Time Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useTimeStore.getState().resetTime();
  });

  describe('Initial State', () => {
    it('should start at day 1, dawn phase', () => {
      const { time } = useTimeStore.getState();
      expect(time.day).toBe(1);
      expect(time.phase).toBe('dawn');
      expect(time.phaseAU).toBe(0.5);
    });
  });

  describe('advancePhase', () => {
    it('should advance from dawn to morning', () => {
      const store = useTimeStore.getState();
      store.advancePhase();
      
      const { time } = useTimeStore.getState();
      expect(time.phase).toBe('morning');
      expect(time.phaseAU).toBe(1.0);
      expect(time.day).toBe(1);
    });

    it('should advance through all phases in a day', () => {
      const store = useTimeStore.getState();
      
      // Dawn -> Morning
      store.advancePhase();
      expect(useTimeStore.getState().time.phase).toBe('morning');
      
      // Morning -> Noon
      store.advancePhase();
      expect(useTimeStore.getState().time.phase).toBe('noon');
      
      // Noon -> Afternoon
      store.advancePhase();
      expect(useTimeStore.getState().time.phase).toBe('afternoon');
      
      // Afternoon -> Evening
      store.advancePhase();
      expect(useTimeStore.getState().time.phase).toBe('evening');
      
      // Evening -> Midnight
      store.advancePhase();
      expect(useTimeStore.getState().time.phase).toBe('midnight');
      
      // All still day 1
      expect(useTimeStore.getState().time.day).toBe(1);
    });

    it('should advance day when transitioning from midnight to dawn', () => {
      const store = useTimeStore.getState();
      
      // Advance through day 1
      for (let i = 0; i < 6; i++) {
        store.advancePhase();
      }
      
      // Should now be day 2, dawn
      const { time } = useTimeStore.getState();
      expect(time.day).toBe(2);
      expect(time.phase).toBe('dawn');
    });
  });

  describe('getCurrentPhaseAU', () => {
    it('should return current phase AU value', () => {
      const store = useTimeStore.getState();
      expect(store.getCurrentPhaseAU()).toBe(0.5); // dawn
      
      store.advancePhase();
      expect(useTimeStore.getState().getCurrentPhaseAU()).toBe(1.0); // morning
    });
  });

  describe('isShortActionPhase', () => {
    it('should return true for dawn', () => {
      expect(useTimeStore.getState().isShortActionPhase()).toBe(true);
    });

    it('should return false for morning', () => {
      useTimeStore.getState().advancePhase();
      expect(useTimeStore.getState().isShortActionPhase()).toBe(false);
    });

    it('should return true for noon', () => {
      const store = useTimeStore.getState();
      store.advancePhase(); // morning
      store.advancePhase(); // noon
      expect(useTimeStore.getState().isShortActionPhase()).toBe(true);
    });
  });

  describe('resetTime', () => {
    it('should reset to initial state', () => {
      const store = useTimeStore.getState();
      
      // Advance a few phases
      store.advancePhase();
      store.advancePhase();
      store.advancePhase();
      
      // Reset
      store.resetTime();
      
      const { time } = useTimeStore.getState();
      expect(time.day).toBe(1);
      expect(time.phase).toBe('dawn');
      expect(time.phaseAU).toBe(0.5);
    });
  });
});

/**
 * Property-Based Tests
 * Feature: dust-and-echoes, Property 1: Phase AU Sum Invariant
 */
describe('Property-Based Tests', () => {
  /**
   * Property 1: Phase AU Sum Invariant
   * For any game configuration, the sum of all phase AU values in a day 
   * SHALL equal exactly 5.0 AU (0.5 + 1.0 + 0.5 + 1.0 + 1.0 + 1.0).
   * **Validates: Requirements 1.1**
   */
  it('Property 1: Phase AU Sum Invariant - sum of all phase AU values equals 5.0', () => {
    fc.assert(
      fc.property(
        fc.constant(PHASE_ORDER),
        (phases) => {
          const totalAU = phases.reduce((sum, phase) => sum + PHASE_AU[phase], 0);
          return totalAU === 5.0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 19: Phase Transition Correctness
   * For any phase transition from Midnight, the next phase SHALL be Dawn of the next day (day + 1).
   * **Validates: Requirements 1.8**
   */
  it('Property 19: Phase Transition Correctness - midnight transitions to dawn with day increment', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // number of full days to simulate
        (numDays) => {
          // Reset store
          useTimeStore.getState().resetTime();
          
          // Simulate multiple days
          for (let day = 0; day < numDays; day++) {
            // Advance through all phases to get to midnight
            for (let i = 0; i < 5; i++) {
              useTimeStore.getState().advancePhase();
            }
            
            // Now we're at midnight
            const beforeAdvance = useTimeStore.getState().time;
            if (beforeAdvance.phase !== 'midnight') return false;
            
            const dayBeforeAdvance = beforeAdvance.day;
            
            // Advance from midnight
            useTimeStore.getState().advancePhase();
            
            const afterAdvance = useTimeStore.getState().time;
            
            // Should be dawn of next day
            if (afterAdvance.phase !== 'dawn') return false;
            if (afterAdvance.day !== dayBeforeAdvance + 1) return false;
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Phase order is consistent
   * For any phase, getNextPhase should return the next phase in PHASE_ORDER
   */
  it('Phase order consistency - getNextPhase follows PHASE_ORDER', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }), // index into PHASE_ORDER
        (phaseIndex) => {
          const currentPhase = PHASE_ORDER[phaseIndex];
          if (!currentPhase) return false; // safety check
          const expectedNextPhase = PHASE_ORDER[(phaseIndex + 1) % PHASE_ORDER.length];
          const actualNextPhase = getNextPhase(currentPhase);
          return actualNextPhase === expectedNextPhase;
        }
      ),
      { numRuns: 100 }
    );
  });
});
