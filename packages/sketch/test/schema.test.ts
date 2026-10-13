import {expect,test} from 'bun:test';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bytes=readFileSync(new URL('../schemas/board.schema.json',import.meta.url)),schema=JSON.parse(bytes.toString());
const count=(v:any):number=>1+(v&&typeof v==='object'?Object.values(v).reduce<number>((n,x)=>n+count(x),0):0);
test('schema host limits and digest',()=>{
 expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');expect(schema.additionalProperties).toBe(false);
 const forbidden=['$ref','$id','$anchor','pattern','patternProperties','format','$dynamicRef','$recursiveRef','$async'];
 const walk=(v:any)=>{if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){expect(forbidden).not.toContain(k);walk(x)}};walk(schema);
 let nodes=0,maxDepth=0;const visit=(v:any,d=0)=>{nodes++;maxDepth=Math.max(d,maxDepth);if(typeof v==='boolean')return;for(const k of ['items','additionalProperties'])if(k in v)visit(v[k],d+1);if(v.properties)for(const x of Object.values(v.properties))visit(x,d+1);for(const k of ['oneOf','anyOf','allOf'])if(v[k]){expect(v[k].length).toBeLessThanOrEqual(16);for(const x of v[k])visit(x,d+1)}};visit(schema);
 expect(nodes).toBeLessThanOrEqual(256);expect(maxDepth).toBeLessThanOrEqual(16);
 const maximal={schemaVersion:1,size:160,note:'x'.repeat(2000),shapes:Array.from({length:200},(_,i)=>({kind:'arrow',id:'s'+i,x1:160,y1:160,x2:160,y2:160,label:'x'.repeat(80)}))};
 expect(count(maximal)*count(schema)).toBeLessThanOrEqual(2000000);
 expect(createHash('sha256').update(bytes).digest('hex')).toBe('8f35a32ecba355298f4a1b5b02397554135b9392adddb71d9c2df11105933f5d');
});
const ajvPath=new URL('../../../node_modules/ajv/dist/2020.js',import.meta.url);
if(existsSync(ajvPath))test('installed AJV cross-checks schema',async()=>{
 const {default:Ajv}=await import(ajvPath.pathname);const validate=new Ajv({strict:true}).compile(schema);
 for(const shape of [{id:'r',kind:'rect',x:0,y:0,w:160,h:8},{id:'h',kind:'hazard',x:0,y:0,w:8,h:8},{id:'s',kind:'start',x:0,y:0},{id:'g',kind:'goal',x:159,y:159},{id:'t',kind:'text',x:0,y:0,label:'hello'},{id:'a',kind:'arrow',from:'r',x2:160,y2:160}])expect(validate({schemaVersion:1,size:160,shapes:[shape]})).toBe(true);
 for(const value of [{schemaVersion:2,size:160,shapes:[]},{schemaVersion:1,size:159,shapes:[]},{schemaVersion:1,size:160,shapes:[{id:'s',kind:'start',x:160,y:0}]},{schemaVersion:1,size:160,shapes:[{id:'t',kind:'text',x:0,y:0,label:''}]},{schemaVersion:1,size:160,shapes:[],extra:1}])expect(validate(value)).toBe(false);
});else test.skip('AJV unavailable: schema semantic cross-check',()=>{});
