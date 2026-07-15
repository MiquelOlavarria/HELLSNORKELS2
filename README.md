# HELLSNORKELS 2

> *¡Managed Democracy needs YOU... to snorkel into bug territory!*

Un fan-juego gratuito y sin ánimo de lucro inspirado en **HELLDIVERS 2**, con estética retro estilo NES/SNES. Juega desde el navegador, sin instalar nada.

[![Play now](https://img.shields.io/badge/%F0%9F%8E%AE-PLAY%20NOW-brightgreen?style=for-the-badge)](https://web.intra.sqmnet.es)

---

## Contenido

| | |
|---|---|
| **Plataforma** | Navegador web (PC, móvil, tablet) |
| **Controles** | Teclado + ratón / Mando Xbox / Táctil |
| **Biomas** | Lunar, Desértico, Boscoso, Volcánico |
| **Dificultades** | 7 niveles (Tirado → Helldiver) |
| **Armas** | Ametralladora, Pistola, Comando, Granadas, Combo cuerpo a cuerpo |
| **Stratagems** | Guard Dog, Orbital Laser, Eagle Cluster, Jump Pack, Lanz Cohetes, Suministros |

---

## Cómo jugar

1. Abre el enlace en tu navegador
2. Selecciona dificultad y planeta
3. Destruye todos los nidos de Terminids
4. ¡Extracción en el centro del mapa!

### Controles

| Acción | Teclado | Mando |
|--------|---------|-------|
| Mover | WASD | Left Stick |
| Apuntar | Ratón | Right Stick |
| Disparar | Click | RT |
| Granada | G | LT |
| Melee | F | RB |
| Interactuar | E | A |
| Recargar | R | X |
| Cambiar arma | 1-2 | Y (tap) |
| Stratagem | Tab | LB |
| Sprint | Shift | L3 |

---

## Arquitectura

```
index.html          → Router (redirige a mobile o desktop)
desktop.html        → Wrapper escritorio
mobile.html         → Wrapper móvil
game.js             → Motor compartido (~3000 líneas)
input-desktop.js    → Entrada teclado + ratón + mando
input-mobile.js     → Táctil (Virtual GamePad)
```

---

## Estratagemas

| Nombre | Secuencia | Efecto |
|--------|-----------|--------|
| Guard Dog | ↓↑↓↑↑↓ | Drone de combate autónomo |
| Orbital Laser | →↓↑→↓ | Láser orbital (10s) |
| Eagle Cluster | ↑→↓↓→ | Ataque aéreo con clúster |
| Jump Pack | ↓↑↑↓ | Impulso vertical |
| Lanz Cohetes | ↓←→→← | Lanzacohetes portátil |
| Suministros | ↓←↓↑↓↑↓ | Munición + salud + granadas |

---

## Aviso legal

**HELLSNORKELS 2** es un fan-game gratuito y parodia de **HELLDIVERS 2**. No tiene ánimo de lucro y no pretende reemplazar la obra original.

Todos los derechos de **HELLDIVERS 2** pertenecen a **Arrowhead Game Studios** y **Sony Interactive Entertainment**.

---

Hecho con ❤️ y muchos errores de segmentation en la psyche humana.
