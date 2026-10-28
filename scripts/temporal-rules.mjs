export const POWERS={
  "chronal-pulse":{name:"Chronal Pulse",strain:1,action:"action",note:"Resolve ranged spell attack normally."},
  "stolen-seconds":{name:"Stolen Seconds",strain:1,action:"bonus",note:"Move Oswald up to 20 feet without opportunity attacks."},
  "momentary-pause":{name:"Momentary Pause",strain:2,action:"action",note:"Chosen creatures in 15-foot radius within 60 feet: DC 15 Wisdom save or speed 0 and no reactions until end of next turn."},
  "rewind-a-blow":{name:"Rewind a Blow",strain:2,action:"reaction",note:"Reroll one recent attack roll or saving throw. New result stands."},
  "rewind-the-thread":{name:"Rewind the Thread",strain:4,action:"reaction",note:"Reverse one significant event in the previous round. GM chooses what persists."}
};
export function tier(n){return n>=9?3:n>=6?2:n>=3?1:0}
export function outcome(n,id){
 if(!Number.isSafeInteger(n)||n<0||!POWERS[id])throw Error("Invalid strain or power");
 const next=n+POWERS[id].strain;
 return {old:n,next,stage:tier(next),ageSix:n<6&&next>=6,ageNine:n<9&&next>=9,ageLater:n>=9,critical:next>=9,power:POWERS[id]};
}
export function recovered(n){return Math.max(0,n-3)}
