import {
  GameState,
  NPCEntity,
  NPCState,
  Vector3,
  PatchProposal,
  createEntityId,
} from "./types";

/**
 * Sistema de NPCs
 * 
 * Maneja:
 * - Rutinas diarias
 * - Comportamiento de IA básico
 * - Interacción con el jugador
 * - Mirada hacia el jugador
 */
export class NPCSystem {
  /**
   * Actualizar NPCs
   */
  updateNPCs(gameState: GameState, dayTime: number, deltaTime: number): PatchProposal[] {
    const patches: PatchProposal[] = [];

    gameState.entities.forEach((entity) => {
      if (entity.type !== "npc") return;

      const npc = entity as NPCEntity;
      const patch = this.updateNPC(npc, gameState, dayTime, deltaTime);

      if (patch) {
        patches.push(patch);
      }
    });

    return patches;
  }

  /**
   * Actualizar un NPC individual
   */
  private updateNPC(
    npc: NPCEntity,
    gameState: GameState,
    dayTime: number,
    deltaTime: number
  ): PatchProposal | null {
    const updates: Partial<NPCEntity> = {};

    // Determinar acción según horario
    const currentAction = this.getScheduledAction(npc, dayTime);

    // Actualizar estado
    if (currentAction.action === "work") {
      updates.state = NPCState.WORKING;
    } else if (currentAction.action === "rest") {
      updates.state = NPCState.IDLE;
    } else if (currentAction.action === "socialize") {
      updates.state = NPCState.IDLE;
    }

    // Mirar al jugador si está cerca
    const player = gameState.entities.get(gameState.playerId);
    if (player && this.isPlayerNear(npc, player, npc.viewRange)) {
      updates.lookingAt = player.id;
    } else {
      updates.lookingAt = undefined;
    }

    // Movimiento aleatorio si está idle
    if (npc.state === NPCState.IDLE && Math.random() < 0.01) {
      const newPosition = this.getRandomNearbyPosition(npc.transform.position);
      updates.currentTarget = newPosition;
      updates.state = NPCState.WALKING;
    }

    // Movimiento hacia objetivo
    if (npc.currentTarget && npc.state === NPCState.WALKING) {
      const newPosition = this.moveTowards(
        npc.transform.position,
        npc.currentTarget,
        2 * deltaTime
      );

      const distance = this.distance(newPosition, npc.currentTarget);
      if (distance < 0.5) {
        updates.currentTarget = undefined;
        updates.state = NPCState.IDLE;
      }

      updates.transform = {
        ...npc.transform,
        position: newPosition,
      };
    }

    if (Object.keys(updates).length === 0) {
      return null;
    }

    return {
      id: `npc_update_${npc.id}_${Date.now()}`,
      timestamp: Date.now(),
      type: "npc_update",
      entityUpdates: new Map([[npc.id, updates]]),
      source: "npc_system",
    };
  }

  /**
   * Obtener acción programada para NPC
   */
  private getScheduledAction(npc: NPCEntity, dayTime: number): any {
    for (const entry of npc.schedule) {
      if (dayTime >= entry.startHour && dayTime < entry.endHour) {
        return entry;
      }
    }

    // Por defecto, idle
    return { action: "idle", location: npc.transform.position };
  }

  /**
   * Verificar si el jugador está cerca
   */
  private isPlayerNear(npc: NPCEntity, player: any, range: number): boolean {
    const dx = npc.transform.position.x - player.transform.position.x;
    const dy = npc.transform.position.y - player.transform.position.y;
    const dz = npc.transform.position.z - player.transform.position.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < range;
  }

  /**
   * Obtener posición aleatoria cercana
   */
  private getRandomNearbyPosition(position: Vector3): Vector3 {
    const range = 5;
    return {
      x: position.x + (Math.random() - 0.5) * range,
      y: position.y,
      z: position.z + (Math.random() - 0.5) * range,
    };
  }

  /**
   * Mover hacia objetivo
   */
  private moveTowards(from: Vector3, to: Vector3, distance: number): Vector3 {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const currentDistance = Math.sqrt(dx * dx + dz * dz);

    if (currentDistance === 0) {
      return from;
    }

    const moveDistance = Math.min(distance, currentDistance);
    const ratio = moveDistance / currentDistance;

    return {
      x: from.x + dx * ratio,
      y: from.y,
      z: from.z + dz * ratio,
    };
  }

  /**
   * Calcular distancia
   */
  private distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
