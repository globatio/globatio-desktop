


let code='The Guardian 15/Aug/2017 IMF warns China over dangerous growth in debt'
let opcode=Buffer.from(code).toString('hex');

console.log(code)
console.log(opcode)

console.log(Buffer.from(opcode,"hex").toString())