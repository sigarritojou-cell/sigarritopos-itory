import * as THREE from "three";
import { GameState, PatchProposal } from "./types";

/**
 * Sistema de iluminación
 * 
 * Maneja:
 * - Ciclo día/noche
 * - Iluminación dinámica
 * - Luz rotatoria del faro
 * - Postproceso
 */
export class LightingSystem {
  private scene: THREE.Scene;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private lighthouseSpotLight: THREE.SpotLight | null = null;
  private lighthouseRotation: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Obtener luces existentes
    this.directionalLight = scene.children.find(
      (child) => child instanceof THREE.DirectionalLight
    ) as THREE.DirectionalLight;

    this.ambientLight = scene.children.find(
      (child) => child instanceof THREE.AmbientLight
    ) as THREE.AmbientLight;

    if (!this.directionalLight) {
      this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      this.directionalLight.position.set(100, 100, 100);
      this.scene.add(this.directionalLight);
    }

    if (!this.ambientLight) {
      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(this.ambientLight);
    }
  }

  /**
   * Actualizar iluminación basada en hora del día
   */
  updateDayNightCycle(dayTime: number, deltaTime: number): void {
    // dayTime: 0-24 horas
    // 0 = medianoche, 6 = amanecer, 12 = mediodía, 18 = atardecer, 24 = medianoche

    const sunAngle = ((dayTime - 6) / 12) * Math.PI; // 0-PI durante el día

    // Posición del sol
    const sunX = Math.cos(sunAngle) * 150;
    const sunY = Math.sin(sunAngle) * 150;
    const sunZ = 100;

    this.directionalLight.position.set(sunX, sunY, sunZ);

    // Intensidad del sol
    let sunIntensity = 0;
    if (dayTime >= 6 && dayTime <= 18) {
      // Día
      sunIntensity = Math.sin(sunAngle);
    } else {
      // Noche
      sunIntensity = 0.1;
    }

    this.directionalLight.intensity = sunIntensity;

    // Color del sol
    let sunColor = 0xffffff;
    if (dayTime >= 5 && dayTime < 7) {
      // Amanecer
      sunColor = 0xffaa55;
    } else if (dayTime >= 17 && dayTime < 19) {
      // Atardecer
      sunColor = 0xff6633;
    } else if (dayTime >= 19 || dayTime < 5) {
      // Noche
      sunColor = 0x3366ff;
    }

    this.directionalLight.color.setHex(sunColor);

    // Luz ambiental
    let ambientIntensity = 0.2;
    let ambientColor = 0xffffff;

    if (dayTime >= 6 && dayTime <= 18) {
      // Día
      ambientIntensity = 0.6;
      ambientColor = 0xffffff;
    } else if (dayTime >= 5 && dayTime < 6) {
      // Amanecer
      ambientIntensity = 0.4;
      ambientColor = 0xffaa55;
    } else if (dayTime >= 18 && dayTime < 19) {
      // Atardecer
      ambientIntensity = 0.4;
      ambientColor = 0xff6633;
    } else {
      // Noche
      ambientIntensity = 0.2;
      ambientColor = 0x3366ff;
    }

    this.ambientLight.intensity = ambientIntensity;
    this.ambientLight.color.setHex(ambientColor);

    // Niebla
    const fogIntensity = dayTime >= 6 && dayTime <= 18 ? 0.001 : 0.0015;
    this.scene.fog = new THREE.Fog(
      dayTime >= 6 && dayTime <= 18 ? 0x87ceeb : 0x1a1a2e,
      500,
      1000
    );
  }

  /**
   * Crear luz rotatoria del faro
   */
  createLighthouseLight(position: { x: number; y: number; z: number }): void {
    const spotLight = new THREE.SpotLight(0xffff99, 2, 200, Math.PI / 4, 0.5, 2);
    spotLight.position.set(position.x, position.y, position.z);
    spotLight.castShadow = true;
    spotLight.target.position.set(position.x, position.y - 10, position.z);

    this.scene.add(spotLight);
    this.scene.add(spotLight.target);

    this.lighthouseSpotLight = spotLight;
  }

  /**
   * Actualizar luz rotatoria del faro
   */
  updateLighthouseLight(deltaTime: number): void {
    if (!this.lighthouseSpotLight) return;

    this.lighthouseRotation += deltaTime * 0.5; // Rotación lenta

    const radius = 100;
    const x = this.lighthouseSpotLight.position.x + Math.cos(this.lighthouseRotation) * radius;
    const z = this.lighthouseSpotLight.position.z + Math.sin(this.lighthouseRotation) * radius;

    this.lighthouseSpotLight.target.position.set(x, this.lighthouseSpotLight.position.y - 50, z);
  }

  /**
   * Aplicar postproceso
   */
  applyPostProcessing(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
    // Postproceso sutil
    // En una versión más completa, usaríamos EffectComposer
    // Por ahora, solo ajustamos tonos

    const canvas = renderer.domElement as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Aplicar un overlay sutil
    ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * Obtener color de cielo basado en hora
   */
  getSkyColor(dayTime: number): number {
    if (dayTime >= 6 && dayTime <= 18) {
      // Día
      return 0x87ceeb; // Azul cielo
    } else if (dayTime >= 5 && dayTime < 6) {
      // Amanecer
      return 0xffaa55; // Naranja
    } else if (dayTime >= 18 && dayTime < 19) {
      // Atardecer
      return 0xff6633; // Naranja oscuro
    } else {
      // Noche
      return 0x0a0a1a; // Azul oscuro
    }
  }

  /**
   * Obtener color de niebla basado en hora
   */
  getFogColor(dayTime: number): number {
    if (dayTime >= 6 && dayTime <= 18) {
      return 0x87ceeb;
    } else {
      return 0x1a1a2e;
    }
  }
}
