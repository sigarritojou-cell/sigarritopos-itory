/**
 * ARQUITECTURA CENTRAL DE PROJECT MYTHOS
 * 
 * Principios:
 * 1. GameState es la única fuente de verdad
 * 2. Ningún sistema escribe estado directamente
 * 3. Todo cambio pasa por: PatchProposal → Validators → Commit
 * 4. El mundo es persistente
 * 5. El jugador modifica el mundo y el mundo responde
 * 6. Todo sistema es modular, desacoplado y extensible
 */

/**
 * Identificadores únicos para todas las entidades del mundo
 */
export type EntityId = string & { readonly __brand: "EntityId" };

export function createEntityId(id: string): EntityId {
  return id as EntityId;
}

/**
 * Posición 3D en el mundo
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Rotación en radianes (Euler angles)
 */
export interface Rotation {
  x: number;
  y: number;
  z: number;
}

/**
 * Transformación espacial
 */
export interface Transform {
  position: Vector3;
  rotation: Rotation;
  scale: Vector3;
}

/**
 * Tipos de entidades en el mundo
 */
export enum EntityType {
  PLAYER = "player",
  NPC = "npc",
  BUILDING = "building",
  OBJECT = "object",
  TERRAIN = "terrain",
  LIGHT = "light",
}

/**
 * Estados posibles de un NPC
 */
export enum NPCState {
  IDLE = "idle",
  WALKING = "walking",
  TALKING = "talking",
  WORKING = "working",
}

/**
 * Datos base de cualquier entidad
 */
export interface Entity {
  id: EntityId;
  type: EntityType;
  transform: Transform;
  visible: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Datos específicos del jugador
 */
export interface PlayerEntity extends Entity {
  type: EntityType.PLAYER;
  camera: {
    fov: number;
    near: number;
    far: number;
  };
  velocity: Vector3;
  isMoving: boolean;
  interactionRange: number;
}

/**
 * Datos específicos de NPCs
 */
export interface NPCEntity extends Entity {
  type: EntityType.NPC;
  name: string;
  role: string; // "pescador", "tabernero", etc.
  state: NPCState;
  currentTarget?: Vector3;
  dialogue: DialogueNode[];
  schedule: ScheduleEntry[];
  viewRange: number;
  lookingAt?: EntityId;
}

/**
 * Nodo de diálogo
 */
export interface DialogueNode {
  id: string;
  text: string;
  responses: DialogueResponse[];
}

export interface DialogueResponse {
  id: string;
  text: string;
  nextNodeId?: string;
  action?: string;
}

/**
 * Entrada de rutina diaria
 */
export interface ScheduleEntry {
  startHour: number;
  endHour: number;
  action: string;
  location?: Vector3;
}

/**
 * Datos específicos de edificios
 */
export interface BuildingEntity extends Entity {
  type: EntityType.BUILDING;
  name: string;
  interiorId?: EntityId;
  entrances: Vector3[];
  meshData: {
    vertices: number[];
    faces: number[];
    normals: number[];
  };
}

/**
 * Datos específicos de objetos interactuables
 */
export interface ObjectEntity extends Entity {
  type: EntityType.OBJECT;
  name: string;
  description: string;
  interactable: boolean;
  onInteract?: (playerId: EntityId) => PatchProposal;
}

/**
 * GameState: Única fuente de verdad
 */
export interface GameState {
  version: number;
  timestamp: number;
  
  // Entidades
  entities: Map<EntityId, Entity>;
  
  // Jugador
  playerId: EntityId;
  
  // Mundo
  worldSeed: number;
  dayTime: number; // 0-24 horas
  weather: string;
  
  // Interacción
  currentInteraction?: {
    entityId: EntityId;
    dialogueNodeId?: string;
  };
  
  // Memoria del jugador
  discoveredLocations: Set<string>;
  readNotes: Set<string>;
  npcInteractions: Map<EntityId, number>; // EntityId -> interactionCount
}

/**
 * Propuesta de cambio al estado
 * Debe pasar validación antes de ser aplicada
 */
export interface PatchProposal {
  id: string;
  timestamp: number;
  type: string;
  
  // Cambios a entidades
  entityUpdates?: Map<EntityId, Partial<Entity>>;
  entityCreations?: Entity[];
  entityDeletions?: EntityId[];
  
  // Cambios al estado global
  stateUpdates?: Partial<GameState>;
  
  // Metadata
  source: string; // "player", "npc_ai", "world_system", etc.
  metadata?: Record<string, unknown>;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validador de propuestas
 */
export type Validator = (
  proposal: PatchProposal,
  currentState: GameState
) => ValidationResult;

/**
 * Commit: aplicación de un cambio validado
 */
export interface Commit {
  proposal: PatchProposal;
  appliedAt: number;
  resultingState: GameState;
}

/**
 * Configuración de generación procedural
 */
export interface WorldGenerationConfig {
  seed: number;
  width: number;
  height: number;
  buildingCount: number;
  npcCount: number;
  terrainScale: number;
  terrainOctaves: number;
}

/**
 * Zona del mundo
 */
export enum ZoneType {
  PORT = "port",
  RESIDENTIAL = "residential",
  PLAZA = "plaza",
  LIGHTHOUSE = "lighthouse",
  FOREST = "forest",
}

export interface Zone {
  id: string;
  type: ZoneType;
  center: Vector3;
  radius: number;
  buildings: EntityId[];
  npcs: EntityId[];
}
