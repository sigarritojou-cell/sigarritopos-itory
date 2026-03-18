import {
  Entity,
  EntityId,
  EntityType,
  Vector3,
  BuildingEntity,
  ObjectEntity,
  createEntityId,
} from "./types";

/**
 * Sistema de interiores
 * 
 * Crea interiores únicos y funcionales para:
 * - Taberna
 * - Casa de Pescador
 * - Almacén
 * - Faro
 */
export class InteriorSystem {
  /**
   * Generar interior para un edificio
   */
  generateInterior(building: BuildingEntity): Entity[] {
    const entities: Entity[] = [];

    const name = building.name;

    if (name === "Taberna del Puerto") {
      return this.createTavernInterior(building);
    } else if (name === "Casa de Pescador") {
      return this.createFishHouseInterior(building);
    } else if (name === "Almacén") {
      return this.createWarehouseInterior(building);
    } else if (name === "Faro") {
      return this.createLighthouseInterior(building);
    }

    return entities;
  }

  /**
   * Crear interior de taberna
   */
  private createTavernInterior(building: BuildingEntity): Entity[] {
    const entities: Entity[] = [];
    const basePos = building.transform.position;

    // Piso
    entities.push({
      id: createEntityId(`tavern_floor_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: basePos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 10, y: 0.1, z: 10 },
      },
      visible: true,
      metadata: { color: 0x8b7355 },
      name: "Piso de Taberna",
      description: "Piso de madera gastado",
      interactable: false,
    } as ObjectEntity);

    // Barra
    entities.push({
      id: createEntityId(`tavern_bar_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 1, z: basePos.z - 2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 6, y: 1, z: 1 },
      },
      visible: true,
      metadata: { color: 0x654321 },
      name: "Barra de la Taberna",
      description: "Una barra de madera oscura",
      interactable: true,
    } as ObjectEntity);

    // Mesas (3)
    for (let i = 0; i < 3; i++) {
      const x = basePos.x - 2 + i * 2;
      const z = basePos.z + 2;

      entities.push({
        id: createEntityId(`tavern_table_${i}_${Date.now()}`),
        type: EntityType.OBJECT,
        transform: {
          position: { x, y: basePos.y + 0.5, z },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1.5, y: 0.1, z: 1.5 },
        },
        visible: true,
        metadata: { color: 0xa0826d },
        name: `Mesa ${i + 1}`,
        description: "Una mesa de madera",
        interactable: true,
      } as ObjectEntity);
    }

    // Sillas (6)
    for (let i = 0; i < 6; i++) {
      const tableIndex = Math.floor(i / 2);
      const x = basePos.x - 2 + tableIndex * 2 + (i % 2 === 0 ? -0.5 : 0.5);
      const z = basePos.z + 2 + (i % 2 === 0 ? -0.5 : 0.5);

      entities.push({
        id: createEntityId(`tavern_chair_${i}_${Date.now()}`),
        type: EntityType.OBJECT,
        transform: {
          position: { x, y: basePos.y + 0.3, z },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 0.4, y: 0.6, z: 0.4 },
        },
        visible: true,
        metadata: { color: 0x8b6f47 },
        name: "Silla",
        description: "Una silla de madera",
        interactable: false,
      } as ObjectEntity);
    }

    // Lámpara
    entities.push({
      id: createEntityId(`tavern_lamp_${Date.now()}`),
      type: EntityType.LIGHT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 3, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      visible: true,
      metadata: { lightType: "point", color: 0xffcc99, intensity: 0.8 },
    });

    return entities;
  }

  /**
   * Crear interior de casa de pescador
   */
  private createFishHouseInterior(building: BuildingEntity): Entity[] {
    const entities: Entity[] = [];
    const basePos = building.transform.position;

    // Piso
    entities.push({
      id: createEntityId(`fishhouse_floor_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: basePos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 8, y: 0.1, z: 8 },
      },
      visible: true,
      metadata: { color: 0x8b7355 },
      name: "Piso",
      description: "Piso de madera",
      interactable: false,
    } as ObjectEntity);

    // Cama
    entities.push({
      id: createEntityId(`fishhouse_bed_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: { x: basePos.x - 2, y: basePos.y + 0.5, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2, y: 0.5, z: 3 },
      },
      visible: true,
      metadata: { color: 0x8b4513 },
      name: "Cama",
      description: "Una cama de madera",
      interactable: false,
    } as ObjectEntity);

    // Escritorio
    entities.push({
      id: createEntityId(`fishhouse_desk_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: { x: basePos.x + 2, y: basePos.y + 0.7, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2, y: 0.1, z: 1.5 },
      },
      visible: true,
      metadata: { color: 0xa0826d },
      name: "Escritorio",
      description: "Un escritorio con mapas",
      interactable: true,
    } as ObjectEntity);

    // Estantería
    entities.push({
      id: createEntityId(`fishhouse_shelf_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 1.5, z: basePos.z - 3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 3, y: 2, z: 0.3 },
      },
      visible: true,
      metadata: { color: 0x654321 },
      name: "Estantería",
      description: "Una estantería con objetos",
      interactable: true,
    } as ObjectEntity);

    // Lámpara
    entities.push({
      id: createEntityId(`fishhouse_lamp_${Date.now()}`),
      type: EntityType.LIGHT,
      transform: {
        position: { x: basePos.x + 2, y: basePos.y + 2, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      visible: true,
      metadata: { lightType: "point", color: 0xffcc99, intensity: 0.6 },
    });

    return entities;
  }

  /**
   * Crear interior de almacén
   */
  private createWarehouseInterior(building: BuildingEntity): Entity[] {
    const entities: Entity[] = [];
    const basePos = building.transform.position;

    // Piso
    entities.push({
      id: createEntityId(`warehouse_floor_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: basePos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 10, y: 0.1, z: 10 },
      },
      visible: true,
      metadata: { color: 0x696969 },
      name: "Piso",
      description: "Piso de piedra",
      interactable: false,
    } as ObjectEntity);

    // Cajas apiladas (5 pilas)
    for (let i = 0; i < 5; i++) {
      const x = basePos.x - 3 + i * 1.5;
      const z = basePos.z + 2;

      for (let j = 0; j < 3; j++) {
        entities.push({
          id: createEntityId(`warehouse_box_${i}_${j}_${Date.now()}`),
          type: EntityType.OBJECT,
          transform: {
            position: { x, y: basePos.y + 0.5 + j * 1, z },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 0.8, y: 0.8, z: 0.8 },
          },
          visible: true,
          metadata: { color: 0x8b6f47 },
          name: `Caja ${i * 3 + j + 1}`,
          description: "Una caja de madera",
          interactable: true,
        } as ObjectEntity);
      }
    }

    // Mostrador
    entities.push({
      id: createEntityId(`warehouse_counter_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 0.7, z: basePos.z - 3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 4, y: 0.1, z: 1 },
      },
      visible: true,
      metadata: { color: 0xa0826d },
      name: "Mostrador",
      description: "Un mostrador de madera",
      interactable: true,
    } as ObjectEntity);

    // Lámpara
    entities.push({
      id: createEntityId(`warehouse_lamp_${Date.now()}`),
      type: EntityType.LIGHT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 3, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      visible: true,
      metadata: { lightType: "point", color: 0xffffff, intensity: 0.7 },
    });

    return entities;
  }

  /**
   * Crear interior del faro
   */
  private createLighthouseInterior(building: BuildingEntity): Entity[] {
    const entities: Entity[] = [];
    const basePos = building.transform.position;

    // Piso base
    entities.push({
      id: createEntityId(`lighthouse_floor_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: basePos,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 6, y: 0.1, z: 6 },
      },
      visible: true,
      metadata: { color: 0x696969 },
      name: "Piso",
      description: "Piso de piedra",
      interactable: false,
    } as ObjectEntity);

    // Escalera espiral (representada como objetos)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 2;
      const x = basePos.x + Math.cos(angle) * radius;
      const z = basePos.z + Math.sin(angle) * radius;
      const y = basePos.y + i * 1.5;

      entities.push({
        id: createEntityId(`lighthouse_step_${i}_${Date.now()}`),
        type: EntityType.OBJECT,
        transform: {
          position: { x, y, z },
          rotation: { x: 0, y: angle, z: 0 },
          scale: { x: 0.3, y: 0.2, z: 1 },
        },
        visible: true,
        metadata: { color: 0x8b7355 },
        name: `Escalón ${i + 1}`,
        description: "Un escalón de madera",
        interactable: false,
      } as ObjectEntity);
    }

    // Plataforma superior
    entities.push({
      id: createEntityId(`lighthouse_platform_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 12, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 4, y: 0.1, z: 4 },
      },
      visible: true,
      metadata: { color: 0x696969 },
      name: "Plataforma",
      description: "La plataforma superior del faro",
      interactable: false,
    } as ObjectEntity);

    // Lente del faro (luz rotatoria)
    entities.push({
      id: createEntityId(`lighthouse_lens_${Date.now()}`),
      type: EntityType.LIGHT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 13, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      visible: true,
      metadata: {
        lightType: "spot",
        color: 0xffff99,
        intensity: 1.5,
        rotating: true,
        rotationSpeed: 0.5,
      },
    });

    // Maquinaria
    entities.push({
      id: createEntityId(`lighthouse_machinery_${Date.now()}`),
      type: EntityType.OBJECT,
      transform: {
        position: { x: basePos.x, y: basePos.y + 11, z: basePos.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 2, y: 1, z: 2 },
      },
      visible: true,
      metadata: { color: 0x696969 },
      name: "Maquinaria",
      description: "Maquinaria del faro",
      interactable: true,
    } as ObjectEntity);

    return entities;
  }
}
