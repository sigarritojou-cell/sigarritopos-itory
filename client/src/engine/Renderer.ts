import * as THREE from "three";
import { GameState, Entity, EntityType, PlayerEntity, NPCEntity, BuildingEntity, Vector3 } from "./types";

/**
 * Renderer 3D
 * 
 * Responsabilidades:
 * - Mantener escena Three.js sincronizada con GameState
 * - Renderizar entidades
 * - Manejar cámara en primera persona
 * - Gestionar iluminación
 */
export class GameRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private entityMeshes: Map<string, THREE.Object3D> = new Map();
  private lastGameState: GameState | null = null;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // Configurar escena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Cielo azul
    this.scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);

    // Configurar cámara
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.7, 0);

    // Configurar renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Iluminación por defecto
    this.setupLighting();

    // Terreno base
    this.createTerrain();
  }

  /**
   * Configurar iluminación
   */
  private setupLighting(): void {
    // Luz ambiental suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Luz direccional (sol)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    this.scene.add(directionalLight);
  }

  /**
   * Crear terreno base
   */
  private createTerrain(): void {
    const geometry = new THREE.PlaneGeometry(500, 500);
    const material = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  /**
   * Actualizar renderer con nuevo estado
   */
  updateGameState(gameState: GameState): void {
    // Actualizar cámara del jugador
    const player = gameState.entities.get(gameState.playerId) as PlayerEntity;
    if (player) {
      this.camera.position.set(
        player.transform.position.x,
        player.transform.position.y,
        player.transform.position.z
      );
      this.camera.rotation.order = "YXZ";
      this.camera.rotation.y = player.transform.rotation.y;
      this.camera.rotation.x = player.transform.rotation.x;
    }

    // Actualizar entidades
    gameState.entities.forEach((entity) => {
      if (entity.id === gameState.playerId) return; // No renderizar al jugador

      const existingMesh = this.entityMeshes.get(entity.id);

      if (!entity.visible) {
        if (existingMesh) {
          this.scene.remove(existingMesh);
          this.entityMeshes.delete(entity.id);
        }
        return;
      }

      if (existingMesh) {
        // Actualizar posición y rotación
        existingMesh.position.set(
          entity.transform.position.x,
          entity.transform.position.y,
          entity.transform.position.z
        );
        existingMesh.rotation.set(
          entity.transform.rotation.x,
          entity.transform.rotation.y,
          entity.transform.rotation.z
        );
        existingMesh.scale.set(
          entity.transform.scale.x,
          entity.transform.scale.y,
          entity.transform.scale.z
        );
      } else {
        // Crear mesh para nueva entidad
        const mesh = this.createMeshForEntity(entity);
        if (mesh) {
          this.scene.add(mesh);
          this.entityMeshes.set(entity.id, mesh);
        }
      }
    });

    // Limpiar meshes de entidades eliminadas
    this.entityMeshes.forEach((mesh, entityId) => {
      if (!gameState.entities.has(entityId as any)) {
        this.scene.remove(mesh);
        this.entityMeshes.delete(entityId);
      }
    });

    this.lastGameState = gameState;
  }

  /**
   * Crear mesh para una entidad
   */
  private createMeshForEntity(entity: Entity): THREE.Object3D | null {
    const group = new THREE.Group();

    switch (entity.type) {
      case EntityType.NPC: {
        const npc = entity as NPCEntity;
        const mesh = this.createNPCMesh(npc);
        group.add(mesh);
        break;
      }

      case EntityType.BUILDING: {
        const building = entity as BuildingEntity;
        const mesh = this.createBuildingMesh(building);
        group.add(mesh);
        break;
      }

      case EntityType.OBJECT: {
        const mesh = this.createObjectMesh(entity);
        group.add(mesh);
        break;
      }

      case EntityType.LIGHT: {
        const light = this.createLightForEntity(entity);
        if (light) group.add(light);
        break;
      }

      default:
        return null;
    }

    group.position.set(
      entity.transform.position.x,
      entity.transform.position.y,
      entity.transform.position.z
    );

    return group;
  }

  /**
   * Crear mesh para NPC
   */
  private createNPCMesh(npc: NPCEntity): THREE.Object3D {
    const group = new THREE.Group();

    // Cuerpo
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabeza
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    return group;
  }

  /**
   * Crear mesh para edificio
   */
  private createBuildingMesh(building: BuildingEntity): THREE.Object3D {
    const group = new THREE.Group();

    // Crear caja simple para el edificio
    const geometry = new THREE.BoxGeometry(10, 8, 10);
    const material = new THREE.MeshPhongMaterial({ color: 0xa0826d });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = 4; // Centrar en Y
    group.add(mesh);

    // Techo
    const roofGeometry = new THREE.ConeGeometry(7.5, 4, 4);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.position.y = 8;
    group.add(roof);

    // Puerta
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.5, 5.1);
    door.castShadow = true;
    door.receiveShadow = true;
    group.add(door);

    return group;
  }

  /**
   * Crear mesh para objeto
   */
  private createObjectMesh(object: Entity): THREE.Object3D {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Crear luz para entidad
   */
  private createLightForEntity(entity: Entity): THREE.Light | null {
    const lightType = entity.metadata?.lightType as string;

    if (lightType === "point") {
      const light = new THREE.PointLight(0xffffff, 1, 50);
      light.castShadow = true;
      return light;
    }

    if (lightType === "spot") {
      const light = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 2);
      light.castShadow = true;
      return light;
    }

    return null;
  }

  /**
   * Renderizar escena
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Obtener cámara
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Obtener escena
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Redimensionar renderer
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Raycast desde cámara
   */
  raycastFromCamera(maxDistance: number = 100): THREE.Intersection[] {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    const objectsToTest = Array.from(this.entityMeshes.values());
    return raycaster.intersectObjects(objectsToTest, true);
  }
}
