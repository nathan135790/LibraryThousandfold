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
