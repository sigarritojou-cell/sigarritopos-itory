# PROJECT MYTHOS - Vertical Slice

Una experiencia jugable en primera persona de un pueblo costero procedural con arquitectura técnica sólida, NPCs interactivos e interiores jugables.

## Visión

PROJECT MYTHOS es un juego de exploración y descubrimiento en un pueblo costero misterioso. El jugador explora el mundo, interactúa con NPCs, descubre historias y desbloquea secretos a través de la exploración y el diálogo.

## Arquitectura Técnica

### Principios Fundamentales

1. **GameState es la única fuente de verdad** - Todo el estado del juego se mantiene en una estructura centralizada
2. **Ningún sistema escribe estado directamente** - Todos los cambios pasan por validación
3. **PatchProposal → Validators → Commit** - Flujo de cambios estructurado y auditable
4. **Mundo persistente** - El jugador modifica el mundo y el mundo responde
5. **Modularidad y desacoplamiento** - Cada sistema es independiente y extensible

### Estructura de Sistemas

```
Engine
├── GameState (Núcleo de estado)
├── Renderer (Three.js)
├── InputController (Entrada)
├── PhysicsSystem (Física)
├── InteractionSystem (Interacción)
├── WorldGenerator (Generación procedural)
├── InteriorSystem (Interiores)
├── LightingSystem (Iluminación)
└── NPCSystem (Comportamiento de NPCs)
```

## Características Implementadas

### Mundo
- ✅ Generación procedural coherente
- ✅ 5 zonas diferenciadas (Puerto, Residencias, Plaza, Faro, Bosque)
- ✅ 10+ edificios con arquitectura única
- ✅ Terreno con iluminación

### NPCs
- ✅ Tabernero, Pescador, Guardián del Faro, Residentes
- ✅ Rutinas diarias programadas
- ✅ Comportamiento de mirada hacia el jugador
- ✅ Diálogos ramificados
- ✅ Movimiento e IA básica

### Interiores
- ✅ Taberna (mesas, sillas, barra, iluminación)
- ✅ Casa de Pescador (cama, escritorio, estantería)
- ✅ Almacén (cajas apiladas, mostrador)
- ✅ Faro (escalera espiral, plataforma, lente rotatorio)

### Sistemas de Juego
- ✅ Movimiento en primera persona (WASD)
- ✅ Cámara controlada por ratón
- ✅ Física con gravedad y salto
- ✅ Sistema de interacción (E)
- ✅ Diálogos con NPCs
- ✅ Ciclo día/noche (0-24 horas)
- ✅ Iluminación dinámica
- ✅ Luz rotatoria del faro

### UI
- ✅ Ubicación actual
- ✅ Hora del día
- ✅ Sistema de diálogos
- ✅ Instrucciones de control
- ✅ Contador FPS

## Controles

| Tecla | Acción |
|-------|--------|
| WASD | Movimiento |
| Ratón | Mirar alrededor |
| E | Interactuar |
| Espacio | Saltar |
| Click | Bloquear ratón |

## Estructura de Archivos

```
client/src/
├── engine/
│   ├── types.ts              # Tipos centrales
│   ├── GameState.ts          # Gestor de estado
│   ├── Renderer.ts           # Renderizado 3D
│   ├── InputController.ts    # Control de entrada
│   ├── PhysicsSystem.ts      # Física
│   ├── InteractionSystem.ts  # Interacción
│   ├── WorldGenerator.ts     # Generación de mundo
│   ├── InteriorSystem.ts     # Generación de interiores
│   ├── LightingSystem.ts     # Iluminación
│   └── NPCSystem.ts          # Comportamiento de NPCs
├── pages/
│   └── Game.tsx              # Componente principal
└── App.tsx                   # Enrutamiento
```

## Decisiones de Diseño

### GameState Central
Todos los datos del juego se almacenan en una estructura inmutable. Los cambios se proponen como `PatchProposal`, se validan y se aplican como `Commit`. Esto permite:
- Auditoría completa de cambios
- Deshacer/rehacer fácilmente
- Sincronización de red en el futuro
- Debugging determinista

### Generación Procedural Coherente
El mundo se genera con lógica real:
- Las zonas se distribuyen estratégicamente
- Los edificios se adaptan al terreno
- Los NPCs tienen ubicaciones significativas
- Las conexiones entre áreas son lógicas

### NPCs Creíbles
Los NPCs no son decoración:
- Tienen rutinas diarias
- Se mueven por el mundo
- Responden al jugador
- Tienen diálogos significativos

### Interiores Únicos
Cada interior tiene:
- Distribución diferente
- Props coherentes
- Iluminación propia
- Escala creíble

## Próximas Fases

1. **Sistema de Memoria** - El jugador recuerda información
2. **Timeline de Eventos** - Eventos que ocurren en el mundo
3. **Rumores** - NPCs comparten información
4. **Puzzles y Misterios** - Objetivos para el jugador
5. **Persistencia** - Guardar/cargar juego
6. **Sonido y Música** - Atmósfera sonora
7. **Animaciones** - Movimiento fluido de NPCs y objetos
8. **Más contenido** - Más edificios, NPCs, diálogos

## Rendimiento

- **Renderizado**: Three.js con shadow mapping
- **Física**: Colisiones básicas por esfera y caja
- **NPCs**: Actualización por proximidad
- **Interiores**: Generados bajo demanda

## Tecnología

- **Frontend**: React 19 + TypeScript
- **3D**: Three.js
- **Build**: Vite
- **Styling**: Tailwind CSS

## Notas de Desarrollo

### Validadores
El sistema de validación es extensible. Cada tipo de propuesta puede tener múltiples validadores que se ejecutan en secuencia.

### Generación Procedural
Usa un generador de números aleatorios con seed para reproducibilidad. El mismo seed siempre genera el mismo mundo.

### Iluminación
El ciclo día/noche afecta:
- Color del sol
- Intensidad de iluminación
- Color de niebla
- Atmósfera general

### NPCs
El sistema de NPCs es completamente modular. Nuevos NPCs se pueden agregar simplemente extendiendo la generación en `WorldGenerator`.

## Licencia

MIT

---

**Construido como el cimiento de algo enorme.**
