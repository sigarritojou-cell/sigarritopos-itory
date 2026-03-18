import React, { useEffect, useRef, useState } from "react";
import { GameStateManager, createInitialGameState } from "@/engine/GameState";
import { GameRenderer } from "@/engine/Renderer";
import { InputController } from "@/engine/InputController";
import { PhysicsSystem } from "@/engine/PhysicsSystem";
import { InteractionSystem } from "@/engine/InteractionSystem";
import { WorldGenerator } from "@/engine/WorldGenerator";
import { LightingSystem } from "@/engine/LightingSystem";
import { NPCSystem } from "@/engine/NPCSystem";
import { InteriorSystem } from "@/engine/InteriorSystem";
import { GameState, createEntityId, PlayerEntity, BuildingEntity } from "@/engine/types";

/**
 * Componente principal del juego
 * 
 * Integra todos los sistemas:
 * - GameState
 * - Renderer
 * - Input
 * - Physics
 * - Interaction
 * - Lighting
 * - NPCs
 * - Interiores
 */
export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateManagerRef = useRef<GameStateManager | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const inputControllerRef = useRef<InputController | null>(null);
  const physicsSystemRef = useRef<PhysicsSystem | null>(null);
  const interactionSystemRef = useRef<InteractionSystem | null>(null);
  const lightingSystemRef = useRef<LightingSystem | null>(null);
  const npcSystemRef = useRef<NPCSystem | null>(null);
  const interiorSystemRef = useRef<InteriorSystem | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentDialogue, setCurrentDialogue] = useState<any | null>(null);
  const [currentNPC, setCurrentNPC] = useState<any | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [fps, setFps] = useState<number>(0);
  const [dayTime, setDayTime] = useState<number>(12);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const fpsCounterRef = useRef<number>(0);

  /**
   * Inicializar juego
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Crear GameState
    const playerId = createEntityId("player");
    const initialState = createInitialGameState(playerId);
    const gameStateManager = new GameStateManager(initialState);

    // Generar mundo
    const worldGenerator = new WorldGenerator({
      seed: initialState.worldSeed,
      width: 500,
      height: 500,
      buildingCount: 10,
      npcCount: 5,
      terrainScale: 100,
      terrainOctaves: 4,
    });

    const worldEntities = worldGenerator.generateWorld();

    // Crear renderer
    const renderer = new GameRenderer(canvas, width, height);

    // Crear controladores
    const inputController = new InputController(canvas);
    const physicsSystem = new PhysicsSystem();
    const interactionSystem = new InteractionSystem();
    const lightingSystem = new LightingSystem(renderer.getScene());
    const npcSystem = new NPCSystem();
    const interiorSystem = new InteriorSystem();

    // Guardar referencias
    gameStateManagerRef.current = gameStateManager;
    rendererRef.current = renderer;
    inputControllerRef.current = inputController;
    physicsSystemRef.current = physicsSystem;
    interactionSystemRef.current = interactionSystem;
    lightingSystemRef.current = lightingSystem;
    npcSystemRef.current = npcSystem;
    interiorSystemRef.current = interiorSystem;

    // Suscribirse a cambios de estado
    gameStateManager.subscribe((newState) => {
      setGameState(newState);
      renderer.updateGameState(newState);
      setDayTime(newState.dayTime);

      // Actualizar UI
      const player = newState.entities.get(newState.playerId) as PlayerEntity;
      if (player) {
        const zone = detectCurrentZone(player.transform.position);
        setLocationName(zone);
      }

      // Actualizar diálogo
      const dialogueNode = interactionSystem.getCurrentDialogueNode(newState);
      const npcEntity = interactionSystem.getCurrentInteractionEntity(newState);
      setCurrentDialogue(dialogueNode);
      setCurrentNPC(npcEntity);
    });

    // Generar interiores
    let allEntities = [...worldEntities];
    const buildings = worldEntities.filter((e) => e.type === "building") as BuildingEntity[];
    for (const building of buildings) {
      const interiorEntities = interiorSystem.generateInterior(building);
      allEntities.push(...interiorEntities);
    }

    // Crear luz del faro
    const lighthouse = buildings.find((b) => (b as any).name === "Faro");
    if (lighthouse) {
      lightingSystem.createLighthouseLight({
        x: lighthouse.transform.position.x,
        y: lighthouse.transform.position.y + 13,
        z: lighthouse.transform.position.z,
      });
    }

    // Aplicar cambios iniciales
    gameStateManager.proposePatch({
      id: "world_generation",
      timestamp: Date.now(),
      type: "world_generation",
      entityCreations: allEntities,
      source: "world_generator",
    });

    // Manejar interacción
    inputController.onInteract(() => {
      const currentState = gameStateManager.getState();
      const player = currentState.entities.get(currentState.playerId) as PlayerEntity;

      if (currentDialogue && currentNPC) {
        gameStateManager.proposePatch(interactionSystem.closeInteraction());
      } else if (player) {
        const patch = interactionSystem.tryInteract(
          currentState,
          { x: player.transform.position.x, z: player.transform.position.z },
          player.interactionRange
        );
        if (patch) {
          gameStateManager.proposePatch(patch);
        }
      }
    });

    // Loop de juego
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const currentState = gameStateManager.getState();
      const player = currentState.entities.get(currentState.playerId) as PlayerEntity;

      if (player) {
        // Entrada
        const movementDirection = inputController.getMovementDirection();
        const cameraRotation = inputController.getCameraRotation();
        const isJumping = inputController.isJumping();

        // Física
        const physicsPatch = physicsSystem.updatePlayerPhysics(
          player,
          movementDirection,
          isJumping,
          deltaTime
        );
        gameStateManager.proposePatch(physicsPatch);

        // Rotación de cámara
        const rotationPatch = physicsSystem.updateCameraRotation(player, cameraRotation);
        gameStateManager.proposePatch(rotationPatch);
      }

      // Actualizar ciclo día/noche
      const newDayTime = (currentState.dayTime + deltaTime / 3600) % 24;
      gameStateManager.proposePatch({
        id: `day_time_${Date.now()}`,
        timestamp: Date.now(),
        type: "day_time_update",
        stateUpdates: { dayTime: newDayTime },
        source: "lighting_system",
      });

      // Actualizar iluminación
      lightingSystem.updateDayNightCycle(newDayTime, deltaTime);
      lightingSystem.updateLighthouseLight(deltaTime);

      // Actualizar NPCs
      const npcPatches = npcSystem.updateNPCs(currentState, newDayTime, deltaTime);
      for (const patch of npcPatches) {
        gameStateManager.proposePatch(patch);
      }

      // Renderizar
      renderer.render();

      // FPS
      fpsCounterRef.current++;
      if (now % 1000 < deltaTime * 1000) {
        setFps(fpsCounterRef.current);
        fpsCounterRef.current = 0;
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Manejar redimensionamiento
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      renderer.resize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /**
   * Detectar zona actual
   */
  const detectCurrentZone = (position: { x: number; y: number; z: number }): string => {
    const zones = [
      { name: "Puerto", center: { x: 0, z: 50 }, radius: 40 },
      { name: "Residencias", center: { x: -60, z: 0 }, radius: 50 },
      { name: "Plaza Central", center: { x: 0, z: -30 }, radius: 30 },
      { name: "Faro", center: { x: 80, z: 60 }, radius: 25 },
      { name: "Bosque", center: { x: -100, z: -100 }, radius: 80 },
    ];

    for (const zone of zones) {
      const dx = position.x - zone.center.x;
      const dz = position.z - zone.center.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance < zone.radius) {
        return zone.name;
      }
    }

    return "Mundo Abierto";
  };

  /**
   * Manejar respuesta de diálogo
   */
  const handleDialogueResponse = (responseId: string) => {
    if (!gameStateManagerRef.current || !interactionSystemRef.current) return;

    const patch = interactionSystemRef.current.respondToDialogue(
      gameStateManagerRef.current.getState(),
      responseId
    );

    if (patch) {
      gameStateManagerRef.current.proposePatch(patch);
    }
  };

  /**
   * Formatear hora
   */
  const formatTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.floor((hour % 1) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: "block" }}
      />

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
        {/* Ubicación y hora */}
        <div className="absolute top-4 left-4 text-white text-sm font-mono pointer-events-auto">
          <div className="bg-black bg-opacity-50 px-3 py-2 rounded space-y-1">
            <div>{locationName}</div>
            <div className="text-xs text-gray-400">Hora: {formatTime(dayTime)}</div>
          </div>
        </div>

        {/* FPS */}
        <div className="absolute top-4 right-4 text-white text-xs font-mono pointer-events-auto">
          <div className="bg-black bg-opacity-50 px-3 py-2 rounded">
            FPS: {fps}
          </div>
        </div>

        {/* Diálogo */}
        {currentDialogue && currentNPC && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white p-6 pointer-events-auto">
            <div className="max-w-2xl mx-auto">
              <div className="mb-3">
                <h3 className="text-lg font-bold">{currentNPC.name}</h3>
                <p className="text-sm text-gray-400">{currentNPC.role}</p>
              </div>

              <p className="mb-4 text-base">{currentDialogue.text}</p>

              <div className="space-y-2">
                {currentDialogue.responses.map((response: any) => (
                  <button
                    key={response.id}
                    onClick={() => handleDialogueResponse(response.id)}
                    className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition"
                  >
                    &gt; {response.text}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Presiona E para cerrar
              </p>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        {!currentDialogue && (
          <div className="absolute bottom-4 left-4 text-white text-xs font-mono pointer-events-auto">
            <div className="bg-black bg-opacity-50 px-3 py-2 rounded space-y-1">
              <div>WASD - Movimiento</div>
              <div>Ratón - Mirar</div>
              <div>E - Interactuar</div>
              <div>Espacio - Saltar</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
