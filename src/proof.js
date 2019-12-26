
/*
  //static calculateTarget(bits) {
    //lets bits=
    const exponent = ((bits & 0xff000000) >> 24) - 3;
    const mantissa = bits & 0x007fffff;
    const target = Buffer.alloc(32, 0);
    target.writeUIntBE(mantissa, 29 - exponent, 3);
    return target;
  //}

  //checkProofOfWork() {
    const hash = bufferutils_1.reverseBuffer(this.getHash());
    //const target = Block.calculateTarget(this.bits);
    return hash.compare(target) <= 0;
  //}

  */
let hsh='090cb857900315cd6b13ca2e9751ba5e1b344ae174ecd242d01f30084b38c44b'
//let hsh='000000000fff0000000000000000000000000000000000000000000000000000'
/*

const target = Buffer.alloc(32);
console.log(hsh)
target.writeUIntBE(, 0, 5);
console.log(target.toString('hex'))
*/

/*

console.log(hsh,hsh.localeCompare('f90cb857900315cd6b13ca2e9751ba5e1b344ae174ecd242d01f30084b38c44b'))
console.log('00000000FFFF0000000000000000000000000000000000000000000000000000')
for (let i=1;i<10;i++){
let base =((Math.pow(2,16)-1) *Math.pow(2,238)/i).toString(16)
let target='0'.repeat(64-base.length)+base
console.log(target,hsh.localeCompare(target))
}
*/
/*

console.log()
//console.log(parseInt("0x0cbdb5cc094829be093e7c8cbb79f0051c5da7fdde1f9de435db31683f439f83"))
//console.log((5.762942995137697e+75).toString(16))
console.log('012be6b6166330447f372b57fd09189966e276ba8d4d82396b0c970c2f8f0d25')
//console.log(Number.MAX_SAFE_INTEGER);
*/
console.log((Math.pow(2,16)-1) *Math.pow(2,238))
console.log(Number.MAX_SAFE_INTEGER);