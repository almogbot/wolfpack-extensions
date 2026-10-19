import { ensureRuntime, type Wasm4AppElement } from "../vendor/wasm4/wasm4.js";
import { type ExtensionRegistrationHost, type ExtensionViewContext, type LayoutContext, type TerminalLayout, verticalStackLayout } from "./api.ts";
import { parseCart, verifyCart, needsReload, type Cart } from "./model.ts";
type App = Wasm4AppElement;
function arrange(context: LayoutContext): TerminalLayout {
 if(context.panes.length<2)return verticalStackLayout(context);
 const selected=context.panes.find(p=>p.id===context.selectedPaneId)??context.panes[0]!;
 const others=context.panes.filter(p=>p!==selected);
 return {version:1,rows:others.map(()=>({size:1/others.length})),columns:[{size:2/3},{size:1/3}],placements:[{paneId:selected.id,row:0,column:0,rowSpan:others.length},...others.map((p,row)=>({paneId:p.id,row,column:1}))]};
}
function mount(container: HTMLElement, context: ExtensionViewContext) {
 ensureRuntime();
 let disposed=false, visible=true, generation=0, revision=-1, attemptedDigest:string|null=null, app:App|null=null, current:Cart|null=null, pending:AbortController|null=null;
 const root=document.createElement('section');root.setAttribute('aria-label','Stage');root.style.cssText=`background:${context.theme['--bg-surface']??'#202020'};color:${context.theme['--text-primary']??'#ffffff'};font-family:${context.theme['--font-mono']??'monospace'};padding:12px`;
 const title=document.createElement('h2'),meta=document.createElement('p'),note=document.createElement('p'),controls=document.createElement('p'),status=document.createElement('p'),slot=document.createElement('div');status.setAttribute('role','status');
 root.append(title,meta,note,controls,status,slot);container.append(root);
 const feedback=document.createElement('button');feedback.textContent='Send feedback';
 const compose=()=>{if(!disposed&&!context.signal.aborted&&current){try{context.terminal?.compose(`stage build ${current.build}: `)}catch(error){status.textContent=String(error)}}};
 if(context.terminal){root.append(feedback);feedback.addEventListener('click',compose)}
 const stop=()=>{pending?.abort();pending=null;app?.dispose();app?.remove();app=null;};
 const alive=(token:number)=>!disposed&&!context.signal.aborted&&token===generation;
 const resize=new ResizeObserver(()=>{if(!disposed&&!context.signal.aborted)slot.style.setProperty('--cart-scale',String(Math.max(1,Math.floor(slot.clientWidth/160))))});resize.observe(slot);
 const listener=async(value:unknown, rev:number)=>{
 if(disposed||context.signal.aborted||rev<revision)return;revision=rev;
 let token=generation;
 try{
 if(value===null){++generation;stop();attemptedDigest=null;current=null;title.textContent='No cart yet';status.textContent='ask the agent: "build me a WASM-4 game"';meta.textContent=note.textContent=controls.textContent='';return;}
 let cart:Cart;
 try{cart=parseCart(value);}catch(error){attemptedDigest=null;throw error;}
 current=cart;title.textContent=cart.title;meta.textContent=`Build ${cart.build} · revision ${rev}`;note.textContent=cart.note??'';controls.textContent=cart.controls??'';
 // Valid-document failures stay attempted; rejected documents must allow later recovery.
 if(!needsReload(attemptedDigest,cart))return;
 token=++generation;stop();attemptedDigest=cart.blobDigest;
 if(!context.blobs){status.textContent='This host is too old: Stage requires extension blobs.';return;}
 status.textContent='Loading cart…';pending=new AbortController();const signal=AbortSignal.any([context.signal,pending.signal]);
 const fetched=await context.blobs.read(cart.blobDigest,signal);if(!alive(token))return;
 const bytes=await verifyCart(fetched,cart);if(!alive(token))return;
 const next=document.createElement('wasm4-app') as App;next.tabIndex=0;next.setAttribute('aria-label','Game: arrow keys, X and Z');app=next;next.setVisible(visible);slot.append(next);
 await next.startCart(bytes,`${context.scope.installationId}:${context.scope.sessionId}:${current.title}`);if(!alive(token)){next.dispose();return;}
 pending=null;status.textContent='Running';
 }catch(error){if(alive(token)){++generation;stop();status.textContent=`Stage error: ${error instanceof Error?error.message:String(error)}`;}}
 };
 void listener(null,0);
 const unsubscribe=context.documents.subscribe('cart',(value,rev)=>{void listener(value,rev)});
 const dispose=()=>{if(disposed)return;disposed=true;++generation;stop();unsubscribe();resize.disconnect();feedback.removeEventListener('click',compose);context.signal.removeEventListener('abort',dispose);root.remove()};
 context.signal.addEventListener('abort',dispose,{once:true});if(context.signal.aborted)dispose();
 return {dispose, setVisible(nextVisible: boolean) { if(disposed||context.signal.aborted)return;visible=nextVisible;root.hidden=!visible;app?.setVisible(visible); }};
}
export default function register(host: ExtensionRegistrationHost){host.registerContextView({id:'stage',title:'Stage',mount});host.registerTerminalLayout({id:'stage-side',title:'Stage beside terminal',arrange});}
