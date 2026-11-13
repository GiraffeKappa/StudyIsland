import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[fs.realpathSync('node_modules/next')]}));
const svg=fs.readFileSync('public/icon.svg');
for(const [name,size] of [['icon-192',192],['icon-512',512],['apple-touch-icon',180],['icon-maskable',512]]){
 let image=sharp(svg);
 if(name==='icon-maskable')image=sharp({create:{width:512,height:512,channels:4,background:'#60a8b0'}}).composite([{input:await sharp(svg).resize(380,380).toBuffer(),gravity:'center'}]);
 await image.resize(size,size).png().toFile('public/'+name+'.png');
}
