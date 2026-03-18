import { Vector3, PlayerEntity, PatchProposal, createEntityId } from "./types";

/**
 * Sistema de física
 * 
 * Maneja:
 * - Movimiento del jugador
 * - Gravedad
 * - Colisiones básicas
 * - Velocidad
 */
export class PhysicsSystem {
  private gravity: number = 9.81;
  private moveSpeed: number = 5; // unidades por segundo
  private jumpForce: number = 5;
  private friction: number = 0.85;

  /**
   * Actualizar física del jugador
   */
  updatePlayerPhysics(
    player: PlayerEntity,
    movementDirection: Vector3,
    isJumping: boolean,
    deltaTime: number
  ): PatchProposal {
    const newVelocity = { ...player.velocity };
    const newPosition = { ...player.transform.position };

    // Aplicar movimiento
    const moveVector = {
      x: movementDirection.x * this.moveSpeed,
      y: 0,
      z: movementDirection.z * this.moveSpeed,
    };

    // Rotar movimiento según cámara
    const rotatedMove = this.rotateVectorByY(moveVector, player.transform.rotation.y);

    newVelocity.x = rotatedMove.x;
    newVelocity.z = rotatedMove.z;

    // Aplicar gravedad
    newVelocity.y -= this.gravity * deltaTime;

    // Salto
    if (isJumping && this.isOnGround(player)) {
      newVelocity.y = this.jumpForce;
    }

    // Aplicar velocidad a posición
    newPosition.x += newVelocity.x * deltaTime;
    newPosition.y += newVelocity.y * deltaTime;
    newPosition.z += newVelocity.z * deltaTime;

    // Colisión con terreno
    if (newPosition.y < 1.7) {
      newPosition.y = 1.7;
      newVelocity.y = 0;
    }

    // Limitar altura máxima
    if (newPosition.y > 500) {
      newPosition.y = 500;
      newVelocity.y = 0;
    }

    // Aplicar fricción
    newVelocity.x *= this.friction;
    newVelocity.z *= this.friction;

    return {
      id: `physics_update_${Date.now()}`,
      timestamp: Date.now(),
      type: "player_move",
      entityUpdates: new Map([
        [
          player.id,
          {
            transform: {
              ...player.transform,
              position: newPosition,
            },
            velocity: newVelocity,
            isMoving: Math.abs(movementDirection.x) > 0 || Math.abs(movementDirection.z) > 0,
          },
        ],
      ]),
      source: "physics_system",
    };
  }

  /**
   * Actualizar rotación de cámara
   */
  updateCameraRotation(
    player: PlayerEntity,
    deltaRotation: { x: number; y: number }
  ): PatchProposal {
    const newRotation = { ...player.transform.rotation };
    newRotation.x += deltaRotation.x;
    newRotation.y += deltaRotation.y;

    return {
      id: `camera_rotation_${Date.now()}`,
      timestamp: Date.now(),
      type: "camera_rotation",
      entityUpdates: new Map([
        [
          player.id,
          {
            transform: {
              ...player.transform,
              rotation: newRotation,
            },
          },
        ],
      ]),
      source: "input_system",
    };
  }

  /**
   * Verificar si está en el suelo
   */
  private isOnGround(player: PlayerEntity): boolean {
    return player.transform.position.y <= 1.7;
  }

  /**
   * Rotar vector por eje Y
   */
  private rotateVectorByY(vector: Vector3, angle: number): Vector3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
      x: vector.x * cos - vector.z * sin,
      y: vector.y,
      z: vector.x * sin + vector.z * cos,
    };
  }

  /**
   * Detectar colisión simple con esfera
   */
  checkSphereCollision(
    position: Vector3,
    radius: number,
    otherPosition: Vector3,
    otherRadius: number
  ): boolean {
    const dx = position.x - otherPosition.x;
    const dy = position.y - otherPosition.y;
    const dz = position.z - otherPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < radius + otherRadius;
  }

  /**
   * Detectar colisión con caja
   */
  checkBoxCollision(
    position: Vector3,
    radius: number,
    boxPosition: Vector3,
    boxSize: Vector3
  ): boolean {
    const closestX = Math.max(
      boxPosition.x - boxSize.x / 2,
      Math.min(position.x, boxPosition.x + boxSize.x / 2)
    );
    const closestY = Math.max(
      boxPosition.y - boxSize.y / 2,
      Math.min(position.y, boxPosition.y + boxSize.y / 2)
    );
    const closestZ = Math.max(
      boxPosition.z - boxSize.z / 2,
      Math.min(position.z, boxPosition.z + boxSize.z / 2)
    );

    const dx = position.x - closestX;
    const dy = position.y - closestY;
    const dz = position.z - closestZ;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return distance < radius;
  }
}
