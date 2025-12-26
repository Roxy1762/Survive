/**
 * 操作区组件
 * Action Panel Component
 * 
 * Requirements: 10.1 - 当前可用行动按钮
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 * Requirements: 1.1, 1.2, 1.3, 1.5 - 行动系统执行
 */

import { useState, useCallback, useMemo } from 'react';
import { useTimeStore } from '../../store/timeStore';
import { useResourceStore } from '../../store/resourceStore';
import { useBuildingStore } from '../../store/buildingStore';
import { useActionStore, type ActionContext, type ResourceChange } from '../../store/actionStore';
import { usePopulationStore } from '../../store/populationStore';
import { useTechStore } from '../../store/techStore';
import { useEventStore } from '../../store/eventStore';
import { useGameStateStore } from '../../store/gameStateStore';
import { 
  ACTIONS, 
  canPerformActionInPhase,
  type ActionId,
  type ActionDefinition 
} from '../../config/actions';
import { BUILDINGS, getBuildingCost } from '../../config/buildings';
import { getAvailableTechnologies } from '../../config/technologies';
import { Button } from '../common/Button';
import { CraftingModal } from './CraftingModal';
import { ExplorationModal } from './ExplorationModal';
import { shouldAutoAdvance, performAutoAdvance } from '../../store/gameIntegration';
import type { Phase, BuildingId, ResourceId, ResourceAmount } from '../../types';

/** 行动分类 */
type ActionCategory = 'short' | 'production' | 'management' | 'exploration';

/** 行动分类配置 */
const ACTION_CATEGORIES: { id: ActionCategory; name: string; shortName: string; actions: ActionId[] }[] = [
  {
    id: 'short',
    name: '快速行动 (0.5 AU)',
    shortName: '快速',
    actions: ['organize_inventory', 'quick_scavenge', 'gather_wood', 'treat_wound', 'quick_cook', 'minor_repair', 'purify_small'],
  },
  {
    id: 'production',
    name: '生产行动 (1 AU)',
    shortName: '生产',
    actions: ['hunt', 'salvage', 'workshop_craft', 'batch_ammo'],
  },
  {
    id: 'management',
    name: '管理行动 (1 AU)',
    shortName: '管理',
    actions: ['build', 'assign_workers', 'research'],
  },
  {
    id: 'exploration',
    name: '探索行动 (1 AU)',
    shortName: '探索',
    actions: ['explore', 'trade'],
  },
];

interface ActionButtonProps {
  action: ActionDefinition;
  isAvailable: boolean;
  isPhaseAllowed: boolean;
  onExecute: (actionId: ActionId) => void;
}

/** 获取行动的详细提示 */
function getActionTooltip(action: ActionDefinition, isAvailable: boolean, isPhaseAllowed: boolean): string {
  if (!isPhaseAllowed) {
    return '当前阶段不可用';
  }
  if (!isAvailable) {
    // 检查具体缺少什么
    if (action.requirements.buildings && action.requirements.buildings.length > 0) {
      const buildingReqs = action.requirements.buildings.map(b => `${b.buildingId} Lv.${b.minLevel}`).join(', ');
      return `需要建筑: ${buildingReqs}`;
    }
    if (action.requirements.resources && action.requirements.resources.length > 0) {
      const resourceReqs = action.requirements.resources.map(r => `${r.resourceId}×${r.amount}`).join(', ');
      return `需要资源: ${resourceReqs}`;
    }
    return '需求未满足';
  }
  
  // 为特定行动添加操作说明
  switch (action.id) {
    case 'build':
      return `${action.descriptionZh} - 点击选择要建造的建筑`;
    case 'research':
      return `${action.descriptionZh} - 点击选择要研究的科技`;
    case 'workshop_craft':
      return `${action.descriptionZh} - 需要工坊和工程师`;
    case 'explore':
      return `${action.descriptionZh} - T1近郊可直接探索，更远需要电塔`;
    case 'trade':
      return `${action.descriptionZh} - 需要无线电台联系商人`;
    case 'hunt':
      return `${action.descriptionZh} - 获取食物和生肉`;
    case 'quick_scavenge':
      return `${action.descriptionZh} - 获取2-4废料（可在任意阶段执行）`;
    case 'gather_wood':
      return `${action.descriptionZh} - 获取1-2木材（可在任意阶段执行）`;
    case 'purify_small':
      return `${action.descriptionZh} - 消耗2脏水获得1净水`;
    default:
      return action.descriptionZh;
  }
}

function ActionButton({ action, isAvailable, isPhaseAllowed, onExecute }: ActionButtonProps) {
  const disabled = !isAvailable || !isPhaseAllowed;
  const tooltip = getActionTooltip(action, isAvailable, isPhaseAllowed);

  return (
    <Button
      onClick={() => onExecute(action.id)}
      disabled={disabled}
      variant={disabled ? 'secondary' : 'primary'}
      size="sm"
      className="w-full text-left justify-start mb-1"
      title={tooltip}
    >
      <span className="flex items-center gap-2 w-full">
        <span className="text-[10px] sm:text-xs text-terminal-dim flex-shrink-0">{action.auCost}AU</span>
        <span className="truncate">{action.nameZh}</span>
      </span>
    </Button>
  );
}

interface ActionCategoryGroupProps {
  category: { id: ActionCategory; name: string; shortName: string; actions: ActionId[] };
  currentPhase: Phase;
  resources: Record<ResourceId, number>;
  buildingLevels: Partial<Record<BuildingId, number>>;
  onExecuteAction: (actionId: ActionId) => void;
}

function ActionCategoryGroup({ 
  category, 
  currentPhase, 
  resources, 
  buildingLevels,
  onExecuteAction 
}: ActionCategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 过滤出当前阶段可用的行动
  const availableActions = category.actions.filter(actionId => {
    const action = ACTIONS[actionId];
    return action !== undefined;
  });
  
  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 sm:mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center justify-between 
          text-[10px] sm:text-xs font-bold text-terminal-amber/70 uppercase tracking-wider 
          mb-1.5 sm:mb-2 
          hover:text-terminal-amber
          min-h-[32px] sm:min-h-0
          py-1 sm:py-0
        "
      >
        <span className="hidden sm:inline">{category.name}</span>
        <span className="sm:hidden">{category.shortName}</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      {isExpanded && (
        <div className="pl-1 sm:pl-2">
          {availableActions.map(actionId => {
            const action = ACTIONS[actionId];
            if (!action) return null;
            
            const isPhaseAllowed = canPerformActionInPhase(actionId, currentPhase);
            const isAvailable = checkActionRequirements(action, resources, buildingLevels);
            
            return (
              <ActionButton
                key={actionId}
                action={action}
                isAvailable={isAvailable}
                isPhaseAllowed={isPhaseAllowed}
                onExecute={onExecuteAction}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * 检查行动需求是否满足
 */
function checkActionRequirements(
  action: ActionDefinition,
  resources: Record<ResourceId, number>,
  buildingLevels: Partial<Record<BuildingId, number>>
): boolean {
  const { requirements } = action;
  
  // 检查资源需求
  if (requirements.resources) {
    for (const req of requirements.resources) {
      if ((resources[req.resourceId] ?? 0) < req.amount) {
        return false;
      }
    }
  }
  
  // 检查建筑需求
  if (requirements.buildings) {
    for (const req of requirements.buildings) {
      const level = buildingLevels[req.buildingId as BuildingId] ?? 0;
      if (level < req.minLevel) {
        return false;
      }
    }
  }
  
  return true;
}

interface ActionPanelProps {
  onEndPhase?: () => void;
  className?: string;
}

/** 建造选择模态框 */
function BuildModal({ 
  onClose, 
  onBuild 
}: { 
  onClose: () => void; 
  onBuild: (buildingId: BuildingId) => void;
}) {
  const resources = useResourceStore(state => state.resources);
  const buildings = useBuildingStore(state => state.buildings);
  const researchedTechs = useTechStore(state => state.researched);
  
  // 获取可建造的建筑列表
  const buildableBuildings = useMemo(() => {
    return (Object.keys(BUILDINGS) as BuildingId[]).map(buildingId => {
      const building = BUILDINGS[buildingId];
      const currentLevel = buildings[buildingId]?.level ?? 0;
      const targetLevel = currentLevel + 1;
      
      // 检查是否已达最大等级
      if (targetLevel > building.maxLevel) {
        return { buildingId, building, currentLevel, targetLevel, canBuild: false, reason: '已达最大等级', cost: null };
      }
      
      // 检查科技前置
      if (building.unlockTech && !researchedTechs.includes(building.unlockTech)) {
        return { buildingId, building, currentLevel, targetLevel, canBuild: false, reason: `需要科技: ${building.unlockTech}`, cost: null };
      }
      
      // 获取成本
      const cost = getBuildingCost(buildingId, targetLevel);
      if (!cost) {
        return { buildingId, building, currentLevel, targetLevel, canBuild: false, reason: '无法获取成本', cost: null };
      }
      
      // 检查资源
      let canAfford = true;
      let missingResource = '';
      for (const { resourceId, amount } of cost.resources) {
        if ((resources[resourceId] ?? 0) < amount) {
          canAfford = false;
          missingResource = resourceId;
          break;
        }
      }
      
      if (!canAfford) {
        return { buildingId, building, currentLevel, targetLevel, canBuild: false, reason: `资源不足: ${missingResource}`, cost };
      }
      
      return { buildingId, building, currentLevel, targetLevel, canBuild: true, reason: null, cost };
    });
  }, [buildings, resources, researchedTechs]);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-terminal-bg border border-terminal-amber/40 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-terminal-amber/20 flex justify-between items-center">
          <h3 className="text-sm font-bold text-terminal-amber">选择建筑</h3>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-amber">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {buildableBuildings.map(({ buildingId, building, currentLevel, targetLevel, canBuild, reason, cost }) => (
            <div 
              key={buildingId}
              className={`p-2 border ${canBuild ? 'border-terminal-amber/40 hover:border-terminal-amber' : 'border-terminal-dim/30 opacity-60'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold">{building.nameZh}</span>
                <span className="text-[10px] text-terminal-dim">
                  Lv.{currentLevel} → Lv.{targetLevel}
                </span>
              </div>
              {cost && (
                <div className="text-[10px] text-terminal-dim mb-1">
                  成本: {cost.resources.map(r => `${r.resourceId}×${r.amount}`).join(', ')}
                </div>
              )}
              {!canBuild && reason && (
                <div className="text-[10px] text-terminal-red mb-1">{reason}</div>
              )}
              <Button
                onClick={() => canBuild && onBuild(buildingId)}
                disabled={!canBuild}
                variant={canBuild ? 'primary' : 'secondary'}
                size="sm"
                fullWidth
              >
                建造
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 研究选择模态框 */
function ResearchModal({ 
  onClose, 
  onResearch 
}: { 
  onClose: () => void; 
  onResearch: (techId: string) => void;
}) {
  const resources = useResourceStore(state => state.resources);
  const researchedTechs = useTechStore(state => state.researched);
  const currentResearch = useTechStore(state => state.current);
  const progress = useTechStore(state => state.progress);
  
  // 获取可研究的科技列表
  const availableTechs = useMemo(() => {
    return getAvailableTechnologies(researchedTechs).map(tech => {
      // 检查材料成本
      let canAfford = true;
      let missingResource = '';
      if (tech.materialCost) {
        for (const { resourceId, amount } of tech.materialCost) {
          if ((resources[resourceId as ResourceId] ?? 0) < amount) {
            canAfford = false;
            missingResource = resourceId;
            break;
          }
        }
      }
      
      return { tech, canAfford, missingResource };
    });
  }, [researchedTechs, resources]);
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-terminal-bg border border-terminal-amber/40 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-terminal-amber/20 flex justify-between items-center">
          <h3 className="text-sm font-bold text-terminal-amber">选择研究</h3>
          <button onClick={onClose} className="text-terminal-dim hover:text-terminal-amber">✕</button>
        </div>
        
        {/* 当前研究进度 */}
        {currentResearch && (
          <div className="px-3 py-2 bg-terminal-amber/10 border-b border-terminal-amber/20">
            <div className="text-xs mb-1">正在研究: {currentResearch}</div>
            <div className="w-full bg-terminal-dim/30 h-2">
              <div 
                className="bg-terminal-amber h-full" 
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="text-[10px] text-terminal-dim mt-1">进度: {progress.toFixed(0)} RP</div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {availableTechs.length === 0 ? (
            <div className="text-center text-terminal-dim text-xs py-4">
              暂无可研究的科技
            </div>
          ) : (
            availableTechs.map(({ tech, canAfford, missingResource }) => (
              <div 
                key={tech.id}
                className={`p-2 border ${canAfford ? 'border-terminal-amber/40 hover:border-terminal-amber' : 'border-terminal-dim/30 opacity-60'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold">{tech.nameZh}</span>
                  <span className="text-[10px] text-terminal-dim">{tech.rpCost} RP</span>
                </div>
                {tech.materialCost && tech.materialCost.length > 0 && (
                  <div className="text-[10px] text-terminal-dim mb-1">
                    材料: {tech.materialCost.map(r => `${r.resourceId}×${r.amount}`).join(', ')}
                  </div>
                )}
                {!canAfford && (
                  <div className="text-[10px] text-terminal-red mb-1">资源不足: {missingResource}</div>
                )}
                <Button
                  onClick={() => canAfford && onResearch(tech.id)}
                  disabled={!canAfford || currentResearch === tech.id}
                  variant={canAfford ? 'primary' : 'secondary'}
                  size="sm"
                  fullWidth
                >
                  {currentResearch === tech.id ? '研究中' : '开始研究'}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function ActionPanel({ onEndPhase, className = '' }: ActionPanelProps) {
  const time = useTimeStore(state => state.time);
  const resources = useResourceStore(state => state.resources);
  const buildings = useBuildingStore(state => state.buildings);
  const lastActionResult = useActionStore(state => state.lastActionResult);
  const usedAU = useActionStore(state => state.usedAUThisPhase);
  
  // Auto-advance state - Requirements: 5.4
  const autoAdvanceEnabled = useGameStateStore(state => state.autoAdvanceEnabled);
  const toggleAutoAdvance = useGameStateStore(state => state.toggleAutoAdvance);
  
  // Modal states
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showCraftingModal, setShowCraftingModal] = useState(false);
  const [showExplorationModal, setShowExplorationModal] = useState(false);
  
  // Import action execution function
  const executeAction = useActionStore(state => state.executeAction);
  
  // Import resource operations
  const consumeResource = useResourceStore(state => state.consumeResource);
  const addResource = useResourceStore(state => state.addResource);
  
  // Import building operations
  const buildWithResources = useBuildingStore(state => state.buildWithResources);
  
  // Import tech operations
  const startResearch = useTechStore(state => state.startResearch);
  
  // Import population data for context
  const workers = usePopulationStore(state => state.workers);
  const jobs = usePopulationStore(state => state.jobs);
  
  // Import tech data for context
  const researchedTechs = useTechStore(state => state.researched);
  
  // Import event store for logging
  const addActionMessage = useEventStore(state => state.addActionMessage);
  
  // 转换建筑状态为等级映射 (memoized to prevent unnecessary re-renders)
  const buildingLevels = useMemo(() => {
    const levels: Partial<Record<BuildingId, number>> = {};
    for (const [id, instance] of Object.entries(buildings)) {
      levels[id as BuildingId] = instance.level;
    }
    return levels;
  }, [buildings]);
  
  /**
   * Build ActionContext from current game state
   * Requirements: 1.1, 1.2 - Provide context for action execution
   */
  const buildActionContext = useCallback((): ActionContext => {
    // Convert jobs to jobAssignments format
    const jobAssignments: Record<string, string[]> = {};
    for (const [jobId, workerIds] of Object.entries(jobs)) {
      jobAssignments[jobId] = workerIds;
    }
    
    return {
      day: time.day,
      phase: time.phase,
      phaseAU: time.phaseAU,
      resources: resources,
      buildingLevels: buildingLevels,
      researchedTechs: researchedTechs,
      workerCount: workers.length,
      jobAssignments: jobAssignments,
    };
  }, [time.day, time.phase, time.phaseAU, resources, buildingLevels, researchedTechs, workers.length, jobs]);
  
  /**
   * Consume resources callback for action execution
   * Requirements: 1.5 - Consume resources upon execution
   */
  const handleConsumeResources = useCallback((changes: ResourceChange[]): boolean => {
    // Check if all resources can be consumed
    for (const change of changes) {
      if (change.amount < 0) {
        const required = Math.abs(change.amount);
        if (resources[change.resourceId] < required) {
          return false;
        }
      }
    }
    
    // Consume resources
    for (const change of changes) {
      if (change.amount < 0) {
        consumeResource(change.resourceId, Math.abs(change.amount));
      }
    }
    
    return true;
  }, [resources, consumeResource]);
  
  /**
   * Add resources callback for action execution
   * Requirements: 1.2 - Update resources after action
   */
  const handleAddResources = useCallback((changes: ResourceChange[]): void => {
    for (const change of changes) {
      if (change.amount > 0) {
        addResource(change.resourceId, change.amount);
      }
    }
  }, [addResource]);
  
  /**
   * Execute action handler
   * Requirements: 1.1 - Execute action logic when button clicked
   * Requirements: 1.2 - Update resources and display results
   * Requirements: 1.3 - Display failure reason on validation failure
   * Requirements: 3.1 - Open crafting modal when clicking craft action (no AU consumed)
   */
  const handleExecuteAction = useCallback((actionId: ActionId) => {
    // Intercept 'build' action to show modal
    if (actionId === 'build') {
      setShowBuildModal(true);
      return;
    }
    
    // Intercept 'research' action to show modal
    if (actionId === 'research') {
      setShowResearchModal(true);
      return;
    }
    
    // Intercept 'workshop_craft' action to show crafting modal
    // Requirements: 3.1 - Open crafting menu without consuming AU
    if (actionId === 'workshop_craft') {
      setShowCraftingModal(true);
      return;
    }
    
    // Intercept 'explore' action to show exploration modal
    // Requirements: 4.1 - Open exploration menu without consuming AU
    if (actionId === 'explore') {
      setShowExplorationModal(true);
      return;
    }
    
    const context = buildActionContext();
    
    // Execute the action through actionStore
    const result = executeAction(
      actionId,
      context,
      handleConsumeResources,
      handleAddResources
    );
    
    // Log the result to event log
    // Requirements: 1.2 - Display results in event log
    // Requirements: 1.3 - Display failure reason
    if (result.success) {
      addActionMessage(
        result.message,
        result.messageZh,
        time.day,
        time.phase
      );
      
      // Check for auto-advance after successful action
      // Requirements: 5.2, 5.3 - Auto-advance when AU depleted
      const actionStore = useActionStore.getState();
      const remainingAU = time.phaseAU - actionStore.usedAUThisPhase;
      if (shouldAutoAdvance(remainingAU)) {
        // Delay auto-advance slightly to allow UI to update
        setTimeout(() => {
          performAutoAdvance();
        }, 100);
      }
    } else {
      // Log failure with error prefix
      addActionMessage(
        `Action failed: ${result.message}`,
        `行动失败: ${result.messageZh}`,
        time.day,
        time.phase
      );
    }
  }, [buildActionContext, executeAction, handleConsumeResources, handleAddResources, addActionMessage, time.day, time.phase, time.phaseAU]);
  
  /**
   * Handle building construction
   * Consumes resources and AU, then builds the building
   */
  const handleBuild = useCallback((buildingId: BuildingId) => {
    const context = buildActionContext();
    const action = ACTIONS['build'];
    
    // Check AU availability
    const remainingAU = context.phaseAU - usedAU;
    if (remainingAU < action.auCost) {
      addActionMessage(
        `Not enough AU (need ${action.auCost}, have ${remainingAU.toFixed(1)})`,
        `行动点不足（需要 ${action.auCost}，剩余 ${remainingAU.toFixed(1)}）`,
        time.day,
        time.phase
      );
      setShowBuildModal(false);
      return;
    }
    
    // Consume resources callback for building
    const consumeBuildingResources = (costs: ResourceAmount[]): boolean => {
      for (const { resourceId, amount } of costs) {
        if ((resources[resourceId] ?? 0) < amount) {
          return false;
        }
      }
      for (const { resourceId, amount } of costs) {
        consumeResource(resourceId, amount);
      }
      return true;
    };
    
    // Build the building
    const result = buildWithResources(
      buildingId,
      resources,
      consumeBuildingResources,
      researchedTechs
    );
    
    if (result.success) {
      // Manually consume AU by executing a dummy action that just tracks AU
      // We need to update usedAUThisPhase in actionStore
      const actionStore = useActionStore.getState();
      actionStore.executeAction(
        'build',
        context,
        () => true, // Resources already consumed
        () => {} // No resources to add
      );
      
      const building = BUILDINGS[buildingId];
      addActionMessage(
        `Built ${building.name}`,
        `建造了 ${building.nameZh}`,
        time.day,
        time.phase
      );
      
      // Check for auto-advance after successful build
      // Requirements: 5.2, 5.3 - Auto-advance when AU depleted
      const newRemainingAU = context.phaseAU - actionStore.usedAUThisPhase;
      if (shouldAutoAdvance(newRemainingAU)) {
        setTimeout(() => {
          performAutoAdvance();
        }, 100);
      }
    } else {
      addActionMessage(
        `Build failed: ${result.reason}`,
        `建造失败: ${result.reason}`,
        time.day,
        time.phase
      );
    }
    
    setShowBuildModal(false);
  }, [buildActionContext, usedAU, resources, researchedTechs, buildWithResources, consumeResource, addActionMessage, time.day, time.phase]);
  
  /**
   * Handle technology research
   * Consumes materials and AU, then starts research
   */
  const handleResearch = useCallback((techId: string) => {
    const context = buildActionContext();
    const action = ACTIONS['research'];
    
    // Check AU availability
    const remainingAU = context.phaseAU - usedAU;
    if (remainingAU < action.auCost) {
      addActionMessage(
        `Not enough AU (need ${action.auCost}, have ${remainingAU.toFixed(1)})`,
        `行动点不足（需要 ${action.auCost}，剩余 ${remainingAU.toFixed(1)}）`,
        time.day,
        time.phase
      );
      setShowResearchModal(false);
      return;
    }
    
    // Start research
    const success = startResearch(techId);
    
    if (success) {
      // Consume AU by executing the action
      const actionStore = useActionStore.getState();
      actionStore.executeAction(
        'research',
        context,
        () => true, // No resource consumption for starting research
        () => {}
      );
      
      addActionMessage(
        `Started research: ${techId}`,
        `开始研究: ${techId}`,
        time.day,
        time.phase
      );
      
      // Check for auto-advance after successful research
      // Requirements: 5.2, 5.3 - Auto-advance when AU depleted
      const newRemainingAU = context.phaseAU - actionStore.usedAUThisPhase;
      if (shouldAutoAdvance(newRemainingAU)) {
        setTimeout(() => {
          performAutoAdvance();
        }, 100);
      }
    } else {
      addActionMessage(
        `Research failed: Cannot start research`,
        `研究失败: 无法开始研究`,
        time.day,
        time.phase
      );
    }
    
    setShowResearchModal(false);
  }, [buildActionContext, usedAU, startResearch, addActionMessage, time.day, time.phase]);
  
  const handleEndPhase = () => {
    if (onEndPhase) {
      onEndPhase();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 建造模态框 */}
      {showBuildModal && (
        <BuildModal 
          onClose={() => setShowBuildModal(false)} 
          onBuild={handleBuild} 
        />
      )}
      
      {/* 研究模态框 */}
      {showResearchModal && (
        <ResearchModal 
          onClose={() => setShowResearchModal(false)} 
          onResearch={handleResearch} 
        />
      )}
      
      {/* 制造模态框 */}
      {showCraftingModal && (
        <CraftingModal 
          onClose={() => setShowCraftingModal(false)} 
        />
      )}
      
      {/* 探索模态框 */}
      {showExplorationModal && (
        <ExplorationModal 
          onClose={() => setShowExplorationModal(false)} 
        />
      )}
      
      {/* 标题栏 */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-b border-terminal-amber/20 flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-terminal-amber/80">
          可用行动
        </h2>
        <span className="text-[10px] sm:text-xs text-terminal-dim">
          <span className="hidden xs:inline">{getPhaseNameZh(time.phase)} - </span>
          <span className={`${(time.phaseAU - usedAU) <= 0 ? 'text-terminal-red' : 'text-terminal-green'}`}>
            {(time.phaseAU - usedAU).toFixed(1)}
          </span>
          /{time.phaseAU} AU
        </span>
      </div>
      
      {/* 行动列表 */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 overscroll-contain">
        {ACTION_CATEGORIES.map(category => (
          <ActionCategoryGroup
            key={category.id}
            category={category}
            currentPhase={time.phase}
            resources={resources}
            buildingLevels={buildingLevels}
            onExecuteAction={handleExecuteAction}
          />
        ))}
      </div>
      
      {/* 最近行动结果 */}
      {lastActionResult && (
        <div className={`px-2 sm:px-3 py-1.5 sm:py-2 border-t border-terminal-amber/20 text-xs ${
          lastActionResult.success ? 'text-terminal-green' : 'text-terminal-red'
        }`}>
          {lastActionResult.messageZh}
        </div>
      )}
      
      {/* 结束阶段按钮和自动进阶设置 */}
      <div className="p-2 sm:p-3 border-t border-terminal-amber/20">
        {/* 自动进阶开关 - Requirements: 5.4 */}
        <div className="flex items-center justify-between mb-2">
          <label 
            htmlFor="auto-advance-toggle"
            className="text-xs text-terminal-dim cursor-pointer"
          >
            自动进阶
          </label>
          <button
            id="auto-advance-toggle"
            onClick={toggleAutoAdvance}
            className={`
              w-10 h-5 rounded-full relative transition-colors
              ${autoAdvanceEnabled 
                ? 'bg-terminal-amber/60' 
                : 'bg-terminal-dim/30'
              }
            `}
            title={autoAdvanceEnabled ? '自动进阶已开启：AU耗尽时自动进入下一阶段' : '自动进阶已关闭：需手动点击结束阶段'}
          >
            <span 
              className={`
                absolute top-0.5 w-4 h-4 rounded-full bg-terminal-amber transition-all
                ${autoAdvanceEnabled ? 'left-5' : 'left-0.5'}
              `}
            />
          </button>
        </div>
        <Button
          onClick={handleEndPhase}
          variant="primary"
          size="md"
          fullWidth
        >
          结束阶段 →
        </Button>
      </div>
    </div>
  );
}

/** 获取阶段中文名 */
function getPhaseNameZh(phase: Phase): string {
  const names: Record<Phase, string> = {
    dawn: '清晨',
    morning: '上午',
    noon: '中午',
    afternoon: '下午',
    evening: '傍晚',
    midnight: '午夜',
  };
  return names[phase];
}

export default ActionPanel;
