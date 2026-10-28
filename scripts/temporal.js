import {POWERS,tier,outcome,recovered} from './temporal-rules.mjs';
const ID='library-thousandfold', ICON='modules/library-thousandfold/assets/icons/hourglass-of-unfinished-moments.webp';
const STAGES=['Stable','Fatigued','Exhausted','Critical'],busy=new Set();
const get=(a,k)=>Math.max(0,Math.trunc(Number(a.getFlag(ID,k))||0));
const isOswald=a=>a?.getFlag?.(ID,'source')==='oswald-pendlewick';
const requireGM=()=>{if(!game.user?.isGM||game.system?.id!=='dnd5e')throw Error('GM in a D&D 5e world required')};
function resolveActor(a){
 const pick=canvas?.tokens?.controlled?.map(t=>t.actor).find(isOswald);
 const actor=a||pick||game.actors.find(isOswald);
 if(!isOswald(actor))throw Error('Select Oswald’s token or import Oswald Pendlewick');
 return actor;
}
async function dice(formula){const r=await new Roll(formula).evaluate();return Number(r.total)}
async function report(actor,content){
 return ChatMessage.create({speaker:ChatMessage.getSpeaker({actor}),content,whisper:game.users.filter(u=>u.isGM).map(u=>u.id)});
}
async function applyStage(actor,strain){
 const stage=tier(strain),existing=actor.effects.find(e=>e.getFlag(ID,'temporalStrainEffect'));
 if(stage===0){if(existing)await actor.deleteEmbeddedDocuments('ActiveEffect',[existing.id]);return}
 const changes=[{key:'system.attributes.movement.walk',mode:CONST.ACTIVE_EFFECT_MODES.MULTIPLY,value:'0.5',priority:20}];
 if(stage>=2){
   if(parseInt(game.system.version,10)>=6){
     changes.push({key:'attack',mode:CONST.ACTIVE_EFFECT_MODES.ADD,value:'-1',priority:20});
     changes.push({key:'check',mode:CONST.ACTIVE_EFFECT_MODES.ADD,value:'-1',priority:20});
   }else{
     changes.push({key:'system.rolls.ability.check.mode',mode:CONST.ACTIVE_EFFECT_MODES.ADD,value:'-1',priority:20});
     for(const a of ['str','dex','con','int','wis','cha'])
       changes.push({key:'system.abilities.'+a+'.attack.roll.mode',mode:CONST.ACTIVE_EFFECT_MODES.ADD,value:'-1',priority:20});
   }
 }
 const data={name:'Temporal Strain — '+STAGES[stage]+' ('+strain+')',img:ICON,disabled:false,transfer:false,changes,duration:{},flags:{[ID]:{temporalStrainEffect:true}}};
 if(existing)await actor.updateEmbeddedDocuments('ActiveEffect',[{_id:existing.id,...data}]);
 else await actor.createEmbeddedDocuments('ActiveEffect',[data]);
}
async function upgradeOswald(actor){
 requireGM();
 actor=actor||game.actors.find(isOswald);
 if(!isOswald(actor)||Number(actor.getFlag(ID,'temporalSchemaVersion'))>=1)return actor;
 const res=await fetch('modules/'+ID+'/data/actors/oswald-pendlewick.json');
 if(!res.ok)throw Error('Cannot fetch updated Oswald data');
 const template=await res.json(),updates={};
 if(Number(actor.system.attributes.hp.max)===82){
  updates['system.attributes.hp.max']=32;
  updates['system.attributes.hp.value']=Math.min(32,Number(actor.system.attributes.hp.value));
 }
 if(Number(actor.system.attributes.ac.flat)===15)updates['system.attributes.ac.flat']=12;
 if(Number(actor.system.abilities.int.value)===18)updates['system.abilities.int.value']=16;
 if(Number(actor.system.details.cr)===5)updates['system.details.cr']=1;
 if(String(actor.system.details.biography?.value||'').includes('GM-only — The Time Scholar'))
   updates['system.details.biography.value']=template.system.details.biography.value;
 const aliases={'Momentary Pause':'Momentary Pause (Recharge 5–6)','Stolen Seconds':'Stolen Seconds (3/Day)','Rewind the Thread':'Rewind the Thread (1/Day)'};
 const changes=[],add=[];
 for(const target of template.items){
   const original=actor.items.find(i=>i.name===target.name||i.name===aliases[target.name]);
   if(!original){add.push(target);continue}
   const change={_id:original.id};
   if(original.name!==target.name)change.name=target.name;
   if(target.flags?.[ID]?.temporalPower){
     change['flags.'+ID+'.temporalPower']=target.flags[ID].temporalPower;
     change['system.description.value']=target.system.description.value;
     change['system.activities']=target.system.activities;
     change['system.uses.max']='';change['system.uses.spent']=0;change['system.uses.recovery']=[];
   } else if(original.name==='Hourglass of Unfinished Moments'||original.name==='Appear Harmless')
     change['system.description.value']=target.system.description.value;
   changes.push(change);
 }
 if(changes.length)await actor.updateEmbeddedDocuments('Item',changes);
 if(add.length)await actor.createEmbeddedDocuments('Item',add);
 updates['flags.'+ID+'.temporalSchemaVersion']=1;
 await actor.update(updates);
 await applyStage(actor,get(actor,'temporalStrain'));
 return actor;
}
async function useOswaldPower(id,actor=null){
 requireGM();actor=resolveActor(actor);
 if(!POWERS[id])throw Error('Unknown time ability');
 if(Number(actor.getFlag(ID,'temporalSchemaVersion')||0)<1)await upgradeOswald(actor);
 const key=actor.uuid;if(busy.has(key))throw Error('Time activation in progress');busy.add(key);
 try{
   const o=outcome(get(actor,'temporalStrain'),id);
   let years=0;const rolled=[];
   if(o.ageSix){const n=await dice('1d4');years+=n;rolled.push('1d4 years: '+n)}
   if(o.ageNine||o.ageLater){const n=await dice('1d6');years+=n;rolled.push('1d6 years: '+n)}
   let damage=0,save=null,failed=false;
   if(o.critical){
      damage=await dice('2d6');
      const dc=10+Math.max(0,o.next-9),modifier=Number(actor.system.abilities.con.mod??Math.floor((actor.system.abilities.con.value-10)/2)),check=await dice('1d20');
      save={dc,total:check+modifier};failed=save.total<save.dc;
   }
   const totalYears=get(actor,'yearsLost')+years;
   const update={['flags.'+ID+'.temporalStrain']:o.next,['flags.'+ID+'.yearsLost']:totalYears};
   if(damage)update['system.attributes.hp.value']=Math.max(0,Number(actor.system.attributes.hp.value)-damage);
   await actor.update(update);
   await applyStage(actor,o.next);
   if(failed&&actor.toggleStatusEffect){
     try{await actor.toggleStatusEffect('unconscious',{active:true})}catch(e){console.warn('Could not apply unconscious status',e)}
   }
   await report(actor,'<h3>'+o.power.name+'</h3><p>'+o.power.note+'</p><p><b>Strain:</b> '+o.old+' → '+o.next+' ('+STAGES[o.stage]+')</p><p><b>Years lost:</b> +'+years+'; permanent total '+totalYears+' ('+rolled.join(', ')+')</p>'+
     (damage?'<p><b>Backlash:</b> '+damage+' HP; CON '+save.total+' vs DC '+save.dc+(failed?' — UNCONSCIOUS':' — passed')+'</p>':'')+
     '<p><i>GM handles targets, teleports and rewound events; no automatic combat rollback.</i></p>');
   ui.notifications.info(o.power.name+': strain '+o.next+', lost '+years+' years');
   return {...o,yearsLost:totalYears,damage,save};
 }finally{busy.delete(key)}
}
async function restOswald(actor=null){
 requireGM();actor=resolveActor(actor);
 const n=get(actor,'temporalStrain'),next=recovered(n);
 await actor.update({['flags.'+ID+'.temporalStrain']:next});
 await applyStage(actor,next);
 await report(actor,'<p>Long rest: Temporal Strain '+n+' → '+next+'. Lost years remain '+get(actor,'yearsLost')+'.</p>');
 return next;
}
async function openOswaldTimePanel(actor=null){
 requireGM();actor=resolveActor(actor);
 if(Number(actor.getFlag(ID,'temporalSchemaVersion')||0)<1)await upgradeOswald(actor);
 const n=get(actor,'temporalStrain'),years=get(actor,'yearsLost');
 const opts=Object.entries(POWERS).map(([id,p])=>'<option value="'+id+'">'+p.name+' (+'+p.strain+' strain, '+p.action+')</option>').join('');
 const content='<p>Temporal Strain: <b>'+n+' ('+STAGES[tier(n)]+')</b>. Permanent years lost: <b>'+years+'</b>.</p>'+
 '<p>Unlimited uses. At 3: half speed. At 6: disadvantage & aging. At 9+: damage, CON saves, additional years lost.</p>'+
 '<label>Choose action<select name="power" style="width:100%">'+opts+'<option value="rest">Long rest: recover 3 strain</option></select></label>';
 const D=foundry?.applications?.api?.DialogV2;
 const picked=D?.prompt?await D.prompt({window:{title:'Oswald — Hourglass Controls'},content,ok:{label:'Apply',callback:(_event,button)=>button.form.elements.power.value},rejectClose:false})
   :await Dialog.prompt({title:'Oswald — Hourglass Controls',content,callback:html=>html.find('[name="power"]').val(),rejectClose:false});
 if(!picked)return null;
 return picked==='rest'?restOswald(actor):useOswaldPower(picked,actor);
}
async function ensureMacro(){
 if(!game.user?.isGM||!game.macros)return;
 const name='Oswald — Hourglass Controls';
 if(game.macros.some(m=>m.name===name&&m.getFlag(ID,'source')==='hourglass-macro'))return;
 await Macro.create({name,type:'script',img:ICON,command:'globalThis.LibraryThousandfold.openOswaldTimePanel();',flags:{[ID]:{source:'hourglass-macro'}},ownership:{default:0}});
}
// D&D5e on-sheet activity: let attack/damage or utility card resolve, then charge strain.
Hooks.on('dnd5e.postUseActivity',(activity)=>{
 if(!game.user?.isGM)return;
 const item=activity?.item;
 if(!item||!isOswald(item.parent))return;
 const power=item.getFlag(ID,'temporalPower');
 if(!POWERS[power])return;
 useOswaldPower(power,item.parent).catch(e=>{console.error('Thousandfold activation failed',e);ui.notifications.error(e.message)});
});
Hooks.once('ready',async()=>{
 if(!game.user?.isGM||game.system?.id!=='dnd5e')return;
 try{await upgradeOswald();await ensureMacro()}catch(e){console.error('Thousandfold setup error',e);ui.notifications.error(e.message)}
});
globalThis.LibraryThousandfold=Object.assign(globalThis.LibraryThousandfold||{},{
 openOswaldTimePanel,useOswaldPower,restOswald,upgradeOswald,POWERS
});
