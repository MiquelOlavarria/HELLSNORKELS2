# HELLSNORKELS 2 — Especificaciones del Juego

## Resumen
Juego tribute de Helldivers 2 con estética retro (SNES/NES mejorado). Multi-file: `game.js` (motor compartido), `input-desktop.js` (teclado+ratón), `input-mobile.js` (táctil VGP), `index.html` (router), `desktop.html`, `mobile.html`. Canvas-based, jugable en PC y móvil/tablet con mando virtual completo. Imágenes: `logo.png` (400×141), `personajes.png` (320×302). Cache busting via `?v=VERSION` en script tags.

---

## Jugador

### Stats
| Stat | Valor |
|------|-------|
| Vida máxima | 100 HP |
| Stamina máxima | 100 |
| Velocidad (caminar) | 2 px/frame |
| Sprint | 3.5 px/frame |
| Regeneración stamina | 0.35/frame |
| Agotamiento stamina | velocidad × 0.5 (más lento que caminar) |
| Invulnerabilidad tras daño | Variable por fuente |
| Vidas | 5 |
| Stims iniciales | 4 |
| Granadas iniciales | 6 |

### Armas
| # | Nombre | Daño | Cadencia | Cargador | Reserva | Recarga | Spread | Notas |
|---|--------|------|----------|----------|---------|---------|--------|-------|
| 1 | Ametralladora | 8 | 8 frames (7.5/s) | 30 | 150 | 90 frames | 0.12 | Disparo automático |
| 2 | Pistola | 18 | 30 frames (2/s) | 6 | 42 | 45 frames | 0.02 | Click por disparo, recarga manual (R) |
| 3 | Comando (Rocket) | 67 directo / 25 splash (55px) | 28 frames | 4 | 0 | No recarga | 0.02 | Desbloqueable por stratagema |
| 4 | Granada | 100 | 30 frames entre lanzamientos | 6 | 0 | — | 0 | Lanzamiento con arco |

### Pistola — Detalles
- Dispara solo en click (no mantener), o `gpJust(7)` en mando
- Munición infinita mostrada como `∞` en HUD
- Se recarga manualmente con R / botón X
- La reserva se repone con estratagema Suministros

### Ataque Cuerpo a Cuerpo
- **Tecla F** (teclado) o **RB** (mando)
- **Daño**: 50
- **Alcance**: 30px desde centro del jugador (+ radio del enemigo)
- **Cooldown**: 60 frames (1 segundo)
- **Animación**: 15 frames, arco dorado
- **Knockback**: Empuja al enemigo 3px/frame, 6 frames de stun
- Partículas, shake=4, vibración mando

### Mecánicas de Granadas
- **Tecla 4 (selección)**: Click o RT para lanzar. Arco parabólico con alcance máximo 180px.
- **Tecla G / LT (mando)**: Lanza a distancia máxima (180px) en dirección que apunta el jugador.
- Proyectil: velocidad 4.5 px/frame, arco altura 40px
- Explosión: 100 daño en 55px radio, crea zona de fuego (240 frames, 5 daño/tick)
- **No se puede lanzar** si el jugador está en agua
- Vista previa: parábola punteada naranja con marcador de distancia

### Comando (Rocket) — Balance
- Daño directo: 67 HP
- Splash damage: 25 HP (radio 55px, con decaimiento lineal)
- Titan en Helldiver (480 HP): 8 cohetes = 2 cargadores completos
- Charger en Helldiver (180 HP): 3 cohetes

### Otros
- **Stims**: Curan 50 HP, invulnerabilidad 25 frames. Tecla V / D-Pad Up. Máximo 4.
- **Mochila Salto**: Activada por stratagema, salto 9px en dirección apuntada, 15 frames invuln. Tecla Space / doble-tap A (300ms).
- **Laser Sight**: Línea roja permanente desde punta del arma (24px offset) hasta primer impacto (obstáculo/enemigo).
- **No se puede disparar** mientras se está en agua (hazard boscoso).
- Recarga manual con R / botón X.
- Selección de arma: teclas 1-4 / botón Y (tap toggle 1↔2, hold→arma 3) / D-Pad Right (arma 4 granada).

---

## Enemigos (Terminids)

### Stats Base
| Tipo | HP | Velocidad | Daño | Tamaño | Radio Ataque | Aggro | Score |
|------|-----|-----------|------|--------|-------------|-------|-------|
| Warrior | 30 | 0.8 | 8 | 12 | 14 | 90 | 10 |
| Hunter | 20 | 1.5 | 12 | 10 | 16 | 100 | 15 |
| Spewer | 60 | 0.5 | 15 | 18 | 140 (ranged) | 110 | 25 |
| Charger | 150 | 1.2 | 30 | 26 | 20 | 120 | 100 |
| Bile Titan | 400 | 0.4 | 50 | 40 | 25 | 130 | 300 |

### IA
- **Patrulla**: Grupo de 2-4, movimiento errático, radio de detección ~90-130px
- **Alerta**: Cadena de alerta en radio 130px, velocidad × 0.6
- **Persecución**: Velocidad completa, persigue al jugador
- **Sprite**: Outline con alpha 0.1 (sutil, sin recuadro negro)
- **Spewer ranged**: proyectil ácido verde daña + reduce 15 stamina en impacto

### Sistema de Refuerzos
- Warriors y Hunters nacidos de nidos pueden llamar refuerzos (35% probabilidad al detectar)
- **Animación**: Humo amarillo pulsante + anillo de progreso
- **Ventana**: 5 segundos para matar al emisario
- Si no se mata: spawn 3-5 enemigos variados cerca
- Solo una llamada por enemigo
- Titans y Chargers NO pueden llamar

### Nidos
- Generan enemigos continuamente hasta destruidos
- Solo destruibles con granadas (100 daño) o explosiones
- Recompensa: 500 puntos al destruir
- HP del nido según dificultad (80-200)
- **Destrucción**: nido cambia a estado `destroyed=true`, permanece en mapa con sprite de cráter humeante y cruz roja
- Enemigos generados por nidos son expulsados automáticamente si quedan dentro de obstáculos o hazards

### Expulsión automática de enemigos
- Si un enemigo termina dentro de un obstáculo (montaña, roca, etc.) o hazard (lago, lava, abismo, arena), es expulsado automáticamente hacia la dirección libre más cercana
- Aplica a: todo movimiento de enemigos (patrol/alert/chase), enemigos nacidos de nidos, refuerzos llamados
- `expelEntity()`: prueba 8 direcciones a distancias crecientes (1→20px) hasta encontrar posición libre
- `expelFromHazards()`: empuja fuera del radio de cada parte del hazard

---

## Dificultad

| Nivel | HM (vida) | SM (veloc.) | Enemigos max | Spawn rate | Tipos | HP Nido |
|-------|-----------|-------------|-------------|------------|-------|---------|
| TIRADO | 0.70 | 1.00 | 8 | 200 | Warrior | 80 |
| FÁCIL | 0.85 | 1.10 | 12 | 160 | Warrior, Hunter | 90 |
| NORMAL | 1.00 | 1.20 | 18 | 120 | Warrior, Hunter, Spewer | 100 |
| DIFÍCIL | 1.05 | 1.35 | 22 | 90 | + Charger | 120 |
| EXTREMO | 1.10 | 1.50 | 28 | 70 | + Charger | 140 |
| SUICIDA | 1.15 | 1.65 | 32 | 50 | + Titan | 160 |
| HELLDIVER | 1.20 | 1.80 | 40 | 35 | + Titan | 200 |

**Decisión de diseño**: HM suave (~5% por nivel) para que la dificultad venga de velocidad/cantidad, no de HP inflado.

---

## Planetas / Biomas

| Bioma | Descripción | Colores fondo | Decoración |
|-------|-------------|---------------|------------|
| LUNAR (0) | Superficie gris y cráteres | #2a2a30 | Ninguna |
| DESÉRTICO (1) | Arena, cactus y dunas | #c4a44a | Cactus |
| BOSCOSO (2) | Vegetación, árboles y lagos | #2a3a20 | Árboles |
| VOLCÁNICO (3) | Volcanes y lagos de lava | #1a0a0a | Humo volcánico |

- Mapa: 3200×2400 px
- Obstáculos: rocas, formaciones rocosas, cactus, troncos/árboles, rocas volcánicas, volcanes (~35-50+ por planeta)
- Los obstáculos bloquean al jugador Y a los Terminids
- Colisión con wall-sliding
- Montañas: 8-12 por mapa, efecto cartográfico con elipses de contorno (5 anillos), bloquean paso

### Hazards por Planeta

Cada hazard usa formas irregulares con sub-círculos del mismo tamaño dispuestos a lo largo de un eje (alargados) más formas en L.

| Planeta | Hazard | Cantidad | Tamaño | Efecto | Muerte |
|---------|--------|----------|--------|--------|--------|
| LUNAR | Abismo | 5 irregulares + 2 en L | radio 55-110 | Muerte instantánea | "Cayó al abismo sin fin..." |
| DESÉRTICO | Arenas movedizas | 5 irregulares + 2 en L | radio 60-115 | Vel ×0.08, sinkT 5s, escapeable | "Devorado por las arenas..." |
| BOSCOSO | Lagos de agua | 5 irregulares + 2 en L | radio 70-130 | Vel ×0.06, drownT 5s, escapeable, no disparo | "Ahogado en las profundidades..." |
| VOLCÁNICO | Lagos de lava | 5 irregulares + 2 en L | radio 65-125 | Zona exterior: vel ×0.05, DOT 5hp/20f, escapeable. Zona interior: muerte instantánea | "Quemado vivo en la lava..." |

#### Hazard — Sistema de Zonas (Lava)
- **Zona exterior** (distancia al borde ≤ 40% del radio máximo): daño gradual, el jugador se mueve muy lento (×0.05), puede escapar.
- **Zona interior** (distancia al borde > 40%): muerte instantánea, animación de combustión.

#### Hazard — Mensajes HUD
- Abismo: sin mensaje (muerte instantánea)
- Arenas: "¡HUNDIENDO!" + barra de progreso
- Agua: "¡AHOGANDO!" + barra de progreso
- Lava exterior: "¡ARDIENDO! BUSCA LA ORILLA"

#### Hazard — Animaciones
- **Arenas**: arena subiendo por piernas, brazos arriba ondulando
- **Agua**: cabeza asomando, ondas concéntricas (ripple)
- **Lava**: overlay de fuego intenso, partículas de fuego continuas

---

## Estratagemas

### Sistema Completo

1. **Abrir SGUI**: CTRL (PC) / LB (mando). Pausa el juego.
2. **Introducir secuencia**: WASD / D-Pad. Sin flecha por defecto.
3. **Al coincidir**: se cierra SGUI → modo **targeting** (mapa vivo, sin pausa).
4. **Apuntar**: cursor/ratón o stick derecho. Distancia máxima 180px.
5. **Disparar**: Click / RT para lanzar.

### Tabla de Estratagemas

| Nombre | Secuencia (HD2) | Cooldown | Tipo | Efecto |
|--------|----------------|----------|------|--------|
| Perro Guardián | ↓ ↑ ← ↑ → → | 600f (10s) | Equipo (pod) | Drone orbitante, dispara cada 120f (2s), 18 dmg |
| Láser Orbital | → ↓ ↑ → ↓ | 900f (15s) | Ofensivo | Rayo láser en posición, 600f (10s) duración |
| Águila Cluster | ↑ → ↓ ↓ → | 720f (12s) | Ofensivo | Avión sobrevuela, 5 bombas con retardo 250ms |
| Mochila Salto | ↓ ↑ ↑ ↓ ↑ | 300f (5s) | Equipo (mochila) | Salto 9px + invuln 15f. Excluye Perro. |
| Lanz Cohetes | ↓ ← → → ← | 480f (8s) | Equipo (pod) | Desbloquea arma 3, +4 cohetes |
| Suministros | ↓ ← ↓ ↑ ↑ ↓ | 360f (6s) | Equipo (pod) | +600 balas MG, +42 pistola, +4 cohetes, +6 granadas, +4 stims, +30 HP |

### Propiedades
- `target: 1` — requiere modo targeting (todas excepto Mochila)
- `pod: 1` — llega en cápsula Hell (Perro, Comando, Suministros)
- `bp: 1` — equipo de mochila (Mochila Salto, excluye Perro y viceversa)

### Cápsula Hell (PODS)
- **Caída**: gravedad `vy+=0.4`, desde `y=-80+cam.y` hasta `targetY`
- **Impacto**: partículas, shake=12, SFX explosión
- **Mata enemigo**: solo al de mayor nivel (`sv`) bajo la cápsula (radio `e.sz/2+15`)
- **No desaparece**: queda en el suelo hasta ser recogida
- **Recoger**: radio 50px, tecla E / botón A
- **Efectos al recoger**:
  - Perro: activa `PL.activeSG='dog'`
  - Comando: desbloquea arma 3, cargador lleno, cambia a wpn 3
  - Suministros: repone munición completa

### Águila Cluster — Animación
- Avión futurista aparece 400px antes del objetivo
- Vuela en línea recta a velocidad 8 px/frame
- Al llegar al objetivo: suelta 5 bombas (retardo 250ms c/u)
- Cada bomba: 50 daño en radio 65px, zona de fuego 240f (5 daño/tick)
- El avión continúa y se elimina tras 1000px de recorrido
- Sprite: silueta de caza con brillo de motor naranja pulsante

---

## Recogibles (Collectibles)

### Sistema
- 8 items iniciales en todo el mapa (pool: ammo, credit, grenade, medal, stim, sample)
- **Requieren pulsar E / A para recoger** (no auto-pickup)
- Indicador `[E] Recoger` / `[A] Recoger` visible a 60px de distancia
- Texto flotante al recoger (150 frames = 2.5s de duración)
- **Enemigos muertos NO dropean items**
- Respawn de loot periódico (nueva ronda al destruir nidos)

### Tipos de Collectibles

| Tipo | Color | Efecto | Valor | Límite |
|------|-------|--------|-------|--------|
| MUNICIONES | #ffcc00 | +30 reserva MG | 30 | 600 |
| GRANADAS | #888 | +2 granadas | 2 | 6 |
| STIMS | #00ff00 | +2 stims | 2 | 4 |
| MEDALLA | #ffaa00 | Score | 100 | — |
| CREDITOS | #44aaff | Score | 50 | — |
| MUESTRA | #ff44ff | Score | 200 | — |
| MUESTRA RARA | #ff8800 | Score | 500 | — |
| SUPER MUESTRA | #ffffff | Score | 1000 | — |
| COHETES | #ff4444 | +2 rockets Comando | 2 | 4 |

### Pool de Drop (muerte de enemigos no dropea)
Base: `['ammo','ammo','ammo','grenade','stim','medal','credit']` + probabilidades:
- 10% sample, 6% rare, 2% super, 10% rocket

---

## Controles

### Teclado + Ratón
| Tecla | Acción |
|-------|--------|
| WASD | Mover |
| Mouse | Apuntar |
| Click izq | Disparar / Interactuar |
| Shift (hold) | Sprint |
| 1-4 | Seleccionar arma |
| R | Recargar |
| E | Recoger objeto / Interactuar |
| F | Ataque cuerpo a cuerpo |
| G | Granada (dirección apuntada, rango max 180px) |
| V | Usar stim |
| CTRL | Modo estratagema (toggle) |
| Space | Mochila salto |
| ESC | Pausa |
| M | Toggle música |

### Mando Xbox
| Botón | Acción |
|-------|--------|
| Stick izquierdo | Mover (análogo) |
| Stick derecho | Apuntar (deadzone 0.15, aim assist ~17°) |
| RT | Disparar / Confirmar targeting |
| LT | Lanzar granada |
| A | Recoger / Confirmar / Salto (doble tap 300ms) |
| B | Cancelar / Atrás |
| X | Recargar |
| Y (tap) | Alternar arma 1 ↔ 2 |
| Y (hold) | Cambiar a arma 3 (Comando) |
| LB | Modo estratagema (toggle) |
| RB | Sprint (hold) / Melee (tap) |
| D-Pad Up | Usar stim |
| D-Pad Right | Arma 4 (Granada) |
| D-Pad Left/Down | Input estratagema |
| Start | Pausa |
| Back | Música on/off |

### Móvil/Tablet — Mando Virtual (Landscape)
El canvas se divide en: zona de juego (800×600 central) + controles izquierda/derecha.

**Controlador izquierdo:**
- LT (esquina sup-izq), LB (junto a LT)
- Joystick izquierdo (movimiento)
- D-pad en cruz (+), arm=82, thick=22, cy=370
- Start (cy=530, r=16)

**Controlador derecho:**
- RB (junto a RT), RT (esquina sup-der)
- Joystick derecho (apuntar)
- Botones Y/cy=308, X/cx=42 cy=365, B/cx=158 cy=365, A/cy=422 (r=28)
- Back (cy=530, r=18)

- Auto-detección con persistencia en localStorage
- Toggle manual PC/Móvil
- Todos los botones mapean al mismo estado GP que un mando Xbox real
- Conectando mando real, el virtual se desactiva
- **Portrait**: "GIRA EL MÓVIL" + área de juego arriba, mensaje abajo

### Aim Assist (Mando)
- Busca enemigo dentro de ~17° del ángulo de apuntado
- Ajusta ligeramente el ángulo hacia el enemigo más cercano
- Stick en reposo = mantener último ángulo

### Rumble (Mando)
- Disparo: 100ms, fuerza 0.3
- Explosión cercana: 300ms, fuerza 0.8
- Recibir daño: 200ms, fuerza 0.5
- Stim: 100ms, fuerza 0.2
- Melee: 80ms, fuerza 0.3

---

## HUD

| Elemento | Posición | Color |
|----------|----------|-------|
| Barra de vida | Sup-izq (10,10,108×16) | Verde/Amarillo/Rojo según HP |
| HP numérico | Sobre barra | Blanco |
| Barra stamina | (10,30,108×8) | Azul / Rojo si agotado |
| "AGOTADO" | (70,38) | Rojo |
| Stims restantes | (12,50) | Verde |
| Vidas restantes | (12,64) | Cian |
| Dificultad + nivel | (12,78) | Rojo |
| Planeta | (12,92) | Gris |
| Estratagema activa | (12,104) | Cian |
| Score | Sup-der | Dorado |
| Kills | Sup-der | Naranja |
| Nests destruidos | Sup-der | Rojo |
| Timer | Sup-der | Blanco |
| Objetivo | Centro-sup (y=18) | Dorado |
| Arma info | Inf-centro (panel 160×48) | Variable |
| Recargando | Centro | Naranja |
| Voz ("Democracia!") | Centro (y=120) | Blanco, fade |
| Minimapa | Sup-der (90×70) | Nests rojo, enemigos naranja |
| Advertencias hazard | Centro | Rojo/Naranja |
| Muerte ("HELLDIVER CAÍDO!") | Centro | Rojo, overlay oscuro |

### Flechas SGUI
- Flechas vectoriales con **cola** (triángulo + línea de eje) para dirección clara
- Sin flecha por defecto antes de pulsar nada
- Tamaño 8px en input, 7px en lista de estratagemas

### Texto Flotante
- Al recoger items: `"+30 MUNICIONES"`, etc.
- Duración: **150 frames (2.5 segundos)**
- Flota hacia arriba (`vy=-1.2`), fade out en últimos 30 frames

---

## Audio

### Motor de Sonido
- Web Audio API con sintetizador 8-bit
- Funciones: `tone(f,d,t,v,dl)` para tonos, `nz(d,v,dl)` para ruido

### Sound Effects (SFX)
| Efecto | Descripción |
|--------|-------------|
| MG | Disparo ametralladora |
| Pistol | Disparo pistola |
| Rocket | Lanzamiento cohete |
| Grenade | Lanzamiento granada |
| ExplodeS | Explosión pequeña |
| ExplodeL | Explosión grande |
| Hit | Jugador recibe daño |
| HitE | Enemigo recibe daño |
| Kill | Enemigo muerto |
| Pickup | Recoger objeto |
| Heal | Usar stim |
| Strat | Estratagema activada |
| Drop | Cápsula hell aterriza |
| Nest | Nido destruido |
| Reload | Recarga de arma |
| Laser | Láser orbital |
| Scream | Muerte del jugador |
| NoAmmo | Sin munición |

### Música
- Archivos: `music.ogg` (1.8MB, primario) + `music.mp3` (3.3MB, fallback)
- Web Audio API: `fetch` + `decodeAudioData`, loop=true
- Volumen: 0.6 en menús, 0.3 durante gameplay
- Toggle: tecla M / botón Back

### Voice Lines
- Categorías: shoot, grenade, hit, kill, strat, stim, nest, drop, low
- Duración: 120 frames (2s) con fade in/out
- Selección aleatoria dentro de cada categoría

---

## Revive System
- **Vidas**: 5
- **Muerte**: animación 120 frames (2s), pantalla "¡HELLDIVER CAÍDO!" con causa y vidas restantes
- **Revive**: spawn seguro con búsqueda espiral (radio 150→500, paso 30px)
  - Evita todos los hazards (abismo, arena, agua, lava) y obstáculos
  - Munición completa al revivir
  - 120 frames de invulnerabilidad
- **5ª muerte**: "MISIÓN FALLIDA" → menú principal
- **Animación**: cápsula cae durante 120 frames, aterriza, jugador emerge
- **Death Drops**: al morir, items equipados (perro guardián, cohete comando, mochila de salto) se dispersan en radio ~35px alrededor del punto de muerte. Revivido con equipo por defecto. DROPS array: `{x,y,tp}`. Pulsante glow, labels, pickup con E/A al volver al punto de muerte

---

## Menús

### Pantallas
- **Título**: Logo HELLSNORKELS 2, personajes, versión clickable → changelog
- **Changelog**: Navegación ← →, ESC para volver
- **Dificultad**: 7 niveles con stats, navegación ↑↓, Enter/A
- **Planeta**: 4 planetas con efecto rotación 3D, navegación ← →, Enter/A
- **Pausa**: Continuar, Reiniciar, Menú Principal
- **Game Over**: Stats, "MISIÓN FALLIDA" / "CONDUCTA DESHONROSA"
- **Victoria**: "MISIÓN COMPLETADA", stats, tiempo

### Navegación
- Sin selección por defecto (`menuS=-1`), highlight solo en hover/tecla
- Enter/A solo cuando `menuS>=0`
- Compatible con teclado, mando (D-Pad + A/B) y táctil

---

## Sistema de Extracción

### Flujo
1. **Todos los nidos destruidos** → notificación "¡IR A LA EXTRACCION!" parpadeante en HUD
2. **Plataforma hexagonal** aparece en centro del mapa (MW/2, MH/2) con antena parpadeante
3. **Jugador se acerca** a la antena (<60px) → prompt [E]/[A]
4. **Terminal** se abre: pantalla completa estilo stratagema, secuencia aleatoria de 8 flechas
5. **Jugador introduce** secuencia con WASD/D-Pad → si correcta, extracción llamada
6. **Pelicano** vuela desde arriba, desciende, agarra al jugador con las patas, asciende y vuela fuera de pantalla
7. **Pantalla de victoria** con estadísticas detalladas

### Terminal
- Overlay fullscreen con borde verde, scanlines, título ">> SOLICITUD DE EXTRACCION <<"
- 8 flechas aleatorias (↑↓←→), progress bar, indicadores de acierto/error
- ESC/B cancela (vuelve al juego)
- Secuencia incorrecta: resetea input + shake

### Pelicano
- Sprite side-view: cuerpo blanco-gris, pico naranja, alas animadas
- Fases: flyin (desde arriba) → hover+descend → grab (agarra jugador) → ascend → fly away (sale por derecha)
- Cámara fija centrada en plataforma durante cinematica

### Pantalla de victoria
- "MISION COMPLETADA" + stats: tiempo, dificultad, planeta, kills, nidos, objetos, puntuación
- Menú: ↑↓ seleccionar, Enter/A confirmar
- Opciones: "Repetir misión" (mismas settings) / "Menu principal"

---

## Drop Pod Animación

### Primer Drop (~20s)
1. **Atmósfera** (0-50%): cápsula desde parte superior, partículas de reentrada, shake progresivo
2. **Mapa** (50-75%): vista cenital del terreno mientras cae
3. **Aterrizaje** (75-100%): tapa de alcantarilla + jugador emerge
- SFX.drop() al final, volumen música a 0.3

### Revive Drop (2s)
- Cápsula simple desde arriba, 120 frames
- Misma lógica de aterrizaje

---

## Deploy
- Script: `deploy.sh` con SFTP
- Cache busting: `?v=VERSION` añadido automáticamente a script tags en HTML
- Configuración: `deploy.conf` (host, user, dir)

---

## Changelog

### v1.0.0 — 2026.07.12
- Juego creado desde cero
- Jugador con movimiento, stamina y colisiones
- 4 armas, 7 dificultades, 3 planetas
- 5 tipos de Terminids
- Sistema de estratagemas
- Audio 8-bit con música dinámica
- Menús completos

### v1.1.0 — 2026.07.12
- Controles táctiles para móvil/tablet
- Joystick virtual, botones de acción, D-pad strat
- Auto-detección y persistencia

### v1.2.0 — 2026.07.12
- Perro Guardián funcional (1 disparo/segundo, 18 dmg)
- Pixel art mejorado recogibles
- Texto flotante al recoger
- Recoger requiere pulsar E

### v1.3.0 — 2026.07.12
- Comando: cohetes explotan al impacto
- Balance Comando: 67 directo, 25 splash
- Enemigos muertos ya no dropean
- Recogibles reducidos a 8 en mapa
- Sistema de refuerzos (humo amarillo, 5s timer)

### v1.4.0 — 2026.07.12
- Velocidad de enemigos escala con dificultad
- Arma 4 click-to-throw con distancia max
- Tecla G lanza granada en dirección apuntada

### v1.4.1 — 2026.07.12
- Escala de vida reducida (hm: 0.7→1.2 en vez de 0.5→2.2)

### v1.5.0 — 2026.07.12
- Soporte mando Xbox completo
- Aim assist + deadzone en stick derecho
- Rumble/vibración
- Button prompts según plataforma
- Barra de cooldowns solo visible en modo strat
- Navegación de menús con mando
- Documento SPECS.md creado

### v1.5.1 — 2026.07.12
- D-Pad Up: usar stim con mando
- D-Pad Right: cambiar a modo granada
- Laser sight permanente

### v1.5.2 — 2026.07.12
- Eliminado LT para granadas (solo arma 4 + RT)
- Eliminada tecla Q del modo estratagema
- Clipping de canvas
- Script de deploy SFTP

### v1.6.0 — 2026.07.12
- Mando virtual completo para móvil
- Canvas extendido: juego arriba, mando abajo
- Todos los botones mapean a GP (como mando real)
- Sprint automático al máximo del joystick

### v1.7.1 — 2026.07.12
- Layout responsive según orientación
- API Fullscreen con botón ⛶
- Mando virtual oculto con mando real/teclado
- Detección de input real (hasKeyboard, hasRealGP)
- Todos los menús navegables vía D-Pad + A/B, mouse, touch
- Bug fix: click no cascada por menús
- D-Pad rediseñado: 4 botones rectangulares
- HUD muestra nivel numérico
- Escalado de texto adaptativo (TS)
- Botón forzar modo Desktop↔Mobile
- Trayectoria de granada (parábola punteada)

### v1.8.0 — 2026.07.13
- Ventana de estratagemas rediseñada
- Flechas vectoriales en vez de Unicode
- Códigos de estratagema originales de Helldivers 2
- Personaje siempre朝向 arriba, solo arma gira
- Montañas en el mapa (8-12)
- Botón forzar modo Desktop↔Mobile

### v1.9.0 — 2026.07.13
- Colisión de proyectiles con terreno
- Física de granada rediseñada (arco visual + sombra)
- Bug fix flechas SGUI
- Nidos generan enemigos periódicamente
- Láser origina en punta del arma (24px)
- Deploy solo sube index.html

### v1.9.1 — v1.9.51 — Mejoras progresivas (2026.07.13)
- Refinamiento de físicas, UI, y balance general
- Optimizaciones de rendimiento

### v1.9.52 — 2026.07.14
- **Sistema de Hazards Completo**:
  - Abismo (Lunar): muerte instantánea, efecto visual pozo
  - Arenas movedizas (Desértico): sinkT 300f, escapeable, velocidad ×0.15
  - Lagos de agua (Boscoso): drownT 300f, escapeable, velocidad ×0.15
  - Lagos de lava (Volcánico): 2 zonas (exterior DOT + interior muerte)
  - Formas irregulares (genIrregular con multi-círculos)
- Outline sprites reducido (alpha 0.1)

### v1.9.53-67 — Refinamiento hazards (2026.07.14)
- Formas más alargadas, L-shapes
- Aumento densidad obstáculos (+50%)
- Mensajes HUD específicos por hazard
- Animaciones de lucha (arena, agua, fuego)
- Mensajes de muerte únicos
- Revive con búsqueda espiral segura

### v1.9.68-69 — Varios (2026.07.14)
- **Cápsulas Hell no desaparecen**: permanecen hasta recoger
- **Distancia máxima estratagemas**: 180px (como granadas)
- **Cápsula mata enemigos**: solo al de mayor nivel bajo ella
- **Láser orbital**: duración 600f (10s, antes 5s)
- **Águila con animación**: avión futurista sobrevuela y suelta bombas
- **Texto flotante**: 150f (2.5s, antes 80f)

### v1.9.70 — 2026.07.14
- Flechas SGUI rediseñadas con cola (triángulo + eje)
- Eliminada flecha por defecto en input

### v1.9.71-72 — 2026.07.14
- Cadencia ametralladora: fr:5→fr:8 (7.5/s)
- Cadencia perro guardián: 60f→120f (2s)

### v1.9.73 — 2026.07.14
- Bug lava arreglado: se aplica velocidad reducida en PL.vx/PL.vy
- Formas hazards más grandes y alargadas (genIrregular linear + genLShape)
- L-shapes: 2 por tipo de hazard

### v1.9.74-75 — 2026.07.14
- Velocidad en hazards reducida drásticamente: lava ×0.05, agua ×0.06, arena ×0.08
- Bug burn block: eliminado return temprano en burning state

### v1.9.76 — 2026.07.14
- Cápsula Hell mata solo al enemigo de mayor nivel (sv)

### v1.9.77 — 2026.07.14
- SPECS.md actualizado con todas las especificaciones del juego
- Correcciones de documentación

### v1.9.78 — 2026.07.14
- **Death drops**: al morir,.items equipados (perro, cohetes, salto) se dispersan alrededor del punto de muerte, revivido con equipo por defecto
- **Y hold**: tap Y alterna armas 1↔2, hold Y 1s → arma 3 (requiere hasCmd)
- **Proyectil enemigo vs jugador**: acid de Spewer ahora daña y reduce 15 stamina en impacto
- **Drops pickupable**: items caídos tienen提示 E/A, glow pulsante, labels

### v1.9.79 — 2026.07.14

### v1.9.80 — 2026.07.14
- **Expulsión automática de enemigos**: si un enemigo queda dentro de un obstáculo o hazard, es expulsado automáticamente hacia la dirección libre más cercana
- **Nidos destruidos**: nidos permanecen en mapa como cráter humeante con cruz roja, dejan de generar enemigos
- Corrección bug: granadas/explosiones no dañan nidos ya destruidos

### v1.9.81 — 2026.07.15
- **Sistema de extracción**: al destruir todos los nidos, aparece plataforma hexagonal en centro del mapa con antena
- **Terminal de extracción**: acercarse a la antena y pulsar E/A abre terminal con secuencia aleatoria de 8 flechas
- **Pelicano**: tras completar secuencia, Pelicano gigante vuela, agarra al jugador con las patas y se lo lleva
- **Pantalla de victoria mejorada**: estadísticas detalladas (tiempo, dificultad, planeta, kills, nidos, objetos, puntuación)
- **Repetir misión**: opción para reiniciar con misma dificultad y planeta
- **Contadores de recolección**: tracking de munición, granadas, stims y objetos recogidos

### v1.9.81 — 2026.07.14

### v1.9.82 — 2026.07.14

### v1.9.83 — 2026.07.15

### v1.9.84 — 2026.07.15

### v1.9.85 — 2026.07.15

### v1.9.86 — 2026.07.15

### v1.9.87 — 2026.07.15

### v1.9.88 — 2026.07.15

### v1.9.89 — 2026.07.15

### v1.9.90 — 2026.07.15

### v1.9.91 — 2026.07.15

### v1.9.92 — 2026.07.15

### v1.9.93 — 2026.07.15

### v1.9.94 — 2026.07.15

### v1.9.95 — 2026.07.15

### v1.9.96 — 2026.07.15
