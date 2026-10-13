import {test,expect} from 'bun:test';
import {chromium,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {join} from 'node:path';
import {parseComposeText} from '../src/model.ts';
async function fixture(){
 const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(req){return new URL(req.url).pathname==='/ui.js'?new Response(Bun.file(join(import.meta.dirname,'../dist/ui.js'))):new Response('<html lang="en"><title>Sketch test</title><meta name="viewport" content="width=device-width"><body style="margin:0"><main><h1 style="font-size:16px">Sketch fixture</h1><div id="sketch"></div></main></body></html>',{headers:{'content-type':'text/html','content-security-policy':"script-src 'self' blob:"}})}});
 let browser;try{browser=await chromium.launch({...process.env.WOLFPACK_WIDGET_BRAVE?{executablePath:process.env.WOLFPACK_WIDGET_BRAVE}:{}})}catch(e){server.stop(true);throw e}
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,permissions:['clipboard-read','clipboard-write']});const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(4000);await page.goto(server.url.toString());
  await page.evaluate(async()=>{
   const listeners=new Map<EventTarget,Map<string,Set<any>>>(),add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
   EventTarget.prototype.addEventListener=function(name,fn,options){if(fn&&(this instanceof HTMLElement&&this.closest('#sketch')||this instanceof AbortSignal)){const events=listeners.get(this)??new Map(),set=events.get(name)??new Set();set.add(fn);events.set(name,set);listeners.set(this,events)}return add.call(this,name,fn,options)};
   EventTarget.prototype.removeEventListener=function(name,fn,options){listeners.get(this)?.get(name)?.delete(fn);return remove.call(this,name,fn,options)};
   const observers=new Set<ResizeObserver>(),Native=ResizeObserver;window.ResizeObserver=class extends Native{constructor(fn:ResizeObserverCallback){super(fn);observers.add(this)}disconnect(){observers.delete(this);super.disconnect()}};
   const timers=new Set<number>(),set=window.setTimeout.bind(window),clear=window.clearTimeout.bind(window);window.setTimeout=((fn:any,delay?:number)=>{let id:number;id=set(()=>{timers.delete(id);fn()},delay);timers.add(id);return id}) as typeof window.setTimeout;window.clearTimeout=((id?:number)=>{if(id!==undefined)timers.delete(id);clear(id)}) as typeof window.clearTimeout;
   const url=URL.createObjectURL(new Blob([await (await fetch('/ui.js')).text()],{type:'text/javascript'})),module=await import(url);URL.revokeObjectURL(url);let view:any;module.default({registerContextView(v:any){view=v}});
   let publish:any,controller:any,abort:AbortController,subscriptions=0,composed='';const storage=new Map<string,string>();
   const context:any={theme:{},storage:{get:(k:string)=>storage.get(k)??null,set:(k:string,v:string)=>storage.set(k,v),remove:(k:string)=>storage.delete(k)},documents:{subscribe(_id:string,fn:any){publish=fn;subscriptions++;return ()=>subscriptions--}},terminal:{compose(text:string){composed=text}}};
   const mount=()=>{controller?.dispose();abort?.abort();abort=new AbortController();context.signal=abort.signal;controller=view.mount(document.querySelector('#sketch'),context)};mount();
   (globalThis as any).sample={context,storage,mount,get publish(){return publish},get composed(){return composed},dispose:()=>controller.dispose(),abort:()=>abort.abort(),visible:(v:boolean)=>controller.setVisible?.(v),resources:()=>({subscriptions,observers:observers.size,timers:timers.size,listeners:[...listeners.entries()].reduce((n,[,events])=>n+[...events.values()].reduce((m,set)=>m+set.size,0),0)})};
  });return {page,errors,async close(){await browser.close();server.stop(true)}};
 }catch(e){await browser.close();server.stop(true);throw e}
}
async function point(page:Page,x:number,y:number){const b=(await page.locator('canvas').boundingBox())!;return {x:b.x+x*b.width/160,y:b.y+y*b.height/160}}
async function tap(page:Page,x:number,y:number){const p=await point(page,x,y);await page.touchscreen.tap(p.x,p.y)}
async function drag(page:Page,x1:number,y1:number,x2:number,y2:number){
 const a=await point(page,x1,y1),b=await point(page,x2,y2),cdp=await page.context().newCDPSession(page);
 try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});for(let i=1;i<=4;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(b.x-a.x)*i/4,y:a.y+(b.y-a.y)*i/4,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}finally{await cdp.detach()}
}
const tool=(page:Page,name:string)=>page.getByRole('button',{name,exact:true}).click();
async function composed(page:Page){await tool(page,'Send to agent');return page.evaluate(()=>(globalThis as any).sample.composed)}
async function publish(page:Page,board:any,revision:number){await page.evaluate(({board,revision})=>(globalThis as any).sample.publish(board,revision),{board,revision})}
const board=(shapes:any[],note?:string)=>({schemaVersion:1 as const,size:160 as const,shapes,...note?{note}:{}});
test('review 10 toolbar sizes to content and wraps accessibly at 390px',async()=>{
 const f=await fixture(),p=f.page;try{
  const metrics=await p.locator('[aria-label="Drawing tools"]').evaluate(toolbar=>({display:getComputedStyle(toolbar).display,wrap:getComputedStyle(toolbar).flexWrap,buttons:[...toolbar.querySelectorAll('button')].map(b=>{const r=document.createRange();r.selectNodeContents(b);const box=b.getBoundingClientRect(),style=getComputedStyle(b);return {label:b.textContent,width:box.width,height:box.height,content:r.getBoundingClientRect().width,available:b.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),touch:style.touchAction,right:box.right}})}));
  for(const b of metrics.buttons){expect(b.content).toBeLessThanOrEqual(b.available+0.5);expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);expect(b.touch).toBe('manipulation');expect(b.right).toBeLessThanOrEqual(390)}expect(metrics.display).toBe('flex');expect(metrics.wrap).toBe('wrap');expect((await new AxeBuilder({page:p}).analyze()).violations).toEqual([]);
  await publish(p,board([{id:'p',kind:'start',x:8,y:8}]),1);await publish(p,board([{id:'g',kind:'goal',x:144,y:144}]),2);expect((await new AxeBuilder({page:p}).analyze()).violations).toEqual([]);expect(f.errors).toEqual([]);
 }finally{await f.close()}
},20000);
test('review 8 Undo after Load restores board and its base revision',async()=>{
 const f=await fixture(),p=f.page;try{
  const a=board([{id:'p',kind:'start',x:8,y:8}]),b=board([{id:'g',kind:'goal',x:144,y:144}]);await publish(p,a,1);await tool(p,'Rect');await drag(p,16,16,48,48);const mine=parseComposeText(await composed(p));await publish(p,b,2);await tool(p,'Load');expect(parseComposeText(await composed(p))).toEqual({base:2,board:b});await tool(p,'Undo');expect(parseComposeText(await composed(p))).toEqual(mine);await p.evaluate(()=>(globalThis as any).sample.mount());expect(parseComposeText(await composed(p))).toEqual(mine);expect(f.errors).toEqual([]);
 }finally{await f.close()}
},15000);
for(const reset of ['tool change','Undo','Clear','Escape'])test(`review 7 arrow cursor resets on ${reset}`,async()=>{
 const f=await fixture(),p=f.page;try{
  await tool(p,'Arrow');await p.locator('canvas').focus();await p.locator('canvas').press('Enter');expect(await p.getByText('Move cursor and press Enter for the arrow end',{exact:true}).count()).toBe(1);
  if(reset==='tool change')await tool(p,'Rect');else if(reset==='Escape')await p.locator('canvas').press('Escape');else await tool(p,reset);
  expect(await p.getByText('Move cursor and press Enter for the arrow end',{exact:true}).count()).toBe(0);await tool(p,'Arrow');await p.locator('canvas').focus();await p.locator('canvas').press('ArrowRight');await p.locator('canvas').press('Enter');expect(parseComposeText(await composed(p)).board.shapes).toEqual([]);expect(f.errors).toEqual([]);
 }finally{await f.close()}
},15000);
test('review 6 Keep mine survives remount and validates ignored revision',async()=>{
 const f=await fixture(),p=f.page;try{
  const a=board([{id:'p',kind:'start',x:8,y:8}]),b=board([{id:'g',kind:'goal',x:144,y:144}]);await publish(p,a,1);await publish(p,b,2);await tool(p,'Keep mine');await p.evaluate(()=>(globalThis as any).sample.mount());await publish(p,b,2);expect(await p.getByRole('button',{name:'Load',exact:true}).count()).toBe(0);expect(parseComposeText(await composed(p))).toEqual({base:1,board:a});
  expect(await p.evaluate(()=>JSON.parse((globalThis as any).sample.storage.get('board')).ignored)).toBe(2);await publish(p,b,3);expect(await p.getByRole('button',{name:'Load',exact:true}).count()).toBe(1);
  for(const ignored of [-1,1.5,'2',Number.MAX_SAFE_INTEGER+1]){await p.evaluate(({a,ignored})=>{const s=(globalThis as any).sample;s.dispose();s.storage.set('board',JSON.stringify({board:a,base:1,ignored}));s.mount()},{a,ignored});expect(parseComposeText(await composed(p)).board.shapes).toEqual([])}expect(f.errors).toEqual([]);
 }finally{await f.close()}
},15000);
test('review 6 second touch pointer is ignored during drawing',async()=>{
 const f=await fixture(),p=f.page,cdp=await p.context().newCDPSession(p);try{
  await tool(p,'Rect');await p.locator('canvas').evaluate(c=>{(globalThis as any).touchIds=[];(c as HTMLElement).onpointerdown=e=>(globalThis as any).touchIds.push(e.pointerId)});
  const a=await point(p,16,16),b=await point(p,32,32),other=await point(p,100,100),end=await point(p,64,64);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...b,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...b,id:1},{...other,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...b,id:1},{...await point(p,144,144),id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...end,id:1},{...await point(p,144,144),id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await p.evaluate(()=>(globalThis as any).touchIds.length)).toBe(2);await p.locator('canvas').evaluate(c=>(c as HTMLElement).onpointerdown=null);expect(parseComposeText(await composed(p)).board.shapes).toEqual([{kind:'rect',id:'s1',x:16,y:16,w:48,h:48}]);expect(f.errors).toEqual([]);
 }finally{await cdp.detach();await f.close()}
},15000);
test('review 5 equal agent revision updates and persists base',async()=>{
 const f=await fixture(),p=f.page;try{const b=board([{id:'g',kind:'goal',x:13,y:13}]);await publish(p,b,1);await publish(p,b,2);expect(parseComposeText(await composed(p))).toEqual({base:2,board:b});await p.evaluate(()=>(globalThis as any).sample.mount());expect(parseComposeText(await composed(p)).base).toBe(2);expect(await p.getByRole('button',{name:'Load',exact:true}).count()).toBe(0);expect(f.errors).toEqual([])}finally{await f.close()}
},15000);
for(const active of ['editor','gesture'])test(`review 4 active ${active} prevents empty adoption`,async()=>{
 const f=await fixture(),p=f.page;let cdp:any;try{
  if(active==='editor'){await tool(p,'Text');await tap(p,16,16);await p.getByRole('textbox',{name:'Text label'}).fill('keep typing')}
  else {await tool(p,'Rect');cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...await point(p,16,16),id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...await point(p,48,48),id:1}]})}
  await publish(p,board([{id:'g',kind:'goal',x:144,y:144}]),1);expect(await p.getByRole('button',{name:'Load',exact:true}).count()).toBe(1);
  if(active==='editor'){expect(await p.getByRole('textbox',{name:'Text label'}).inputValue()).toBe('keep typing');await p.getByRole('textbox',{name:'Text label'}).press('Enter')}
  else await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const mine=parseComposeText(await composed(p));expect(mine.base).toBe(0);expect(mine.board.shapes.length).toBe(1);expect(mine.board.shapes[0].kind).toBe(active==='editor'?'text':'rect');expect(f.errors).toEqual([]);
 }finally{await cdp?.detach();await f.close()}
},15000);
test('review 3 text body and CSS-sized point and arrow targets select',async()=>{
 const f=await fixture(),p=f.page;try{
  await publish(p,board([{id:'t',kind:'text',x:16,y:32,label:'a long platform instruction'}]),1);await tool(p,'Select');await tap(p,60,30);await tool(p,'Delete');expect(parseComposeText(await composed(p)).board.shapes).toEqual([]);
  await publish(p,board([{id:'g',kind:'goal',x:80,y:80}]),2);const goal=await point(p,80,80);await p.touchscreen.tap(goal.x+15,goal.y);await tool(p,'Delete');expect(parseComposeText(await composed(p)).board.shapes).toEqual([]);
  await publish(p,board([{id:'a',kind:'arrow',x1:16,y1:80,x2:144,y2:80}]),3);const arrow=await point(p,80,80);await p.touchscreen.tap(arrow.x,arrow.y+15);await tool(p,'Delete');expect(parseComposeText(await composed(p)).board.shapes).toEqual([]);expect(f.errors).toEqual([]);
 }finally{await f.close()}
},15000);
test('canvas touches do not reach host swipe navigation',async()=>{
 const f=await fixture(),p=f.page;try{await p.evaluate(()=>{const w=globalThis as any;w.hostTouches=0;for(const n of ['touchstart','touchmove'])document.body.addEventListener(n,()=>w.hostTouches++,{passive:true})});await tool(p,'Rect');await drag(p,0,144,158,158);expect(await p.evaluate(()=>(globalThis as any).hostTouches)).toBe(0);expect(parseComposeText(await composed(p)).board.shapes.length).toBe(1);expect(f.errors).toEqual([])}finally{await f.close()}
},15000);
test('review 2 Select tap preserves off-grid selection',async()=>{
 const f=await fixture(),p=f.page;try{await publish(p,board([{id:'g',kind:'goal',x:13,y:13}]),1);await tool(p,'Select');await tap(p,13,13);await tool(p,'Delete');expect(parseComposeText(await composed(p)).board.shapes).toEqual([]);expect(f.errors).toEqual([])}finally{await f.close()}
},15000);
test('text blur commits sanitised label and newer matching document clears stale banner',async()=>{
 const f=await fixture(),p=f.page;try{
  await tool(p,'Text');await tap(p,16,16);await p.getByRole('textbox',{name:'Text label'}).fill('jump\u202e safely');await tap(p,80,80);
  await p.getByRole('textbox',{name:'Text label'}).press('Escape');
  expect(parseComposeText(await composed(p)).board.shapes).toEqual([{kind:'text',id:'s1',x:16,y:16,label:'jump safely'}]);
  const mine=parseComposeText(await composed(p)).board;
  await publish(p,board([{id:'g',kind:'goal',x:144,y:144}]),1);expect(await p.getByRole('button',{name:'Load',exact:true}).count()).toBe(1);
  await publish(p,mine,2);expect(await p.getByRole('button',{name:'Load',exact:true}).count()).toBe(0);
  await publish(p,board([{id:'g',kind:'goal',x:144,y:144}]),3);await tool(p,'Load');expect(parseComposeText(await composed(p)).base).toBe(3);
  await p.evaluate(()=>(globalThis as any).sample.dispose());expect(await p.evaluate(()=>(globalThis as any).sample.resources())).toEqual({subscriptions:0,observers:0,timers:0,listeners:0});expect(f.errors).toEqual([]);
 }finally{await f.close()}
},20000);
test('load pins base 2, ignores stale revisions and preserves a remounted local draft',async()=>{
 const f=await fixture(),p=f.page;try{
  const a=board([{id:'p',kind:'start',x:8,y:8}]),b=board([{id:'g',kind:'goal',x:144,y:144}]);await publish(p,a,1);
  await tool(p,'Rect');await drag(p,0,144,160,160);await publish(p,b,2);await tool(p,'Load');expect(parseComposeText(await composed(p))).toEqual({base:2,board:b});
  await publish(p,a,1);expect(parseComposeText(await composed(p)).board).toEqual(b);
  await p.evaluate(()=>(globalThis as any).sample.mount());await publish(p,a,1);expect(parseComposeText(await composed(p))).toEqual({base:2,board:b});
  await p.evaluate(()=>{const s=(globalThis as any).sample;s.dispose();s.storage.set('board','invalid JSON');s.mount()});await publish(p,a,1);expect(parseComposeText(await composed(p))).toEqual({base:1,board:a});
  await p.evaluate(()=>{const s=(globalThis as any).sample;s.visible(false);s.visible(true);s.dispose();s.dispose()});expect(await p.evaluate(()=>(globalThis as any).sample.resources())).toEqual({subscriptions:0,observers:0,timers:0,listeners:0});expect(f.errors).toEqual([]);
 }finally{await f.close()}
},20000);
test('real mobile touch drawing, exact compose, move undo and detach',async()=>{
 const f=await fixture(),p=f.page;try{
  await tool(p,'Rect');await drag(p,0,144,160,160);await drag(p,64,104,104,112);
  await tool(p,'Start');await tap(p,8,128);await tool(p,'Goal');await tap(p,144,88);
  await tool(p,'Hazard');await drag(p,48,136,72,144);await tool(p,'Text');await tap(p,80,16);await p.getByRole('textbox',{name:'Text label'}).fill('floaty jump');await p.getByRole('textbox',{name:'Text label'}).press('Enter');
  const text=await composed(p);expect(text).toBe('sketch v1 160x160 shapes=6 base=0;\nrect s1 0 144 160 16;\nrect s2 64 104 40 8;\nstart s3 8 128;\ngoal s4 144 88;\nhazard s5 48 136 24 8;\ntext s6 80 16 "floaty jump";\nend;');expect(parseComposeText(text.replaceAll('\n',' ')).board.shapes.length).toBe(6);
  await tool(p,'Select');await drag(p,80,108,88,100);expect(parseComposeText(await composed(p)).board.shapes[1]).toMatchObject({x:72,y:96});await tool(p,'Undo');expect(parseComposeText(await composed(p)).board.shapes[1]).toMatchObject({x:64,y:104});
  await tool(p,'Arrow');await drag(p,8,128,84,108);expect(parseComposeText(await composed(p)).board.shapes.at(-1)).toMatchObject({from:'s3',to:'s2'});
  await tool(p,'Select');await tap(p,100,108);await tool(p,'Delete');expect(parseComposeText(await composed(p)).board.shapes.at(-1)).toMatchObject({from:'s3',x2:84,y2:108});expect(f.errors).toEqual([]);
 }finally{await f.close()}
},30000);
test('documents, storage, errors, clipboard and cleanup',async()=>{
 const f=await fixture(),p=f.page;try{
  const a=board([{id:'p',kind:'start',x:8,y:8}],'agent note'),b=board([{id:'g',kind:'goal',x:144,y:144}]);
  await publish(p,a,1);expect(parseComposeText(await composed(p)).base).toBe(1);await tool(p,'Rect');await drag(p,0,144,160,160);
  await publish(p,b,2);await p.getByText('Agent sent revision 2',{exact:true}).waitFor();expect((await new AxeBuilder({page:p}).analyze()).violations).toEqual([]);
  await tool(p,'Keep mine');expect(parseComposeText(await composed(p)).board.shapes.length).toBe(2);await publish(p,b,2);expect(await p.getByRole('button',{name:'Load',exact:true}).count()).toBe(0);
  await publish(p,b,3);await tool(p,'Load');expect(parseComposeText(await composed(p)).base).toBe(3);
  await publish(p,{...b,size:159},4);await p.getByText(/Invalid board/).waitFor();expect(parseComposeText(await composed(p)).board).toEqual(b);
  await publish(p,board([{id:'t',kind:'text',x:0,y:0,label:'x\u202e'}]),5);await p.getByText(/Invalid board text/).waitFor();
  await p.evaluate(()=>(globalThis as any).sample.mount());expect(parseComposeText(await composed(p)).base).toBe(3);
  await p.evaluate(()=>{(globalThis as any).sample.context.terminal.compose=()=>{throw Error('grid is open')}});await tool(p,'Send to agent');await p.getByText('grid is open',{exact:true}).waitFor();await tool(p,'Copy');expect(await p.evaluate(()=>navigator.clipboard.readText())).toBe('sketch v1 160x160 shapes=1 base=3;\ngoal g 144 144;\nend;');
  await p.evaluate(()=>{Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>Promise.reject(Error('denied'))})});await tool(p,'Copy');expect(await p.getByRole('textbox',{name:'Copy sketch'}).inputValue()).toContain('base=3');
  await p.evaluate(()=>{const s=(globalThis as any).sample;delete s.context.terminal;s.mount()});expect(await p.getByRole('button',{name:'Send to agent'}).isDisabled()).toBe(true);await p.getByText('Open the terminal to send',{exact:true}).waitFor();
  await p.evaluate(()=>(globalThis as any).sample.abort());expect(await p.evaluate(()=>(globalThis as any).sample.resources())).toEqual({subscriptions:0,observers:0,timers:0,listeners:0});expect(f.errors).toEqual([]);
 }finally{await f.close()}
},30000);
test('accessibility, keyboard, resize, cancel and byte budget',async()=>{
 const f=await fixture(),p=f.page;try{
  expect((await new AxeBuilder({page:p}).analyze()).violations).toEqual([]);
  for(const button of await p.getByRole('button').all()){const b=(await button.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44)}
  expect(await p.locator('canvas').evaluate(c=>getComputedStyle(c).touchAction)).toBe('none');
  const rows=new Set(await p.getByRole('button').evaluateAll(buttons=>buttons.map(b=>b.getBoundingClientRect().top)));expect(rows.size).toBe(2);
  const canvasBox=(await p.locator('canvas').boundingBox())!;expect(canvasBox.y+canvasBox.height).toBeLessThanOrEqual(844);
  await tool(p,'Start');await p.locator('canvas').focus();await p.locator('canvas').press('ArrowRight');await p.locator('canvas').press('Enter');expect(parseComposeText(await composed(p)).board.shapes[0]).toMatchObject({kind:'start',x:88,y:80});
  await tool(p,'Clear');await tool(p,'Undo');expect(parseComposeText(await composed(p)).board.shapes.length).toBe(1);
  await tool(p,'Rect');await drag(p,16,16,48,48);await tool(p,'Select');await tap(p,24,24);await drag(p,48,48,64,64);expect(parseComposeText(await composed(p)).board.shapes.at(-1)).toMatchObject({w:48,h:48});
  await p.locator('canvas').focus();await p.locator('canvas').press('Delete');expect(parseComposeText(await composed(p)).board.shapes.length).toBe(1);
  await tool(p,'Rect');await tap(p,32,32);await drag(p,24,24,27,27);expect(parseComposeText(await composed(p)).board.shapes.length).toBe(1);const at=await point(p,24,24),cdp=await p.context().newCDPSession(p);try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...at,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...await point(p,48,48),id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})}finally{await cdp.detach()}expect(parseComposeText(await composed(p)).board.shapes.length).toBe(1);
  const large=board(Array.from({length:100},(_,i)=>({kind:'text',id:'t'+i,x:0,y:0,label:'x'.repeat(80)})));await publish(p,large,1);await tool(p,'Load');expect(await p.getByRole('button',{name:'Send to agent'}).isDisabled()).toBe(true);await p.getByText(/remove shapes to send/).waitFor();expect(f.errors).toEqual([]);
 }finally{await f.close()}
},30000);
