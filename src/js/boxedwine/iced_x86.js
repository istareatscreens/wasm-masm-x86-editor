/* iced-x86 1.21.0 (https://github.com/icedland/iced), JavaScript bindings built with the
   features: decoder instr_api instr_info masm (Boxedwine/decoder-src/build-iced.sh)

https://github.com/icedland/iced
Copyright (C) 2018-present iced project and contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
let wasm_bindgen;
(function() {
    const __exports = {};
    let script_src;
    if (typeof document !== 'undefined' && document.currentScript !== null) {
        script_src = new URL(document.currentScript.src, location.href).toString();
    }
    let wasm = undefined;

    const heap = new Array(128).fill(undefined);

    heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let cachedBigInt64Memory0 = null;

function getBigInt64Memory0() {
    if (cachedBigInt64Memory0 === null || cachedBigInt64Memory0.byteLength === 0) {
        cachedBigInt64Memory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64Memory0;
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32Memory0().subarray(ptr / 4, ptr / 4 + len);
}
/**
* Gets feature flags.
*
* Flag | Value
* -----|-------
* 0x01 | `VEX`
* 0x02 | `EVEX`
* 0x04 | `XOP`
* 0x08 | `3DNow!`
* 0x10 | `MVEX`
* @returns {number}
*/
__exports.getIcedFeatures = function() {
    const ret = wasm.getIcedFeatures();
    return ret >>> 0;
};

/**
* Control flow
*/
__exports.FlowControl = Object.freeze({
/**
* The next instruction that will be executed is the next instruction in the instruction stream
*/
Next:0,"0":"Next",
/**
* It's an unconditional branch instruction: `JMP NEAR`, `JMP FAR`
*/
UnconditionalBranch:1,"1":"UnconditionalBranch",
/**
* It's an unconditional indirect branch: `JMP NEAR reg`, `JMP NEAR [mem]`, `JMP FAR [mem]`
*/
IndirectBranch:2,"2":"IndirectBranch",
/**
* It's a conditional branch instruction: `Jcc SHORT`, `Jcc NEAR`, `LOOP`, `LOOPcc`, `JRCXZ`, `JKccD SHORT`, `JKccD NEAR`
*/
ConditionalBranch:3,"3":"ConditionalBranch",
/**
* It's a return instruction: `RET NEAR`, `RET FAR`, `IRET`, `SYSRET`, `SYSEXIT`, `RSM`, `SKINIT`, `RDM`, `UIRET`
*/
Return:4,"4":"Return",
/**
* It's a call instruction: `CALL NEAR`, `CALL FAR`, `SYSCALL`, `SYSENTER`, `VMLAUNCH`, `VMRESUME`, `VMCALL`, `VMMCALL`, `VMGEXIT`, `VMRUN`, `TDCALL`, `SEAMCALL`, `SEAMRET`
*/
Call:5,"5":"Call",
/**
* It's an indirect call instruction: `CALL NEAR reg`, `CALL NEAR [mem]`, `CALL FAR [mem]`
*/
IndirectCall:6,"6":"IndirectCall",
/**
* It's an interrupt instruction: `INT n`, `INT3`, `INT1`, `INTO`, `SMINT`, `DMINT`
*/
Interrupt:7,"7":"Interrupt",
/**
* It's `XBEGIN`
*/
XbeginXabortXend:8,"8":"XbeginXabortXend",
/**
* It's an invalid instruction, eg. [`Code.INVALID`], `UD0`, `UD1`, `UD2`
*
* [`Code.INVALID`]: enum.Code.html#variant.INVALID
*/
Exception:9,"9":"Exception", });
/**
* Mnemonic condition code selector (eg. `JBE` / `JNA`)
*/
__exports.CC_be = Object.freeze({
/**
* `JBE`, `CMOVBE`, `SETBE`
*/
be:0,"0":"be",
/**
* `JNA`, `CMOVNA`, `SETNA`
*/
na:1,"1":"na", });
/**
* `CPUID` feature flags
*/
__exports.CpuidFeature = Object.freeze({
/**
* 8086 or later
*/
INTEL8086:0,"0":"INTEL8086",
/**
* 8086 only
*/
INTEL8086_ONLY:1,"1":"INTEL8086_ONLY",
/**
* 80186 or later
*/
INTEL186:2,"2":"INTEL186",
/**
* 80286 or later
*/
INTEL286:3,"3":"INTEL286",
/**
* 80286 only
*/
INTEL286_ONLY:4,"4":"INTEL286_ONLY",
/**
* 80386 or later
*/
INTEL386:5,"5":"INTEL386",
/**
* 80386 only
*/
INTEL386_ONLY:6,"6":"INTEL386_ONLY",
/**
* 80386 A0-B0 stepping only (`XBTS`, `IBTS` instructions)
*/
INTEL386_A0_ONLY:7,"7":"INTEL386_A0_ONLY",
/**
* Intel486 or later
*/
INTEL486:8,"8":"INTEL486",
/**
* Intel486 A stepping only (`CMPXCHG`)
*/
INTEL486_A_ONLY:9,"9":"INTEL486_A_ONLY",
/**
* UMOV (80386 and Intel486)
*/
UMOV:10,"10":"UMOV",
/**
* IA-64
*/
IA64:11,"11":"IA64",
/**
* CPUID.80000001H:EDX.LM\[bit 29\]
*/
X64:12,"12":"X64",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.ADX\[bit 19\]
*/
ADX:13,"13":"ADX",
/**
* CPUID.01H:ECX.AES\[bit 25\]
*/
AES:14,"14":"AES",
/**
* CPUID.01H:ECX.AVX\[bit 28\]
*/
AVX:15,"15":"AVX",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX2\[bit 5\]
*/
AVX2:16,"16":"AVX2",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.AVX512_4FMAPS\[bit 3\]
*/
AVX512_4FMAPS:17,"17":"AVX512_4FMAPS",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.AVX512_4VNNIW\[bit 2\]
*/
AVX512_4VNNIW:18,"18":"AVX512_4VNNIW",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.AVX512_BF16\[bit 5\]
*/
AVX512_BF16:19,"19":"AVX512_BF16",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.AVX512_BITALG\[bit 12\]
*/
AVX512_BITALG:20,"20":"AVX512_BITALG",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512_IFMA\[bit 21\]
*/
AVX512_IFMA:21,"21":"AVX512_IFMA",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.AVX512_VBMI\[bit 1\]
*/
AVX512_VBMI:22,"22":"AVX512_VBMI",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.AVX512_VBMI2\[bit 6\]
*/
AVX512_VBMI2:23,"23":"AVX512_VBMI2",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.AVX512_VNNI\[bit 11\]
*/
AVX512_VNNI:24,"24":"AVX512_VNNI",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.AVX512_VP2INTERSECT\[bit 08\]
*/
AVX512_VP2INTERSECT:25,"25":"AVX512_VP2INTERSECT",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.AVX512_VPOPCNTDQ\[bit 14\]
*/
AVX512_VPOPCNTDQ:26,"26":"AVX512_VPOPCNTDQ",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512BW\[bit 30\]
*/
AVX512BW:27,"27":"AVX512BW",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512CD\[bit 28\]
*/
AVX512CD:28,"28":"AVX512CD",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512DQ\[bit 17\]
*/
AVX512DQ:29,"29":"AVX512DQ",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512ER\[bit 27\]
*/
AVX512ER:30,"30":"AVX512ER",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512F\[bit 16\]
*/
AVX512F:31,"31":"AVX512F",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512PF\[bit 26\]
*/
AVX512PF:32,"32":"AVX512PF",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.AVX512VL\[bit 31\]
*/
AVX512VL:33,"33":"AVX512VL",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.BMI1\[bit 3\]
*/
BMI1:34,"34":"BMI1",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.BMI2\[bit 8\]
*/
BMI2:35,"35":"BMI2",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.CET_IBT\[bit 20\]
*/
CET_IBT:36,"36":"CET_IBT",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.CET_SS\[bit 7\]
*/
CET_SS:37,"37":"CET_SS",
/**
* `CL1INVMB` instruction (Intel SCC = Single-Chip Computer)
*/
CL1INVMB:38,"38":"CL1INVMB",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.CLDEMOTE\[bit 25\]
*/
CLDEMOTE:39,"39":"CLDEMOTE",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.CLFLUSHOPT\[bit 23\]
*/
CLFLUSHOPT:40,"40":"CLFLUSHOPT",
/**
* CPUID.01H:EDX.CLFSH\[bit 19\]
*/
CLFSH:41,"41":"CLFSH",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.CLWB\[bit 24\]
*/
CLWB:42,"42":"CLWB",
/**
* CPUID.80000008H:EBX.CLZERO\[bit 0\]
*/
CLZERO:43,"43":"CLZERO",
/**
* CPUID.01H:EDX.CMOV\[bit 15\]
*/
CMOV:44,"44":"CMOV",
/**
* CPUID.01H:ECX.CMPXCHG16B\[bit 13\]
*/
CMPXCHG16B:45,"45":"CMPXCHG16B",
/**
* `RFLAGS.ID` can be toggled
*/
CPUID:46,"46":"CPUID",
/**
* CPUID.01H:EDX.CX8\[bit 8\]
*/
CX8:47,"47":"CX8",
/**
* CPUID.80000001H:EDX.3DNOW\[bit 31\]
*/
D3NOW:48,"48":"D3NOW",
/**
* CPUID.80000001H:EDX.3DNOWEXT\[bit 30\]
*/
D3NOWEXT:49,"49":"D3NOWEXT",
/**
* CPUID.(EAX=12H, ECX=0H):EAX.OSS\[bit 5\]
*/
OSS:50,"50":"OSS",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.ENQCMD\[bit 29\]
*/
ENQCMD:51,"51":"ENQCMD",
/**
* CPUID.01H:ECX.F16C\[bit 29\]
*/
F16C:52,"52":"F16C",
/**
* CPUID.01H:ECX.FMA\[bit 12\]
*/
FMA:53,"53":"FMA",
/**
* CPUID.80000001H:ECX.FMA4\[bit 16\]
*/
FMA4:54,"54":"FMA4",
/**
* 8087 or later (CPUID.01H:EDX.FPU\[bit 0\])
*/
FPU:55,"55":"FPU",
/**
* 80287 or later
*/
FPU287:56,"56":"FPU287",
/**
* 80287XL only
*/
FPU287XL_ONLY:57,"57":"FPU287XL_ONLY",
/**
* 80387 or later
*/
FPU387:58,"58":"FPU387",
/**
* 80387SL only
*/
FPU387SL_ONLY:59,"59":"FPU387SL_ONLY",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.FSGSBASE\[bit 0\]
*/
FSGSBASE:60,"60":"FSGSBASE",
/**
* CPUID.01H:EDX.FXSR\[bit 24\]
*/
FXSR:61,"61":"FXSR",
/**
* Cyrix (AMD Geode GX/LX) 3DNow! instructions
*/
CYRIX_D3NOW:62,"62":"CYRIX_D3NOW",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.GFNI\[bit 8\]
*/
GFNI:63,"63":"GFNI",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.HLE\[bit 4\]
*/
HLE:64,"64":"HLE",
/**
* [`HLE`] or [`RTM`]
*
* [`HLE`]: enum.CpuidFeature.html#variant.HLE
* [`RTM`]: enum.CpuidFeature.html#variant.RTM
*/
HLE_or_RTM:65,"65":"HLE_or_RTM",
/**
* IA32_VMX_EPT_VPID_CAP\[bit 20\]
*/
INVEPT:66,"66":"INVEPT",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.INVPCID\[bit 10\]
*/
INVPCID:67,"67":"INVPCID",
/**
* IA32_VMX_EPT_VPID_CAP\[bit 32\]
*/
INVVPID:68,"68":"INVVPID",
/**
* CPUID.80000001H:ECX.LWP\[bit 15\]
*/
LWP:69,"69":"LWP",
/**
* CPUID.80000001H:ECX.LZCNT\[bit 5\]
*/
LZCNT:70,"70":"LZCNT",
/**
* CPUID.80000008H:EBX.MCOMMIT\[bit 8\]
*/
MCOMMIT:71,"71":"MCOMMIT",
/**
* CPUID.01H:EDX.MMX\[bit 23\]
*/
MMX:72,"72":"MMX",
/**
* CPUID.01H:ECX.MONITOR\[bit 3\]
*/
MONITOR:73,"73":"MONITOR",
/**
* CPUID.80000001H:ECX.MONITORX\[bit 29\]
*/
MONITORX:74,"74":"MONITORX",
/**
* CPUID.01H:ECX.MOVBE\[bit 22\]
*/
MOVBE:75,"75":"MOVBE",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.MOVDIR64B\[bit 28\]
*/
MOVDIR64B:76,"76":"MOVDIR64B",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.MOVDIRI\[bit 27\]
*/
MOVDIRI:77,"77":"MOVDIRI",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.MPX\[bit 14\]
*/
MPX:78,"78":"MPX",
/**
* CPUID.01H:EDX.MSR\[bit 5\]
*/
MSR:79,"79":"MSR",
/**
* Multi-byte nops (`0F1F /0`): CPUID.01H.EAX\[Bits 11:8\] = 0110B or 1111B
*/
MULTIBYTENOP:80,"80":"MULTIBYTENOP",
/**
* CPUID.0C0000000H:EAX >= 0C0000001H AND CPUID.0C0000001H:EDX.ACE\[Bits 7:6\] = 11B (\[6\] = exists, \[7\] = enabled)
*/
PADLOCK_ACE:81,"81":"PADLOCK_ACE",
/**
* CPUID.0C0000000H:EAX >= 0C0000001H AND CPUID.0C0000001H:EDX.PHE\[Bits 11:10\] = 11B (\[10\] = exists, \[11\] = enabled)
*/
PADLOCK_PHE:82,"82":"PADLOCK_PHE",
/**
* CPUID.0C0000000H:EAX >= 0C0000001H AND CPUID.0C0000001H:EDX.PMM\[Bits 13:12\] = 11B (\[12\] = exists, \[13\] = enabled)
*/
PADLOCK_PMM:83,"83":"PADLOCK_PMM",
/**
* CPUID.0C0000000H:EAX >= 0C0000001H AND CPUID.0C0000001H:EDX.RNG\[Bits 3:2\] = 11B (\[2\] = exists, \[3\] = enabled)
*/
PADLOCK_RNG:84,"84":"PADLOCK_RNG",
/**
* `PAUSE` instruction (Pentium 4 or later)
*/
PAUSE:85,"85":"PAUSE",
/**
* CPUID.01H:ECX.PCLMULQDQ\[bit 1\]
*/
PCLMULQDQ:86,"86":"PCLMULQDQ",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.PCOMMIT\[bit 22\]
*/
PCOMMIT:87,"87":"PCOMMIT",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.PCONFIG\[bit 18\]
*/
PCONFIG:88,"88":"PCONFIG",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.PKU\[bit 3\]
*/
PKU:89,"89":"PKU",
/**
* CPUID.01H:ECX.POPCNT\[bit 23\]
*/
POPCNT:90,"90":"POPCNT",
/**
* CPUID.80000001H:ECX.PREFETCHW\[bit 8\]
*/
PREFETCHW:91,"91":"PREFETCHW",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.PREFETCHWT1\[bit 0\]
*/
PREFETCHWT1:92,"92":"PREFETCHWT1",
/**
* CPUID.(EAX=14H, ECX=0H):EBX.PTWRITE\[bit 4\]
*/
PTWRITE:93,"93":"PTWRITE",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.RDPID\[bit 22\]
*/
RDPID:94,"94":"RDPID",
/**
* `RDPMC` instruction (Pentium MMX or later, or Pentium Pro or later)
*/
RDPMC:95,"95":"RDPMC",
/**
* CPUID.80000008H:EBX.RDPRU\[bit 4\]
*/
RDPRU:96,"96":"RDPRU",
/**
* CPUID.01H:ECX.RDRAND\[bit 30\]
*/
RDRAND:97,"97":"RDRAND",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.RDSEED\[bit 18\]
*/
RDSEED:98,"98":"RDSEED",
/**
* CPUID.80000001H:EDX.RDTSCP\[bit 27\]
*/
RDTSCP:99,"99":"RDTSCP",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.RTM\[bit 11\]
*/
RTM:100,"100":"RTM",
/**
* CPUID.01H:EDX.SEP\[bit 11\]
*/
SEP:101,"101":"SEP",
/**
* CPUID.(EAX=12H, ECX=0H):EAX.SGX1\[bit 0\]
*/
SGX1:102,"102":"SGX1",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.SHA\[bit 29\]
*/
SHA:103,"103":"SHA",
/**
* CPUID.80000001H:ECX.SKINIT\[bit 12\]
*/
SKINIT:104,"104":"SKINIT",
/**
* [`SKINIT`] or [`SVM`]
*
* [`SKINIT`]: enum.CpuidFeature.html#variant.SKINIT
* [`SVM`]: enum.CpuidFeature.html#variant.SVM
*/
SKINIT_or_SVM:105,"105":"SKINIT_or_SVM",
/**
* CPUID.(EAX=07H, ECX=0H):EBX.SMAP\[bit 20\]
*/
SMAP:106,"106":"SMAP",
/**
* CPUID.01H:ECX.SMX\[bit 6\]
*/
SMX:107,"107":"SMX",
/**
* CPUID.01H:EDX.SSE\[bit 25\]
*/
SSE:108,"108":"SSE",
/**
* CPUID.01H:EDX.SSE2\[bit 26\]
*/
SSE2:109,"109":"SSE2",
/**
* CPUID.01H:ECX.SSE3\[bit 0\]
*/
SSE3:110,"110":"SSE3",
/**
* CPUID.01H:ECX.SSE4_1\[bit 19\]
*/
SSE4_1:111,"111":"SSE4_1",
/**
* CPUID.01H:ECX.SSE4_2\[bit 20\]
*/
SSE4_2:112,"112":"SSE4_2",
/**
* CPUID.80000001H:ECX.SSE4A\[bit 6\]
*/
SSE4A:113,"113":"SSE4A",
/**
* CPUID.01H:ECX.SSSE3\[bit 9\]
*/
SSSE3:114,"114":"SSSE3",
/**
* CPUID.80000001H:ECX.SVM\[bit 2\]
*/
SVM:115,"115":"SVM",
/**
* CPUID.8000001FH:EAX.SEV-ES\[bit 3\]
*/
SEV_ES:116,"116":"SEV_ES",
/**
* CPUID.80000001H:EDX.SYSCALL\[bit 11\]
*/
SYSCALL:117,"117":"SYSCALL",
/**
* CPUID.80000001H:ECX.TBM\[bit 21\]
*/
TBM:118,"118":"TBM",
/**
* CPUID.01H:EDX.TSC\[bit 4\]
*/
TSC:119,"119":"TSC",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.VAES\[bit 9\]
*/
VAES:120,"120":"VAES",
/**
* CPUID.01H:ECX.VMX\[bit 5\]
*/
VMX:121,"121":"VMX",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.VPCLMULQDQ\[bit 10\]
*/
VPCLMULQDQ:122,"122":"VPCLMULQDQ",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.WAITPKG\[bit 5\]
*/
WAITPKG:123,"123":"WAITPKG",
/**
* CPUID.(EAX=80000008H, ECX=0H):EBX.WBNOINVD\[bit 9\]
*/
WBNOINVD:124,"124":"WBNOINVD",
/**
* CPUID.80000001H:ECX.XOP\[bit 11\]
*/
XOP:125,"125":"XOP",
/**
* CPUID.01H:ECX.XSAVE\[bit 26\]
*/
XSAVE:126,"126":"XSAVE",
/**
* CPUID.(EAX=0DH, ECX=1H):EAX.XSAVEC\[bit 1\]
*/
XSAVEC:127,"127":"XSAVEC",
/**
* CPUID.(EAX=0DH, ECX=1H):EAX.XSAVEOPT\[bit 0\]
*/
XSAVEOPT:128,"128":"XSAVEOPT",
/**
* CPUID.(EAX=0DH, ECX=1H):EAX.XSAVES\[bit 3\]
*/
XSAVES:129,"129":"XSAVES",
/**
* CPUID.8000001FH:EAX.SEV-SNP\[bit 4\]
*/
SEV_SNP:130,"130":"SEV_SNP",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.SERIALIZE\[bit 14\]
*/
SERIALIZE:131,"131":"SERIALIZE",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.TSXLDTRK\[bit 16\]
*/
TSXLDTRK:132,"132":"TSXLDTRK",
/**
* CPUID.80000008H:EBX.INVLPGB\[bit 3\]
*/
INVLPGB:133,"133":"INVLPGB",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.AMX-BF16\[bit 22\]
*/
AMX_BF16:134,"134":"AMX_BF16",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.AMX-TILE\[bit 24\]
*/
AMX_TILE:135,"135":"AMX_TILE",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.AMX-INT8\[bit 25\]
*/
AMX_INT8:136,"136":"AMX_INT8",
/**
* Cyrix FPU instructions (Cyrix, AMD Geode GX/LX)
*/
CYRIX_FPU:137,"137":"CYRIX_FPU",
/**
* Cyrix SMM instructions: `SVDC`, `RSDC`, `SVLDT`, `RSLDT`, `SVTS`, `RSTS` (Cyrix, AMD Geode GX/LX)
*/
CYRIX_SMM:138,"138":"CYRIX_SMM",
/**
* Cyrix `SMINT 0F38` (6x86MX and later, AMD Geode GX/LX)
*/
CYRIX_SMINT:139,"139":"CYRIX_SMINT",
/**
* Cyrix `SMINT 0F7E` (6x86 or earlier)
*/
CYRIX_SMINT_0F7E:140,"140":"CYRIX_SMINT_0F7E",
/**
* Cyrix SMM instructions: `RDSHR`, `WRSHR` (6x86MX, M II, Cyrix III)
*/
CYRIX_SHR:141,"141":"CYRIX_SHR",
/**
* Cyrix DDI instructions: `BB0_Reset`, `BB1_Reset`, `CPU_READ`, `CPU_WRITE` (MediaGX, GXm, GXLV, GX1)
*/
CYRIX_DDI:142,"142":"CYRIX_DDI",
/**
* Cyrix AND CPUID.80000001H:EDX.EMMI\[bit 24\]
*/
CYRIX_EMMI:143,"143":"CYRIX_EMMI",
/**
* Cyrix DMI instructions: `DMINT`, `RDM` (AMD Geode GX/LX)
*/
CYRIX_DMI:144,"144":"CYRIX_DMI",
/**
* CPUID.0C0000000H:EAX >= 0C0000001H AND CPUID.0C0000001H:EDX.AIS\[Bits 1:0\] = 11B (\[0\] = exists, \[1\] = enabled)
*/
CENTAUR_AIS:145,"145":"CENTAUR_AIS",
/**
* MOV to/from TR (80386, Intel486, Cyrix, Geode)
*/
MOV_TR:146,"146":"MOV_TR",
/**
* `RSM` instruction (some 386s, some 486s, Pentium and later)
*/
SMM:147,"147":"SMM",
/**
* CPUID.(EAX=??H, ECX=?H):???.????\[bit ??\]
*/
TDX:148,"148":"TDX",
/**
* CPUID.(EAX=07H, ECX=0H):ECX.KL\[bit 23\]
*/
KL:149,"149":"KL",
/**
* CPUID.19H:EBX.AESKLE\[bit 0\]
*/
AESKLE:150,"150":"AESKLE",
/**
* CPUID.19H:EBX.WIDE_KL\[bit 2\]
*/
WIDE_KL:151,"151":"WIDE_KL",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.UINTR\[bit 5\]
*/
UINTR:152,"152":"UINTR",
/**
* CPUID.(EAX=07H, ECX=01H):EAX.HRESET\[bit 22\]
*/
HRESET:153,"153":"HRESET",
/**
* CPUID.(EAX=07H, ECX=01H):EAX.AVX-VNNI\[bit 4\]
*/
AVX_VNNI:154,"154":"AVX_VNNI",
/**
* CPUID.0C0000000H:EAX >= 0C0000001H AND CPUID.0C0000001H:EDX.GMI\[Bits 5:4\] = 11B (\[4\] = exists, \[5\] = enabled)
*/
PADLOCK_GMI:155,"155":"PADLOCK_GMI",
/**
* CPUID.(EAX=07H, ECX=01H):EAX.FRED\[bit 17\]
*/
FRED:156,"156":"FRED",
/**
* CPUID.(EAX=07H, ECX=01H):EAX.LKGS\[bit 18\]
*/
LKGS:157,"157":"LKGS",
/**
* CPUID.(EAX=07H, ECX=0H):EDX.AVX512-FP16\[bit 23\]
*/
AVX512_FP16:158,"158":"AVX512_FP16",
/**
* Undocumented Intel `RDUDBG` and `WRUDBG` instructions
*/
UDBG:159,"159":"UDBG",
/**
* Intel Knights Corner
*/
KNC:160,"160":"KNC",
/**
* Undocumented instruction
*/
PADLOCK_UNDOC:161,"161":"PADLOCK_UNDOC",
/**
* CPUID.8000001FH:EAX.RMPQUERY\[bit 6\]
*/
RMPQUERY:162,"162":"RMPQUERY",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.RAO-INT\[bit 3\]
*/
RAO_INT:163,"163":"RAO_INT",
/**
* CPUID.(EAX=07H, ECX=1H):EDX.PREFETCHITI\[bit 14\]
*/
PREFETCHITI:164,"164":"PREFETCHITI",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.AMX-FP16\[bit 21\]
*/
AMX_FP16:165,"165":"AMX_FP16",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.CMPCCXADD\[bit 7\]
*/
CMPCCXADD:166,"166":"CMPCCXADD",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.AVX-IFMA\[bit 23\]
*/
AVX_IFMA:167,"167":"AVX_IFMA",
/**
* CPUID.(EAX=07H, ECX=1H):EDX.AVX-NE-CONVERT\[bit 5\]
*/
AVX_NE_CONVERT:168,"168":"AVX_NE_CONVERT",
/**
* CPUID.(EAX=07H, ECX=1H):EDX.AVX-VNNI-INT8\[bit 4\]
*/
AVX_VNNI_INT8:169,"169":"AVX_VNNI_INT8",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.MSRLIST\[bit 27\]
*/
MSRLIST:170,"170":"MSRLIST",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.WRMSRNS\[bit 19\]
*/
WRMSRNS:171,"171":"WRMSRNS",
/**
* CPUID.(EAX=07H, ECX=1H):EDX.AMX-COMPLEX\[bit 8\]
*/
AMX_COMPLEX:172,"172":"AMX_COMPLEX",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.SHA512\[bit 0\]
*/
SHA512:173,"173":"SHA512",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.SM3\[bit 1\]
*/
SM3:174,"174":"SM3",
/**
* CPUID.(EAX=07H, ECX=1H):EAX.SM4\[bit 2\]
*/
SM4:175,"175":"SM4",
/**
* CPUID.(EAX=07H, ECX=1H):EBX.TSE\[bit 1\]
*/
TSE:176,"176":"TSE",
/**
* CPUID.(EAX=07H, ECX=1H):EDX.AVX-VNNI-INT16\[bit 10\]
*/
AVX_VNNI_INT16:177,"177":"AVX_VNNI_INT16", });
/**
* Mnemonic condition code selector (eg. `JGE` / `JNL`)
*/
__exports.CC_ge = Object.freeze({
/**
* `JGE`, `CMOVGE`, `SETGE`
*/
ge:0,"0":"ge",
/**
* `JNL`, `CMOVNL`, `SETNL`
*/
nl:1,"1":"nl", });
/**
* Mnemonic condition code selector (eg. `JAE` / `JNB` / `JNC`)
*/
__exports.CC_ae = Object.freeze({
/**
* `JAE`, `CMOVAE`, `SETAE`
*/
ae:0,"0":"ae",
/**
* `JNB`, `CMOVNB`, `SETNB`
*/
nb:1,"1":"nb",
/**
* `JNC`, `CMOVNC`, `SETNC`
*/
nc:2,"2":"nc", });
/**
* Instruction encoding
*/
__exports.EncodingKind = Object.freeze({
/**
* Legacy encoding
*/
Legacy:0,"0":"Legacy",
/**
* VEX encoding
*/
VEX:1,"1":"VEX",
/**
* EVEX encoding
*/
EVEX:2,"2":"EVEX",
/**
* XOP encoding
*/
XOP:3,"3":"XOP",
/**
* 3DNow! encoding
*/
D3NOW:4,"4":"D3NOW",
/**
* MVEX encoding
*/
MVEX:5,"5":"MVEX", });
/**
* Instruction condition code (used by `Jcc`, `SETcc`, `CMOVcc`, `CMPccXADD`, `LOOPcc`)
*/
__exports.ConditionCode = Object.freeze({
/**
* The instruction doesn't have a condition code
*/
None:0,"0":"None",
/**
* Overflow (`OF=1`)
*/
o:1,"1":"o",
/**
* Not overflow (`OF=0`)
*/
no:2,"2":"no",
/**
* Below (unsigned) (`CF=1`)
*/
b:3,"3":"b",
/**
* Above or equal (unsigned) (`CF=0`)
*/
ae:4,"4":"ae",
/**
* Equal / zero (`ZF=1`)
*/
e:5,"5":"e",
/**
* Not equal / zero (`ZF=0`)
*/
ne:6,"6":"ne",
/**
* Below or equal (unsigned) (`CF=1 or ZF=1`)
*/
be:7,"7":"be",
/**
* Above (unsigned) (`CF=0 and ZF=0`)
*/
a:8,"8":"a",
/**
* Signed (`SF=1`)
*/
s:9,"9":"s",
/**
* Not signed (`SF=0`)
*/
ns:10,"10":"ns",
/**
* Parity (`PF=1`)
*/
p:11,"11":"p",
/**
* Not parity (`PF=0`)
*/
np:12,"12":"np",
/**
* Less (signed) (`SF!=OF`)
*/
l:13,"13":"l",
/**
* Greater than or equal (signed) (`SF=OF`)
*/
ge:14,"14":"ge",
/**
* Less than or equal (signed) (`ZF=1 or SF!=OF`)
*/
le:15,"15":"le",
/**
* Greater (signed) (`ZF=0 and SF=OF`)
*/
g:16,"16":"g", });
/**
* Rounding control
*/
__exports.RoundingControl = Object.freeze({
/**
* No rounding mode
*/
None:0,"0":"None",
/**
* Round to nearest (even)
*/
RoundToNearest:1,"1":"RoundToNearest",
/**
* Round down (toward -inf)
*/
RoundDown:2,"2":"RoundDown",
/**
* Round up (toward +inf)
*/
RoundUp:3,"3":"RoundUp",
/**
* Round toward zero (truncate)
*/
RoundTowardZero:4,"4":"RoundTowardZero", });
/**
* Mnemonic
*/
__exports.Mnemonic = Object.freeze({ INVALID:0,"0":"INVALID",Aaa:1,"1":"Aaa",Aad:2,"2":"Aad",Aam:3,"3":"Aam",Aas:4,"4":"Aas",Adc:5,"5":"Adc",Adcx:6,"6":"Adcx",Add:7,"7":"Add",Addpd:8,"8":"Addpd",Addps:9,"9":"Addps",Addsd:10,"10":"Addsd",Addss:11,"11":"Addss",Addsubpd:12,"12":"Addsubpd",Addsubps:13,"13":"Addsubps",Adox:14,"14":"Adox",Aesdec:15,"15":"Aesdec",Aesdeclast:16,"16":"Aesdeclast",Aesenc:17,"17":"Aesenc",Aesenclast:18,"18":"Aesenclast",Aesimc:19,"19":"Aesimc",Aeskeygenassist:20,"20":"Aeskeygenassist",And:21,"21":"And",Andn:22,"22":"Andn",Andnpd:23,"23":"Andnpd",Andnps:24,"24":"Andnps",Andpd:25,"25":"Andpd",Andps:26,"26":"Andps",Arpl:27,"27":"Arpl",Bextr:28,"28":"Bextr",Blcfill:29,"29":"Blcfill",Blci:30,"30":"Blci",Blcic:31,"31":"Blcic",Blcmsk:32,"32":"Blcmsk",Blcs:33,"33":"Blcs",Blendpd:34,"34":"Blendpd",Blendps:35,"35":"Blendps",Blendvpd:36,"36":"Blendvpd",Blendvps:37,"37":"Blendvps",Blsfill:38,"38":"Blsfill",Blsi:39,"39":"Blsi",Blsic:40,"40":"Blsic",Blsmsk:41,"41":"Blsmsk",Blsr:42,"42":"Blsr",Bndcl:43,"43":"Bndcl",Bndcn:44,"44":"Bndcn",Bndcu:45,"45":"Bndcu",Bndldx:46,"46":"Bndldx",Bndmk:47,"47":"Bndmk",Bndmov:48,"48":"Bndmov",Bndstx:49,"49":"Bndstx",Bound:50,"50":"Bound",Bsf:51,"51":"Bsf",Bsr:52,"52":"Bsr",Bswap:53,"53":"Bswap",Bt:54,"54":"Bt",Btc:55,"55":"Btc",Btr:56,"56":"Btr",Bts:57,"57":"Bts",Bzhi:58,"58":"Bzhi",Call:59,"59":"Call",Cbw:60,"60":"Cbw",Cdq:61,"61":"Cdq",Cdqe:62,"62":"Cdqe",Cl1invmb:63,"63":"Cl1invmb",Clac:64,"64":"Clac",Clc:65,"65":"Clc",Cld:66,"66":"Cld",Cldemote:67,"67":"Cldemote",Clflush:68,"68":"Clflush",Clflushopt:69,"69":"Clflushopt",Clgi:70,"70":"Clgi",Cli:71,"71":"Cli",Clrssbsy:72,"72":"Clrssbsy",Clts:73,"73":"Clts",Clwb:74,"74":"Clwb",Clzero:75,"75":"Clzero",Cmc:76,"76":"Cmc",Cmova:77,"77":"Cmova",Cmovae:78,"78":"Cmovae",Cmovb:79,"79":"Cmovb",Cmovbe:80,"80":"Cmovbe",Cmove:81,"81":"Cmove",Cmovg:82,"82":"Cmovg",Cmovge:83,"83":"Cmovge",Cmovl:84,"84":"Cmovl",Cmovle:85,"85":"Cmovle",Cmovne:86,"86":"Cmovne",Cmovno:87,"87":"Cmovno",Cmovnp:88,"88":"Cmovnp",Cmovns:89,"89":"Cmovns",Cmovo:90,"90":"Cmovo",Cmovp:91,"91":"Cmovp",Cmovs:92,"92":"Cmovs",Cmp:93,"93":"Cmp",Cmppd:94,"94":"Cmppd",Cmpps:95,"95":"Cmpps",Cmpsb:96,"96":"Cmpsb",Cmpsd:97,"97":"Cmpsd",Cmpsq:98,"98":"Cmpsq",Cmpss:99,"99":"Cmpss",Cmpsw:100,"100":"Cmpsw",Cmpxchg:101,"101":"Cmpxchg",Cmpxchg16b:102,"102":"Cmpxchg16b",Cmpxchg8b:103,"103":"Cmpxchg8b",Comisd:104,"104":"Comisd",Comiss:105,"105":"Comiss",Cpuid:106,"106":"Cpuid",Cqo:107,"107":"Cqo",Crc32:108,"108":"Crc32",Cvtdq2pd:109,"109":"Cvtdq2pd",Cvtdq2ps:110,"110":"Cvtdq2ps",Cvtpd2dq:111,"111":"Cvtpd2dq",Cvtpd2pi:112,"112":"Cvtpd2pi",Cvtpd2ps:113,"113":"Cvtpd2ps",Cvtpi2pd:114,"114":"Cvtpi2pd",Cvtpi2ps:115,"115":"Cvtpi2ps",Cvtps2dq:116,"116":"Cvtps2dq",Cvtps2pd:117,"117":"Cvtps2pd",Cvtps2pi:118,"118":"Cvtps2pi",Cvtsd2si:119,"119":"Cvtsd2si",Cvtsd2ss:120,"120":"Cvtsd2ss",Cvtsi2sd:121,"121":"Cvtsi2sd",Cvtsi2ss:122,"122":"Cvtsi2ss",Cvtss2sd:123,"123":"Cvtss2sd",Cvtss2si:124,"124":"Cvtss2si",Cvttpd2dq:125,"125":"Cvttpd2dq",Cvttpd2pi:126,"126":"Cvttpd2pi",Cvttps2dq:127,"127":"Cvttps2dq",Cvttps2pi:128,"128":"Cvttps2pi",Cvttsd2si:129,"129":"Cvttsd2si",Cvttss2si:130,"130":"Cvttss2si",Cwd:131,"131":"Cwd",Cwde:132,"132":"Cwde",Daa:133,"133":"Daa",Das:134,"134":"Das",Db:135,"135":"Db",Dd:136,"136":"Dd",Dec:137,"137":"Dec",Div:138,"138":"Div",Divpd:139,"139":"Divpd",Divps:140,"140":"Divps",Divsd:141,"141":"Divsd",Divss:142,"142":"Divss",Dppd:143,"143":"Dppd",Dpps:144,"144":"Dpps",Dq:145,"145":"Dq",Dw:146,"146":"Dw",Emms:147,"147":"Emms",Encls:148,"148":"Encls",Enclu:149,"149":"Enclu",Enclv:150,"150":"Enclv",Endbr32:151,"151":"Endbr32",Endbr64:152,"152":"Endbr64",Enqcmd:153,"153":"Enqcmd",Enqcmds:154,"154":"Enqcmds",Enter:155,"155":"Enter",Extractps:156,"156":"Extractps",Extrq:157,"157":"Extrq",F2xm1:158,"158":"F2xm1",Fabs:159,"159":"Fabs",Fadd:160,"160":"Fadd",Faddp:161,"161":"Faddp",Fbld:162,"162":"Fbld",Fbstp:163,"163":"Fbstp",Fchs:164,"164":"Fchs",Fclex:165,"165":"Fclex",Fcmovb:166,"166":"Fcmovb",Fcmovbe:167,"167":"Fcmovbe",Fcmove:168,"168":"Fcmove",Fcmovnb:169,"169":"Fcmovnb",Fcmovnbe:170,"170":"Fcmovnbe",Fcmovne:171,"171":"Fcmovne",Fcmovnu:172,"172":"Fcmovnu",Fcmovu:173,"173":"Fcmovu",Fcom:174,"174":"Fcom",Fcomi:175,"175":"Fcomi",Fcomip:176,"176":"Fcomip",Fcomp:177,"177":"Fcomp",Fcompp:178,"178":"Fcompp",Fcos:179,"179":"Fcos",Fdecstp:180,"180":"Fdecstp",Fdisi:181,"181":"Fdisi",Fdiv:182,"182":"Fdiv",Fdivp:183,"183":"Fdivp",Fdivr:184,"184":"Fdivr",Fdivrp:185,"185":"Fdivrp",Femms:186,"186":"Femms",Feni:187,"187":"Feni",Ffree:188,"188":"Ffree",Ffreep:189,"189":"Ffreep",Fiadd:190,"190":"Fiadd",Ficom:191,"191":"Ficom",Ficomp:192,"192":"Ficomp",Fidiv:193,"193":"Fidiv",Fidivr:194,"194":"Fidivr",Fild:195,"195":"Fild",Fimul:196,"196":"Fimul",Fincstp:197,"197":"Fincstp",Finit:198,"198":"Finit",Fist:199,"199":"Fist",Fistp:200,"200":"Fistp",Fisttp:201,"201":"Fisttp",Fisub:202,"202":"Fisub",Fisubr:203,"203":"Fisubr",Fld:204,"204":"Fld",Fld1:205,"205":"Fld1",Fldcw:206,"206":"Fldcw",Fldenv:207,"207":"Fldenv",Fldl2e:208,"208":"Fldl2e",Fldl2t:209,"209":"Fldl2t",Fldlg2:210,"210":"Fldlg2",Fldln2:211,"211":"Fldln2",Fldpi:212,"212":"Fldpi",Fldz:213,"213":"Fldz",Fmul:214,"214":"Fmul",Fmulp:215,"215":"Fmulp",Fnclex:216,"216":"Fnclex",Fndisi:217,"217":"Fndisi",Fneni:218,"218":"Fneni",Fninit:219,"219":"Fninit",Fnop:220,"220":"Fnop",Fnsave:221,"221":"Fnsave",Fnsetpm:222,"222":"Fnsetpm",Fnstcw:223,"223":"Fnstcw",Fnstenv:224,"224":"Fnstenv",Fnstsw:225,"225":"Fnstsw",Fpatan:226,"226":"Fpatan",Fprem:227,"227":"Fprem",Fprem1:228,"228":"Fprem1",Fptan:229,"229":"Fptan",Frndint:230,"230":"Frndint",Frstor:231,"231":"Frstor",Frstpm:232,"232":"Frstpm",Fsave:233,"233":"Fsave",Fscale:234,"234":"Fscale",Fsetpm:235,"235":"Fsetpm",Fsin:236,"236":"Fsin",Fsincos:237,"237":"Fsincos",Fsqrt:238,"238":"Fsqrt",Fst:239,"239":"Fst",Fstcw:240,"240":"Fstcw",Fstdw:241,"241":"Fstdw",Fstenv:242,"242":"Fstenv",Fstp:243,"243":"Fstp",Fstpnce:244,"244":"Fstpnce",Fstsg:245,"245":"Fstsg",Fstsw:246,"246":"Fstsw",Fsub:247,"247":"Fsub",Fsubp:248,"248":"Fsubp",Fsubr:249,"249":"Fsubr",Fsubrp:250,"250":"Fsubrp",Ftst:251,"251":"Ftst",Fucom:252,"252":"Fucom",Fucomi:253,"253":"Fucomi",Fucomip:254,"254":"Fucomip",Fucomp:255,"255":"Fucomp",Fucompp:256,"256":"Fucompp",Fxam:257,"257":"Fxam",Fxch:258,"258":"Fxch",Fxrstor:259,"259":"Fxrstor",Fxrstor64:260,"260":"Fxrstor64",Fxsave:261,"261":"Fxsave",Fxsave64:262,"262":"Fxsave64",Fxtract:263,"263":"Fxtract",Fyl2x:264,"264":"Fyl2x",Fyl2xp1:265,"265":"Fyl2xp1",Getsec:266,"266":"Getsec",Gf2p8affineinvqb:267,"267":"Gf2p8affineinvqb",Gf2p8affineqb:268,"268":"Gf2p8affineqb",Gf2p8mulb:269,"269":"Gf2p8mulb",Haddpd:270,"270":"Haddpd",Haddps:271,"271":"Haddps",Hlt:272,"272":"Hlt",Hsubpd:273,"273":"Hsubpd",Hsubps:274,"274":"Hsubps",Ibts:275,"275":"Ibts",Idiv:276,"276":"Idiv",Imul:277,"277":"Imul",In:278,"278":"In",Inc:279,"279":"Inc",Incsspd:280,"280":"Incsspd",Incsspq:281,"281":"Incsspq",Insb:282,"282":"Insb",Insd:283,"283":"Insd",Insertps:284,"284":"Insertps",Insertq:285,"285":"Insertq",Insw:286,"286":"Insw",Int:287,"287":"Int",Int1:288,"288":"Int1",Into:289,"289":"Into",Invd:290,"290":"Invd",Invept:291,"291":"Invept",Invlpg:292,"292":"Invlpg",Invlpga:293,"293":"Invlpga",Invpcid:294,"294":"Invpcid",Invvpid:295,"295":"Invvpid",Iret:296,"296":"Iret",Ja:297,"297":"Ja",Jae:298,"298":"Jae",Jb:299,"299":"Jb",Jbe:300,"300":"Jbe",Jcxz:301,"301":"Jcxz",Je:302,"302":"Je",Jecxz:303,"303":"Jecxz",Jg:304,"304":"Jg",Jge:305,"305":"Jge",Jl:306,"306":"Jl",Jle:307,"307":"Jle",Jmp:308,"308":"Jmp",Jmpe:309,"309":"Jmpe",Jne:310,"310":"Jne",Jno:311,"311":"Jno",Jnp:312,"312":"Jnp",Jns:313,"313":"Jns",Jo:314,"314":"Jo",Jp:315,"315":"Jp",Jrcxz:316,"316":"Jrcxz",Js:317,"317":"Js",Kaddb:318,"318":"Kaddb",Kaddd:319,"319":"Kaddd",Kaddq:320,"320":"Kaddq",Kaddw:321,"321":"Kaddw",Kandb:322,"322":"Kandb",Kandd:323,"323":"Kandd",Kandnb:324,"324":"Kandnb",Kandnd:325,"325":"Kandnd",Kandnq:326,"326":"Kandnq",Kandnw:327,"327":"Kandnw",Kandq:328,"328":"Kandq",Kandw:329,"329":"Kandw",Kmovb:330,"330":"Kmovb",Kmovd:331,"331":"Kmovd",Kmovq:332,"332":"Kmovq",Kmovw:333,"333":"Kmovw",Knotb:334,"334":"Knotb",Knotd:335,"335":"Knotd",Knotq:336,"336":"Knotq",Knotw:337,"337":"Knotw",Korb:338,"338":"Korb",Kord:339,"339":"Kord",Korq:340,"340":"Korq",Kortestb:341,"341":"Kortestb",Kortestd:342,"342":"Kortestd",Kortestq:343,"343":"Kortestq",Kortestw:344,"344":"Kortestw",Korw:345,"345":"Korw",Kshiftlb:346,"346":"Kshiftlb",Kshiftld:347,"347":"Kshiftld",Kshiftlq:348,"348":"Kshiftlq",Kshiftlw:349,"349":"Kshiftlw",Kshiftrb:350,"350":"Kshiftrb",Kshiftrd:351,"351":"Kshiftrd",Kshiftrq:352,"352":"Kshiftrq",Kshiftrw:353,"353":"Kshiftrw",Ktestb:354,"354":"Ktestb",Ktestd:355,"355":"Ktestd",Ktestq:356,"356":"Ktestq",Ktestw:357,"357":"Ktestw",Kunpckbw:358,"358":"Kunpckbw",Kunpckdq:359,"359":"Kunpckdq",Kunpckwd:360,"360":"Kunpckwd",Kxnorb:361,"361":"Kxnorb",Kxnord:362,"362":"Kxnord",Kxnorq:363,"363":"Kxnorq",Kxnorw:364,"364":"Kxnorw",Kxorb:365,"365":"Kxorb",Kxord:366,"366":"Kxord",Kxorq:367,"367":"Kxorq",Kxorw:368,"368":"Kxorw",Lahf:369,"369":"Lahf",Lar:370,"370":"Lar",Lddqu:371,"371":"Lddqu",Ldmxcsr:372,"372":"Ldmxcsr",Lds:373,"373":"Lds",Lea:374,"374":"Lea",Leave:375,"375":"Leave",Les:376,"376":"Les",Lfence:377,"377":"Lfence",Lfs:378,"378":"Lfs",Lgdt:379,"379":"Lgdt",Lgs:380,"380":"Lgs",Lidt:381,"381":"Lidt",Lldt:382,"382":"Lldt",Llwpcb:383,"383":"Llwpcb",Lmsw:384,"384":"Lmsw",Loadall:385,"385":"Loadall",Lodsb:386,"386":"Lodsb",Lodsd:387,"387":"Lodsd",Lodsq:388,"388":"Lodsq",Lodsw:389,"389":"Lodsw",Loop:390,"390":"Loop",Loope:391,"391":"Loope",Loopne:392,"392":"Loopne",Lsl:393,"393":"Lsl",Lss:394,"394":"Lss",Ltr:395,"395":"Ltr",Lwpins:396,"396":"Lwpins",Lwpval:397,"397":"Lwpval",Lzcnt:398,"398":"Lzcnt",Maskmovdqu:399,"399":"Maskmovdqu",Maskmovq:400,"400":"Maskmovq",Maxpd:401,"401":"Maxpd",Maxps:402,"402":"Maxps",Maxsd:403,"403":"Maxsd",Maxss:404,"404":"Maxss",Mcommit:405,"405":"Mcommit",Mfence:406,"406":"Mfence",Minpd:407,"407":"Minpd",Minps:408,"408":"Minps",Minsd:409,"409":"Minsd",Minss:410,"410":"Minss",Monitor:411,"411":"Monitor",Monitorx:412,"412":"Monitorx",Montmul:413,"413":"Montmul",Mov:414,"414":"Mov",Movapd:415,"415":"Movapd",Movaps:416,"416":"Movaps",Movbe:417,"417":"Movbe",Movd:418,"418":"Movd",Movddup:419,"419":"Movddup",Movdir64b:420,"420":"Movdir64b",Movdiri:421,"421":"Movdiri",Movdq2q:422,"422":"Movdq2q",Movdqa:423,"423":"Movdqa",Movdqu:424,"424":"Movdqu",Movhlps:425,"425":"Movhlps",Movhpd:426,"426":"Movhpd",Movhps:427,"427":"Movhps",Movlhps:428,"428":"Movlhps",Movlpd:429,"429":"Movlpd",Movlps:430,"430":"Movlps",Movmskpd:431,"431":"Movmskpd",Movmskps:432,"432":"Movmskps",Movntdq:433,"433":"Movntdq",Movntdqa:434,"434":"Movntdqa",Movnti:435,"435":"Movnti",Movntpd:436,"436":"Movntpd",Movntps:437,"437":"Movntps",Movntq:438,"438":"Movntq",Movntsd:439,"439":"Movntsd",Movntss:440,"440":"Movntss",Movq:441,"441":"Movq",Movq2dq:442,"442":"Movq2dq",Movsb:443,"443":"Movsb",Movsd:444,"444":"Movsd",Movshdup:445,"445":"Movshdup",Movsldup:446,"446":"Movsldup",Movsq:447,"447":"Movsq",Movss:448,"448":"Movss",Movsw:449,"449":"Movsw",Movsx:450,"450":"Movsx",Movsxd:451,"451":"Movsxd",Movupd:452,"452":"Movupd",Movups:453,"453":"Movups",Movzx:454,"454":"Movzx",Mpsadbw:455,"455":"Mpsadbw",Mul:456,"456":"Mul",Mulpd:457,"457":"Mulpd",Mulps:458,"458":"Mulps",Mulsd:459,"459":"Mulsd",Mulss:460,"460":"Mulss",Mulx:461,"461":"Mulx",Mwait:462,"462":"Mwait",Mwaitx:463,"463":"Mwaitx",Neg:464,"464":"Neg",Nop:465,"465":"Nop",Not:466,"466":"Not",Or:467,"467":"Or",Orpd:468,"468":"Orpd",Orps:469,"469":"Orps",Out:470,"470":"Out",Outsb:471,"471":"Outsb",Outsd:472,"472":"Outsd",Outsw:473,"473":"Outsw",Pabsb:474,"474":"Pabsb",Pabsd:475,"475":"Pabsd",Pabsw:476,"476":"Pabsw",Packssdw:477,"477":"Packssdw",Packsswb:478,"478":"Packsswb",Packusdw:479,"479":"Packusdw",Packuswb:480,"480":"Packuswb",Paddb:481,"481":"Paddb",Paddd:482,"482":"Paddd",Paddq:483,"483":"Paddq",Paddsb:484,"484":"Paddsb",Paddsw:485,"485":"Paddsw",Paddusb:486,"486":"Paddusb",Paddusw:487,"487":"Paddusw",Paddw:488,"488":"Paddw",Palignr:489,"489":"Palignr",Pand:490,"490":"Pand",Pandn:491,"491":"Pandn",Pause:492,"492":"Pause",Pavgb:493,"493":"Pavgb",Pavgusb:494,"494":"Pavgusb",Pavgw:495,"495":"Pavgw",Pblendvb:496,"496":"Pblendvb",Pblendw:497,"497":"Pblendw",Pclmulqdq:498,"498":"Pclmulqdq",Pcmpeqb:499,"499":"Pcmpeqb",Pcmpeqd:500,"500":"Pcmpeqd",Pcmpeqq:501,"501":"Pcmpeqq",Pcmpeqw:502,"502":"Pcmpeqw",Pcmpestri:503,"503":"Pcmpestri",Pcmpestri64:504,"504":"Pcmpestri64",Pcmpestrm:505,"505":"Pcmpestrm",Pcmpestrm64:506,"506":"Pcmpestrm64",Pcmpgtb:507,"507":"Pcmpgtb",Pcmpgtd:508,"508":"Pcmpgtd",Pcmpgtq:509,"509":"Pcmpgtq",Pcmpgtw:510,"510":"Pcmpgtw",Pcmpistri:511,"511":"Pcmpistri",Pcmpistrm:512,"512":"Pcmpistrm",Pcommit:513,"513":"Pcommit",Pconfig:514,"514":"Pconfig",Pdep:515,"515":"Pdep",Pext:516,"516":"Pext",Pextrb:517,"517":"Pextrb",Pextrd:518,"518":"Pextrd",Pextrq:519,"519":"Pextrq",Pextrw:520,"520":"Pextrw",Pf2id:521,"521":"Pf2id",Pf2iw:522,"522":"Pf2iw",Pfacc:523,"523":"Pfacc",Pfadd:524,"524":"Pfadd",Pfcmpeq:525,"525":"Pfcmpeq",Pfcmpge:526,"526":"Pfcmpge",Pfcmpgt:527,"527":"Pfcmpgt",Pfmax:528,"528":"Pfmax",Pfmin:529,"529":"Pfmin",Pfmul:530,"530":"Pfmul",Pfnacc:531,"531":"Pfnacc",Pfpnacc:532,"532":"Pfpnacc",Pfrcp:533,"533":"Pfrcp",Pfrcpit1:534,"534":"Pfrcpit1",Pfrcpit2:535,"535":"Pfrcpit2",Pfrcpv:536,"536":"Pfrcpv",Pfrsqit1:537,"537":"Pfrsqit1",Pfrsqrt:538,"538":"Pfrsqrt",Pfrsqrtv:539,"539":"Pfrsqrtv",Pfsub:540,"540":"Pfsub",Pfsubr:541,"541":"Pfsubr",Phaddd:542,"542":"Phaddd",Phaddsw:543,"543":"Phaddsw",Phaddw:544,"544":"Phaddw",Phminposuw:545,"545":"Phminposuw",Phsubd:546,"546":"Phsubd",Phsubsw:547,"547":"Phsubsw",Phsubw:548,"548":"Phsubw",Pi2fd:549,"549":"Pi2fd",Pi2fw:550,"550":"Pi2fw",Pinsrb:551,"551":"Pinsrb",Pinsrd:552,"552":"Pinsrd",Pinsrq:553,"553":"Pinsrq",Pinsrw:554,"554":"Pinsrw",Pmaddubsw:555,"555":"Pmaddubsw",Pmaddwd:556,"556":"Pmaddwd",Pmaxsb:557,"557":"Pmaxsb",Pmaxsd:558,"558":"Pmaxsd",Pmaxsw:559,"559":"Pmaxsw",Pmaxub:560,"560":"Pmaxub",Pmaxud:561,"561":"Pmaxud",Pmaxuw:562,"562":"Pmaxuw",Pminsb:563,"563":"Pminsb",Pminsd:564,"564":"Pminsd",Pminsw:565,"565":"Pminsw",Pminub:566,"566":"Pminub",Pminud:567,"567":"Pminud",Pminuw:568,"568":"Pminuw",Pmovmskb:569,"569":"Pmovmskb",Pmovsxbd:570,"570":"Pmovsxbd",Pmovsxbq:571,"571":"Pmovsxbq",Pmovsxbw:572,"572":"Pmovsxbw",Pmovsxdq:573,"573":"Pmovsxdq",Pmovsxwd:574,"574":"Pmovsxwd",Pmovsxwq:575,"575":"Pmovsxwq",Pmovzxbd:576,"576":"Pmovzxbd",Pmovzxbq:577,"577":"Pmovzxbq",Pmovzxbw:578,"578":"Pmovzxbw",Pmovzxdq:579,"579":"Pmovzxdq",Pmovzxwd:580,"580":"Pmovzxwd",Pmovzxwq:581,"581":"Pmovzxwq",Pmuldq:582,"582":"Pmuldq",Pmulhrsw:583,"583":"Pmulhrsw",Pmulhrw:584,"584":"Pmulhrw",Pmulhuw:585,"585":"Pmulhuw",Pmulhw:586,"586":"Pmulhw",Pmulld:587,"587":"Pmulld",Pmullw:588,"588":"Pmullw",Pmuludq:589,"589":"Pmuludq",Pop:590,"590":"Pop",Popa:591,"591":"Popa",Popcnt:592,"592":"Popcnt",Popf:593,"593":"Popf",Por:594,"594":"Por",Prefetch:595,"595":"Prefetch",Prefetchnta:596,"596":"Prefetchnta",Prefetcht0:597,"597":"Prefetcht0",Prefetcht1:598,"598":"Prefetcht1",Prefetcht2:599,"599":"Prefetcht2",Prefetchw:600,"600":"Prefetchw",Prefetchwt1:601,"601":"Prefetchwt1",Psadbw:602,"602":"Psadbw",Pshufb:603,"603":"Pshufb",Pshufd:604,"604":"Pshufd",Pshufhw:605,"605":"Pshufhw",Pshuflw:606,"606":"Pshuflw",Pshufw:607,"607":"Pshufw",Psignb:608,"608":"Psignb",Psignd:609,"609":"Psignd",Psignw:610,"610":"Psignw",Pslld:611,"611":"Pslld",Pslldq:612,"612":"Pslldq",Psllq:613,"613":"Psllq",Psllw:614,"614":"Psllw",Psrad:615,"615":"Psrad",Psraw:616,"616":"Psraw",Psrld:617,"617":"Psrld",Psrldq:618,"618":"Psrldq",Psrlq:619,"619":"Psrlq",Psrlw:620,"620":"Psrlw",Psubb:621,"621":"Psubb",Psubd:622,"622":"Psubd",Psubq:623,"623":"Psubq",Psubsb:624,"624":"Psubsb",Psubsw:625,"625":"Psubsw",Psubusb:626,"626":"Psubusb",Psubusw:627,"627":"Psubusw",Psubw:628,"628":"Psubw",Pswapd:629,"629":"Pswapd",Ptest:630,"630":"Ptest",Ptwrite:631,"631":"Ptwrite",Punpckhbw:632,"632":"Punpckhbw",Punpckhdq:633,"633":"Punpckhdq",Punpckhqdq:634,"634":"Punpckhqdq",Punpckhwd:635,"635":"Punpckhwd",Punpcklbw:636,"636":"Punpcklbw",Punpckldq:637,"637":"Punpckldq",Punpcklqdq:638,"638":"Punpcklqdq",Punpcklwd:639,"639":"Punpcklwd",Push:640,"640":"Push",Pusha:641,"641":"Pusha",Pushf:642,"642":"Pushf",Pxor:643,"643":"Pxor",Rcl:644,"644":"Rcl",Rcpps:645,"645":"Rcpps",Rcpss:646,"646":"Rcpss",Rcr:647,"647":"Rcr",Rdfsbase:648,"648":"Rdfsbase",Rdgsbase:649,"649":"Rdgsbase",Rdmsr:650,"650":"Rdmsr",Rdpid:651,"651":"Rdpid",Rdpkru:652,"652":"Rdpkru",Rdpmc:653,"653":"Rdpmc",Rdpru:654,"654":"Rdpru",Rdrand:655,"655":"Rdrand",Rdseed:656,"656":"Rdseed",Rdsspd:657,"657":"Rdsspd",Rdsspq:658,"658":"Rdsspq",Rdtsc:659,"659":"Rdtsc",Rdtscp:660,"660":"Rdtscp",Reservednop:661,"661":"Reservednop",Ret:662,"662":"Ret",Retf:663,"663":"Retf",Rol:664,"664":"Rol",Ror:665,"665":"Ror",Rorx:666,"666":"Rorx",Roundpd:667,"667":"Roundpd",Roundps:668,"668":"Roundps",Roundsd:669,"669":"Roundsd",Roundss:670,"670":"Roundss",Rsm:671,"671":"Rsm",Rsqrtps:672,"672":"Rsqrtps",Rsqrtss:673,"673":"Rsqrtss",Rstorssp:674,"674":"Rstorssp",Sahf:675,"675":"Sahf",Sal:676,"676":"Sal",Salc:677,"677":"Salc",Sar:678,"678":"Sar",Sarx:679,"679":"Sarx",Saveprevssp:680,"680":"Saveprevssp",Sbb:681,"681":"Sbb",Scasb:682,"682":"Scasb",Scasd:683,"683":"Scasd",Scasq:684,"684":"Scasq",Scasw:685,"685":"Scasw",Seta:686,"686":"Seta",Setae:687,"687":"Setae",Setb:688,"688":"Setb",Setbe:689,"689":"Setbe",Sete:690,"690":"Sete",Setg:691,"691":"Setg",Setge:692,"692":"Setge",Setl:693,"693":"Setl",Setle:694,"694":"Setle",Setne:695,"695":"Setne",Setno:696,"696":"Setno",Setnp:697,"697":"Setnp",Setns:698,"698":"Setns",Seto:699,"699":"Seto",Setp:700,"700":"Setp",Sets:701,"701":"Sets",Setssbsy:702,"702":"Setssbsy",Sfence:703,"703":"Sfence",Sgdt:704,"704":"Sgdt",Sha1msg1:705,"705":"Sha1msg1",Sha1msg2:706,"706":"Sha1msg2",Sha1nexte:707,"707":"Sha1nexte",Sha1rnds4:708,"708":"Sha1rnds4",Sha256msg1:709,"709":"Sha256msg1",Sha256msg2:710,"710":"Sha256msg2",Sha256rnds2:711,"711":"Sha256rnds2",Shl:712,"712":"Shl",Shld:713,"713":"Shld",Shlx:714,"714":"Shlx",Shr:715,"715":"Shr",Shrd:716,"716":"Shrd",Shrx:717,"717":"Shrx",Shufpd:718,"718":"Shufpd",Shufps:719,"719":"Shufps",Sidt:720,"720":"Sidt",Skinit:721,"721":"Skinit",Sldt:722,"722":"Sldt",Slwpcb:723,"723":"Slwpcb",Smsw:724,"724":"Smsw",Sqrtpd:725,"725":"Sqrtpd",Sqrtps:726,"726":"Sqrtps",Sqrtsd:727,"727":"Sqrtsd",Sqrtss:728,"728":"Sqrtss",Stac:729,"729":"Stac",Stc:730,"730":"Stc",Std:731,"731":"Std",Stgi:732,"732":"Stgi",Sti:733,"733":"Sti",Stmxcsr:734,"734":"Stmxcsr",Stosb:735,"735":"Stosb",Stosd:736,"736":"Stosd",Stosq:737,"737":"Stosq",Stosw:738,"738":"Stosw",Str:739,"739":"Str",Sub:740,"740":"Sub",Subpd:741,"741":"Subpd",Subps:742,"742":"Subps",Subsd:743,"743":"Subsd",Subss:744,"744":"Subss",Swapgs:745,"745":"Swapgs",Syscall:746,"746":"Syscall",Sysenter:747,"747":"Sysenter",Sysexit:748,"748":"Sysexit",Sysret:749,"749":"Sysret",T1mskc:750,"750":"T1mskc",Test:751,"751":"Test",Tpause:752,"752":"Tpause",Tzcnt:753,"753":"Tzcnt",Tzmsk:754,"754":"Tzmsk",Ucomisd:755,"755":"Ucomisd",Ucomiss:756,"756":"Ucomiss",Ud0:757,"757":"Ud0",Ud1:758,"758":"Ud1",Ud2:759,"759":"Ud2",Umonitor:760,"760":"Umonitor",Umov:761,"761":"Umov",Umwait:762,"762":"Umwait",Unpckhpd:763,"763":"Unpckhpd",Unpckhps:764,"764":"Unpckhps",Unpcklpd:765,"765":"Unpcklpd",Unpcklps:766,"766":"Unpcklps",V4fmaddps:767,"767":"V4fmaddps",V4fmaddss:768,"768":"V4fmaddss",V4fnmaddps:769,"769":"V4fnmaddps",V4fnmaddss:770,"770":"V4fnmaddss",Vaddpd:771,"771":"Vaddpd",Vaddps:772,"772":"Vaddps",Vaddsd:773,"773":"Vaddsd",Vaddss:774,"774":"Vaddss",Vaddsubpd:775,"775":"Vaddsubpd",Vaddsubps:776,"776":"Vaddsubps",Vaesdec:777,"777":"Vaesdec",Vaesdeclast:778,"778":"Vaesdeclast",Vaesenc:779,"779":"Vaesenc",Vaesenclast:780,"780":"Vaesenclast",Vaesimc:781,"781":"Vaesimc",Vaeskeygenassist:782,"782":"Vaeskeygenassist",Valignd:783,"783":"Valignd",Valignq:784,"784":"Valignq",Vandnpd:785,"785":"Vandnpd",Vandnps:786,"786":"Vandnps",Vandpd:787,"787":"Vandpd",Vandps:788,"788":"Vandps",Vblendmpd:789,"789":"Vblendmpd",Vblendmps:790,"790":"Vblendmps",Vblendpd:791,"791":"Vblendpd",Vblendps:792,"792":"Vblendps",Vblendvpd:793,"793":"Vblendvpd",Vblendvps:794,"794":"Vblendvps",Vbroadcastf128:795,"795":"Vbroadcastf128",Vbroadcastf32x2:796,"796":"Vbroadcastf32x2",Vbroadcastf32x4:797,"797":"Vbroadcastf32x4",Vbroadcastf32x8:798,"798":"Vbroadcastf32x8",Vbroadcastf64x2:799,"799":"Vbroadcastf64x2",Vbroadcastf64x4:800,"800":"Vbroadcastf64x4",Vbroadcasti128:801,"801":"Vbroadcasti128",Vbroadcasti32x2:802,"802":"Vbroadcasti32x2",Vbroadcasti32x4:803,"803":"Vbroadcasti32x4",Vbroadcasti32x8:804,"804":"Vbroadcasti32x8",Vbroadcasti64x2:805,"805":"Vbroadcasti64x2",Vbroadcasti64x4:806,"806":"Vbroadcasti64x4",Vbroadcastsd:807,"807":"Vbroadcastsd",Vbroadcastss:808,"808":"Vbroadcastss",Vcmppd:809,"809":"Vcmppd",Vcmpps:810,"810":"Vcmpps",Vcmpsd:811,"811":"Vcmpsd",Vcmpss:812,"812":"Vcmpss",Vcomisd:813,"813":"Vcomisd",Vcomiss:814,"814":"Vcomiss",Vcompresspd:815,"815":"Vcompresspd",Vcompressps:816,"816":"Vcompressps",Vcvtdq2pd:817,"817":"Vcvtdq2pd",Vcvtdq2ps:818,"818":"Vcvtdq2ps",Vcvtne2ps2bf16:819,"819":"Vcvtne2ps2bf16",Vcvtneps2bf16:820,"820":"Vcvtneps2bf16",Vcvtpd2dq:821,"821":"Vcvtpd2dq",Vcvtpd2ps:822,"822":"Vcvtpd2ps",Vcvtpd2qq:823,"823":"Vcvtpd2qq",Vcvtpd2udq:824,"824":"Vcvtpd2udq",Vcvtpd2uqq:825,"825":"Vcvtpd2uqq",Vcvtph2ps:826,"826":"Vcvtph2ps",Vcvtps2dq:827,"827":"Vcvtps2dq",Vcvtps2pd:828,"828":"Vcvtps2pd",Vcvtps2ph:829,"829":"Vcvtps2ph",Vcvtps2qq:830,"830":"Vcvtps2qq",Vcvtps2udq:831,"831":"Vcvtps2udq",Vcvtps2uqq:832,"832":"Vcvtps2uqq",Vcvtqq2pd:833,"833":"Vcvtqq2pd",Vcvtqq2ps:834,"834":"Vcvtqq2ps",Vcvtsd2si:835,"835":"Vcvtsd2si",Vcvtsd2ss:836,"836":"Vcvtsd2ss",Vcvtsd2usi:837,"837":"Vcvtsd2usi",Vcvtsi2sd:838,"838":"Vcvtsi2sd",Vcvtsi2ss:839,"839":"Vcvtsi2ss",Vcvtss2sd:840,"840":"Vcvtss2sd",Vcvtss2si:841,"841":"Vcvtss2si",Vcvtss2usi:842,"842":"Vcvtss2usi",Vcvttpd2dq:843,"843":"Vcvttpd2dq",Vcvttpd2qq:844,"844":"Vcvttpd2qq",Vcvttpd2udq:845,"845":"Vcvttpd2udq",Vcvttpd2uqq:846,"846":"Vcvttpd2uqq",Vcvttps2dq:847,"847":"Vcvttps2dq",Vcvttps2qq:848,"848":"Vcvttps2qq",Vcvttps2udq:849,"849":"Vcvttps2udq",Vcvttps2uqq:850,"850":"Vcvttps2uqq",Vcvttsd2si:851,"851":"Vcvttsd2si",Vcvttsd2usi:852,"852":"Vcvttsd2usi",Vcvttss2si:853,"853":"Vcvttss2si",Vcvttss2usi:854,"854":"Vcvttss2usi",Vcvtudq2pd:855,"855":"Vcvtudq2pd",Vcvtudq2ps:856,"856":"Vcvtudq2ps",Vcvtuqq2pd:857,"857":"Vcvtuqq2pd",Vcvtuqq2ps:858,"858":"Vcvtuqq2ps",Vcvtusi2sd:859,"859":"Vcvtusi2sd",Vcvtusi2ss:860,"860":"Vcvtusi2ss",Vdbpsadbw:861,"861":"Vdbpsadbw",Vdivpd:862,"862":"Vdivpd",Vdivps:863,"863":"Vdivps",Vdivsd:864,"864":"Vdivsd",Vdivss:865,"865":"Vdivss",Vdpbf16ps:866,"866":"Vdpbf16ps",Vdppd:867,"867":"Vdppd",Vdpps:868,"868":"Vdpps",Verr:869,"869":"Verr",Verw:870,"870":"Verw",Vexp2pd:871,"871":"Vexp2pd",Vexp2ps:872,"872":"Vexp2ps",Vexpandpd:873,"873":"Vexpandpd",Vexpandps:874,"874":"Vexpandps",Vextractf128:875,"875":"Vextractf128",Vextractf32x4:876,"876":"Vextractf32x4",Vextractf32x8:877,"877":"Vextractf32x8",Vextractf64x2:878,"878":"Vextractf64x2",Vextractf64x4:879,"879":"Vextractf64x4",Vextracti128:880,"880":"Vextracti128",Vextracti32x4:881,"881":"Vextracti32x4",Vextracti32x8:882,"882":"Vextracti32x8",Vextracti64x2:883,"883":"Vextracti64x2",Vextracti64x4:884,"884":"Vextracti64x4",Vextractps:885,"885":"Vextractps",Vfixupimmpd:886,"886":"Vfixupimmpd",Vfixupimmps:887,"887":"Vfixupimmps",Vfixupimmsd:888,"888":"Vfixupimmsd",Vfixupimmss:889,"889":"Vfixupimmss",Vfmadd132pd:890,"890":"Vfmadd132pd",Vfmadd132ps:891,"891":"Vfmadd132ps",Vfmadd132sd:892,"892":"Vfmadd132sd",Vfmadd132ss:893,"893":"Vfmadd132ss",Vfmadd213pd:894,"894":"Vfmadd213pd",Vfmadd213ps:895,"895":"Vfmadd213ps",Vfmadd213sd:896,"896":"Vfmadd213sd",Vfmadd213ss:897,"897":"Vfmadd213ss",Vfmadd231pd:898,"898":"Vfmadd231pd",Vfmadd231ps:899,"899":"Vfmadd231ps",Vfmadd231sd:900,"900":"Vfmadd231sd",Vfmadd231ss:901,"901":"Vfmadd231ss",Vfmaddpd:902,"902":"Vfmaddpd",Vfmaddps:903,"903":"Vfmaddps",Vfmaddsd:904,"904":"Vfmaddsd",Vfmaddss:905,"905":"Vfmaddss",Vfmaddsub132pd:906,"906":"Vfmaddsub132pd",Vfmaddsub132ps:907,"907":"Vfmaddsub132ps",Vfmaddsub213pd:908,"908":"Vfmaddsub213pd",Vfmaddsub213ps:909,"909":"Vfmaddsub213ps",Vfmaddsub231pd:910,"910":"Vfmaddsub231pd",Vfmaddsub231ps:911,"911":"Vfmaddsub231ps",Vfmaddsubpd:912,"912":"Vfmaddsubpd",Vfmaddsubps:913,"913":"Vfmaddsubps",Vfmsub132pd:914,"914":"Vfmsub132pd",Vfmsub132ps:915,"915":"Vfmsub132ps",Vfmsub132sd:916,"916":"Vfmsub132sd",Vfmsub132ss:917,"917":"Vfmsub132ss",Vfmsub213pd:918,"918":"Vfmsub213pd",Vfmsub213ps:919,"919":"Vfmsub213ps",Vfmsub213sd:920,"920":"Vfmsub213sd",Vfmsub213ss:921,"921":"Vfmsub213ss",Vfmsub231pd:922,"922":"Vfmsub231pd",Vfmsub231ps:923,"923":"Vfmsub231ps",Vfmsub231sd:924,"924":"Vfmsub231sd",Vfmsub231ss:925,"925":"Vfmsub231ss",Vfmsubadd132pd:926,"926":"Vfmsubadd132pd",Vfmsubadd132ps:927,"927":"Vfmsubadd132ps",Vfmsubadd213pd:928,"928":"Vfmsubadd213pd",Vfmsubadd213ps:929,"929":"Vfmsubadd213ps",Vfmsubadd231pd:930,"930":"Vfmsubadd231pd",Vfmsubadd231ps:931,"931":"Vfmsubadd231ps",Vfmsubaddpd:932,"932":"Vfmsubaddpd",Vfmsubaddps:933,"933":"Vfmsubaddps",Vfmsubpd:934,"934":"Vfmsubpd",Vfmsubps:935,"935":"Vfmsubps",Vfmsubsd:936,"936":"Vfmsubsd",Vfmsubss:937,"937":"Vfmsubss",Vfnmadd132pd:938,"938":"Vfnmadd132pd",Vfnmadd132ps:939,"939":"Vfnmadd132ps",Vfnmadd132sd:940,"940":"Vfnmadd132sd",Vfnmadd132ss:941,"941":"Vfnmadd132ss",Vfnmadd213pd:942,"942":"Vfnmadd213pd",Vfnmadd213ps:943,"943":"Vfnmadd213ps",Vfnmadd213sd:944,"944":"Vfnmadd213sd",Vfnmadd213ss:945,"945":"Vfnmadd213ss",Vfnmadd231pd:946,"946":"Vfnmadd231pd",Vfnmadd231ps:947,"947":"Vfnmadd231ps",Vfnmadd231sd:948,"948":"Vfnmadd231sd",Vfnmadd231ss:949,"949":"Vfnmadd231ss",Vfnmaddpd:950,"950":"Vfnmaddpd",Vfnmaddps:951,"951":"Vfnmaddps",Vfnmaddsd:952,"952":"Vfnmaddsd",Vfnmaddss:953,"953":"Vfnmaddss",Vfnmsub132pd:954,"954":"Vfnmsub132pd",Vfnmsub132ps:955,"955":"Vfnmsub132ps",Vfnmsub132sd:956,"956":"Vfnmsub132sd",Vfnmsub132ss:957,"957":"Vfnmsub132ss",Vfnmsub213pd:958,"958":"Vfnmsub213pd",Vfnmsub213ps:959,"959":"Vfnmsub213ps",Vfnmsub213sd:960,"960":"Vfnmsub213sd",Vfnmsub213ss:961,"961":"Vfnmsub213ss",Vfnmsub231pd:962,"962":"Vfnmsub231pd",Vfnmsub231ps:963,"963":"Vfnmsub231ps",Vfnmsub231sd:964,"964":"Vfnmsub231sd",Vfnmsub231ss:965,"965":"Vfnmsub231ss",Vfnmsubpd:966,"966":"Vfnmsubpd",Vfnmsubps:967,"967":"Vfnmsubps",Vfnmsubsd:968,"968":"Vfnmsubsd",Vfnmsubss:969,"969":"Vfnmsubss",Vfpclasspd:970,"970":"Vfpclasspd",Vfpclassps:971,"971":"Vfpclassps",Vfpclasssd:972,"972":"Vfpclasssd",Vfpclassss:973,"973":"Vfpclassss",Vfrczpd:974,"974":"Vfrczpd",Vfrczps:975,"975":"Vfrczps",Vfrczsd:976,"976":"Vfrczsd",Vfrczss:977,"977":"Vfrczss",Vgatherdpd:978,"978":"Vgatherdpd",Vgatherdps:979,"979":"Vgatherdps",Vgatherpf0dpd:980,"980":"Vgatherpf0dpd",Vgatherpf0dps:981,"981":"Vgatherpf0dps",Vgatherpf0qpd:982,"982":"Vgatherpf0qpd",Vgatherpf0qps:983,"983":"Vgatherpf0qps",Vgatherpf1dpd:984,"984":"Vgatherpf1dpd",Vgatherpf1dps:985,"985":"Vgatherpf1dps",Vgatherpf1qpd:986,"986":"Vgatherpf1qpd",Vgatherpf1qps:987,"987":"Vgatherpf1qps",Vgatherqpd:988,"988":"Vgatherqpd",Vgatherqps:989,"989":"Vgatherqps",Vgetexppd:990,"990":"Vgetexppd",Vgetexpps:991,"991":"Vgetexpps",Vgetexpsd:992,"992":"Vgetexpsd",Vgetexpss:993,"993":"Vgetexpss",Vgetmantpd:994,"994":"Vgetmantpd",Vgetmantps:995,"995":"Vgetmantps",Vgetmantsd:996,"996":"Vgetmantsd",Vgetmantss:997,"997":"Vgetmantss",Vgf2p8affineinvqb:998,"998":"Vgf2p8affineinvqb",Vgf2p8affineqb:999,"999":"Vgf2p8affineqb",Vgf2p8mulb:1000,"1000":"Vgf2p8mulb",Vhaddpd:1001,"1001":"Vhaddpd",Vhaddps:1002,"1002":"Vhaddps",Vhsubpd:1003,"1003":"Vhsubpd",Vhsubps:1004,"1004":"Vhsubps",Vinsertf128:1005,"1005":"Vinsertf128",Vinsertf32x4:1006,"1006":"Vinsertf32x4",Vinsertf32x8:1007,"1007":"Vinsertf32x8",Vinsertf64x2:1008,"1008":"Vinsertf64x2",Vinsertf64x4:1009,"1009":"Vinsertf64x4",Vinserti128:1010,"1010":"Vinserti128",Vinserti32x4:1011,"1011":"Vinserti32x4",Vinserti32x8:1012,"1012":"Vinserti32x8",Vinserti64x2:1013,"1013":"Vinserti64x2",Vinserti64x4:1014,"1014":"Vinserti64x4",Vinsertps:1015,"1015":"Vinsertps",Vlddqu:1016,"1016":"Vlddqu",Vldmxcsr:1017,"1017":"Vldmxcsr",Vmaskmovdqu:1018,"1018":"Vmaskmovdqu",Vmaskmovpd:1019,"1019":"Vmaskmovpd",Vmaskmovps:1020,"1020":"Vmaskmovps",Vmaxpd:1021,"1021":"Vmaxpd",Vmaxps:1022,"1022":"Vmaxps",Vmaxsd:1023,"1023":"Vmaxsd",Vmaxss:1024,"1024":"Vmaxss",Vmcall:1025,"1025":"Vmcall",Vmclear:1026,"1026":"Vmclear",Vmfunc:1027,"1027":"Vmfunc",Vminpd:1028,"1028":"Vminpd",Vminps:1029,"1029":"Vminps",Vminsd:1030,"1030":"Vminsd",Vminss:1031,"1031":"Vminss",Vmlaunch:1032,"1032":"Vmlaunch",Vmload:1033,"1033":"Vmload",Vmmcall:1034,"1034":"Vmmcall",Vmovapd:1035,"1035":"Vmovapd",Vmovaps:1036,"1036":"Vmovaps",Vmovd:1037,"1037":"Vmovd",Vmovddup:1038,"1038":"Vmovddup",Vmovdqa:1039,"1039":"Vmovdqa",Vmovdqa32:1040,"1040":"Vmovdqa32",Vmovdqa64:1041,"1041":"Vmovdqa64",Vmovdqu:1042,"1042":"Vmovdqu",Vmovdqu16:1043,"1043":"Vmovdqu16",Vmovdqu32:1044,"1044":"Vmovdqu32",Vmovdqu64:1045,"1045":"Vmovdqu64",Vmovdqu8:1046,"1046":"Vmovdqu8",Vmovhlps:1047,"1047":"Vmovhlps",Vmovhpd:1048,"1048":"Vmovhpd",Vmovhps:1049,"1049":"Vmovhps",Vmovlhps:1050,"1050":"Vmovlhps",Vmovlpd:1051,"1051":"Vmovlpd",Vmovlps:1052,"1052":"Vmovlps",Vmovmskpd:1053,"1053":"Vmovmskpd",Vmovmskps:1054,"1054":"Vmovmskps",Vmovntdq:1055,"1055":"Vmovntdq",Vmovntdqa:1056,"1056":"Vmovntdqa",Vmovntpd:1057,"1057":"Vmovntpd",Vmovntps:1058,"1058":"Vmovntps",Vmovq:1059,"1059":"Vmovq",Vmovsd:1060,"1060":"Vmovsd",Vmovshdup:1061,"1061":"Vmovshdup",Vmovsldup:1062,"1062":"Vmovsldup",Vmovss:1063,"1063":"Vmovss",Vmovupd:1064,"1064":"Vmovupd",Vmovups:1065,"1065":"Vmovups",Vmpsadbw:1066,"1066":"Vmpsadbw",Vmptrld:1067,"1067":"Vmptrld",Vmptrst:1068,"1068":"Vmptrst",Vmread:1069,"1069":"Vmread",Vmresume:1070,"1070":"Vmresume",Vmrun:1071,"1071":"Vmrun",Vmsave:1072,"1072":"Vmsave",Vmulpd:1073,"1073":"Vmulpd",Vmulps:1074,"1074":"Vmulps",Vmulsd:1075,"1075":"Vmulsd",Vmulss:1076,"1076":"Vmulss",Vmwrite:1077,"1077":"Vmwrite",Vmxoff:1078,"1078":"Vmxoff",Vmxon:1079,"1079":"Vmxon",Vorpd:1080,"1080":"Vorpd",Vorps:1081,"1081":"Vorps",Vp2intersectd:1082,"1082":"Vp2intersectd",Vp2intersectq:1083,"1083":"Vp2intersectq",Vp4dpwssd:1084,"1084":"Vp4dpwssd",Vp4dpwssds:1085,"1085":"Vp4dpwssds",Vpabsb:1086,"1086":"Vpabsb",Vpabsd:1087,"1087":"Vpabsd",Vpabsq:1088,"1088":"Vpabsq",Vpabsw:1089,"1089":"Vpabsw",Vpackssdw:1090,"1090":"Vpackssdw",Vpacksswb:1091,"1091":"Vpacksswb",Vpackusdw:1092,"1092":"Vpackusdw",Vpackuswb:1093,"1093":"Vpackuswb",Vpaddb:1094,"1094":"Vpaddb",Vpaddd:1095,"1095":"Vpaddd",Vpaddq:1096,"1096":"Vpaddq",Vpaddsb:1097,"1097":"Vpaddsb",Vpaddsw:1098,"1098":"Vpaddsw",Vpaddusb:1099,"1099":"Vpaddusb",Vpaddusw:1100,"1100":"Vpaddusw",Vpaddw:1101,"1101":"Vpaddw",Vpalignr:1102,"1102":"Vpalignr",Vpand:1103,"1103":"Vpand",Vpandd:1104,"1104":"Vpandd",Vpandn:1105,"1105":"Vpandn",Vpandnd:1106,"1106":"Vpandnd",Vpandnq:1107,"1107":"Vpandnq",Vpandq:1108,"1108":"Vpandq",Vpavgb:1109,"1109":"Vpavgb",Vpavgw:1110,"1110":"Vpavgw",Vpblendd:1111,"1111":"Vpblendd",Vpblendmb:1112,"1112":"Vpblendmb",Vpblendmd:1113,"1113":"Vpblendmd",Vpblendmq:1114,"1114":"Vpblendmq",Vpblendmw:1115,"1115":"Vpblendmw",Vpblendvb:1116,"1116":"Vpblendvb",Vpblendw:1117,"1117":"Vpblendw",Vpbroadcastb:1118,"1118":"Vpbroadcastb",Vpbroadcastd:1119,"1119":"Vpbroadcastd",Vpbroadcastmb2q:1120,"1120":"Vpbroadcastmb2q",Vpbroadcastmw2d:1121,"1121":"Vpbroadcastmw2d",Vpbroadcastq:1122,"1122":"Vpbroadcastq",Vpbroadcastw:1123,"1123":"Vpbroadcastw",Vpclmulqdq:1124,"1124":"Vpclmulqdq",Vpcmov:1125,"1125":"Vpcmov",Vpcmpb:1126,"1126":"Vpcmpb",Vpcmpd:1127,"1127":"Vpcmpd",Vpcmpeqb:1128,"1128":"Vpcmpeqb",Vpcmpeqd:1129,"1129":"Vpcmpeqd",Vpcmpeqq:1130,"1130":"Vpcmpeqq",Vpcmpeqw:1131,"1131":"Vpcmpeqw",Vpcmpestri:1132,"1132":"Vpcmpestri",Vpcmpestri64:1133,"1133":"Vpcmpestri64",Vpcmpestrm:1134,"1134":"Vpcmpestrm",Vpcmpestrm64:1135,"1135":"Vpcmpestrm64",Vpcmpgtb:1136,"1136":"Vpcmpgtb",Vpcmpgtd:1137,"1137":"Vpcmpgtd",Vpcmpgtq:1138,"1138":"Vpcmpgtq",Vpcmpgtw:1139,"1139":"Vpcmpgtw",Vpcmpistri:1140,"1140":"Vpcmpistri",Vpcmpistrm:1141,"1141":"Vpcmpistrm",Vpcmpq:1142,"1142":"Vpcmpq",Vpcmpub:1143,"1143":"Vpcmpub",Vpcmpud:1144,"1144":"Vpcmpud",Vpcmpuq:1145,"1145":"Vpcmpuq",Vpcmpuw:1146,"1146":"Vpcmpuw",Vpcmpw:1147,"1147":"Vpcmpw",Vpcomb:1148,"1148":"Vpcomb",Vpcomd:1149,"1149":"Vpcomd",Vpcompressb:1150,"1150":"Vpcompressb",Vpcompressd:1151,"1151":"Vpcompressd",Vpcompressq:1152,"1152":"Vpcompressq",Vpcompressw:1153,"1153":"Vpcompressw",Vpcomq:1154,"1154":"Vpcomq",Vpcomub:1155,"1155":"Vpcomub",Vpcomud:1156,"1156":"Vpcomud",Vpcomuq:1157,"1157":"Vpcomuq",Vpcomuw:1158,"1158":"Vpcomuw",Vpcomw:1159,"1159":"Vpcomw",Vpconflictd:1160,"1160":"Vpconflictd",Vpconflictq:1161,"1161":"Vpconflictq",Vpdpbusd:1162,"1162":"Vpdpbusd",Vpdpbusds:1163,"1163":"Vpdpbusds",Vpdpwssd:1164,"1164":"Vpdpwssd",Vpdpwssds:1165,"1165":"Vpdpwssds",Vperm2f128:1166,"1166":"Vperm2f128",Vperm2i128:1167,"1167":"Vperm2i128",Vpermb:1168,"1168":"Vpermb",Vpermd:1169,"1169":"Vpermd",Vpermi2b:1170,"1170":"Vpermi2b",Vpermi2d:1171,"1171":"Vpermi2d",Vpermi2pd:1172,"1172":"Vpermi2pd",Vpermi2ps:1173,"1173":"Vpermi2ps",Vpermi2q:1174,"1174":"Vpermi2q",Vpermi2w:1175,"1175":"Vpermi2w",Vpermil2pd:1176,"1176":"Vpermil2pd",Vpermil2ps:1177,"1177":"Vpermil2ps",Vpermilpd:1178,"1178":"Vpermilpd",Vpermilps:1179,"1179":"Vpermilps",Vpermpd:1180,"1180":"Vpermpd",Vpermps:1181,"1181":"Vpermps",Vpermq:1182,"1182":"Vpermq",Vpermt2b:1183,"1183":"Vpermt2b",Vpermt2d:1184,"1184":"Vpermt2d",Vpermt2pd:1185,"1185":"Vpermt2pd",Vpermt2ps:1186,"1186":"Vpermt2ps",Vpermt2q:1187,"1187":"Vpermt2q",Vpermt2w:1188,"1188":"Vpermt2w",Vpermw:1189,"1189":"Vpermw",Vpexpandb:1190,"1190":"Vpexpandb",Vpexpandd:1191,"1191":"Vpexpandd",Vpexpandq:1192,"1192":"Vpexpandq",Vpexpandw:1193,"1193":"Vpexpandw",Vpextrb:1194,"1194":"Vpextrb",Vpextrd:1195,"1195":"Vpextrd",Vpextrq:1196,"1196":"Vpextrq",Vpextrw:1197,"1197":"Vpextrw",Vpgatherdd:1198,"1198":"Vpgatherdd",Vpgatherdq:1199,"1199":"Vpgatherdq",Vpgatherqd:1200,"1200":"Vpgatherqd",Vpgatherqq:1201,"1201":"Vpgatherqq",Vphaddbd:1202,"1202":"Vphaddbd",Vphaddbq:1203,"1203":"Vphaddbq",Vphaddbw:1204,"1204":"Vphaddbw",Vphaddd:1205,"1205":"Vphaddd",Vphadddq:1206,"1206":"Vphadddq",Vphaddsw:1207,"1207":"Vphaddsw",Vphaddubd:1208,"1208":"Vphaddubd",Vphaddubq:1209,"1209":"Vphaddubq",Vphaddubw:1210,"1210":"Vphaddubw",Vphaddudq:1211,"1211":"Vphaddudq",Vphadduwd:1212,"1212":"Vphadduwd",Vphadduwq:1213,"1213":"Vphadduwq",Vphaddw:1214,"1214":"Vphaddw",Vphaddwd:1215,"1215":"Vphaddwd",Vphaddwq:1216,"1216":"Vphaddwq",Vphminposuw:1217,"1217":"Vphminposuw",Vphsubbw:1218,"1218":"Vphsubbw",Vphsubd:1219,"1219":"Vphsubd",Vphsubdq:1220,"1220":"Vphsubdq",Vphsubsw:1221,"1221":"Vphsubsw",Vphsubw:1222,"1222":"Vphsubw",Vphsubwd:1223,"1223":"Vphsubwd",Vpinsrb:1224,"1224":"Vpinsrb",Vpinsrd:1225,"1225":"Vpinsrd",Vpinsrq:1226,"1226":"Vpinsrq",Vpinsrw:1227,"1227":"Vpinsrw",Vplzcntd:1228,"1228":"Vplzcntd",Vplzcntq:1229,"1229":"Vplzcntq",Vpmacsdd:1230,"1230":"Vpmacsdd",Vpmacsdqh:1231,"1231":"Vpmacsdqh",Vpmacsdql:1232,"1232":"Vpmacsdql",Vpmacssdd:1233,"1233":"Vpmacssdd",Vpmacssdqh:1234,"1234":"Vpmacssdqh",Vpmacssdql:1235,"1235":"Vpmacssdql",Vpmacsswd:1236,"1236":"Vpmacsswd",Vpmacssww:1237,"1237":"Vpmacssww",Vpmacswd:1238,"1238":"Vpmacswd",Vpmacsww:1239,"1239":"Vpmacsww",Vpmadcsswd:1240,"1240":"Vpmadcsswd",Vpmadcswd:1241,"1241":"Vpmadcswd",Vpmadd52huq:1242,"1242":"Vpmadd52huq",Vpmadd52luq:1243,"1243":"Vpmadd52luq",Vpmaddubsw:1244,"1244":"Vpmaddubsw",Vpmaddwd:1245,"1245":"Vpmaddwd",Vpmaskmovd:1246,"1246":"Vpmaskmovd",Vpmaskmovq:1247,"1247":"Vpmaskmovq",Vpmaxsb:1248,"1248":"Vpmaxsb",Vpmaxsd:1249,"1249":"Vpmaxsd",Vpmaxsq:1250,"1250":"Vpmaxsq",Vpmaxsw:1251,"1251":"Vpmaxsw",Vpmaxub:1252,"1252":"Vpmaxub",Vpmaxud:1253,"1253":"Vpmaxud",Vpmaxuq:1254,"1254":"Vpmaxuq",Vpmaxuw:1255,"1255":"Vpmaxuw",Vpminsb:1256,"1256":"Vpminsb",Vpminsd:1257,"1257":"Vpminsd",Vpminsq:1258,"1258":"Vpminsq",Vpminsw:1259,"1259":"Vpminsw",Vpminub:1260,"1260":"Vpminub",Vpminud:1261,"1261":"Vpminud",Vpminuq:1262,"1262":"Vpminuq",Vpminuw:1263,"1263":"Vpminuw",Vpmovb2m:1264,"1264":"Vpmovb2m",Vpmovd2m:1265,"1265":"Vpmovd2m",Vpmovdb:1266,"1266":"Vpmovdb",Vpmovdw:1267,"1267":"Vpmovdw",Vpmovm2b:1268,"1268":"Vpmovm2b",Vpmovm2d:1269,"1269":"Vpmovm2d",Vpmovm2q:1270,"1270":"Vpmovm2q",Vpmovm2w:1271,"1271":"Vpmovm2w",Vpmovmskb:1272,"1272":"Vpmovmskb",Vpmovq2m:1273,"1273":"Vpmovq2m",Vpmovqb:1274,"1274":"Vpmovqb",Vpmovqd:1275,"1275":"Vpmovqd",Vpmovqw:1276,"1276":"Vpmovqw",Vpmovsdb:1277,"1277":"Vpmovsdb",Vpmovsdw:1278,"1278":"Vpmovsdw",Vpmovsqb:1279,"1279":"Vpmovsqb",Vpmovsqd:1280,"1280":"Vpmovsqd",Vpmovsqw:1281,"1281":"Vpmovsqw",Vpmovswb:1282,"1282":"Vpmovswb",Vpmovsxbd:1283,"1283":"Vpmovsxbd",Vpmovsxbq:1284,"1284":"Vpmovsxbq",Vpmovsxbw:1285,"1285":"Vpmovsxbw",Vpmovsxdq:1286,"1286":"Vpmovsxdq",Vpmovsxwd:1287,"1287":"Vpmovsxwd",Vpmovsxwq:1288,"1288":"Vpmovsxwq",Vpmovusdb:1289,"1289":"Vpmovusdb",Vpmovusdw:1290,"1290":"Vpmovusdw",Vpmovusqb:1291,"1291":"Vpmovusqb",Vpmovusqd:1292,"1292":"Vpmovusqd",Vpmovusqw:1293,"1293":"Vpmovusqw",Vpmovuswb:1294,"1294":"Vpmovuswb",Vpmovw2m:1295,"1295":"Vpmovw2m",Vpmovwb:1296,"1296":"Vpmovwb",Vpmovzxbd:1297,"1297":"Vpmovzxbd",Vpmovzxbq:1298,"1298":"Vpmovzxbq",Vpmovzxbw:1299,"1299":"Vpmovzxbw",Vpmovzxdq:1300,"1300":"Vpmovzxdq",Vpmovzxwd:1301,"1301":"Vpmovzxwd",Vpmovzxwq:1302,"1302":"Vpmovzxwq",Vpmuldq:1303,"1303":"Vpmuldq",Vpmulhrsw:1304,"1304":"Vpmulhrsw",Vpmulhuw:1305,"1305":"Vpmulhuw",Vpmulhw:1306,"1306":"Vpmulhw",Vpmulld:1307,"1307":"Vpmulld",Vpmullq:1308,"1308":"Vpmullq",Vpmullw:1309,"1309":"Vpmullw",Vpmultishiftqb:1310,"1310":"Vpmultishiftqb",Vpmuludq:1311,"1311":"Vpmuludq",Vpopcntb:1312,"1312":"Vpopcntb",Vpopcntd:1313,"1313":"Vpopcntd",Vpopcntq:1314,"1314":"Vpopcntq",Vpopcntw:1315,"1315":"Vpopcntw",Vpor:1316,"1316":"Vpor",Vpord:1317,"1317":"Vpord",Vporq:1318,"1318":"Vporq",Vpperm:1319,"1319":"Vpperm",Vprold:1320,"1320":"Vprold",Vprolq:1321,"1321":"Vprolq",Vprolvd:1322,"1322":"Vprolvd",Vprolvq:1323,"1323":"Vprolvq",Vprord:1324,"1324":"Vprord",Vprorq:1325,"1325":"Vprorq",Vprorvd:1326,"1326":"Vprorvd",Vprorvq:1327,"1327":"Vprorvq",Vprotb:1328,"1328":"Vprotb",Vprotd:1329,"1329":"Vprotd",Vprotq:1330,"1330":"Vprotq",Vprotw:1331,"1331":"Vprotw",Vpsadbw:1332,"1332":"Vpsadbw",Vpscatterdd:1333,"1333":"Vpscatterdd",Vpscatterdq:1334,"1334":"Vpscatterdq",Vpscatterqd:1335,"1335":"Vpscatterqd",Vpscatterqq:1336,"1336":"Vpscatterqq",Vpshab:1337,"1337":"Vpshab",Vpshad:1338,"1338":"Vpshad",Vpshaq:1339,"1339":"Vpshaq",Vpshaw:1340,"1340":"Vpshaw",Vpshlb:1341,"1341":"Vpshlb",Vpshld:1342,"1342":"Vpshld",Vpshldd:1343,"1343":"Vpshldd",Vpshldq:1344,"1344":"Vpshldq",Vpshldvd:1345,"1345":"Vpshldvd",Vpshldvq:1346,"1346":"Vpshldvq",Vpshldvw:1347,"1347":"Vpshldvw",Vpshldw:1348,"1348":"Vpshldw",Vpshlq:1349,"1349":"Vpshlq",Vpshlw:1350,"1350":"Vpshlw",Vpshrdd:1351,"1351":"Vpshrdd",Vpshrdq:1352,"1352":"Vpshrdq",Vpshrdvd:1353,"1353":"Vpshrdvd",Vpshrdvq:1354,"1354":"Vpshrdvq",Vpshrdvw:1355,"1355":"Vpshrdvw",Vpshrdw:1356,"1356":"Vpshrdw",Vpshufb:1357,"1357":"Vpshufb",Vpshufbitqmb:1358,"1358":"Vpshufbitqmb",Vpshufd:1359,"1359":"Vpshufd",Vpshufhw:1360,"1360":"Vpshufhw",Vpshuflw:1361,"1361":"Vpshuflw",Vpsignb:1362,"1362":"Vpsignb",Vpsignd:1363,"1363":"Vpsignd",Vpsignw:1364,"1364":"Vpsignw",Vpslld:1365,"1365":"Vpslld",Vpslldq:1366,"1366":"Vpslldq",Vpsllq:1367,"1367":"Vpsllq",Vpsllvd:1368,"1368":"Vpsllvd",Vpsllvq:1369,"1369":"Vpsllvq",Vpsllvw:1370,"1370":"Vpsllvw",Vpsllw:1371,"1371":"Vpsllw",Vpsrad:1372,"1372":"Vpsrad",Vpsraq:1373,"1373":"Vpsraq",Vpsravd:1374,"1374":"Vpsravd",Vpsravq:1375,"1375":"Vpsravq",Vpsravw:1376,"1376":"Vpsravw",Vpsraw:1377,"1377":"Vpsraw",Vpsrld:1378,"1378":"Vpsrld",Vpsrldq:1379,"1379":"Vpsrldq",Vpsrlq:1380,"1380":"Vpsrlq",Vpsrlvd:1381,"1381":"Vpsrlvd",Vpsrlvq:1382,"1382":"Vpsrlvq",Vpsrlvw:1383,"1383":"Vpsrlvw",Vpsrlw:1384,"1384":"Vpsrlw",Vpsubb:1385,"1385":"Vpsubb",Vpsubd:1386,"1386":"Vpsubd",Vpsubq:1387,"1387":"Vpsubq",Vpsubsb:1388,"1388":"Vpsubsb",Vpsubsw:1389,"1389":"Vpsubsw",Vpsubusb:1390,"1390":"Vpsubusb",Vpsubusw:1391,"1391":"Vpsubusw",Vpsubw:1392,"1392":"Vpsubw",Vpternlogd:1393,"1393":"Vpternlogd",Vpternlogq:1394,"1394":"Vpternlogq",Vptest:1395,"1395":"Vptest",Vptestmb:1396,"1396":"Vptestmb",Vptestmd:1397,"1397":"Vptestmd",Vptestmq:1398,"1398":"Vptestmq",Vptestmw:1399,"1399":"Vptestmw",Vptestnmb:1400,"1400":"Vptestnmb",Vptestnmd:1401,"1401":"Vptestnmd",Vptestnmq:1402,"1402":"Vptestnmq",Vptestnmw:1403,"1403":"Vptestnmw",Vpunpckhbw:1404,"1404":"Vpunpckhbw",Vpunpckhdq:1405,"1405":"Vpunpckhdq",Vpunpckhqdq:1406,"1406":"Vpunpckhqdq",Vpunpckhwd:1407,"1407":"Vpunpckhwd",Vpunpcklbw:1408,"1408":"Vpunpcklbw",Vpunpckldq:1409,"1409":"Vpunpckldq",Vpunpcklqdq:1410,"1410":"Vpunpcklqdq",Vpunpcklwd:1411,"1411":"Vpunpcklwd",Vpxor:1412,"1412":"Vpxor",Vpxord:1413,"1413":"Vpxord",Vpxorq:1414,"1414":"Vpxorq",Vrangepd:1415,"1415":"Vrangepd",Vrangeps:1416,"1416":"Vrangeps",Vrangesd:1417,"1417":"Vrangesd",Vrangess:1418,"1418":"Vrangess",Vrcp14pd:1419,"1419":"Vrcp14pd",Vrcp14ps:1420,"1420":"Vrcp14ps",Vrcp14sd:1421,"1421":"Vrcp14sd",Vrcp14ss:1422,"1422":"Vrcp14ss",Vrcp28pd:1423,"1423":"Vrcp28pd",Vrcp28ps:1424,"1424":"Vrcp28ps",Vrcp28sd:1425,"1425":"Vrcp28sd",Vrcp28ss:1426,"1426":"Vrcp28ss",Vrcpps:1427,"1427":"Vrcpps",Vrcpss:1428,"1428":"Vrcpss",Vreducepd:1429,"1429":"Vreducepd",Vreduceps:1430,"1430":"Vreduceps",Vreducesd:1431,"1431":"Vreducesd",Vreducess:1432,"1432":"Vreducess",Vrndscalepd:1433,"1433":"Vrndscalepd",Vrndscaleps:1434,"1434":"Vrndscaleps",Vrndscalesd:1435,"1435":"Vrndscalesd",Vrndscaless:1436,"1436":"Vrndscaless",Vroundpd:1437,"1437":"Vroundpd",Vroundps:1438,"1438":"Vroundps",Vroundsd:1439,"1439":"Vroundsd",Vroundss:1440,"1440":"Vroundss",Vrsqrt14pd:1441,"1441":"Vrsqrt14pd",Vrsqrt14ps:1442,"1442":"Vrsqrt14ps",Vrsqrt14sd:1443,"1443":"Vrsqrt14sd",Vrsqrt14ss:1444,"1444":"Vrsqrt14ss",Vrsqrt28pd:1445,"1445":"Vrsqrt28pd",Vrsqrt28ps:1446,"1446":"Vrsqrt28ps",Vrsqrt28sd:1447,"1447":"Vrsqrt28sd",Vrsqrt28ss:1448,"1448":"Vrsqrt28ss",Vrsqrtps:1449,"1449":"Vrsqrtps",Vrsqrtss:1450,"1450":"Vrsqrtss",Vscalefpd:1451,"1451":"Vscalefpd",Vscalefps:1452,"1452":"Vscalefps",Vscalefsd:1453,"1453":"Vscalefsd",Vscalefss:1454,"1454":"Vscalefss",Vscatterdpd:1455,"1455":"Vscatterdpd",Vscatterdps:1456,"1456":"Vscatterdps",Vscatterpf0dpd:1457,"1457":"Vscatterpf0dpd",Vscatterpf0dps:1458,"1458":"Vscatterpf0dps",Vscatterpf0qpd:1459,"1459":"Vscatterpf0qpd",Vscatterpf0qps:1460,"1460":"Vscatterpf0qps",Vscatterpf1dpd:1461,"1461":"Vscatterpf1dpd",Vscatterpf1dps:1462,"1462":"Vscatterpf1dps",Vscatterpf1qpd:1463,"1463":"Vscatterpf1qpd",Vscatterpf1qps:1464,"1464":"Vscatterpf1qps",Vscatterqpd:1465,"1465":"Vscatterqpd",Vscatterqps:1466,"1466":"Vscatterqps",Vshuff32x4:1467,"1467":"Vshuff32x4",Vshuff64x2:1468,"1468":"Vshuff64x2",Vshufi32x4:1469,"1469":"Vshufi32x4",Vshufi64x2:1470,"1470":"Vshufi64x2",Vshufpd:1471,"1471":"Vshufpd",Vshufps:1472,"1472":"Vshufps",Vsqrtpd:1473,"1473":"Vsqrtpd",Vsqrtps:1474,"1474":"Vsqrtps",Vsqrtsd:1475,"1475":"Vsqrtsd",Vsqrtss:1476,"1476":"Vsqrtss",Vstmxcsr:1477,"1477":"Vstmxcsr",Vsubpd:1478,"1478":"Vsubpd",Vsubps:1479,"1479":"Vsubps",Vsubsd:1480,"1480":"Vsubsd",Vsubss:1481,"1481":"Vsubss",Vtestpd:1482,"1482":"Vtestpd",Vtestps:1483,"1483":"Vtestps",Vucomisd:1484,"1484":"Vucomisd",Vucomiss:1485,"1485":"Vucomiss",Vunpckhpd:1486,"1486":"Vunpckhpd",Vunpckhps:1487,"1487":"Vunpckhps",Vunpcklpd:1488,"1488":"Vunpcklpd",Vunpcklps:1489,"1489":"Vunpcklps",Vxorpd:1490,"1490":"Vxorpd",Vxorps:1491,"1491":"Vxorps",Vzeroall:1492,"1492":"Vzeroall",Vzeroupper:1493,"1493":"Vzeroupper",Wait:1494,"1494":"Wait",Wbinvd:1495,"1495":"Wbinvd",Wbnoinvd:1496,"1496":"Wbnoinvd",Wrfsbase:1497,"1497":"Wrfsbase",Wrgsbase:1498,"1498":"Wrgsbase",Wrmsr:1499,"1499":"Wrmsr",Wrpkru:1500,"1500":"Wrpkru",Wrssd:1501,"1501":"Wrssd",Wrssq:1502,"1502":"Wrssq",Wrussd:1503,"1503":"Wrussd",Wrussq:1504,"1504":"Wrussq",Xabort:1505,"1505":"Xabort",Xadd:1506,"1506":"Xadd",Xbegin:1507,"1507":"Xbegin",Xbts:1508,"1508":"Xbts",Xchg:1509,"1509":"Xchg",Xcryptcbc:1510,"1510":"Xcryptcbc",Xcryptcfb:1511,"1511":"Xcryptcfb",Xcryptctr:1512,"1512":"Xcryptctr",Xcryptecb:1513,"1513":"Xcryptecb",Xcryptofb:1514,"1514":"Xcryptofb",Xend:1515,"1515":"Xend",Xgetbv:1516,"1516":"Xgetbv",Xlatb:1517,"1517":"Xlatb",Xor:1518,"1518":"Xor",Xorpd:1519,"1519":"Xorpd",Xorps:1520,"1520":"Xorps",Xrstor:1521,"1521":"Xrstor",Xrstor64:1522,"1522":"Xrstor64",Xrstors:1523,"1523":"Xrstors",Xrstors64:1524,"1524":"Xrstors64",Xsave:1525,"1525":"Xsave",Xsave64:1526,"1526":"Xsave64",Xsavec:1527,"1527":"Xsavec",Xsavec64:1528,"1528":"Xsavec64",Xsaveopt:1529,"1529":"Xsaveopt",Xsaveopt64:1530,"1530":"Xsaveopt64",Xsaves:1531,"1531":"Xsaves",Xsaves64:1532,"1532":"Xsaves64",Xsetbv:1533,"1533":"Xsetbv",Xsha1:1534,"1534":"Xsha1",Xsha256:1535,"1535":"Xsha256",Xstore:1536,"1536":"Xstore",Xtest:1537,"1537":"Xtest",Rmpadjust:1538,"1538":"Rmpadjust",Rmpupdate:1539,"1539":"Rmpupdate",Psmash:1540,"1540":"Psmash",Pvalidate:1541,"1541":"Pvalidate",Serialize:1542,"1542":"Serialize",Xsusldtrk:1543,"1543":"Xsusldtrk",Xresldtrk:1544,"1544":"Xresldtrk",Invlpgb:1545,"1545":"Invlpgb",Tlbsync:1546,"1546":"Tlbsync",Vmgexit:1547,"1547":"Vmgexit",Getsecq:1548,"1548":"Getsecq",Sysexitq:1549,"1549":"Sysexitq",Ldtilecfg:1550,"1550":"Ldtilecfg",Tilerelease:1551,"1551":"Tilerelease",Sttilecfg:1552,"1552":"Sttilecfg",Tilezero:1553,"1553":"Tilezero",Tileloaddt1:1554,"1554":"Tileloaddt1",Tilestored:1555,"1555":"Tilestored",Tileloadd:1556,"1556":"Tileloadd",Tdpbf16ps:1557,"1557":"Tdpbf16ps",Tdpbuud:1558,"1558":"Tdpbuud",Tdpbusd:1559,"1559":"Tdpbusd",Tdpbsud:1560,"1560":"Tdpbsud",Tdpbssd:1561,"1561":"Tdpbssd",Sysretq:1562,"1562":"Sysretq",Fnstdw:1563,"1563":"Fnstdw",Fnstsg:1564,"1564":"Fnstsg",Rdshr:1565,"1565":"Rdshr",Wrshr:1566,"1566":"Wrshr",Smint:1567,"1567":"Smint",Dmint:1568,"1568":"Dmint",Rdm:1569,"1569":"Rdm",Svdc:1570,"1570":"Svdc",Rsdc:1571,"1571":"Rsdc",Svldt:1572,"1572":"Svldt",Rsldt:1573,"1573":"Rsldt",Svts:1574,"1574":"Svts",Rsts:1575,"1575":"Rsts",Bb0_reset:1576,"1576":"Bb0_reset",Bb1_reset:1577,"1577":"Bb1_reset",Cpu_write:1578,"1578":"Cpu_write",Cpu_read:1579,"1579":"Cpu_read",Altinst:1580,"1580":"Altinst",Paveb:1581,"1581":"Paveb",Paddsiw:1582,"1582":"Paddsiw",Pmagw:1583,"1583":"Pmagw",Pdistib:1584,"1584":"Pdistib",Psubsiw:1585,"1585":"Psubsiw",Pmvzb:1586,"1586":"Pmvzb",Pmvnzb:1587,"1587":"Pmvnzb",Pmvlzb:1588,"1588":"Pmvlzb",Pmvgezb:1589,"1589":"Pmvgezb",Pmulhriw:1590,"1590":"Pmulhriw",Pmachriw:1591,"1591":"Pmachriw",Ftstp:1592,"1592":"Ftstp",Frint2:1593,"1593":"Frint2",Frichop:1594,"1594":"Frichop",Frinear:1595,"1595":"Frinear",Undoc:1596,"1596":"Undoc",Tdcall:1597,"1597":"Tdcall",Seamret:1598,"1598":"Seamret",Seamops:1599,"1599":"Seamops",Seamcall:1600,"1600":"Seamcall",Aesencwide128kl:1601,"1601":"Aesencwide128kl",Aesdecwide128kl:1602,"1602":"Aesdecwide128kl",Aesencwide256kl:1603,"1603":"Aesencwide256kl",Aesdecwide256kl:1604,"1604":"Aesdecwide256kl",Loadiwkey:1605,"1605":"Loadiwkey",Aesenc128kl:1606,"1606":"Aesenc128kl",Aesdec128kl:1607,"1607":"Aesdec128kl",Aesenc256kl:1608,"1608":"Aesenc256kl",Aesdec256kl:1609,"1609":"Aesdec256kl",Encodekey128:1610,"1610":"Encodekey128",Encodekey256:1611,"1611":"Encodekey256",Pushad:1612,"1612":"Pushad",Popad:1613,"1613":"Popad",Pushfd:1614,"1614":"Pushfd",Pushfq:1615,"1615":"Pushfq",Popfd:1616,"1616":"Popfd",Popfq:1617,"1617":"Popfq",Iretd:1618,"1618":"Iretd",Iretq:1619,"1619":"Iretq",Int3:1620,"1620":"Int3",Uiret:1621,"1621":"Uiret",Testui:1622,"1622":"Testui",Clui:1623,"1623":"Clui",Stui:1624,"1624":"Stui",Senduipi:1625,"1625":"Senduipi",Hreset:1626,"1626":"Hreset",Ccs_hash:1627,"1627":"Ccs_hash",Ccs_encrypt:1628,"1628":"Ccs_encrypt",Lkgs:1629,"1629":"Lkgs",Eretu:1630,"1630":"Eretu",Erets:1631,"1631":"Erets",Storeall:1632,"1632":"Storeall",Vaddph:1633,"1633":"Vaddph",Vaddsh:1634,"1634":"Vaddsh",Vcmpph:1635,"1635":"Vcmpph",Vcmpsh:1636,"1636":"Vcmpsh",Vcomish:1637,"1637":"Vcomish",Vcvtdq2ph:1638,"1638":"Vcvtdq2ph",Vcvtpd2ph:1639,"1639":"Vcvtpd2ph",Vcvtph2dq:1640,"1640":"Vcvtph2dq",Vcvtph2pd:1641,"1641":"Vcvtph2pd",Vcvtph2psx:1642,"1642":"Vcvtph2psx",Vcvtph2qq:1643,"1643":"Vcvtph2qq",Vcvtph2udq:1644,"1644":"Vcvtph2udq",Vcvtph2uqq:1645,"1645":"Vcvtph2uqq",Vcvtph2uw:1646,"1646":"Vcvtph2uw",Vcvtph2w:1647,"1647":"Vcvtph2w",Vcvtps2phx:1648,"1648":"Vcvtps2phx",Vcvtqq2ph:1649,"1649":"Vcvtqq2ph",Vcvtsd2sh:1650,"1650":"Vcvtsd2sh",Vcvtsh2sd:1651,"1651":"Vcvtsh2sd",Vcvtsh2si:1652,"1652":"Vcvtsh2si",Vcvtsh2ss:1653,"1653":"Vcvtsh2ss",Vcvtsh2usi:1654,"1654":"Vcvtsh2usi",Vcvtsi2sh:1655,"1655":"Vcvtsi2sh",Vcvtss2sh:1656,"1656":"Vcvtss2sh",Vcvttph2dq:1657,"1657":"Vcvttph2dq",Vcvttph2qq:1658,"1658":"Vcvttph2qq",Vcvttph2udq:1659,"1659":"Vcvttph2udq",Vcvttph2uqq:1660,"1660":"Vcvttph2uqq",Vcvttph2uw:1661,"1661":"Vcvttph2uw",Vcvttph2w:1662,"1662":"Vcvttph2w",Vcvttsh2si:1663,"1663":"Vcvttsh2si",Vcvttsh2usi:1664,"1664":"Vcvttsh2usi",Vcvtudq2ph:1665,"1665":"Vcvtudq2ph",Vcvtuqq2ph:1666,"1666":"Vcvtuqq2ph",Vcvtusi2sh:1667,"1667":"Vcvtusi2sh",Vcvtuw2ph:1668,"1668":"Vcvtuw2ph",Vcvtw2ph:1669,"1669":"Vcvtw2ph",Vdivph:1670,"1670":"Vdivph",Vdivsh:1671,"1671":"Vdivsh",Vfcmaddcph:1672,"1672":"Vfcmaddcph",Vfmaddcph:1673,"1673":"Vfmaddcph",Vfcmaddcsh:1674,"1674":"Vfcmaddcsh",Vfmaddcsh:1675,"1675":"Vfmaddcsh",Vfcmulcph:1676,"1676":"Vfcmulcph",Vfmulcph:1677,"1677":"Vfmulcph",Vfcmulcsh:1678,"1678":"Vfcmulcsh",Vfmulcsh:1679,"1679":"Vfmulcsh",Vfmaddsub132ph:1680,"1680":"Vfmaddsub132ph",Vfmaddsub213ph:1681,"1681":"Vfmaddsub213ph",Vfmaddsub231ph:1682,"1682":"Vfmaddsub231ph",Vfmsubadd132ph:1683,"1683":"Vfmsubadd132ph",Vfmsubadd213ph:1684,"1684":"Vfmsubadd213ph",Vfmsubadd231ph:1685,"1685":"Vfmsubadd231ph",Vfmadd132ph:1686,"1686":"Vfmadd132ph",Vfmadd213ph:1687,"1687":"Vfmadd213ph",Vfmadd231ph:1688,"1688":"Vfmadd231ph",Vfnmadd132ph:1689,"1689":"Vfnmadd132ph",Vfnmadd213ph:1690,"1690":"Vfnmadd213ph",Vfnmadd231ph:1691,"1691":"Vfnmadd231ph",Vfmadd132sh:1692,"1692":"Vfmadd132sh",Vfmadd213sh:1693,"1693":"Vfmadd213sh",Vfmadd231sh:1694,"1694":"Vfmadd231sh",Vfnmadd132sh:1695,"1695":"Vfnmadd132sh",Vfnmadd213sh:1696,"1696":"Vfnmadd213sh",Vfnmadd231sh:1697,"1697":"Vfnmadd231sh",Vfmsub132ph:1698,"1698":"Vfmsub132ph",Vfmsub213ph:1699,"1699":"Vfmsub213ph",Vfmsub231ph:1700,"1700":"Vfmsub231ph",Vfnmsub132ph:1701,"1701":"Vfnmsub132ph",Vfnmsub213ph:1702,"1702":"Vfnmsub213ph",Vfnmsub231ph:1703,"1703":"Vfnmsub231ph",Vfmsub132sh:1704,"1704":"Vfmsub132sh",Vfmsub213sh:1705,"1705":"Vfmsub213sh",Vfmsub231sh:1706,"1706":"Vfmsub231sh",Vfnmsub132sh:1707,"1707":"Vfnmsub132sh",Vfnmsub213sh:1708,"1708":"Vfnmsub213sh",Vfnmsub231sh:1709,"1709":"Vfnmsub231sh",Vfpclassph:1710,"1710":"Vfpclassph",Vfpclasssh:1711,"1711":"Vfpclasssh",Vgetexpph:1712,"1712":"Vgetexpph",Vgetexpsh:1713,"1713":"Vgetexpsh",Vgetmantph:1714,"1714":"Vgetmantph",Vgetmantsh:1715,"1715":"Vgetmantsh",Vmaxph:1716,"1716":"Vmaxph",Vmaxsh:1717,"1717":"Vmaxsh",Vminph:1718,"1718":"Vminph",Vminsh:1719,"1719":"Vminsh",Vmovsh:1720,"1720":"Vmovsh",Vmovw:1721,"1721":"Vmovw",Vmulph:1722,"1722":"Vmulph",Vmulsh:1723,"1723":"Vmulsh",Vrcpph:1724,"1724":"Vrcpph",Vrcpsh:1725,"1725":"Vrcpsh",Vreduceph:1726,"1726":"Vreduceph",Vreducesh:1727,"1727":"Vreducesh",Vrndscaleph:1728,"1728":"Vrndscaleph",Vrndscalesh:1729,"1729":"Vrndscalesh",Vrsqrtph:1730,"1730":"Vrsqrtph",Vrsqrtsh:1731,"1731":"Vrsqrtsh",Vscalefph:1732,"1732":"Vscalefph",Vscalefsh:1733,"1733":"Vscalefsh",Vsqrtph:1734,"1734":"Vsqrtph",Vsqrtsh:1735,"1735":"Vsqrtsh",Vsubph:1736,"1736":"Vsubph",Vsubsh:1737,"1737":"Vsubsh",Vucomish:1738,"1738":"Vucomish",Rdudbg:1739,"1739":"Rdudbg",Wrudbg:1740,"1740":"Wrudbg",Clevict0:1741,"1741":"Clevict0",Clevict1:1742,"1742":"Clevict1",Delay:1743,"1743":"Delay",Jknzd:1744,"1744":"Jknzd",Jkzd:1745,"1745":"Jkzd",Kand:1746,"1746":"Kand",Kandn:1747,"1747":"Kandn",Kandnr:1748,"1748":"Kandnr",Kconcath:1749,"1749":"Kconcath",Kconcatl:1750,"1750":"Kconcatl",Kextract:1751,"1751":"Kextract",Kmerge2l1h:1752,"1752":"Kmerge2l1h",Kmerge2l1l:1753,"1753":"Kmerge2l1l",Kmov:1754,"1754":"Kmov",Knot:1755,"1755":"Knot",Kor:1756,"1756":"Kor",Kortest:1757,"1757":"Kortest",Kxnor:1758,"1758":"Kxnor",Kxor:1759,"1759":"Kxor",Spflt:1760,"1760":"Spflt",Tzcnti:1761,"1761":"Tzcnti",Vaddnpd:1762,"1762":"Vaddnpd",Vaddnps:1763,"1763":"Vaddnps",Vaddsetsps:1764,"1764":"Vaddsetsps",Vcvtfxpntdq2ps:1765,"1765":"Vcvtfxpntdq2ps",Vcvtfxpntpd2dq:1766,"1766":"Vcvtfxpntpd2dq",Vcvtfxpntpd2udq:1767,"1767":"Vcvtfxpntpd2udq",Vcvtfxpntps2dq:1768,"1768":"Vcvtfxpntps2dq",Vcvtfxpntps2udq:1769,"1769":"Vcvtfxpntps2udq",Vcvtfxpntudq2ps:1770,"1770":"Vcvtfxpntudq2ps",Vexp223ps:1771,"1771":"Vexp223ps",Vfixupnanpd:1772,"1772":"Vfixupnanpd",Vfixupnanps:1773,"1773":"Vfixupnanps",Vfmadd233ps:1774,"1774":"Vfmadd233ps",Vgatherpf0hintdpd:1775,"1775":"Vgatherpf0hintdpd",Vgatherpf0hintdps:1776,"1776":"Vgatherpf0hintdps",Vgmaxabsps:1777,"1777":"Vgmaxabsps",Vgmaxpd:1778,"1778":"Vgmaxpd",Vgmaxps:1779,"1779":"Vgmaxps",Vgminpd:1780,"1780":"Vgminpd",Vgminps:1781,"1781":"Vgminps",Vloadunpackhd:1782,"1782":"Vloadunpackhd",Vloadunpackhpd:1783,"1783":"Vloadunpackhpd",Vloadunpackhps:1784,"1784":"Vloadunpackhps",Vloadunpackhq:1785,"1785":"Vloadunpackhq",Vloadunpackld:1786,"1786":"Vloadunpackld",Vloadunpacklpd:1787,"1787":"Vloadunpacklpd",Vloadunpacklps:1788,"1788":"Vloadunpacklps",Vloadunpacklq:1789,"1789":"Vloadunpacklq",Vlog2ps:1790,"1790":"Vlog2ps",Vmovnrapd:1791,"1791":"Vmovnrapd",Vmovnraps:1792,"1792":"Vmovnraps",Vmovnrngoapd:1793,"1793":"Vmovnrngoapd",Vmovnrngoaps:1794,"1794":"Vmovnrngoaps",Vpackstorehd:1795,"1795":"Vpackstorehd",Vpackstorehpd:1796,"1796":"Vpackstorehpd",Vpackstorehps:1797,"1797":"Vpackstorehps",Vpackstorehq:1798,"1798":"Vpackstorehq",Vpackstoreld:1799,"1799":"Vpackstoreld",Vpackstorelpd:1800,"1800":"Vpackstorelpd",Vpackstorelps:1801,"1801":"Vpackstorelps",Vpackstorelq:1802,"1802":"Vpackstorelq",Vpadcd:1803,"1803":"Vpadcd",Vpaddsetcd:1804,"1804":"Vpaddsetcd",Vpaddsetsd:1805,"1805":"Vpaddsetsd",Vpcmpltd:1806,"1806":"Vpcmpltd",Vpermf32x4:1807,"1807":"Vpermf32x4",Vpmadd231d:1808,"1808":"Vpmadd231d",Vpmadd233d:1809,"1809":"Vpmadd233d",Vpmulhd:1810,"1810":"Vpmulhd",Vpmulhud:1811,"1811":"Vpmulhud",Vprefetch0:1812,"1812":"Vprefetch0",Vprefetch1:1813,"1813":"Vprefetch1",Vprefetch2:1814,"1814":"Vprefetch2",Vprefetche0:1815,"1815":"Vprefetche0",Vprefetche1:1816,"1816":"Vprefetche1",Vprefetche2:1817,"1817":"Vprefetche2",Vprefetchenta:1818,"1818":"Vprefetchenta",Vprefetchnta:1819,"1819":"Vprefetchnta",Vpsbbd:1820,"1820":"Vpsbbd",Vpsbbrd:1821,"1821":"Vpsbbrd",Vpsubrd:1822,"1822":"Vpsubrd",Vpsubrsetbd:1823,"1823":"Vpsubrsetbd",Vpsubsetbd:1824,"1824":"Vpsubsetbd",Vrcp23ps:1825,"1825":"Vrcp23ps",Vrndfxpntpd:1826,"1826":"Vrndfxpntpd",Vrndfxpntps:1827,"1827":"Vrndfxpntps",Vrsqrt23ps:1828,"1828":"Vrsqrt23ps",Vscaleps:1829,"1829":"Vscaleps",Vscatterpf0hintdpd:1830,"1830":"Vscatterpf0hintdpd",Vscatterpf0hintdps:1831,"1831":"Vscatterpf0hintdps",Vsubrpd:1832,"1832":"Vsubrpd",Vsubrps:1833,"1833":"Vsubrps",Xsha512:1834,"1834":"Xsha512",Xstore_alt:1835,"1835":"Xstore_alt",Xsha512_alt:1836,"1836":"Xsha512_alt",Zero_bytes:1837,"1837":"Zero_bytes",Aadd:1838,"1838":"Aadd",Aand:1839,"1839":"Aand",Aor:1840,"1840":"Aor",Axor:1841,"1841":"Axor",Cmpbexadd:1842,"1842":"Cmpbexadd",Cmpbxadd:1843,"1843":"Cmpbxadd",Cmplexadd:1844,"1844":"Cmplexadd",Cmplxadd:1845,"1845":"Cmplxadd",Cmpnbexadd:1846,"1846":"Cmpnbexadd",Cmpnbxadd:1847,"1847":"Cmpnbxadd",Cmpnlexadd:1848,"1848":"Cmpnlexadd",Cmpnlxadd:1849,"1849":"Cmpnlxadd",Cmpnoxadd:1850,"1850":"Cmpnoxadd",Cmpnpxadd:1851,"1851":"Cmpnpxadd",Cmpnsxadd:1852,"1852":"Cmpnsxadd",Cmpnzxadd:1853,"1853":"Cmpnzxadd",Cmpoxadd:1854,"1854":"Cmpoxadd",Cmppxadd:1855,"1855":"Cmppxadd",Cmpsxadd:1856,"1856":"Cmpsxadd",Cmpzxadd:1857,"1857":"Cmpzxadd",Prefetchit0:1858,"1858":"Prefetchit0",Prefetchit1:1859,"1859":"Prefetchit1",Rdmsrlist:1860,"1860":"Rdmsrlist",Rmpquery:1861,"1861":"Rmpquery",Tdpfp16ps:1862,"1862":"Tdpfp16ps",Vbcstnebf162ps:1863,"1863":"Vbcstnebf162ps",Vbcstnesh2ps:1864,"1864":"Vbcstnesh2ps",Vcvtneebf162ps:1865,"1865":"Vcvtneebf162ps",Vcvtneeph2ps:1866,"1866":"Vcvtneeph2ps",Vcvtneobf162ps:1867,"1867":"Vcvtneobf162ps",Vcvtneoph2ps:1868,"1868":"Vcvtneoph2ps",Vpdpbssd:1869,"1869":"Vpdpbssd",Vpdpbssds:1870,"1870":"Vpdpbssds",Vpdpbsud:1871,"1871":"Vpdpbsud",Vpdpbsuds:1872,"1872":"Vpdpbsuds",Vpdpbuud:1873,"1873":"Vpdpbuud",Vpdpbuuds:1874,"1874":"Vpdpbuuds",Wrmsrlist:1875,"1875":"Wrmsrlist",Wrmsrns:1876,"1876":"Wrmsrns",Tcmmrlfp16ps:1877,"1877":"Tcmmrlfp16ps",Tcmmimfp16ps:1878,"1878":"Tcmmimfp16ps",Pbndkb:1879,"1879":"Pbndkb",Vpdpwsud:1880,"1880":"Vpdpwsud",Vpdpwsuds:1881,"1881":"Vpdpwsuds",Vpdpwusd:1882,"1882":"Vpdpwusd",Vpdpwusds:1883,"1883":"Vpdpwusds",Vpdpwuud:1884,"1884":"Vpdpwuud",Vpdpwuuds:1885,"1885":"Vpdpwuuds",Vsha512msg1:1886,"1886":"Vsha512msg1",Vsha512msg2:1887,"1887":"Vsha512msg2",Vsha512rnds2:1888,"1888":"Vsha512rnds2",Vsm3msg1:1889,"1889":"Vsm3msg1",Vsm3msg2:1890,"1890":"Vsm3msg2",Vsm3rnds2:1891,"1891":"Vsm3rnds2",Vsm4key4:1892,"1892":"Vsm4key4",Vsm4rnds4:1893,"1893":"Vsm4rnds4", });
/**
* Mnemonic condition code selector (eg. `JLE` / `JNG`)
*/
__exports.CC_le = Object.freeze({
/**
* `JLE`, `CMOVLE`, `SETLE`
*/
le:0,"0":"le",
/**
* `JNG`, `CMOVNG`, `SETNG`
*/
ng:1,"1":"ng", });
/**
* Mnemonic condition code selector (eg. `JA` / `JNBE`)
*/
__exports.CC_a = Object.freeze({
/**
* `JA`, `CMOVA`, `SETA`
*/
a:0,"0":"a",
/**
* `JNBE`, `CMOVNBE`, `SETNBE`
*/
nbe:1,"1":"nbe", });
/**
* x86 instruction code
*/
__exports.Code = Object.freeze({ INVALID:0,"0":"INVALID",DeclareByte:1,"1":"DeclareByte",DeclareWord:2,"2":"DeclareWord",DeclareDword:3,"3":"DeclareDword",DeclareQword:4,"4":"DeclareQword",Add_rm8_r8:5,"5":"Add_rm8_r8",Add_rm16_r16:6,"6":"Add_rm16_r16",Add_rm32_r32:7,"7":"Add_rm32_r32",Add_rm64_r64:8,"8":"Add_rm64_r64",Add_r8_rm8:9,"9":"Add_r8_rm8",Add_r16_rm16:10,"10":"Add_r16_rm16",Add_r32_rm32:11,"11":"Add_r32_rm32",Add_r64_rm64:12,"12":"Add_r64_rm64",Add_AL_imm8:13,"13":"Add_AL_imm8",Add_AX_imm16:14,"14":"Add_AX_imm16",Add_EAX_imm32:15,"15":"Add_EAX_imm32",Add_RAX_imm32:16,"16":"Add_RAX_imm32",Pushw_ES:17,"17":"Pushw_ES",Pushd_ES:18,"18":"Pushd_ES",Popw_ES:19,"19":"Popw_ES",Popd_ES:20,"20":"Popd_ES",Or_rm8_r8:21,"21":"Or_rm8_r8",Or_rm16_r16:22,"22":"Or_rm16_r16",Or_rm32_r32:23,"23":"Or_rm32_r32",Or_rm64_r64:24,"24":"Or_rm64_r64",Or_r8_rm8:25,"25":"Or_r8_rm8",Or_r16_rm16:26,"26":"Or_r16_rm16",Or_r32_rm32:27,"27":"Or_r32_rm32",Or_r64_rm64:28,"28":"Or_r64_rm64",Or_AL_imm8:29,"29":"Or_AL_imm8",Or_AX_imm16:30,"30":"Or_AX_imm16",Or_EAX_imm32:31,"31":"Or_EAX_imm32",Or_RAX_imm32:32,"32":"Or_RAX_imm32",Pushw_CS:33,"33":"Pushw_CS",Pushd_CS:34,"34":"Pushd_CS",Popw_CS:35,"35":"Popw_CS",Adc_rm8_r8:36,"36":"Adc_rm8_r8",Adc_rm16_r16:37,"37":"Adc_rm16_r16",Adc_rm32_r32:38,"38":"Adc_rm32_r32",Adc_rm64_r64:39,"39":"Adc_rm64_r64",Adc_r8_rm8:40,"40":"Adc_r8_rm8",Adc_r16_rm16:41,"41":"Adc_r16_rm16",Adc_r32_rm32:42,"42":"Adc_r32_rm32",Adc_r64_rm64:43,"43":"Adc_r64_rm64",Adc_AL_imm8:44,"44":"Adc_AL_imm8",Adc_AX_imm16:45,"45":"Adc_AX_imm16",Adc_EAX_imm32:46,"46":"Adc_EAX_imm32",Adc_RAX_imm32:47,"47":"Adc_RAX_imm32",Pushw_SS:48,"48":"Pushw_SS",Pushd_SS:49,"49":"Pushd_SS",Popw_SS:50,"50":"Popw_SS",Popd_SS:51,"51":"Popd_SS",Sbb_rm8_r8:52,"52":"Sbb_rm8_r8",Sbb_rm16_r16:53,"53":"Sbb_rm16_r16",Sbb_rm32_r32:54,"54":"Sbb_rm32_r32",Sbb_rm64_r64:55,"55":"Sbb_rm64_r64",Sbb_r8_rm8:56,"56":"Sbb_r8_rm8",Sbb_r16_rm16:57,"57":"Sbb_r16_rm16",Sbb_r32_rm32:58,"58":"Sbb_r32_rm32",Sbb_r64_rm64:59,"59":"Sbb_r64_rm64",Sbb_AL_imm8:60,"60":"Sbb_AL_imm8",Sbb_AX_imm16:61,"61":"Sbb_AX_imm16",Sbb_EAX_imm32:62,"62":"Sbb_EAX_imm32",Sbb_RAX_imm32:63,"63":"Sbb_RAX_imm32",Pushw_DS:64,"64":"Pushw_DS",Pushd_DS:65,"65":"Pushd_DS",Popw_DS:66,"66":"Popw_DS",Popd_DS:67,"67":"Popd_DS",And_rm8_r8:68,"68":"And_rm8_r8",And_rm16_r16:69,"69":"And_rm16_r16",And_rm32_r32:70,"70":"And_rm32_r32",And_rm64_r64:71,"71":"And_rm64_r64",And_r8_rm8:72,"72":"And_r8_rm8",And_r16_rm16:73,"73":"And_r16_rm16",And_r32_rm32:74,"74":"And_r32_rm32",And_r64_rm64:75,"75":"And_r64_rm64",And_AL_imm8:76,"76":"And_AL_imm8",And_AX_imm16:77,"77":"And_AX_imm16",And_EAX_imm32:78,"78":"And_EAX_imm32",And_RAX_imm32:79,"79":"And_RAX_imm32",Daa:80,"80":"Daa",Sub_rm8_r8:81,"81":"Sub_rm8_r8",Sub_rm16_r16:82,"82":"Sub_rm16_r16",Sub_rm32_r32:83,"83":"Sub_rm32_r32",Sub_rm64_r64:84,"84":"Sub_rm64_r64",Sub_r8_rm8:85,"85":"Sub_r8_rm8",Sub_r16_rm16:86,"86":"Sub_r16_rm16",Sub_r32_rm32:87,"87":"Sub_r32_rm32",Sub_r64_rm64:88,"88":"Sub_r64_rm64",Sub_AL_imm8:89,"89":"Sub_AL_imm8",Sub_AX_imm16:90,"90":"Sub_AX_imm16",Sub_EAX_imm32:91,"91":"Sub_EAX_imm32",Sub_RAX_imm32:92,"92":"Sub_RAX_imm32",Das:93,"93":"Das",Xor_rm8_r8:94,"94":"Xor_rm8_r8",Xor_rm16_r16:95,"95":"Xor_rm16_r16",Xor_rm32_r32:96,"96":"Xor_rm32_r32",Xor_rm64_r64:97,"97":"Xor_rm64_r64",Xor_r8_rm8:98,"98":"Xor_r8_rm8",Xor_r16_rm16:99,"99":"Xor_r16_rm16",Xor_r32_rm32:100,"100":"Xor_r32_rm32",Xor_r64_rm64:101,"101":"Xor_r64_rm64",Xor_AL_imm8:102,"102":"Xor_AL_imm8",Xor_AX_imm16:103,"103":"Xor_AX_imm16",Xor_EAX_imm32:104,"104":"Xor_EAX_imm32",Xor_RAX_imm32:105,"105":"Xor_RAX_imm32",Aaa:106,"106":"Aaa",Cmp_rm8_r8:107,"107":"Cmp_rm8_r8",Cmp_rm16_r16:108,"108":"Cmp_rm16_r16",Cmp_rm32_r32:109,"109":"Cmp_rm32_r32",Cmp_rm64_r64:110,"110":"Cmp_rm64_r64",Cmp_r8_rm8:111,"111":"Cmp_r8_rm8",Cmp_r16_rm16:112,"112":"Cmp_r16_rm16",Cmp_r32_rm32:113,"113":"Cmp_r32_rm32",Cmp_r64_rm64:114,"114":"Cmp_r64_rm64",Cmp_AL_imm8:115,"115":"Cmp_AL_imm8",Cmp_AX_imm16:116,"116":"Cmp_AX_imm16",Cmp_EAX_imm32:117,"117":"Cmp_EAX_imm32",Cmp_RAX_imm32:118,"118":"Cmp_RAX_imm32",Aas:119,"119":"Aas",Inc_r16:120,"120":"Inc_r16",Inc_r32:121,"121":"Inc_r32",Dec_r16:122,"122":"Dec_r16",Dec_r32:123,"123":"Dec_r32",Push_r16:124,"124":"Push_r16",Push_r32:125,"125":"Push_r32",Push_r64:126,"126":"Push_r64",Pop_r16:127,"127":"Pop_r16",Pop_r32:128,"128":"Pop_r32",Pop_r64:129,"129":"Pop_r64",Pushaw:130,"130":"Pushaw",Pushad:131,"131":"Pushad",Popaw:132,"132":"Popaw",Popad:133,"133":"Popad",Bound_r16_m1616:134,"134":"Bound_r16_m1616",Bound_r32_m3232:135,"135":"Bound_r32_m3232",Arpl_rm16_r16:136,"136":"Arpl_rm16_r16",Arpl_r32m16_r32:137,"137":"Arpl_r32m16_r32",Movsxd_r16_rm16:138,"138":"Movsxd_r16_rm16",Movsxd_r32_rm32:139,"139":"Movsxd_r32_rm32",Movsxd_r64_rm32:140,"140":"Movsxd_r64_rm32",Push_imm16:141,"141":"Push_imm16",Pushd_imm32:142,"142":"Pushd_imm32",Pushq_imm32:143,"143":"Pushq_imm32",Imul_r16_rm16_imm16:144,"144":"Imul_r16_rm16_imm16",Imul_r32_rm32_imm32:145,"145":"Imul_r32_rm32_imm32",Imul_r64_rm64_imm32:146,"146":"Imul_r64_rm64_imm32",Pushw_imm8:147,"147":"Pushw_imm8",Pushd_imm8:148,"148":"Pushd_imm8",Pushq_imm8:149,"149":"Pushq_imm8",Imul_r16_rm16_imm8:150,"150":"Imul_r16_rm16_imm8",Imul_r32_rm32_imm8:151,"151":"Imul_r32_rm32_imm8",Imul_r64_rm64_imm8:152,"152":"Imul_r64_rm64_imm8",Insb_m8_DX:153,"153":"Insb_m8_DX",Insw_m16_DX:154,"154":"Insw_m16_DX",Insd_m32_DX:155,"155":"Insd_m32_DX",Outsb_DX_m8:156,"156":"Outsb_DX_m8",Outsw_DX_m16:157,"157":"Outsw_DX_m16",Outsd_DX_m32:158,"158":"Outsd_DX_m32",Jo_rel8_16:159,"159":"Jo_rel8_16",Jo_rel8_32:160,"160":"Jo_rel8_32",Jo_rel8_64:161,"161":"Jo_rel8_64",Jno_rel8_16:162,"162":"Jno_rel8_16",Jno_rel8_32:163,"163":"Jno_rel8_32",Jno_rel8_64:164,"164":"Jno_rel8_64",Jb_rel8_16:165,"165":"Jb_rel8_16",Jb_rel8_32:166,"166":"Jb_rel8_32",Jb_rel8_64:167,"167":"Jb_rel8_64",Jae_rel8_16:168,"168":"Jae_rel8_16",Jae_rel8_32:169,"169":"Jae_rel8_32",Jae_rel8_64:170,"170":"Jae_rel8_64",Je_rel8_16:171,"171":"Je_rel8_16",Je_rel8_32:172,"172":"Je_rel8_32",Je_rel8_64:173,"173":"Je_rel8_64",Jne_rel8_16:174,"174":"Jne_rel8_16",Jne_rel8_32:175,"175":"Jne_rel8_32",Jne_rel8_64:176,"176":"Jne_rel8_64",Jbe_rel8_16:177,"177":"Jbe_rel8_16",Jbe_rel8_32:178,"178":"Jbe_rel8_32",Jbe_rel8_64:179,"179":"Jbe_rel8_64",Ja_rel8_16:180,"180":"Ja_rel8_16",Ja_rel8_32:181,"181":"Ja_rel8_32",Ja_rel8_64:182,"182":"Ja_rel8_64",Js_rel8_16:183,"183":"Js_rel8_16",Js_rel8_32:184,"184":"Js_rel8_32",Js_rel8_64:185,"185":"Js_rel8_64",Jns_rel8_16:186,"186":"Jns_rel8_16",Jns_rel8_32:187,"187":"Jns_rel8_32",Jns_rel8_64:188,"188":"Jns_rel8_64",Jp_rel8_16:189,"189":"Jp_rel8_16",Jp_rel8_32:190,"190":"Jp_rel8_32",Jp_rel8_64:191,"191":"Jp_rel8_64",Jnp_rel8_16:192,"192":"Jnp_rel8_16",Jnp_rel8_32:193,"193":"Jnp_rel8_32",Jnp_rel8_64:194,"194":"Jnp_rel8_64",Jl_rel8_16:195,"195":"Jl_rel8_16",Jl_rel8_32:196,"196":"Jl_rel8_32",Jl_rel8_64:197,"197":"Jl_rel8_64",Jge_rel8_16:198,"198":"Jge_rel8_16",Jge_rel8_32:199,"199":"Jge_rel8_32",Jge_rel8_64:200,"200":"Jge_rel8_64",Jle_rel8_16:201,"201":"Jle_rel8_16",Jle_rel8_32:202,"202":"Jle_rel8_32",Jle_rel8_64:203,"203":"Jle_rel8_64",Jg_rel8_16:204,"204":"Jg_rel8_16",Jg_rel8_32:205,"205":"Jg_rel8_32",Jg_rel8_64:206,"206":"Jg_rel8_64",Add_rm8_imm8:207,"207":"Add_rm8_imm8",Or_rm8_imm8:208,"208":"Or_rm8_imm8",Adc_rm8_imm8:209,"209":"Adc_rm8_imm8",Sbb_rm8_imm8:210,"210":"Sbb_rm8_imm8",And_rm8_imm8:211,"211":"And_rm8_imm8",Sub_rm8_imm8:212,"212":"Sub_rm8_imm8",Xor_rm8_imm8:213,"213":"Xor_rm8_imm8",Cmp_rm8_imm8:214,"214":"Cmp_rm8_imm8",Add_rm16_imm16:215,"215":"Add_rm16_imm16",Add_rm32_imm32:216,"216":"Add_rm32_imm32",Add_rm64_imm32:217,"217":"Add_rm64_imm32",Or_rm16_imm16:218,"218":"Or_rm16_imm16",Or_rm32_imm32:219,"219":"Or_rm32_imm32",Or_rm64_imm32:220,"220":"Or_rm64_imm32",Adc_rm16_imm16:221,"221":"Adc_rm16_imm16",Adc_rm32_imm32:222,"222":"Adc_rm32_imm32",Adc_rm64_imm32:223,"223":"Adc_rm64_imm32",Sbb_rm16_imm16:224,"224":"Sbb_rm16_imm16",Sbb_rm32_imm32:225,"225":"Sbb_rm32_imm32",Sbb_rm64_imm32:226,"226":"Sbb_rm64_imm32",And_rm16_imm16:227,"227":"And_rm16_imm16",And_rm32_imm32:228,"228":"And_rm32_imm32",And_rm64_imm32:229,"229":"And_rm64_imm32",Sub_rm16_imm16:230,"230":"Sub_rm16_imm16",Sub_rm32_imm32:231,"231":"Sub_rm32_imm32",Sub_rm64_imm32:232,"232":"Sub_rm64_imm32",Xor_rm16_imm16:233,"233":"Xor_rm16_imm16",Xor_rm32_imm32:234,"234":"Xor_rm32_imm32",Xor_rm64_imm32:235,"235":"Xor_rm64_imm32",Cmp_rm16_imm16:236,"236":"Cmp_rm16_imm16",Cmp_rm32_imm32:237,"237":"Cmp_rm32_imm32",Cmp_rm64_imm32:238,"238":"Cmp_rm64_imm32",Add_rm8_imm8_82:239,"239":"Add_rm8_imm8_82",Or_rm8_imm8_82:240,"240":"Or_rm8_imm8_82",Adc_rm8_imm8_82:241,"241":"Adc_rm8_imm8_82",Sbb_rm8_imm8_82:242,"242":"Sbb_rm8_imm8_82",And_rm8_imm8_82:243,"243":"And_rm8_imm8_82",Sub_rm8_imm8_82:244,"244":"Sub_rm8_imm8_82",Xor_rm8_imm8_82:245,"245":"Xor_rm8_imm8_82",Cmp_rm8_imm8_82:246,"246":"Cmp_rm8_imm8_82",Add_rm16_imm8:247,"247":"Add_rm16_imm8",Add_rm32_imm8:248,"248":"Add_rm32_imm8",Add_rm64_imm8:249,"249":"Add_rm64_imm8",Or_rm16_imm8:250,"250":"Or_rm16_imm8",Or_rm32_imm8:251,"251":"Or_rm32_imm8",Or_rm64_imm8:252,"252":"Or_rm64_imm8",Adc_rm16_imm8:253,"253":"Adc_rm16_imm8",Adc_rm32_imm8:254,"254":"Adc_rm32_imm8",Adc_rm64_imm8:255,"255":"Adc_rm64_imm8",Sbb_rm16_imm8:256,"256":"Sbb_rm16_imm8",Sbb_rm32_imm8:257,"257":"Sbb_rm32_imm8",Sbb_rm64_imm8:258,"258":"Sbb_rm64_imm8",And_rm16_imm8:259,"259":"And_rm16_imm8",And_rm32_imm8:260,"260":"And_rm32_imm8",And_rm64_imm8:261,"261":"And_rm64_imm8",Sub_rm16_imm8:262,"262":"Sub_rm16_imm8",Sub_rm32_imm8:263,"263":"Sub_rm32_imm8",Sub_rm64_imm8:264,"264":"Sub_rm64_imm8",Xor_rm16_imm8:265,"265":"Xor_rm16_imm8",Xor_rm32_imm8:266,"266":"Xor_rm32_imm8",Xor_rm64_imm8:267,"267":"Xor_rm64_imm8",Cmp_rm16_imm8:268,"268":"Cmp_rm16_imm8",Cmp_rm32_imm8:269,"269":"Cmp_rm32_imm8",Cmp_rm64_imm8:270,"270":"Cmp_rm64_imm8",Test_rm8_r8:271,"271":"Test_rm8_r8",Test_rm16_r16:272,"272":"Test_rm16_r16",Test_rm32_r32:273,"273":"Test_rm32_r32",Test_rm64_r64:274,"274":"Test_rm64_r64",Xchg_rm8_r8:275,"275":"Xchg_rm8_r8",Xchg_rm16_r16:276,"276":"Xchg_rm16_r16",Xchg_rm32_r32:277,"277":"Xchg_rm32_r32",Xchg_rm64_r64:278,"278":"Xchg_rm64_r64",Mov_rm8_r8:279,"279":"Mov_rm8_r8",Mov_rm16_r16:280,"280":"Mov_rm16_r16",Mov_rm32_r32:281,"281":"Mov_rm32_r32",Mov_rm64_r64:282,"282":"Mov_rm64_r64",Mov_r8_rm8:283,"283":"Mov_r8_rm8",Mov_r16_rm16:284,"284":"Mov_r16_rm16",Mov_r32_rm32:285,"285":"Mov_r32_rm32",Mov_r64_rm64:286,"286":"Mov_r64_rm64",Mov_rm16_Sreg:287,"287":"Mov_rm16_Sreg",Mov_r32m16_Sreg:288,"288":"Mov_r32m16_Sreg",Mov_r64m16_Sreg:289,"289":"Mov_r64m16_Sreg",Lea_r16_m:290,"290":"Lea_r16_m",Lea_r32_m:291,"291":"Lea_r32_m",Lea_r64_m:292,"292":"Lea_r64_m",Mov_Sreg_rm16:293,"293":"Mov_Sreg_rm16",Mov_Sreg_r32m16:294,"294":"Mov_Sreg_r32m16",Mov_Sreg_r64m16:295,"295":"Mov_Sreg_r64m16",Pop_rm16:296,"296":"Pop_rm16",Pop_rm32:297,"297":"Pop_rm32",Pop_rm64:298,"298":"Pop_rm64",Nopw:299,"299":"Nopw",Nopd:300,"300":"Nopd",Nopq:301,"301":"Nopq",Xchg_r16_AX:302,"302":"Xchg_r16_AX",Xchg_r32_EAX:303,"303":"Xchg_r32_EAX",Xchg_r64_RAX:304,"304":"Xchg_r64_RAX",Pause:305,"305":"Pause",Cbw:306,"306":"Cbw",Cwde:307,"307":"Cwde",Cdqe:308,"308":"Cdqe",Cwd:309,"309":"Cwd",Cdq:310,"310":"Cdq",Cqo:311,"311":"Cqo",Call_ptr1616:312,"312":"Call_ptr1616",Call_ptr1632:313,"313":"Call_ptr1632",Wait:314,"314":"Wait",Pushfw:315,"315":"Pushfw",Pushfd:316,"316":"Pushfd",Pushfq:317,"317":"Pushfq",Popfw:318,"318":"Popfw",Popfd:319,"319":"Popfd",Popfq:320,"320":"Popfq",Sahf:321,"321":"Sahf",Lahf:322,"322":"Lahf",Mov_AL_moffs8:323,"323":"Mov_AL_moffs8",Mov_AX_moffs16:324,"324":"Mov_AX_moffs16",Mov_EAX_moffs32:325,"325":"Mov_EAX_moffs32",Mov_RAX_moffs64:326,"326":"Mov_RAX_moffs64",Mov_moffs8_AL:327,"327":"Mov_moffs8_AL",Mov_moffs16_AX:328,"328":"Mov_moffs16_AX",Mov_moffs32_EAX:329,"329":"Mov_moffs32_EAX",Mov_moffs64_RAX:330,"330":"Mov_moffs64_RAX",Movsb_m8_m8:331,"331":"Movsb_m8_m8",Movsw_m16_m16:332,"332":"Movsw_m16_m16",Movsd_m32_m32:333,"333":"Movsd_m32_m32",Movsq_m64_m64:334,"334":"Movsq_m64_m64",Cmpsb_m8_m8:335,"335":"Cmpsb_m8_m8",Cmpsw_m16_m16:336,"336":"Cmpsw_m16_m16",Cmpsd_m32_m32:337,"337":"Cmpsd_m32_m32",Cmpsq_m64_m64:338,"338":"Cmpsq_m64_m64",Test_AL_imm8:339,"339":"Test_AL_imm8",Test_AX_imm16:340,"340":"Test_AX_imm16",Test_EAX_imm32:341,"341":"Test_EAX_imm32",Test_RAX_imm32:342,"342":"Test_RAX_imm32",Stosb_m8_AL:343,"343":"Stosb_m8_AL",Stosw_m16_AX:344,"344":"Stosw_m16_AX",Stosd_m32_EAX:345,"345":"Stosd_m32_EAX",Stosq_m64_RAX:346,"346":"Stosq_m64_RAX",Lodsb_AL_m8:347,"347":"Lodsb_AL_m8",Lodsw_AX_m16:348,"348":"Lodsw_AX_m16",Lodsd_EAX_m32:349,"349":"Lodsd_EAX_m32",Lodsq_RAX_m64:350,"350":"Lodsq_RAX_m64",Scasb_AL_m8:351,"351":"Scasb_AL_m8",Scasw_AX_m16:352,"352":"Scasw_AX_m16",Scasd_EAX_m32:353,"353":"Scasd_EAX_m32",Scasq_RAX_m64:354,"354":"Scasq_RAX_m64",Mov_r8_imm8:355,"355":"Mov_r8_imm8",Mov_r16_imm16:356,"356":"Mov_r16_imm16",Mov_r32_imm32:357,"357":"Mov_r32_imm32",Mov_r64_imm64:358,"358":"Mov_r64_imm64",Rol_rm8_imm8:359,"359":"Rol_rm8_imm8",Ror_rm8_imm8:360,"360":"Ror_rm8_imm8",Rcl_rm8_imm8:361,"361":"Rcl_rm8_imm8",Rcr_rm8_imm8:362,"362":"Rcr_rm8_imm8",Shl_rm8_imm8:363,"363":"Shl_rm8_imm8",Shr_rm8_imm8:364,"364":"Shr_rm8_imm8",Sal_rm8_imm8:365,"365":"Sal_rm8_imm8",Sar_rm8_imm8:366,"366":"Sar_rm8_imm8",Rol_rm16_imm8:367,"367":"Rol_rm16_imm8",Rol_rm32_imm8:368,"368":"Rol_rm32_imm8",Rol_rm64_imm8:369,"369":"Rol_rm64_imm8",Ror_rm16_imm8:370,"370":"Ror_rm16_imm8",Ror_rm32_imm8:371,"371":"Ror_rm32_imm8",Ror_rm64_imm8:372,"372":"Ror_rm64_imm8",Rcl_rm16_imm8:373,"373":"Rcl_rm16_imm8",Rcl_rm32_imm8:374,"374":"Rcl_rm32_imm8",Rcl_rm64_imm8:375,"375":"Rcl_rm64_imm8",Rcr_rm16_imm8:376,"376":"Rcr_rm16_imm8",Rcr_rm32_imm8:377,"377":"Rcr_rm32_imm8",Rcr_rm64_imm8:378,"378":"Rcr_rm64_imm8",Shl_rm16_imm8:379,"379":"Shl_rm16_imm8",Shl_rm32_imm8:380,"380":"Shl_rm32_imm8",Shl_rm64_imm8:381,"381":"Shl_rm64_imm8",Shr_rm16_imm8:382,"382":"Shr_rm16_imm8",Shr_rm32_imm8:383,"383":"Shr_rm32_imm8",Shr_rm64_imm8:384,"384":"Shr_rm64_imm8",Sal_rm16_imm8:385,"385":"Sal_rm16_imm8",Sal_rm32_imm8:386,"386":"Sal_rm32_imm8",Sal_rm64_imm8:387,"387":"Sal_rm64_imm8",Sar_rm16_imm8:388,"388":"Sar_rm16_imm8",Sar_rm32_imm8:389,"389":"Sar_rm32_imm8",Sar_rm64_imm8:390,"390":"Sar_rm64_imm8",Retnw_imm16:391,"391":"Retnw_imm16",Retnd_imm16:392,"392":"Retnd_imm16",Retnq_imm16:393,"393":"Retnq_imm16",Retnw:394,"394":"Retnw",Retnd:395,"395":"Retnd",Retnq:396,"396":"Retnq",Les_r16_m1616:397,"397":"Les_r16_m1616",Les_r32_m1632:398,"398":"Les_r32_m1632",Lds_r16_m1616:399,"399":"Lds_r16_m1616",Lds_r32_m1632:400,"400":"Lds_r32_m1632",Mov_rm8_imm8:401,"401":"Mov_rm8_imm8",Xabort_imm8:402,"402":"Xabort_imm8",Mov_rm16_imm16:403,"403":"Mov_rm16_imm16",Mov_rm32_imm32:404,"404":"Mov_rm32_imm32",Mov_rm64_imm32:405,"405":"Mov_rm64_imm32",Xbegin_rel16:406,"406":"Xbegin_rel16",Xbegin_rel32:407,"407":"Xbegin_rel32",Enterw_imm16_imm8:408,"408":"Enterw_imm16_imm8",Enterd_imm16_imm8:409,"409":"Enterd_imm16_imm8",Enterq_imm16_imm8:410,"410":"Enterq_imm16_imm8",Leavew:411,"411":"Leavew",Leaved:412,"412":"Leaved",Leaveq:413,"413":"Leaveq",Retfw_imm16:414,"414":"Retfw_imm16",Retfd_imm16:415,"415":"Retfd_imm16",Retfq_imm16:416,"416":"Retfq_imm16",Retfw:417,"417":"Retfw",Retfd:418,"418":"Retfd",Retfq:419,"419":"Retfq",Int3:420,"420":"Int3",Int_imm8:421,"421":"Int_imm8",Into:422,"422":"Into",Iretw:423,"423":"Iretw",Iretd:424,"424":"Iretd",Iretq:425,"425":"Iretq",Rol_rm8_1:426,"426":"Rol_rm8_1",Ror_rm8_1:427,"427":"Ror_rm8_1",Rcl_rm8_1:428,"428":"Rcl_rm8_1",Rcr_rm8_1:429,"429":"Rcr_rm8_1",Shl_rm8_1:430,"430":"Shl_rm8_1",Shr_rm8_1:431,"431":"Shr_rm8_1",Sal_rm8_1:432,"432":"Sal_rm8_1",Sar_rm8_1:433,"433":"Sar_rm8_1",Rol_rm16_1:434,"434":"Rol_rm16_1",Rol_rm32_1:435,"435":"Rol_rm32_1",Rol_rm64_1:436,"436":"Rol_rm64_1",Ror_rm16_1:437,"437":"Ror_rm16_1",Ror_rm32_1:438,"438":"Ror_rm32_1",Ror_rm64_1:439,"439":"Ror_rm64_1",Rcl_rm16_1:440,"440":"Rcl_rm16_1",Rcl_rm32_1:441,"441":"Rcl_rm32_1",Rcl_rm64_1:442,"442":"Rcl_rm64_1",Rcr_rm16_1:443,"443":"Rcr_rm16_1",Rcr_rm32_1:444,"444":"Rcr_rm32_1",Rcr_rm64_1:445,"445":"Rcr_rm64_1",Shl_rm16_1:446,"446":"Shl_rm16_1",Shl_rm32_1:447,"447":"Shl_rm32_1",Shl_rm64_1:448,"448":"Shl_rm64_1",Shr_rm16_1:449,"449":"Shr_rm16_1",Shr_rm32_1:450,"450":"Shr_rm32_1",Shr_rm64_1:451,"451":"Shr_rm64_1",Sal_rm16_1:452,"452":"Sal_rm16_1",Sal_rm32_1:453,"453":"Sal_rm32_1",Sal_rm64_1:454,"454":"Sal_rm64_1",Sar_rm16_1:455,"455":"Sar_rm16_1",Sar_rm32_1:456,"456":"Sar_rm32_1",Sar_rm64_1:457,"457":"Sar_rm64_1",Rol_rm8_CL:458,"458":"Rol_rm8_CL",Ror_rm8_CL:459,"459":"Ror_rm8_CL",Rcl_rm8_CL:460,"460":"Rcl_rm8_CL",Rcr_rm8_CL:461,"461":"Rcr_rm8_CL",Shl_rm8_CL:462,"462":"Shl_rm8_CL",Shr_rm8_CL:463,"463":"Shr_rm8_CL",Sal_rm8_CL:464,"464":"Sal_rm8_CL",Sar_rm8_CL:465,"465":"Sar_rm8_CL",Rol_rm16_CL:466,"466":"Rol_rm16_CL",Rol_rm32_CL:467,"467":"Rol_rm32_CL",Rol_rm64_CL:468,"468":"Rol_rm64_CL",Ror_rm16_CL:469,"469":"Ror_rm16_CL",Ror_rm32_CL:470,"470":"Ror_rm32_CL",Ror_rm64_CL:471,"471":"Ror_rm64_CL",Rcl_rm16_CL:472,"472":"Rcl_rm16_CL",Rcl_rm32_CL:473,"473":"Rcl_rm32_CL",Rcl_rm64_CL:474,"474":"Rcl_rm64_CL",Rcr_rm16_CL:475,"475":"Rcr_rm16_CL",Rcr_rm32_CL:476,"476":"Rcr_rm32_CL",Rcr_rm64_CL:477,"477":"Rcr_rm64_CL",Shl_rm16_CL:478,"478":"Shl_rm16_CL",Shl_rm32_CL:479,"479":"Shl_rm32_CL",Shl_rm64_CL:480,"480":"Shl_rm64_CL",Shr_rm16_CL:481,"481":"Shr_rm16_CL",Shr_rm32_CL:482,"482":"Shr_rm32_CL",Shr_rm64_CL:483,"483":"Shr_rm64_CL",Sal_rm16_CL:484,"484":"Sal_rm16_CL",Sal_rm32_CL:485,"485":"Sal_rm32_CL",Sal_rm64_CL:486,"486":"Sal_rm64_CL",Sar_rm16_CL:487,"487":"Sar_rm16_CL",Sar_rm32_CL:488,"488":"Sar_rm32_CL",Sar_rm64_CL:489,"489":"Sar_rm64_CL",Aam_imm8:490,"490":"Aam_imm8",Aad_imm8:491,"491":"Aad_imm8",Salc:492,"492":"Salc",Xlat_m8:493,"493":"Xlat_m8",Fadd_m32fp:494,"494":"Fadd_m32fp",Fmul_m32fp:495,"495":"Fmul_m32fp",Fcom_m32fp:496,"496":"Fcom_m32fp",Fcomp_m32fp:497,"497":"Fcomp_m32fp",Fsub_m32fp:498,"498":"Fsub_m32fp",Fsubr_m32fp:499,"499":"Fsubr_m32fp",Fdiv_m32fp:500,"500":"Fdiv_m32fp",Fdivr_m32fp:501,"501":"Fdivr_m32fp",Fadd_st0_sti:502,"502":"Fadd_st0_sti",Fmul_st0_sti:503,"503":"Fmul_st0_sti",Fcom_st0_sti:504,"504":"Fcom_st0_sti",Fcomp_st0_sti:505,"505":"Fcomp_st0_sti",Fsub_st0_sti:506,"506":"Fsub_st0_sti",Fsubr_st0_sti:507,"507":"Fsubr_st0_sti",Fdiv_st0_sti:508,"508":"Fdiv_st0_sti",Fdivr_st0_sti:509,"509":"Fdivr_st0_sti",Fld_m32fp:510,"510":"Fld_m32fp",Fst_m32fp:511,"511":"Fst_m32fp",Fstp_m32fp:512,"512":"Fstp_m32fp",Fldenv_m14byte:513,"513":"Fldenv_m14byte",Fldenv_m28byte:514,"514":"Fldenv_m28byte",Fldcw_m2byte:515,"515":"Fldcw_m2byte",Fnstenv_m14byte:516,"516":"Fnstenv_m14byte",Fstenv_m14byte:517,"517":"Fstenv_m14byte",Fnstenv_m28byte:518,"518":"Fnstenv_m28byte",Fstenv_m28byte:519,"519":"Fstenv_m28byte",Fnstcw_m2byte:520,"520":"Fnstcw_m2byte",Fstcw_m2byte:521,"521":"Fstcw_m2byte",Fld_sti:522,"522":"Fld_sti",Fxch_st0_sti:523,"523":"Fxch_st0_sti",Fnop:524,"524":"Fnop",Fstpnce_sti:525,"525":"Fstpnce_sti",Fchs:526,"526":"Fchs",Fabs:527,"527":"Fabs",Ftst:528,"528":"Ftst",Fxam:529,"529":"Fxam",Fld1:530,"530":"Fld1",Fldl2t:531,"531":"Fldl2t",Fldl2e:532,"532":"Fldl2e",Fldpi:533,"533":"Fldpi",Fldlg2:534,"534":"Fldlg2",Fldln2:535,"535":"Fldln2",Fldz:536,"536":"Fldz",F2xm1:537,"537":"F2xm1",Fyl2x:538,"538":"Fyl2x",Fptan:539,"539":"Fptan",Fpatan:540,"540":"Fpatan",Fxtract:541,"541":"Fxtract",Fprem1:542,"542":"Fprem1",Fdecstp:543,"543":"Fdecstp",Fincstp:544,"544":"Fincstp",Fprem:545,"545":"Fprem",Fyl2xp1:546,"546":"Fyl2xp1",Fsqrt:547,"547":"Fsqrt",Fsincos:548,"548":"Fsincos",Frndint:549,"549":"Frndint",Fscale:550,"550":"Fscale",Fsin:551,"551":"Fsin",Fcos:552,"552":"Fcos",Fiadd_m32int:553,"553":"Fiadd_m32int",Fimul_m32int:554,"554":"Fimul_m32int",Ficom_m32int:555,"555":"Ficom_m32int",Ficomp_m32int:556,"556":"Ficomp_m32int",Fisub_m32int:557,"557":"Fisub_m32int",Fisubr_m32int:558,"558":"Fisubr_m32int",Fidiv_m32int:559,"559":"Fidiv_m32int",Fidivr_m32int:560,"560":"Fidivr_m32int",Fcmovb_st0_sti:561,"561":"Fcmovb_st0_sti",Fcmove_st0_sti:562,"562":"Fcmove_st0_sti",Fcmovbe_st0_sti:563,"563":"Fcmovbe_st0_sti",Fcmovu_st0_sti:564,"564":"Fcmovu_st0_sti",Fucompp:565,"565":"Fucompp",Fild_m32int:566,"566":"Fild_m32int",Fisttp_m32int:567,"567":"Fisttp_m32int",Fist_m32int:568,"568":"Fist_m32int",Fistp_m32int:569,"569":"Fistp_m32int",Fld_m80fp:570,"570":"Fld_m80fp",Fstp_m80fp:571,"571":"Fstp_m80fp",Fcmovnb_st0_sti:572,"572":"Fcmovnb_st0_sti",Fcmovne_st0_sti:573,"573":"Fcmovne_st0_sti",Fcmovnbe_st0_sti:574,"574":"Fcmovnbe_st0_sti",Fcmovnu_st0_sti:575,"575":"Fcmovnu_st0_sti",Fneni:576,"576":"Fneni",Feni:577,"577":"Feni",Fndisi:578,"578":"Fndisi",Fdisi:579,"579":"Fdisi",Fnclex:580,"580":"Fnclex",Fclex:581,"581":"Fclex",Fninit:582,"582":"Fninit",Finit:583,"583":"Finit",Fnsetpm:584,"584":"Fnsetpm",Fsetpm:585,"585":"Fsetpm",Frstpm:586,"586":"Frstpm",Fucomi_st0_sti:587,"587":"Fucomi_st0_sti",Fcomi_st0_sti:588,"588":"Fcomi_st0_sti",Fadd_m64fp:589,"589":"Fadd_m64fp",Fmul_m64fp:590,"590":"Fmul_m64fp",Fcom_m64fp:591,"591":"Fcom_m64fp",Fcomp_m64fp:592,"592":"Fcomp_m64fp",Fsub_m64fp:593,"593":"Fsub_m64fp",Fsubr_m64fp:594,"594":"Fsubr_m64fp",Fdiv_m64fp:595,"595":"Fdiv_m64fp",Fdivr_m64fp:596,"596":"Fdivr_m64fp",Fadd_sti_st0:597,"597":"Fadd_sti_st0",Fmul_sti_st0:598,"598":"Fmul_sti_st0",Fcom_st0_sti_DCD0:599,"599":"Fcom_st0_sti_DCD0",Fcomp_st0_sti_DCD8:600,"600":"Fcomp_st0_sti_DCD8",Fsubr_sti_st0:601,"601":"Fsubr_sti_st0",Fsub_sti_st0:602,"602":"Fsub_sti_st0",Fdivr_sti_st0:603,"603":"Fdivr_sti_st0",Fdiv_sti_st0:604,"604":"Fdiv_sti_st0",Fld_m64fp:605,"605":"Fld_m64fp",Fisttp_m64int:606,"606":"Fisttp_m64int",Fst_m64fp:607,"607":"Fst_m64fp",Fstp_m64fp:608,"608":"Fstp_m64fp",Frstor_m94byte:609,"609":"Frstor_m94byte",Frstor_m108byte:610,"610":"Frstor_m108byte",Fnsave_m94byte:611,"611":"Fnsave_m94byte",Fsave_m94byte:612,"612":"Fsave_m94byte",Fnsave_m108byte:613,"613":"Fnsave_m108byte",Fsave_m108byte:614,"614":"Fsave_m108byte",Fnstsw_m2byte:615,"615":"Fnstsw_m2byte",Fstsw_m2byte:616,"616":"Fstsw_m2byte",Ffree_sti:617,"617":"Ffree_sti",Fxch_st0_sti_DDC8:618,"618":"Fxch_st0_sti_DDC8",Fst_sti:619,"619":"Fst_sti",Fstp_sti:620,"620":"Fstp_sti",Fucom_st0_sti:621,"621":"Fucom_st0_sti",Fucomp_st0_sti:622,"622":"Fucomp_st0_sti",Fiadd_m16int:623,"623":"Fiadd_m16int",Fimul_m16int:624,"624":"Fimul_m16int",Ficom_m16int:625,"625":"Ficom_m16int",Ficomp_m16int:626,"626":"Ficomp_m16int",Fisub_m16int:627,"627":"Fisub_m16int",Fisubr_m16int:628,"628":"Fisubr_m16int",Fidiv_m16int:629,"629":"Fidiv_m16int",Fidivr_m16int:630,"630":"Fidivr_m16int",Faddp_sti_st0:631,"631":"Faddp_sti_st0",Fmulp_sti_st0:632,"632":"Fmulp_sti_st0",Fcomp_st0_sti_DED0:633,"633":"Fcomp_st0_sti_DED0",Fcompp:634,"634":"Fcompp",Fsubrp_sti_st0:635,"635":"Fsubrp_sti_st0",Fsubp_sti_st0:636,"636":"Fsubp_sti_st0",Fdivrp_sti_st0:637,"637":"Fdivrp_sti_st0",Fdivp_sti_st0:638,"638":"Fdivp_sti_st0",Fild_m16int:639,"639":"Fild_m16int",Fisttp_m16int:640,"640":"Fisttp_m16int",Fist_m16int:641,"641":"Fist_m16int",Fistp_m16int:642,"642":"Fistp_m16int",Fbld_m80bcd:643,"643":"Fbld_m80bcd",Fild_m64int:644,"644":"Fild_m64int",Fbstp_m80bcd:645,"645":"Fbstp_m80bcd",Fistp_m64int:646,"646":"Fistp_m64int",Ffreep_sti:647,"647":"Ffreep_sti",Fxch_st0_sti_DFC8:648,"648":"Fxch_st0_sti_DFC8",Fstp_sti_DFD0:649,"649":"Fstp_sti_DFD0",Fstp_sti_DFD8:650,"650":"Fstp_sti_DFD8",Fnstsw_AX:651,"651":"Fnstsw_AX",Fstsw_AX:652,"652":"Fstsw_AX",Fstdw_AX:653,"653":"Fstdw_AX",Fstsg_AX:654,"654":"Fstsg_AX",Fucomip_st0_sti:655,"655":"Fucomip_st0_sti",Fcomip_st0_sti:656,"656":"Fcomip_st0_sti",Loopne_rel8_16_CX:657,"657":"Loopne_rel8_16_CX",Loopne_rel8_32_CX:658,"658":"Loopne_rel8_32_CX",Loopne_rel8_16_ECX:659,"659":"Loopne_rel8_16_ECX",Loopne_rel8_32_ECX:660,"660":"Loopne_rel8_32_ECX",Loopne_rel8_64_ECX:661,"661":"Loopne_rel8_64_ECX",Loopne_rel8_16_RCX:662,"662":"Loopne_rel8_16_RCX",Loopne_rel8_64_RCX:663,"663":"Loopne_rel8_64_RCX",Loope_rel8_16_CX:664,"664":"Loope_rel8_16_CX",Loope_rel8_32_CX:665,"665":"Loope_rel8_32_CX",Loope_rel8_16_ECX:666,"666":"Loope_rel8_16_ECX",Loope_rel8_32_ECX:667,"667":"Loope_rel8_32_ECX",Loope_rel8_64_ECX:668,"668":"Loope_rel8_64_ECX",Loope_rel8_16_RCX:669,"669":"Loope_rel8_16_RCX",Loope_rel8_64_RCX:670,"670":"Loope_rel8_64_RCX",Loop_rel8_16_CX:671,"671":"Loop_rel8_16_CX",Loop_rel8_32_CX:672,"672":"Loop_rel8_32_CX",Loop_rel8_16_ECX:673,"673":"Loop_rel8_16_ECX",Loop_rel8_32_ECX:674,"674":"Loop_rel8_32_ECX",Loop_rel8_64_ECX:675,"675":"Loop_rel8_64_ECX",Loop_rel8_16_RCX:676,"676":"Loop_rel8_16_RCX",Loop_rel8_64_RCX:677,"677":"Loop_rel8_64_RCX",Jcxz_rel8_16:678,"678":"Jcxz_rel8_16",Jcxz_rel8_32:679,"679":"Jcxz_rel8_32",Jecxz_rel8_16:680,"680":"Jecxz_rel8_16",Jecxz_rel8_32:681,"681":"Jecxz_rel8_32",Jecxz_rel8_64:682,"682":"Jecxz_rel8_64",Jrcxz_rel8_16:683,"683":"Jrcxz_rel8_16",Jrcxz_rel8_64:684,"684":"Jrcxz_rel8_64",In_AL_imm8:685,"685":"In_AL_imm8",In_AX_imm8:686,"686":"In_AX_imm8",In_EAX_imm8:687,"687":"In_EAX_imm8",Out_imm8_AL:688,"688":"Out_imm8_AL",Out_imm8_AX:689,"689":"Out_imm8_AX",Out_imm8_EAX:690,"690":"Out_imm8_EAX",Call_rel16:691,"691":"Call_rel16",Call_rel32_32:692,"692":"Call_rel32_32",Call_rel32_64:693,"693":"Call_rel32_64",Jmp_rel16:694,"694":"Jmp_rel16",Jmp_rel32_32:695,"695":"Jmp_rel32_32",Jmp_rel32_64:696,"696":"Jmp_rel32_64",Jmp_ptr1616:697,"697":"Jmp_ptr1616",Jmp_ptr1632:698,"698":"Jmp_ptr1632",Jmp_rel8_16:699,"699":"Jmp_rel8_16",Jmp_rel8_32:700,"700":"Jmp_rel8_32",Jmp_rel8_64:701,"701":"Jmp_rel8_64",In_AL_DX:702,"702":"In_AL_DX",In_AX_DX:703,"703":"In_AX_DX",In_EAX_DX:704,"704":"In_EAX_DX",Out_DX_AL:705,"705":"Out_DX_AL",Out_DX_AX:706,"706":"Out_DX_AX",Out_DX_EAX:707,"707":"Out_DX_EAX",Int1:708,"708":"Int1",Hlt:709,"709":"Hlt",Cmc:710,"710":"Cmc",Test_rm8_imm8:711,"711":"Test_rm8_imm8",Test_rm8_imm8_F6r1:712,"712":"Test_rm8_imm8_F6r1",Not_rm8:713,"713":"Not_rm8",Neg_rm8:714,"714":"Neg_rm8",Mul_rm8:715,"715":"Mul_rm8",Imul_rm8:716,"716":"Imul_rm8",Div_rm8:717,"717":"Div_rm8",Idiv_rm8:718,"718":"Idiv_rm8",Test_rm16_imm16:719,"719":"Test_rm16_imm16",Test_rm32_imm32:720,"720":"Test_rm32_imm32",Test_rm64_imm32:721,"721":"Test_rm64_imm32",Test_rm16_imm16_F7r1:722,"722":"Test_rm16_imm16_F7r1",Test_rm32_imm32_F7r1:723,"723":"Test_rm32_imm32_F7r1",Test_rm64_imm32_F7r1:724,"724":"Test_rm64_imm32_F7r1",Not_rm16:725,"725":"Not_rm16",Not_rm32:726,"726":"Not_rm32",Not_rm64:727,"727":"Not_rm64",Neg_rm16:728,"728":"Neg_rm16",Neg_rm32:729,"729":"Neg_rm32",Neg_rm64:730,"730":"Neg_rm64",Mul_rm16:731,"731":"Mul_rm16",Mul_rm32:732,"732":"Mul_rm32",Mul_rm64:733,"733":"Mul_rm64",Imul_rm16:734,"734":"Imul_rm16",Imul_rm32:735,"735":"Imul_rm32",Imul_rm64:736,"736":"Imul_rm64",Div_rm16:737,"737":"Div_rm16",Div_rm32:738,"738":"Div_rm32",Div_rm64:739,"739":"Div_rm64",Idiv_rm16:740,"740":"Idiv_rm16",Idiv_rm32:741,"741":"Idiv_rm32",Idiv_rm64:742,"742":"Idiv_rm64",Clc:743,"743":"Clc",Stc:744,"744":"Stc",Cli:745,"745":"Cli",Sti:746,"746":"Sti",Cld:747,"747":"Cld",Std:748,"748":"Std",Inc_rm8:749,"749":"Inc_rm8",Dec_rm8:750,"750":"Dec_rm8",Inc_rm16:751,"751":"Inc_rm16",Inc_rm32:752,"752":"Inc_rm32",Inc_rm64:753,"753":"Inc_rm64",Dec_rm16:754,"754":"Dec_rm16",Dec_rm32:755,"755":"Dec_rm32",Dec_rm64:756,"756":"Dec_rm64",Call_rm16:757,"757":"Call_rm16",Call_rm32:758,"758":"Call_rm32",Call_rm64:759,"759":"Call_rm64",Call_m1616:760,"760":"Call_m1616",Call_m1632:761,"761":"Call_m1632",Call_m1664:762,"762":"Call_m1664",Jmp_rm16:763,"763":"Jmp_rm16",Jmp_rm32:764,"764":"Jmp_rm32",Jmp_rm64:765,"765":"Jmp_rm64",Jmp_m1616:766,"766":"Jmp_m1616",Jmp_m1632:767,"767":"Jmp_m1632",Jmp_m1664:768,"768":"Jmp_m1664",Push_rm16:769,"769":"Push_rm16",Push_rm32:770,"770":"Push_rm32",Push_rm64:771,"771":"Push_rm64",Sldt_rm16:772,"772":"Sldt_rm16",Sldt_r32m16:773,"773":"Sldt_r32m16",Sldt_r64m16:774,"774":"Sldt_r64m16",Str_rm16:775,"775":"Str_rm16",Str_r32m16:776,"776":"Str_r32m16",Str_r64m16:777,"777":"Str_r64m16",Lldt_rm16:778,"778":"Lldt_rm16",Lldt_r32m16:779,"779":"Lldt_r32m16",Lldt_r64m16:780,"780":"Lldt_r64m16",Ltr_rm16:781,"781":"Ltr_rm16",Ltr_r32m16:782,"782":"Ltr_r32m16",Ltr_r64m16:783,"783":"Ltr_r64m16",Verr_rm16:784,"784":"Verr_rm16",Verr_r32m16:785,"785":"Verr_r32m16",Verr_r64m16:786,"786":"Verr_r64m16",Verw_rm16:787,"787":"Verw_rm16",Verw_r32m16:788,"788":"Verw_r32m16",Verw_r64m16:789,"789":"Verw_r64m16",Jmpe_rm16:790,"790":"Jmpe_rm16",Jmpe_rm32:791,"791":"Jmpe_rm32",Sgdt_m1632_16:792,"792":"Sgdt_m1632_16",Sgdt_m1632:793,"793":"Sgdt_m1632",Sgdt_m1664:794,"794":"Sgdt_m1664",Sidt_m1632_16:795,"795":"Sidt_m1632_16",Sidt_m1632:796,"796":"Sidt_m1632",Sidt_m1664:797,"797":"Sidt_m1664",Lgdt_m1632_16:798,"798":"Lgdt_m1632_16",Lgdt_m1632:799,"799":"Lgdt_m1632",Lgdt_m1664:800,"800":"Lgdt_m1664",Lidt_m1632_16:801,"801":"Lidt_m1632_16",Lidt_m1632:802,"802":"Lidt_m1632",Lidt_m1664:803,"803":"Lidt_m1664",Smsw_rm16:804,"804":"Smsw_rm16",Smsw_r32m16:805,"805":"Smsw_r32m16",Smsw_r64m16:806,"806":"Smsw_r64m16",Rstorssp_m64:807,"807":"Rstorssp_m64",Lmsw_rm16:808,"808":"Lmsw_rm16",Lmsw_r32m16:809,"809":"Lmsw_r32m16",Lmsw_r64m16:810,"810":"Lmsw_r64m16",Invlpg_m:811,"811":"Invlpg_m",Enclv:812,"812":"Enclv",Vmcall:813,"813":"Vmcall",Vmlaunch:814,"814":"Vmlaunch",Vmresume:815,"815":"Vmresume",Vmxoff:816,"816":"Vmxoff",Pconfig:817,"817":"Pconfig",Monitorw:818,"818":"Monitorw",Monitord:819,"819":"Monitord",Monitorq:820,"820":"Monitorq",Mwait:821,"821":"Mwait",Clac:822,"822":"Clac",Stac:823,"823":"Stac",Encls:824,"824":"Encls",Xgetbv:825,"825":"Xgetbv",Xsetbv:826,"826":"Xsetbv",Vmfunc:827,"827":"Vmfunc",Xend:828,"828":"Xend",Xtest:829,"829":"Xtest",Enclu:830,"830":"Enclu",Vmrunw:831,"831":"Vmrunw",Vmrund:832,"832":"Vmrund",Vmrunq:833,"833":"Vmrunq",Vmmcall:834,"834":"Vmmcall",Vmloadw:835,"835":"Vmloadw",Vmloadd:836,"836":"Vmloadd",Vmloadq:837,"837":"Vmloadq",Vmsavew:838,"838":"Vmsavew",Vmsaved:839,"839":"Vmsaved",Vmsaveq:840,"840":"Vmsaveq",Stgi:841,"841":"Stgi",Clgi:842,"842":"Clgi",Skinit:843,"843":"Skinit",Invlpgaw:844,"844":"Invlpgaw",Invlpgad:845,"845":"Invlpgad",Invlpgaq:846,"846":"Invlpgaq",Setssbsy:847,"847":"Setssbsy",Saveprevssp:848,"848":"Saveprevssp",Rdpkru:849,"849":"Rdpkru",Wrpkru:850,"850":"Wrpkru",Swapgs:851,"851":"Swapgs",Rdtscp:852,"852":"Rdtscp",Monitorxw:853,"853":"Monitorxw",Monitorxd:854,"854":"Monitorxd",Monitorxq:855,"855":"Monitorxq",Mcommit:856,"856":"Mcommit",Mwaitx:857,"857":"Mwaitx",Clzerow:858,"858":"Clzerow",Clzerod:859,"859":"Clzerod",Clzeroq:860,"860":"Clzeroq",Rdpru:861,"861":"Rdpru",Lar_r16_rm16:862,"862":"Lar_r16_rm16",Lar_r32_r32m16:863,"863":"Lar_r32_r32m16",Lar_r64_r64m16:864,"864":"Lar_r64_r64m16",Lsl_r16_rm16:865,"865":"Lsl_r16_rm16",Lsl_r32_r32m16:866,"866":"Lsl_r32_r32m16",Lsl_r64_r64m16:867,"867":"Lsl_r64_r64m16",Storeall:868,"868":"Storeall",Loadall286:869,"869":"Loadall286",Syscall:870,"870":"Syscall",Clts:871,"871":"Clts",Loadall386:872,"872":"Loadall386",Sysretd:873,"873":"Sysretd",Sysretq:874,"874":"Sysretq",Invd:875,"875":"Invd",Wbinvd:876,"876":"Wbinvd",Wbnoinvd:877,"877":"Wbnoinvd",Cl1invmb:878,"878":"Cl1invmb",Ud2:879,"879":"Ud2",Reservednop_rm16_r16_0F0D:880,"880":"Reservednop_rm16_r16_0F0D",Reservednop_rm32_r32_0F0D:881,"881":"Reservednop_rm32_r32_0F0D",Reservednop_rm64_r64_0F0D:882,"882":"Reservednop_rm64_r64_0F0D",Prefetch_m8:883,"883":"Prefetch_m8",Prefetchw_m8:884,"884":"Prefetchw_m8",Prefetchwt1_m8:885,"885":"Prefetchwt1_m8",Femms:886,"886":"Femms",Umov_rm8_r8:887,"887":"Umov_rm8_r8",Umov_rm16_r16:888,"888":"Umov_rm16_r16",Umov_rm32_r32:889,"889":"Umov_rm32_r32",Umov_r8_rm8:890,"890":"Umov_r8_rm8",Umov_r16_rm16:891,"891":"Umov_r16_rm16",Umov_r32_rm32:892,"892":"Umov_r32_rm32",Movups_xmm_xmmm128:893,"893":"Movups_xmm_xmmm128",VEX_Vmovups_xmm_xmmm128:894,"894":"VEX_Vmovups_xmm_xmmm128",VEX_Vmovups_ymm_ymmm256:895,"895":"VEX_Vmovups_ymm_ymmm256",EVEX_Vmovups_xmm_k1z_xmmm128:896,"896":"EVEX_Vmovups_xmm_k1z_xmmm128",EVEX_Vmovups_ymm_k1z_ymmm256:897,"897":"EVEX_Vmovups_ymm_k1z_ymmm256",EVEX_Vmovups_zmm_k1z_zmmm512:898,"898":"EVEX_Vmovups_zmm_k1z_zmmm512",Movupd_xmm_xmmm128:899,"899":"Movupd_xmm_xmmm128",VEX_Vmovupd_xmm_xmmm128:900,"900":"VEX_Vmovupd_xmm_xmmm128",VEX_Vmovupd_ymm_ymmm256:901,"901":"VEX_Vmovupd_ymm_ymmm256",EVEX_Vmovupd_xmm_k1z_xmmm128:902,"902":"EVEX_Vmovupd_xmm_k1z_xmmm128",EVEX_Vmovupd_ymm_k1z_ymmm256:903,"903":"EVEX_Vmovupd_ymm_k1z_ymmm256",EVEX_Vmovupd_zmm_k1z_zmmm512:904,"904":"EVEX_Vmovupd_zmm_k1z_zmmm512",Movss_xmm_xmmm32:905,"905":"Movss_xmm_xmmm32",VEX_Vmovss_xmm_xmm_xmm:906,"906":"VEX_Vmovss_xmm_xmm_xmm",VEX_Vmovss_xmm_m32:907,"907":"VEX_Vmovss_xmm_m32",EVEX_Vmovss_xmm_k1z_xmm_xmm:908,"908":"EVEX_Vmovss_xmm_k1z_xmm_xmm",EVEX_Vmovss_xmm_k1z_m32:909,"909":"EVEX_Vmovss_xmm_k1z_m32",Movsd_xmm_xmmm64:910,"910":"Movsd_xmm_xmmm64",VEX_Vmovsd_xmm_xmm_xmm:911,"911":"VEX_Vmovsd_xmm_xmm_xmm",VEX_Vmovsd_xmm_m64:912,"912":"VEX_Vmovsd_xmm_m64",EVEX_Vmovsd_xmm_k1z_xmm_xmm:913,"913":"EVEX_Vmovsd_xmm_k1z_xmm_xmm",EVEX_Vmovsd_xmm_k1z_m64:914,"914":"EVEX_Vmovsd_xmm_k1z_m64",Movups_xmmm128_xmm:915,"915":"Movups_xmmm128_xmm",VEX_Vmovups_xmmm128_xmm:916,"916":"VEX_Vmovups_xmmm128_xmm",VEX_Vmovups_ymmm256_ymm:917,"917":"VEX_Vmovups_ymmm256_ymm",EVEX_Vmovups_xmmm128_k1z_xmm:918,"918":"EVEX_Vmovups_xmmm128_k1z_xmm",EVEX_Vmovups_ymmm256_k1z_ymm:919,"919":"EVEX_Vmovups_ymmm256_k1z_ymm",EVEX_Vmovups_zmmm512_k1z_zmm:920,"920":"EVEX_Vmovups_zmmm512_k1z_zmm",Movupd_xmmm128_xmm:921,"921":"Movupd_xmmm128_xmm",VEX_Vmovupd_xmmm128_xmm:922,"922":"VEX_Vmovupd_xmmm128_xmm",VEX_Vmovupd_ymmm256_ymm:923,"923":"VEX_Vmovupd_ymmm256_ymm",EVEX_Vmovupd_xmmm128_k1z_xmm:924,"924":"EVEX_Vmovupd_xmmm128_k1z_xmm",EVEX_Vmovupd_ymmm256_k1z_ymm:925,"925":"EVEX_Vmovupd_ymmm256_k1z_ymm",EVEX_Vmovupd_zmmm512_k1z_zmm:926,"926":"EVEX_Vmovupd_zmmm512_k1z_zmm",Movss_xmmm32_xmm:927,"927":"Movss_xmmm32_xmm",VEX_Vmovss_xmm_xmm_xmm_0F11:928,"928":"VEX_Vmovss_xmm_xmm_xmm_0F11",VEX_Vmovss_m32_xmm:929,"929":"VEX_Vmovss_m32_xmm",EVEX_Vmovss_xmm_k1z_xmm_xmm_0F11:930,"930":"EVEX_Vmovss_xmm_k1z_xmm_xmm_0F11",EVEX_Vmovss_m32_k1_xmm:931,"931":"EVEX_Vmovss_m32_k1_xmm",Movsd_xmmm64_xmm:932,"932":"Movsd_xmmm64_xmm",VEX_Vmovsd_xmm_xmm_xmm_0F11:933,"933":"VEX_Vmovsd_xmm_xmm_xmm_0F11",VEX_Vmovsd_m64_xmm:934,"934":"VEX_Vmovsd_m64_xmm",EVEX_Vmovsd_xmm_k1z_xmm_xmm_0F11:935,"935":"EVEX_Vmovsd_xmm_k1z_xmm_xmm_0F11",EVEX_Vmovsd_m64_k1_xmm:936,"936":"EVEX_Vmovsd_m64_k1_xmm",Movhlps_xmm_xmm:937,"937":"Movhlps_xmm_xmm",Movlps_xmm_m64:938,"938":"Movlps_xmm_m64",VEX_Vmovhlps_xmm_xmm_xmm:939,"939":"VEX_Vmovhlps_xmm_xmm_xmm",VEX_Vmovlps_xmm_xmm_m64:940,"940":"VEX_Vmovlps_xmm_xmm_m64",EVEX_Vmovhlps_xmm_xmm_xmm:941,"941":"EVEX_Vmovhlps_xmm_xmm_xmm",EVEX_Vmovlps_xmm_xmm_m64:942,"942":"EVEX_Vmovlps_xmm_xmm_m64",Movlpd_xmm_m64:943,"943":"Movlpd_xmm_m64",VEX_Vmovlpd_xmm_xmm_m64:944,"944":"VEX_Vmovlpd_xmm_xmm_m64",EVEX_Vmovlpd_xmm_xmm_m64:945,"945":"EVEX_Vmovlpd_xmm_xmm_m64",Movsldup_xmm_xmmm128:946,"946":"Movsldup_xmm_xmmm128",VEX_Vmovsldup_xmm_xmmm128:947,"947":"VEX_Vmovsldup_xmm_xmmm128",VEX_Vmovsldup_ymm_ymmm256:948,"948":"VEX_Vmovsldup_ymm_ymmm256",EVEX_Vmovsldup_xmm_k1z_xmmm128:949,"949":"EVEX_Vmovsldup_xmm_k1z_xmmm128",EVEX_Vmovsldup_ymm_k1z_ymmm256:950,"950":"EVEX_Vmovsldup_ymm_k1z_ymmm256",EVEX_Vmovsldup_zmm_k1z_zmmm512:951,"951":"EVEX_Vmovsldup_zmm_k1z_zmmm512",Movddup_xmm_xmmm64:952,"952":"Movddup_xmm_xmmm64",VEX_Vmovddup_xmm_xmmm64:953,"953":"VEX_Vmovddup_xmm_xmmm64",VEX_Vmovddup_ymm_ymmm256:954,"954":"VEX_Vmovddup_ymm_ymmm256",EVEX_Vmovddup_xmm_k1z_xmmm64:955,"955":"EVEX_Vmovddup_xmm_k1z_xmmm64",EVEX_Vmovddup_ymm_k1z_ymmm256:956,"956":"EVEX_Vmovddup_ymm_k1z_ymmm256",EVEX_Vmovddup_zmm_k1z_zmmm512:957,"957":"EVEX_Vmovddup_zmm_k1z_zmmm512",Movlps_m64_xmm:958,"958":"Movlps_m64_xmm",VEX_Vmovlps_m64_xmm:959,"959":"VEX_Vmovlps_m64_xmm",EVEX_Vmovlps_m64_xmm:960,"960":"EVEX_Vmovlps_m64_xmm",Movlpd_m64_xmm:961,"961":"Movlpd_m64_xmm",VEX_Vmovlpd_m64_xmm:962,"962":"VEX_Vmovlpd_m64_xmm",EVEX_Vmovlpd_m64_xmm:963,"963":"EVEX_Vmovlpd_m64_xmm",Unpcklps_xmm_xmmm128:964,"964":"Unpcklps_xmm_xmmm128",VEX_Vunpcklps_xmm_xmm_xmmm128:965,"965":"VEX_Vunpcklps_xmm_xmm_xmmm128",VEX_Vunpcklps_ymm_ymm_ymmm256:966,"966":"VEX_Vunpcklps_ymm_ymm_ymmm256",EVEX_Vunpcklps_xmm_k1z_xmm_xmmm128b32:967,"967":"EVEX_Vunpcklps_xmm_k1z_xmm_xmmm128b32",EVEX_Vunpcklps_ymm_k1z_ymm_ymmm256b32:968,"968":"EVEX_Vunpcklps_ymm_k1z_ymm_ymmm256b32",EVEX_Vunpcklps_zmm_k1z_zmm_zmmm512b32:969,"969":"EVEX_Vunpcklps_zmm_k1z_zmm_zmmm512b32",Unpcklpd_xmm_xmmm128:970,"970":"Unpcklpd_xmm_xmmm128",VEX_Vunpcklpd_xmm_xmm_xmmm128:971,"971":"VEX_Vunpcklpd_xmm_xmm_xmmm128",VEX_Vunpcklpd_ymm_ymm_ymmm256:972,"972":"VEX_Vunpcklpd_ymm_ymm_ymmm256",EVEX_Vunpcklpd_xmm_k1z_xmm_xmmm128b64:973,"973":"EVEX_Vunpcklpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vunpcklpd_ymm_k1z_ymm_ymmm256b64:974,"974":"EVEX_Vunpcklpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vunpcklpd_zmm_k1z_zmm_zmmm512b64:975,"975":"EVEX_Vunpcklpd_zmm_k1z_zmm_zmmm512b64",Unpckhps_xmm_xmmm128:976,"976":"Unpckhps_xmm_xmmm128",VEX_Vunpckhps_xmm_xmm_xmmm128:977,"977":"VEX_Vunpckhps_xmm_xmm_xmmm128",VEX_Vunpckhps_ymm_ymm_ymmm256:978,"978":"VEX_Vunpckhps_ymm_ymm_ymmm256",EVEX_Vunpckhps_xmm_k1z_xmm_xmmm128b32:979,"979":"EVEX_Vunpckhps_xmm_k1z_xmm_xmmm128b32",EVEX_Vunpckhps_ymm_k1z_ymm_ymmm256b32:980,"980":"EVEX_Vunpckhps_ymm_k1z_ymm_ymmm256b32",EVEX_Vunpckhps_zmm_k1z_zmm_zmmm512b32:981,"981":"EVEX_Vunpckhps_zmm_k1z_zmm_zmmm512b32",Unpckhpd_xmm_xmmm128:982,"982":"Unpckhpd_xmm_xmmm128",VEX_Vunpckhpd_xmm_xmm_xmmm128:983,"983":"VEX_Vunpckhpd_xmm_xmm_xmmm128",VEX_Vunpckhpd_ymm_ymm_ymmm256:984,"984":"VEX_Vunpckhpd_ymm_ymm_ymmm256",EVEX_Vunpckhpd_xmm_k1z_xmm_xmmm128b64:985,"985":"EVEX_Vunpckhpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vunpckhpd_ymm_k1z_ymm_ymmm256b64:986,"986":"EVEX_Vunpckhpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vunpckhpd_zmm_k1z_zmm_zmmm512b64:987,"987":"EVEX_Vunpckhpd_zmm_k1z_zmm_zmmm512b64",Movlhps_xmm_xmm:988,"988":"Movlhps_xmm_xmm",VEX_Vmovlhps_xmm_xmm_xmm:989,"989":"VEX_Vmovlhps_xmm_xmm_xmm",EVEX_Vmovlhps_xmm_xmm_xmm:990,"990":"EVEX_Vmovlhps_xmm_xmm_xmm",Movhps_xmm_m64:991,"991":"Movhps_xmm_m64",VEX_Vmovhps_xmm_xmm_m64:992,"992":"VEX_Vmovhps_xmm_xmm_m64",EVEX_Vmovhps_xmm_xmm_m64:993,"993":"EVEX_Vmovhps_xmm_xmm_m64",Movhpd_xmm_m64:994,"994":"Movhpd_xmm_m64",VEX_Vmovhpd_xmm_xmm_m64:995,"995":"VEX_Vmovhpd_xmm_xmm_m64",EVEX_Vmovhpd_xmm_xmm_m64:996,"996":"EVEX_Vmovhpd_xmm_xmm_m64",Movshdup_xmm_xmmm128:997,"997":"Movshdup_xmm_xmmm128",VEX_Vmovshdup_xmm_xmmm128:998,"998":"VEX_Vmovshdup_xmm_xmmm128",VEX_Vmovshdup_ymm_ymmm256:999,"999":"VEX_Vmovshdup_ymm_ymmm256",EVEX_Vmovshdup_xmm_k1z_xmmm128:1000,"1000":"EVEX_Vmovshdup_xmm_k1z_xmmm128",EVEX_Vmovshdup_ymm_k1z_ymmm256:1001,"1001":"EVEX_Vmovshdup_ymm_k1z_ymmm256",EVEX_Vmovshdup_zmm_k1z_zmmm512:1002,"1002":"EVEX_Vmovshdup_zmm_k1z_zmmm512",Movhps_m64_xmm:1003,"1003":"Movhps_m64_xmm",VEX_Vmovhps_m64_xmm:1004,"1004":"VEX_Vmovhps_m64_xmm",EVEX_Vmovhps_m64_xmm:1005,"1005":"EVEX_Vmovhps_m64_xmm",Movhpd_m64_xmm:1006,"1006":"Movhpd_m64_xmm",VEX_Vmovhpd_m64_xmm:1007,"1007":"VEX_Vmovhpd_m64_xmm",EVEX_Vmovhpd_m64_xmm:1008,"1008":"EVEX_Vmovhpd_m64_xmm",Reservednop_rm16_r16_0F18:1009,"1009":"Reservednop_rm16_r16_0F18",Reservednop_rm32_r32_0F18:1010,"1010":"Reservednop_rm32_r32_0F18",Reservednop_rm64_r64_0F18:1011,"1011":"Reservednop_rm64_r64_0F18",Reservednop_rm16_r16_0F19:1012,"1012":"Reservednop_rm16_r16_0F19",Reservednop_rm32_r32_0F19:1013,"1013":"Reservednop_rm32_r32_0F19",Reservednop_rm64_r64_0F19:1014,"1014":"Reservednop_rm64_r64_0F19",Reservednop_rm16_r16_0F1A:1015,"1015":"Reservednop_rm16_r16_0F1A",Reservednop_rm32_r32_0F1A:1016,"1016":"Reservednop_rm32_r32_0F1A",Reservednop_rm64_r64_0F1A:1017,"1017":"Reservednop_rm64_r64_0F1A",Reservednop_rm16_r16_0F1B:1018,"1018":"Reservednop_rm16_r16_0F1B",Reservednop_rm32_r32_0F1B:1019,"1019":"Reservednop_rm32_r32_0F1B",Reservednop_rm64_r64_0F1B:1020,"1020":"Reservednop_rm64_r64_0F1B",Reservednop_rm16_r16_0F1C:1021,"1021":"Reservednop_rm16_r16_0F1C",Reservednop_rm32_r32_0F1C:1022,"1022":"Reservednop_rm32_r32_0F1C",Reservednop_rm64_r64_0F1C:1023,"1023":"Reservednop_rm64_r64_0F1C",Reservednop_rm16_r16_0F1D:1024,"1024":"Reservednop_rm16_r16_0F1D",Reservednop_rm32_r32_0F1D:1025,"1025":"Reservednop_rm32_r32_0F1D",Reservednop_rm64_r64_0F1D:1026,"1026":"Reservednop_rm64_r64_0F1D",Reservednop_rm16_r16_0F1E:1027,"1027":"Reservednop_rm16_r16_0F1E",Reservednop_rm32_r32_0F1E:1028,"1028":"Reservednop_rm32_r32_0F1E",Reservednop_rm64_r64_0F1E:1029,"1029":"Reservednop_rm64_r64_0F1E",Reservednop_rm16_r16_0F1F:1030,"1030":"Reservednop_rm16_r16_0F1F",Reservednop_rm32_r32_0F1F:1031,"1031":"Reservednop_rm32_r32_0F1F",Reservednop_rm64_r64_0F1F:1032,"1032":"Reservednop_rm64_r64_0F1F",Prefetchnta_m8:1033,"1033":"Prefetchnta_m8",Prefetcht0_m8:1034,"1034":"Prefetcht0_m8",Prefetcht1_m8:1035,"1035":"Prefetcht1_m8",Prefetcht2_m8:1036,"1036":"Prefetcht2_m8",Bndldx_bnd_mib:1037,"1037":"Bndldx_bnd_mib",Bndmov_bnd_bndm64:1038,"1038":"Bndmov_bnd_bndm64",Bndmov_bnd_bndm128:1039,"1039":"Bndmov_bnd_bndm128",Bndcl_bnd_rm32:1040,"1040":"Bndcl_bnd_rm32",Bndcl_bnd_rm64:1041,"1041":"Bndcl_bnd_rm64",Bndcu_bnd_rm32:1042,"1042":"Bndcu_bnd_rm32",Bndcu_bnd_rm64:1043,"1043":"Bndcu_bnd_rm64",Bndstx_mib_bnd:1044,"1044":"Bndstx_mib_bnd",Bndmov_bndm64_bnd:1045,"1045":"Bndmov_bndm64_bnd",Bndmov_bndm128_bnd:1046,"1046":"Bndmov_bndm128_bnd",Bndmk_bnd_m32:1047,"1047":"Bndmk_bnd_m32",Bndmk_bnd_m64:1048,"1048":"Bndmk_bnd_m64",Bndcn_bnd_rm32:1049,"1049":"Bndcn_bnd_rm32",Bndcn_bnd_rm64:1050,"1050":"Bndcn_bnd_rm64",Cldemote_m8:1051,"1051":"Cldemote_m8",Rdsspd_r32:1052,"1052":"Rdsspd_r32",Rdsspq_r64:1053,"1053":"Rdsspq_r64",Endbr64:1054,"1054":"Endbr64",Endbr32:1055,"1055":"Endbr32",Nop_rm16:1056,"1056":"Nop_rm16",Nop_rm32:1057,"1057":"Nop_rm32",Nop_rm64:1058,"1058":"Nop_rm64",Mov_r32_cr:1059,"1059":"Mov_r32_cr",Mov_r64_cr:1060,"1060":"Mov_r64_cr",Mov_r32_dr:1061,"1061":"Mov_r32_dr",Mov_r64_dr:1062,"1062":"Mov_r64_dr",Mov_cr_r32:1063,"1063":"Mov_cr_r32",Mov_cr_r64:1064,"1064":"Mov_cr_r64",Mov_dr_r32:1065,"1065":"Mov_dr_r32",Mov_dr_r64:1066,"1066":"Mov_dr_r64",Mov_r32_tr:1067,"1067":"Mov_r32_tr",Mov_tr_r32:1068,"1068":"Mov_tr_r32",Movaps_xmm_xmmm128:1069,"1069":"Movaps_xmm_xmmm128",VEX_Vmovaps_xmm_xmmm128:1070,"1070":"VEX_Vmovaps_xmm_xmmm128",VEX_Vmovaps_ymm_ymmm256:1071,"1071":"VEX_Vmovaps_ymm_ymmm256",EVEX_Vmovaps_xmm_k1z_xmmm128:1072,"1072":"EVEX_Vmovaps_xmm_k1z_xmmm128",EVEX_Vmovaps_ymm_k1z_ymmm256:1073,"1073":"EVEX_Vmovaps_ymm_k1z_ymmm256",EVEX_Vmovaps_zmm_k1z_zmmm512:1074,"1074":"EVEX_Vmovaps_zmm_k1z_zmmm512",Movapd_xmm_xmmm128:1075,"1075":"Movapd_xmm_xmmm128",VEX_Vmovapd_xmm_xmmm128:1076,"1076":"VEX_Vmovapd_xmm_xmmm128",VEX_Vmovapd_ymm_ymmm256:1077,"1077":"VEX_Vmovapd_ymm_ymmm256",EVEX_Vmovapd_xmm_k1z_xmmm128:1078,"1078":"EVEX_Vmovapd_xmm_k1z_xmmm128",EVEX_Vmovapd_ymm_k1z_ymmm256:1079,"1079":"EVEX_Vmovapd_ymm_k1z_ymmm256",EVEX_Vmovapd_zmm_k1z_zmmm512:1080,"1080":"EVEX_Vmovapd_zmm_k1z_zmmm512",Movaps_xmmm128_xmm:1081,"1081":"Movaps_xmmm128_xmm",VEX_Vmovaps_xmmm128_xmm:1082,"1082":"VEX_Vmovaps_xmmm128_xmm",VEX_Vmovaps_ymmm256_ymm:1083,"1083":"VEX_Vmovaps_ymmm256_ymm",EVEX_Vmovaps_xmmm128_k1z_xmm:1084,"1084":"EVEX_Vmovaps_xmmm128_k1z_xmm",EVEX_Vmovaps_ymmm256_k1z_ymm:1085,"1085":"EVEX_Vmovaps_ymmm256_k1z_ymm",EVEX_Vmovaps_zmmm512_k1z_zmm:1086,"1086":"EVEX_Vmovaps_zmmm512_k1z_zmm",Movapd_xmmm128_xmm:1087,"1087":"Movapd_xmmm128_xmm",VEX_Vmovapd_xmmm128_xmm:1088,"1088":"VEX_Vmovapd_xmmm128_xmm",VEX_Vmovapd_ymmm256_ymm:1089,"1089":"VEX_Vmovapd_ymmm256_ymm",EVEX_Vmovapd_xmmm128_k1z_xmm:1090,"1090":"EVEX_Vmovapd_xmmm128_k1z_xmm",EVEX_Vmovapd_ymmm256_k1z_ymm:1091,"1091":"EVEX_Vmovapd_ymmm256_k1z_ymm",EVEX_Vmovapd_zmmm512_k1z_zmm:1092,"1092":"EVEX_Vmovapd_zmmm512_k1z_zmm",Cvtpi2ps_xmm_mmm64:1093,"1093":"Cvtpi2ps_xmm_mmm64",Cvtpi2pd_xmm_mmm64:1094,"1094":"Cvtpi2pd_xmm_mmm64",Cvtsi2ss_xmm_rm32:1095,"1095":"Cvtsi2ss_xmm_rm32",Cvtsi2ss_xmm_rm64:1096,"1096":"Cvtsi2ss_xmm_rm64",VEX_Vcvtsi2ss_xmm_xmm_rm32:1097,"1097":"VEX_Vcvtsi2ss_xmm_xmm_rm32",VEX_Vcvtsi2ss_xmm_xmm_rm64:1098,"1098":"VEX_Vcvtsi2ss_xmm_xmm_rm64",EVEX_Vcvtsi2ss_xmm_xmm_rm32_er:1099,"1099":"EVEX_Vcvtsi2ss_xmm_xmm_rm32_er",EVEX_Vcvtsi2ss_xmm_xmm_rm64_er:1100,"1100":"EVEX_Vcvtsi2ss_xmm_xmm_rm64_er",Cvtsi2sd_xmm_rm32:1101,"1101":"Cvtsi2sd_xmm_rm32",Cvtsi2sd_xmm_rm64:1102,"1102":"Cvtsi2sd_xmm_rm64",VEX_Vcvtsi2sd_xmm_xmm_rm32:1103,"1103":"VEX_Vcvtsi2sd_xmm_xmm_rm32",VEX_Vcvtsi2sd_xmm_xmm_rm64:1104,"1104":"VEX_Vcvtsi2sd_xmm_xmm_rm64",EVEX_Vcvtsi2sd_xmm_xmm_rm32_er:1105,"1105":"EVEX_Vcvtsi2sd_xmm_xmm_rm32_er",EVEX_Vcvtsi2sd_xmm_xmm_rm64_er:1106,"1106":"EVEX_Vcvtsi2sd_xmm_xmm_rm64_er",Movntps_m128_xmm:1107,"1107":"Movntps_m128_xmm",VEX_Vmovntps_m128_xmm:1108,"1108":"VEX_Vmovntps_m128_xmm",VEX_Vmovntps_m256_ymm:1109,"1109":"VEX_Vmovntps_m256_ymm",EVEX_Vmovntps_m128_xmm:1110,"1110":"EVEX_Vmovntps_m128_xmm",EVEX_Vmovntps_m256_ymm:1111,"1111":"EVEX_Vmovntps_m256_ymm",EVEX_Vmovntps_m512_zmm:1112,"1112":"EVEX_Vmovntps_m512_zmm",Movntpd_m128_xmm:1113,"1113":"Movntpd_m128_xmm",VEX_Vmovntpd_m128_xmm:1114,"1114":"VEX_Vmovntpd_m128_xmm",VEX_Vmovntpd_m256_ymm:1115,"1115":"VEX_Vmovntpd_m256_ymm",EVEX_Vmovntpd_m128_xmm:1116,"1116":"EVEX_Vmovntpd_m128_xmm",EVEX_Vmovntpd_m256_ymm:1117,"1117":"EVEX_Vmovntpd_m256_ymm",EVEX_Vmovntpd_m512_zmm:1118,"1118":"EVEX_Vmovntpd_m512_zmm",Movntss_m32_xmm:1119,"1119":"Movntss_m32_xmm",Movntsd_m64_xmm:1120,"1120":"Movntsd_m64_xmm",Cvttps2pi_mm_xmmm64:1121,"1121":"Cvttps2pi_mm_xmmm64",Cvttpd2pi_mm_xmmm128:1122,"1122":"Cvttpd2pi_mm_xmmm128",Cvttss2si_r32_xmmm32:1123,"1123":"Cvttss2si_r32_xmmm32",Cvttss2si_r64_xmmm32:1124,"1124":"Cvttss2si_r64_xmmm32",VEX_Vcvttss2si_r32_xmmm32:1125,"1125":"VEX_Vcvttss2si_r32_xmmm32",VEX_Vcvttss2si_r64_xmmm32:1126,"1126":"VEX_Vcvttss2si_r64_xmmm32",EVEX_Vcvttss2si_r32_xmmm32_sae:1127,"1127":"EVEX_Vcvttss2si_r32_xmmm32_sae",EVEX_Vcvttss2si_r64_xmmm32_sae:1128,"1128":"EVEX_Vcvttss2si_r64_xmmm32_sae",Cvttsd2si_r32_xmmm64:1129,"1129":"Cvttsd2si_r32_xmmm64",Cvttsd2si_r64_xmmm64:1130,"1130":"Cvttsd2si_r64_xmmm64",VEX_Vcvttsd2si_r32_xmmm64:1131,"1131":"VEX_Vcvttsd2si_r32_xmmm64",VEX_Vcvttsd2si_r64_xmmm64:1132,"1132":"VEX_Vcvttsd2si_r64_xmmm64",EVEX_Vcvttsd2si_r32_xmmm64_sae:1133,"1133":"EVEX_Vcvttsd2si_r32_xmmm64_sae",EVEX_Vcvttsd2si_r64_xmmm64_sae:1134,"1134":"EVEX_Vcvttsd2si_r64_xmmm64_sae",Cvtps2pi_mm_xmmm64:1135,"1135":"Cvtps2pi_mm_xmmm64",Cvtpd2pi_mm_xmmm128:1136,"1136":"Cvtpd2pi_mm_xmmm128",Cvtss2si_r32_xmmm32:1137,"1137":"Cvtss2si_r32_xmmm32",Cvtss2si_r64_xmmm32:1138,"1138":"Cvtss2si_r64_xmmm32",VEX_Vcvtss2si_r32_xmmm32:1139,"1139":"VEX_Vcvtss2si_r32_xmmm32",VEX_Vcvtss2si_r64_xmmm32:1140,"1140":"VEX_Vcvtss2si_r64_xmmm32",EVEX_Vcvtss2si_r32_xmmm32_er:1141,"1141":"EVEX_Vcvtss2si_r32_xmmm32_er",EVEX_Vcvtss2si_r64_xmmm32_er:1142,"1142":"EVEX_Vcvtss2si_r64_xmmm32_er",Cvtsd2si_r32_xmmm64:1143,"1143":"Cvtsd2si_r32_xmmm64",Cvtsd2si_r64_xmmm64:1144,"1144":"Cvtsd2si_r64_xmmm64",VEX_Vcvtsd2si_r32_xmmm64:1145,"1145":"VEX_Vcvtsd2si_r32_xmmm64",VEX_Vcvtsd2si_r64_xmmm64:1146,"1146":"VEX_Vcvtsd2si_r64_xmmm64",EVEX_Vcvtsd2si_r32_xmmm64_er:1147,"1147":"EVEX_Vcvtsd2si_r32_xmmm64_er",EVEX_Vcvtsd2si_r64_xmmm64_er:1148,"1148":"EVEX_Vcvtsd2si_r64_xmmm64_er",Ucomiss_xmm_xmmm32:1149,"1149":"Ucomiss_xmm_xmmm32",VEX_Vucomiss_xmm_xmmm32:1150,"1150":"VEX_Vucomiss_xmm_xmmm32",EVEX_Vucomiss_xmm_xmmm32_sae:1151,"1151":"EVEX_Vucomiss_xmm_xmmm32_sae",Ucomisd_xmm_xmmm64:1152,"1152":"Ucomisd_xmm_xmmm64",VEX_Vucomisd_xmm_xmmm64:1153,"1153":"VEX_Vucomisd_xmm_xmmm64",EVEX_Vucomisd_xmm_xmmm64_sae:1154,"1154":"EVEX_Vucomisd_xmm_xmmm64_sae",Comiss_xmm_xmmm32:1155,"1155":"Comiss_xmm_xmmm32",Comisd_xmm_xmmm64:1156,"1156":"Comisd_xmm_xmmm64",VEX_Vcomiss_xmm_xmmm32:1157,"1157":"VEX_Vcomiss_xmm_xmmm32",VEX_Vcomisd_xmm_xmmm64:1158,"1158":"VEX_Vcomisd_xmm_xmmm64",EVEX_Vcomiss_xmm_xmmm32_sae:1159,"1159":"EVEX_Vcomiss_xmm_xmmm32_sae",EVEX_Vcomisd_xmm_xmmm64_sae:1160,"1160":"EVEX_Vcomisd_xmm_xmmm64_sae",Wrmsr:1161,"1161":"Wrmsr",Rdtsc:1162,"1162":"Rdtsc",Rdmsr:1163,"1163":"Rdmsr",Rdpmc:1164,"1164":"Rdpmc",Sysenter:1165,"1165":"Sysenter",Sysexitd:1166,"1166":"Sysexitd",Sysexitq:1167,"1167":"Sysexitq",Getsecd:1168,"1168":"Getsecd",Cmovo_r16_rm16:1169,"1169":"Cmovo_r16_rm16",Cmovo_r32_rm32:1170,"1170":"Cmovo_r32_rm32",Cmovo_r64_rm64:1171,"1171":"Cmovo_r64_rm64",Cmovno_r16_rm16:1172,"1172":"Cmovno_r16_rm16",Cmovno_r32_rm32:1173,"1173":"Cmovno_r32_rm32",Cmovno_r64_rm64:1174,"1174":"Cmovno_r64_rm64",Cmovb_r16_rm16:1175,"1175":"Cmovb_r16_rm16",Cmovb_r32_rm32:1176,"1176":"Cmovb_r32_rm32",Cmovb_r64_rm64:1177,"1177":"Cmovb_r64_rm64",Cmovae_r16_rm16:1178,"1178":"Cmovae_r16_rm16",Cmovae_r32_rm32:1179,"1179":"Cmovae_r32_rm32",Cmovae_r64_rm64:1180,"1180":"Cmovae_r64_rm64",Cmove_r16_rm16:1181,"1181":"Cmove_r16_rm16",Cmove_r32_rm32:1182,"1182":"Cmove_r32_rm32",Cmove_r64_rm64:1183,"1183":"Cmove_r64_rm64",Cmovne_r16_rm16:1184,"1184":"Cmovne_r16_rm16",Cmovne_r32_rm32:1185,"1185":"Cmovne_r32_rm32",Cmovne_r64_rm64:1186,"1186":"Cmovne_r64_rm64",Cmovbe_r16_rm16:1187,"1187":"Cmovbe_r16_rm16",Cmovbe_r32_rm32:1188,"1188":"Cmovbe_r32_rm32",Cmovbe_r64_rm64:1189,"1189":"Cmovbe_r64_rm64",Cmova_r16_rm16:1190,"1190":"Cmova_r16_rm16",Cmova_r32_rm32:1191,"1191":"Cmova_r32_rm32",Cmova_r64_rm64:1192,"1192":"Cmova_r64_rm64",Cmovs_r16_rm16:1193,"1193":"Cmovs_r16_rm16",Cmovs_r32_rm32:1194,"1194":"Cmovs_r32_rm32",Cmovs_r64_rm64:1195,"1195":"Cmovs_r64_rm64",Cmovns_r16_rm16:1196,"1196":"Cmovns_r16_rm16",Cmovns_r32_rm32:1197,"1197":"Cmovns_r32_rm32",Cmovns_r64_rm64:1198,"1198":"Cmovns_r64_rm64",Cmovp_r16_rm16:1199,"1199":"Cmovp_r16_rm16",Cmovp_r32_rm32:1200,"1200":"Cmovp_r32_rm32",Cmovp_r64_rm64:1201,"1201":"Cmovp_r64_rm64",Cmovnp_r16_rm16:1202,"1202":"Cmovnp_r16_rm16",Cmovnp_r32_rm32:1203,"1203":"Cmovnp_r32_rm32",Cmovnp_r64_rm64:1204,"1204":"Cmovnp_r64_rm64",Cmovl_r16_rm16:1205,"1205":"Cmovl_r16_rm16",Cmovl_r32_rm32:1206,"1206":"Cmovl_r32_rm32",Cmovl_r64_rm64:1207,"1207":"Cmovl_r64_rm64",Cmovge_r16_rm16:1208,"1208":"Cmovge_r16_rm16",Cmovge_r32_rm32:1209,"1209":"Cmovge_r32_rm32",Cmovge_r64_rm64:1210,"1210":"Cmovge_r64_rm64",Cmovle_r16_rm16:1211,"1211":"Cmovle_r16_rm16",Cmovle_r32_rm32:1212,"1212":"Cmovle_r32_rm32",Cmovle_r64_rm64:1213,"1213":"Cmovle_r64_rm64",Cmovg_r16_rm16:1214,"1214":"Cmovg_r16_rm16",Cmovg_r32_rm32:1215,"1215":"Cmovg_r32_rm32",Cmovg_r64_rm64:1216,"1216":"Cmovg_r64_rm64",VEX_Kandw_kr_kr_kr:1217,"1217":"VEX_Kandw_kr_kr_kr",VEX_Kandq_kr_kr_kr:1218,"1218":"VEX_Kandq_kr_kr_kr",VEX_Kandb_kr_kr_kr:1219,"1219":"VEX_Kandb_kr_kr_kr",VEX_Kandd_kr_kr_kr:1220,"1220":"VEX_Kandd_kr_kr_kr",VEX_Kandnw_kr_kr_kr:1221,"1221":"VEX_Kandnw_kr_kr_kr",VEX_Kandnq_kr_kr_kr:1222,"1222":"VEX_Kandnq_kr_kr_kr",VEX_Kandnb_kr_kr_kr:1223,"1223":"VEX_Kandnb_kr_kr_kr",VEX_Kandnd_kr_kr_kr:1224,"1224":"VEX_Kandnd_kr_kr_kr",VEX_Knotw_kr_kr:1225,"1225":"VEX_Knotw_kr_kr",VEX_Knotq_kr_kr:1226,"1226":"VEX_Knotq_kr_kr",VEX_Knotb_kr_kr:1227,"1227":"VEX_Knotb_kr_kr",VEX_Knotd_kr_kr:1228,"1228":"VEX_Knotd_kr_kr",VEX_Korw_kr_kr_kr:1229,"1229":"VEX_Korw_kr_kr_kr",VEX_Korq_kr_kr_kr:1230,"1230":"VEX_Korq_kr_kr_kr",VEX_Korb_kr_kr_kr:1231,"1231":"VEX_Korb_kr_kr_kr",VEX_Kord_kr_kr_kr:1232,"1232":"VEX_Kord_kr_kr_kr",VEX_Kxnorw_kr_kr_kr:1233,"1233":"VEX_Kxnorw_kr_kr_kr",VEX_Kxnorq_kr_kr_kr:1234,"1234":"VEX_Kxnorq_kr_kr_kr",VEX_Kxnorb_kr_kr_kr:1235,"1235":"VEX_Kxnorb_kr_kr_kr",VEX_Kxnord_kr_kr_kr:1236,"1236":"VEX_Kxnord_kr_kr_kr",VEX_Kxorw_kr_kr_kr:1237,"1237":"VEX_Kxorw_kr_kr_kr",VEX_Kxorq_kr_kr_kr:1238,"1238":"VEX_Kxorq_kr_kr_kr",VEX_Kxorb_kr_kr_kr:1239,"1239":"VEX_Kxorb_kr_kr_kr",VEX_Kxord_kr_kr_kr:1240,"1240":"VEX_Kxord_kr_kr_kr",VEX_Kaddw_kr_kr_kr:1241,"1241":"VEX_Kaddw_kr_kr_kr",VEX_Kaddq_kr_kr_kr:1242,"1242":"VEX_Kaddq_kr_kr_kr",VEX_Kaddb_kr_kr_kr:1243,"1243":"VEX_Kaddb_kr_kr_kr",VEX_Kaddd_kr_kr_kr:1244,"1244":"VEX_Kaddd_kr_kr_kr",VEX_Kunpckwd_kr_kr_kr:1245,"1245":"VEX_Kunpckwd_kr_kr_kr",VEX_Kunpckdq_kr_kr_kr:1246,"1246":"VEX_Kunpckdq_kr_kr_kr",VEX_Kunpckbw_kr_kr_kr:1247,"1247":"VEX_Kunpckbw_kr_kr_kr",Movmskps_r32_xmm:1248,"1248":"Movmskps_r32_xmm",Movmskps_r64_xmm:1249,"1249":"Movmskps_r64_xmm",VEX_Vmovmskps_r32_xmm:1250,"1250":"VEX_Vmovmskps_r32_xmm",VEX_Vmovmskps_r64_xmm:1251,"1251":"VEX_Vmovmskps_r64_xmm",VEX_Vmovmskps_r32_ymm:1252,"1252":"VEX_Vmovmskps_r32_ymm",VEX_Vmovmskps_r64_ymm:1253,"1253":"VEX_Vmovmskps_r64_ymm",Movmskpd_r32_xmm:1254,"1254":"Movmskpd_r32_xmm",Movmskpd_r64_xmm:1255,"1255":"Movmskpd_r64_xmm",VEX_Vmovmskpd_r32_xmm:1256,"1256":"VEX_Vmovmskpd_r32_xmm",VEX_Vmovmskpd_r64_xmm:1257,"1257":"VEX_Vmovmskpd_r64_xmm",VEX_Vmovmskpd_r32_ymm:1258,"1258":"VEX_Vmovmskpd_r32_ymm",VEX_Vmovmskpd_r64_ymm:1259,"1259":"VEX_Vmovmskpd_r64_ymm",Sqrtps_xmm_xmmm128:1260,"1260":"Sqrtps_xmm_xmmm128",VEX_Vsqrtps_xmm_xmmm128:1261,"1261":"VEX_Vsqrtps_xmm_xmmm128",VEX_Vsqrtps_ymm_ymmm256:1262,"1262":"VEX_Vsqrtps_ymm_ymmm256",EVEX_Vsqrtps_xmm_k1z_xmmm128b32:1263,"1263":"EVEX_Vsqrtps_xmm_k1z_xmmm128b32",EVEX_Vsqrtps_ymm_k1z_ymmm256b32:1264,"1264":"EVEX_Vsqrtps_ymm_k1z_ymmm256b32",EVEX_Vsqrtps_zmm_k1z_zmmm512b32_er:1265,"1265":"EVEX_Vsqrtps_zmm_k1z_zmmm512b32_er",Sqrtpd_xmm_xmmm128:1266,"1266":"Sqrtpd_xmm_xmmm128",VEX_Vsqrtpd_xmm_xmmm128:1267,"1267":"VEX_Vsqrtpd_xmm_xmmm128",VEX_Vsqrtpd_ymm_ymmm256:1268,"1268":"VEX_Vsqrtpd_ymm_ymmm256",EVEX_Vsqrtpd_xmm_k1z_xmmm128b64:1269,"1269":"EVEX_Vsqrtpd_xmm_k1z_xmmm128b64",EVEX_Vsqrtpd_ymm_k1z_ymmm256b64:1270,"1270":"EVEX_Vsqrtpd_ymm_k1z_ymmm256b64",EVEX_Vsqrtpd_zmm_k1z_zmmm512b64_er:1271,"1271":"EVEX_Vsqrtpd_zmm_k1z_zmmm512b64_er",Sqrtss_xmm_xmmm32:1272,"1272":"Sqrtss_xmm_xmmm32",VEX_Vsqrtss_xmm_xmm_xmmm32:1273,"1273":"VEX_Vsqrtss_xmm_xmm_xmmm32",EVEX_Vsqrtss_xmm_k1z_xmm_xmmm32_er:1274,"1274":"EVEX_Vsqrtss_xmm_k1z_xmm_xmmm32_er",Sqrtsd_xmm_xmmm64:1275,"1275":"Sqrtsd_xmm_xmmm64",VEX_Vsqrtsd_xmm_xmm_xmmm64:1276,"1276":"VEX_Vsqrtsd_xmm_xmm_xmmm64",EVEX_Vsqrtsd_xmm_k1z_xmm_xmmm64_er:1277,"1277":"EVEX_Vsqrtsd_xmm_k1z_xmm_xmmm64_er",Rsqrtps_xmm_xmmm128:1278,"1278":"Rsqrtps_xmm_xmmm128",VEX_Vrsqrtps_xmm_xmmm128:1279,"1279":"VEX_Vrsqrtps_xmm_xmmm128",VEX_Vrsqrtps_ymm_ymmm256:1280,"1280":"VEX_Vrsqrtps_ymm_ymmm256",Rsqrtss_xmm_xmmm32:1281,"1281":"Rsqrtss_xmm_xmmm32",VEX_Vrsqrtss_xmm_xmm_xmmm32:1282,"1282":"VEX_Vrsqrtss_xmm_xmm_xmmm32",Rcpps_xmm_xmmm128:1283,"1283":"Rcpps_xmm_xmmm128",VEX_Vrcpps_xmm_xmmm128:1284,"1284":"VEX_Vrcpps_xmm_xmmm128",VEX_Vrcpps_ymm_ymmm256:1285,"1285":"VEX_Vrcpps_ymm_ymmm256",Rcpss_xmm_xmmm32:1286,"1286":"Rcpss_xmm_xmmm32",VEX_Vrcpss_xmm_xmm_xmmm32:1287,"1287":"VEX_Vrcpss_xmm_xmm_xmmm32",Andps_xmm_xmmm128:1288,"1288":"Andps_xmm_xmmm128",VEX_Vandps_xmm_xmm_xmmm128:1289,"1289":"VEX_Vandps_xmm_xmm_xmmm128",VEX_Vandps_ymm_ymm_ymmm256:1290,"1290":"VEX_Vandps_ymm_ymm_ymmm256",EVEX_Vandps_xmm_k1z_xmm_xmmm128b32:1291,"1291":"EVEX_Vandps_xmm_k1z_xmm_xmmm128b32",EVEX_Vandps_ymm_k1z_ymm_ymmm256b32:1292,"1292":"EVEX_Vandps_ymm_k1z_ymm_ymmm256b32",EVEX_Vandps_zmm_k1z_zmm_zmmm512b32:1293,"1293":"EVEX_Vandps_zmm_k1z_zmm_zmmm512b32",Andpd_xmm_xmmm128:1294,"1294":"Andpd_xmm_xmmm128",VEX_Vandpd_xmm_xmm_xmmm128:1295,"1295":"VEX_Vandpd_xmm_xmm_xmmm128",VEX_Vandpd_ymm_ymm_ymmm256:1296,"1296":"VEX_Vandpd_ymm_ymm_ymmm256",EVEX_Vandpd_xmm_k1z_xmm_xmmm128b64:1297,"1297":"EVEX_Vandpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vandpd_ymm_k1z_ymm_ymmm256b64:1298,"1298":"EVEX_Vandpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vandpd_zmm_k1z_zmm_zmmm512b64:1299,"1299":"EVEX_Vandpd_zmm_k1z_zmm_zmmm512b64",Andnps_xmm_xmmm128:1300,"1300":"Andnps_xmm_xmmm128",VEX_Vandnps_xmm_xmm_xmmm128:1301,"1301":"VEX_Vandnps_xmm_xmm_xmmm128",VEX_Vandnps_ymm_ymm_ymmm256:1302,"1302":"VEX_Vandnps_ymm_ymm_ymmm256",EVEX_Vandnps_xmm_k1z_xmm_xmmm128b32:1303,"1303":"EVEX_Vandnps_xmm_k1z_xmm_xmmm128b32",EVEX_Vandnps_ymm_k1z_ymm_ymmm256b32:1304,"1304":"EVEX_Vandnps_ymm_k1z_ymm_ymmm256b32",EVEX_Vandnps_zmm_k1z_zmm_zmmm512b32:1305,"1305":"EVEX_Vandnps_zmm_k1z_zmm_zmmm512b32",Andnpd_xmm_xmmm128:1306,"1306":"Andnpd_xmm_xmmm128",VEX_Vandnpd_xmm_xmm_xmmm128:1307,"1307":"VEX_Vandnpd_xmm_xmm_xmmm128",VEX_Vandnpd_ymm_ymm_ymmm256:1308,"1308":"VEX_Vandnpd_ymm_ymm_ymmm256",EVEX_Vandnpd_xmm_k1z_xmm_xmmm128b64:1309,"1309":"EVEX_Vandnpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vandnpd_ymm_k1z_ymm_ymmm256b64:1310,"1310":"EVEX_Vandnpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vandnpd_zmm_k1z_zmm_zmmm512b64:1311,"1311":"EVEX_Vandnpd_zmm_k1z_zmm_zmmm512b64",Orps_xmm_xmmm128:1312,"1312":"Orps_xmm_xmmm128",VEX_Vorps_xmm_xmm_xmmm128:1313,"1313":"VEX_Vorps_xmm_xmm_xmmm128",VEX_Vorps_ymm_ymm_ymmm256:1314,"1314":"VEX_Vorps_ymm_ymm_ymmm256",EVEX_Vorps_xmm_k1z_xmm_xmmm128b32:1315,"1315":"EVEX_Vorps_xmm_k1z_xmm_xmmm128b32",EVEX_Vorps_ymm_k1z_ymm_ymmm256b32:1316,"1316":"EVEX_Vorps_ymm_k1z_ymm_ymmm256b32",EVEX_Vorps_zmm_k1z_zmm_zmmm512b32:1317,"1317":"EVEX_Vorps_zmm_k1z_zmm_zmmm512b32",Orpd_xmm_xmmm128:1318,"1318":"Orpd_xmm_xmmm128",VEX_Vorpd_xmm_xmm_xmmm128:1319,"1319":"VEX_Vorpd_xmm_xmm_xmmm128",VEX_Vorpd_ymm_ymm_ymmm256:1320,"1320":"VEX_Vorpd_ymm_ymm_ymmm256",EVEX_Vorpd_xmm_k1z_xmm_xmmm128b64:1321,"1321":"EVEX_Vorpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vorpd_ymm_k1z_ymm_ymmm256b64:1322,"1322":"EVEX_Vorpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vorpd_zmm_k1z_zmm_zmmm512b64:1323,"1323":"EVEX_Vorpd_zmm_k1z_zmm_zmmm512b64",Xorps_xmm_xmmm128:1324,"1324":"Xorps_xmm_xmmm128",VEX_Vxorps_xmm_xmm_xmmm128:1325,"1325":"VEX_Vxorps_xmm_xmm_xmmm128",VEX_Vxorps_ymm_ymm_ymmm256:1326,"1326":"VEX_Vxorps_ymm_ymm_ymmm256",EVEX_Vxorps_xmm_k1z_xmm_xmmm128b32:1327,"1327":"EVEX_Vxorps_xmm_k1z_xmm_xmmm128b32",EVEX_Vxorps_ymm_k1z_ymm_ymmm256b32:1328,"1328":"EVEX_Vxorps_ymm_k1z_ymm_ymmm256b32",EVEX_Vxorps_zmm_k1z_zmm_zmmm512b32:1329,"1329":"EVEX_Vxorps_zmm_k1z_zmm_zmmm512b32",Xorpd_xmm_xmmm128:1330,"1330":"Xorpd_xmm_xmmm128",VEX_Vxorpd_xmm_xmm_xmmm128:1331,"1331":"VEX_Vxorpd_xmm_xmm_xmmm128",VEX_Vxorpd_ymm_ymm_ymmm256:1332,"1332":"VEX_Vxorpd_ymm_ymm_ymmm256",EVEX_Vxorpd_xmm_k1z_xmm_xmmm128b64:1333,"1333":"EVEX_Vxorpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vxorpd_ymm_k1z_ymm_ymmm256b64:1334,"1334":"EVEX_Vxorpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vxorpd_zmm_k1z_zmm_zmmm512b64:1335,"1335":"EVEX_Vxorpd_zmm_k1z_zmm_zmmm512b64",Addps_xmm_xmmm128:1336,"1336":"Addps_xmm_xmmm128",VEX_Vaddps_xmm_xmm_xmmm128:1337,"1337":"VEX_Vaddps_xmm_xmm_xmmm128",VEX_Vaddps_ymm_ymm_ymmm256:1338,"1338":"VEX_Vaddps_ymm_ymm_ymmm256",EVEX_Vaddps_xmm_k1z_xmm_xmmm128b32:1339,"1339":"EVEX_Vaddps_xmm_k1z_xmm_xmmm128b32",EVEX_Vaddps_ymm_k1z_ymm_ymmm256b32:1340,"1340":"EVEX_Vaddps_ymm_k1z_ymm_ymmm256b32",EVEX_Vaddps_zmm_k1z_zmm_zmmm512b32_er:1341,"1341":"EVEX_Vaddps_zmm_k1z_zmm_zmmm512b32_er",Addpd_xmm_xmmm128:1342,"1342":"Addpd_xmm_xmmm128",VEX_Vaddpd_xmm_xmm_xmmm128:1343,"1343":"VEX_Vaddpd_xmm_xmm_xmmm128",VEX_Vaddpd_ymm_ymm_ymmm256:1344,"1344":"VEX_Vaddpd_ymm_ymm_ymmm256",EVEX_Vaddpd_xmm_k1z_xmm_xmmm128b64:1345,"1345":"EVEX_Vaddpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vaddpd_ymm_k1z_ymm_ymmm256b64:1346,"1346":"EVEX_Vaddpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vaddpd_zmm_k1z_zmm_zmmm512b64_er:1347,"1347":"EVEX_Vaddpd_zmm_k1z_zmm_zmmm512b64_er",Addss_xmm_xmmm32:1348,"1348":"Addss_xmm_xmmm32",VEX_Vaddss_xmm_xmm_xmmm32:1349,"1349":"VEX_Vaddss_xmm_xmm_xmmm32",EVEX_Vaddss_xmm_k1z_xmm_xmmm32_er:1350,"1350":"EVEX_Vaddss_xmm_k1z_xmm_xmmm32_er",Addsd_xmm_xmmm64:1351,"1351":"Addsd_xmm_xmmm64",VEX_Vaddsd_xmm_xmm_xmmm64:1352,"1352":"VEX_Vaddsd_xmm_xmm_xmmm64",EVEX_Vaddsd_xmm_k1z_xmm_xmmm64_er:1353,"1353":"EVEX_Vaddsd_xmm_k1z_xmm_xmmm64_er",Mulps_xmm_xmmm128:1354,"1354":"Mulps_xmm_xmmm128",VEX_Vmulps_xmm_xmm_xmmm128:1355,"1355":"VEX_Vmulps_xmm_xmm_xmmm128",VEX_Vmulps_ymm_ymm_ymmm256:1356,"1356":"VEX_Vmulps_ymm_ymm_ymmm256",EVEX_Vmulps_xmm_k1z_xmm_xmmm128b32:1357,"1357":"EVEX_Vmulps_xmm_k1z_xmm_xmmm128b32",EVEX_Vmulps_ymm_k1z_ymm_ymmm256b32:1358,"1358":"EVEX_Vmulps_ymm_k1z_ymm_ymmm256b32",EVEX_Vmulps_zmm_k1z_zmm_zmmm512b32_er:1359,"1359":"EVEX_Vmulps_zmm_k1z_zmm_zmmm512b32_er",Mulpd_xmm_xmmm128:1360,"1360":"Mulpd_xmm_xmmm128",VEX_Vmulpd_xmm_xmm_xmmm128:1361,"1361":"VEX_Vmulpd_xmm_xmm_xmmm128",VEX_Vmulpd_ymm_ymm_ymmm256:1362,"1362":"VEX_Vmulpd_ymm_ymm_ymmm256",EVEX_Vmulpd_xmm_k1z_xmm_xmmm128b64:1363,"1363":"EVEX_Vmulpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vmulpd_ymm_k1z_ymm_ymmm256b64:1364,"1364":"EVEX_Vmulpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vmulpd_zmm_k1z_zmm_zmmm512b64_er:1365,"1365":"EVEX_Vmulpd_zmm_k1z_zmm_zmmm512b64_er",Mulss_xmm_xmmm32:1366,"1366":"Mulss_xmm_xmmm32",VEX_Vmulss_xmm_xmm_xmmm32:1367,"1367":"VEX_Vmulss_xmm_xmm_xmmm32",EVEX_Vmulss_xmm_k1z_xmm_xmmm32_er:1368,"1368":"EVEX_Vmulss_xmm_k1z_xmm_xmmm32_er",Mulsd_xmm_xmmm64:1369,"1369":"Mulsd_xmm_xmmm64",VEX_Vmulsd_xmm_xmm_xmmm64:1370,"1370":"VEX_Vmulsd_xmm_xmm_xmmm64",EVEX_Vmulsd_xmm_k1z_xmm_xmmm64_er:1371,"1371":"EVEX_Vmulsd_xmm_k1z_xmm_xmmm64_er",Cvtps2pd_xmm_xmmm64:1372,"1372":"Cvtps2pd_xmm_xmmm64",VEX_Vcvtps2pd_xmm_xmmm64:1373,"1373":"VEX_Vcvtps2pd_xmm_xmmm64",VEX_Vcvtps2pd_ymm_xmmm128:1374,"1374":"VEX_Vcvtps2pd_ymm_xmmm128",EVEX_Vcvtps2pd_xmm_k1z_xmmm64b32:1375,"1375":"EVEX_Vcvtps2pd_xmm_k1z_xmmm64b32",EVEX_Vcvtps2pd_ymm_k1z_xmmm128b32:1376,"1376":"EVEX_Vcvtps2pd_ymm_k1z_xmmm128b32",EVEX_Vcvtps2pd_zmm_k1z_ymmm256b32_sae:1377,"1377":"EVEX_Vcvtps2pd_zmm_k1z_ymmm256b32_sae",Cvtpd2ps_xmm_xmmm128:1378,"1378":"Cvtpd2ps_xmm_xmmm128",VEX_Vcvtpd2ps_xmm_xmmm128:1379,"1379":"VEX_Vcvtpd2ps_xmm_xmmm128",VEX_Vcvtpd2ps_xmm_ymmm256:1380,"1380":"VEX_Vcvtpd2ps_xmm_ymmm256",EVEX_Vcvtpd2ps_xmm_k1z_xmmm128b64:1381,"1381":"EVEX_Vcvtpd2ps_xmm_k1z_xmmm128b64",EVEX_Vcvtpd2ps_xmm_k1z_ymmm256b64:1382,"1382":"EVEX_Vcvtpd2ps_xmm_k1z_ymmm256b64",EVEX_Vcvtpd2ps_ymm_k1z_zmmm512b64_er:1383,"1383":"EVEX_Vcvtpd2ps_ymm_k1z_zmmm512b64_er",Cvtss2sd_xmm_xmmm32:1384,"1384":"Cvtss2sd_xmm_xmmm32",VEX_Vcvtss2sd_xmm_xmm_xmmm32:1385,"1385":"VEX_Vcvtss2sd_xmm_xmm_xmmm32",EVEX_Vcvtss2sd_xmm_k1z_xmm_xmmm32_sae:1386,"1386":"EVEX_Vcvtss2sd_xmm_k1z_xmm_xmmm32_sae",Cvtsd2ss_xmm_xmmm64:1387,"1387":"Cvtsd2ss_xmm_xmmm64",VEX_Vcvtsd2ss_xmm_xmm_xmmm64:1388,"1388":"VEX_Vcvtsd2ss_xmm_xmm_xmmm64",EVEX_Vcvtsd2ss_xmm_k1z_xmm_xmmm64_er:1389,"1389":"EVEX_Vcvtsd2ss_xmm_k1z_xmm_xmmm64_er",Cvtdq2ps_xmm_xmmm128:1390,"1390":"Cvtdq2ps_xmm_xmmm128",VEX_Vcvtdq2ps_xmm_xmmm128:1391,"1391":"VEX_Vcvtdq2ps_xmm_xmmm128",VEX_Vcvtdq2ps_ymm_ymmm256:1392,"1392":"VEX_Vcvtdq2ps_ymm_ymmm256",EVEX_Vcvtdq2ps_xmm_k1z_xmmm128b32:1393,"1393":"EVEX_Vcvtdq2ps_xmm_k1z_xmmm128b32",EVEX_Vcvtdq2ps_ymm_k1z_ymmm256b32:1394,"1394":"EVEX_Vcvtdq2ps_ymm_k1z_ymmm256b32",EVEX_Vcvtdq2ps_zmm_k1z_zmmm512b32_er:1395,"1395":"EVEX_Vcvtdq2ps_zmm_k1z_zmmm512b32_er",EVEX_Vcvtqq2ps_xmm_k1z_xmmm128b64:1396,"1396":"EVEX_Vcvtqq2ps_xmm_k1z_xmmm128b64",EVEX_Vcvtqq2ps_xmm_k1z_ymmm256b64:1397,"1397":"EVEX_Vcvtqq2ps_xmm_k1z_ymmm256b64",EVEX_Vcvtqq2ps_ymm_k1z_zmmm512b64_er:1398,"1398":"EVEX_Vcvtqq2ps_ymm_k1z_zmmm512b64_er",Cvtps2dq_xmm_xmmm128:1399,"1399":"Cvtps2dq_xmm_xmmm128",VEX_Vcvtps2dq_xmm_xmmm128:1400,"1400":"VEX_Vcvtps2dq_xmm_xmmm128",VEX_Vcvtps2dq_ymm_ymmm256:1401,"1401":"VEX_Vcvtps2dq_ymm_ymmm256",EVEX_Vcvtps2dq_xmm_k1z_xmmm128b32:1402,"1402":"EVEX_Vcvtps2dq_xmm_k1z_xmmm128b32",EVEX_Vcvtps2dq_ymm_k1z_ymmm256b32:1403,"1403":"EVEX_Vcvtps2dq_ymm_k1z_ymmm256b32",EVEX_Vcvtps2dq_zmm_k1z_zmmm512b32_er:1404,"1404":"EVEX_Vcvtps2dq_zmm_k1z_zmmm512b32_er",Cvttps2dq_xmm_xmmm128:1405,"1405":"Cvttps2dq_xmm_xmmm128",VEX_Vcvttps2dq_xmm_xmmm128:1406,"1406":"VEX_Vcvttps2dq_xmm_xmmm128",VEX_Vcvttps2dq_ymm_ymmm256:1407,"1407":"VEX_Vcvttps2dq_ymm_ymmm256",EVEX_Vcvttps2dq_xmm_k1z_xmmm128b32:1408,"1408":"EVEX_Vcvttps2dq_xmm_k1z_xmmm128b32",EVEX_Vcvttps2dq_ymm_k1z_ymmm256b32:1409,"1409":"EVEX_Vcvttps2dq_ymm_k1z_ymmm256b32",EVEX_Vcvttps2dq_zmm_k1z_zmmm512b32_sae:1410,"1410":"EVEX_Vcvttps2dq_zmm_k1z_zmmm512b32_sae",Subps_xmm_xmmm128:1411,"1411":"Subps_xmm_xmmm128",VEX_Vsubps_xmm_xmm_xmmm128:1412,"1412":"VEX_Vsubps_xmm_xmm_xmmm128",VEX_Vsubps_ymm_ymm_ymmm256:1413,"1413":"VEX_Vsubps_ymm_ymm_ymmm256",EVEX_Vsubps_xmm_k1z_xmm_xmmm128b32:1414,"1414":"EVEX_Vsubps_xmm_k1z_xmm_xmmm128b32",EVEX_Vsubps_ymm_k1z_ymm_ymmm256b32:1415,"1415":"EVEX_Vsubps_ymm_k1z_ymm_ymmm256b32",EVEX_Vsubps_zmm_k1z_zmm_zmmm512b32_er:1416,"1416":"EVEX_Vsubps_zmm_k1z_zmm_zmmm512b32_er",Subpd_xmm_xmmm128:1417,"1417":"Subpd_xmm_xmmm128",VEX_Vsubpd_xmm_xmm_xmmm128:1418,"1418":"VEX_Vsubpd_xmm_xmm_xmmm128",VEX_Vsubpd_ymm_ymm_ymmm256:1419,"1419":"VEX_Vsubpd_ymm_ymm_ymmm256",EVEX_Vsubpd_xmm_k1z_xmm_xmmm128b64:1420,"1420":"EVEX_Vsubpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vsubpd_ymm_k1z_ymm_ymmm256b64:1421,"1421":"EVEX_Vsubpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vsubpd_zmm_k1z_zmm_zmmm512b64_er:1422,"1422":"EVEX_Vsubpd_zmm_k1z_zmm_zmmm512b64_er",Subss_xmm_xmmm32:1423,"1423":"Subss_xmm_xmmm32",VEX_Vsubss_xmm_xmm_xmmm32:1424,"1424":"VEX_Vsubss_xmm_xmm_xmmm32",EVEX_Vsubss_xmm_k1z_xmm_xmmm32_er:1425,"1425":"EVEX_Vsubss_xmm_k1z_xmm_xmmm32_er",Subsd_xmm_xmmm64:1426,"1426":"Subsd_xmm_xmmm64",VEX_Vsubsd_xmm_xmm_xmmm64:1427,"1427":"VEX_Vsubsd_xmm_xmm_xmmm64",EVEX_Vsubsd_xmm_k1z_xmm_xmmm64_er:1428,"1428":"EVEX_Vsubsd_xmm_k1z_xmm_xmmm64_er",Minps_xmm_xmmm128:1429,"1429":"Minps_xmm_xmmm128",VEX_Vminps_xmm_xmm_xmmm128:1430,"1430":"VEX_Vminps_xmm_xmm_xmmm128",VEX_Vminps_ymm_ymm_ymmm256:1431,"1431":"VEX_Vminps_ymm_ymm_ymmm256",EVEX_Vminps_xmm_k1z_xmm_xmmm128b32:1432,"1432":"EVEX_Vminps_xmm_k1z_xmm_xmmm128b32",EVEX_Vminps_ymm_k1z_ymm_ymmm256b32:1433,"1433":"EVEX_Vminps_ymm_k1z_ymm_ymmm256b32",EVEX_Vminps_zmm_k1z_zmm_zmmm512b32_sae:1434,"1434":"EVEX_Vminps_zmm_k1z_zmm_zmmm512b32_sae",Minpd_xmm_xmmm128:1435,"1435":"Minpd_xmm_xmmm128",VEX_Vminpd_xmm_xmm_xmmm128:1436,"1436":"VEX_Vminpd_xmm_xmm_xmmm128",VEX_Vminpd_ymm_ymm_ymmm256:1437,"1437":"VEX_Vminpd_ymm_ymm_ymmm256",EVEX_Vminpd_xmm_k1z_xmm_xmmm128b64:1438,"1438":"EVEX_Vminpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vminpd_ymm_k1z_ymm_ymmm256b64:1439,"1439":"EVEX_Vminpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vminpd_zmm_k1z_zmm_zmmm512b64_sae:1440,"1440":"EVEX_Vminpd_zmm_k1z_zmm_zmmm512b64_sae",Minss_xmm_xmmm32:1441,"1441":"Minss_xmm_xmmm32",VEX_Vminss_xmm_xmm_xmmm32:1442,"1442":"VEX_Vminss_xmm_xmm_xmmm32",EVEX_Vminss_xmm_k1z_xmm_xmmm32_sae:1443,"1443":"EVEX_Vminss_xmm_k1z_xmm_xmmm32_sae",Minsd_xmm_xmmm64:1444,"1444":"Minsd_xmm_xmmm64",VEX_Vminsd_xmm_xmm_xmmm64:1445,"1445":"VEX_Vminsd_xmm_xmm_xmmm64",EVEX_Vminsd_xmm_k1z_xmm_xmmm64_sae:1446,"1446":"EVEX_Vminsd_xmm_k1z_xmm_xmmm64_sae",Divps_xmm_xmmm128:1447,"1447":"Divps_xmm_xmmm128",VEX_Vdivps_xmm_xmm_xmmm128:1448,"1448":"VEX_Vdivps_xmm_xmm_xmmm128",VEX_Vdivps_ymm_ymm_ymmm256:1449,"1449":"VEX_Vdivps_ymm_ymm_ymmm256",EVEX_Vdivps_xmm_k1z_xmm_xmmm128b32:1450,"1450":"EVEX_Vdivps_xmm_k1z_xmm_xmmm128b32",EVEX_Vdivps_ymm_k1z_ymm_ymmm256b32:1451,"1451":"EVEX_Vdivps_ymm_k1z_ymm_ymmm256b32",EVEX_Vdivps_zmm_k1z_zmm_zmmm512b32_er:1452,"1452":"EVEX_Vdivps_zmm_k1z_zmm_zmmm512b32_er",Divpd_xmm_xmmm128:1453,"1453":"Divpd_xmm_xmmm128",VEX_Vdivpd_xmm_xmm_xmmm128:1454,"1454":"VEX_Vdivpd_xmm_xmm_xmmm128",VEX_Vdivpd_ymm_ymm_ymmm256:1455,"1455":"VEX_Vdivpd_ymm_ymm_ymmm256",EVEX_Vdivpd_xmm_k1z_xmm_xmmm128b64:1456,"1456":"EVEX_Vdivpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vdivpd_ymm_k1z_ymm_ymmm256b64:1457,"1457":"EVEX_Vdivpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vdivpd_zmm_k1z_zmm_zmmm512b64_er:1458,"1458":"EVEX_Vdivpd_zmm_k1z_zmm_zmmm512b64_er",Divss_xmm_xmmm32:1459,"1459":"Divss_xmm_xmmm32",VEX_Vdivss_xmm_xmm_xmmm32:1460,"1460":"VEX_Vdivss_xmm_xmm_xmmm32",EVEX_Vdivss_xmm_k1z_xmm_xmmm32_er:1461,"1461":"EVEX_Vdivss_xmm_k1z_xmm_xmmm32_er",Divsd_xmm_xmmm64:1462,"1462":"Divsd_xmm_xmmm64",VEX_Vdivsd_xmm_xmm_xmmm64:1463,"1463":"VEX_Vdivsd_xmm_xmm_xmmm64",EVEX_Vdivsd_xmm_k1z_xmm_xmmm64_er:1464,"1464":"EVEX_Vdivsd_xmm_k1z_xmm_xmmm64_er",Maxps_xmm_xmmm128:1465,"1465":"Maxps_xmm_xmmm128",VEX_Vmaxps_xmm_xmm_xmmm128:1466,"1466":"VEX_Vmaxps_xmm_xmm_xmmm128",VEX_Vmaxps_ymm_ymm_ymmm256:1467,"1467":"VEX_Vmaxps_ymm_ymm_ymmm256",EVEX_Vmaxps_xmm_k1z_xmm_xmmm128b32:1468,"1468":"EVEX_Vmaxps_xmm_k1z_xmm_xmmm128b32",EVEX_Vmaxps_ymm_k1z_ymm_ymmm256b32:1469,"1469":"EVEX_Vmaxps_ymm_k1z_ymm_ymmm256b32",EVEX_Vmaxps_zmm_k1z_zmm_zmmm512b32_sae:1470,"1470":"EVEX_Vmaxps_zmm_k1z_zmm_zmmm512b32_sae",Maxpd_xmm_xmmm128:1471,"1471":"Maxpd_xmm_xmmm128",VEX_Vmaxpd_xmm_xmm_xmmm128:1472,"1472":"VEX_Vmaxpd_xmm_xmm_xmmm128",VEX_Vmaxpd_ymm_ymm_ymmm256:1473,"1473":"VEX_Vmaxpd_ymm_ymm_ymmm256",EVEX_Vmaxpd_xmm_k1z_xmm_xmmm128b64:1474,"1474":"EVEX_Vmaxpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vmaxpd_ymm_k1z_ymm_ymmm256b64:1475,"1475":"EVEX_Vmaxpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vmaxpd_zmm_k1z_zmm_zmmm512b64_sae:1476,"1476":"EVEX_Vmaxpd_zmm_k1z_zmm_zmmm512b64_sae",Maxss_xmm_xmmm32:1477,"1477":"Maxss_xmm_xmmm32",VEX_Vmaxss_xmm_xmm_xmmm32:1478,"1478":"VEX_Vmaxss_xmm_xmm_xmmm32",EVEX_Vmaxss_xmm_k1z_xmm_xmmm32_sae:1479,"1479":"EVEX_Vmaxss_xmm_k1z_xmm_xmmm32_sae",Maxsd_xmm_xmmm64:1480,"1480":"Maxsd_xmm_xmmm64",VEX_Vmaxsd_xmm_xmm_xmmm64:1481,"1481":"VEX_Vmaxsd_xmm_xmm_xmmm64",EVEX_Vmaxsd_xmm_k1z_xmm_xmmm64_sae:1482,"1482":"EVEX_Vmaxsd_xmm_k1z_xmm_xmmm64_sae",Punpcklbw_mm_mmm32:1483,"1483":"Punpcklbw_mm_mmm32",Punpcklbw_xmm_xmmm128:1484,"1484":"Punpcklbw_xmm_xmmm128",VEX_Vpunpcklbw_xmm_xmm_xmmm128:1485,"1485":"VEX_Vpunpcklbw_xmm_xmm_xmmm128",VEX_Vpunpcklbw_ymm_ymm_ymmm256:1486,"1486":"VEX_Vpunpcklbw_ymm_ymm_ymmm256",EVEX_Vpunpcklbw_xmm_k1z_xmm_xmmm128:1487,"1487":"EVEX_Vpunpcklbw_xmm_k1z_xmm_xmmm128",EVEX_Vpunpcklbw_ymm_k1z_ymm_ymmm256:1488,"1488":"EVEX_Vpunpcklbw_ymm_k1z_ymm_ymmm256",EVEX_Vpunpcklbw_zmm_k1z_zmm_zmmm512:1489,"1489":"EVEX_Vpunpcklbw_zmm_k1z_zmm_zmmm512",Punpcklwd_mm_mmm32:1490,"1490":"Punpcklwd_mm_mmm32",Punpcklwd_xmm_xmmm128:1491,"1491":"Punpcklwd_xmm_xmmm128",VEX_Vpunpcklwd_xmm_xmm_xmmm128:1492,"1492":"VEX_Vpunpcklwd_xmm_xmm_xmmm128",VEX_Vpunpcklwd_ymm_ymm_ymmm256:1493,"1493":"VEX_Vpunpcklwd_ymm_ymm_ymmm256",EVEX_Vpunpcklwd_xmm_k1z_xmm_xmmm128:1494,"1494":"EVEX_Vpunpcklwd_xmm_k1z_xmm_xmmm128",EVEX_Vpunpcklwd_ymm_k1z_ymm_ymmm256:1495,"1495":"EVEX_Vpunpcklwd_ymm_k1z_ymm_ymmm256",EVEX_Vpunpcklwd_zmm_k1z_zmm_zmmm512:1496,"1496":"EVEX_Vpunpcklwd_zmm_k1z_zmm_zmmm512",Punpckldq_mm_mmm32:1497,"1497":"Punpckldq_mm_mmm32",Punpckldq_xmm_xmmm128:1498,"1498":"Punpckldq_xmm_xmmm128",VEX_Vpunpckldq_xmm_xmm_xmmm128:1499,"1499":"VEX_Vpunpckldq_xmm_xmm_xmmm128",VEX_Vpunpckldq_ymm_ymm_ymmm256:1500,"1500":"VEX_Vpunpckldq_ymm_ymm_ymmm256",EVEX_Vpunpckldq_xmm_k1z_xmm_xmmm128b32:1501,"1501":"EVEX_Vpunpckldq_xmm_k1z_xmm_xmmm128b32",EVEX_Vpunpckldq_ymm_k1z_ymm_ymmm256b32:1502,"1502":"EVEX_Vpunpckldq_ymm_k1z_ymm_ymmm256b32",EVEX_Vpunpckldq_zmm_k1z_zmm_zmmm512b32:1503,"1503":"EVEX_Vpunpckldq_zmm_k1z_zmm_zmmm512b32",Packsswb_mm_mmm64:1504,"1504":"Packsswb_mm_mmm64",Packsswb_xmm_xmmm128:1505,"1505":"Packsswb_xmm_xmmm128",VEX_Vpacksswb_xmm_xmm_xmmm128:1506,"1506":"VEX_Vpacksswb_xmm_xmm_xmmm128",VEX_Vpacksswb_ymm_ymm_ymmm256:1507,"1507":"VEX_Vpacksswb_ymm_ymm_ymmm256",EVEX_Vpacksswb_xmm_k1z_xmm_xmmm128:1508,"1508":"EVEX_Vpacksswb_xmm_k1z_xmm_xmmm128",EVEX_Vpacksswb_ymm_k1z_ymm_ymmm256:1509,"1509":"EVEX_Vpacksswb_ymm_k1z_ymm_ymmm256",EVEX_Vpacksswb_zmm_k1z_zmm_zmmm512:1510,"1510":"EVEX_Vpacksswb_zmm_k1z_zmm_zmmm512",Pcmpgtb_mm_mmm64:1511,"1511":"Pcmpgtb_mm_mmm64",Pcmpgtb_xmm_xmmm128:1512,"1512":"Pcmpgtb_xmm_xmmm128",VEX_Vpcmpgtb_xmm_xmm_xmmm128:1513,"1513":"VEX_Vpcmpgtb_xmm_xmm_xmmm128",VEX_Vpcmpgtb_ymm_ymm_ymmm256:1514,"1514":"VEX_Vpcmpgtb_ymm_ymm_ymmm256",EVEX_Vpcmpgtb_kr_k1_xmm_xmmm128:1515,"1515":"EVEX_Vpcmpgtb_kr_k1_xmm_xmmm128",EVEX_Vpcmpgtb_kr_k1_ymm_ymmm256:1516,"1516":"EVEX_Vpcmpgtb_kr_k1_ymm_ymmm256",EVEX_Vpcmpgtb_kr_k1_zmm_zmmm512:1517,"1517":"EVEX_Vpcmpgtb_kr_k1_zmm_zmmm512",Pcmpgtw_mm_mmm64:1518,"1518":"Pcmpgtw_mm_mmm64",Pcmpgtw_xmm_xmmm128:1519,"1519":"Pcmpgtw_xmm_xmmm128",VEX_Vpcmpgtw_xmm_xmm_xmmm128:1520,"1520":"VEX_Vpcmpgtw_xmm_xmm_xmmm128",VEX_Vpcmpgtw_ymm_ymm_ymmm256:1521,"1521":"VEX_Vpcmpgtw_ymm_ymm_ymmm256",EVEX_Vpcmpgtw_kr_k1_xmm_xmmm128:1522,"1522":"EVEX_Vpcmpgtw_kr_k1_xmm_xmmm128",EVEX_Vpcmpgtw_kr_k1_ymm_ymmm256:1523,"1523":"EVEX_Vpcmpgtw_kr_k1_ymm_ymmm256",EVEX_Vpcmpgtw_kr_k1_zmm_zmmm512:1524,"1524":"EVEX_Vpcmpgtw_kr_k1_zmm_zmmm512",Pcmpgtd_mm_mmm64:1525,"1525":"Pcmpgtd_mm_mmm64",Pcmpgtd_xmm_xmmm128:1526,"1526":"Pcmpgtd_xmm_xmmm128",VEX_Vpcmpgtd_xmm_xmm_xmmm128:1527,"1527":"VEX_Vpcmpgtd_xmm_xmm_xmmm128",VEX_Vpcmpgtd_ymm_ymm_ymmm256:1528,"1528":"VEX_Vpcmpgtd_ymm_ymm_ymmm256",EVEX_Vpcmpgtd_kr_k1_xmm_xmmm128b32:1529,"1529":"EVEX_Vpcmpgtd_kr_k1_xmm_xmmm128b32",EVEX_Vpcmpgtd_kr_k1_ymm_ymmm256b32:1530,"1530":"EVEX_Vpcmpgtd_kr_k1_ymm_ymmm256b32",EVEX_Vpcmpgtd_kr_k1_zmm_zmmm512b32:1531,"1531":"EVEX_Vpcmpgtd_kr_k1_zmm_zmmm512b32",Packuswb_mm_mmm64:1532,"1532":"Packuswb_mm_mmm64",Packuswb_xmm_xmmm128:1533,"1533":"Packuswb_xmm_xmmm128",VEX_Vpackuswb_xmm_xmm_xmmm128:1534,"1534":"VEX_Vpackuswb_xmm_xmm_xmmm128",VEX_Vpackuswb_ymm_ymm_ymmm256:1535,"1535":"VEX_Vpackuswb_ymm_ymm_ymmm256",EVEX_Vpackuswb_xmm_k1z_xmm_xmmm128:1536,"1536":"EVEX_Vpackuswb_xmm_k1z_xmm_xmmm128",EVEX_Vpackuswb_ymm_k1z_ymm_ymmm256:1537,"1537":"EVEX_Vpackuswb_ymm_k1z_ymm_ymmm256",EVEX_Vpackuswb_zmm_k1z_zmm_zmmm512:1538,"1538":"EVEX_Vpackuswb_zmm_k1z_zmm_zmmm512",Punpckhbw_mm_mmm64:1539,"1539":"Punpckhbw_mm_mmm64",Punpckhbw_xmm_xmmm128:1540,"1540":"Punpckhbw_xmm_xmmm128",VEX_Vpunpckhbw_xmm_xmm_xmmm128:1541,"1541":"VEX_Vpunpckhbw_xmm_xmm_xmmm128",VEX_Vpunpckhbw_ymm_ymm_ymmm256:1542,"1542":"VEX_Vpunpckhbw_ymm_ymm_ymmm256",EVEX_Vpunpckhbw_xmm_k1z_xmm_xmmm128:1543,"1543":"EVEX_Vpunpckhbw_xmm_k1z_xmm_xmmm128",EVEX_Vpunpckhbw_ymm_k1z_ymm_ymmm256:1544,"1544":"EVEX_Vpunpckhbw_ymm_k1z_ymm_ymmm256",EVEX_Vpunpckhbw_zmm_k1z_zmm_zmmm512:1545,"1545":"EVEX_Vpunpckhbw_zmm_k1z_zmm_zmmm512",Punpckhwd_mm_mmm64:1546,"1546":"Punpckhwd_mm_mmm64",Punpckhwd_xmm_xmmm128:1547,"1547":"Punpckhwd_xmm_xmmm128",VEX_Vpunpckhwd_xmm_xmm_xmmm128:1548,"1548":"VEX_Vpunpckhwd_xmm_xmm_xmmm128",VEX_Vpunpckhwd_ymm_ymm_ymmm256:1549,"1549":"VEX_Vpunpckhwd_ymm_ymm_ymmm256",EVEX_Vpunpckhwd_xmm_k1z_xmm_xmmm128:1550,"1550":"EVEX_Vpunpckhwd_xmm_k1z_xmm_xmmm128",EVEX_Vpunpckhwd_ymm_k1z_ymm_ymmm256:1551,"1551":"EVEX_Vpunpckhwd_ymm_k1z_ymm_ymmm256",EVEX_Vpunpckhwd_zmm_k1z_zmm_zmmm512:1552,"1552":"EVEX_Vpunpckhwd_zmm_k1z_zmm_zmmm512",Punpckhdq_mm_mmm64:1553,"1553":"Punpckhdq_mm_mmm64",Punpckhdq_xmm_xmmm128:1554,"1554":"Punpckhdq_xmm_xmmm128",VEX_Vpunpckhdq_xmm_xmm_xmmm128:1555,"1555":"VEX_Vpunpckhdq_xmm_xmm_xmmm128",VEX_Vpunpckhdq_ymm_ymm_ymmm256:1556,"1556":"VEX_Vpunpckhdq_ymm_ymm_ymmm256",EVEX_Vpunpckhdq_xmm_k1z_xmm_xmmm128b32:1557,"1557":"EVEX_Vpunpckhdq_xmm_k1z_xmm_xmmm128b32",EVEX_Vpunpckhdq_ymm_k1z_ymm_ymmm256b32:1558,"1558":"EVEX_Vpunpckhdq_ymm_k1z_ymm_ymmm256b32",EVEX_Vpunpckhdq_zmm_k1z_zmm_zmmm512b32:1559,"1559":"EVEX_Vpunpckhdq_zmm_k1z_zmm_zmmm512b32",Packssdw_mm_mmm64:1560,"1560":"Packssdw_mm_mmm64",Packssdw_xmm_xmmm128:1561,"1561":"Packssdw_xmm_xmmm128",VEX_Vpackssdw_xmm_xmm_xmmm128:1562,"1562":"VEX_Vpackssdw_xmm_xmm_xmmm128",VEX_Vpackssdw_ymm_ymm_ymmm256:1563,"1563":"VEX_Vpackssdw_ymm_ymm_ymmm256",EVEX_Vpackssdw_xmm_k1z_xmm_xmmm128b32:1564,"1564":"EVEX_Vpackssdw_xmm_k1z_xmm_xmmm128b32",EVEX_Vpackssdw_ymm_k1z_ymm_ymmm256b32:1565,"1565":"EVEX_Vpackssdw_ymm_k1z_ymm_ymmm256b32",EVEX_Vpackssdw_zmm_k1z_zmm_zmmm512b32:1566,"1566":"EVEX_Vpackssdw_zmm_k1z_zmm_zmmm512b32",Punpcklqdq_xmm_xmmm128:1567,"1567":"Punpcklqdq_xmm_xmmm128",VEX_Vpunpcklqdq_xmm_xmm_xmmm128:1568,"1568":"VEX_Vpunpcklqdq_xmm_xmm_xmmm128",VEX_Vpunpcklqdq_ymm_ymm_ymmm256:1569,"1569":"VEX_Vpunpcklqdq_ymm_ymm_ymmm256",EVEX_Vpunpcklqdq_xmm_k1z_xmm_xmmm128b64:1570,"1570":"EVEX_Vpunpcklqdq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpunpcklqdq_ymm_k1z_ymm_ymmm256b64:1571,"1571":"EVEX_Vpunpcklqdq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpunpcklqdq_zmm_k1z_zmm_zmmm512b64:1572,"1572":"EVEX_Vpunpcklqdq_zmm_k1z_zmm_zmmm512b64",Punpckhqdq_xmm_xmmm128:1573,"1573":"Punpckhqdq_xmm_xmmm128",VEX_Vpunpckhqdq_xmm_xmm_xmmm128:1574,"1574":"VEX_Vpunpckhqdq_xmm_xmm_xmmm128",VEX_Vpunpckhqdq_ymm_ymm_ymmm256:1575,"1575":"VEX_Vpunpckhqdq_ymm_ymm_ymmm256",EVEX_Vpunpckhqdq_xmm_k1z_xmm_xmmm128b64:1576,"1576":"EVEX_Vpunpckhqdq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpunpckhqdq_ymm_k1z_ymm_ymmm256b64:1577,"1577":"EVEX_Vpunpckhqdq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpunpckhqdq_zmm_k1z_zmm_zmmm512b64:1578,"1578":"EVEX_Vpunpckhqdq_zmm_k1z_zmm_zmmm512b64",Movd_mm_rm32:1579,"1579":"Movd_mm_rm32",Movq_mm_rm64:1580,"1580":"Movq_mm_rm64",Movd_xmm_rm32:1581,"1581":"Movd_xmm_rm32",Movq_xmm_rm64:1582,"1582":"Movq_xmm_rm64",VEX_Vmovd_xmm_rm32:1583,"1583":"VEX_Vmovd_xmm_rm32",VEX_Vmovq_xmm_rm64:1584,"1584":"VEX_Vmovq_xmm_rm64",EVEX_Vmovd_xmm_rm32:1585,"1585":"EVEX_Vmovd_xmm_rm32",EVEX_Vmovq_xmm_rm64:1586,"1586":"EVEX_Vmovq_xmm_rm64",Movq_mm_mmm64:1587,"1587":"Movq_mm_mmm64",Movdqa_xmm_xmmm128:1588,"1588":"Movdqa_xmm_xmmm128",VEX_Vmovdqa_xmm_xmmm128:1589,"1589":"VEX_Vmovdqa_xmm_xmmm128",VEX_Vmovdqa_ymm_ymmm256:1590,"1590":"VEX_Vmovdqa_ymm_ymmm256",EVEX_Vmovdqa32_xmm_k1z_xmmm128:1591,"1591":"EVEX_Vmovdqa32_xmm_k1z_xmmm128",EVEX_Vmovdqa32_ymm_k1z_ymmm256:1592,"1592":"EVEX_Vmovdqa32_ymm_k1z_ymmm256",EVEX_Vmovdqa32_zmm_k1z_zmmm512:1593,"1593":"EVEX_Vmovdqa32_zmm_k1z_zmmm512",EVEX_Vmovdqa64_xmm_k1z_xmmm128:1594,"1594":"EVEX_Vmovdqa64_xmm_k1z_xmmm128",EVEX_Vmovdqa64_ymm_k1z_ymmm256:1595,"1595":"EVEX_Vmovdqa64_ymm_k1z_ymmm256",EVEX_Vmovdqa64_zmm_k1z_zmmm512:1596,"1596":"EVEX_Vmovdqa64_zmm_k1z_zmmm512",Movdqu_xmm_xmmm128:1597,"1597":"Movdqu_xmm_xmmm128",VEX_Vmovdqu_xmm_xmmm128:1598,"1598":"VEX_Vmovdqu_xmm_xmmm128",VEX_Vmovdqu_ymm_ymmm256:1599,"1599":"VEX_Vmovdqu_ymm_ymmm256",EVEX_Vmovdqu32_xmm_k1z_xmmm128:1600,"1600":"EVEX_Vmovdqu32_xmm_k1z_xmmm128",EVEX_Vmovdqu32_ymm_k1z_ymmm256:1601,"1601":"EVEX_Vmovdqu32_ymm_k1z_ymmm256",EVEX_Vmovdqu32_zmm_k1z_zmmm512:1602,"1602":"EVEX_Vmovdqu32_zmm_k1z_zmmm512",EVEX_Vmovdqu64_xmm_k1z_xmmm128:1603,"1603":"EVEX_Vmovdqu64_xmm_k1z_xmmm128",EVEX_Vmovdqu64_ymm_k1z_ymmm256:1604,"1604":"EVEX_Vmovdqu64_ymm_k1z_ymmm256",EVEX_Vmovdqu64_zmm_k1z_zmmm512:1605,"1605":"EVEX_Vmovdqu64_zmm_k1z_zmmm512",EVEX_Vmovdqu8_xmm_k1z_xmmm128:1606,"1606":"EVEX_Vmovdqu8_xmm_k1z_xmmm128",EVEX_Vmovdqu8_ymm_k1z_ymmm256:1607,"1607":"EVEX_Vmovdqu8_ymm_k1z_ymmm256",EVEX_Vmovdqu8_zmm_k1z_zmmm512:1608,"1608":"EVEX_Vmovdqu8_zmm_k1z_zmmm512",EVEX_Vmovdqu16_xmm_k1z_xmmm128:1609,"1609":"EVEX_Vmovdqu16_xmm_k1z_xmmm128",EVEX_Vmovdqu16_ymm_k1z_ymmm256:1610,"1610":"EVEX_Vmovdqu16_ymm_k1z_ymmm256",EVEX_Vmovdqu16_zmm_k1z_zmmm512:1611,"1611":"EVEX_Vmovdqu16_zmm_k1z_zmmm512",Pshufw_mm_mmm64_imm8:1612,"1612":"Pshufw_mm_mmm64_imm8",Pshufd_xmm_xmmm128_imm8:1613,"1613":"Pshufd_xmm_xmmm128_imm8",VEX_Vpshufd_xmm_xmmm128_imm8:1614,"1614":"VEX_Vpshufd_xmm_xmmm128_imm8",VEX_Vpshufd_ymm_ymmm256_imm8:1615,"1615":"VEX_Vpshufd_ymm_ymmm256_imm8",EVEX_Vpshufd_xmm_k1z_xmmm128b32_imm8:1616,"1616":"EVEX_Vpshufd_xmm_k1z_xmmm128b32_imm8",EVEX_Vpshufd_ymm_k1z_ymmm256b32_imm8:1617,"1617":"EVEX_Vpshufd_ymm_k1z_ymmm256b32_imm8",EVEX_Vpshufd_zmm_k1z_zmmm512b32_imm8:1618,"1618":"EVEX_Vpshufd_zmm_k1z_zmmm512b32_imm8",Pshufhw_xmm_xmmm128_imm8:1619,"1619":"Pshufhw_xmm_xmmm128_imm8",VEX_Vpshufhw_xmm_xmmm128_imm8:1620,"1620":"VEX_Vpshufhw_xmm_xmmm128_imm8",VEX_Vpshufhw_ymm_ymmm256_imm8:1621,"1621":"VEX_Vpshufhw_ymm_ymmm256_imm8",EVEX_Vpshufhw_xmm_k1z_xmmm128_imm8:1622,"1622":"EVEX_Vpshufhw_xmm_k1z_xmmm128_imm8",EVEX_Vpshufhw_ymm_k1z_ymmm256_imm8:1623,"1623":"EVEX_Vpshufhw_ymm_k1z_ymmm256_imm8",EVEX_Vpshufhw_zmm_k1z_zmmm512_imm8:1624,"1624":"EVEX_Vpshufhw_zmm_k1z_zmmm512_imm8",Pshuflw_xmm_xmmm128_imm8:1625,"1625":"Pshuflw_xmm_xmmm128_imm8",VEX_Vpshuflw_xmm_xmmm128_imm8:1626,"1626":"VEX_Vpshuflw_xmm_xmmm128_imm8",VEX_Vpshuflw_ymm_ymmm256_imm8:1627,"1627":"VEX_Vpshuflw_ymm_ymmm256_imm8",EVEX_Vpshuflw_xmm_k1z_xmmm128_imm8:1628,"1628":"EVEX_Vpshuflw_xmm_k1z_xmmm128_imm8",EVEX_Vpshuflw_ymm_k1z_ymmm256_imm8:1629,"1629":"EVEX_Vpshuflw_ymm_k1z_ymmm256_imm8",EVEX_Vpshuflw_zmm_k1z_zmmm512_imm8:1630,"1630":"EVEX_Vpshuflw_zmm_k1z_zmmm512_imm8",Psrlw_mm_imm8:1631,"1631":"Psrlw_mm_imm8",Psrlw_xmm_imm8:1632,"1632":"Psrlw_xmm_imm8",VEX_Vpsrlw_xmm_xmm_imm8:1633,"1633":"VEX_Vpsrlw_xmm_xmm_imm8",VEX_Vpsrlw_ymm_ymm_imm8:1634,"1634":"VEX_Vpsrlw_ymm_ymm_imm8",EVEX_Vpsrlw_xmm_k1z_xmmm128_imm8:1635,"1635":"EVEX_Vpsrlw_xmm_k1z_xmmm128_imm8",EVEX_Vpsrlw_ymm_k1z_ymmm256_imm8:1636,"1636":"EVEX_Vpsrlw_ymm_k1z_ymmm256_imm8",EVEX_Vpsrlw_zmm_k1z_zmmm512_imm8:1637,"1637":"EVEX_Vpsrlw_zmm_k1z_zmmm512_imm8",Psraw_mm_imm8:1638,"1638":"Psraw_mm_imm8",Psraw_xmm_imm8:1639,"1639":"Psraw_xmm_imm8",VEX_Vpsraw_xmm_xmm_imm8:1640,"1640":"VEX_Vpsraw_xmm_xmm_imm8",VEX_Vpsraw_ymm_ymm_imm8:1641,"1641":"VEX_Vpsraw_ymm_ymm_imm8",EVEX_Vpsraw_xmm_k1z_xmmm128_imm8:1642,"1642":"EVEX_Vpsraw_xmm_k1z_xmmm128_imm8",EVEX_Vpsraw_ymm_k1z_ymmm256_imm8:1643,"1643":"EVEX_Vpsraw_ymm_k1z_ymmm256_imm8",EVEX_Vpsraw_zmm_k1z_zmmm512_imm8:1644,"1644":"EVEX_Vpsraw_zmm_k1z_zmmm512_imm8",Psllw_mm_imm8:1645,"1645":"Psllw_mm_imm8",Psllw_xmm_imm8:1646,"1646":"Psllw_xmm_imm8",VEX_Vpsllw_xmm_xmm_imm8:1647,"1647":"VEX_Vpsllw_xmm_xmm_imm8",VEX_Vpsllw_ymm_ymm_imm8:1648,"1648":"VEX_Vpsllw_ymm_ymm_imm8",EVEX_Vpsllw_xmm_k1z_xmmm128_imm8:1649,"1649":"EVEX_Vpsllw_xmm_k1z_xmmm128_imm8",EVEX_Vpsllw_ymm_k1z_ymmm256_imm8:1650,"1650":"EVEX_Vpsllw_ymm_k1z_ymmm256_imm8",EVEX_Vpsllw_zmm_k1z_zmmm512_imm8:1651,"1651":"EVEX_Vpsllw_zmm_k1z_zmmm512_imm8",EVEX_Vprord_xmm_k1z_xmmm128b32_imm8:1652,"1652":"EVEX_Vprord_xmm_k1z_xmmm128b32_imm8",EVEX_Vprord_ymm_k1z_ymmm256b32_imm8:1653,"1653":"EVEX_Vprord_ymm_k1z_ymmm256b32_imm8",EVEX_Vprord_zmm_k1z_zmmm512b32_imm8:1654,"1654":"EVEX_Vprord_zmm_k1z_zmmm512b32_imm8",EVEX_Vprorq_xmm_k1z_xmmm128b64_imm8:1655,"1655":"EVEX_Vprorq_xmm_k1z_xmmm128b64_imm8",EVEX_Vprorq_ymm_k1z_ymmm256b64_imm8:1656,"1656":"EVEX_Vprorq_ymm_k1z_ymmm256b64_imm8",EVEX_Vprorq_zmm_k1z_zmmm512b64_imm8:1657,"1657":"EVEX_Vprorq_zmm_k1z_zmmm512b64_imm8",EVEX_Vprold_xmm_k1z_xmmm128b32_imm8:1658,"1658":"EVEX_Vprold_xmm_k1z_xmmm128b32_imm8",EVEX_Vprold_ymm_k1z_ymmm256b32_imm8:1659,"1659":"EVEX_Vprold_ymm_k1z_ymmm256b32_imm8",EVEX_Vprold_zmm_k1z_zmmm512b32_imm8:1660,"1660":"EVEX_Vprold_zmm_k1z_zmmm512b32_imm8",EVEX_Vprolq_xmm_k1z_xmmm128b64_imm8:1661,"1661":"EVEX_Vprolq_xmm_k1z_xmmm128b64_imm8",EVEX_Vprolq_ymm_k1z_ymmm256b64_imm8:1662,"1662":"EVEX_Vprolq_ymm_k1z_ymmm256b64_imm8",EVEX_Vprolq_zmm_k1z_zmmm512b64_imm8:1663,"1663":"EVEX_Vprolq_zmm_k1z_zmmm512b64_imm8",Psrld_mm_imm8:1664,"1664":"Psrld_mm_imm8",Psrld_xmm_imm8:1665,"1665":"Psrld_xmm_imm8",VEX_Vpsrld_xmm_xmm_imm8:1666,"1666":"VEX_Vpsrld_xmm_xmm_imm8",VEX_Vpsrld_ymm_ymm_imm8:1667,"1667":"VEX_Vpsrld_ymm_ymm_imm8",EVEX_Vpsrld_xmm_k1z_xmmm128b32_imm8:1668,"1668":"EVEX_Vpsrld_xmm_k1z_xmmm128b32_imm8",EVEX_Vpsrld_ymm_k1z_ymmm256b32_imm8:1669,"1669":"EVEX_Vpsrld_ymm_k1z_ymmm256b32_imm8",EVEX_Vpsrld_zmm_k1z_zmmm512b32_imm8:1670,"1670":"EVEX_Vpsrld_zmm_k1z_zmmm512b32_imm8",Psrad_mm_imm8:1671,"1671":"Psrad_mm_imm8",Psrad_xmm_imm8:1672,"1672":"Psrad_xmm_imm8",VEX_Vpsrad_xmm_xmm_imm8:1673,"1673":"VEX_Vpsrad_xmm_xmm_imm8",VEX_Vpsrad_ymm_ymm_imm8:1674,"1674":"VEX_Vpsrad_ymm_ymm_imm8",EVEX_Vpsrad_xmm_k1z_xmmm128b32_imm8:1675,"1675":"EVEX_Vpsrad_xmm_k1z_xmmm128b32_imm8",EVEX_Vpsrad_ymm_k1z_ymmm256b32_imm8:1676,"1676":"EVEX_Vpsrad_ymm_k1z_ymmm256b32_imm8",EVEX_Vpsrad_zmm_k1z_zmmm512b32_imm8:1677,"1677":"EVEX_Vpsrad_zmm_k1z_zmmm512b32_imm8",EVEX_Vpsraq_xmm_k1z_xmmm128b64_imm8:1678,"1678":"EVEX_Vpsraq_xmm_k1z_xmmm128b64_imm8",EVEX_Vpsraq_ymm_k1z_ymmm256b64_imm8:1679,"1679":"EVEX_Vpsraq_ymm_k1z_ymmm256b64_imm8",EVEX_Vpsraq_zmm_k1z_zmmm512b64_imm8:1680,"1680":"EVEX_Vpsraq_zmm_k1z_zmmm512b64_imm8",Pslld_mm_imm8:1681,"1681":"Pslld_mm_imm8",Pslld_xmm_imm8:1682,"1682":"Pslld_xmm_imm8",VEX_Vpslld_xmm_xmm_imm8:1683,"1683":"VEX_Vpslld_xmm_xmm_imm8",VEX_Vpslld_ymm_ymm_imm8:1684,"1684":"VEX_Vpslld_ymm_ymm_imm8",EVEX_Vpslld_xmm_k1z_xmmm128b32_imm8:1685,"1685":"EVEX_Vpslld_xmm_k1z_xmmm128b32_imm8",EVEX_Vpslld_ymm_k1z_ymmm256b32_imm8:1686,"1686":"EVEX_Vpslld_ymm_k1z_ymmm256b32_imm8",EVEX_Vpslld_zmm_k1z_zmmm512b32_imm8:1687,"1687":"EVEX_Vpslld_zmm_k1z_zmmm512b32_imm8",Psrlq_mm_imm8:1688,"1688":"Psrlq_mm_imm8",Psrlq_xmm_imm8:1689,"1689":"Psrlq_xmm_imm8",VEX_Vpsrlq_xmm_xmm_imm8:1690,"1690":"VEX_Vpsrlq_xmm_xmm_imm8",VEX_Vpsrlq_ymm_ymm_imm8:1691,"1691":"VEX_Vpsrlq_ymm_ymm_imm8",EVEX_Vpsrlq_xmm_k1z_xmmm128b64_imm8:1692,"1692":"EVEX_Vpsrlq_xmm_k1z_xmmm128b64_imm8",EVEX_Vpsrlq_ymm_k1z_ymmm256b64_imm8:1693,"1693":"EVEX_Vpsrlq_ymm_k1z_ymmm256b64_imm8",EVEX_Vpsrlq_zmm_k1z_zmmm512b64_imm8:1694,"1694":"EVEX_Vpsrlq_zmm_k1z_zmmm512b64_imm8",Psrldq_xmm_imm8:1695,"1695":"Psrldq_xmm_imm8",VEX_Vpsrldq_xmm_xmm_imm8:1696,"1696":"VEX_Vpsrldq_xmm_xmm_imm8",VEX_Vpsrldq_ymm_ymm_imm8:1697,"1697":"VEX_Vpsrldq_ymm_ymm_imm8",EVEX_Vpsrldq_xmm_xmmm128_imm8:1698,"1698":"EVEX_Vpsrldq_xmm_xmmm128_imm8",EVEX_Vpsrldq_ymm_ymmm256_imm8:1699,"1699":"EVEX_Vpsrldq_ymm_ymmm256_imm8",EVEX_Vpsrldq_zmm_zmmm512_imm8:1700,"1700":"EVEX_Vpsrldq_zmm_zmmm512_imm8",Psllq_mm_imm8:1701,"1701":"Psllq_mm_imm8",Psllq_xmm_imm8:1702,"1702":"Psllq_xmm_imm8",VEX_Vpsllq_xmm_xmm_imm8:1703,"1703":"VEX_Vpsllq_xmm_xmm_imm8",VEX_Vpsllq_ymm_ymm_imm8:1704,"1704":"VEX_Vpsllq_ymm_ymm_imm8",EVEX_Vpsllq_xmm_k1z_xmmm128b64_imm8:1705,"1705":"EVEX_Vpsllq_xmm_k1z_xmmm128b64_imm8",EVEX_Vpsllq_ymm_k1z_ymmm256b64_imm8:1706,"1706":"EVEX_Vpsllq_ymm_k1z_ymmm256b64_imm8",EVEX_Vpsllq_zmm_k1z_zmmm512b64_imm8:1707,"1707":"EVEX_Vpsllq_zmm_k1z_zmmm512b64_imm8",Pslldq_xmm_imm8:1708,"1708":"Pslldq_xmm_imm8",VEX_Vpslldq_xmm_xmm_imm8:1709,"1709":"VEX_Vpslldq_xmm_xmm_imm8",VEX_Vpslldq_ymm_ymm_imm8:1710,"1710":"VEX_Vpslldq_ymm_ymm_imm8",EVEX_Vpslldq_xmm_xmmm128_imm8:1711,"1711":"EVEX_Vpslldq_xmm_xmmm128_imm8",EVEX_Vpslldq_ymm_ymmm256_imm8:1712,"1712":"EVEX_Vpslldq_ymm_ymmm256_imm8",EVEX_Vpslldq_zmm_zmmm512_imm8:1713,"1713":"EVEX_Vpslldq_zmm_zmmm512_imm8",Pcmpeqb_mm_mmm64:1714,"1714":"Pcmpeqb_mm_mmm64",Pcmpeqb_xmm_xmmm128:1715,"1715":"Pcmpeqb_xmm_xmmm128",VEX_Vpcmpeqb_xmm_xmm_xmmm128:1716,"1716":"VEX_Vpcmpeqb_xmm_xmm_xmmm128",VEX_Vpcmpeqb_ymm_ymm_ymmm256:1717,"1717":"VEX_Vpcmpeqb_ymm_ymm_ymmm256",EVEX_Vpcmpeqb_kr_k1_xmm_xmmm128:1718,"1718":"EVEX_Vpcmpeqb_kr_k1_xmm_xmmm128",EVEX_Vpcmpeqb_kr_k1_ymm_ymmm256:1719,"1719":"EVEX_Vpcmpeqb_kr_k1_ymm_ymmm256",EVEX_Vpcmpeqb_kr_k1_zmm_zmmm512:1720,"1720":"EVEX_Vpcmpeqb_kr_k1_zmm_zmmm512",Pcmpeqw_mm_mmm64:1721,"1721":"Pcmpeqw_mm_mmm64",Pcmpeqw_xmm_xmmm128:1722,"1722":"Pcmpeqw_xmm_xmmm128",VEX_Vpcmpeqw_xmm_xmm_xmmm128:1723,"1723":"VEX_Vpcmpeqw_xmm_xmm_xmmm128",VEX_Vpcmpeqw_ymm_ymm_ymmm256:1724,"1724":"VEX_Vpcmpeqw_ymm_ymm_ymmm256",EVEX_Vpcmpeqw_kr_k1_xmm_xmmm128:1725,"1725":"EVEX_Vpcmpeqw_kr_k1_xmm_xmmm128",EVEX_Vpcmpeqw_kr_k1_ymm_ymmm256:1726,"1726":"EVEX_Vpcmpeqw_kr_k1_ymm_ymmm256",EVEX_Vpcmpeqw_kr_k1_zmm_zmmm512:1727,"1727":"EVEX_Vpcmpeqw_kr_k1_zmm_zmmm512",Pcmpeqd_mm_mmm64:1728,"1728":"Pcmpeqd_mm_mmm64",Pcmpeqd_xmm_xmmm128:1729,"1729":"Pcmpeqd_xmm_xmmm128",VEX_Vpcmpeqd_xmm_xmm_xmmm128:1730,"1730":"VEX_Vpcmpeqd_xmm_xmm_xmmm128",VEX_Vpcmpeqd_ymm_ymm_ymmm256:1731,"1731":"VEX_Vpcmpeqd_ymm_ymm_ymmm256",EVEX_Vpcmpeqd_kr_k1_xmm_xmmm128b32:1732,"1732":"EVEX_Vpcmpeqd_kr_k1_xmm_xmmm128b32",EVEX_Vpcmpeqd_kr_k1_ymm_ymmm256b32:1733,"1733":"EVEX_Vpcmpeqd_kr_k1_ymm_ymmm256b32",EVEX_Vpcmpeqd_kr_k1_zmm_zmmm512b32:1734,"1734":"EVEX_Vpcmpeqd_kr_k1_zmm_zmmm512b32",Emms:1735,"1735":"Emms",VEX_Vzeroupper:1736,"1736":"VEX_Vzeroupper",VEX_Vzeroall:1737,"1737":"VEX_Vzeroall",Vmread_rm32_r32:1738,"1738":"Vmread_rm32_r32",Vmread_rm64_r64:1739,"1739":"Vmread_rm64_r64",EVEX_Vcvttps2udq_xmm_k1z_xmmm128b32:1740,"1740":"EVEX_Vcvttps2udq_xmm_k1z_xmmm128b32",EVEX_Vcvttps2udq_ymm_k1z_ymmm256b32:1741,"1741":"EVEX_Vcvttps2udq_ymm_k1z_ymmm256b32",EVEX_Vcvttps2udq_zmm_k1z_zmmm512b32_sae:1742,"1742":"EVEX_Vcvttps2udq_zmm_k1z_zmmm512b32_sae",EVEX_Vcvttpd2udq_xmm_k1z_xmmm128b64:1743,"1743":"EVEX_Vcvttpd2udq_xmm_k1z_xmmm128b64",EVEX_Vcvttpd2udq_xmm_k1z_ymmm256b64:1744,"1744":"EVEX_Vcvttpd2udq_xmm_k1z_ymmm256b64",EVEX_Vcvttpd2udq_ymm_k1z_zmmm512b64_sae:1745,"1745":"EVEX_Vcvttpd2udq_ymm_k1z_zmmm512b64_sae",Extrq_xmm_imm8_imm8:1746,"1746":"Extrq_xmm_imm8_imm8",EVEX_Vcvttps2uqq_xmm_k1z_xmmm64b32:1747,"1747":"EVEX_Vcvttps2uqq_xmm_k1z_xmmm64b32",EVEX_Vcvttps2uqq_ymm_k1z_xmmm128b32:1748,"1748":"EVEX_Vcvttps2uqq_ymm_k1z_xmmm128b32",EVEX_Vcvttps2uqq_zmm_k1z_ymmm256b32_sae:1749,"1749":"EVEX_Vcvttps2uqq_zmm_k1z_ymmm256b32_sae",EVEX_Vcvttpd2uqq_xmm_k1z_xmmm128b64:1750,"1750":"EVEX_Vcvttpd2uqq_xmm_k1z_xmmm128b64",EVEX_Vcvttpd2uqq_ymm_k1z_ymmm256b64:1751,"1751":"EVEX_Vcvttpd2uqq_ymm_k1z_ymmm256b64",EVEX_Vcvttpd2uqq_zmm_k1z_zmmm512b64_sae:1752,"1752":"EVEX_Vcvttpd2uqq_zmm_k1z_zmmm512b64_sae",EVEX_Vcvttss2usi_r32_xmmm32_sae:1753,"1753":"EVEX_Vcvttss2usi_r32_xmmm32_sae",EVEX_Vcvttss2usi_r64_xmmm32_sae:1754,"1754":"EVEX_Vcvttss2usi_r64_xmmm32_sae",Insertq_xmm_xmm_imm8_imm8:1755,"1755":"Insertq_xmm_xmm_imm8_imm8",EVEX_Vcvttsd2usi_r32_xmmm64_sae:1756,"1756":"EVEX_Vcvttsd2usi_r32_xmmm64_sae",EVEX_Vcvttsd2usi_r64_xmmm64_sae:1757,"1757":"EVEX_Vcvttsd2usi_r64_xmmm64_sae",Vmwrite_r32_rm32:1758,"1758":"Vmwrite_r32_rm32",Vmwrite_r64_rm64:1759,"1759":"Vmwrite_r64_rm64",EVEX_Vcvtps2udq_xmm_k1z_xmmm128b32:1760,"1760":"EVEX_Vcvtps2udq_xmm_k1z_xmmm128b32",EVEX_Vcvtps2udq_ymm_k1z_ymmm256b32:1761,"1761":"EVEX_Vcvtps2udq_ymm_k1z_ymmm256b32",EVEX_Vcvtps2udq_zmm_k1z_zmmm512b32_er:1762,"1762":"EVEX_Vcvtps2udq_zmm_k1z_zmmm512b32_er",EVEX_Vcvtpd2udq_xmm_k1z_xmmm128b64:1763,"1763":"EVEX_Vcvtpd2udq_xmm_k1z_xmmm128b64",EVEX_Vcvtpd2udq_xmm_k1z_ymmm256b64:1764,"1764":"EVEX_Vcvtpd2udq_xmm_k1z_ymmm256b64",EVEX_Vcvtpd2udq_ymm_k1z_zmmm512b64_er:1765,"1765":"EVEX_Vcvtpd2udq_ymm_k1z_zmmm512b64_er",Extrq_xmm_xmm:1766,"1766":"Extrq_xmm_xmm",EVEX_Vcvtps2uqq_xmm_k1z_xmmm64b32:1767,"1767":"EVEX_Vcvtps2uqq_xmm_k1z_xmmm64b32",EVEX_Vcvtps2uqq_ymm_k1z_xmmm128b32:1768,"1768":"EVEX_Vcvtps2uqq_ymm_k1z_xmmm128b32",EVEX_Vcvtps2uqq_zmm_k1z_ymmm256b32_er:1769,"1769":"EVEX_Vcvtps2uqq_zmm_k1z_ymmm256b32_er",EVEX_Vcvtpd2uqq_xmm_k1z_xmmm128b64:1770,"1770":"EVEX_Vcvtpd2uqq_xmm_k1z_xmmm128b64",EVEX_Vcvtpd2uqq_ymm_k1z_ymmm256b64:1771,"1771":"EVEX_Vcvtpd2uqq_ymm_k1z_ymmm256b64",EVEX_Vcvtpd2uqq_zmm_k1z_zmmm512b64_er:1772,"1772":"EVEX_Vcvtpd2uqq_zmm_k1z_zmmm512b64_er",EVEX_Vcvtss2usi_r32_xmmm32_er:1773,"1773":"EVEX_Vcvtss2usi_r32_xmmm32_er",EVEX_Vcvtss2usi_r64_xmmm32_er:1774,"1774":"EVEX_Vcvtss2usi_r64_xmmm32_er",Insertq_xmm_xmm:1775,"1775":"Insertq_xmm_xmm",EVEX_Vcvtsd2usi_r32_xmmm64_er:1776,"1776":"EVEX_Vcvtsd2usi_r32_xmmm64_er",EVEX_Vcvtsd2usi_r64_xmmm64_er:1777,"1777":"EVEX_Vcvtsd2usi_r64_xmmm64_er",EVEX_Vcvttps2qq_xmm_k1z_xmmm64b32:1778,"1778":"EVEX_Vcvttps2qq_xmm_k1z_xmmm64b32",EVEX_Vcvttps2qq_ymm_k1z_xmmm128b32:1779,"1779":"EVEX_Vcvttps2qq_ymm_k1z_xmmm128b32",EVEX_Vcvttps2qq_zmm_k1z_ymmm256b32_sae:1780,"1780":"EVEX_Vcvttps2qq_zmm_k1z_ymmm256b32_sae",EVEX_Vcvttpd2qq_xmm_k1z_xmmm128b64:1781,"1781":"EVEX_Vcvttpd2qq_xmm_k1z_xmmm128b64",EVEX_Vcvttpd2qq_ymm_k1z_ymmm256b64:1782,"1782":"EVEX_Vcvttpd2qq_ymm_k1z_ymmm256b64",EVEX_Vcvttpd2qq_zmm_k1z_zmmm512b64_sae:1783,"1783":"EVEX_Vcvttpd2qq_zmm_k1z_zmmm512b64_sae",EVEX_Vcvtudq2pd_xmm_k1z_xmmm64b32:1784,"1784":"EVEX_Vcvtudq2pd_xmm_k1z_xmmm64b32",EVEX_Vcvtudq2pd_ymm_k1z_xmmm128b32:1785,"1785":"EVEX_Vcvtudq2pd_ymm_k1z_xmmm128b32",EVEX_Vcvtudq2pd_zmm_k1z_ymmm256b32_er:1786,"1786":"EVEX_Vcvtudq2pd_zmm_k1z_ymmm256b32_er",EVEX_Vcvtuqq2pd_xmm_k1z_xmmm128b64:1787,"1787":"EVEX_Vcvtuqq2pd_xmm_k1z_xmmm128b64",EVEX_Vcvtuqq2pd_ymm_k1z_ymmm256b64:1788,"1788":"EVEX_Vcvtuqq2pd_ymm_k1z_ymmm256b64",EVEX_Vcvtuqq2pd_zmm_k1z_zmmm512b64_er:1789,"1789":"EVEX_Vcvtuqq2pd_zmm_k1z_zmmm512b64_er",EVEX_Vcvtudq2ps_xmm_k1z_xmmm128b32:1790,"1790":"EVEX_Vcvtudq2ps_xmm_k1z_xmmm128b32",EVEX_Vcvtudq2ps_ymm_k1z_ymmm256b32:1791,"1791":"EVEX_Vcvtudq2ps_ymm_k1z_ymmm256b32",EVEX_Vcvtudq2ps_zmm_k1z_zmmm512b32_er:1792,"1792":"EVEX_Vcvtudq2ps_zmm_k1z_zmmm512b32_er",EVEX_Vcvtuqq2ps_xmm_k1z_xmmm128b64:1793,"1793":"EVEX_Vcvtuqq2ps_xmm_k1z_xmmm128b64",EVEX_Vcvtuqq2ps_xmm_k1z_ymmm256b64:1794,"1794":"EVEX_Vcvtuqq2ps_xmm_k1z_ymmm256b64",EVEX_Vcvtuqq2ps_ymm_k1z_zmmm512b64_er:1795,"1795":"EVEX_Vcvtuqq2ps_ymm_k1z_zmmm512b64_er",EVEX_Vcvtps2qq_xmm_k1z_xmmm64b32:1796,"1796":"EVEX_Vcvtps2qq_xmm_k1z_xmmm64b32",EVEX_Vcvtps2qq_ymm_k1z_xmmm128b32:1797,"1797":"EVEX_Vcvtps2qq_ymm_k1z_xmmm128b32",EVEX_Vcvtps2qq_zmm_k1z_ymmm256b32_er:1798,"1798":"EVEX_Vcvtps2qq_zmm_k1z_ymmm256b32_er",EVEX_Vcvtpd2qq_xmm_k1z_xmmm128b64:1799,"1799":"EVEX_Vcvtpd2qq_xmm_k1z_xmmm128b64",EVEX_Vcvtpd2qq_ymm_k1z_ymmm256b64:1800,"1800":"EVEX_Vcvtpd2qq_ymm_k1z_ymmm256b64",EVEX_Vcvtpd2qq_zmm_k1z_zmmm512b64_er:1801,"1801":"EVEX_Vcvtpd2qq_zmm_k1z_zmmm512b64_er",EVEX_Vcvtusi2ss_xmm_xmm_rm32_er:1802,"1802":"EVEX_Vcvtusi2ss_xmm_xmm_rm32_er",EVEX_Vcvtusi2ss_xmm_xmm_rm64_er:1803,"1803":"EVEX_Vcvtusi2ss_xmm_xmm_rm64_er",EVEX_Vcvtusi2sd_xmm_xmm_rm32_er:1804,"1804":"EVEX_Vcvtusi2sd_xmm_xmm_rm32_er",EVEX_Vcvtusi2sd_xmm_xmm_rm64_er:1805,"1805":"EVEX_Vcvtusi2sd_xmm_xmm_rm64_er",Haddpd_xmm_xmmm128:1806,"1806":"Haddpd_xmm_xmmm128",VEX_Vhaddpd_xmm_xmm_xmmm128:1807,"1807":"VEX_Vhaddpd_xmm_xmm_xmmm128",VEX_Vhaddpd_ymm_ymm_ymmm256:1808,"1808":"VEX_Vhaddpd_ymm_ymm_ymmm256",Haddps_xmm_xmmm128:1809,"1809":"Haddps_xmm_xmmm128",VEX_Vhaddps_xmm_xmm_xmmm128:1810,"1810":"VEX_Vhaddps_xmm_xmm_xmmm128",VEX_Vhaddps_ymm_ymm_ymmm256:1811,"1811":"VEX_Vhaddps_ymm_ymm_ymmm256",Hsubpd_xmm_xmmm128:1812,"1812":"Hsubpd_xmm_xmmm128",VEX_Vhsubpd_xmm_xmm_xmmm128:1813,"1813":"VEX_Vhsubpd_xmm_xmm_xmmm128",VEX_Vhsubpd_ymm_ymm_ymmm256:1814,"1814":"VEX_Vhsubpd_ymm_ymm_ymmm256",Hsubps_xmm_xmmm128:1815,"1815":"Hsubps_xmm_xmmm128",VEX_Vhsubps_xmm_xmm_xmmm128:1816,"1816":"VEX_Vhsubps_xmm_xmm_xmmm128",VEX_Vhsubps_ymm_ymm_ymmm256:1817,"1817":"VEX_Vhsubps_ymm_ymm_ymmm256",Movd_rm32_mm:1818,"1818":"Movd_rm32_mm",Movq_rm64_mm:1819,"1819":"Movq_rm64_mm",Movd_rm32_xmm:1820,"1820":"Movd_rm32_xmm",Movq_rm64_xmm:1821,"1821":"Movq_rm64_xmm",VEX_Vmovd_rm32_xmm:1822,"1822":"VEX_Vmovd_rm32_xmm",VEX_Vmovq_rm64_xmm:1823,"1823":"VEX_Vmovq_rm64_xmm",EVEX_Vmovd_rm32_xmm:1824,"1824":"EVEX_Vmovd_rm32_xmm",EVEX_Vmovq_rm64_xmm:1825,"1825":"EVEX_Vmovq_rm64_xmm",Movq_xmm_xmmm64:1826,"1826":"Movq_xmm_xmmm64",VEX_Vmovq_xmm_xmmm64:1827,"1827":"VEX_Vmovq_xmm_xmmm64",EVEX_Vmovq_xmm_xmmm64:1828,"1828":"EVEX_Vmovq_xmm_xmmm64",Movq_mmm64_mm:1829,"1829":"Movq_mmm64_mm",Movdqa_xmmm128_xmm:1830,"1830":"Movdqa_xmmm128_xmm",VEX_Vmovdqa_xmmm128_xmm:1831,"1831":"VEX_Vmovdqa_xmmm128_xmm",VEX_Vmovdqa_ymmm256_ymm:1832,"1832":"VEX_Vmovdqa_ymmm256_ymm",EVEX_Vmovdqa32_xmmm128_k1z_xmm:1833,"1833":"EVEX_Vmovdqa32_xmmm128_k1z_xmm",EVEX_Vmovdqa32_ymmm256_k1z_ymm:1834,"1834":"EVEX_Vmovdqa32_ymmm256_k1z_ymm",EVEX_Vmovdqa32_zmmm512_k1z_zmm:1835,"1835":"EVEX_Vmovdqa32_zmmm512_k1z_zmm",EVEX_Vmovdqa64_xmmm128_k1z_xmm:1836,"1836":"EVEX_Vmovdqa64_xmmm128_k1z_xmm",EVEX_Vmovdqa64_ymmm256_k1z_ymm:1837,"1837":"EVEX_Vmovdqa64_ymmm256_k1z_ymm",EVEX_Vmovdqa64_zmmm512_k1z_zmm:1838,"1838":"EVEX_Vmovdqa64_zmmm512_k1z_zmm",Movdqu_xmmm128_xmm:1839,"1839":"Movdqu_xmmm128_xmm",VEX_Vmovdqu_xmmm128_xmm:1840,"1840":"VEX_Vmovdqu_xmmm128_xmm",VEX_Vmovdqu_ymmm256_ymm:1841,"1841":"VEX_Vmovdqu_ymmm256_ymm",EVEX_Vmovdqu32_xmmm128_k1z_xmm:1842,"1842":"EVEX_Vmovdqu32_xmmm128_k1z_xmm",EVEX_Vmovdqu32_ymmm256_k1z_ymm:1843,"1843":"EVEX_Vmovdqu32_ymmm256_k1z_ymm",EVEX_Vmovdqu32_zmmm512_k1z_zmm:1844,"1844":"EVEX_Vmovdqu32_zmmm512_k1z_zmm",EVEX_Vmovdqu64_xmmm128_k1z_xmm:1845,"1845":"EVEX_Vmovdqu64_xmmm128_k1z_xmm",EVEX_Vmovdqu64_ymmm256_k1z_ymm:1846,"1846":"EVEX_Vmovdqu64_ymmm256_k1z_ymm",EVEX_Vmovdqu64_zmmm512_k1z_zmm:1847,"1847":"EVEX_Vmovdqu64_zmmm512_k1z_zmm",EVEX_Vmovdqu8_xmmm128_k1z_xmm:1848,"1848":"EVEX_Vmovdqu8_xmmm128_k1z_xmm",EVEX_Vmovdqu8_ymmm256_k1z_ymm:1849,"1849":"EVEX_Vmovdqu8_ymmm256_k1z_ymm",EVEX_Vmovdqu8_zmmm512_k1z_zmm:1850,"1850":"EVEX_Vmovdqu8_zmmm512_k1z_zmm",EVEX_Vmovdqu16_xmmm128_k1z_xmm:1851,"1851":"EVEX_Vmovdqu16_xmmm128_k1z_xmm",EVEX_Vmovdqu16_ymmm256_k1z_ymm:1852,"1852":"EVEX_Vmovdqu16_ymmm256_k1z_ymm",EVEX_Vmovdqu16_zmmm512_k1z_zmm:1853,"1853":"EVEX_Vmovdqu16_zmmm512_k1z_zmm",Jo_rel16:1854,"1854":"Jo_rel16",Jo_rel32_32:1855,"1855":"Jo_rel32_32",Jo_rel32_64:1856,"1856":"Jo_rel32_64",Jno_rel16:1857,"1857":"Jno_rel16",Jno_rel32_32:1858,"1858":"Jno_rel32_32",Jno_rel32_64:1859,"1859":"Jno_rel32_64",Jb_rel16:1860,"1860":"Jb_rel16",Jb_rel32_32:1861,"1861":"Jb_rel32_32",Jb_rel32_64:1862,"1862":"Jb_rel32_64",Jae_rel16:1863,"1863":"Jae_rel16",Jae_rel32_32:1864,"1864":"Jae_rel32_32",Jae_rel32_64:1865,"1865":"Jae_rel32_64",Je_rel16:1866,"1866":"Je_rel16",Je_rel32_32:1867,"1867":"Je_rel32_32",Je_rel32_64:1868,"1868":"Je_rel32_64",Jne_rel16:1869,"1869":"Jne_rel16",Jne_rel32_32:1870,"1870":"Jne_rel32_32",Jne_rel32_64:1871,"1871":"Jne_rel32_64",Jbe_rel16:1872,"1872":"Jbe_rel16",Jbe_rel32_32:1873,"1873":"Jbe_rel32_32",Jbe_rel32_64:1874,"1874":"Jbe_rel32_64",Ja_rel16:1875,"1875":"Ja_rel16",Ja_rel32_32:1876,"1876":"Ja_rel32_32",Ja_rel32_64:1877,"1877":"Ja_rel32_64",Js_rel16:1878,"1878":"Js_rel16",Js_rel32_32:1879,"1879":"Js_rel32_32",Js_rel32_64:1880,"1880":"Js_rel32_64",Jns_rel16:1881,"1881":"Jns_rel16",Jns_rel32_32:1882,"1882":"Jns_rel32_32",Jns_rel32_64:1883,"1883":"Jns_rel32_64",Jp_rel16:1884,"1884":"Jp_rel16",Jp_rel32_32:1885,"1885":"Jp_rel32_32",Jp_rel32_64:1886,"1886":"Jp_rel32_64",Jnp_rel16:1887,"1887":"Jnp_rel16",Jnp_rel32_32:1888,"1888":"Jnp_rel32_32",Jnp_rel32_64:1889,"1889":"Jnp_rel32_64",Jl_rel16:1890,"1890":"Jl_rel16",Jl_rel32_32:1891,"1891":"Jl_rel32_32",Jl_rel32_64:1892,"1892":"Jl_rel32_64",Jge_rel16:1893,"1893":"Jge_rel16",Jge_rel32_32:1894,"1894":"Jge_rel32_32",Jge_rel32_64:1895,"1895":"Jge_rel32_64",Jle_rel16:1896,"1896":"Jle_rel16",Jle_rel32_32:1897,"1897":"Jle_rel32_32",Jle_rel32_64:1898,"1898":"Jle_rel32_64",Jg_rel16:1899,"1899":"Jg_rel16",Jg_rel32_32:1900,"1900":"Jg_rel32_32",Jg_rel32_64:1901,"1901":"Jg_rel32_64",Seto_rm8:1902,"1902":"Seto_rm8",Setno_rm8:1903,"1903":"Setno_rm8",Setb_rm8:1904,"1904":"Setb_rm8",Setae_rm8:1905,"1905":"Setae_rm8",Sete_rm8:1906,"1906":"Sete_rm8",Setne_rm8:1907,"1907":"Setne_rm8",Setbe_rm8:1908,"1908":"Setbe_rm8",Seta_rm8:1909,"1909":"Seta_rm8",Sets_rm8:1910,"1910":"Sets_rm8",Setns_rm8:1911,"1911":"Setns_rm8",Setp_rm8:1912,"1912":"Setp_rm8",Setnp_rm8:1913,"1913":"Setnp_rm8",Setl_rm8:1914,"1914":"Setl_rm8",Setge_rm8:1915,"1915":"Setge_rm8",Setle_rm8:1916,"1916":"Setle_rm8",Setg_rm8:1917,"1917":"Setg_rm8",VEX_Kmovw_kr_km16:1918,"1918":"VEX_Kmovw_kr_km16",VEX_Kmovq_kr_km64:1919,"1919":"VEX_Kmovq_kr_km64",VEX_Kmovb_kr_km8:1920,"1920":"VEX_Kmovb_kr_km8",VEX_Kmovd_kr_km32:1921,"1921":"VEX_Kmovd_kr_km32",VEX_Kmovw_m16_kr:1922,"1922":"VEX_Kmovw_m16_kr",VEX_Kmovq_m64_kr:1923,"1923":"VEX_Kmovq_m64_kr",VEX_Kmovb_m8_kr:1924,"1924":"VEX_Kmovb_m8_kr",VEX_Kmovd_m32_kr:1925,"1925":"VEX_Kmovd_m32_kr",VEX_Kmovw_kr_r32:1926,"1926":"VEX_Kmovw_kr_r32",VEX_Kmovb_kr_r32:1927,"1927":"VEX_Kmovb_kr_r32",VEX_Kmovd_kr_r32:1928,"1928":"VEX_Kmovd_kr_r32",VEX_Kmovq_kr_r64:1929,"1929":"VEX_Kmovq_kr_r64",VEX_Kmovw_r32_kr:1930,"1930":"VEX_Kmovw_r32_kr",VEX_Kmovb_r32_kr:1931,"1931":"VEX_Kmovb_r32_kr",VEX_Kmovd_r32_kr:1932,"1932":"VEX_Kmovd_r32_kr",VEX_Kmovq_r64_kr:1933,"1933":"VEX_Kmovq_r64_kr",VEX_Kortestw_kr_kr:1934,"1934":"VEX_Kortestw_kr_kr",VEX_Kortestq_kr_kr:1935,"1935":"VEX_Kortestq_kr_kr",VEX_Kortestb_kr_kr:1936,"1936":"VEX_Kortestb_kr_kr",VEX_Kortestd_kr_kr:1937,"1937":"VEX_Kortestd_kr_kr",VEX_Ktestw_kr_kr:1938,"1938":"VEX_Ktestw_kr_kr",VEX_Ktestq_kr_kr:1939,"1939":"VEX_Ktestq_kr_kr",VEX_Ktestb_kr_kr:1940,"1940":"VEX_Ktestb_kr_kr",VEX_Ktestd_kr_kr:1941,"1941":"VEX_Ktestd_kr_kr",Pushw_FS:1942,"1942":"Pushw_FS",Pushd_FS:1943,"1943":"Pushd_FS",Pushq_FS:1944,"1944":"Pushq_FS",Popw_FS:1945,"1945":"Popw_FS",Popd_FS:1946,"1946":"Popd_FS",Popq_FS:1947,"1947":"Popq_FS",Cpuid:1948,"1948":"Cpuid",Bt_rm16_r16:1949,"1949":"Bt_rm16_r16",Bt_rm32_r32:1950,"1950":"Bt_rm32_r32",Bt_rm64_r64:1951,"1951":"Bt_rm64_r64",Shld_rm16_r16_imm8:1952,"1952":"Shld_rm16_r16_imm8",Shld_rm32_r32_imm8:1953,"1953":"Shld_rm32_r32_imm8",Shld_rm64_r64_imm8:1954,"1954":"Shld_rm64_r64_imm8",Shld_rm16_r16_CL:1955,"1955":"Shld_rm16_r16_CL",Shld_rm32_r32_CL:1956,"1956":"Shld_rm32_r32_CL",Shld_rm64_r64_CL:1957,"1957":"Shld_rm64_r64_CL",Montmul_16:1958,"1958":"Montmul_16",Montmul_32:1959,"1959":"Montmul_32",Montmul_64:1960,"1960":"Montmul_64",Xsha1_16:1961,"1961":"Xsha1_16",Xsha1_32:1962,"1962":"Xsha1_32",Xsha1_64:1963,"1963":"Xsha1_64",Xsha256_16:1964,"1964":"Xsha256_16",Xsha256_32:1965,"1965":"Xsha256_32",Xsha256_64:1966,"1966":"Xsha256_64",Xbts_r16_rm16:1967,"1967":"Xbts_r16_rm16",Xbts_r32_rm32:1968,"1968":"Xbts_r32_rm32",Xstore_16:1969,"1969":"Xstore_16",Xstore_32:1970,"1970":"Xstore_32",Xstore_64:1971,"1971":"Xstore_64",Xcryptecb_16:1972,"1972":"Xcryptecb_16",Xcryptecb_32:1973,"1973":"Xcryptecb_32",Xcryptecb_64:1974,"1974":"Xcryptecb_64",Xcryptcbc_16:1975,"1975":"Xcryptcbc_16",Xcryptcbc_32:1976,"1976":"Xcryptcbc_32",Xcryptcbc_64:1977,"1977":"Xcryptcbc_64",Xcryptctr_16:1978,"1978":"Xcryptctr_16",Xcryptctr_32:1979,"1979":"Xcryptctr_32",Xcryptctr_64:1980,"1980":"Xcryptctr_64",Xcryptcfb_16:1981,"1981":"Xcryptcfb_16",Xcryptcfb_32:1982,"1982":"Xcryptcfb_32",Xcryptcfb_64:1983,"1983":"Xcryptcfb_64",Xcryptofb_16:1984,"1984":"Xcryptofb_16",Xcryptofb_32:1985,"1985":"Xcryptofb_32",Xcryptofb_64:1986,"1986":"Xcryptofb_64",Ibts_rm16_r16:1987,"1987":"Ibts_rm16_r16",Ibts_rm32_r32:1988,"1988":"Ibts_rm32_r32",Cmpxchg486_rm8_r8:1989,"1989":"Cmpxchg486_rm8_r8",Cmpxchg486_rm16_r16:1990,"1990":"Cmpxchg486_rm16_r16",Cmpxchg486_rm32_r32:1991,"1991":"Cmpxchg486_rm32_r32",Pushw_GS:1992,"1992":"Pushw_GS",Pushd_GS:1993,"1993":"Pushd_GS",Pushq_GS:1994,"1994":"Pushq_GS",Popw_GS:1995,"1995":"Popw_GS",Popd_GS:1996,"1996":"Popd_GS",Popq_GS:1997,"1997":"Popq_GS",Rsm:1998,"1998":"Rsm",Bts_rm16_r16:1999,"1999":"Bts_rm16_r16",Bts_rm32_r32:2000,"2000":"Bts_rm32_r32",Bts_rm64_r64:2001,"2001":"Bts_rm64_r64",Shrd_rm16_r16_imm8:2002,"2002":"Shrd_rm16_r16_imm8",Shrd_rm32_r32_imm8:2003,"2003":"Shrd_rm32_r32_imm8",Shrd_rm64_r64_imm8:2004,"2004":"Shrd_rm64_r64_imm8",Shrd_rm16_r16_CL:2005,"2005":"Shrd_rm16_r16_CL",Shrd_rm32_r32_CL:2006,"2006":"Shrd_rm32_r32_CL",Shrd_rm64_r64_CL:2007,"2007":"Shrd_rm64_r64_CL",Fxsave_m512byte:2008,"2008":"Fxsave_m512byte",Fxsave64_m512byte:2009,"2009":"Fxsave64_m512byte",Rdfsbase_r32:2010,"2010":"Rdfsbase_r32",Rdfsbase_r64:2011,"2011":"Rdfsbase_r64",Fxrstor_m512byte:2012,"2012":"Fxrstor_m512byte",Fxrstor64_m512byte:2013,"2013":"Fxrstor64_m512byte",Rdgsbase_r32:2014,"2014":"Rdgsbase_r32",Rdgsbase_r64:2015,"2015":"Rdgsbase_r64",Ldmxcsr_m32:2016,"2016":"Ldmxcsr_m32",Wrfsbase_r32:2017,"2017":"Wrfsbase_r32",Wrfsbase_r64:2018,"2018":"Wrfsbase_r64",VEX_Vldmxcsr_m32:2019,"2019":"VEX_Vldmxcsr_m32",Stmxcsr_m32:2020,"2020":"Stmxcsr_m32",Wrgsbase_r32:2021,"2021":"Wrgsbase_r32",Wrgsbase_r64:2022,"2022":"Wrgsbase_r64",VEX_Vstmxcsr_m32:2023,"2023":"VEX_Vstmxcsr_m32",Xsave_mem:2024,"2024":"Xsave_mem",Xsave64_mem:2025,"2025":"Xsave64_mem",Ptwrite_rm32:2026,"2026":"Ptwrite_rm32",Ptwrite_rm64:2027,"2027":"Ptwrite_rm64",Xrstor_mem:2028,"2028":"Xrstor_mem",Xrstor64_mem:2029,"2029":"Xrstor64_mem",Incsspd_r32:2030,"2030":"Incsspd_r32",Incsspq_r64:2031,"2031":"Incsspq_r64",Xsaveopt_mem:2032,"2032":"Xsaveopt_mem",Xsaveopt64_mem:2033,"2033":"Xsaveopt64_mem",Clwb_m8:2034,"2034":"Clwb_m8",Tpause_r32:2035,"2035":"Tpause_r32",Tpause_r64:2036,"2036":"Tpause_r64",Clrssbsy_m64:2037,"2037":"Clrssbsy_m64",Umonitor_r16:2038,"2038":"Umonitor_r16",Umonitor_r32:2039,"2039":"Umonitor_r32",Umonitor_r64:2040,"2040":"Umonitor_r64",Umwait_r32:2041,"2041":"Umwait_r32",Umwait_r64:2042,"2042":"Umwait_r64",Clflush_m8:2043,"2043":"Clflush_m8",Clflushopt_m8:2044,"2044":"Clflushopt_m8",Lfence:2045,"2045":"Lfence",Lfence_E9:2046,"2046":"Lfence_E9",Lfence_EA:2047,"2047":"Lfence_EA",Lfence_EB:2048,"2048":"Lfence_EB",Lfence_EC:2049,"2049":"Lfence_EC",Lfence_ED:2050,"2050":"Lfence_ED",Lfence_EE:2051,"2051":"Lfence_EE",Lfence_EF:2052,"2052":"Lfence_EF",Mfence:2053,"2053":"Mfence",Mfence_F1:2054,"2054":"Mfence_F1",Mfence_F2:2055,"2055":"Mfence_F2",Mfence_F3:2056,"2056":"Mfence_F3",Mfence_F4:2057,"2057":"Mfence_F4",Mfence_F5:2058,"2058":"Mfence_F5",Mfence_F6:2059,"2059":"Mfence_F6",Mfence_F7:2060,"2060":"Mfence_F7",Sfence:2061,"2061":"Sfence",Sfence_F9:2062,"2062":"Sfence_F9",Sfence_FA:2063,"2063":"Sfence_FA",Sfence_FB:2064,"2064":"Sfence_FB",Sfence_FC:2065,"2065":"Sfence_FC",Sfence_FD:2066,"2066":"Sfence_FD",Sfence_FE:2067,"2067":"Sfence_FE",Sfence_FF:2068,"2068":"Sfence_FF",Pcommit:2069,"2069":"Pcommit",Imul_r16_rm16:2070,"2070":"Imul_r16_rm16",Imul_r32_rm32:2071,"2071":"Imul_r32_rm32",Imul_r64_rm64:2072,"2072":"Imul_r64_rm64",Cmpxchg_rm8_r8:2073,"2073":"Cmpxchg_rm8_r8",Cmpxchg_rm16_r16:2074,"2074":"Cmpxchg_rm16_r16",Cmpxchg_rm32_r32:2075,"2075":"Cmpxchg_rm32_r32",Cmpxchg_rm64_r64:2076,"2076":"Cmpxchg_rm64_r64",Lss_r16_m1616:2077,"2077":"Lss_r16_m1616",Lss_r32_m1632:2078,"2078":"Lss_r32_m1632",Lss_r64_m1664:2079,"2079":"Lss_r64_m1664",Btr_rm16_r16:2080,"2080":"Btr_rm16_r16",Btr_rm32_r32:2081,"2081":"Btr_rm32_r32",Btr_rm64_r64:2082,"2082":"Btr_rm64_r64",Lfs_r16_m1616:2083,"2083":"Lfs_r16_m1616",Lfs_r32_m1632:2084,"2084":"Lfs_r32_m1632",Lfs_r64_m1664:2085,"2085":"Lfs_r64_m1664",Lgs_r16_m1616:2086,"2086":"Lgs_r16_m1616",Lgs_r32_m1632:2087,"2087":"Lgs_r32_m1632",Lgs_r64_m1664:2088,"2088":"Lgs_r64_m1664",Movzx_r16_rm8:2089,"2089":"Movzx_r16_rm8",Movzx_r32_rm8:2090,"2090":"Movzx_r32_rm8",Movzx_r64_rm8:2091,"2091":"Movzx_r64_rm8",Movzx_r16_rm16:2092,"2092":"Movzx_r16_rm16",Movzx_r32_rm16:2093,"2093":"Movzx_r32_rm16",Movzx_r64_rm16:2094,"2094":"Movzx_r64_rm16",Jmpe_disp16:2095,"2095":"Jmpe_disp16",Jmpe_disp32:2096,"2096":"Jmpe_disp32",Popcnt_r16_rm16:2097,"2097":"Popcnt_r16_rm16",Popcnt_r32_rm32:2098,"2098":"Popcnt_r32_rm32",Popcnt_r64_rm64:2099,"2099":"Popcnt_r64_rm64",Ud1_r16_rm16:2100,"2100":"Ud1_r16_rm16",Ud1_r32_rm32:2101,"2101":"Ud1_r32_rm32",Ud1_r64_rm64:2102,"2102":"Ud1_r64_rm64",Bt_rm16_imm8:2103,"2103":"Bt_rm16_imm8",Bt_rm32_imm8:2104,"2104":"Bt_rm32_imm8",Bt_rm64_imm8:2105,"2105":"Bt_rm64_imm8",Bts_rm16_imm8:2106,"2106":"Bts_rm16_imm8",Bts_rm32_imm8:2107,"2107":"Bts_rm32_imm8",Bts_rm64_imm8:2108,"2108":"Bts_rm64_imm8",Btr_rm16_imm8:2109,"2109":"Btr_rm16_imm8",Btr_rm32_imm8:2110,"2110":"Btr_rm32_imm8",Btr_rm64_imm8:2111,"2111":"Btr_rm64_imm8",Btc_rm16_imm8:2112,"2112":"Btc_rm16_imm8",Btc_rm32_imm8:2113,"2113":"Btc_rm32_imm8",Btc_rm64_imm8:2114,"2114":"Btc_rm64_imm8",Btc_rm16_r16:2115,"2115":"Btc_rm16_r16",Btc_rm32_r32:2116,"2116":"Btc_rm32_r32",Btc_rm64_r64:2117,"2117":"Btc_rm64_r64",Bsf_r16_rm16:2118,"2118":"Bsf_r16_rm16",Bsf_r32_rm32:2119,"2119":"Bsf_r32_rm32",Bsf_r64_rm64:2120,"2120":"Bsf_r64_rm64",Tzcnt_r16_rm16:2121,"2121":"Tzcnt_r16_rm16",Tzcnt_r32_rm32:2122,"2122":"Tzcnt_r32_rm32",Tzcnt_r64_rm64:2123,"2123":"Tzcnt_r64_rm64",Bsr_r16_rm16:2124,"2124":"Bsr_r16_rm16",Bsr_r32_rm32:2125,"2125":"Bsr_r32_rm32",Bsr_r64_rm64:2126,"2126":"Bsr_r64_rm64",Lzcnt_r16_rm16:2127,"2127":"Lzcnt_r16_rm16",Lzcnt_r32_rm32:2128,"2128":"Lzcnt_r32_rm32",Lzcnt_r64_rm64:2129,"2129":"Lzcnt_r64_rm64",Movsx_r16_rm8:2130,"2130":"Movsx_r16_rm8",Movsx_r32_rm8:2131,"2131":"Movsx_r32_rm8",Movsx_r64_rm8:2132,"2132":"Movsx_r64_rm8",Movsx_r16_rm16:2133,"2133":"Movsx_r16_rm16",Movsx_r32_rm16:2134,"2134":"Movsx_r32_rm16",Movsx_r64_rm16:2135,"2135":"Movsx_r64_rm16",Xadd_rm8_r8:2136,"2136":"Xadd_rm8_r8",Xadd_rm16_r16:2137,"2137":"Xadd_rm16_r16",Xadd_rm32_r32:2138,"2138":"Xadd_rm32_r32",Xadd_rm64_r64:2139,"2139":"Xadd_rm64_r64",Cmpps_xmm_xmmm128_imm8:2140,"2140":"Cmpps_xmm_xmmm128_imm8",VEX_Vcmpps_xmm_xmm_xmmm128_imm8:2141,"2141":"VEX_Vcmpps_xmm_xmm_xmmm128_imm8",VEX_Vcmpps_ymm_ymm_ymmm256_imm8:2142,"2142":"VEX_Vcmpps_ymm_ymm_ymmm256_imm8",EVEX_Vcmpps_kr_k1_xmm_xmmm128b32_imm8:2143,"2143":"EVEX_Vcmpps_kr_k1_xmm_xmmm128b32_imm8",EVEX_Vcmpps_kr_k1_ymm_ymmm256b32_imm8:2144,"2144":"EVEX_Vcmpps_kr_k1_ymm_ymmm256b32_imm8",EVEX_Vcmpps_kr_k1_zmm_zmmm512b32_imm8_sae:2145,"2145":"EVEX_Vcmpps_kr_k1_zmm_zmmm512b32_imm8_sae",Cmppd_xmm_xmmm128_imm8:2146,"2146":"Cmppd_xmm_xmmm128_imm8",VEX_Vcmppd_xmm_xmm_xmmm128_imm8:2147,"2147":"VEX_Vcmppd_xmm_xmm_xmmm128_imm8",VEX_Vcmppd_ymm_ymm_ymmm256_imm8:2148,"2148":"VEX_Vcmppd_ymm_ymm_ymmm256_imm8",EVEX_Vcmppd_kr_k1_xmm_xmmm128b64_imm8:2149,"2149":"EVEX_Vcmppd_kr_k1_xmm_xmmm128b64_imm8",EVEX_Vcmppd_kr_k1_ymm_ymmm256b64_imm8:2150,"2150":"EVEX_Vcmppd_kr_k1_ymm_ymmm256b64_imm8",EVEX_Vcmppd_kr_k1_zmm_zmmm512b64_imm8_sae:2151,"2151":"EVEX_Vcmppd_kr_k1_zmm_zmmm512b64_imm8_sae",Cmpss_xmm_xmmm32_imm8:2152,"2152":"Cmpss_xmm_xmmm32_imm8",VEX_Vcmpss_xmm_xmm_xmmm32_imm8:2153,"2153":"VEX_Vcmpss_xmm_xmm_xmmm32_imm8",EVEX_Vcmpss_kr_k1_xmm_xmmm32_imm8_sae:2154,"2154":"EVEX_Vcmpss_kr_k1_xmm_xmmm32_imm8_sae",Cmpsd_xmm_xmmm64_imm8:2155,"2155":"Cmpsd_xmm_xmmm64_imm8",VEX_Vcmpsd_xmm_xmm_xmmm64_imm8:2156,"2156":"VEX_Vcmpsd_xmm_xmm_xmmm64_imm8",EVEX_Vcmpsd_kr_k1_xmm_xmmm64_imm8_sae:2157,"2157":"EVEX_Vcmpsd_kr_k1_xmm_xmmm64_imm8_sae",Movnti_m32_r32:2158,"2158":"Movnti_m32_r32",Movnti_m64_r64:2159,"2159":"Movnti_m64_r64",Pinsrw_mm_r32m16_imm8:2160,"2160":"Pinsrw_mm_r32m16_imm8",Pinsrw_mm_r64m16_imm8:2161,"2161":"Pinsrw_mm_r64m16_imm8",Pinsrw_xmm_r32m16_imm8:2162,"2162":"Pinsrw_xmm_r32m16_imm8",Pinsrw_xmm_r64m16_imm8:2163,"2163":"Pinsrw_xmm_r64m16_imm8",VEX_Vpinsrw_xmm_xmm_r32m16_imm8:2164,"2164":"VEX_Vpinsrw_xmm_xmm_r32m16_imm8",VEX_Vpinsrw_xmm_xmm_r64m16_imm8:2165,"2165":"VEX_Vpinsrw_xmm_xmm_r64m16_imm8",EVEX_Vpinsrw_xmm_xmm_r32m16_imm8:2166,"2166":"EVEX_Vpinsrw_xmm_xmm_r32m16_imm8",EVEX_Vpinsrw_xmm_xmm_r64m16_imm8:2167,"2167":"EVEX_Vpinsrw_xmm_xmm_r64m16_imm8",Pextrw_r32_mm_imm8:2168,"2168":"Pextrw_r32_mm_imm8",Pextrw_r64_mm_imm8:2169,"2169":"Pextrw_r64_mm_imm8",Pextrw_r32_xmm_imm8:2170,"2170":"Pextrw_r32_xmm_imm8",Pextrw_r64_xmm_imm8:2171,"2171":"Pextrw_r64_xmm_imm8",VEX_Vpextrw_r32_xmm_imm8:2172,"2172":"VEX_Vpextrw_r32_xmm_imm8",VEX_Vpextrw_r64_xmm_imm8:2173,"2173":"VEX_Vpextrw_r64_xmm_imm8",EVEX_Vpextrw_r32_xmm_imm8:2174,"2174":"EVEX_Vpextrw_r32_xmm_imm8",EVEX_Vpextrw_r64_xmm_imm8:2175,"2175":"EVEX_Vpextrw_r64_xmm_imm8",Shufps_xmm_xmmm128_imm8:2176,"2176":"Shufps_xmm_xmmm128_imm8",VEX_Vshufps_xmm_xmm_xmmm128_imm8:2177,"2177":"VEX_Vshufps_xmm_xmm_xmmm128_imm8",VEX_Vshufps_ymm_ymm_ymmm256_imm8:2178,"2178":"VEX_Vshufps_ymm_ymm_ymmm256_imm8",EVEX_Vshufps_xmm_k1z_xmm_xmmm128b32_imm8:2179,"2179":"EVEX_Vshufps_xmm_k1z_xmm_xmmm128b32_imm8",EVEX_Vshufps_ymm_k1z_ymm_ymmm256b32_imm8:2180,"2180":"EVEX_Vshufps_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vshufps_zmm_k1z_zmm_zmmm512b32_imm8:2181,"2181":"EVEX_Vshufps_zmm_k1z_zmm_zmmm512b32_imm8",Shufpd_xmm_xmmm128_imm8:2182,"2182":"Shufpd_xmm_xmmm128_imm8",VEX_Vshufpd_xmm_xmm_xmmm128_imm8:2183,"2183":"VEX_Vshufpd_xmm_xmm_xmmm128_imm8",VEX_Vshufpd_ymm_ymm_ymmm256_imm8:2184,"2184":"VEX_Vshufpd_ymm_ymm_ymmm256_imm8",EVEX_Vshufpd_xmm_k1z_xmm_xmmm128b64_imm8:2185,"2185":"EVEX_Vshufpd_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vshufpd_ymm_k1z_ymm_ymmm256b64_imm8:2186,"2186":"EVEX_Vshufpd_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vshufpd_zmm_k1z_zmm_zmmm512b64_imm8:2187,"2187":"EVEX_Vshufpd_zmm_k1z_zmm_zmmm512b64_imm8",Cmpxchg8b_m64:2188,"2188":"Cmpxchg8b_m64",Cmpxchg16b_m128:2189,"2189":"Cmpxchg16b_m128",Xrstors_mem:2190,"2190":"Xrstors_mem",Xrstors64_mem:2191,"2191":"Xrstors64_mem",Xsavec_mem:2192,"2192":"Xsavec_mem",Xsavec64_mem:2193,"2193":"Xsavec64_mem",Xsaves_mem:2194,"2194":"Xsaves_mem",Xsaves64_mem:2195,"2195":"Xsaves64_mem",Vmptrld_m64:2196,"2196":"Vmptrld_m64",Vmclear_m64:2197,"2197":"Vmclear_m64",Vmxon_m64:2198,"2198":"Vmxon_m64",Rdrand_r16:2199,"2199":"Rdrand_r16",Rdrand_r32:2200,"2200":"Rdrand_r32",Rdrand_r64:2201,"2201":"Rdrand_r64",Vmptrst_m64:2202,"2202":"Vmptrst_m64",Rdseed_r16:2203,"2203":"Rdseed_r16",Rdseed_r32:2204,"2204":"Rdseed_r32",Rdseed_r64:2205,"2205":"Rdseed_r64",Rdpid_r32:2206,"2206":"Rdpid_r32",Rdpid_r64:2207,"2207":"Rdpid_r64",Bswap_r16:2208,"2208":"Bswap_r16",Bswap_r32:2209,"2209":"Bswap_r32",Bswap_r64:2210,"2210":"Bswap_r64",Addsubpd_xmm_xmmm128:2211,"2211":"Addsubpd_xmm_xmmm128",VEX_Vaddsubpd_xmm_xmm_xmmm128:2212,"2212":"VEX_Vaddsubpd_xmm_xmm_xmmm128",VEX_Vaddsubpd_ymm_ymm_ymmm256:2213,"2213":"VEX_Vaddsubpd_ymm_ymm_ymmm256",Addsubps_xmm_xmmm128:2214,"2214":"Addsubps_xmm_xmmm128",VEX_Vaddsubps_xmm_xmm_xmmm128:2215,"2215":"VEX_Vaddsubps_xmm_xmm_xmmm128",VEX_Vaddsubps_ymm_ymm_ymmm256:2216,"2216":"VEX_Vaddsubps_ymm_ymm_ymmm256",Psrlw_mm_mmm64:2217,"2217":"Psrlw_mm_mmm64",Psrlw_xmm_xmmm128:2218,"2218":"Psrlw_xmm_xmmm128",VEX_Vpsrlw_xmm_xmm_xmmm128:2219,"2219":"VEX_Vpsrlw_xmm_xmm_xmmm128",VEX_Vpsrlw_ymm_ymm_xmmm128:2220,"2220":"VEX_Vpsrlw_ymm_ymm_xmmm128",EVEX_Vpsrlw_xmm_k1z_xmm_xmmm128:2221,"2221":"EVEX_Vpsrlw_xmm_k1z_xmm_xmmm128",EVEX_Vpsrlw_ymm_k1z_ymm_xmmm128:2222,"2222":"EVEX_Vpsrlw_ymm_k1z_ymm_xmmm128",EVEX_Vpsrlw_zmm_k1z_zmm_xmmm128:2223,"2223":"EVEX_Vpsrlw_zmm_k1z_zmm_xmmm128",Psrld_mm_mmm64:2224,"2224":"Psrld_mm_mmm64",Psrld_xmm_xmmm128:2225,"2225":"Psrld_xmm_xmmm128",VEX_Vpsrld_xmm_xmm_xmmm128:2226,"2226":"VEX_Vpsrld_xmm_xmm_xmmm128",VEX_Vpsrld_ymm_ymm_xmmm128:2227,"2227":"VEX_Vpsrld_ymm_ymm_xmmm128",EVEX_Vpsrld_xmm_k1z_xmm_xmmm128:2228,"2228":"EVEX_Vpsrld_xmm_k1z_xmm_xmmm128",EVEX_Vpsrld_ymm_k1z_ymm_xmmm128:2229,"2229":"EVEX_Vpsrld_ymm_k1z_ymm_xmmm128",EVEX_Vpsrld_zmm_k1z_zmm_xmmm128:2230,"2230":"EVEX_Vpsrld_zmm_k1z_zmm_xmmm128",Psrlq_mm_mmm64:2231,"2231":"Psrlq_mm_mmm64",Psrlq_xmm_xmmm128:2232,"2232":"Psrlq_xmm_xmmm128",VEX_Vpsrlq_xmm_xmm_xmmm128:2233,"2233":"VEX_Vpsrlq_xmm_xmm_xmmm128",VEX_Vpsrlq_ymm_ymm_xmmm128:2234,"2234":"VEX_Vpsrlq_ymm_ymm_xmmm128",EVEX_Vpsrlq_xmm_k1z_xmm_xmmm128:2235,"2235":"EVEX_Vpsrlq_xmm_k1z_xmm_xmmm128",EVEX_Vpsrlq_ymm_k1z_ymm_xmmm128:2236,"2236":"EVEX_Vpsrlq_ymm_k1z_ymm_xmmm128",EVEX_Vpsrlq_zmm_k1z_zmm_xmmm128:2237,"2237":"EVEX_Vpsrlq_zmm_k1z_zmm_xmmm128",Paddq_mm_mmm64:2238,"2238":"Paddq_mm_mmm64",Paddq_xmm_xmmm128:2239,"2239":"Paddq_xmm_xmmm128",VEX_Vpaddq_xmm_xmm_xmmm128:2240,"2240":"VEX_Vpaddq_xmm_xmm_xmmm128",VEX_Vpaddq_ymm_ymm_ymmm256:2241,"2241":"VEX_Vpaddq_ymm_ymm_ymmm256",EVEX_Vpaddq_xmm_k1z_xmm_xmmm128b64:2242,"2242":"EVEX_Vpaddq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpaddq_ymm_k1z_ymm_ymmm256b64:2243,"2243":"EVEX_Vpaddq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpaddq_zmm_k1z_zmm_zmmm512b64:2244,"2244":"EVEX_Vpaddq_zmm_k1z_zmm_zmmm512b64",Pmullw_mm_mmm64:2245,"2245":"Pmullw_mm_mmm64",Pmullw_xmm_xmmm128:2246,"2246":"Pmullw_xmm_xmmm128",VEX_Vpmullw_xmm_xmm_xmmm128:2247,"2247":"VEX_Vpmullw_xmm_xmm_xmmm128",VEX_Vpmullw_ymm_ymm_ymmm256:2248,"2248":"VEX_Vpmullw_ymm_ymm_ymmm256",EVEX_Vpmullw_xmm_k1z_xmm_xmmm128:2249,"2249":"EVEX_Vpmullw_xmm_k1z_xmm_xmmm128",EVEX_Vpmullw_ymm_k1z_ymm_ymmm256:2250,"2250":"EVEX_Vpmullw_ymm_k1z_ymm_ymmm256",EVEX_Vpmullw_zmm_k1z_zmm_zmmm512:2251,"2251":"EVEX_Vpmullw_zmm_k1z_zmm_zmmm512",Movq_xmmm64_xmm:2252,"2252":"Movq_xmmm64_xmm",VEX_Vmovq_xmmm64_xmm:2253,"2253":"VEX_Vmovq_xmmm64_xmm",EVEX_Vmovq_xmmm64_xmm:2254,"2254":"EVEX_Vmovq_xmmm64_xmm",Movq2dq_xmm_mm:2255,"2255":"Movq2dq_xmm_mm",Movdq2q_mm_xmm:2256,"2256":"Movdq2q_mm_xmm",Pmovmskb_r32_mm:2257,"2257":"Pmovmskb_r32_mm",Pmovmskb_r64_mm:2258,"2258":"Pmovmskb_r64_mm",Pmovmskb_r32_xmm:2259,"2259":"Pmovmskb_r32_xmm",Pmovmskb_r64_xmm:2260,"2260":"Pmovmskb_r64_xmm",VEX_Vpmovmskb_r32_xmm:2261,"2261":"VEX_Vpmovmskb_r32_xmm",VEX_Vpmovmskb_r64_xmm:2262,"2262":"VEX_Vpmovmskb_r64_xmm",VEX_Vpmovmskb_r32_ymm:2263,"2263":"VEX_Vpmovmskb_r32_ymm",VEX_Vpmovmskb_r64_ymm:2264,"2264":"VEX_Vpmovmskb_r64_ymm",Psubusb_mm_mmm64:2265,"2265":"Psubusb_mm_mmm64",Psubusb_xmm_xmmm128:2266,"2266":"Psubusb_xmm_xmmm128",VEX_Vpsubusb_xmm_xmm_xmmm128:2267,"2267":"VEX_Vpsubusb_xmm_xmm_xmmm128",VEX_Vpsubusb_ymm_ymm_ymmm256:2268,"2268":"VEX_Vpsubusb_ymm_ymm_ymmm256",EVEX_Vpsubusb_xmm_k1z_xmm_xmmm128:2269,"2269":"EVEX_Vpsubusb_xmm_k1z_xmm_xmmm128",EVEX_Vpsubusb_ymm_k1z_ymm_ymmm256:2270,"2270":"EVEX_Vpsubusb_ymm_k1z_ymm_ymmm256",EVEX_Vpsubusb_zmm_k1z_zmm_zmmm512:2271,"2271":"EVEX_Vpsubusb_zmm_k1z_zmm_zmmm512",Psubusw_mm_mmm64:2272,"2272":"Psubusw_mm_mmm64",Psubusw_xmm_xmmm128:2273,"2273":"Psubusw_xmm_xmmm128",VEX_Vpsubusw_xmm_xmm_xmmm128:2274,"2274":"VEX_Vpsubusw_xmm_xmm_xmmm128",VEX_Vpsubusw_ymm_ymm_ymmm256:2275,"2275":"VEX_Vpsubusw_ymm_ymm_ymmm256",EVEX_Vpsubusw_xmm_k1z_xmm_xmmm128:2276,"2276":"EVEX_Vpsubusw_xmm_k1z_xmm_xmmm128",EVEX_Vpsubusw_ymm_k1z_ymm_ymmm256:2277,"2277":"EVEX_Vpsubusw_ymm_k1z_ymm_ymmm256",EVEX_Vpsubusw_zmm_k1z_zmm_zmmm512:2278,"2278":"EVEX_Vpsubusw_zmm_k1z_zmm_zmmm512",Pminub_mm_mmm64:2279,"2279":"Pminub_mm_mmm64",Pminub_xmm_xmmm128:2280,"2280":"Pminub_xmm_xmmm128",VEX_Vpminub_xmm_xmm_xmmm128:2281,"2281":"VEX_Vpminub_xmm_xmm_xmmm128",VEX_Vpminub_ymm_ymm_ymmm256:2282,"2282":"VEX_Vpminub_ymm_ymm_ymmm256",EVEX_Vpminub_xmm_k1z_xmm_xmmm128:2283,"2283":"EVEX_Vpminub_xmm_k1z_xmm_xmmm128",EVEX_Vpminub_ymm_k1z_ymm_ymmm256:2284,"2284":"EVEX_Vpminub_ymm_k1z_ymm_ymmm256",EVEX_Vpminub_zmm_k1z_zmm_zmmm512:2285,"2285":"EVEX_Vpminub_zmm_k1z_zmm_zmmm512",Pand_mm_mmm64:2286,"2286":"Pand_mm_mmm64",Pand_xmm_xmmm128:2287,"2287":"Pand_xmm_xmmm128",VEX_Vpand_xmm_xmm_xmmm128:2288,"2288":"VEX_Vpand_xmm_xmm_xmmm128",VEX_Vpand_ymm_ymm_ymmm256:2289,"2289":"VEX_Vpand_ymm_ymm_ymmm256",EVEX_Vpandd_xmm_k1z_xmm_xmmm128b32:2290,"2290":"EVEX_Vpandd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpandd_ymm_k1z_ymm_ymmm256b32:2291,"2291":"EVEX_Vpandd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpandd_zmm_k1z_zmm_zmmm512b32:2292,"2292":"EVEX_Vpandd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpandq_xmm_k1z_xmm_xmmm128b64:2293,"2293":"EVEX_Vpandq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpandq_ymm_k1z_ymm_ymmm256b64:2294,"2294":"EVEX_Vpandq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpandq_zmm_k1z_zmm_zmmm512b64:2295,"2295":"EVEX_Vpandq_zmm_k1z_zmm_zmmm512b64",Paddusb_mm_mmm64:2296,"2296":"Paddusb_mm_mmm64",Paddusb_xmm_xmmm128:2297,"2297":"Paddusb_xmm_xmmm128",VEX_Vpaddusb_xmm_xmm_xmmm128:2298,"2298":"VEX_Vpaddusb_xmm_xmm_xmmm128",VEX_Vpaddusb_ymm_ymm_ymmm256:2299,"2299":"VEX_Vpaddusb_ymm_ymm_ymmm256",EVEX_Vpaddusb_xmm_k1z_xmm_xmmm128:2300,"2300":"EVEX_Vpaddusb_xmm_k1z_xmm_xmmm128",EVEX_Vpaddusb_ymm_k1z_ymm_ymmm256:2301,"2301":"EVEX_Vpaddusb_ymm_k1z_ymm_ymmm256",EVEX_Vpaddusb_zmm_k1z_zmm_zmmm512:2302,"2302":"EVEX_Vpaddusb_zmm_k1z_zmm_zmmm512",Paddusw_mm_mmm64:2303,"2303":"Paddusw_mm_mmm64",Paddusw_xmm_xmmm128:2304,"2304":"Paddusw_xmm_xmmm128",VEX_Vpaddusw_xmm_xmm_xmmm128:2305,"2305":"VEX_Vpaddusw_xmm_xmm_xmmm128",VEX_Vpaddusw_ymm_ymm_ymmm256:2306,"2306":"VEX_Vpaddusw_ymm_ymm_ymmm256",EVEX_Vpaddusw_xmm_k1z_xmm_xmmm128:2307,"2307":"EVEX_Vpaddusw_xmm_k1z_xmm_xmmm128",EVEX_Vpaddusw_ymm_k1z_ymm_ymmm256:2308,"2308":"EVEX_Vpaddusw_ymm_k1z_ymm_ymmm256",EVEX_Vpaddusw_zmm_k1z_zmm_zmmm512:2309,"2309":"EVEX_Vpaddusw_zmm_k1z_zmm_zmmm512",Pmaxub_mm_mmm64:2310,"2310":"Pmaxub_mm_mmm64",Pmaxub_xmm_xmmm128:2311,"2311":"Pmaxub_xmm_xmmm128",VEX_Vpmaxub_xmm_xmm_xmmm128:2312,"2312":"VEX_Vpmaxub_xmm_xmm_xmmm128",VEX_Vpmaxub_ymm_ymm_ymmm256:2313,"2313":"VEX_Vpmaxub_ymm_ymm_ymmm256",EVEX_Vpmaxub_xmm_k1z_xmm_xmmm128:2314,"2314":"EVEX_Vpmaxub_xmm_k1z_xmm_xmmm128",EVEX_Vpmaxub_ymm_k1z_ymm_ymmm256:2315,"2315":"EVEX_Vpmaxub_ymm_k1z_ymm_ymmm256",EVEX_Vpmaxub_zmm_k1z_zmm_zmmm512:2316,"2316":"EVEX_Vpmaxub_zmm_k1z_zmm_zmmm512",Pandn_mm_mmm64:2317,"2317":"Pandn_mm_mmm64",Pandn_xmm_xmmm128:2318,"2318":"Pandn_xmm_xmmm128",VEX_Vpandn_xmm_xmm_xmmm128:2319,"2319":"VEX_Vpandn_xmm_xmm_xmmm128",VEX_Vpandn_ymm_ymm_ymmm256:2320,"2320":"VEX_Vpandn_ymm_ymm_ymmm256",EVEX_Vpandnd_xmm_k1z_xmm_xmmm128b32:2321,"2321":"EVEX_Vpandnd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpandnd_ymm_k1z_ymm_ymmm256b32:2322,"2322":"EVEX_Vpandnd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpandnd_zmm_k1z_zmm_zmmm512b32:2323,"2323":"EVEX_Vpandnd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpandnq_xmm_k1z_xmm_xmmm128b64:2324,"2324":"EVEX_Vpandnq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpandnq_ymm_k1z_ymm_ymmm256b64:2325,"2325":"EVEX_Vpandnq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpandnq_zmm_k1z_zmm_zmmm512b64:2326,"2326":"EVEX_Vpandnq_zmm_k1z_zmm_zmmm512b64",Pavgb_mm_mmm64:2327,"2327":"Pavgb_mm_mmm64",Pavgb_xmm_xmmm128:2328,"2328":"Pavgb_xmm_xmmm128",VEX_Vpavgb_xmm_xmm_xmmm128:2329,"2329":"VEX_Vpavgb_xmm_xmm_xmmm128",VEX_Vpavgb_ymm_ymm_ymmm256:2330,"2330":"VEX_Vpavgb_ymm_ymm_ymmm256",EVEX_Vpavgb_xmm_k1z_xmm_xmmm128:2331,"2331":"EVEX_Vpavgb_xmm_k1z_xmm_xmmm128",EVEX_Vpavgb_ymm_k1z_ymm_ymmm256:2332,"2332":"EVEX_Vpavgb_ymm_k1z_ymm_ymmm256",EVEX_Vpavgb_zmm_k1z_zmm_zmmm512:2333,"2333":"EVEX_Vpavgb_zmm_k1z_zmm_zmmm512",Psraw_mm_mmm64:2334,"2334":"Psraw_mm_mmm64",Psraw_xmm_xmmm128:2335,"2335":"Psraw_xmm_xmmm128",VEX_Vpsraw_xmm_xmm_xmmm128:2336,"2336":"VEX_Vpsraw_xmm_xmm_xmmm128",VEX_Vpsraw_ymm_ymm_xmmm128:2337,"2337":"VEX_Vpsraw_ymm_ymm_xmmm128",EVEX_Vpsraw_xmm_k1z_xmm_xmmm128:2338,"2338":"EVEX_Vpsraw_xmm_k1z_xmm_xmmm128",EVEX_Vpsraw_ymm_k1z_ymm_xmmm128:2339,"2339":"EVEX_Vpsraw_ymm_k1z_ymm_xmmm128",EVEX_Vpsraw_zmm_k1z_zmm_xmmm128:2340,"2340":"EVEX_Vpsraw_zmm_k1z_zmm_xmmm128",Psrad_mm_mmm64:2341,"2341":"Psrad_mm_mmm64",Psrad_xmm_xmmm128:2342,"2342":"Psrad_xmm_xmmm128",VEX_Vpsrad_xmm_xmm_xmmm128:2343,"2343":"VEX_Vpsrad_xmm_xmm_xmmm128",VEX_Vpsrad_ymm_ymm_xmmm128:2344,"2344":"VEX_Vpsrad_ymm_ymm_xmmm128",EVEX_Vpsrad_xmm_k1z_xmm_xmmm128:2345,"2345":"EVEX_Vpsrad_xmm_k1z_xmm_xmmm128",EVEX_Vpsrad_ymm_k1z_ymm_xmmm128:2346,"2346":"EVEX_Vpsrad_ymm_k1z_ymm_xmmm128",EVEX_Vpsrad_zmm_k1z_zmm_xmmm128:2347,"2347":"EVEX_Vpsrad_zmm_k1z_zmm_xmmm128",EVEX_Vpsraq_xmm_k1z_xmm_xmmm128:2348,"2348":"EVEX_Vpsraq_xmm_k1z_xmm_xmmm128",EVEX_Vpsraq_ymm_k1z_ymm_xmmm128:2349,"2349":"EVEX_Vpsraq_ymm_k1z_ymm_xmmm128",EVEX_Vpsraq_zmm_k1z_zmm_xmmm128:2350,"2350":"EVEX_Vpsraq_zmm_k1z_zmm_xmmm128",Pavgw_mm_mmm64:2351,"2351":"Pavgw_mm_mmm64",Pavgw_xmm_xmmm128:2352,"2352":"Pavgw_xmm_xmmm128",VEX_Vpavgw_xmm_xmm_xmmm128:2353,"2353":"VEX_Vpavgw_xmm_xmm_xmmm128",VEX_Vpavgw_ymm_ymm_ymmm256:2354,"2354":"VEX_Vpavgw_ymm_ymm_ymmm256",EVEX_Vpavgw_xmm_k1z_xmm_xmmm128:2355,"2355":"EVEX_Vpavgw_xmm_k1z_xmm_xmmm128",EVEX_Vpavgw_ymm_k1z_ymm_ymmm256:2356,"2356":"EVEX_Vpavgw_ymm_k1z_ymm_ymmm256",EVEX_Vpavgw_zmm_k1z_zmm_zmmm512:2357,"2357":"EVEX_Vpavgw_zmm_k1z_zmm_zmmm512",Pmulhuw_mm_mmm64:2358,"2358":"Pmulhuw_mm_mmm64",Pmulhuw_xmm_xmmm128:2359,"2359":"Pmulhuw_xmm_xmmm128",VEX_Vpmulhuw_xmm_xmm_xmmm128:2360,"2360":"VEX_Vpmulhuw_xmm_xmm_xmmm128",VEX_Vpmulhuw_ymm_ymm_ymmm256:2361,"2361":"VEX_Vpmulhuw_ymm_ymm_ymmm256",EVEX_Vpmulhuw_xmm_k1z_xmm_xmmm128:2362,"2362":"EVEX_Vpmulhuw_xmm_k1z_xmm_xmmm128",EVEX_Vpmulhuw_ymm_k1z_ymm_ymmm256:2363,"2363":"EVEX_Vpmulhuw_ymm_k1z_ymm_ymmm256",EVEX_Vpmulhuw_zmm_k1z_zmm_zmmm512:2364,"2364":"EVEX_Vpmulhuw_zmm_k1z_zmm_zmmm512",Pmulhw_mm_mmm64:2365,"2365":"Pmulhw_mm_mmm64",Pmulhw_xmm_xmmm128:2366,"2366":"Pmulhw_xmm_xmmm128",VEX_Vpmulhw_xmm_xmm_xmmm128:2367,"2367":"VEX_Vpmulhw_xmm_xmm_xmmm128",VEX_Vpmulhw_ymm_ymm_ymmm256:2368,"2368":"VEX_Vpmulhw_ymm_ymm_ymmm256",EVEX_Vpmulhw_xmm_k1z_xmm_xmmm128:2369,"2369":"EVEX_Vpmulhw_xmm_k1z_xmm_xmmm128",EVEX_Vpmulhw_ymm_k1z_ymm_ymmm256:2370,"2370":"EVEX_Vpmulhw_ymm_k1z_ymm_ymmm256",EVEX_Vpmulhw_zmm_k1z_zmm_zmmm512:2371,"2371":"EVEX_Vpmulhw_zmm_k1z_zmm_zmmm512",Cvttpd2dq_xmm_xmmm128:2372,"2372":"Cvttpd2dq_xmm_xmmm128",VEX_Vcvttpd2dq_xmm_xmmm128:2373,"2373":"VEX_Vcvttpd2dq_xmm_xmmm128",VEX_Vcvttpd2dq_xmm_ymmm256:2374,"2374":"VEX_Vcvttpd2dq_xmm_ymmm256",EVEX_Vcvttpd2dq_xmm_k1z_xmmm128b64:2375,"2375":"EVEX_Vcvttpd2dq_xmm_k1z_xmmm128b64",EVEX_Vcvttpd2dq_xmm_k1z_ymmm256b64:2376,"2376":"EVEX_Vcvttpd2dq_xmm_k1z_ymmm256b64",EVEX_Vcvttpd2dq_ymm_k1z_zmmm512b64_sae:2377,"2377":"EVEX_Vcvttpd2dq_ymm_k1z_zmmm512b64_sae",Cvtdq2pd_xmm_xmmm64:2378,"2378":"Cvtdq2pd_xmm_xmmm64",VEX_Vcvtdq2pd_xmm_xmmm64:2379,"2379":"VEX_Vcvtdq2pd_xmm_xmmm64",VEX_Vcvtdq2pd_ymm_xmmm128:2380,"2380":"VEX_Vcvtdq2pd_ymm_xmmm128",EVEX_Vcvtdq2pd_xmm_k1z_xmmm64b32:2381,"2381":"EVEX_Vcvtdq2pd_xmm_k1z_xmmm64b32",EVEX_Vcvtdq2pd_ymm_k1z_xmmm128b32:2382,"2382":"EVEX_Vcvtdq2pd_ymm_k1z_xmmm128b32",EVEX_Vcvtdq2pd_zmm_k1z_ymmm256b32_er:2383,"2383":"EVEX_Vcvtdq2pd_zmm_k1z_ymmm256b32_er",EVEX_Vcvtqq2pd_xmm_k1z_xmmm128b64:2384,"2384":"EVEX_Vcvtqq2pd_xmm_k1z_xmmm128b64",EVEX_Vcvtqq2pd_ymm_k1z_ymmm256b64:2385,"2385":"EVEX_Vcvtqq2pd_ymm_k1z_ymmm256b64",EVEX_Vcvtqq2pd_zmm_k1z_zmmm512b64_er:2386,"2386":"EVEX_Vcvtqq2pd_zmm_k1z_zmmm512b64_er",Cvtpd2dq_xmm_xmmm128:2387,"2387":"Cvtpd2dq_xmm_xmmm128",VEX_Vcvtpd2dq_xmm_xmmm128:2388,"2388":"VEX_Vcvtpd2dq_xmm_xmmm128",VEX_Vcvtpd2dq_xmm_ymmm256:2389,"2389":"VEX_Vcvtpd2dq_xmm_ymmm256",EVEX_Vcvtpd2dq_xmm_k1z_xmmm128b64:2390,"2390":"EVEX_Vcvtpd2dq_xmm_k1z_xmmm128b64",EVEX_Vcvtpd2dq_xmm_k1z_ymmm256b64:2391,"2391":"EVEX_Vcvtpd2dq_xmm_k1z_ymmm256b64",EVEX_Vcvtpd2dq_ymm_k1z_zmmm512b64_er:2392,"2392":"EVEX_Vcvtpd2dq_ymm_k1z_zmmm512b64_er",Movntq_m64_mm:2393,"2393":"Movntq_m64_mm",Movntdq_m128_xmm:2394,"2394":"Movntdq_m128_xmm",VEX_Vmovntdq_m128_xmm:2395,"2395":"VEX_Vmovntdq_m128_xmm",VEX_Vmovntdq_m256_ymm:2396,"2396":"VEX_Vmovntdq_m256_ymm",EVEX_Vmovntdq_m128_xmm:2397,"2397":"EVEX_Vmovntdq_m128_xmm",EVEX_Vmovntdq_m256_ymm:2398,"2398":"EVEX_Vmovntdq_m256_ymm",EVEX_Vmovntdq_m512_zmm:2399,"2399":"EVEX_Vmovntdq_m512_zmm",Psubsb_mm_mmm64:2400,"2400":"Psubsb_mm_mmm64",Psubsb_xmm_xmmm128:2401,"2401":"Psubsb_xmm_xmmm128",VEX_Vpsubsb_xmm_xmm_xmmm128:2402,"2402":"VEX_Vpsubsb_xmm_xmm_xmmm128",VEX_Vpsubsb_ymm_ymm_ymmm256:2403,"2403":"VEX_Vpsubsb_ymm_ymm_ymmm256",EVEX_Vpsubsb_xmm_k1z_xmm_xmmm128:2404,"2404":"EVEX_Vpsubsb_xmm_k1z_xmm_xmmm128",EVEX_Vpsubsb_ymm_k1z_ymm_ymmm256:2405,"2405":"EVEX_Vpsubsb_ymm_k1z_ymm_ymmm256",EVEX_Vpsubsb_zmm_k1z_zmm_zmmm512:2406,"2406":"EVEX_Vpsubsb_zmm_k1z_zmm_zmmm512",Psubsw_mm_mmm64:2407,"2407":"Psubsw_mm_mmm64",Psubsw_xmm_xmmm128:2408,"2408":"Psubsw_xmm_xmmm128",VEX_Vpsubsw_xmm_xmm_xmmm128:2409,"2409":"VEX_Vpsubsw_xmm_xmm_xmmm128",VEX_Vpsubsw_ymm_ymm_ymmm256:2410,"2410":"VEX_Vpsubsw_ymm_ymm_ymmm256",EVEX_Vpsubsw_xmm_k1z_xmm_xmmm128:2411,"2411":"EVEX_Vpsubsw_xmm_k1z_xmm_xmmm128",EVEX_Vpsubsw_ymm_k1z_ymm_ymmm256:2412,"2412":"EVEX_Vpsubsw_ymm_k1z_ymm_ymmm256",EVEX_Vpsubsw_zmm_k1z_zmm_zmmm512:2413,"2413":"EVEX_Vpsubsw_zmm_k1z_zmm_zmmm512",Pminsw_mm_mmm64:2414,"2414":"Pminsw_mm_mmm64",Pminsw_xmm_xmmm128:2415,"2415":"Pminsw_xmm_xmmm128",VEX_Vpminsw_xmm_xmm_xmmm128:2416,"2416":"VEX_Vpminsw_xmm_xmm_xmmm128",VEX_Vpminsw_ymm_ymm_ymmm256:2417,"2417":"VEX_Vpminsw_ymm_ymm_ymmm256",EVEX_Vpminsw_xmm_k1z_xmm_xmmm128:2418,"2418":"EVEX_Vpminsw_xmm_k1z_xmm_xmmm128",EVEX_Vpminsw_ymm_k1z_ymm_ymmm256:2419,"2419":"EVEX_Vpminsw_ymm_k1z_ymm_ymmm256",EVEX_Vpminsw_zmm_k1z_zmm_zmmm512:2420,"2420":"EVEX_Vpminsw_zmm_k1z_zmm_zmmm512",Por_mm_mmm64:2421,"2421":"Por_mm_mmm64",Por_xmm_xmmm128:2422,"2422":"Por_xmm_xmmm128",VEX_Vpor_xmm_xmm_xmmm128:2423,"2423":"VEX_Vpor_xmm_xmm_xmmm128",VEX_Vpor_ymm_ymm_ymmm256:2424,"2424":"VEX_Vpor_ymm_ymm_ymmm256",EVEX_Vpord_xmm_k1z_xmm_xmmm128b32:2425,"2425":"EVEX_Vpord_xmm_k1z_xmm_xmmm128b32",EVEX_Vpord_ymm_k1z_ymm_ymmm256b32:2426,"2426":"EVEX_Vpord_ymm_k1z_ymm_ymmm256b32",EVEX_Vpord_zmm_k1z_zmm_zmmm512b32:2427,"2427":"EVEX_Vpord_zmm_k1z_zmm_zmmm512b32",EVEX_Vporq_xmm_k1z_xmm_xmmm128b64:2428,"2428":"EVEX_Vporq_xmm_k1z_xmm_xmmm128b64",EVEX_Vporq_ymm_k1z_ymm_ymmm256b64:2429,"2429":"EVEX_Vporq_ymm_k1z_ymm_ymmm256b64",EVEX_Vporq_zmm_k1z_zmm_zmmm512b64:2430,"2430":"EVEX_Vporq_zmm_k1z_zmm_zmmm512b64",Paddsb_mm_mmm64:2431,"2431":"Paddsb_mm_mmm64",Paddsb_xmm_xmmm128:2432,"2432":"Paddsb_xmm_xmmm128",VEX_Vpaddsb_xmm_xmm_xmmm128:2433,"2433":"VEX_Vpaddsb_xmm_xmm_xmmm128",VEX_Vpaddsb_ymm_ymm_ymmm256:2434,"2434":"VEX_Vpaddsb_ymm_ymm_ymmm256",EVEX_Vpaddsb_xmm_k1z_xmm_xmmm128:2435,"2435":"EVEX_Vpaddsb_xmm_k1z_xmm_xmmm128",EVEX_Vpaddsb_ymm_k1z_ymm_ymmm256:2436,"2436":"EVEX_Vpaddsb_ymm_k1z_ymm_ymmm256",EVEX_Vpaddsb_zmm_k1z_zmm_zmmm512:2437,"2437":"EVEX_Vpaddsb_zmm_k1z_zmm_zmmm512",Paddsw_mm_mmm64:2438,"2438":"Paddsw_mm_mmm64",Paddsw_xmm_xmmm128:2439,"2439":"Paddsw_xmm_xmmm128",VEX_Vpaddsw_xmm_xmm_xmmm128:2440,"2440":"VEX_Vpaddsw_xmm_xmm_xmmm128",VEX_Vpaddsw_ymm_ymm_ymmm256:2441,"2441":"VEX_Vpaddsw_ymm_ymm_ymmm256",EVEX_Vpaddsw_xmm_k1z_xmm_xmmm128:2442,"2442":"EVEX_Vpaddsw_xmm_k1z_xmm_xmmm128",EVEX_Vpaddsw_ymm_k1z_ymm_ymmm256:2443,"2443":"EVEX_Vpaddsw_ymm_k1z_ymm_ymmm256",EVEX_Vpaddsw_zmm_k1z_zmm_zmmm512:2444,"2444":"EVEX_Vpaddsw_zmm_k1z_zmm_zmmm512",Pmaxsw_mm_mmm64:2445,"2445":"Pmaxsw_mm_mmm64",Pmaxsw_xmm_xmmm128:2446,"2446":"Pmaxsw_xmm_xmmm128",VEX_Vpmaxsw_xmm_xmm_xmmm128:2447,"2447":"VEX_Vpmaxsw_xmm_xmm_xmmm128",VEX_Vpmaxsw_ymm_ymm_ymmm256:2448,"2448":"VEX_Vpmaxsw_ymm_ymm_ymmm256",EVEX_Vpmaxsw_xmm_k1z_xmm_xmmm128:2449,"2449":"EVEX_Vpmaxsw_xmm_k1z_xmm_xmmm128",EVEX_Vpmaxsw_ymm_k1z_ymm_ymmm256:2450,"2450":"EVEX_Vpmaxsw_ymm_k1z_ymm_ymmm256",EVEX_Vpmaxsw_zmm_k1z_zmm_zmmm512:2451,"2451":"EVEX_Vpmaxsw_zmm_k1z_zmm_zmmm512",Pxor_mm_mmm64:2452,"2452":"Pxor_mm_mmm64",Pxor_xmm_xmmm128:2453,"2453":"Pxor_xmm_xmmm128",VEX_Vpxor_xmm_xmm_xmmm128:2454,"2454":"VEX_Vpxor_xmm_xmm_xmmm128",VEX_Vpxor_ymm_ymm_ymmm256:2455,"2455":"VEX_Vpxor_ymm_ymm_ymmm256",EVEX_Vpxord_xmm_k1z_xmm_xmmm128b32:2456,"2456":"EVEX_Vpxord_xmm_k1z_xmm_xmmm128b32",EVEX_Vpxord_ymm_k1z_ymm_ymmm256b32:2457,"2457":"EVEX_Vpxord_ymm_k1z_ymm_ymmm256b32",EVEX_Vpxord_zmm_k1z_zmm_zmmm512b32:2458,"2458":"EVEX_Vpxord_zmm_k1z_zmm_zmmm512b32",EVEX_Vpxorq_xmm_k1z_xmm_xmmm128b64:2459,"2459":"EVEX_Vpxorq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpxorq_ymm_k1z_ymm_ymmm256b64:2460,"2460":"EVEX_Vpxorq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpxorq_zmm_k1z_zmm_zmmm512b64:2461,"2461":"EVEX_Vpxorq_zmm_k1z_zmm_zmmm512b64",Lddqu_xmm_m128:2462,"2462":"Lddqu_xmm_m128",VEX_Vlddqu_xmm_m128:2463,"2463":"VEX_Vlddqu_xmm_m128",VEX_Vlddqu_ymm_m256:2464,"2464":"VEX_Vlddqu_ymm_m256",Psllw_mm_mmm64:2465,"2465":"Psllw_mm_mmm64",Psllw_xmm_xmmm128:2466,"2466":"Psllw_xmm_xmmm128",VEX_Vpsllw_xmm_xmm_xmmm128:2467,"2467":"VEX_Vpsllw_xmm_xmm_xmmm128",VEX_Vpsllw_ymm_ymm_xmmm128:2468,"2468":"VEX_Vpsllw_ymm_ymm_xmmm128",EVEX_Vpsllw_xmm_k1z_xmm_xmmm128:2469,"2469":"EVEX_Vpsllw_xmm_k1z_xmm_xmmm128",EVEX_Vpsllw_ymm_k1z_ymm_xmmm128:2470,"2470":"EVEX_Vpsllw_ymm_k1z_ymm_xmmm128",EVEX_Vpsllw_zmm_k1z_zmm_xmmm128:2471,"2471":"EVEX_Vpsllw_zmm_k1z_zmm_xmmm128",Pslld_mm_mmm64:2472,"2472":"Pslld_mm_mmm64",Pslld_xmm_xmmm128:2473,"2473":"Pslld_xmm_xmmm128",VEX_Vpslld_xmm_xmm_xmmm128:2474,"2474":"VEX_Vpslld_xmm_xmm_xmmm128",VEX_Vpslld_ymm_ymm_xmmm128:2475,"2475":"VEX_Vpslld_ymm_ymm_xmmm128",EVEX_Vpslld_xmm_k1z_xmm_xmmm128:2476,"2476":"EVEX_Vpslld_xmm_k1z_xmm_xmmm128",EVEX_Vpslld_ymm_k1z_ymm_xmmm128:2477,"2477":"EVEX_Vpslld_ymm_k1z_ymm_xmmm128",EVEX_Vpslld_zmm_k1z_zmm_xmmm128:2478,"2478":"EVEX_Vpslld_zmm_k1z_zmm_xmmm128",Psllq_mm_mmm64:2479,"2479":"Psllq_mm_mmm64",Psllq_xmm_xmmm128:2480,"2480":"Psllq_xmm_xmmm128",VEX_Vpsllq_xmm_xmm_xmmm128:2481,"2481":"VEX_Vpsllq_xmm_xmm_xmmm128",VEX_Vpsllq_ymm_ymm_xmmm128:2482,"2482":"VEX_Vpsllq_ymm_ymm_xmmm128",EVEX_Vpsllq_xmm_k1z_xmm_xmmm128:2483,"2483":"EVEX_Vpsllq_xmm_k1z_xmm_xmmm128",EVEX_Vpsllq_ymm_k1z_ymm_xmmm128:2484,"2484":"EVEX_Vpsllq_ymm_k1z_ymm_xmmm128",EVEX_Vpsllq_zmm_k1z_zmm_xmmm128:2485,"2485":"EVEX_Vpsllq_zmm_k1z_zmm_xmmm128",Pmuludq_mm_mmm64:2486,"2486":"Pmuludq_mm_mmm64",Pmuludq_xmm_xmmm128:2487,"2487":"Pmuludq_xmm_xmmm128",VEX_Vpmuludq_xmm_xmm_xmmm128:2488,"2488":"VEX_Vpmuludq_xmm_xmm_xmmm128",VEX_Vpmuludq_ymm_ymm_ymmm256:2489,"2489":"VEX_Vpmuludq_ymm_ymm_ymmm256",EVEX_Vpmuludq_xmm_k1z_xmm_xmmm128b64:2490,"2490":"EVEX_Vpmuludq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmuludq_ymm_k1z_ymm_ymmm256b64:2491,"2491":"EVEX_Vpmuludq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmuludq_zmm_k1z_zmm_zmmm512b64:2492,"2492":"EVEX_Vpmuludq_zmm_k1z_zmm_zmmm512b64",Pmaddwd_mm_mmm64:2493,"2493":"Pmaddwd_mm_mmm64",Pmaddwd_xmm_xmmm128:2494,"2494":"Pmaddwd_xmm_xmmm128",VEX_Vpmaddwd_xmm_xmm_xmmm128:2495,"2495":"VEX_Vpmaddwd_xmm_xmm_xmmm128",VEX_Vpmaddwd_ymm_ymm_ymmm256:2496,"2496":"VEX_Vpmaddwd_ymm_ymm_ymmm256",EVEX_Vpmaddwd_xmm_k1z_xmm_xmmm128:2497,"2497":"EVEX_Vpmaddwd_xmm_k1z_xmm_xmmm128",EVEX_Vpmaddwd_ymm_k1z_ymm_ymmm256:2498,"2498":"EVEX_Vpmaddwd_ymm_k1z_ymm_ymmm256",EVEX_Vpmaddwd_zmm_k1z_zmm_zmmm512:2499,"2499":"EVEX_Vpmaddwd_zmm_k1z_zmm_zmmm512",Psadbw_mm_mmm64:2500,"2500":"Psadbw_mm_mmm64",Psadbw_xmm_xmmm128:2501,"2501":"Psadbw_xmm_xmmm128",VEX_Vpsadbw_xmm_xmm_xmmm128:2502,"2502":"VEX_Vpsadbw_xmm_xmm_xmmm128",VEX_Vpsadbw_ymm_ymm_ymmm256:2503,"2503":"VEX_Vpsadbw_ymm_ymm_ymmm256",EVEX_Vpsadbw_xmm_xmm_xmmm128:2504,"2504":"EVEX_Vpsadbw_xmm_xmm_xmmm128",EVEX_Vpsadbw_ymm_ymm_ymmm256:2505,"2505":"EVEX_Vpsadbw_ymm_ymm_ymmm256",EVEX_Vpsadbw_zmm_zmm_zmmm512:2506,"2506":"EVEX_Vpsadbw_zmm_zmm_zmmm512",Maskmovq_rDI_mm_mm:2507,"2507":"Maskmovq_rDI_mm_mm",Maskmovdqu_rDI_xmm_xmm:2508,"2508":"Maskmovdqu_rDI_xmm_xmm",VEX_Vmaskmovdqu_rDI_xmm_xmm:2509,"2509":"VEX_Vmaskmovdqu_rDI_xmm_xmm",Psubb_mm_mmm64:2510,"2510":"Psubb_mm_mmm64",Psubb_xmm_xmmm128:2511,"2511":"Psubb_xmm_xmmm128",VEX_Vpsubb_xmm_xmm_xmmm128:2512,"2512":"VEX_Vpsubb_xmm_xmm_xmmm128",VEX_Vpsubb_ymm_ymm_ymmm256:2513,"2513":"VEX_Vpsubb_ymm_ymm_ymmm256",EVEX_Vpsubb_xmm_k1z_xmm_xmmm128:2514,"2514":"EVEX_Vpsubb_xmm_k1z_xmm_xmmm128",EVEX_Vpsubb_ymm_k1z_ymm_ymmm256:2515,"2515":"EVEX_Vpsubb_ymm_k1z_ymm_ymmm256",EVEX_Vpsubb_zmm_k1z_zmm_zmmm512:2516,"2516":"EVEX_Vpsubb_zmm_k1z_zmm_zmmm512",Psubw_mm_mmm64:2517,"2517":"Psubw_mm_mmm64",Psubw_xmm_xmmm128:2518,"2518":"Psubw_xmm_xmmm128",VEX_Vpsubw_xmm_xmm_xmmm128:2519,"2519":"VEX_Vpsubw_xmm_xmm_xmmm128",VEX_Vpsubw_ymm_ymm_ymmm256:2520,"2520":"VEX_Vpsubw_ymm_ymm_ymmm256",EVEX_Vpsubw_xmm_k1z_xmm_xmmm128:2521,"2521":"EVEX_Vpsubw_xmm_k1z_xmm_xmmm128",EVEX_Vpsubw_ymm_k1z_ymm_ymmm256:2522,"2522":"EVEX_Vpsubw_ymm_k1z_ymm_ymmm256",EVEX_Vpsubw_zmm_k1z_zmm_zmmm512:2523,"2523":"EVEX_Vpsubw_zmm_k1z_zmm_zmmm512",Psubd_mm_mmm64:2524,"2524":"Psubd_mm_mmm64",Psubd_xmm_xmmm128:2525,"2525":"Psubd_xmm_xmmm128",VEX_Vpsubd_xmm_xmm_xmmm128:2526,"2526":"VEX_Vpsubd_xmm_xmm_xmmm128",VEX_Vpsubd_ymm_ymm_ymmm256:2527,"2527":"VEX_Vpsubd_ymm_ymm_ymmm256",EVEX_Vpsubd_xmm_k1z_xmm_xmmm128b32:2528,"2528":"EVEX_Vpsubd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpsubd_ymm_k1z_ymm_ymmm256b32:2529,"2529":"EVEX_Vpsubd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpsubd_zmm_k1z_zmm_zmmm512b32:2530,"2530":"EVEX_Vpsubd_zmm_k1z_zmm_zmmm512b32",Psubq_mm_mmm64:2531,"2531":"Psubq_mm_mmm64",Psubq_xmm_xmmm128:2532,"2532":"Psubq_xmm_xmmm128",VEX_Vpsubq_xmm_xmm_xmmm128:2533,"2533":"VEX_Vpsubq_xmm_xmm_xmmm128",VEX_Vpsubq_ymm_ymm_ymmm256:2534,"2534":"VEX_Vpsubq_ymm_ymm_ymmm256",EVEX_Vpsubq_xmm_k1z_xmm_xmmm128b64:2535,"2535":"EVEX_Vpsubq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpsubq_ymm_k1z_ymm_ymmm256b64:2536,"2536":"EVEX_Vpsubq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpsubq_zmm_k1z_zmm_zmmm512b64:2537,"2537":"EVEX_Vpsubq_zmm_k1z_zmm_zmmm512b64",Paddb_mm_mmm64:2538,"2538":"Paddb_mm_mmm64",Paddb_xmm_xmmm128:2539,"2539":"Paddb_xmm_xmmm128",VEX_Vpaddb_xmm_xmm_xmmm128:2540,"2540":"VEX_Vpaddb_xmm_xmm_xmmm128",VEX_Vpaddb_ymm_ymm_ymmm256:2541,"2541":"VEX_Vpaddb_ymm_ymm_ymmm256",EVEX_Vpaddb_xmm_k1z_xmm_xmmm128:2542,"2542":"EVEX_Vpaddb_xmm_k1z_xmm_xmmm128",EVEX_Vpaddb_ymm_k1z_ymm_ymmm256:2543,"2543":"EVEX_Vpaddb_ymm_k1z_ymm_ymmm256",EVEX_Vpaddb_zmm_k1z_zmm_zmmm512:2544,"2544":"EVEX_Vpaddb_zmm_k1z_zmm_zmmm512",Paddw_mm_mmm64:2545,"2545":"Paddw_mm_mmm64",Paddw_xmm_xmmm128:2546,"2546":"Paddw_xmm_xmmm128",VEX_Vpaddw_xmm_xmm_xmmm128:2547,"2547":"VEX_Vpaddw_xmm_xmm_xmmm128",VEX_Vpaddw_ymm_ymm_ymmm256:2548,"2548":"VEX_Vpaddw_ymm_ymm_ymmm256",EVEX_Vpaddw_xmm_k1z_xmm_xmmm128:2549,"2549":"EVEX_Vpaddw_xmm_k1z_xmm_xmmm128",EVEX_Vpaddw_ymm_k1z_ymm_ymmm256:2550,"2550":"EVEX_Vpaddw_ymm_k1z_ymm_ymmm256",EVEX_Vpaddw_zmm_k1z_zmm_zmmm512:2551,"2551":"EVEX_Vpaddw_zmm_k1z_zmm_zmmm512",Paddd_mm_mmm64:2552,"2552":"Paddd_mm_mmm64",Paddd_xmm_xmmm128:2553,"2553":"Paddd_xmm_xmmm128",VEX_Vpaddd_xmm_xmm_xmmm128:2554,"2554":"VEX_Vpaddd_xmm_xmm_xmmm128",VEX_Vpaddd_ymm_ymm_ymmm256:2555,"2555":"VEX_Vpaddd_ymm_ymm_ymmm256",EVEX_Vpaddd_xmm_k1z_xmm_xmmm128b32:2556,"2556":"EVEX_Vpaddd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpaddd_ymm_k1z_ymm_ymmm256b32:2557,"2557":"EVEX_Vpaddd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpaddd_zmm_k1z_zmm_zmmm512b32:2558,"2558":"EVEX_Vpaddd_zmm_k1z_zmm_zmmm512b32",Ud0_r16_rm16:2559,"2559":"Ud0_r16_rm16",Ud0_r32_rm32:2560,"2560":"Ud0_r32_rm32",Ud0_r64_rm64:2561,"2561":"Ud0_r64_rm64",Pshufb_mm_mmm64:2562,"2562":"Pshufb_mm_mmm64",Pshufb_xmm_xmmm128:2563,"2563":"Pshufb_xmm_xmmm128",VEX_Vpshufb_xmm_xmm_xmmm128:2564,"2564":"VEX_Vpshufb_xmm_xmm_xmmm128",VEX_Vpshufb_ymm_ymm_ymmm256:2565,"2565":"VEX_Vpshufb_ymm_ymm_ymmm256",EVEX_Vpshufb_xmm_k1z_xmm_xmmm128:2566,"2566":"EVEX_Vpshufb_xmm_k1z_xmm_xmmm128",EVEX_Vpshufb_ymm_k1z_ymm_ymmm256:2567,"2567":"EVEX_Vpshufb_ymm_k1z_ymm_ymmm256",EVEX_Vpshufb_zmm_k1z_zmm_zmmm512:2568,"2568":"EVEX_Vpshufb_zmm_k1z_zmm_zmmm512",Phaddw_mm_mmm64:2569,"2569":"Phaddw_mm_mmm64",Phaddw_xmm_xmmm128:2570,"2570":"Phaddw_xmm_xmmm128",VEX_Vphaddw_xmm_xmm_xmmm128:2571,"2571":"VEX_Vphaddw_xmm_xmm_xmmm128",VEX_Vphaddw_ymm_ymm_ymmm256:2572,"2572":"VEX_Vphaddw_ymm_ymm_ymmm256",Phaddd_mm_mmm64:2573,"2573":"Phaddd_mm_mmm64",Phaddd_xmm_xmmm128:2574,"2574":"Phaddd_xmm_xmmm128",VEX_Vphaddd_xmm_xmm_xmmm128:2575,"2575":"VEX_Vphaddd_xmm_xmm_xmmm128",VEX_Vphaddd_ymm_ymm_ymmm256:2576,"2576":"VEX_Vphaddd_ymm_ymm_ymmm256",Phaddsw_mm_mmm64:2577,"2577":"Phaddsw_mm_mmm64",Phaddsw_xmm_xmmm128:2578,"2578":"Phaddsw_xmm_xmmm128",VEX_Vphaddsw_xmm_xmm_xmmm128:2579,"2579":"VEX_Vphaddsw_xmm_xmm_xmmm128",VEX_Vphaddsw_ymm_ymm_ymmm256:2580,"2580":"VEX_Vphaddsw_ymm_ymm_ymmm256",Pmaddubsw_mm_mmm64:2581,"2581":"Pmaddubsw_mm_mmm64",Pmaddubsw_xmm_xmmm128:2582,"2582":"Pmaddubsw_xmm_xmmm128",VEX_Vpmaddubsw_xmm_xmm_xmmm128:2583,"2583":"VEX_Vpmaddubsw_xmm_xmm_xmmm128",VEX_Vpmaddubsw_ymm_ymm_ymmm256:2584,"2584":"VEX_Vpmaddubsw_ymm_ymm_ymmm256",EVEX_Vpmaddubsw_xmm_k1z_xmm_xmmm128:2585,"2585":"EVEX_Vpmaddubsw_xmm_k1z_xmm_xmmm128",EVEX_Vpmaddubsw_ymm_k1z_ymm_ymmm256:2586,"2586":"EVEX_Vpmaddubsw_ymm_k1z_ymm_ymmm256",EVEX_Vpmaddubsw_zmm_k1z_zmm_zmmm512:2587,"2587":"EVEX_Vpmaddubsw_zmm_k1z_zmm_zmmm512",Phsubw_mm_mmm64:2588,"2588":"Phsubw_mm_mmm64",Phsubw_xmm_xmmm128:2589,"2589":"Phsubw_xmm_xmmm128",VEX_Vphsubw_xmm_xmm_xmmm128:2590,"2590":"VEX_Vphsubw_xmm_xmm_xmmm128",VEX_Vphsubw_ymm_ymm_ymmm256:2591,"2591":"VEX_Vphsubw_ymm_ymm_ymmm256",Phsubd_mm_mmm64:2592,"2592":"Phsubd_mm_mmm64",Phsubd_xmm_xmmm128:2593,"2593":"Phsubd_xmm_xmmm128",VEX_Vphsubd_xmm_xmm_xmmm128:2594,"2594":"VEX_Vphsubd_xmm_xmm_xmmm128",VEX_Vphsubd_ymm_ymm_ymmm256:2595,"2595":"VEX_Vphsubd_ymm_ymm_ymmm256",Phsubsw_mm_mmm64:2596,"2596":"Phsubsw_mm_mmm64",Phsubsw_xmm_xmmm128:2597,"2597":"Phsubsw_xmm_xmmm128",VEX_Vphsubsw_xmm_xmm_xmmm128:2598,"2598":"VEX_Vphsubsw_xmm_xmm_xmmm128",VEX_Vphsubsw_ymm_ymm_ymmm256:2599,"2599":"VEX_Vphsubsw_ymm_ymm_ymmm256",Psignb_mm_mmm64:2600,"2600":"Psignb_mm_mmm64",Psignb_xmm_xmmm128:2601,"2601":"Psignb_xmm_xmmm128",VEX_Vpsignb_xmm_xmm_xmmm128:2602,"2602":"VEX_Vpsignb_xmm_xmm_xmmm128",VEX_Vpsignb_ymm_ymm_ymmm256:2603,"2603":"VEX_Vpsignb_ymm_ymm_ymmm256",Psignw_mm_mmm64:2604,"2604":"Psignw_mm_mmm64",Psignw_xmm_xmmm128:2605,"2605":"Psignw_xmm_xmmm128",VEX_Vpsignw_xmm_xmm_xmmm128:2606,"2606":"VEX_Vpsignw_xmm_xmm_xmmm128",VEX_Vpsignw_ymm_ymm_ymmm256:2607,"2607":"VEX_Vpsignw_ymm_ymm_ymmm256",Psignd_mm_mmm64:2608,"2608":"Psignd_mm_mmm64",Psignd_xmm_xmmm128:2609,"2609":"Psignd_xmm_xmmm128",VEX_Vpsignd_xmm_xmm_xmmm128:2610,"2610":"VEX_Vpsignd_xmm_xmm_xmmm128",VEX_Vpsignd_ymm_ymm_ymmm256:2611,"2611":"VEX_Vpsignd_ymm_ymm_ymmm256",Pmulhrsw_mm_mmm64:2612,"2612":"Pmulhrsw_mm_mmm64",Pmulhrsw_xmm_xmmm128:2613,"2613":"Pmulhrsw_xmm_xmmm128",VEX_Vpmulhrsw_xmm_xmm_xmmm128:2614,"2614":"VEX_Vpmulhrsw_xmm_xmm_xmmm128",VEX_Vpmulhrsw_ymm_ymm_ymmm256:2615,"2615":"VEX_Vpmulhrsw_ymm_ymm_ymmm256",EVEX_Vpmulhrsw_xmm_k1z_xmm_xmmm128:2616,"2616":"EVEX_Vpmulhrsw_xmm_k1z_xmm_xmmm128",EVEX_Vpmulhrsw_ymm_k1z_ymm_ymmm256:2617,"2617":"EVEX_Vpmulhrsw_ymm_k1z_ymm_ymmm256",EVEX_Vpmulhrsw_zmm_k1z_zmm_zmmm512:2618,"2618":"EVEX_Vpmulhrsw_zmm_k1z_zmm_zmmm512",VEX_Vpermilps_xmm_xmm_xmmm128:2619,"2619":"VEX_Vpermilps_xmm_xmm_xmmm128",VEX_Vpermilps_ymm_ymm_ymmm256:2620,"2620":"VEX_Vpermilps_ymm_ymm_ymmm256",EVEX_Vpermilps_xmm_k1z_xmm_xmmm128b32:2621,"2621":"EVEX_Vpermilps_xmm_k1z_xmm_xmmm128b32",EVEX_Vpermilps_ymm_k1z_ymm_ymmm256b32:2622,"2622":"EVEX_Vpermilps_ymm_k1z_ymm_ymmm256b32",EVEX_Vpermilps_zmm_k1z_zmm_zmmm512b32:2623,"2623":"EVEX_Vpermilps_zmm_k1z_zmm_zmmm512b32",VEX_Vpermilpd_xmm_xmm_xmmm128:2624,"2624":"VEX_Vpermilpd_xmm_xmm_xmmm128",VEX_Vpermilpd_ymm_ymm_ymmm256:2625,"2625":"VEX_Vpermilpd_ymm_ymm_ymmm256",EVEX_Vpermilpd_xmm_k1z_xmm_xmmm128b64:2626,"2626":"EVEX_Vpermilpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vpermilpd_ymm_k1z_ymm_ymmm256b64:2627,"2627":"EVEX_Vpermilpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vpermilpd_zmm_k1z_zmm_zmmm512b64:2628,"2628":"EVEX_Vpermilpd_zmm_k1z_zmm_zmmm512b64",VEX_Vtestps_xmm_xmmm128:2629,"2629":"VEX_Vtestps_xmm_xmmm128",VEX_Vtestps_ymm_ymmm256:2630,"2630":"VEX_Vtestps_ymm_ymmm256",VEX_Vtestpd_xmm_xmmm128:2631,"2631":"VEX_Vtestpd_xmm_xmmm128",VEX_Vtestpd_ymm_ymmm256:2632,"2632":"VEX_Vtestpd_ymm_ymmm256",Pblendvb_xmm_xmmm128:2633,"2633":"Pblendvb_xmm_xmmm128",EVEX_Vpsrlvw_xmm_k1z_xmm_xmmm128:2634,"2634":"EVEX_Vpsrlvw_xmm_k1z_xmm_xmmm128",EVEX_Vpsrlvw_ymm_k1z_ymm_ymmm256:2635,"2635":"EVEX_Vpsrlvw_ymm_k1z_ymm_ymmm256",EVEX_Vpsrlvw_zmm_k1z_zmm_zmmm512:2636,"2636":"EVEX_Vpsrlvw_zmm_k1z_zmm_zmmm512",EVEX_Vpmovuswb_xmmm64_k1z_xmm:2637,"2637":"EVEX_Vpmovuswb_xmmm64_k1z_xmm",EVEX_Vpmovuswb_xmmm128_k1z_ymm:2638,"2638":"EVEX_Vpmovuswb_xmmm128_k1z_ymm",EVEX_Vpmovuswb_ymmm256_k1z_zmm:2639,"2639":"EVEX_Vpmovuswb_ymmm256_k1z_zmm",EVEX_Vpsravw_xmm_k1z_xmm_xmmm128:2640,"2640":"EVEX_Vpsravw_xmm_k1z_xmm_xmmm128",EVEX_Vpsravw_ymm_k1z_ymm_ymmm256:2641,"2641":"EVEX_Vpsravw_ymm_k1z_ymm_ymmm256",EVEX_Vpsravw_zmm_k1z_zmm_zmmm512:2642,"2642":"EVEX_Vpsravw_zmm_k1z_zmm_zmmm512",EVEX_Vpmovusdb_xmmm32_k1z_xmm:2643,"2643":"EVEX_Vpmovusdb_xmmm32_k1z_xmm",EVEX_Vpmovusdb_xmmm64_k1z_ymm:2644,"2644":"EVEX_Vpmovusdb_xmmm64_k1z_ymm",EVEX_Vpmovusdb_xmmm128_k1z_zmm:2645,"2645":"EVEX_Vpmovusdb_xmmm128_k1z_zmm",EVEX_Vpsllvw_xmm_k1z_xmm_xmmm128:2646,"2646":"EVEX_Vpsllvw_xmm_k1z_xmm_xmmm128",EVEX_Vpsllvw_ymm_k1z_ymm_ymmm256:2647,"2647":"EVEX_Vpsllvw_ymm_k1z_ymm_ymmm256",EVEX_Vpsllvw_zmm_k1z_zmm_zmmm512:2648,"2648":"EVEX_Vpsllvw_zmm_k1z_zmm_zmmm512",EVEX_Vpmovusqb_xmmm16_k1z_xmm:2649,"2649":"EVEX_Vpmovusqb_xmmm16_k1z_xmm",EVEX_Vpmovusqb_xmmm32_k1z_ymm:2650,"2650":"EVEX_Vpmovusqb_xmmm32_k1z_ymm",EVEX_Vpmovusqb_xmmm64_k1z_zmm:2651,"2651":"EVEX_Vpmovusqb_xmmm64_k1z_zmm",VEX_Vcvtph2ps_xmm_xmmm64:2652,"2652":"VEX_Vcvtph2ps_xmm_xmmm64",VEX_Vcvtph2ps_ymm_xmmm128:2653,"2653":"VEX_Vcvtph2ps_ymm_xmmm128",EVEX_Vcvtph2ps_xmm_k1z_xmmm64:2654,"2654":"EVEX_Vcvtph2ps_xmm_k1z_xmmm64",EVEX_Vcvtph2ps_ymm_k1z_xmmm128:2655,"2655":"EVEX_Vcvtph2ps_ymm_k1z_xmmm128",EVEX_Vcvtph2ps_zmm_k1z_ymmm256_sae:2656,"2656":"EVEX_Vcvtph2ps_zmm_k1z_ymmm256_sae",EVEX_Vpmovusdw_xmmm64_k1z_xmm:2657,"2657":"EVEX_Vpmovusdw_xmmm64_k1z_xmm",EVEX_Vpmovusdw_xmmm128_k1z_ymm:2658,"2658":"EVEX_Vpmovusdw_xmmm128_k1z_ymm",EVEX_Vpmovusdw_ymmm256_k1z_zmm:2659,"2659":"EVEX_Vpmovusdw_ymmm256_k1z_zmm",Blendvps_xmm_xmmm128:2660,"2660":"Blendvps_xmm_xmmm128",EVEX_Vprorvd_xmm_k1z_xmm_xmmm128b32:2661,"2661":"EVEX_Vprorvd_xmm_k1z_xmm_xmmm128b32",EVEX_Vprorvd_ymm_k1z_ymm_ymmm256b32:2662,"2662":"EVEX_Vprorvd_ymm_k1z_ymm_ymmm256b32",EVEX_Vprorvd_zmm_k1z_zmm_zmmm512b32:2663,"2663":"EVEX_Vprorvd_zmm_k1z_zmm_zmmm512b32",EVEX_Vprorvq_xmm_k1z_xmm_xmmm128b64:2664,"2664":"EVEX_Vprorvq_xmm_k1z_xmm_xmmm128b64",EVEX_Vprorvq_ymm_k1z_ymm_ymmm256b64:2665,"2665":"EVEX_Vprorvq_ymm_k1z_ymm_ymmm256b64",EVEX_Vprorvq_zmm_k1z_zmm_zmmm512b64:2666,"2666":"EVEX_Vprorvq_zmm_k1z_zmm_zmmm512b64",EVEX_Vpmovusqw_xmmm32_k1z_xmm:2667,"2667":"EVEX_Vpmovusqw_xmmm32_k1z_xmm",EVEX_Vpmovusqw_xmmm64_k1z_ymm:2668,"2668":"EVEX_Vpmovusqw_xmmm64_k1z_ymm",EVEX_Vpmovusqw_xmmm128_k1z_zmm:2669,"2669":"EVEX_Vpmovusqw_xmmm128_k1z_zmm",Blendvpd_xmm_xmmm128:2670,"2670":"Blendvpd_xmm_xmmm128",EVEX_Vprolvd_xmm_k1z_xmm_xmmm128b32:2671,"2671":"EVEX_Vprolvd_xmm_k1z_xmm_xmmm128b32",EVEX_Vprolvd_ymm_k1z_ymm_ymmm256b32:2672,"2672":"EVEX_Vprolvd_ymm_k1z_ymm_ymmm256b32",EVEX_Vprolvd_zmm_k1z_zmm_zmmm512b32:2673,"2673":"EVEX_Vprolvd_zmm_k1z_zmm_zmmm512b32",EVEX_Vprolvq_xmm_k1z_xmm_xmmm128b64:2674,"2674":"EVEX_Vprolvq_xmm_k1z_xmm_xmmm128b64",EVEX_Vprolvq_ymm_k1z_ymm_ymmm256b64:2675,"2675":"EVEX_Vprolvq_ymm_k1z_ymm_ymmm256b64",EVEX_Vprolvq_zmm_k1z_zmm_zmmm512b64:2676,"2676":"EVEX_Vprolvq_zmm_k1z_zmm_zmmm512b64",EVEX_Vpmovusqd_xmmm64_k1z_xmm:2677,"2677":"EVEX_Vpmovusqd_xmmm64_k1z_xmm",EVEX_Vpmovusqd_xmmm128_k1z_ymm:2678,"2678":"EVEX_Vpmovusqd_xmmm128_k1z_ymm",EVEX_Vpmovusqd_ymmm256_k1z_zmm:2679,"2679":"EVEX_Vpmovusqd_ymmm256_k1z_zmm",VEX_Vpermps_ymm_ymm_ymmm256:2680,"2680":"VEX_Vpermps_ymm_ymm_ymmm256",EVEX_Vpermps_ymm_k1z_ymm_ymmm256b32:2681,"2681":"EVEX_Vpermps_ymm_k1z_ymm_ymmm256b32",EVEX_Vpermps_zmm_k1z_zmm_zmmm512b32:2682,"2682":"EVEX_Vpermps_zmm_k1z_zmm_zmmm512b32",EVEX_Vpermpd_ymm_k1z_ymm_ymmm256b64:2683,"2683":"EVEX_Vpermpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vpermpd_zmm_k1z_zmm_zmmm512b64:2684,"2684":"EVEX_Vpermpd_zmm_k1z_zmm_zmmm512b64",Ptest_xmm_xmmm128:2685,"2685":"Ptest_xmm_xmmm128",VEX_Vptest_xmm_xmmm128:2686,"2686":"VEX_Vptest_xmm_xmmm128",VEX_Vptest_ymm_ymmm256:2687,"2687":"VEX_Vptest_ymm_ymmm256",VEX_Vbroadcastss_xmm_m32:2688,"2688":"VEX_Vbroadcastss_xmm_m32",VEX_Vbroadcastss_ymm_m32:2689,"2689":"VEX_Vbroadcastss_ymm_m32",EVEX_Vbroadcastss_xmm_k1z_xmmm32:2690,"2690":"EVEX_Vbroadcastss_xmm_k1z_xmmm32",EVEX_Vbroadcastss_ymm_k1z_xmmm32:2691,"2691":"EVEX_Vbroadcastss_ymm_k1z_xmmm32",EVEX_Vbroadcastss_zmm_k1z_xmmm32:2692,"2692":"EVEX_Vbroadcastss_zmm_k1z_xmmm32",VEX_Vbroadcastsd_ymm_m64:2693,"2693":"VEX_Vbroadcastsd_ymm_m64",EVEX_Vbroadcastf32x2_ymm_k1z_xmmm64:2694,"2694":"EVEX_Vbroadcastf32x2_ymm_k1z_xmmm64",EVEX_Vbroadcastf32x2_zmm_k1z_xmmm64:2695,"2695":"EVEX_Vbroadcastf32x2_zmm_k1z_xmmm64",EVEX_Vbroadcastsd_ymm_k1z_xmmm64:2696,"2696":"EVEX_Vbroadcastsd_ymm_k1z_xmmm64",EVEX_Vbroadcastsd_zmm_k1z_xmmm64:2697,"2697":"EVEX_Vbroadcastsd_zmm_k1z_xmmm64",VEX_Vbroadcastf128_ymm_m128:2698,"2698":"VEX_Vbroadcastf128_ymm_m128",EVEX_Vbroadcastf32x4_ymm_k1z_m128:2699,"2699":"EVEX_Vbroadcastf32x4_ymm_k1z_m128",EVEX_Vbroadcastf32x4_zmm_k1z_m128:2700,"2700":"EVEX_Vbroadcastf32x4_zmm_k1z_m128",EVEX_Vbroadcastf64x2_ymm_k1z_m128:2701,"2701":"EVEX_Vbroadcastf64x2_ymm_k1z_m128",EVEX_Vbroadcastf64x2_zmm_k1z_m128:2702,"2702":"EVEX_Vbroadcastf64x2_zmm_k1z_m128",EVEX_Vbroadcastf32x8_zmm_k1z_m256:2703,"2703":"EVEX_Vbroadcastf32x8_zmm_k1z_m256",EVEX_Vbroadcastf64x4_zmm_k1z_m256:2704,"2704":"EVEX_Vbroadcastf64x4_zmm_k1z_m256",Pabsb_mm_mmm64:2705,"2705":"Pabsb_mm_mmm64",Pabsb_xmm_xmmm128:2706,"2706":"Pabsb_xmm_xmmm128",VEX_Vpabsb_xmm_xmmm128:2707,"2707":"VEX_Vpabsb_xmm_xmmm128",VEX_Vpabsb_ymm_ymmm256:2708,"2708":"VEX_Vpabsb_ymm_ymmm256",EVEX_Vpabsb_xmm_k1z_xmmm128:2709,"2709":"EVEX_Vpabsb_xmm_k1z_xmmm128",EVEX_Vpabsb_ymm_k1z_ymmm256:2710,"2710":"EVEX_Vpabsb_ymm_k1z_ymmm256",EVEX_Vpabsb_zmm_k1z_zmmm512:2711,"2711":"EVEX_Vpabsb_zmm_k1z_zmmm512",Pabsw_mm_mmm64:2712,"2712":"Pabsw_mm_mmm64",Pabsw_xmm_xmmm128:2713,"2713":"Pabsw_xmm_xmmm128",VEX_Vpabsw_xmm_xmmm128:2714,"2714":"VEX_Vpabsw_xmm_xmmm128",VEX_Vpabsw_ymm_ymmm256:2715,"2715":"VEX_Vpabsw_ymm_ymmm256",EVEX_Vpabsw_xmm_k1z_xmmm128:2716,"2716":"EVEX_Vpabsw_xmm_k1z_xmmm128",EVEX_Vpabsw_ymm_k1z_ymmm256:2717,"2717":"EVEX_Vpabsw_ymm_k1z_ymmm256",EVEX_Vpabsw_zmm_k1z_zmmm512:2718,"2718":"EVEX_Vpabsw_zmm_k1z_zmmm512",Pabsd_mm_mmm64:2719,"2719":"Pabsd_mm_mmm64",Pabsd_xmm_xmmm128:2720,"2720":"Pabsd_xmm_xmmm128",VEX_Vpabsd_xmm_xmmm128:2721,"2721":"VEX_Vpabsd_xmm_xmmm128",VEX_Vpabsd_ymm_ymmm256:2722,"2722":"VEX_Vpabsd_ymm_ymmm256",EVEX_Vpabsd_xmm_k1z_xmmm128b32:2723,"2723":"EVEX_Vpabsd_xmm_k1z_xmmm128b32",EVEX_Vpabsd_ymm_k1z_ymmm256b32:2724,"2724":"EVEX_Vpabsd_ymm_k1z_ymmm256b32",EVEX_Vpabsd_zmm_k1z_zmmm512b32:2725,"2725":"EVEX_Vpabsd_zmm_k1z_zmmm512b32",EVEX_Vpabsq_xmm_k1z_xmmm128b64:2726,"2726":"EVEX_Vpabsq_xmm_k1z_xmmm128b64",EVEX_Vpabsq_ymm_k1z_ymmm256b64:2727,"2727":"EVEX_Vpabsq_ymm_k1z_ymmm256b64",EVEX_Vpabsq_zmm_k1z_zmmm512b64:2728,"2728":"EVEX_Vpabsq_zmm_k1z_zmmm512b64",Pmovsxbw_xmm_xmmm64:2729,"2729":"Pmovsxbw_xmm_xmmm64",VEX_Vpmovsxbw_xmm_xmmm64:2730,"2730":"VEX_Vpmovsxbw_xmm_xmmm64",VEX_Vpmovsxbw_ymm_xmmm128:2731,"2731":"VEX_Vpmovsxbw_ymm_xmmm128",EVEX_Vpmovsxbw_xmm_k1z_xmmm64:2732,"2732":"EVEX_Vpmovsxbw_xmm_k1z_xmmm64",EVEX_Vpmovsxbw_ymm_k1z_xmmm128:2733,"2733":"EVEX_Vpmovsxbw_ymm_k1z_xmmm128",EVEX_Vpmovsxbw_zmm_k1z_ymmm256:2734,"2734":"EVEX_Vpmovsxbw_zmm_k1z_ymmm256",EVEX_Vpmovswb_xmmm64_k1z_xmm:2735,"2735":"EVEX_Vpmovswb_xmmm64_k1z_xmm",EVEX_Vpmovswb_xmmm128_k1z_ymm:2736,"2736":"EVEX_Vpmovswb_xmmm128_k1z_ymm",EVEX_Vpmovswb_ymmm256_k1z_zmm:2737,"2737":"EVEX_Vpmovswb_ymmm256_k1z_zmm",Pmovsxbd_xmm_xmmm32:2738,"2738":"Pmovsxbd_xmm_xmmm32",VEX_Vpmovsxbd_xmm_xmmm32:2739,"2739":"VEX_Vpmovsxbd_xmm_xmmm32",VEX_Vpmovsxbd_ymm_xmmm64:2740,"2740":"VEX_Vpmovsxbd_ymm_xmmm64",EVEX_Vpmovsxbd_xmm_k1z_xmmm32:2741,"2741":"EVEX_Vpmovsxbd_xmm_k1z_xmmm32",EVEX_Vpmovsxbd_ymm_k1z_xmmm64:2742,"2742":"EVEX_Vpmovsxbd_ymm_k1z_xmmm64",EVEX_Vpmovsxbd_zmm_k1z_xmmm128:2743,"2743":"EVEX_Vpmovsxbd_zmm_k1z_xmmm128",EVEX_Vpmovsdb_xmmm32_k1z_xmm:2744,"2744":"EVEX_Vpmovsdb_xmmm32_k1z_xmm",EVEX_Vpmovsdb_xmmm64_k1z_ymm:2745,"2745":"EVEX_Vpmovsdb_xmmm64_k1z_ymm",EVEX_Vpmovsdb_xmmm128_k1z_zmm:2746,"2746":"EVEX_Vpmovsdb_xmmm128_k1z_zmm",Pmovsxbq_xmm_xmmm16:2747,"2747":"Pmovsxbq_xmm_xmmm16",VEX_Vpmovsxbq_xmm_xmmm16:2748,"2748":"VEX_Vpmovsxbq_xmm_xmmm16",VEX_Vpmovsxbq_ymm_xmmm32:2749,"2749":"VEX_Vpmovsxbq_ymm_xmmm32",EVEX_Vpmovsxbq_xmm_k1z_xmmm16:2750,"2750":"EVEX_Vpmovsxbq_xmm_k1z_xmmm16",EVEX_Vpmovsxbq_ymm_k1z_xmmm32:2751,"2751":"EVEX_Vpmovsxbq_ymm_k1z_xmmm32",EVEX_Vpmovsxbq_zmm_k1z_xmmm64:2752,"2752":"EVEX_Vpmovsxbq_zmm_k1z_xmmm64",EVEX_Vpmovsqb_xmmm16_k1z_xmm:2753,"2753":"EVEX_Vpmovsqb_xmmm16_k1z_xmm",EVEX_Vpmovsqb_xmmm32_k1z_ymm:2754,"2754":"EVEX_Vpmovsqb_xmmm32_k1z_ymm",EVEX_Vpmovsqb_xmmm64_k1z_zmm:2755,"2755":"EVEX_Vpmovsqb_xmmm64_k1z_zmm",Pmovsxwd_xmm_xmmm64:2756,"2756":"Pmovsxwd_xmm_xmmm64",VEX_Vpmovsxwd_xmm_xmmm64:2757,"2757":"VEX_Vpmovsxwd_xmm_xmmm64",VEX_Vpmovsxwd_ymm_xmmm128:2758,"2758":"VEX_Vpmovsxwd_ymm_xmmm128",EVEX_Vpmovsxwd_xmm_k1z_xmmm64:2759,"2759":"EVEX_Vpmovsxwd_xmm_k1z_xmmm64",EVEX_Vpmovsxwd_ymm_k1z_xmmm128:2760,"2760":"EVEX_Vpmovsxwd_ymm_k1z_xmmm128",EVEX_Vpmovsxwd_zmm_k1z_ymmm256:2761,"2761":"EVEX_Vpmovsxwd_zmm_k1z_ymmm256",EVEX_Vpmovsdw_xmmm64_k1z_xmm:2762,"2762":"EVEX_Vpmovsdw_xmmm64_k1z_xmm",EVEX_Vpmovsdw_xmmm128_k1z_ymm:2763,"2763":"EVEX_Vpmovsdw_xmmm128_k1z_ymm",EVEX_Vpmovsdw_ymmm256_k1z_zmm:2764,"2764":"EVEX_Vpmovsdw_ymmm256_k1z_zmm",Pmovsxwq_xmm_xmmm32:2765,"2765":"Pmovsxwq_xmm_xmmm32",VEX_Vpmovsxwq_xmm_xmmm32:2766,"2766":"VEX_Vpmovsxwq_xmm_xmmm32",VEX_Vpmovsxwq_ymm_xmmm64:2767,"2767":"VEX_Vpmovsxwq_ymm_xmmm64",EVEX_Vpmovsxwq_xmm_k1z_xmmm32:2768,"2768":"EVEX_Vpmovsxwq_xmm_k1z_xmmm32",EVEX_Vpmovsxwq_ymm_k1z_xmmm64:2769,"2769":"EVEX_Vpmovsxwq_ymm_k1z_xmmm64",EVEX_Vpmovsxwq_zmm_k1z_xmmm128:2770,"2770":"EVEX_Vpmovsxwq_zmm_k1z_xmmm128",EVEX_Vpmovsqw_xmmm32_k1z_xmm:2771,"2771":"EVEX_Vpmovsqw_xmmm32_k1z_xmm",EVEX_Vpmovsqw_xmmm64_k1z_ymm:2772,"2772":"EVEX_Vpmovsqw_xmmm64_k1z_ymm",EVEX_Vpmovsqw_xmmm128_k1z_zmm:2773,"2773":"EVEX_Vpmovsqw_xmmm128_k1z_zmm",Pmovsxdq_xmm_xmmm64:2774,"2774":"Pmovsxdq_xmm_xmmm64",VEX_Vpmovsxdq_xmm_xmmm64:2775,"2775":"VEX_Vpmovsxdq_xmm_xmmm64",VEX_Vpmovsxdq_ymm_xmmm128:2776,"2776":"VEX_Vpmovsxdq_ymm_xmmm128",EVEX_Vpmovsxdq_xmm_k1z_xmmm64:2777,"2777":"EVEX_Vpmovsxdq_xmm_k1z_xmmm64",EVEX_Vpmovsxdq_ymm_k1z_xmmm128:2778,"2778":"EVEX_Vpmovsxdq_ymm_k1z_xmmm128",EVEX_Vpmovsxdq_zmm_k1z_ymmm256:2779,"2779":"EVEX_Vpmovsxdq_zmm_k1z_ymmm256",EVEX_Vpmovsqd_xmmm64_k1z_xmm:2780,"2780":"EVEX_Vpmovsqd_xmmm64_k1z_xmm",EVEX_Vpmovsqd_xmmm128_k1z_ymm:2781,"2781":"EVEX_Vpmovsqd_xmmm128_k1z_ymm",EVEX_Vpmovsqd_ymmm256_k1z_zmm:2782,"2782":"EVEX_Vpmovsqd_ymmm256_k1z_zmm",EVEX_Vptestmb_kr_k1_xmm_xmmm128:2783,"2783":"EVEX_Vptestmb_kr_k1_xmm_xmmm128",EVEX_Vptestmb_kr_k1_ymm_ymmm256:2784,"2784":"EVEX_Vptestmb_kr_k1_ymm_ymmm256",EVEX_Vptestmb_kr_k1_zmm_zmmm512:2785,"2785":"EVEX_Vptestmb_kr_k1_zmm_zmmm512",EVEX_Vptestmw_kr_k1_xmm_xmmm128:2786,"2786":"EVEX_Vptestmw_kr_k1_xmm_xmmm128",EVEX_Vptestmw_kr_k1_ymm_ymmm256:2787,"2787":"EVEX_Vptestmw_kr_k1_ymm_ymmm256",EVEX_Vptestmw_kr_k1_zmm_zmmm512:2788,"2788":"EVEX_Vptestmw_kr_k1_zmm_zmmm512",EVEX_Vptestnmb_kr_k1_xmm_xmmm128:2789,"2789":"EVEX_Vptestnmb_kr_k1_xmm_xmmm128",EVEX_Vptestnmb_kr_k1_ymm_ymmm256:2790,"2790":"EVEX_Vptestnmb_kr_k1_ymm_ymmm256",EVEX_Vptestnmb_kr_k1_zmm_zmmm512:2791,"2791":"EVEX_Vptestnmb_kr_k1_zmm_zmmm512",EVEX_Vptestnmw_kr_k1_xmm_xmmm128:2792,"2792":"EVEX_Vptestnmw_kr_k1_xmm_xmmm128",EVEX_Vptestnmw_kr_k1_ymm_ymmm256:2793,"2793":"EVEX_Vptestnmw_kr_k1_ymm_ymmm256",EVEX_Vptestnmw_kr_k1_zmm_zmmm512:2794,"2794":"EVEX_Vptestnmw_kr_k1_zmm_zmmm512",EVEX_Vptestmd_kr_k1_xmm_xmmm128b32:2795,"2795":"EVEX_Vptestmd_kr_k1_xmm_xmmm128b32",EVEX_Vptestmd_kr_k1_ymm_ymmm256b32:2796,"2796":"EVEX_Vptestmd_kr_k1_ymm_ymmm256b32",EVEX_Vptestmd_kr_k1_zmm_zmmm512b32:2797,"2797":"EVEX_Vptestmd_kr_k1_zmm_zmmm512b32",EVEX_Vptestmq_kr_k1_xmm_xmmm128b64:2798,"2798":"EVEX_Vptestmq_kr_k1_xmm_xmmm128b64",EVEX_Vptestmq_kr_k1_ymm_ymmm256b64:2799,"2799":"EVEX_Vptestmq_kr_k1_ymm_ymmm256b64",EVEX_Vptestmq_kr_k1_zmm_zmmm512b64:2800,"2800":"EVEX_Vptestmq_kr_k1_zmm_zmmm512b64",EVEX_Vptestnmd_kr_k1_xmm_xmmm128b32:2801,"2801":"EVEX_Vptestnmd_kr_k1_xmm_xmmm128b32",EVEX_Vptestnmd_kr_k1_ymm_ymmm256b32:2802,"2802":"EVEX_Vptestnmd_kr_k1_ymm_ymmm256b32",EVEX_Vptestnmd_kr_k1_zmm_zmmm512b32:2803,"2803":"EVEX_Vptestnmd_kr_k1_zmm_zmmm512b32",EVEX_Vptestnmq_kr_k1_xmm_xmmm128b64:2804,"2804":"EVEX_Vptestnmq_kr_k1_xmm_xmmm128b64",EVEX_Vptestnmq_kr_k1_ymm_ymmm256b64:2805,"2805":"EVEX_Vptestnmq_kr_k1_ymm_ymmm256b64",EVEX_Vptestnmq_kr_k1_zmm_zmmm512b64:2806,"2806":"EVEX_Vptestnmq_kr_k1_zmm_zmmm512b64",Pmuldq_xmm_xmmm128:2807,"2807":"Pmuldq_xmm_xmmm128",VEX_Vpmuldq_xmm_xmm_xmmm128:2808,"2808":"VEX_Vpmuldq_xmm_xmm_xmmm128",VEX_Vpmuldq_ymm_ymm_ymmm256:2809,"2809":"VEX_Vpmuldq_ymm_ymm_ymmm256",EVEX_Vpmuldq_xmm_k1z_xmm_xmmm128b64:2810,"2810":"EVEX_Vpmuldq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmuldq_ymm_k1z_ymm_ymmm256b64:2811,"2811":"EVEX_Vpmuldq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmuldq_zmm_k1z_zmm_zmmm512b64:2812,"2812":"EVEX_Vpmuldq_zmm_k1z_zmm_zmmm512b64",EVEX_Vpmovm2b_xmm_kr:2813,"2813":"EVEX_Vpmovm2b_xmm_kr",EVEX_Vpmovm2b_ymm_kr:2814,"2814":"EVEX_Vpmovm2b_ymm_kr",EVEX_Vpmovm2b_zmm_kr:2815,"2815":"EVEX_Vpmovm2b_zmm_kr",EVEX_Vpmovm2w_xmm_kr:2816,"2816":"EVEX_Vpmovm2w_xmm_kr",EVEX_Vpmovm2w_ymm_kr:2817,"2817":"EVEX_Vpmovm2w_ymm_kr",EVEX_Vpmovm2w_zmm_kr:2818,"2818":"EVEX_Vpmovm2w_zmm_kr",Pcmpeqq_xmm_xmmm128:2819,"2819":"Pcmpeqq_xmm_xmmm128",VEX_Vpcmpeqq_xmm_xmm_xmmm128:2820,"2820":"VEX_Vpcmpeqq_xmm_xmm_xmmm128",VEX_Vpcmpeqq_ymm_ymm_ymmm256:2821,"2821":"VEX_Vpcmpeqq_ymm_ymm_ymmm256",EVEX_Vpcmpeqq_kr_k1_xmm_xmmm128b64:2822,"2822":"EVEX_Vpcmpeqq_kr_k1_xmm_xmmm128b64",EVEX_Vpcmpeqq_kr_k1_ymm_ymmm256b64:2823,"2823":"EVEX_Vpcmpeqq_kr_k1_ymm_ymmm256b64",EVEX_Vpcmpeqq_kr_k1_zmm_zmmm512b64:2824,"2824":"EVEX_Vpcmpeqq_kr_k1_zmm_zmmm512b64",EVEX_Vpmovb2m_kr_xmm:2825,"2825":"EVEX_Vpmovb2m_kr_xmm",EVEX_Vpmovb2m_kr_ymm:2826,"2826":"EVEX_Vpmovb2m_kr_ymm",EVEX_Vpmovb2m_kr_zmm:2827,"2827":"EVEX_Vpmovb2m_kr_zmm",EVEX_Vpmovw2m_kr_xmm:2828,"2828":"EVEX_Vpmovw2m_kr_xmm",EVEX_Vpmovw2m_kr_ymm:2829,"2829":"EVEX_Vpmovw2m_kr_ymm",EVEX_Vpmovw2m_kr_zmm:2830,"2830":"EVEX_Vpmovw2m_kr_zmm",Movntdqa_xmm_m128:2831,"2831":"Movntdqa_xmm_m128",VEX_Vmovntdqa_xmm_m128:2832,"2832":"VEX_Vmovntdqa_xmm_m128",VEX_Vmovntdqa_ymm_m256:2833,"2833":"VEX_Vmovntdqa_ymm_m256",EVEX_Vmovntdqa_xmm_m128:2834,"2834":"EVEX_Vmovntdqa_xmm_m128",EVEX_Vmovntdqa_ymm_m256:2835,"2835":"EVEX_Vmovntdqa_ymm_m256",EVEX_Vmovntdqa_zmm_m512:2836,"2836":"EVEX_Vmovntdqa_zmm_m512",EVEX_Vpbroadcastmb2q_xmm_kr:2837,"2837":"EVEX_Vpbroadcastmb2q_xmm_kr",EVEX_Vpbroadcastmb2q_ymm_kr:2838,"2838":"EVEX_Vpbroadcastmb2q_ymm_kr",EVEX_Vpbroadcastmb2q_zmm_kr:2839,"2839":"EVEX_Vpbroadcastmb2q_zmm_kr",Packusdw_xmm_xmmm128:2840,"2840":"Packusdw_xmm_xmmm128",VEX_Vpackusdw_xmm_xmm_xmmm128:2841,"2841":"VEX_Vpackusdw_xmm_xmm_xmmm128",VEX_Vpackusdw_ymm_ymm_ymmm256:2842,"2842":"VEX_Vpackusdw_ymm_ymm_ymmm256",EVEX_Vpackusdw_xmm_k1z_xmm_xmmm128b32:2843,"2843":"EVEX_Vpackusdw_xmm_k1z_xmm_xmmm128b32",EVEX_Vpackusdw_ymm_k1z_ymm_ymmm256b32:2844,"2844":"EVEX_Vpackusdw_ymm_k1z_ymm_ymmm256b32",EVEX_Vpackusdw_zmm_k1z_zmm_zmmm512b32:2845,"2845":"EVEX_Vpackusdw_zmm_k1z_zmm_zmmm512b32",VEX_Vmaskmovps_xmm_xmm_m128:2846,"2846":"VEX_Vmaskmovps_xmm_xmm_m128",VEX_Vmaskmovps_ymm_ymm_m256:2847,"2847":"VEX_Vmaskmovps_ymm_ymm_m256",EVEX_Vscalefps_xmm_k1z_xmm_xmmm128b32:2848,"2848":"EVEX_Vscalefps_xmm_k1z_xmm_xmmm128b32",EVEX_Vscalefps_ymm_k1z_ymm_ymmm256b32:2849,"2849":"EVEX_Vscalefps_ymm_k1z_ymm_ymmm256b32",EVEX_Vscalefps_zmm_k1z_zmm_zmmm512b32_er:2850,"2850":"EVEX_Vscalefps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vscalefpd_xmm_k1z_xmm_xmmm128b64:2851,"2851":"EVEX_Vscalefpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vscalefpd_ymm_k1z_ymm_ymmm256b64:2852,"2852":"EVEX_Vscalefpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vscalefpd_zmm_k1z_zmm_zmmm512b64_er:2853,"2853":"EVEX_Vscalefpd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vmaskmovpd_xmm_xmm_m128:2854,"2854":"VEX_Vmaskmovpd_xmm_xmm_m128",VEX_Vmaskmovpd_ymm_ymm_m256:2855,"2855":"VEX_Vmaskmovpd_ymm_ymm_m256",EVEX_Vscalefss_xmm_k1z_xmm_xmmm32_er:2856,"2856":"EVEX_Vscalefss_xmm_k1z_xmm_xmmm32_er",EVEX_Vscalefsd_xmm_k1z_xmm_xmmm64_er:2857,"2857":"EVEX_Vscalefsd_xmm_k1z_xmm_xmmm64_er",VEX_Vmaskmovps_m128_xmm_xmm:2858,"2858":"VEX_Vmaskmovps_m128_xmm_xmm",VEX_Vmaskmovps_m256_ymm_ymm:2859,"2859":"VEX_Vmaskmovps_m256_ymm_ymm",VEX_Vmaskmovpd_m128_xmm_xmm:2860,"2860":"VEX_Vmaskmovpd_m128_xmm_xmm",VEX_Vmaskmovpd_m256_ymm_ymm:2861,"2861":"VEX_Vmaskmovpd_m256_ymm_ymm",Pmovzxbw_xmm_xmmm64:2862,"2862":"Pmovzxbw_xmm_xmmm64",VEX_Vpmovzxbw_xmm_xmmm64:2863,"2863":"VEX_Vpmovzxbw_xmm_xmmm64",VEX_Vpmovzxbw_ymm_xmmm128:2864,"2864":"VEX_Vpmovzxbw_ymm_xmmm128",EVEX_Vpmovzxbw_xmm_k1z_xmmm64:2865,"2865":"EVEX_Vpmovzxbw_xmm_k1z_xmmm64",EVEX_Vpmovzxbw_ymm_k1z_xmmm128:2866,"2866":"EVEX_Vpmovzxbw_ymm_k1z_xmmm128",EVEX_Vpmovzxbw_zmm_k1z_ymmm256:2867,"2867":"EVEX_Vpmovzxbw_zmm_k1z_ymmm256",EVEX_Vpmovwb_xmmm64_k1z_xmm:2868,"2868":"EVEX_Vpmovwb_xmmm64_k1z_xmm",EVEX_Vpmovwb_xmmm128_k1z_ymm:2869,"2869":"EVEX_Vpmovwb_xmmm128_k1z_ymm",EVEX_Vpmovwb_ymmm256_k1z_zmm:2870,"2870":"EVEX_Vpmovwb_ymmm256_k1z_zmm",Pmovzxbd_xmm_xmmm32:2871,"2871":"Pmovzxbd_xmm_xmmm32",VEX_Vpmovzxbd_xmm_xmmm32:2872,"2872":"VEX_Vpmovzxbd_xmm_xmmm32",VEX_Vpmovzxbd_ymm_xmmm64:2873,"2873":"VEX_Vpmovzxbd_ymm_xmmm64",EVEX_Vpmovzxbd_xmm_k1z_xmmm32:2874,"2874":"EVEX_Vpmovzxbd_xmm_k1z_xmmm32",EVEX_Vpmovzxbd_ymm_k1z_xmmm64:2875,"2875":"EVEX_Vpmovzxbd_ymm_k1z_xmmm64",EVEX_Vpmovzxbd_zmm_k1z_xmmm128:2876,"2876":"EVEX_Vpmovzxbd_zmm_k1z_xmmm128",EVEX_Vpmovdb_xmmm32_k1z_xmm:2877,"2877":"EVEX_Vpmovdb_xmmm32_k1z_xmm",EVEX_Vpmovdb_xmmm64_k1z_ymm:2878,"2878":"EVEX_Vpmovdb_xmmm64_k1z_ymm",EVEX_Vpmovdb_xmmm128_k1z_zmm:2879,"2879":"EVEX_Vpmovdb_xmmm128_k1z_zmm",Pmovzxbq_xmm_xmmm16:2880,"2880":"Pmovzxbq_xmm_xmmm16",VEX_Vpmovzxbq_xmm_xmmm16:2881,"2881":"VEX_Vpmovzxbq_xmm_xmmm16",VEX_Vpmovzxbq_ymm_xmmm32:2882,"2882":"VEX_Vpmovzxbq_ymm_xmmm32",EVEX_Vpmovzxbq_xmm_k1z_xmmm16:2883,"2883":"EVEX_Vpmovzxbq_xmm_k1z_xmmm16",EVEX_Vpmovzxbq_ymm_k1z_xmmm32:2884,"2884":"EVEX_Vpmovzxbq_ymm_k1z_xmmm32",EVEX_Vpmovzxbq_zmm_k1z_xmmm64:2885,"2885":"EVEX_Vpmovzxbq_zmm_k1z_xmmm64",EVEX_Vpmovqb_xmmm16_k1z_xmm:2886,"2886":"EVEX_Vpmovqb_xmmm16_k1z_xmm",EVEX_Vpmovqb_xmmm32_k1z_ymm:2887,"2887":"EVEX_Vpmovqb_xmmm32_k1z_ymm",EVEX_Vpmovqb_xmmm64_k1z_zmm:2888,"2888":"EVEX_Vpmovqb_xmmm64_k1z_zmm",Pmovzxwd_xmm_xmmm64:2889,"2889":"Pmovzxwd_xmm_xmmm64",VEX_Vpmovzxwd_xmm_xmmm64:2890,"2890":"VEX_Vpmovzxwd_xmm_xmmm64",VEX_Vpmovzxwd_ymm_xmmm128:2891,"2891":"VEX_Vpmovzxwd_ymm_xmmm128",EVEX_Vpmovzxwd_xmm_k1z_xmmm64:2892,"2892":"EVEX_Vpmovzxwd_xmm_k1z_xmmm64",EVEX_Vpmovzxwd_ymm_k1z_xmmm128:2893,"2893":"EVEX_Vpmovzxwd_ymm_k1z_xmmm128",EVEX_Vpmovzxwd_zmm_k1z_ymmm256:2894,"2894":"EVEX_Vpmovzxwd_zmm_k1z_ymmm256",EVEX_Vpmovdw_xmmm64_k1z_xmm:2895,"2895":"EVEX_Vpmovdw_xmmm64_k1z_xmm",EVEX_Vpmovdw_xmmm128_k1z_ymm:2896,"2896":"EVEX_Vpmovdw_xmmm128_k1z_ymm",EVEX_Vpmovdw_ymmm256_k1z_zmm:2897,"2897":"EVEX_Vpmovdw_ymmm256_k1z_zmm",Pmovzxwq_xmm_xmmm32:2898,"2898":"Pmovzxwq_xmm_xmmm32",VEX_Vpmovzxwq_xmm_xmmm32:2899,"2899":"VEX_Vpmovzxwq_xmm_xmmm32",VEX_Vpmovzxwq_ymm_xmmm64:2900,"2900":"VEX_Vpmovzxwq_ymm_xmmm64",EVEX_Vpmovzxwq_xmm_k1z_xmmm32:2901,"2901":"EVEX_Vpmovzxwq_xmm_k1z_xmmm32",EVEX_Vpmovzxwq_ymm_k1z_xmmm64:2902,"2902":"EVEX_Vpmovzxwq_ymm_k1z_xmmm64",EVEX_Vpmovzxwq_zmm_k1z_xmmm128:2903,"2903":"EVEX_Vpmovzxwq_zmm_k1z_xmmm128",EVEX_Vpmovqw_xmmm32_k1z_xmm:2904,"2904":"EVEX_Vpmovqw_xmmm32_k1z_xmm",EVEX_Vpmovqw_xmmm64_k1z_ymm:2905,"2905":"EVEX_Vpmovqw_xmmm64_k1z_ymm",EVEX_Vpmovqw_xmmm128_k1z_zmm:2906,"2906":"EVEX_Vpmovqw_xmmm128_k1z_zmm",Pmovzxdq_xmm_xmmm64:2907,"2907":"Pmovzxdq_xmm_xmmm64",VEX_Vpmovzxdq_xmm_xmmm64:2908,"2908":"VEX_Vpmovzxdq_xmm_xmmm64",VEX_Vpmovzxdq_ymm_xmmm128:2909,"2909":"VEX_Vpmovzxdq_ymm_xmmm128",EVEX_Vpmovzxdq_xmm_k1z_xmmm64:2910,"2910":"EVEX_Vpmovzxdq_xmm_k1z_xmmm64",EVEX_Vpmovzxdq_ymm_k1z_xmmm128:2911,"2911":"EVEX_Vpmovzxdq_ymm_k1z_xmmm128",EVEX_Vpmovzxdq_zmm_k1z_ymmm256:2912,"2912":"EVEX_Vpmovzxdq_zmm_k1z_ymmm256",EVEX_Vpmovqd_xmmm64_k1z_xmm:2913,"2913":"EVEX_Vpmovqd_xmmm64_k1z_xmm",EVEX_Vpmovqd_xmmm128_k1z_ymm:2914,"2914":"EVEX_Vpmovqd_xmmm128_k1z_ymm",EVEX_Vpmovqd_ymmm256_k1z_zmm:2915,"2915":"EVEX_Vpmovqd_ymmm256_k1z_zmm",VEX_Vpermd_ymm_ymm_ymmm256:2916,"2916":"VEX_Vpermd_ymm_ymm_ymmm256",EVEX_Vpermd_ymm_k1z_ymm_ymmm256b32:2917,"2917":"EVEX_Vpermd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpermd_zmm_k1z_zmm_zmmm512b32:2918,"2918":"EVEX_Vpermd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpermq_ymm_k1z_ymm_ymmm256b64:2919,"2919":"EVEX_Vpermq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpermq_zmm_k1z_zmm_zmmm512b64:2920,"2920":"EVEX_Vpermq_zmm_k1z_zmm_zmmm512b64",Pcmpgtq_xmm_xmmm128:2921,"2921":"Pcmpgtq_xmm_xmmm128",VEX_Vpcmpgtq_xmm_xmm_xmmm128:2922,"2922":"VEX_Vpcmpgtq_xmm_xmm_xmmm128",VEX_Vpcmpgtq_ymm_ymm_ymmm256:2923,"2923":"VEX_Vpcmpgtq_ymm_ymm_ymmm256",EVEX_Vpcmpgtq_kr_k1_xmm_xmmm128b64:2924,"2924":"EVEX_Vpcmpgtq_kr_k1_xmm_xmmm128b64",EVEX_Vpcmpgtq_kr_k1_ymm_ymmm256b64:2925,"2925":"EVEX_Vpcmpgtq_kr_k1_ymm_ymmm256b64",EVEX_Vpcmpgtq_kr_k1_zmm_zmmm512b64:2926,"2926":"EVEX_Vpcmpgtq_kr_k1_zmm_zmmm512b64",Pminsb_xmm_xmmm128:2927,"2927":"Pminsb_xmm_xmmm128",VEX_Vpminsb_xmm_xmm_xmmm128:2928,"2928":"VEX_Vpminsb_xmm_xmm_xmmm128",VEX_Vpminsb_ymm_ymm_ymmm256:2929,"2929":"VEX_Vpminsb_ymm_ymm_ymmm256",EVEX_Vpminsb_xmm_k1z_xmm_xmmm128:2930,"2930":"EVEX_Vpminsb_xmm_k1z_xmm_xmmm128",EVEX_Vpminsb_ymm_k1z_ymm_ymmm256:2931,"2931":"EVEX_Vpminsb_ymm_k1z_ymm_ymmm256",EVEX_Vpminsb_zmm_k1z_zmm_zmmm512:2932,"2932":"EVEX_Vpminsb_zmm_k1z_zmm_zmmm512",EVEX_Vpmovm2d_xmm_kr:2933,"2933":"EVEX_Vpmovm2d_xmm_kr",EVEX_Vpmovm2d_ymm_kr:2934,"2934":"EVEX_Vpmovm2d_ymm_kr",EVEX_Vpmovm2d_zmm_kr:2935,"2935":"EVEX_Vpmovm2d_zmm_kr",EVEX_Vpmovm2q_xmm_kr:2936,"2936":"EVEX_Vpmovm2q_xmm_kr",EVEX_Vpmovm2q_ymm_kr:2937,"2937":"EVEX_Vpmovm2q_ymm_kr",EVEX_Vpmovm2q_zmm_kr:2938,"2938":"EVEX_Vpmovm2q_zmm_kr",Pminsd_xmm_xmmm128:2939,"2939":"Pminsd_xmm_xmmm128",VEX_Vpminsd_xmm_xmm_xmmm128:2940,"2940":"VEX_Vpminsd_xmm_xmm_xmmm128",VEX_Vpminsd_ymm_ymm_ymmm256:2941,"2941":"VEX_Vpminsd_ymm_ymm_ymmm256",EVEX_Vpminsd_xmm_k1z_xmm_xmmm128b32:2942,"2942":"EVEX_Vpminsd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpminsd_ymm_k1z_ymm_ymmm256b32:2943,"2943":"EVEX_Vpminsd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpminsd_zmm_k1z_zmm_zmmm512b32:2944,"2944":"EVEX_Vpminsd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpminsq_xmm_k1z_xmm_xmmm128b64:2945,"2945":"EVEX_Vpminsq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpminsq_ymm_k1z_ymm_ymmm256b64:2946,"2946":"EVEX_Vpminsq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpminsq_zmm_k1z_zmm_zmmm512b64:2947,"2947":"EVEX_Vpminsq_zmm_k1z_zmm_zmmm512b64",EVEX_Vpmovd2m_kr_xmm:2948,"2948":"EVEX_Vpmovd2m_kr_xmm",EVEX_Vpmovd2m_kr_ymm:2949,"2949":"EVEX_Vpmovd2m_kr_ymm",EVEX_Vpmovd2m_kr_zmm:2950,"2950":"EVEX_Vpmovd2m_kr_zmm",EVEX_Vpmovq2m_kr_xmm:2951,"2951":"EVEX_Vpmovq2m_kr_xmm",EVEX_Vpmovq2m_kr_ymm:2952,"2952":"EVEX_Vpmovq2m_kr_ymm",EVEX_Vpmovq2m_kr_zmm:2953,"2953":"EVEX_Vpmovq2m_kr_zmm",Pminuw_xmm_xmmm128:2954,"2954":"Pminuw_xmm_xmmm128",VEX_Vpminuw_xmm_xmm_xmmm128:2955,"2955":"VEX_Vpminuw_xmm_xmm_xmmm128",VEX_Vpminuw_ymm_ymm_ymmm256:2956,"2956":"VEX_Vpminuw_ymm_ymm_ymmm256",EVEX_Vpminuw_xmm_k1z_xmm_xmmm128:2957,"2957":"EVEX_Vpminuw_xmm_k1z_xmm_xmmm128",EVEX_Vpminuw_ymm_k1z_ymm_ymmm256:2958,"2958":"EVEX_Vpminuw_ymm_k1z_ymm_ymmm256",EVEX_Vpminuw_zmm_k1z_zmm_zmmm512:2959,"2959":"EVEX_Vpminuw_zmm_k1z_zmm_zmmm512",EVEX_Vpbroadcastmw2d_xmm_kr:2960,"2960":"EVEX_Vpbroadcastmw2d_xmm_kr",EVEX_Vpbroadcastmw2d_ymm_kr:2961,"2961":"EVEX_Vpbroadcastmw2d_ymm_kr",EVEX_Vpbroadcastmw2d_zmm_kr:2962,"2962":"EVEX_Vpbroadcastmw2d_zmm_kr",Pminud_xmm_xmmm128:2963,"2963":"Pminud_xmm_xmmm128",VEX_Vpminud_xmm_xmm_xmmm128:2964,"2964":"VEX_Vpminud_xmm_xmm_xmmm128",VEX_Vpminud_ymm_ymm_ymmm256:2965,"2965":"VEX_Vpminud_ymm_ymm_ymmm256",EVEX_Vpminud_xmm_k1z_xmm_xmmm128b32:2966,"2966":"EVEX_Vpminud_xmm_k1z_xmm_xmmm128b32",EVEX_Vpminud_ymm_k1z_ymm_ymmm256b32:2967,"2967":"EVEX_Vpminud_ymm_k1z_ymm_ymmm256b32",EVEX_Vpminud_zmm_k1z_zmm_zmmm512b32:2968,"2968":"EVEX_Vpminud_zmm_k1z_zmm_zmmm512b32",EVEX_Vpminuq_xmm_k1z_xmm_xmmm128b64:2969,"2969":"EVEX_Vpminuq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpminuq_ymm_k1z_ymm_ymmm256b64:2970,"2970":"EVEX_Vpminuq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpminuq_zmm_k1z_zmm_zmmm512b64:2971,"2971":"EVEX_Vpminuq_zmm_k1z_zmm_zmmm512b64",Pmaxsb_xmm_xmmm128:2972,"2972":"Pmaxsb_xmm_xmmm128",VEX_Vpmaxsb_xmm_xmm_xmmm128:2973,"2973":"VEX_Vpmaxsb_xmm_xmm_xmmm128",VEX_Vpmaxsb_ymm_ymm_ymmm256:2974,"2974":"VEX_Vpmaxsb_ymm_ymm_ymmm256",EVEX_Vpmaxsb_xmm_k1z_xmm_xmmm128:2975,"2975":"EVEX_Vpmaxsb_xmm_k1z_xmm_xmmm128",EVEX_Vpmaxsb_ymm_k1z_ymm_ymmm256:2976,"2976":"EVEX_Vpmaxsb_ymm_k1z_ymm_ymmm256",EVEX_Vpmaxsb_zmm_k1z_zmm_zmmm512:2977,"2977":"EVEX_Vpmaxsb_zmm_k1z_zmm_zmmm512",Pmaxsd_xmm_xmmm128:2978,"2978":"Pmaxsd_xmm_xmmm128",VEX_Vpmaxsd_xmm_xmm_xmmm128:2979,"2979":"VEX_Vpmaxsd_xmm_xmm_xmmm128",VEX_Vpmaxsd_ymm_ymm_ymmm256:2980,"2980":"VEX_Vpmaxsd_ymm_ymm_ymmm256",EVEX_Vpmaxsd_xmm_k1z_xmm_xmmm128b32:2981,"2981":"EVEX_Vpmaxsd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpmaxsd_ymm_k1z_ymm_ymmm256b32:2982,"2982":"EVEX_Vpmaxsd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpmaxsd_zmm_k1z_zmm_zmmm512b32:2983,"2983":"EVEX_Vpmaxsd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpmaxsq_xmm_k1z_xmm_xmmm128b64:2984,"2984":"EVEX_Vpmaxsq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmaxsq_ymm_k1z_ymm_ymmm256b64:2985,"2985":"EVEX_Vpmaxsq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmaxsq_zmm_k1z_zmm_zmmm512b64:2986,"2986":"EVEX_Vpmaxsq_zmm_k1z_zmm_zmmm512b64",Pmaxuw_xmm_xmmm128:2987,"2987":"Pmaxuw_xmm_xmmm128",VEX_Vpmaxuw_xmm_xmm_xmmm128:2988,"2988":"VEX_Vpmaxuw_xmm_xmm_xmmm128",VEX_Vpmaxuw_ymm_ymm_ymmm256:2989,"2989":"VEX_Vpmaxuw_ymm_ymm_ymmm256",EVEX_Vpmaxuw_xmm_k1z_xmm_xmmm128:2990,"2990":"EVEX_Vpmaxuw_xmm_k1z_xmm_xmmm128",EVEX_Vpmaxuw_ymm_k1z_ymm_ymmm256:2991,"2991":"EVEX_Vpmaxuw_ymm_k1z_ymm_ymmm256",EVEX_Vpmaxuw_zmm_k1z_zmm_zmmm512:2992,"2992":"EVEX_Vpmaxuw_zmm_k1z_zmm_zmmm512",Pmaxud_xmm_xmmm128:2993,"2993":"Pmaxud_xmm_xmmm128",VEX_Vpmaxud_xmm_xmm_xmmm128:2994,"2994":"VEX_Vpmaxud_xmm_xmm_xmmm128",VEX_Vpmaxud_ymm_ymm_ymmm256:2995,"2995":"VEX_Vpmaxud_ymm_ymm_ymmm256",EVEX_Vpmaxud_xmm_k1z_xmm_xmmm128b32:2996,"2996":"EVEX_Vpmaxud_xmm_k1z_xmm_xmmm128b32",EVEX_Vpmaxud_ymm_k1z_ymm_ymmm256b32:2997,"2997":"EVEX_Vpmaxud_ymm_k1z_ymm_ymmm256b32",EVEX_Vpmaxud_zmm_k1z_zmm_zmmm512b32:2998,"2998":"EVEX_Vpmaxud_zmm_k1z_zmm_zmmm512b32",EVEX_Vpmaxuq_xmm_k1z_xmm_xmmm128b64:2999,"2999":"EVEX_Vpmaxuq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmaxuq_ymm_k1z_ymm_ymmm256b64:3000,"3000":"EVEX_Vpmaxuq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmaxuq_zmm_k1z_zmm_zmmm512b64:3001,"3001":"EVEX_Vpmaxuq_zmm_k1z_zmm_zmmm512b64",Pmulld_xmm_xmmm128:3002,"3002":"Pmulld_xmm_xmmm128",VEX_Vpmulld_xmm_xmm_xmmm128:3003,"3003":"VEX_Vpmulld_xmm_xmm_xmmm128",VEX_Vpmulld_ymm_ymm_ymmm256:3004,"3004":"VEX_Vpmulld_ymm_ymm_ymmm256",EVEX_Vpmulld_xmm_k1z_xmm_xmmm128b32:3005,"3005":"EVEX_Vpmulld_xmm_k1z_xmm_xmmm128b32",EVEX_Vpmulld_ymm_k1z_ymm_ymmm256b32:3006,"3006":"EVEX_Vpmulld_ymm_k1z_ymm_ymmm256b32",EVEX_Vpmulld_zmm_k1z_zmm_zmmm512b32:3007,"3007":"EVEX_Vpmulld_zmm_k1z_zmm_zmmm512b32",EVEX_Vpmullq_xmm_k1z_xmm_xmmm128b64:3008,"3008":"EVEX_Vpmullq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmullq_ymm_k1z_ymm_ymmm256b64:3009,"3009":"EVEX_Vpmullq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmullq_zmm_k1z_zmm_zmmm512b64:3010,"3010":"EVEX_Vpmullq_zmm_k1z_zmm_zmmm512b64",Phminposuw_xmm_xmmm128:3011,"3011":"Phminposuw_xmm_xmmm128",VEX_Vphminposuw_xmm_xmmm128:3012,"3012":"VEX_Vphminposuw_xmm_xmmm128",EVEX_Vgetexpps_xmm_k1z_xmmm128b32:3013,"3013":"EVEX_Vgetexpps_xmm_k1z_xmmm128b32",EVEX_Vgetexpps_ymm_k1z_ymmm256b32:3014,"3014":"EVEX_Vgetexpps_ymm_k1z_ymmm256b32",EVEX_Vgetexpps_zmm_k1z_zmmm512b32_sae:3015,"3015":"EVEX_Vgetexpps_zmm_k1z_zmmm512b32_sae",EVEX_Vgetexppd_xmm_k1z_xmmm128b64:3016,"3016":"EVEX_Vgetexppd_xmm_k1z_xmmm128b64",EVEX_Vgetexppd_ymm_k1z_ymmm256b64:3017,"3017":"EVEX_Vgetexppd_ymm_k1z_ymmm256b64",EVEX_Vgetexppd_zmm_k1z_zmmm512b64_sae:3018,"3018":"EVEX_Vgetexppd_zmm_k1z_zmmm512b64_sae",EVEX_Vgetexpss_xmm_k1z_xmm_xmmm32_sae:3019,"3019":"EVEX_Vgetexpss_xmm_k1z_xmm_xmmm32_sae",EVEX_Vgetexpsd_xmm_k1z_xmm_xmmm64_sae:3020,"3020":"EVEX_Vgetexpsd_xmm_k1z_xmm_xmmm64_sae",EVEX_Vplzcntd_xmm_k1z_xmmm128b32:3021,"3021":"EVEX_Vplzcntd_xmm_k1z_xmmm128b32",EVEX_Vplzcntd_ymm_k1z_ymmm256b32:3022,"3022":"EVEX_Vplzcntd_ymm_k1z_ymmm256b32",EVEX_Vplzcntd_zmm_k1z_zmmm512b32:3023,"3023":"EVEX_Vplzcntd_zmm_k1z_zmmm512b32",EVEX_Vplzcntq_xmm_k1z_xmmm128b64:3024,"3024":"EVEX_Vplzcntq_xmm_k1z_xmmm128b64",EVEX_Vplzcntq_ymm_k1z_ymmm256b64:3025,"3025":"EVEX_Vplzcntq_ymm_k1z_ymmm256b64",EVEX_Vplzcntq_zmm_k1z_zmmm512b64:3026,"3026":"EVEX_Vplzcntq_zmm_k1z_zmmm512b64",VEX_Vpsrlvd_xmm_xmm_xmmm128:3027,"3027":"VEX_Vpsrlvd_xmm_xmm_xmmm128",VEX_Vpsrlvd_ymm_ymm_ymmm256:3028,"3028":"VEX_Vpsrlvd_ymm_ymm_ymmm256",VEX_Vpsrlvq_xmm_xmm_xmmm128:3029,"3029":"VEX_Vpsrlvq_xmm_xmm_xmmm128",VEX_Vpsrlvq_ymm_ymm_ymmm256:3030,"3030":"VEX_Vpsrlvq_ymm_ymm_ymmm256",EVEX_Vpsrlvd_xmm_k1z_xmm_xmmm128b32:3031,"3031":"EVEX_Vpsrlvd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpsrlvd_ymm_k1z_ymm_ymmm256b32:3032,"3032":"EVEX_Vpsrlvd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpsrlvd_zmm_k1z_zmm_zmmm512b32:3033,"3033":"EVEX_Vpsrlvd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpsrlvq_xmm_k1z_xmm_xmmm128b64:3034,"3034":"EVEX_Vpsrlvq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpsrlvq_ymm_k1z_ymm_ymmm256b64:3035,"3035":"EVEX_Vpsrlvq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpsrlvq_zmm_k1z_zmm_zmmm512b64:3036,"3036":"EVEX_Vpsrlvq_zmm_k1z_zmm_zmmm512b64",VEX_Vpsravd_xmm_xmm_xmmm128:3037,"3037":"VEX_Vpsravd_xmm_xmm_xmmm128",VEX_Vpsravd_ymm_ymm_ymmm256:3038,"3038":"VEX_Vpsravd_ymm_ymm_ymmm256",EVEX_Vpsravd_xmm_k1z_xmm_xmmm128b32:3039,"3039":"EVEX_Vpsravd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpsravd_ymm_k1z_ymm_ymmm256b32:3040,"3040":"EVEX_Vpsravd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpsravd_zmm_k1z_zmm_zmmm512b32:3041,"3041":"EVEX_Vpsravd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpsravq_xmm_k1z_xmm_xmmm128b64:3042,"3042":"EVEX_Vpsravq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpsravq_ymm_k1z_ymm_ymmm256b64:3043,"3043":"EVEX_Vpsravq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpsravq_zmm_k1z_zmm_zmmm512b64:3044,"3044":"EVEX_Vpsravq_zmm_k1z_zmm_zmmm512b64",VEX_Vpsllvd_xmm_xmm_xmmm128:3045,"3045":"VEX_Vpsllvd_xmm_xmm_xmmm128",VEX_Vpsllvd_ymm_ymm_ymmm256:3046,"3046":"VEX_Vpsllvd_ymm_ymm_ymmm256",VEX_Vpsllvq_xmm_xmm_xmmm128:3047,"3047":"VEX_Vpsllvq_xmm_xmm_xmmm128",VEX_Vpsllvq_ymm_ymm_ymmm256:3048,"3048":"VEX_Vpsllvq_ymm_ymm_ymmm256",EVEX_Vpsllvd_xmm_k1z_xmm_xmmm128b32:3049,"3049":"EVEX_Vpsllvd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpsllvd_ymm_k1z_ymm_ymmm256b32:3050,"3050":"EVEX_Vpsllvd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpsllvd_zmm_k1z_zmm_zmmm512b32:3051,"3051":"EVEX_Vpsllvd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpsllvq_xmm_k1z_xmm_xmmm128b64:3052,"3052":"EVEX_Vpsllvq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpsllvq_ymm_k1z_ymm_ymmm256b64:3053,"3053":"EVEX_Vpsllvq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpsllvq_zmm_k1z_zmm_zmmm512b64:3054,"3054":"EVEX_Vpsllvq_zmm_k1z_zmm_zmmm512b64",EVEX_Vrcp14ps_xmm_k1z_xmmm128b32:3055,"3055":"EVEX_Vrcp14ps_xmm_k1z_xmmm128b32",EVEX_Vrcp14ps_ymm_k1z_ymmm256b32:3056,"3056":"EVEX_Vrcp14ps_ymm_k1z_ymmm256b32",EVEX_Vrcp14ps_zmm_k1z_zmmm512b32:3057,"3057":"EVEX_Vrcp14ps_zmm_k1z_zmmm512b32",EVEX_Vrcp14pd_xmm_k1z_xmmm128b64:3058,"3058":"EVEX_Vrcp14pd_xmm_k1z_xmmm128b64",EVEX_Vrcp14pd_ymm_k1z_ymmm256b64:3059,"3059":"EVEX_Vrcp14pd_ymm_k1z_ymmm256b64",EVEX_Vrcp14pd_zmm_k1z_zmmm512b64:3060,"3060":"EVEX_Vrcp14pd_zmm_k1z_zmmm512b64",EVEX_Vrcp14ss_xmm_k1z_xmm_xmmm32:3061,"3061":"EVEX_Vrcp14ss_xmm_k1z_xmm_xmmm32",EVEX_Vrcp14sd_xmm_k1z_xmm_xmmm64:3062,"3062":"EVEX_Vrcp14sd_xmm_k1z_xmm_xmmm64",EVEX_Vrsqrt14ps_xmm_k1z_xmmm128b32:3063,"3063":"EVEX_Vrsqrt14ps_xmm_k1z_xmmm128b32",EVEX_Vrsqrt14ps_ymm_k1z_ymmm256b32:3064,"3064":"EVEX_Vrsqrt14ps_ymm_k1z_ymmm256b32",EVEX_Vrsqrt14ps_zmm_k1z_zmmm512b32:3065,"3065":"EVEX_Vrsqrt14ps_zmm_k1z_zmmm512b32",EVEX_Vrsqrt14pd_xmm_k1z_xmmm128b64:3066,"3066":"EVEX_Vrsqrt14pd_xmm_k1z_xmmm128b64",EVEX_Vrsqrt14pd_ymm_k1z_ymmm256b64:3067,"3067":"EVEX_Vrsqrt14pd_ymm_k1z_ymmm256b64",EVEX_Vrsqrt14pd_zmm_k1z_zmmm512b64:3068,"3068":"EVEX_Vrsqrt14pd_zmm_k1z_zmmm512b64",EVEX_Vrsqrt14ss_xmm_k1z_xmm_xmmm32:3069,"3069":"EVEX_Vrsqrt14ss_xmm_k1z_xmm_xmmm32",EVEX_Vrsqrt14sd_xmm_k1z_xmm_xmmm64:3070,"3070":"EVEX_Vrsqrt14sd_xmm_k1z_xmm_xmmm64",EVEX_Vpdpbusd_xmm_k1z_xmm_xmmm128b32:3071,"3071":"EVEX_Vpdpbusd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpdpbusd_ymm_k1z_ymm_ymmm256b32:3072,"3072":"EVEX_Vpdpbusd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpdpbusd_zmm_k1z_zmm_zmmm512b32:3073,"3073":"EVEX_Vpdpbusd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpdpbusds_xmm_k1z_xmm_xmmm128b32:3074,"3074":"EVEX_Vpdpbusds_xmm_k1z_xmm_xmmm128b32",EVEX_Vpdpbusds_ymm_k1z_ymm_ymmm256b32:3075,"3075":"EVEX_Vpdpbusds_ymm_k1z_ymm_ymmm256b32",EVEX_Vpdpbusds_zmm_k1z_zmm_zmmm512b32:3076,"3076":"EVEX_Vpdpbusds_zmm_k1z_zmm_zmmm512b32",EVEX_Vpdpwssd_xmm_k1z_xmm_xmmm128b32:3077,"3077":"EVEX_Vpdpwssd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpdpwssd_ymm_k1z_ymm_ymmm256b32:3078,"3078":"EVEX_Vpdpwssd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpdpwssd_zmm_k1z_zmm_zmmm512b32:3079,"3079":"EVEX_Vpdpwssd_zmm_k1z_zmm_zmmm512b32",EVEX_Vdpbf16ps_xmm_k1z_xmm_xmmm128b32:3080,"3080":"EVEX_Vdpbf16ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vdpbf16ps_ymm_k1z_ymm_ymmm256b32:3081,"3081":"EVEX_Vdpbf16ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vdpbf16ps_zmm_k1z_zmm_zmmm512b32:3082,"3082":"EVEX_Vdpbf16ps_zmm_k1z_zmm_zmmm512b32",EVEX_Vp4dpwssd_zmm_k1z_zmmp3_m128:3083,"3083":"EVEX_Vp4dpwssd_zmm_k1z_zmmp3_m128",EVEX_Vpdpwssds_xmm_k1z_xmm_xmmm128b32:3084,"3084":"EVEX_Vpdpwssds_xmm_k1z_xmm_xmmm128b32",EVEX_Vpdpwssds_ymm_k1z_ymm_ymmm256b32:3085,"3085":"EVEX_Vpdpwssds_ymm_k1z_ymm_ymmm256b32",EVEX_Vpdpwssds_zmm_k1z_zmm_zmmm512b32:3086,"3086":"EVEX_Vpdpwssds_zmm_k1z_zmm_zmmm512b32",EVEX_Vp4dpwssds_zmm_k1z_zmmp3_m128:3087,"3087":"EVEX_Vp4dpwssds_zmm_k1z_zmmp3_m128",EVEX_Vpopcntb_xmm_k1z_xmmm128:3088,"3088":"EVEX_Vpopcntb_xmm_k1z_xmmm128",EVEX_Vpopcntb_ymm_k1z_ymmm256:3089,"3089":"EVEX_Vpopcntb_ymm_k1z_ymmm256",EVEX_Vpopcntb_zmm_k1z_zmmm512:3090,"3090":"EVEX_Vpopcntb_zmm_k1z_zmmm512",EVEX_Vpopcntw_xmm_k1z_xmmm128:3091,"3091":"EVEX_Vpopcntw_xmm_k1z_xmmm128",EVEX_Vpopcntw_ymm_k1z_ymmm256:3092,"3092":"EVEX_Vpopcntw_ymm_k1z_ymmm256",EVEX_Vpopcntw_zmm_k1z_zmmm512:3093,"3093":"EVEX_Vpopcntw_zmm_k1z_zmmm512",EVEX_Vpopcntd_xmm_k1z_xmmm128b32:3094,"3094":"EVEX_Vpopcntd_xmm_k1z_xmmm128b32",EVEX_Vpopcntd_ymm_k1z_ymmm256b32:3095,"3095":"EVEX_Vpopcntd_ymm_k1z_ymmm256b32",EVEX_Vpopcntd_zmm_k1z_zmmm512b32:3096,"3096":"EVEX_Vpopcntd_zmm_k1z_zmmm512b32",EVEX_Vpopcntq_xmm_k1z_xmmm128b64:3097,"3097":"EVEX_Vpopcntq_xmm_k1z_xmmm128b64",EVEX_Vpopcntq_ymm_k1z_ymmm256b64:3098,"3098":"EVEX_Vpopcntq_ymm_k1z_ymmm256b64",EVEX_Vpopcntq_zmm_k1z_zmmm512b64:3099,"3099":"EVEX_Vpopcntq_zmm_k1z_zmmm512b64",VEX_Vpbroadcastd_xmm_xmmm32:3100,"3100":"VEX_Vpbroadcastd_xmm_xmmm32",VEX_Vpbroadcastd_ymm_xmmm32:3101,"3101":"VEX_Vpbroadcastd_ymm_xmmm32",EVEX_Vpbroadcastd_xmm_k1z_xmmm32:3102,"3102":"EVEX_Vpbroadcastd_xmm_k1z_xmmm32",EVEX_Vpbroadcastd_ymm_k1z_xmmm32:3103,"3103":"EVEX_Vpbroadcastd_ymm_k1z_xmmm32",EVEX_Vpbroadcastd_zmm_k1z_xmmm32:3104,"3104":"EVEX_Vpbroadcastd_zmm_k1z_xmmm32",VEX_Vpbroadcastq_xmm_xmmm64:3105,"3105":"VEX_Vpbroadcastq_xmm_xmmm64",VEX_Vpbroadcastq_ymm_xmmm64:3106,"3106":"VEX_Vpbroadcastq_ymm_xmmm64",EVEX_Vbroadcasti32x2_xmm_k1z_xmmm64:3107,"3107":"EVEX_Vbroadcasti32x2_xmm_k1z_xmmm64",EVEX_Vbroadcasti32x2_ymm_k1z_xmmm64:3108,"3108":"EVEX_Vbroadcasti32x2_ymm_k1z_xmmm64",EVEX_Vbroadcasti32x2_zmm_k1z_xmmm64:3109,"3109":"EVEX_Vbroadcasti32x2_zmm_k1z_xmmm64",EVEX_Vpbroadcastq_xmm_k1z_xmmm64:3110,"3110":"EVEX_Vpbroadcastq_xmm_k1z_xmmm64",EVEX_Vpbroadcastq_ymm_k1z_xmmm64:3111,"3111":"EVEX_Vpbroadcastq_ymm_k1z_xmmm64",EVEX_Vpbroadcastq_zmm_k1z_xmmm64:3112,"3112":"EVEX_Vpbroadcastq_zmm_k1z_xmmm64",VEX_Vbroadcasti128_ymm_m128:3113,"3113":"VEX_Vbroadcasti128_ymm_m128",EVEX_Vbroadcasti32x4_ymm_k1z_m128:3114,"3114":"EVEX_Vbroadcasti32x4_ymm_k1z_m128",EVEX_Vbroadcasti32x4_zmm_k1z_m128:3115,"3115":"EVEX_Vbroadcasti32x4_zmm_k1z_m128",EVEX_Vbroadcasti64x2_ymm_k1z_m128:3116,"3116":"EVEX_Vbroadcasti64x2_ymm_k1z_m128",EVEX_Vbroadcasti64x2_zmm_k1z_m128:3117,"3117":"EVEX_Vbroadcasti64x2_zmm_k1z_m128",EVEX_Vbroadcasti32x8_zmm_k1z_m256:3118,"3118":"EVEX_Vbroadcasti32x8_zmm_k1z_m256",EVEX_Vbroadcasti64x4_zmm_k1z_m256:3119,"3119":"EVEX_Vbroadcasti64x4_zmm_k1z_m256",EVEX_Vpexpandb_xmm_k1z_xmmm128:3120,"3120":"EVEX_Vpexpandb_xmm_k1z_xmmm128",EVEX_Vpexpandb_ymm_k1z_ymmm256:3121,"3121":"EVEX_Vpexpandb_ymm_k1z_ymmm256",EVEX_Vpexpandb_zmm_k1z_zmmm512:3122,"3122":"EVEX_Vpexpandb_zmm_k1z_zmmm512",EVEX_Vpexpandw_xmm_k1z_xmmm128:3123,"3123":"EVEX_Vpexpandw_xmm_k1z_xmmm128",EVEX_Vpexpandw_ymm_k1z_ymmm256:3124,"3124":"EVEX_Vpexpandw_ymm_k1z_ymmm256",EVEX_Vpexpandw_zmm_k1z_zmmm512:3125,"3125":"EVEX_Vpexpandw_zmm_k1z_zmmm512",EVEX_Vpcompressb_xmmm128_k1z_xmm:3126,"3126":"EVEX_Vpcompressb_xmmm128_k1z_xmm",EVEX_Vpcompressb_ymmm256_k1z_ymm:3127,"3127":"EVEX_Vpcompressb_ymmm256_k1z_ymm",EVEX_Vpcompressb_zmmm512_k1z_zmm:3128,"3128":"EVEX_Vpcompressb_zmmm512_k1z_zmm",EVEX_Vpcompressw_xmmm128_k1z_xmm:3129,"3129":"EVEX_Vpcompressw_xmmm128_k1z_xmm",EVEX_Vpcompressw_ymmm256_k1z_ymm:3130,"3130":"EVEX_Vpcompressw_ymmm256_k1z_ymm",EVEX_Vpcompressw_zmmm512_k1z_zmm:3131,"3131":"EVEX_Vpcompressw_zmmm512_k1z_zmm",EVEX_Vpblendmd_xmm_k1z_xmm_xmmm128b32:3132,"3132":"EVEX_Vpblendmd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpblendmd_ymm_k1z_ymm_ymmm256b32:3133,"3133":"EVEX_Vpblendmd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpblendmd_zmm_k1z_zmm_zmmm512b32:3134,"3134":"EVEX_Vpblendmd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpblendmq_xmm_k1z_xmm_xmmm128b64:3135,"3135":"EVEX_Vpblendmq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpblendmq_ymm_k1z_ymm_ymmm256b64:3136,"3136":"EVEX_Vpblendmq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpblendmq_zmm_k1z_zmm_zmmm512b64:3137,"3137":"EVEX_Vpblendmq_zmm_k1z_zmm_zmmm512b64",EVEX_Vblendmps_xmm_k1z_xmm_xmmm128b32:3138,"3138":"EVEX_Vblendmps_xmm_k1z_xmm_xmmm128b32",EVEX_Vblendmps_ymm_k1z_ymm_ymmm256b32:3139,"3139":"EVEX_Vblendmps_ymm_k1z_ymm_ymmm256b32",EVEX_Vblendmps_zmm_k1z_zmm_zmmm512b32:3140,"3140":"EVEX_Vblendmps_zmm_k1z_zmm_zmmm512b32",EVEX_Vblendmpd_xmm_k1z_xmm_xmmm128b64:3141,"3141":"EVEX_Vblendmpd_xmm_k1z_xmm_xmmm128b64",EVEX_Vblendmpd_ymm_k1z_ymm_ymmm256b64:3142,"3142":"EVEX_Vblendmpd_ymm_k1z_ymm_ymmm256b64",EVEX_Vblendmpd_zmm_k1z_zmm_zmmm512b64:3143,"3143":"EVEX_Vblendmpd_zmm_k1z_zmm_zmmm512b64",EVEX_Vpblendmb_xmm_k1z_xmm_xmmm128:3144,"3144":"EVEX_Vpblendmb_xmm_k1z_xmm_xmmm128",EVEX_Vpblendmb_ymm_k1z_ymm_ymmm256:3145,"3145":"EVEX_Vpblendmb_ymm_k1z_ymm_ymmm256",EVEX_Vpblendmb_zmm_k1z_zmm_zmmm512:3146,"3146":"EVEX_Vpblendmb_zmm_k1z_zmm_zmmm512",EVEX_Vpblendmw_xmm_k1z_xmm_xmmm128:3147,"3147":"EVEX_Vpblendmw_xmm_k1z_xmm_xmmm128",EVEX_Vpblendmw_ymm_k1z_ymm_ymmm256:3148,"3148":"EVEX_Vpblendmw_ymm_k1z_ymm_ymmm256",EVEX_Vpblendmw_zmm_k1z_zmm_zmmm512:3149,"3149":"EVEX_Vpblendmw_zmm_k1z_zmm_zmmm512",EVEX_Vp2intersectd_kp1_xmm_xmmm128b32:3150,"3150":"EVEX_Vp2intersectd_kp1_xmm_xmmm128b32",EVEX_Vp2intersectd_kp1_ymm_ymmm256b32:3151,"3151":"EVEX_Vp2intersectd_kp1_ymm_ymmm256b32",EVEX_Vp2intersectd_kp1_zmm_zmmm512b32:3152,"3152":"EVEX_Vp2intersectd_kp1_zmm_zmmm512b32",EVEX_Vp2intersectq_kp1_xmm_xmmm128b64:3153,"3153":"EVEX_Vp2intersectq_kp1_xmm_xmmm128b64",EVEX_Vp2intersectq_kp1_ymm_ymmm256b64:3154,"3154":"EVEX_Vp2intersectq_kp1_ymm_ymmm256b64",EVEX_Vp2intersectq_kp1_zmm_zmmm512b64:3155,"3155":"EVEX_Vp2intersectq_kp1_zmm_zmmm512b64",EVEX_Vpshldvw_xmm_k1z_xmm_xmmm128:3156,"3156":"EVEX_Vpshldvw_xmm_k1z_xmm_xmmm128",EVEX_Vpshldvw_ymm_k1z_ymm_ymmm256:3157,"3157":"EVEX_Vpshldvw_ymm_k1z_ymm_ymmm256",EVEX_Vpshldvw_zmm_k1z_zmm_zmmm512:3158,"3158":"EVEX_Vpshldvw_zmm_k1z_zmm_zmmm512",EVEX_Vpshldvd_xmm_k1z_xmm_xmmm128b32:3159,"3159":"EVEX_Vpshldvd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpshldvd_ymm_k1z_ymm_ymmm256b32:3160,"3160":"EVEX_Vpshldvd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpshldvd_zmm_k1z_zmm_zmmm512b32:3161,"3161":"EVEX_Vpshldvd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpshldvq_xmm_k1z_xmm_xmmm128b64:3162,"3162":"EVEX_Vpshldvq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpshldvq_ymm_k1z_ymm_ymmm256b64:3163,"3163":"EVEX_Vpshldvq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpshldvq_zmm_k1z_zmm_zmmm512b64:3164,"3164":"EVEX_Vpshldvq_zmm_k1z_zmm_zmmm512b64",EVEX_Vpshrdvw_xmm_k1z_xmm_xmmm128:3165,"3165":"EVEX_Vpshrdvw_xmm_k1z_xmm_xmmm128",EVEX_Vpshrdvw_ymm_k1z_ymm_ymmm256:3166,"3166":"EVEX_Vpshrdvw_ymm_k1z_ymm_ymmm256",EVEX_Vpshrdvw_zmm_k1z_zmm_zmmm512:3167,"3167":"EVEX_Vpshrdvw_zmm_k1z_zmm_zmmm512",EVEX_Vcvtneps2bf16_xmm_k1z_xmmm128b32:3168,"3168":"EVEX_Vcvtneps2bf16_xmm_k1z_xmmm128b32",EVEX_Vcvtneps2bf16_xmm_k1z_ymmm256b32:3169,"3169":"EVEX_Vcvtneps2bf16_xmm_k1z_ymmm256b32",EVEX_Vcvtneps2bf16_ymm_k1z_zmmm512b32:3170,"3170":"EVEX_Vcvtneps2bf16_ymm_k1z_zmmm512b32",EVEX_Vcvtne2ps2bf16_xmm_k1z_xmm_xmmm128b32:3171,"3171":"EVEX_Vcvtne2ps2bf16_xmm_k1z_xmm_xmmm128b32",EVEX_Vcvtne2ps2bf16_ymm_k1z_ymm_ymmm256b32:3172,"3172":"EVEX_Vcvtne2ps2bf16_ymm_k1z_ymm_ymmm256b32",EVEX_Vcvtne2ps2bf16_zmm_k1z_zmm_zmmm512b32:3173,"3173":"EVEX_Vcvtne2ps2bf16_zmm_k1z_zmm_zmmm512b32",EVEX_Vpshrdvd_xmm_k1z_xmm_xmmm128b32:3174,"3174":"EVEX_Vpshrdvd_xmm_k1z_xmm_xmmm128b32",EVEX_Vpshrdvd_ymm_k1z_ymm_ymmm256b32:3175,"3175":"EVEX_Vpshrdvd_ymm_k1z_ymm_ymmm256b32",EVEX_Vpshrdvd_zmm_k1z_zmm_zmmm512b32:3176,"3176":"EVEX_Vpshrdvd_zmm_k1z_zmm_zmmm512b32",EVEX_Vpshrdvq_xmm_k1z_xmm_xmmm128b64:3177,"3177":"EVEX_Vpshrdvq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpshrdvq_ymm_k1z_ymm_ymmm256b64:3178,"3178":"EVEX_Vpshrdvq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpshrdvq_zmm_k1z_zmm_zmmm512b64:3179,"3179":"EVEX_Vpshrdvq_zmm_k1z_zmm_zmmm512b64",EVEX_Vpermi2b_xmm_k1z_xmm_xmmm128:3180,"3180":"EVEX_Vpermi2b_xmm_k1z_xmm_xmmm128",EVEX_Vpermi2b_ymm_k1z_ymm_ymmm256:3181,"3181":"EVEX_Vpermi2b_ymm_k1z_ymm_ymmm256",EVEX_Vpermi2b_zmm_k1z_zmm_zmmm512:3182,"3182":"EVEX_Vpermi2b_zmm_k1z_zmm_zmmm512",EVEX_Vpermi2w_xmm_k1z_xmm_xmmm128:3183,"3183":"EVEX_Vpermi2w_xmm_k1z_xmm_xmmm128",EVEX_Vpermi2w_ymm_k1z_ymm_ymmm256:3184,"3184":"EVEX_Vpermi2w_ymm_k1z_ymm_ymmm256",EVEX_Vpermi2w_zmm_k1z_zmm_zmmm512:3185,"3185":"EVEX_Vpermi2w_zmm_k1z_zmm_zmmm512",EVEX_Vpermi2d_xmm_k1z_xmm_xmmm128b32:3186,"3186":"EVEX_Vpermi2d_xmm_k1z_xmm_xmmm128b32",EVEX_Vpermi2d_ymm_k1z_ymm_ymmm256b32:3187,"3187":"EVEX_Vpermi2d_ymm_k1z_ymm_ymmm256b32",EVEX_Vpermi2d_zmm_k1z_zmm_zmmm512b32:3188,"3188":"EVEX_Vpermi2d_zmm_k1z_zmm_zmmm512b32",EVEX_Vpermi2q_xmm_k1z_xmm_xmmm128b64:3189,"3189":"EVEX_Vpermi2q_xmm_k1z_xmm_xmmm128b64",EVEX_Vpermi2q_ymm_k1z_ymm_ymmm256b64:3190,"3190":"EVEX_Vpermi2q_ymm_k1z_ymm_ymmm256b64",EVEX_Vpermi2q_zmm_k1z_zmm_zmmm512b64:3191,"3191":"EVEX_Vpermi2q_zmm_k1z_zmm_zmmm512b64",EVEX_Vpermi2ps_xmm_k1z_xmm_xmmm128b32:3192,"3192":"EVEX_Vpermi2ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vpermi2ps_ymm_k1z_ymm_ymmm256b32:3193,"3193":"EVEX_Vpermi2ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vpermi2ps_zmm_k1z_zmm_zmmm512b32:3194,"3194":"EVEX_Vpermi2ps_zmm_k1z_zmm_zmmm512b32",EVEX_Vpermi2pd_xmm_k1z_xmm_xmmm128b64:3195,"3195":"EVEX_Vpermi2pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vpermi2pd_ymm_k1z_ymm_ymmm256b64:3196,"3196":"EVEX_Vpermi2pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vpermi2pd_zmm_k1z_zmm_zmmm512b64:3197,"3197":"EVEX_Vpermi2pd_zmm_k1z_zmm_zmmm512b64",VEX_Vpbroadcastb_xmm_xmmm8:3198,"3198":"VEX_Vpbroadcastb_xmm_xmmm8",VEX_Vpbroadcastb_ymm_xmmm8:3199,"3199":"VEX_Vpbroadcastb_ymm_xmmm8",EVEX_Vpbroadcastb_xmm_k1z_xmmm8:3200,"3200":"EVEX_Vpbroadcastb_xmm_k1z_xmmm8",EVEX_Vpbroadcastb_ymm_k1z_xmmm8:3201,"3201":"EVEX_Vpbroadcastb_ymm_k1z_xmmm8",EVEX_Vpbroadcastb_zmm_k1z_xmmm8:3202,"3202":"EVEX_Vpbroadcastb_zmm_k1z_xmmm8",VEX_Vpbroadcastw_xmm_xmmm16:3203,"3203":"VEX_Vpbroadcastw_xmm_xmmm16",VEX_Vpbroadcastw_ymm_xmmm16:3204,"3204":"VEX_Vpbroadcastw_ymm_xmmm16",EVEX_Vpbroadcastw_xmm_k1z_xmmm16:3205,"3205":"EVEX_Vpbroadcastw_xmm_k1z_xmmm16",EVEX_Vpbroadcastw_ymm_k1z_xmmm16:3206,"3206":"EVEX_Vpbroadcastw_ymm_k1z_xmmm16",EVEX_Vpbroadcastw_zmm_k1z_xmmm16:3207,"3207":"EVEX_Vpbroadcastw_zmm_k1z_xmmm16",EVEX_Vpbroadcastb_xmm_k1z_r32:3208,"3208":"EVEX_Vpbroadcastb_xmm_k1z_r32",EVEX_Vpbroadcastb_ymm_k1z_r32:3209,"3209":"EVEX_Vpbroadcastb_ymm_k1z_r32",EVEX_Vpbroadcastb_zmm_k1z_r32:3210,"3210":"EVEX_Vpbroadcastb_zmm_k1z_r32",EVEX_Vpbroadcastw_xmm_k1z_r32:3211,"3211":"EVEX_Vpbroadcastw_xmm_k1z_r32",EVEX_Vpbroadcastw_ymm_k1z_r32:3212,"3212":"EVEX_Vpbroadcastw_ymm_k1z_r32",EVEX_Vpbroadcastw_zmm_k1z_r32:3213,"3213":"EVEX_Vpbroadcastw_zmm_k1z_r32",EVEX_Vpbroadcastd_xmm_k1z_r32:3214,"3214":"EVEX_Vpbroadcastd_xmm_k1z_r32",EVEX_Vpbroadcastd_ymm_k1z_r32:3215,"3215":"EVEX_Vpbroadcastd_ymm_k1z_r32",EVEX_Vpbroadcastd_zmm_k1z_r32:3216,"3216":"EVEX_Vpbroadcastd_zmm_k1z_r32",EVEX_Vpbroadcastq_xmm_k1z_r64:3217,"3217":"EVEX_Vpbroadcastq_xmm_k1z_r64",EVEX_Vpbroadcastq_ymm_k1z_r64:3218,"3218":"EVEX_Vpbroadcastq_ymm_k1z_r64",EVEX_Vpbroadcastq_zmm_k1z_r64:3219,"3219":"EVEX_Vpbroadcastq_zmm_k1z_r64",EVEX_Vpermt2b_xmm_k1z_xmm_xmmm128:3220,"3220":"EVEX_Vpermt2b_xmm_k1z_xmm_xmmm128",EVEX_Vpermt2b_ymm_k1z_ymm_ymmm256:3221,"3221":"EVEX_Vpermt2b_ymm_k1z_ymm_ymmm256",EVEX_Vpermt2b_zmm_k1z_zmm_zmmm512:3222,"3222":"EVEX_Vpermt2b_zmm_k1z_zmm_zmmm512",EVEX_Vpermt2w_xmm_k1z_xmm_xmmm128:3223,"3223":"EVEX_Vpermt2w_xmm_k1z_xmm_xmmm128",EVEX_Vpermt2w_ymm_k1z_ymm_ymmm256:3224,"3224":"EVEX_Vpermt2w_ymm_k1z_ymm_ymmm256",EVEX_Vpermt2w_zmm_k1z_zmm_zmmm512:3225,"3225":"EVEX_Vpermt2w_zmm_k1z_zmm_zmmm512",EVEX_Vpermt2d_xmm_k1z_xmm_xmmm128b32:3226,"3226":"EVEX_Vpermt2d_xmm_k1z_xmm_xmmm128b32",EVEX_Vpermt2d_ymm_k1z_ymm_ymmm256b32:3227,"3227":"EVEX_Vpermt2d_ymm_k1z_ymm_ymmm256b32",EVEX_Vpermt2d_zmm_k1z_zmm_zmmm512b32:3228,"3228":"EVEX_Vpermt2d_zmm_k1z_zmm_zmmm512b32",EVEX_Vpermt2q_xmm_k1z_xmm_xmmm128b64:3229,"3229":"EVEX_Vpermt2q_xmm_k1z_xmm_xmmm128b64",EVEX_Vpermt2q_ymm_k1z_ymm_ymmm256b64:3230,"3230":"EVEX_Vpermt2q_ymm_k1z_ymm_ymmm256b64",EVEX_Vpermt2q_zmm_k1z_zmm_zmmm512b64:3231,"3231":"EVEX_Vpermt2q_zmm_k1z_zmm_zmmm512b64",EVEX_Vpermt2ps_xmm_k1z_xmm_xmmm128b32:3232,"3232":"EVEX_Vpermt2ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vpermt2ps_ymm_k1z_ymm_ymmm256b32:3233,"3233":"EVEX_Vpermt2ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vpermt2ps_zmm_k1z_zmm_zmmm512b32:3234,"3234":"EVEX_Vpermt2ps_zmm_k1z_zmm_zmmm512b32",EVEX_Vpermt2pd_xmm_k1z_xmm_xmmm128b64:3235,"3235":"EVEX_Vpermt2pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vpermt2pd_ymm_k1z_ymm_ymmm256b64:3236,"3236":"EVEX_Vpermt2pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vpermt2pd_zmm_k1z_zmm_zmmm512b64:3237,"3237":"EVEX_Vpermt2pd_zmm_k1z_zmm_zmmm512b64",Invept_r32_m128:3238,"3238":"Invept_r32_m128",Invept_r64_m128:3239,"3239":"Invept_r64_m128",Invvpid_r32_m128:3240,"3240":"Invvpid_r32_m128",Invvpid_r64_m128:3241,"3241":"Invvpid_r64_m128",Invpcid_r32_m128:3242,"3242":"Invpcid_r32_m128",Invpcid_r64_m128:3243,"3243":"Invpcid_r64_m128",EVEX_Vpmultishiftqb_xmm_k1z_xmm_xmmm128b64:3244,"3244":"EVEX_Vpmultishiftqb_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmultishiftqb_ymm_k1z_ymm_ymmm256b64:3245,"3245":"EVEX_Vpmultishiftqb_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmultishiftqb_zmm_k1z_zmm_zmmm512b64:3246,"3246":"EVEX_Vpmultishiftqb_zmm_k1z_zmm_zmmm512b64",EVEX_Vexpandps_xmm_k1z_xmmm128:3247,"3247":"EVEX_Vexpandps_xmm_k1z_xmmm128",EVEX_Vexpandps_ymm_k1z_ymmm256:3248,"3248":"EVEX_Vexpandps_ymm_k1z_ymmm256",EVEX_Vexpandps_zmm_k1z_zmmm512:3249,"3249":"EVEX_Vexpandps_zmm_k1z_zmmm512",EVEX_Vexpandpd_xmm_k1z_xmmm128:3250,"3250":"EVEX_Vexpandpd_xmm_k1z_xmmm128",EVEX_Vexpandpd_ymm_k1z_ymmm256:3251,"3251":"EVEX_Vexpandpd_ymm_k1z_ymmm256",EVEX_Vexpandpd_zmm_k1z_zmmm512:3252,"3252":"EVEX_Vexpandpd_zmm_k1z_zmmm512",EVEX_Vpexpandd_xmm_k1z_xmmm128:3253,"3253":"EVEX_Vpexpandd_xmm_k1z_xmmm128",EVEX_Vpexpandd_ymm_k1z_ymmm256:3254,"3254":"EVEX_Vpexpandd_ymm_k1z_ymmm256",EVEX_Vpexpandd_zmm_k1z_zmmm512:3255,"3255":"EVEX_Vpexpandd_zmm_k1z_zmmm512",EVEX_Vpexpandq_xmm_k1z_xmmm128:3256,"3256":"EVEX_Vpexpandq_xmm_k1z_xmmm128",EVEX_Vpexpandq_ymm_k1z_ymmm256:3257,"3257":"EVEX_Vpexpandq_ymm_k1z_ymmm256",EVEX_Vpexpandq_zmm_k1z_zmmm512:3258,"3258":"EVEX_Vpexpandq_zmm_k1z_zmmm512",EVEX_Vcompressps_xmmm128_k1z_xmm:3259,"3259":"EVEX_Vcompressps_xmmm128_k1z_xmm",EVEX_Vcompressps_ymmm256_k1z_ymm:3260,"3260":"EVEX_Vcompressps_ymmm256_k1z_ymm",EVEX_Vcompressps_zmmm512_k1z_zmm:3261,"3261":"EVEX_Vcompressps_zmmm512_k1z_zmm",EVEX_Vcompresspd_xmmm128_k1z_xmm:3262,"3262":"EVEX_Vcompresspd_xmmm128_k1z_xmm",EVEX_Vcompresspd_ymmm256_k1z_ymm:3263,"3263":"EVEX_Vcompresspd_ymmm256_k1z_ymm",EVEX_Vcompresspd_zmmm512_k1z_zmm:3264,"3264":"EVEX_Vcompresspd_zmmm512_k1z_zmm",EVEX_Vpcompressd_xmmm128_k1z_xmm:3265,"3265":"EVEX_Vpcompressd_xmmm128_k1z_xmm",EVEX_Vpcompressd_ymmm256_k1z_ymm:3266,"3266":"EVEX_Vpcompressd_ymmm256_k1z_ymm",EVEX_Vpcompressd_zmmm512_k1z_zmm:3267,"3267":"EVEX_Vpcompressd_zmmm512_k1z_zmm",EVEX_Vpcompressq_xmmm128_k1z_xmm:3268,"3268":"EVEX_Vpcompressq_xmmm128_k1z_xmm",EVEX_Vpcompressq_ymmm256_k1z_ymm:3269,"3269":"EVEX_Vpcompressq_ymmm256_k1z_ymm",EVEX_Vpcompressq_zmmm512_k1z_zmm:3270,"3270":"EVEX_Vpcompressq_zmmm512_k1z_zmm",VEX_Vpmaskmovd_xmm_xmm_m128:3271,"3271":"VEX_Vpmaskmovd_xmm_xmm_m128",VEX_Vpmaskmovd_ymm_ymm_m256:3272,"3272":"VEX_Vpmaskmovd_ymm_ymm_m256",VEX_Vpmaskmovq_xmm_xmm_m128:3273,"3273":"VEX_Vpmaskmovq_xmm_xmm_m128",VEX_Vpmaskmovq_ymm_ymm_m256:3274,"3274":"VEX_Vpmaskmovq_ymm_ymm_m256",EVEX_Vpermb_xmm_k1z_xmm_xmmm128:3275,"3275":"EVEX_Vpermb_xmm_k1z_xmm_xmmm128",EVEX_Vpermb_ymm_k1z_ymm_ymmm256:3276,"3276":"EVEX_Vpermb_ymm_k1z_ymm_ymmm256",EVEX_Vpermb_zmm_k1z_zmm_zmmm512:3277,"3277":"EVEX_Vpermb_zmm_k1z_zmm_zmmm512",EVEX_Vpermw_xmm_k1z_xmm_xmmm128:3278,"3278":"EVEX_Vpermw_xmm_k1z_xmm_xmmm128",EVEX_Vpermw_ymm_k1z_ymm_ymmm256:3279,"3279":"EVEX_Vpermw_ymm_k1z_ymm_ymmm256",EVEX_Vpermw_zmm_k1z_zmm_zmmm512:3280,"3280":"EVEX_Vpermw_zmm_k1z_zmm_zmmm512",VEX_Vpmaskmovd_m128_xmm_xmm:3281,"3281":"VEX_Vpmaskmovd_m128_xmm_xmm",VEX_Vpmaskmovd_m256_ymm_ymm:3282,"3282":"VEX_Vpmaskmovd_m256_ymm_ymm",VEX_Vpmaskmovq_m128_xmm_xmm:3283,"3283":"VEX_Vpmaskmovq_m128_xmm_xmm",VEX_Vpmaskmovq_m256_ymm_ymm:3284,"3284":"VEX_Vpmaskmovq_m256_ymm_ymm",EVEX_Vpshufbitqmb_kr_k1_xmm_xmmm128:3285,"3285":"EVEX_Vpshufbitqmb_kr_k1_xmm_xmmm128",EVEX_Vpshufbitqmb_kr_k1_ymm_ymmm256:3286,"3286":"EVEX_Vpshufbitqmb_kr_k1_ymm_ymmm256",EVEX_Vpshufbitqmb_kr_k1_zmm_zmmm512:3287,"3287":"EVEX_Vpshufbitqmb_kr_k1_zmm_zmmm512",VEX_Vpgatherdd_xmm_vm32x_xmm:3288,"3288":"VEX_Vpgatherdd_xmm_vm32x_xmm",VEX_Vpgatherdd_ymm_vm32y_ymm:3289,"3289":"VEX_Vpgatherdd_ymm_vm32y_ymm",VEX_Vpgatherdq_xmm_vm32x_xmm:3290,"3290":"VEX_Vpgatherdq_xmm_vm32x_xmm",VEX_Vpgatherdq_ymm_vm32x_ymm:3291,"3291":"VEX_Vpgatherdq_ymm_vm32x_ymm",EVEX_Vpgatherdd_xmm_k1_vm32x:3292,"3292":"EVEX_Vpgatherdd_xmm_k1_vm32x",EVEX_Vpgatherdd_ymm_k1_vm32y:3293,"3293":"EVEX_Vpgatherdd_ymm_k1_vm32y",EVEX_Vpgatherdd_zmm_k1_vm32z:3294,"3294":"EVEX_Vpgatherdd_zmm_k1_vm32z",EVEX_Vpgatherdq_xmm_k1_vm32x:3295,"3295":"EVEX_Vpgatherdq_xmm_k1_vm32x",EVEX_Vpgatherdq_ymm_k1_vm32x:3296,"3296":"EVEX_Vpgatherdq_ymm_k1_vm32x",EVEX_Vpgatherdq_zmm_k1_vm32y:3297,"3297":"EVEX_Vpgatherdq_zmm_k1_vm32y",VEX_Vpgatherqd_xmm_vm64x_xmm:3298,"3298":"VEX_Vpgatherqd_xmm_vm64x_xmm",VEX_Vpgatherqd_xmm_vm64y_xmm:3299,"3299":"VEX_Vpgatherqd_xmm_vm64y_xmm",VEX_Vpgatherqq_xmm_vm64x_xmm:3300,"3300":"VEX_Vpgatherqq_xmm_vm64x_xmm",VEX_Vpgatherqq_ymm_vm64y_ymm:3301,"3301":"VEX_Vpgatherqq_ymm_vm64y_ymm",EVEX_Vpgatherqd_xmm_k1_vm64x:3302,"3302":"EVEX_Vpgatherqd_xmm_k1_vm64x",EVEX_Vpgatherqd_xmm_k1_vm64y:3303,"3303":"EVEX_Vpgatherqd_xmm_k1_vm64y",EVEX_Vpgatherqd_ymm_k1_vm64z:3304,"3304":"EVEX_Vpgatherqd_ymm_k1_vm64z",EVEX_Vpgatherqq_xmm_k1_vm64x:3305,"3305":"EVEX_Vpgatherqq_xmm_k1_vm64x",EVEX_Vpgatherqq_ymm_k1_vm64y:3306,"3306":"EVEX_Vpgatherqq_ymm_k1_vm64y",EVEX_Vpgatherqq_zmm_k1_vm64z:3307,"3307":"EVEX_Vpgatherqq_zmm_k1_vm64z",VEX_Vgatherdps_xmm_vm32x_xmm:3308,"3308":"VEX_Vgatherdps_xmm_vm32x_xmm",VEX_Vgatherdps_ymm_vm32y_ymm:3309,"3309":"VEX_Vgatherdps_ymm_vm32y_ymm",VEX_Vgatherdpd_xmm_vm32x_xmm:3310,"3310":"VEX_Vgatherdpd_xmm_vm32x_xmm",VEX_Vgatherdpd_ymm_vm32x_ymm:3311,"3311":"VEX_Vgatherdpd_ymm_vm32x_ymm",EVEX_Vgatherdps_xmm_k1_vm32x:3312,"3312":"EVEX_Vgatherdps_xmm_k1_vm32x",EVEX_Vgatherdps_ymm_k1_vm32y:3313,"3313":"EVEX_Vgatherdps_ymm_k1_vm32y",EVEX_Vgatherdps_zmm_k1_vm32z:3314,"3314":"EVEX_Vgatherdps_zmm_k1_vm32z",EVEX_Vgatherdpd_xmm_k1_vm32x:3315,"3315":"EVEX_Vgatherdpd_xmm_k1_vm32x",EVEX_Vgatherdpd_ymm_k1_vm32x:3316,"3316":"EVEX_Vgatherdpd_ymm_k1_vm32x",EVEX_Vgatherdpd_zmm_k1_vm32y:3317,"3317":"EVEX_Vgatherdpd_zmm_k1_vm32y",VEX_Vgatherqps_xmm_vm64x_xmm:3318,"3318":"VEX_Vgatherqps_xmm_vm64x_xmm",VEX_Vgatherqps_xmm_vm64y_xmm:3319,"3319":"VEX_Vgatherqps_xmm_vm64y_xmm",VEX_Vgatherqpd_xmm_vm64x_xmm:3320,"3320":"VEX_Vgatherqpd_xmm_vm64x_xmm",VEX_Vgatherqpd_ymm_vm64y_ymm:3321,"3321":"VEX_Vgatherqpd_ymm_vm64y_ymm",EVEX_Vgatherqps_xmm_k1_vm64x:3322,"3322":"EVEX_Vgatherqps_xmm_k1_vm64x",EVEX_Vgatherqps_xmm_k1_vm64y:3323,"3323":"EVEX_Vgatherqps_xmm_k1_vm64y",EVEX_Vgatherqps_ymm_k1_vm64z:3324,"3324":"EVEX_Vgatherqps_ymm_k1_vm64z",EVEX_Vgatherqpd_xmm_k1_vm64x:3325,"3325":"EVEX_Vgatherqpd_xmm_k1_vm64x",EVEX_Vgatherqpd_ymm_k1_vm64y:3326,"3326":"EVEX_Vgatherqpd_ymm_k1_vm64y",EVEX_Vgatherqpd_zmm_k1_vm64z:3327,"3327":"EVEX_Vgatherqpd_zmm_k1_vm64z",VEX_Vfmaddsub132ps_xmm_xmm_xmmm128:3328,"3328":"VEX_Vfmaddsub132ps_xmm_xmm_xmmm128",VEX_Vfmaddsub132ps_ymm_ymm_ymmm256:3329,"3329":"VEX_Vfmaddsub132ps_ymm_ymm_ymmm256",VEX_Vfmaddsub132pd_xmm_xmm_xmmm128:3330,"3330":"VEX_Vfmaddsub132pd_xmm_xmm_xmmm128",VEX_Vfmaddsub132pd_ymm_ymm_ymmm256:3331,"3331":"VEX_Vfmaddsub132pd_ymm_ymm_ymmm256",EVEX_Vfmaddsub132ps_xmm_k1z_xmm_xmmm128b32:3332,"3332":"EVEX_Vfmaddsub132ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmaddsub132ps_ymm_k1z_ymm_ymmm256b32:3333,"3333":"EVEX_Vfmaddsub132ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmaddsub132ps_zmm_k1z_zmm_zmmm512b32_er:3334,"3334":"EVEX_Vfmaddsub132ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmaddsub132pd_xmm_k1z_xmm_xmmm128b64:3335,"3335":"EVEX_Vfmaddsub132pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmaddsub132pd_ymm_k1z_ymm_ymmm256b64:3336,"3336":"EVEX_Vfmaddsub132pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmaddsub132pd_zmm_k1z_zmm_zmmm512b64_er:3337,"3337":"EVEX_Vfmaddsub132pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmsubadd132ps_xmm_xmm_xmmm128:3338,"3338":"VEX_Vfmsubadd132ps_xmm_xmm_xmmm128",VEX_Vfmsubadd132ps_ymm_ymm_ymmm256:3339,"3339":"VEX_Vfmsubadd132ps_ymm_ymm_ymmm256",VEX_Vfmsubadd132pd_xmm_xmm_xmmm128:3340,"3340":"VEX_Vfmsubadd132pd_xmm_xmm_xmmm128",VEX_Vfmsubadd132pd_ymm_ymm_ymmm256:3341,"3341":"VEX_Vfmsubadd132pd_ymm_ymm_ymmm256",EVEX_Vfmsubadd132ps_xmm_k1z_xmm_xmmm128b32:3342,"3342":"EVEX_Vfmsubadd132ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmsubadd132ps_ymm_k1z_ymm_ymmm256b32:3343,"3343":"EVEX_Vfmsubadd132ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmsubadd132ps_zmm_k1z_zmm_zmmm512b32_er:3344,"3344":"EVEX_Vfmsubadd132ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmsubadd132pd_xmm_k1z_xmm_xmmm128b64:3345,"3345":"EVEX_Vfmsubadd132pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmsubadd132pd_ymm_k1z_ymm_ymmm256b64:3346,"3346":"EVEX_Vfmsubadd132pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmsubadd132pd_zmm_k1z_zmm_zmmm512b64_er:3347,"3347":"EVEX_Vfmsubadd132pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmadd132ps_xmm_xmm_xmmm128:3348,"3348":"VEX_Vfmadd132ps_xmm_xmm_xmmm128",VEX_Vfmadd132ps_ymm_ymm_ymmm256:3349,"3349":"VEX_Vfmadd132ps_ymm_ymm_ymmm256",VEX_Vfmadd132pd_xmm_xmm_xmmm128:3350,"3350":"VEX_Vfmadd132pd_xmm_xmm_xmmm128",VEX_Vfmadd132pd_ymm_ymm_ymmm256:3351,"3351":"VEX_Vfmadd132pd_ymm_ymm_ymmm256",EVEX_Vfmadd132ps_xmm_k1z_xmm_xmmm128b32:3352,"3352":"EVEX_Vfmadd132ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmadd132ps_ymm_k1z_ymm_ymmm256b32:3353,"3353":"EVEX_Vfmadd132ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmadd132ps_zmm_k1z_zmm_zmmm512b32_er:3354,"3354":"EVEX_Vfmadd132ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmadd132pd_xmm_k1z_xmm_xmmm128b64:3355,"3355":"EVEX_Vfmadd132pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmadd132pd_ymm_k1z_ymm_ymmm256b64:3356,"3356":"EVEX_Vfmadd132pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmadd132pd_zmm_k1z_zmm_zmmm512b64_er:3357,"3357":"EVEX_Vfmadd132pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmadd132ss_xmm_xmm_xmmm32:3358,"3358":"VEX_Vfmadd132ss_xmm_xmm_xmmm32",VEX_Vfmadd132sd_xmm_xmm_xmmm64:3359,"3359":"VEX_Vfmadd132sd_xmm_xmm_xmmm64",EVEX_Vfmadd132ss_xmm_k1z_xmm_xmmm32_er:3360,"3360":"EVEX_Vfmadd132ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmadd132sd_xmm_k1z_xmm_xmmm64_er:3361,"3361":"EVEX_Vfmadd132sd_xmm_k1z_xmm_xmmm64_er",VEX_Vfmsub132ps_xmm_xmm_xmmm128:3362,"3362":"VEX_Vfmsub132ps_xmm_xmm_xmmm128",VEX_Vfmsub132ps_ymm_ymm_ymmm256:3363,"3363":"VEX_Vfmsub132ps_ymm_ymm_ymmm256",VEX_Vfmsub132pd_xmm_xmm_xmmm128:3364,"3364":"VEX_Vfmsub132pd_xmm_xmm_xmmm128",VEX_Vfmsub132pd_ymm_ymm_ymmm256:3365,"3365":"VEX_Vfmsub132pd_ymm_ymm_ymmm256",EVEX_Vfmsub132ps_xmm_k1z_xmm_xmmm128b32:3366,"3366":"EVEX_Vfmsub132ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmsub132ps_ymm_k1z_ymm_ymmm256b32:3367,"3367":"EVEX_Vfmsub132ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmsub132ps_zmm_k1z_zmm_zmmm512b32_er:3368,"3368":"EVEX_Vfmsub132ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmsub132pd_xmm_k1z_xmm_xmmm128b64:3369,"3369":"EVEX_Vfmsub132pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmsub132pd_ymm_k1z_ymm_ymmm256b64:3370,"3370":"EVEX_Vfmsub132pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmsub132pd_zmm_k1z_zmm_zmmm512b64_er:3371,"3371":"EVEX_Vfmsub132pd_zmm_k1z_zmm_zmmm512b64_er",EVEX_V4fmaddps_zmm_k1z_zmmp3_m128:3372,"3372":"EVEX_V4fmaddps_zmm_k1z_zmmp3_m128",VEX_Vfmsub132ss_xmm_xmm_xmmm32:3373,"3373":"VEX_Vfmsub132ss_xmm_xmm_xmmm32",VEX_Vfmsub132sd_xmm_xmm_xmmm64:3374,"3374":"VEX_Vfmsub132sd_xmm_xmm_xmmm64",EVEX_Vfmsub132ss_xmm_k1z_xmm_xmmm32_er:3375,"3375":"EVEX_Vfmsub132ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmsub132sd_xmm_k1z_xmm_xmmm64_er:3376,"3376":"EVEX_Vfmsub132sd_xmm_k1z_xmm_xmmm64_er",EVEX_V4fmaddss_xmm_k1z_xmmp3_m128:3377,"3377":"EVEX_V4fmaddss_xmm_k1z_xmmp3_m128",VEX_Vfnmadd132ps_xmm_xmm_xmmm128:3378,"3378":"VEX_Vfnmadd132ps_xmm_xmm_xmmm128",VEX_Vfnmadd132ps_ymm_ymm_ymmm256:3379,"3379":"VEX_Vfnmadd132ps_ymm_ymm_ymmm256",VEX_Vfnmadd132pd_xmm_xmm_xmmm128:3380,"3380":"VEX_Vfnmadd132pd_xmm_xmm_xmmm128",VEX_Vfnmadd132pd_ymm_ymm_ymmm256:3381,"3381":"VEX_Vfnmadd132pd_ymm_ymm_ymmm256",EVEX_Vfnmadd132ps_xmm_k1z_xmm_xmmm128b32:3382,"3382":"EVEX_Vfnmadd132ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfnmadd132ps_ymm_k1z_ymm_ymmm256b32:3383,"3383":"EVEX_Vfnmadd132ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfnmadd132ps_zmm_k1z_zmm_zmmm512b32_er:3384,"3384":"EVEX_Vfnmadd132ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfnmadd132pd_xmm_k1z_xmm_xmmm128b64:3385,"3385":"EVEX_Vfnmadd132pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfnmadd132pd_ymm_k1z_ymm_ymmm256b64:3386,"3386":"EVEX_Vfnmadd132pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfnmadd132pd_zmm_k1z_zmm_zmmm512b64_er:3387,"3387":"EVEX_Vfnmadd132pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfnmadd132ss_xmm_xmm_xmmm32:3388,"3388":"VEX_Vfnmadd132ss_xmm_xmm_xmmm32",VEX_Vfnmadd132sd_xmm_xmm_xmmm64:3389,"3389":"VEX_Vfnmadd132sd_xmm_xmm_xmmm64",EVEX_Vfnmadd132ss_xmm_k1z_xmm_xmmm32_er:3390,"3390":"EVEX_Vfnmadd132ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfnmadd132sd_xmm_k1z_xmm_xmmm64_er:3391,"3391":"EVEX_Vfnmadd132sd_xmm_k1z_xmm_xmmm64_er",VEX_Vfnmsub132ps_xmm_xmm_xmmm128:3392,"3392":"VEX_Vfnmsub132ps_xmm_xmm_xmmm128",VEX_Vfnmsub132ps_ymm_ymm_ymmm256:3393,"3393":"VEX_Vfnmsub132ps_ymm_ymm_ymmm256",VEX_Vfnmsub132pd_xmm_xmm_xmmm128:3394,"3394":"VEX_Vfnmsub132pd_xmm_xmm_xmmm128",VEX_Vfnmsub132pd_ymm_ymm_ymmm256:3395,"3395":"VEX_Vfnmsub132pd_ymm_ymm_ymmm256",EVEX_Vfnmsub132ps_xmm_k1z_xmm_xmmm128b32:3396,"3396":"EVEX_Vfnmsub132ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfnmsub132ps_ymm_k1z_ymm_ymmm256b32:3397,"3397":"EVEX_Vfnmsub132ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfnmsub132ps_zmm_k1z_zmm_zmmm512b32_er:3398,"3398":"EVEX_Vfnmsub132ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfnmsub132pd_xmm_k1z_xmm_xmmm128b64:3399,"3399":"EVEX_Vfnmsub132pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfnmsub132pd_ymm_k1z_ymm_ymmm256b64:3400,"3400":"EVEX_Vfnmsub132pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfnmsub132pd_zmm_k1z_zmm_zmmm512b64_er:3401,"3401":"EVEX_Vfnmsub132pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfnmsub132ss_xmm_xmm_xmmm32:3402,"3402":"VEX_Vfnmsub132ss_xmm_xmm_xmmm32",VEX_Vfnmsub132sd_xmm_xmm_xmmm64:3403,"3403":"VEX_Vfnmsub132sd_xmm_xmm_xmmm64",EVEX_Vfnmsub132ss_xmm_k1z_xmm_xmmm32_er:3404,"3404":"EVEX_Vfnmsub132ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfnmsub132sd_xmm_k1z_xmm_xmmm64_er:3405,"3405":"EVEX_Vfnmsub132sd_xmm_k1z_xmm_xmmm64_er",EVEX_Vpscatterdd_vm32x_k1_xmm:3406,"3406":"EVEX_Vpscatterdd_vm32x_k1_xmm",EVEX_Vpscatterdd_vm32y_k1_ymm:3407,"3407":"EVEX_Vpscatterdd_vm32y_k1_ymm",EVEX_Vpscatterdd_vm32z_k1_zmm:3408,"3408":"EVEX_Vpscatterdd_vm32z_k1_zmm",EVEX_Vpscatterdq_vm32x_k1_xmm:3409,"3409":"EVEX_Vpscatterdq_vm32x_k1_xmm",EVEX_Vpscatterdq_vm32x_k1_ymm:3410,"3410":"EVEX_Vpscatterdq_vm32x_k1_ymm",EVEX_Vpscatterdq_vm32y_k1_zmm:3411,"3411":"EVEX_Vpscatterdq_vm32y_k1_zmm",EVEX_Vpscatterqd_vm64x_k1_xmm:3412,"3412":"EVEX_Vpscatterqd_vm64x_k1_xmm",EVEX_Vpscatterqd_vm64y_k1_xmm:3413,"3413":"EVEX_Vpscatterqd_vm64y_k1_xmm",EVEX_Vpscatterqd_vm64z_k1_ymm:3414,"3414":"EVEX_Vpscatterqd_vm64z_k1_ymm",EVEX_Vpscatterqq_vm64x_k1_xmm:3415,"3415":"EVEX_Vpscatterqq_vm64x_k1_xmm",EVEX_Vpscatterqq_vm64y_k1_ymm:3416,"3416":"EVEX_Vpscatterqq_vm64y_k1_ymm",EVEX_Vpscatterqq_vm64z_k1_zmm:3417,"3417":"EVEX_Vpscatterqq_vm64z_k1_zmm",EVEX_Vscatterdps_vm32x_k1_xmm:3418,"3418":"EVEX_Vscatterdps_vm32x_k1_xmm",EVEX_Vscatterdps_vm32y_k1_ymm:3419,"3419":"EVEX_Vscatterdps_vm32y_k1_ymm",EVEX_Vscatterdps_vm32z_k1_zmm:3420,"3420":"EVEX_Vscatterdps_vm32z_k1_zmm",EVEX_Vscatterdpd_vm32x_k1_xmm:3421,"3421":"EVEX_Vscatterdpd_vm32x_k1_xmm",EVEX_Vscatterdpd_vm32x_k1_ymm:3422,"3422":"EVEX_Vscatterdpd_vm32x_k1_ymm",EVEX_Vscatterdpd_vm32y_k1_zmm:3423,"3423":"EVEX_Vscatterdpd_vm32y_k1_zmm",EVEX_Vscatterqps_vm64x_k1_xmm:3424,"3424":"EVEX_Vscatterqps_vm64x_k1_xmm",EVEX_Vscatterqps_vm64y_k1_xmm:3425,"3425":"EVEX_Vscatterqps_vm64y_k1_xmm",EVEX_Vscatterqps_vm64z_k1_ymm:3426,"3426":"EVEX_Vscatterqps_vm64z_k1_ymm",EVEX_Vscatterqpd_vm64x_k1_xmm:3427,"3427":"EVEX_Vscatterqpd_vm64x_k1_xmm",EVEX_Vscatterqpd_vm64y_k1_ymm:3428,"3428":"EVEX_Vscatterqpd_vm64y_k1_ymm",EVEX_Vscatterqpd_vm64z_k1_zmm:3429,"3429":"EVEX_Vscatterqpd_vm64z_k1_zmm",VEX_Vfmaddsub213ps_xmm_xmm_xmmm128:3430,"3430":"VEX_Vfmaddsub213ps_xmm_xmm_xmmm128",VEX_Vfmaddsub213ps_ymm_ymm_ymmm256:3431,"3431":"VEX_Vfmaddsub213ps_ymm_ymm_ymmm256",VEX_Vfmaddsub213pd_xmm_xmm_xmmm128:3432,"3432":"VEX_Vfmaddsub213pd_xmm_xmm_xmmm128",VEX_Vfmaddsub213pd_ymm_ymm_ymmm256:3433,"3433":"VEX_Vfmaddsub213pd_ymm_ymm_ymmm256",EVEX_Vfmaddsub213ps_xmm_k1z_xmm_xmmm128b32:3434,"3434":"EVEX_Vfmaddsub213ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmaddsub213ps_ymm_k1z_ymm_ymmm256b32:3435,"3435":"EVEX_Vfmaddsub213ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmaddsub213ps_zmm_k1z_zmm_zmmm512b32_er:3436,"3436":"EVEX_Vfmaddsub213ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmaddsub213pd_xmm_k1z_xmm_xmmm128b64:3437,"3437":"EVEX_Vfmaddsub213pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmaddsub213pd_ymm_k1z_ymm_ymmm256b64:3438,"3438":"EVEX_Vfmaddsub213pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmaddsub213pd_zmm_k1z_zmm_zmmm512b64_er:3439,"3439":"EVEX_Vfmaddsub213pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmsubadd213ps_xmm_xmm_xmmm128:3440,"3440":"VEX_Vfmsubadd213ps_xmm_xmm_xmmm128",VEX_Vfmsubadd213ps_ymm_ymm_ymmm256:3441,"3441":"VEX_Vfmsubadd213ps_ymm_ymm_ymmm256",VEX_Vfmsubadd213pd_xmm_xmm_xmmm128:3442,"3442":"VEX_Vfmsubadd213pd_xmm_xmm_xmmm128",VEX_Vfmsubadd213pd_ymm_ymm_ymmm256:3443,"3443":"VEX_Vfmsubadd213pd_ymm_ymm_ymmm256",EVEX_Vfmsubadd213ps_xmm_k1z_xmm_xmmm128b32:3444,"3444":"EVEX_Vfmsubadd213ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmsubadd213ps_ymm_k1z_ymm_ymmm256b32:3445,"3445":"EVEX_Vfmsubadd213ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmsubadd213ps_zmm_k1z_zmm_zmmm512b32_er:3446,"3446":"EVEX_Vfmsubadd213ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmsubadd213pd_xmm_k1z_xmm_xmmm128b64:3447,"3447":"EVEX_Vfmsubadd213pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmsubadd213pd_ymm_k1z_ymm_ymmm256b64:3448,"3448":"EVEX_Vfmsubadd213pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmsubadd213pd_zmm_k1z_zmm_zmmm512b64_er:3449,"3449":"EVEX_Vfmsubadd213pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmadd213ps_xmm_xmm_xmmm128:3450,"3450":"VEX_Vfmadd213ps_xmm_xmm_xmmm128",VEX_Vfmadd213ps_ymm_ymm_ymmm256:3451,"3451":"VEX_Vfmadd213ps_ymm_ymm_ymmm256",VEX_Vfmadd213pd_xmm_xmm_xmmm128:3452,"3452":"VEX_Vfmadd213pd_xmm_xmm_xmmm128",VEX_Vfmadd213pd_ymm_ymm_ymmm256:3453,"3453":"VEX_Vfmadd213pd_ymm_ymm_ymmm256",EVEX_Vfmadd213ps_xmm_k1z_xmm_xmmm128b32:3454,"3454":"EVEX_Vfmadd213ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmadd213ps_ymm_k1z_ymm_ymmm256b32:3455,"3455":"EVEX_Vfmadd213ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmadd213ps_zmm_k1z_zmm_zmmm512b32_er:3456,"3456":"EVEX_Vfmadd213ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmadd213pd_xmm_k1z_xmm_xmmm128b64:3457,"3457":"EVEX_Vfmadd213pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmadd213pd_ymm_k1z_ymm_ymmm256b64:3458,"3458":"EVEX_Vfmadd213pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmadd213pd_zmm_k1z_zmm_zmmm512b64_er:3459,"3459":"EVEX_Vfmadd213pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmadd213ss_xmm_xmm_xmmm32:3460,"3460":"VEX_Vfmadd213ss_xmm_xmm_xmmm32",VEX_Vfmadd213sd_xmm_xmm_xmmm64:3461,"3461":"VEX_Vfmadd213sd_xmm_xmm_xmmm64",EVEX_Vfmadd213ss_xmm_k1z_xmm_xmmm32_er:3462,"3462":"EVEX_Vfmadd213ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmadd213sd_xmm_k1z_xmm_xmmm64_er:3463,"3463":"EVEX_Vfmadd213sd_xmm_k1z_xmm_xmmm64_er",VEX_Vfmsub213ps_xmm_xmm_xmmm128:3464,"3464":"VEX_Vfmsub213ps_xmm_xmm_xmmm128",VEX_Vfmsub213ps_ymm_ymm_ymmm256:3465,"3465":"VEX_Vfmsub213ps_ymm_ymm_ymmm256",VEX_Vfmsub213pd_xmm_xmm_xmmm128:3466,"3466":"VEX_Vfmsub213pd_xmm_xmm_xmmm128",VEX_Vfmsub213pd_ymm_ymm_ymmm256:3467,"3467":"VEX_Vfmsub213pd_ymm_ymm_ymmm256",EVEX_Vfmsub213ps_xmm_k1z_xmm_xmmm128b32:3468,"3468":"EVEX_Vfmsub213ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmsub213ps_ymm_k1z_ymm_ymmm256b32:3469,"3469":"EVEX_Vfmsub213ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmsub213ps_zmm_k1z_zmm_zmmm512b32_er:3470,"3470":"EVEX_Vfmsub213ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmsub213pd_xmm_k1z_xmm_xmmm128b64:3471,"3471":"EVEX_Vfmsub213pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmsub213pd_ymm_k1z_ymm_ymmm256b64:3472,"3472":"EVEX_Vfmsub213pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmsub213pd_zmm_k1z_zmm_zmmm512b64_er:3473,"3473":"EVEX_Vfmsub213pd_zmm_k1z_zmm_zmmm512b64_er",EVEX_V4fnmaddps_zmm_k1z_zmmp3_m128:3474,"3474":"EVEX_V4fnmaddps_zmm_k1z_zmmp3_m128",VEX_Vfmsub213ss_xmm_xmm_xmmm32:3475,"3475":"VEX_Vfmsub213ss_xmm_xmm_xmmm32",VEX_Vfmsub213sd_xmm_xmm_xmmm64:3476,"3476":"VEX_Vfmsub213sd_xmm_xmm_xmmm64",EVEX_Vfmsub213ss_xmm_k1z_xmm_xmmm32_er:3477,"3477":"EVEX_Vfmsub213ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmsub213sd_xmm_k1z_xmm_xmmm64_er:3478,"3478":"EVEX_Vfmsub213sd_xmm_k1z_xmm_xmmm64_er",EVEX_V4fnmaddss_xmm_k1z_xmmp3_m128:3479,"3479":"EVEX_V4fnmaddss_xmm_k1z_xmmp3_m128",VEX_Vfnmadd213ps_xmm_xmm_xmmm128:3480,"3480":"VEX_Vfnmadd213ps_xmm_xmm_xmmm128",VEX_Vfnmadd213ps_ymm_ymm_ymmm256:3481,"3481":"VEX_Vfnmadd213ps_ymm_ymm_ymmm256",VEX_Vfnmadd213pd_xmm_xmm_xmmm128:3482,"3482":"VEX_Vfnmadd213pd_xmm_xmm_xmmm128",VEX_Vfnmadd213pd_ymm_ymm_ymmm256:3483,"3483":"VEX_Vfnmadd213pd_ymm_ymm_ymmm256",EVEX_Vfnmadd213ps_xmm_k1z_xmm_xmmm128b32:3484,"3484":"EVEX_Vfnmadd213ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfnmadd213ps_ymm_k1z_ymm_ymmm256b32:3485,"3485":"EVEX_Vfnmadd213ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfnmadd213ps_zmm_k1z_zmm_zmmm512b32_er:3486,"3486":"EVEX_Vfnmadd213ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfnmadd213pd_xmm_k1z_xmm_xmmm128b64:3487,"3487":"EVEX_Vfnmadd213pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfnmadd213pd_ymm_k1z_ymm_ymmm256b64:3488,"3488":"EVEX_Vfnmadd213pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfnmadd213pd_zmm_k1z_zmm_zmmm512b64_er:3489,"3489":"EVEX_Vfnmadd213pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfnmadd213ss_xmm_xmm_xmmm32:3490,"3490":"VEX_Vfnmadd213ss_xmm_xmm_xmmm32",VEX_Vfnmadd213sd_xmm_xmm_xmmm64:3491,"3491":"VEX_Vfnmadd213sd_xmm_xmm_xmmm64",EVEX_Vfnmadd213ss_xmm_k1z_xmm_xmmm32_er:3492,"3492":"EVEX_Vfnmadd213ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfnmadd213sd_xmm_k1z_xmm_xmmm64_er:3493,"3493":"EVEX_Vfnmadd213sd_xmm_k1z_xmm_xmmm64_er",VEX_Vfnmsub213ps_xmm_xmm_xmmm128:3494,"3494":"VEX_Vfnmsub213ps_xmm_xmm_xmmm128",VEX_Vfnmsub213ps_ymm_ymm_ymmm256:3495,"3495":"VEX_Vfnmsub213ps_ymm_ymm_ymmm256",VEX_Vfnmsub213pd_xmm_xmm_xmmm128:3496,"3496":"VEX_Vfnmsub213pd_xmm_xmm_xmmm128",VEX_Vfnmsub213pd_ymm_ymm_ymmm256:3497,"3497":"VEX_Vfnmsub213pd_ymm_ymm_ymmm256",EVEX_Vfnmsub213ps_xmm_k1z_xmm_xmmm128b32:3498,"3498":"EVEX_Vfnmsub213ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfnmsub213ps_ymm_k1z_ymm_ymmm256b32:3499,"3499":"EVEX_Vfnmsub213ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfnmsub213ps_zmm_k1z_zmm_zmmm512b32_er:3500,"3500":"EVEX_Vfnmsub213ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfnmsub213pd_xmm_k1z_xmm_xmmm128b64:3501,"3501":"EVEX_Vfnmsub213pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfnmsub213pd_ymm_k1z_ymm_ymmm256b64:3502,"3502":"EVEX_Vfnmsub213pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfnmsub213pd_zmm_k1z_zmm_zmmm512b64_er:3503,"3503":"EVEX_Vfnmsub213pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfnmsub213ss_xmm_xmm_xmmm32:3504,"3504":"VEX_Vfnmsub213ss_xmm_xmm_xmmm32",VEX_Vfnmsub213sd_xmm_xmm_xmmm64:3505,"3505":"VEX_Vfnmsub213sd_xmm_xmm_xmmm64",EVEX_Vfnmsub213ss_xmm_k1z_xmm_xmmm32_er:3506,"3506":"EVEX_Vfnmsub213ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfnmsub213sd_xmm_k1z_xmm_xmmm64_er:3507,"3507":"EVEX_Vfnmsub213sd_xmm_k1z_xmm_xmmm64_er",EVEX_Vpmadd52luq_xmm_k1z_xmm_xmmm128b64:3508,"3508":"EVEX_Vpmadd52luq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmadd52luq_ymm_k1z_ymm_ymmm256b64:3509,"3509":"EVEX_Vpmadd52luq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmadd52luq_zmm_k1z_zmm_zmmm512b64:3510,"3510":"EVEX_Vpmadd52luq_zmm_k1z_zmm_zmmm512b64",EVEX_Vpmadd52huq_xmm_k1z_xmm_xmmm128b64:3511,"3511":"EVEX_Vpmadd52huq_xmm_k1z_xmm_xmmm128b64",EVEX_Vpmadd52huq_ymm_k1z_ymm_ymmm256b64:3512,"3512":"EVEX_Vpmadd52huq_ymm_k1z_ymm_ymmm256b64",EVEX_Vpmadd52huq_zmm_k1z_zmm_zmmm512b64:3513,"3513":"EVEX_Vpmadd52huq_zmm_k1z_zmm_zmmm512b64",VEX_Vfmaddsub231ps_xmm_xmm_xmmm128:3514,"3514":"VEX_Vfmaddsub231ps_xmm_xmm_xmmm128",VEX_Vfmaddsub231ps_ymm_ymm_ymmm256:3515,"3515":"VEX_Vfmaddsub231ps_ymm_ymm_ymmm256",VEX_Vfmaddsub231pd_xmm_xmm_xmmm128:3516,"3516":"VEX_Vfmaddsub231pd_xmm_xmm_xmmm128",VEX_Vfmaddsub231pd_ymm_ymm_ymmm256:3517,"3517":"VEX_Vfmaddsub231pd_ymm_ymm_ymmm256",EVEX_Vfmaddsub231ps_xmm_k1z_xmm_xmmm128b32:3518,"3518":"EVEX_Vfmaddsub231ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmaddsub231ps_ymm_k1z_ymm_ymmm256b32:3519,"3519":"EVEX_Vfmaddsub231ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmaddsub231ps_zmm_k1z_zmm_zmmm512b32_er:3520,"3520":"EVEX_Vfmaddsub231ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmaddsub231pd_xmm_k1z_xmm_xmmm128b64:3521,"3521":"EVEX_Vfmaddsub231pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmaddsub231pd_ymm_k1z_ymm_ymmm256b64:3522,"3522":"EVEX_Vfmaddsub231pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmaddsub231pd_zmm_k1z_zmm_zmmm512b64_er:3523,"3523":"EVEX_Vfmaddsub231pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmsubadd231ps_xmm_xmm_xmmm128:3524,"3524":"VEX_Vfmsubadd231ps_xmm_xmm_xmmm128",VEX_Vfmsubadd231ps_ymm_ymm_ymmm256:3525,"3525":"VEX_Vfmsubadd231ps_ymm_ymm_ymmm256",VEX_Vfmsubadd231pd_xmm_xmm_xmmm128:3526,"3526":"VEX_Vfmsubadd231pd_xmm_xmm_xmmm128",VEX_Vfmsubadd231pd_ymm_ymm_ymmm256:3527,"3527":"VEX_Vfmsubadd231pd_ymm_ymm_ymmm256",EVEX_Vfmsubadd231ps_xmm_k1z_xmm_xmmm128b32:3528,"3528":"EVEX_Vfmsubadd231ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmsubadd231ps_ymm_k1z_ymm_ymmm256b32:3529,"3529":"EVEX_Vfmsubadd231ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmsubadd231ps_zmm_k1z_zmm_zmmm512b32_er:3530,"3530":"EVEX_Vfmsubadd231ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmsubadd231pd_xmm_k1z_xmm_xmmm128b64:3531,"3531":"EVEX_Vfmsubadd231pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmsubadd231pd_ymm_k1z_ymm_ymmm256b64:3532,"3532":"EVEX_Vfmsubadd231pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmsubadd231pd_zmm_k1z_zmm_zmmm512b64_er:3533,"3533":"EVEX_Vfmsubadd231pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmadd231ps_xmm_xmm_xmmm128:3534,"3534":"VEX_Vfmadd231ps_xmm_xmm_xmmm128",VEX_Vfmadd231ps_ymm_ymm_ymmm256:3535,"3535":"VEX_Vfmadd231ps_ymm_ymm_ymmm256",VEX_Vfmadd231pd_xmm_xmm_xmmm128:3536,"3536":"VEX_Vfmadd231pd_xmm_xmm_xmmm128",VEX_Vfmadd231pd_ymm_ymm_ymmm256:3537,"3537":"VEX_Vfmadd231pd_ymm_ymm_ymmm256",EVEX_Vfmadd231ps_xmm_k1z_xmm_xmmm128b32:3538,"3538":"EVEX_Vfmadd231ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmadd231ps_ymm_k1z_ymm_ymmm256b32:3539,"3539":"EVEX_Vfmadd231ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmadd231ps_zmm_k1z_zmm_zmmm512b32_er:3540,"3540":"EVEX_Vfmadd231ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmadd231pd_xmm_k1z_xmm_xmmm128b64:3541,"3541":"EVEX_Vfmadd231pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmadd231pd_ymm_k1z_ymm_ymmm256b64:3542,"3542":"EVEX_Vfmadd231pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmadd231pd_zmm_k1z_zmm_zmmm512b64_er:3543,"3543":"EVEX_Vfmadd231pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmadd231ss_xmm_xmm_xmmm32:3544,"3544":"VEX_Vfmadd231ss_xmm_xmm_xmmm32",VEX_Vfmadd231sd_xmm_xmm_xmmm64:3545,"3545":"VEX_Vfmadd231sd_xmm_xmm_xmmm64",EVEX_Vfmadd231ss_xmm_k1z_xmm_xmmm32_er:3546,"3546":"EVEX_Vfmadd231ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmadd231sd_xmm_k1z_xmm_xmmm64_er:3547,"3547":"EVEX_Vfmadd231sd_xmm_k1z_xmm_xmmm64_er",VEX_Vfmsub231ps_xmm_xmm_xmmm128:3548,"3548":"VEX_Vfmsub231ps_xmm_xmm_xmmm128",VEX_Vfmsub231ps_ymm_ymm_ymmm256:3549,"3549":"VEX_Vfmsub231ps_ymm_ymm_ymmm256",VEX_Vfmsub231pd_xmm_xmm_xmmm128:3550,"3550":"VEX_Vfmsub231pd_xmm_xmm_xmmm128",VEX_Vfmsub231pd_ymm_ymm_ymmm256:3551,"3551":"VEX_Vfmsub231pd_ymm_ymm_ymmm256",EVEX_Vfmsub231ps_xmm_k1z_xmm_xmmm128b32:3552,"3552":"EVEX_Vfmsub231ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmsub231ps_ymm_k1z_ymm_ymmm256b32:3553,"3553":"EVEX_Vfmsub231ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmsub231ps_zmm_k1z_zmm_zmmm512b32_er:3554,"3554":"EVEX_Vfmsub231ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmsub231pd_xmm_k1z_xmm_xmmm128b64:3555,"3555":"EVEX_Vfmsub231pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfmsub231pd_ymm_k1z_ymm_ymmm256b64:3556,"3556":"EVEX_Vfmsub231pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfmsub231pd_zmm_k1z_zmm_zmmm512b64_er:3557,"3557":"EVEX_Vfmsub231pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfmsub231ss_xmm_xmm_xmmm32:3558,"3558":"VEX_Vfmsub231ss_xmm_xmm_xmmm32",VEX_Vfmsub231sd_xmm_xmm_xmmm64:3559,"3559":"VEX_Vfmsub231sd_xmm_xmm_xmmm64",EVEX_Vfmsub231ss_xmm_k1z_xmm_xmmm32_er:3560,"3560":"EVEX_Vfmsub231ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmsub231sd_xmm_k1z_xmm_xmmm64_er:3561,"3561":"EVEX_Vfmsub231sd_xmm_k1z_xmm_xmmm64_er",VEX_Vfnmadd231ps_xmm_xmm_xmmm128:3562,"3562":"VEX_Vfnmadd231ps_xmm_xmm_xmmm128",VEX_Vfnmadd231ps_ymm_ymm_ymmm256:3563,"3563":"VEX_Vfnmadd231ps_ymm_ymm_ymmm256",VEX_Vfnmadd231pd_xmm_xmm_xmmm128:3564,"3564":"VEX_Vfnmadd231pd_xmm_xmm_xmmm128",VEX_Vfnmadd231pd_ymm_ymm_ymmm256:3565,"3565":"VEX_Vfnmadd231pd_ymm_ymm_ymmm256",EVEX_Vfnmadd231ps_xmm_k1z_xmm_xmmm128b32:3566,"3566":"EVEX_Vfnmadd231ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfnmadd231ps_ymm_k1z_ymm_ymmm256b32:3567,"3567":"EVEX_Vfnmadd231ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfnmadd231ps_zmm_k1z_zmm_zmmm512b32_er:3568,"3568":"EVEX_Vfnmadd231ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfnmadd231pd_xmm_k1z_xmm_xmmm128b64:3569,"3569":"EVEX_Vfnmadd231pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfnmadd231pd_ymm_k1z_ymm_ymmm256b64:3570,"3570":"EVEX_Vfnmadd231pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfnmadd231pd_zmm_k1z_zmm_zmmm512b64_er:3571,"3571":"EVEX_Vfnmadd231pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfnmadd231ss_xmm_xmm_xmmm32:3572,"3572":"VEX_Vfnmadd231ss_xmm_xmm_xmmm32",VEX_Vfnmadd231sd_xmm_xmm_xmmm64:3573,"3573":"VEX_Vfnmadd231sd_xmm_xmm_xmmm64",EVEX_Vfnmadd231ss_xmm_k1z_xmm_xmmm32_er:3574,"3574":"EVEX_Vfnmadd231ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfnmadd231sd_xmm_k1z_xmm_xmmm64_er:3575,"3575":"EVEX_Vfnmadd231sd_xmm_k1z_xmm_xmmm64_er",VEX_Vfnmsub231ps_xmm_xmm_xmmm128:3576,"3576":"VEX_Vfnmsub231ps_xmm_xmm_xmmm128",VEX_Vfnmsub231ps_ymm_ymm_ymmm256:3577,"3577":"VEX_Vfnmsub231ps_ymm_ymm_ymmm256",VEX_Vfnmsub231pd_xmm_xmm_xmmm128:3578,"3578":"VEX_Vfnmsub231pd_xmm_xmm_xmmm128",VEX_Vfnmsub231pd_ymm_ymm_ymmm256:3579,"3579":"VEX_Vfnmsub231pd_ymm_ymm_ymmm256",EVEX_Vfnmsub231ps_xmm_k1z_xmm_xmmm128b32:3580,"3580":"EVEX_Vfnmsub231ps_xmm_k1z_xmm_xmmm128b32",EVEX_Vfnmsub231ps_ymm_k1z_ymm_ymmm256b32:3581,"3581":"EVEX_Vfnmsub231ps_ymm_k1z_ymm_ymmm256b32",EVEX_Vfnmsub231ps_zmm_k1z_zmm_zmmm512b32_er:3582,"3582":"EVEX_Vfnmsub231ps_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfnmsub231pd_xmm_k1z_xmm_xmmm128b64:3583,"3583":"EVEX_Vfnmsub231pd_xmm_k1z_xmm_xmmm128b64",EVEX_Vfnmsub231pd_ymm_k1z_ymm_ymmm256b64:3584,"3584":"EVEX_Vfnmsub231pd_ymm_k1z_ymm_ymmm256b64",EVEX_Vfnmsub231pd_zmm_k1z_zmm_zmmm512b64_er:3585,"3585":"EVEX_Vfnmsub231pd_zmm_k1z_zmm_zmmm512b64_er",VEX_Vfnmsub231ss_xmm_xmm_xmmm32:3586,"3586":"VEX_Vfnmsub231ss_xmm_xmm_xmmm32",VEX_Vfnmsub231sd_xmm_xmm_xmmm64:3587,"3587":"VEX_Vfnmsub231sd_xmm_xmm_xmmm64",EVEX_Vfnmsub231ss_xmm_k1z_xmm_xmmm32_er:3588,"3588":"EVEX_Vfnmsub231ss_xmm_k1z_xmm_xmmm32_er",EVEX_Vfnmsub231sd_xmm_k1z_xmm_xmmm64_er:3589,"3589":"EVEX_Vfnmsub231sd_xmm_k1z_xmm_xmmm64_er",EVEX_Vpconflictd_xmm_k1z_xmmm128b32:3590,"3590":"EVEX_Vpconflictd_xmm_k1z_xmmm128b32",EVEX_Vpconflictd_ymm_k1z_ymmm256b32:3591,"3591":"EVEX_Vpconflictd_ymm_k1z_ymmm256b32",EVEX_Vpconflictd_zmm_k1z_zmmm512b32:3592,"3592":"EVEX_Vpconflictd_zmm_k1z_zmmm512b32",EVEX_Vpconflictq_xmm_k1z_xmmm128b64:3593,"3593":"EVEX_Vpconflictq_xmm_k1z_xmmm128b64",EVEX_Vpconflictq_ymm_k1z_ymmm256b64:3594,"3594":"EVEX_Vpconflictq_ymm_k1z_ymmm256b64",EVEX_Vpconflictq_zmm_k1z_zmmm512b64:3595,"3595":"EVEX_Vpconflictq_zmm_k1z_zmmm512b64",EVEX_Vgatherpf0dps_vm32z_k1:3596,"3596":"EVEX_Vgatherpf0dps_vm32z_k1",EVEX_Vgatherpf0dpd_vm32y_k1:3597,"3597":"EVEX_Vgatherpf0dpd_vm32y_k1",EVEX_Vgatherpf1dps_vm32z_k1:3598,"3598":"EVEX_Vgatherpf1dps_vm32z_k1",EVEX_Vgatherpf1dpd_vm32y_k1:3599,"3599":"EVEX_Vgatherpf1dpd_vm32y_k1",EVEX_Vscatterpf0dps_vm32z_k1:3600,"3600":"EVEX_Vscatterpf0dps_vm32z_k1",EVEX_Vscatterpf0dpd_vm32y_k1:3601,"3601":"EVEX_Vscatterpf0dpd_vm32y_k1",EVEX_Vscatterpf1dps_vm32z_k1:3602,"3602":"EVEX_Vscatterpf1dps_vm32z_k1",EVEX_Vscatterpf1dpd_vm32y_k1:3603,"3603":"EVEX_Vscatterpf1dpd_vm32y_k1",EVEX_Vgatherpf0qps_vm64z_k1:3604,"3604":"EVEX_Vgatherpf0qps_vm64z_k1",EVEX_Vgatherpf0qpd_vm64z_k1:3605,"3605":"EVEX_Vgatherpf0qpd_vm64z_k1",EVEX_Vgatherpf1qps_vm64z_k1:3606,"3606":"EVEX_Vgatherpf1qps_vm64z_k1",EVEX_Vgatherpf1qpd_vm64z_k1:3607,"3607":"EVEX_Vgatherpf1qpd_vm64z_k1",EVEX_Vscatterpf0qps_vm64z_k1:3608,"3608":"EVEX_Vscatterpf0qps_vm64z_k1",EVEX_Vscatterpf0qpd_vm64z_k1:3609,"3609":"EVEX_Vscatterpf0qpd_vm64z_k1",EVEX_Vscatterpf1qps_vm64z_k1:3610,"3610":"EVEX_Vscatterpf1qps_vm64z_k1",EVEX_Vscatterpf1qpd_vm64z_k1:3611,"3611":"EVEX_Vscatterpf1qpd_vm64z_k1",Sha1nexte_xmm_xmmm128:3612,"3612":"Sha1nexte_xmm_xmmm128",EVEX_Vexp2ps_zmm_k1z_zmmm512b32_sae:3613,"3613":"EVEX_Vexp2ps_zmm_k1z_zmmm512b32_sae",EVEX_Vexp2pd_zmm_k1z_zmmm512b64_sae:3614,"3614":"EVEX_Vexp2pd_zmm_k1z_zmmm512b64_sae",Sha1msg1_xmm_xmmm128:3615,"3615":"Sha1msg1_xmm_xmmm128",Sha1msg2_xmm_xmmm128:3616,"3616":"Sha1msg2_xmm_xmmm128",EVEX_Vrcp28ps_zmm_k1z_zmmm512b32_sae:3617,"3617":"EVEX_Vrcp28ps_zmm_k1z_zmmm512b32_sae",EVEX_Vrcp28pd_zmm_k1z_zmmm512b64_sae:3618,"3618":"EVEX_Vrcp28pd_zmm_k1z_zmmm512b64_sae",Sha256rnds2_xmm_xmmm128:3619,"3619":"Sha256rnds2_xmm_xmmm128",EVEX_Vrcp28ss_xmm_k1z_xmm_xmmm32_sae:3620,"3620":"EVEX_Vrcp28ss_xmm_k1z_xmm_xmmm32_sae",EVEX_Vrcp28sd_xmm_k1z_xmm_xmmm64_sae:3621,"3621":"EVEX_Vrcp28sd_xmm_k1z_xmm_xmmm64_sae",Sha256msg1_xmm_xmmm128:3622,"3622":"Sha256msg1_xmm_xmmm128",EVEX_Vrsqrt28ps_zmm_k1z_zmmm512b32_sae:3623,"3623":"EVEX_Vrsqrt28ps_zmm_k1z_zmmm512b32_sae",EVEX_Vrsqrt28pd_zmm_k1z_zmmm512b64_sae:3624,"3624":"EVEX_Vrsqrt28pd_zmm_k1z_zmmm512b64_sae",Sha256msg2_xmm_xmmm128:3625,"3625":"Sha256msg2_xmm_xmmm128",EVEX_Vrsqrt28ss_xmm_k1z_xmm_xmmm32_sae:3626,"3626":"EVEX_Vrsqrt28ss_xmm_k1z_xmm_xmmm32_sae",EVEX_Vrsqrt28sd_xmm_k1z_xmm_xmmm64_sae:3627,"3627":"EVEX_Vrsqrt28sd_xmm_k1z_xmm_xmmm64_sae",Gf2p8mulb_xmm_xmmm128:3628,"3628":"Gf2p8mulb_xmm_xmmm128",VEX_Vgf2p8mulb_xmm_xmm_xmmm128:3629,"3629":"VEX_Vgf2p8mulb_xmm_xmm_xmmm128",VEX_Vgf2p8mulb_ymm_ymm_ymmm256:3630,"3630":"VEX_Vgf2p8mulb_ymm_ymm_ymmm256",EVEX_Vgf2p8mulb_xmm_k1z_xmm_xmmm128:3631,"3631":"EVEX_Vgf2p8mulb_xmm_k1z_xmm_xmmm128",EVEX_Vgf2p8mulb_ymm_k1z_ymm_ymmm256:3632,"3632":"EVEX_Vgf2p8mulb_ymm_k1z_ymm_ymmm256",EVEX_Vgf2p8mulb_zmm_k1z_zmm_zmmm512:3633,"3633":"EVEX_Vgf2p8mulb_zmm_k1z_zmm_zmmm512",Aesimc_xmm_xmmm128:3634,"3634":"Aesimc_xmm_xmmm128",VEX_Vaesimc_xmm_xmmm128:3635,"3635":"VEX_Vaesimc_xmm_xmmm128",Aesenc_xmm_xmmm128:3636,"3636":"Aesenc_xmm_xmmm128",VEX_Vaesenc_xmm_xmm_xmmm128:3637,"3637":"VEX_Vaesenc_xmm_xmm_xmmm128",VEX_Vaesenc_ymm_ymm_ymmm256:3638,"3638":"VEX_Vaesenc_ymm_ymm_ymmm256",EVEX_Vaesenc_xmm_xmm_xmmm128:3639,"3639":"EVEX_Vaesenc_xmm_xmm_xmmm128",EVEX_Vaesenc_ymm_ymm_ymmm256:3640,"3640":"EVEX_Vaesenc_ymm_ymm_ymmm256",EVEX_Vaesenc_zmm_zmm_zmmm512:3641,"3641":"EVEX_Vaesenc_zmm_zmm_zmmm512",Aesenclast_xmm_xmmm128:3642,"3642":"Aesenclast_xmm_xmmm128",VEX_Vaesenclast_xmm_xmm_xmmm128:3643,"3643":"VEX_Vaesenclast_xmm_xmm_xmmm128",VEX_Vaesenclast_ymm_ymm_ymmm256:3644,"3644":"VEX_Vaesenclast_ymm_ymm_ymmm256",EVEX_Vaesenclast_xmm_xmm_xmmm128:3645,"3645":"EVEX_Vaesenclast_xmm_xmm_xmmm128",EVEX_Vaesenclast_ymm_ymm_ymmm256:3646,"3646":"EVEX_Vaesenclast_ymm_ymm_ymmm256",EVEX_Vaesenclast_zmm_zmm_zmmm512:3647,"3647":"EVEX_Vaesenclast_zmm_zmm_zmmm512",Aesdec_xmm_xmmm128:3648,"3648":"Aesdec_xmm_xmmm128",VEX_Vaesdec_xmm_xmm_xmmm128:3649,"3649":"VEX_Vaesdec_xmm_xmm_xmmm128",VEX_Vaesdec_ymm_ymm_ymmm256:3650,"3650":"VEX_Vaesdec_ymm_ymm_ymmm256",EVEX_Vaesdec_xmm_xmm_xmmm128:3651,"3651":"EVEX_Vaesdec_xmm_xmm_xmmm128",EVEX_Vaesdec_ymm_ymm_ymmm256:3652,"3652":"EVEX_Vaesdec_ymm_ymm_ymmm256",EVEX_Vaesdec_zmm_zmm_zmmm512:3653,"3653":"EVEX_Vaesdec_zmm_zmm_zmmm512",Aesdeclast_xmm_xmmm128:3654,"3654":"Aesdeclast_xmm_xmmm128",VEX_Vaesdeclast_xmm_xmm_xmmm128:3655,"3655":"VEX_Vaesdeclast_xmm_xmm_xmmm128",VEX_Vaesdeclast_ymm_ymm_ymmm256:3656,"3656":"VEX_Vaesdeclast_ymm_ymm_ymmm256",EVEX_Vaesdeclast_xmm_xmm_xmmm128:3657,"3657":"EVEX_Vaesdeclast_xmm_xmm_xmmm128",EVEX_Vaesdeclast_ymm_ymm_ymmm256:3658,"3658":"EVEX_Vaesdeclast_ymm_ymm_ymmm256",EVEX_Vaesdeclast_zmm_zmm_zmmm512:3659,"3659":"EVEX_Vaesdeclast_zmm_zmm_zmmm512",Movbe_r16_m16:3660,"3660":"Movbe_r16_m16",Movbe_r32_m32:3661,"3661":"Movbe_r32_m32",Movbe_r64_m64:3662,"3662":"Movbe_r64_m64",Crc32_r32_rm8:3663,"3663":"Crc32_r32_rm8",Crc32_r64_rm8:3664,"3664":"Crc32_r64_rm8",Movbe_m16_r16:3665,"3665":"Movbe_m16_r16",Movbe_m32_r32:3666,"3666":"Movbe_m32_r32",Movbe_m64_r64:3667,"3667":"Movbe_m64_r64",Crc32_r32_rm16:3668,"3668":"Crc32_r32_rm16",Crc32_r32_rm32:3669,"3669":"Crc32_r32_rm32",Crc32_r64_rm64:3670,"3670":"Crc32_r64_rm64",VEX_Andn_r32_r32_rm32:3671,"3671":"VEX_Andn_r32_r32_rm32",VEX_Andn_r64_r64_rm64:3672,"3672":"VEX_Andn_r64_r64_rm64",VEX_Blsr_r32_rm32:3673,"3673":"VEX_Blsr_r32_rm32",VEX_Blsr_r64_rm64:3674,"3674":"VEX_Blsr_r64_rm64",VEX_Blsmsk_r32_rm32:3675,"3675":"VEX_Blsmsk_r32_rm32",VEX_Blsmsk_r64_rm64:3676,"3676":"VEX_Blsmsk_r64_rm64",VEX_Blsi_r32_rm32:3677,"3677":"VEX_Blsi_r32_rm32",VEX_Blsi_r64_rm64:3678,"3678":"VEX_Blsi_r64_rm64",VEX_Bzhi_r32_rm32_r32:3679,"3679":"VEX_Bzhi_r32_rm32_r32",VEX_Bzhi_r64_rm64_r64:3680,"3680":"VEX_Bzhi_r64_rm64_r64",Wrussd_m32_r32:3681,"3681":"Wrussd_m32_r32",Wrussq_m64_r64:3682,"3682":"Wrussq_m64_r64",VEX_Pext_r32_r32_rm32:3683,"3683":"VEX_Pext_r32_r32_rm32",VEX_Pext_r64_r64_rm64:3684,"3684":"VEX_Pext_r64_r64_rm64",VEX_Pdep_r32_r32_rm32:3685,"3685":"VEX_Pdep_r32_r32_rm32",VEX_Pdep_r64_r64_rm64:3686,"3686":"VEX_Pdep_r64_r64_rm64",Wrssd_m32_r32:3687,"3687":"Wrssd_m32_r32",Wrssq_m64_r64:3688,"3688":"Wrssq_m64_r64",Adcx_r32_rm32:3689,"3689":"Adcx_r32_rm32",Adcx_r64_rm64:3690,"3690":"Adcx_r64_rm64",Adox_r32_rm32:3691,"3691":"Adox_r32_rm32",Adox_r64_rm64:3692,"3692":"Adox_r64_rm64",VEX_Mulx_r32_r32_rm32:3693,"3693":"VEX_Mulx_r32_r32_rm32",VEX_Mulx_r64_r64_rm64:3694,"3694":"VEX_Mulx_r64_r64_rm64",VEX_Bextr_r32_rm32_r32:3695,"3695":"VEX_Bextr_r32_rm32_r32",VEX_Bextr_r64_rm64_r64:3696,"3696":"VEX_Bextr_r64_rm64_r64",VEX_Shlx_r32_rm32_r32:3697,"3697":"VEX_Shlx_r32_rm32_r32",VEX_Shlx_r64_rm64_r64:3698,"3698":"VEX_Shlx_r64_rm64_r64",VEX_Sarx_r32_rm32_r32:3699,"3699":"VEX_Sarx_r32_rm32_r32",VEX_Sarx_r64_rm64_r64:3700,"3700":"VEX_Sarx_r64_rm64_r64",VEX_Shrx_r32_rm32_r32:3701,"3701":"VEX_Shrx_r32_rm32_r32",VEX_Shrx_r64_rm64_r64:3702,"3702":"VEX_Shrx_r64_rm64_r64",Movdir64b_r16_m512:3703,"3703":"Movdir64b_r16_m512",Movdir64b_r32_m512:3704,"3704":"Movdir64b_r32_m512",Movdir64b_r64_m512:3705,"3705":"Movdir64b_r64_m512",Enqcmds_r16_m512:3706,"3706":"Enqcmds_r16_m512",Enqcmds_r32_m512:3707,"3707":"Enqcmds_r32_m512",Enqcmds_r64_m512:3708,"3708":"Enqcmds_r64_m512",Enqcmd_r16_m512:3709,"3709":"Enqcmd_r16_m512",Enqcmd_r32_m512:3710,"3710":"Enqcmd_r32_m512",Enqcmd_r64_m512:3711,"3711":"Enqcmd_r64_m512",Movdiri_m32_r32:3712,"3712":"Movdiri_m32_r32",Movdiri_m64_r64:3713,"3713":"Movdiri_m64_r64",VEX_Vpermq_ymm_ymmm256_imm8:3714,"3714":"VEX_Vpermq_ymm_ymmm256_imm8",EVEX_Vpermq_ymm_k1z_ymmm256b64_imm8:3715,"3715":"EVEX_Vpermq_ymm_k1z_ymmm256b64_imm8",EVEX_Vpermq_zmm_k1z_zmmm512b64_imm8:3716,"3716":"EVEX_Vpermq_zmm_k1z_zmmm512b64_imm8",VEX_Vpermpd_ymm_ymmm256_imm8:3717,"3717":"VEX_Vpermpd_ymm_ymmm256_imm8",EVEX_Vpermpd_ymm_k1z_ymmm256b64_imm8:3718,"3718":"EVEX_Vpermpd_ymm_k1z_ymmm256b64_imm8",EVEX_Vpermpd_zmm_k1z_zmmm512b64_imm8:3719,"3719":"EVEX_Vpermpd_zmm_k1z_zmmm512b64_imm8",VEX_Vpblendd_xmm_xmm_xmmm128_imm8:3720,"3720":"VEX_Vpblendd_xmm_xmm_xmmm128_imm8",VEX_Vpblendd_ymm_ymm_ymmm256_imm8:3721,"3721":"VEX_Vpblendd_ymm_ymm_ymmm256_imm8",EVEX_Valignd_xmm_k1z_xmm_xmmm128b32_imm8:3722,"3722":"EVEX_Valignd_xmm_k1z_xmm_xmmm128b32_imm8",EVEX_Valignd_ymm_k1z_ymm_ymmm256b32_imm8:3723,"3723":"EVEX_Valignd_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Valignd_zmm_k1z_zmm_zmmm512b32_imm8:3724,"3724":"EVEX_Valignd_zmm_k1z_zmm_zmmm512b32_imm8",EVEX_Valignq_xmm_k1z_xmm_xmmm128b64_imm8:3725,"3725":"EVEX_Valignq_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Valignq_ymm_k1z_ymm_ymmm256b64_imm8:3726,"3726":"EVEX_Valignq_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Valignq_zmm_k1z_zmm_zmmm512b64_imm8:3727,"3727":"EVEX_Valignq_zmm_k1z_zmm_zmmm512b64_imm8",VEX_Vpermilps_xmm_xmmm128_imm8:3728,"3728":"VEX_Vpermilps_xmm_xmmm128_imm8",VEX_Vpermilps_ymm_ymmm256_imm8:3729,"3729":"VEX_Vpermilps_ymm_ymmm256_imm8",EVEX_Vpermilps_xmm_k1z_xmmm128b32_imm8:3730,"3730":"EVEX_Vpermilps_xmm_k1z_xmmm128b32_imm8",EVEX_Vpermilps_ymm_k1z_ymmm256b32_imm8:3731,"3731":"EVEX_Vpermilps_ymm_k1z_ymmm256b32_imm8",EVEX_Vpermilps_zmm_k1z_zmmm512b32_imm8:3732,"3732":"EVEX_Vpermilps_zmm_k1z_zmmm512b32_imm8",VEX_Vpermilpd_xmm_xmmm128_imm8:3733,"3733":"VEX_Vpermilpd_xmm_xmmm128_imm8",VEX_Vpermilpd_ymm_ymmm256_imm8:3734,"3734":"VEX_Vpermilpd_ymm_ymmm256_imm8",EVEX_Vpermilpd_xmm_k1z_xmmm128b64_imm8:3735,"3735":"EVEX_Vpermilpd_xmm_k1z_xmmm128b64_imm8",EVEX_Vpermilpd_ymm_k1z_ymmm256b64_imm8:3736,"3736":"EVEX_Vpermilpd_ymm_k1z_ymmm256b64_imm8",EVEX_Vpermilpd_zmm_k1z_zmmm512b64_imm8:3737,"3737":"EVEX_Vpermilpd_zmm_k1z_zmmm512b64_imm8",VEX_Vperm2f128_ymm_ymm_ymmm256_imm8:3738,"3738":"VEX_Vperm2f128_ymm_ymm_ymmm256_imm8",Roundps_xmm_xmmm128_imm8:3739,"3739":"Roundps_xmm_xmmm128_imm8",VEX_Vroundps_xmm_xmmm128_imm8:3740,"3740":"VEX_Vroundps_xmm_xmmm128_imm8",VEX_Vroundps_ymm_ymmm256_imm8:3741,"3741":"VEX_Vroundps_ymm_ymmm256_imm8",EVEX_Vrndscaleps_xmm_k1z_xmmm128b32_imm8:3742,"3742":"EVEX_Vrndscaleps_xmm_k1z_xmmm128b32_imm8",EVEX_Vrndscaleps_ymm_k1z_ymmm256b32_imm8:3743,"3743":"EVEX_Vrndscaleps_ymm_k1z_ymmm256b32_imm8",EVEX_Vrndscaleps_zmm_k1z_zmmm512b32_imm8_sae:3744,"3744":"EVEX_Vrndscaleps_zmm_k1z_zmmm512b32_imm8_sae",Roundpd_xmm_xmmm128_imm8:3745,"3745":"Roundpd_xmm_xmmm128_imm8",VEX_Vroundpd_xmm_xmmm128_imm8:3746,"3746":"VEX_Vroundpd_xmm_xmmm128_imm8",VEX_Vroundpd_ymm_ymmm256_imm8:3747,"3747":"VEX_Vroundpd_ymm_ymmm256_imm8",EVEX_Vrndscalepd_xmm_k1z_xmmm128b64_imm8:3748,"3748":"EVEX_Vrndscalepd_xmm_k1z_xmmm128b64_imm8",EVEX_Vrndscalepd_ymm_k1z_ymmm256b64_imm8:3749,"3749":"EVEX_Vrndscalepd_ymm_k1z_ymmm256b64_imm8",EVEX_Vrndscalepd_zmm_k1z_zmmm512b64_imm8_sae:3750,"3750":"EVEX_Vrndscalepd_zmm_k1z_zmmm512b64_imm8_sae",Roundss_xmm_xmmm32_imm8:3751,"3751":"Roundss_xmm_xmmm32_imm8",VEX_Vroundss_xmm_xmm_xmmm32_imm8:3752,"3752":"VEX_Vroundss_xmm_xmm_xmmm32_imm8",EVEX_Vrndscaless_xmm_k1z_xmm_xmmm32_imm8_sae:3753,"3753":"EVEX_Vrndscaless_xmm_k1z_xmm_xmmm32_imm8_sae",Roundsd_xmm_xmmm64_imm8:3754,"3754":"Roundsd_xmm_xmmm64_imm8",VEX_Vroundsd_xmm_xmm_xmmm64_imm8:3755,"3755":"VEX_Vroundsd_xmm_xmm_xmmm64_imm8",EVEX_Vrndscalesd_xmm_k1z_xmm_xmmm64_imm8_sae:3756,"3756":"EVEX_Vrndscalesd_xmm_k1z_xmm_xmmm64_imm8_sae",Blendps_xmm_xmmm128_imm8:3757,"3757":"Blendps_xmm_xmmm128_imm8",VEX_Vblendps_xmm_xmm_xmmm128_imm8:3758,"3758":"VEX_Vblendps_xmm_xmm_xmmm128_imm8",VEX_Vblendps_ymm_ymm_ymmm256_imm8:3759,"3759":"VEX_Vblendps_ymm_ymm_ymmm256_imm8",Blendpd_xmm_xmmm128_imm8:3760,"3760":"Blendpd_xmm_xmmm128_imm8",VEX_Vblendpd_xmm_xmm_xmmm128_imm8:3761,"3761":"VEX_Vblendpd_xmm_xmm_xmmm128_imm8",VEX_Vblendpd_ymm_ymm_ymmm256_imm8:3762,"3762":"VEX_Vblendpd_ymm_ymm_ymmm256_imm8",Pblendw_xmm_xmmm128_imm8:3763,"3763":"Pblendw_xmm_xmmm128_imm8",VEX_Vpblendw_xmm_xmm_xmmm128_imm8:3764,"3764":"VEX_Vpblendw_xmm_xmm_xmmm128_imm8",VEX_Vpblendw_ymm_ymm_ymmm256_imm8:3765,"3765":"VEX_Vpblendw_ymm_ymm_ymmm256_imm8",Palignr_mm_mmm64_imm8:3766,"3766":"Palignr_mm_mmm64_imm8",Palignr_xmm_xmmm128_imm8:3767,"3767":"Palignr_xmm_xmmm128_imm8",VEX_Vpalignr_xmm_xmm_xmmm128_imm8:3768,"3768":"VEX_Vpalignr_xmm_xmm_xmmm128_imm8",VEX_Vpalignr_ymm_ymm_ymmm256_imm8:3769,"3769":"VEX_Vpalignr_ymm_ymm_ymmm256_imm8",EVEX_Vpalignr_xmm_k1z_xmm_xmmm128_imm8:3770,"3770":"EVEX_Vpalignr_xmm_k1z_xmm_xmmm128_imm8",EVEX_Vpalignr_ymm_k1z_ymm_ymmm256_imm8:3771,"3771":"EVEX_Vpalignr_ymm_k1z_ymm_ymmm256_imm8",EVEX_Vpalignr_zmm_k1z_zmm_zmmm512_imm8:3772,"3772":"EVEX_Vpalignr_zmm_k1z_zmm_zmmm512_imm8",Pextrb_r32m8_xmm_imm8:3773,"3773":"Pextrb_r32m8_xmm_imm8",Pextrb_r64m8_xmm_imm8:3774,"3774":"Pextrb_r64m8_xmm_imm8",VEX_Vpextrb_r32m8_xmm_imm8:3775,"3775":"VEX_Vpextrb_r32m8_xmm_imm8",VEX_Vpextrb_r64m8_xmm_imm8:3776,"3776":"VEX_Vpextrb_r64m8_xmm_imm8",EVEX_Vpextrb_r32m8_xmm_imm8:3777,"3777":"EVEX_Vpextrb_r32m8_xmm_imm8",EVEX_Vpextrb_r64m8_xmm_imm8:3778,"3778":"EVEX_Vpextrb_r64m8_xmm_imm8",Pextrw_r32m16_xmm_imm8:3779,"3779":"Pextrw_r32m16_xmm_imm8",Pextrw_r64m16_xmm_imm8:3780,"3780":"Pextrw_r64m16_xmm_imm8",VEX_Vpextrw_r32m16_xmm_imm8:3781,"3781":"VEX_Vpextrw_r32m16_xmm_imm8",VEX_Vpextrw_r64m16_xmm_imm8:3782,"3782":"VEX_Vpextrw_r64m16_xmm_imm8",EVEX_Vpextrw_r32m16_xmm_imm8:3783,"3783":"EVEX_Vpextrw_r32m16_xmm_imm8",EVEX_Vpextrw_r64m16_xmm_imm8:3784,"3784":"EVEX_Vpextrw_r64m16_xmm_imm8",Pextrd_rm32_xmm_imm8:3785,"3785":"Pextrd_rm32_xmm_imm8",Pextrq_rm64_xmm_imm8:3786,"3786":"Pextrq_rm64_xmm_imm8",VEX_Vpextrd_rm32_xmm_imm8:3787,"3787":"VEX_Vpextrd_rm32_xmm_imm8",VEX_Vpextrq_rm64_xmm_imm8:3788,"3788":"VEX_Vpextrq_rm64_xmm_imm8",EVEX_Vpextrd_rm32_xmm_imm8:3789,"3789":"EVEX_Vpextrd_rm32_xmm_imm8",EVEX_Vpextrq_rm64_xmm_imm8:3790,"3790":"EVEX_Vpextrq_rm64_xmm_imm8",Extractps_rm32_xmm_imm8:3791,"3791":"Extractps_rm32_xmm_imm8",Extractps_r64m32_xmm_imm8:3792,"3792":"Extractps_r64m32_xmm_imm8",VEX_Vextractps_rm32_xmm_imm8:3793,"3793":"VEX_Vextractps_rm32_xmm_imm8",VEX_Vextractps_r64m32_xmm_imm8:3794,"3794":"VEX_Vextractps_r64m32_xmm_imm8",EVEX_Vextractps_rm32_xmm_imm8:3795,"3795":"EVEX_Vextractps_rm32_xmm_imm8",EVEX_Vextractps_r64m32_xmm_imm8:3796,"3796":"EVEX_Vextractps_r64m32_xmm_imm8",VEX_Vinsertf128_ymm_ymm_xmmm128_imm8:3797,"3797":"VEX_Vinsertf128_ymm_ymm_xmmm128_imm8",EVEX_Vinsertf32x4_ymm_k1z_ymm_xmmm128_imm8:3798,"3798":"EVEX_Vinsertf32x4_ymm_k1z_ymm_xmmm128_imm8",EVEX_Vinsertf32x4_zmm_k1z_zmm_xmmm128_imm8:3799,"3799":"EVEX_Vinsertf32x4_zmm_k1z_zmm_xmmm128_imm8",EVEX_Vinsertf64x2_ymm_k1z_ymm_xmmm128_imm8:3800,"3800":"EVEX_Vinsertf64x2_ymm_k1z_ymm_xmmm128_imm8",EVEX_Vinsertf64x2_zmm_k1z_zmm_xmmm128_imm8:3801,"3801":"EVEX_Vinsertf64x2_zmm_k1z_zmm_xmmm128_imm8",VEX_Vextractf128_xmmm128_ymm_imm8:3802,"3802":"VEX_Vextractf128_xmmm128_ymm_imm8",EVEX_Vextractf32x4_xmmm128_k1z_ymm_imm8:3803,"3803":"EVEX_Vextractf32x4_xmmm128_k1z_ymm_imm8",EVEX_Vextractf32x4_xmmm128_k1z_zmm_imm8:3804,"3804":"EVEX_Vextractf32x4_xmmm128_k1z_zmm_imm8",EVEX_Vextractf64x2_xmmm128_k1z_ymm_imm8:3805,"3805":"EVEX_Vextractf64x2_xmmm128_k1z_ymm_imm8",EVEX_Vextractf64x2_xmmm128_k1z_zmm_imm8:3806,"3806":"EVEX_Vextractf64x2_xmmm128_k1z_zmm_imm8",EVEX_Vinsertf32x8_zmm_k1z_zmm_ymmm256_imm8:3807,"3807":"EVEX_Vinsertf32x8_zmm_k1z_zmm_ymmm256_imm8",EVEX_Vinsertf64x4_zmm_k1z_zmm_ymmm256_imm8:3808,"3808":"EVEX_Vinsertf64x4_zmm_k1z_zmm_ymmm256_imm8",EVEX_Vextractf32x8_ymmm256_k1z_zmm_imm8:3809,"3809":"EVEX_Vextractf32x8_ymmm256_k1z_zmm_imm8",EVEX_Vextractf64x4_ymmm256_k1z_zmm_imm8:3810,"3810":"EVEX_Vextractf64x4_ymmm256_k1z_zmm_imm8",VEX_Vcvtps2ph_xmmm64_xmm_imm8:3811,"3811":"VEX_Vcvtps2ph_xmmm64_xmm_imm8",VEX_Vcvtps2ph_xmmm128_ymm_imm8:3812,"3812":"VEX_Vcvtps2ph_xmmm128_ymm_imm8",EVEX_Vcvtps2ph_xmmm64_k1z_xmm_imm8:3813,"3813":"EVEX_Vcvtps2ph_xmmm64_k1z_xmm_imm8",EVEX_Vcvtps2ph_xmmm128_k1z_ymm_imm8:3814,"3814":"EVEX_Vcvtps2ph_xmmm128_k1z_ymm_imm8",EVEX_Vcvtps2ph_ymmm256_k1z_zmm_imm8_sae:3815,"3815":"EVEX_Vcvtps2ph_ymmm256_k1z_zmm_imm8_sae",EVEX_Vpcmpud_kr_k1_xmm_xmmm128b32_imm8:3816,"3816":"EVEX_Vpcmpud_kr_k1_xmm_xmmm128b32_imm8",EVEX_Vpcmpud_kr_k1_ymm_ymmm256b32_imm8:3817,"3817":"EVEX_Vpcmpud_kr_k1_ymm_ymmm256b32_imm8",EVEX_Vpcmpud_kr_k1_zmm_zmmm512b32_imm8:3818,"3818":"EVEX_Vpcmpud_kr_k1_zmm_zmmm512b32_imm8",EVEX_Vpcmpuq_kr_k1_xmm_xmmm128b64_imm8:3819,"3819":"EVEX_Vpcmpuq_kr_k1_xmm_xmmm128b64_imm8",EVEX_Vpcmpuq_kr_k1_ymm_ymmm256b64_imm8:3820,"3820":"EVEX_Vpcmpuq_kr_k1_ymm_ymmm256b64_imm8",EVEX_Vpcmpuq_kr_k1_zmm_zmmm512b64_imm8:3821,"3821":"EVEX_Vpcmpuq_kr_k1_zmm_zmmm512b64_imm8",EVEX_Vpcmpd_kr_k1_xmm_xmmm128b32_imm8:3822,"3822":"EVEX_Vpcmpd_kr_k1_xmm_xmmm128b32_imm8",EVEX_Vpcmpd_kr_k1_ymm_ymmm256b32_imm8:3823,"3823":"EVEX_Vpcmpd_kr_k1_ymm_ymmm256b32_imm8",EVEX_Vpcmpd_kr_k1_zmm_zmmm512b32_imm8:3824,"3824":"EVEX_Vpcmpd_kr_k1_zmm_zmmm512b32_imm8",EVEX_Vpcmpq_kr_k1_xmm_xmmm128b64_imm8:3825,"3825":"EVEX_Vpcmpq_kr_k1_xmm_xmmm128b64_imm8",EVEX_Vpcmpq_kr_k1_ymm_ymmm256b64_imm8:3826,"3826":"EVEX_Vpcmpq_kr_k1_ymm_ymmm256b64_imm8",EVEX_Vpcmpq_kr_k1_zmm_zmmm512b64_imm8:3827,"3827":"EVEX_Vpcmpq_kr_k1_zmm_zmmm512b64_imm8",Pinsrb_xmm_r32m8_imm8:3828,"3828":"Pinsrb_xmm_r32m8_imm8",Pinsrb_xmm_r64m8_imm8:3829,"3829":"Pinsrb_xmm_r64m8_imm8",VEX_Vpinsrb_xmm_xmm_r32m8_imm8:3830,"3830":"VEX_Vpinsrb_xmm_xmm_r32m8_imm8",VEX_Vpinsrb_xmm_xmm_r64m8_imm8:3831,"3831":"VEX_Vpinsrb_xmm_xmm_r64m8_imm8",EVEX_Vpinsrb_xmm_xmm_r32m8_imm8:3832,"3832":"EVEX_Vpinsrb_xmm_xmm_r32m8_imm8",EVEX_Vpinsrb_xmm_xmm_r64m8_imm8:3833,"3833":"EVEX_Vpinsrb_xmm_xmm_r64m8_imm8",Insertps_xmm_xmmm32_imm8:3834,"3834":"Insertps_xmm_xmmm32_imm8",VEX_Vinsertps_xmm_xmm_xmmm32_imm8:3835,"3835":"VEX_Vinsertps_xmm_xmm_xmmm32_imm8",EVEX_Vinsertps_xmm_xmm_xmmm32_imm8:3836,"3836":"EVEX_Vinsertps_xmm_xmm_xmmm32_imm8",Pinsrd_xmm_rm32_imm8:3837,"3837":"Pinsrd_xmm_rm32_imm8",Pinsrq_xmm_rm64_imm8:3838,"3838":"Pinsrq_xmm_rm64_imm8",VEX_Vpinsrd_xmm_xmm_rm32_imm8:3839,"3839":"VEX_Vpinsrd_xmm_xmm_rm32_imm8",VEX_Vpinsrq_xmm_xmm_rm64_imm8:3840,"3840":"VEX_Vpinsrq_xmm_xmm_rm64_imm8",EVEX_Vpinsrd_xmm_xmm_rm32_imm8:3841,"3841":"EVEX_Vpinsrd_xmm_xmm_rm32_imm8",EVEX_Vpinsrq_xmm_xmm_rm64_imm8:3842,"3842":"EVEX_Vpinsrq_xmm_xmm_rm64_imm8",EVEX_Vshuff32x4_ymm_k1z_ymm_ymmm256b32_imm8:3843,"3843":"EVEX_Vshuff32x4_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vshuff32x4_zmm_k1z_zmm_zmmm512b32_imm8:3844,"3844":"EVEX_Vshuff32x4_zmm_k1z_zmm_zmmm512b32_imm8",EVEX_Vshuff64x2_ymm_k1z_ymm_ymmm256b64_imm8:3845,"3845":"EVEX_Vshuff64x2_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vshuff64x2_zmm_k1z_zmm_zmmm512b64_imm8:3846,"3846":"EVEX_Vshuff64x2_zmm_k1z_zmm_zmmm512b64_imm8",EVEX_Vpternlogd_xmm_k1z_xmm_xmmm128b32_imm8:3847,"3847":"EVEX_Vpternlogd_xmm_k1z_xmm_xmmm128b32_imm8",EVEX_Vpternlogd_ymm_k1z_ymm_ymmm256b32_imm8:3848,"3848":"EVEX_Vpternlogd_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vpternlogd_zmm_k1z_zmm_zmmm512b32_imm8:3849,"3849":"EVEX_Vpternlogd_zmm_k1z_zmm_zmmm512b32_imm8",EVEX_Vpternlogq_xmm_k1z_xmm_xmmm128b64_imm8:3850,"3850":"EVEX_Vpternlogq_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vpternlogq_ymm_k1z_ymm_ymmm256b64_imm8:3851,"3851":"EVEX_Vpternlogq_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vpternlogq_zmm_k1z_zmm_zmmm512b64_imm8:3852,"3852":"EVEX_Vpternlogq_zmm_k1z_zmm_zmmm512b64_imm8",EVEX_Vgetmantps_xmm_k1z_xmmm128b32_imm8:3853,"3853":"EVEX_Vgetmantps_xmm_k1z_xmmm128b32_imm8",EVEX_Vgetmantps_ymm_k1z_ymmm256b32_imm8:3854,"3854":"EVEX_Vgetmantps_ymm_k1z_ymmm256b32_imm8",EVEX_Vgetmantps_zmm_k1z_zmmm512b32_imm8_sae:3855,"3855":"EVEX_Vgetmantps_zmm_k1z_zmmm512b32_imm8_sae",EVEX_Vgetmantpd_xmm_k1z_xmmm128b64_imm8:3856,"3856":"EVEX_Vgetmantpd_xmm_k1z_xmmm128b64_imm8",EVEX_Vgetmantpd_ymm_k1z_ymmm256b64_imm8:3857,"3857":"EVEX_Vgetmantpd_ymm_k1z_ymmm256b64_imm8",EVEX_Vgetmantpd_zmm_k1z_zmmm512b64_imm8_sae:3858,"3858":"EVEX_Vgetmantpd_zmm_k1z_zmmm512b64_imm8_sae",EVEX_Vgetmantss_xmm_k1z_xmm_xmmm32_imm8_sae:3859,"3859":"EVEX_Vgetmantss_xmm_k1z_xmm_xmmm32_imm8_sae",EVEX_Vgetmantsd_xmm_k1z_xmm_xmmm64_imm8_sae:3860,"3860":"EVEX_Vgetmantsd_xmm_k1z_xmm_xmmm64_imm8_sae",VEX_Kshiftrb_kr_kr_imm8:3861,"3861":"VEX_Kshiftrb_kr_kr_imm8",VEX_Kshiftrw_kr_kr_imm8:3862,"3862":"VEX_Kshiftrw_kr_kr_imm8",VEX_Kshiftrd_kr_kr_imm8:3863,"3863":"VEX_Kshiftrd_kr_kr_imm8",VEX_Kshiftrq_kr_kr_imm8:3864,"3864":"VEX_Kshiftrq_kr_kr_imm8",VEX_Kshiftlb_kr_kr_imm8:3865,"3865":"VEX_Kshiftlb_kr_kr_imm8",VEX_Kshiftlw_kr_kr_imm8:3866,"3866":"VEX_Kshiftlw_kr_kr_imm8",VEX_Kshiftld_kr_kr_imm8:3867,"3867":"VEX_Kshiftld_kr_kr_imm8",VEX_Kshiftlq_kr_kr_imm8:3868,"3868":"VEX_Kshiftlq_kr_kr_imm8",VEX_Vinserti128_ymm_ymm_xmmm128_imm8:3869,"3869":"VEX_Vinserti128_ymm_ymm_xmmm128_imm8",EVEX_Vinserti32x4_ymm_k1z_ymm_xmmm128_imm8:3870,"3870":"EVEX_Vinserti32x4_ymm_k1z_ymm_xmmm128_imm8",EVEX_Vinserti32x4_zmm_k1z_zmm_xmmm128_imm8:3871,"3871":"EVEX_Vinserti32x4_zmm_k1z_zmm_xmmm128_imm8",EVEX_Vinserti64x2_ymm_k1z_ymm_xmmm128_imm8:3872,"3872":"EVEX_Vinserti64x2_ymm_k1z_ymm_xmmm128_imm8",EVEX_Vinserti64x2_zmm_k1z_zmm_xmmm128_imm8:3873,"3873":"EVEX_Vinserti64x2_zmm_k1z_zmm_xmmm128_imm8",VEX_Vextracti128_xmmm128_ymm_imm8:3874,"3874":"VEX_Vextracti128_xmmm128_ymm_imm8",EVEX_Vextracti32x4_xmmm128_k1z_ymm_imm8:3875,"3875":"EVEX_Vextracti32x4_xmmm128_k1z_ymm_imm8",EVEX_Vextracti32x4_xmmm128_k1z_zmm_imm8:3876,"3876":"EVEX_Vextracti32x4_xmmm128_k1z_zmm_imm8",EVEX_Vextracti64x2_xmmm128_k1z_ymm_imm8:3877,"3877":"EVEX_Vextracti64x2_xmmm128_k1z_ymm_imm8",EVEX_Vextracti64x2_xmmm128_k1z_zmm_imm8:3878,"3878":"EVEX_Vextracti64x2_xmmm128_k1z_zmm_imm8",EVEX_Vinserti32x8_zmm_k1z_zmm_ymmm256_imm8:3879,"3879":"EVEX_Vinserti32x8_zmm_k1z_zmm_ymmm256_imm8",EVEX_Vinserti64x4_zmm_k1z_zmm_ymmm256_imm8:3880,"3880":"EVEX_Vinserti64x4_zmm_k1z_zmm_ymmm256_imm8",EVEX_Vextracti32x8_ymmm256_k1z_zmm_imm8:3881,"3881":"EVEX_Vextracti32x8_ymmm256_k1z_zmm_imm8",EVEX_Vextracti64x4_ymmm256_k1z_zmm_imm8:3882,"3882":"EVEX_Vextracti64x4_ymmm256_k1z_zmm_imm8",EVEX_Vpcmpub_kr_k1_xmm_xmmm128_imm8:3883,"3883":"EVEX_Vpcmpub_kr_k1_xmm_xmmm128_imm8",EVEX_Vpcmpub_kr_k1_ymm_ymmm256_imm8:3884,"3884":"EVEX_Vpcmpub_kr_k1_ymm_ymmm256_imm8",EVEX_Vpcmpub_kr_k1_zmm_zmmm512_imm8:3885,"3885":"EVEX_Vpcmpub_kr_k1_zmm_zmmm512_imm8",EVEX_Vpcmpuw_kr_k1_xmm_xmmm128_imm8:3886,"3886":"EVEX_Vpcmpuw_kr_k1_xmm_xmmm128_imm8",EVEX_Vpcmpuw_kr_k1_ymm_ymmm256_imm8:3887,"3887":"EVEX_Vpcmpuw_kr_k1_ymm_ymmm256_imm8",EVEX_Vpcmpuw_kr_k1_zmm_zmmm512_imm8:3888,"3888":"EVEX_Vpcmpuw_kr_k1_zmm_zmmm512_imm8",EVEX_Vpcmpb_kr_k1_xmm_xmmm128_imm8:3889,"3889":"EVEX_Vpcmpb_kr_k1_xmm_xmmm128_imm8",EVEX_Vpcmpb_kr_k1_ymm_ymmm256_imm8:3890,"3890":"EVEX_Vpcmpb_kr_k1_ymm_ymmm256_imm8",EVEX_Vpcmpb_kr_k1_zmm_zmmm512_imm8:3891,"3891":"EVEX_Vpcmpb_kr_k1_zmm_zmmm512_imm8",EVEX_Vpcmpw_kr_k1_xmm_xmmm128_imm8:3892,"3892":"EVEX_Vpcmpw_kr_k1_xmm_xmmm128_imm8",EVEX_Vpcmpw_kr_k1_ymm_ymmm256_imm8:3893,"3893":"EVEX_Vpcmpw_kr_k1_ymm_ymmm256_imm8",EVEX_Vpcmpw_kr_k1_zmm_zmmm512_imm8:3894,"3894":"EVEX_Vpcmpw_kr_k1_zmm_zmmm512_imm8",Dpps_xmm_xmmm128_imm8:3895,"3895":"Dpps_xmm_xmmm128_imm8",VEX_Vdpps_xmm_xmm_xmmm128_imm8:3896,"3896":"VEX_Vdpps_xmm_xmm_xmmm128_imm8",VEX_Vdpps_ymm_ymm_ymmm256_imm8:3897,"3897":"VEX_Vdpps_ymm_ymm_ymmm256_imm8",Dppd_xmm_xmmm128_imm8:3898,"3898":"Dppd_xmm_xmmm128_imm8",VEX_Vdppd_xmm_xmm_xmmm128_imm8:3899,"3899":"VEX_Vdppd_xmm_xmm_xmmm128_imm8",Mpsadbw_xmm_xmmm128_imm8:3900,"3900":"Mpsadbw_xmm_xmmm128_imm8",VEX_Vmpsadbw_xmm_xmm_xmmm128_imm8:3901,"3901":"VEX_Vmpsadbw_xmm_xmm_xmmm128_imm8",VEX_Vmpsadbw_ymm_ymm_ymmm256_imm8:3902,"3902":"VEX_Vmpsadbw_ymm_ymm_ymmm256_imm8",EVEX_Vdbpsadbw_xmm_k1z_xmm_xmmm128_imm8:3903,"3903":"EVEX_Vdbpsadbw_xmm_k1z_xmm_xmmm128_imm8",EVEX_Vdbpsadbw_ymm_k1z_ymm_ymmm256_imm8:3904,"3904":"EVEX_Vdbpsadbw_ymm_k1z_ymm_ymmm256_imm8",EVEX_Vdbpsadbw_zmm_k1z_zmm_zmmm512_imm8:3905,"3905":"EVEX_Vdbpsadbw_zmm_k1z_zmm_zmmm512_imm8",EVEX_Vshufi32x4_ymm_k1z_ymm_ymmm256b32_imm8:3906,"3906":"EVEX_Vshufi32x4_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vshufi32x4_zmm_k1z_zmm_zmmm512b32_imm8:3907,"3907":"EVEX_Vshufi32x4_zmm_k1z_zmm_zmmm512b32_imm8",EVEX_Vshufi64x2_ymm_k1z_ymm_ymmm256b64_imm8:3908,"3908":"EVEX_Vshufi64x2_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vshufi64x2_zmm_k1z_zmm_zmmm512b64_imm8:3909,"3909":"EVEX_Vshufi64x2_zmm_k1z_zmm_zmmm512b64_imm8",Pclmulqdq_xmm_xmmm128_imm8:3910,"3910":"Pclmulqdq_xmm_xmmm128_imm8",VEX_Vpclmulqdq_xmm_xmm_xmmm128_imm8:3911,"3911":"VEX_Vpclmulqdq_xmm_xmm_xmmm128_imm8",VEX_Vpclmulqdq_ymm_ymm_ymmm256_imm8:3912,"3912":"VEX_Vpclmulqdq_ymm_ymm_ymmm256_imm8",EVEX_Vpclmulqdq_xmm_xmm_xmmm128_imm8:3913,"3913":"EVEX_Vpclmulqdq_xmm_xmm_xmmm128_imm8",EVEX_Vpclmulqdq_ymm_ymm_ymmm256_imm8:3914,"3914":"EVEX_Vpclmulqdq_ymm_ymm_ymmm256_imm8",EVEX_Vpclmulqdq_zmm_zmm_zmmm512_imm8:3915,"3915":"EVEX_Vpclmulqdq_zmm_zmm_zmmm512_imm8",VEX_Vperm2i128_ymm_ymm_ymmm256_imm8:3916,"3916":"VEX_Vperm2i128_ymm_ymm_ymmm256_imm8",VEX_Vpermil2ps_xmm_xmm_xmmm128_xmm_imm4:3917,"3917":"VEX_Vpermil2ps_xmm_xmm_xmmm128_xmm_imm4",VEX_Vpermil2ps_ymm_ymm_ymmm256_ymm_imm4:3918,"3918":"VEX_Vpermil2ps_ymm_ymm_ymmm256_ymm_imm4",VEX_Vpermil2ps_xmm_xmm_xmm_xmmm128_imm4:3919,"3919":"VEX_Vpermil2ps_xmm_xmm_xmm_xmmm128_imm4",VEX_Vpermil2ps_ymm_ymm_ymm_ymmm256_imm4:3920,"3920":"VEX_Vpermil2ps_ymm_ymm_ymm_ymmm256_imm4",VEX_Vpermil2pd_xmm_xmm_xmmm128_xmm_imm4:3921,"3921":"VEX_Vpermil2pd_xmm_xmm_xmmm128_xmm_imm4",VEX_Vpermil2pd_ymm_ymm_ymmm256_ymm_imm4:3922,"3922":"VEX_Vpermil2pd_ymm_ymm_ymmm256_ymm_imm4",VEX_Vpermil2pd_xmm_xmm_xmm_xmmm128_imm4:3923,"3923":"VEX_Vpermil2pd_xmm_xmm_xmm_xmmm128_imm4",VEX_Vpermil2pd_ymm_ymm_ymm_ymmm256_imm4:3924,"3924":"VEX_Vpermil2pd_ymm_ymm_ymm_ymmm256_imm4",VEX_Vblendvps_xmm_xmm_xmmm128_xmm:3925,"3925":"VEX_Vblendvps_xmm_xmm_xmmm128_xmm",VEX_Vblendvps_ymm_ymm_ymmm256_ymm:3926,"3926":"VEX_Vblendvps_ymm_ymm_ymmm256_ymm",VEX_Vblendvpd_xmm_xmm_xmmm128_xmm:3927,"3927":"VEX_Vblendvpd_xmm_xmm_xmmm128_xmm",VEX_Vblendvpd_ymm_ymm_ymmm256_ymm:3928,"3928":"VEX_Vblendvpd_ymm_ymm_ymmm256_ymm",VEX_Vpblendvb_xmm_xmm_xmmm128_xmm:3929,"3929":"VEX_Vpblendvb_xmm_xmm_xmmm128_xmm",VEX_Vpblendvb_ymm_ymm_ymmm256_ymm:3930,"3930":"VEX_Vpblendvb_ymm_ymm_ymmm256_ymm",EVEX_Vrangeps_xmm_k1z_xmm_xmmm128b32_imm8:3931,"3931":"EVEX_Vrangeps_xmm_k1z_xmm_xmmm128b32_imm8",EVEX_Vrangeps_ymm_k1z_ymm_ymmm256b32_imm8:3932,"3932":"EVEX_Vrangeps_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vrangeps_zmm_k1z_zmm_zmmm512b32_imm8_sae:3933,"3933":"EVEX_Vrangeps_zmm_k1z_zmm_zmmm512b32_imm8_sae",EVEX_Vrangepd_xmm_k1z_xmm_xmmm128b64_imm8:3934,"3934":"EVEX_Vrangepd_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vrangepd_ymm_k1z_ymm_ymmm256b64_imm8:3935,"3935":"EVEX_Vrangepd_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vrangepd_zmm_k1z_zmm_zmmm512b64_imm8_sae:3936,"3936":"EVEX_Vrangepd_zmm_k1z_zmm_zmmm512b64_imm8_sae",EVEX_Vrangess_xmm_k1z_xmm_xmmm32_imm8_sae:3937,"3937":"EVEX_Vrangess_xmm_k1z_xmm_xmmm32_imm8_sae",EVEX_Vrangesd_xmm_k1z_xmm_xmmm64_imm8_sae:3938,"3938":"EVEX_Vrangesd_xmm_k1z_xmm_xmmm64_imm8_sae",EVEX_Vfixupimmps_xmm_k1z_xmm_xmmm128b32_imm8:3939,"3939":"EVEX_Vfixupimmps_xmm_k1z_xmm_xmmm128b32_imm8",EVEX_Vfixupimmps_ymm_k1z_ymm_ymmm256b32_imm8:3940,"3940":"EVEX_Vfixupimmps_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vfixupimmps_zmm_k1z_zmm_zmmm512b32_imm8_sae:3941,"3941":"EVEX_Vfixupimmps_zmm_k1z_zmm_zmmm512b32_imm8_sae",EVEX_Vfixupimmpd_xmm_k1z_xmm_xmmm128b64_imm8:3942,"3942":"EVEX_Vfixupimmpd_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vfixupimmpd_ymm_k1z_ymm_ymmm256b64_imm8:3943,"3943":"EVEX_Vfixupimmpd_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vfixupimmpd_zmm_k1z_zmm_zmmm512b64_imm8_sae:3944,"3944":"EVEX_Vfixupimmpd_zmm_k1z_zmm_zmmm512b64_imm8_sae",EVEX_Vfixupimmss_xmm_k1z_xmm_xmmm32_imm8_sae:3945,"3945":"EVEX_Vfixupimmss_xmm_k1z_xmm_xmmm32_imm8_sae",EVEX_Vfixupimmsd_xmm_k1z_xmm_xmmm64_imm8_sae:3946,"3946":"EVEX_Vfixupimmsd_xmm_k1z_xmm_xmmm64_imm8_sae",EVEX_Vreduceps_xmm_k1z_xmmm128b32_imm8:3947,"3947":"EVEX_Vreduceps_xmm_k1z_xmmm128b32_imm8",EVEX_Vreduceps_ymm_k1z_ymmm256b32_imm8:3948,"3948":"EVEX_Vreduceps_ymm_k1z_ymmm256b32_imm8",EVEX_Vreduceps_zmm_k1z_zmmm512b32_imm8_sae:3949,"3949":"EVEX_Vreduceps_zmm_k1z_zmmm512b32_imm8_sae",EVEX_Vreducepd_xmm_k1z_xmmm128b64_imm8:3950,"3950":"EVEX_Vreducepd_xmm_k1z_xmmm128b64_imm8",EVEX_Vreducepd_ymm_k1z_ymmm256b64_imm8:3951,"3951":"EVEX_Vreducepd_ymm_k1z_ymmm256b64_imm8",EVEX_Vreducepd_zmm_k1z_zmmm512b64_imm8_sae:3952,"3952":"EVEX_Vreducepd_zmm_k1z_zmmm512b64_imm8_sae",EVEX_Vreducess_xmm_k1z_xmm_xmmm32_imm8_sae:3953,"3953":"EVEX_Vreducess_xmm_k1z_xmm_xmmm32_imm8_sae",EVEX_Vreducesd_xmm_k1z_xmm_xmmm64_imm8_sae:3954,"3954":"EVEX_Vreducesd_xmm_k1z_xmm_xmmm64_imm8_sae",VEX_Vfmaddsubps_xmm_xmm_xmmm128_xmm:3955,"3955":"VEX_Vfmaddsubps_xmm_xmm_xmmm128_xmm",VEX_Vfmaddsubps_ymm_ymm_ymmm256_ymm:3956,"3956":"VEX_Vfmaddsubps_ymm_ymm_ymmm256_ymm",VEX_Vfmaddsubps_xmm_xmm_xmm_xmmm128:3957,"3957":"VEX_Vfmaddsubps_xmm_xmm_xmm_xmmm128",VEX_Vfmaddsubps_ymm_ymm_ymm_ymmm256:3958,"3958":"VEX_Vfmaddsubps_ymm_ymm_ymm_ymmm256",VEX_Vfmaddsubpd_xmm_xmm_xmmm128_xmm:3959,"3959":"VEX_Vfmaddsubpd_xmm_xmm_xmmm128_xmm",VEX_Vfmaddsubpd_ymm_ymm_ymmm256_ymm:3960,"3960":"VEX_Vfmaddsubpd_ymm_ymm_ymmm256_ymm",VEX_Vfmaddsubpd_xmm_xmm_xmm_xmmm128:3961,"3961":"VEX_Vfmaddsubpd_xmm_xmm_xmm_xmmm128",VEX_Vfmaddsubpd_ymm_ymm_ymm_ymmm256:3962,"3962":"VEX_Vfmaddsubpd_ymm_ymm_ymm_ymmm256",VEX_Vfmsubaddps_xmm_xmm_xmmm128_xmm:3963,"3963":"VEX_Vfmsubaddps_xmm_xmm_xmmm128_xmm",VEX_Vfmsubaddps_ymm_ymm_ymmm256_ymm:3964,"3964":"VEX_Vfmsubaddps_ymm_ymm_ymmm256_ymm",VEX_Vfmsubaddps_xmm_xmm_xmm_xmmm128:3965,"3965":"VEX_Vfmsubaddps_xmm_xmm_xmm_xmmm128",VEX_Vfmsubaddps_ymm_ymm_ymm_ymmm256:3966,"3966":"VEX_Vfmsubaddps_ymm_ymm_ymm_ymmm256",VEX_Vfmsubaddpd_xmm_xmm_xmmm128_xmm:3967,"3967":"VEX_Vfmsubaddpd_xmm_xmm_xmmm128_xmm",VEX_Vfmsubaddpd_ymm_ymm_ymmm256_ymm:3968,"3968":"VEX_Vfmsubaddpd_ymm_ymm_ymmm256_ymm",VEX_Vfmsubaddpd_xmm_xmm_xmm_xmmm128:3969,"3969":"VEX_Vfmsubaddpd_xmm_xmm_xmm_xmmm128",VEX_Vfmsubaddpd_ymm_ymm_ymm_ymmm256:3970,"3970":"VEX_Vfmsubaddpd_ymm_ymm_ymm_ymmm256",Pcmpestrm_xmm_xmmm128_imm8:3971,"3971":"Pcmpestrm_xmm_xmmm128_imm8",Pcmpestrm64_xmm_xmmm128_imm8:3972,"3972":"Pcmpestrm64_xmm_xmmm128_imm8",VEX_Vpcmpestrm_xmm_xmmm128_imm8:3973,"3973":"VEX_Vpcmpestrm_xmm_xmmm128_imm8",VEX_Vpcmpestrm64_xmm_xmmm128_imm8:3974,"3974":"VEX_Vpcmpestrm64_xmm_xmmm128_imm8",Pcmpestri_xmm_xmmm128_imm8:3975,"3975":"Pcmpestri_xmm_xmmm128_imm8",Pcmpestri64_xmm_xmmm128_imm8:3976,"3976":"Pcmpestri64_xmm_xmmm128_imm8",VEX_Vpcmpestri_xmm_xmmm128_imm8:3977,"3977":"VEX_Vpcmpestri_xmm_xmmm128_imm8",VEX_Vpcmpestri64_xmm_xmmm128_imm8:3978,"3978":"VEX_Vpcmpestri64_xmm_xmmm128_imm8",Pcmpistrm_xmm_xmmm128_imm8:3979,"3979":"Pcmpistrm_xmm_xmmm128_imm8",VEX_Vpcmpistrm_xmm_xmmm128_imm8:3980,"3980":"VEX_Vpcmpistrm_xmm_xmmm128_imm8",Pcmpistri_xmm_xmmm128_imm8:3981,"3981":"Pcmpistri_xmm_xmmm128_imm8",VEX_Vpcmpistri_xmm_xmmm128_imm8:3982,"3982":"VEX_Vpcmpistri_xmm_xmmm128_imm8",EVEX_Vfpclassps_kr_k1_xmmm128b32_imm8:3983,"3983":"EVEX_Vfpclassps_kr_k1_xmmm128b32_imm8",EVEX_Vfpclassps_kr_k1_ymmm256b32_imm8:3984,"3984":"EVEX_Vfpclassps_kr_k1_ymmm256b32_imm8",EVEX_Vfpclassps_kr_k1_zmmm512b32_imm8:3985,"3985":"EVEX_Vfpclassps_kr_k1_zmmm512b32_imm8",EVEX_Vfpclasspd_kr_k1_xmmm128b64_imm8:3986,"3986":"EVEX_Vfpclasspd_kr_k1_xmmm128b64_imm8",EVEX_Vfpclasspd_kr_k1_ymmm256b64_imm8:3987,"3987":"EVEX_Vfpclasspd_kr_k1_ymmm256b64_imm8",EVEX_Vfpclasspd_kr_k1_zmmm512b64_imm8:3988,"3988":"EVEX_Vfpclasspd_kr_k1_zmmm512b64_imm8",EVEX_Vfpclassss_kr_k1_xmmm32_imm8:3989,"3989":"EVEX_Vfpclassss_kr_k1_xmmm32_imm8",EVEX_Vfpclasssd_kr_k1_xmmm64_imm8:3990,"3990":"EVEX_Vfpclasssd_kr_k1_xmmm64_imm8",VEX_Vfmaddps_xmm_xmm_xmmm128_xmm:3991,"3991":"VEX_Vfmaddps_xmm_xmm_xmmm128_xmm",VEX_Vfmaddps_ymm_ymm_ymmm256_ymm:3992,"3992":"VEX_Vfmaddps_ymm_ymm_ymmm256_ymm",VEX_Vfmaddps_xmm_xmm_xmm_xmmm128:3993,"3993":"VEX_Vfmaddps_xmm_xmm_xmm_xmmm128",VEX_Vfmaddps_ymm_ymm_ymm_ymmm256:3994,"3994":"VEX_Vfmaddps_ymm_ymm_ymm_ymmm256",VEX_Vfmaddpd_xmm_xmm_xmmm128_xmm:3995,"3995":"VEX_Vfmaddpd_xmm_xmm_xmmm128_xmm",VEX_Vfmaddpd_ymm_ymm_ymmm256_ymm:3996,"3996":"VEX_Vfmaddpd_ymm_ymm_ymmm256_ymm",VEX_Vfmaddpd_xmm_xmm_xmm_xmmm128:3997,"3997":"VEX_Vfmaddpd_xmm_xmm_xmm_xmmm128",VEX_Vfmaddpd_ymm_ymm_ymm_ymmm256:3998,"3998":"VEX_Vfmaddpd_ymm_ymm_ymm_ymmm256",VEX_Vfmaddss_xmm_xmm_xmmm32_xmm:3999,"3999":"VEX_Vfmaddss_xmm_xmm_xmmm32_xmm",VEX_Vfmaddss_xmm_xmm_xmm_xmmm32:4000,"4000":"VEX_Vfmaddss_xmm_xmm_xmm_xmmm32",VEX_Vfmaddsd_xmm_xmm_xmmm64_xmm:4001,"4001":"VEX_Vfmaddsd_xmm_xmm_xmmm64_xmm",VEX_Vfmaddsd_xmm_xmm_xmm_xmmm64:4002,"4002":"VEX_Vfmaddsd_xmm_xmm_xmm_xmmm64",VEX_Vfmsubps_xmm_xmm_xmmm128_xmm:4003,"4003":"VEX_Vfmsubps_xmm_xmm_xmmm128_xmm",VEX_Vfmsubps_ymm_ymm_ymmm256_ymm:4004,"4004":"VEX_Vfmsubps_ymm_ymm_ymmm256_ymm",VEX_Vfmsubps_xmm_xmm_xmm_xmmm128:4005,"4005":"VEX_Vfmsubps_xmm_xmm_xmm_xmmm128",VEX_Vfmsubps_ymm_ymm_ymm_ymmm256:4006,"4006":"VEX_Vfmsubps_ymm_ymm_ymm_ymmm256",VEX_Vfmsubpd_xmm_xmm_xmmm128_xmm:4007,"4007":"VEX_Vfmsubpd_xmm_xmm_xmmm128_xmm",VEX_Vfmsubpd_ymm_ymm_ymmm256_ymm:4008,"4008":"VEX_Vfmsubpd_ymm_ymm_ymmm256_ymm",VEX_Vfmsubpd_xmm_xmm_xmm_xmmm128:4009,"4009":"VEX_Vfmsubpd_xmm_xmm_xmm_xmmm128",VEX_Vfmsubpd_ymm_ymm_ymm_ymmm256:4010,"4010":"VEX_Vfmsubpd_ymm_ymm_ymm_ymmm256",VEX_Vfmsubss_xmm_xmm_xmmm32_xmm:4011,"4011":"VEX_Vfmsubss_xmm_xmm_xmmm32_xmm",VEX_Vfmsubss_xmm_xmm_xmm_xmmm32:4012,"4012":"VEX_Vfmsubss_xmm_xmm_xmm_xmmm32",VEX_Vfmsubsd_xmm_xmm_xmmm64_xmm:4013,"4013":"VEX_Vfmsubsd_xmm_xmm_xmmm64_xmm",VEX_Vfmsubsd_xmm_xmm_xmm_xmmm64:4014,"4014":"VEX_Vfmsubsd_xmm_xmm_xmm_xmmm64",EVEX_Vpshldw_xmm_k1z_xmm_xmmm128_imm8:4015,"4015":"EVEX_Vpshldw_xmm_k1z_xmm_xmmm128_imm8",EVEX_Vpshldw_ymm_k1z_ymm_ymmm256_imm8:4016,"4016":"EVEX_Vpshldw_ymm_k1z_ymm_ymmm256_imm8",EVEX_Vpshldw_zmm_k1z_zmm_zmmm512_imm8:4017,"4017":"EVEX_Vpshldw_zmm_k1z_zmm_zmmm512_imm8",EVEX_Vpshldd_xmm_k1z_xmm_xmmm128b32_imm8:4018,"4018":"EVEX_Vpshldd_xmm_k1z_xmm_xmmm128b32_imm8",EVEX_Vpshldd_ymm_k1z_ymm_ymmm256b32_imm8:4019,"4019":"EVEX_Vpshldd_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vpshldd_zmm_k1z_zmm_zmmm512b32_imm8:4020,"4020":"EVEX_Vpshldd_zmm_k1z_zmm_zmmm512b32_imm8",EVEX_Vpshldq_xmm_k1z_xmm_xmmm128b64_imm8:4021,"4021":"EVEX_Vpshldq_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vpshldq_ymm_k1z_ymm_ymmm256b64_imm8:4022,"4022":"EVEX_Vpshldq_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vpshldq_zmm_k1z_zmm_zmmm512b64_imm8:4023,"4023":"EVEX_Vpshldq_zmm_k1z_zmm_zmmm512b64_imm8",EVEX_Vpshrdw_xmm_k1z_xmm_xmmm128_imm8:4024,"4024":"EVEX_Vpshrdw_xmm_k1z_xmm_xmmm128_imm8",EVEX_Vpshrdw_ymm_k1z_ymm_ymmm256_imm8:4025,"4025":"EVEX_Vpshrdw_ymm_k1z_ymm_ymmm256_imm8",EVEX_Vpshrdw_zmm_k1z_zmm_zmmm512_imm8:4026,"4026":"EVEX_Vpshrdw_zmm_k1z_zmm_zmmm512_imm8",EVEX_Vpshrdd_xmm_k1z_xmm_xmmm128b32_imm8:4027,"4027":"EVEX_Vpshrdd_xmm_k1z_xmm_xmmm128b32_imm8",EVEX_Vpshrdd_ymm_k1z_ymm_ymmm256b32_imm8:4028,"4028":"EVEX_Vpshrdd_ymm_k1z_ymm_ymmm256b32_imm8",EVEX_Vpshrdd_zmm_k1z_zmm_zmmm512b32_imm8:4029,"4029":"EVEX_Vpshrdd_zmm_k1z_zmm_zmmm512b32_imm8",EVEX_Vpshrdq_xmm_k1z_xmm_xmmm128b64_imm8:4030,"4030":"EVEX_Vpshrdq_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vpshrdq_ymm_k1z_ymm_ymmm256b64_imm8:4031,"4031":"EVEX_Vpshrdq_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vpshrdq_zmm_k1z_zmm_zmmm512b64_imm8:4032,"4032":"EVEX_Vpshrdq_zmm_k1z_zmm_zmmm512b64_imm8",VEX_Vfnmaddps_xmm_xmm_xmmm128_xmm:4033,"4033":"VEX_Vfnmaddps_xmm_xmm_xmmm128_xmm",VEX_Vfnmaddps_ymm_ymm_ymmm256_ymm:4034,"4034":"VEX_Vfnmaddps_ymm_ymm_ymmm256_ymm",VEX_Vfnmaddps_xmm_xmm_xmm_xmmm128:4035,"4035":"VEX_Vfnmaddps_xmm_xmm_xmm_xmmm128",VEX_Vfnmaddps_ymm_ymm_ymm_ymmm256:4036,"4036":"VEX_Vfnmaddps_ymm_ymm_ymm_ymmm256",VEX_Vfnmaddpd_xmm_xmm_xmmm128_xmm:4037,"4037":"VEX_Vfnmaddpd_xmm_xmm_xmmm128_xmm",VEX_Vfnmaddpd_ymm_ymm_ymmm256_ymm:4038,"4038":"VEX_Vfnmaddpd_ymm_ymm_ymmm256_ymm",VEX_Vfnmaddpd_xmm_xmm_xmm_xmmm128:4039,"4039":"VEX_Vfnmaddpd_xmm_xmm_xmm_xmmm128",VEX_Vfnmaddpd_ymm_ymm_ymm_ymmm256:4040,"4040":"VEX_Vfnmaddpd_ymm_ymm_ymm_ymmm256",VEX_Vfnmaddss_xmm_xmm_xmmm32_xmm:4041,"4041":"VEX_Vfnmaddss_xmm_xmm_xmmm32_xmm",VEX_Vfnmaddss_xmm_xmm_xmm_xmmm32:4042,"4042":"VEX_Vfnmaddss_xmm_xmm_xmm_xmmm32",VEX_Vfnmaddsd_xmm_xmm_xmmm64_xmm:4043,"4043":"VEX_Vfnmaddsd_xmm_xmm_xmmm64_xmm",VEX_Vfnmaddsd_xmm_xmm_xmm_xmmm64:4044,"4044":"VEX_Vfnmaddsd_xmm_xmm_xmm_xmmm64",VEX_Vfnmsubps_xmm_xmm_xmmm128_xmm:4045,"4045":"VEX_Vfnmsubps_xmm_xmm_xmmm128_xmm",VEX_Vfnmsubps_ymm_ymm_ymmm256_ymm:4046,"4046":"VEX_Vfnmsubps_ymm_ymm_ymmm256_ymm",VEX_Vfnmsubps_xmm_xmm_xmm_xmmm128:4047,"4047":"VEX_Vfnmsubps_xmm_xmm_xmm_xmmm128",VEX_Vfnmsubps_ymm_ymm_ymm_ymmm256:4048,"4048":"VEX_Vfnmsubps_ymm_ymm_ymm_ymmm256",VEX_Vfnmsubpd_xmm_xmm_xmmm128_xmm:4049,"4049":"VEX_Vfnmsubpd_xmm_xmm_xmmm128_xmm",VEX_Vfnmsubpd_ymm_ymm_ymmm256_ymm:4050,"4050":"VEX_Vfnmsubpd_ymm_ymm_ymmm256_ymm",VEX_Vfnmsubpd_xmm_xmm_xmm_xmmm128:4051,"4051":"VEX_Vfnmsubpd_xmm_xmm_xmm_xmmm128",VEX_Vfnmsubpd_ymm_ymm_ymm_ymmm256:4052,"4052":"VEX_Vfnmsubpd_ymm_ymm_ymm_ymmm256",VEX_Vfnmsubss_xmm_xmm_xmmm32_xmm:4053,"4053":"VEX_Vfnmsubss_xmm_xmm_xmmm32_xmm",VEX_Vfnmsubss_xmm_xmm_xmm_xmmm32:4054,"4054":"VEX_Vfnmsubss_xmm_xmm_xmm_xmmm32",VEX_Vfnmsubsd_xmm_xmm_xmmm64_xmm:4055,"4055":"VEX_Vfnmsubsd_xmm_xmm_xmmm64_xmm",VEX_Vfnmsubsd_xmm_xmm_xmm_xmmm64:4056,"4056":"VEX_Vfnmsubsd_xmm_xmm_xmm_xmmm64",Sha1rnds4_xmm_xmmm128_imm8:4057,"4057":"Sha1rnds4_xmm_xmmm128_imm8",Gf2p8affineqb_xmm_xmmm128_imm8:4058,"4058":"Gf2p8affineqb_xmm_xmmm128_imm8",VEX_Vgf2p8affineqb_xmm_xmm_xmmm128_imm8:4059,"4059":"VEX_Vgf2p8affineqb_xmm_xmm_xmmm128_imm8",VEX_Vgf2p8affineqb_ymm_ymm_ymmm256_imm8:4060,"4060":"VEX_Vgf2p8affineqb_ymm_ymm_ymmm256_imm8",EVEX_Vgf2p8affineqb_xmm_k1z_xmm_xmmm128b64_imm8:4061,"4061":"EVEX_Vgf2p8affineqb_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vgf2p8affineqb_ymm_k1z_ymm_ymmm256b64_imm8:4062,"4062":"EVEX_Vgf2p8affineqb_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vgf2p8affineqb_zmm_k1z_zmm_zmmm512b64_imm8:4063,"4063":"EVEX_Vgf2p8affineqb_zmm_k1z_zmm_zmmm512b64_imm8",Gf2p8affineinvqb_xmm_xmmm128_imm8:4064,"4064":"Gf2p8affineinvqb_xmm_xmmm128_imm8",VEX_Vgf2p8affineinvqb_xmm_xmm_xmmm128_imm8:4065,"4065":"VEX_Vgf2p8affineinvqb_xmm_xmm_xmmm128_imm8",VEX_Vgf2p8affineinvqb_ymm_ymm_ymmm256_imm8:4066,"4066":"VEX_Vgf2p8affineinvqb_ymm_ymm_ymmm256_imm8",EVEX_Vgf2p8affineinvqb_xmm_k1z_xmm_xmmm128b64_imm8:4067,"4067":"EVEX_Vgf2p8affineinvqb_xmm_k1z_xmm_xmmm128b64_imm8",EVEX_Vgf2p8affineinvqb_ymm_k1z_ymm_ymmm256b64_imm8:4068,"4068":"EVEX_Vgf2p8affineinvqb_ymm_k1z_ymm_ymmm256b64_imm8",EVEX_Vgf2p8affineinvqb_zmm_k1z_zmm_zmmm512b64_imm8:4069,"4069":"EVEX_Vgf2p8affineinvqb_zmm_k1z_zmm_zmmm512b64_imm8",Aeskeygenassist_xmm_xmmm128_imm8:4070,"4070":"Aeskeygenassist_xmm_xmmm128_imm8",VEX_Vaeskeygenassist_xmm_xmmm128_imm8:4071,"4071":"VEX_Vaeskeygenassist_xmm_xmmm128_imm8",VEX_Rorx_r32_rm32_imm8:4072,"4072":"VEX_Rorx_r32_rm32_imm8",VEX_Rorx_r64_rm64_imm8:4073,"4073":"VEX_Rorx_r64_rm64_imm8",XOP_Vpmacssww_xmm_xmm_xmmm128_xmm:4074,"4074":"XOP_Vpmacssww_xmm_xmm_xmmm128_xmm",XOP_Vpmacsswd_xmm_xmm_xmmm128_xmm:4075,"4075":"XOP_Vpmacsswd_xmm_xmm_xmmm128_xmm",XOP_Vpmacssdql_xmm_xmm_xmmm128_xmm:4076,"4076":"XOP_Vpmacssdql_xmm_xmm_xmmm128_xmm",XOP_Vpmacssdd_xmm_xmm_xmmm128_xmm:4077,"4077":"XOP_Vpmacssdd_xmm_xmm_xmmm128_xmm",XOP_Vpmacssdqh_xmm_xmm_xmmm128_xmm:4078,"4078":"XOP_Vpmacssdqh_xmm_xmm_xmmm128_xmm",XOP_Vpmacsww_xmm_xmm_xmmm128_xmm:4079,"4079":"XOP_Vpmacsww_xmm_xmm_xmmm128_xmm",XOP_Vpmacswd_xmm_xmm_xmmm128_xmm:4080,"4080":"XOP_Vpmacswd_xmm_xmm_xmmm128_xmm",XOP_Vpmacsdql_xmm_xmm_xmmm128_xmm:4081,"4081":"XOP_Vpmacsdql_xmm_xmm_xmmm128_xmm",XOP_Vpmacsdd_xmm_xmm_xmmm128_xmm:4082,"4082":"XOP_Vpmacsdd_xmm_xmm_xmmm128_xmm",XOP_Vpmacsdqh_xmm_xmm_xmmm128_xmm:4083,"4083":"XOP_Vpmacsdqh_xmm_xmm_xmmm128_xmm",XOP_Vpcmov_xmm_xmm_xmmm128_xmm:4084,"4084":"XOP_Vpcmov_xmm_xmm_xmmm128_xmm",XOP_Vpcmov_ymm_ymm_ymmm256_ymm:4085,"4085":"XOP_Vpcmov_ymm_ymm_ymmm256_ymm",XOP_Vpcmov_xmm_xmm_xmm_xmmm128:4086,"4086":"XOP_Vpcmov_xmm_xmm_xmm_xmmm128",XOP_Vpcmov_ymm_ymm_ymm_ymmm256:4087,"4087":"XOP_Vpcmov_ymm_ymm_ymm_ymmm256",XOP_Vpperm_xmm_xmm_xmmm128_xmm:4088,"4088":"XOP_Vpperm_xmm_xmm_xmmm128_xmm",XOP_Vpperm_xmm_xmm_xmm_xmmm128:4089,"4089":"XOP_Vpperm_xmm_xmm_xmm_xmmm128",XOP_Vpmadcsswd_xmm_xmm_xmmm128_xmm:4090,"4090":"XOP_Vpmadcsswd_xmm_xmm_xmmm128_xmm",XOP_Vpmadcswd_xmm_xmm_xmmm128_xmm:4091,"4091":"XOP_Vpmadcswd_xmm_xmm_xmmm128_xmm",XOP_Vprotb_xmm_xmmm128_imm8:4092,"4092":"XOP_Vprotb_xmm_xmmm128_imm8",XOP_Vprotw_xmm_xmmm128_imm8:4093,"4093":"XOP_Vprotw_xmm_xmmm128_imm8",XOP_Vprotd_xmm_xmmm128_imm8:4094,"4094":"XOP_Vprotd_xmm_xmmm128_imm8",XOP_Vprotq_xmm_xmmm128_imm8:4095,"4095":"XOP_Vprotq_xmm_xmmm128_imm8",XOP_Vpcomb_xmm_xmm_xmmm128_imm8:4096,"4096":"XOP_Vpcomb_xmm_xmm_xmmm128_imm8",XOP_Vpcomw_xmm_xmm_xmmm128_imm8:4097,"4097":"XOP_Vpcomw_xmm_xmm_xmmm128_imm8",XOP_Vpcomd_xmm_xmm_xmmm128_imm8:4098,"4098":"XOP_Vpcomd_xmm_xmm_xmmm128_imm8",XOP_Vpcomq_xmm_xmm_xmmm128_imm8:4099,"4099":"XOP_Vpcomq_xmm_xmm_xmmm128_imm8",XOP_Vpcomub_xmm_xmm_xmmm128_imm8:4100,"4100":"XOP_Vpcomub_xmm_xmm_xmmm128_imm8",XOP_Vpcomuw_xmm_xmm_xmmm128_imm8:4101,"4101":"XOP_Vpcomuw_xmm_xmm_xmmm128_imm8",XOP_Vpcomud_xmm_xmm_xmmm128_imm8:4102,"4102":"XOP_Vpcomud_xmm_xmm_xmmm128_imm8",XOP_Vpcomuq_xmm_xmm_xmmm128_imm8:4103,"4103":"XOP_Vpcomuq_xmm_xmm_xmmm128_imm8",XOP_Blcfill_r32_rm32:4104,"4104":"XOP_Blcfill_r32_rm32",XOP_Blcfill_r64_rm64:4105,"4105":"XOP_Blcfill_r64_rm64",XOP_Blsfill_r32_rm32:4106,"4106":"XOP_Blsfill_r32_rm32",XOP_Blsfill_r64_rm64:4107,"4107":"XOP_Blsfill_r64_rm64",XOP_Blcs_r32_rm32:4108,"4108":"XOP_Blcs_r32_rm32",XOP_Blcs_r64_rm64:4109,"4109":"XOP_Blcs_r64_rm64",XOP_Tzmsk_r32_rm32:4110,"4110":"XOP_Tzmsk_r32_rm32",XOP_Tzmsk_r64_rm64:4111,"4111":"XOP_Tzmsk_r64_rm64",XOP_Blcic_r32_rm32:4112,"4112":"XOP_Blcic_r32_rm32",XOP_Blcic_r64_rm64:4113,"4113":"XOP_Blcic_r64_rm64",XOP_Blsic_r32_rm32:4114,"4114":"XOP_Blsic_r32_rm32",XOP_Blsic_r64_rm64:4115,"4115":"XOP_Blsic_r64_rm64",XOP_T1mskc_r32_rm32:4116,"4116":"XOP_T1mskc_r32_rm32",XOP_T1mskc_r64_rm64:4117,"4117":"XOP_T1mskc_r64_rm64",XOP_Blcmsk_r32_rm32:4118,"4118":"XOP_Blcmsk_r32_rm32",XOP_Blcmsk_r64_rm64:4119,"4119":"XOP_Blcmsk_r64_rm64",XOP_Blci_r32_rm32:4120,"4120":"XOP_Blci_r32_rm32",XOP_Blci_r64_rm64:4121,"4121":"XOP_Blci_r64_rm64",XOP_Llwpcb_r32:4122,"4122":"XOP_Llwpcb_r32",XOP_Llwpcb_r64:4123,"4123":"XOP_Llwpcb_r64",XOP_Slwpcb_r32:4124,"4124":"XOP_Slwpcb_r32",XOP_Slwpcb_r64:4125,"4125":"XOP_Slwpcb_r64",XOP_Vfrczps_xmm_xmmm128:4126,"4126":"XOP_Vfrczps_xmm_xmmm128",XOP_Vfrczps_ymm_ymmm256:4127,"4127":"XOP_Vfrczps_ymm_ymmm256",XOP_Vfrczpd_xmm_xmmm128:4128,"4128":"XOP_Vfrczpd_xmm_xmmm128",XOP_Vfrczpd_ymm_ymmm256:4129,"4129":"XOP_Vfrczpd_ymm_ymmm256",XOP_Vfrczss_xmm_xmmm32:4130,"4130":"XOP_Vfrczss_xmm_xmmm32",XOP_Vfrczsd_xmm_xmmm64:4131,"4131":"XOP_Vfrczsd_xmm_xmmm64",XOP_Vprotb_xmm_xmmm128_xmm:4132,"4132":"XOP_Vprotb_xmm_xmmm128_xmm",XOP_Vprotb_xmm_xmm_xmmm128:4133,"4133":"XOP_Vprotb_xmm_xmm_xmmm128",XOP_Vprotw_xmm_xmmm128_xmm:4134,"4134":"XOP_Vprotw_xmm_xmmm128_xmm",XOP_Vprotw_xmm_xmm_xmmm128:4135,"4135":"XOP_Vprotw_xmm_xmm_xmmm128",XOP_Vprotd_xmm_xmmm128_xmm:4136,"4136":"XOP_Vprotd_xmm_xmmm128_xmm",XOP_Vprotd_xmm_xmm_xmmm128:4137,"4137":"XOP_Vprotd_xmm_xmm_xmmm128",XOP_Vprotq_xmm_xmmm128_xmm:4138,"4138":"XOP_Vprotq_xmm_xmmm128_xmm",XOP_Vprotq_xmm_xmm_xmmm128:4139,"4139":"XOP_Vprotq_xmm_xmm_xmmm128",XOP_Vpshlb_xmm_xmmm128_xmm:4140,"4140":"XOP_Vpshlb_xmm_xmmm128_xmm",XOP_Vpshlb_xmm_xmm_xmmm128:4141,"4141":"XOP_Vpshlb_xmm_xmm_xmmm128",XOP_Vpshlw_xmm_xmmm128_xmm:4142,"4142":"XOP_Vpshlw_xmm_xmmm128_xmm",XOP_Vpshlw_xmm_xmm_xmmm128:4143,"4143":"XOP_Vpshlw_xmm_xmm_xmmm128",XOP_Vpshld_xmm_xmmm128_xmm:4144,"4144":"XOP_Vpshld_xmm_xmmm128_xmm",XOP_Vpshld_xmm_xmm_xmmm128:4145,"4145":"XOP_Vpshld_xmm_xmm_xmmm128",XOP_Vpshlq_xmm_xmmm128_xmm:4146,"4146":"XOP_Vpshlq_xmm_xmmm128_xmm",XOP_Vpshlq_xmm_xmm_xmmm128:4147,"4147":"XOP_Vpshlq_xmm_xmm_xmmm128",XOP_Vpshab_xmm_xmmm128_xmm:4148,"4148":"XOP_Vpshab_xmm_xmmm128_xmm",XOP_Vpshab_xmm_xmm_xmmm128:4149,"4149":"XOP_Vpshab_xmm_xmm_xmmm128",XOP_Vpshaw_xmm_xmmm128_xmm:4150,"4150":"XOP_Vpshaw_xmm_xmmm128_xmm",XOP_Vpshaw_xmm_xmm_xmmm128:4151,"4151":"XOP_Vpshaw_xmm_xmm_xmmm128",XOP_Vpshad_xmm_xmmm128_xmm:4152,"4152":"XOP_Vpshad_xmm_xmmm128_xmm",XOP_Vpshad_xmm_xmm_xmmm128:4153,"4153":"XOP_Vpshad_xmm_xmm_xmmm128",XOP_Vpshaq_xmm_xmmm128_xmm:4154,"4154":"XOP_Vpshaq_xmm_xmmm128_xmm",XOP_Vpshaq_xmm_xmm_xmmm128:4155,"4155":"XOP_Vpshaq_xmm_xmm_xmmm128",XOP_Vphaddbw_xmm_xmmm128:4156,"4156":"XOP_Vphaddbw_xmm_xmmm128",XOP_Vphaddbd_xmm_xmmm128:4157,"4157":"XOP_Vphaddbd_xmm_xmmm128",XOP_Vphaddbq_xmm_xmmm128:4158,"4158":"XOP_Vphaddbq_xmm_xmmm128",XOP_Vphaddwd_xmm_xmmm128:4159,"4159":"XOP_Vphaddwd_xmm_xmmm128",XOP_Vphaddwq_xmm_xmmm128:4160,"4160":"XOP_Vphaddwq_xmm_xmmm128",XOP_Vphadddq_xmm_xmmm128:4161,"4161":"XOP_Vphadddq_xmm_xmmm128",XOP_Vphaddubw_xmm_xmmm128:4162,"4162":"XOP_Vphaddubw_xmm_xmmm128",XOP_Vphaddubd_xmm_xmmm128:4163,"4163":"XOP_Vphaddubd_xmm_xmmm128",XOP_Vphaddubq_xmm_xmmm128:4164,"4164":"XOP_Vphaddubq_xmm_xmmm128",XOP_Vphadduwd_xmm_xmmm128:4165,"4165":"XOP_Vphadduwd_xmm_xmmm128",XOP_Vphadduwq_xmm_xmmm128:4166,"4166":"XOP_Vphadduwq_xmm_xmmm128",XOP_Vphaddudq_xmm_xmmm128:4167,"4167":"XOP_Vphaddudq_xmm_xmmm128",XOP_Vphsubbw_xmm_xmmm128:4168,"4168":"XOP_Vphsubbw_xmm_xmmm128",XOP_Vphsubwd_xmm_xmmm128:4169,"4169":"XOP_Vphsubwd_xmm_xmmm128",XOP_Vphsubdq_xmm_xmmm128:4170,"4170":"XOP_Vphsubdq_xmm_xmmm128",XOP_Bextr_r32_rm32_imm32:4171,"4171":"XOP_Bextr_r32_rm32_imm32",XOP_Bextr_r64_rm64_imm32:4172,"4172":"XOP_Bextr_r64_rm64_imm32",XOP_Lwpins_r32_rm32_imm32:4173,"4173":"XOP_Lwpins_r32_rm32_imm32",XOP_Lwpins_r64_rm32_imm32:4174,"4174":"XOP_Lwpins_r64_rm32_imm32",XOP_Lwpval_r32_rm32_imm32:4175,"4175":"XOP_Lwpval_r32_rm32_imm32",XOP_Lwpval_r64_rm32_imm32:4176,"4176":"XOP_Lwpval_r64_rm32_imm32",D3NOW_Pi2fw_mm_mmm64:4177,"4177":"D3NOW_Pi2fw_mm_mmm64",D3NOW_Pi2fd_mm_mmm64:4178,"4178":"D3NOW_Pi2fd_mm_mmm64",D3NOW_Pf2iw_mm_mmm64:4179,"4179":"D3NOW_Pf2iw_mm_mmm64",D3NOW_Pf2id_mm_mmm64:4180,"4180":"D3NOW_Pf2id_mm_mmm64",D3NOW_Pfrcpv_mm_mmm64:4181,"4181":"D3NOW_Pfrcpv_mm_mmm64",D3NOW_Pfrsqrtv_mm_mmm64:4182,"4182":"D3NOW_Pfrsqrtv_mm_mmm64",D3NOW_Pfnacc_mm_mmm64:4183,"4183":"D3NOW_Pfnacc_mm_mmm64",D3NOW_Pfpnacc_mm_mmm64:4184,"4184":"D3NOW_Pfpnacc_mm_mmm64",D3NOW_Pfcmpge_mm_mmm64:4185,"4185":"D3NOW_Pfcmpge_mm_mmm64",D3NOW_Pfmin_mm_mmm64:4186,"4186":"D3NOW_Pfmin_mm_mmm64",D3NOW_Pfrcp_mm_mmm64:4187,"4187":"D3NOW_Pfrcp_mm_mmm64",D3NOW_Pfrsqrt_mm_mmm64:4188,"4188":"D3NOW_Pfrsqrt_mm_mmm64",D3NOW_Pfsub_mm_mmm64:4189,"4189":"D3NOW_Pfsub_mm_mmm64",D3NOW_Pfadd_mm_mmm64:4190,"4190":"D3NOW_Pfadd_mm_mmm64",D3NOW_Pfcmpgt_mm_mmm64:4191,"4191":"D3NOW_Pfcmpgt_mm_mmm64",D3NOW_Pfmax_mm_mmm64:4192,"4192":"D3NOW_Pfmax_mm_mmm64",D3NOW_Pfrcpit1_mm_mmm64:4193,"4193":"D3NOW_Pfrcpit1_mm_mmm64",D3NOW_Pfrsqit1_mm_mmm64:4194,"4194":"D3NOW_Pfrsqit1_mm_mmm64",D3NOW_Pfsubr_mm_mmm64:4195,"4195":"D3NOW_Pfsubr_mm_mmm64",D3NOW_Pfacc_mm_mmm64:4196,"4196":"D3NOW_Pfacc_mm_mmm64",D3NOW_Pfcmpeq_mm_mmm64:4197,"4197":"D3NOW_Pfcmpeq_mm_mmm64",D3NOW_Pfmul_mm_mmm64:4198,"4198":"D3NOW_Pfmul_mm_mmm64",D3NOW_Pfrcpit2_mm_mmm64:4199,"4199":"D3NOW_Pfrcpit2_mm_mmm64",D3NOW_Pmulhrw_mm_mmm64:4200,"4200":"D3NOW_Pmulhrw_mm_mmm64",D3NOW_Pswapd_mm_mmm64:4201,"4201":"D3NOW_Pswapd_mm_mmm64",D3NOW_Pavgusb_mm_mmm64:4202,"4202":"D3NOW_Pavgusb_mm_mmm64",Rmpadjust:4203,"4203":"Rmpadjust",Rmpupdate:4204,"4204":"Rmpupdate",Psmash:4205,"4205":"Psmash",Pvalidatew:4206,"4206":"Pvalidatew",Pvalidated:4207,"4207":"Pvalidated",Pvalidateq:4208,"4208":"Pvalidateq",Serialize:4209,"4209":"Serialize",Xsusldtrk:4210,"4210":"Xsusldtrk",Xresldtrk:4211,"4211":"Xresldtrk",Invlpgbw:4212,"4212":"Invlpgbw",Invlpgbd:4213,"4213":"Invlpgbd",Invlpgbq:4214,"4214":"Invlpgbq",Tlbsync:4215,"4215":"Tlbsync",Prefetchreserved3_m8:4216,"4216":"Prefetchreserved3_m8",Prefetchreserved4_m8:4217,"4217":"Prefetchreserved4_m8",Prefetchreserved5_m8:4218,"4218":"Prefetchreserved5_m8",Prefetchreserved6_m8:4219,"4219":"Prefetchreserved6_m8",Prefetchreserved7_m8:4220,"4220":"Prefetchreserved7_m8",Ud0:4221,"4221":"Ud0",Vmgexit:4222,"4222":"Vmgexit",Getsecq:4223,"4223":"Getsecq",VEX_Ldtilecfg_m512:4224,"4224":"VEX_Ldtilecfg_m512",VEX_Tilerelease:4225,"4225":"VEX_Tilerelease",VEX_Sttilecfg_m512:4226,"4226":"VEX_Sttilecfg_m512",VEX_Tilezero_tmm:4227,"4227":"VEX_Tilezero_tmm",VEX_Tileloaddt1_tmm_sibmem:4228,"4228":"VEX_Tileloaddt1_tmm_sibmem",VEX_Tilestored_sibmem_tmm:4229,"4229":"VEX_Tilestored_sibmem_tmm",VEX_Tileloadd_tmm_sibmem:4230,"4230":"VEX_Tileloadd_tmm_sibmem",VEX_Tdpbf16ps_tmm_tmm_tmm:4231,"4231":"VEX_Tdpbf16ps_tmm_tmm_tmm",VEX_Tdpbuud_tmm_tmm_tmm:4232,"4232":"VEX_Tdpbuud_tmm_tmm_tmm",VEX_Tdpbusd_tmm_tmm_tmm:4233,"4233":"VEX_Tdpbusd_tmm_tmm_tmm",VEX_Tdpbsud_tmm_tmm_tmm:4234,"4234":"VEX_Tdpbsud_tmm_tmm_tmm",VEX_Tdpbssd_tmm_tmm_tmm:4235,"4235":"VEX_Tdpbssd_tmm_tmm_tmm",Fnstdw_AX:4236,"4236":"Fnstdw_AX",Fnstsg_AX:4237,"4237":"Fnstsg_AX",Rdshr_rm32:4238,"4238":"Rdshr_rm32",Wrshr_rm32:4239,"4239":"Wrshr_rm32",Smint:4240,"4240":"Smint",Dmint:4241,"4241":"Dmint",Rdm:4242,"4242":"Rdm",Svdc_m80_Sreg:4243,"4243":"Svdc_m80_Sreg",Rsdc_Sreg_m80:4244,"4244":"Rsdc_Sreg_m80",Svldt_m80:4245,"4245":"Svldt_m80",Rsldt_m80:4246,"4246":"Rsldt_m80",Svts_m80:4247,"4247":"Svts_m80",Rsts_m80:4248,"4248":"Rsts_m80",Smint_0F7E:4249,"4249":"Smint_0F7E",Bb0_reset:4250,"4250":"Bb0_reset",Bb1_reset:4251,"4251":"Bb1_reset",Cpu_write:4252,"4252":"Cpu_write",Cpu_read:4253,"4253":"Cpu_read",Altinst:4254,"4254":"Altinst",Paveb_mm_mmm64:4255,"4255":"Paveb_mm_mmm64",Paddsiw_mm_mmm64:4256,"4256":"Paddsiw_mm_mmm64",Pmagw_mm_mmm64:4257,"4257":"Pmagw_mm_mmm64",Pdistib_mm_m64:4258,"4258":"Pdistib_mm_m64",Psubsiw_mm_mmm64:4259,"4259":"Psubsiw_mm_mmm64",Pmvzb_mm_m64:4260,"4260":"Pmvzb_mm_m64",Pmulhrw_mm_mmm64:4261,"4261":"Pmulhrw_mm_mmm64",Pmvnzb_mm_m64:4262,"4262":"Pmvnzb_mm_m64",Pmvlzb_mm_m64:4263,"4263":"Pmvlzb_mm_m64",Pmvgezb_mm_m64:4264,"4264":"Pmvgezb_mm_m64",Pmulhriw_mm_mmm64:4265,"4265":"Pmulhriw_mm_mmm64",Pmachriw_mm_m64:4266,"4266":"Pmachriw_mm_m64",Cyrix_D9D7:4267,"4267":"Cyrix_D9D7",Cyrix_D9E2:4268,"4268":"Cyrix_D9E2",Ftstp:4269,"4269":"Ftstp",Cyrix_D9E7:4270,"4270":"Cyrix_D9E7",Frint2:4271,"4271":"Frint2",Frichop:4272,"4272":"Frichop",Cyrix_DED8:4273,"4273":"Cyrix_DED8",Cyrix_DEDA:4274,"4274":"Cyrix_DEDA",Cyrix_DEDC:4275,"4275":"Cyrix_DEDC",Cyrix_DEDD:4276,"4276":"Cyrix_DEDD",Cyrix_DEDE:4277,"4277":"Cyrix_DEDE",Frinear:4278,"4278":"Frinear",Tdcall:4279,"4279":"Tdcall",Seamret:4280,"4280":"Seamret",Seamops:4281,"4281":"Seamops",Seamcall:4282,"4282":"Seamcall",Aesencwide128kl_m384:4283,"4283":"Aesencwide128kl_m384",Aesdecwide128kl_m384:4284,"4284":"Aesdecwide128kl_m384",Aesencwide256kl_m512:4285,"4285":"Aesencwide256kl_m512",Aesdecwide256kl_m512:4286,"4286":"Aesdecwide256kl_m512",Loadiwkey_xmm_xmm:4287,"4287":"Loadiwkey_xmm_xmm",Aesenc128kl_xmm_m384:4288,"4288":"Aesenc128kl_xmm_m384",Aesdec128kl_xmm_m384:4289,"4289":"Aesdec128kl_xmm_m384",Aesenc256kl_xmm_m512:4290,"4290":"Aesenc256kl_xmm_m512",Aesdec256kl_xmm_m512:4291,"4291":"Aesdec256kl_xmm_m512",Encodekey128_r32_r32:4292,"4292":"Encodekey128_r32_r32",Encodekey256_r32_r32:4293,"4293":"Encodekey256_r32_r32",VEX_Vbroadcastss_xmm_xmm:4294,"4294":"VEX_Vbroadcastss_xmm_xmm",VEX_Vbroadcastss_ymm_xmm:4295,"4295":"VEX_Vbroadcastss_ymm_xmm",VEX_Vbroadcastsd_ymm_xmm:4296,"4296":"VEX_Vbroadcastsd_ymm_xmm",Vmgexit_F2:4297,"4297":"Vmgexit_F2",Uiret:4298,"4298":"Uiret",Testui:4299,"4299":"Testui",Clui:4300,"4300":"Clui",Stui:4301,"4301":"Stui",Senduipi_r64:4302,"4302":"Senduipi_r64",Hreset_imm8:4303,"4303":"Hreset_imm8",VEX_Vpdpbusd_xmm_xmm_xmmm128:4304,"4304":"VEX_Vpdpbusd_xmm_xmm_xmmm128",VEX_Vpdpbusd_ymm_ymm_ymmm256:4305,"4305":"VEX_Vpdpbusd_ymm_ymm_ymmm256",VEX_Vpdpbusds_xmm_xmm_xmmm128:4306,"4306":"VEX_Vpdpbusds_xmm_xmm_xmmm128",VEX_Vpdpbusds_ymm_ymm_ymmm256:4307,"4307":"VEX_Vpdpbusds_ymm_ymm_ymmm256",VEX_Vpdpwssd_xmm_xmm_xmmm128:4308,"4308":"VEX_Vpdpwssd_xmm_xmm_xmmm128",VEX_Vpdpwssd_ymm_ymm_ymmm256:4309,"4309":"VEX_Vpdpwssd_ymm_ymm_ymmm256",VEX_Vpdpwssds_xmm_xmm_xmmm128:4310,"4310":"VEX_Vpdpwssds_xmm_xmm_xmmm128",VEX_Vpdpwssds_ymm_ymm_ymmm256:4311,"4311":"VEX_Vpdpwssds_ymm_ymm_ymmm256",Ccs_hash_16:4312,"4312":"Ccs_hash_16",Ccs_hash_32:4313,"4313":"Ccs_hash_32",Ccs_hash_64:4314,"4314":"Ccs_hash_64",Ccs_encrypt_16:4315,"4315":"Ccs_encrypt_16",Ccs_encrypt_32:4316,"4316":"Ccs_encrypt_32",Ccs_encrypt_64:4317,"4317":"Ccs_encrypt_64",Lkgs_rm16:4318,"4318":"Lkgs_rm16",Lkgs_r32m16:4319,"4319":"Lkgs_r32m16",Lkgs_r64m16:4320,"4320":"Lkgs_r64m16",Eretu:4321,"4321":"Eretu",Erets:4322,"4322":"Erets",EVEX_Vaddph_xmm_k1z_xmm_xmmm128b16:4323,"4323":"EVEX_Vaddph_xmm_k1z_xmm_xmmm128b16",EVEX_Vaddph_ymm_k1z_ymm_ymmm256b16:4324,"4324":"EVEX_Vaddph_ymm_k1z_ymm_ymmm256b16",EVEX_Vaddph_zmm_k1z_zmm_zmmm512b16_er:4325,"4325":"EVEX_Vaddph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vaddsh_xmm_k1z_xmm_xmmm16_er:4326,"4326":"EVEX_Vaddsh_xmm_k1z_xmm_xmmm16_er",EVEX_Vcmpph_kr_k1_xmm_xmmm128b16_imm8:4327,"4327":"EVEX_Vcmpph_kr_k1_xmm_xmmm128b16_imm8",EVEX_Vcmpph_kr_k1_ymm_ymmm256b16_imm8:4328,"4328":"EVEX_Vcmpph_kr_k1_ymm_ymmm256b16_imm8",EVEX_Vcmpph_kr_k1_zmm_zmmm512b16_imm8_sae:4329,"4329":"EVEX_Vcmpph_kr_k1_zmm_zmmm512b16_imm8_sae",EVEX_Vcmpsh_kr_k1_xmm_xmmm16_imm8_sae:4330,"4330":"EVEX_Vcmpsh_kr_k1_xmm_xmmm16_imm8_sae",EVEX_Vcomish_xmm_xmmm16_sae:4331,"4331":"EVEX_Vcomish_xmm_xmmm16_sae",EVEX_Vcvtdq2ph_xmm_k1z_xmmm128b32:4332,"4332":"EVEX_Vcvtdq2ph_xmm_k1z_xmmm128b32",EVEX_Vcvtdq2ph_xmm_k1z_ymmm256b32:4333,"4333":"EVEX_Vcvtdq2ph_xmm_k1z_ymmm256b32",EVEX_Vcvtdq2ph_ymm_k1z_zmmm512b32_er:4334,"4334":"EVEX_Vcvtdq2ph_ymm_k1z_zmmm512b32_er",EVEX_Vcvtpd2ph_xmm_k1z_xmmm128b64:4335,"4335":"EVEX_Vcvtpd2ph_xmm_k1z_xmmm128b64",EVEX_Vcvtpd2ph_xmm_k1z_ymmm256b64:4336,"4336":"EVEX_Vcvtpd2ph_xmm_k1z_ymmm256b64",EVEX_Vcvtpd2ph_xmm_k1z_zmmm512b64_er:4337,"4337":"EVEX_Vcvtpd2ph_xmm_k1z_zmmm512b64_er",EVEX_Vcvtph2dq_xmm_k1z_xmmm64b16:4338,"4338":"EVEX_Vcvtph2dq_xmm_k1z_xmmm64b16",EVEX_Vcvtph2dq_ymm_k1z_xmmm128b16:4339,"4339":"EVEX_Vcvtph2dq_ymm_k1z_xmmm128b16",EVEX_Vcvtph2dq_zmm_k1z_ymmm256b16_er:4340,"4340":"EVEX_Vcvtph2dq_zmm_k1z_ymmm256b16_er",EVEX_Vcvtph2pd_xmm_k1z_xmmm32b16:4341,"4341":"EVEX_Vcvtph2pd_xmm_k1z_xmmm32b16",EVEX_Vcvtph2pd_ymm_k1z_xmmm64b16:4342,"4342":"EVEX_Vcvtph2pd_ymm_k1z_xmmm64b16",EVEX_Vcvtph2pd_zmm_k1z_xmmm128b16_sae:4343,"4343":"EVEX_Vcvtph2pd_zmm_k1z_xmmm128b16_sae",EVEX_Vcvtph2psx_xmm_k1z_xmmm64b16:4344,"4344":"EVEX_Vcvtph2psx_xmm_k1z_xmmm64b16",EVEX_Vcvtph2psx_ymm_k1z_xmmm128b16:4345,"4345":"EVEX_Vcvtph2psx_ymm_k1z_xmmm128b16",EVEX_Vcvtph2psx_zmm_k1z_ymmm256b16_sae:4346,"4346":"EVEX_Vcvtph2psx_zmm_k1z_ymmm256b16_sae",EVEX_Vcvtph2qq_xmm_k1z_xmmm32b16:4347,"4347":"EVEX_Vcvtph2qq_xmm_k1z_xmmm32b16",EVEX_Vcvtph2qq_ymm_k1z_xmmm64b16:4348,"4348":"EVEX_Vcvtph2qq_ymm_k1z_xmmm64b16",EVEX_Vcvtph2qq_zmm_k1z_xmmm128b16_er:4349,"4349":"EVEX_Vcvtph2qq_zmm_k1z_xmmm128b16_er",EVEX_Vcvtph2udq_xmm_k1z_xmmm64b16:4350,"4350":"EVEX_Vcvtph2udq_xmm_k1z_xmmm64b16",EVEX_Vcvtph2udq_ymm_k1z_xmmm128b16:4351,"4351":"EVEX_Vcvtph2udq_ymm_k1z_xmmm128b16",EVEX_Vcvtph2udq_zmm_k1z_ymmm256b16_er:4352,"4352":"EVEX_Vcvtph2udq_zmm_k1z_ymmm256b16_er",EVEX_Vcvtph2uqq_xmm_k1z_xmmm32b16:4353,"4353":"EVEX_Vcvtph2uqq_xmm_k1z_xmmm32b16",EVEX_Vcvtph2uqq_ymm_k1z_xmmm64b16:4354,"4354":"EVEX_Vcvtph2uqq_ymm_k1z_xmmm64b16",EVEX_Vcvtph2uqq_zmm_k1z_xmmm128b16_er:4355,"4355":"EVEX_Vcvtph2uqq_zmm_k1z_xmmm128b16_er",EVEX_Vcvtph2uw_xmm_k1z_xmmm128b16:4356,"4356":"EVEX_Vcvtph2uw_xmm_k1z_xmmm128b16",EVEX_Vcvtph2uw_ymm_k1z_ymmm256b16:4357,"4357":"EVEX_Vcvtph2uw_ymm_k1z_ymmm256b16",EVEX_Vcvtph2uw_zmm_k1z_zmmm512b16_er:4358,"4358":"EVEX_Vcvtph2uw_zmm_k1z_zmmm512b16_er",EVEX_Vcvtph2w_xmm_k1z_xmmm128b16:4359,"4359":"EVEX_Vcvtph2w_xmm_k1z_xmmm128b16",EVEX_Vcvtph2w_ymm_k1z_ymmm256b16:4360,"4360":"EVEX_Vcvtph2w_ymm_k1z_ymmm256b16",EVEX_Vcvtph2w_zmm_k1z_zmmm512b16_er:4361,"4361":"EVEX_Vcvtph2w_zmm_k1z_zmmm512b16_er",EVEX_Vcvtps2phx_xmm_k1z_xmmm128b32:4362,"4362":"EVEX_Vcvtps2phx_xmm_k1z_xmmm128b32",EVEX_Vcvtps2phx_xmm_k1z_ymmm256b32:4363,"4363":"EVEX_Vcvtps2phx_xmm_k1z_ymmm256b32",EVEX_Vcvtps2phx_ymm_k1z_zmmm512b32_er:4364,"4364":"EVEX_Vcvtps2phx_ymm_k1z_zmmm512b32_er",EVEX_Vcvtqq2ph_xmm_k1z_xmmm128b64:4365,"4365":"EVEX_Vcvtqq2ph_xmm_k1z_xmmm128b64",EVEX_Vcvtqq2ph_xmm_k1z_ymmm256b64:4366,"4366":"EVEX_Vcvtqq2ph_xmm_k1z_ymmm256b64",EVEX_Vcvtqq2ph_xmm_k1z_zmmm512b64_er:4367,"4367":"EVEX_Vcvtqq2ph_xmm_k1z_zmmm512b64_er",EVEX_Vcvtsd2sh_xmm_k1z_xmm_xmmm64_er:4368,"4368":"EVEX_Vcvtsd2sh_xmm_k1z_xmm_xmmm64_er",EVEX_Vcvtsh2sd_xmm_k1z_xmm_xmmm16_sae:4369,"4369":"EVEX_Vcvtsh2sd_xmm_k1z_xmm_xmmm16_sae",EVEX_Vcvtsh2si_r32_xmmm16_er:4370,"4370":"EVEX_Vcvtsh2si_r32_xmmm16_er",EVEX_Vcvtsh2si_r64_xmmm16_er:4371,"4371":"EVEX_Vcvtsh2si_r64_xmmm16_er",EVEX_Vcvtsh2ss_xmm_k1z_xmm_xmmm16_sae:4372,"4372":"EVEX_Vcvtsh2ss_xmm_k1z_xmm_xmmm16_sae",EVEX_Vcvtsh2usi_r32_xmmm16_er:4373,"4373":"EVEX_Vcvtsh2usi_r32_xmmm16_er",EVEX_Vcvtsh2usi_r64_xmmm16_er:4374,"4374":"EVEX_Vcvtsh2usi_r64_xmmm16_er",EVEX_Vcvtsi2sh_xmm_xmm_rm32_er:4375,"4375":"EVEX_Vcvtsi2sh_xmm_xmm_rm32_er",EVEX_Vcvtsi2sh_xmm_xmm_rm64_er:4376,"4376":"EVEX_Vcvtsi2sh_xmm_xmm_rm64_er",EVEX_Vcvtss2sh_xmm_k1z_xmm_xmmm32_er:4377,"4377":"EVEX_Vcvtss2sh_xmm_k1z_xmm_xmmm32_er",EVEX_Vcvttph2dq_xmm_k1z_xmmm64b16:4378,"4378":"EVEX_Vcvttph2dq_xmm_k1z_xmmm64b16",EVEX_Vcvttph2dq_ymm_k1z_xmmm128b16:4379,"4379":"EVEX_Vcvttph2dq_ymm_k1z_xmmm128b16",EVEX_Vcvttph2dq_zmm_k1z_ymmm256b16_sae:4380,"4380":"EVEX_Vcvttph2dq_zmm_k1z_ymmm256b16_sae",EVEX_Vcvttph2qq_xmm_k1z_xmmm32b16:4381,"4381":"EVEX_Vcvttph2qq_xmm_k1z_xmmm32b16",EVEX_Vcvttph2qq_ymm_k1z_xmmm64b16:4382,"4382":"EVEX_Vcvttph2qq_ymm_k1z_xmmm64b16",EVEX_Vcvttph2qq_zmm_k1z_xmmm128b16_sae:4383,"4383":"EVEX_Vcvttph2qq_zmm_k1z_xmmm128b16_sae",EVEX_Vcvttph2udq_xmm_k1z_xmmm64b16:4384,"4384":"EVEX_Vcvttph2udq_xmm_k1z_xmmm64b16",EVEX_Vcvttph2udq_ymm_k1z_xmmm128b16:4385,"4385":"EVEX_Vcvttph2udq_ymm_k1z_xmmm128b16",EVEX_Vcvttph2udq_zmm_k1z_ymmm256b16_sae:4386,"4386":"EVEX_Vcvttph2udq_zmm_k1z_ymmm256b16_sae",EVEX_Vcvttph2uqq_xmm_k1z_xmmm32b16:4387,"4387":"EVEX_Vcvttph2uqq_xmm_k1z_xmmm32b16",EVEX_Vcvttph2uqq_ymm_k1z_xmmm64b16:4388,"4388":"EVEX_Vcvttph2uqq_ymm_k1z_xmmm64b16",EVEX_Vcvttph2uqq_zmm_k1z_xmmm128b16_sae:4389,"4389":"EVEX_Vcvttph2uqq_zmm_k1z_xmmm128b16_sae",EVEX_Vcvttph2uw_xmm_k1z_xmmm128b16:4390,"4390":"EVEX_Vcvttph2uw_xmm_k1z_xmmm128b16",EVEX_Vcvttph2uw_ymm_k1z_ymmm256b16:4391,"4391":"EVEX_Vcvttph2uw_ymm_k1z_ymmm256b16",EVEX_Vcvttph2uw_zmm_k1z_zmmm512b16_sae:4392,"4392":"EVEX_Vcvttph2uw_zmm_k1z_zmmm512b16_sae",EVEX_Vcvttph2w_xmm_k1z_xmmm128b16:4393,"4393":"EVEX_Vcvttph2w_xmm_k1z_xmmm128b16",EVEX_Vcvttph2w_ymm_k1z_ymmm256b16:4394,"4394":"EVEX_Vcvttph2w_ymm_k1z_ymmm256b16",EVEX_Vcvttph2w_zmm_k1z_zmmm512b16_sae:4395,"4395":"EVEX_Vcvttph2w_zmm_k1z_zmmm512b16_sae",EVEX_Vcvttsh2si_r32_xmmm16_sae:4396,"4396":"EVEX_Vcvttsh2si_r32_xmmm16_sae",EVEX_Vcvttsh2si_r64_xmmm16_sae:4397,"4397":"EVEX_Vcvttsh2si_r64_xmmm16_sae",EVEX_Vcvttsh2usi_r32_xmmm16_sae:4398,"4398":"EVEX_Vcvttsh2usi_r32_xmmm16_sae",EVEX_Vcvttsh2usi_r64_xmmm16_sae:4399,"4399":"EVEX_Vcvttsh2usi_r64_xmmm16_sae",EVEX_Vcvtudq2ph_xmm_k1z_xmmm128b32:4400,"4400":"EVEX_Vcvtudq2ph_xmm_k1z_xmmm128b32",EVEX_Vcvtudq2ph_xmm_k1z_ymmm256b32:4401,"4401":"EVEX_Vcvtudq2ph_xmm_k1z_ymmm256b32",EVEX_Vcvtudq2ph_ymm_k1z_zmmm512b32_er:4402,"4402":"EVEX_Vcvtudq2ph_ymm_k1z_zmmm512b32_er",EVEX_Vcvtuqq2ph_xmm_k1z_xmmm128b64:4403,"4403":"EVEX_Vcvtuqq2ph_xmm_k1z_xmmm128b64",EVEX_Vcvtuqq2ph_xmm_k1z_ymmm256b64:4404,"4404":"EVEX_Vcvtuqq2ph_xmm_k1z_ymmm256b64",EVEX_Vcvtuqq2ph_xmm_k1z_zmmm512b64_er:4405,"4405":"EVEX_Vcvtuqq2ph_xmm_k1z_zmmm512b64_er",EVEX_Vcvtusi2sh_xmm_xmm_rm32_er:4406,"4406":"EVEX_Vcvtusi2sh_xmm_xmm_rm32_er",EVEX_Vcvtusi2sh_xmm_xmm_rm64_er:4407,"4407":"EVEX_Vcvtusi2sh_xmm_xmm_rm64_er",EVEX_Vcvtuw2ph_xmm_k1z_xmmm128b16:4408,"4408":"EVEX_Vcvtuw2ph_xmm_k1z_xmmm128b16",EVEX_Vcvtuw2ph_ymm_k1z_ymmm256b16:4409,"4409":"EVEX_Vcvtuw2ph_ymm_k1z_ymmm256b16",EVEX_Vcvtuw2ph_zmm_k1z_zmmm512b16_er:4410,"4410":"EVEX_Vcvtuw2ph_zmm_k1z_zmmm512b16_er",EVEX_Vcvtw2ph_xmm_k1z_xmmm128b16:4411,"4411":"EVEX_Vcvtw2ph_xmm_k1z_xmmm128b16",EVEX_Vcvtw2ph_ymm_k1z_ymmm256b16:4412,"4412":"EVEX_Vcvtw2ph_ymm_k1z_ymmm256b16",EVEX_Vcvtw2ph_zmm_k1z_zmmm512b16_er:4413,"4413":"EVEX_Vcvtw2ph_zmm_k1z_zmmm512b16_er",EVEX_Vdivph_xmm_k1z_xmm_xmmm128b16:4414,"4414":"EVEX_Vdivph_xmm_k1z_xmm_xmmm128b16",EVEX_Vdivph_ymm_k1z_ymm_ymmm256b16:4415,"4415":"EVEX_Vdivph_ymm_k1z_ymm_ymmm256b16",EVEX_Vdivph_zmm_k1z_zmm_zmmm512b16_er:4416,"4416":"EVEX_Vdivph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vdivsh_xmm_k1z_xmm_xmmm16_er:4417,"4417":"EVEX_Vdivsh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfcmaddcph_xmm_k1z_xmm_xmmm128b32:4418,"4418":"EVEX_Vfcmaddcph_xmm_k1z_xmm_xmmm128b32",EVEX_Vfcmaddcph_ymm_k1z_ymm_ymmm256b32:4419,"4419":"EVEX_Vfcmaddcph_ymm_k1z_ymm_ymmm256b32",EVEX_Vfcmaddcph_zmm_k1z_zmm_zmmm512b32_er:4420,"4420":"EVEX_Vfcmaddcph_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmaddcph_xmm_k1z_xmm_xmmm128b32:4421,"4421":"EVEX_Vfmaddcph_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmaddcph_ymm_k1z_ymm_ymmm256b32:4422,"4422":"EVEX_Vfmaddcph_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmaddcph_zmm_k1z_zmm_zmmm512b32_er:4423,"4423":"EVEX_Vfmaddcph_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfcmaddcsh_xmm_k1z_xmm_xmmm32_er:4424,"4424":"EVEX_Vfcmaddcsh_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmaddcsh_xmm_k1z_xmm_xmmm32_er:4425,"4425":"EVEX_Vfmaddcsh_xmm_k1z_xmm_xmmm32_er",EVEX_Vfcmulcph_xmm_k1z_xmm_xmmm128b32:4426,"4426":"EVEX_Vfcmulcph_xmm_k1z_xmm_xmmm128b32",EVEX_Vfcmulcph_ymm_k1z_ymm_ymmm256b32:4427,"4427":"EVEX_Vfcmulcph_ymm_k1z_ymm_ymmm256b32",EVEX_Vfcmulcph_zmm_k1z_zmm_zmmm512b32_er:4428,"4428":"EVEX_Vfcmulcph_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfmulcph_xmm_k1z_xmm_xmmm128b32:4429,"4429":"EVEX_Vfmulcph_xmm_k1z_xmm_xmmm128b32",EVEX_Vfmulcph_ymm_k1z_ymm_ymmm256b32:4430,"4430":"EVEX_Vfmulcph_ymm_k1z_ymm_ymmm256b32",EVEX_Vfmulcph_zmm_k1z_zmm_zmmm512b32_er:4431,"4431":"EVEX_Vfmulcph_zmm_k1z_zmm_zmmm512b32_er",EVEX_Vfcmulcsh_xmm_k1z_xmm_xmmm32_er:4432,"4432":"EVEX_Vfcmulcsh_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmulcsh_xmm_k1z_xmm_xmmm32_er:4433,"4433":"EVEX_Vfmulcsh_xmm_k1z_xmm_xmmm32_er",EVEX_Vfmaddsub132ph_xmm_k1z_xmm_xmmm128b16:4434,"4434":"EVEX_Vfmaddsub132ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmaddsub132ph_ymm_k1z_ymm_ymmm256b16:4435,"4435":"EVEX_Vfmaddsub132ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmaddsub132ph_zmm_k1z_zmm_zmmm512b16_er:4436,"4436":"EVEX_Vfmaddsub132ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmaddsub213ph_xmm_k1z_xmm_xmmm128b16:4437,"4437":"EVEX_Vfmaddsub213ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmaddsub213ph_ymm_k1z_ymm_ymmm256b16:4438,"4438":"EVEX_Vfmaddsub213ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmaddsub213ph_zmm_k1z_zmm_zmmm512b16_er:4439,"4439":"EVEX_Vfmaddsub213ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmaddsub231ph_xmm_k1z_xmm_xmmm128b16:4440,"4440":"EVEX_Vfmaddsub231ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmaddsub231ph_ymm_k1z_ymm_ymmm256b16:4441,"4441":"EVEX_Vfmaddsub231ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmaddsub231ph_zmm_k1z_zmm_zmmm512b16_er:4442,"4442":"EVEX_Vfmaddsub231ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmsubadd132ph_xmm_k1z_xmm_xmmm128b16:4443,"4443":"EVEX_Vfmsubadd132ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmsubadd132ph_ymm_k1z_ymm_ymmm256b16:4444,"4444":"EVEX_Vfmsubadd132ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmsubadd132ph_zmm_k1z_zmm_zmmm512b16_er:4445,"4445":"EVEX_Vfmsubadd132ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmsubadd213ph_xmm_k1z_xmm_xmmm128b16:4446,"4446":"EVEX_Vfmsubadd213ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmsubadd213ph_ymm_k1z_ymm_ymmm256b16:4447,"4447":"EVEX_Vfmsubadd213ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmsubadd213ph_zmm_k1z_zmm_zmmm512b16_er:4448,"4448":"EVEX_Vfmsubadd213ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmsubadd231ph_xmm_k1z_xmm_xmmm128b16:4449,"4449":"EVEX_Vfmsubadd231ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmsubadd231ph_ymm_k1z_ymm_ymmm256b16:4450,"4450":"EVEX_Vfmsubadd231ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmsubadd231ph_zmm_k1z_zmm_zmmm512b16_er:4451,"4451":"EVEX_Vfmsubadd231ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmadd132ph_xmm_k1z_xmm_xmmm128b16:4452,"4452":"EVEX_Vfmadd132ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmadd132ph_ymm_k1z_ymm_ymmm256b16:4453,"4453":"EVEX_Vfmadd132ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmadd132ph_zmm_k1z_zmm_zmmm512b16_er:4454,"4454":"EVEX_Vfmadd132ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmadd213ph_xmm_k1z_xmm_xmmm128b16:4455,"4455":"EVEX_Vfmadd213ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmadd213ph_ymm_k1z_ymm_ymmm256b16:4456,"4456":"EVEX_Vfmadd213ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmadd213ph_zmm_k1z_zmm_zmmm512b16_er:4457,"4457":"EVEX_Vfmadd213ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmadd231ph_xmm_k1z_xmm_xmmm128b16:4458,"4458":"EVEX_Vfmadd231ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmadd231ph_ymm_k1z_ymm_ymmm256b16:4459,"4459":"EVEX_Vfmadd231ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmadd231ph_zmm_k1z_zmm_zmmm512b16_er:4460,"4460":"EVEX_Vfmadd231ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfnmadd132ph_xmm_k1z_xmm_xmmm128b16:4461,"4461":"EVEX_Vfnmadd132ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfnmadd132ph_ymm_k1z_ymm_ymmm256b16:4462,"4462":"EVEX_Vfnmadd132ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfnmadd132ph_zmm_k1z_zmm_zmmm512b16_er:4463,"4463":"EVEX_Vfnmadd132ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfnmadd213ph_xmm_k1z_xmm_xmmm128b16:4464,"4464":"EVEX_Vfnmadd213ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfnmadd213ph_ymm_k1z_ymm_ymmm256b16:4465,"4465":"EVEX_Vfnmadd213ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfnmadd213ph_zmm_k1z_zmm_zmmm512b16_er:4466,"4466":"EVEX_Vfnmadd213ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfnmadd231ph_xmm_k1z_xmm_xmmm128b16:4467,"4467":"EVEX_Vfnmadd231ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfnmadd231ph_ymm_k1z_ymm_ymmm256b16:4468,"4468":"EVEX_Vfnmadd231ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfnmadd231ph_zmm_k1z_zmm_zmmm512b16_er:4469,"4469":"EVEX_Vfnmadd231ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmadd132sh_xmm_k1z_xmm_xmmm16_er:4470,"4470":"EVEX_Vfmadd132sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfmadd213sh_xmm_k1z_xmm_xmmm16_er:4471,"4471":"EVEX_Vfmadd213sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfmadd231sh_xmm_k1z_xmm_xmmm16_er:4472,"4472":"EVEX_Vfmadd231sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfnmadd132sh_xmm_k1z_xmm_xmmm16_er:4473,"4473":"EVEX_Vfnmadd132sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfnmadd213sh_xmm_k1z_xmm_xmmm16_er:4474,"4474":"EVEX_Vfnmadd213sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfnmadd231sh_xmm_k1z_xmm_xmmm16_er:4475,"4475":"EVEX_Vfnmadd231sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfmsub132ph_xmm_k1z_xmm_xmmm128b16:4476,"4476":"EVEX_Vfmsub132ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmsub132ph_ymm_k1z_ymm_ymmm256b16:4477,"4477":"EVEX_Vfmsub132ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmsub132ph_zmm_k1z_zmm_zmmm512b16_er:4478,"4478":"EVEX_Vfmsub132ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmsub213ph_xmm_k1z_xmm_xmmm128b16:4479,"4479":"EVEX_Vfmsub213ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmsub213ph_ymm_k1z_ymm_ymmm256b16:4480,"4480":"EVEX_Vfmsub213ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmsub213ph_zmm_k1z_zmm_zmmm512b16_er:4481,"4481":"EVEX_Vfmsub213ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmsub231ph_xmm_k1z_xmm_xmmm128b16:4482,"4482":"EVEX_Vfmsub231ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfmsub231ph_ymm_k1z_ymm_ymmm256b16:4483,"4483":"EVEX_Vfmsub231ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfmsub231ph_zmm_k1z_zmm_zmmm512b16_er:4484,"4484":"EVEX_Vfmsub231ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfnmsub132ph_xmm_k1z_xmm_xmmm128b16:4485,"4485":"EVEX_Vfnmsub132ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfnmsub132ph_ymm_k1z_ymm_ymmm256b16:4486,"4486":"EVEX_Vfnmsub132ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfnmsub132ph_zmm_k1z_zmm_zmmm512b16_er:4487,"4487":"EVEX_Vfnmsub132ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfnmsub213ph_xmm_k1z_xmm_xmmm128b16:4488,"4488":"EVEX_Vfnmsub213ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfnmsub213ph_ymm_k1z_ymm_ymmm256b16:4489,"4489":"EVEX_Vfnmsub213ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfnmsub213ph_zmm_k1z_zmm_zmmm512b16_er:4490,"4490":"EVEX_Vfnmsub213ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfnmsub231ph_xmm_k1z_xmm_xmmm128b16:4491,"4491":"EVEX_Vfnmsub231ph_xmm_k1z_xmm_xmmm128b16",EVEX_Vfnmsub231ph_ymm_k1z_ymm_ymmm256b16:4492,"4492":"EVEX_Vfnmsub231ph_ymm_k1z_ymm_ymmm256b16",EVEX_Vfnmsub231ph_zmm_k1z_zmm_zmmm512b16_er:4493,"4493":"EVEX_Vfnmsub231ph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vfmsub132sh_xmm_k1z_xmm_xmmm16_er:4494,"4494":"EVEX_Vfmsub132sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfmsub213sh_xmm_k1z_xmm_xmmm16_er:4495,"4495":"EVEX_Vfmsub213sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfmsub231sh_xmm_k1z_xmm_xmmm16_er:4496,"4496":"EVEX_Vfmsub231sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfnmsub132sh_xmm_k1z_xmm_xmmm16_er:4497,"4497":"EVEX_Vfnmsub132sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfnmsub213sh_xmm_k1z_xmm_xmmm16_er:4498,"4498":"EVEX_Vfnmsub213sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfnmsub231sh_xmm_k1z_xmm_xmmm16_er:4499,"4499":"EVEX_Vfnmsub231sh_xmm_k1z_xmm_xmmm16_er",EVEX_Vfpclassph_kr_k1_xmmm128b16_imm8:4500,"4500":"EVEX_Vfpclassph_kr_k1_xmmm128b16_imm8",EVEX_Vfpclassph_kr_k1_ymmm256b16_imm8:4501,"4501":"EVEX_Vfpclassph_kr_k1_ymmm256b16_imm8",EVEX_Vfpclassph_kr_k1_zmmm512b16_imm8:4502,"4502":"EVEX_Vfpclassph_kr_k1_zmmm512b16_imm8",EVEX_Vfpclasssh_kr_k1_xmmm16_imm8:4503,"4503":"EVEX_Vfpclasssh_kr_k1_xmmm16_imm8",EVEX_Vgetexpph_xmm_k1z_xmmm128b16:4504,"4504":"EVEX_Vgetexpph_xmm_k1z_xmmm128b16",EVEX_Vgetexpph_ymm_k1z_ymmm256b16:4505,"4505":"EVEX_Vgetexpph_ymm_k1z_ymmm256b16",EVEX_Vgetexpph_zmm_k1z_zmmm512b16_sae:4506,"4506":"EVEX_Vgetexpph_zmm_k1z_zmmm512b16_sae",EVEX_Vgetexpsh_xmm_k1z_xmm_xmmm16_sae:4507,"4507":"EVEX_Vgetexpsh_xmm_k1z_xmm_xmmm16_sae",EVEX_Vgetmantph_xmm_k1z_xmmm128b16_imm8:4508,"4508":"EVEX_Vgetmantph_xmm_k1z_xmmm128b16_imm8",EVEX_Vgetmantph_ymm_k1z_ymmm256b16_imm8:4509,"4509":"EVEX_Vgetmantph_ymm_k1z_ymmm256b16_imm8",EVEX_Vgetmantph_zmm_k1z_zmmm512b16_imm8_sae:4510,"4510":"EVEX_Vgetmantph_zmm_k1z_zmmm512b16_imm8_sae",EVEX_Vgetmantsh_xmm_k1z_xmm_xmmm16_imm8_sae:4511,"4511":"EVEX_Vgetmantsh_xmm_k1z_xmm_xmmm16_imm8_sae",EVEX_Vmaxph_xmm_k1z_xmm_xmmm128b16:4512,"4512":"EVEX_Vmaxph_xmm_k1z_xmm_xmmm128b16",EVEX_Vmaxph_ymm_k1z_ymm_ymmm256b16:4513,"4513":"EVEX_Vmaxph_ymm_k1z_ymm_ymmm256b16",EVEX_Vmaxph_zmm_k1z_zmm_zmmm512b16_sae:4514,"4514":"EVEX_Vmaxph_zmm_k1z_zmm_zmmm512b16_sae",EVEX_Vmaxsh_xmm_k1z_xmm_xmmm16_sae:4515,"4515":"EVEX_Vmaxsh_xmm_k1z_xmm_xmmm16_sae",EVEX_Vminph_xmm_k1z_xmm_xmmm128b16:4516,"4516":"EVEX_Vminph_xmm_k1z_xmm_xmmm128b16",EVEX_Vminph_ymm_k1z_ymm_ymmm256b16:4517,"4517":"EVEX_Vminph_ymm_k1z_ymm_ymmm256b16",EVEX_Vminph_zmm_k1z_zmm_zmmm512b16_sae:4518,"4518":"EVEX_Vminph_zmm_k1z_zmm_zmmm512b16_sae",EVEX_Vminsh_xmm_k1z_xmm_xmmm16_sae:4519,"4519":"EVEX_Vminsh_xmm_k1z_xmm_xmmm16_sae",EVEX_Vmovsh_xmm_k1z_m16:4520,"4520":"EVEX_Vmovsh_xmm_k1z_m16",EVEX_Vmovsh_m16_k1_xmm:4521,"4521":"EVEX_Vmovsh_m16_k1_xmm",EVEX_Vmovsh_xmm_k1z_xmm_xmm:4522,"4522":"EVEX_Vmovsh_xmm_k1z_xmm_xmm",EVEX_Vmovsh_xmm_k1z_xmm_xmm_MAP5_11:4523,"4523":"EVEX_Vmovsh_xmm_k1z_xmm_xmm_MAP5_11",EVEX_Vmovw_xmm_r32m16:4524,"4524":"EVEX_Vmovw_xmm_r32m16",EVEX_Vmovw_xmm_r64m16:4525,"4525":"EVEX_Vmovw_xmm_r64m16",EVEX_Vmovw_r32m16_xmm:4526,"4526":"EVEX_Vmovw_r32m16_xmm",EVEX_Vmovw_r64m16_xmm:4527,"4527":"EVEX_Vmovw_r64m16_xmm",EVEX_Vmulph_xmm_k1z_xmm_xmmm128b16:4528,"4528":"EVEX_Vmulph_xmm_k1z_xmm_xmmm128b16",EVEX_Vmulph_ymm_k1z_ymm_ymmm256b16:4529,"4529":"EVEX_Vmulph_ymm_k1z_ymm_ymmm256b16",EVEX_Vmulph_zmm_k1z_zmm_zmmm512b16_er:4530,"4530":"EVEX_Vmulph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vmulsh_xmm_k1z_xmm_xmmm16_er:4531,"4531":"EVEX_Vmulsh_xmm_k1z_xmm_xmmm16_er",EVEX_Vrcpph_xmm_k1z_xmmm128b16:4532,"4532":"EVEX_Vrcpph_xmm_k1z_xmmm128b16",EVEX_Vrcpph_ymm_k1z_ymmm256b16:4533,"4533":"EVEX_Vrcpph_ymm_k1z_ymmm256b16",EVEX_Vrcpph_zmm_k1z_zmmm512b16:4534,"4534":"EVEX_Vrcpph_zmm_k1z_zmmm512b16",EVEX_Vrcpsh_xmm_k1z_xmm_xmmm16:4535,"4535":"EVEX_Vrcpsh_xmm_k1z_xmm_xmmm16",EVEX_Vreduceph_xmm_k1z_xmmm128b16_imm8:4536,"4536":"EVEX_Vreduceph_xmm_k1z_xmmm128b16_imm8",EVEX_Vreduceph_ymm_k1z_ymmm256b16_imm8:4537,"4537":"EVEX_Vreduceph_ymm_k1z_ymmm256b16_imm8",EVEX_Vreduceph_zmm_k1z_zmmm512b16_imm8_sae:4538,"4538":"EVEX_Vreduceph_zmm_k1z_zmmm512b16_imm8_sae",EVEX_Vreducesh_xmm_k1z_xmm_xmmm16_imm8_sae:4539,"4539":"EVEX_Vreducesh_xmm_k1z_xmm_xmmm16_imm8_sae",EVEX_Vrndscaleph_xmm_k1z_xmmm128b16_imm8:4540,"4540":"EVEX_Vrndscaleph_xmm_k1z_xmmm128b16_imm8",EVEX_Vrndscaleph_ymm_k1z_ymmm256b16_imm8:4541,"4541":"EVEX_Vrndscaleph_ymm_k1z_ymmm256b16_imm8",EVEX_Vrndscaleph_zmm_k1z_zmmm512b16_imm8_sae:4542,"4542":"EVEX_Vrndscaleph_zmm_k1z_zmmm512b16_imm8_sae",EVEX_Vrndscalesh_xmm_k1z_xmm_xmmm16_imm8_sae:4543,"4543":"EVEX_Vrndscalesh_xmm_k1z_xmm_xmmm16_imm8_sae",EVEX_Vrsqrtph_xmm_k1z_xmmm128b16:4544,"4544":"EVEX_Vrsqrtph_xmm_k1z_xmmm128b16",EVEX_Vrsqrtph_ymm_k1z_ymmm256b16:4545,"4545":"EVEX_Vrsqrtph_ymm_k1z_ymmm256b16",EVEX_Vrsqrtph_zmm_k1z_zmmm512b16:4546,"4546":"EVEX_Vrsqrtph_zmm_k1z_zmmm512b16",EVEX_Vrsqrtsh_xmm_k1z_xmm_xmmm16:4547,"4547":"EVEX_Vrsqrtsh_xmm_k1z_xmm_xmmm16",EVEX_Vscalefph_xmm_k1z_xmm_xmmm128b16:4548,"4548":"EVEX_Vscalefph_xmm_k1z_xmm_xmmm128b16",EVEX_Vscalefph_ymm_k1z_ymm_ymmm256b16:4549,"4549":"EVEX_Vscalefph_ymm_k1z_ymm_ymmm256b16",EVEX_Vscalefph_zmm_k1z_zmm_zmmm512b16_er:4550,"4550":"EVEX_Vscalefph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vscalefsh_xmm_k1z_xmm_xmmm16_er:4551,"4551":"EVEX_Vscalefsh_xmm_k1z_xmm_xmmm16_er",EVEX_Vsqrtph_xmm_k1z_xmmm128b16:4552,"4552":"EVEX_Vsqrtph_xmm_k1z_xmmm128b16",EVEX_Vsqrtph_ymm_k1z_ymmm256b16:4553,"4553":"EVEX_Vsqrtph_ymm_k1z_ymmm256b16",EVEX_Vsqrtph_zmm_k1z_zmmm512b16_er:4554,"4554":"EVEX_Vsqrtph_zmm_k1z_zmmm512b16_er",EVEX_Vsqrtsh_xmm_k1z_xmm_xmmm16_er:4555,"4555":"EVEX_Vsqrtsh_xmm_k1z_xmm_xmmm16_er",EVEX_Vsubph_xmm_k1z_xmm_xmmm128b16:4556,"4556":"EVEX_Vsubph_xmm_k1z_xmm_xmmm128b16",EVEX_Vsubph_ymm_k1z_ymm_ymmm256b16:4557,"4557":"EVEX_Vsubph_ymm_k1z_ymm_ymmm256b16",EVEX_Vsubph_zmm_k1z_zmm_zmmm512b16_er:4558,"4558":"EVEX_Vsubph_zmm_k1z_zmm_zmmm512b16_er",EVEX_Vsubsh_xmm_k1z_xmm_xmmm16_er:4559,"4559":"EVEX_Vsubsh_xmm_k1z_xmm_xmmm16_er",EVEX_Vucomish_xmm_xmmm16_sae:4560,"4560":"EVEX_Vucomish_xmm_xmmm16_sae",Rdudbg:4561,"4561":"Rdudbg",Wrudbg:4562,"4562":"Wrudbg",VEX_KNC_Jkzd_kr_rel8_64:4563,"4563":"VEX_KNC_Jkzd_kr_rel8_64",VEX_KNC_Jknzd_kr_rel8_64:4564,"4564":"VEX_KNC_Jknzd_kr_rel8_64",VEX_KNC_Vprefetchnta_m8:4565,"4565":"VEX_KNC_Vprefetchnta_m8",VEX_KNC_Vprefetch0_m8:4566,"4566":"VEX_KNC_Vprefetch0_m8",VEX_KNC_Vprefetch1_m8:4567,"4567":"VEX_KNC_Vprefetch1_m8",VEX_KNC_Vprefetch2_m8:4568,"4568":"VEX_KNC_Vprefetch2_m8",VEX_KNC_Vprefetchenta_m8:4569,"4569":"VEX_KNC_Vprefetchenta_m8",VEX_KNC_Vprefetche0_m8:4570,"4570":"VEX_KNC_Vprefetche0_m8",VEX_KNC_Vprefetche1_m8:4571,"4571":"VEX_KNC_Vprefetche1_m8",VEX_KNC_Vprefetche2_m8:4572,"4572":"VEX_KNC_Vprefetche2_m8",VEX_KNC_Kand_kr_kr:4573,"4573":"VEX_KNC_Kand_kr_kr",VEX_KNC_Kandn_kr_kr:4574,"4574":"VEX_KNC_Kandn_kr_kr",VEX_KNC_Kandnr_kr_kr:4575,"4575":"VEX_KNC_Kandnr_kr_kr",VEX_KNC_Knot_kr_kr:4576,"4576":"VEX_KNC_Knot_kr_kr",VEX_KNC_Kor_kr_kr:4577,"4577":"VEX_KNC_Kor_kr_kr",VEX_KNC_Kxnor_kr_kr:4578,"4578":"VEX_KNC_Kxnor_kr_kr",VEX_KNC_Kxor_kr_kr:4579,"4579":"VEX_KNC_Kxor_kr_kr",VEX_KNC_Kmerge2l1h_kr_kr:4580,"4580":"VEX_KNC_Kmerge2l1h_kr_kr",VEX_KNC_Kmerge2l1l_kr_kr:4581,"4581":"VEX_KNC_Kmerge2l1l_kr_kr",VEX_KNC_Jkzd_kr_rel32_64:4582,"4582":"VEX_KNC_Jkzd_kr_rel32_64",VEX_KNC_Jknzd_kr_rel32_64:4583,"4583":"VEX_KNC_Jknzd_kr_rel32_64",VEX_KNC_Kmov_kr_kr:4584,"4584":"VEX_KNC_Kmov_kr_kr",VEX_KNC_Kmov_kr_r32:4585,"4585":"VEX_KNC_Kmov_kr_r32",VEX_KNC_Kmov_r32_kr:4586,"4586":"VEX_KNC_Kmov_r32_kr",VEX_KNC_Kconcath_r64_kr_kr:4587,"4587":"VEX_KNC_Kconcath_r64_kr_kr",VEX_KNC_Kconcatl_r64_kr_kr:4588,"4588":"VEX_KNC_Kconcatl_r64_kr_kr",VEX_KNC_Kortest_kr_kr:4589,"4589":"VEX_KNC_Kortest_kr_kr",VEX_KNC_Delay_r32:4590,"4590":"VEX_KNC_Delay_r32",VEX_KNC_Delay_r64:4591,"4591":"VEX_KNC_Delay_r64",VEX_KNC_Spflt_r32:4592,"4592":"VEX_KNC_Spflt_r32",VEX_KNC_Spflt_r64:4593,"4593":"VEX_KNC_Spflt_r64",VEX_KNC_Clevict1_m8:4594,"4594":"VEX_KNC_Clevict1_m8",VEX_KNC_Clevict0_m8:4595,"4595":"VEX_KNC_Clevict0_m8",VEX_KNC_Popcnt_r32_r32:4596,"4596":"VEX_KNC_Popcnt_r32_r32",VEX_KNC_Popcnt_r64_r64:4597,"4597":"VEX_KNC_Popcnt_r64_r64",VEX_KNC_Tzcnt_r32_r32:4598,"4598":"VEX_KNC_Tzcnt_r32_r32",VEX_KNC_Tzcnt_r64_r64:4599,"4599":"VEX_KNC_Tzcnt_r64_r64",VEX_KNC_Tzcnti_r32_r32:4600,"4600":"VEX_KNC_Tzcnti_r32_r32",VEX_KNC_Tzcnti_r64_r64:4601,"4601":"VEX_KNC_Tzcnti_r64_r64",VEX_KNC_Lzcnt_r32_r32:4602,"4602":"VEX_KNC_Lzcnt_r32_r32",VEX_KNC_Lzcnt_r64_r64:4603,"4603":"VEX_KNC_Lzcnt_r64_r64",VEX_KNC_Undoc_r32_rm32_128_F3_0F38_W0_F0:4604,"4604":"VEX_KNC_Undoc_r32_rm32_128_F3_0F38_W0_F0",VEX_KNC_Undoc_r64_rm64_128_F3_0F38_W1_F0:4605,"4605":"VEX_KNC_Undoc_r64_rm64_128_F3_0F38_W1_F0",VEX_KNC_Undoc_r32_rm32_128_F2_0F38_W0_F0:4606,"4606":"VEX_KNC_Undoc_r32_rm32_128_F2_0F38_W0_F0",VEX_KNC_Undoc_r64_rm64_128_F2_0F38_W1_F0:4607,"4607":"VEX_KNC_Undoc_r64_rm64_128_F2_0F38_W1_F0",VEX_KNC_Undoc_r32_rm32_128_F2_0F38_W0_F1:4608,"4608":"VEX_KNC_Undoc_r32_rm32_128_F2_0F38_W0_F1",VEX_KNC_Undoc_r64_rm64_128_F2_0F38_W1_F1:4609,"4609":"VEX_KNC_Undoc_r64_rm64_128_F2_0F38_W1_F1",VEX_KNC_Kextract_kr_r64_imm8:4610,"4610":"VEX_KNC_Kextract_kr_r64_imm8",MVEX_Vprefetchnta_m:4611,"4611":"MVEX_Vprefetchnta_m",MVEX_Vprefetch0_m:4612,"4612":"MVEX_Vprefetch0_m",MVEX_Vprefetch1_m:4613,"4613":"MVEX_Vprefetch1_m",MVEX_Vprefetch2_m:4614,"4614":"MVEX_Vprefetch2_m",MVEX_Vprefetchenta_m:4615,"4615":"MVEX_Vprefetchenta_m",MVEX_Vprefetche0_m:4616,"4616":"MVEX_Vprefetche0_m",MVEX_Vprefetche1_m:4617,"4617":"MVEX_Vprefetche1_m",MVEX_Vprefetche2_m:4618,"4618":"MVEX_Vprefetche2_m",MVEX_Vmovaps_zmm_k1_zmmmt:4619,"4619":"MVEX_Vmovaps_zmm_k1_zmmmt",MVEX_Vmovapd_zmm_k1_zmmmt:4620,"4620":"MVEX_Vmovapd_zmm_k1_zmmmt",MVEX_Vmovaps_mt_k1_zmm:4621,"4621":"MVEX_Vmovaps_mt_k1_zmm",MVEX_Vmovapd_mt_k1_zmm:4622,"4622":"MVEX_Vmovapd_mt_k1_zmm",MVEX_Vmovnrapd_m_k1_zmm:4623,"4623":"MVEX_Vmovnrapd_m_k1_zmm",MVEX_Vmovnrngoapd_m_k1_zmm:4624,"4624":"MVEX_Vmovnrngoapd_m_k1_zmm",MVEX_Vmovnraps_m_k1_zmm:4625,"4625":"MVEX_Vmovnraps_m_k1_zmm",MVEX_Vmovnrngoaps_m_k1_zmm:4626,"4626":"MVEX_Vmovnrngoaps_m_k1_zmm",MVEX_Vaddps_zmm_k1_zmm_zmmmt:4627,"4627":"MVEX_Vaddps_zmm_k1_zmm_zmmmt",MVEX_Vaddpd_zmm_k1_zmm_zmmmt:4628,"4628":"MVEX_Vaddpd_zmm_k1_zmm_zmmmt",MVEX_Vmulps_zmm_k1_zmm_zmmmt:4629,"4629":"MVEX_Vmulps_zmm_k1_zmm_zmmmt",MVEX_Vmulpd_zmm_k1_zmm_zmmmt:4630,"4630":"MVEX_Vmulpd_zmm_k1_zmm_zmmmt",MVEX_Vcvtps2pd_zmm_k1_zmmmt:4631,"4631":"MVEX_Vcvtps2pd_zmm_k1_zmmmt",MVEX_Vcvtpd2ps_zmm_k1_zmmmt:4632,"4632":"MVEX_Vcvtpd2ps_zmm_k1_zmmmt",MVEX_Vsubps_zmm_k1_zmm_zmmmt:4633,"4633":"MVEX_Vsubps_zmm_k1_zmm_zmmmt",MVEX_Vsubpd_zmm_k1_zmm_zmmmt:4634,"4634":"MVEX_Vsubpd_zmm_k1_zmm_zmmmt",MVEX_Vpcmpgtd_kr_k1_zmm_zmmmt:4635,"4635":"MVEX_Vpcmpgtd_kr_k1_zmm_zmmmt",MVEX_Vmovdqa32_zmm_k1_zmmmt:4636,"4636":"MVEX_Vmovdqa32_zmm_k1_zmmmt",MVEX_Vmovdqa64_zmm_k1_zmmmt:4637,"4637":"MVEX_Vmovdqa64_zmm_k1_zmmmt",MVEX_Vpshufd_zmm_k1_zmmmt_imm8:4638,"4638":"MVEX_Vpshufd_zmm_k1_zmmmt_imm8",MVEX_Vpsrld_zmm_k1_zmmmt_imm8:4639,"4639":"MVEX_Vpsrld_zmm_k1_zmmmt_imm8",MVEX_Vpsrad_zmm_k1_zmmmt_imm8:4640,"4640":"MVEX_Vpsrad_zmm_k1_zmmmt_imm8",MVEX_Vpslld_zmm_k1_zmmmt_imm8:4641,"4641":"MVEX_Vpslld_zmm_k1_zmmmt_imm8",MVEX_Vpcmpeqd_kr_k1_zmm_zmmmt:4642,"4642":"MVEX_Vpcmpeqd_kr_k1_zmm_zmmmt",MVEX_Vcvtudq2pd_zmm_k1_zmmmt:4643,"4643":"MVEX_Vcvtudq2pd_zmm_k1_zmmmt",MVEX_Vmovdqa32_mt_k1_zmm:4644,"4644":"MVEX_Vmovdqa32_mt_k1_zmm",MVEX_Vmovdqa64_mt_k1_zmm:4645,"4645":"MVEX_Vmovdqa64_mt_k1_zmm",MVEX_Clevict1_m:4646,"4646":"MVEX_Clevict1_m",MVEX_Clevict0_m:4647,"4647":"MVEX_Clevict0_m",MVEX_Vcmpps_kr_k1_zmm_zmmmt_imm8:4648,"4648":"MVEX_Vcmpps_kr_k1_zmm_zmmmt_imm8",MVEX_Vcmppd_kr_k1_zmm_zmmmt_imm8:4649,"4649":"MVEX_Vcmppd_kr_k1_zmm_zmmmt_imm8",MVEX_Vpandd_zmm_k1_zmm_zmmmt:4650,"4650":"MVEX_Vpandd_zmm_k1_zmm_zmmmt",MVEX_Vpandq_zmm_k1_zmm_zmmmt:4651,"4651":"MVEX_Vpandq_zmm_k1_zmm_zmmmt",MVEX_Vpandnd_zmm_k1_zmm_zmmmt:4652,"4652":"MVEX_Vpandnd_zmm_k1_zmm_zmmmt",MVEX_Vpandnq_zmm_k1_zmm_zmmmt:4653,"4653":"MVEX_Vpandnq_zmm_k1_zmm_zmmmt",MVEX_Vcvtdq2pd_zmm_k1_zmmmt:4654,"4654":"MVEX_Vcvtdq2pd_zmm_k1_zmmmt",MVEX_Vpord_zmm_k1_zmm_zmmmt:4655,"4655":"MVEX_Vpord_zmm_k1_zmm_zmmmt",MVEX_Vporq_zmm_k1_zmm_zmmmt:4656,"4656":"MVEX_Vporq_zmm_k1_zmm_zmmmt",MVEX_Vpxord_zmm_k1_zmm_zmmmt:4657,"4657":"MVEX_Vpxord_zmm_k1_zmm_zmmmt",MVEX_Vpxorq_zmm_k1_zmm_zmmmt:4658,"4658":"MVEX_Vpxorq_zmm_k1_zmm_zmmmt",MVEX_Vpsubd_zmm_k1_zmm_zmmmt:4659,"4659":"MVEX_Vpsubd_zmm_k1_zmm_zmmmt",MVEX_Vpaddd_zmm_k1_zmm_zmmmt:4660,"4660":"MVEX_Vpaddd_zmm_k1_zmm_zmmmt",MVEX_Vbroadcastss_zmm_k1_mt:4661,"4661":"MVEX_Vbroadcastss_zmm_k1_mt",MVEX_Vbroadcastsd_zmm_k1_mt:4662,"4662":"MVEX_Vbroadcastsd_zmm_k1_mt",MVEX_Vbroadcastf32x4_zmm_k1_mt:4663,"4663":"MVEX_Vbroadcastf32x4_zmm_k1_mt",MVEX_Vbroadcastf64x4_zmm_k1_mt:4664,"4664":"MVEX_Vbroadcastf64x4_zmm_k1_mt",MVEX_Vptestmd_kr_k1_zmm_zmmmt:4665,"4665":"MVEX_Vptestmd_kr_k1_zmm_zmmmt",MVEX_Vpermd_zmm_k1_zmm_zmmmt:4666,"4666":"MVEX_Vpermd_zmm_k1_zmm_zmmmt",MVEX_Vpminsd_zmm_k1_zmm_zmmmt:4667,"4667":"MVEX_Vpminsd_zmm_k1_zmm_zmmmt",MVEX_Vpminud_zmm_k1_zmm_zmmmt:4668,"4668":"MVEX_Vpminud_zmm_k1_zmm_zmmmt",MVEX_Vpmaxsd_zmm_k1_zmm_zmmmt:4669,"4669":"MVEX_Vpmaxsd_zmm_k1_zmm_zmmmt",MVEX_Vpmaxud_zmm_k1_zmm_zmmmt:4670,"4670":"MVEX_Vpmaxud_zmm_k1_zmm_zmmmt",MVEX_Vpmulld_zmm_k1_zmm_zmmmt:4671,"4671":"MVEX_Vpmulld_zmm_k1_zmm_zmmmt",MVEX_Vgetexpps_zmm_k1_zmmmt:4672,"4672":"MVEX_Vgetexpps_zmm_k1_zmmmt",MVEX_Vgetexppd_zmm_k1_zmmmt:4673,"4673":"MVEX_Vgetexppd_zmm_k1_zmmmt",MVEX_Vpsrlvd_zmm_k1_zmm_zmmmt:4674,"4674":"MVEX_Vpsrlvd_zmm_k1_zmm_zmmmt",MVEX_Vpsravd_zmm_k1_zmm_zmmmt:4675,"4675":"MVEX_Vpsravd_zmm_k1_zmm_zmmmt",MVEX_Vpsllvd_zmm_k1_zmm_zmmmt:4676,"4676":"MVEX_Vpsllvd_zmm_k1_zmm_zmmmt",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_48:4677,"4677":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_48",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_49:4678,"4678":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_49",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_4A:4679,"4679":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_4A",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_4B:4680,"4680":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_4B",MVEX_Vaddnps_zmm_k1_zmm_zmmmt:4681,"4681":"MVEX_Vaddnps_zmm_k1_zmm_zmmmt",MVEX_Vaddnpd_zmm_k1_zmm_zmmmt:4682,"4682":"MVEX_Vaddnpd_zmm_k1_zmm_zmmmt",MVEX_Vgmaxabsps_zmm_k1_zmm_zmmmt:4683,"4683":"MVEX_Vgmaxabsps_zmm_k1_zmm_zmmmt",MVEX_Vgminps_zmm_k1_zmm_zmmmt:4684,"4684":"MVEX_Vgminps_zmm_k1_zmm_zmmmt",MVEX_Vgminpd_zmm_k1_zmm_zmmmt:4685,"4685":"MVEX_Vgminpd_zmm_k1_zmm_zmmmt",MVEX_Vgmaxps_zmm_k1_zmm_zmmmt:4686,"4686":"MVEX_Vgmaxps_zmm_k1_zmm_zmmmt",MVEX_Vgmaxpd_zmm_k1_zmm_zmmmt:4687,"4687":"MVEX_Vgmaxpd_zmm_k1_zmm_zmmmt",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_54:4688,"4688":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_54",MVEX_Vfixupnanps_zmm_k1_zmm_zmmmt:4689,"4689":"MVEX_Vfixupnanps_zmm_k1_zmm_zmmmt",MVEX_Vfixupnanpd_zmm_k1_zmm_zmmmt:4690,"4690":"MVEX_Vfixupnanpd_zmm_k1_zmm_zmmmt",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_56:4691,"4691":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_56",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_57:4692,"4692":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_57",MVEX_Vpbroadcastd_zmm_k1_mt:4693,"4693":"MVEX_Vpbroadcastd_zmm_k1_mt",MVEX_Vpbroadcastq_zmm_k1_mt:4694,"4694":"MVEX_Vpbroadcastq_zmm_k1_mt",MVEX_Vbroadcasti32x4_zmm_k1_mt:4695,"4695":"MVEX_Vbroadcasti32x4_zmm_k1_mt",MVEX_Vbroadcasti64x4_zmm_k1_mt:4696,"4696":"MVEX_Vbroadcasti64x4_zmm_k1_mt",MVEX_Vpadcd_zmm_k1_kr_zmmmt:4697,"4697":"MVEX_Vpadcd_zmm_k1_kr_zmmmt",MVEX_Vpaddsetcd_zmm_k1_kr_zmmmt:4698,"4698":"MVEX_Vpaddsetcd_zmm_k1_kr_zmmmt",MVEX_Vpsbbd_zmm_k1_kr_zmmmt:4699,"4699":"MVEX_Vpsbbd_zmm_k1_kr_zmmmt",MVEX_Vpsubsetbd_zmm_k1_kr_zmmmt:4700,"4700":"MVEX_Vpsubsetbd_zmm_k1_kr_zmmmt",MVEX_Vpblendmd_zmm_k1_zmm_zmmmt:4701,"4701":"MVEX_Vpblendmd_zmm_k1_zmm_zmmmt",MVEX_Vpblendmq_zmm_k1_zmm_zmmmt:4702,"4702":"MVEX_Vpblendmq_zmm_k1_zmm_zmmmt",MVEX_Vblendmps_zmm_k1_zmm_zmmmt:4703,"4703":"MVEX_Vblendmps_zmm_k1_zmm_zmmmt",MVEX_Vblendmpd_zmm_k1_zmm_zmmmt:4704,"4704":"MVEX_Vblendmpd_zmm_k1_zmm_zmmmt",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_67:4705,"4705":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_67",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_68:4706,"4706":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_68",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_69:4707,"4707":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_69",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_6A:4708,"4708":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_6A",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_6B:4709,"4709":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_6B",MVEX_Vpsubrd_zmm_k1_zmm_zmmmt:4710,"4710":"MVEX_Vpsubrd_zmm_k1_zmm_zmmmt",MVEX_Vsubrps_zmm_k1_zmm_zmmmt:4711,"4711":"MVEX_Vsubrps_zmm_k1_zmm_zmmmt",MVEX_Vsubrpd_zmm_k1_zmm_zmmmt:4712,"4712":"MVEX_Vsubrpd_zmm_k1_zmm_zmmmt",MVEX_Vpsbbrd_zmm_k1_kr_zmmmt:4713,"4713":"MVEX_Vpsbbrd_zmm_k1_kr_zmmmt",MVEX_Vpsubrsetbd_zmm_k1_kr_zmmmt:4714,"4714":"MVEX_Vpsubrsetbd_zmm_k1_kr_zmmmt",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_70:4715,"4715":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_70",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_71:4716,"4716":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_71",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_72:4717,"4717":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_72",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_73:4718,"4718":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_73",MVEX_Vpcmpltd_kr_k1_zmm_zmmmt:4719,"4719":"MVEX_Vpcmpltd_kr_k1_zmm_zmmmt",MVEX_Vscaleps_zmm_k1_zmm_zmmmt:4720,"4720":"MVEX_Vscaleps_zmm_k1_zmm_zmmmt",MVEX_Vpmulhud_zmm_k1_zmm_zmmmt:4721,"4721":"MVEX_Vpmulhud_zmm_k1_zmm_zmmmt",MVEX_Vpmulhd_zmm_k1_zmm_zmmmt:4722,"4722":"MVEX_Vpmulhd_zmm_k1_zmm_zmmmt",MVEX_Vpgatherdd_zmm_k1_mvt:4723,"4723":"MVEX_Vpgatherdd_zmm_k1_mvt",MVEX_Vpgatherdq_zmm_k1_mvt:4724,"4724":"MVEX_Vpgatherdq_zmm_k1_mvt",MVEX_Vgatherdps_zmm_k1_mvt:4725,"4725":"MVEX_Vgatherdps_zmm_k1_mvt",MVEX_Vgatherdpd_zmm_k1_mvt:4726,"4726":"MVEX_Vgatherdpd_zmm_k1_mvt",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_94:4727,"4727":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_94",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W1_94:4728,"4728":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W1_94",MVEX_Vfmadd132ps_zmm_k1_zmm_zmmmt:4729,"4729":"MVEX_Vfmadd132ps_zmm_k1_zmm_zmmmt",MVEX_Vfmadd132pd_zmm_k1_zmm_zmmmt:4730,"4730":"MVEX_Vfmadd132pd_zmm_k1_zmm_zmmmt",MVEX_Vfmsub132ps_zmm_k1_zmm_zmmmt:4731,"4731":"MVEX_Vfmsub132ps_zmm_k1_zmm_zmmmt",MVEX_Vfmsub132pd_zmm_k1_zmm_zmmmt:4732,"4732":"MVEX_Vfmsub132pd_zmm_k1_zmm_zmmmt",MVEX_Vfnmadd132ps_zmm_k1_zmm_zmmmt:4733,"4733":"MVEX_Vfnmadd132ps_zmm_k1_zmm_zmmmt",MVEX_Vfnmadd132pd_zmm_k1_zmm_zmmmt:4734,"4734":"MVEX_Vfnmadd132pd_zmm_k1_zmm_zmmmt",MVEX_Vfnmsub132ps_zmm_k1_zmm_zmmmt:4735,"4735":"MVEX_Vfnmsub132ps_zmm_k1_zmm_zmmmt",MVEX_Vfnmsub132pd_zmm_k1_zmm_zmmmt:4736,"4736":"MVEX_Vfnmsub132pd_zmm_k1_zmm_zmmmt",MVEX_Vpscatterdd_mvt_k1_zmm:4737,"4737":"MVEX_Vpscatterdd_mvt_k1_zmm",MVEX_Vpscatterdq_mvt_k1_zmm:4738,"4738":"MVEX_Vpscatterdq_mvt_k1_zmm",MVEX_Vscatterdps_mvt_k1_zmm:4739,"4739":"MVEX_Vscatterdps_mvt_k1_zmm",MVEX_Vscatterdpd_mvt_k1_zmm:4740,"4740":"MVEX_Vscatterdpd_mvt_k1_zmm",MVEX_Vfmadd233ps_zmm_k1_zmm_zmmmt:4741,"4741":"MVEX_Vfmadd233ps_zmm_k1_zmm_zmmmt",MVEX_Vfmadd213ps_zmm_k1_zmm_zmmmt:4742,"4742":"MVEX_Vfmadd213ps_zmm_k1_zmm_zmmmt",MVEX_Vfmadd213pd_zmm_k1_zmm_zmmmt:4743,"4743":"MVEX_Vfmadd213pd_zmm_k1_zmm_zmmmt",MVEX_Vfmsub213ps_zmm_k1_zmm_zmmmt:4744,"4744":"MVEX_Vfmsub213ps_zmm_k1_zmm_zmmmt",MVEX_Vfmsub213pd_zmm_k1_zmm_zmmmt:4745,"4745":"MVEX_Vfmsub213pd_zmm_k1_zmm_zmmmt",MVEX_Vfnmadd213ps_zmm_k1_zmm_zmmmt:4746,"4746":"MVEX_Vfnmadd213ps_zmm_k1_zmm_zmmmt",MVEX_Vfnmadd213pd_zmm_k1_zmm_zmmmt:4747,"4747":"MVEX_Vfnmadd213pd_zmm_k1_zmm_zmmmt",MVEX_Vfnmsub213ps_zmm_k1_zmm_zmmmt:4748,"4748":"MVEX_Vfnmsub213ps_zmm_k1_zmm_zmmmt",MVEX_Vfnmsub213pd_zmm_k1_zmm_zmmmt:4749,"4749":"MVEX_Vfnmsub213pd_zmm_k1_zmm_zmmmt",MVEX_Undoc_zmm_k1_mvt_512_66_0F38_W0_B0:4750,"4750":"MVEX_Undoc_zmm_k1_mvt_512_66_0F38_W0_B0",MVEX_Undoc_zmm_k1_mvt_512_66_0F38_W0_B2:4751,"4751":"MVEX_Undoc_zmm_k1_mvt_512_66_0F38_W0_B2",MVEX_Vpmadd233d_zmm_k1_zmm_zmmmt:4752,"4752":"MVEX_Vpmadd233d_zmm_k1_zmm_zmmmt",MVEX_Vpmadd231d_zmm_k1_zmm_zmmmt:4753,"4753":"MVEX_Vpmadd231d_zmm_k1_zmm_zmmmt",MVEX_Vfmadd231ps_zmm_k1_zmm_zmmmt:4754,"4754":"MVEX_Vfmadd231ps_zmm_k1_zmm_zmmmt",MVEX_Vfmadd231pd_zmm_k1_zmm_zmmmt:4755,"4755":"MVEX_Vfmadd231pd_zmm_k1_zmm_zmmmt",MVEX_Vfmsub231ps_zmm_k1_zmm_zmmmt:4756,"4756":"MVEX_Vfmsub231ps_zmm_k1_zmm_zmmmt",MVEX_Vfmsub231pd_zmm_k1_zmm_zmmmt:4757,"4757":"MVEX_Vfmsub231pd_zmm_k1_zmm_zmmmt",MVEX_Vfnmadd231ps_zmm_k1_zmm_zmmmt:4758,"4758":"MVEX_Vfnmadd231ps_zmm_k1_zmm_zmmmt",MVEX_Vfnmadd231pd_zmm_k1_zmm_zmmmt:4759,"4759":"MVEX_Vfnmadd231pd_zmm_k1_zmm_zmmmt",MVEX_Vfnmsub231ps_zmm_k1_zmm_zmmmt:4760,"4760":"MVEX_Vfnmsub231ps_zmm_k1_zmm_zmmmt",MVEX_Vfnmsub231pd_zmm_k1_zmm_zmmmt:4761,"4761":"MVEX_Vfnmsub231pd_zmm_k1_zmm_zmmmt",MVEX_Undoc_zmm_k1_mvt_512_66_0F38_W0_C0:4762,"4762":"MVEX_Undoc_zmm_k1_mvt_512_66_0F38_W0_C0",MVEX_Vgatherpf0hintdps_mvt_k1:4763,"4763":"MVEX_Vgatherpf0hintdps_mvt_k1",MVEX_Vgatherpf0hintdpd_mvt_k1:4764,"4764":"MVEX_Vgatherpf0hintdpd_mvt_k1",MVEX_Vgatherpf0dps_mvt_k1:4765,"4765":"MVEX_Vgatherpf0dps_mvt_k1",MVEX_Vgatherpf1dps_mvt_k1:4766,"4766":"MVEX_Vgatherpf1dps_mvt_k1",MVEX_Vscatterpf0hintdps_mvt_k1:4767,"4767":"MVEX_Vscatterpf0hintdps_mvt_k1",MVEX_Vscatterpf0hintdpd_mvt_k1:4768,"4768":"MVEX_Vscatterpf0hintdpd_mvt_k1",MVEX_Vscatterpf0dps_mvt_k1:4769,"4769":"MVEX_Vscatterpf0dps_mvt_k1",MVEX_Vscatterpf1dps_mvt_k1:4770,"4770":"MVEX_Vscatterpf1dps_mvt_k1",MVEX_Vexp223ps_zmm_k1_zmmmt:4771,"4771":"MVEX_Vexp223ps_zmm_k1_zmmmt",MVEX_Vlog2ps_zmm_k1_zmmmt:4772,"4772":"MVEX_Vlog2ps_zmm_k1_zmmmt",MVEX_Vrcp23ps_zmm_k1_zmmmt:4773,"4773":"MVEX_Vrcp23ps_zmm_k1_zmmmt",MVEX_Vrsqrt23ps_zmm_k1_zmmmt:4774,"4774":"MVEX_Vrsqrt23ps_zmm_k1_zmmmt",MVEX_Vaddsetsps_zmm_k1_zmm_zmmmt:4775,"4775":"MVEX_Vaddsetsps_zmm_k1_zmm_zmmmt",MVEX_Vpaddsetsd_zmm_k1_zmm_zmmmt:4776,"4776":"MVEX_Vpaddsetsd_zmm_k1_zmm_zmmmt",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_CE:4777,"4777":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_CE",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W1_CE:4778,"4778":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W1_CE",MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_CF:4779,"4779":"MVEX_Undoc_zmm_k1_zmm_zmmmt_512_66_0F38_W0_CF",MVEX_Vloadunpackld_zmm_k1_mt:4780,"4780":"MVEX_Vloadunpackld_zmm_k1_mt",MVEX_Vloadunpacklq_zmm_k1_mt:4781,"4781":"MVEX_Vloadunpacklq_zmm_k1_mt",MVEX_Vpackstoreld_mt_k1_zmm:4782,"4782":"MVEX_Vpackstoreld_mt_k1_zmm",MVEX_Vpackstorelq_mt_k1_zmm:4783,"4783":"MVEX_Vpackstorelq_mt_k1_zmm",MVEX_Vloadunpacklps_zmm_k1_mt:4784,"4784":"MVEX_Vloadunpacklps_zmm_k1_mt",MVEX_Vloadunpacklpd_zmm_k1_mt:4785,"4785":"MVEX_Vloadunpacklpd_zmm_k1_mt",MVEX_Vpackstorelps_mt_k1_zmm:4786,"4786":"MVEX_Vpackstorelps_mt_k1_zmm",MVEX_Vpackstorelpd_mt_k1_zmm:4787,"4787":"MVEX_Vpackstorelpd_mt_k1_zmm",MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D2:4788,"4788":"MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D2",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_D2:4789,"4789":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_D2",MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D3:4790,"4790":"MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D3",MVEX_Vloadunpackhd_zmm_k1_mt:4791,"4791":"MVEX_Vloadunpackhd_zmm_k1_mt",MVEX_Vloadunpackhq_zmm_k1_mt:4792,"4792":"MVEX_Vloadunpackhq_zmm_k1_mt",MVEX_Vpackstorehd_mt_k1_zmm:4793,"4793":"MVEX_Vpackstorehd_mt_k1_zmm",MVEX_Vpackstorehq_mt_k1_zmm:4794,"4794":"MVEX_Vpackstorehq_mt_k1_zmm",MVEX_Vloadunpackhps_zmm_k1_mt:4795,"4795":"MVEX_Vloadunpackhps_zmm_k1_mt",MVEX_Vloadunpackhpd_zmm_k1_mt:4796,"4796":"MVEX_Vloadunpackhpd_zmm_k1_mt",MVEX_Vpackstorehps_mt_k1_zmm:4797,"4797":"MVEX_Vpackstorehps_mt_k1_zmm",MVEX_Vpackstorehpd_mt_k1_zmm:4798,"4798":"MVEX_Vpackstorehpd_mt_k1_zmm",MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D6:4799,"4799":"MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D6",MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_D6:4800,"4800":"MVEX_Undoc_zmm_k1_zmmmt_512_66_0F38_W0_D6",MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D7:4801,"4801":"MVEX_Undoc_zmm_k1_zmmmt_512_0F38_W0_D7",MVEX_Valignd_zmm_k1_zmm_zmmmt_imm8:4802,"4802":"MVEX_Valignd_zmm_k1_zmm_zmmmt_imm8",MVEX_Vpermf32x4_zmm_k1_zmmmt_imm8:4803,"4803":"MVEX_Vpermf32x4_zmm_k1_zmmmt_imm8",MVEX_Vpcmpud_kr_k1_zmm_zmmmt_imm8:4804,"4804":"MVEX_Vpcmpud_kr_k1_zmm_zmmmt_imm8",MVEX_Vpcmpd_kr_k1_zmm_zmmmt_imm8:4805,"4805":"MVEX_Vpcmpd_kr_k1_zmm_zmmmt_imm8",MVEX_Vgetmantps_zmm_k1_zmmmt_imm8:4806,"4806":"MVEX_Vgetmantps_zmm_k1_zmmmt_imm8",MVEX_Vgetmantpd_zmm_k1_zmmmt_imm8:4807,"4807":"MVEX_Vgetmantpd_zmm_k1_zmmmt_imm8",MVEX_Vrndfxpntps_zmm_k1_zmmmt_imm8:4808,"4808":"MVEX_Vrndfxpntps_zmm_k1_zmmmt_imm8",MVEX_Vrndfxpntpd_zmm_k1_zmmmt_imm8:4809,"4809":"MVEX_Vrndfxpntpd_zmm_k1_zmmmt_imm8",MVEX_Vcvtfxpntudq2ps_zmm_k1_zmmmt_imm8:4810,"4810":"MVEX_Vcvtfxpntudq2ps_zmm_k1_zmmmt_imm8",MVEX_Vcvtfxpntps2udq_zmm_k1_zmmmt_imm8:4811,"4811":"MVEX_Vcvtfxpntps2udq_zmm_k1_zmmmt_imm8",MVEX_Vcvtfxpntpd2udq_zmm_k1_zmmmt_imm8:4812,"4812":"MVEX_Vcvtfxpntpd2udq_zmm_k1_zmmmt_imm8",MVEX_Vcvtfxpntdq2ps_zmm_k1_zmmmt_imm8:4813,"4813":"MVEX_Vcvtfxpntdq2ps_zmm_k1_zmmmt_imm8",MVEX_Vcvtfxpntps2dq_zmm_k1_zmmmt_imm8:4814,"4814":"MVEX_Vcvtfxpntps2dq_zmm_k1_zmmmt_imm8",MVEX_Undoc_zmm_k1_zmmmt_imm8_512_66_0F3A_W0_D0:4815,"4815":"MVEX_Undoc_zmm_k1_zmmmt_imm8_512_66_0F3A_W0_D0",MVEX_Undoc_zmm_k1_zmmmt_imm8_512_66_0F3A_W0_D1:4816,"4816":"MVEX_Undoc_zmm_k1_zmmmt_imm8_512_66_0F3A_W0_D1",MVEX_Vcvtfxpntpd2dq_zmm_k1_zmmmt_imm8:4817,"4817":"MVEX_Vcvtfxpntpd2dq_zmm_k1_zmmmt_imm8",Via_undoc_F30FA6F0_16:4818,"4818":"Via_undoc_F30FA6F0_16",Via_undoc_F30FA6F0_32:4819,"4819":"Via_undoc_F30FA6F0_32",Via_undoc_F30FA6F0_64:4820,"4820":"Via_undoc_F30FA6F0_64",Via_undoc_F30FA6F8_16:4821,"4821":"Via_undoc_F30FA6F8_16",Via_undoc_F30FA6F8_32:4822,"4822":"Via_undoc_F30FA6F8_32",Via_undoc_F30FA6F8_64:4823,"4823":"Via_undoc_F30FA6F8_64",Xsha512_16:4824,"4824":"Xsha512_16",Xsha512_32:4825,"4825":"Xsha512_32",Xsha512_64:4826,"4826":"Xsha512_64",Xstore_alt_16:4827,"4827":"Xstore_alt_16",Xstore_alt_32:4828,"4828":"Xstore_alt_32",Xstore_alt_64:4829,"4829":"Xstore_alt_64",Xsha512_alt_16:4830,"4830":"Xsha512_alt_16",Xsha512_alt_32:4831,"4831":"Xsha512_alt_32",Xsha512_alt_64:4832,"4832":"Xsha512_alt_64",Zero_bytes:4833,"4833":"Zero_bytes",Wrmsrns:4834,"4834":"Wrmsrns",Wrmsrlist:4835,"4835":"Wrmsrlist",Rdmsrlist:4836,"4836":"Rdmsrlist",Rmpquery:4837,"4837":"Rmpquery",Prefetchit1_m8:4838,"4838":"Prefetchit1_m8",Prefetchit0_m8:4839,"4839":"Prefetchit0_m8",Aadd_m32_r32:4840,"4840":"Aadd_m32_r32",Aadd_m64_r64:4841,"4841":"Aadd_m64_r64",Aand_m32_r32:4842,"4842":"Aand_m32_r32",Aand_m64_r64:4843,"4843":"Aand_m64_r64",Axor_m32_r32:4844,"4844":"Axor_m32_r32",Axor_m64_r64:4845,"4845":"Axor_m64_r64",Aor_m32_r32:4846,"4846":"Aor_m32_r32",Aor_m64_r64:4847,"4847":"Aor_m64_r64",VEX_Vpdpbuud_xmm_xmm_xmmm128:4848,"4848":"VEX_Vpdpbuud_xmm_xmm_xmmm128",VEX_Vpdpbuud_ymm_ymm_ymmm256:4849,"4849":"VEX_Vpdpbuud_ymm_ymm_ymmm256",VEX_Vpdpbsud_xmm_xmm_xmmm128:4850,"4850":"VEX_Vpdpbsud_xmm_xmm_xmmm128",VEX_Vpdpbsud_ymm_ymm_ymmm256:4851,"4851":"VEX_Vpdpbsud_ymm_ymm_ymmm256",VEX_Vpdpbssd_xmm_xmm_xmmm128:4852,"4852":"VEX_Vpdpbssd_xmm_xmm_xmmm128",VEX_Vpdpbssd_ymm_ymm_ymmm256:4853,"4853":"VEX_Vpdpbssd_ymm_ymm_ymmm256",VEX_Vpdpbuuds_xmm_xmm_xmmm128:4854,"4854":"VEX_Vpdpbuuds_xmm_xmm_xmmm128",VEX_Vpdpbuuds_ymm_ymm_ymmm256:4855,"4855":"VEX_Vpdpbuuds_ymm_ymm_ymmm256",VEX_Vpdpbsuds_xmm_xmm_xmmm128:4856,"4856":"VEX_Vpdpbsuds_xmm_xmm_xmmm128",VEX_Vpdpbsuds_ymm_ymm_ymmm256:4857,"4857":"VEX_Vpdpbsuds_ymm_ymm_ymmm256",VEX_Vpdpbssds_xmm_xmm_xmmm128:4858,"4858":"VEX_Vpdpbssds_xmm_xmm_xmmm128",VEX_Vpdpbssds_ymm_ymm_ymmm256:4859,"4859":"VEX_Vpdpbssds_ymm_ymm_ymmm256",VEX_Tdpfp16ps_tmm_tmm_tmm:4860,"4860":"VEX_Tdpfp16ps_tmm_tmm_tmm",VEX_Vcvtneps2bf16_xmm_xmmm128:4861,"4861":"VEX_Vcvtneps2bf16_xmm_xmmm128",VEX_Vcvtneps2bf16_xmm_ymmm256:4862,"4862":"VEX_Vcvtneps2bf16_xmm_ymmm256",VEX_Vcvtneoph2ps_xmm_m128:4863,"4863":"VEX_Vcvtneoph2ps_xmm_m128",VEX_Vcvtneoph2ps_ymm_m256:4864,"4864":"VEX_Vcvtneoph2ps_ymm_m256",VEX_Vcvtneeph2ps_xmm_m128:4865,"4865":"VEX_Vcvtneeph2ps_xmm_m128",VEX_Vcvtneeph2ps_ymm_m256:4866,"4866":"VEX_Vcvtneeph2ps_ymm_m256",VEX_Vcvtneebf162ps_xmm_m128:4867,"4867":"VEX_Vcvtneebf162ps_xmm_m128",VEX_Vcvtneebf162ps_ymm_m256:4868,"4868":"VEX_Vcvtneebf162ps_ymm_m256",VEX_Vcvtneobf162ps_xmm_m128:4869,"4869":"VEX_Vcvtneobf162ps_xmm_m128",VEX_Vcvtneobf162ps_ymm_m256:4870,"4870":"VEX_Vcvtneobf162ps_ymm_m256",VEX_Vbcstnesh2ps_xmm_m16:4871,"4871":"VEX_Vbcstnesh2ps_xmm_m16",VEX_Vbcstnesh2ps_ymm_m16:4872,"4872":"VEX_Vbcstnesh2ps_ymm_m16",VEX_Vbcstnebf162ps_xmm_m16:4873,"4873":"VEX_Vbcstnebf162ps_xmm_m16",VEX_Vbcstnebf162ps_ymm_m16:4874,"4874":"VEX_Vbcstnebf162ps_ymm_m16",VEX_Vpmadd52luq_xmm_xmm_xmmm128:4875,"4875":"VEX_Vpmadd52luq_xmm_xmm_xmmm128",VEX_Vpmadd52luq_ymm_ymm_ymmm256:4876,"4876":"VEX_Vpmadd52luq_ymm_ymm_ymmm256",VEX_Vpmadd52huq_xmm_xmm_xmmm128:4877,"4877":"VEX_Vpmadd52huq_xmm_xmm_xmmm128",VEX_Vpmadd52huq_ymm_ymm_ymmm256:4878,"4878":"VEX_Vpmadd52huq_ymm_ymm_ymmm256",VEX_Cmpoxadd_m32_r32_r32:4879,"4879":"VEX_Cmpoxadd_m32_r32_r32",VEX_Cmpoxadd_m64_r64_r64:4880,"4880":"VEX_Cmpoxadd_m64_r64_r64",VEX_Cmpnoxadd_m32_r32_r32:4881,"4881":"VEX_Cmpnoxadd_m32_r32_r32",VEX_Cmpnoxadd_m64_r64_r64:4882,"4882":"VEX_Cmpnoxadd_m64_r64_r64",VEX_Cmpbxadd_m32_r32_r32:4883,"4883":"VEX_Cmpbxadd_m32_r32_r32",VEX_Cmpbxadd_m64_r64_r64:4884,"4884":"VEX_Cmpbxadd_m64_r64_r64",VEX_Cmpnbxadd_m32_r32_r32:4885,"4885":"VEX_Cmpnbxadd_m32_r32_r32",VEX_Cmpnbxadd_m64_r64_r64:4886,"4886":"VEX_Cmpnbxadd_m64_r64_r64",VEX_Cmpzxadd_m32_r32_r32:4887,"4887":"VEX_Cmpzxadd_m32_r32_r32",VEX_Cmpzxadd_m64_r64_r64:4888,"4888":"VEX_Cmpzxadd_m64_r64_r64",VEX_Cmpnzxadd_m32_r32_r32:4889,"4889":"VEX_Cmpnzxadd_m32_r32_r32",VEX_Cmpnzxadd_m64_r64_r64:4890,"4890":"VEX_Cmpnzxadd_m64_r64_r64",VEX_Cmpbexadd_m32_r32_r32:4891,"4891":"VEX_Cmpbexadd_m32_r32_r32",VEX_Cmpbexadd_m64_r64_r64:4892,"4892":"VEX_Cmpbexadd_m64_r64_r64",VEX_Cmpnbexadd_m32_r32_r32:4893,"4893":"VEX_Cmpnbexadd_m32_r32_r32",VEX_Cmpnbexadd_m64_r64_r64:4894,"4894":"VEX_Cmpnbexadd_m64_r64_r64",VEX_Cmpsxadd_m32_r32_r32:4895,"4895":"VEX_Cmpsxadd_m32_r32_r32",VEX_Cmpsxadd_m64_r64_r64:4896,"4896":"VEX_Cmpsxadd_m64_r64_r64",VEX_Cmpnsxadd_m32_r32_r32:4897,"4897":"VEX_Cmpnsxadd_m32_r32_r32",VEX_Cmpnsxadd_m64_r64_r64:4898,"4898":"VEX_Cmpnsxadd_m64_r64_r64",VEX_Cmppxadd_m32_r32_r32:4899,"4899":"VEX_Cmppxadd_m32_r32_r32",VEX_Cmppxadd_m64_r64_r64:4900,"4900":"VEX_Cmppxadd_m64_r64_r64",VEX_Cmpnpxadd_m32_r32_r32:4901,"4901":"VEX_Cmpnpxadd_m32_r32_r32",VEX_Cmpnpxadd_m64_r64_r64:4902,"4902":"VEX_Cmpnpxadd_m64_r64_r64",VEX_Cmplxadd_m32_r32_r32:4903,"4903":"VEX_Cmplxadd_m32_r32_r32",VEX_Cmplxadd_m64_r64_r64:4904,"4904":"VEX_Cmplxadd_m64_r64_r64",VEX_Cmpnlxadd_m32_r32_r32:4905,"4905":"VEX_Cmpnlxadd_m32_r32_r32",VEX_Cmpnlxadd_m64_r64_r64:4906,"4906":"VEX_Cmpnlxadd_m64_r64_r64",VEX_Cmplexadd_m32_r32_r32:4907,"4907":"VEX_Cmplexadd_m32_r32_r32",VEX_Cmplexadd_m64_r64_r64:4908,"4908":"VEX_Cmplexadd_m64_r64_r64",VEX_Cmpnlexadd_m32_r32_r32:4909,"4909":"VEX_Cmpnlexadd_m32_r32_r32",VEX_Cmpnlexadd_m64_r64_r64:4910,"4910":"VEX_Cmpnlexadd_m64_r64_r64",VEX_Tcmmrlfp16ps_tmm_tmm_tmm:4911,"4911":"VEX_Tcmmrlfp16ps_tmm_tmm_tmm",VEX_Tcmmimfp16ps_tmm_tmm_tmm:4912,"4912":"VEX_Tcmmimfp16ps_tmm_tmm_tmm",Pbndkb:4913,"4913":"Pbndkb",VEX_Vsha512rnds2_ymm_ymm_xmm:4914,"4914":"VEX_Vsha512rnds2_ymm_ymm_xmm",VEX_Vsha512msg1_ymm_xmm:4915,"4915":"VEX_Vsha512msg1_ymm_xmm",VEX_Vsha512msg2_ymm_ymm:4916,"4916":"VEX_Vsha512msg2_ymm_ymm",VEX_Vpdpwuud_xmm_xmm_xmmm128:4917,"4917":"VEX_Vpdpwuud_xmm_xmm_xmmm128",VEX_Vpdpwuud_ymm_ymm_ymmm256:4918,"4918":"VEX_Vpdpwuud_ymm_ymm_ymmm256",VEX_Vpdpwusd_xmm_xmm_xmmm128:4919,"4919":"VEX_Vpdpwusd_xmm_xmm_xmmm128",VEX_Vpdpwusd_ymm_ymm_ymmm256:4920,"4920":"VEX_Vpdpwusd_ymm_ymm_ymmm256",VEX_Vpdpwsud_xmm_xmm_xmmm128:4921,"4921":"VEX_Vpdpwsud_xmm_xmm_xmmm128",VEX_Vpdpwsud_ymm_ymm_ymmm256:4922,"4922":"VEX_Vpdpwsud_ymm_ymm_ymmm256",VEX_Vpdpwuuds_xmm_xmm_xmmm128:4923,"4923":"VEX_Vpdpwuuds_xmm_xmm_xmmm128",VEX_Vpdpwuuds_ymm_ymm_ymmm256:4924,"4924":"VEX_Vpdpwuuds_ymm_ymm_ymmm256",VEX_Vpdpwusds_xmm_xmm_xmmm128:4925,"4925":"VEX_Vpdpwusds_xmm_xmm_xmmm128",VEX_Vpdpwusds_ymm_ymm_ymmm256:4926,"4926":"VEX_Vpdpwusds_ymm_ymm_ymmm256",VEX_Vpdpwsuds_xmm_xmm_xmmm128:4927,"4927":"VEX_Vpdpwsuds_xmm_xmm_xmmm128",VEX_Vpdpwsuds_ymm_ymm_ymmm256:4928,"4928":"VEX_Vpdpwsuds_ymm_ymm_ymmm256",VEX_Vsm3msg1_xmm_xmm_xmmm128:4929,"4929":"VEX_Vsm3msg1_xmm_xmm_xmmm128",VEX_Vsm3msg2_xmm_xmm_xmmm128:4930,"4930":"VEX_Vsm3msg2_xmm_xmm_xmmm128",VEX_Vsm4key4_xmm_xmm_xmmm128:4931,"4931":"VEX_Vsm4key4_xmm_xmm_xmmm128",VEX_Vsm4key4_ymm_ymm_ymmm256:4932,"4932":"VEX_Vsm4key4_ymm_ymm_ymmm256",VEX_Vsm4rnds4_xmm_xmm_xmmm128:4933,"4933":"VEX_Vsm4rnds4_xmm_xmm_xmmm128",VEX_Vsm4rnds4_ymm_ymm_ymmm256:4934,"4934":"VEX_Vsm4rnds4_ymm_ymm_ymmm256",VEX_Vsm3rnds2_xmm_xmm_xmmm128_imm8:4935,"4935":"VEX_Vsm3rnds2_xmm_xmm_xmmm128_imm8", });
/**
* Mnemonic condition code selector (eg. `JE` / `JZ`)
*/
__exports.CC_e = Object.freeze({
/**
* `JE`, `CMOVE`, `SETE`, `LOOPE`, `REPE`
*/
e:0,"0":"e",
/**
* `JZ`, `CMOVZ`, `SETZ`, `LOOPZ`, `REPZ`
*/
z:1,"1":"z", });
/**
* Mnemonic condition code selector (eg. `JNP` / `JPO`)
*/
__exports.CC_np = Object.freeze({
/**
* `JNP`, `CMOVNP`, `SETNP`
*/
np:0,"0":"np",
/**
* `JPO`, `CMOVPO`, `SETPO`
*/
po:1,"1":"po", });
/**
* Decoder error
*/
__exports.DecoderError = Object.freeze({
/**
* No error. The last decoded instruction is a valid instruction
*/
None:0,"0":"None",
/**
* It's an invalid instruction or an invalid encoding of an existing instruction (eg. some reserved bit is set/cleared)
*/
InvalidInstruction:1,"1":"InvalidInstruction",
/**
* There's not enough bytes left to decode the instruction
*/
NoMoreBytes:2,"2":"NoMoreBytes", });
/**
* Operand, register and memory access
*/
__exports.OpAccess = Object.freeze({
/**
* Nothing is read and nothing is written
*/
None:0,"0":"None",
/**
* The value is read
*/
Read:1,"1":"Read",
/**
* The value is sometimes read and sometimes not
*/
CondRead:2,"2":"CondRead",
/**
* The value is completely overwritten
*/
Write:3,"3":"Write",
/**
* Conditional write, sometimes it's written and sometimes it's not modified
*/
CondWrite:4,"4":"CondWrite",
/**
* The value is read and written
*/
ReadWrite:5,"5":"ReadWrite",
/**
* The value is read and sometimes written
*/
ReadCondWrite:6,"6":"ReadCondWrite",
/**
* The memory operand doesn't refer to memory (eg. `LEA` instruction) or it's an instruction that doesn't read the data to a register or doesn't write to the memory location, it just prefetches/invalidates it, eg. `INVLPG`, `PREFETCHNTA`, `VGATHERPF0DPS`, etc. Some of those instructions still check if the code can access the memory location.
*/
NoMemAccess:7,"7":"NoMemAccess", });
/**
* Mnemonic condition code selector (eg. `JP` / `JPE`)
*/
__exports.CC_p = Object.freeze({
/**
* `JP`, `CMOVP`, `SETP`
*/
p:0,"0":"p",
/**
* `JPE`, `CMOVPE`, `SETPE`
*/
pe:1,"1":"pe", });
/**
* Mnemonic condition code selector (eg. `JG` / `JNLE`)
*/
__exports.CC_g = Object.freeze({
/**
* `JG`, `CMOVG`, `SETG`
*/
g:0,"0":"g",
/**
* `JNLE`, `CMOVNLE`, `SETNLE`
*/
nle:1,"1":"nle", });
/**
* Instruction operand kind
*/
__exports.OpKind = Object.freeze({
/**
* A register ([`Register`]).
*
* This operand kind uses [`Instruction.op0Register`], [`Instruction.op1Register`], [`Instruction.op2Register`], [`Instruction.op3Register`] or [`Instruction.op4Register`] depending on operand number. See also [`Instruction.opRegister()`].
*
* [`Register`]: enum.Register.html
* [`Instruction.op0Register`]: struct.Instruction.html#method.op0Register
* [`Instruction.op1Register`]: struct.Instruction.html#method.op1Register
* [`Instruction.op2Register`]: struct.Instruction.html#method.op2Register
* [`Instruction.op3Register`]: struct.Instruction.html#method.op3Register
* [`Instruction.op4Register`]: struct.Instruction.html#method.op4Register
* [`Instruction.opRegister()`]: struct.Instruction.html#method.opRegister
*/
Register:0,"0":"Register",
/**
* Near 16-bit branch. This operand kind uses [`Instruction.nearBranch16`]
*
* [`Instruction.nearBranch16`]: struct.Instruction.html#method.nearBranch16
*/
NearBranch16:1,"1":"NearBranch16",
/**
* Near 32-bit branch. This operand kind uses [`Instruction.nearBranch32`]
*
* [`Instruction.nearBranch32`]: struct.Instruction.html#method.nearBranch32
*/
NearBranch32:2,"2":"NearBranch32",
/**
* Near 64-bit branch. This operand kind uses [`Instruction.nearBranch64`]
*
* [`Instruction.nearBranch64`]: struct.Instruction.html#method.nearBranch64
*/
NearBranch64:3,"3":"NearBranch64",
/**
* Far 16-bit branch. This operand kind uses [`Instruction.farBranch16`] and [`Instruction.farBranchSelector`]
*
* [`Instruction.farBranch16`]: struct.Instruction.html#method.farBranch16
* [`Instruction.farBranchSelector`]: struct.Instruction.html#method.farBranchSelector
*/
FarBranch16:4,"4":"FarBranch16",
/**
* Far 32-bit branch. This operand kind uses [`Instruction.farBranch32`] and [`Instruction.farBranchSelector`]
*
* [`Instruction.farBranch32`]: struct.Instruction.html#method.farBranch32
* [`Instruction.farBranchSelector`]: struct.Instruction.html#method.farBranchSelector
*/
FarBranch32:5,"5":"FarBranch32",
/**
* 8-bit constant. This operand kind uses [`Instruction.immediate8`]
*
* [`Instruction.immediate8`]: struct.Instruction.html#method.immediate8
*/
Immediate8:6,"6":"Immediate8",
/**
* 8-bit constant used by the `ENTER`, `EXTRQ`, `INSERTQ` instructions. This operand kind uses [`Instruction.immediate8_2nd`]
*
* [`Instruction.immediate8_2nd`]: struct.Instruction.html#method.immediate8_2nd
*/
Immediate8_2nd:7,"7":"Immediate8_2nd",
/**
* 16-bit constant. This operand kind uses [`Instruction.immediate16`]
*
* [`Instruction.immediate16`]: struct.Instruction.html#method.immediate16
*/
Immediate16:8,"8":"Immediate16",
/**
* 32-bit constant. This operand kind uses [`Instruction.immediate32`]
*
* [`Instruction.immediate32`]: struct.Instruction.html#method.immediate32
*/
Immediate32:9,"9":"Immediate32",
/**
* 64-bit constant. This operand kind uses [`Instruction.immediate64`]
*
* [`Instruction.immediate64`]: struct.Instruction.html#method.immediate64
*/
Immediate64:10,"10":"Immediate64",
/**
* An 8-bit value sign extended to 16 bits. This operand kind uses [`Instruction.immediate8to16`]
*
* [`Instruction.immediate8to16`]: struct.Instruction.html#method.immediate8to16
*/
Immediate8to16:11,"11":"Immediate8to16",
/**
* An 8-bit value sign extended to 32 bits. This operand kind uses [`Instruction.immediate8to32`]
*
* [`Instruction.immediate8to32`]: struct.Instruction.html#method.immediate8to32
*/
Immediate8to32:12,"12":"Immediate8to32",
/**
* An 8-bit value sign extended to 64 bits. This operand kind uses [`Instruction.immediate8to64`]
*
* [`Instruction.immediate8to64`]: struct.Instruction.html#method.immediate8to64
*/
Immediate8to64:13,"13":"Immediate8to64",
/**
* A 32-bit value sign extended to 64 bits. This operand kind uses [`Instruction.immediate32to64`]
*
* [`Instruction.immediate32to64`]: struct.Instruction.html#method.immediate32to64
*/
Immediate32to64:14,"14":"Immediate32to64",
/**
* `seg:[SI]`. This operand kind uses [`Instruction.memorySize`], [`Instruction.memorySegment`], [`Instruction.segmentPrefix`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
* [`Instruction.memorySegment`]: struct.Instruction.html#method.memorySegment
* [`Instruction.segmentPrefix`]: struct.Instruction.html#method.segmentPrefix
*/
MemorySegSI:15,"15":"MemorySegSI",
/**
* `seg:[ESI]`. This operand kind uses [`Instruction.memorySize`], [`Instruction.memorySegment`], [`Instruction.segmentPrefix`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
* [`Instruction.memorySegment`]: struct.Instruction.html#method.memorySegment
* [`Instruction.segmentPrefix`]: struct.Instruction.html#method.segmentPrefix
*/
MemorySegESI:16,"16":"MemorySegESI",
/**
* `seg:[RSI]`. This operand kind uses [`Instruction.memorySize`], [`Instruction.memorySegment`], [`Instruction.segmentPrefix`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
* [`Instruction.memorySegment`]: struct.Instruction.html#method.memorySegment
* [`Instruction.segmentPrefix`]: struct.Instruction.html#method.segmentPrefix
*/
MemorySegRSI:17,"17":"MemorySegRSI",
/**
* `seg:[DI]`. This operand kind uses [`Instruction.memorySize`], [`Instruction.memorySegment`], [`Instruction.segmentPrefix`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
* [`Instruction.memorySegment`]: struct.Instruction.html#method.memorySegment
* [`Instruction.segmentPrefix`]: struct.Instruction.html#method.segmentPrefix
*/
MemorySegDI:18,"18":"MemorySegDI",
/**
* `seg:[EDI]`. This operand kind uses [`Instruction.memorySize`], [`Instruction.memorySegment`], [`Instruction.segmentPrefix`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
* [`Instruction.memorySegment`]: struct.Instruction.html#method.memorySegment
* [`Instruction.segmentPrefix`]: struct.Instruction.html#method.segmentPrefix
*/
MemorySegEDI:19,"19":"MemorySegEDI",
/**
* `seg:[RDI]`. This operand kind uses [`Instruction.memorySize`], [`Instruction.memorySegment`], [`Instruction.segmentPrefix`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
* [`Instruction.memorySegment`]: struct.Instruction.html#method.memorySegment
* [`Instruction.segmentPrefix`]: struct.Instruction.html#method.segmentPrefix
*/
MemorySegRDI:20,"20":"MemorySegRDI",
/**
* `ES:[DI]`. This operand kind uses [`Instruction.memorySize`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
*/
MemoryESDI:21,"21":"MemoryESDI",
/**
* `ES:[EDI]`. This operand kind uses [`Instruction.memorySize`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
*/
MemoryESEDI:22,"22":"MemoryESEDI",
/**
* `ES:[RDI]`. This operand kind uses [`Instruction.memorySize`]
*
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
*/
MemoryESRDI:23,"23":"MemoryESRDI",
/**
* Memory operand.
*
* This operand kind uses [`Instruction.memoryDisplSize`], [`Instruction.memorySize`], [`Instruction.memoryIndexScale`], [`Instruction.memoryDisplacement64`], [`Instruction.memoryBase`], [`Instruction.memoryIndex`], [`Instruction.memorySegment`], [`Instruction.segmentPrefix`]
*
* [`Instruction.memoryDisplSize`]: struct.Instruction.html#method.memoryDisplSize
* [`Instruction.memorySize`]: struct.Instruction.html#method.memorySize
* [`Instruction.memoryIndexScale`]: struct.Instruction.html#method.memoryIndexScale
* [`Instruction.memoryDisplacement64`]: struct.Instruction.html#method.memoryDisplacement64
* [`Instruction.memoryBase`]: struct.Instruction.html#method.memoryBase
* [`Instruction.memoryIndex`]: struct.Instruction.html#method.memoryIndex
* [`Instruction.memorySegment`]: struct.Instruction.html#method.memorySegment
* [`Instruction.segmentPrefix`]: struct.Instruction.html#method.segmentPrefix
*/
Memory:24,"24":"Memory", });
/**
* Mnemonic condition code selector (eg. `JL` / `JNGE`)
*/
__exports.CC_l = Object.freeze({
/**
* `JL`, `CMOVL`, `SETL`
*/
l:0,"0":"l",
/**
* `JNGE`, `CMOVNGE`, `SETNGE`
*/
nge:1,"1":"nge", });
/**
* Mnemonic condition code selector (eg. `JB` / `JC` / `JNAE`)
*/
__exports.CC_b = Object.freeze({
/**
* `JB`, `CMOVB`, `SETB`
*/
b:0,"0":"b",
/**
* `JC`, `CMOVC`, `SETC`
*/
c:1,"1":"c",
/**
* `JNAE`, `CMOVNAE`, `SETNAE`
*/
nae:2,"2":"nae", });
/**
* A register
*/
__exports.Register = Object.freeze({ None:0,"0":"None",AL:1,"1":"AL",CL:2,"2":"CL",DL:3,"3":"DL",BL:4,"4":"BL",AH:5,"5":"AH",CH:6,"6":"CH",DH:7,"7":"DH",BH:8,"8":"BH",SPL:9,"9":"SPL",BPL:10,"10":"BPL",SIL:11,"11":"SIL",DIL:12,"12":"DIL",R8L:13,"13":"R8L",R9L:14,"14":"R9L",R10L:15,"15":"R10L",R11L:16,"16":"R11L",R12L:17,"17":"R12L",R13L:18,"18":"R13L",R14L:19,"19":"R14L",R15L:20,"20":"R15L",AX:21,"21":"AX",CX:22,"22":"CX",DX:23,"23":"DX",BX:24,"24":"BX",SP:25,"25":"SP",BP:26,"26":"BP",SI:27,"27":"SI",DI:28,"28":"DI",R8W:29,"29":"R8W",R9W:30,"30":"R9W",R10W:31,"31":"R10W",R11W:32,"32":"R11W",R12W:33,"33":"R12W",R13W:34,"34":"R13W",R14W:35,"35":"R14W",R15W:36,"36":"R15W",EAX:37,"37":"EAX",ECX:38,"38":"ECX",EDX:39,"39":"EDX",EBX:40,"40":"EBX",ESP:41,"41":"ESP",EBP:42,"42":"EBP",ESI:43,"43":"ESI",EDI:44,"44":"EDI",R8D:45,"45":"R8D",R9D:46,"46":"R9D",R10D:47,"47":"R10D",R11D:48,"48":"R11D",R12D:49,"49":"R12D",R13D:50,"50":"R13D",R14D:51,"51":"R14D",R15D:52,"52":"R15D",RAX:53,"53":"RAX",RCX:54,"54":"RCX",RDX:55,"55":"RDX",RBX:56,"56":"RBX",RSP:57,"57":"RSP",RBP:58,"58":"RBP",RSI:59,"59":"RSI",RDI:60,"60":"RDI",R8:61,"61":"R8",R9:62,"62":"R9",R10:63,"63":"R10",R11:64,"64":"R11",R12:65,"65":"R12",R13:66,"66":"R13",R14:67,"67":"R14",R15:68,"68":"R15",EIP:69,"69":"EIP",RIP:70,"70":"RIP",ES:71,"71":"ES",CS:72,"72":"CS",SS:73,"73":"SS",DS:74,"74":"DS",FS:75,"75":"FS",GS:76,"76":"GS",XMM0:77,"77":"XMM0",XMM1:78,"78":"XMM1",XMM2:79,"79":"XMM2",XMM3:80,"80":"XMM3",XMM4:81,"81":"XMM4",XMM5:82,"82":"XMM5",XMM6:83,"83":"XMM6",XMM7:84,"84":"XMM7",XMM8:85,"85":"XMM8",XMM9:86,"86":"XMM9",XMM10:87,"87":"XMM10",XMM11:88,"88":"XMM11",XMM12:89,"89":"XMM12",XMM13:90,"90":"XMM13",XMM14:91,"91":"XMM14",XMM15:92,"92":"XMM15",XMM16:93,"93":"XMM16",XMM17:94,"94":"XMM17",XMM18:95,"95":"XMM18",XMM19:96,"96":"XMM19",XMM20:97,"97":"XMM20",XMM21:98,"98":"XMM21",XMM22:99,"99":"XMM22",XMM23:100,"100":"XMM23",XMM24:101,"101":"XMM24",XMM25:102,"102":"XMM25",XMM26:103,"103":"XMM26",XMM27:104,"104":"XMM27",XMM28:105,"105":"XMM28",XMM29:106,"106":"XMM29",XMM30:107,"107":"XMM30",XMM31:108,"108":"XMM31",YMM0:109,"109":"YMM0",YMM1:110,"110":"YMM1",YMM2:111,"111":"YMM2",YMM3:112,"112":"YMM3",YMM4:113,"113":"YMM4",YMM5:114,"114":"YMM5",YMM6:115,"115":"YMM6",YMM7:116,"116":"YMM7",YMM8:117,"117":"YMM8",YMM9:118,"118":"YMM9",YMM10:119,"119":"YMM10",YMM11:120,"120":"YMM11",YMM12:121,"121":"YMM12",YMM13:122,"122":"YMM13",YMM14:123,"123":"YMM14",YMM15:124,"124":"YMM15",YMM16:125,"125":"YMM16",YMM17:126,"126":"YMM17",YMM18:127,"127":"YMM18",YMM19:128,"128":"YMM19",YMM20:129,"129":"YMM20",YMM21:130,"130":"YMM21",YMM22:131,"131":"YMM22",YMM23:132,"132":"YMM23",YMM24:133,"133":"YMM24",YMM25:134,"134":"YMM25",YMM26:135,"135":"YMM26",YMM27:136,"136":"YMM27",YMM28:137,"137":"YMM28",YMM29:138,"138":"YMM29",YMM30:139,"139":"YMM30",YMM31:140,"140":"YMM31",ZMM0:141,"141":"ZMM0",ZMM1:142,"142":"ZMM1",ZMM2:143,"143":"ZMM2",ZMM3:144,"144":"ZMM3",ZMM4:145,"145":"ZMM4",ZMM5:146,"146":"ZMM5",ZMM6:147,"147":"ZMM6",ZMM7:148,"148":"ZMM7",ZMM8:149,"149":"ZMM8",ZMM9:150,"150":"ZMM9",ZMM10:151,"151":"ZMM10",ZMM11:152,"152":"ZMM11",ZMM12:153,"153":"ZMM12",ZMM13:154,"154":"ZMM13",ZMM14:155,"155":"ZMM14",ZMM15:156,"156":"ZMM15",ZMM16:157,"157":"ZMM16",ZMM17:158,"158":"ZMM17",ZMM18:159,"159":"ZMM18",ZMM19:160,"160":"ZMM19",ZMM20:161,"161":"ZMM20",ZMM21:162,"162":"ZMM21",ZMM22:163,"163":"ZMM22",ZMM23:164,"164":"ZMM23",ZMM24:165,"165":"ZMM24",ZMM25:166,"166":"ZMM25",ZMM26:167,"167":"ZMM26",ZMM27:168,"168":"ZMM27",ZMM28:169,"169":"ZMM28",ZMM29:170,"170":"ZMM29",ZMM30:171,"171":"ZMM30",ZMM31:172,"172":"ZMM31",K0:173,"173":"K0",K1:174,"174":"K1",K2:175,"175":"K2",K3:176,"176":"K3",K4:177,"177":"K4",K5:178,"178":"K5",K6:179,"179":"K6",K7:180,"180":"K7",BND0:181,"181":"BND0",BND1:182,"182":"BND1",BND2:183,"183":"BND2",BND3:184,"184":"BND3",CR0:185,"185":"CR0",CR1:186,"186":"CR1",CR2:187,"187":"CR2",CR3:188,"188":"CR3",CR4:189,"189":"CR4",CR5:190,"190":"CR5",CR6:191,"191":"CR6",CR7:192,"192":"CR7",CR8:193,"193":"CR8",CR9:194,"194":"CR9",CR10:195,"195":"CR10",CR11:196,"196":"CR11",CR12:197,"197":"CR12",CR13:198,"198":"CR13",CR14:199,"199":"CR14",CR15:200,"200":"CR15",DR0:201,"201":"DR0",DR1:202,"202":"DR1",DR2:203,"203":"DR2",DR3:204,"204":"DR3",DR4:205,"205":"DR4",DR5:206,"206":"DR5",DR6:207,"207":"DR6",DR7:208,"208":"DR7",DR8:209,"209":"DR8",DR9:210,"210":"DR9",DR10:211,"211":"DR10",DR11:212,"212":"DR11",DR12:213,"213":"DR12",DR13:214,"214":"DR13",DR14:215,"215":"DR14",DR15:216,"216":"DR15",ST0:217,"217":"ST0",ST1:218,"218":"ST1",ST2:219,"219":"ST2",ST3:220,"220":"ST3",ST4:221,"221":"ST4",ST5:222,"222":"ST5",ST6:223,"223":"ST6",ST7:224,"224":"ST7",MM0:225,"225":"MM0",MM1:226,"226":"MM1",MM2:227,"227":"MM2",MM3:228,"228":"MM3",MM4:229,"229":"MM4",MM5:230,"230":"MM5",MM6:231,"231":"MM6",MM7:232,"232":"MM7",TR0:233,"233":"TR0",TR1:234,"234":"TR1",TR2:235,"235":"TR2",TR3:236,"236":"TR3",TR4:237,"237":"TR4",TR5:238,"238":"TR5",TR6:239,"239":"TR6",TR7:240,"240":"TR7",TMM0:241,"241":"TMM0",TMM1:242,"242":"TMM1",TMM2:243,"243":"TMM2",TMM3:244,"244":"TMM3",TMM4:245,"245":"TMM4",TMM5:246,"246":"TMM5",TMM6:247,"247":"TMM6",TMM7:248,"248":"TMM7",
/**
* Don't use it!
*
* ***************************************************
* DEPRECATED since 1.12.0: Not part of the public API
*/
DontUse0:249,"249":"DontUse0",
/**
* Don't use it!
*
* ***************************************************
* DEPRECATED since 1.12.0: Not part of the public API
*/
DontUseFA:250,"250":"DontUseFA",
/**
* Don't use it!
*
* ***************************************************
* DEPRECATED since 1.12.0: Not part of the public API
*/
DontUseFB:251,"251":"DontUseFB",
/**
* Don't use it!
*
* ***************************************************
* DEPRECATED since 1.12.0: Not part of the public API
*/
DontUseFC:252,"252":"DontUseFC",
/**
* Don't use it!
*
* ***************************************************
* DEPRECATED since 1.12.0: Not part of the public API
*/
DontUseFD:253,"253":"DontUseFD",
/**
* Don't use it!
*
* ***************************************************
* DEPRECATED since 1.12.0: Not part of the public API
*/
DontUseFE:254,"254":"DontUseFE",
/**
* Don't use it!
*
* ***************************************************
* DEPRECATED since 1.12.0: Not part of the public API
*/
DontUseFF:255,"255":"DontUseFF", });
/**
* Size of a memory reference
*/
__exports.MemorySize = Object.freeze({
/**
* Unknown size or the instruction doesn't reference any memory (eg. `LEA`)
*/
Unknown:0,"0":"Unknown",
/**
* Memory location contains a `u8`
*/
UInt8:1,"1":"UInt8",
/**
* Memory location contains a `u16`
*/
UInt16:2,"2":"UInt16",
/**
* Memory location contains a `u32`
*/
UInt32:3,"3":"UInt32",
/**
* Memory location contains a `u52`
*/
UInt52:4,"4":"UInt52",
/**
* Memory location contains a `u64`
*/
UInt64:5,"5":"UInt64",
/**
* Memory location contains a `u128`
*/
UInt128:6,"6":"UInt128",
/**
* Memory location contains a `u256`
*/
UInt256:7,"7":"UInt256",
/**
* Memory location contains a `u512`
*/
UInt512:8,"8":"UInt512",
/**
* Memory location contains a `i8`
*/
Int8:9,"9":"Int8",
/**
* Memory location contains a `i16`
*/
Int16:10,"10":"Int16",
/**
* Memory location contains a `i32`
*/
Int32:11,"11":"Int32",
/**
* Memory location contains a `i64`
*/
Int64:12,"12":"Int64",
/**
* Memory location contains a `i128`
*/
Int128:13,"13":"Int128",
/**
* Memory location contains a `i256`
*/
Int256:14,"14":"Int256",
/**
* Memory location contains a `i512`
*/
Int512:15,"15":"Int512",
/**
* Memory location contains a seg:ptr pair, `u16` (offset) + `u16` (segment/selector)
*/
SegPtr16:16,"16":"SegPtr16",
/**
* Memory location contains a seg:ptr pair, `u32` (offset) + `u16` (segment/selector)
*/
SegPtr32:17,"17":"SegPtr32",
/**
* Memory location contains a seg:ptr pair, `u64` (offset) + `u16` (segment/selector)
*/
SegPtr64:18,"18":"SegPtr64",
/**
* Memory location contains a 16-bit offset (`JMP/CALL WORD PTR [mem]`)
*/
WordOffset:19,"19":"WordOffset",
/**
* Memory location contains a 32-bit offset (`JMP/CALL DWORD PTR [mem]`)
*/
DwordOffset:20,"20":"DwordOffset",
/**
* Memory location contains a 64-bit offset (`JMP/CALL QWORD PTR [mem]`)
*/
QwordOffset:21,"21":"QwordOffset",
/**
* Memory location contains two `u16`s (16-bit `BOUND`)
*/
Bound16_WordWord:22,"22":"Bound16_WordWord",
/**
* Memory location contains two `u32`s (32-bit `BOUND`)
*/
Bound32_DwordDword:23,"23":"Bound32_DwordDword",
/**
* 32-bit `BNDMOV`, 2 x `u32`
*/
Bnd32:24,"24":"Bnd32",
/**
* 64-bit `BNDMOV`, 2 x `u64`
*/
Bnd64:25,"25":"Bnd64",
/**
* Memory location contains a 16-bit limit and a 32-bit address (eg. `LGDTW`, `LGDTD`)
*/
Fword6:26,"26":"Fword6",
/**
* Memory location contains a 16-bit limit and a 64-bit address (eg. `LGDTQ`)
*/
Fword10:27,"27":"Fword10",
/**
* Memory location contains a `f16`
*/
Float16:28,"28":"Float16",
/**
* Memory location contains a `f32`
*/
Float32:29,"29":"Float32",
/**
* Memory location contains a `f64`
*/
Float64:30,"30":"Float64",
/**
* Memory location contains a `f80`
*/
Float80:31,"31":"Float80",
/**
* Memory location contains a `f128`
*/
Float128:32,"32":"Float128",
/**
* Memory location contains a `bfloat16`
*/
BFloat16:33,"33":"BFloat16",
/**
* Memory location contains a 14-byte FPU environment (16-bit `FLDENV`/`FSTENV`)
*/
FpuEnv14:34,"34":"FpuEnv14",
/**
* Memory location contains a 28-byte FPU environment (32/64-bit `FLDENV`/`FSTENV`)
*/
FpuEnv28:35,"35":"FpuEnv28",
/**
* Memory location contains a 94-byte FPU environment (16-bit `FSAVE`/`FRSTOR`)
*/
FpuState94:36,"36":"FpuState94",
/**
* Memory location contains a 108-byte FPU environment (32/64-bit `FSAVE`/`FRSTOR`)
*/
FpuState108:37,"37":"FpuState108",
/**
* Memory location contains 512-bytes of `FXSAVE`/`FXRSTOR` data
*/
Fxsave_512Byte:38,"38":"Fxsave_512Byte",
/**
* Memory location contains 512-bytes of `FXSAVE64`/`FXRSTOR64` data
*/
Fxsave64_512Byte:39,"39":"Fxsave64_512Byte",
/**
* 32-bit `XSAVE` area
*/
Xsave:40,"40":"Xsave",
/**
* 64-bit `XSAVE` area
*/
Xsave64:41,"41":"Xsave64",
/**
* Memory location contains a 10-byte `bcd` value (`FBLD`/`FBSTP`)
*/
Bcd:42,"42":"Bcd",
/**
* 64-bit location: TILECFG (`LDTILECFG`/`STTILECFG`)
*/
Tilecfg:43,"43":"Tilecfg",
/**
* Tile data
*/
Tile:44,"44":"Tile",
/**
* 80-bit segment descriptor and selector: 0-7 = descriptor, 8-9 = selector
*/
SegmentDescSelector:45,"45":"SegmentDescSelector",
/**
* 384-bit AES 128 handle (Key Locker)
*/
KLHandleAes128:46,"46":"KLHandleAes128",
/**
* 512-bit AES 256 handle (Key Locker)
*/
KLHandleAes256:47,"47":"KLHandleAes256",
/**
* 16-bit location: 2 x `u8`
*/
Packed16_UInt8:48,"48":"Packed16_UInt8",
/**
* 16-bit location: 2 x `i8`
*/
Packed16_Int8:49,"49":"Packed16_Int8",
/**
* 32-bit location: 4 x `u8`
*/
Packed32_UInt8:50,"50":"Packed32_UInt8",
/**
* 32-bit location: 4 x `i8`
*/
Packed32_Int8:51,"51":"Packed32_Int8",
/**
* 32-bit location: 2 x `u16`
*/
Packed32_UInt16:52,"52":"Packed32_UInt16",
/**
* 32-bit location: 2 x `i16`
*/
Packed32_Int16:53,"53":"Packed32_Int16",
/**
* 32-bit location: 2 x `f16`
*/
Packed32_Float16:54,"54":"Packed32_Float16",
/**
* 32-bit location: 2 x `bfloat16`
*/
Packed32_BFloat16:55,"55":"Packed32_BFloat16",
/**
* 64-bit location: 8 x `u8`
*/
Packed64_UInt8:56,"56":"Packed64_UInt8",
/**
* 64-bit location: 8 x `i8`
*/
Packed64_Int8:57,"57":"Packed64_Int8",
/**
* 64-bit location: 4 x `u16`
*/
Packed64_UInt16:58,"58":"Packed64_UInt16",
/**
* 64-bit location: 4 x `i16`
*/
Packed64_Int16:59,"59":"Packed64_Int16",
/**
* 64-bit location: 2 x `u32`
*/
Packed64_UInt32:60,"60":"Packed64_UInt32",
/**
* 64-bit location: 2 x `i32`
*/
Packed64_Int32:61,"61":"Packed64_Int32",
/**
* 64-bit location: 4 x `f16`
*/
Packed64_Float16:62,"62":"Packed64_Float16",
/**
* 64-bit location: 2 x `f32`
*/
Packed64_Float32:63,"63":"Packed64_Float32",
/**
* 128-bit location: 16 x `u8`
*/
Packed128_UInt8:64,"64":"Packed128_UInt8",
/**
* 128-bit location: 16 x `i8`
*/
Packed128_Int8:65,"65":"Packed128_Int8",
/**
* 128-bit location: 8 x `u16`
*/
Packed128_UInt16:66,"66":"Packed128_UInt16",
/**
* 128-bit location: 8 x `i16`
*/
Packed128_Int16:67,"67":"Packed128_Int16",
/**
* 128-bit location: 4 x `u32`
*/
Packed128_UInt32:68,"68":"Packed128_UInt32",
/**
* 128-bit location: 4 x `i32`
*/
Packed128_Int32:69,"69":"Packed128_Int32",
/**
* 128-bit location: 2 x `u52`
*/
Packed128_UInt52:70,"70":"Packed128_UInt52",
/**
* 128-bit location: 2 x `u64`
*/
Packed128_UInt64:71,"71":"Packed128_UInt64",
/**
* 128-bit location: 2 x `i64`
*/
Packed128_Int64:72,"72":"Packed128_Int64",
/**
* 128-bit location: 8 x `f16`
*/
Packed128_Float16:73,"73":"Packed128_Float16",
/**
* 128-bit location: 4 x `f32`
*/
Packed128_Float32:74,"74":"Packed128_Float32",
/**
* 128-bit location: 2 x `f64`
*/
Packed128_Float64:75,"75":"Packed128_Float64",
/**
* 128-bit location: 8 x `bfloat16`
*/
Packed128_BFloat16:76,"76":"Packed128_BFloat16",
/**
* 128-bit location: 4 x (2 x `f16`)
*/
Packed128_2xFloat16:77,"77":"Packed128_2xFloat16",
/**
* 128-bit location: 4 x (2 x `bfloat16`)
*/
Packed128_2xBFloat16:78,"78":"Packed128_2xBFloat16",
/**
* 256-bit location: 32 x `u8`
*/
Packed256_UInt8:79,"79":"Packed256_UInt8",
/**
* 256-bit location: 32 x `i8`
*/
Packed256_Int8:80,"80":"Packed256_Int8",
/**
* 256-bit location: 16 x `u16`
*/
Packed256_UInt16:81,"81":"Packed256_UInt16",
/**
* 256-bit location: 16 x `i16`
*/
Packed256_Int16:82,"82":"Packed256_Int16",
/**
* 256-bit location: 8 x `u32`
*/
Packed256_UInt32:83,"83":"Packed256_UInt32",
/**
* 256-bit location: 8 x `i32`
*/
Packed256_Int32:84,"84":"Packed256_Int32",
/**
* 256-bit location: 4 x `u52`
*/
Packed256_UInt52:85,"85":"Packed256_UInt52",
/**
* 256-bit location: 4 x `u64`
*/
Packed256_UInt64:86,"86":"Packed256_UInt64",
/**
* 256-bit location: 4 x `i64`
*/
Packed256_Int64:87,"87":"Packed256_Int64",
/**
* 256-bit location: 2 x `u128`
*/
Packed256_UInt128:88,"88":"Packed256_UInt128",
/**
* 256-bit location: 2 x `i128`
*/
Packed256_Int128:89,"89":"Packed256_Int128",
/**
* 256-bit location: 16 x `f16`
*/
Packed256_Float16:90,"90":"Packed256_Float16",
/**
* 256-bit location: 8 x `f32`
*/
Packed256_Float32:91,"91":"Packed256_Float32",
/**
* 256-bit location: 4 x `f64`
*/
Packed256_Float64:92,"92":"Packed256_Float64",
/**
* 256-bit location: 2 x `f128`
*/
Packed256_Float128:93,"93":"Packed256_Float128",
/**
* 256-bit location: 16 x `bfloat16`
*/
Packed256_BFloat16:94,"94":"Packed256_BFloat16",
/**
* 256-bit location: 8 x (2 x `f16`)
*/
Packed256_2xFloat16:95,"95":"Packed256_2xFloat16",
/**
* 256-bit location: 8 x (2 x `bfloat16`)
*/
Packed256_2xBFloat16:96,"96":"Packed256_2xBFloat16",
/**
* 512-bit location: 64 x `u8`
*/
Packed512_UInt8:97,"97":"Packed512_UInt8",
/**
* 512-bit location: 64 x `i8`
*/
Packed512_Int8:98,"98":"Packed512_Int8",
/**
* 512-bit location: 32 x `u16`
*/
Packed512_UInt16:99,"99":"Packed512_UInt16",
/**
* 512-bit location: 32 x `i16`
*/
Packed512_Int16:100,"100":"Packed512_Int16",
/**
* 512-bit location: 16 x `u32`
*/
Packed512_UInt32:101,"101":"Packed512_UInt32",
/**
* 512-bit location: 16 x `i32`
*/
Packed512_Int32:102,"102":"Packed512_Int32",
/**
* 512-bit location: 8 x `u52`
*/
Packed512_UInt52:103,"103":"Packed512_UInt52",
/**
* 512-bit location: 8 x `u64`
*/
Packed512_UInt64:104,"104":"Packed512_UInt64",
/**
* 512-bit location: 8 x `i64`
*/
Packed512_Int64:105,"105":"Packed512_Int64",
/**
* 256-bit location: 4 x `u128`
*/
Packed512_UInt128:106,"106":"Packed512_UInt128",
/**
* 512-bit location: 32 x `f16`
*/
Packed512_Float16:107,"107":"Packed512_Float16",
/**
* 512-bit location: 16 x `f32`
*/
Packed512_Float32:108,"108":"Packed512_Float32",
/**
* 512-bit location: 8 x `f64`
*/
Packed512_Float64:109,"109":"Packed512_Float64",
/**
* 512-bit location: 16 x (2 x `f16`)
*/
Packed512_2xFloat16:110,"110":"Packed512_2xFloat16",
/**
* 512-bit location: 16 x (2 x `bfloat16`)
*/
Packed512_2xBFloat16:111,"111":"Packed512_2xBFloat16",
/**
* Broadcast `f16` to 32-bits
*/
Broadcast32_Float16:112,"112":"Broadcast32_Float16",
/**
* Broadcast `u32` to 64-bits
*/
Broadcast64_UInt32:113,"113":"Broadcast64_UInt32",
/**
* Broadcast `i32` to 64-bits
*/
Broadcast64_Int32:114,"114":"Broadcast64_Int32",
/**
* Broadcast `f16` to 64-bits
*/
Broadcast64_Float16:115,"115":"Broadcast64_Float16",
/**
* Broadcast `f32` to 64-bits
*/
Broadcast64_Float32:116,"116":"Broadcast64_Float32",
/**
* Broadcast `i16` to 128-bits
*/
Broadcast128_Int16:117,"117":"Broadcast128_Int16",
/**
* Broadcast `u16` to 128-bits
*/
Broadcast128_UInt16:118,"118":"Broadcast128_UInt16",
/**
* Broadcast `u32` to 128-bits
*/
Broadcast128_UInt32:119,"119":"Broadcast128_UInt32",
/**
* Broadcast `i32` to 128-bits
*/
Broadcast128_Int32:120,"120":"Broadcast128_Int32",
/**
* Broadcast `u52` to 128-bits
*/
Broadcast128_UInt52:121,"121":"Broadcast128_UInt52",
/**
* Broadcast `u64` to 128-bits
*/
Broadcast128_UInt64:122,"122":"Broadcast128_UInt64",
/**
* Broadcast `i64` to 128-bits
*/
Broadcast128_Int64:123,"123":"Broadcast128_Int64",
/**
* Broadcast `f16` to 128-bits
*/
Broadcast128_Float16:124,"124":"Broadcast128_Float16",
/**
* Broadcast `f32` to 128-bits
*/
Broadcast128_Float32:125,"125":"Broadcast128_Float32",
/**
* Broadcast `f64` to 128-bits
*/
Broadcast128_Float64:126,"126":"Broadcast128_Float64",
/**
* Broadcast 2 x `i16` to 128-bits
*/
Broadcast128_2xInt16:127,"127":"Broadcast128_2xInt16",
/**
* Broadcast 2 x `i32` to 128-bits
*/
Broadcast128_2xInt32:128,"128":"Broadcast128_2xInt32",
/**
* Broadcast 2 x `u32` to 128-bits
*/
Broadcast128_2xUInt32:129,"129":"Broadcast128_2xUInt32",
/**
* Broadcast 2 x `f16` to 128-bits
*/
Broadcast128_2xFloat16:130,"130":"Broadcast128_2xFloat16",
/**
* Broadcast 2 x `bfloat16` to 128-bits
*/
Broadcast128_2xBFloat16:131,"131":"Broadcast128_2xBFloat16",
/**
* Broadcast `i16` to 256-bits
*/
Broadcast256_Int16:132,"132":"Broadcast256_Int16",
/**
* Broadcast `u16` to 256-bits
*/
Broadcast256_UInt16:133,"133":"Broadcast256_UInt16",
/**
* Broadcast `u32` to 256-bits
*/
Broadcast256_UInt32:134,"134":"Broadcast256_UInt32",
/**
* Broadcast `i32` to 256-bits
*/
Broadcast256_Int32:135,"135":"Broadcast256_Int32",
/**
* Broadcast `u52` to 256-bits
*/
Broadcast256_UInt52:136,"136":"Broadcast256_UInt52",
/**
* Broadcast `u64` to 256-bits
*/
Broadcast256_UInt64:137,"137":"Broadcast256_UInt64",
/**
* Broadcast `i64` to 256-bits
*/
Broadcast256_Int64:138,"138":"Broadcast256_Int64",
/**
* Broadcast `f16` to 256-bits
*/
Broadcast256_Float16:139,"139":"Broadcast256_Float16",
/**
* Broadcast `f32` to 256-bits
*/
Broadcast256_Float32:140,"140":"Broadcast256_Float32",
/**
* Broadcast `f64` to 256-bits
*/
Broadcast256_Float64:141,"141":"Broadcast256_Float64",
/**
* Broadcast 2 x `i16` to 256-bits
*/
Broadcast256_2xInt16:142,"142":"Broadcast256_2xInt16",
/**
* Broadcast 2 x `i32` to 256-bits
*/
Broadcast256_2xInt32:143,"143":"Broadcast256_2xInt32",
/**
* Broadcast 2 x `u32` to 256-bits
*/
Broadcast256_2xUInt32:144,"144":"Broadcast256_2xUInt32",
/**
* Broadcast 2 x `f16` to 256-bits
*/
Broadcast256_2xFloat16:145,"145":"Broadcast256_2xFloat16",
/**
* Broadcast 2 x `bfloat16` to 256-bits
*/
Broadcast256_2xBFloat16:146,"146":"Broadcast256_2xBFloat16",
/**
* Broadcast `i16` to 512-bits
*/
Broadcast512_Int16:147,"147":"Broadcast512_Int16",
/**
* Broadcast `u16` to 512-bits
*/
Broadcast512_UInt16:148,"148":"Broadcast512_UInt16",
/**
* Broadcast `u32` to 512-bits
*/
Broadcast512_UInt32:149,"149":"Broadcast512_UInt32",
/**
* Broadcast `i32` to 512-bits
*/
Broadcast512_Int32:150,"150":"Broadcast512_Int32",
/**
* Broadcast `u52` to 512-bits
*/
Broadcast512_UInt52:151,"151":"Broadcast512_UInt52",
/**
* Broadcast `u64` to 512-bits
*/
Broadcast512_UInt64:152,"152":"Broadcast512_UInt64",
/**
* Broadcast `i64` to 512-bits
*/
Broadcast512_Int64:153,"153":"Broadcast512_Int64",
/**
* Broadcast `f16` to 512-bits
*/
Broadcast512_Float16:154,"154":"Broadcast512_Float16",
/**
* Broadcast `f32` to 512-bits
*/
Broadcast512_Float32:155,"155":"Broadcast512_Float32",
/**
* Broadcast `f64` to 512-bits
*/
Broadcast512_Float64:156,"156":"Broadcast512_Float64",
/**
* Broadcast 2 x `f16` to 512-bits
*/
Broadcast512_2xFloat16:157,"157":"Broadcast512_2xFloat16",
/**
* Broadcast 2 x `i16` to 512-bits
*/
Broadcast512_2xInt16:158,"158":"Broadcast512_2xInt16",
/**
* Broadcast 2 x `u32` to 512-bits
*/
Broadcast512_2xUInt32:159,"159":"Broadcast512_2xUInt32",
/**
* Broadcast 2 x `i32` to 512-bits
*/
Broadcast512_2xInt32:160,"160":"Broadcast512_2xInt32",
/**
* Broadcast 2 x `bfloat16` to 512-bits
*/
Broadcast512_2xBFloat16:161,"161":"Broadcast512_2xBFloat16", });
/**
* Format mnemonic options
*/
__exports.FormatMnemonicOptions = Object.freeze({
/**
* No option is set
*/
None:0,"0":"None",
/**
* Don't add any prefixes
*/
NoPrefixes:1,"1":"NoPrefixes",
/**
* Don't add the mnemonic
*/
NoMnemonic:2,"2":"NoMnemonic", });
/**
* Decoder options
*/
__exports.DecoderOptions = Object.freeze({
/**
* No option is enabled
*/
None:0,"0":"None",
/**
* Disable some checks for invalid encodings of instructions, eg. most instructions can't use a `LOCK` prefix so if one is found, they're decoded as [`Code.INVALID`] unless this option is enabled.
*
* [`Code.INVALID`]: enum.Code.html#variant.INVALID
*/
NoInvalidCheck:1,"1":"NoInvalidCheck",
/**
* AMD decoder: allow 16-bit branch/ret instructions in 64-bit mode, no `o64 CALL/JMP FAR [mem], o64 LSS/LFS/LGS`, `UD0` has no modr/m byte, decode `LOCK MOV CR`. The AMD decoder can still decode Intel instructions.
*/
AMD:2,"2":"AMD",
/**
* Decode opcodes `0F0D` and `0F18-0F1F` as reserved-nop instructions (eg. [`Code.Reservednop_rm32_r32_0F1D`])
*
* [`Code.Reservednop_rm32_r32_0F1D`]: enum.Code.html#variant.Reservednop_rm32_r32_0F1D
*/
ForceReservedNop:4,"4":"ForceReservedNop",
/**
* Decode `UMOV` instructions
*/
Umov:8,"8":"Umov",
/**
* Decode `XBTS`/`IBTS`
*/
Xbts:16,"16":"Xbts",
/**
* Decode `0FA6`/`0FA7` as `CMPXCHG`
*/
Cmpxchg486A:32,"32":"Cmpxchg486A",
/**
* Decode some old removed FPU instructions (eg. `FRSTPM`)
*/
OldFpu:64,"64":"OldFpu",
/**
* Decode `PCOMMIT`
*/
Pcommit:128,"128":"Pcommit",
/**
* Decode 286 `STOREALL`/`LOADALL` (`0F04` and `0F05`)
*/
Loadall286:256,"256":"Loadall286",
/**
* Decode 386 `LOADALL`
*/
Loadall386:512,"512":"Loadall386",
/**
* Decode `CL1INVMB`
*/
Cl1invmb:1024,"1024":"Cl1invmb",
/**
* Decode `MOV r32,tr` and `MOV tr,r32`
*/
MovTr:2048,"2048":"MovTr",
/**
* Decode `JMPE` instructions
*/
Jmpe:4096,"4096":"Jmpe",
/**
* Don't decode `PAUSE`, decode `NOP` instead
*/
NoPause:8192,"8192":"NoPause",
/**
* Don't decode `WBNOINVD`, decode `WBINVD` instead
*/
NoWbnoinvd:16384,"16384":"NoWbnoinvd",
/**
* Decode undocumented Intel `RDUDBG` and `WRUDBG` instructions
*/
Udbg:32768,"32768":"Udbg",
/**
* Don't decode `TZCNT`, decode `BSF` instead
*/
NoMPFX_0FBC:65536,"65536":"NoMPFX_0FBC",
/**
* Don't decode `LZCNT`, decode `BSR` instead
*/
NoMPFX_0FBD:131072,"131072":"NoMPFX_0FBD",
/**
* Don't decode `LAHF` and `SAHF` in 64-bit mode
*/
NoLahfSahf64:262144,"262144":"NoLahfSahf64",
/**
* Decode `MPX` instructions
*/
MPX:524288,"524288":"MPX",
/**
* Decode most Cyrix instructions: `FPU`, `EMMI`, `SMM`, `DDI`
*/
Cyrix:1048576,"1048576":"Cyrix",
/**
* Decode Cyrix `SMINT 0F7E` (Cyrix 6x86 or earlier)
*/
Cyrix_SMINT_0F7E:2097152,"2097152":"Cyrix_SMINT_0F7E",
/**
* Decode Cyrix `DMI` instructions (AMD Geode GX/LX)
*/
Cyrix_DMI:4194304,"4194304":"Cyrix_DMI",
/**
* Decode Centaur `ALTINST`
*/
ALTINST:8388608,"8388608":"ALTINST",
/**
* Decode Intel Knights Corner instructions (requires the `mvex` feature)
*/
KNC:16777216,"16777216":"KNC", });
/**
* `RFLAGS` bits, FPU condition code bits and misc bits (`UIF`) supported by the instruction info code
*/
__exports.RflagsBits = Object.freeze({
/**
* No bit is set
*/
None:0,"0":"None",
/**
* `RFLAGS.OF`
*/
OF:1,"1":"OF",
/**
* `RFLAGS.SF`
*/
SF:2,"2":"SF",
/**
* `RFLAGS.ZF`
*/
ZF:4,"4":"ZF",
/**
* `RFLAGS.AF`
*/
AF:8,"8":"AF",
/**
* `RFLAGS.CF`
*/
CF:16,"16":"CF",
/**
* `RFLAGS.PF`
*/
PF:32,"32":"PF",
/**
* `RFLAGS.DF`
*/
DF:64,"64":"DF",
/**
* `RFLAGS.IF`
*/
IF:128,"128":"IF",
/**
* `RFLAGS.AC`
*/
AC:256,"256":"AC",
/**
* `UIF`
*/
UIF:512,"512":"UIF",
/**
* FPU status word bit `C0`
*/
C0:1024,"1024":"C0",
/**
* FPU status word bit `C1`
*/
C1:2048,"2048":"C1",
/**
* FPU status word bit `C2`
*/
C2:4096,"4096":"C2",
/**
* FPU status word bit `C3`
*/
C3:8192,"8192":"C3", });
/**
* Mnemonic condition code selector (eg. `JNE` / `JNZ`)
*/
__exports.CC_ne = Object.freeze({
/**
* `JNE`, `CMOVNE`, `SETNE`, `LOOPNE`, `REPNE`
*/
ne:0,"0":"ne",
/**
* `JNZ`, `CMOVNZ`, `SETNZ`, `LOOPNZ`, `REPNZ`
*/
nz:1,"1":"nz", });
/**
* Formatter syntax (GNU Assembler, Intel XED, masm, nasm)
*/
__exports.FormatterSyntax = Object.freeze({
/**
* GNU Assembler (AT&T)
*/
Gas:0,"0":"Gas",
/**
* Intel XED
*/
Intel:1,"1":"Intel",
/**
* masm
*/
Masm:2,"2":"Masm",
/**
* nasm
*/
Nasm:3,"3":"Nasm", });
/**
* Instruction info options used by [`InstructionInfoFactory`]
*
* [`InstructionInfoFactory`]: struct.InstructionInfoFactory.html
*/
__exports.InstructionInfoOptions = Object.freeze({
/**
* No option is enabled
*/
None:0,"0":"None",
/**
* Don't include memory usage, i.e., [`InstructionInfo.usedMemory()`] will return an empty vector. All
* registers that are used by memory operands are still returned by [`InstructionInfo.usedRegisters()`].
*
* [`InstructionInfo.usedMemory()`]: struct.InstructionInfo.html#method.used_memory
* [`InstructionInfo.usedRegisters()`]: struct.InstructionInfo.html#method.used_registers
*/
NoMemoryUsage:1,"1":"NoMemoryUsage",
/**
* Don't include register usage, i.e., [`InstructionInfo.usedRegisters()`] will return an empty vector
*
* [`InstructionInfo.usedRegisters()`]: struct.InstructionInfo.html#method.used_registers
*/
NoRegisterUsage:2,"2":"NoRegisterUsage", });
/**
* Memory size options used by the formatters
*/
__exports.MemorySizeOptions = Object.freeze({
/**
* Show memory size if the assembler requires it, else don't show anything
*/
Default:0,"0":"Default",
/**
* Always show the memory size, even if the assembler doesn't need it
*/
Always:1,"1":"Always",
/**
* Show memory size if a human can't figure out the size of the operand
*/
Minimal:2,"2":"Minimal",
/**
* Never show memory size
*/
Never:3,"3":"Never", });
/**
* The code size (16/32/64) that was used when an instruction was decoded
*/
__exports.CodeSize = Object.freeze({
/**
* Unknown size
*/
Unknown:0,"0":"Unknown",
/**
* 16-bit code
*/
Code16:1,"1":"Code16",
/**
* 32-bit code
*/
Code32:2,"2":"Code32",
/**
* 64-bit code
*/
Code64:3,"3":"Code64", });
/**
* Contains the offsets of the displacement and immediate. Call [`Decoder.getConstantOffsets()`] or
* [`Encoder.getConstantOffsets()`] to get the offsets of the constants after the instruction has been
* decoded/encoded.
*
* [`Decoder.getConstantOffsets()`]: struct.Decoder.html#method.get_constant_offsets
* [`Encoder.getConstantOffsets()`]: struct.Encoder.html#method.get_constant_offsets
*/
class ConstantOffsets {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ConstantOffsets.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_constantoffsets_free(ptr);
    }
    /**
    * The offset of the displacement, if any
    * @returns {number}
    */
    get displacementOffset() {
        const ret = wasm.constantoffsets_displacementOffset(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size in bytes of the displacement, or 0 if there's no displacement
    * @returns {number}
    */
    get displacementSize() {
        const ret = wasm.constantoffsets_displacementSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * The offset of the first immediate, if any.
    *
    * This field can be invalid even if the operand has an immediate if it's an immediate that isn't part
    * of the instruction stream, eg. `SHL AL,1`.
    * @returns {number}
    */
    get immediateOffset() {
        const ret = wasm.constantoffsets_immediateOffset(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size in bytes of the first immediate, or 0 if there's no immediate
    * @returns {number}
    */
    get immediateSize() {
        const ret = wasm.constantoffsets_immediateSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * The offset of the second immediate, if any.
    * @returns {number}
    */
    get immediateOffset2() {
        const ret = wasm.constantoffsets_immediateOffset2(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size in bytes of the second immediate, or 0 if there's no second immediate
    * @returns {number}
    */
    get immediateSize2() {
        const ret = wasm.constantoffsets_immediateSize2(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * `true` if [`displacementOffset`] and [`displacementSize`] are valid
    *
    * [`displacementOffset`]: #method.displacement_offset
    * [`displacementSize`]: #method.displacement_size
    * @returns {boolean}
    */
    get hasDisplacement() {
        const ret = wasm.constantoffsets_hasDisplacement(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if [`immediateOffset`] and [`immediateSize`] are valid
    *
    * [`immediateOffset`]: #method.immediate_offset
    * [`immediateSize`]: #method.immediate_size
    * @returns {boolean}
    */
    get hasImmediate() {
        const ret = wasm.constantoffsets_hasImmediate(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if [`immediateOffset2`] and [`immediateSize2`] are valid
    *
    * [`immediateOffset2`]: #method.immediate_offset2
    * [`immediateSize2`]: #method.immediate_size2
    * @returns {boolean}
    */
    get hasImmediate2() {
        const ret = wasm.constantoffsets_hasImmediate2(this.__wbg_ptr);
        return ret !== 0;
    }
}
__exports.ConstantOffsets = ConstantOffsets;
/**
* Decodes 16/32/64-bit x86 instructions
*/
class Decoder {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_decoder_free(ptr);
    }
    /**
    * Creates a decoder
    *
    * # Throws
    *
    * Throws if `bitness` is not one of 16, 32, 64.
    *
    * # Arguments
    *
    * * `bitness`: 16, 32 or 64
    * * `data`: Data to decode
    * * `options`: Decoder options (a [`DecoderOptions`] flags value), `0` or eg. `DecoderOptions.NoInvalidCheck | DecoderOptions.AMD`
    *
    * [`DecoderOptions`]: enum.DecoderOptions.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Code, Decoder, DecoderOptions, Mnemonic } = require("iced-x86");
    *
    * // xchg ah,[rdx+rsi+16h]
    * // xacquire lock add dword ptr [rax],5Ah
    * // vmovdqu64 zmm18{k3}{z},zmm11
    * const bytes = new Uint8Array([0x86, 0x64, 0x32, 0x16, 0xF0, 0xF2, 0x83, 0x00, 0x5A, 0x62, 0xC1, 0xFE, 0xCB, 0x6F, 0xD3]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * decoder.ip = 0x12345678n;
    *
    * const instr = decoder.decode();
    * assert.equal(instr.code, Code.Xchg_rm8_r8);
    * assert.equal(instr.mnemonic, Mnemonic.Xchg);
    * assert.equal(instr.length, 4);
    *
    * decoder.decodeOut(instr);
    * assert.equal(instr.code, Code.Add_rm32_imm8);
    * assert.equal(instr.mnemonic, Mnemonic.Add);
    * assert.equal(instr.length, 5);
    *
    * decoder.decodeOut(instr);
    * assert.equal(instr.code, Code.EVEX_Vmovdqu64_zmm_k1z_zmmm512);
    * assert.equal(instr.mnemonic, Mnemonic.Vmovdqu64);
    * assert.equal(instr.length, 6);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    *
    * It's sometimes useful to decode some invalid instructions, eg. `lock add esi,ecx`.
    * Pass in [`DecoderOptions.NoInvalidCheck`] to the constructor and the decoder
    * will decode some invalid encodings.
    *
    * [`DecoderOptions.NoInvalidCheck`]: enum.DecoderOptions.html#variant.NoInvalidCheck
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Code, Decoder, DecoderOptions } = require("iced-x86");
    *
    * // lock add esi,ecx   ; lock not allowed
    * const bytes = new Uint8Array([0xF0, 0x01, 0xCE]);
    * const decoder1 = new Decoder(64, bytes, DecoderOptions.None);
    * decoder1.ip = 0x12345678n;
    * const instr1 = decoder1.decode();
    * assert.equal(instr1.code, Code.INVALID);
    *
    * // We want to decode some instructions with invalid encodings
    * const decoder2 = new Decoder(64, bytes, DecoderOptions.NoInvalidCheck);
    * decoder2.ip = 0x12345678n;
    * const instr2 = decoder2.decode();
    * assert.equal(instr2.code, Code.Add_rm32_r32);
    * assert.ok(instr2.hasLockPrefix);
    *
    * // Free wasm memory
    * decoder1.free();
    * decoder2.free();
    * instr1.free();
    * instr2.free();
    * ```
    * @param {number} bitness
    * @param {Uint8Array} data
    * @param {number} options
    */
    constructor(bitness, data, options) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.decoder_new(retptr, bitness, ptr0, len0, options);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Gets the current `IP`/`EIP`/`RIP` value, see also [`position`]
    *
    * [`position`]: #method.position
    * @returns {bigint}
    */
    get ip() {
        const ret = wasm.decoder_ip(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Sets the current `IP`/`EIP`/`RIP` value, see also [`position`]
    *
    * Writing to this property only updates the IP value, it does not change the data position, use [`position`] to change the position.
    *
    * [`position`]: #method.set_position
    *
    * # Arguments
    *
    * * `new_value`: New IP
    * @param {bigint} new_value
    */
    set ip(new_value) {
        wasm.decoder_set_ip(this.__wbg_ptr, new_value);
    }
    /**
    * Gets the bitness (16, 32 or 64)
    * @returns {number}
    */
    get bitness() {
        const ret = wasm.decoder_bitness(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets the max value that can be written to [`position`]. This is the size of the data that gets
    * decoded to instructions and it's the length of the array that was passed to the constructor.
    *
    * [`position`]: #method.set_position
    * @returns {number}
    */
    get maxPosition() {
        const ret = wasm.decoder_maxPosition(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets the current data position. This value is always <= [`maxPosition`].
    * When [`position`] == [`maxPosition`], it's not possible to decode more
    * instructions and [`canDecode`] returns `false`.
    *
    * [`maxPosition`]: #method.max_position
    * [`position`]: #method.position
    * [`canDecode`]: #method.can_decode
    * @returns {number}
    */
    get position() {
        const ret = wasm.decoder_position(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Sets the current data position, which is the index into the data passed to the constructor.
    * This value is always <= [`maxPosition`]
    *
    * [`maxPosition`]: #method.max_position
    *
    * # Throws
    *
    * Throws if the new position is invalid.
    *
    * # Arguments
    *
    * * `new_pos`: New position and must be <= [`maxPosition`]
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Code, Decoder, DecoderOptions } = require("iced-x86");
    *
    * // nop and pause
    * const bytes = new Uint8Array([0x90, 0xF3, 0x90]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * decoder.ip = 0x12345678n;
    *
    * assert.equal(decoder.position, 0);
    * assert.equal(decoder.maxPosition, 3);
    * const instr = decoder.decode();
    * assert.equal(decoder.position, 1);
    * assert.equal(instr.code, Code.Nopd);
    *
    * decoder.decodeOut(instr);
    * assert.equal(decoder.position, 3);
    * assert.equal(instr.code, Code.Pause);
    *
    * // Start all over again
    * decoder.position = 0;
    * assert.equal(decoder.position, 0);
    * decoder.decodeOut(instr);
    * assert.equal(instr.code, Code.Nopd);
    * decoder.decodeOut(instr);
    * assert.equal(instr.code, Code.Pause);
    * assert.equal(decoder.position, 3);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @param {number} new_pos
    */
    set position(new_pos) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.decoder_set_position(retptr, this.__wbg_ptr, new_pos);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns `true` if there's at least one more byte to decode. It doesn't verify that the
    * next instruction is valid, it only checks if there's at least one more byte to read.
    * See also [`position`] and [`maxPosition`]
    *
    * It's not required to call this method. If this method returns `false`, then [`decodeOut()`]
    * and [`decode()`] will return an instruction whose [`code`] == [`Code.INVALID`].
    *
    * [`position`]: #method.position
    * [`maxPosition`]: #method.max_position
    * [`decodeOut()`]: #method.decode_out
    * [`decode()`]: #method.decode
    * [`code`]: struct.Instruction.html#method.code
    * [`Code.INVALID`]: enum.Code.html#variant.INVALID
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Code, Decoder, DecoderOptions } = require("iced-x86");
    *
    * // nop and an incomplete instruction
    * const bytes = new Uint8Array([0x90, 0xF3, 0x0F]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * decoder.ip = 0x12345678n;
    *
    * // 3 bytes left to read
    * assert.ok(decoder.canDecode);
    * const instr = decoder.decode();
    * assert.equal(instr.code, Code.Nopd);
    *
    * // 2 bytes left to read
    * assert.ok(decoder.canDecode);
    * decoder.decodeOut(instr);
    * // Not enough bytes left to decode a full instruction
    * assert.equal(instr.code, Code.INVALID);
    *
    * // 0 bytes left to read
    * assert.ok(!decoder.canDecode);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {boolean}
    */
    get canDecode() {
        const ret = wasm.decoder_canDecode(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Decodes all instructions and returns an array of [`Instruction`]s
    *
    * [`Instruction`]: struct.Instruction.html
    * @returns {Array<any>}
    */
    decodeAll() {
        const ret = wasm.decoder_decodeAll(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * Decodes at most `count` instructions and returns an array of [`Instruction`]s.
    * It returns less than `count` instructions if there's not enough data left to decode.
    *
    * [`Instruction`]: struct.Instruction.html
    *
    * # Arguments
    *
    * - `count`: Max number of instructions to decode
    * @param {number} count
    * @returns {Array<any>}
    */
    decodeInstructions(count) {
        const ret = wasm.decoder_decodeInstructions(this.__wbg_ptr, count);
        return takeObject(ret);
    }
    /**
    * Gets the last decoder error. Unless you need to know the reason it failed,
    * it's better to check [`instruction.isInvalid()`].
    *
    * It returns a [`DecoderError`] enum value.
    *
    * [`instruction.isInvalid()`]: struct.Instruction.html#method.is_invalid
    * [`DecoderError`]: enum.DecoderError.html
    * @returns {DecoderError}
    */
    get lastError() {
        const ret = wasm.decoder_lastError(this.__wbg_ptr);
        return ret;
    }
    /**
    * Decodes and returns the next instruction, see also [`decodeOut()`]
    * which avoids allocating a new instruction.
    * See also [`lastError`].
    *
    * [`decodeOut()`]: #method.decode_out
    * [`lastError`]: #method.last_error
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Code, Decoder, DecoderOptions, MemorySize, Mnemonic, OpKind, Register } = require("iced-x86");
    *
    * // xrelease lock add [rax],ebx
    * const bytes = new Uint8Array([0xF0, 0xF3, 0x01, 0x18]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * decoder.ip = 0x12345678n;
    * const instr = decoder.decode();
    *
    * assert.equal(instr.code, Code.Add_rm32_r32);
    * assert.equal(instr.mnemonic, Mnemonic.Add);
    * assert.equal(instr.length, 4);
    * assert.equal(instr.opCount, 2);
    *
    * assert.equal(instr.op0Kind, OpKind.Memory);
    * assert.equal(instr.memoryBase, Register.RAX);
    * assert.equal(instr.memoryIndex, Register.None);
    * assert.equal(instr.memoryIndexScale, 1);
    * assert.equal(instr.memoryDisplacement, 0);
    * assert.equal(instr.memorySegment, Register.DS);
    * assert.equal(instr.segmentPrefix, Register.None);
    * assert.equal(instr.memorySize, MemorySize.UInt32);
    *
    * assert.equal(instr.op1Kind, OpKind.Register);
    * assert.equal(instr.op1Register, Register.EBX);
    *
    * assert.ok(instr.hasLockPrefix);
    * assert.ok(instr.hasXreleasePrefix);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {Instruction}
    */
    decode() {
        const ret = wasm.decoder_decode(this.__wbg_ptr);
        return Instruction.__wrap(ret);
    }
    /**
    * Decodes the next instruction. The difference between this method and [`decode()`] is that this
    * method doesn't need to allocate a new instruction.
    * See also [`lastError`].
    *
    * [`decode()`]: #method.decode
    * [`lastError`]: #method.last_error
    *
    * # Arguments
    *
    * * `instruction`: Updated with the decoded instruction. All fields are initialized (it's an `out` argument)
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Code, Decoder, DecoderOptions, Instruction, MemorySize, Mnemonic, OpKind, Register } = require("iced-x86");
    *
    * // xrelease lock add [rax],ebx
    * const bytes = new Uint8Array([0xF0, 0xF3, 0x01, 0x18]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * decoder.ip = 0x12345678n;
    * const instr = new Instruction();
    * decoder.decodeOut(instr);
    *
    * assert.equal(instr.code, Code.Add_rm32_r32);
    * assert.equal(instr.mnemonic, Mnemonic.Add);
    * assert.equal(instr.length, 4);
    * assert.equal(instr.opCount, 2);
    *
    * assert.equal(instr.op0Kind, OpKind.Memory);
    * assert.equal(instr.memoryBase, Register.RAX);
    * assert.equal(instr.memoryIndex, Register.None);
    * assert.equal(instr.memoryIndexScale, 1);
    * assert.equal(instr.memoryDisplacement, 0);
    * assert.equal(instr.memorySegment, Register.DS);
    * assert.equal(instr.segmentPrefix, Register.None);
    * assert.equal(instr.memorySize, MemorySize.UInt32);
    *
    * assert.equal(instr.op1Kind, OpKind.Register);
    * assert.equal(instr.op1Register, Register.EBX);
    *
    * assert.ok(instr.hasLockPrefix);
    * assert.ok(instr.hasXreleasePrefix);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @param {Instruction} instruction
    */
    decodeOut(instruction) {
        _assertClass(instruction, Instruction);
        wasm.decoder_decodeOut(this.__wbg_ptr, instruction.__wbg_ptr);
    }
    /**
    * Gets the offsets of the constants (memory displacement and immediate) in the decoded instruction.
    * The caller can check if there are any relocations at those addresses.
    *
    * # Arguments
    *
    * * `instruction`: The latest instruction that was decoded by this decoder
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Code, Decoder, DecoderOptions } = require("iced-x86");
    *
    * // nop
    * // xor dword ptr [rax-5AA5EDCCh],5Ah
    * const bytes = new Uint8Array(
    *     //     00    01    02    03    04    05    06
    *     //     opc   modrm displacement__________  imm
    *     [0x90, 0x83, 0xB3, 0x34, 0x12, 0x5A, 0xA5, 0x5A]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * decoder.ip = 0x12345678n;
    * const instr = decoder.decode();
    * assert.equal(instr.code, Code.Nopd);
    * decoder.decodeOut(instr);
    * const co = decoder.getConstantOffsets(instr);
    *
    * assert.ok(co.hasDisplacement);
    * assert.equal(co.displacementOffset, 2);
    * assert.equal(co.displacementSize, 4);
    * assert.ok(co.hasImmediate);
    * assert.equal(co.immediateOffset, 6);
    * assert.equal(co.immediateSize, 1);
    * // It's not an instruction with two immediates (e.g. enter)
    * assert.ok(!co.hasImmediate2);
    * assert.equal(co.immediateOffset2, 0);
    * assert.equal(co.immediateSize2, 0);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * co.free();
    * ```
    * @param {Instruction} instruction
    * @returns {ConstantOffsets}
    */
    getConstantOffsets(instruction) {
        _assertClass(instruction, Instruction);
        const ret = wasm.decoder_getConstantOffsets(this.__wbg_ptr, instruction.__wbg_ptr);
        return ConstantOffsets.__wrap(ret);
    }
}
__exports.Decoder = Decoder;
/**
* x86 formatter that supports GNU Assembler, Intel XED, masm and nasm syntax
*/
class Formatter {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_formatter_free(ptr);
    }
    /**
    * Creates an x86 formatter
    *
    * # Arguments
    *
    * * `syntax`: Formatter syntax, see [`FormatterSyntax`]
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, Formatter, FormatterSyntax } = require("iced-x86");
    *
    * const bytes = new Uint8Array([0x62, 0xF2, 0x4F, 0xDD, 0x72, 0x50, 0x01]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * const instr = decoder.decode();
    *
    * const formatter = new Formatter(FormatterSyntax.Masm);
    * formatter.uppercaseMnemonics = true;
    * const disasm = formatter.format(instr);
    * assert.equal(disasm, "VCVTNE2PS2BF16 zmm2{k5}{z},zmm6,dword bcst [rax+4]");
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * formatter.free();
    * ```
    *
    * [`FormatterSyntax`]: enum.FormatterSyntax.html
    * @param {FormatterSyntax} syntax
    */
    constructor(syntax) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_new(retptr, syntax);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Formats the whole instruction: prefixes, mnemonic, operands
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * @param {Instruction} instruction
    * @returns {string}
    */
    format(instruction) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_format(retptr, this.__wbg_ptr, instruction.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats the mnemonic and any prefixes
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * @param {Instruction} instruction
    * @returns {string}
    */
    formatMnemonic(instruction) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_formatMnemonic(retptr, this.__wbg_ptr, instruction.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats the mnemonic and/or any prefixes
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * - `options`: Options, see [`FormatMnemonicOptions`]
    *
    * [`FormatMnemonicOptions`]: enum.FormatMnemonicOptions.html
    * @param {Instruction} instruction
    * @param {number} options
    * @returns {string}
    */
    formatMnemonicOptions(instruction, options) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_formatMnemonicOptions(retptr, this.__wbg_ptr, instruction.__wbg_ptr, options);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Gets the number of operands that will be formatted. A formatter can add and remove operands
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * @param {Instruction} instruction
    * @returns {number}
    */
    operandCount(instruction) {
        _assertClass(instruction, Instruction);
        const ret = wasm.formatter_operandCount(this.__wbg_ptr, instruction.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Returns the operand access ([`OpAccess`]) but only if it's an operand added by the formatter. If it's an
    * operand that is part of [`Instruction`], you should call eg. [`InstructionInfoFactory.info()`].
    *
    * # Throws
    *
    * Throws if `operand` is invalid
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * - `operand`: Operand number, 0-based. This is a formatter operand and isn't necessarily the same as an instruction operand. See [`operandCount`]
    *
    * [`OpAccess`]: enum.OpAccess.html
    * [`Instruction`]: struct.Instruction.html
    * [`InstructionInfoFactory.info()`]: struct.InstructionInfoFactory.html#method.info
    * [`operandCount`]: #method.operand_count
    * @param {Instruction} instruction
    * @param {number} operand
    * @returns {OpAccess | undefined}
    */
    opAccess(instruction, operand) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_opAccess(retptr, this.__wbg_ptr, instruction.__wbg_ptr, operand);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 === 8 ? undefined : r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Converts a formatter operand index to an instruction operand index. Returns `undefined` if it's an operand added by the formatter
    *
    * # Throws
    *
    * Throws if `operand` is invalid
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * - `operand`: Operand number, 0-based. This is a formatter operand and isn't necessarily the same as an instruction operand. See [`operandCount`]
    *
    * [`operandCount`]: #method.operand_count
    * @param {Instruction} instruction
    * @param {number} operand
    * @returns {number | undefined}
    */
    getInstructionOperand(instruction, operand) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_getInstructionOperand(retptr, this.__wbg_ptr, instruction.__wbg_ptr, operand);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            return r0 === 0 ? undefined : r1 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Converts an instruction operand index to a formatter operand index. Returns `undefined` if the instruction operand isn't used by the formatter
    *
    * # Throws
    *
    * Throws if `instructionOperand` is invalid
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * - `instructionOperand`: Instruction operand
    * @param {Instruction} instruction
    * @param {number} instructionOperand
    * @returns {number | undefined}
    */
    getFormatterOperand(instruction, instructionOperand) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_getFormatterOperand(retptr, this.__wbg_ptr, instruction.__wbg_ptr, instructionOperand);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            return r0 === 0 ? undefined : r1 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Formats an operand. This is a formatter operand and not necessarily a real instruction operand.
    * A formatter can add and remove operands.
    *
    * # Throws
    *
    * Throws if `operand` is invalid
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * - `operand`: Operand number, 0-based. This is a formatter operand and isn't necessarily the same as an instruction operand. See [`operandCount`]
    *
    * [`operandCount`]: #method.operand_count
    * @param {Instruction} instruction
    * @param {number} operand
    * @returns {string}
    */
    formatOperand(instruction, operand) {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_formatOperand(retptr, this.__wbg_ptr, instruction.__wbg_ptr, operand);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
                ptr1 = 0; len1 = 0;
                throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
    * Formats an operand separator
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * @param {Instruction} instruction
    * @returns {string}
    */
    formatOperandSeparator(instruction) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_formatOperandSeparator(retptr, this.__wbg_ptr, instruction.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats all operands
    *
    * # Arguments
    *
    * - `instruction`: Instruction
    * @param {Instruction} instruction
    * @returns {string}
    */
    formatAllOperands(instruction) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(instruction, Instruction);
            wasm.formatter_formatAllOperands(retptr, this.__wbg_ptr, instruction.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a register
    *
    * # Arguments
    *
    * - `register`: Register (a [`Register`] enum value)
    *
    * [`Register`]: enum.Register.html
    * @param {Register} register
    * @returns {string}
    */
    formatRegister(register) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatRegister(retptr, this.__wbg_ptr, register);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `i8`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {number} value
    * @returns {string}
    */
    formatI8(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatI8(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `i16`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {number} value
    * @returns {string}
    */
    formatI16(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatI16(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `i32`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {number} value
    * @returns {string}
    */
    formatI32(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatI32(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `i64`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {bigint} value
    * @returns {string}
    */
    formatI64(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatI64(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `u8`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {number} value
    * @returns {string}
    */
    formatU8(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatU8(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `u16`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {number} value
    * @returns {string}
    */
    formatU16(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatU16(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `u32`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {number} value
    * @returns {string}
    */
    formatU32(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatU32(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Formats a `u64`
    *
    * # Arguments
    *
    * - `value`: Value
    * @param {bigint} value
    * @returns {string}
    */
    formatU64(value) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_formatU64(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Prefixes are uppercased
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `REP stosd`
    * 👍 | `false` | `rep stosd`
    * @returns {boolean}
    */
    get uppercasePrefixes() {
        const ret = wasm.formatter_uppercasePrefixes(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Prefixes are uppercased
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `REP stosd`
    * 👍 | `false` | `rep stosd`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set uppercasePrefixes(value) {
        wasm.formatter_set_uppercasePrefixes(this.__wbg_ptr, value);
    }
    /**
    * Mnemonics are uppercased
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `MOV rcx,rax`
    * 👍 | `false` | `mov rcx,rax`
    * @returns {boolean}
    */
    get uppercaseMnemonics() {
        const ret = wasm.formatter_uppercaseMnemonics(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Mnemonics are uppercased
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `MOV rcx,rax`
    * 👍 | `false` | `mov rcx,rax`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set uppercaseMnemonics(value) {
        wasm.formatter_set_uppercaseMnemonics(this.__wbg_ptr, value);
    }
    /**
    * Registers are uppercased
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov RCX,[RAX+RDX*8]`
    * 👍 | `false` | `mov rcx,[rax+rdx*8]`
    * @returns {boolean}
    */
    get uppercaseRegisters() {
        const ret = wasm.formatter_uppercaseRegisters(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Registers are uppercased
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov RCX,[RAX+RDX*8]`
    * 👍 | `false` | `mov rcx,[rax+rdx*8]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set uppercaseRegisters(value) {
        wasm.formatter_set_uppercaseRegisters(this.__wbg_ptr, value);
    }
    /**
    * Keywords are uppercased (eg. `BYTE PTR`, `SHORT`)
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov BYTE PTR [rcx],12h`
    * 👍 | `false` | `mov byte ptr [rcx],12h`
    * @returns {boolean}
    */
    get uppercaseKeywords() {
        const ret = wasm.formatter_uppercaseKeywords(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Keywords are uppercased (eg. `BYTE PTR`, `SHORT`)
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov BYTE PTR [rcx],12h`
    * 👍 | `false` | `mov byte ptr [rcx],12h`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set uppercaseKeywords(value) {
        wasm.formatter_set_uppercaseKeywords(this.__wbg_ptr, value);
    }
    /**
    * Uppercase decorators, eg. `{z}`, `{sae}`, `{rd-sae}` (but not opmask registers: `{k1}`)
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `vunpcklps xmm2{k5}{Z},xmm6,dword bcst [rax+4]`
    * 👍 | `false` | `vunpcklps xmm2{k5}{z},xmm6,dword bcst [rax+4]`
    * @returns {boolean}
    */
    get uppercaseDecorators() {
        const ret = wasm.formatter_uppercaseDecorators(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Uppercase decorators, eg. `{z}`, `{sae}`, `{rd-sae}` (but not opmask registers: `{k1}`)
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `vunpcklps xmm2{k5}{Z},xmm6,dword bcst [rax+4]`
    * 👍 | `false` | `vunpcklps xmm2{k5}{z},xmm6,dword bcst [rax+4]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set uppercaseDecorators(value) {
        wasm.formatter_set_uppercaseDecorators(this.__wbg_ptr, value);
    }
    /**
    * Everything is uppercased, except numbers and their prefixes/suffixes
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `MOV EAX,GS:[RCX*4+0ffh]`
    * 👍 | `false` | `mov eax,gs:[rcx*4+0ffh]`
    * @returns {boolean}
    */
    get uppercaseAll() {
        const ret = wasm.formatter_uppercaseAll(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Everything is uppercased, except numbers and their prefixes/suffixes
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `MOV EAX,GS:[RCX*4+0ffh]`
    * 👍 | `false` | `mov eax,gs:[rcx*4+0ffh]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set uppercaseAll(value) {
        wasm.formatter_set_uppercaseAll(this.__wbg_ptr, value);
    }
    /**
    * Character index (0-based) where the first operand is formatted. Can be set to 0 to format it immediately after the mnemonic.
    * At least one space or tab is always added between the mnemonic and the first operand.
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `0` | `mov•rcx,rbp`
    * _ | `8` | `mov•••••rcx,rbp`
    * @returns {number}
    */
    get firstOperandCharIndex() {
        const ret = wasm.formatter_firstOperandCharIndex(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Character index (0-based) where the first operand is formatted. Can be set to 0 to format it immediately after the mnemonic.
    * At least one space or tab is always added between the mnemonic and the first operand.
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `0` | `mov•rcx,rbp`
    * _ | `8` | `mov•••••rcx,rbp`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {number} value
    */
    set firstOperandCharIndex(value) {
        wasm.formatter_set_firstOperandCharIndex(this.__wbg_ptr, value);
    }
    /**
    * Size of a tab character or 0 to use spaces
    *
    * - Default: `0`
    * @returns {number}
    */
    get tabSize() {
        const ret = wasm.formatter_tabSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size of a tab character or 0 to use spaces
    *
    * - Default: `0`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {number} value
    */
    set tabSize(value) {
        wasm.formatter_set_tabSize(this.__wbg_ptr, value);
    }
    /**
    * Add a space after the operand separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov rax, rcx`
    * 👍 | `false` | `mov rax,rcx`
    * @returns {boolean}
    */
    get spaceAfterOperandSeparator() {
        const ret = wasm.formatter_spaceAfterOperandSeparator(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add a space after the operand separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov rax, rcx`
    * 👍 | `false` | `mov rax,rcx`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set spaceAfterOperandSeparator(value) {
        wasm.formatter_set_spaceAfterOperandSeparator(this.__wbg_ptr, value);
    }
    /**
    * Add a space between the memory expression and the brackets
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[ rcx+rdx ]`
    * 👍 | `false` | `mov eax,[rcx+rdx]`
    * @returns {boolean}
    */
    get spaceAfterMemoryBracket() {
        const ret = wasm.formatter_spaceAfterMemoryBracket(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add a space between the memory expression and the brackets
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[ rcx+rdx ]`
    * 👍 | `false` | `mov eax,[rcx+rdx]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set spaceAfterMemoryBracket(value) {
        wasm.formatter_set_spaceAfterMemoryBracket(this.__wbg_ptr, value);
    }
    /**
    * Add spaces between memory operand `+` and `-` operators
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rcx + rdx*8 - 80h]`
    * 👍 | `false` | `mov eax,[rcx+rdx*8-80h]`
    * @returns {boolean}
    */
    get spaceBetweenMemoryAddOperators() {
        const ret = wasm.formatter_spaceBetweenMemoryAddOperators(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add spaces between memory operand `+` and `-` operators
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rcx + rdx*8 - 80h]`
    * 👍 | `false` | `mov eax,[rcx+rdx*8-80h]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set spaceBetweenMemoryAddOperators(value) {
        wasm.formatter_set_spaceBetweenMemoryAddOperators(this.__wbg_ptr, value);
    }
    /**
    * Add spaces between memory operand `*` operator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rcx+rdx * 8-80h]`
    * 👍 | `false` | `mov eax,[rcx+rdx*8-80h]`
    * @returns {boolean}
    */
    get spaceBetweenMemoryMulOperators() {
        const ret = wasm.formatter_spaceBetweenMemoryMulOperators(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add spaces between memory operand `*` operator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rcx+rdx * 8-80h]`
    * 👍 | `false` | `mov eax,[rcx+rdx*8-80h]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set spaceBetweenMemoryMulOperators(value) {
        wasm.formatter_set_spaceBetweenMemoryMulOperators(this.__wbg_ptr, value);
    }
    /**
    * Show memory operand scale value before the index register
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[8*rdx]`
    * 👍 | `false` | `mov eax,[rdx*8]`
    * @returns {boolean}
    */
    get scaleBeforeIndex() {
        const ret = wasm.formatter_scaleBeforeIndex(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Show memory operand scale value before the index register
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[8*rdx]`
    * 👍 | `false` | `mov eax,[rdx*8]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set scaleBeforeIndex(value) {
        wasm.formatter_set_scaleBeforeIndex(this.__wbg_ptr, value);
    }
    /**
    * Always show the scale value even if it's `*1`
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rbx+rcx*1]`
    * 👍 | `false` | `mov eax,[rbx+rcx]`
    * @returns {boolean}
    */
    get alwaysShowScale() {
        const ret = wasm.formatter_alwaysShowScale(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Always show the scale value even if it's `*1`
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rbx+rcx*1]`
    * 👍 | `false` | `mov eax,[rbx+rcx]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set alwaysShowScale(value) {
        wasm.formatter_set_alwaysShowScale(this.__wbg_ptr, value);
    }
    /**
    * Always show the effective segment register. If the option is `false`, only show the segment register if
    * there's a segment override prefix.
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,ds:[ecx]`
    * 👍 | `false` | `mov eax,[ecx]`
    * @returns {boolean}
    */
    get alwaysShowSegmentRegister() {
        const ret = wasm.formatter_alwaysShowSegmentRegister(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Always show the effective segment register. If the option is `false`, only show the segment register if
    * there's a segment override prefix.
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,ds:[ecx]`
    * 👍 | `false` | `mov eax,[ecx]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set alwaysShowSegmentRegister(value) {
        wasm.formatter_set_alwaysShowSegmentRegister(this.__wbg_ptr, value);
    }
    /**
    * Show zero displacements
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rcx*2+0]`
    * 👍 | `false` | `mov eax,[rcx*2]`
    * @returns {boolean}
    */
    get showZeroDisplacements() {
        const ret = wasm.formatter_showZeroDisplacements(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Show zero displacements
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rcx*2+0]`
    * 👍 | `false` | `mov eax,[rcx*2]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set showZeroDisplacements(value) {
        wasm.formatter_set_showZeroDisplacements(this.__wbg_ptr, value);
    }
    /**
    * Hex number prefix or an empty string, eg. `"0x"`
    *
    * - Default: `""` (masm/nasm/intel), `"0x"` (gas)
    * @returns {string}
    */
    get hexPrefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_hexPrefix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Hex number prefix or an empty string, eg. `"0x"`
    *
    * - Default: `""` (masm/nasm/intel), `"0x"` (gas)
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set hexPrefix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_hexPrefix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Hex number suffix or an empty string, eg. `"h"`
    *
    * - Default: `"h"` (masm/nasm/intel), `""` (gas)
    * @returns {string}
    */
    get hexSuffix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_hexSuffix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Hex number suffix or an empty string, eg. `"h"`
    *
    * - Default: `"h"` (masm/nasm/intel), `""` (gas)
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set hexSuffix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_hexSuffix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `0x12345678`
    * 👍 | `4` | `0x1234_5678`
    * @returns {number}
    */
    get hexDigitGroupSize() {
        const ret = wasm.formatter_hexDigitGroupSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `0x12345678`
    * 👍 | `4` | `0x1234_5678`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {number} value
    */
    set hexDigitGroupSize(value) {
        wasm.formatter_set_hexDigitGroupSize(this.__wbg_ptr, value);
    }
    /**
    * Decimal number prefix or an empty string
    *
    * - Default: `""`
    * @returns {string}
    */
    get decimalPrefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_decimalPrefix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Decimal number prefix or an empty string
    *
    * - Default: `""`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set decimalPrefix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_decimalPrefix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Decimal number suffix or an empty string
    *
    * - Default: `""`
    * @returns {string}
    */
    get decimalSuffix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_decimalSuffix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Decimal number suffix or an empty string
    *
    * - Default: `""`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set decimalSuffix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_decimalSuffix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `12345678`
    * 👍 | `3` | `12_345_678`
    * @returns {number}
    */
    get decimalDigitGroupSize() {
        const ret = wasm.formatter_decimalDigitGroupSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `12345678`
    * 👍 | `3` | `12_345_678`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {number} value
    */
    set decimalDigitGroupSize(value) {
        wasm.formatter_set_decimalDigitGroupSize(this.__wbg_ptr, value);
    }
    /**
    * Octal number prefix or an empty string
    *
    * - Default: `""` (masm/nasm/intel), `"0"` (gas)
    * @returns {string}
    */
    get octalPrefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_octalPrefix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Octal number prefix or an empty string
    *
    * - Default: `""` (masm/nasm/intel), `"0"` (gas)
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set octalPrefix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_octalPrefix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Octal number suffix or an empty string
    *
    * - Default: `"o"` (masm/nasm/intel), `""` (gas)
    * @returns {string}
    */
    get octalSuffix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_octalSuffix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Octal number suffix or an empty string
    *
    * - Default: `"o"` (masm/nasm/intel), `""` (gas)
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set octalSuffix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_octalSuffix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `12345670`
    * 👍 | `4` | `1234_5670`
    * @returns {number}
    */
    get octalDigitGroupSize() {
        const ret = wasm.formatter_octalDigitGroupSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `12345670`
    * 👍 | `4` | `1234_5670`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {number} value
    */
    set octalDigitGroupSize(value) {
        wasm.formatter_set_octalDigitGroupSize(this.__wbg_ptr, value);
    }
    /**
    * Binary number prefix or an empty string
    *
    * - Default: `""` (masm/nasm/intel), `"0b"` (gas)
    * @returns {string}
    */
    get binaryPrefix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_binaryPrefix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Binary number prefix or an empty string
    *
    * - Default: `""` (masm/nasm/intel), `"0b"` (gas)
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set binaryPrefix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_binaryPrefix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Binary number suffix or an empty string
    *
    * - Default: `"b"` (masm/nasm/intel), `""` (gas)
    * @returns {string}
    */
    get binarySuffix() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_binarySuffix(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Binary number suffix or an empty string
    *
    * - Default: `"b"` (masm/nasm/intel), `""` (gas)
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set binarySuffix(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_binarySuffix(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `11010111`
    * 👍 | `4` | `1101_0111`
    * @returns {number}
    */
    get binaryDigitGroupSize() {
        const ret = wasm.formatter_binaryDigitGroupSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Size of a digit group, see also [`digitSeparator`]
    *
    * [`digitSeparator`]: #method.digit_separator
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `0` | `11010111`
    * 👍 | `4` | `1101_0111`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {number} value
    */
    set binaryDigitGroupSize(value) {
        wasm.formatter_set_binaryDigitGroupSize(this.__wbg_ptr, value);
    }
    /**
    * Digit separator or an empty string. See also eg. [`hexDigitGroupSize`]
    *
    * [`hexDigitGroupSize`]: #method.hex_digit_group_size
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `""` | `0x12345678`
    * _ | `"_"` | `0x1234_5678`
    * @returns {string}
    */
    get digitSeparator() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_digitSeparator(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * Digit separator or an empty string. See also eg. [`hexDigitGroupSize`]
    *
    * [`hexDigitGroupSize`]: #method.hex_digit_group_size
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `""` | `0x12345678`
    * _ | `"_"` | `0x1234_5678`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {string} value
    */
    set digitSeparator(value) {
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.formatter_set_digitSeparator(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * Add leading zeros to hexadecimal/octal/binary numbers.
    * This option has no effect on branch targets and displacements, use [`branchLeadingZeros`]
    * and [`displacementLeadingZeros`].
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `0x0000000A`/`0000000Ah`
    * 👍 | `false` | `0xA`/`0Ah`
    *
    * [`branchLeadingZeros`]: #method.branch_leading_zeros
    * [`displacementLeadingZeros`]: #method.displacement_leading_zeros
    * @returns {boolean}
    */
    get leadingZeros() {
        const ret = wasm.formatter_leadingZeros(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add leading zeros to hexadecimal/octal/binary numbers.
    * This option has no effect on branch targets and displacements, use [`branchLeadingZeros`]
    * and [`displacementLeadingZeros`].
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `0x0000000A`/`0000000Ah`
    * 👍 | `false` | `0xA`/`0Ah`
    *
    * [`branchLeadingZeros`]: #method.branch_leading_zeros
    * [`displacementLeadingZeros`]: #method.displacement_leading_zeros
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set leadingZeros(value) {
        wasm.formatter_set_leadingZeros(this.__wbg_ptr, value);
    }
    /**
    * Use uppercase hex digits
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `0xFF`
    * _ | `false` | `0xff`
    * @returns {boolean}
    */
    get uppercaseHex() {
        const ret = wasm.formatter_uppercaseHex(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Use uppercase hex digits
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `0xFF`
    * _ | `false` | `0xff`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set uppercaseHex(value) {
        wasm.formatter_set_uppercaseHex(this.__wbg_ptr, value);
    }
    /**
    * Small hex numbers (-9 .. 9) are shown in decimal
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `9`
    * _ | `false` | `0x9`
    * @returns {boolean}
    */
    get smallHexNumbersInDecimal() {
        const ret = wasm.formatter_smallHexNumbersInDecimal(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Small hex numbers (-9 .. 9) are shown in decimal
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `9`
    * _ | `false` | `0x9`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set smallHexNumbersInDecimal(value) {
        wasm.formatter_set_smallHexNumbersInDecimal(this.__wbg_ptr, value);
    }
    /**
    * Add a leading zero to hex numbers if there's no prefix and the number starts with hex digits `A-F`
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `0FFh`
    * _ | `false` | `FFh`
    * @returns {boolean}
    */
    get addLeadingZeroToHexNumbers() {
        const ret = wasm.formatter_addLeadingZeroToHexNumbers(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add a leading zero to hex numbers if there's no prefix and the number starts with hex digits `A-F`
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `0FFh`
    * _ | `false` | `FFh`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set addLeadingZeroToHexNumbers(value) {
        wasm.formatter_set_addLeadingZeroToHexNumbers(this.__wbg_ptr, value);
    }
    /**
    * Number base (`2`, `8`, `10`, `16`)
    *
    * - Default: `16`
    * @returns {number}
    */
    get numberBase() {
        const ret = wasm.formatter_numberBase(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Number base (`2`, `8`, `10`, `16`)
    *
    * - Default: `16`
    *
    * # Throws
    *
    * Throws if `value` is not `2`, `8`, `10`, `16`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {number} value
    */
    set numberBase(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.formatter_set_numberBase(retptr, this.__wbg_ptr, value);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Add leading zeros to branch offsets. Used by `CALL NEAR`, `CALL FAR`, `JMP NEAR`, `JMP FAR`, `Jcc`, `LOOP`, `LOOPcc`, `XBEGIN`
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `je 00000123h`
    * _ | `false` | `je 123h`
    * @returns {boolean}
    */
    get branchLeadingZeros() {
        const ret = wasm.formatter_branchLeadingZeros(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add leading zeros to branch offsets. Used by `CALL NEAR`, `CALL FAR`, `JMP NEAR`, `JMP FAR`, `Jcc`, `LOOP`, `LOOPcc`, `XBEGIN`
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `je 00000123h`
    * _ | `false` | `je 123h`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set branchLeadingZeros(value) {
        wasm.formatter_set_branchLeadingZeros(this.__wbg_ptr, value);
    }
    /**
    * Show immediate operands as signed numbers
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,-1`
    * 👍 | `false` | `mov eax,FFFFFFFF`
    * @returns {boolean}
    */
    get signedImmediateOperands() {
        const ret = wasm.formatter_signedImmediateOperands(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Show immediate operands as signed numbers
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,-1`
    * 👍 | `false` | `mov eax,FFFFFFFF`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set signedImmediateOperands(value) {
        wasm.formatter_set_signedImmediateOperands(this.__wbg_ptr, value);
    }
    /**
    * Displacements are signed numbers
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `mov al,[eax-2000h]`
    * _ | `false` | `mov al,[eax+0FFFFE000h]`
    * @returns {boolean}
    */
    get signedMemoryDisplacements() {
        const ret = wasm.formatter_signedMemoryDisplacements(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Displacements are signed numbers
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `mov al,[eax-2000h]`
    * _ | `false` | `mov al,[eax+0FFFFE000h]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set signedMemoryDisplacements(value) {
        wasm.formatter_set_signedMemoryDisplacements(this.__wbg_ptr, value);
    }
    /**
    * Add leading zeros to displacements
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov al,[eax+00000012h]`
    * 👍 | `false` | `mov al,[eax+12h]`
    * @returns {boolean}
    */
    get displacementLeadingZeros() {
        const ret = wasm.formatter_displacementLeadingZeros(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Add leading zeros to displacements
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov al,[eax+00000012h]`
    * 👍 | `false` | `mov al,[eax+12h]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set displacementLeadingZeros(value) {
        wasm.formatter_set_displacementLeadingZeros(this.__wbg_ptr, value);
    }
    /**
    * Options (a [`MemorySizeOptions`] flags value) that control if the memory size (eg. `DWORD PTR`) is shown or not.
    * This is ignored by the gas (AT&T) formatter.
    *
    * - Default: [`Default`]
    *
    * [`MemorySizeOptions`]: enum.MemorySizeOptions.html
    * [`Default`]: enum.MemorySizeOptions.html#variant.Default
    * @returns {MemorySizeOptions}
    */
    get memorySizeOptions() {
        const ret = wasm.formatter_memorySizeOptions(this.__wbg_ptr);
        return ret;
    }
    /**
    * Options (a [`MemorySizeOptions`] flags value) that control if the memory size (eg. `DWORD PTR`) is shown or not.
    * This is ignored by the gas (AT&T) formatter.
    *
    * - Default: [`Default`]
    *
    * [`MemorySizeOptions`]: enum.MemorySizeOptions.html
    * [`Default`]: enum.MemorySizeOptions.html#variant.Default
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {MemorySizeOptions} value
    */
    set memorySizeOptions(value) {
        wasm.formatter_set_memorySizeOptions(this.__wbg_ptr, value);
    }
    /**
    * Show `RIP+displ` or the virtual address
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rip+12345678h]`
    * 👍 | `false` | `mov eax,[1029384756AFBECDh]`
    * @returns {boolean}
    */
    get ripRelativeAddresses() {
        const ret = wasm.formatter_ripRelativeAddresses(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Show `RIP+displ` or the virtual address
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[rip+12345678h]`
    * 👍 | `false` | `mov eax,[1029384756AFBECDh]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set ripRelativeAddresses(value) {
        wasm.formatter_set_ripRelativeAddresses(this.__wbg_ptr, value);
    }
    /**
    * Show `NEAR`, `SHORT`, etc if it's a branch instruction
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `je short 1234h`
    * _ | `false` | `je 1234h`
    * @returns {boolean}
    */
    get showBranchSize() {
        const ret = wasm.formatter_showBranchSize(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Show `NEAR`, `SHORT`, etc if it's a branch instruction
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `je short 1234h`
    * _ | `false` | `je 1234h`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set showBranchSize(value) {
        wasm.formatter_set_showBranchSize(this.__wbg_ptr, value);
    }
    /**
    * Use pseudo instructions
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `vcmpnltsd xmm2,xmm6,xmm3`
    * _ | `false` | `vcmpsd xmm2,xmm6,xmm3,5`
    * @returns {boolean}
    */
    get usePseudoOps() {
        const ret = wasm.formatter_usePseudoOps(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Use pseudo instructions
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `vcmpnltsd xmm2,xmm6,xmm3`
    * _ | `false` | `vcmpsd xmm2,xmm6,xmm3,5`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set usePseudoOps(value) {
        wasm.formatter_set_usePseudoOps(this.__wbg_ptr, value);
    }
    /**
    * Show the original value after the symbol name
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[myfield (12345678)]`
    * 👍 | `false` | `mov eax,[myfield]`
    * @returns {boolean}
    */
    get showSymbolAddress() {
        const ret = wasm.formatter_showSymbolAddress(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Show the original value after the symbol name
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,[myfield (12345678)]`
    * 👍 | `false` | `mov eax,[myfield]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set showSymbolAddress(value) {
        wasm.formatter_set_showSymbolAddress(this.__wbg_ptr, value);
    }
    /**
    * (gas only): If `true`, the formatter doesn't add `%` to registers
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,ecx`
    * 👍 | `false` | `mov %eax,%ecx`
    * @returns {boolean}
    */
    get gasNakedRegisters() {
        const ret = wasm.formatter_gasNakedRegisters(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * (gas only): If `true`, the formatter doesn't add `%` to registers
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `mov eax,ecx`
    * 👍 | `false` | `mov %eax,%ecx`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set gasNakedRegisters(value) {
        wasm.formatter_set_gasNakedRegisters(this.__wbg_ptr, value);
    }
    /**
    * (gas only): Shows the mnemonic size suffix even when not needed
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `movl %eax,%ecx`
    * 👍 | `false` | `mov %eax,%ecx`
    * @returns {boolean}
    */
    get gasShowMnemonicSizeSuffix() {
        const ret = wasm.formatter_gasShowMnemonicSizeSuffix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * (gas only): Shows the mnemonic size suffix even when not needed
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `movl %eax,%ecx`
    * 👍 | `false` | `mov %eax,%ecx`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set gasShowMnemonicSizeSuffix(value) {
        wasm.formatter_set_gasShowMnemonicSizeSuffix(this.__wbg_ptr, value);
    }
    /**
    * (gas only): Add a space after the comma if it's a memory operand
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `(%eax, %ecx, 2)`
    * 👍 | `false` | `(%eax,%ecx,2)`
    * @returns {boolean}
    */
    get gasSpaceAfterMemoryOperandComma() {
        const ret = wasm.formatter_gasSpaceAfterMemoryOperandComma(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * (gas only): Add a space after the comma if it's a memory operand
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `(%eax, %ecx, 2)`
    * 👍 | `false` | `(%eax,%ecx,2)`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set gasSpaceAfterMemoryOperandComma(value) {
        wasm.formatter_set_gasSpaceAfterMemoryOperandComma(this.__wbg_ptr, value);
    }
    /**
    * (masm only): Add a `DS` segment override even if it's not present. Used if it's 16/32-bit code and mem op is a displ
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `mov eax,ds:[12345678]`
    * _ | `false` | `mov eax,[12345678]`
    * @returns {boolean}
    */
    get masmAddDsPrefix32() {
        const ret = wasm.formatter_masmAddDsPrefix32(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * (masm only): Add a `DS` segment override even if it's not present. Used if it's 16/32-bit code and mem op is a displ
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `mov eax,ds:[12345678]`
    * _ | `false` | `mov eax,[12345678]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set masmAddDsPrefix32(value) {
        wasm.formatter_set_masmAddDsPrefix32(this.__wbg_ptr, value);
    }
    /**
    * (masm only): Show symbols in brackets
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `[ecx+symbol]` / `[symbol]`
    * _ | `false` | `symbol[ecx]` / `symbol`
    * @returns {boolean}
    */
    get masmSymbolDisplInBrackets() {
        const ret = wasm.formatter_masmSymbolDisplInBrackets(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * (masm only): Show symbols in brackets
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `[ecx+symbol]` / `[symbol]`
    * _ | `false` | `symbol[ecx]` / `symbol`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set masmSymbolDisplInBrackets(value) {
        wasm.formatter_set_masmSymbolDisplInBrackets(this.__wbg_ptr, value);
    }
    /**
    * (masm only): Show displacements in brackets
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `[ecx+1234h]`
    * _ | `false` | `1234h[ecx]`
    * @returns {boolean}
    */
    get masmDisplInBrackets() {
        const ret = wasm.formatter_masmDisplInBrackets(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * (masm only): Show displacements in brackets
    *
    * Default | Value | Example
    * --------|-------|--------
    * 👍 | `true` | `[ecx+1234h]`
    * _ | `false` | `1234h[ecx]`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set masmDisplInBrackets(value) {
        wasm.formatter_set_masmDisplInBrackets(this.__wbg_ptr, value);
    }
    /**
    * (nasm only): Shows `BYTE`, `WORD`, `DWORD` or `QWORD` if it's a sign extended immediate operand value
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `or rcx,byte -1`
    * 👍 | `false` | `or rcx,-1`
    * @returns {boolean}
    */
    get nasmShowSignExtendedImmediateSize() {
        const ret = wasm.formatter_nasmShowSignExtendedImmediateSize(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * (nasm only): Shows `BYTE`, `WORD`, `DWORD` or `QWORD` if it's a sign extended immediate operand value
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `or rcx,byte -1`
    * 👍 | `false` | `or rcx,-1`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set nasmShowSignExtendedImmediateSize(value) {
        wasm.formatter_set_nasmShowSignExtendedImmediateSize(this.__wbg_ptr, value);
    }
    /**
    * Use `st(0)` instead of `st` if `st` can be used. Ignored by the nasm formatter.
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `fadd st(0),st(3)`
    * 👍 | `false` | `fadd st,st(3)`
    * @returns {boolean}
    */
    get preferSt0() {
        const ret = wasm.formatter_preferSt0(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Use `st(0)` instead of `st` if `st` can be used. Ignored by the nasm formatter.
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `fadd st(0),st(3)`
    * 👍 | `false` | `fadd st,st(3)`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set preferSt0(value) {
        wasm.formatter_set_preferSt0(this.__wbg_ptr, value);
    }
    /**
    * Show useless prefixes. If it has useless prefixes, it could be data and not code.
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `es rep add eax,ecx`
    * 👍 | `false` | `add eax,ecx`
    * @returns {boolean}
    */
    get showUselessPrefixes() {
        const ret = wasm.formatter_showUselessPrefixes(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Show useless prefixes. If it has useless prefixes, it could be data and not code.
    *
    * Default | Value | Example
    * --------|-------|--------
    * _ | `true` | `es rep add eax,ecx`
    * 👍 | `false` | `add eax,ecx`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {boolean} value
    */
    set showUselessPrefixes(value) {
        wasm.formatter_set_showUselessPrefixes(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JB` / `JC` / `JNAE`)
    *
    * The value is a [`CC_b`] enum value.
    *
    * [`CC_b`]: enum.CC_b.html
    *
    * Default: `JB`, `CMOVB`, `SETB`
    * @returns {CC_b}
    */
    get cc_b() {
        const ret = wasm.formatter_cc_b(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JB` / `JC` / `JNAE`)
    *
    * The value is a [`CC_b`] enum value.
    *
    * [`CC_b`]: enum.CC_b.html
    *
    * Default: `JB`, `CMOVB`, `SETB`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_b} value
    */
    set cc_b(value) {
        wasm.formatter_set_cc_b(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JAE` / `JNB` / `JNC`)
    *
    * The value is a [`CC_ae`] enum value.
    *
    * [`CC_ae`]: enum.CC_ae.html
    *
    * Default: `JAE`, `CMOVAE`, `SETAE`
    * @returns {CC_ae}
    */
    get cc_ae() {
        const ret = wasm.formatter_cc_ae(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JAE` / `JNB` / `JNC`)
    *
    * The value is a [`CC_ae`] enum value.
    *
    * [`CC_ae`]: enum.CC_ae.html
    *
    * Default: `JAE`, `CMOVAE`, `SETAE`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_ae} value
    */
    set cc_ae(value) {
        wasm.formatter_set_cc_ae(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JE` / `JZ`)
    *
    * The value is a [`CC_e`] enum value.
    *
    * [`CC_e`]: enum.CC_e.html
    *
    * Default: `JE`, `CMOVE`, `SETE`, `LOOPE`, `REPE`
    * @returns {CC_e}
    */
    get cc_e() {
        const ret = wasm.formatter_cc_e(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JE` / `JZ`)
    *
    * The value is a [`CC_e`] enum value.
    *
    * [`CC_e`]: enum.CC_e.html
    *
    * Default: `JE`, `CMOVE`, `SETE`, `LOOPE`, `REPE`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_e} value
    */
    set cc_e(value) {
        wasm.formatter_set_cc_e(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JNE` / `JNZ`)
    *
    * The value is a [`CC_ne`] enum value.
    *
    * [`CC_ne`]: enum.CC_ne.html
    *
    * Default: `JNE`, `CMOVNE`, `SETNE`, `LOOPNE`, `REPNE`
    * @returns {CC_ne}
    */
    get cc_ne() {
        const ret = wasm.formatter_cc_ne(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JNE` / `JNZ`)
    *
    * The value is a [`CC_ne`] enum value.
    *
    * [`CC_ne`]: enum.CC_ne.html
    *
    * Default: `JNE`, `CMOVNE`, `SETNE`, `LOOPNE`, `REPNE`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_ne} value
    */
    set cc_ne(value) {
        wasm.formatter_set_cc_ne(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JBE` / `JNA`)
    *
    * The value is a [`CC_be`] enum value.
    *
    * [`CC_be`]: enum.CC_be.html
    *
    * Default: `JBE`, `CMOVBE`, `SETBE`
    * @returns {CC_be}
    */
    get cc_be() {
        const ret = wasm.formatter_cc_be(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JBE` / `JNA`)
    *
    * The value is a [`CC_be`] enum value.
    *
    * [`CC_be`]: enum.CC_be.html
    *
    * Default: `JBE`, `CMOVBE`, `SETBE`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_be} value
    */
    set cc_be(value) {
        wasm.formatter_set_cc_be(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JA` / `JNBE`)
    *
    * The value is a [`CC_a`] enum value.
    *
    * [`CC_a`]: enum.CC_a.html
    *
    * Default: `JA`, `CMOVA`, `SETA`
    * @returns {CC_a}
    */
    get cc_a() {
        const ret = wasm.formatter_cc_a(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JA` / `JNBE`)
    *
    * The value is a [`CC_a`] enum value.
    *
    * [`CC_a`]: enum.CC_a.html
    *
    * Default: `JA`, `CMOVA`, `SETA`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_a} value
    */
    set cc_a(value) {
        wasm.formatter_set_cc_a(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JP` / `JPE`)
    *
    * The value is a [`CC_p`] enum value.
    *
    * [`CC_p`]: enum.CC_p.html
    *
    * Default: `JP`, `CMOVP`, `SETP`
    * @returns {CC_p}
    */
    get cc_p() {
        const ret = wasm.formatter_cc_p(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JP` / `JPE`)
    *
    * The value is a [`CC_p`] enum value.
    *
    * [`CC_p`]: enum.CC_p.html
    *
    * Default: `JP`, `CMOVP`, `SETP`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_p} value
    */
    set cc_p(value) {
        wasm.formatter_set_cc_p(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JNP` / `JPO`)
    *
    * The value is a [`CC_np`] enum value.
    *
    * [`CC_np`]: enum.CC_np.html
    *
    * Default: `JNP`, `CMOVNP`, `SETNP`
    * @returns {CC_np}
    */
    get cc_np() {
        const ret = wasm.formatter_cc_np(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JNP` / `JPO`)
    *
    * The value is a [`CC_np`] enum value.
    *
    * [`CC_np`]: enum.CC_np.html
    *
    * Default: `JNP`, `CMOVNP`, `SETNP`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_np} value
    */
    set cc_np(value) {
        wasm.formatter_set_cc_np(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JL` / `JNGE`)
    *
    * The value is a [`CC_l`] enum value.
    *
    * [`CC_l`]: enum.CC_l.html
    *
    * Default: `JL`, `CMOVL`, `SETL`
    * @returns {CC_l}
    */
    get cc_l() {
        const ret = wasm.formatter_cc_l(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JL` / `JNGE`)
    *
    * The value is a [`CC_l`] enum value.
    *
    * [`CC_l`]: enum.CC_l.html
    *
    * Default: `JL`, `CMOVL`, `SETL`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_l} value
    */
    set cc_l(value) {
        wasm.formatter_set_cc_l(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JGE` / `JNL`)
    *
    * The value is a [`CC_ge`] enum value.
    *
    * [`CC_ge`]: enum.CC_ge.html
    *
    * Default: `JGE`, `CMOVGE`, `SETGE`
    * @returns {CC_ge}
    */
    get cc_ge() {
        const ret = wasm.formatter_cc_ge(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JGE` / `JNL`)
    *
    * The value is a [`CC_ge`] enum value.
    *
    * [`CC_ge`]: enum.CC_ge.html
    *
    * Default: `JGE`, `CMOVGE`, `SETGE`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_ge} value
    */
    set cc_ge(value) {
        wasm.formatter_set_cc_ge(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JLE` / `JNG`)
    *
    * The value is a [`CC_le`] enum value.
    *
    * [`CC_le`]: enum.CC_le.html
    *
    * Default: `JLE`, `CMOVLE`, `SETLE`
    * @returns {CC_le}
    */
    get cc_le() {
        const ret = wasm.formatter_cc_le(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JLE` / `JNG`)
    *
    * The value is a [`CC_le`] enum value.
    *
    * [`CC_le`]: enum.CC_le.html
    *
    * Default: `JLE`, `CMOVLE`, `SETLE`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_le} value
    */
    set cc_le(value) {
        wasm.formatter_set_cc_le(this.__wbg_ptr, value);
    }
    /**
    * Mnemonic condition code selector (eg. `JG` / `JNLE`)
    *
    * The value is a [`CC_g`] enum value.
    *
    * [`CC_g`]: enum.CC_g.html
    *
    * Default: `JG`, `CMOVG`, `SETG`
    * @returns {CC_g}
    */
    get cc_g() {
        const ret = wasm.formatter_cc_g(this.__wbg_ptr);
        return ret;
    }
    /**
    * Mnemonic condition code selector (eg. `JG` / `JNLE`)
    *
    * The value is a [`CC_g`] enum value.
    *
    * [`CC_g`]: enum.CC_g.html
    *
    * Default: `JG`, `CMOVG`, `SETG`
    *
    * # Arguments
    *
    * * `value`: New value
    * @param {CC_g} value
    */
    set cc_g(value) {
        wasm.formatter_set_cc_g(this.__wbg_ptr, value);
    }
}
__exports.Formatter = Formatter;
/**
* A 16/32/64-bit x86 instruction. Created by [`Decoder`] or by `Instruction.with*()` methods.
*
* [`Decoder`]: struct.Decoder.html
*/
class Instruction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Instruction.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_instruction_free(ptr);
    }
    /**
    * Creates an empty `Instruction` (all fields are cleared). See also the `create*()` constructor methods.
    */
    constructor() {
        const ret = wasm.instruction_new();
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * Gets the 64-bit IP of the instruction
    * @returns {bigint}
    */
    get ip() {
        const ret = wasm.instruction_ip(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Gets the length of the instruction, 0-15 bytes. This is just informational. If you modify the instruction
    * or create a new one, this method could return the wrong value.
    * @returns {number}
    */
    get length() {
        const ret = wasm.instruction_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Checks if two instructions are equal, comparing all bits, not ignoring anything. `equals()` ignores some fields.
    * @param {Instruction} other
    * @returns {boolean}
    */
    equalsAllBits(other) {
        _assertClass(other, Instruction);
        const ret = wasm.instruction_equalsAllBits(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets the 16-bit IP of the instruction
    * @returns {number}
    */
    get ip16() {
        const ret = wasm.instruction_ip16(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the 32-bit IP of the instruction
    * @returns {number}
    */
    get ip32() {
        const ret = wasm.instruction_ip32(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets the 16-bit IP of the next instruction
    * @returns {number}
    */
    get nextIP16() {
        const ret = wasm.instruction_nextIP16(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the 32-bit IP of the next instruction
    * @returns {number}
    */
    get nextIP32() {
        const ret = wasm.instruction_nextIP32(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets the 64-bit IP of the next instruction
    * @returns {bigint}
    */
    get nextIP() {
        const ret = wasm.instruction_nextIP(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Gets the code size (a [`CodeSize`] enum value) when the instruction was decoded. This value is informational and can
    * be used by a formatter.
    *
    * [`CodeSize`]: enum.CodeSize.html
    * @returns {CodeSize}
    */
    get codeSize() {
        const ret = wasm.instruction_codeSize(this.__wbg_ptr);
        return ret;
    }
    /**
    * Checks if it's an invalid instruction ([`code`] == [`Code.INVALID`])
    *
    * [`code`]: #method.code
    * [`Code.INVALID`]: enum.Code.html#variant.INVALID
    * @returns {boolean}
    */
    get isInvalid() {
        const ret = wasm.instruction_isInvalid(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets the instruction code (a [`Code`] enum value), see also [`mnemonic`].
    *
    * [`mnemonic`]: #method.mnemonic
    * [`Code`]: enum.Code.html
    * @returns {Code}
    */
    get code() {
        const ret = wasm.instruction_code(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the mnemonic (a [`Mnemonic`] enum value), see also [`code`]
    *
    * [`code`]: #method.code
    * [`Mnemonic`]: enum.Mnemonic.html
    * @returns {Mnemonic}
    */
    get mnemonic() {
        const ret = wasm.instruction_mnemonic(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand count. An instruction can have 0-5 operands.
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions } = require("iced-x86");
    *
    * // add [rax],ebx
    * const bytes = new Uint8Array([0x01, 0x18]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * const instr = decoder.decode();
    *
    * assert.equal(instr.opCount, 2);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get opCount() {
        const ret = wasm.instruction_opCount(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * `true` if the instruction has the `XACQUIRE` prefix (`F2`)
    * @returns {boolean}
    */
    get hasXacquirePrefix() {
        const ret = wasm.instruction_hasXacquirePrefix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if the instruction has the `XRELEASE` prefix (`F3`)
    * @returns {boolean}
    */
    get hasXreleasePrefix() {
        const ret = wasm.instruction_hasXreleasePrefix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if the instruction has the `REPE` or `REP` prefix (`F3`)
    * @returns {boolean}
    */
    get hasRepPrefix() {
        const ret = wasm.instruction_hasRepPrefix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if the instruction has the `REPE` or `REP` prefix (`F3`)
    * @returns {boolean}
    */
    get hasRepePrefix() {
        const ret = wasm.instruction_hasRepPrefix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if the instruction has the `REPNE` prefix (`F2`)
    * @returns {boolean}
    */
    get hasRepnePrefix() {
        const ret = wasm.instruction_hasRepnePrefix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if the instruction has the `LOCK` prefix (`F0`)
    * @returns {boolean}
    */
    get hasLockPrefix() {
        const ret = wasm.instruction_hasLockPrefix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets operand #0's kind (an [`OpKind`] enum value) if the operand exists (see [`opCount`] and [`opKind`])
    *
    * [`OpKind`]: enum.OpKind.html
    * [`opCount`]: #method.op_count
    * [`opKind`]: #method.op_kind
    * @returns {OpKind}
    */
    get op0Kind() {
        const ret = wasm.instruction_op0Kind(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #1's kind (an [`OpKind`] enum value) if the operand exists (see [`opCount`] and [`opKind`])
    *
    * [`OpKind`]: enum.OpKind.html
    * [`opCount`]: #method.op_count
    * [`opKind`]: #method.op_kind
    * @returns {OpKind}
    */
    get op1Kind() {
        const ret = wasm.instruction_op1Kind(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #2's kind (an [`OpKind`] enum value) if the operand exists (see [`opCount`] and [`opKind`])
    *
    * [`OpKind`]: enum.OpKind.html
    * [`opCount`]: #method.op_count
    * [`opKind`]: #method.op_kind
    * @returns {OpKind}
    */
    get op2Kind() {
        const ret = wasm.instruction_op2Kind(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #3's kind (an [`OpKind`] enum value) if the operand exists (see [`opCount`] and [`opKind`])
    *
    * [`OpKind`]: enum.OpKind.html
    * [`opCount`]: #method.op_count
    * [`opKind`]: #method.op_kind
    * @returns {OpKind}
    */
    get op3Kind() {
        const ret = wasm.instruction_op3Kind(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #4's kind (an [`OpKind`] enum value) if the operand exists (see [`opCount`] and [`opKind`])
    *
    * [`OpKind`]: enum.OpKind.html
    * [`opCount`]: #method.op_count
    * [`opKind`]: #method.op_kind
    * @returns {OpKind}
    */
    get op4Kind() {
        const ret = wasm.instruction_op4Kind(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets an operand's kind (an [`OpKind`] enum value) if it exists (see [`opCount`])
    *
    * [`OpKind`]: enum.OpKind.html
    * [`opCount`]: #method.op_count
    *
    * # Throws
    *
    * Throws if `operand` is invalid
    *
    * # Arguments
    *
    * * `operand`: Operand number, 0-4
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, OpKind, Register } = require("iced-x86");
    *
    * // add [rax],ebx
    * const bytes = new Uint8Array([0x01, 0x18]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * const instr = decoder.decode();
    *
    * assert.equal(instr.opCount, 2);
    * assert.equal(instr.opKind(0), OpKind.Memory);
    * assert.equal(instr.memoryBase, Register.RAX);
    * assert.equal(instr.memoryIndex, Register.None);
    * assert.equal(instr.opKind(1), OpKind.Register);
    * assert.equal(instr.opRegister(1), Register.EBX);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @param {number} operand
    * @returns {OpKind}
    */
    opKind(operand) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.instruction_opKind(retptr, this.__wbg_ptr, operand);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Checks if the instruction has a segment override prefix, see [`segmentPrefix`]
    *
    * [`segmentPrefix`]: #method.segment_prefix
    * @returns {boolean}
    */
    get hasSegmentPrefix() {
        const ret = wasm.instruction_hasSegmentPrefix(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets the segment override prefix (a [`Register`] enum value) or [`Register.None`] if none. See also [`memorySegment`].
    * Use this method if the operand has kind [`OpKind.Memory`],
    * [`OpKind.MemorySegSI`], [`OpKind.MemorySegESI`], [`OpKind.MemorySegRSI`]
    *
    * [`Register`]: enum.Register.html
    * [`Register.None`]: enum.Register.html#variant.None
    * [`memorySegment`]: #method.memory_segment
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * [`OpKind.MemorySegSI`]: enum.OpKind.html#variant.MemorySegSI
    * [`OpKind.MemorySegESI`]: enum.OpKind.html#variant.MemorySegESI
    * [`OpKind.MemorySegESI`]: enum.OpKind.html#variant.MemorySegESI
    * [`OpKind.MemorySegRSI`]: enum.OpKind.html#variant.MemorySegRSI
    * @returns {Register}
    */
    get segmentPrefix() {
        const ret = wasm.instruction_segmentPrefix(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the effective segment register (a [`Register`] enum value) used to reference the memory location.
    * Use this method if the operand has kind [`OpKind.Memory`],
    * [`OpKind.MemorySegSI`], [`OpKind.MemorySegESI`], [`OpKind.MemorySegRSI`]
    *
    * [`Register`]: enum.Register.html
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * [`OpKind.MemorySegSI`]: enum.OpKind.html#variant.MemorySegSI
    * [`OpKind.MemorySegESI`]: enum.OpKind.html#variant.MemorySegESI
    * [`OpKind.MemorySegRSI`]: enum.OpKind.html#variant.MemorySegRSI
    * @returns {Register}
    */
    get memorySegment() {
        const ret = wasm.instruction_memorySegment(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the size of the memory displacement in bytes. Valid values are `0`, `1` (16/32/64-bit), `2` (16-bit), `4` (32-bit), `8` (64-bit).
    * Note that the return value can be 1 and [`memoryDisplacement`] may still not fit in
    * a signed byte if it's an EVEX/MVEX encoded instruction.
    * Use this method if the operand has kind [`OpKind.Memory`]
    *
    * [`memoryDisplacement`]: #method.memory_displacement
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * @returns {number}
    */
    get memoryDisplSize() {
        const ret = wasm.instruction_memoryDisplSize(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * `true` if the data is broadcast (EVEX instructions only)
    * @returns {boolean}
    */
    get isBroadcast() {
        const ret = wasm.instruction_isBroadcast(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets the size of the memory location (a [`MemorySize`] enum value) that is referenced by the operand. See also [`isBroadcast`].
    * Use this method if the operand has kind [`OpKind.Memory`],
    * [`OpKind.MemorySegSI`], [`OpKind.MemorySegESI`], [`OpKind.MemorySegRSI`],
    * [`OpKind.MemoryESDI`], [`OpKind.MemoryESEDI`], [`OpKind.MemoryESRDI`]
    *
    * [`MemorySize`]: enum.MemorySize.html
    * [`isBroadcast`]: #method.is_broadcast
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * [`OpKind.MemorySegSI`]: enum.OpKind.html#variant.MemorySegSI
    * [`OpKind.MemorySegESI`]: enum.OpKind.html#variant.MemorySegESI
    * [`OpKind.MemorySegRSI`]: enum.OpKind.html#variant.MemorySegRSI
    * [`OpKind.MemoryESDI`]: enum.OpKind.html#variant.MemoryESDI
    * [`OpKind.MemoryESEDI`]: enum.OpKind.html#variant.MemoryESEDI
    * [`OpKind.MemoryESRDI`]: enum.OpKind.html#variant.MemoryESRDI
    * @returns {MemorySize}
    */
    get memorySize() {
        const ret = wasm.instruction_memorySize(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the index register scale value, valid values are `*1`, `*2`, `*4`, `*8`. Use this method if the operand has kind [`OpKind.Memory`]
    *
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * @returns {number}
    */
    get memoryIndexScale() {
        const ret = wasm.instruction_memoryIndexScale(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets signed 64 bits of the memory operand's displacement or the 64-bit absolute address if it's
    * an `EIP` or `RIP` relative memory operand.
    * Use this method if the operand has kind [`OpKind.Memory`]
    *
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * @returns {bigint}
    */
    get memoryDisplacement() {
        const ret = wasm.instruction_memoryDisplacement(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets unsigned 64 bits of the memory operand's displacement or the 64-bit absolute address if it's
    * an `EIP` or `RIP` relative memory operand.
    * Use this method if the operand has kind [`OpKind.Memory`]
    *
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * @returns {bigint}
    */
    get memoryDisplacementU64() {
        const ret = wasm.instruction_memoryDisplacement(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Gets an operand's immediate value
    *
    * # Throws
    *
    * Throws if `operand` is invalid or if it's not an immediate operand
    *
    * # Arguments
    *
    * * `operand`: Operand number, 0-4
    * @param {number} operand
    * @returns {bigint}
    */
    immediate(operand) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.instruction_immediate(retptr, this.__wbg_ptr, operand);
            var r0 = getBigInt64Memory0()[retptr / 8 + 0];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            if (r3) {
                throw takeObject(r2);
            }
            return BigInt.asUintN(64, r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate8`]
    *
    * [`OpKind.Immediate8`]: enum.OpKind.html#variant.Immediate8
    * @returns {number}
    */
    get immediate8() {
        const ret = wasm.instruction_immediate8(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate8_2nd`]
    *
    * [`OpKind.Immediate8_2nd`]: enum.OpKind.html#variant.Immediate8_2nd
    * @returns {number}
    */
    get immediate8_2nd() {
        const ret = wasm.instruction_immediate8_2nd(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate16`]
    *
    * [`OpKind.Immediate16`]: enum.OpKind.html#variant.Immediate16
    * @returns {number}
    */
    get immediate16() {
        const ret = wasm.instruction_farBranch16(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate32`]
    *
    * [`OpKind.Immediate32`]: enum.OpKind.html#variant.Immediate32
    * @returns {number}
    */
    get immediate32() {
        const ret = wasm.instruction_farBranch32(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate64`]
    *
    * [`OpKind.Immediate64`]: enum.OpKind.html#variant.Immediate64
    * @returns {bigint}
    */
    get immediate64() {
        const ret = wasm.instruction_immediate64(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate8to16`]
    *
    * [`OpKind.Immediate8to16`]: enum.OpKind.html#variant.Immediate8to16
    * @returns {number}
    */
    get immediate8to16() {
        const ret = wasm.instruction_immediate8to16(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate8to32`]
    *
    * [`OpKind.Immediate8to32`]: enum.OpKind.html#variant.Immediate8to32
    * @returns {number}
    */
    get immediate8to32() {
        const ret = wasm.instruction_immediate8to32(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate8to64`]
    *
    * [`OpKind.Immediate8to64`]: enum.OpKind.html#variant.Immediate8to64
    * @returns {bigint}
    */
    get immediate8to64() {
        const ret = wasm.instruction_immediate8to64(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's immediate value. Use this method if the operand has kind [`OpKind.Immediate32to64`]
    *
    * [`OpKind.Immediate32to64`]: enum.OpKind.html#variant.Immediate32to64
    * @returns {bigint}
    */
    get immediate32to64() {
        const ret = wasm.instruction_immediate32to64(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's branch target. Use this method if the operand has kind [`OpKind.NearBranch16`]
    *
    * [`OpKind.NearBranch16`]: enum.OpKind.html#variant.NearBranch16
    * @returns {number}
    */
    get nearBranch16() {
        const ret = wasm.instruction_farBranchSelector(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's branch target. Use this method if the operand has kind [`OpKind.NearBranch32`]
    *
    * [`OpKind.NearBranch32`]: enum.OpKind.html#variant.NearBranch32
    * @returns {number}
    */
    get nearBranch32() {
        const ret = wasm.instruction_nearBranch32(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets the operand's branch target. Use this method if the operand has kind [`OpKind.NearBranch64`]
    *
    * [`OpKind.NearBranch64`]: enum.OpKind.html#variant.NearBranch64
    * @returns {bigint}
    */
    get nearBranch64() {
        const ret = wasm.instruction_memoryDisplacement(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Gets the near branch target if it's a `CALL`/`JMP`/`Jcc` near branch instruction
    * (i.e., if [`op0Kind`] is [`OpKind.NearBranch16`], [`OpKind.NearBranch32`] or [`OpKind.NearBranch64`])
    *
    * [`op0Kind`]: #method.op0_kind
    * [`OpKind.NearBranch16`]: enum.OpKind.html#variant.NearBranch16
    * [`OpKind.NearBranch32`]: enum.OpKind.html#variant.NearBranch32
    * [`OpKind.NearBranch64`]: enum.OpKind.html#variant.NearBranch64
    * @returns {bigint}
    */
    get nearBranchTarget() {
        const ret = wasm.instruction_nearBranchTarget(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Gets the operand's branch target. Use this method if the operand has kind [`OpKind.FarBranch16`]
    *
    * [`OpKind.FarBranch16`]: enum.OpKind.html#variant.FarBranch16
    * @returns {number}
    */
    get farBranch16() {
        const ret = wasm.instruction_farBranch16(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's branch target. Use this method if the operand has kind [`OpKind.FarBranch32`]
    *
    * [`OpKind.FarBranch32`]: enum.OpKind.html#variant.FarBranch32
    * @returns {number}
    */
    get farBranch32() {
        const ret = wasm.instruction_farBranch32(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Gets the operand's branch target selector. Use this method if the operand has kind [`OpKind.FarBranch16`] or [`OpKind.FarBranch32`]
    *
    * [`OpKind.FarBranch16`]: enum.OpKind.html#variant.FarBranch16
    * [`OpKind.FarBranch32`]: enum.OpKind.html#variant.FarBranch32
    * @returns {number}
    */
    get farBranchSelector() {
        const ret = wasm.instruction_farBranchSelector(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the memory operand's base register (a [`Register`] enum value) or [`Register.None`] if none. Use this method if the operand has kind [`OpKind.Memory`]
    *
    * [`Register`]: enum.Register.html
    * [`Register.None`]: enum.Register.html#variant.None
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * @returns {Register}
    */
    get memoryBase() {
        const ret = wasm.instruction_memoryBase(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the memory operand's index register (a [`Register`] enum value) or [`Register.None`] if none. Use this method if the operand has kind [`OpKind.Memory`]
    *
    * [`Register`]: enum.Register.html
    * [`Register.None`]: enum.Register.html#variant.None
    * [`OpKind.Memory`]: enum.OpKind.html#variant.Memory
    * @returns {Register}
    */
    get memoryIndex() {
        const ret = wasm.instruction_memoryIndex(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #0's register value (a [`Register`] enum value). Use this method if operand #0 ([`op0Kind`]) has kind [`OpKind.Register`], see [`opCount`] and [`opRegister`]
    *
    * [`Register`]: enum.Register.html
    * [`op0Kind`]: #method.op0_kind
    * [`opCount`]: #method.op_count
    * [`opRegister`]: #method.op_register
    * [`Register.None`]: enum.Register.html#variant.None
    * [`OpKind.Register`]: enum.OpKind.html#variant.Register
    * @returns {Register}
    */
    get op0Register() {
        const ret = wasm.instruction_op0Register(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #1's register value (a [`Register`] enum value). Use this method if operand #1 ([`op0Kind`]) has kind [`OpKind.Register`], see [`opCount`] and [`opRegister`]
    *
    * [`Register`]: enum.Register.html
    * [`op0Kind`]: #method.op0_kind
    * [`opCount`]: #method.op_count
    * [`opRegister`]: #method.op_register
    * [`Register.None`]: enum.Register.html#variant.None
    * [`OpKind.Register`]: enum.OpKind.html#variant.Register
    * @returns {Register}
    */
    get op1Register() {
        const ret = wasm.instruction_op1Register(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #2's register value (a [`Register`] enum value). Use this method if operand #2 ([`op0Kind`]) has kind [`OpKind.Register`], see [`opCount`] and [`opRegister`]
    *
    * [`Register`]: enum.Register.html
    * [`op0Kind`]: #method.op0_kind
    * [`opCount`]: #method.op_count
    * [`opRegister`]: #method.op_register
    * [`Register.None`]: enum.Register.html#variant.None
    * [`OpKind.Register`]: enum.OpKind.html#variant.Register
    * @returns {Register}
    */
    get op2Register() {
        const ret = wasm.instruction_op2Register(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #3's register value (a [`Register`] enum value). Use this method if operand #3 ([`op0Kind`]) has kind [`OpKind.Register`], see [`opCount`] and [`opRegister`]
    *
    * [`Register`]: enum.Register.html
    * [`op0Kind`]: #method.op0_kind
    * [`opCount`]: #method.op_count
    * [`opRegister`]: #method.op_register
    * [`Register.None`]: enum.Register.html#variant.None
    * [`OpKind.Register`]: enum.OpKind.html#variant.Register
    * @returns {Register}
    */
    get op3Register() {
        const ret = wasm.instruction_op3Register(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand #4's register value (a [`Register`] enum value). Use this method if operand #4 ([`op0Kind`]) has kind [`OpKind.Register`], see [`opCount`] and [`opRegister`]
    *
    * [`Register`]: enum.Register.html
    * [`op0Kind`]: #method.op0_kind
    * [`opCount`]: #method.op_count
    * [`opRegister`]: #method.op_register
    * [`Register.None`]: enum.Register.html#variant.None
    * [`OpKind.Register`]: enum.OpKind.html#variant.Register
    * @returns {Register}
    */
    get op4Register() {
        const ret = wasm.instruction_op4Register(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the operand's register value (a [`Register`] enum value). Use this method if the operand has kind [`OpKind.Register`]
    *
    * [`Register`]: enum.Register.html
    * [`OpKind.Register`]: enum.OpKind.html#variant.Register
    *
    * # Throws
    *
    * Throws if `operand` is invalid
    *
    * # Arguments
    *
    * * `operand`: Operand number, 0-4
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, OpKind, Register } = require("iced-x86");
    *
    * // add [rax],ebx
    * const bytes = new Uint8Array([0x01, 0x18]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * const instr = decoder.decode();
    *
    * assert.equal(instr.opCount, 2);
    * assert.equal(instr.opKind(0), OpKind.Memory);
    * assert.equal(instr.opKind(1), OpKind.Register);
    * assert.equal(instr.opRegister(1), Register.EBX);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @param {number} operand
    * @returns {Register}
    */
    opRegister(operand) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.instruction_opRegister(retptr, this.__wbg_ptr, operand);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Gets the opmask register ([`Register.K1`] - [`Register.K7`]) or [`Register.None`] if none
    *
    * [`Register.K1`]: enum.Register.html#variant.K1
    * [`Register.K7`]: enum.Register.html#variant.K7
    * [`Register.None`]: enum.Register.html#variant.None
    * @returns {Register}
    */
    get opMask() {
        const ret = wasm.instruction_opMask(this.__wbg_ptr);
        return ret;
    }
    /**
    * Checks if there's an opmask register ([`opMask`])
    *
    * [`opMask`]: #method.op_mask
    * @returns {boolean}
    */
    get hasOpMask() {
        const ret = wasm.instruction_hasOpMask(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if zeroing-masking, `false` if merging-masking.
    * Only used by most EVEX encoded instructions that use opmask registers.
    * @returns {boolean}
    */
    get zeroingMasking() {
        const ret = wasm.instruction_zeroingMasking(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if merging-masking, `false` if zeroing-masking.
    * Only used by most EVEX encoded instructions that use opmask registers.
    * @returns {boolean}
    */
    get mergingMasking() {
        const ret = wasm.instruction_mergingMasking(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets the rounding control (a [`RoundingControl`] enum value) (SAE is implied but [`suppressAllExceptions`] still returns `false`)
    * or [`RoundingControl.None`] if the instruction doesn't use it.
    *
    * [`RoundingControl`]: enum.RoundingControl.html
    * [`suppressAllExceptions`]: #method.suppress_all_exceptions
    * [`RoundingControl.None`]: enum.RoundingControl.html#variant.None
    * @returns {RoundingControl}
    */
    get roundingControl() {
        const ret = wasm.instruction_roundingControl(this.__wbg_ptr);
        return ret;
    }
    /**
    * Checks if this is a VSIB instruction, see also [`isVsib32`], [`isVsib64`]
    *
    * [`isVsib32`]: #method.is_vsib32
    * [`isVsib64`]: #method.is_vsib64
    * @returns {boolean}
    */
    get isVsib() {
        const ret = wasm.instruction_isVsib(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * VSIB instructions only ([`isVsib`]): `true` if it's using 32-bit indexes, `false` if it's using 64-bit indexes
    *
    * [`isVsib`]: #method.is_vsib
    * @returns {boolean}
    */
    get isVsib32() {
        const ret = wasm.instruction_isVsib32(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * VSIB instructions only ([`isVsib`]): `true` if it's using 64-bit indexes, `false` if it's using 32-bit indexes
    *
    * [`isVsib`]: #method.is_vsib
    * @returns {boolean}
    */
    get isVsib64() {
        const ret = wasm.instruction_isVsib64(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a vsib instruction.
    *
    * # Returns
    *
    * * `true` if it's a VSIB instruction with 64-bit indexes
    * * `false` if it's a VSIB instruction with 32-bit indexes
    * * `undefined` if it's not a VSIB instruction.
    * @returns {boolean | undefined}
    */
    get vsib() {
        const ret = wasm.instruction_vsib(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret !== 0;
    }
    /**
    * Gets the suppress all exceptions flag (EVEX/MVEX encoded instructions). Note that if [`roundingControl`] is
    * not [`RoundingControl.None`], SAE is implied but this method will still return `false`.
    *
    * [`roundingControl`]: #method.rounding_control
    * [`RoundingControl.None`]: enum.RoundingControl.html#variant.None
    * @returns {boolean}
    */
    get suppressAllExceptions() {
        const ret = wasm.instruction_suppressAllExceptions(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if the memory operand is `RIP`/`EIP` relative
    * @returns {boolean}
    */
    get isIpRelMemoryOperand() {
        const ret = wasm.instruction_isIpRelMemoryOperand(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets the `RIP`/`EIP` releative address ([`memoryDisplacement`]).
    * This method is only valid if there's a memory operand with `RIP`/`EIP` relative addressing, see [`isIpRelMemoryOperand`]
    *
    * [`memoryDisplacement`]: #method.memory_displacement
    * [`isIpRelMemoryOperand`]: #method.is_ip_rel_memory_operand
    * @returns {bigint}
    */
    get ipRelMemoryAddress() {
        const ret = wasm.instruction_ipRelMemoryAddress(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Gets the number of bytes added to `SP`/`ESP`/`RSP` or 0 if it's not an instruction that pushes or pops data. This method assumes
    * the instruction doesn't change the privilege level (eg. `IRET/D/Q`). If it's the `LEAVE` instruction, this method returns 0.
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions } = require("iced-x86");
    *
    * // pushfq
    * const bytes = new Uint8Array([0x9C]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * const instr = decoder.decode();
    *
    * assert.ok(instr.isStackInstruction);
    * assert.equal(instr.stackPointerIncrement, -8);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get stackPointerIncrement() {
        const ret = wasm.instruction_stackPointerIncrement(this.__wbg_ptr);
        return ret;
    }
    /**
    * Used if [`fpuWritesTop()`] is `true`:
    *
    * Value added to `TOP`.
    *
    * This is negative if it pushes one or more values and positive if it pops one or more values
    * and `0` if it writes to `TOP` (eg. `FLDENV`, etc) without pushing/popping anything.
    *
    * [`fpuWritesTop()`]: #method.fpu_writes_top
    * @returns {number}
    */
    get fpuTopIncrement() {
        const ret = wasm.instruction_fpuTopIncrement(this.__wbg_ptr);
        return ret;
    }
    /**
    * `true` if it's a conditional push/pop (eg. `FPTAN` or `FSINCOS`)
    * @returns {boolean}
    */
    get fpuCondWritesTop() {
        const ret = wasm.instruction_fpuCondWritesTop(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if `TOP` is written (it's a conditional/unconditional push/pop, `FNSAVE`, `FLDENV`, etc)
    * @returns {boolean}
    */
    get fpuWritesTop() {
        const ret = wasm.instruction_fpuWritesTop(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Instruction encoding (a [`EncodingKind`] enum value), eg. Legacy, 3DNow!, VEX, EVEX, XOP
    *
    * [`EncodingKind`]: enum.EncodingKind.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, EncodingKind } = require("iced-x86");
    *
    * // vmovaps xmm1,xmm5
    * const bytes = new Uint8Array([0xC5, 0xF8, 0x28, 0xCD]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * const instr = decoder.decode();
    *
    * assert.equal(instr.encoding, EncodingKind.VEX);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {EncodingKind}
    */
    get encoding() {
        const ret = wasm.instruction_encoding(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the CPU or CPUID feature flags (an array of [`CpuidFeature`] values)
    *
    * [`CpuidFeature`]: enum.CpuidFeature.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, CpuidFeature } = require("iced-x86");
    *
    * // vmovaps xmm1,xmm5
    * // vmovaps xmm10{k3}{z},xmm19
    * const bytes = new Uint8Array([0xC5, 0xF8, 0x28, 0xCD, 0x62, 0x31, 0x7C, 0x8B, 0x28, 0xD3]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // vmovaps xmm1,xmm5
    * const instr = decoder.decode();
    * let cpuid = instr.cpuidFeatures();
    * assert.equal(cpuid.length, 1);
    * assert.equal(cpuid[0], CpuidFeature.AVX);
    *
    * // vmovaps xmm10{k3}{z},xmm19
    * decoder.decodeOut(instr);
    * cpuid = instr.cpuidFeatures();
    * assert.equal(cpuid.length, 2);
    * assert.equal(cpuid[0], CpuidFeature.AVX512VL);
    * assert.equal(cpuid[1], CpuidFeature.AVX512F);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {Int32Array}
    */
    cpuidFeatures() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.instruction_cpuidFeatures(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayI32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Control flow info (a [`FlowControl`] enum value)
    *
    * [`FlowControl`]: enum.FlowControl.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, FlowControl } = require("iced-x86");
    *
    * // or ecx,esi
    * // ud0 rcx,rsi
    * // call rcx
    * const bytes = new Uint8Array([0x0B, 0xCE, 0x48, 0x0F, 0xFF, 0xCE, 0xFF, 0xD1]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // or ecx,esi
    * const instr = decoder.decode();
    * assert.equal(instr.flowControl, FlowControl.Next);
    *
    * // ud0 rcx,rsi
    * decoder.decodeOut(instr);
    * assert.equal(instr.flowControl, FlowControl.Exception);
    *
    * // call rcx
    * decoder.decodeOut(instr);
    * assert.equal(instr.flowControl, FlowControl.IndirectCall);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {FlowControl}
    */
    get flowControl() {
        const ret = wasm.instruction_flowControl(this.__wbg_ptr);
        return ret;
    }
    /**
    * `true` if it's a privileged instruction (all CPL=0 instructions (except `VMCALL`) and IOPL instructions `IN`, `INS`, `OUT`, `OUTS`, `CLI`, `STI`)
    * @returns {boolean}
    */
    get isPrivileged() {
        const ret = wasm.instruction_isPrivileged(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if this is an instruction that implicitly uses the stack pointer (`SP`/`ESP`/`RSP`), eg. `CALL`, `PUSH`, `POP`, `RET`, etc.
    * See also [`stackPointerIncrement`]
    *
    * [`stackPointerIncrement`]: #method.stack_pointer_increment
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions } = require("iced-x86");
    *
    * // or ecx,esi
    * // push rax
    * const bytes = new Uint8Array([0x0B, 0xCE, 0x50]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // or ecx,esi
    * const instr = decoder.decode();
    * assert.ok(!instr.isStackInstruction);
    *
    * // push rax
    * decoder.decodeOut(instr);
    * assert.ok(instr.isStackInstruction);
    * assert.equal(instr.stackPointerIncrement, -8);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {boolean}
    */
    get isStackInstruction() {
        const ret = wasm.instruction_isStackInstruction(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if it's an instruction that saves or restores too many registers (eg. `FXRSTOR`, `XSAVE`, etc).
    * @returns {boolean}
    */
    get isSaveRestoreInstruction() {
        const ret = wasm.instruction_isSaveRestoreInstruction(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * `true` if it's a "string" instruction, such as `MOVS`, `LODS`, `SCAS`, etc.
    * @returns {boolean}
    */
    get isStringInstruction() {
        const ret = wasm.instruction_isStringInstruction(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * All flags that are read by the CPU when executing the instruction.
    * This method returns a [`RflagsBits`] value. See also [`rflagsModified`].
    *
    * [`RflagsBits`]: enum.RflagsBits.html
    * [`rflagsModified`]: #method.rflags_modified
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, RflagsBits } = require("iced-x86");
    *
    * // adc rsi,rcx
    * // xor rdi,5Ah
    * const bytes = new Uint8Array([0x48, 0x11, 0xCE, 0x48, 0x83, 0xF7, 0x5A]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // adc rsi,rcx
    * const instr = decoder.decode();
    * assert.equal(instr.rflagsRead, RflagsBits.CF);
    * assert.equal(instr.rflagsWritten, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.None);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.None);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // xor rdi,5Ah
    * decoder.decodeOut(instr);
    * assert.equal(instr.rflagsRead, RflagsBits.None);
    * assert.equal(instr.rflagsWritten, RflagsBits.SF | RflagsBits.ZF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.OF | RflagsBits.CF);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.AF);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get rflagsRead() {
        const ret = wasm.instruction_rflagsRead(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * All flags that are written by the CPU, except those flags that are known to be undefined, always set or always cleared.
    * This method returns a [`RflagsBits`] value. See also [`rflagsModified`].
    *
    * [`RflagsBits`]: enum.RflagsBits.html
    * [`rflagsModified`]: #method.rflags_modified
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, RflagsBits } = require("iced-x86");
    *
    * // adc rsi,rcx
    * // xor rdi,5Ah
    * const bytes = new Uint8Array([0x48, 0x11, 0xCE, 0x48, 0x83, 0xF7, 0x5A]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // adc rsi,rcx
    * const instr = decoder.decode();
    * assert.equal(instr.rflagsRead, RflagsBits.CF);
    * assert.equal(instr.rflagsWritten, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.None);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.None);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // xor rdi,5Ah
    * decoder.decodeOut(instr);
    * assert.equal(instr.rflagsRead, RflagsBits.None);
    * assert.equal(instr.rflagsWritten, RflagsBits.SF | RflagsBits.ZF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.OF | RflagsBits.CF);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.AF);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get rflagsWritten() {
        const ret = wasm.instruction_rflagsWritten(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * All flags that are always cleared by the CPU.
    * This method returns a [`RflagsBits`] value. See also [`rflagsModified`].
    *
    * [`RflagsBits`]: enum.RflagsBits.html
    * [`rflagsModified`]: #method.rflags_modified
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, RflagsBits } = require("iced-x86");
    *
    * // adc rsi,rcx
    * // xor rdi,5Ah
    * const bytes = new Uint8Array([0x48, 0x11, 0xCE, 0x48, 0x83, 0xF7, 0x5A]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // adc rsi,rcx
    * const instr = decoder.decode();
    * assert.equal(instr.rflagsRead, RflagsBits.CF);
    * assert.equal(instr.rflagsWritten, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.None);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.None);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // xor rdi,5Ah
    * decoder.decodeOut(instr);
    * assert.equal(instr.rflagsRead, RflagsBits.None);
    * assert.equal(instr.rflagsWritten, RflagsBits.SF | RflagsBits.ZF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.OF | RflagsBits.CF);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.AF);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get rflagsCleared() {
        const ret = wasm.instruction_rflagsCleared(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * All flags that are always set by the CPU.
    * This method returns a [`RflagsBits`] value. See also [`rflagsModified`].
    *
    * [`RflagsBits`]: enum.RflagsBits.html
    * [`rflagsModified`]: #method.rflags_modified
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, RflagsBits } = require("iced-x86");
    *
    * // adc rsi,rcx
    * // xor rdi,5Ah
    * const bytes = new Uint8Array([0x48, 0x11, 0xCE, 0x48, 0x83, 0xF7, 0x5A]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // adc rsi,rcx
    * const instr = decoder.decode();
    * assert.equal(instr.rflagsRead, RflagsBits.CF);
    * assert.equal(instr.rflagsWritten, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.None);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.None);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // xor rdi,5Ah
    * decoder.decodeOut(instr);
    * assert.equal(instr.rflagsRead, RflagsBits.None);
    * assert.equal(instr.rflagsWritten, RflagsBits.SF | RflagsBits.ZF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.OF | RflagsBits.CF);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.AF);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get rflagsSet() {
        const ret = wasm.instruction_rflagsSet(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * All flags that are undefined after executing the instruction.
    * This method returns a [`RflagsBits`] value. See also [`rflagsModified`].
    *
    * [`RflagsBits`]: enum.RflagsBits.html
    * [`rflagsModified`]: #method.rflags_modified
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, RflagsBits } = require("iced-x86");
    *
    * // adc rsi,rcx
    * // xor rdi,5Ah
    * const bytes = new Uint8Array([0x48, 0x11, 0xCE, 0x48, 0x83, 0xF7, 0x5A]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // adc rsi,rcx
    * const instr = decoder.decode();
    * assert.equal(instr.rflagsRead, RflagsBits.CF);
    * assert.equal(instr.rflagsWritten, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.None);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.None);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // xor rdi,5Ah
    * decoder.decodeOut(instr);
    * assert.equal(instr.rflagsRead, RflagsBits.None);
    * assert.equal(instr.rflagsWritten, RflagsBits.SF | RflagsBits.ZF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.OF | RflagsBits.CF);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.AF);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get rflagsUndefined() {
        const ret = wasm.instruction_rflagsUndefined(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * All flags that are modified by the CPU. This is `rflagsWritten + rflagsCleared + rflagsSet + rflagsUndefined`.
    * This method returns a [`RflagsBits`] value.
    *
    * [`RflagsBits`]: enum.RflagsBits.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, RflagsBits } = require("iced-x86");
    *
    * // adc rsi,rcx
    * // xor rdi,5Ah
    * const bytes = new Uint8Array([0x48, 0x11, 0xCE, 0x48, 0x83, 0xF7, 0x5A]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // adc rsi,rcx
    * const instr = decoder.decode();
    * assert.equal(instr.rflagsRead, RflagsBits.CF);
    * assert.equal(instr.rflagsWritten, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.None);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.None);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // xor rdi,5Ah
    * decoder.decodeOut(instr);
    * assert.equal(instr.rflagsRead, RflagsBits.None);
    * assert.equal(instr.rflagsWritten, RflagsBits.SF | RflagsBits.ZF | RflagsBits.PF);
    * assert.equal(instr.rflagsCleared, RflagsBits.OF | RflagsBits.CF);
    * assert.equal(instr.rflagsSet, RflagsBits.None);
    * assert.equal(instr.rflagsUndefined, RflagsBits.AF);
    * assert.equal(instr.rflagsModified, RflagsBits.OF | RflagsBits.SF | RflagsBits.ZF | RflagsBits.AF | RflagsBits.CF | RflagsBits.PF);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {number}
    */
    get rflagsModified() {
        const ret = wasm.instruction_rflagsModified(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Checks if it's a `Jcc SHORT` or `Jcc NEAR` instruction
    * @returns {boolean}
    */
    get isJccShortOrNear() {
        const ret = wasm.instruction_isJccShortOrNear(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `Jcc NEAR` instruction
    * @returns {boolean}
    */
    get isJccNear() {
        const ret = wasm.instruction_isJccNear(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `Jcc SHORT` instruction
    * @returns {boolean}
    */
    get isJccShort() {
        const ret = wasm.instruction_isJccShort(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `JMP SHORT` instruction
    * @returns {boolean}
    */
    get isJmpShort() {
        const ret = wasm.instruction_isJmpShort(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `JMP NEAR` instruction
    * @returns {boolean}
    */
    get isJmpNear() {
        const ret = wasm.instruction_isJmpNear(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `JMP SHORT` or a `JMP NEAR` instruction
    * @returns {boolean}
    */
    get isJmpShortOrNear() {
        const ret = wasm.instruction_isJmpShortOrNear(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `JMP FAR` instruction
    * @returns {boolean}
    */
    get isJmpFar() {
        const ret = wasm.instruction_isJmpFar(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `CALL NEAR` instruction
    * @returns {boolean}
    */
    get isCallNear() {
        const ret = wasm.instruction_isCallNear(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `CALL FAR` instruction
    * @returns {boolean}
    */
    get isCallFar() {
        const ret = wasm.instruction_isCallFar(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `JMP NEAR reg/[mem]` instruction
    * @returns {boolean}
    */
    get isJmpNearIndirect() {
        const ret = wasm.instruction_isJmpNearIndirect(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `JMP FAR [mem]` instruction
    * @returns {boolean}
    */
    get isJmpFarIndirect() {
        const ret = wasm.instruction_isJmpFarIndirect(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `CALL NEAR reg/[mem]` instruction
    * @returns {boolean}
    */
    get isCallNearIndirect() {
        const ret = wasm.instruction_isCallNearIndirect(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `CALL FAR [mem]` instruction
    * @returns {boolean}
    */
    get isCallFarIndirect() {
        const ret = wasm.instruction_isCallFarIndirect(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `JCXZ SHORT`, `JECXZ SHORT` or `JRCXZ SHORT` instruction
    * @returns {boolean}
    */
    get isJcxShort() {
        const ret = wasm.instruction_isJcxShort(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `LOOPcc SHORT` instruction
    * @returns {boolean}
    */
    get isLoopcc() {
        const ret = wasm.instruction_isLoopcc(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Checks if it's a `LOOP SHORT` instruction
    * @returns {boolean}
    */
    get isLoop() {
        const ret = wasm.instruction_isLoop(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Gets the condition code (a [`ConditionCode`] enum value) if it's `Jcc`, `SETcc`, `CMOVcc`, `CMPccXADD` else [`ConditionCode.None`] is returned
    *
    * [`ConditionCode`]: enum.ConditionCode.html
    * [`ConditionCode.None`]: enum.ConditionCode.html#variant.None
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { ConditionCode, Decoder, DecoderOptions } = require("iced-x86");
    *
    * // setbe al
    * // jl short label
    * // cmovne ecx,esi
    * // nop
    * const bytes = new Uint8Array([0x0F, 0x96, 0xC0, 0x7C, 0x5A, 0x0F, 0x45, 0xCE, 0x90]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * // setbe al
    * const instr = decoder.decode();
    * assert.equal(instr.conditionCode, ConditionCode.be);
    *
    * // jl short label
    * decoder.decodeOut(instr);
    * assert.equal(instr.conditionCode, ConditionCode.l);
    *
    * // cmovne ecx,esi
    * decoder.decodeOut(instr);
    * assert.equal(instr.conditionCode, ConditionCode.ne);
    *
    * // nop
    * decoder.decodeOut(instr);
    * assert.equal(instr.conditionCode, ConditionCode.None);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * ```
    * @returns {ConditionCode}
    */
    get conditionCode() {
        const ret = wasm.instruction_conditionCode(this.__wbg_ptr);
        return ret;
    }
    /**
    * Checks if this instance is equal to another instance. It ignores some fields,
    * such as the IP address, code size, etc.
    * @param {Instruction} other
    * @returns {boolean}
    */
    equals(other) {
        _assertClass(other, Instruction);
        const ret = wasm.instruction_equals(this.__wbg_ptr, other.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * Clones this instance
    * @returns {Instruction}
    */
    clone() {
        const ret = wasm.instruction_clone(this.__wbg_ptr);
        return Instruction.__wrap(ret);
    }
    /**
    * Gets the default disassembly string
    * @returns {string}
    */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.instruction_toString(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
__exports.Instruction = Instruction;
/**
* Contains accessed registers and memory locations
* Created by an [`InstructionInfoFactory`].
*
* [`InstructionInfoFactory`]: struct.InstructionInfoFactory.html
*/
class InstructionInfo {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(InstructionInfo.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_instructioninfo_free(ptr);
    }
    /**
    * Gets all accessed registers (an array of [`UsedRegister`] classes).
    * This method doesn't return all accessed registers if [`isSaveRestoreInstruction`] is `true`.
    *
    * Some instructions have a `r16`/`r32` operand but only use the low 8 bits of the register. In that case
    * this method returns the 8-bit register even if it's `SPL`, `BPL`, `SIL`, `DIL` and the
    * instruction was decoded in 16 or 32-bit mode. This is more accurate than returning the `r16`/`r32`
    * register. Example instructions that do this: `PINSRB`, `ARPL`
    *
    * [`UsedRegister`]: struct.UsedRegister.html
    * [`isSaveRestoreInstruction`]: #method.is_save_restore_instruction
    * @returns {Array<any>}
    */
    usedRegisters() {
        const ret = wasm.instructioninfo_usedRegisters(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * Gets all accessed memory locations (an array of [`UsedMemory`] classes).
    *
    * [`UsedMemory`]: struct.UsedMemory.html
    * @returns {Array<any>}
    */
    usedMemory() {
        const ret = wasm.instructioninfo_usedMemory(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * Operand #0 access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    * @returns {OpAccess}
    */
    get op0Access() {
        const ret = wasm.instructioninfo_op0Access(this.__wbg_ptr);
        return ret;
    }
    /**
    * Operand #1 access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    * @returns {OpAccess}
    */
    get op1Access() {
        const ret = wasm.instructioninfo_op1Access(this.__wbg_ptr);
        return ret;
    }
    /**
    * Operand #2 access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    * @returns {OpAccess}
    */
    get op2Access() {
        const ret = wasm.instructioninfo_op2Access(this.__wbg_ptr);
        return ret;
    }
    /**
    * Operand #3 access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    * @returns {OpAccess}
    */
    get op3Access() {
        const ret = wasm.instructioninfo_op3Access(this.__wbg_ptr);
        return ret;
    }
    /**
    * Operand #4 access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    * @returns {OpAccess}
    */
    get op4Access() {
        const ret = wasm.instructioninfo_op4Access(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets operand access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    *
    * # Throws
    *
    * Throws if `operand` is invalid
    *
    * # Arguments
    *
    * * `operand`: Operand number, 0-4
    * @param {number} operand
    * @returns {OpAccess}
    */
    opAccess(operand) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.instructioninfo_opAccess(retptr, this.__wbg_ptr, operand);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
__exports.InstructionInfo = InstructionInfo;
/**
* Creates [`InstructionInfo`]s.
*
* [`InstructionInfo`]: struct.InstructionInfo.html
*/
class InstructionInfoFactory {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_instructioninfofactory_free(ptr);
    }
    /**
    * Creates a new instance.
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, Instruction, InstructionInfoFactory } = require("iced-x86");
    *
    * // add [rdi+r12*8-5AA5EDCCh],esi
    * const bytes = new Uint8Array([0x42, 0x01, 0xB4, 0xE7, 0x34, 0x12, 0x5A, 0xA5]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    *
    * const infoFactory = new InstructionInfoFactory();
    * const instr = new Instruction();
    * while (decoder.canDecode) {
    *     // Decode the next instruction, overwriting `instr`
    *     decoder.decodeOut(instr);
    *
    *     // There's also infoOptions() if you only need reg usage or only mem usage.
    *     // info() returns both.
    *     const info = infoFactory.info(instr);
    *     for (const memInfo of info.usedMemory()) {
    *         // Do something here with the `UsedMemory` instance...
    *         // ...
    *
    *         // Free wasm memory
    *         memInfo.free();
    *     }
    *     for (const regInfo of info.usedRegisters()) {
    *         // Do something here with the `UsedRegister` instance...
    *         // ...
    *
    *         // Free wasm memory
    *         regInfo.free();
    *     }
    * }
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * infoFactory.free();
    * ```
    */
    constructor() {
        const ret = wasm.instructioninfofactory_new();
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * Creates a new [`InstructionInfo`], see also [`infoOptions()`] if you only need register usage
    * but not memory usage or vice versa.
    *
    * [`InstructionInfo`]: struct.InstructionInfo.html
    * [`infoOptions()`]: #method.info_options
    *
    * # Arguments
    *
    * * `instruction`: The instruction that should be analyzed
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Decoder, DecoderOptions, InstructionInfoFactory, MemorySize, OpAccess, Register } = require("iced-x86");
    *
    * // add [rdi+r12*8-5AA5EDCCh],esi
    * const bytes = new Uint8Array([0x42, 0x01, 0xB4, 0xE7, 0x34, 0x12, 0x5A, 0xA5]);
    * const decoder = new Decoder(64, bytes, DecoderOptions.None);
    * const infoFactory = new InstructionInfoFactory();
    *
    * const instr = decoder.decode();
    * const info = infoFactory.info(instr);
    *
    * const usedMem = info.usedMemory();
    * assert.equal(usedMem.length, 1);
    * const mem = usedMem[0];
    * assert.equal(mem.segment, Register.DS);
    * assert.equal(mem.base, Register.RDI);
    * assert.equal(mem.index, Register.R12);
    * assert.equal(mem.scale, 8);
    * assert.equal(mem.displacement, 0xFFFFFFFFA55A1234n);
    * assert.equal(mem.memorySize, MemorySize.UInt32);
    * assert.equal(mem.access, OpAccess.ReadWrite);
    *
    * const usedRegs = info.usedRegisters();
    * assert.equal(usedRegs.length, 3);
    * assert.equal(usedRegs[0].register, Register.RDI);
    * assert.equal(usedRegs[0].access, OpAccess.Read);
    * assert.equal(usedRegs[1].register, Register.R12);
    * assert.equal(usedRegs[1].access, OpAccess.Read);
    * assert.equal(usedRegs[2].register, Register.ESI);
    * assert.equal(usedRegs[2].access, OpAccess.Read);
    *
    * // Free wasm memory
    * decoder.free();
    * instr.free();
    * infoFactory.free();
    * usedMem.forEach(m => m.free());
    * usedRegs.forEach(r => r.free());
    * ```
    * @param {Instruction} instruction
    * @returns {InstructionInfo}
    */
    info(instruction) {
        _assertClass(instruction, Instruction);
        const ret = wasm.instructioninfofactory_info(this.__wbg_ptr, instruction.__wbg_ptr);
        return InstructionInfo.__wrap(ret);
    }
    /**
    * Creates a new [`InstructionInfo`], see also [`info()`].
    *
    * [`InstructionInfo`]: struct.InstructionInfo.html
    * [`info()`]: #method.info
    *
    * # Arguments
    *
    * * `instruction`: The instruction that should be analyzed
    * * `options`: Options, see [`InstructionInfoOptions`]
    *
    * [`InstructionInfoOptions`]: struct.InstructionInfoOptions.html
    * @param {Instruction} instruction
    * @param {number} options
    * @returns {InstructionInfo}
    */
    infoOptions(instruction, options) {
        _assertClass(instruction, Instruction);
        const ret = wasm.instructioninfofactory_infoOptions(this.__wbg_ptr, instruction.__wbg_ptr, options);
        return InstructionInfo.__wrap(ret);
    }
}
__exports.InstructionInfoFactory = InstructionInfoFactory;
/**
* [`MemorySize`] enum extension methods
*
* [`MemorySize`]: enum.MemorySize.html
*/
class MemorySizeExt {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_memorysizeext_free(ptr);
    }
    /**
    * Gets the size in bytes of the memory location or 0 if it's not accessed by the instruction or unknown or variable sized
    *
    * # Arguments
    *
    * - `value`: A [`MemorySize`] enum value
    *
    * [`MemorySize`]: enum.MemorySize.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { MemorySize, MemorySizeExt } = require("iced-x86");
    *
    * assert.equal(MemorySizeExt.size(MemorySize.UInt32), 4);
    * assert.equal(MemorySizeExt.size(MemorySize.Packed256_UInt16), 32);
    * assert.equal(MemorySizeExt.size(MemorySize.Broadcast512_UInt64), 8);
    * ```
    * @param {MemorySize} value
    * @returns {number}
    */
    static size(value) {
        const ret = wasm.memorysizeext_size(value);
        return ret >>> 0;
    }
    /**
    * Gets the size in bytes of the packed element. If it's not a packed data type, it's equal to [`MemorySizeExt.size()`].
    *
    * # Arguments
    *
    * - `value`: A [`MemorySize`] enum value
    *
    * [`MemorySize`]: enum.MemorySize.html
    * [`MemorySizeExt.size()`]: #method.size
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { MemorySize, MemorySizeExt } = require("iced-x86");
    *
    * assert.equal(MemorySizeExt.elementSize(MemorySize.UInt32), 4);
    * assert.equal(MemorySizeExt.elementSize(MemorySize.Packed256_UInt16), 2);
    * assert.equal(MemorySizeExt.elementSize(MemorySize.Broadcast512_UInt64), 8);
    * ```
    * @param {MemorySize} value
    * @returns {number}
    */
    static elementSize(value) {
        const ret = wasm.memorysizeext_elementSize(value);
        return ret >>> 0;
    }
    /**
    * Gets the element type if it's packed data or `value` if it's not packed data
    *
    * # Arguments
    *
    * - `value`: A [`MemorySize`] enum value
    *
    * [`MemorySize`]: enum.MemorySize.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { MemorySize, MemorySizeExt } = require("iced-x86");
    *
    * assert.equal(MemorySizeExt.elementType(MemorySize.UInt32), MemorySize.UInt32);
    * assert.equal(MemorySizeExt.elementType(MemorySize.Packed256_UInt16), MemorySize.UInt16);
    * assert.equal(MemorySizeExt.elementType(MemorySize.Broadcast512_UInt64), MemorySize.UInt64);
    * ```
    * @param {MemorySize} value
    * @returns {MemorySize}
    */
    static elementType(value) {
        const ret = wasm.memorysizeext_elementType(value);
        return ret;
    }
    /**
    * `true` if it's signed data (signed integer or a floating point value)
    *
    * # Arguments
    *
    * - `value`: A [`MemorySize`] enum value
    *
    * [`MemorySize`]: enum.MemorySize.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { MemorySize, MemorySizeExt } = require("iced-x86");
    *
    * assert.ok(!MemorySizeExt.isSigned(MemorySize.UInt32));
    * assert.ok(MemorySizeExt.isSigned(MemorySize.Int32));
    * assert.ok(MemorySizeExt.isSigned(MemorySize.Float64));
    * ```
    * @param {MemorySize} value
    * @returns {boolean}
    */
    static isSigned(value) {
        const ret = wasm.memorysizeext_isSigned(value);
        return ret !== 0;
    }
    /**
    * `true` if this is a packed data type, eg. [`MemorySize.Packed128_Float32`]
    *
    * # Arguments
    *
    * - `value`: A [`MemorySize`] enum value
    *
    * [`MemorySize`]: enum.MemorySize.html
    * [`MemorySize.Packed128_Float32`]: #variant.Packed128_Float32
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { MemorySize, MemorySizeExt } = require("iced-x86");
    *
    * assert.ok(!MemorySizeExt.isPacked(MemorySize.UInt32));
    * assert.ok(MemorySizeExt.isPacked(MemorySize.Packed256_UInt16));
    * assert.ok(!MemorySizeExt.isPacked(MemorySize.Broadcast512_UInt64));
    * ```
    * @param {MemorySize} value
    * @returns {boolean}
    */
    static isPacked(value) {
        const ret = wasm.memorysizeext_isPacked(value);
        return ret !== 0;
    }
    /**
    * Gets the number of elements in the packed data type or `1` if it's not packed data ([`MemorySizeExt.isPacked()`])
    *
    * # Arguments
    *
    * - `value`: A [`MemorySize`] enum value
    *
    * [`MemorySize`]: enum.MemorySize.html
    * [`MemorySizeExt.isPacked()`]: #method.is_packed
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { MemorySize, MemorySizeExt } = require("iced-x86");
    *
    * assert.equal(MemorySizeExt.elementCount(MemorySize.UInt32), 1);
    * assert.equal(MemorySizeExt.elementCount(MemorySize.Packed256_UInt16), 16);
    * assert.equal(MemorySizeExt.elementCount(MemorySize.Broadcast512_UInt64), 1);
    * ```
    * @param {MemorySize} value
    * @returns {number}
    */
    static elementCount(value) {
        const ret = wasm.memorysizeext_elementCount(value);
        return ret >>> 0;
    }
    /**
    * Checks if it is a broadcast memory type
    *
    * # Arguments
    *
    * - `value`: A [`MemorySize`] enum value
    *
    * [`MemorySize`]: enum.MemorySize.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { MemorySize, MemorySizeExt } = require("iced-x86");
    *
    * assert.ok(!MemorySizeExt.isBroadcast(MemorySize.Packed64_Float16));
    * assert.ok(MemorySizeExt.isBroadcast(MemorySize.Broadcast512_UInt64));
    * ```
    * @param {MemorySize} value
    * @returns {boolean}
    */
    static isBroadcast(value) {
        const ret = wasm.memorysizeext_isBroadcast(value);
        return ret !== 0;
    }
}
__exports.MemorySizeExt = MemorySizeExt;
/**
* [`Register`] enum extension methods
*
* [`Register`]: enum.Register.html
*/
class RegisterExt {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_registerext_free(ptr);
    }
    /**
    * Gets the base register, eg. `AL`, `AX`, `EAX`, `RAX`, `MM0`, `XMM0`, `YMM0`, `ZMM0`, `ES`
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.equal(RegisterExt.base(Register.GS), Register.ES);
    * assert.equal(RegisterExt.base(Register.SIL), Register.AL);
    * assert.equal(RegisterExt.base(Register.SP), Register.AX);
    * assert.equal(RegisterExt.base(Register.R13D), Register.EAX);
    * assert.equal(RegisterExt.base(Register.RBP), Register.RAX);
    * assert.equal(RegisterExt.base(Register.MM6), Register.MM0);
    * assert.equal(RegisterExt.base(Register.XMM28), Register.XMM0);
    * assert.equal(RegisterExt.base(Register.YMM12), Register.YMM0);
    * assert.equal(RegisterExt.base(Register.ZMM31), Register.ZMM0);
    * assert.equal(RegisterExt.base(Register.K3), Register.K0);
    * assert.equal(RegisterExt.base(Register.BND1), Register.BND0);
    * assert.equal(RegisterExt.base(Register.ST7), Register.ST0);
    * assert.equal(RegisterExt.base(Register.CR8), Register.CR0);
    * assert.equal(RegisterExt.base(Register.DR6), Register.DR0);
    * assert.equal(RegisterExt.base(Register.TR3), Register.TR0);
    * assert.equal(RegisterExt.base(Register.RIP), Register.EIP);
    * ```
    * @param {Register} value
    * @returns {Register}
    */
    static base(value) {
        const ret = wasm.registerext_base(value);
        return ret;
    }
    /**
    * The register number (index) relative to [`RegisterExt.base()`], eg. 0-15, or 0-31, or if 8-bit GPR, 0-19
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    * [`RegisterExt.base()`]: #method.base
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.equal(RegisterExt.number(Register.GS), 5);
    * assert.equal(RegisterExt.number(Register.SIL), 10);
    * assert.equal(RegisterExt.number(Register.SP), 4);
    * assert.equal(RegisterExt.number(Register.R13D), 13);
    * assert.equal(RegisterExt.number(Register.RBP), 5);
    * assert.equal(RegisterExt.number(Register.MM6), 6);
    * assert.equal(RegisterExt.number(Register.XMM28), 28);
    * assert.equal(RegisterExt.number(Register.YMM12), 12);
    * assert.equal(RegisterExt.number(Register.ZMM31), 31);
    * assert.equal(RegisterExt.number(Register.K3), 3);
    * assert.equal(RegisterExt.number(Register.BND1), 1);
    * assert.equal(RegisterExt.number(Register.ST7), 7);
    * assert.equal(RegisterExt.number(Register.CR8), 8);
    * assert.equal(RegisterExt.number(Register.DR6), 6);
    * assert.equal(RegisterExt.number(Register.TR3), 3);
    * assert.equal(RegisterExt.number(Register.RIP), 1);
    * ```
    * @param {Register} value
    * @returns {number}
    */
    static number(value) {
        const ret = wasm.registerext_number(value);
        return ret >>> 0;
    }
    /**
    * Gets the full register that this one is a part of, eg. `CL`/`CH`/`CX`/`ECX`/`RCX` -> `RCX`, `XMM11`/`YMM11`/`ZMM11` -> `ZMM11`
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.equal(RegisterExt.fullRegister(Register.GS), Register.GS);
    * assert.equal(RegisterExt.fullRegister(Register.SIL), Register.RSI);
    * assert.equal(RegisterExt.fullRegister(Register.SP), Register.RSP);
    * assert.equal(RegisterExt.fullRegister(Register.R13D), Register.R13);
    * assert.equal(RegisterExt.fullRegister(Register.RBP), Register.RBP);
    * assert.equal(RegisterExt.fullRegister(Register.MM6), Register.MM6);
    * assert.equal(RegisterExt.fullRegister(Register.XMM10), Register.ZMM10);
    * assert.equal(RegisterExt.fullRegister(Register.YMM10), Register.ZMM10);
    * assert.equal(RegisterExt.fullRegister(Register.ZMM10), Register.ZMM10);
    * assert.equal(RegisterExt.fullRegister(Register.K3), Register.K3);
    * assert.equal(RegisterExt.fullRegister(Register.BND1), Register.BND1);
    * assert.equal(RegisterExt.fullRegister(Register.ST7), Register.ST7);
    * assert.equal(RegisterExt.fullRegister(Register.CR8), Register.CR8);
    * assert.equal(RegisterExt.fullRegister(Register.DR6), Register.DR6);
    * assert.equal(RegisterExt.fullRegister(Register.TR3), Register.TR3);
    * assert.equal(RegisterExt.fullRegister(Register.RIP), Register.RIP);
    * ```
    * @param {Register} value
    * @returns {Register}
    */
    static fullRegister(value) {
        const ret = wasm.registerext_fullRegister(value);
        return ret;
    }
    /**
    * Gets the full register that this one is a part of, except if it's a GPR in which case the 32-bit register is returned,
    * eg. `CL`/`CH`/`CX`/`ECX`/`RCX` -> `ECX`, `XMM11`/`YMM11`/`ZMM11` -> `ZMM11`
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.equal(RegisterExt.fullRegister32(Register.GS), Register.GS);
    * assert.equal(RegisterExt.fullRegister32(Register.SIL), Register.ESI);
    * assert.equal(RegisterExt.fullRegister32(Register.SP), Register.ESP);
    * assert.equal(RegisterExt.fullRegister32(Register.R13D), Register.R13D);
    * assert.equal(RegisterExt.fullRegister32(Register.RBP), Register.EBP);
    * assert.equal(RegisterExt.fullRegister32(Register.MM6), Register.MM6);
    * assert.equal(RegisterExt.fullRegister32(Register.XMM10), Register.ZMM10);
    * assert.equal(RegisterExt.fullRegister32(Register.YMM10), Register.ZMM10);
    * assert.equal(RegisterExt.fullRegister32(Register.ZMM10), Register.ZMM10);
    * assert.equal(RegisterExt.fullRegister32(Register.K3), Register.K3);
    * assert.equal(RegisterExt.fullRegister32(Register.BND1), Register.BND1);
    * assert.equal(RegisterExt.fullRegister32(Register.ST7), Register.ST7);
    * assert.equal(RegisterExt.fullRegister32(Register.CR8), Register.CR8);
    * assert.equal(RegisterExt.fullRegister32(Register.DR6), Register.DR6);
    * assert.equal(RegisterExt.fullRegister32(Register.TR3), Register.TR3);
    * assert.equal(RegisterExt.fullRegister32(Register.RIP), Register.RIP);
    * ```
    * @param {Register} value
    * @returns {Register}
    */
    static fullRegister32(value) {
        const ret = wasm.registerext_fullRegister32(value);
        return ret;
    }
    /**
    * Gets the size of the register in bytes
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.equal(RegisterExt.size(Register.GS), 2);
    * assert.equal(RegisterExt.size(Register.SIL), 1);
    * assert.equal(RegisterExt.size(Register.SP), 2);
    * assert.equal(RegisterExt.size(Register.R13D), 4);
    * assert.equal(RegisterExt.size(Register.RBP), 8);
    * assert.equal(RegisterExt.size(Register.MM6), 8);
    * assert.equal(RegisterExt.size(Register.XMM10), 16);
    * assert.equal(RegisterExt.size(Register.YMM10), 32);
    * assert.equal(RegisterExt.size(Register.ZMM10), 64);
    * assert.equal(RegisterExt.size(Register.K3), 8);
    * assert.equal(RegisterExt.size(Register.BND1), 16);
    * assert.equal(RegisterExt.size(Register.ST7), 10);
    * assert.equal(RegisterExt.size(Register.CR8), 8);
    * assert.equal(RegisterExt.size(Register.DR6), 8);
    * assert.equal(RegisterExt.size(Register.TR3), 4);
    * assert.equal(RegisterExt.size(Register.RIP), 8);
    * ```
    * @param {Register} value
    * @returns {number}
    */
    static size(value) {
        const ret = wasm.registerext_size(value);
        return ret >>> 0;
    }
    /**
    * Checks if it's a segment register (`ES`, `CS`, `SS`, `DS`, `FS`, `GS`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(RegisterExt.isSegmentRegister(Register.GS));
    * assert.ok(!RegisterExt.isSegmentRegister(Register.RCX));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isSegmentRegister(value) {
        const ret = wasm.registerext_isSegmentRegister(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a general purpose register (`AL`-`R15L`, `AX`-`R15W`, `EAX`-`R15D`, `RAX`-`R15`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isGPR(Register.GS));
    * assert.ok(RegisterExt.isGPR(Register.CH));
    * assert.ok(RegisterExt.isGPR(Register.DX));
    * assert.ok(RegisterExt.isGPR(Register.R13D));
    * assert.ok(RegisterExt.isGPR(Register.RSP));
    * assert.ok(!RegisterExt.isGPR(Register.XMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isGPR(value) {
        const ret = wasm.registerext_isGPR(value);
        return ret !== 0;
    }
    /**
    * Checks if it's an 8-bit general purpose register (`AL`-`R15L`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isGPR8(Register.GS));
    * assert.ok(RegisterExt.isGPR8(Register.CH));
    * assert.ok(!RegisterExt.isGPR8(Register.DX));
    * assert.ok(!RegisterExt.isGPR8(Register.R13D));
    * assert.ok(!RegisterExt.isGPR8(Register.RSP));
    * assert.ok(!RegisterExt.isGPR8(Register.XMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isGPR8(value) {
        const ret = wasm.registerext_isGPR8(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a 16-bit general purpose register (`AX`-`R15W`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isGPR16(Register.GS));
    * assert.ok(!RegisterExt.isGPR16(Register.CH));
    * assert.ok(RegisterExt.isGPR16(Register.DX));
    * assert.ok(!RegisterExt.isGPR16(Register.R13D));
    * assert.ok(!RegisterExt.isGPR16(Register.RSP));
    * assert.ok(!RegisterExt.isGPR16(Register.XMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isGPR16(value) {
        const ret = wasm.registerext_isGPR16(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a 32-bit general purpose register (`EAX`-`R15D`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isGPR32(Register.GS));
    * assert.ok(!RegisterExt.isGPR32(Register.CH));
    * assert.ok(!RegisterExt.isGPR32(Register.DX));
    * assert.ok(RegisterExt.isGPR32(Register.R13D));
    * assert.ok(!RegisterExt.isGPR32(Register.RSP));
    * assert.ok(!RegisterExt.isGPR32(Register.XMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isGPR32(value) {
        const ret = wasm.registerext_isGPR32(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a 64-bit general purpose register (`RAX`-`R15`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isGPR64(Register.GS));
    * assert.ok(!RegisterExt.isGPR64(Register.CH));
    * assert.ok(!RegisterExt.isGPR64(Register.DX));
    * assert.ok(!RegisterExt.isGPR64(Register.R13D));
    * assert.ok(RegisterExt.isGPR64(Register.RSP));
    * assert.ok(!RegisterExt.isGPR64(Register.XMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isGPR64(value) {
        const ret = wasm.registerext_isGPR64(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a 128-bit vector register (`XMM0`-`XMM31`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isXMM(Register.R13D));
    * assert.ok(!RegisterExt.isXMM(Register.RSP));
    * assert.ok(RegisterExt.isXMM(Register.XMM0));
    * assert.ok(!RegisterExt.isXMM(Register.YMM0));
    * assert.ok(!RegisterExt.isXMM(Register.ZMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isXMM(value) {
        const ret = wasm.registerext_isXMM(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a 256-bit vector register (`YMM0`-`YMM31`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isYMM(Register.R13D));
    * assert.ok(!RegisterExt.isYMM(Register.RSP));
    * assert.ok(!RegisterExt.isYMM(Register.XMM0));
    * assert.ok(RegisterExt.isYMM(Register.YMM0));
    * assert.ok(!RegisterExt.isYMM(Register.ZMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isYMM(value) {
        const ret = wasm.registerext_isYMM(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a 512-bit vector register (`ZMM0`-`ZMM31`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isZMM(Register.R13D));
    * assert.ok(!RegisterExt.isZMM(Register.RSP));
    * assert.ok(!RegisterExt.isZMM(Register.XMM0));
    * assert.ok(!RegisterExt.isZMM(Register.YMM0));
    * assert.ok(RegisterExt.isZMM(Register.ZMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isZMM(value) {
        const ret = wasm.registerext_isZMM(value);
        return ret !== 0;
    }
    /**
    * Checks if it's an `XMM`, `YMM` or `ZMM` register
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isVectorRegister(Register.R13D));
    * assert.ok(!RegisterExt.isVectorRegister(Register.RSP));
    * assert.ok(RegisterExt.isVectorRegister(Register.XMM0));
    * assert.ok(RegisterExt.isVectorRegister(Register.YMM0));
    * assert.ok(RegisterExt.isVectorRegister(Register.ZMM0));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isVectorRegister(value) {
        const ret = wasm.registerext_isVectorRegister(value);
        return ret !== 0;
    }
    /**
    * Checks if it's `EIP`/`RIP`
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(RegisterExt.isIP(Register.EIP));
    * assert.ok(RegisterExt.isIP(Register.RIP));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isIP(value) {
        const ret = wasm.registerext_isIP(value);
        return ret !== 0;
    }
    /**
    * Checks if it's an opmask register (`K0`-`K7`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isK(Register.R13D));
    * assert.ok(RegisterExt.isK(Register.K3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isK(value) {
        const ret = wasm.registerext_isK(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a control register (`CR0`-`CR15`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isCR(Register.R13D));
    * assert.ok(RegisterExt.isCR(Register.CR3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isCR(value) {
        const ret = wasm.registerext_isCR(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a debug register (`DR0`-`DR15`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isDR(Register.R13D));
    * assert.ok(RegisterExt.isDR(Register.DR3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isDR(value) {
        const ret = wasm.registerext_isDR(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a test register (`TR0`-`TR7`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isTR(Register.R13D));
    * assert.ok(RegisterExt.isTR(Register.TR3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isTR(value) {
        const ret = wasm.registerext_isTR(value);
        return ret !== 0;
    }
    /**
    * Checks if it's an FPU stack register (`ST0`-`ST7`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isST(Register.R13D));
    * assert.ok(RegisterExt.isST(Register.ST3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isST(value) {
        const ret = wasm.registerext_isST(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a bound register (`BND0`-`BND3`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isBND(Register.R13D));
    * assert.ok(RegisterExt.isBND(Register.BND3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isBND(value) {
        const ret = wasm.registerext_isBND(value);
        return ret !== 0;
    }
    /**
    * Checks if it's an MMX register (`MM0`-`MM7`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isMM(Register.R13D));
    * assert.ok(RegisterExt.isMM(Register.MM3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isMM(value) {
        const ret = wasm.registerext_isMM(value);
        return ret !== 0;
    }
    /**
    * Checks if it's a tile register (`TMM0`-`TMM7`)
    *
    * # Arguments
    *
    * - `value`: A [`Register`] enum value
    *
    * [`Register`]: enum.Register.html
    *
    * # Examples
    *
    * ```js
    * const assert = require("assert").strict;
    * const { Register, RegisterExt } = require("iced-x86");
    *
    * assert.ok(!RegisterExt.isTMM(Register.R13D));
    * assert.ok(RegisterExt.isTMM(Register.TMM3));
    * ```
    * @param {Register} value
    * @returns {boolean}
    */
    static isTMM(value) {
        const ret = wasm.registerext_isTMM(value);
        return ret !== 0;
    }
}
__exports.RegisterExt = RegisterExt;
/**
* A memory location used by an instruction
*/
class UsedMemory {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(UsedMemory.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_usedmemory_free(ptr);
    }
    /**
    * Effective segment register (a [`Register`] enum value) or [`Register.None`] if the segment register is ignored
    *
    * [`Register`]: struct.Register.html
    * [`Register.None`]: enum.Register.html#variant.None
    * @returns {Register}
    */
    get segment() {
        const ret = wasm.usedmemory_segment(this.__wbg_ptr);
        return ret;
    }
    /**
    * Base register (a [`Register`] enum value) or [`Register.None`] if none
    *
    * [`Register`]: struct.Register.html
    * [`Register.None`]: enum.Register.html#variant.None
    * @returns {Register}
    */
    get base() {
        const ret = wasm.usedmemory_base(this.__wbg_ptr);
        return ret;
    }
    /**
    * Index register (a [`Register`] enum value) or [`Register.None`] if none
    *
    * [`Register`]: struct.Register.html
    * [`Register.None`]: enum.Register.html#variant.None
    * @returns {Register}
    */
    get index() {
        const ret = wasm.usedmemory_index(this.__wbg_ptr);
        return ret;
    }
    /**
    * Index scale (1, 2, 4 or 8)
    * @returns {number}
    */
    get scale() {
        const ret = wasm.usedmemory_scale(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Displacement
    * @returns {bigint}
    */
    get displacement() {
        const ret = wasm.instruction_nextIP(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Size of location (a [`MemorySize`] enum value)
    *
    * [`MemorySize`]: enum.MemorySize.html
    * @returns {MemorySize}
    */
    get memorySize() {
        const ret = wasm.usedmemory_memorySize(this.__wbg_ptr);
        return ret;
    }
    /**
    * Memory access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    * @returns {OpAccess}
    */
    get access() {
        const ret = wasm.usedmemory_access(this.__wbg_ptr);
        return ret;
    }
}
__exports.UsedMemory = UsedMemory;
/**
* A register used by an instruction
*/
class UsedRegister {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(UsedRegister.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_usedregister_free(ptr);
    }
    /**
    * Gets the register (a [`Register`] enum value)
    *
    * [`Register`]: struct.Register.html
    * @returns {Register}
    */
    get register() {
        const ret = wasm.usedregister_register(this.__wbg_ptr);
        return ret;
    }
    /**
    * Gets the register access (an [`OpAccess`] enum value)
    *
    * [`OpAccess`]: enum.OpAccess.html
    * @returns {OpAccess}
    */
    get access() {
        const ret = wasm.usedregister_access(this.__wbg_ptr);
        return ret;
    }
}
__exports.UsedRegister = UsedRegister;

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_new_3a66822ed076951c = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_34c624469fb1d4fd = function() {
        const ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_push_906164999551d793 = function(arg0, arg1) {
        const ret = getObject(arg0).push(getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_usedregister_new = function(arg0) {
        const ret = UsedRegister.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_usedmemory_new = function(arg0) {
        const ret = UsedMemory.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_instruction_new = function(arg0) {
        const ret = Instruction.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, maybe_memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedBigInt64Memory0 = null;
    cachedInt32Memory0 = null;
    cachedUint8Memory0 = null;


    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;

    if (typeof input === 'undefined' && typeof script_src !== 'undefined') {
        input = script_src.replace(/\.js$/, '_bg.wasm');
    }
    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}

wasm_bindgen = Object.assign(__wbg_init, { initSync }, __exports);

})();
