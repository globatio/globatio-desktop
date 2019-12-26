const Wallet = require('./wallet');

const Utility = require('./utility');
let newwallet=new Wallet();
let pk=newwallet.generatepublickey()
console.log(newwallet)
const { randomBytes } = require('crypto')
const msg = randomBytes(32)

//setTimeout(() => {
    console.log(newwallet.getprivatekey(pk),pk)
    console.log(newwallet.ispublickey(pk))
    console.log(Utility.sign(msg,newwallet.getprivatekey(pk)))
//}, 5000);

