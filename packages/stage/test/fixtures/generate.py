# deterministic minimal WASM-4 cart: imports env.memory and env.rect; update draws rect.
from pathlib import Path
def string(s):
 b=s.encode(); return bytes([len(b)])+b
def section(i,b): return bytes([i,len(b)])+b
b=b'\0asm\x01\0\0\0'
b+=section(1,bytes([2,0x60,4,0x7f,0x7f,0x7f,0x7f,0,0x60,0,0]))
b+=section(2,bytes([2])+string('env')+string('memory')+bytes([2,1,1,1])+string('env')+string('rect')+bytes([0,0]))
b+=section(3,bytes([1,1]))
b+=section(7,bytes([1])+string('update')+bytes([0,1]))
# DRAW_COLORS at 0x14 = 2; rectangle at (20,20) of size (40,40).
code=bytes([0,0x41,20,0x41,2,0x3b,1,0,0x41,20,0x41,20,0x41,40,0x41,40,0x10,0,0x0b])
b+=section(10,bytes([1,len(code)])+code)
Path(__file__).with_name('hello.wasm').write_bytes(b)
