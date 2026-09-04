# game-screen (nodeId 26:159) — ruta /game

Respuesta cruda de `get_design_context`. fileKey de la copia `hxwh2tRvdUhhLhe4ciEdNq`. Frame 402×874. Extraído 2026-09-04.

## Captura (descripción)

- Cuerpo px 20, gap 18.
- game-header: "FAN ARCADE" Unbounded Black 20 blanco; a la derecha chip "PROTOTIPO" Unbounded Bold 9 #f72585 tracking .6, fondo rgba(247,37,133,.16), borde rgba(247,37,133,.55), radio 999, px 12 py 6.
- game-hud: tres tarjetas flex-1 gap 12, fondo #141420 borde rgba(255,255,255,.08) radio 18 p 12, centradas, gap 3: etiqueta Unbounded Bold 9 #9090a8 tracking .6 (SCORE / STREAK / BEST) y valor Unbounded Black 18 blanco (0 / 4 / 12,400).
- game-stage-placeholder: 262px alto, radio 24, fondo #141420, borde 2px discontinuo rgba(157,78,221,.6), p 24, columna centrada gap 14: icono gamepad 57px (#9090a8), "ÁREA DE JUEGO" Unbounded Bold 15 blanco tracking .4, texto Inter Regular 12 #9090a8 centrado en 3 líneas (line-height 19): "Espacio reservado para el minijuego. / La mecánica y la temática se definen / en la siguiente entrega.", tag "PLACEHOLDER" Inter Bold 9 #9090a8 tracking .8, fondo rgba(255,255,255,.06), borde rgba(255,255,255,.08), radio 999, px 11 py 5.
- play-cta: 60px, radio 30, gradiente #9d4edd→#f72585, sombra 0 8 24 rgba(247,37,133,.35), "JUGAR AHORA" Unbounded Black 16 blanco.
- leaderboard-section: "WEEKLY LEADERBOARD" Unbounded Bold 12 #9090a8; lista gap 8 de filas: fondo #141420, borde rgba(255,255,255,.08), radio 16, pl 14 pr 16 py 11, gap 12: posición Unbounded Black 13 #9090a8 · avatar 30 redondo fondo rgba(255,255,255,.1) con iniciales Inter Bold 11 blanco · nombre Inter Medium 13 blanco flex-1 · puntos Unbounded Bold 12 #9090a8.
  - Fila 2 "Tú" resaltada: borde rgba(247,37,133,.55), posición y puntos en #f72585, avatar con gradiente #9d4edd→#f72585 e iniciales "SM".
  - Datos: 1 KM Kenji Morales 18,920 · 2 SM Tú 12,400 · 3 AR Ana Ruiz 11,150.
- Tab bar: Game activo. Home indicator: NO reproducir.

## Comportamiento a implementar (según encargo)

- El área de juego es placeholder marcado como tal. "Jugar ahora" solo muestra un estado de "próximamente".

## Assets

Sin imágenes. Solo SVGs de iconos (gamepad, tab bar) que se generan con lucide.

## Código devuelto (React + Tailwind, referencia resumida)

```jsx
export default function GameScreen() {
  return (
    <div className="bg-[#0c0c12] ... rounded-[40px] size-full" data-node-id="26:159" data-name="game-screen">
      <!-- status-bar 44 -->
      <div className="flex flex-col gap-[18px] overflow-clip px-[20px] w-full" data-node-id="36:53" data-name="game-content">
        <div className="flex items-center justify-between w-full" data-name="game-header">
          <p className="font-['Unbounded:Black'] text-[20px] text-white">FAN ARCADE</p>
          <div className="bg-[rgba(247,37,133,0.16)] border border-[rgba(247,37,133,0.55)] px-[12px] py-[6px] rounded-[999px]" data-name="beta-chip"><p className="font-['Unbounded:Bold'] text-[#f72585] text-[9px] tracking-[0.6px]">PROTOTIPO</p></div>
        </div>
        <div className="flex gap-[12px] w-full" data-name="game-hud">
          <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex flex-[1_0_0] flex-col gap-[3px] items-center p-[12px] rounded-[18px]" data-name="hud-score">
            <p className="font-['Unbounded:Bold'] text-[#9090a8] text-[9px] tracking-[0.6px]">SCORE</p>
            <p className="font-['Unbounded:Black'] text-[18px] text-white">0</p>
          </div>
          <!-- hud-streak 4 · hud-best 12,400 -->
        </div>
        <div className="bg-[#141420] border-2 border-[rgba(157,78,221,0.6)] border-dashed flex flex-col gap-[14px] h-[262px] items-center justify-center p-[24px] rounded-[24px] w-full" data-name="game-stage-placeholder">
          <div className="size-[57.2px]" data-name="stage-icon"><div className="absolute inset-[12.5%_20.83%]"><img src={imgGamepad} /></div></div>
          <p className="font-['Unbounded:Bold'] text-[15px] text-center text-white tracking-[0.4px]">ÁREA DE JUEGO</p>
          <div className="font-['Inter:Regular'] text-[#9090a8] text-[12px] text-center">
            <p className="leading-[19px]">Espacio reservado para el minijuego.</p>
            <p className="leading-[19px]">La mecánica y la temática se definen</p>
            <p className="leading-[19px]">en la siguiente entrega.</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] px-[11px] py-[5px] rounded-[999px]" data-name="placeholder-tag"><p className="font-['Inter:Bold'] text-[#9090a8] text-[9px] tracking-[0.8px]">PLACEHOLDER</p></div>
        </div>
        <div className="bg-gradient-to-r flex from-[#9d4edd] h-[60px] items-center justify-center rounded-[30px] shadow-[0px_8px_24px_0px_rgba(247,37,133,0.35)] to-[#f72585] w-full" data-name="play-cta"><p className="font-['Unbounded:Black'] text-[16px] text-white">JUGAR AHORA</p></div>
        <div className="flex flex-col gap-[12px] w-full" data-name="leaderboard-section">
          <p className="font-['Unbounded:Bold'] text-[#9090a8] text-[12px]">WEEKLY LEADERBOARD</p>
          <div className="flex flex-col gap-[8px] w-full" data-name="leaderboard-list">
            <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex gap-[12px] items-center pl-[14px] pr-[16px] py-[11px] rounded-[16px] w-full" data-name="lb-1">
              <p className="font-['Unbounded:Black'] text-[#9090a8] text-[13px]">1</p>
              <div className="bg-[rgba(255,255,255,0.1)] flex items-center justify-center rounded-[999px] size-[30px]" data-name="lb-avatar"><p className="font-['Inter:Bold'] text-[11px] text-white">KM</p></div>
              <p className="flex-[1_0_0] font-['Inter:Medium'] text-[13px] text-white">Kenji Morales</p>
              <p className="font-['Unbounded:Bold'] text-[#9090a8] text-[12px]">18,920</p>
            </div>
            <div className="bg-[#141420] border border-[rgba(247,37,133,0.55)] ..." data-name="lb-2">
              <p className="font-['Unbounded:Black'] text-[#f72585] text-[13px]">2</p>
              <div className="bg-gradient-to-r from-[#9d4edd] to-[#f72585] ... size-[30px]"><p className="text-[11px] text-white">SM</p></div>
              <p className="flex-[1_0_0] font-['Inter:Medium'] text-[13px] text-white">Tú</p>
              <p className="font-['Unbounded:Bold'] text-[#f72585] text-[12px]">12,400</p>
            </div>
            <!-- lb-3: 3 AR Ana Ruiz 11,150 -->
          </div>
        </div>
      </div>
      <!-- bottom-nav-area: tab-bar (Game activo) + home-indicator -->
    </div>
  );
}
```
