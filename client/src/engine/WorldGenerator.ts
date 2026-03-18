import {
  Entity,
  EntityId,
  EntityType,
  Vector3,
  Zone,
  ZoneType,
  WorldGenerationConfig,
  BuildingEntity,
  NPCEntity,
  NPCState,
  createEntityId,
} from "./types";

/**
 * Generador procedural del mundo
 * 
 * Genera un pueblo costero coherente con:
 * - Terreno
 * - Zonas diferenciadas
 * - Edificios
 * - NPCs
 */
export class WorldGenerator {
  private config: WorldGenerationConfig;
  private random: SeededRandom;

  constructor(config: WorldGenerationConfig) {
    this.config = config;
    this.random = new SeededRandom(config.seed);
  }

  /**
   * Generar mundo completo
   */
  generateWorld(): Entity[] {
    const entities: Entity[] = [];

    // Generar zonas
    const zones = this.generateZones();

    // Generar edificios en zonas
    const buildings = this.generateBuildings(zones);
    entities.push(...buildings);

    // Generar NPCs
    const npcs = this.generateNPCs(zones, buildings);
    entities.push(...npcs);

    return entities;
  }

  /**
   * Generar zonas del pueblo
   */
  private generateZones(): Zone[] {
    const zones: Zone[] = [];

    // Puerto (costa)
    zones.push({
      id: "port",
      type: ZoneType.PORT,
      center: { x: 0, y: 0, z: 50 },
      radius: 40,
      buildings: [],
      npcs: [],
    });

    // Viviendas (alrededor del puerto)
    zones.push({
      id: "residential",
      type: ZoneType.RESIDENTIAL,
      center: { x: -60, y: 0, z: 0 },
      radius: 50,
      buildings: [],
      npcs: [],
    });

    // Plaza central
    zones.push({
      id: "plaza",
      type: ZoneType.PLAZA,
      center: { x: 0, y: 0, z: -30 },
      radius: 30,
      buildings: [],
      npcs: [],
    });

    // Faro (zona elevada)
    zones.push({
      id: "lighthouse",
      type: ZoneType.LIGHTHOUSE,
      center: { x: 80, y: 20, z: 60 },
      radius: 25,
      buildings: [],
      npcs: [],
    });

    // Bosque (alrededor)
    zones.push({
      id: "forest",
      type: ZoneType.FOREST,
      center: { x: -100, y: 0, z: -100 },
      radius: 80,
      buildings: [],
      npcs: [],
    });

    return zones;
  }

  /**
   * Generar edificios en las zonas
   */
  private generateBuildings(zones: Zone[]): BuildingEntity[] {
    const buildings: BuildingEntity[] = [];

    // Taberna en plaza
    const plaza = zones.find(z => z.type === ZoneType.PLAZA)!;
    buildings.push(this.createBuilding("tavern", plaza.center, 0xb8860b, "Taberna del Puerto"));

    // Casa de pescador en puerto
    const port = zones.find(z => z.type === ZoneType.PORT)!;
    buildings.push(this.createBuilding("fishhouse", 
      { x: port.center.x - 20, y: port.center.y, z: port.center.z },
      0xa0826d,
      "Casa de Pescador"
    ));

    // Almacén en puerto
    buildings.push(this.createBuilding("warehouse",
      { x: port.center.x + 20, y: port.center.y, z: port.center.z },
      0x8b7355,
      "Almacén"
    ));

    // Faro
    const lighthouse = zones.find(z => z.type === ZoneType.LIGHTHOUSE)!;
    buildings.push(this.createBuilding("lighthouse",
      lighthouse.center,
      0xffffff,
      "Faro",
      true // Es especial
    ));

    // Casas residenciales
    const residential = zones.find(z => z.type === ZoneType.RESIDENTIAL)!;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const distance = 30;
      const x = residential.center.x + Math.cos(angle) * distance;
      const z = residential.center.z + Math.sin(angle) * distance;
      
      buildings.push(this.createBuilding(
        `house_${i}`,
        { x, y: 0, z },
        0x8b6f47,
        `Casa ${i + 1}`
      ));
    }

    return buildings;
  }

  /**
   * Crear un edificio
   */
  private createBuilding(
    id: string,
    position: Vector3,
    color: number,
    name: string,
    isLighthouse: boolean = false
  ): BuildingEntity {
    const scale = isLighthouse ? 1.5 : 1;
    const height = isLighthouse ? 15 : 8;

    return {
      id: createEntityId(id),
      type: EntityType.BUILDING,
      transform: {
        position,
        rotation: { x: 0, y: this.random.next() * Math.PI * 2, z: 0 },
        scale: { x: scale, y: scale, z: scale },
      },
      visible: true,
      metadata: { color },
      name,
      entrances: [
        { x: position.x, y: position.y, z: position.z + 5 },
      ],
      meshData: {
        vertices: [],
        faces: [],
        normals: [],
      },
    };
  }

  /**
   * Generar NPCs
   */
  private generateNPCs(zones: Zone[], buildings: BuildingEntity[]): NPCEntity[] {
    const npcs: NPCEntity[] = [];

    // Tabernero
    const tavern = buildings.find(b => (b as any).name === "Taberna del Puerto");
    if (tavern) {
      npcs.push(this.createNPC(
        "npc_bartender",
        tavern.transform.position,
        "Tabernero",
        "bartender",
        this.createBartenderDialogue()
      ));
    }

    // Pescador
    const fishhouse = buildings.find(b => (b as any).name === "Casa de Pescador");
    if (fishhouse) {
      npcs.push(this.createNPC(
        "npc_fisherman",
        fishhouse.transform.position,
        "Pescador",
        "fisherman",
        this.createFishermanDialogue()
      ));
    }

    // Guardián del faro
    const lighthouse = buildings.find(b => (b as any).name === "Faro");
    if (lighthouse) {
      npcs.push(this.createNPC(
        "npc_lighthouse_keeper",
        lighthouse.transform.position,
        "Guardián del Faro",
        "lighthouse_keeper",
        this.createLighthouseKeeperDialogue()
      ));
    }

    // NPCs adicionales en residencias
    for (let i = 0; i < 3; i++) {
      const house = buildings.find(b => (b as any).name === `Casa ${i + 1}`);
      if (house) {
        npcs.push(this.createNPC(
          `npc_resident_${i}`,
          { x: house.transform.position.x, y: house.transform.position.y, z: house.transform.position.z - 5 },
          `Residente ${i + 1}`,
          "resident",
          this.createResidentDialogue(i)
        ));
      }
    }

    return npcs;
  }

  /**
   * Crear un NPC
   */
  private createNPC(
    id: string,
    position: Vector3,
    name: string,
    role: string,
    dialogue: any[]
  ): NPCEntity {
    return {
      id: createEntityId(id),
      type: EntityType.NPC,
      transform: {
        position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      visible: true,
      metadata: {},
      name,
      role,
      state: NPCState.IDLE,
      dialogue,
      schedule: [
        { startHour: 8, endHour: 12, action: "work", location: position },
        { startHour: 12, endHour: 14, action: "rest", location: position },
        { startHour: 14, endHour: 18, action: "work", location: position },
        { startHour: 18, endHour: 22, action: "socialize", location: position },
      ],
      viewRange: 20,
    };
  }

  /**
   * Crear diálogos para tabernero
   */
  private createBartenderDialogue() {
    return [
      {
        id: "bartender_greeting",
        text: "¡Bienvenido a la Taberna! ¿Qué te trae por aquí?",
        responses: [
          {
            id: "response_1",
            text: "¿Qué sabes del pueblo?",
            nextNodeId: "bartender_info",
          },
          {
            id: "response_2",
            text: "Adiós",
            nextNodeId: undefined,
          },
        ],
      },
      {
        id: "bartender_info",
        text: "Este es un pueblo pequeño pero con historia. El faro ha guiado a muchos marineros. Hay secretos en estos acantilados...",
        responses: [
          {
            id: "response_3",
            text: "¿Qué clase de secretos?",
            nextNodeId: "bartender_secrets",
          },
        ],
      },
      {
        id: "bartender_secrets",
        text: "Eso es algo que tendrás que descubrir por ti mismo, viajero.",
        responses: [
          {
            id: "response_4",
            text: "Entiendo",
            nextNodeId: undefined,
          },
        ],
      },
    ];
  }

  /**
   * Crear diálogos para pescador
   */
  private createFishermanDialogue() {
    return [
      {
        id: "fisherman_greeting",
        text: "Hola, ¿buscas algo?",
        responses: [
          {
            id: "response_1",
            text: "¿Qué hay en el mar?",
            nextNodeId: "fisherman_sea",
          },
        ],
      },
      {
        id: "fisherman_sea",
        text: "El mar guarda muchos misterios. Algunos dicen que hay ruinas antiguas en las profundidades.",
        responses: [
          {
            id: "response_2",
            text: "Interesante",
            nextNodeId: undefined,
          },
        ],
      },
    ];
  }

  /**
   * Crear diálogos para guardián del faro
   */
  private createLighthouseKeeperDialogue() {
    return [
      {
        id: "keeper_greeting",
        text: "Bienvenido al faro. Cuido esta luz para que los marineros encuentren el camino.",
        responses: [
          {
            id: "response_1",
            text: "¿Cuánto tiempo llevas aquí?",
            nextNodeId: "keeper_history",
          },
        ],
      },
      {
        id: "keeper_history",
        text: "Muchos años. He visto cambios en este pueblo, pero el faro sigue brillando.",
        responses: [
          {
            id: "response_2",
            text: "Gracias",
            nextNodeId: undefined,
          },
        ],
      },
    ];
  }

  /**
   * Crear diálogos para residentes
   */
  private createResidentDialogue(index: number) {
    return [
      {
        id: "resident_greeting",
        text: `Hola, soy un residente de este pueblo. Número ${index + 1}.`,
        responses: [
          {
            id: "response_1",
            text: "Adiós",
            nextNodeId: undefined,
          },
        ],
      },
    ];
  }
}

/**
 * Generador de números aleatorios con seed
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}
