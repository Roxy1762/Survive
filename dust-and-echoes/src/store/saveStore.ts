/**
 * 存档系统状态管理
 * Save System State Management
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { create } from 'zustand';
import type { 
  TimeState,
  ResourceId,
  BuildingId,
  BuildingInstance,
  BonfireIntensity,
  Worker,
  JobId,
  MapNode,
  Expedition,
  Outpost,
  Trader,
  CombatState,
  EventLogEntry,
  GameSettings,
} from '../types';
import type { EquipmentInstance } from '../config/equipment';
import type { CraftingTask } from './craftingStore';
import type { TemporaryEffect } from './medicalStore';
import type { PendingEvent } from './eventStore';
import type { DifficultyLevel } from './gameStateStore';

// ============================================
// 存档版本
// Save Version
// ============================================

/** 当前存档版本 */
export const SAVE_VERSION = 1;

/** 存档键名 */
export const SAVE_KEY = 'dust_and_echoes_save';

/** 自动存档间隔（毫秒） */
export const AUTO_SAVE_INTERVAL = 10000; // 10秒

// ============================================
// 存档数据结构
// Save Data Structure
// ============================================

/** 完整游戏存档数据 */
export interface SaveData {
  // 元数据
  version: number;
  timestamp: number;
  
  // 难度和场景设置 - Requirements: 6.6
  difficulty: DifficultyLevel;
  scenario: string;
  
  // 自动进阶设置 - Requirements: 5.7
  autoAdvanceEnabled: boolean;
  
  // 时间状态
  time: TimeState;
  
  // 资源状态
  resources: Record<ResourceId, number>;
  resourceCaps: Record<ResourceId, number>;
  
  // 建筑状态
  buildings: Record<BuildingId, BuildingInstance>;
  bonfireIntensity: BonfireIntensity;
  
  // 人口状态
  workers: Worker[];
  populationCap: number;
  morale: number;
  jobs: Record<JobId, string[]>;
  buildingLevels: Partial<Record<BuildingId, number>>;
  
  // 装备状态
  equipment: EquipmentInstance[];
  
  // 制造状态
  craftingTask: CraftingTask | null;
  craftingTaskHistory: CraftingTask[];
  accumulatedWork: number;
  
  // 医疗状态
  temporaryEffects: Record<string, TemporaryEffect[]>;
  medicalMorale: number;
  
  // 战斗状态
  activeCombat: CombatState | null;
  
  // 探索状态
  mapNodes: MapNode[];
  activeExpedition: Expedition | null;
  outposts: Outpost[];
  radioTowerLevel: number;
  
  // 科技状态
  researchedTechs: string[];
  currentResearch: string | null;
  researchProgress: number;
  
  // 贸易状态
  activeTraders: Trader[];
  
  // 事件状态
  eventLog: EventLogEntry[];
  eventCooldowns: Record<string, number>;
  triggeredNonRepeatableEvents: string[];
  pendingEvent: PendingEvent | null;
  
  // 游戏设置
  settings: GameSettings;
}

// ============================================
// 序列化/反序列化函数
// Serialization/Deserialization Functions
// ============================================

/**
 * 将游戏状态序列化为JSON字符串
 * Requirements: 11.2
 */
export function serializeGameState(saveData: SaveData): string {
  return JSON.stringify(saveData);
}

/**
 * 将JSON字符串反序列化为游戏状态
 * Requirements: 11.3
 */
export function deserializeGameState(jsonString: string): SaveData | null {
  try {
    const data = JSON.parse(jsonString) as SaveData;
    
    // 验证基本结构
    if (!validateSaveData(data)) {
      console.error('Invalid save data structure');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to parse save data:', error);
    return null;
  }
}

/**
 * 验证存档数据完整性
 * Requirements: 11.3
 */
export function validateSaveData(data: unknown): data is SaveData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const save = data as Partial<SaveData>;
  
  // 检查必需字段
  if (typeof save.version !== 'number') return false;
  if (typeof save.timestamp !== 'number') return false;
  if (!save.time || typeof save.time.day !== 'number') return false;
  if (!save.resources || typeof save.resources !== 'object') return false;
  if (!save.buildings || typeof save.buildings !== 'object') return false;
  if (!Array.isArray(save.workers)) return false;
  
  return true;
}

/**
 * 迁移旧版本存档到新版本
 */
export function migrateSaveData(data: SaveData): SaveData {
  // 当前只有版本1，无需迁移
  // 未来版本升级时在此添加迁移逻辑
  return data;
}

// ============================================
// localStorage 操作
// localStorage Operations
// ============================================

/**
 * 保存到localStorage
 * Requirements: 11.1
 */
export function saveToLocalStorage(saveData: SaveData): boolean {
  try {
    const jsonString = serializeGameState(saveData);
    localStorage.setItem(SAVE_KEY, jsonString);
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * 从localStorage加载
 * Requirements: 11.1
 */
export function loadFromLocalStorage(): SaveData | null {
  try {
    const jsonString = localStorage.getItem(SAVE_KEY);
    if (!jsonString) {
      return null;
    }
    
    const data = deserializeGameState(jsonString);
    if (!data) {
      return null;
    }
    
    // 版本迁移
    if (data.version < SAVE_VERSION) {
      return migrateSaveData(data);
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * 删除localStorage中的存档
 */
export function deleteFromLocalStorage(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete from localStorage:', error);
    return false;
  }
}

/**
 * 检查是否存在存档
 */
export function hasSaveInLocalStorage(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

// ============================================
// 导出/导入功能
// Export/Import Functions
// Requirements: 11.5
// ============================================

/**
 * 导出存档为Base64字符串
 */
export function exportSaveData(saveData: SaveData): string {
  const jsonString = serializeGameState(saveData);
  // 使用Base64编码以便于复制粘贴
  return btoa(encodeURIComponent(jsonString));
}

/**
 * 从Base64字符串导入存档
 */
export function importSaveData(exportedString: string): SaveData | null {
  try {
    const jsonString = decodeURIComponent(atob(exportedString));
    return deserializeGameState(jsonString);
  } catch (error) {
    console.error('Failed to import save data:', error);
    return null;
  }
}

/**
 * 下载存档文件
 */
export function downloadSaveFile(saveData: SaveData, filename?: string): void {
  const jsonString = serializeGameState(saveData);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `dust_echoes_save_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 从文件读取存档
 */
export function readSaveFile(file: File): Promise<SaveData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        resolve(deserializeGameState(content));
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => {
      resolve(null);
    };
    reader.readAsText(file);
  });
}


// ============================================
// 存档Store接口
// Save Store Interface
// ============================================

interface SaveStore {
  // 状态
  lastSaveTime: number | null;
  autoSaveEnabled: boolean;
  autoSaveIntervalId: number | null;
  isSaving: boolean;
  isLoading: boolean;
  saveError: string | null;
  loadError: string | null;
  
  // 存档操作
  /** 手动保存游戏 - Requirements: 11.4 */
  saveGame: (collectStateFn: () => SaveData) => boolean;
  /** 加载游戏 - Requirements: 11.4 */
  loadGame: () => SaveData | null;
  /** 检查是否有存档 */
  hasSave: () => boolean;
  /** 删除存档 */
  deleteSave: () => boolean;
  
  // 自动存档 - Requirements: 11.1
  /** 启动自动存档 */
  startAutoSave: (collectStateFn: () => SaveData) => void;
  /** 停止自动存档 */
  stopAutoSave: () => void;
  /** 设置自动存档开关 */
  setAutoSaveEnabled: (enabled: boolean) => void;
  
  // 导出/导入 - Requirements: 11.5
  /** 导出存档为字符串 */
  exportSave: (collectStateFn: () => SaveData) => string | null;
  /** 从字符串导入存档 */
  importSave: (exportedString: string) => SaveData | null;
  /** 下载存档文件 */
  downloadSave: (collectStateFn: () => SaveData) => void;
  /** 从文件导入存档 */
  importFromFile: (file: File) => Promise<SaveData | null>;
  
  // 状态查询
  /** 获取上次保存时间 */
  getLastSaveTime: () => number | null;
  /** 获取保存错误 */
  getSaveError: () => string | null;
  /** 获取加载错误 */
  getLoadError: () => string | null;
  
  // 重置
  /** 重置存档状态 */
  resetSaveState: () => void;
}

/**
 * 存档状态Store
 */
export const useSaveStore = create<SaveStore>((set, get) => ({
  // 初始状态
  lastSaveTime: null,
  autoSaveEnabled: true,
  autoSaveIntervalId: null,
  isSaving: false,
  isLoading: false,
  saveError: null,
  loadError: null,
  
  // ============================================
  // 存档操作
  // ============================================
  
  saveGame: (collectStateFn: () => SaveData): boolean => {
    set({ isSaving: true, saveError: null });
    
    try {
      const saveData = collectStateFn();
      saveData.timestamp = Date.now();
      saveData.version = SAVE_VERSION;
      
      const success = saveToLocalStorage(saveData);
      
      if (success) {
        set({ 
          lastSaveTime: saveData.timestamp,
          isSaving: false,
        });
        return true;
      } else {
        set({ 
          saveError: '保存失败',
          isSaving: false,
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      set({ 
        saveError: errorMessage,
        isSaving: false,
      });
      return false;
    }
  },
  
  loadGame: (): SaveData | null => {
    set({ isLoading: true, loadError: null });
    
    try {
      const saveData = loadFromLocalStorage();
      
      if (saveData) {
        set({ 
          lastSaveTime: saveData.timestamp,
          isLoading: false,
        });
        return saveData;
      } else {
        set({ 
          loadError: '没有找到存档或存档已损坏',
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      set({ 
        loadError: errorMessage,
        isLoading: false,
      });
      return null;
    }
  },
  
  hasSave: (): boolean => {
    return hasSaveInLocalStorage();
  },
  
  deleteSave: (): boolean => {
    const success = deleteFromLocalStorage();
    if (success) {
      set({ lastSaveTime: null });
    }
    return success;
  },
  
  // ============================================
  // 自动存档
  // Requirements: 11.1 - 每10秒保存到localStorage
  // ============================================
  
  startAutoSave: (collectStateFn: () => SaveData): void => {
    const state = get();
    
    // 如果已有定时器，先停止
    if (state.autoSaveIntervalId !== null) {
      state.stopAutoSave();
    }
    
    if (!state.autoSaveEnabled) {
      return;
    }
    
    // 启动定时器 (使用globalThis以兼容Node和浏览器环境)
    const intervalId = (typeof globalThis !== 'undefined' ? globalThis : window).setInterval(() => {
      const currentState = get();
      if (currentState.autoSaveEnabled && !currentState.isSaving) {
        currentState.saveGame(collectStateFn);
      }
    }, AUTO_SAVE_INTERVAL);
    
    set({ autoSaveIntervalId: intervalId as unknown as number });
  },
  
  stopAutoSave: (): void => {
    const state = get();
    if (state.autoSaveIntervalId !== null) {
      (typeof globalThis !== 'undefined' ? globalThis : window).clearInterval(state.autoSaveIntervalId);
      set({ autoSaveIntervalId: null });
    }
  },
  
  setAutoSaveEnabled: (enabled: boolean): void => {
    set({ autoSaveEnabled: enabled });
    
    if (!enabled) {
      get().stopAutoSave();
    }
  },
  
  // ============================================
  // 导出/导入
  // Requirements: 11.5
  // ============================================
  
  exportSave: (collectStateFn: () => SaveData): string | null => {
    try {
      const saveData = collectStateFn();
      saveData.timestamp = Date.now();
      saveData.version = SAVE_VERSION;
      return exportSaveData(saveData);
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  },
  
  importSave: (exportedString: string): SaveData | null => {
    set({ isLoading: true, loadError: null });
    
    try {
      const saveData = importSaveData(exportedString);
      
      if (saveData) {
        set({ isLoading: false });
        return saveData;
      } else {
        set({ 
          loadError: '导入失败：无效的存档数据',
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      set({ 
        loadError: errorMessage,
        isLoading: false,
      });
      return null;
    }
  },
  
  downloadSave: (collectStateFn: () => SaveData): void => {
    try {
      const saveData = collectStateFn();
      saveData.timestamp = Date.now();
      saveData.version = SAVE_VERSION;
      downloadSaveFile(saveData);
    } catch (error) {
      console.error('Failed to download save:', error);
    }
  },
  
  importFromFile: async (file: File): Promise<SaveData | null> => {
    set({ isLoading: true, loadError: null });
    
    try {
      const saveData = await readSaveFile(file);
      
      if (saveData) {
        set({ isLoading: false });
        return saveData;
      } else {
        set({ 
          loadError: '导入失败：无效的存档文件',
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      set({ 
        loadError: errorMessage,
        isLoading: false,
      });
      return null;
    }
  },
  
  // ============================================
  // 状态查询
  // ============================================
  
  getLastSaveTime: (): number | null => {
    return get().lastSaveTime;
  },
  
  getSaveError: (): string | null => {
    return get().saveError;
  },
  
  getLoadError: (): string | null => {
    return get().loadError;
  },
  
  // ============================================
  // 重置
  // ============================================
  
  resetSaveState: (): void => {
    const state = get();
    state.stopAutoSave();
    
    set({
      lastSaveTime: null,
      autoSaveEnabled: true,
      autoSaveIntervalId: null,
      isSaving: false,
      isLoading: false,
      saveError: null,
      loadError: null,
    });
  },
}));

// ============================================
// 默认游戏设置
// Default Game Settings
// ============================================

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  autoSaveInterval: AUTO_SAVE_INTERVAL / 1000, // 转换为秒
  language: 'zh',
  soundEnabled: true,
  musicEnabled: true,
};

// ============================================
// 创建空白存档数据
// Create Empty Save Data
// ============================================

export function createEmptySaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    difficulty: 'normal',
    scenario: 'lone_survivor',
    autoAdvanceEnabled: false, // Default to disabled - Requirements: 5.5, 5.7
    time: { day: 1, phase: 'dawn', phaseAU: 0.5 },
    resources: {} as Record<ResourceId, number>,
    resourceCaps: {} as Record<ResourceId, number>,
    buildings: {} as Record<BuildingId, BuildingInstance>,
    bonfireIntensity: 'off',
    workers: [],
    populationCap: 2,
    morale: 0,
    jobs: {
      scavenger: [],
      water_collector: [],
      hunter: [],
      engineer: [],
      guard: [],
      scout: [],
      researcher: [],
    },
    buildingLevels: {},
    equipment: [],
    craftingTask: null,
    craftingTaskHistory: [],
    accumulatedWork: 0,
    temporaryEffects: {},
    medicalMorale: 0,
    activeCombat: null,
    mapNodes: [],
    activeExpedition: null,
    outposts: [],
    radioTowerLevel: 0,
    researchedTechs: [],
    currentResearch: null,
    researchProgress: 0,
    activeTraders: [],
    eventLog: [],
    eventCooldowns: {},
    triggeredNonRepeatableEvents: [],
    pendingEvent: null,
    settings: DEFAULT_GAME_SETTINGS,
  };
}
