import { GameState, Entity, EntityId, NPCEntity, PatchProposal, createEntityId } from "./types";

/**
 * Sistema de interacción
 * 
 * Maneja:
 * - Detección de objetos interactuables
 * - Diálogos con NPCs
 * - Recolección de información
 */
export class InteractionSystem {
  private currentDialogueNodeId: string | null = null;
  private currentInteractionEntityId: EntityId | null = null;

  /**
   * Intentar interactuar con entidad cercana
   */
  tryInteract(
    gameState: GameState,
    playerPosition: { x: number; z: number },
    interactionRange: number
  ): PatchProposal | null {
    // Encontrar entidad cercana interactuable
    const nearbyEntity = this.findNearbyInteractable(
      gameState,
      playerPosition,
      interactionRange
    );

    if (!nearbyEntity) {
      return null;
    }

    // Iniciar interacción
    return this.startInteraction(nearbyEntity, gameState);
  }

  /**
   * Encontrar entidad interactuable cercana
   */
  private findNearbyInteractable(
    gameState: GameState,
    playerPosition: { x: number; z: number },
    range: number
  ): Entity | null {
    let closest: Entity | null = null;
    let closestDistance = range;

    gameState.entities.forEach((entity) => {
      if (entity.id === gameState.playerId) return;

      const dx = entity.transform.position.x - playerPosition.x;
      const dz = entity.transform.position.z - playerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = entity;
      }
    });

    return closest;
  }

  /**
   * Iniciar interacción con entidad
   */
  private startInteraction(entity: Entity, gameState: GameState): PatchProposal {
    this.currentInteractionEntityId = entity.id;

    if (entity.type === "npc") {
      const npc = entity as NPCEntity;
      this.currentDialogueNodeId = npc.dialogue[0]?.id || null;
    }

    return {
      id: `interaction_${Date.now()}`,
      timestamp: Date.now(),
      type: "interaction",
      stateUpdates: {
        currentInteraction: {
          entityId: entity.id,
          dialogueNodeId: this.currentDialogueNodeId || undefined,
        },
      },
      source: "interaction_system",
    };
  }

  /**
   * Responder a opción de diálogo
   */
  respondToDialogue(
    gameState: GameState,
    responseId: string
  ): PatchProposal | null {
    if (!this.currentInteractionEntityId) {
      return null;
    }

    const entity = gameState.entities.get(this.currentInteractionEntityId);
    if (!entity || entity.type !== "npc") {
      return null;
    }

    const npc = entity as NPCEntity;
    const currentNode = npc.dialogue.find(n => n.id === this.currentDialogueNodeId);
    if (!currentNode) {
      return null;
    }

    const response = currentNode.responses.find(r => r.id === responseId);
    if (!response) {
      return null;
    }

    // Actualizar nodo de diálogo
    if (response.nextNodeId) {
      this.currentDialogueNodeId = response.nextNodeId;
    } else {
      // Fin del diálogo
      this.currentInteractionEntityId = null;
      this.currentDialogueNodeId = null;
    }

    // Registrar interacción
    const npcInteractionsUpdate = new Map<EntityId, number>();
    if (this.currentInteractionEntityId) {
      const interactionCount = gameState.npcInteractions.get(this.currentInteractionEntityId) || 0;
      npcInteractionsUpdate.set(this.currentInteractionEntityId, interactionCount + 1);
    }

    return {
      id: `dialogue_response_${Date.now()}`,
      timestamp: Date.now(),
      type: "dialogue_response",
      stateUpdates: {
        currentInteraction: this.currentInteractionEntityId
          ? {
              entityId: this.currentInteractionEntityId,
              dialogueNodeId: this.currentDialogueNodeId || undefined,
            }
          : undefined,
        npcInteractions: npcInteractionsUpdate,
      },
      source: "interaction_system",
      metadata: { responseId, nextNodeId: response.nextNodeId },
    };
  }

  /**
   * Cerrar interacción actual
   */
  closeInteraction(): PatchProposal {
    this.currentInteractionEntityId = null;
    this.currentDialogueNodeId = null;

    return {
      id: `close_interaction_${Date.now()}`,
      timestamp: Date.now(),
      type: "interaction",
      stateUpdates: {
        currentInteraction: undefined,
      },
      source: "interaction_system",
    };
  }

  /**
   * Obtener nodo de diálogo actual
   */
  getCurrentDialogueNode(gameState: GameState): any | null {
    if (!this.currentInteractionEntityId || !this.currentDialogueNodeId) {
      return null;
    }

    const entity = gameState.entities.get(this.currentInteractionEntityId);
    if (!entity || entity.type !== "npc") {
      return null;
    }

    const npc = entity as NPCEntity;
    return npc.dialogue.find(n => n.id === this.currentDialogueNodeId) || null;
  }

  /**
   * Obtener entidad de interacción actual
   */
  getCurrentInteractionEntity(gameState: GameState): Entity | null {
    if (!this.currentInteractionEntityId) {
      return null;
    }

    return gameState.entities.get(this.currentInteractionEntityId) || null;
  }
}
