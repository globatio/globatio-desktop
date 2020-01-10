const Utility = require('./utility');
const Block = require('./block');



const Jsonfile = require('jsonfile')
const fs = require('fs');

var level = require('level')


class Mainchain {
  constructor(mainchainfolder) {
    this.confirmationlayer=120
    this.synchronizationlayer=20

    this.activeblocksfileid=0
    const mainchainfile=mainchainfolder+'/mainchain'

    this.mainchainfolder=mainchainfolder
    var statedb= level(mainchainfolder+'/state',{ valueEncoding: 'json' })


    this.chain=[]

    if ((mainchainfile != null)&&(fs.existsSync(mainchainfile))){
      let storedmainchain=Jsonfile.readFileSync(mainchainfile)
      
      this.unconfirmedblockid=storedmainchain.unconfirmedblockid
      this.chainlength=storedmainchain.chainlength

      let i=0
      for (let j=this.unconfirmedblockid;j<this.chainlength;j++){
        this.chain[j]=storedmainchain.chain[i]

        i++
      }


      this.activeblocksfileid=storedmainchain.activeblocksfileid
      this.blocksfiledescriptor=fs.openSync(mainchainfolder+'/blocksfile'+this.activeblocksfileid.toString(), 'a+')


      this.activeblocksfilelastposition=storedmainchain.activeblocksfilelastposition
      
      

      this.blockposition=storedmainchain.blockposition
      this.blocklength=storedmainchain.blocklength
      this.blockfileid=storedmainchain.blockfileid
    } else {


      this.chain[0]=Block.returnGenesis()
      this.activeblocksfileid=0
      this.blocksfiledescriptor=fs.openSync(mainchainfolder+'/blocksfile'+this.activeblocksfileid.toString(), 'a+')
      this.activeblocksfilelastposition=0
      this.unconfirmedblockid=0
      this.chainlength=1


      this.blockposition=[]
      this.blocklength=[]
      this.blockfileid=[]

    }
    //--------------------------------------
    
    let statedbnew=true
    statedb.createReadStream( {keys: true,values: false,limit: 1 })
      .on('data', function (data) {
      statedbnew=false
      })
      .on('error', function (err) {
        console.log('statedb error:', err)
      })
      .on('end', function () {     
        if (statedbnew){
          console.log('statedb is new '); 	
          this.statelastscanedblock=-1
        }	    
      })
    //--------------------------------------
   
    //--------------------------------------
    
  }
  load(){
    p2pnode.start()
  }
  addBlock(block) {
    if (this.chain[block.id]==undefined){
      this.chain[block.id]=block
      this.chainlength++
    }

  }
  chainLength(){
    return this.chainlength
  }
  save(){
        for(let i=this.unconfirmedblockid;i<(this.chainLength()-this.confirmationlayer);i++){
          this.saveBlock(i)
          this.unconfirmedblockid++
        }

    Jsonfile.writeFileSync(this.mainchainfolder+'/mainchain',  
      {
        chainlength:this.chainlength,
        statelastscanedblock:this.statelastscanedblock,
        activeblocksfileid:this.activeblocksfileid,
        activeblocksfilelastposition:this.activeblocksfilelastposition,
        unconfirmedblockid:this.unconfirmedblockid,
        chain:this.chain.slice(this.unconfirmedblockid),
        blockposition:this.blockposition,
        blocklength:this.blocklength,
        blockfileid:this.blockfileid
      })
  }
  saveBlock(id){
    let blockstring=JSON.stringify(this.getBlock(id))
    this.saveBlockString(blockstring,id)
  }
  saveBlockString(blockstring,id){//TODO shift to asynchronous
    fs.appendFileSync(this.blocksfiledescriptor, blockstring+';', 'utf8');
    /*fs.close(this.blocksfiledescriptor, (err) => {
      if (err) throw err;
    });*/
    this.blockposition[id]=this.activeblocksfilelastposition
    this.blocklength[id]=blockstring.length
    this.blockfileid[id]=this.activeblocksfileid
    this.activeblocksfilelastposition+=blockstring.length+1

  }
  lastBlock(){
    return this.getBlock(this.chainlength-1)
  }
  getBlock(id){
    if (id<this.unconfirmedblockid){

        let databuffer = new Buffer.alloc(this.blocklength[id]);
       

	      //fs.read(fd, buffer, offset, length, position, callback)

        if ( fs.readSync(this.blocksfiledescriptor,databuffer, 0, this.blocklength[id],this.blockposition[id]))
            {//console.log('getBlock',databuffer.toString())
              return Utility.parse(databuffer.toString())}
    } else{
      return this.chain[id]
    }
    
  }

  getBlockHeader(id){
    let block=this.getBlock(id)
    if (block==undefined){
       console.log('getBlockHeader error id ',id)
    }
    console.log(block)
   
    let header={
      timestamp:block.timestamp,
      id:block.id,
      previoushash:block.previoushash,
      nonce:block.nonce,
      difficulty:block.difficulty,
      root:block.root,
      hash:block.hash,
      signature:block.signature
    }
    return header
  }
  chainHeaderString(firstblockid){
    let headers=[]
    for(let i=firstblockid;i<this.chainLength();i++){
      headers.push(this.getBlockHeader(i))
    }
    return  JSON.stringify(headers);
  }
//------------------------------------------------------------
  validateHeader(header,previousheader,validationdifficulty){

    
    if ((header.id!==previousheader.id+1)||(header.timestamp<previousheader.timestamp)||(header.previoushash!==previousheader.hash)) {
      console.log('wrong basic info',header.id,previousheader.id,header.timestamp,previousheader.timestamp,header.previoushash,previousheader.hash)
      console.log()
      return false 
    } else if (Utility.computeHash(`${header.timestamp}${header.id}${header.previoushash}${header.nonce}${header.difficulty}${header.root}`).toString()!=header.hash) {
      console.log('wrong hash')
      return false
    } else if (header.difficulty==validationdifficulty) {
	let base =((Math.pow(2,16)-1) *Math.pow(2,232)/header.difficulty).toString(16)
    	let target='0'.repeat(64-base.length)+base    
	if (header.hash.localeCompare(target)>=0){
		

    console.log('inaccurate difficulty')
    return false
	}    
	  
      return true
    }
 
   
  }
//------------------------------------------------------------
validateTransaction(transaction){
  if ((transaction.outputs==undefined)||(transaction.inputs==undefined)||(transaction.signatures==undefined)){
    console.log('INVALID TRANSACTION: every transaction should have inputs signatures and outputs')
    return false
  } else if (Utility.computeHash(`${transaction.version}${transaction.timestamp}${transaction.inputs}${transaction.outputs}${transaction.affix}`).toString()!=transaction.hash){  
    console.log('INVALID TRANSACTION: wrong hash')
    return false
  } else { 

    for (let i=0;i<transaction.signatures.length;i++){
      if (!Utility.verifySignature(transaction.hash,transaction.signatures[i],this.getTransactionOutput(transaction.inputs[i].hash,transaction.inputs[i].id).publickey) ){
            console.log('INVALID TRANSACTION: wrong signature for input',i)
            return false
      }
    }

  } 
    return true
}
//------------------------------------------------------------
  
  updateState(){
    console.log('-----',this.statelastscanedblock)
    while(this.statelastscanedblock<this.chainLength()-this.confirmationlayer){
      this.statelastscanedblock++
      
      let scannedblock=this.getBlock(this.statelastscanedblock)
      for(let i=0;i<scannedblock.transactions.length;i++){
        

        if (scannedblock.transactions[i].hash!=''){
          let processedtransaction =scannedblock.transactions[i]
          for(let j=0;j<scannedblock.transactions[i].outputs.length;j++){
            scannedblock.transactions[i].outputs[j].status='unspent'
        }
        console.log(scannedblock.transactions[i].hash)
        statedb.put(scannedblock.transactions[i].hash,scannedblock.transactions[i],function (err) {
            if (err) {throw err
            console.log('statedb put error',err)
            }
          })
        }
      }
    }
  }
  

//--------------------------------------------------------
calculateTransactionFee(transaction){
  let totaloutput=0
  let totalinput=0
  transaction.outputs.forEach(output => {
    totaloutput+=output.amount
  })

  
let newpromises=[]

transaction.inputs.forEach(input => {
  newpromises[i]=
    new Promise(      
        function(resolve, reject) {
      getTransactionOutput(input.hash,input.id).then(function(value) {
       resolve(value)
    
      })
    });  
})


Promise.all(newpromises).then(function(outputs) {
  console.log(outputs);
  outputs.forEach(output => {      
    if (output !=undefined){
      if (output.status=='unspent'){
        totalinput+=output.amount
      }
    }
  })

});


  return (totalinput-totaloutput)
}
//--------------------------------------------------------
  async getTransactionOutput(hash,id){
    console.log(hash,id)

  let transaction= await this.getTransaction(hash)
  if (transaction!=undefined){
    return transaction.outputs[id]
  } else{
    return 
  }
  }
  
  
  getTransaction(hash){
    //get the mainchain transaction associated with particular hash
    return new Promise(async function(resolve,reject) {// TODO async can be deleted
      try{
      statedb.get(hash,function (err, value) {

          resolve(value)
    

        
      })
    }catch(error) {
      reject()
    }

    })

  }
  //----------------------------------------------------------------
  getConfirmationLayerTransaction(hash){
    let firstblockid=(this.chainLength()-this.confirmationlayer)
    firstblockid=firstblockid<1 ? 1 : firstblockid
    for (let i = firstblockid; i < this.chainLength(); i++) {
      let scannedblock=this.getBlock(wallet.mainassetslastscanedblock)
      for(let j=0;j<scannedblock.transactions.length;j++){
        if (scannedblock.transactions[j].hash==hash){
          return scannedblock.transactions[j]
        }
      }
    }
    return
  }
  //----------------------------------------------------------------
  updateWalletAssets(wallet){
    //console.log('mainassetslastscanedblock',wallet.mainassetslastscanedblock)
    while(wallet.mainassetslastscanedblock<this.chainLength()-this.confirmationlayer){
      wallet.mainassetslastscanedblock++
      //console.log(wallet.mainassetslastscanedblock)
      let scannedblock=this.getBlock(wallet.mainassetslastscanedblock)
      for(let i=0;i<scannedblock.transactions.length;i++){

        for(let j=0;j<scannedblock.transactions[i].outputs.length;j++){
        //console.log(scannedblock.transactions[i].outputs[j])

          if (wallet.ispublickey(scannedblock.transactions[i].outputs[j].publickey)) {
            //addAsset(transaction,assetchain,assetstatus,index)
            wallet.addAsset(scannedblock.transactions[i],j,scannedblock.transactions[i].outputs[j].publickey,'mainchain')
            
          }
        }

        for(let k=0;k<scannedblock.transactions[i].inputs.length;k++){

              
              wallet.removeAsset(scannedblock.transactions[i].inputs[k].hash,scannedblock.transactions[i].inputs[k].id,'mainchain','spent')

          }


      }
    }
    wallet.save()
  }

    

  //-------------------------------------------
  //-------------------------------------------

}

module.exports = Mainchain;

//--------------------------------------------------------
//--------------------------------------------------------
