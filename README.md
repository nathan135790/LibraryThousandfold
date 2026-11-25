# Library of the Thousandfold — FoundryVTT Module (v1.2.0)

Contains **two** linked campaign locations: the previously created **Grand Gate** entrance and the new **Grand Library — First Floor** (3072×2048 WebP). Existing actor art and Oswald Pendlewick are preserved.

## What is new in v1.2.0

- A first-floor interior scene based on the approved library illustration with a **5-ft square grid** (128 px), walls around every room, configured door controls and a large playable book hall.
- Staff and secure routes: **Restricted Archives → Mail Room only**; **Artifact Vault → Security Room only**; **Portal Chamber → Head Librarian’s Office only**. The Head Librarian’s Office has a second door to the Grand Hall. No stairs/elevator or second floor.
- Freestanding bookshelves block vision/movement as physical objects. Torch lighting and a magical portal glow are preconfigured. The interior scene includes 10 preplaced tokens (from 7 existing/new NPC actor templates), including Oswald as a seemingly ordinary scholar.
- Four new actor types: Thousandfold Mail Clerk, Book Conservator, Head Librarian, and Artifact Vault Warden. Reuses the original guard/librarian artwork rather than inventing separate portraits.
- Upgrade-safe importer detects the previous gate/Oswald documents by source flags, then offers the **new interior scene and staff** without overwriting your edits.

## Install / update

Paste the [module manifest](https://raw.githubusercontent.com/nathan135790/LibraryThousandfold/main/module.json) into Foundry Setup → Add-on Modules → Install Module; then enable the module in your D&D 5e world.

When you load a world as GM, accept the import prompt. If you declined the prompt, open the GM browser console and run:

```js
await LibraryThousandfold.importInterior()
```

You may also import everything using `await LibraryThousandfold.importContent()` or add Oswald alone with `await LibraryThousandfold.importOswald()`.

Manual install: Extract the *contents* of `dist/library-thousandfold.zip` into `Data/modules/library-thousandfold/` so `module.json` sits at the module root. Restart Foundry and enable it.

## Scene/room guide

| Room | How to reach it |
| --- | --- |
| Grand Library Hall | Main front double doors |
| Reception Desk | One entrance from the hall on its eastern wall |
| Restoration Workshop | One entrance from the hall; **no** archive access |
| Quiet Studies 1, 2, 3 | One entrance each from the hall |
| Mail Room | Door from hall; branch to Restricted Archives and Security |
| Restricted Archives | **Only** through the locked door to the Mail Room |
| Security Room | Through Mail Room; maintains the locked Artifact Vault door |
| Artifact Vault | **Only** through the Security Room |
| Head Librarian's Office | One door to the Hall, one visible door to the Portal Chamber |
| Portal Chamber | **Only** through the Head Librarian's Office |

## GM notes

These doors are modeled as Foundry wall-door segments, not animated artwork. Locked restricted/vault doors require the GM to unlock them using wall controls. Lighting is provided by the scene and the portal glows blue/purple. **No teleportation automation or encounter scripting** is included; configure the portal's destination when you create that scene.

The illustration contains room-name lettering, so you can see which room is which while GMing. Oswald's actor sheet includes **GM-only time-artifact spoilers**: restrict access to his sheet if your players shouldn't know his abilities.

**Compatibility target:** Foundry V13 and D&D 5e (v4–6). Not runtime-tested inside Foundry; walls/door positions may be adjusted via wall controls.

## Automatic ZIP build

Changes to module source pushed to the `main` branch trigger `.github/workflows/build-module.yml`, which packages all module files into `dist/library-thousandfold.zip` and publishes a workflow artifact.

## v1.2.1

The First Floor battlemap is now provided without baked-in room name labels, while the scene, door walls and NPCs remain unchanged.

## Ability icons (v1.2.2)

18 distinct custom WebP icons in `assets/icons/` are now assigned to all NPC actions and features in the module's actor JSON. Shared abilities reuse the same icon. The icon migration runs when a GM loads the updated module and only replaces a tagged actor's existing stock Foundry icon, preserving custom icons. The Foundry console can also trigger the migration:

```js
await LibraryThousandfold.updateItemIcons()
```

The icon update changes only actor item artwork, not actor stats, features, scene walls, maps, or tokens.

## Oswald Pendlewick: Temporal Strain (v1.3.0)

Oswald is a **fragile human scholar**, not an innately powerful time wizard (suggested AC 12, 32 HP, CR 1). He can use modest **ordinary** magic, including Arcane Spark, Mage Hand, Minor Illusion, Prestidigitation, Detect Magic, Shield, and Misty Step. Ordinary magic costs **no Temporal Strain**; normal D&D 5e spell rules still apply.

The **Hourglass of Unfinished Moments** has no charges, no daily cap, and no recharge limit. Each use accumulates Temporal Strain on Oswald's actor (via Foundry actor flags). It does not undo other combat history automatically.

| Power | Strain | Activation |
|---|---:|---|
| Chronal Pulse | 1 | Action |
| Stolen Seconds | 1 | Bonus action |
| Momentary Pause | 2 | Action |
| Rewind a Blow | 2 | Reaction |
| Rewind the Thread | 4 | Reaction |

**Effects and life cost:**
- 0–2 strain: stable.
- 3–5: half walking speed.
- 6–8: disadvantage on attacks and checks, immediately permanently lose **1d4 years** upon first crossing 6.
- 9+: permanently lose **1d6 more years** on first crossing 9; **every use at 9+** inflicts **2d6 HP damage** and a **Constitution save, DC 10 + (current strain − 9)**, or Oswald becomes unconscious. Each later activation, while already at 9+, also loses **1d6 years**.
- **Long rest** manually recovers 3 strain but **never** returns lost years (and does not clear unconsciousness or heal backlash).

The module tracks current strain, years lost, stage, the automatic movement/roll effects, damage, saving throw, and collapse. It posts the outcome to **GM-only chat**; teleport destinations, targets, roll rerolls, and event rewinds remain **GM adjudicated**.

**Use in Foundry:** A GM macro named **Oswald — Hourglass Controls** is created after module upgrade. Put this macro on your hotbar, select Oswald's token (if one is present), and choose a power or a long rest. You may also use the button from the features' D&D 5e activity controls; supported activity use automatically applies the same strain rules:

```js
LibraryThousandfold.openOswaldTimePanel()
await LibraryThousandfold.useOswaldPower("rewind-the-thread")
await LibraryThousandfold.restOswald()
await LibraryThousandfold.upgradeOswald()
```

On first load as GM, the module attempts a **careful one-time Oswald upgrade**. It updates matching default actor stats, replaces outdated per-day features, and adds new abilities. Custom-edited numeric stats are preserved when they no longer match the old template. Back up your world before updating; previously imported unlinked scene tokens may have their own actor deltas. To upgrade a selected synthetic Oswald token, open its GM control panel before use. Other NPCs, maps, walls, and the library scenes are untouched.

**Compatibility:** Designed for Foundry V13, D&D5e v6. The module includes compatibility fallbacks for Foundry V12 / D&D5e v4–5 but precise roll-mode enforcement has not been tested in a live world. No Midi-QOL or other dependency is required.

Developers can run pure rules tests with `node --test tests/temporal-rules.test.mjs`.

## v1.3.1 — Grand Library floor expansion

The library interior is now available in an **expanded, playable 48 × 32-square version**, compared with the original 24 × 16-square scene. At **5 ft per square** and a **128-pixel grid**, that gives 240 × 160 feet of area (compared with 120 × 80 feet): **2× width, 2× length, 4× floor area**.

The expanded scene dimensions are **6144 × 4096**. Unlike merely upscaling a picture while also enlarging the grid, the grid size stays unchanged. Medium player tokens still occupy 1 × 1 square, so corridors, rooms and gaps between shelves offer more room to move. The existing unlabeled library image is rendered at the enlarged scene dimensions; the art is unchanged (and may look softer when zoomed in).

**Existing worlds:** Reload the updated module as GM and accept the prompt. The importer creates **Grand Library — Expanded** as a *separate scene*. It duplicates your existing first-floor scene, if present, and scales its current walls, doors, lights, tokens, tiles and drawings while retaining their placement relative to the room layout. Your original interior scene, actor documents, and gate scene remain untouched. Already placed Medium tokens remain one square.

**New worlds:** The standard content importer creates the expanded interior directly; the original smaller scene template remains available for optional manual import.

**Manual commands** (GM browser console):

```js
await LibraryThousandfold.importExpandedInterior() // Safe to call again; avoids duplicates
await LibraryThousandfold.importInterior() // Legacy smaller map, if desired
```

**Access rules preserved:** Restricted Archives only through the Mail Room; Artifact Vault through Security; Portal Chamber through the Head Librarian's Office. Locked doors stay locked, with the same 13 interactive door segments and 19 lights. Character actors, item icons, and Oswald's Temporal Strain rules are unchanged.

There is no active Foundry server connected for live rendering tests. Run in a backup or test world first if your existing interior scene has extensive custom modules or region data.

## v1.4.0 — First-floor atrium, staircase, elevator & staff spiral (2026-11-25)

**The proposed first-floor redesign was approved by the GM and packaged as a separate scene, not as an overwrite of existing campaign data.** It uses the approved unlabeled first-floor illustration. Its principal architectural landmarks line up by normalized position with the second-floor concept in the shared DND design reference.

**New scene:** `Grand Library — Atrium F1`, 8000 × 5400 px, **80 × 54 five-foot squares** at 100 px/grid. This production-prototype footprint preserves the matching 1536:1024 art aspect ratio, with **normal-size furniture** and free lanes rather than stretching the old 48 × 32 art. The previously proposed 80 × 65 floor footprint remains a provisional target for both floors, and is **not** the actual geometry of this deliverable.

**Import:** As GM, update the module and reload the world, then accept the prompt to import the redesigned first floor. It coexists with `Grand Library — Expanded` (48 × 32 squares), `Grand Library — First Floor` (24 × 16), and the Grand Gate; no existing scenes, tokens or actor documents are overwritten. To import on demand from the GM browser console:
```js
await LibraryThousandfold.importAtriumFirstFloor()
```
Repeated calls return the existing atrium scene.

**What is configured:** 81 wall segments, **14 door segments** (two front entrance leaves), **2 locked doors** (Restricted Archives through Mail Room; Artifact Vault through Security), 25 scene light sources (including portal glow), configured room boundaries, bookshelf and pillar collision/sight blocking, and 10 placed NPCs including Oswald Pendlewick at a normal open-hall desk. The Portal Chamber still connects **only to the Head Librarian's Office**, which also connects to the public hall. There is no archive-to-restoration passage.

**Shared second-floor alignment:**
- South-center **grand staircase** approximately at source art (760, 833), which matches the second-floor concept's main landing.
- Brass **book elevator** immediately west approximately at (600, 829).
- **Staff spiral staircase** immediately east approximately at (947, 829).
- The central grand hall is double-height beneath the open second-floor atrium.
- Four structural support pillars correspond to the upstairs balcony support axis.

These are design concept coordinates, not final measured second-floor geometry. Stair/elevator destinations are recorded in scene flags but **no teleportation triggers or second-floor scene** are installed, because the second floor is still being designed. Set the final travel transitions after that scene exists; coordinate both floors before final production use.

**Reference:** [Second-floor v2 concept](https://drive.google.com/file/d/1CTR-exKtuugCi_NRKWJvkrPONIGx7gc4/view) · [Shared architecture and pending choices](https://github.com/nathan135790/dnd-data/blob/master/Data/locations/library/DESIGN.md).

**Testing:** The JSON asset, room-connection flags, 5-foot grid, image, wall coordinates, locked-door counts and light bounds were validated locally. Not yet tested live in Foundry; check token movement and door positions on a test world. The redesigned scene is deliberately additive.

## v1.5.0 — Second-floor encounter prototype

Adds a separate 8000 × 5400 scene (80 × 54 five-foot squares, 100 px/grid) aligned by normalized art position to Atrium F1. Preserves all existing scenes and Oswald's mechanics. The expanded concept WebP retains baked-in room labels and has illustrative rather than surveyed geometry. The northern staff corridor and secret door are not present. Walls include the atrium railing, room doors, and approximate furniture collisions. Ten staff tokens are placed, not Oswald or hostile creatures.

- 32 new actor templates (15 staff/variants, nine creatures, eight generic PC echoes), 41 standalone draft item entries (existing exact-name world items reused), 9 GM journals, 6 roll tables, a GM control macro, and 50 original simple SVG icons (not full painted portraits). Staff reuse original artwork; echo actors are placeholders, not copies of player sheets.
- NPC attacks use D&D 5e activity data; special powers and inventory effects are primarily descriptive and GM-adjudicated. All new CRs and item rules are provisional. The existing Hourglass feature/strain controller is unchanged. A transferable reference item is included, not a player strain implementation.
- Import missing content from the GM prompt or `await LibraryThousandfold.importSecondFloor()`. Repeat imports reuse source flags and exact-name items. F1 can be imported with `importAtriumFirstFloor()`.
- Run **Thousandfold — Library GM Controls** to roll encounters privately, record alert state, spawn a creature near a selected token, use existing Oswald controls, or move selected tokens between floors via grand staircase, elevator or staff spiral. Travel is explicit GM action, not automatic region teleportation. Confirm clear landing, avoid active combat, inspect destination and activate the scene for players if desired. Security alert does not automatically modify doors. Mirror and other room encounters use journal instructions and roll tables rather than clickable tiles.
- Static tests check source counts, image references and scene bounds. No live Foundry instance was available; test import, walls, light behavior, token transfer and activity compatibility in a backup world before running a session.
