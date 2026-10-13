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
