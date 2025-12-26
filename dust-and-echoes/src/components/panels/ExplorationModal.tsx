/**
 * 探索菜单模态框组件
 * Exploration Menu Modal Component
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
 */

import { useState, useMemo, useCallback } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import { useBuildingStore } from '../../store/buildingStore';
import { useExplorationStore } from '../../store/explorationStore';
import { usePopulationStore, canWorkerWork } from '../../store/populationStore';
import { useActionStore } from '../../store/actionStore';
import { useTimeStore } from '../../store/timeStore';
import { useEventStore } from '../../store/eventStore';
import { getResourceNameZh } from '../../config/resources';
import { getMaxExplorationDistance } from '../../config/exploration';
import { Button } from '../common/Button';
import type { MapNode, Worker, RegionTier } from '../../types';

interface ExplorationModalProps {
  onClose: () => void;
}

/** 获取区域层级中文名 */
function getTierNameZh(tier: RegionTier): string {
  const names: Record<RegionTier, string> = {
    T0: '基地',
    T1: '近郊',
    T2: '外环',
    T3: '危险区',
    T4: '高危设施',
    T5: '禁区核心',
  };
  return names[tier];
}

/** 获取节点状态中文名 */
function getNodeStateZh(state: string): string {
  const names: Record<string, string> = {
    undiscovered: '未发现',
    discovered: '已发现',
    explored: '已探索',
    cleared: '已清理',
  };
  return names[state] || state;
}

/** 节点卡片组件 */
function NodeCard({
  node,
  isSelected,
  isAccessible,
  onSelect,
}: {
  node: MapNode;
  isSelected: boolean;
  isAccessible: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={() => isAccessible && onSelect()}
      className={`
        p-2 border cursor-pointer transition-colors
        ${isSelected 
          ? 'border-terminal-amber bg-terminal-amber/10' 
          : isAccessible 
            ? 'border-terminal-amber/40 hover:border-terminal-amber/60' 
            : 'border-terminal-dim/30 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold">{node.nameZh}</span>
        <span className={`text-[10px] px-1 py-0.5 ${
          node.tier === 'T1' ? 'bg-terminal-green/20 text-terminal-green' :
          node.tier === 'T2' ? 'bg-terminal-amber/20 text-terminal-amber' :
          node.tier === 'T3' ? 'bg-orange-500/20 text-orange-400' :
          node.tier === 'T4' ? 'bg-terminal-red/20 text-terminal-red' :
          node.tier === 'T5' ? 'bg-purple-500/20 text-purple-400' :
          'bg-terminal-dim/20 text-terminal-dim'
        }`}>
          {getTierNameZh(node.tier)}
        </span>
      </div>
      
      <div className="text-[10px] text-terminal-dim space-y-0.5">
        <div className="flex justify-between">
          <span>距离:</span>
          <span>{node.distance} AU</span>
        </div>
        <div className="flex justify-between">
          <span>风险:</span>
          <span className={
            node.riskCoefficient < 0.2 ? 'text-terminal-green' :
            node.riskCoefficient < 0.5 ? 'text-terminal-amber' :
            'text-terminal-red'
          }>
            {(node.riskCoefficient * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>状态:</span>
          <span>{getNodeStateZh(node.state)}</span>
        </div>
      </div>
      
      {!isAccessible && (
        <div className="text-[10px] text-terminal-red mt-1">
          需要更高等级的无线电塔
        </div>
      )}
    </div>
  );
}

/** 工人选择卡片组件 */
function WorkerSelectCard({
  worker,
  isSelected,
  canSelect,
  onToggle,
}: {
  worker: Worker;
  isSelected: boolean;
  canSelect: boolean;
  onToggle: () => void;
}) {
  const canWork = canWorkerWork(worker);
  const selectable = canSelect && canWork;
  
  return (
    <div
      onClick={() => selectable && onToggle()}
      className={`
        p-2 border cursor-pointer transition-colors flex items-center gap-2
        ${isSelected 
          ? 'border-terminal-amber bg-terminal-amber/10' 
          : selectable 
            ? 'border-terminal-amber/40 hover:border-terminal-amber/60' 
            : 'border-terminal-dim/30 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => {}}
        disabled={!selectable}
        className="accent-terminal-amber"
      />
      <div className="flex-1">
        <div className="text-xs font-bold">{worker.name}</div>
        <div className="text-[10px] text-terminal-dim">
          健康: <span className={worker.health < 50 ? 'text-terminal-red' : 'text-terminal-green'}>
            {worker.health}%
          </span>
          {worker.job && <span className="ml-2">岗位: {worker.job}</span>}
        </div>
      </div>
      {!canWork && (
        <span className="text-[10px] text-terminal-red">
          {worker.health < 20 ? '健康过低' : '流血状态'}
        </span>
      )}
    </div>
  );
}

export function ExplorationModal({ onClose }: ExplorationModalProps) {
  const resources = useResourceStore(state => state.resources);
  const consumeResource = useResourceStore(state => state.consumeResource);
  const buildings = useBuildingStore(state => state.buildings);
  const workers = usePopulationStore(state => state.workers);
  const time = useTimeStore(state => state.time);
  const usedAU = useActionStore(state => state.usedAUThisPhase);
  const addActionMessage = useEventStore(state => state.addActionMessage);
  
  // Exploration store
  const mapNodes = useExplorationStore(state => state.mapNodes);
  const radioTowerLevel = useExplorationStore(state => state.radioTowerLevel);
  const activeExpedition = useExplorationStore(state => state.activeExpedition);
  const getExplorationPreview = useExplorationStore(state => state.getExplorationPreview);
  const startExpedition = useExplorationStore(state => state.startExpedition);
  const setRadioTowerLevel = useExplorationStore(state => state.setRadioTowerLevel);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  
  // Sync radio tower level from building store
  const actualRadioTowerLevel = buildings['radio_tower']?.level ?? 0;
  useMemo(() => {
    if (actualRadioTowerLevel !== radioTowerLevel) {
      setRadioTowerLevel(actualRadioTowerLevel);
    }
  }, [actualRadioTowerLevel, radioTowerLevel, setRadioTowerLevel]);
  
  // Get max exploration distance based on radio tower level
  // Requirements: 4.10 - No tower = T1 only
  const maxDistance = getMaxExplorationDistance(actualRadioTowerLevel);
  
  // Filter accessible nodes
  // Requirements: 4.2 - Display available nodes based on radio tower level
  const accessibleNodes = useMemo(() => {
    return mapNodes.filter(node => {
      if (node.id === 'base') return false; // Can't explore base
      return node.distance <= maxDistance;
    });
  }, [mapNodes, maxDistance]);
  
  // Get selected node
  const selectedNode = selectedNodeId 
    ? mapNodes.find(n => n.id === selectedNodeId) 
    : null;
  
  // Calculate exploration preview
  // Requirements: 4.3, 4.4 - Show node info and required supplies
  const explorationPreview = useMemo(() => {
    if (!selectedNode || selectedWorkerIds.length === 0) return null;
    return getExplorationPreview(selectedNode.id, selectedWorkerIds.length);
  }, [selectedNode, selectedWorkerIds.length, getExplorationPreview]);
  
  // Check if we have enough supplies
  const hasEnoughSupplies = useMemo(() => {
    if (!explorationPreview) return false;
    const waterNeeded = explorationPreview.suppliesNeeded.water;
    const foodNeeded = explorationPreview.suppliesNeeded.food;
    return (resources.water ?? 0) >= waterNeeded && (resources.food ?? 0) >= foodNeeded;
  }, [explorationPreview, resources]);
  
  // Check AU
  const remainingAU = time.phaseAU - usedAU;
  const auCost = 1;
  const hasEnoughAU = remainingAU >= auCost;
  
  // Check if expedition is already active
  const hasActiveExpedition = activeExpedition !== null;
  
  // Toggle worker selection
  const toggleWorkerSelection = useCallback((workerId: string) => {
    setSelectedWorkerIds(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  }, []);
  
  // Handle confirm exploration
  // Requirements: 4.6, 4.7 - Start expedition and consume supplies
  const handleConfirmExploration = useCallback(() => {
    if (!selectedNode || selectedWorkerIds.length === 0 || !explorationPreview) return;
    if (!hasEnoughSupplies || !hasEnoughAU || hasActiveExpedition) return;
    
    const { water: waterNeeded, food: foodNeeded } = explorationPreview.suppliesNeeded;
    
    // Consume supplies
    consumeResource('water', waterNeeded);
    consumeResource('food', foodNeeded);
    
    // Start expedition
    const expedition = startExpedition(
      selectedNode.id,
      selectedWorkerIds,
      time.day,
      time.phase,
      { water: waterNeeded, food: foodNeeded }
    );
    
    if (expedition) {
      // Consume AU
      const actionStore = useActionStore.getState();
      const context = {
        day: time.day,
        phase: time.phase,
        phaseAU: time.phaseAU,
        resources,
        buildingLevels: {},
        researchedTechs: [],
        workerCount: workers.length,
        jobAssignments: {},
      };
      
      actionStore.executeAction(
        'explore',
        context,
        () => true,
        () => {}
      );
      
      addActionMessage(
        `Started expedition to ${selectedNode.name}`,
        `派遣探险队前往 ${selectedNode.nameZh}`,
        time.day,
        time.phase
      );
      
      onClose();
    } else {
      addActionMessage(
        'Failed to start expedition',
        '探索失败：无法派遣探险队',
        time.day,
        time.phase
      );
    }
  }, [
    selectedNode, selectedWorkerIds, explorationPreview, hasEnoughSupplies, 
    hasEnoughAU, hasActiveExpedition, consumeResource, startExpedition,
    time, resources, workers.length, addActionMessage, onClose
  ]);
  
  // If there's an active expedition, show its status
  if (hasActiveExpedition) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-terminal-bg border border-terminal-amber/40 max-w-md w-full">
          <div className="px-3 py-2 border-b border-terminal-amber/20 flex justify-between items-center">
            <h3 className="text-sm font-bold text-terminal-amber">探索</h3>
            <button onClick={onClose} className="text-terminal-dim hover:text-terminal-amber">✕</button>
          </div>
          <div className="p-4">
            <div className="text-center text-terminal-amber mb-2">探险队正在执行任务</div>
            <div className="text-xs text-terminal-dim space-y-1">
              <div>目标: {mapNodes.find(n => n.id === activeExpedition.targetNodeId)?.nameZh}</div>
              <div>状态: {activeExpedition.status === 'traveling' ? '前往中' : 
                         activeExpedition.status === 'exploring' ? '探索中' :
                         activeExpedition.status === 'returning' ? '返回中' : '已完成'}</div>
              <div>队员: {activeExpedition.workerIds.length} 人</div>
            </div>
          </div>
          <div className="p-3 border-t border-terminal-amber/20">
            <Button onClick={onClose} variant="secondary" fullWidth>关闭</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-terminal-bg border border-terminal-amber/40 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 py-2 border-b border-terminal-amber/20 flex justify-between items-center flex-shrink-0">
          <h3 className="text-sm font-bold text-terminal-amber">探索菜单</h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-terminal-dim">
              电塔等级: <span className="text-terminal-amber">{actualRadioTowerLevel}</span>
              {actualRadioTowerLevel === 0 && <span className="text-terminal-red ml-1">(仅T1可探索)</span>}
            </span>
            <span className="text-[10px] text-terminal-dim">
              AU: <span className={remainingAU >= auCost ? 'text-terminal-green' : 'text-terminal-red'}>
                {remainingAU.toFixed(1)}
              </span>/{time.phaseAU}
            </span>
            <button onClick={onClose} className="text-terminal-dim hover:text-terminal-amber">✕</button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Node list */}
          <div className="w-1/3 border-r border-terminal-amber/20 overflow-y-auto p-2">
            <div className="text-[10px] text-terminal-dim mb-2 uppercase tracking-wider">
              可探索区域 ({accessibleNodes.length})
            </div>
            <div className="space-y-2">
              {accessibleNodes.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isAccessible={node.distance <= maxDistance}
                  onSelect={() => setSelectedNodeId(node.id)}
                />
              ))}
              {accessibleNodes.length === 0 && (
                <div className="text-xs text-terminal-dim text-center py-4">
                  没有可探索的区域
                </div>
              )}
            </div>
          </div>
          
          {/* Worker selection */}
          <div className="w-1/3 border-r border-terminal-amber/20 overflow-y-auto p-2">
            <div className="text-[10px] text-terminal-dim mb-2 uppercase tracking-wider">
              选择队员 ({selectedWorkerIds.length})
            </div>
            <div className="space-y-2">
              {workers.map(worker => (
                <WorkerSelectCard
                  key={worker.id}
                  worker={worker}
                  isSelected={selectedWorkerIds.includes(worker.id)}
                  canSelect={true}
                  onToggle={() => toggleWorkerSelection(worker.id)}
                />
              ))}
              {workers.length === 0 && (
                <div className="text-xs text-terminal-dim text-center py-4">
                  没有可用的工人
                </div>
              )}
            </div>
          </div>
          
          {/* Preview panel */}
          <div className="w-1/3 p-3 flex flex-col">
            {selectedNode && explorationPreview ? (
              <>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-terminal-amber mb-2">
                    {selectedNode.nameZh}
                  </h4>
                  
                  {/* Node details */}
                  <div className="mb-3 space-y-1">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider">
                      目标信息
                    </div>
                    <div className="text-xs flex justify-between">
                      <span>层级:</span>
                      <span>{getTierNameZh(selectedNode.tier)}</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span>距离:</span>
                      <span>{selectedNode.distance} AU</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span>风险系数:</span>
                      <span className={
                        selectedNode.riskCoefficient < 0.2 ? 'text-terminal-green' :
                        selectedNode.riskCoefficient < 0.5 ? 'text-terminal-amber' :
                        'text-terminal-red'
                      }>
                        {(selectedNode.riskCoefficient * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Expedition preview */}
                  <div className="mb-3 space-y-1">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider">
                      探索预览
                    </div>
                    <div className="text-xs flex justify-between">
                      <span>预计时间:</span>
                      <span>{explorationPreview.totalTime} AU</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span>队员数量:</span>
                      <span>{selectedWorkerIds.length} 人</span>
                    </div>
                    <div className="text-xs flex justify-between">
                      <span>期望收益:</span>
                      <span className="text-terminal-green">~{explorationPreview.expectedLootValue.toFixed(0)} VU</span>
                    </div>
                  </div>
                  
                  {/* Supply requirements */}
                  <div className="mb-3 space-y-1">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider">
                      所需补给
                    </div>
                    <div className={`text-xs flex justify-between ${
                      (resources.water ?? 0) >= explorationPreview.suppliesNeeded.water 
                        ? 'text-terminal-text' : 'text-terminal-red'
                    }`}>
                      <span>{getResourceNameZh('water')}:</span>
                      <span>{resources.water ?? 0} / {explorationPreview.suppliesNeeded.water.toFixed(1)}</span>
                    </div>
                    <div className={`text-xs flex justify-between ${
                      (resources.food ?? 0) >= explorationPreview.suppliesNeeded.food 
                        ? 'text-terminal-text' : 'text-terminal-red'
                    }`}>
                      <span>{getResourceNameZh('food')}:</span>
                      <span>{resources.food ?? 0} / {explorationPreview.suppliesNeeded.food.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {/* AU cost */}
                  <div className="mb-3">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider mb-1">
                      AU消耗
                    </div>
                    <div className={`text-xs ${hasEnoughAU ? 'text-terminal-text' : 'text-terminal-red'}`}>
                      {auCost} AU
                    </div>
                  </div>
                  
                  {/* Error messages */}
                  {!hasEnoughSupplies && (
                    <div className="text-[10px] text-terminal-red mb-2">
                      补给不足
                    </div>
                  )}
                  {!hasEnoughAU && (
                    <div className="text-[10px] text-terminal-red mb-2">
                      行动点不足
                    </div>
                  )}
                  {selectedWorkerIds.length === 0 && (
                    <div className="text-[10px] text-terminal-red mb-2">
                      请选择至少一名队员
                    </div>
                  )}
                </div>
                
                {/* Confirm button */}
                <Button
                  onClick={handleConfirmExploration}
                  disabled={!hasEnoughSupplies || !hasEnoughAU || selectedWorkerIds.length === 0}
                  variant={hasEnoughSupplies && hasEnoughAU && selectedWorkerIds.length > 0 ? 'primary' : 'secondary'}
                  fullWidth
                >
                  确认探索 ({auCost} AU)
                </Button>
              </>
            ) : selectedNode ? (
              <div className="flex-1 flex items-center justify-center text-terminal-dim text-sm">
                请选择队员
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-terminal-dim text-sm">
                请从左侧选择探索目标
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExplorationModal;
