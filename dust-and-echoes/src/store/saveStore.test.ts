/**
 * 存档系统测试
 * Save System Tests
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 * 
 * **Property 16: Save/Load Round Trip**
 * **Validates: Requirements 11.1, 11.2, 11.3**
 * 
 * Feature: dust-and-echoes, Property 16: Save/Load Round Trip
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  useSaveStore,
  serializeGameState,
  deserializeGameState,
  validateSaveData,
  exportSaveData,
  importSaveData,
  createEmptySaveData,
  SAVE_VERSION,
  SAVE_KEY,
  type SaveData,
} from './saveStore';
import type { 
  Phase, 
  BonfireIntensity, 
  JobId, 
  ResourceId, 
  BuildingId,
} from '../types';

// Create localStorage mock
let localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    localStorageStore = {};
  }),
  get length() {
    return Object.keys(localStorageStore).length;
  },
  key: vi.fn((index: number) => Object.keys(localStorageStore)[index] || null),
};

// Setup global mocks
vi.stubGlobal('localStorage', localStorageMock);

describe('Save System', () => {
  beforeEach(() => {
    localStorageStore = {};
    vi.clearAllMocks();
    useSaveStore.getState().resetSaveState();
  });

  afterEach(() => {
    useSaveStore.getState().stopAutoSave();
  });

  describe('Serialization - Requirements: 11.2', () => {
    it('should serialize game state to JSON string', () => {
      const saveData = createEmptySaveData();
      const jsonString = serializeGameState(saveData);
      
      expect(typeof jsonString).toBe('string');
      expect(jsonString.length).toBeGreaterThan(0);
      
      // Should be valid JSON
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    it('should preserve all data fields during serialization', () => {
      const saveData = createEmptySaveData();
      saveData.time = { day: 5, phase: 'afternoon', phaseAU: 1.0 };
      saveData.morale = 3;
      saveData.populationCap = 10;
      
      const jsonString = serializeGameState(saveData);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.time.day).toBe(5);
      expect(parsed.time.phase).toBe('afternoon');
      expect(parsed.morale).toBe(3);
      expect(parsed.populationCap).toBe(10);
    });
  });

  describe('Deserialization - Requirements: 11.3', () => {
    it('should deserialize valid JSON string to game state', () => {
      const saveData = createEmptySaveData();
      const jsonString = serializeGameState(saveData);
      
      const result = deserializeGameState(jsonString);
      
      expect(result).not.toBeNull();
      expect(result?.version).toBe(SAVE_VERSION);
    });

    it('should return null for invalid JSON', () => {
      const result = deserializeGameState('not valid json');
      expect(result).toBeNull();
    });

    it('should return null for incomplete save data', () => {
      const result = deserializeGameState('{"foo": "bar"}');
      expect(result).toBeNull();
    });
  });

  describe('Validation - Requirements: 11.3', () => {
    it('should validate correct save data structure', () => {
      const saveData = createEmptySaveData();
      expect(validateSaveData(saveData)).toBe(true);
    });

    it('should reject null data', () => {
      expect(validateSaveData(null)).toBe(false);
    });

    it('should reject data without version', () => {
      const data = { ...createEmptySaveData() };
      delete (data as Partial<SaveData>).version;
      expect(validateSaveData(data)).toBe(false);
    });

    it('should reject data without timestamp', () => {
      const data = { ...createEmptySaveData() };
      delete (data as Partial<SaveData>).timestamp;
      expect(validateSaveData(data)).toBe(false);
    });

    it('should reject data without time', () => {
      const data = { ...createEmptySaveData() };
      delete (data as Partial<SaveData>).time;
      expect(validateSaveData(data)).toBe(false);
    });

    it('should reject data without resources', () => {
      const data = { ...createEmptySaveData() };
      delete (data as Partial<SaveData>).resources;
      expect(validateSaveData(data)).toBe(false);
    });

    it('should reject data without workers array', () => {
      const data = { ...createEmptySaveData() };
      (data as { workers: unknown }).workers = 'not an array';
      expect(validateSaveData(data)).toBe(false);
    });
  });

  describe('Round Trip - Property 16 (Unit Test)', () => {
    it('should produce equivalent state after serialize/deserialize', () => {
      // Create a save with various data
      const original = createEmptySaveData();
      original.time = { day: 10, phase: 'evening', phaseAU: 1.0 };
      original.morale = 2;
      original.populationCap = 8;
      original.workers = [
        {
          id: 'worker_1',
          name: 'Test Worker',
          health: 85,
          job: 'scavenger',
          statuses: [],
          equipment: {},
        },
      ];
      original.researchedTechs = ['basic_division', 'simple_storage'];
      
      // Serialize and deserialize
      const jsonString = serializeGameState(original);
      const restored = deserializeGameState(jsonString);
      
      // Verify equivalence
      expect(restored).not.toBeNull();
      expect(restored?.time.day).toBe(original.time.day);
      expect(restored?.time.phase).toBe(original.time.phase);
      expect(restored?.morale).toBe(original.morale);
      expect(restored?.populationCap).toBe(original.populationCap);
      expect(restored?.workers.length).toBe(original.workers.length);
      expect(restored?.workers[0]?.name).toBe(original.workers[0]?.name);
      expect(restored?.researchedTechs).toEqual(original.researchedTechs);
    });
  });

  describe('Export/Import - Requirements: 11.5', () => {
    it('should export save data to Base64 string', () => {
      const saveData = createEmptySaveData();
      const exported = exportSaveData(saveData);
      
      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
    });

    it('should import save data from Base64 string', () => {
      const original = createEmptySaveData();
      original.time.day = 15;
      
      const exported = exportSaveData(original);
      const imported = importSaveData(exported);
      
      expect(imported).not.toBeNull();
      expect(imported?.time.day).toBe(15);
    });

    it('should return null for invalid Base64 string', () => {
      const result = importSaveData('not valid base64!!!');
      expect(result).toBeNull();
    });
  });

  describe('Save Store Operations', () => {
    const createCollectStateFn = () => {
      return () => createEmptySaveData();
    };

    it('should save game to localStorage', () => {
      const store = useSaveStore.getState();
      const collectFn = createCollectStateFn();
      
      const result = store.saveGame(collectFn);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SAVE_KEY,
        expect.any(String)
      );
      // Get updated state after save
      expect(useSaveStore.getState().lastSaveTime).not.toBeNull();
    });

    it('should load game from localStorage', () => {
      // First save
      const saveData = createEmptySaveData();
      saveData.time.day = 20;
      localStorageStore[SAVE_KEY] = serializeGameState(saveData);
      
      const store = useSaveStore.getState();
      const result = store.loadGame();
      
      expect(result).not.toBeNull();
      expect(result?.time.day).toBe(20);
    });

    it('should return null when no save exists', () => {
      const store = useSaveStore.getState();
      const result = store.loadGame();
      
      expect(result).toBeNull();
    });

    it('should check if save exists', () => {
      const store = useSaveStore.getState();
      
      expect(store.hasSave()).toBe(false);
      
      localStorageStore[SAVE_KEY] = serializeGameState(createEmptySaveData());
      
      expect(store.hasSave()).toBe(true);
    });

    it('should delete save from localStorage', () => {
      localStorageStore[SAVE_KEY] = serializeGameState(createEmptySaveData());
      
      const store = useSaveStore.getState();
      const result = store.deleteSave();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(SAVE_KEY);
    });
  });

  describe('Auto Save - Requirements: 11.1', () => {
    it('should start auto save with interval', () => {
      vi.useFakeTimers();
      
      const store = useSaveStore.getState();
      const collectFn = () => createEmptySaveData();
      
      store.startAutoSave(collectFn);
      
      expect(useSaveStore.getState().autoSaveIntervalId).not.toBeNull();
      
      // Advance time by 10 seconds
      vi.advanceTimersByTime(10000);
      
      // Should have saved
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      store.stopAutoSave();
      vi.useRealTimers();
    });

    it('should stop auto save', () => {
      vi.useFakeTimers();
      
      const store = useSaveStore.getState();
      const collectFn = () => createEmptySaveData();
      
      store.startAutoSave(collectFn);
      
      store.stopAutoSave();
      
      expect(useSaveStore.getState().autoSaveIntervalId).toBeNull();
      
      vi.useRealTimers();
    });

    it('should respect autoSaveEnabled setting', () => {
      vi.useFakeTimers();
      
      const store = useSaveStore.getState();
      store.setAutoSaveEnabled(false);
      
      const collectFn = () => createEmptySaveData();
      store.startAutoSave(collectFn);
      
      // Should not start when disabled
      expect(useSaveStore.getState().autoSaveIntervalId).toBeNull();
      
      vi.useRealTimers();
    });
  });

  describe('Export/Import via Store', () => {
    it('should export save via store', () => {
      const store = useSaveStore.getState();
      const collectFn = () => {
        const data = createEmptySaveData();
        data.time.day = 25;
        return data;
      };
      
      const exported = store.exportSave(collectFn);
      
      expect(exported).not.toBeNull();
      expect(typeof exported).toBe('string');
    });

    it('should import save via store', () => {
      const original = createEmptySaveData();
      original.time.day = 30;
      const exported = exportSaveData(original);
      
      const store = useSaveStore.getState();
      const imported = store.importSave(exported);
      
      expect(imported).not.toBeNull();
      expect(imported?.time.day).toBe(30);
    });

    it('should handle import errors gracefully', () => {
      const store = useSaveStore.getState();
      const result = store.importSave('invalid data');
      
      expect(result).toBeNull();
      expect(useSaveStore.getState().loadError).not.toBeNull();
    });
  });
});


// ============================================
// Property 16: Save/Load Round Trip
// **Validates: Requirements 11.1, 11.2, 11.3**
// Feature: dust-and-echoes, Property 16: Save/Load Round Trip
// ============================================

/**
 * Property-Based Tests for Save/Load Round Trip
 * 
 * For any valid game state, serializing to JSON and deserializing 
 * SHALL produce an equivalent game state.
 */
describe('Property 16: Save/Load Round Trip (Property-Based)', () => {
  // Arbitraries for generating valid game state components
  const phaseArb: fc.Arbitrary<Phase> = fc.constantFrom(
    'dawn', 'morning', 'noon', 'afternoon', 'evening', 'midnight'
  );

  const PHASE_AU_MAP: Record<Phase, number> = {
    dawn: 0.5,
    morning: 1.0,
    noon: 0.5,
    afternoon: 1.0,
    evening: 1.0,
    midnight: 1.0,
  };

  const bonfireIntensityArb: fc.Arbitrary<BonfireIntensity> = fc.constantFrom(
    'off', 'low', 'medium', 'high'
  );

  const jobIdArb: fc.Arbitrary<JobId> = fc.constantFrom(
    'scavenger', 'water_collector', 'hunter', 'engineer', 'guard', 'scout', 'researcher'
  );

  const resourceIdArb: fc.Arbitrary<ResourceId> = fc.constantFrom(
    'scrap', 'water', 'dirty_water', 'food', 'raw_meat', 'canned_food', 'vegetables',
    'seeds', 'fertilizer', 'wood', 'metal', 'cloth', 'leather', 'plastic', 'glass',
    'rubber', 'wire', 'rope', 'duct_tape', 'gear', 'pipe', 'spring', 'bearing',
    'fasteners', 'solvent', 'acid', 'gunpowder', 'fuel', 'battery_cell', 'battery_pack',
    'filter', 'seal_ring', 'meds', 'data_tape', 'radio_parts', 'solar_cell',
    'rare_alloy', 'microchips', 'nanofiber', 'power_core'
  );

  const buildingIdArb: fc.Arbitrary<BuildingId> = fc.constantFrom(
    'bonfire', 'shelter', 'warehouse', 'workshop', 'radio_tower',
    'water_collector', 'trap', 'scavenge_post', 'greenhouse', 'research_desk',
    'generator', 'solar_panel', 'battery_bank', 'training_ground', 'map_room',
    'vanguard_camp'
  );

  // TimeState with correct phaseAU mapping
  const timeStateArb = fc.record({
    day: fc.integer({ min: 1, max: 1000 }),
    phase: phaseArb,
  }).map(({ day, phase }) => ({
    day,
    phase,
    phaseAU: PHASE_AU_MAP[phase],
  }));

  // Worker with empty statuses to avoid type issues
  const workerArb = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 30 }),
    health: fc.integer({ min: 0, max: 100 }),
    job: fc.option(jobIdArb, { nil: null }),
  }).map(w => ({
    id: w.id,
    name: w.name,
    health: w.health,
    job: w.job,
    statuses: [],
    equipment: {},
  }));

  const resourcesArb = fc.dictionary(
    resourceIdArb,
    fc.integer({ min: 0, max: 10000 })
  ) as fc.Arbitrary<Record<ResourceId, number>>;

  const buildingInstanceArb = fc.record({
    level: fc.integer({ min: 0, max: 10 }),
    state: fc.constantFrom('idle', 'active') as fc.Arbitrary<'idle' | 'active'>,
  });

  const buildingsArb = fc.dictionary(
    buildingIdArb,
    buildingInstanceArb
  ) as fc.Arbitrary<Record<BuildingId, { level: number; state: 'idle' | 'active' }>>;

  const gameSettingsArb = fc.record({
    autoSaveInterval: fc.integer({ min: 5, max: 60 }),
    language: fc.constantFrom('zh', 'en') as fc.Arbitrary<'zh' | 'en'>,
    soundEnabled: fc.boolean(),
    musicEnabled: fc.boolean(),
  });

  // Generate a valid SaveData object by starting with empty and overriding
  const saveDataArb = fc.record({
    timestamp: fc.integer({ min: 0, max: Date.now() + 1000000 }),
    time: timeStateArb,
    resources: resourcesArb,
    resourceCaps: resourcesArb,
    buildings: buildingsArb,
    bonfireIntensity: bonfireIntensityArb,
    workers: fc.array(workerArb, { maxLength: 20 }),
    populationCap: fc.integer({ min: 2, max: 100 }),
    morale: fc.integer({ min: -5, max: 5 }),
    radioTowerLevel: fc.integer({ min: 0, max: 5 }),
    researchedTechs: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 20 }),
    currentResearch: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    researchProgress: fc.integer({ min: 0, max: 1000 }),
    settings: gameSettingsArb,
  }).map(partial => {
    const base = createEmptySaveData();
    return {
      ...base,
      version: SAVE_VERSION,
      timestamp: partial.timestamp,
      time: partial.time,
      resources: partial.resources,
      resourceCaps: partial.resourceCaps,
      buildings: partial.buildings,
      bonfireIntensity: partial.bonfireIntensity,
      workers: partial.workers,
      populationCap: partial.populationCap,
      morale: partial.morale,
      radioTowerLevel: partial.radioTowerLevel,
      researchedTechs: partial.researchedTechs,
      currentResearch: partial.currentResearch,
      researchProgress: partial.researchProgress,
      settings: partial.settings,
    } as SaveData;
  });

  /**
   * Property 16.1: JSON Serialization Round Trip
   * For any valid game state, serializing to JSON and deserializing SHALL produce an equivalent game state.
   */
  it('should produce equivalent state after serialize/deserialize round trip (100 iterations)', () => {
    fc.assert(
      fc.property(saveDataArb, (originalSaveData) => {
        // Serialize to JSON
        const jsonString = serializeGameState(originalSaveData);
        
        // Deserialize back
        const restoredSaveData = deserializeGameState(jsonString);
        
        // Verify restoration succeeded
        expect(restoredSaveData).not.toBeNull();
        
        // Verify core fields are equivalent
        expect(restoredSaveData!.version).toBe(originalSaveData.version);
        expect(restoredSaveData!.timestamp).toBe(originalSaveData.timestamp);
        expect(restoredSaveData!.time).toEqual(originalSaveData.time);
        expect(restoredSaveData!.resources).toEqual(originalSaveData.resources);
        expect(restoredSaveData!.resourceCaps).toEqual(originalSaveData.resourceCaps);
        expect(restoredSaveData!.buildings).toEqual(originalSaveData.buildings);
        expect(restoredSaveData!.bonfireIntensity).toBe(originalSaveData.bonfireIntensity);
        expect(restoredSaveData!.workers).toEqual(originalSaveData.workers);
        expect(restoredSaveData!.populationCap).toBe(originalSaveData.populationCap);
        expect(restoredSaveData!.morale).toBe(originalSaveData.morale);
        expect(restoredSaveData!.researchedTechs).toEqual(originalSaveData.researchedTechs);
        expect(restoredSaveData!.currentResearch).toBe(originalSaveData.currentResearch);
        expect(restoredSaveData!.settings).toEqual(originalSaveData.settings);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16.2: Base64 Export/Import Round Trip
   * For any valid game state, exporting to Base64 and importing SHALL produce an equivalent game state.
   */
  it('should produce equivalent state after export/import round trip (100 iterations)', () => {
    fc.assert(
      fc.property(saveDataArb, (originalSaveData) => {
        // Export to Base64
        const exportedString = exportSaveData(originalSaveData);
        
        // Import back
        const importedSaveData = importSaveData(exportedString);
        
        // Verify import succeeded
        expect(importedSaveData).not.toBeNull();
        
        // Verify core fields are equivalent
        expect(importedSaveData!.version).toBe(originalSaveData.version);
        expect(importedSaveData!.timestamp).toBe(originalSaveData.timestamp);
        expect(importedSaveData!.time).toEqual(originalSaveData.time);
        expect(importedSaveData!.bonfireIntensity).toBe(originalSaveData.bonfireIntensity);
        expect(importedSaveData!.populationCap).toBe(originalSaveData.populationCap);
        expect(importedSaveData!.morale).toBe(originalSaveData.morale);
        expect(importedSaveData!.workers.length).toBe(originalSaveData.workers.length);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16.3: Validation Consistency
   * For any valid SaveData, validation SHALL return true after round trip.
   */
  it('should pass validation after round trip for any valid SaveData (100 iterations)', () => {
    fc.assert(
      fc.property(saveDataArb, (originalSaveData) => {
        // Serialize and deserialize
        const jsonString = serializeGameState(originalSaveData);
        const restoredSaveData = deserializeGameState(jsonString);
        
        // Validation must pass
        expect(validateSaveData(restoredSaveData)).toBe(true);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16.4: Double Round Trip Idempotence
   * For any valid SaveData, two consecutive round trips SHALL produce equivalent results.
   */
  it('should produce same result after double round trip (100 iterations)', () => {
    fc.assert(
      fc.property(saveDataArb, (originalSaveData) => {
        // First round trip
        const json1 = serializeGameState(originalSaveData);
        const restored1 = deserializeGameState(json1);
        
        // Second round trip
        const json2 = serializeGameState(restored1!);
        const restored2 = deserializeGameState(json2);
        
        // Both restored states must be equivalent
        expect(restored2!.version).toBe(restored1!.version);
        expect(restored2!.timestamp).toBe(restored1!.timestamp);
        expect(restored2!.time).toEqual(restored1!.time);
        expect(restored2!.resources).toEqual(restored1!.resources);
        expect(restored2!.workers.length).toBe(restored1!.workers.length);
        
        // JSON strings should be identical after first round trip
        expect(json2).toBe(json1);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
