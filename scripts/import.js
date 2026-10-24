const MODULE = "library-thousandfold";
const DATA = `modules/${MODULE}/data`;

Hooks.once("init", () => {
  game.settings.register(MODULE, "contentImported", {
    name: "Library content imported",
    hint: "Set automatically when the scene and NPCs are imported into this world.",
    scope: "world", config: false, type: Boolean, default: false
  });
});

async function loadJson(path) {
  const r = await fetch(`${DATA}/${path}`);
  if (!r.ok) throw new Error(`Cannot load ${path}: HTTP ${r.status}`);
  return r.json();
}

const hasSource = (doc, source) => doc.getFlag(MODULE, "source") === source;

async function importContent() {
  if (!game.user?.isGM) throw new Error("Only the GM may import Library content.");
  if (game.system.id !== "dnd5e") throw new Error("This actor pack requires the D&D 5e system.");

  const actorData = await Promise.all([loadJson("actors/scholar-guard.json"), loadJson("actors/librarian.json")]);
  const sceneData = await loadJson("scenes/grand-gate.json");
  const actors = {};
  for (const a of actorData) {
    const source = a.flags[MODULE].source;
    const existing = game.actors.find(x => hasSource(x, source));
    actors[source] = existing || await Actor.create(a);
  }
  let scene = game.scenes.find(x => hasSource(x, "grand-gate"));
  if (!scene) {
    const tokenPlan = [
      ["scholar-guard", 675, 965], ["scholar-guard", 1250, 965],
      ["grand-library-librarian", 850, 645], ["grand-library-librarian", 1170, 645]
    ];
    const tokens = [];
    for (const [source, x, y] of tokenPlan) {
      const actor = actors[source];
      if (!actor) throw new Error(`Missing actor ${source}`);
      const proto = actor.prototypeToken.toObject();
      // Actor linkage and token position are set on the new scene after actor creation.
      delete proto._id;
      tokens.push({...proto, x, y, actorId: actor.id, actorLink: false,
        name: actor.name, disposition: 0,
        texture: {...proto.texture, src: actor.prototypeToken.texture.src}});
    }
    scene = await Scene.create({...sceneData, tokens});
  }
  await game.settings.set(MODULE, "contentImported", true);
  ui.notifications.info("Library of the Thousandfold: scene and actors imported. Open the Scenes tab!");
  return scene;
}

// Import command remains available to GMs even after dismissing the first prompt.
globalThis.LibraryThousandfold = {importContent};

Hooks.once("ready", async () => {
  if (!game.user.isGM || game.system.id !== "dnd5e") return;
  if (game.settings.get(MODULE, "contentImported")) return;
  const go = await Dialog.confirm({
    title: "Library of the Thousandfold",
    content: `<p>Import the <strong>Grand Gate</strong> scene, two Scholar Guards, and two Librarians into this world?</p><p>The NPCs will be added to Actors and placed on the map. Your existing scenes and actors will not be overwritten.</p>`,
    yes: () => true, no: () => false,
    defaultYes: true
  });
  if (!go) return;
  try { await importContent(); }
  catch (e) { console.error(`${MODULE} import failed`, e); ui.notifications.error(`Library import failed: ${e.message}`); }
});