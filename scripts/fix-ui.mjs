import fs from 'node:fs';
let s=fs.readFileSync('src/components/StudyIsland.tsx','utf8');
s=s.replace("[clock,setClock]=useState(Date.now());","[clock,setClock]=useState(Date.now()),[viewMode,setViewMode]=useState<'3d'|'2d'|null>(null),[localMotion,setLocalMotion]=useState<boolean|null>(null);");
s=s.replace("const worldProps={progress,selected:island", "const worldProps={progress,selected:island");
s=s.replace('motion:p.prefs.motion,bubbleNow:bubble','motion:localMotion??p.prefs.motion,bubbleNow:bubble');
s=s.replace("p.prefs.mode==='3d'?<IslandWorld3D", "(viewMode??p.prefs.mode)==='3d'?<IslandWorld3D");
s=s.replace("if(!readOnly)preferences({mode:'2d'});else setNotice('此裝置 WebGL 無法啟用，請在設定切換 2D');","setViewMode('2d');if(!readOnly)preferences({mode:'2d'});");
s=s.replace("if(readOnly)setNotice('家長檢視沿用學生地圖設定');else preferences({mode:p.prefs.mode==='3d'?'2d':'3d'});","const mode=(viewMode??p.prefs.mode)==='3d'?'2d':'3d';setViewMode(mode);if(!readOnly)preferences({mode});");
s=s.replace("{p.prefs.mode==='3d'?'切換 2D':'切換 3D'}","{(viewMode??p.prefs.mode)==='3d'?'切換 2D':'切換 3D'}");
s=s.replace("if(!readOnly)preferences({motion:!p.prefs.motion});","const motion=!(localMotion??p.prefs.motion);setLocalMotion(motion);if(!readOnly)preferences({motion});");
s=s.replace("{p.prefs.motion?'動畫開':'動畫關'}","{(localMotion??p.prefs.motion)?'動畫開':'動畫關'}");
s=s.replace("date:d,status:'deferred'","date:d,status:'pending'");
s=s.replace("finally{syncLock.current=false;setSyncing(false);}","finally{syncLock.current=false;setSyncing(false);if(stateRef.current.outbox.length>100&&navigator.onLine)setTimeout(()=>void synchronize(),500);}");
s=s.replace("setReady(true);setPanel(u.role==='parent'?'parent':null);", "setReady(true);setNotice('');setPanel(u.role==='parent'?'parent':null);");
fs.writeFileSync('src/components/StudyIsland.tsx',s);
// The percentage represents a building score, not assessed coverage or exam readiness.
for(const file of ['src/island/engine.ts','src/island/art.tsx']){let text=fs.readFileSync(file,'utf8');text=text.replaceAll('`${Math.round(p * 100)}%`','`建築 ${Math.round(p * 100)}%`');fs.writeFileSync(file,text);}
