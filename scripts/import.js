import { expandSceneGeometry } from "./scene-scale.mjs";

const MODULE = "library-thousandfold";
const DATA = `modules/${MODULE}/data`;

Hooks.once("init", () => {
  for (const [key, name, hint] of [
    ["contentImported", "Gate content imported", "Tracks the original entrance scene and NPCs."],
    ["oswaldImported", "Oswald imported", "Tracks the time scholar."],
    ["interiorImported", "Library interior imported", "Tracks the first-floor scene and its staff actors."],
    ["expandedInteriorImported", "Expanded library imported", "Tracks the larger, token-friendly first-floor scene."],
    ["atriumInteriorImported", "First-floor atrium imported", "Tracks redesigned first floor with stair/lift/spiral connections."]
  ]) game.settings.register(MODULE, key, {name, hint, scope: "world", config: false, type: Boolean, default: false});
});

async function loadJson(path) {
  const response = await fetch(`${DATA}/${path}`);
  if (!response.ok) throw new Error(`Could not load ${path} (HTTP ${response.status})`);
  return response.json();
}
const hasSource = (doc, source) => doc.getFlag(MODULE, "source") === source;
const requireGm = () => {
  if (!game.user?.isGM) throw new Error("Only the GM may import this module's content.");
  if (game.system.id !== "dnd5e") throw new Error("This module requires the D&D 5e system.");
};

async function ensureActor(filename) {
  const data = await loadJson(`actors/${filename}`);
  const source = data.flags?.[MODULE]?.source;
  if (!source) throw new Error(`Missing library-thousandfold source flag in ${filename}`);
  return game.actors.find(actor => hasSource(actor, source)) ?? await Actor.create(data);
}
function makeToken(actor, x, y) {
  const token = actor.prototypeToken.toObject();
  delete token._id;
  return { ...token, x, y, actorId: actor.id, actorLink: false,
    name: actor.name, disposition: 0,
    texture: {...token.texture, src: actor.prototypeToken.texture.src} };
}
async function importOswald() {
  requireGm();
  const actor = await ensureActor("oswald-pendlewick.json");
  if (globalThis.LibraryThousandfold?.upgradeOswald) await globalThis.LibraryThousandfold.upgradeOswald(actor);
  await game.settings.set(MODULE, "oswaldImported", true);
  ui.notifications.info("Thousandfold: Oswald Pendlewick is available in Actors.");
  return actor;
}
async function importInterior() {
  requireGm();
  const [librarian, guard, clerk, conservator, head, warden, oswald] = await Promise.all([
    ensureActor("librarian.json"),
    ensureActor("scholar-guard.json"),
    ensureActor("mail-clerk.json"),
    ensureActor("restoration-conservator.json"),
    ensureActor("head-librarian.json"),
    ensureActor("vault-warden.json"),
    ensureActor("oswald-pendlewick.json")
  ]);
  let scene = game.scenes.find(scene => hasSource(scene, "grand-library-first-floor"));
  if (!scene) {
    const sceneData = await loadJson("scenes/grand-library-first-floor.json");
    // Coordinates are expressed in the 3072 × 2048 scene resolution.
    // Do not station Oswald in the office or vault: he blends into the public stacks.
    const tokenPlan = [
      [guard, 1420, 1690], [guard, 1980, 1680],        // Entry / hall watch
      [librarian, 1250, 990], [librarian, 255, 960], // Central stacks / Quiet Study 1
      [librarian, 360, 1650],                        // Reception
      [clerk, 1360, 210],                           // Mail Room
      [conservator, 205, 590],                       // Restoration Workshop
      [head, 2815, 595],                            // Head Librarian's Office
      [warden, 2030, 235],                          // Security Room (outside vault)
      [oswald, 1470, 1130]                           // Inconspicuous scholar near stacks
    ];
    scene = await Scene.create({ ...sceneData,
      tokens: tokenPlan.map(([actor, x, y]) => makeToken(actor, x, y)) });
  }
  await game.settings.set(MODULE, "interiorImported", true);
  ui.notifications.info("Thousandfold: the first-floor library scene and staff are available.");
  return scene;
}

/**
 * Import a spacious two-times-linear-scale library scene. Grid size remains
 * 128 pixels / 5 feet: a Medium creature remains one square while the library
 * gains 48 x 32 walkable grid cells instead of 24 x 16.
 *
 * If the old library already exists in this world, duplicate its CURRENT
 * geometry, tokens, lights, and adjustments before scaling. Never overwrite it.
 */
async function importExpandedInterior() {
  requireGm();
  const exists = game.scenes.find(scene => hasSource(scene, "grand-library-first-floor-expanded"));
  if (exists) return exists;
  const previous = game.scenes.find(scene => hasSource(scene, "grand-library-first-floor"));
  let sceneData;
  if (previous) {
    // Copy any in-world changes: staff tokens, walls, doors, custom lighting.
    sceneData = expandSceneGeometry(previous.toObject(), 2);
    delete sceneData._id;
    delete sceneData._stats;
    delete sceneData.thumb; // Let Foundry regenerate the thumbnail.
    sceneData.active = false;
  } else {
    sceneData = await loadJson("scenes/grand-library-first-floor-expanded.json");
    const [librarian, guard, clerk, conservator, head, warden, oswald] = await Promise.all([
      ensureActor("librarian.json"), ensureActor("scholar-guard.json"),
      ensureActor("mail-clerk.json"), ensureActor("restoration-conservator.json"),
      ensureActor("head-librarian.json"), ensureActor("vault-warden.json"),
      ensureActor("oswald-pendlewick.json")
    ]);
    const tokenPlan = [
      [guard, 1420, 1690], [guard, 1980, 1680],
      [librarian, 1250, 990], [librarian, 255, 960],
      [librarian, 360, 1650], [clerk, 1360, 210],
      [conservator, 205, 590], [head, 2815, 595],
      [warden, 2030, 235], [oswald, 1470, 1130]
    ];
    sceneData.tokens = tokenPlan.map(([actor, x, y]) => makeToken(actor, 2*x, 2*y));
  }
  sceneData.name = "Library of the Thousandfold — Grand Library (Expanded)";
  sceneData.navName = "Grand Library — Expanded";
  sceneData.navigation = true;
  sceneData.flags = {
    ...(sceneData.flags ?? {}),
    [MODULE]: {
      ...(sceneData.flags?.[MODULE] ?? {}),
      source: "grand-library-first-floor-expanded",
      expansionFactor: 2,
      expandedFrom: previous?.id ?? null
    }
  };
  const created = await Scene.create(sceneData);
  await game.settings.set(MODULE, "expandedInteriorImported", true);
  ui.notifications.info("Thousandfold: expanded library scene imported (48 × 32 squares). Existing library scene preserved.");
  return created;
}


/**
 * First floor atrium redesign, visually aligned to the second-floor v2 concept.
 * Import as a SEPARATE scene so an established campaign is never overwritten.
 * Grid: 80 x 54 squares, 100 px per 5-ft square; art is a concept plan.
 */
async function importAtriumFirstFloor() {
  requireGm();
  const existing = game.scenes.find(scene => hasSource(scene, "grand-library-first-floor-atrium"));
  if (existing) return existing;
  const [librarian, guard, clerk, conservator, head, warden, oswald] = await Promise.all([
    ensureActor("librarian.json"), ensureActor("scholar-guard.json"),
    ensureActor("mail-clerk.json"), ensureActor("restoration-conservator.json"),
    ensureActor("head-librarian.json"), ensureActor("vault-warden.json"),
    ensureActor("oswald-pendlewick.json")
  ]);
  const data = await loadJson("scenes/grand-library-first-floor-atrium.json");
  const sourceWidth = 1536, sourceHeight = 1024;
  const tokenPlan = [
    [guard, 677, 900], [guard, 871, 900],              // Entrance guards
    [librarian, 570, 431], [librarian, 171, 492],     // Main hall / study room
    [librarian, 227, 839],                            // Reception
    [clerk, 567, 118],                               // Mail Room
    [conservator, 199, 314],                         // Restoration Workshop
    [head, 1377, 370],                               // Office
    [warden, 987, 117],                              // Security Room
    [oswald, 1002, 522]                              // Normal scholar; open hall desk
  ];
  data.tokens = tokenPlan.map(([actor, x, y]) =>
    makeToken(actor, Math.round(x * data.width / sourceWidth),
                     Math.round(y * data.height / sourceHeight)));
  const scene = await Scene.create(data);
  await game.settings.set(MODULE, "atriumInteriorImported", true);
  ui.notifications.info("Thousandfold: redesigned first-floor atrium scene created. Earlier scenes are unchanged.");
  return scene;
}

async function importContent() {
  requireGm();
  const [guard, librarian] = await Promise.all([
    ensureActor("scholar-guard.json"), ensureActor("librarian.json")
  ]);
  let gate = game.scenes.find(scene => hasSource(scene, "grand-gate"));
  if (!gate) {
    const sceneData = await loadJson("scenes/grand-gate.json");
    gate = await Scene.create({ ...sceneData, tokens: [
      [guard, 675, 965], [guard, 1250, 965],
      [librarian, 850, 645], [librarian, 1170, 645]
    ].map(([actor,x,y]) => makeToken(actor,x,y)) });
  }
  await game.settings.set(MODULE, "contentImported", true);
  await importOswald();
  await importAtriumFirstFloor();
  return gate;
}


// Unique illustration for each NPC feature/action. Existing custom item art is preserved.
const ITEM_ICONS = {
  "Letter Opener": "modules/library-thousandfold/assets/icons/letter-opener.webp",
  "Index of the Thousandfold": "modules/library-thousandfold/assets/icons/index-of-the-thousandfold.webp",
  "Summon the Watch": "modules/library-thousandfold/assets/icons/summon-the-watch.webp",
  "Master Keys": "modules/library-thousandfold/assets/icons/master-keys.webp",
  "Portal Custody": "modules/library-thousandfold/assets/icons/portal-custody.webp",
  "Routing Ledger": "modules/library-thousandfold/assets/icons/routing-ledger.webp",
  "Preservation Expertise": "modules/library-thousandfold/assets/icons/preservation-expertise.webp",
  "Library Halberd": "modules/library-thousandfold/assets/icons/library-halberd.webp",
  "Keep the Silence": "modules/library-thousandfold/assets/icons/keep-the-silence.webp",
  "Nonlethal Training": "modules/library-thousandfold/assets/icons/nonlethal-training.webp",
  "Vault Protocol": "modules/library-thousandfold/assets/icons/vault-protocol.webp",
  "Alarm Bell": "modules/library-thousandfold/assets/icons/alarm-bell.webp",
  "Chronal Pulse": "modules/library-thousandfold/assets/icons/chronal-pulse.webp",
  "Momentary Pause": "modules/library-thousandfold/assets/icons/momentary-pause.webp",
  "Stolen Seconds": "modules/library-thousandfold/assets/icons/stolen-seconds.webp",
  "Rewind the Thread": "modules/library-thousandfold/assets/icons/rewind-the-thread.webp",
  "Rewind a Blow": "modules/library-thousandfold/assets/icons/rewind-the-thread.webp",
  "Momentary Pause (Recharge 5–6)": "modules/library-thousandfold/assets/icons/momentary-pause.webp",
  "Stolen Seconds (3/Day)": "modules/library-thousandfold/assets/icons/stolen-seconds.webp",
  "Rewind the Thread (1/Day)": "modules/library-thousandfold/assets/icons/rewind-the-thread.webp",
  "Hourglass of Unfinished Moments": "modules/library-thousandfold/assets/icons/hourglass-of-unfinished-moments.webp",
  "Appear Harmless": "modules/library-thousandfold/assets/icons/appear-harmless.webp"
};

async function updateItemIcons() {
  if (!game.user?.isGM) throw new Error("Only the GM may update Library item icons.");
  if (game.system.id !== "dnd5e") return 0;
  let modified = 0;
  for (const actor of game.actors) {
    const source = actor.getFlag(MODULE, "source");
    if (!source) continue;
    const changes = [];
    for (const item of actor.items) {
      const target = ITEM_ICONS[item.name];
      if (!target || item.img === target) continue;
      // Replace only the module's legacy generic icon or a missing icon.
      if (item.img && !item.img.startsWith("icons/") &&
          !item.img.startsWith(`modules/${MODULE}/assets/icons/`)) continue;
      changes.push({_id: item.id, img: target});
    }
    if (changes.length) {
      await actor.updateEmbeddedDocuments("Item", changes);
      modified += changes.length;
    }
  }
  if (modified) ui.notifications.info(`Library of the Thousandfold: updated ${modified} feature/action icons.`);
  return modified;
}

globalThis.LibraryThousandfold = {importContent, importOswald, importInterior, importExpandedInterior, importAtriumFirstFloor, updateItemIcons};

Hooks.once("ready", async () => {
  if (!game.user?.isGM || game.system.id !== "dnd5e") return;
  try { await updateItemIcons(); } catch (error) { console.warn("Library item icon migration failed", error); }
  const hasGate = game.settings.get(MODULE, "contentImported") ||
    game.scenes.some(scene => hasSource(scene, "grand-gate"));
  const hasOswald = game.settings.get(MODULE, "oswaldImported") ||
    game.actors.some(actor => hasSource(actor, "oswald-pendlewick"));
  const hasAtrium = game.scenes.some(scene => hasSource(scene, "grand-library-first-floor-atrium"));
  if (hasGate && hasOswald && hasAtrium) return;
  const hasOlderInterior = game.scenes.some(scene => ["grand-library-first-floor-expanded", "grand-library-first-floor"].includes(scene.getFlag(MODULE, "source")));
  const prompt = hasOlderInterior
    ? "<p>Import the <strong>redesigned Grand Library — First Floor (Atrium)</strong> with the south-center main stairs, west book elevator and east staff spiral?</p><p>This creates a new scene without changing your current first-floor map, tokens or custom edits. The second-floor destination is not built into this module yet.</p>"
    : "<p>Import the <strong>Grand Library — First Floor (Atrium)</strong> and any missing entrance/actor content?</p><p>Includes the updated central staircase, book elevator, staff spiral and library NPCs. It does not automatically link to a second-floor scene.</p>";
  const accepted = await Dialog.confirm({
    title: "Library of the Thousandfold — First Floor Atrium",
    content: prompt, yes: () => true, no: () => false, defaultYes: true
  });
  if (!accepted) return;
  try {
    if (!hasGate) await importContent();
    else {
      if (!hasOswald) await importOswald();
      if (!hasAtrium) await importAtriumFirstFloor();
    }
  } catch (error) {
    console.error(`${MODULE}: atrium scene import failed`, error);
    ui.notifications.error(`Library atrium import failed: ${error.message}`);
  }
});
