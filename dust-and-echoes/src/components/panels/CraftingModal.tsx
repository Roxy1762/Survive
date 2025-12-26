/**
 * 制造菜单模态框组件
 * Crafting Menu Modal Component
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */

import { useState, useMemo, useCallback } from 'react';
import { useResourceStore } from '../../store/resourceStore';
import { useBuildingStore } from '../../store/buildingStore';
import { useCraftingStore } from '../../store/craftingStore';
import { useActionStore } from '../../store/actionStore';
import { useTimeStore } from '../../store/timeStore';
import { useEventStore } from '../../store/eventStore';
import { RECIPES, getRecipeById } from '../../config/recipes';
import { getResourceNameZh } from '../../config/resources';
import { Button } from '../common/Button';
import type { Recipe, ResourceId } from '../../types';

interface CraftingModalProps {
  onClose: () => void;
}

/** 配方卡片组件 */
function RecipeCard({
  recipe,
  resources,
  accumulatedWork,
  isSelected,
  onSelect,
}: {
  recipe: Recipe;
  resources: Record<ResourceId, number>;
  accumulatedWork: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  // 检查材料是否足够
  const hasEnoughMaterials = recipe.inputs.every(
    input => (resources[input.resourceId] ?? 0) >= input.amount
  );
  
  // 检查Work是否足够
  const hasEnoughWork = accumulatedWork >= recipe.workRequired;
  
  const canCraft = hasEnoughMaterials && hasEnoughWork;

  return (
    <div
      onClick={onSelect}
      className={`
        p-2 border cursor-pointer transition-colors
        ${isSelected 
          ? 'border-terminal-amber bg-terminal-amber/10' 
          : canCraft 
            ? 'border-terminal-amber/40 hover:border-terminal-amber/60' 
            : 'border-terminal-dim/30 opacity-60'
        }
      `}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold">{recipe.nameZh}</span>
        <span className="text-[10px] text-terminal-dim">
          {recipe.workRequired} Work
        </span>
      </div>
      
      {/* 产出 */}
      <div className="text-[10px] text-terminal-green mb-1">
        产出: {getResourceNameZh(recipe.output.resourceId)} ×{recipe.output.amount}
      </div>
      
      {/* 材料需求 */}
      <div className="text-[10px] space-y-0.5">
        {recipe.inputs.map(input => {
          const current = resources[input.resourceId] ?? 0;
          const enough = current >= input.amount;
          return (
            <div 
              key={input.resourceId}
              className={enough ? 'text-terminal-dim' : 'text-terminal-red'}
            >
              {getResourceNameZh(input.resourceId)}: {current}/{input.amount}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CraftingModal({ onClose }: CraftingModalProps) {
  const resources = useResourceStore(state => state.resources);
  const buildings = useBuildingStore(state => state.buildings);
  const accumulatedWork = useCraftingStore(state => state.accumulatedWork);
  const craftImmediate = useCraftingStore(state => state.craftImmediate);
  const canCraft = useCraftingStore(state => state.canCraft);
  const consumeResource = useResourceStore(state => state.consumeResource);
  const addResource = useResourceStore(state => state.addResource);
  const time = useTimeStore(state => state.time);
  const usedAU = useActionStore(state => state.usedAUThisPhase);
  const addActionMessage = useEventStore(state => state.addActionMessage);
  
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  // 获取工坊等级
  const workshopLevel = buildings['workshop']?.level ?? 0;
  
  // 获取可用配方列表
  const availableRecipes = useMemo(() => {
    if (workshopLevel <= 0) return [];
    return RECIPES;
  }, [workshopLevel]);
  
  // 获取选中的配方
  const selectedRecipe = selectedRecipeId ? getRecipeById(selectedRecipeId) : null;
  
  // 计算选中配方的总成本
  const totalCost = useMemo(() => {
    if (!selectedRecipe) return null;
    
    const materials = selectedRecipe.inputs.map(input => ({
      resourceId: input.resourceId,
      amount: input.amount * quantity,
      current: resources[input.resourceId] ?? 0,
    }));
    
    const workRequired = selectedRecipe.workRequired * quantity;
    
    return {
      materials,
      workRequired,
      outputAmount: selectedRecipe.output.amount * quantity,
    };
  }, [selectedRecipe, quantity, resources]);
  
  // 检查是否可以制造
  const craftValidation = useMemo(() => {
    if (!selectedRecipeId) return { canCraft: false, reason: '请选择配方' };
    return canCraft(selectedRecipeId, quantity, resources, workshopLevel);
  }, [selectedRecipeId, quantity, resources, workshopLevel, canCraft]);
  
  // 计算剩余AU
  const remainingAU = time.phaseAU - usedAU;
  const auCost = 1; // 制造行动消耗1 AU
  const hasEnoughAU = remainingAU >= auCost;
  
  // 处理确认制造
  const handleConfirmCraft = useCallback(() => {
    if (!selectedRecipe || !craftValidation.canCraft || !hasEnoughAU) return;
    
    // 消耗资源的回调
    const consumeResources = (inputs: { resourceId: ResourceId; amount: number }[]): boolean => {
      for (const { resourceId, amount } of inputs) {
        if ((resources[resourceId] ?? 0) < amount) {
          return false;
        }
      }
      for (const { resourceId, amount } of inputs) {
        consumeResource(resourceId, amount);
      }
      return true;
    };
    
    // 添加资源的回调
    const addResourceCallback = (resourceId: ResourceId, amount: number): number => {
      return addResource(resourceId, amount);
    };
    
    // 执行制造
    const result = craftImmediate(
      selectedRecipeId!,
      quantity,
      resources,
      workshopLevel,
      consumeResources,
      addResourceCallback
    );
    
    if (result.success) {
      // 消耗AU - 通过actionStore执行
      const actionStore = useActionStore.getState();
      const context = {
        day: time.day,
        phase: time.phase,
        phaseAU: time.phaseAU,
        resources,
        buildingLevels: { workshop: workshopLevel },
        researchedTechs: [],
        workerCount: 0,
        jobAssignments: {},
      };
      
      // 执行workshop_craft行动来消耗AU
      actionStore.executeAction(
        'workshop_craft',
        context,
        () => true, // 资源已经消耗
        () => {} // 资源已经添加
      );
      
      // 记录日志
      addActionMessage(
        `Crafted ${result.outputAmount} ${result.outputResourceId}`,
        `制造了 ${result.outputAmount} ${getResourceNameZh(result.outputResourceId!)}`,
        time.day,
        time.phase
      );
      
      onClose();
    } else {
      // 显示错误
      addActionMessage(
        `Crafting failed: ${result.reason}`,
        `制造失败: ${result.reason}`,
        time.day,
        time.phase
      );
    }
  }, [
    selectedRecipe, selectedRecipeId, quantity, craftValidation.canCraft, hasEnoughAU,
    resources, workshopLevel, craftImmediate, consumeResource, addResource,
    time, addActionMessage, onClose
  ]);
  
  // 如果没有工坊，显示提示
  if (workshopLevel <= 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-terminal-bg border border-terminal-amber/40 max-w-md w-full">
          <div className="px-3 py-2 border-b border-terminal-amber/20 flex justify-between items-center">
            <h3 className="text-sm font-bold text-terminal-amber">制造</h3>
            <button onClick={onClose} className="text-terminal-dim hover:text-terminal-amber">✕</button>
          </div>
          <div className="p-4 text-center text-terminal-dim">
            需要先建造工坊才能进行制造
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
      <div className="bg-terminal-bg border border-terminal-amber/40 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-3 py-2 border-b border-terminal-amber/20 flex justify-between items-center flex-shrink-0">
          <h3 className="text-sm font-bold text-terminal-amber">制造菜单</h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-terminal-dim">
              Work: <span className="text-terminal-green">{accumulatedWork.toFixed(0)}</span>
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
          {/* 配方列表 */}
          <div className="w-1/2 border-r border-terminal-amber/20 overflow-y-auto p-2">
            <div className="text-[10px] text-terminal-dim mb-2 uppercase tracking-wider">
              可用配方 ({availableRecipes.length})
            </div>
            <div className="space-y-2">
              {availableRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  resources={resources}
                  accumulatedWork={accumulatedWork}
                  isSelected={selectedRecipeId === recipe.id}
                  onSelect={() => {
                    setSelectedRecipeId(recipe.id);
                    setQuantity(1);
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* 配方详情 */}
          <div className="w-1/2 p-3 flex flex-col">
            {selectedRecipe && totalCost ? (
              <>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-terminal-amber mb-2">
                    {selectedRecipe.nameZh}
                  </h4>
                  
                  {/* 数量选择器 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-terminal-dim">数量:</span>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-6 h-6 border border-terminal-amber/40 text-terminal-amber hover:bg-terminal-amber/20"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-6 h-6 border border-terminal-amber/40 text-terminal-amber hover:bg-terminal-amber/20"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* 材料需求 */}
                  <div className="mb-3">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider mb-1">
                      所需材料
                    </div>
                    <div className="space-y-1">
                      {totalCost.materials.map(mat => {
                        const enough = mat.current >= mat.amount;
                        return (
                          <div 
                            key={mat.resourceId}
                            className={`text-xs flex justify-between ${enough ? 'text-terminal-text' : 'text-terminal-red'}`}
                          >
                            <span>{getResourceNameZh(mat.resourceId)}</span>
                            <span>{mat.current} / {mat.amount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Work需求 */}
                  <div className="mb-3">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider mb-1">
                      所需Work
                    </div>
                    <div className={`text-xs ${accumulatedWork >= totalCost.workRequired ? 'text-terminal-text' : 'text-terminal-red'}`}>
                      {accumulatedWork.toFixed(0)} / {totalCost.workRequired}
                    </div>
                  </div>
                  
                  {/* 产出预览 */}
                  <div className="mb-3">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider mb-1">
                      产出
                    </div>
                    <div className="text-xs text-terminal-green">
                      {getResourceNameZh(selectedRecipe.output.resourceId)} ×{totalCost.outputAmount}
                    </div>
                  </div>
                  
                  {/* AU消耗提示 */}
                  <div className="mb-3">
                    <div className="text-[10px] text-terminal-dim uppercase tracking-wider mb-1">
                      AU消耗
                    </div>
                    <div className={`text-xs ${hasEnoughAU ? 'text-terminal-text' : 'text-terminal-red'}`}>
                      {auCost} AU
                    </div>
                  </div>
                  
                  {/* 错误提示 */}
                  {!craftValidation.canCraft && (
                    <div className="text-[10px] text-terminal-red mb-2">
                      {craftValidation.reason}
                    </div>
                  )}
                  {!hasEnoughAU && (
                    <div className="text-[10px] text-terminal-red mb-2">
                      行动点不足
                    </div>
                  )}
                </div>
                
                {/* 确认按钮 */}
                <Button
                  onClick={handleConfirmCraft}
                  disabled={!craftValidation.canCraft || !hasEnoughAU}
                  variant={craftValidation.canCraft && hasEnoughAU ? 'primary' : 'secondary'}
                  fullWidth
                >
                  确认制造 ({auCost} AU)
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-terminal-dim text-sm">
                请从左侧选择配方
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CraftingModal;
