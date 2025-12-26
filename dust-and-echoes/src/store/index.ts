/**
 * Store exports
 */

export * from './timeStore';
export * from './resourceStore';
export * from './populationStore';
export * from './buildingStore';
export * from './craftingStore';
export * from './equipmentStore';
// Export medicalStore but exclude conflicting constants (already exported from populationStore)
export { 
  useMedicalStore,
  type TemporaryEffect,
  type StatusProcessingResult,
  type MedicalItemUseResult,
  MORALE_MIN,
  MORALE_MAX,
  MORALE_DESERTION_THRESHOLD,
  MORALE_BONUS_THRESHOLD,
  MORALE_EFFICIENCY_BONUS_PER_POINT,
  MORALE_RECRUITMENT_BONUS_PER_POINT,
  DEATH_HEALTH_THRESHOLD,
} from './medicalStore';
export * from './combatStore';
export * from './explorationStore';
export * from './techStore';
export * from './outpostStore';
export * from './tradeStore';
export * from './eventStore';
export * from './saveStore';
export * from './actionStore';
export * from './gameIntegration';
export * from './gameStateStore';
