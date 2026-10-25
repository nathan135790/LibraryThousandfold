const MODULE = "library-thousandfold";
const DATA = `modules/${MODULE}/data`;

Hooks.once("init", () => {
  game.settings.register(MODULE, "contentImported", {
    name: "Library content imported",
    hint: "Whether the entrance and original NPCs have been imported into this world.",
    scope: "world", config: false, type: Boolean, default: false
  });
  game.settings.register(MODULE, "oswaldImported", {
    name: "Oswald imported",
    hint: "Tracks the Oswald Pendlewick addition independently so existing worlds can import him after upgrading.",
    scope: "world", config: false, type: Boolean, default: false
  });
});

async function loadJson(path) {
  const r = await fetch(`${DATA}/${path}`);
  if (!r.ok) throw new Error(`Cannot load ${path}: HTTP ${r.status}`);
  return r.json();
}

const hasSource = (doc, source) => doc.getFlag(MODULE, "source") === source;

async function ensureActor(file) {
  const data = await loadJson(`actors/${file}`);
  const source = data.flags?.[MODULE]?.source;
  if (!source) throw new Error(`Missing source flag in ${file}`);
  return game.actors.find(a => hasSource(a, source)) || Actor.create(data);
}

async function importOswald() {
  if (!game.user?.isGM) throw new Error("Only the GM may import Library content.");
  if (game.system.id !== "dnd5e") throw new Error("This actor requires the D&D 5e system.");
  const oswald = await ensureActor("oswald-pendlewick.json");
  await game.settings.set(MODULE, "oswaldImported", true);
  ui.notifications.info("Library of the Thousandfold: Oswald Pendlewick is in the Actors directory.");
  return oswald;
}

async function importContent() {
  if (!game.user?.isGM) throw new Error("Only the GM may import Library content.");
  if (game.system.id !== "dnd5e") throw new Error("This actor pack requires the D&D 5e system.");
  const guard = await ensureActor("scholar-guard.json");
  const librarian = await ensureActor("librarian.json");
  let scene = game.scenes.find(x => hasSource(x, "grand-gate"));
  if (!scene) {
    const sceneData = await loadJson("scenes/grand-gate.json");
    const tokenPlan = [
      [guard, 675, 965], [guard, 1250, 965],
      [librarian, 850, 645], [librarian, 1170, 645]
    ];
    const tokens = tokenPlan.map(([actor, x, y]) => {
      const proto = actor.prototypeToken.toObject();
      delete proto._id;
      return {...proto, x, y, actorId: actor.id, actorLink: false,
        name: actor.name, disposition: 0,
        texture: {...proto.texture, src: actor.prototypeToken.texture.src}};
    });
    scene = await Scene.create({...sceneData, tokens});
  }
  await importOswald(); // Add to Actors only; he is not preplaced on the gate scene.
  await game.settings.set(MODULE, "contentImported", true);
  ui.notifications.info("Library of the Thousandfold: entrance scene and all NPCs are ready.");
  return scene;
}

globalThis.LibraryThousandfold = {importContent, importOswald};

Hooks.once("ready", async () => {
  if (!game.user?.isGM || game.system.id !== "dnd5e") return;
  const previouslyImported = game.settings.get(MODULE, "contentImported");
  const oswaldExists = game.actors.some(x => hasSource(x, "oswald-pendlewick"));
  if (previouslyImported && (game.settings.get(MODULE, "oswaldImported") || oswaldExists)) return;

  const additionOnly = previouslyImported;
  const yes = await Dialog.confirm({
    title: "Library of the Thousandfold",
    content: additionOnly
      ? `<p>Add <strong>Oswald Pendlewick</strong>, the Time Scholar, to Actors?</p><p>Your existing scene and actors will not be overwritten or replaced.</p>`
      : `<p>Import the <strong>Grand Gate</strong> scene, Scholar Guards, Librarians and <strong>Oswald Pendlewick</strong>?</p><p>Oswald will be in Actors but will not be placed on the scene. Your existing documents will not be overwritten.</p>`,
    yes: () => true, no: () => false, defaultYes: true
  });
  if (!yes) return;
  try { await (additionOnly ? importOswald() : importContent()); }
  catch (e) { console.error(`${MODULE} import failed`, e); ui.notifications.error(`Library import failed: ${e.message}`); }
});