# Library of the Thousandfold — Grand Gate

A ready-to-import Foundry Virtual Tabletop **D&D 5e** scene and NPC pack for a great library entrance.

## Contents

- `Grand Gate` battlemap (2048×2048 WebP, 5-ft grid, 85-px squares / approx. 24×24)
- Scene with mapped walls, **two separately openable gate doors**, ambient light and preplaced NPC tokens
- `Scholar Guard` (CR 1, AC 16, HP 27) with a halberd attack, portraits and token art
- `Grand Library Librarian` (CR 1/8, AC 11, HP 13) with a letter-opener attack, portrait and token art
- An importer that creates the scene and actors in the world on confirmation when the GM first enables the module

## Install in Foundry

**From manifest URL (recommended after publication):**

```
https://raw.githubusercontent.com/nathan135790/LibraryThousandfold/main/module.json
```

Foundry Setup → Add-on Modules → Install Module → Manifest URL. Enable the module in a D&D 5e world and confirm the import prompt. The map will appear in **Scenes** and the two NPC types in **Actors**.

**Manually:** Download `dist/library-thousandfold.zip` or the downloadable ZIP linked from ChatGPT. Extract all ZIP contents into `Data/modules/library-thousandfold/` (the `module.json` file should be at `Data/modules/library-thousandfold/module.json`). Restart Foundry and enable the module.

## Re-import without overwriting

As GM in the Foundry browser console (F12):

```js
await LibraryThousandfold.importContent()
```

The importer checks tagged scene and actors to avoid duplicate imports. It does **not** overwrite edits you've made to existing imported documents. Delete tagged documents before re-importing only if you intentionally want fresh defaults.

## Scene notes

Two halves of the monumental gate are configured as **doors** in the Foundry wall layer. Double-click or interact with each door control in the scene to open it. The walkable forecourt includes a short stair approach, planters and flanking pools. You can fine-tune individual wall segments in Foundry's Wall Controls for your preferred movement behavior.

Four tokens are preplaced: two Scholar Guards at the stairs and two Librarians near the gate. Guard and librarian sheets contain starting stats, rollable weapon activities and roleplay hooks. Rebalance for your party level if necessary.

**Compatibility target:** Foundry v13 / D&D5e v4–6, with v12 support expected but not runtime-tested. The module contains no external module dependencies.

## Source

The art was created specifically for this campaign. No external art downloads are needed after module installation.