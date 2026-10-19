export type Box = {id:string;kind:'rect'|'hazard';x:number;y:number;w:number;h:number;label?:string};
export type Point = {id:string;kind:'start'|'goal';x:number;y:number;label?:string} | {id:string;kind:'text';x:number;y:number;label:string};
export type Arrow = {id:string;kind:'arrow';from?:string;to?:string;x1?:number;y1?:number;x2?:number;y2?:number;label?:string};
export type Stroke={id:string;kind:'stroke';points:[number,number][];label?:string};
export type Shape = Box | Point | Arrow | Stroke;
export interface Board {schemaVersion:1;size:160;note?:string;shapes:Shape[]}
export const COMPOSE_LIMIT=4000;
const hidden=/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}]/u;
export function sanitizeLabel(input:string):string {return [...input.replace(new RegExp(hidden.source,'gu'),'')].slice(0,80).join('')}
const integer=(v:unknown,max:number,min=0):v is number=>Number.isSafeInteger(v) && (v as number)>=min && (v as number)<=max;
const id=(v:unknown):v is string=>typeof v==='string' && /^[a-z][a-z0-9]{0,7}$/.test(v);
function object(v:unknown):Record<string,unknown>{if(!v || typeof v!=='object' || Array.isArray(v) || ![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw Error('Invalid board document');return v as Record<string,unknown>}
function keys(v:Record<string,unknown>,allowed:string[]){if(Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Invalid board fields')}
function text(v:unknown,max:number,note=false){if(typeof v!=='string'||[...v].length>max||hidden.test(note?v.replaceAll('\n',''):v))throw Error('Invalid board text')}
export function parseBoard(value:unknown):Board {
 const b=object(value);keys(b,['schemaVersion','size','note','shapes']);
 if(b.schemaVersion!==1||b.size!==160||!Array.isArray(b.shapes)||b.shapes.length>200)throw Error('Invalid board document');
 if(Object.hasOwn(b,'note'))text(b.note,2000,true);
 const ids=new Set<string>();
 for(const item of b.shapes){const s=object(item);if(!id(s.id)||ids.has(s.id))throw Error('Invalid or duplicate shape id');ids.add(s.id);
  if(Object.hasOwn(s,'label'))text(s.label,80);
  if(s.kind==='arrow'){
   keys(s,['id','kind','from','to','x1','y1','x2','y2','label']);
   for(const [ref,x,y] of [['from','x1','y1'],['to','x2','y2']]){
    if(Object.hasOwn(s,ref)){if(!id(s[ref])||Object.hasOwn(s,x)||Object.hasOwn(s,y))throw Error('Invalid arrow endpoint')}
    else if(!integer(s[x],160)||!integer(s[y],160))throw Error('Invalid arrow endpoint');
   }
  }else if(s.kind==='stroke'){
   keys(s,['id','kind','points','label']);
   if(!Array.isArray(s.points)||s.points.length<2||s.points.length>48||s.points.some(p=>!Array.isArray(p)||p.length!==2||!integer(p[0],160)||!integer(p[1],160)))throw Error('Invalid stroke');
  }else if(['rect','hazard','start','goal','text'].includes(s.kind as string)){
   const box=s.kind==='rect'||s.kind==='hazard';keys(s,['id','kind','x','y','label',...(box?['w','h']:[])]);
   if(!integer(s.x,159)||!integer(s.y,159))throw Error('Invalid point');
   if(box&&(!integer(s.w,160,1)||!integer(s.h,160,1)||(s.x as number)+(s.w as number)>160||(s.y as number)+(s.h as number)>160))throw Error('Invalid rectangle');
   if(s.kind==='text'&&(typeof s.label!=='string'||!s.label.length))throw Error('Text label required');
  }else throw Error(`Unknown shape ${String(s.kind)}`);
 }
 for(const s of b.shapes as Shape[])if(s.kind==='arrow')for(const ref of [s.from,s.to])if(ref && !(b.shapes as Shape[]).some(target=>target.id===ref&&target.kind!=='arrow'))throw Error(`Missing arrow target ${ref}`);
 return b as unknown as Board;
}
export function boardsEqual(a:Board,b:Board):boolean {return a.note===b.note&&serializeBoard(a,0)===serializeBoard(b,0)}
export function byteLength(text:string){return new TextEncoder().encode(text).length}
export function snap(value:number,step:number){return Math.round(value/step)*step}
export function serializeBoard(board:Board,base:number):string {
 parseBoard(board);if(!integer(base,Number.MAX_SAFE_INTEGER))throw Error('Invalid revision');
 const quote=(s:string)=>'"'+s.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"';
 return [`sketch v1 160x160 shapes=${board.shapes.length} base=${base};`,...board.shapes.map(s=>{
  const coordinates=s.kind==='stroke'?s.points.map(p=>p.join(',')).join(' '):s.kind==='arrow'?`${s.from??`${s.x1},${s.y1}`}->${s.to??`${s.x2},${s.y2}`}`:`${s.x} ${s.y}${'w' in s?` ${s.w} ${s.h}`:''}`;
  return `${s.kind} ${s.id} ${coordinates}${s.label!==undefined?' '+quote(s.label):''};`;
 }),'end;'].join('\n');
}
export function parseComposeText(text:string):{base:number;board:Board} {
 // Sticky tokenization rejects every unrecognised byte, including unsupported escapes.
 const token=/\s*("(?:[^"\\]|\\["\\])*"|->|[;,=]|[a-z][a-z0-9]*|[0-9]+)/y;const tokens:string[]=[];let pos=0;
 while(pos<text.length){if(/^\s*$/.test(text.slice(pos)))break;token.lastIndex=pos;const m=token.exec(text);if(!m)throw Error(`Invalid token ${text.slice(pos,pos+20)}`);tokens.push(m[1]);pos=token.lastIndex}
 let i=0;const take=()=>{if(i>=tokens.length)throw Error('Truncated sketch');return tokens[i++]};const need=(s:string)=>{const got=take();if(got!==s)throw Error(`Expected ${s}, got ${got}`)};
 const number=()=>{const s=take();if(!/^\d+$/.test(s)||!integer(Number(s),Number.MAX_SAFE_INTEGER))throw Error(`Invalid number ${s}`);return Number(s)};
 need('sketch');need('v1');need('160');need('x160');need('shapes');need('=');const count=number();need('base');need('=');const base=number();need(';');
 const shapes:Shape[]=[];
 while(tokens[i]!=='end'){
  const kind=take(),shape:Record<string,unknown>={kind,id:take()};
  if(kind==='arrow'){for(const [ref,x,y] of [['from','x1','y1'],['to','x2','y2']]){if(/^\d+$/.test(tokens[i]??'')){shape[x]=number();need(',');shape[y]=number()}else shape[ref]=take();if(ref==='from')need('->')}}
  else if(kind==='stroke'){const points:number[][]=[];while(/^\d+$/.test(tokens[i]??'')){const x=number();need(',');points.push([x,number()])}shape.points=points}
  else if(['rect','hazard','start','goal','text'].includes(kind)){shape.x=number();shape.y=number();if(kind==='rect'||kind==='hazard'){shape.w=number();shape.h=number()}}
  else throw Error(`Unknown statement ${kind}`);
  if(tokens[i]?.startsWith('"'))shape.label=JSON.parse(take());need(';');shapes.push(shape as Shape);
 }
 need('end');need(';');if(i!==tokens.length||count!==shapes.length)throw Error('Trailing tokens or shape count mismatch');
 return {base,board:parseBoard({schemaVersion:1,size:160,shapes})};
}
export function centre(s:Exclude<Shape,Arrow>):{x:number;y:number}{if(s.kind==='stroke'){const xs=s.points.map(p=>p[0]),ys=s.points.map(p=>p[1]);return {x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2}}return {x:s.x+('w' in s?s.w/2:0),y:s.y+('h' in s?s.h/2:0)}}
export function endpoint(b:Board,s:Arrow,end:1|2):{x:number;y:number}{const ref=end===1?s.from:s.to;if(ref){const target=b.shapes.find(s=>s.id===ref);if(target&&target.kind!=='arrow')return centre(target)}return {x:(end===1?s.x1:s.x2)!,y:(end===1?s.y1:s.y2)!}}
export function deleteShape(b:Board,id:string):Board {
 const target=b.shapes.find(s=>s.id===id);if(!target)return b;
 return {...b,shapes:b.shapes.filter(s=>s.id!==id).map(s=>{
  if(s.kind!=='arrow'||target.kind==='arrow')return s;const result={...s},p=centre(target);
  if(s.from===id){delete result.from;result.x1=Math.round(p.x);result.y1=Math.round(p.y)}if(s.to===id){delete result.to;result.x2=Math.round(p.x);result.y2=Math.round(p.y)}return result;
 })};
}
export function allocateId(b:Board):string {let n=1;while(b.shapes.some(s=>s.id===`s${n}`))n++;return `s${n}`}
function segmentDistance(x:number,y:number,a:readonly number[],z:readonly number[]){const dx=z[0]-a[0],dy=z[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)}
export function hitTest(b:Board,x:number,y:number,tolerance=4,nonArrow=false,textBounds?:(s:Extract<Shape,{kind:'text'}>)=>{width:number;ascent:number;descent:number}):Shape|undefined {
 return [...b.shapes].reverse().find(s=>{
  if(s.kind==='arrow'){if(nonArrow)return false;const a=endpoint(b,s,1),z=endpoint(b,s,2),dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<=tolerance}
  if(s.kind==='stroke')return s.points.some((p,i)=>segmentDistance(x,y,s.points[Math.max(0,i-1)],p)<=tolerance);
  if(s.kind==='text'&&textBounds){const box=textBounds(s);return x>=s.x-tolerance&&x<=s.x+box.width+tolerance&&y>=s.y-box.ascent-tolerance&&y<=s.y+box.descent+tolerance}
  return 'w' in s?x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h:Math.hypot(x-s.x,y-s.y)<=tolerance;
 });
}
export function moveShape(b:Board,id:string,dx:number,dy:number):Board {
 return {...b,shapes:b.shapes.map(s=>{
  if(s.id!==id)return s;if(s.kind==='arrow'){const r={...s};for(const end of [1,2] as const){const centre=endpoint(b,s,end),p={x:Math.round(centre.x),y:Math.round(centre.y)};if(end===1){delete r.from;r.x1=Math.max(0,Math.min(160,p.x+dx));r.y1=Math.max(0,Math.min(160,p.y+dy))}else{delete r.to;r.x2=Math.max(0,Math.min(160,p.x+dx));r.y2=Math.max(0,Math.min(160,p.y+dy))}}return r}
  if(s.kind==='stroke'){const xs=s.points.map(p=>p[0]),ys=s.points.map(p=>p[1]),mx=Math.max(-Math.min(...xs),Math.min(160-Math.max(...xs),dx)),my=Math.max(-Math.min(...ys),Math.min(160-Math.max(...ys),dy));return {...s,points:s.points.map(p=>[p[0]+mx,p[1]+my] as [number,number])}}
  return {...s,x:Math.max(0,Math.min('w' in s?160-s.w:159,s.x+dx)),y:Math.max(0,Math.min('h' in s?160-s.h:159,s.y+dy))};
 })};
}
function rdp(p:{x:number;y:number}[],eps:number):{x:number;y:number}[]{
 // Iterative (explicit stack) so depth never grows with the sample count.
 const keep=new Uint8Array(p.length),stack:[number,number][]=[[0,p.length-1]];keep[0]=keep[p.length-1]=1;
 while(stack.length){const [lo,hi]=stack.pop()!;let far=0,at=-1;
  for(let i=lo+1;i<hi;i++){const d=segmentDistance(p[i].x,p[i].y,[p[lo].x,p[lo].y],[p[hi].x,p[hi].y]);if(d>far){far=d;at=i}}
  if(at>=0&&far>eps){keep[at]=1;stack.push([lo,at],[at,hi])}}
 return p.filter((_,i)=>keep[i]);
}
/** Freehand path (board units) to stroke points: RDP, widened until <=48 points; undefined when shorter than 3 units. */
export function simplifyStroke(path:{x:number;y:number}[]):[number,number][]|undefined {
 if(path.length<2||path.reduce((n,p,i)=>i?n+Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y):0,0)<3)return undefined;
 let eps=1.5,out=rdp(path,eps);while(out.length>48){eps*=1.25;out=rdp(path,eps)}
 const pts=out.map(p=>[Math.max(0,Math.min(160,Math.round(p.x))),Math.max(0,Math.min(160,Math.round(p.y)))] as [number,number]).filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);
 return pts.length>=2?pts:undefined;
}
