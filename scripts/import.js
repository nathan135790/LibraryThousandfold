const MODULE = "library-thousandfold";
const DATA = `modules/${MODULE}/data`;

Hooks.once("init", () => {
  for (const [key, name, hint] of [
    ["contentImported", "Gate content imported", "Tracks the original entrance scene and NPCs."],
    ["oswaldImported", "Oswald imported", "Tracks the time scholar."],
    ["interiorImported", "Library interior imported", "Tracks the first-floor scene and its staff actors."]
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
  await importInterior();
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

globalThis.LibraryThousandfold = {importContent, importOswald, importInterior, updateItemIcons};

Hooks.once("ready", async () => {
  if (!game.user?.isGM || game.system.id !== "dnd5e") return;
  try { await updateItemIcons(); } catch (e) { console.warn("Library item icon migration failed", e); }
  const hasGate = game.settings.get(MODULE, "contentImported") ||
    game.scenes.some(scene => hasSource(scene, "grand-gate"));
  const hasOswald = game.settings.get(MODULE, "oswaldImported") ||
    game.actors.some(actor => hasSource(actor, "oswald-pendlewick"));
  const hasInterior = game.settings.get(MODULE, "interiorImported") ||
    game.scenes.some(scene => hasSource(scene, "grand-library-first-floor"));
  if (hasGate && hasOswald && hasInterior) return;
  const prompt = hasGate
    ? `<p>Import the new <strong>Grand Library — First Floor</strong> scene, staff, and any missing Oswald actor?</p><p>Your existing gate scene and actor edits will be preserved.</p>`
    : `<p>Import both the <strong>Grand Gate</strong> and <strong>Grand Library — First Floor</strong> scenes, together with Scholar Guards, librarians, staff and Oswald Pendlewick?</p><p>Existing imported documents will not be overwritten.</p>`;
  const accepted = await Dialog.confirm({title:"Library of the Thousandfold",content:prompt,
    yes: () => true, no: () => false, defaultYes: true});
  if (!accepted) return;
  try {
    if (!hasGate) await importContent();
    else {
      if (!hasOswald) await importOswald();
      if (!hasInterior) await importInterior();
    }
  } catch (error) {
    console.error(`${MODULE}: import failed`,error);
    ui.notifications.error(`Library import failed: ${error.message}`);
  }
});
