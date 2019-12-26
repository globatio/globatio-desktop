const fs = require('fs')
const Utility = require('./utility');
const Transaction=require('./transaction')
const jsonfile = require('jsonfile')
const path = require('path');


class Wallet {
  constructor(walletfile) {
    this.filepath=walletfile
    //if ((walletfile != null)&&(walletfile!='')&&(walletfile!=undefined)){
    if ( fs.existsSync(walletfile, err => {if (err) throw err;}) ){
        let storedwallet=jsonfile.readFileSync(walletfile)
        this.balance = storedwallet.balance;
        //this.keypair = storedwallet.keypair;
        this.keypairs=storedwallet.keypairs;
        this.mainassetslastscanedblock=storedwallet.mainassetslastscanedblock;
        this.mainassets=storedwallet.mainassets;
        
    } else {

      if ((walletfile=='')||(walletfile==undefined)){
      let walletfilepathid=0
      this.filepath=path.resolve(__dirname,'../wallet/wallet'+walletfilepathid.toString())
    
      while ( fs.existsSync(this.filepath, err => {if (err) throw err;}) ) {
          walletfilepathid++
          this.filepath=path.resolve(__dirname,'../wallet/wallet'+walletfilepathid.toString())
      }
      }
      this.balance = 0;
      //this.keypair = Utility.generateKeyPair();
      this.keypairs=[]
      this.mainassetslastscanedblock=0;
      this.mainassets=[];// array of transactions related to this wallet along with their status
    }

  }
  /*
  privatekey(){
    return this.keypair.privatekey
  }
  publickey(){
    return this.keypair.publickey
  }*/
  ispublickey(key){
    if (key!=undefined){
      return (this.getprivatekey(key)!=undefined)
    } else{
      console.log('error')
    }
    
  }
  generatepublickey(){
    let keypair = Utility.generateKeyPair();
    this.keypairs.push(keypair)
    //console.log(this.privatekeys)
    return keypair.publickey
  }
  getprivatekey(publickey){
    for (let i=0;i<this.keypairs.length;i++){
      if (this.keypairs[i].publickey==publickey)
        return this.keypairs[i].privatekey
      }
  }
  addAsset(transaction,id,publickey,assetchain){
    var self = this
    //console.log('****>',transaction)
    //newtransactions.forEach(transaction => {
      /*
      let assetamount=0
      transaction.outputs.forEach(output=>{
        if (output.publickey===self.publickey()){
          assetamount=output.amount
        }
      })*/

      self.mainassets.push({
        transaction:transaction,
        amount:transaction.outputs[id].amount,
        id:id,
        publickey:publickey,
        chain:assetchain,
        status:'unspent'
      })
    //});
  }
  removeAsset(transactionhash,id,assetchain){
    for (let i=0;i<this.mainassets.length;i++){
      if (transactionhash===this.mainassets[i].transaction.hash){
        //this.mainassets.slice(i, 1);
        this.mainassets[i].status='spent'
      }
    }

  }
  /*
  generateReward(miningreward){
    const rewardoutput={ 
      publickey: this.keypair.publickey,
      amount:miningreward
    }

    let rewardtransaction=new Transaction({
      inputs :[],
      outputs:[rewardoutput]
    })
    //console.log(rewardtransaction)
    return rewardtransaction;
  }*/
  updateBalance(){
    let selectedamount=0
    let i=0
    while(i<this.mainassets.length){
      if ((this.mainassets[i].status==="unspent")||(this.mainassets[i].status==="broadcasted")){
        selectedamount+=this.mainassets[i].amount      
      }
      i++
    }
    this.balance=selectedamount
  }
  generateTransaction(amount,publickey,fee){
    let selectedinputs=[]
    let selectedinputsprivatekey=[]
    let selectedamount=0
    let i=0
    fee=parseInt(fee)
    amount=parseInt(amount)

    this.updateBalance()
    
    if (this.balance<(amount+fee)){
    console.log('ERROR: not enough money in the wallet')
      return;
    }


    while(i<this.mainassets.length){
      if (this.mainassets[i].status==="unspent"){
          this.mainassets[i].status="broadcasted"
      selectedinputs.push({
        hash:this.mainassets[i].transaction.hash,
        //signature:this.mainassets[i].transaction.signature,
        //publickey:this.publickey(),
        id:this.mainassets[i].id,
        chain:this.mainassets[i].chain
      })
      selectedinputsprivatekey.push(this.getprivatekey(this.mainassets[i].publickey))
      console.log(this.mainassets[i].publickey)
      selectedamount+=this.mainassets[i].amount
      i++
    }
      if (selectedamount>=amount+fee){

        let newtransaction=new Transaction({inputs:selectedinputs,outputs:[{
            publickey:this.generatepublickey(),
            amount:(selectedamount-(amount+fee))
          },{
            publickey:publickey,
            amount:amount
          }]
        })
        newtransaction.generateHash()
        //console.log(selectedinputsprivatekey)
        for (let inputid=0;inputid<selectedinputsprivatekey.length;inputid++){
          //console.log((newtransaction.hash,'private key:',selectedinputsprivatekey[inputid]))
          newtransaction.signatures.push(Utility.sign(newtransaction.hash,selectedinputsprivatekey[inputid]))
          
        }
 
        return newtransaction;

      }
    }

    
  }

  save(){
    this.storeWallet(this.filepath)
  }

  storeWallet(walletfile){
    //Utility.saveFile(walletfile,this)
    jsonfile.writeFile(walletfile, this, function (err) {
      if (err) console.error(err)
    })
  }

}

module.exports = Wallet;