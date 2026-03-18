import {
  GameState,
  PatchProposal,
  Commit,
  Validator,
  ValidationResult,
  Entity,
  EntityId,
  PlayerEntity,
  EntityType,
  createEntityId,
} from "./types";

/**
 * GameState Manager
 * 
 * Responsabilidades:
 * - Mantener el estado único
 * - Validar propuestas de cambio
 * - Aplicar commits
 * - Notificar cambios
 */
export class GameStateManager {
  private state: GameState;
  private validators: Map<string, Validator[]> = new Map();
  private commitHistory: Commit[] = [];
  private subscribers: ((state: GameState) => void)[] = [];

  constructor(initialState: GameState) {
    this.state = initialState;
    this.setupDefaultValidators();
  }

  /**
   * Obtener estado actual (lectura)
   */
  getState(): Readonly<GameState> {
    return Object.freeze(this.state);
  }

  /**
   * Registrar validador para tipo de propuesta
   */
  registerValidator(proposalType: string, validator: Validator): void {
    if (!this.validators.has(proposalType)) {
      this.validators.set(proposalType, []);
    }
    this.validators.get(proposalType)!.push(validator);
  }

  /**
   * Proponer cambio al estado
   */
  async proposePatch(proposal: PatchProposal): Promise<boolean> {
    // Validar propuesta
    const validation = this.validateProposal(proposal);
    
    if (!validation.valid) {
      console.error("Patch proposal rejected:", validation.errors);
      return false;
    }

    if (validation.warnings.length > 0) {
      console.warn("Patch warnings:", validation.warnings);
    }

    // Aplicar cambio
    return this.applyPatch(proposal);
  }

  /**
   * Validar propuesta
   */
  private validateProposal(proposal: PatchProposal): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Ejecutar validadores específicos del tipo
    const typeValidators = this.validators.get(proposal.type) || [];
    for (const validator of typeValidators) {
      const result = validator(proposal, this.state);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    // Validaciones globales
    if (proposal.entityUpdates) {
      proposal.entityUpdates.forEach((update, id) => {
        if (!this.state.entities.has(id)) {
          errors.push(`Entity ${id} not found for update`);
        }
      });
    }

    if (proposal.entityDeletions) {
      for (const id of proposal.entityDeletions) {
        if (!this.state.entities.has(id)) {
          warnings.push(`Entity ${id} not found for deletion`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Aplicar patch validado
   */
  private applyPatch(proposal: PatchProposal): boolean {
    try {
      const newState = this.applyProposalToState(proposal, this.state);
      
      const commit: Commit = {
        proposal,
        appliedAt: Date.now(),
        resultingState: newState,
      };

      this.state = newState;
      this.commitHistory.push(commit);
      this.notifySubscribers();

      return true;
    } catch (error) {
      console.error("Error applying patch:", error);
      return false;
    }
  }

  /**
   * Aplicar propuesta al estado (crear nuevo estado)
   */
  private applyProposalToState(proposal: PatchProposal, state: GameState): GameState {
    const newState: GameState = {
      ...state,
      entities: new Map(state.entities),
      discoveredLocations: new Set(state.discoveredLocations),
      readNotes: new Set(state.readNotes),
      npcInteractions: new Map(state.npcInteractions),
      version: state.version + 1,
      timestamp: Date.now(),
    };

    // Aplicar creaciones
    if (proposal.entityCreations) {
      for (const entity of proposal.entityCreations) {
        newState.entities.set(entity.id, entity);
      }
    }

    // Aplicar actualizaciones
    if (proposal.entityUpdates) {
      proposal.entityUpdates.forEach((update, id) => {
        const existing = newState.entities.get(id);
        if (existing) {
          newState.entities.set(id, { ...existing, ...update });
        }
      });
    }

    // Aplicar eliminaciones
    if (proposal.entityDeletions) {
      for (const id of proposal.entityDeletions) {
        newState.entities.delete(id);
      }
    }

    // Aplicar cambios de estado global
    if (proposal.stateUpdates) {
      Object.assign(newState, proposal.stateUpdates);
    }

    return newState;
  }

  /**
   * Suscribirse a cambios de estado
   */
  subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  /**
   * Notificar suscriptores
   */
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.state);
    }
  }

  /**
   * Obtener historial de commits
   */
  getCommitHistory(): Readonly<Commit[]> {
    return Object.freeze([...this.commitHistory]);
  }

  /**
   * Configurar validadores por defecto
   */
  private setupDefaultValidators(): void {
    // Validador de actualizaciones de entidades
    this.registerValidator("entity_update", (proposal, state) => {
      const errors: string[] = [];

      if (proposal.entityUpdates) {
        proposal.entityUpdates.forEach((update, id) => {
          const entity = state.entities.get(id);
          if (!entity) {
            errors.push(`Cannot update non-existent entity: ${id}`);
          }
        });
      }

      return { valid: errors.length === 0, errors, warnings: [] };
    });

    // Validador de movimiento del jugador
    this.registerValidator("player_move", (proposal, state) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const player = state.entities.get(state.playerId) as PlayerEntity;
      if (!player) {
        errors.push("Player entity not found");
        return { valid: false, errors, warnings };
      }

      // Validar que el movimiento sea razonable
      if (proposal.entityUpdates?.has(state.playerId)) {
        const update = proposal.entityUpdates.get(state.playerId);
        if (update?.transform?.position) {
          const newPos = update.transform.position;
          const oldPos = player.transform.position;
          
          const distance = Math.sqrt(
            Math.pow(newPos.x - oldPos.x, 2) +
            Math.pow(newPos.y - oldPos.y, 2) +
            Math.pow(newPos.z - oldPos.z, 2)
          );

          // Máximo 10 unidades por frame (será limitado por deltaTime en el sistema de movimiento)
          if (distance > 10) {
            warnings.push(`Large player movement detected: ${distance.toFixed(2)} units`);
          }
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    });

    // Validador de interacción
    this.registerValidator("interaction", (proposal, state) => {
      const errors: string[] = [];

      if (proposal.stateUpdates?.currentInteraction) {
        const interaction = proposal.stateUpdates.currentInteraction;
        if (!state.entities.has(interaction.entityId)) {
          errors.push(`Cannot interact with non-existent entity: ${interaction.entityId}`);
        }
      }

      return { valid: errors.length === 0, errors, warnings: [] };
    });
  }
}

/**
 * Factory para crear GameState inicial
 */
export function createInitialGameState(playerId: EntityId): GameState {
  const playerEntity: PlayerEntity = {
    id: playerId,
    type: EntityType.PLAYER,
    transform: {
      position: { x: 0, y: 1.7, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    visible: true,
    metadata: {},
    camera: {
      fov: 75,
      near: 0.1,
      far: 1000,
    },
    velocity: { x: 0, y: 0, z: 0 },
    isMoving: false,
    interactionRange: 3,
  };

  const entities = new Map<EntityId, Entity>();
  entities.set(playerId, playerEntity);

  return {
    version: 1,
    timestamp: Date.now(),
    entities,
    playerId,
    worldSeed: Math.floor(Math.random() * 2147483647),
    dayTime: 12, // Mediodía
    weather: "clear",
    discoveredLocations: new Set(),
    readNotes: new Set(),
    npcInteractions: new Map(),
  };
}
