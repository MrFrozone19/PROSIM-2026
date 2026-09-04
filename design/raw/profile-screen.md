# profile-screen (nodeId 26:53) — ruta /profile (se llega por el avatar de Home, no por pestaña)

Respuesta cruda de `get_design_context`. fileKey de la copia `hxwh2tRvdUhhLhe4ciEdNq`. Frame 402×874. Extraído 2026-09-04.

## Captura (descripción)

- Cuerpo px 20, gap 18.
- profile-header: "MY PROFILE" Unbounded Black 20 blanco; chip "SETTINGS" Unbounded Bold 10 #9090a8 tracking .6, fondo rgba(255,255,255,.06), borde rgba(255,255,255,.08), radio 999, px 14 py 7.
- identity-card: fondo #141420, borde rgba(255,255,255,.08), radio 24, p 20, gap 18.
  - identity-row gap 16: avatar 72 redondo gradiente #9d4edd→#f72585 con "SM" Unbounded Black 24 blanco; textos gap 5: "Juan Pérez" Unbounded Bold 17 blanco; "@foopball_fan  ·  Fan desde 2024" Inter Medium 12 #9090a8; pill "NYY · AL EAST" Inter Bold 10 #f72585 tracking .8, fondo rgba(247,37,133,.16), borde rgba(247,37,133,.55), radio 999, px 10 py 5.
  - fan-level gap 9: fila "FAN LEVEL 7" Unbounded Bold 12 blanco / "2,480 / 3,000 XP" Inter Medium 11 #9090a8; barra 8px radio 999 fondo rgba(255,255,255,.1) con relleno gradiente 266px de 322 (≈83%).
- stats-row: tres tarjetas flex-1 gap 12, fondo #141420 borde rgba(255,255,255,.08) radio 20 p 14 centradas gap 3: valor Unbounded Black 22 blanco y etiqueta Unbounded Bold 9 #9090a8 tracking .6 (24 CLIPS · 9 TROPHIES · 60 CARDS).
- trophies-section: "RECENT TROPHIES" Unbounded Bold 12 #9090a8; fila de 3 tarjetas flex-1 gap 12, radio 20, px 10 py 14, gap 8, centradas: medalla 40 redonda con iniciales Unbounded Black 13 blanco; nombre Inter Bold 10 blanco centrado; rareza Unbounded Bold 8 tracking .5.
  - AE "AL East Champs" MYTHIC: borde rgba(247,37,133,.55), medalla #f72585, rareza #f72585.
  - PS "Perfect Scan" LEGENDARY: borde rgba(255,183,3,.55), medalla gradiente #ffb703→#f72585, rareza #ffb703.
  - FH "First Homerun" EPIC: borde rgba(157,78,221,.55), medalla gradiente #9d4edd→#f72585, rareza #9d4edd.
- account-section: "ACCOUNT" Unbounded Bold 12 #9090a8; lista gap 8 de filas fondo #141420 borde rgba(255,255,255,.08) radio 16 px 16 py 13: etiqueta Inter Medium 13 blanco, valor Inter Medium 12 #9090a8 + "›". Filas: Favorite team → New York Yankees; AR quality → High; Notifications → On; Sign out (todo en #f72585).
- Tab bar: en este frame Home aparece activo (llegamos desde Home). En la app, ninguna pestaña activa en /profile (el encargo lo pide así); se muestra la tab bar igual.
- Home indicator: NO reproducir.

## Assets

Sin imágenes. Solo SVGs de tab bar (lucide).

## Código devuelto (React + Tailwind, referencia resumida)

```jsx
export default function ProfileScreen() {
  return (
    <div className="bg-[#0c0c12] ... rounded-[40px] size-full" data-node-id="26:53" data-name="profile-screen">
      <!-- status-bar 44 -->
      <div className="flex flex-col gap-[18px] px-[20px] w-full" data-node-id="28:53" data-name="profile-content">
        <div className="flex items-center justify-between w-full" data-name="profile-header">
          <p className="font-['Unbounded:Black'] text-[20px] text-white">MY PROFILE</p>
          <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] px-[14px] py-[7px] rounded-[999px]" data-name="settings-chip"><p className="font-['Unbounded:Bold'] text-[#9090a8] text-[10px] tracking-[0.6px]">SETTINGS</p></div>
        </div>
        <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex flex-col gap-[18px] p-[20px] rounded-[24px] w-full" data-name="identity-card">
          <div className="flex gap-[16px] items-center w-full" data-name="identity-row">
            <div className="bg-gradient-to-r from-[#9d4edd] to-[#f72585] flex items-center justify-center rounded-[999px] size-[72px]" data-name="avatar"><p className="font-['Unbounded:Black'] text-[24px] text-white">SM</p></div>
            <div className="flex flex-col gap-[5px]" data-name="identity-text">
              <p className="font-['Unbounded:Bold'] text-[17px] text-white">Juan Pérez</p>
              <p className="font-['Inter:Medium'] text-[#9090a8] text-[12px]">@foopball_fan  ·  Fan desde 2024</p>
              <div className="bg-[rgba(247,37,133,0.16)] border border-[rgba(247,37,133,0.55)] px-[10px] py-[5px] rounded-[999px]" data-name="team-pill"><p className="font-['Inter:Bold'] text-[#f72585] text-[10px] tracking-[0.8px]">NYY · AL EAST</p></div>
            </div>
          </div>
          <div className="flex flex-col gap-[9px] w-full" data-name="fan-level">
            <div className="flex items-center justify-between w-full" data-name="level-row">
              <p className="font-['Unbounded:Bold'] text-[12px] text-white">FAN LEVEL 7</p>
              <p className="font-['Inter:Medium'] text-[#9090a8] text-[11px]">2,480 / 3,000 XP</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.1)] h-[8px] relative rounded-[999px] w-full" data-name="xp-track"><div className="absolute bg-gradient-to-r from-[#9d4edd] h-[8px] left-0 rounded-[999px] to-[#f72585] top-0 w-[266px]" data-name="xp-fill" /></div>
          </div>
        </div>
        <div className="flex gap-[12px] w-full" data-name="stats-row">
          <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex flex-[1_0_0] flex-col gap-[3px] items-center p-[14px] rounded-[20px]" data-name="stat-clips">
            <p className="font-['Unbounded:Black'] text-[22px] text-white">24</p>
            <p className="font-['Unbounded:Bold'] text-[#9090a8] text-[9px] tracking-[0.6px]">CLIPS</p>
          </div>
          <!-- stat-trophies 9 · stat-cards 60 -->
        </div>
        <div className="flex flex-col gap-[12px] w-full" data-name="trophies-section">
          <p className="font-['Unbounded:Bold'] text-[#9090a8] text-[12px]">RECENT TROPHIES</p>
          <div className="flex gap-[12px] w-full" data-name="trophy-row">
            <div className="bg-[#141420] border border-[rgba(247,37,133,0.55)] flex flex-[1_0_0] flex-col gap-[8px] items-center px-[10px] py-[14px] rounded-[20px]" data-name="trophy-AE">
              <div className="bg-[#f72585] flex items-center justify-center rounded-[999px] size-[40px]" data-name="medal"><p className="font-['Unbounded:Black'] text-[13px] text-white">AE</p></div>
              <p className="font-['Inter:Bold'] text-[10px] text-center text-white">AL East Champs</p>
              <p className="font-['Unbounded:Bold'] text-[#f72585] text-[8px] tracking-[0.5px]">MYTHIC</p>
            </div>
            <!-- trophy-PS (border rgba(255,183,3,.55), medal from-[#ffb703] to-[#f72585], LEGENDARY #ffb703) · trophy-FH (border rgba(157,78,221,.55), medal from-[#9d4edd] to-[#f72585], EPIC #9d4edd) -->
          </div>
        </div>
        <div className="flex flex-col gap-[12px] w-full" data-name="account-section">
          <p className="font-['Unbounded:Bold'] text-[#9090a8] text-[12px]">ACCOUNT</p>
          <div className="flex flex-col font-['Inter:Medium'] gap-[8px] w-full" data-name="account-list">
            <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex items-center justify-between px-[16px] py-[13px] rounded-[16px] w-full" data-name="row-favorite-team">
              <p className="text-[13px] text-white">Favorite team</p><p className="text-[#9090a8] text-[12px]">New York Yankees   ›</p>
            </div>
            <!-- row-ar-quality High · row-notifications On · row-sign-out (text-[#f72585]) -->
          </div>
        </div>
      </div>
      <!-- bottom-nav-area: tab-bar (Home activo en el frame) + home-indicator -->
    </div>
  );
}
```
