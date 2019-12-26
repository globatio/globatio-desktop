const Wallet = require('./wallet');
//const Transaction = require('./transaction');
const mywallet=new Wallet('./wallet/wallet0')

//const Block = require('./block');

//const payeewallet= new Wallet('./wallet/wallet2')

//mywallet.storeWallet('./wallet01');
//console.log(mywallet)
mywallet.updateBalance()
console.log('wallet balance:',mywallet.balance)
console.log(mywallet.keypairs.length)