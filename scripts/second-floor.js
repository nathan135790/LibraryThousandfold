const M = "library-thousandfold";
const DATA = "modules/" + M + "/data/";
const F1 = "grand-library-first-floor-atrium", F2 = "grand-library-second-floor";
const read = async p => { const r = await fetch(DATA+p); if (!r.ok) throw new Error(p+" HTTP "+r.status); return r.json(); };
const gm = () => { if (!game.user?.isGM || game.system.id !== "dnd5e") throw new Error("Requires a D&D 5e GM."); };
const source = (d, key) => d.getFlag(M,"source") === key;
const findScene = id => game.scenes.find(s => source(s,id));
const ensure = async (collection, cls, data) => collection.find(d => source(d,data.flags[M].source)) ?? await cls.create(data);
const nameSlug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
let inFlight;
export function importSecondFloor() {
  gm(); if (inFlight) return inFlight;
  inFlight = importAll().finally(()=>inFlight=undefined); return inFlight;
}
async function importAll() {
  const [actors,items,sceneData,plan,tables,journals] = await Promise.all([
    read("actors/second-floor-actors.json"),read("items/second-floor-items.json"),
    read("scenes/grand-library-second-floor.json"),read("second-floor/token-plan.json"),
    read("tables/second-floor-tables.json"),read("journals/second-floor-journals.json")]);
  const bySource = new Map();
  for (const a of actors) bySource.set(a.flags[M].source,await ensure(game.actors,Actor,a));
  for (const i of items) {
    const existing=game.items.find(x=>x.name===i.name || source(x,i.flags[M].source));
    if (!existing) await Item.create(i);
  }
  let scene=findScene(F2);
  if (!scene) {
    sceneData.tokens=plan.map(p=>{const a=bySource.get(p.source),t=a.prototypeToken.toObject();delete t._id;return {...t,x:p.position[0],y:p.position[1],actorId:a.id,actorLink:false,name:a.name,disposition:0};});
    scene=await Scene.create(sceneData);
  }
  for (const [name,entries] of Object.entries(tables)) {
    const id="f2-table-"+nameSlug(name);
    if (!game.tables.some(t=>source(t,id))) {
      try { await RollTable.create({name,formula:"1d"+entries.length,flags:{[M]:{source:id}},results:entries.map((text,i)=>({type:CONST.TABLE_RESULT_TYPES?.TEXT??0,text,description:text,range:[i+1,i+1],weight:1,drawn:false}))}); }
      catch(e){ console.warn(M,"RollTable import failed",name,e); }
    }
  }
  for (const [name,content] of Object.entries(journals)) {
    const id="f2-journal-"+nameSlug(name);
    if (!game.journal.some(j=>source(j,id))) await JournalEntry.create({name:"Thousandfold — "+name,ownership:{default:0},flags:{[M]:{source:id}},pages:[{name,type:"text",text:{content:"<p>"+content+"</p>",format:1},ownership:{default:0}}]});
  }
  const macro={name:"Thousandfold — Library GM Controls",type:"script",command:"LibraryThousandfold.openLibraryPanel()",ownership:{default:0},flags:{[M]:{source:"f2-control-macro"}}};
  await ensure(game.macros,Macro,macro);
  ui.notifications.info("Thousandfold: second floor and encounter content imported. Existing scene edits preserved.");
  return scene;
}
const destinations={main_stair:{f1:[3958,4725],f2:[4010,3797]},book_elevator:{f1:[3125,4710],f2:[3125,3876]},staff_spiral:{f1:[4932,4710],f2:[4948,3876]}};
export async function travelLibrary(route) {
  gm(); const current=canvas.scene, direction=source(current,F1)?"f2":source(current,F2)?"f1":null;
  if (!direction || !destinations[route]) throw new Error("Select an atrium floor and a valid route.");
  const target=findScene(direction==="f2"?F2:F1);
  if (!target) throw new Error("Import both floors before travel.");
  const selected=canvas.tokens.controlled;
  if (!selected.length) throw new Error("Select the tokens to move.");
  if (game.combat?.started && game.combat.scene?.id===current.id) throw new Error("End active combat before changing floors.");
  if (!await Dialog.confirm({title:"Move selected tokens?",content:"<p>Confirm that the landing is clear and the group may use this route. Tokens move between scenes; inspect the destination afterwards.</p>",yes:()=>true,no:()=>false,defaultYes:false})) return;
  const [x,y]=destinations[route], step=target.grid.size;
  const copies=selected.map((token,i)=>{const data=token.document.toObject();delete data._id;delete data._stats;data.x=Math.max(0,Math.min(target.width-step,Math.round(x/step)*step+(i%3-1)*step));data.y=Math.max(0,Math.min(target.height-step,Math.round(y/step)*step+Math.floor(i/3)*step));return data;});
  const originals=selected.map(t=>t.id);
  const created=await target.createEmbeddedDocuments("Token",copies);
  if (created.length!==copies.length) { await target.deleteEmbeddedDocuments("Token",created.map(t=>t.id)); throw new Error("Incomplete travel; original tokens retained."); }
  // Destination copies already exist; retain them if source deletion fails to avoid losing token data.
  await current.deleteEmbeddedDocuments("Token",originals);
  await target.view();
  ui.notifications.info("Tokens moved. GM may activate destination scene for players.");
}
export async function setLibraryAlert(level) {gm();if(!Number.isInteger(level)||level<0||level>3)throw new Error("Invalid alert.");if(!canvas.scene||![F1,F2].some(id=>source(canvas.scene,id)))throw new Error("Open a library floor first.");await canvas.scene.setFlag(M,"securityAlert",level);ui.notifications.info(["Normal operations","Suspicious: question visitors","Breach: manually lock relevant doors; summon guardians","Emergency: evacuate and contain"][level]);}
export async function libraryRoll(name) {gm();const entries=(await read("tables/second-floor-tables.json"))[name];if(!entries)throw new Error("Unknown table");const roll=await new Roll("1d"+entries.length).evaluate();const message=entries[roll.total-1];await ChatMessage.create({content:"<strong>"+name+"</strong><p>"+message+"</p>",whisper:game.users.filter(u=>u.isGM).map(u=>u.id)});return message;}
export async function spawnLibraryActor(id) {gm();if(!canvas.scene)throw new Error("Open a scene.");const a=game.actors.find(x=>source(x,id));if(!a)throw new Error("Import actor first.");const t=a.prototypeToken.toObject();delete t._id;const p=canvas.tokens.controlled[0]?.document;const step=canvas.scene.grid.size;const x=p?p.x+step:Math.floor(canvas.scene.width/2/step)*step;const y=p?p.y:Math.floor(canvas.scene.height*.7/step)*step;return canvas.scene.createEmbeddedDocuments("Token",[{...t,x,y,actorId:a.id,actorLink:false}]);}
export async function openLibraryPanel(){
 gm();const data=await read("actors/second-floor-actors.json"),tables=await read("tables/second-floor-tables.json");
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const options=data.filter(a=>a.prototypeToken.disposition===-1||a.flags[M].placeholder).map(a=>'<option value="'+esc(a.flags[M].source)+'">'+esc(a.name)+'</option>').join("");
 const alert=canvas.scene?.getFlag(M,"securityAlert")??0;
 const content='<p>Alert '+alert+' (manual security response)</p><div><button data-alert="0">Normal</button><button data-alert="1">Suspicious</button><button data-alert="2">Breach</button><button data-alert="3">Emergency</button></div><hr><p>GM travel: select tokens and confirm clear landing.</p><button data-route="main_stair">Grand stairs</button><button data-route="book_elevator">Book elevator</button><button data-route="staff_spiral">Staff spiral</button><hr><p>Roll privately:</p>'+Object.keys(tables).map(n=>'<button data-table="'+esc(n)+'">'+esc(n)+'</button>').join("")+'<hr><select name="actor">'+options+'</select><button data-spawn="1">Spawn near selected token</button><button data-oswald="1">Oswald controls</button>';
 const run=fn=>Promise.resolve().then(fn).catch(e=>{console.error(M,e);ui.notifications.error(e.message);});
 new Dialog({title:"Thousandfold — Library GM Controls",content,buttons:{close:{label:"Close"}},render:html=>{html.find("[data-alert]").on("click",e=>run(()=>setLibraryAlert(Number(e.currentTarget.dataset.alert))));html.find("[data-route]").on("click",e=>run(()=>travelLibrary(e.currentTarget.dataset.route)));html.find("[data-table]").on("click",e=>run(()=>libraryRoll(e.currentTarget.dataset.table)));html.find("[data-spawn]").on("click",()=>run(()=>spawnLibraryActor(html.find('[name="actor"]').val())));html.find("[data-oswald]").on("click",()=>run(()=>globalThis.LibraryThousandfold.openOswaldTimePanel()));}}).render(true);
}
