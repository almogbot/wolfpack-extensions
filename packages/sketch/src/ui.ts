import type {ExtensionRegistrationHost,ExtensionViewContext} from './api.ts';
import {type Board,type Shape,parseBoard,serializeBoard,sanitizeLabel,byteLength,snap,COMPOSE_LIMIT,allocateId,hitTest,endpoint,deleteShape,moveShape,boardsEqual} from './model.ts';
type Tool='Select'|'Rect'|'Arrow'|'Text'|'Start'|'Goal'|'Hazard';
const font='5px sans-serif';
const empty=():Board=>({schemaVersion:1,size:160,shapes:[]});
function mount(container:HTMLElement,context:ExtensionViewContext){
 let board=empty(),base=0,tool:Tool='Select',snapping=true,selected:string|undefined,disposed=false,visible=true,timer:ReturnType<typeof setTimeout>|undefined;
 let pending:{board:Board;revision:number}|undefined,ignored=0,latest=0;
 const undo:{board:Board;base:number}[]=[],cleanups=new Set<()=>void>();let cursor={x:80,y:80},preview:Board|undefined;
 type Gesture={id:number;start:{x:number;y:number};current:{x:number;y:number};original:Board;selection?:string;resize:boolean;tool:Tool};let gesture:Gesture|undefined;
 const root=document.createElement('section');root.setAttribute('aria-label','Sketch');root.style.cssText=`padding:8px;background:${context.theme['--bg-surface']??'#202020'};color:${context.theme['--text-primary']??'#ffffff'};font-family:${context.theme['--font-ui']??'sans-serif'};box-sizing:border-box;max-width:576px`;
 const toolbar=document.createElement('div');toolbar.setAttribute('aria-label','Drawing tools');toolbar.style.cssText='display:flex;flex-wrap:wrap;gap:4px';
 const counter=document.createElement('div');counter.setAttribute('role','status');
 const status=document.createElement('div');status.setAttribute('role','status');
 const banner=document.createElement('div'),note=document.createElement('div');note.style.whiteSpace='pre-wrap';
 const surface=document.createElement('div');surface.style.cssText='position:relative;width:100%;max-width:560px';
 const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.tabIndex=0;canvas.style.cssText='display:block;width:100%;aspect-ratio:1;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;outline-offset:2px';surface.append(canvas);
 root.append(toolbar,counter,status,banner,note,surface);container.append(root);
 function listen(target:EventTarget,name:string,fn:EventListener){target.addEventListener(name,fn);const off=()=>{target.removeEventListener(name,fn);cleanups.delete(off)};cleanups.add(off);return off}
 function button(name:string,parent:HTMLElement,action:()=>void){const b=document.createElement('button');b.type='button';b.textContent=name;b.style.cssText='min-width:44px;min-height:44px;padding:6px;font-size:12px;line-height:14px;touch-action:manipulation;white-space:nowrap;flex:0 0 auto';parent.append(b);listen(b,'click',action);return b}
 const tools=new Map<Tool,HTMLButtonElement>();for(const name of ['Select','Rect','Arrow','Text','Start','Goal','Hazard'] as Tool[])tools.set(name,button(name,toolbar,()=>{cancelGesture();cancelText();resetArrow();tool=name;refresh()}));
 button('Delete',toolbar,()=>{if(selected){commit(deleteShape(board,selected));selected=undefined;refresh()}});
 button('Undo',toolbar,()=>{cancelGesture();cancelText();resetArrow();const previous=undo.pop();if(previous){board=previous.board;base=previous.base;selected=undefined;changed()}});
 button('Clear',toolbar,()=>{cancelGesture();cancelText();resetArrow();commit(empty());selected=undefined;refresh()});
 const snapButton=button('Snap on',toolbar,()=>{snapping=!snapping;refresh()});
 const send=button('Send to agent',toolbar,()=>{try{context.terminal?.compose(serializeBoard(board,base));status.textContent='Sketch composed; send from the terminal'}catch(e){error(e)}});
 let fallback:HTMLTextAreaElement|undefined;
 button('Copy',toolbar,()=>{const text=serializeBoard(board,base);void (async()=>{try{await navigator.clipboard.writeText(text);if(!disposed)status.textContent='Sketch copied'}catch{if(disposed)return;fallback?.remove();fallback=document.createElement('textarea');fallback.readOnly=true;fallback.setAttribute('aria-label','Copy sketch');fallback.value=text;fallback.style.cssText='width:100%;box-sizing:border-box;font-size:16px';root.append(fallback);fallback.focus();fallback.select();status.textContent='Select and copy the sketch'}})()});
 function error(e:unknown){status.textContent=e instanceof Error?e.message:String(e)}
 function persist(){if(timer!==undefined){clearTimeout(timer);timer=undefined}try{context.storage.set('board',JSON.stringify({board,base,ignored}))}catch(e){if(!disposed)error(e)}}
 function changed(){status.textContent='';if(timer!==undefined)clearTimeout(timer);timer=setTimeout(persist,300);refresh()}
 function commit(next:Board,nextBase=base){try{parseBoard(next);if(boardsEqual(board,next)&&base===nextBase)return;undo.push({board,base});if(undo.length>100)undo.shift();board=next;base=nextBase;changed()}catch(e){error(e)}}
 function refresh(){
  for(const [name,b] of tools)b.setAttribute('aria-pressed',String(name===tool));snapButton.textContent=snapping?'Snap on':'Snap off';snapButton.setAttribute('aria-pressed',String(snapping));
  const bytes=byteLength(serializeBoard(board,base));counter.textContent=`${bytes} / ${COMPOSE_LIMIT} B${bytes>COMPOSE_LIMIT?' — remove shapes to send':''}`;counter.style.color=bytes>COMPOSE_LIMIT?(context.theme['--danger']??'#ffaaaa'):'';
  send.disabled=bytes>COMPOSE_LIMIT||!context.terminal;if(!context.terminal)status.textContent='Open the terminal to send';
  note.textContent=board.note??'';const counts=new Map<string,number>();for(const s of board.shapes)counts.set(s.kind,(counts.get(s.kind)??0)+1);canvas.setAttribute('aria-label','Sketch: '+([...counts].map(([kind,n])=>`${n} ${kind}${n===1?'':'s'}`).join(', ')||'empty board'));draw();
 }
 function draw(){if(disposed||!visible)return;const ctx=canvas.getContext('2d');if(!ctx)return;const scale=canvas.width/160;ctx.setTransform(scale,0,0,scale,0,0);ctx.fillStyle=context.theme['--bg-inset']??'#111111';ctx.fillRect(0,0,160,160);ctx.lineWidth=0.4;
  if(snapping){ctx.strokeStyle=context.theme['--border']??'#555555';ctx.beginPath();for(let n=8;n<160;n+=8){ctx.moveTo(n,0);ctx.lineTo(n,160);ctx.moveTo(0,n);ctx.lineTo(160,n)}ctx.stroke()}
  const b=preview??board;for(const s of b.shapes){ctx.strokeStyle=s.id===selected?'#ffff66':(context.theme['--accent']??'#8bcfff');ctx.fillStyle=s.kind==='hazard'?'#ffaaaa':(context.theme['--text-primary']??'#ffffff');ctx.lineWidth=s.id===selected?1.4:0.8;ctx.font=font;
   if(s.kind==='arrow'){const a=endpoint(b,s,1),z=endpoint(b,s,2),angle=Math.atan2(z.y-a.y,z.x-a.x);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(z.x,z.y);ctx.moveTo(z.x-4*Math.cos(angle-0.5),z.y-4*Math.sin(angle-0.5));ctx.lineTo(z.x,z.y);ctx.lineTo(z.x-4*Math.cos(angle+0.5),z.y-4*Math.sin(angle+0.5));ctx.stroke();if(s.label)ctx.fillText(s.label,(a.x+z.x)/2,(a.y+z.y)/2)}
   else if('w' in s){ctx.strokeRect(s.x,s.y,s.w,s.h);if(s.kind==='hazard'){ctx.fillStyle='#ffaaaa55';ctx.fillRect(s.x,s.y,s.w,s.h)}if(s.label)ctx.fillText(s.label,s.x+1,s.y+5);if(s.id===selected){ctx.fillStyle='#ffff66';ctx.fillRect(s.x+s.w-2,s.y+s.h-2,4,4)}}
   else if(s.kind==='text')ctx.fillText(s.label,s.x,s.y);
   else {ctx.beginPath();ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.stroke();ctx.fillText(s.kind==='start'?'S':'G',s.x+4,s.y)}
  }
  if(document.activeElement===canvas){ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.moveTo(cursor.x-3,cursor.y);ctx.lineTo(cursor.x+3,cursor.y);ctx.moveTo(cursor.x,cursor.y-3);ctx.lineTo(cursor.x,cursor.y+3);ctx.stroke()}
 }
 const resize=new ResizeObserver(()=>{if(disposed)return;const width=Math.min(560,surface.getBoundingClientRect().width);canvas.width=canvas.height=Math.max(1,Math.round(width*(window.devicePixelRatio||1)));draw()});resize.observe(surface);
 const cssUnits=(pixels:number)=>pixels*160/(canvas.getBoundingClientRect().width||160);
 function hit(b:Board,x:number,y:number,nonArrow=false){return hitTest(b,x,y,cssUnits(22),nonArrow,s=>{const ctx=canvas.getContext('2d')!;ctx.font=font;const m=ctx.measureText(s.label);return {width:m.width,ascent:m.actualBoundingBoxAscent||5,descent:m.actualBoundingBoxDescent||1}})}
 function position(event:PointerEvent){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(160,(event.clientX-r.left)*160/r.width)),y:Math.max(0,Math.min(160,(event.clientY-r.top)*160/r.height))}}
 const quantize=(v:number,max=160)=>Math.max(0,Math.min(max,Math.round(snapping?snap(v,8):v)));
 function cancelGesture(){if(gesture&&canvas.hasPointerCapture(gesture.id))canvas.releasePointerCapture(gesture.id);gesture=undefined;preview=undefined;draw()}
 function gestureBoard(g:Gesture):Board{
  const a={x:quantize(g.start.x),y:quantize(g.start.y)},z={x:quantize(g.current.x),y:quantize(g.current.y)},dx=z.x-a.x,dy=z.y-a.y;
  if(g.tool==='Select'&&g.selection){if(g.resize)return {...g.original,shapes:g.original.shapes.map(s=>s.id===g.selection&&'w' in s?{...s,w:Math.max(1,Math.min(160-s.x,z.x-s.x)),h:Math.max(1,Math.min(160-s.y,z.y-s.y))}:s)};return moveShape(g.original,g.selection,dx,dy)}
  const id=allocateId(g.original);let shape:Shape|undefined;
  if(g.tool==='Rect'||g.tool==='Hazard'){const w=Math.abs(dx),h=Math.abs(dy);if(w&&h)shape={id,kind:g.tool==='Rect'?'rect':'hazard',x:Math.min(a.x,z.x),y:Math.min(a.y,z.y),w,h}}
  if(g.tool==='Arrow'){const from=hit(g.original,g.start.x,g.start.y,true),to=hit(g.original,g.current.x,g.current.y,true);shape={id,kind:'arrow',...(from?{from:from.id}:{x1:a.x,y1:a.y}),...(to?{to:to.id}:{x2:z.x,y2:z.y})}}
  return shape?{...g.original,shapes:[...g.original.shapes,shape]}:g.original;
 }
 // The host's edge back-swipe listens for bubbling touch events; drawing must not reach it.
 for(const name of ['touchstart','touchmove'])listen(canvas,name,event=>event.stopPropagation());
 listen(canvas,'pointerdown',(event)=>{const e=event as PointerEvent;if(gesture||e.button!==0)return;e.preventDefault();canvas.focus();const p=position(e),s=board.shapes.find(s=>s.id===selected),radius=cssUnits(12),handle=s&&'w' in s&&Math.abs(p.x-s.x-s.w)<=radius&&Math.abs(p.y-s.y-s.h)<=radius;
  if(tool==='Select'&&!handle)selected=hit(board,p.x,p.y)?.id;
  gesture={id:e.pointerId,start:p,current:p,original:board,selection:selected,resize:!!handle,tool};canvas.setPointerCapture(e.pointerId);draw();
 });
 listen(canvas,'pointermove',event=>{const e=event as PointerEvent;if(!gesture||gesture.id!==e.pointerId)return;gesture.current=position(e);if(Math.hypot(gesture.current.x-gesture.start.x,gesture.current.y-gesture.start.y)>=(snapping?8:1))preview=gestureBoard(gesture);draw()});
 listen(canvas,'pointerup',event=>{const e=event as PointerEvent;if(!gesture||gesture.id!==e.pointerId)return;const g=gesture;g.current=position(e);const distance=Math.hypot(g.current.x-g.start.x,g.current.y-g.start.y);cancelGesture();if(distance>=(snapping?8:1))commit(gestureBoard(g));else if(['Start','Goal','Text'].includes(g.tool))apply(g.start);refresh()});
 listen(canvas,'pointercancel',event=>{if(gesture?.id===(event as PointerEvent).pointerId)cancelGesture()});
 let editor:HTMLInputElement|undefined,editorCleanup:(()=>void)[]=[];
 function cancelText(){for(const off of editorCleanup)off();editorCleanup=[];editor?.remove();editor=undefined}
 function editText(p:{x:number;y:number}){
  cancelText();const input=document.createElement('input');editor=input;input.setAttribute('aria-label','Text label');input.style.cssText=`position:absolute;left:${Math.min(p.x/160*100,50)}%;top:${p.y/160*100}%;width:48%;font-size:16px;box-sizing:border-box`;surface.append(input);
  const finish=()=>{if(editor!==input)return;const label=sanitizeLabel(input.value);cancelText();if(label)commit({...board,shapes:[...board.shapes,{id:allocateId(board),kind:'text',x:p.x,y:p.y,label}]});canvas.focus()};
  editorCleanup.push(listen(input,'input',()=>{input.value=sanitizeLabel(input.value)}),listen(input,'blur',finish),listen(input,'keydown',event=>{const e=event as KeyboardEvent;if(e.key==='Enter'){e.preventDefault();finish()}if(e.key==='Escape'){e.preventDefault();cancelText();canvas.focus()}}));input.focus();
 }
 let arrowCursor:{x:number;y:number}|undefined;
 function resetArrow(){if(arrowCursor){arrowCursor=undefined;status.textContent=''}}
 function apply(p:{x:number;y:number}){const x=quantize(p.x,159),y=quantize(p.y,159);
  if(tool==='Select'){selected=hit(board,x,y)?.id;draw()}
  else if(tool==='Start'||tool==='Goal')commit({...board,shapes:[...board.shapes,{id:allocateId(board),kind:tool==='Start'?'start':'goal',x,y}]});
  else if(tool==='Text')editText({x,y});
  else if(tool==='Rect'||tool==='Hazard'){const w=Math.min(snapping?8:1,160-x),h=Math.min(snapping?8:1,160-y);commit({...board,shapes:[...board.shapes,{id:allocateId(board),kind:tool==='Rect'?'rect':'hazard',x,y,w,h}]})}
  else if(tool==='Arrow'){if(!arrowCursor){arrowCursor={x,y};status.textContent='Move cursor and press Enter for the arrow end'}else{commit(gestureBoard({id:0,start:arrowCursor,current:{x,y},original:board,resize:false,tool:'Arrow'}));arrowCursor=undefined}}
 }
 listen(canvas,'keydown',event=>{const e=event as KeyboardEvent,step=snapping?8:1,delta:Record<string,[number,number]>={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]};
  if(delta[e.key]){e.preventDefault();const [dx,dy]=delta[e.key];if(selected)commit(moveShape(board,selected,dx,dy));else{cursor={x:Math.max(0,Math.min(159,cursor.x+dx)),y:Math.max(0,Math.min(159,cursor.y+dy))};draw()}}
  else if(e.key==='Escape'){e.preventDefault();resetArrow()}else if(e.key==='Enter'){e.preventDefault();apply(cursor)}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(selected){commit(deleteShape(board,selected));selected=undefined;refresh()}}
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
