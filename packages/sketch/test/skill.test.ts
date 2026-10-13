import {expect,test} from 'bun:test';
import {readFileSync} from 'node:fs';
import {parseBoard,serializeBoard,parseComposeText} from '../src/model.ts';
const source=()=>readFileSync(new URL('../skills/wolfpack-sketch/SKILL.md',import.meta.url),'utf8');
test('review 9 decoded intent is stated without an approval wait',()=>{const s=source();expect(s).toContain('state the decoded intent in one line, then act');expect(s).not.toContain('confirm intent in one line')});
test('skill pins scope, drawing authority and CAS',()=>{
 const s=source();for(const token of ['name: wolfpack-sketch','description:','sketch v1','current-context --json','ok: true','verified: true','projectDir','session status <exact-uuid> --json','read sketch/board','publish sketch/board','--if-revision','--request-id','fresh-uuid','uncertain lost response','conflict','installs','secrets','network','outside the project','other sessions','bare block','new session','only on request'])expect(s).toContain(token);
});
test('C8 standalone skill decoder agrees on escaping and flattened fixtures',()=>{
 const match=source().match(/```js\n([\s\S]*?)\n```/);expect(match).not.toBeNull();expect(match![1].split('\n').length).toBeLessThanOrEqual(40);
 const decode=new Function(match![1]+'; return decode;')() as (text:string)=>unknown;
 for(const code of [0xe0049,0x061c,0x2060,0x00ad,0x3164])expect(()=>decode(`sketch v1 160x160 shapes=1 base=0; text t 0 0 "a${String.fromCodePoint(code)}"; end;`)).toThrow();
 const shapes=[[],[{kind:'text',id:'t',x:0,y:0,label:'"quote" \\ ; end;'}],[{id:'r',kind:'rect',x:0,y:144,w:160,h:16},{id:'a',kind:'arrow',from:'r',x2:160,y2:160,label:'jump'}],[{id:'p',kind:'start',x:8,y:8},{id:'g',kind:'goal',x:144,y:144},{id:'a',kind:'arrow',from:'p',to:'g'},{id:'h',kind:'hazard',x:8,y:16,w:8,h:8}],[{id:'s3',kind:'stroke',points:[[10,140],[30,138],[160,0]],label:'ground; "x"'},{id:'s4',kind:'stroke',points:[[0,0],[1,1]]}]];
 const block=(statements:string,count=1)=>`sketch v1 160x160 shapes=${count} base=0; ${statements} end;`;
 const invalid=[block('start p 0 0;',2),block('start p 0 0;').slice(0,-4),block('start p 0 0; goal p 8 8;',2),block('goal g 160 0;'),block('rect r 159 0 2 1;'),block('circle c 0 0;'),block('text t 0 0 "bad\\n";'),block('text t 0 0 "raw\tlabel";'),block('arrow a b->0,0; arrow b 0,0->0,0;',2),block('arrow a a->0,0;'),block('stroke s 1,1;'),block('stroke s '+Array.from({length:49},(_,i)=>i+','+i).join(' ')+';'),block('stroke s 0,0 161,1;'),block('stroke s 0,0 1 1;'),block('stroke s 0,0 1,1 2;'),block('stroke s 0,0 1,;'),... [0xe0049,0x061c,0x2060,0x00ad,0x3164].map(code=>block(`text t 0 0 "${String.fromCodePoint(code)}";`))];
 for(const text of invalid){expect(()=>parseComposeText(text)).toThrow();expect(()=>decode(text)).toThrow()}
 for(const [i,s] of shapes.entries()){const text=serializeBoard(parseBoard({schemaVersion:1,size:160,shapes:s}),i);expect(decode(i>=3?text.replaceAll('\n',' '):text)).toEqual(parseComposeText(text));expect(()=>decode(text.slice(0,-4))).toThrow()}
});
