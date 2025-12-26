/**
 * 战斗系统测试
 * Combat System Tests
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  useCombatStore,
  calculateDamage,
  calculateCombatPower,
  calculateRegionDifficulty,
  calculateWinProbability,
  createCombatantFromWorker,
  createEnemyCombatant,
  isCombatantAlive,
  isTeamDefeated,
  getAliveCombatants,
  calculateTeamCombatPower,
  MIN_DAMAGE,
  DAMAGE_RANDOM_RANGE,
  COMBAT_POWER_COEFFICIENTS,
  REGION_DIFFICULTY_BASE,
  REGION_DIFFICULTY_DISTANCE_COEFFICIENT,
} from './combatStore';
import type { Combatant, CombatantStats } from '../types';

// ============================================
// Unit Tests for Calculation Functions
// ============================================

describe('Combat Calculation Functions', () => {
  describe('calculateDamage', () => {
    /**
     * Requirements: 7.2
     * 公式: Damage = max(1, ATK - DEF + Random(-1, 0, 1))
     */
    it('should calculate damage with formula: max(1, ATK - DEF + random)', () => {
      // With random = 0
      expect(calculateDamage(10, 5, 0)).toBe(5);
      expect(calculateDamage(10, 8, 0)).toBe(2);
      
      // With random = 1
      expect(calculateDamage(10, 5, 1)).toBe(6);
      
      // With random = -1
      expect(calculateDamage(10, 5, -1)).toBe(4);
    });

    it('should return minimum damage of 1', () => {
      // When ATK - DEF + random would be <= 0
      expect(calculateDamage(5, 10, 0)).toBe(MIN_DAMAGE);
      expect(calculateDamage(5, 10, -1)).toBe(MIN_DAMAGE);
      expect(calculateDamage(1, 5, -1)).toBe(MIN_DAMAGE);
    });

    it('should handle edge case where ATK equals DEF', () => {
      expect(calculateDamage(5, 5, 0)).toBe(MIN_DAMAGE); // 0 -> 1
      expect(calculateDamage(5, 5, 1)).toBe(1);
      expect(calculateDamage(5, 5, -1)).toBe(MIN_DAMAGE); // -1 -> 1
    });
  });

  describe('calculateCombatPower', () => {
    /**
     * Requirements: 7.3
     * 公式: CP = ATK + 0.7 × DEF + 0.3 × (HP/10)
     */
    it('should calculate combat power with correct formula', () => {
      // CP = 10 + 0.7 * 5 + 0.3 * (100/10) = 10 + 3.5 + 3 = 16.5
      expect(calculateCombatPower(10, 5, 100)).toBe(16.5);
      
      // CP = 5 + 0.7 * 3 + 0.3 * (50/10) = 5 + 2.1 + 1.5 = 8.6
      expect(calculateCombatPower(5, 3, 50)).toBeCloseTo(8.6);
    });

    it('should handle zero values', () => {
      expect(calculateCombatPower(0, 0, 0)).toBe(0);
      expect(calculateCombatPower(10, 0, 0)).toBe(10);
      expect(calculateCombatPower(0, 10, 0)).toBe(7);
      expect(calculateCombatPower(0, 0, 100)).toBe(3);
    });
  });

  describe('calculateRegionDifficulty', () => {
    /**
     * Requirements: 7.4
     * 公式: DC = 6 + 1.5 × distance
     */
    it('should calculate region difficulty with correct formula', () => {
      expect(calculateRegionDifficulty(0)).toBe(6);
      expect(calculateRegionDifficulty(1)).toBe(7.5);
      expect(calculateRegionDifficulty(2)).toBe(9);
      expect(calculateRegionDifficulty(10)).toBe(21);
    });

    it('should use correct constants', () => {
      const distance = 5;
      const expected = REGION_DIFFICULTY_BASE + REGION_DIFFICULTY_DISTANCE_COEFFICIENT * distance;
      expect(calculateRegionDifficulty(distance)).toBe(expected);
    });
  });

  describe('calculateWinProbability', () => {
    /**
     * Requirements: 7.5
     * 公式: P(win) = 1 / (1 + e^(-(CP-DC)/2.5))
     */
    it('should return 0.5 when CP equals DC', () => {
      expect(calculateWinProbability(10, 10)).toBeCloseTo(0.5);
    });

    it('should return higher probability when CP > DC', () => {
      const prob = calculateWinProbability(15, 10);
      expect(prob).toBeGreaterThan(0.5);
      expect(prob).toBeLessThan(1);
    });

    it('should return lower probability when CP < DC', () => {
      const prob = calculateWinProbability(5, 10);
      expect(prob).toBeLessThan(0.5);
      expect(prob).toBeGreaterThan(0);
    });

    it('should approach 1 for very high CP', () => {
      const prob = calculateWinProbability(100, 10);
      expect(prob).toBeGreaterThan(0.99);
    });

    it('should approach 0 for very low CP', () => {
      const prob = calculateWinProbability(10, 100);
      expect(prob).toBeLessThan(0.01);
    });
  });
});


// ============================================
// Unit Tests for Helper Functions
// ============================================

describe('Combat Helper Functions', () => {
  describe('createCombatantFromWorker', () => {
    it('should create combatant with base stats', () => {
      const combatant = createCombatantFromWorker('worker1', 'Test Worker', 80);
      
      expect(combatant.id).toBe('worker1');
      expect(combatant.name).toBe('Test Worker');
      expect(combatant.isPlayer).toBe(true);
      expect(combatant.stats.hp).toBe(80);
      expect(combatant.stats.maxHp).toBe(100);
      expect(combatant.stats.atk).toBe(1); // Base ATK
      expect(combatant.stats.def).toBe(0); // Base DEF
    });

    it('should add weapon ATK bonus', () => {
      const combatant = createCombatantFromWorker('worker1', 'Test', 100, 'rusty_pipe');
      expect(combatant.stats.atk).toBe(3); // 1 base + 2 from rusty_pipe
    });

    it('should add armor DEF bonus', () => {
      const combatant = createCombatantFromWorker('worker1', 'Test', 100, undefined, 'leather_armor');
      expect(combatant.stats.def).toBe(2); // 0 base + 2 from leather_armor
    });

    it('should add both weapon and armor bonuses', () => {
      const combatant = createCombatantFromWorker('worker1', 'Test', 100, 'spear', 'scrap_plate');
      expect(combatant.stats.atk).toBe(5); // 1 base + 4 from spear
      expect(combatant.stats.def).toBe(3); // 0 base + 3 from scrap_plate
    });
  });

  describe('createEnemyCombatant', () => {
    it('should create enemy combatant with given stats', () => {
      const stats: CombatantStats = { hp: 50, maxHp: 50, atk: 5, def: 2 };
      const enemy = createEnemyCombatant('Raider', stats);
      
      expect(enemy.name).toBe('Raider');
      expect(enemy.isPlayer).toBe(false);
      expect(enemy.stats).toEqual(stats);
      expect(enemy.id).toContain('combatant_');
    });
  });

  describe('isCombatantAlive', () => {
    it('should return true when HP > 0', () => {
      const combatant: Combatant = {
        id: '1', name: 'Test', isPlayer: true,
        stats: { hp: 1, maxHp: 100, atk: 1, def: 0 },
        statuses: []
      };
      expect(isCombatantAlive(combatant)).toBe(true);
    });

    it('should return false when HP = 0', () => {
      const combatant: Combatant = {
        id: '1', name: 'Test', isPlayer: true,
        stats: { hp: 0, maxHp: 100, atk: 1, def: 0 },
        statuses: []
      };
      expect(isCombatantAlive(combatant)).toBe(false);
    });
  });

  describe('isTeamDefeated', () => {
    it('should return true when all team members are dead', () => {
      const team: Combatant[] = [
        { id: '1', name: 'A', isPlayer: true, stats: { hp: 0, maxHp: 100, atk: 1, def: 0 }, statuses: [] },
        { id: '2', name: 'B', isPlayer: true, stats: { hp: 0, maxHp: 100, atk: 1, def: 0 }, statuses: [] },
      ];
      expect(isTeamDefeated(team)).toBe(true);
    });

    it('should return false when at least one member is alive', () => {
      const team: Combatant[] = [
        { id: '1', name: 'A', isPlayer: true, stats: { hp: 0, maxHp: 100, atk: 1, def: 0 }, statuses: [] },
        { id: '2', name: 'B', isPlayer: true, stats: { hp: 1, maxHp: 100, atk: 1, def: 0 }, statuses: [] },
      ];
      expect(isTeamDefeated(team)).toBe(false);
    });

    it('should return true for empty team', () => {
      expect(isTeamDefeated([])).toBe(true);
    });
  });

  describe('getAliveCombatants', () => {
    it('should return only alive combatants', () => {
      const team: Combatant[] = [
        { id: '1', name: 'A', isPlayer: true, stats: { hp: 50, maxHp: 100, atk: 1, def: 0 }, statuses: [] },
        { id: '2', name: 'B', isPlayer: true, stats: { hp: 0, maxHp: 100, atk: 1, def: 0 }, statuses: [] },
        { id: '3', name: 'C', isPlayer: true, stats: { hp: 25, maxHp: 100, atk: 1, def: 0 }, statuses: [] },
      ];
      const alive = getAliveCombatants(team);
      expect(alive.length).toBe(2);
      expect(alive.map(c => c.id)).toEqual(['1', '3']);
    });
  });

  describe('calculateTeamCombatPower', () => {
    it('should sum combat power of alive members only', () => {
      const team: Combatant[] = [
        { id: '1', name: 'A', isPlayer: true, stats: { hp: 100, maxHp: 100, atk: 10, def: 5 }, statuses: [] },
        { id: '2', name: 'B', isPlayer: true, stats: { hp: 0, maxHp: 100, atk: 10, def: 5 }, statuses: [] }, // Dead
      ];
      
      // Only first combatant should count: 10 + 0.7*5 + 0.3*(100/10) = 10 + 3.5 + 3 = 16.5
      expect(calculateTeamCombatPower(team)).toBe(16.5);
    });
  });
});

// ============================================
// Combat Store Tests
// ============================================

describe('Combat Store', () => {
  beforeEach(() => {
    useCombatStore.getState().resetCombat();
  });

  describe('startCombat', () => {
    it('should initialize combat state', () => {
      const player: Combatant = {
        id: 'p1', name: 'Player', isPlayer: true,
        stats: { hp: 100, maxHp: 100, atk: 10, def: 5 },
        statuses: []
      };
      const enemy: Combatant = {
        id: 'e1', name: 'Enemy', isPlayer: false,
        stats: { hp: 50, maxHp: 50, atk: 5, def: 2 },
        statuses: []
      };

      const combatId = useCombatStore.getState().startCombat([player], [enemy]);
      
      expect(combatId).toContain('combat_');
      
      const state = useCombatStore.getState().getCombatState();
      expect(state).not.toBeNull();
      expect(state!.status).toBe('ongoing');
      expect(state!.turn).toBe(0);
      expect(state!.playerTeam.length).toBe(1);
      expect(state!.enemyTeam.length).toBe(1);
      expect(state!.log.length).toBe(1);
    });
  });

  describe('executeTurn', () => {
    it('should execute a combat turn and deal damage', () => {
      const player: Combatant = {
        id: 'p1', name: 'Player', isPlayer: true,
        stats: { hp: 100, maxHp: 100, atk: 10, def: 5 },
        statuses: []
      };
      const enemy: Combatant = {
        id: 'e1', name: 'Enemy', isPlayer: false,
        stats: { hp: 50, maxHp: 50, atk: 5, def: 2 },
        statuses: []
      };

      useCombatStore.getState().startCombat([player], [enemy]);
      
      const result = useCombatStore.getState().executeTurn();
      
      expect(result).not.toBeNull();
      expect(result!.damage).toBeGreaterThanOrEqual(MIN_DAMAGE);
      expect(result!.attacker).toBe('p1'); // Player attacks first
      expect(result!.defender).toBe('e1');
    });

    it('should alternate between player and enemy turns', () => {
      const player: Combatant = {
        id: 'p1', name: 'Player', isPlayer: true,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };
      const enemy: Combatant = {
        id: 'e1', name: 'Enemy', isPlayer: false,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };

      useCombatStore.getState().startCombat([player], [enemy]);
      
      const turn1 = useCombatStore.getState().executeTurn();
      const turn2 = useCombatStore.getState().executeTurn();
      
      expect(turn1!.attacker).toBe('p1');
      expect(turn2!.attacker).toBe('e1');
    });
  });

  describe('isCombatOver', () => {
    it('should return true when no active combat', () => {
      expect(useCombatStore.getState().isCombatOver()).toBe(true);
    });

    it('should return false during ongoing combat', () => {
      const player: Combatant = {
        id: 'p1', name: 'Player', isPlayer: true,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };
      const enemy: Combatant = {
        id: 'e1', name: 'Enemy', isPlayer: false,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };

      useCombatStore.getState().startCombat([player], [enemy]);
      expect(useCombatStore.getState().isCombatOver()).toBe(false);
    });
  });

  describe('resolveCombat', () => {
    it('should return combat result with casualties', () => {
      const player: Combatant = {
        id: 'p1', name: 'Player', isPlayer: true,
        stats: { hp: 100, maxHp: 100, atk: 20, def: 5 },
        statuses: []
      };
      const enemy: Combatant = {
        id: 'e1', name: 'Enemy', isPlayer: false,
        stats: { hp: 10, maxHp: 10, atk: 5, def: 0 },
        statuses: []
      };

      useCombatStore.getState().startCombat([player], [enemy]);
      
      // Execute until combat ends
      while (!useCombatStore.getState().isCombatOver()) {
        useCombatStore.getState().executeTurn();
      }
      
      const result = useCombatStore.getState().resolveCombat();
      
      expect(result.victory).toBe(true);
      expect(result.enemiesDefeated).toContain('e1');
    });
  });

  describe('attemptFlee', () => {
    it('should end combat when flee succeeds', () => {
      const player: Combatant = {
        id: 'p1', name: 'Player', isPlayer: true,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };
      const enemy: Combatant = {
        id: 'e1', name: 'Enemy', isPlayer: false,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };

      useCombatStore.getState().startCombat([player], [enemy]);
      
      // Force flee success with 100% chance
      const success = useCombatStore.getState().attemptFlee(1.0);
      
      expect(success).toBe(true);
      expect(useCombatStore.getState().getCombatState()!.status).toBe('fled');
    });

    it('should not end combat when flee fails', () => {
      const player: Combatant = {
        id: 'p1', name: 'Player', isPlayer: true,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };
      const enemy: Combatant = {
        id: 'e1', name: 'Enemy', isPlayer: false,
        stats: { hp: 100, maxHp: 100, atk: 5, def: 5 },
        statuses: []
      };

      useCombatStore.getState().startCombat([player], [enemy]);
      
      // Force flee failure with 0% chance
      const success = useCombatStore.getState().attemptFlee(0);
      
      expect(success).toBe(false);
      expect(useCombatStore.getState().getCombatState()!.status).toBe('ongoing');
    });
  });
});


// ============================================
// Property-Based Tests
// ============================================

describe('Property-Based Tests', () => {
  beforeEach(() => {
    useCombatStore.getState().resetCombat();
  });

  /**
   * Property 13: Combat Damage Bounds
   * For any combat attack with ATK and DEF, the damage SHALL be at least 1 
   * and at most ATK - DEF + 1.
   * **Validates: Requirements 7.2**
   */
  it('Property 13: Combat Damage Bounds - damage is within expected range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // ATK
        fc.integer({ min: 0, max: 100 }), // DEF
        fc.constantFrom(...DAMAGE_RANDOM_RANGE), // random value
        (atk, def, randomValue) => {
          const damage = calculateDamage(atk, def, randomValue);
          
          // Damage must be at least MIN_DAMAGE (1)
          if (damage < MIN_DAMAGE) return false;
          
          // Damage must be at most ATK - DEF + 1 (when random = 1)
          // But also at least MIN_DAMAGE
          const maxPossibleDamage = Math.max(MIN_DAMAGE, atk - def + 1);
          if (damage > maxPossibleDamage) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: Combat Power Formula
   * For any combatant with ATK, DEF, and HP, the combat power SHALL equal 
   * ATK + 0.7 × DEF + 0.3 × (HP / 10).
   * **Validates: Requirements 7.3**
   */
  it('Property 14: Combat Power Formula - CP follows exact formula', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // ATK
        fc.integer({ min: 0, max: 100 }), // DEF
        fc.integer({ min: 0, max: 100 }), // HP
        (atk, def, hp) => {
          const cp = calculateCombatPower(atk, def, hp);
          
          // Expected: ATK + 0.7 * DEF + 0.3 * (HP / 10)
          const expected = atk * COMBAT_POWER_COEFFICIENTS.atk 
            + def * COMBAT_POWER_COEFFICIENTS.def 
            + (hp / COMBAT_POWER_COEFFICIENTS.hpDivisor) * COMBAT_POWER_COEFFICIENTS.hp;
          
          // Allow small floating point tolerance
          return Math.abs(cp - expected) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Region Difficulty Formula
   * For any region at distance D, the difficulty SHALL equal 6 + 1.5 × D.
   * **Validates: Requirements 7.4**
   */
  it('Property 15: Region Difficulty Formula - DC follows exact formula', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // distance
        (distance) => {
          const dc = calculateRegionDifficulty(distance);
          
          // Expected: 6 + 1.5 * distance
          const expected = REGION_DIFFICULTY_BASE + REGION_DIFFICULTY_DISTANCE_COEFFICIENT * distance;
          
          return Math.abs(dc - expected) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Win probability is always between 0 and 1
   */
  it('Win probability is always between 0 and 1', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 200, noNaN: true }), // CP
        fc.double({ min: -100, max: 200, noNaN: true }), // DC
        (cp, dc) => {
          const prob = calculateWinProbability(cp, dc);
          return prob >= 0 && prob <= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Win probability is 0.5 when CP equals DC
   */
  it('Win probability is 0.5 when CP equals DC', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100, noNaN: true }), // value for both CP and DC
        (value) => {
          const prob = calculateWinProbability(value, value);
          return Math.abs(prob - 0.5) < 0.0001;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Win probability increases monotonically with CP
   */
  it('Win probability increases monotonically with CP', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 50, noNaN: true }), // CP1
        fc.double({ min: 0.1, max: 50, noNaN: true }), // delta (positive)
        fc.double({ min: 0, max: 100, noNaN: true }), // DC
        (cp1, delta, dc) => {
          const cp2 = cp1 + delta;
          const prob1 = calculateWinProbability(cp1, dc);
          const prob2 = calculateWinProbability(cp2, dc);
          
          // Higher CP should give higher or equal probability
          return prob2 >= prob1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
