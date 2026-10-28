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
