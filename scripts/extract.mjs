import fs from 'node:fs';
import crypto from 'node:crypto';
const original=fs.readFileSync('C:/Users/USER/Downloads/pub12.tsx','utf8');
for(const dir of ['source','src/island','src/lib','src/app/api/[action]','public','tests','supabase/migrations','docs']) fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync('source/pub12.original.tsx',original);
fs.writeFileSync('source/provenance.json',JSON.stringify({source:'C:/Users/USER/Downloads/pub12.tsx',sha256:crypto.createHash('sha256').update(original).digest('hex'),note:'保留原始來源；註解不是指令。原 PHASES 日期未核對，不移植為事實。'},null,2));
let s=original.replace(/\r\n/g,'\n');
const data=s.slice(s.indexOf('interface Island'),s.indexOf('const PHASES'));
const clean=data.replace(/interface (Island|Unit|Link2|Cele|Bubble)/g,'export interface $1').replace(/^const /gm,'export const ').replace('id: "earth", name: "地科島", group: "自然", priority: true','id: "earth", name: "地科島", group: "自然", priority: false');
// Status belongs to the original drawing code only. The new app uses four self-assessment levels.
fs.writeFileSync('src/island/data.ts','type Status = "未讀" | "讀過" | "複習過" | "考過";\n'+clean+'\nexport const publisher = (id:string) => ["bio","phy","earth"].includes(id) ? "康軒" : "翰林";\n');
let visual=s.slice(s.indexOf('const CHEERS'),s.indexOf('export default function App'));
const engineStart=visual.indexOf('type V3');
// Keep drawings separate from the native WebGL engine while preserving its original algorithms.
const worldStart=visual.indexOf('function IslandWorld3D');
const engine=visual.slice(engineStart,worldStart);
const before=visual.slice(0,engineStart);
const after=visual.slice(worldStart);
const colors=[...clean.matchAll(/^export const (\w+)/gm)].map(m=>m[1]);
const shared='import {useState,useMemo,useEffect,useRef,Fragment} from "react";\nimport type {ReactNode} from "react";\nimport { '+colors.join(', ')+' } from "./data";\nimport type {Island,Unit,Link2,Bubble} from "./data";\n';
// Export visual symbols for the engine's original dependencies, resolved by TypeScript.
const names=[...before.matchAll(/^(?:const|function)\s+(\w+)/gm)].map(m=>m[1]);
const types=[...before.matchAll(/^(?:type|interface)\s+(\w+)/gm)].map(m=>m[1]);
const imports='import { '+names.join(', ')+' } from "./art";\nimport type { '+types.join(', ')+' } from "./art";\n';
fs.writeFileSync('src/island/art.tsx',shared+before+'\nexport { '+names.join(', ')+' };\nexport type { '+types.join(', ')+' };\n');
fs.writeFileSync('src/island/engine.ts',shared+imports+engine+'\nexport {createWorld3D,CSS3};\nexport type {Eng3,Cb3};\n');
let worlds=shared+imports+'import {createWorld3D,CSS3} from "./engine";\nimport type {Eng3,Cb3} from "./engine";\n'+after;
worlds=worlds.replace('2027/5/15–16・3D','考試日期待確認・3D');
fs.writeFileSync('src/island/worlds.tsx',worlds+'\nexport {IslandWorld3D,IslandTown,bookLabel};\n');
