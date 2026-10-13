import { expect, test } from 'bun:test';
import * as model from '../src/model.ts';
const board = {schemaVersion:1,size:160,note:'hello\nworld',shapes:[
 {kind:'rect',id:'a',x:0,y:144,w:160,h:16,label:'ground " \\ ;'},
 {kind:'hazard',id:'h',x:48,y:136,w:24,h:8}, {kind:'start',id:'p',x:8,y:128},
 {kind:'goal',id:'g',x:144,y:88}, {kind:'text',id:'t',x:80,y:16,label:'floaty'},
 {kind:'arrow',id:'e',from:'p',x2:160,y2:0,label:'jump'}]} as const;
test('review 1 hidden Unicode properties are rejected and stripped',()=>{
 for(const code of [0xe0049,0x061c,0x2060,0x00ad,0x3164]){const c=String.fromCodePoint(code);expect(()=>model.parseBoard({schemaVersion:1,size:160,shapes:[{id:'t',kind:'text',x:0,y:0,label:'a'+c}]})).toThrow();expect(()=>model.parseBoard({schemaVersion:1,size:160,shapes:[],note:c})).toThrow();expect(()=>model.parseComposeText(`sketch v1 160x160 shapes=1 base=0; text t 0 0 "a${c}"; end;`)).toThrow();expect(model.sanitizeLabel('a'+c+'b')).toBe('ab')}
});
test('round trip and flattened grammar, escaping and shape order',()=>{
 const b=model.parseBoard(board), text=model.serializeBoard(b,12), {note,...composed}=b;
 expect(model.parseComposeText(text)).toEqual({base:12,board:composed});
 expect(model.parseComposeText(text.replaceAll('\n',' '))).toEqual({base:12,board:composed});
 expect(model.parseComposeText(text.replaceAll('\n','\t\n '))).toEqual({base:12,board:composed});
});
test('strict board limits and exact fields',()=>{
 const b=()=>JSON.parse(JSON.stringify(board));
 const invalid:any[]=[null,[], {...board,size:159},{...board,schemaVersion:2},{...board,note:'x'.repeat(2001)},{...board,extra:1},{...board,shapes:Array(201).fill(board.shapes[0])}];
 for(const patch of [{id:'A'},{id:'abcdefghi'},{id:'a-b'},{x:-1},{x:0.5},{w:0},{h:17},{x:1},{label:'x'.repeat(81)},{extra:1}]){const v=b();Object.assign(v.shapes[0],patch);invalid.push(v)}
 for(const shape of [{kind:'start',id:'z',x:160,y:0},{kind:'goal',id:'z',x:0,y:160},{kind:'text',id:'z',x:0,y:0,label:''},{kind:'text',id:'z',x:0,y:0},{kind:'unknown',id:'z'},{kind:'arrow',id:'z',from:'missing',to:'a'},{kind:'arrow',id:'z',from:'e',to:'a'},{kind:'arrow',id:'z',from:'a',x1:0,y1:0,to:'p'},{kind:'arrow',id:'z',x1:0,to:'p'},{kind:'arrow',id:'z',x1:161,y1:0,to:'p'}])invalid.push({...board,shapes:[...board.shapes,shape]});
 invalid.push({...board,shapes:[...board.shapes,board.shapes[0]]});
 for(const value of invalid)expect(()=>model.parseBoard(value)).toThrow();
 expect(model.parseBoard({...board,note:'x'.repeat(2000)}).note?.length).toBe(2000);
});
test('all forbidden characters rejected and stripped at input',()=>{
 const codes=[...Array.from({length:32},(_,i)=>i),127,...Array.from({length:32},(_,i)=>128+i),0x2028,0x2029,...Array.from({length:5},(_,i)=>0x202a+i),...Array.from({length:4},(_,i)=>0x2066+i),...Array.from({length:5},(_,i)=>0x200b+i),0xfeff];
 for(const code of codes){const c=String.fromCharCode(code);expect(()=>model.parseBoard({...board,shapes:[{kind:'text',id:'t',x:0,y:0,label:'a'+c}]})).toThrow();if(code!==10)expect(()=>model.parseBoard({...board,note:c})).toThrow();expect(model.sanitizeLabel('a'+c+'b')).toBe('ab')}
 expect(model.sanitizeLabel('😀'.repeat(81))).toBe('😀'.repeat(80));
});
test('compose rejects truncation, bad escapes, unknown tokens and count mismatch',()=>{
 const text=model.serializeBoard(model.parseBoard(board),0);
 for(const value of [text.replace('end;',''),text.replace('shapes=6','shapes=7'),text+'garbage;',text.replace('rect a','banana a'),text.replace('base=0','base=-1'),text.replace('floaty','bad\\n')])expect(()=>model.parseComposeText(value)).toThrow();
 expect(()=>model.parseComposeText('sketch v1 160x160 shapes=0 base=0; mystery; end;')).toThrow(/mystery/);
});
test('moving an attached arrow yields integer free endpoints even for odd rectangles',()=>{
 const b=model.parseBoard({schemaVersion:1,size:160,shapes:[{kind:'rect',id:'r',x:0,y:0,w:3,h:5},{kind:'arrow',id:'a',from:'r',x2:159,y2:159}]});
 const moved=model.moveShape(b,'a',8,8);expect(model.parseBoard(moved).shapes[1]).toEqual({kind:'arrow',id:'a',x1:10,y1:11,x2:160,y2:160});
});
test('board equality ignores object key order but preserves shape order and note',()=>{
 const a=model.parseBoard(board),b=model.parseBoard(JSON.parse(JSON.stringify(board),(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).reverse()):value));
 expect(model.boardsEqual(a,b)).toBe(true);expect(model.boardsEqual(a,{...b,note:'different'})).toBe(false);expect(model.boardsEqual(a,{...b,shapes:[...b.shapes].reverse()})).toBe(false);
});
test('bytes, snap, ids, hit test and delete detach at centre',()=>{
 expect(model.COMPOSE_LIMIT).toBe(4000);expect(model.byteLength('😀')).toBe(4);expect(model.snap(13,8)).toBe(16);
 const b=model.parseBoard({...board,shapes:[...board.shapes,{id:'e2',kind:'arrow',from:'a',to:'p'}]});
 expect(model.allocateId(b)).toBe('s1');expect(model.hitTest(b,3,150)?.id).toBe('a');
 const deleted=model.deleteShape(b,'a');expect(deleted.shapes.at(-1)).toEqual({id:'e2',kind:'arrow',x1:80,y1:152,to:'p'});expect(b.shapes[0].id).toBe('a');
});
const strokeBoard=(points:unknown,extra:object={})=>({schemaVersion:1,size:160,shapes:[{id:'s3',kind:'stroke',points,...extra}]});
test('stroke parses, serializes, round trips and rejects invalid shapes',()=>{
 const b=model.parseBoard(strokeBoard([[10,140],[30,138],[160,0]],{label:'ground'})),text=model.serializeBoard(b,2);
 expect(text).toBe('sketch v1 160x160 shapes=1 base=2;\nstroke s3 10,140 30,138 160,0 "ground";\nend;');
 expect(model.parseComposeText(text)).toEqual({base:2,board:b});expect(model.parseComposeText(text.replaceAll('\n',' ')).board).toEqual(b);
 const pts=(n:number)=>Array.from({length:n},(_,i)=>[i,i]);
 expect(model.parseBoard(strokeBoard(pts(2))).shapes.length).toBe(1);expect(model.parseBoard(strokeBoard(pts(48))).shapes.length).toBe(1);
 for(const bad of [pts(1),pts(49),[[0,0],[161,0]],[[0,0],[-1,0]],[[0,0],[1.5,0]],[[0,0],[1]],[[0,0],[1,2,3]],[[0,0],'ab'],'x',[]])expect(()=>model.parseBoard(strokeBoard(bad))).toThrow();
 expect(()=>model.parseBoard(strokeBoard(pts(2),{x:1}))).toThrow();expect(()=>model.parseBoard(strokeBoard(pts(2),{label:'a‮'}))).toThrow();
 const mk=(body:string)=>`sketch v1 160x160 shapes=1 base=0; ${body} end;`;
 for(const bad of ['stroke s 1,1;','stroke s 1,1 2 2;','stroke s 1,1 2,;','stroke s 1 1 2 2;','stroke s 161,1 2,2;','stroke s 1,1 2,2 3;'])expect(()=>model.parseComposeText(mk(bad))).toThrow();
});
test('stroke hit test uses distance to polyline, move shifts every point clamped, delete removes',()=>{
 const b=model.parseBoard({schemaVersion:1,size:160,shapes:[{id:'s1',kind:'stroke',points:[[10,100],[50,100],[50,140]]}]});
 expect(model.hitTest(b,30,103,4)?.id).toBe('s1');expect(model.hitTest(b,30,110,4)).toBeUndefined();expect(model.hitTest(b,52,120,4)?.id).toBe('s1');expect(model.hitTest(b,60,100,4)).toBeUndefined();
 expect(model.moveShape(b,'s1',8,-8).shapes[0]).toMatchObject({points:[[18,92],[58,92],[58,132]]});
 expect(model.moveShape(b,'s1',-100,100).shapes[0]).toMatchObject({points:[[0,120],[40,120],[40,160]]});
 expect(model.deleteShape(b,'s1').shapes).toEqual([]);
});
test('simplifyStroke applies RDP, caps at 48 points and ignores short paths',()=>{
 const line=Array.from({length:100},(_,i)=>({x:i,y:50+(i%2)*0.4}));
 expect(model.simplifyStroke(line)).toEqual([[0,50],[99,50]]);
 const wave=Array.from({length:400},(_,i)=>({x:i*0.4,y:80+30*Math.sin(i/6)})),simple=model.simplifyStroke(wave)!;
 expect(simple.length).toBeGreaterThan(2);expect(simple.length).toBeLessThanOrEqual(48);expect(()=>model.parseBoard({schemaVersion:1,size:160,shapes:[{id:'s1',kind:'stroke',points:simple}]})).not.toThrow();
 const zig=Array.from({length:300},(_,i)=>({x:(i*7)%160,y:(i*13)%160}));expect(model.simplifyStroke(zig)!.length).toBeLessThanOrEqual(48);
 expect(model.simplifyStroke([{x:10,y:10},{x:11,y:11}])).toBeUndefined();expect(model.simplifyStroke([{x:10,y:10}])).toBeUndefined();
 expect(model.simplifyStroke([{x:-5,y:200},{x:170,y:300}])).toEqual([[0,160],[160,160]]);
});
test('simplifyStroke handles 5000 samples and worst-case recursion shapes without error',()=>{
 const arc=Array.from({length:5000},(_,i)=>({x:i*0.032,y:160-Math.sqrt(Math.max(0,160*160-(i*0.032)**2))*0.5})),noisy=Array.from({length:5000},(_,i)=>({x:(i*37)%161,y:(i*91)%161}));
 for(const path of [arc,noisy]){const out=model.simplifyStroke(path)!;expect(out.length).toBeGreaterThanOrEqual(2);expect(out.length).toBeLessThanOrEqual(48)}
 const spiral=Array.from({length:60000},(_,i)=>({x:i/400,y:(i/400)**2/160}));expect(model.simplifyStroke(spiral)!.length).toBeLessThanOrEqual(48);
});
