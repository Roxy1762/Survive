/**
 * 详情面板组件
 * Details Panel Component
 * 
 * 显示建筑、人口、装备等详细信息
 * Requirements: 10.6 - 响应式设计，适配PC和移动端
 * Requirements: 2.1, 2.3 - 存档导入导出UI
 * Requirements: 2.1, 2.4, 2.7, 2.8 - 工人分配界面
 */

import { useState } from 'react';
import { usePopulationStore, canWorkerWork, CANNOT_WORK_HEALTH_THRESHOLD } from '../../store/populationStore';
import { useBuildingStore } from '../../store/buildingStore';
import { useTechStore } from '../../store/techStore';
import { useEquipmentStore } from '../../store/equipmentStore';
import { BUILDINGS } from '../../config/buildings';
import { getEquipmentConfig } from '../../config/equipment';
import type { Worker, JobId, BuildingId } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { SaveExportUI } from '../SaveExportUI';

/** 详情面板标签页 */
type DetailTab = 'population' | 'buildings' | 'inventory' | 'tech' | 'settings';

/** 岗位中文名 */
const JOB_NAMES_ZH: Record<JobId, string> = {
  scavenger: '拾荒者',
  water_collector: '集水者',
  hunter: '猎人',
  engineer: '工程师',
  guard: '守卫',
  scout: '斥候',
  researcher: '研究员',
};

/** 岗位对应的建筑 */
const JOB_BUILDING_MAP: Partial<Record<JobId, BuildingId>> = {
  water_collector: 'water_collector',
  hunter: 'trap',
  scavenger: 'scavenge_post',
  engineer: 'workshop',
  researcher: 'research_desk',
  guard: 'training_ground',
  scout: 'training_ground',
};

interface WorkerItemProps {
  worker: Worker;
  onAssignJob: (workerId: string, jobId: JobId | null) => void;
  availableJobs: { jobId: JobId; available: boolean; reason?: string }[];
}

function WorkerItem({ worker, onAssignJob, availableJobs }: WorkerItemProps) {
  const [showJobSelect, setShowJobSelect] = useState(false);
  const healthColor = worker.health > 50 
    ? 'green' 
    : worker.health > 20 
      ? 'amber' 
      : 'red';
  
  const jobNameZh = worker.job ? JOB_NAMES_ZH[worker.job] : '空闲';
  const canWork = canWorkerWork(worker);
  const hasBleed = worker.statuses.some(s => s.type === 'bleed');
  
  // Determine why worker can't work
  let disabledReason = '';
  if (!canWork) {
    if (worker.health < CANNOT_WORK_HEALTH_THRESHOLD) {
      disabledReason = `健康过低 (${worker.health}/${CANNOT_WORK_HEALTH_THRESHOLD})`;
    } else if (hasBleed) {
      disabledReason = '流血状态';
    }
  }

  const handleJobSelect = (jobId: JobId | null) => {
    onAssignJob(worker.id, jobId);
    setShowJobSelect(false);
  };

  return (
    <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 border border-terminal-amber/20">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs sm:text-sm font-bold truncate mr-2">{worker.name}</span>
        <button
          onClick={() => setShowJobSelect(!showJobSelect)}
          disabled={!canWork}
          className={`text-[10px] sm:text-xs px-1.5 py-0.5 border transition-colors flex-shrink-0 ${
            canWork 
              ? 'border-terminal-amber/40 text-terminal-amber/70 hover:text-terminal-amber hover:border-terminal-amber cursor-pointer'
              : 'border-terminal-red/40 text-terminal-red/50 cursor-not-allowed'
          }`}
          title={disabledReason || '点击分配岗位'}
        >
          {jobNameZh}
        </button>
      </div>
      
      <ProgressBar
        value={worker.health}
        max={100}
        label="健康"
        color={healthColor}
        size="sm"
      />
      
      {worker.statuses.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {worker.statuses.map((status, idx) => (
            <span 
              key={idx}
              className="px-1 text-[10px] sm:text-xs bg-terminal-red/20 text-terminal-red"
            >
              {getStatusNameZh(status.type)}
            </span>
          ))}
        </div>
      )}
      
      {!canWork && disabledReason && (
        <div className="mt-1 text-[10px] text-terminal-red/70">
          ⚠ 无法工作: {disabledReason}
        </div>
      )}
      
      {/* Job selection dropdown */}
      {showJobSelect && canWork && (
        <div className="mt-2 p-1.5 bg-terminal-bg border border-terminal-amber/30">
          <div className="text-[10px] text-terminal-amber/60 mb-1">选择岗位:</div>
          <div className="space-y-1">
            {/* Idle option */}
            <button
              onClick={() => handleJobSelect(null)}
              className={`w-full text-left px-1.5 py-0.5 text-[10px] sm:text-xs transition-colors ${
                worker.job === null
                  ? 'bg-terminal-amber/20 text-terminal-amber'
                  : 'text-terminal-dim hover:text-terminal-amber hover:bg-terminal-amber/10'
              }`}
            >
              空闲
            </button>
            {/* Job options */}
            {availableJobs.map(({ jobId, available, reason }) => (
              <button
                key={jobId}
                onClick={() => available && handleJobSelect(jobId)}
                disabled={!available}
                className={`w-full text-left px-1.5 py-0.5 text-[10px] sm:text-xs transition-colors ${
                  worker.job === jobId
                    ? 'bg-terminal-amber/20 text-terminal-amber'
                    : available
                      ? 'text-terminal-dim hover:text-terminal-amber hover:bg-terminal-amber/10'
                      : 'text-terminal-dim/50 cursor-not-allowed'
                }`}
                title={reason || ''}
              >
                {JOB_NAMES_ZH[jobId]}
                {!available && reason && <span className="ml-1 text-terminal-red/50">({reason})</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PopulationTab() {
  const workers = usePopulationStore(state => state.workers);
  const populationCap = usePopulationStore(state => state.populationCap);
  const morale = usePopulationStore(state => state.morale);
  const jobs = usePopulationStore(state => state.jobs);
  const assignJob = usePopulationStore(state => state.assignJob);
  const getJobMaxSlots = usePopulationStore(state => state.getJobMaxSlots);
  const isJobFull = usePopulationStore(state => state.isJobFull);
  const buildingLevels = usePopulationStore(state => state.buildingLevels);

  // 统计各岗位人数
  const jobCounts = Object.entries(jobs).reduce((acc, [jobId, workerIds]) => {
    acc[jobId as JobId] = workerIds.length;
    return acc;
  }, {} as Record<JobId, number>);

  // Calculate available jobs for each worker
  const getAvailableJobs = (): { jobId: JobId; available: boolean; reason?: string }[] => {
    const allJobs: JobId[] = ['scavenger', 'water_collector', 'hunter', 'engineer', 'guard', 'scout', 'researcher'];
    
    return allJobs.map(jobId => {
      const maxSlots = getJobMaxSlots(jobId);
      const currentCount = jobCounts[jobId] ?? 0;
      const buildingId = JOB_BUILDING_MAP[jobId];
      const buildingLevel = buildingId ? (buildingLevels[buildingId] ?? 0) : 0;
      
      // Check if building is built
      if (buildingId && buildingLevel === 0) {
        const buildingName = BUILDINGS[buildingId]?.nameZh ?? buildingId;
        return { jobId, available: false, reason: `需建造${buildingName}` };
      }
      
      // Check if job is full
      if (maxSlots !== Infinity && currentCount >= maxSlots) {
        return { jobId, available: false, reason: '已满' };
      }
      
      return { jobId, available: true };
    });
  };

  const handleAssignJob = (workerId: string, jobId: JobId | null) => {
    assignJob(workerId, jobId);
  };

  const availableJobs = getAvailableJobs();

  return (
    <div>
      {/* 人口概览 */}
      <div className="mb-3 sm:mb-4 p-1.5 sm:p-2 bg-terminal-amber/5 border border-terminal-amber/20">
        <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
          <span>总人口</span>
          <span>{workers.length}/{populationCap}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span>士气</span>
          <span className={morale >= 0 ? 'text-terminal-green' : 'text-terminal-red'}>
            {morale > 0 ? '+' : ''}{morale}
          </span>
        </div>
      </div>
      
      {/* 岗位槽位概览 - Requirements 2.4, 2.7 */}
      <div className="mb-3 sm:mb-4">
        <h4 className="text-[10px] sm:text-xs text-terminal-amber/60 uppercase mb-1.5 sm:mb-2">岗位槽位</h4>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] sm:text-xs">
          {Object.entries(JOB_NAMES_ZH).map(([jobId, nameZh]) => {
            const maxSlots = getJobMaxSlots(jobId as JobId);
            const currentCount = jobCounts[jobId as JobId] ?? 0;
            const isFull = isJobFull(jobId as JobId);
            const buildingId = JOB_BUILDING_MAP[jobId as JobId];
            const buildingLevel = buildingId ? (buildingLevels[buildingId] ?? 0) : 0;
            const isUnlocked = !buildingId || buildingLevel > 0;
            
            return (
              <div key={jobId} className="flex justify-between">
                <span className={`truncate mr-1 ${isUnlocked ? 'text-terminal-amber/70' : 'text-terminal-dim/50'}`}>
                  {nameZh}
                </span>
                <span className={`flex-shrink-0 ${
                  !isUnlocked ? 'text-terminal-dim/50' :
                  isFull ? 'text-terminal-red' : 'text-terminal-green'
                }`}>
                  {isUnlocked 
                    ? (maxSlots === Infinity ? `${currentCount}/∞` : `${currentCount}/${maxSlots}`)
                    : '未解锁'
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 工人列表 - Requirements 2.1, 2.8 */}
      <h4 className="text-[10px] sm:text-xs text-terminal-amber/60 uppercase mb-1.5 sm:mb-2">工人详情 (点击岗位分配)</h4>
      {workers.length === 0 ? (
        <div className="text-center text-terminal-dim text-xs sm:text-sm py-3 sm:py-4">
          暂无工人
        </div>
      ) : (
        workers.map(worker => (
          <WorkerItem 
            key={worker.id} 
            worker={worker} 
            onAssignJob={handleAssignJob}
            availableJobs={availableJobs}
          />
        ))
      )}
    </div>
  );
}

function BuildingsTab() {
  const buildings = useBuildingStore(state => state.buildings);
  const bonfireIntensity = useBuildingStore(state => state.bonfireIntensity);

  // 过滤已建造的建筑
  const builtBuildings = Object.entries(buildings)
    .filter(([, instance]) => instance.level > 0)
    .map(([id, instance]) => ({
      id: id as BuildingId,
      ...instance,
      config: BUILDINGS[id as BuildingId],
    }));

  return (
    <div>
      {builtBuildings.length === 0 ? (
        <div className="text-center text-terminal-dim text-xs sm:text-sm py-3 sm:py-4">
          暂无建筑
        </div>
      ) : (
        builtBuildings.map(building => (
          <div 
            key={building.id}
            className="mb-2 sm:mb-3 p-1.5 sm:p-2 border border-terminal-amber/20"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-bold truncate mr-2">
                {building.config?.nameZh ?? building.id}
              </span>
              <span className="text-[10px] sm:text-xs text-terminal-amber/70 flex-shrink-0">
                Lv.{building.level}/{building.config?.maxLevel ?? '?'}
              </span>
            </div>
            
            {building.id === 'bonfire' && (
              <div className="mt-1 text-[10px] sm:text-xs text-terminal-amber/60">
                强度: {getBonfireIntensityZh(bonfireIntensity)}
              </div>
            )}
            
            <div className="mt-1 text-[10px] sm:text-xs text-terminal-dim">
              状态: {building.state === 'active' ? '运行中' : '闲置'}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TechTab() {
  const researched = useTechStore(state => state.researched);
  const current = useTechStore(state => state.current);
  const progress = useTechStore(state => state.progress);

  return (
    <div>
      {/* 当前研究 */}
      {current && (
        <div className="mb-3 sm:mb-4 p-1.5 sm:p-2 bg-terminal-amber/5 border border-terminal-amber/20">
          <div className="text-xs sm:text-sm mb-1">正在研究: {current}</div>
          <ProgressBar
            value={progress}
            max={100}
            showValue={true}
            color="amber"
            size="sm"
          />
        </div>
      )}
      
      {/* 已研究科技 */}
      <h4 className="text-[10px] sm:text-xs text-terminal-amber/60 uppercase mb-1.5 sm:mb-2">已研究科技</h4>
      {researched.length === 0 ? (
        <div className="text-center text-terminal-dim text-xs sm:text-sm py-3 sm:py-4">
          暂无已研究科技
        </div>
      ) : (
        <div className="space-y-1">
          {researched.map(techId => (
            <div 
              key={techId}
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs bg-terminal-green/10 text-terminal-green border border-terminal-green/30"
            >
              ✓ {techId}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryTab() {
  const equipment = useEquipmentStore(state => state.equipment);
  const salvageEquipment = useEquipmentStore(state => state.salvageEquipment);
  
  // 按类型分组装备
  const weapons = equipment.filter(e => {
    const config = getEquipmentConfig(e.configId);
    return config?.type === 'weapon';
  });
  const armors = equipment.filter(e => {
    const config = getEquipmentConfig(e.configId);
    return config?.type === 'armor';
  });
  const tools = equipment.filter(e => {
    const config = getEquipmentConfig(e.configId);
    return config?.type === 'tool';
  });
  
  const handleSalvage = (instanceId: string) => {
    const result = salvageEquipment(instanceId);
    if (result.success) {
      // 拆解成功，结果会自动更新状态
    }
  };

  const renderEquipmentItem = (item: typeof equipment[0]) => {
    const config = getEquipmentConfig(item.configId);
    if (!config) return null;
    
    const durabilityPercent = (item.durability / config.maxDurability) * 100;
    const durabilityColor = durabilityPercent > 50 ? 'green' : durabilityPercent > 25 ? 'amber' : 'red';
    
    return (
      <div 
        key={item.instanceId}
        className="mb-2 p-1.5 sm:p-2 border border-terminal-amber/20"
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs sm:text-sm font-bold truncate mr-2">
            {config.nameZh}
          </span>
          <span className={`text-[10px] sm:text-xs ${
            item.status === 'broken' ? 'text-terminal-red' : 
            item.status === 'damaged' ? 'text-terminal-amber' : 'text-terminal-green'
          }`}>
            {item.status === 'broken' ? '损坏' : item.status === 'damaged' ? '受损' : '正常'}
          </span>
        </div>
        
        <ProgressBar
          value={item.durability}
          max={config.maxDurability}
          label="耐久"
          color={durabilityColor}
          size="sm"
        />
        
        <div className="flex justify-between items-center mt-1.5">
          <div className="text-[10px] text-terminal-dim">
            {config.atk && <span className="mr-2">攻击+{config.atk}</span>}
            {config.def && <span className="mr-2">防御+{config.def}</span>}
            {config.efficiency && <span>效率+{config.efficiency}</span>}
          </div>
          <button
            onClick={() => handleSalvage(item.instanceId)}
            className="text-[10px] px-1.5 py-0.5 border border-terminal-amber/40 text-terminal-amber/70 hover:text-terminal-amber hover:border-terminal-amber"
          >
            拆解
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {equipment.length === 0 ? (
        <div className="text-center text-terminal-dim text-xs sm:text-sm py-3 sm:py-4">
          <p className="mb-2">暂无装备</p>
          <p className="text-[10px]">通过探索、制造或交易获取装备</p>
        </div>
      ) : (
        <>
          {/* 武器 */}
          {weapons.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[10px] sm:text-xs text-terminal-amber/60 uppercase mb-1.5">武器 ({weapons.length})</h4>
              {weapons.map(renderEquipmentItem)}
            </div>
          )}
          
          {/* 护甲 */}
          {armors.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[10px] sm:text-xs text-terminal-amber/60 uppercase mb-1.5">护甲 ({armors.length})</h4>
              {armors.map(renderEquipmentItem)}
            </div>
          )}
          
          {/* 工具 */}
          {tools.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[10px] sm:text-xs text-terminal-amber/60 uppercase mb-1.5">工具 ({tools.length})</h4>
              {tools.map(renderEquipmentItem)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div>
      {/* 存档管理 */}
      <h4 className="text-[10px] sm:text-xs text-terminal-amber/60 uppercase mb-1.5 sm:mb-2">存档管理</h4>
      <div className="mb-3 sm:mb-4 p-1.5 sm:p-2 bg-terminal-amber/5 border border-terminal-amber/20">
        <p className="text-[10px] sm:text-xs text-terminal-dim mb-2">
          导出存档以备份进度，或导入存档以恢复游戏。
        </p>
        <SaveExportUI />
      </div>
    </div>
  );
}

interface DetailsPanelProps {
  className?: string;
}

export function DetailsPanel({ className = '' }: DetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('population');

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 标签栏 */}
      <div className="flex border-b border-terminal-amber/20">
        <TabButton 
          active={activeTab === 'population'} 
          onClick={() => setActiveTab('population')}
        >
          人口
        </TabButton>
        <TabButton 
          active={activeTab === 'buildings'} 
          onClick={() => setActiveTab('buildings')}
        >
          建筑
        </TabButton>
        <TabButton 
          active={activeTab === 'inventory'} 
          onClick={() => setActiveTab('inventory')}
        >
          物品
        </TabButton>
        <TabButton 
          active={activeTab === 'tech'} 
          onClick={() => setActiveTab('tech')}
        >
          科技
        </TabButton>
        <TabButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          设置
        </TabButton>
      </div>
      
      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-3 overscroll-contain">
        {activeTab === 'population' && <PopulationTab />}
        {activeTab === 'buildings' && <BuildingsTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'tech' && <TechTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 px-2 sm:px-3 py-1.5 sm:py-2 
        text-[10px] sm:text-xs uppercase tracking-wider transition-colors
        min-h-[36px] sm:min-h-0
        ${active 
          ? 'bg-terminal-amber/20 text-terminal-amber border-b-2 border-terminal-amber' 
          : 'text-terminal-dim hover:text-terminal-amber/70'
        }
      `}
    >
      {children}
    </button>
  );
}

/** 获取状态效果中文名 */
function getStatusNameZh(type: string): string {
  const names: Record<string, string> = {
    bleed: '流血',
    infection: '感染',
    poisoned: '中毒',
    radiation: '辐射',
  };
  return names[type] ?? type;
}

/** 获取篝火强度中文名 */
function getBonfireIntensityZh(intensity: string): string {
  const names: Record<string, string> = {
    off: '熄灭',
    low: '微燃',
    medium: '燃烧',
    high: '旺盛',
  };
  return names[intensity] ?? intensity;
}

export default DetailsPanel;
