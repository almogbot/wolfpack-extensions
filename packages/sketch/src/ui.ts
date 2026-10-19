import type {ExtensionRegistrationHost,ExtensionViewContext} from './api.ts';
import {type Board,type Shape,simplifyStroke,parseBoard,serializeBoard,sanitizeLabel,byteLength,snap,COMPOSE_LIMIT,allocateId,hitTest,endpoint,deleteShape,moveShape,boardsEqual} from './model.ts';
type Tool='Select'|'Rect'|'Draw'|'Text'|'Start'|'Goal'|'Hazard';
const font='5px sans-serif',STEP=8;
// Toolbar order, visible/accessible names and 24x24 icon paths (stroke=currentColor).
const TOOLS:[Tool,string,string][]=[
 ['Draw','Draw','<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>'],
 ['Rect','Box','<rect x="4" y="6" width="16" height="12" rx="2"/>'],
 ['Hazard','Spikes','<path d="M3 19L7 8l4 11 4-11 4 11"/>'],
 ['Start','Start','<path d="M6 21V4"/><path d="M6 4h11l-3 4 3 4H6"/>'],
 ['Goal','Goal','<path d="M12 3l2.6 6 6.4.5-4.8 4.2 1.5 6.3-5.7-3.3-5.7 3.3 1.5-6.3L3 9.5 9.4 9z"/>'],
 ['Text','Text','<path d="M5 6h14M12 6v13M9 19h6"/>'],
 ['Select','Move','<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>']];
const empty=():Board=>({schemaVersion:1,size:160,shapes:[]});
function mount(container:HTMLElement,context:ExtensionViewContext){
 let board=empty(),base=0,tool:Tool='Draw',selected:string|undefined,disposed=false,visible=true,timer:ReturnType<typeof setTimeout>|undefined;
 let pending:{board:Board;revision:number}|undefined,ignored=0,latest=0;
 const undo:{board:Board;base:number}[]=[],cleanups=new Set<()=>void>();let cursor={x:80,y:80},preview:Board|undefined;
 type Gesture={id:number;start:{x:number;y:number};current:{x:number;y:number};original:Board;selection?:string;resize:boolean;tool:Tool;path?:{x:number;y:number}[]};let gesture:Gesture|undefined;
 const th=(k:string,d:string)=>context.theme[k]??d,ink=th('--text-primary','#f2f4f7'),muted=th('--text-muted','#a3abb5'),elevated=th('--bg-elevated','#2a2f37'),line=th('--border','#3a414b'),accent=th('--accent','#5aa9ff'),onAccent='#07101c',boxFill=th('--text-secondary','#c9cfd7'),boxLine=th('--border-strong','#8b94a0'),boxText=th('--bg-base','#1b1e23');
 const root=document.createElement('section');root.setAttribute('aria-label','Sketch');root.style.cssText=`padding:8px;background:${th('--bg-surface','#1b1e23')};color:${ink};font-family:${th('--font-ui','system-ui,sans-serif')};box-sizing:border-box;max-width:576px`;
 const toolbar=document.createElement('div');toolbar.setAttribute('aria-label','Drawing tools');toolbar.style.cssText='display:flex;flex-wrap:nowrap;gap:4px';
 const actions=document.createElement('div');actions.setAttribute('aria-label','Actions');actions.style.cssText='display:flex;align-items:center;gap:6px;margin-top:6px';
 const counter=document.createElement('div');counter.setAttribute('role','status');counter.style.cssText=`margin-top:2px;font-size:11px;line-height:13px;text-align:right;white-space:nowrap;color:${muted}`;
 const status=document.createElement('div');status.setAttribute('role','status');status.style.cssText='font-size:12px;min-height:16px;margin-top:4px';
 const banner=document.createElement('div'),note=document.createElement('div');note.style.whiteSpace='pre-wrap';
 const surface=document.createElement('div');surface.style.cssText='position:relative;width:100%;max-width:560px;margin-top:4px';
 const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.tabIndex=0;canvas.style.cssText=`display:block;width:100%;aspect-ratio:1;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;outline-offset:2px;border-radius:10px;box-shadow:0 0 0 1px ${line}`;surface.append(canvas);
 root.append(toolbar,actions,counter,status,banner,note,surface);container.append(root);
 function listen(target:EventTarget,name:string,fn:EventListener){target.addEventListener(name,fn);const off=()=>{target.removeEventListener(name,fn);cleanups.delete(off)};cleanups.add(off);return off}
 function button(name:string,parent:HTMLElement,action:()=>void,o:{icon?:string;primary?:boolean;tool?:boolean}={}){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',name);
  const label=document.createElement('span');label.textContent=name;label.style.cssText=`font-size:${o.tool?11:12}px;line-height:13px;white-space:nowrap;${o.primary?'font-weight:600':''}`;
  if(o.icon)b.insertAdjacentHTML('afterbegin',`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${o.icon}</svg>`);b.append(label);
  b.style.cssText=`display:flex;flex-direction:${o.tool?'column':'row'};align-items:center;justify-content:center;gap:2px;box-sizing:border-box;min-width:44px;min-height:${o.tool?48:44}px;padding:${o.tool?'4px 2px':'6px 12px'};border-radius:10px;border:1px solid ${o.primary?accent:line};background:${o.primary?accent:elevated};color:${o.primary?onAccent:ink};font-family:inherit;touch-action:manipulation;cursor:pointer;flex:${o.tool?'1 1 0':'0 0 auto'}`;
  parent.append(b);listen(b,'click',action);return b}
 const tools=new Map<Tool,HTMLButtonElement>();for(const [name,label,icon] of TOOLS)tools.set(name,button(label,toolbar,()=>{cancelGesture();cancelText();tool=name;if(name!=='Select')selected=undefined;refresh()},{icon,tool:true}));
 button('Undo',actions,()=>{cancelGesture();cancelText();const previous=undo.pop();if(previous){board=previous.board;base=previous.base;selected=undefined;changed()}});
 const del=button('Delete',actions,()=>{if(selected){commit(deleteShape(board,selected));selected=undefined;refresh()}});
 button('Clear',actions,()=>{cancelGesture();cancelText();commit(empty());selected=undefined;refresh()});
 
 const send=button('Send to agent',actions,()=>{
  const text=serializeBoard(board,base),toError=(e:unknown)=>e instanceof Error?e:Error(String(e));
  // Clipboard write starts synchronously inside the click so it keeps user activation.
  const copy=(async()=>navigator.clipboard.writeText(text))().then(()=>undefined,toError);
  let composed=false,composeError:Error|undefined;try{if(context.terminal){context.terminal.compose(text);composed=true}}catch(e){composeError=toError(e)}
  void copy.then(copyError=>{if(disposed)return;
   if(!copyError)status.textContent=composed?'In the agent prompt and copied.':composeError?`Compose failed (${composeError.message}); copied — paste into the agent prompt.`:'Copied — paste into the agent prompt.';
   else if(composed)status.textContent=`In the agent prompt (copy failed: ${copyError.message}).`;
   else error(composeError??copyError)});
 },{primary:true});send.style.marginLeft='auto';
 function error(e:unknown){status.textContent=e instanceof Error?e.message:String(e)}
 function persist(){if(timer!==undefined){clearTimeout(timer);timer=undefined}try{context.storage.set('board',JSON.stringify({board,base,ignored}))}catch(e){if(!disposed)error(e)}}
 function changed(){status.textContent='';if(timer!==undefined)clearTimeout(timer);timer=setTimeout(persist,300);refresh()}
 function commit(next:Board,nextBase=base){try{parseBoard(next);if(boardsEqual(board,next)&&base===nextBase)return;undo.push({board,base});if(undo.length>100)undo.shift();board=next;base=nextBase;changed()}catch(e){error(e)}}
 function refresh(){
  for(const [name,b] of tools){b.setAttribute('aria-pressed',String(name===tool));const on=name===tool;b.style.background=on?accent:elevated;b.style.color=on?onAccent:ink;b.style.borderColor=on?accent:line}
  del.disabled=!board.shapes.some(s=>s.id===selected);del.style.opacity=del.disabled?'.45':'1';
  const bytes=byteLength(serializeBoard(board,base));counter.textContent=`${bytes} / ${COMPOSE_LIMIT} B${bytes>COMPOSE_LIMIT?' — remove shapes to send':''}`;counter.style.color=bytes>COMPOSE_LIMIT?th('--danger','#ff8a8a'):muted;
  send.disabled=bytes>COMPOSE_LIMIT;send.style.opacity=send.disabled?'.45':'1';
  note.textContent=board.note??'';const counts=new Map<string,number>();for(const s of board.shapes)counts.set(s.kind,(counts.get(s.kind)??0)+1);canvas.setAttribute('aria-label','Sketch: '+([...counts].map(([kind,n])=>`${n} ${kind}${n===1?'':'s'}`).join(', ')||'empty board'));draw();
 }
 function draw(){if(disposed||!visible)return;const ctx=canvas.getContext('2d');if(!ctx)return;const scale=canvas.width/160;ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle=th('--bg-inset','#12151a');ctx.fillRect(0,0,160,160);
  ctx.strokeStyle='rgba(128,138,150,0.18)';ctx.lineWidth=0.3;ctx.beginPath();for(let n=STEP;n<160;n+=STEP){ctx.moveTo(n,0);ctx.lineTo(n,160);ctx.moveTo(0,n);ctx.lineTo(160,n)}ctx.stroke();
  const b=preview??board,YELLOW='#ffe14d';ctx.font=font;ctx.lineJoin='round';ctx.lineCap='round';
  for(const s of b.shapes){const sel=s.id===selected;ctx.lineWidth=0.8;ctx.fillStyle=ink;
   if(s.kind==='arrow'){ctx.strokeStyle=sel?YELLOW:accent;ctx.lineWidth=sel?1.4:0.8;const a=endpoint(b,s,1),z=endpoint(b,s,2),angle=Math.atan2(z.y-a.y,z.x-a.x);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(z.x,z.y);ctx.moveTo(z.x-4*Math.cos(angle-0.5),z.y-4*Math.sin(angle-0.5));ctx.lineTo(z.x,z.y);ctx.lineTo(z.x-4*Math.cos(angle+0.5),z.y-4*Math.sin(angle+0.5));ctx.stroke();if(s.label)ctx.fillText(s.label,(a.x+z.x)/2,(a.y+z.y)/2)}
   else if(s.kind==='stroke'){ctx.beginPath();s.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    if(sel){ctx.strokeStyle=YELLOW;ctx.lineWidth=4;ctx.globalAlpha=0.5;ctx.stroke();ctx.globalAlpha=1}
    ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();if(s.label)ctx.fillText(s.label,s.points[0][0]+1,s.points[0][1]-2)}
   else if(s.kind==='rect'){ctx.fillStyle=boxFill;ctx.fillRect(s.x,s.y,s.w,s.h);ctx.strokeStyle=sel?YELLOW:boxLine;ctx.lineWidth=sel?1.4:0.8;ctx.strokeRect(s.x,s.y,s.w,s.h);if(s.label){ctx.fillStyle=boxText;ctx.fillText(s.label,s.x+1,s.y+5)}}
   else if(s.kind==='hazard'){ctx.fillStyle='rgba(255,90,54,0.18)';ctx.fillRect(s.x,s.y,s.w,s.h);const n=Math.max(1,Math.round(s.w/6)),tw=s.w/n,tooth=Math.min(s.h,tw*1.3);ctx.fillStyle='#ff5a36';ctx.beginPath();for(let k=0;k<n;k++){ctx.moveTo(s.x+k*tw,s.y+s.h);ctx.lineTo(s.x+(k+0.5)*tw,s.y+s.h-tooth);ctx.lineTo(s.x+(k+1)*tw,s.y+s.h)}ctx.fill();
    if(sel){ctx.strokeStyle=YELLOW;ctx.lineWidth=1.4;ctx.strokeRect(s.x,s.y,s.w,s.h)}if(s.label){ctx.fillStyle=ink;ctx.fillText(s.label,s.x+1,s.y+5)}}
   else if(s.kind==='text'){ctx.fillStyle=sel?YELLOW:ink;ctx.fillText(s.label,s.x,s.y)}
   else if(s.kind==='start'){ctx.fillStyle='#34c759';ctx.strokeStyle='#34c759';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x,s.y-10);ctx.stroke();ctx.beginPath();ctx.moveTo(s.x,s.y-10);ctx.lineTo(s.x+7,s.y-7);ctx.lineTo(s.x,s.y-4);ctx.fill();if(s.label){ctx.fillStyle=ink;ctx.fillText(s.label,s.x+3,s.y+5)}}
   else {ctx.fillStyle='#ffd23f';ctx.strokeStyle='#b8860b';ctx.lineWidth=0.5;ctx.beginPath();for(let k=0;k<10;k++){const r=k%2?2.2:5.5,a=-Math.PI/2+k*Math.PI/5;ctx.lineTo(s.x+r*Math.cos(a),s.y+r*Math.sin(a))}ctx.closePath();ctx.fill();ctx.stroke();if(s.label){ctx.fillStyle=ink;ctx.fillText(s.label,s.x+6,s.y+2)}}
   if(sel&&(s.kind==='start'||s.kind==='goal')){ctx.strokeStyle=YELLOW;ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,s.kind==='start'?s.y-5:s.y,8,0,Math.PI*2);ctx.stroke()}
   if(sel&&s.kind==='rect'){ctx.fillStyle=YELLOW;ctx.fillRect(s.x+s.w-2,s.y+s.h-2,4,4)}
  }
  if(document.activeElement===canvas){ctx.strokeStyle='#ffffff';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(cursor.x-3,cursor.y);ctx.lineTo(cursor.x+3,cursor.y);ctx.moveTo(cursor.x,cursor.y-3);ctx.lineTo(cursor.x,cursor.y+3);ctx.stroke()}
 }
 const resize=new ResizeObserver(()=>{if(disposed)return;const width=Math.min(560,surface.getBoundingClientRect().width);canvas.width=canvas.height=Math.max(1,Math.round(width*(window.devicePixelRatio||1)));draw()});resize.observe(surface);
 const cssUnits=(pixels:number)=>pixels*160/(canvas.getBoundingClientRect().width||160);
 function hit(b:Board,x:number,y:number){return hitTest(b,x,y,cssUnits(22),false,s=>{const ctx=canvas.getContext('2d')!;ctx.font=font;const m=ctx.measureText(s.label);return {width:m.width,ascent:m.actualBoundingBoxAscent||5,descent:m.actualBoundingBoxDescent||1}})}
 function position(event:PointerEvent){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(160,(event.clientX-r.left)*160/r.width)),y:Math.max(0,Math.min(160,(event.clientY-r.top)*160/r.height))}}
 const quantize=(v:number,max=160)=>Math.max(0,Math.min(max,Math.round(snap(v,STEP))));
 let frame=0;
 function cancelGesture(){if(frame){cancelAnimationFrame(frame);frame=0}if(gesture&&canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);gesture=undefined;preview=undefined;draw()}
 function gestureBoard(g:Gesture):Board{
  const a={x:quantize(g.start.x),y:quantize(g.start.y)},z={x:quantize(g.current.x),y:quantize(g.current.y)},dx=z.x-a.x,dy=z.y-a.y;
  if(g.tool==='Select'&&g.selection){if(g.resize)return {...g.original,shapes:g.original.shapes.map(s=>s.id===g.selection&&'w' in s?{...s,w:Math.max(1,Math.min(160-s.x,z.x-s.x)),h:Math.max(1,Math.min(160-s.y,z.y-s.y))}:s)};return moveShape(g.original,g.selection,dx,dy)}
  const id=allocateId(g.original);let shape:Shape|undefined;
  if(g.tool==='Rect'||g.tool==='Hazard'){const w=Math.abs(dx),h=Math.abs(dy);if(w&&h)shape={id,kind:g.tool==='Rect'?'rect':'hazard',x:Math.min(a.x,z.x),y:Math.min(a.y,z.y),w,h}}
  if(g.tool==='Draw'){const points=g.path&&simplifyStroke(g.path);if(points)shape={id,kind:'stroke',points}}
  return shape?{...g.original,shapes:[...g.original.shapes,shape]}:g.original;
 }
 // The host's edge back-swipe listens for bubbling touch events; drawing must not reach it.
 for(const name of ['touchstart','touchmove'])listen(canvas,name,event=>event.stopPropagation());
 listen(canvas,'pointerdown',(event)=>{const e=event as PointerEvent;if(gesture||e.button!==0)return;e.preventDefault();canvas.focus();const p=position(e),s=board.shapes.find(s=>s.id===selected),radius=cssUnits(12),handle=s&&'w' in s&&Math.abs(p.x-s.x-s.w)<=radius&&Math.abs(p.y-s.y-s.h)<=radius;
  if(tool==='Select'&&!handle)selected=hit(board,p.x,p.y)?.id;
  gesture={id:e.pointerId,start:p,current:p,original:board,selection:selected,resize:!!handle,tool,...tool==='Draw'?{path:[p]}:{}};canvas.setPointerCapture(e.pointerId);draw();
 });
 listen(canvas,'pointermove',event=>{const e=event as PointerEvent;if(!gesture||gesture.id!==e.pointerId)return;gesture.current=position(e);if(gesture.path){const last=gesture.path[gesture.path.length-1];if(Math.hypot(gesture.current.x-last.x,gesture.current.y-last.y)>=0.5&&gesture.path.length<2000){gesture.path.push(gesture.current);if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(gesture){preview=gestureBoard(gesture);draw()}})}return}if(Math.hypot(gesture.current.x-gesture.start.x,gesture.current.y-gesture.start.y)>=STEP)preview=gestureBoard(gesture);draw()});
 listen(canvas,'pointerup',event=>{const e=event as PointerEvent;if(!gesture||gesture.id!==e.pointerId)return;const g=gesture;g.current=position(e);const distance=Math.hypot(g.current.x-g.start.x,g.current.y-g.start.y);g.path?.push(g.current);cancelGesture();if(g.path)commit(gestureBoard(g));else if(distance>=STEP)commit(gestureBoard(g));else if(['Start','Goal','Text'].includes(g.tool))apply(g.start);refresh()});
 listen(canvas,'pointercancel',event=>{if(gesture?.id===(event as PointerEvent).pointerId)cancelGesture()});
 let editor:HTMLInputElement|undefined,editorCleanup:(()=>void)[]=[];
 function cancelText(){for(const off of editorCleanup)off();editorCleanup=[];editor?.remove();editor=undefined}
 function editText(p:{x:number;y:number}){
  cancelText();const input=document.createElement('input');editor=input;input.setAttribute('aria-label','Text label');input.style.cssText=`position:absolute;left:${Math.min(p.x/160*100,50)}%;top:${p.y/160*100}%;width:48%;font-size:16px;box-sizing:border-box`;surface.append(input);
  const finish=()=>{if(editor!==input)return;const label=sanitizeLabel(input.value);cancelText();if(label)commit({...board,shapes:[...board.shapes,{id:allocateId(board),kind:'text',x:p.x,y:p.y,label}]});canvas.focus()};
  editorCleanup.push(listen(input,'input',()=>{input.value=sanitizeLabel(input.value)}),listen(input,'blur',finish),listen(input,'keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'){e.preventDefault();finish()}if(e.key==='Escape'){e.preventDefault();cancelText();canvas.focus()}}));input.focus();
 }
 function apply(p:{x:number;y:number}){const x=quantize(p.x,159),y=quantize(p.y,159);
  if(tool==='Select'){selected=hit(board,x,y)?.id;draw()}
  else if(tool==='Start'||tool==='Goal')commit({...board,shapes:[...board.shapes,{id:allocateId(board),kind:tool==='Start'?'start':'goal',x,y}]});
  else if(tool==='Text')editText({x,y});
  else if(tool==='Rect'||tool==='Hazard'){const w=Math.min(STEP,160-x),h=Math.min(STEP,160-y);commit({...board,shapes:[...board.shapes,{id:allocateId(board),kind:tool==='Rect'?'rect':'hazard',x,y,w,h}]})}
 }
 listen(canvas,'keydown',event=>{const e=event as KeyboardEvent,step=STEP,delta:Record<string,[number,number]>={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
  if(delta[e.key]){e.preventDefault();const [dx,dy]=delta[e.key];if(selected)commit(moveShape(board,selected,dx,dy));else{cursor={x:Math.max(0,Math.min(159,cursor.x+dx)),y:Math.max(0,Math.min(159,cursor.y+dy))};draw()}}
  else if(e.key==='Enter'){e.preventDefault();if(tool==='Draw'){const x=Math.min(cursor.x,144),y=cursor.y;commit({...board,shapes:[...board.shapes,{id:allocateId(board),kind:'stroke',points:[[x,y],[x+16,y]]}]});refresh()}else apply(cursor)}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(selected){commit(deleteShape(board,selected));selected=undefined;refresh()}}
 });listen(canvas,'focus',draw);listen(canvas,'blur',draw);
 try{const raw=context.storage.get('board');if(raw){const saved=JSON.parse(raw);if(!Number.isSafeInteger(saved.base)||saved.base<0||saved.ignored!==undefined&&(!Number.isSafeInteger(saved.ignored)||saved.ignored<0))throw Error('Invalid saved revision');board=parseBoard(saved.board);base=saved.base;ignored=saved.ignored??0}}catch{/* Invalid scoped drafts are ignored, not rendered. */}
 const bannerMessage=document.createElement('span');banner.append(bannerMessage);
 button('Load',banner,()=>{if(!pending)return;cancelGesture();cancelText();commit(pending.board,pending.revision);pending=undefined;banner.hidden=true;selected=undefined;changed()});
 button('Keep mine',banner,()=>{if(pending)ignored=pending.revision;pending=undefined;banner.hidden=true;changed()});banner.hidden=true;
 const unsubscribe=context.documents.subscribe('board',(value,revision)=>{
  if(disposed||value===null)return;try{
   const incoming=parseBoard(value);if(!Number.isSafeInteger(revision)||revision<0)throw Error('Invalid board revision');if(revision<latest)return;latest=revision;if(revision<=base||revision===ignored)return;
   if(board.shapes.length===0&&!editor&&!gesture){board=incoming;base=revision;pending=undefined;banner.hidden=true;changed()}
   else if(editor||gesture||!boardsEqual(incoming,board)){pending={board:incoming,revision};bannerMessage.textContent=`Agent sent revision ${revision}`;banner.hidden=false}
   else {base=revision;pending=undefined;banner.hidden=true;changed()}
  }catch(e){error(e)}
 });
 function dispose(){if(disposed)return;persist();disposed=true;cancelGesture();cancelText();unsubscribe();resize.disconnect();for(const off of cleanups)off();context.signal.removeEventListener('abort',dispose);root.remove()}
 context.signal.addEventListener('abort',dispose);refresh();if(context.signal.aborted)dispose();
 return {dispose,setVisible(value:boolean){if(disposed)return;visible=value;root.hidden=!value;if(!value){cancelGesture();cancelText()}else draw()}};
}
export default function register(host:ExtensionRegistrationHost){host.registerContextView({id:'sketch',title:'Sketch',mount})}
