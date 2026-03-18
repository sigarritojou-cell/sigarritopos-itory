import { Vector3 } from "./types";

/**
 * Controlador de entrada
 * 
 * Maneja:
 * - Movimiento (WASD)
 * - Rotación de cámara (ratón)
 * - Interacción (E)
 * - Salto (Espacio)
 */
export class InputController {
  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDelta: { x: number; y: number } = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private onInteractCallback?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.setupKeyboardListeners();
    this.setupMouseListeners(canvas);
    this.setupPointerLock(canvas);
  }

  /**
   * Configurar listeners de teclado
   */
  private setupKeyboardListeners(): void {
    document.addEventListener("keydown", (e) => {
      this.keys.add(e.key.toLowerCase());

      // Interacción
      if (e.key.toLowerCase() === "e") {
        this.onInteractCallback?.();
      }
    });

    document.addEventListener("keyup", (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  /**
   * Configurar listeners de ratón
   */
  private setupMouseListeners(canvas: HTMLCanvasElement): void {
    document.addEventListener("mousemove", (e) => {
      if (!this.isPointerLocked) return;

      this.mouseDelta.x = e.movementX || 0;
      this.mouseDelta.y = e.movementY || 0;

      this.mouseX += this.mouseDelta.x;
      this.mouseY += this.mouseDelta.y;

      // Limitar rotación vertical
      this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
    });
  }

  /**
   * Configurar pointer lock
   */
  private setupPointerLock(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("click", () => {
      canvas.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });
  }

  /**
   * Obtener dirección de movimiento
   */
  getMovementDirection(): Vector3 {
    const direction: Vector3 = { x: 0, y: 0, z: 0 };

    if (this.keys.has("w")) direction.z -= 1;
    if (this.keys.has("s")) direction.z += 1;
    if (this.keys.has("a")) direction.x -= 1;
    if (this.keys.has("d")) direction.x += 1;

    // Normalizar
    const length = Math.sqrt(
      direction.x * direction.x + direction.z * direction.z
    );
    if (length > 0) {
      direction.x /= length;
      direction.z /= length;
    }

    return direction;
  }

  /**
   * Obtener rotación de cámara
   */
  getCameraRotation(): { x: number; y: number } {
    const sensitivity = 0.003;
    return {
      x: this.mouseY,
      y: this.mouseX * sensitivity,
    };
  }

  /**
   * Obtener delta de movimiento de ratón
   */
  getMouseDelta(): { x: number; y: number } {
    const delta = { ...this.mouseDelta };
    this.mouseDelta = { x: 0, y: 0 };
    return delta;
  }

  /**
   * Verificar si está saltando
   */
  isJumping(): boolean {
    return this.keys.has(" ");
  }

  /**
   * Registrar callback de interacción
   */
  onInteract(callback: () => void): void {
    this.onInteractCallback = callback;
  }

  /**
   * Verificar si pointer está bloqueado
   */
  isLocked(): boolean {
    return this.isPointerLocked;
  }

  /**
   * Limpiar estado
   */
  reset(): void {
    this.keys.clear();
    this.mouseDelta = { x: 0, y: 0 };
  }
}
