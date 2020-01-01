const {MAINCHAIN_GENESIS_BLOCK_REWARD,MAINCHAIN_BLOCK_TIME,
    MAINCHAIN_DIFFICULTY_TUNING_INTERVAL,
    MAINCHAIN_REWARD_TUNING_INTERVAL,
    MAINCHAIN_BLOCK_MAX_SEIZE}=require('./defaults')
  
  
const Utility = require('./utility')
const Transaction =require('./transaction')
const Block = require('./block')
const Wallet = require('./wallet')
const Mainchain = require('./mainchain')
  
const AppendableFile = require('./appendablefile')
  
const Jsonfile = require('jsonfile')

const fs = require('fs')
  




const P2PNode=require('./p2pnode.js')



class Maincore extends P2PNode{
    constructor(walletfile,mainchainfolder,channel) {
    super(channel)
    console.log('init maincore ',walletfile,mainchainfolder,channel)
    this.wallet=new Wallet(walletfile)
    this.mainchain=new Mainchain(mainchainfolder)

    this.difficulty=-1
    this.nonce=0
    this.mainchainfolder=mainchainfolder
    this.blockreward=-1
    this.newtransactions=[]
    this.cachedtransactions=[]
    this.generatedtransactions=[]
    this.mining=false
    this.miningstartdate=-1
    this.miningstopdate=-1

    this.miningreward=0

    this.longestchainpeer={chainlength:0}
    
    this.peersvalidity=[]
    let self=this
    
    this.mines=function (){
        if(self.mining){
        //-----------------------------------------------------------
        // mining code starts
        //-----------------------------------------------------------

                

        if (self.newtransactions.length==0){


                //TODO take into account block length

                self.newtransactions.push(new Transaction({inputs:[],outputs:[
                    {publickey:self.wallet.generatepublickey(),amount:self.blockreward}
                ]}))
            
                self.newtransactions[0].generateHash()
            }
    let previousblock=self.mainchain.lastBlock()
    let difficulty=self.difficulty
    let currenttime;
    let base =((Math.pow(2,16)-1) *Math.pow(2,232)/difficulty).toString(16)
    let target='0'.repeat(64-base.length)+base


    let starttime = Date.now();
    let newblock =new Block({
                          timestamp:starttime,
                          id:previousblock.id+1,
                          previoushash:previousblock.hash,
                          nonce:self.nonce,
                          difficulty:difficulty,
                          transactions:self.newtransactions
                      });
                      
    newblock.generateMerkleRoot();


      self.nonce++
      currenttime = Date.now()
      newblock.nonce=self.nonce
      newblock.timestamp=currenttime
      //////////////////////////////////////////////////
      newblock.transactions[0].timestamp=currenttime
      //////////////////////////////////////////////////
      newblock.generateHash()
    //console.log(self.nonce,newblock.hash,target,newblock.hash.localeCompare(target))
               
    if (newblock.hash.localeCompare(target)<0){
    console.log((`blocktime: ${newblock.timestamp-previousblock.timestamp} difficulty: ${newblock.difficulty} blockreward: ${self.blockreward}`))
                console.log('time',newblock.timestamp)
                    
                

                self.mainchain.addBlock(newblock)
                console.log('adding block id:',newblock.id)  

                self.mainchain.updateWalletAssets(self.wallet)
                self.wallet.updateBalance()
                console.log('wallet balance',self.wallet.balance)
                self.sendSwarm('PROPAGATING_MAINCHAINBLOCK;'+JSON.stringify(newblock)+';END;')
                self.synchronize()
                self.miningreward+=self.blockreward//TODO add the reset of the transactions fees
                self.nonce=0
                self.newtransactions=[]
                self.tuningReward()
                if (((self.mainchain.chainLength() % MAINCHAIN_DIFFICULTY_TUNING_INTERVAL) == 0)&&(self.mainchain.chainLength()>1)){
                
                    self.tuningDifficulty()
                }

            }

        //-----------------------------------------------------------
        // mining code ends
        //-----------------------------------------------------------
        }      
    }

    //------------------------------------------------------
    // message handling code begins
    //------------------------------------------------------

    //------------------------------------------------------
    this.handleMessage=function (message,peerinfo){
            //-----------------------
        if (self.peersvalidity[peerinfo.ip]!=false){
            console.log('received message : from peerId',peerinfo.id,'with peerIp',peerinfo.ip,'message length',message.length,message)
            let arg=message.split(';')
            for (let index=0;index<arg.length;index++){

                if (arg[index]=='REQUEST_MAINCHAINLENGTH'){
                    self.sendPeer('REPLY_MAINCHAINLENGTH;'+self.mainchain.chainLength()+';END',peerinfo)
                }
                if (arg[index]=='REQUEST_MAINCHAINHEADERS'){
                    self.sendPeer('REPLY_MAINCHAINHEADERS;'+self.mainchain.chainHeaderString(arg[index+1])+';END',peerinfo)
                    
                }
                if (arg[index]=='REQUEST_MAINCHAINBLOCK'){
                    self.sendPeer('REPLY_MAINCHAINBLOCK;'+JSON.stringify( self.mainchain.getBlock(arg[index+1]))+';END',peerinfo)
                    
                }


                if (arg[index]=='REPLY_MAINCHAINLENGTH'){
                    if ((self.mainchain.chainLength()<arg[index+1])&&(self.longestchainpeer.chainlength<arg[index+1])) {
                        self.longestchainpeer={ chainlength:arg[index+1],
                                                info:peerinfo
                                              }
                                              
                    }
                }
                if ((arg[index]=='REPLY_MAINCHAINHEADERS')&&(self.longestchainpeer.info.ip==peerinfo.ip)){
                        console.log('validating received mainchainheaders')
                        if (!self.validateLongestMainchainHeaders(arg[index+1])){
                            self.peersvalidity[peerinfo.ip]=false
                            self.longestchainpeer={chainlength:0}
                        } else if (self.longestchainpeer.headersfile!=undefined){
                            console.log('***',self.longestchainpeer.chainlength,Utility.parse(self.longestchainpeer.headersfile.getLastItem()).id+1)
                            
                                if (self.longestchainpeer.chainlength<=Utility.parse(self.longestchainpeer.headersfile.getLastItem()).id+1){
                                self.longestchainpeer.syncingblockid=self.mainchain.unconfirmedblockid
                                if (self.longestchainpeer.blocksfile==undefined){
                                    self.longestchainpeer.blocksfile=new AppendableFile(this.mainchainfolder+'/sync/'+this.longestchainpeer.info.id+'BLOCKS');
                                }
                                self.sendPeer('REQUEST_MAINCHAINBLOCK;'+self.longestchainpeer.syncingblockid.toString()+';END', self.longestchainpeer.info)
                            }
                        }
                }
                
                if ((arg[index]=='REPLY_MAINCHAINBLOCK')&&(self.longestchainpeer.info.ip==peerinfo.ip)){
        
                        console.log('validating received mainchainblock')
                        if (!self.validateLongestMainchainBlock(arg[index+1],self.longestchainpeer.syncingblockid)){
 
                            self.peersvalidity[peerinfo.ip]=false
                            self.longestchainpeer={chainlength:0}
                        } else {
                            this.longestchainpeer.blocksfile.addItem(self.longestchainpeer.syncingblockid,arg[index+1])
                            self.longestchainpeer.syncingblockid++
                            
                            if (self.longestchainpeer.syncingblockid<self.longestchainpeer.chainlength)
                                self.sendPeer('REQUEST_MAINCHAINBLOCK;'+self.longestchainpeer.syncingblockid.toString()+';END', self.longestchainpeer.info)
                            else
                                {
                                    for (let syncid = self.mainchain.unconfirmedblockid; syncid < self.longestchainpeer.chainlength; syncid++) {
                                        self.mainchain.saveBlockString(self.longestchainpeer.blocksfile.getItem(syncid),syncid)
                                    }
                                    console.log('Mainchain sync complete')
                                }

                        }
                }
                //------------------------------------------
                

                if (arg[index]=='PROPAGATING_MAINCHAINBLOCK'){
        
  
                        if (!self.validateMainchainBlock(arg[index+1])){

                            self.peersvalidity[peerinfo.ip]=false
                            self.longestchainpeer={chainlength:0}
                        } else {
                                        
                                        self.mainchain.addBlock(Utility.parse(arg[index+1]))
                                        console.log('Propagating block added')
                                        self.relaySwarm(arg[index+1],peerinfo)
                                }

                    
                }

            //----------------------------------------------
            //----------------------------------------------
            }

        }
    }
    //------------------------------------------------------
    // message handling code ends
    //------------------------------------------------------
    }
//-------------------------------------------------------------------
//-------------------------------------------------------------------

validateMainchainBlock(mainchainblockstring){
    console.log('validating mainchain block',mainchainblockstring)
    let block=Utility.parse(mainchainblockstring)
    if (!this.mainchain.validateHeader(block,this.mainchain.lastBlock()))
    {
        return false
    }
    
    if (!this.validateMainchainBlockTransactions(block,this.blockreward))
    {
        return false
    }

    return true
}
validateLongestMainchainBlock(mainchainblockstring,id){
    console.log('validating mainchain block',mainchainblockstring)
    let block=Utility.parse(mainchainblockstring)
    let header=Utility.parse(this.longestchainpeer.headersfile.getItem(id))
    if ((block.timestamp!=header.timestamp)||(block.id!=header.id)||(block.id!=id)||(block.previoushash!=header.previoushash)||
    (block.nonce!=header.nonce)||(block.difficulty!=header.difficulty)||(block.root!=header.root)||
    (block.hash!=header.hash))
    {
        console.log('INVALID BLOCK: unexpected block header')
        return false
    }
       
    //----

        let blockreward=parseInt(MAINCHAIN_GENESIS_BLOCK_REWARD/Math.pow(2,parseInt( block.id / MAINCHAIN_REWARD_TUNING_INTERVAL)));
        if (!this.validateMainchainBlockTransactions(block,blockreward))
            return false

    //----
    return true
}
validateMainchainBlockTransactions(block,blockreward){
    if ((block.transactions==undefined)||(block.transactions.length==0))     
        {
            console.log('INVALID BLOCK: block should have at least one transaction')
            return false
        }
        let maxreward=blockreward
    if (block.transactions[0].outputs!=undefined)
        if (block.transactions[0].outputs[0].amount>maxreward)
        {
            console.log('INVALID BLOCK: max block reward exceeded - maxreward',maxreward,'block reward',block.transactions[0].outputs[0].amount)
            return false
        }
    
    let hashes=[]
    for (let i=0;i<block.transactions.length;i++){
        if (block.transactions[i].hash==undefined)
        {
            console.log('INVALID BLOCK: max block reward exceeded')
            return false
        }
        else
            hashes.push(block.transactions[i].hash)
    }
    if (block.transactions.length>1){
        if (block.transactions[block.transactions.length-1]==block.transactions[block.transactions.length-2])
        {
            console.log('INVALID BLOCK: duplicate transaction')
            return false
        }
    }
        

      
    let root = Utility.computeFastMerkleRoot(hashes);
    if (root!=block.root)
    {
        console.log('INVALID BLOCK: invalid merkleroot')
        return false
    }

    for (let i=1;i<block.transactions.length;i++){
        if (!this.mainchain.validateTransaction(block.transactions[i]))
            return false
    }

    //----
    return true
}
validateLongestMainchainHeaders(mainchainheader){
    let headers=Utility.parse(mainchainheader)


    for (let i=0;i<headers.length;i++){
        let tmpdifficulty=this.getSupposedBlockHeader(headers[i].id-1).difficulty
        if ((((headers[i].id) % MAINCHAIN_DIFFICULTY_TUNING_INTERVAL) == 0)&&((headers[i].id)>1)){


                let averageblocktime = 0
                

                let l = headers[i].id
                for (let k = l-MAINCHAIN_DIFFICULTY_TUNING_INTERVAL+1; k < l; k++) {
                        averageblocktime += this.getSupposedBlockHeader(k).timestamp-this.getSupposedBlockHeader(k-1).timestamp
                
                    }
                    averageblocktime /= MAINCHAIN_DIFFICULTY_TUNING_INTERVAL;
            
                    //let tmpdeltadifficulty=Math.round((MAINCHAIN_BLOCK_TIME-averageblocktime)/averageblocktime);
                    //tmpdeltadifficulty=Math.min(tmpdeltadifficulty,4)
            
                    //tmpdifficulty+=tmpdeltadifficulty*tmpdifficulty
                  tmpdifficulty=parseInt(Math.max(Math.min(MAINCHAIN_BLOCK_TIME/averageblocktime,4),1/4)*tmpdifficulty)
                    
                    tmpdifficulty=Math.max(tmpdifficulty,1)
 
            
                
                } 
                
                
                if (tmpdifficulty!==headers[i].difficulty)
                {
                    console.log('longest chain headers difficulty is corrupt header id',headers[i].id,tmpdifficulty,headers[i].difficulty)
                    return false
                }


        
        
        if (this.longestchainpeer.headersfile==undefined){
            this.longestchainpeer.headersfile=new AppendableFile(this.mainchainfolder+'/sync/'+this.longestchainpeer.info.id+'HEADERS');
        }

            console.log('validating header',headers[i].id)
            if (!this.mainchain.validateHeader(headers[i],this.getSupposedBlockHeader(headers[i].id-1))){
                console.log('longest chain headers is corrupt')

                return false
            } else {
                this.longestchainpeer.headersfile.addItem(headers[i].id,JSON.stringify(headers[i]))

            }


        //-------------------------------------------------------------------

        //-------------------------------------------------------------------
    }
    

    

    return true
}
//-------------------------------------------------------------------

getLongestMainchainHeaders(){
    // TODO only when many mainchain are available
        this.sendPeer('REQUEST_MAINCHAINHEADERS;'+this.mainchain.unconfirmedblockid.toString()+';END', this.longestchainpeer.info)
}
//-------------------------------------------------------------------
getSupposedBlockHeader(id){
    console.log('getSupposedBlockHeader',id)
    if (id<this.mainchain.unconfirmedblockid){
        return this.mainchain.getBlockHeader(id)
    }else{
        return Utility.parse(this.longestchainpeer.headersfile.getItem(id))
    }

}
//-------------------------------------------------------------------

//-------------------------------------------------------------------
//-------------------------------------------------------------------
    load(){
        this.tuningDifficulty()
        this.tuningReward()

        this.start()
    }
//--------------------------------------------------------------------
setupTransaction(arg){
    let newtransaction=this.wallet.generateTransaction(arg.amount,arg.publickey,0)
    console.log(newtransaction)
    this.generatedtransactions.push({
        status:'broadcasting',
        broadcastdate:-1,
        transaction:newtransaction
    })
}
//--------------------------------------------------------------------

tuningDifficulty() {

    if (((this.mainchain.chainLength() % MAINCHAIN_DIFFICULTY_TUNING_INTERVAL) != 0)||(this.mainchain.chainLength()<1)||(this.difficulty==-1)){
                
        this.difficulty=this.mainchain.lastBlock().difficulty
        return
    }

      let averageblocktime = 0


      let j = this.mainchain.chainLength()
      for (let i = j-MAINCHAIN_DIFFICULTY_TUNING_INTERVAL+1; i < j; i++) {
        averageblocktime += this.mainchain.getBlock(i).timestamp-this.mainchain.getBlock(i-1).timestamp
      }
      averageblocktime /= MAINCHAIN_DIFFICULTY_TUNING_INTERVAL
      //let deltadifficulty=Math.round((MAINCHAIN_BLOCK_TIME-averageblocktime)/averageblocktime)
      this.difficulty=parseInt(Math.max(Math.min(MAINCHAIN_BLOCK_TIME/averageblocktime,4),1/4)*this.difficulty)
      
      this.difficulty=Math.max(this.difficulty,1)
      console.log((`averageblocktime: ${averageblocktime} delta: ${deltadifficulty} difficulty: ${this.difficulty} blockreward: ${this.blockreward}`))

    
  }

  tuningReward(){
    if (((this.mainchain.chainLength() % MAINCHAIN_REWARD_TUNING_INTERVAL) == 0)||(this.blockreward==-1)){
      this.blockreward=parseInt(MAINCHAIN_GENESIS_BLOCK_REWARD/Math.pow(2, parseInt(this.mainchain.chainLength() / MAINCHAIN_REWARD_TUNING_INTERVAL)));
      // let blockreward=parseInt(MAINCHAIN_GENESIS_BLOCK_REWARD/Math.pow(2,parseInt( block.id / MAINCHAIN_REWARD_TUNING_INTERVAL)));
    }
  }

  synchronize(){
    if ((this.mainchain.chainLength() % (this.mainchain.confirmationlayer*2)) == 0){
        console.log('saving mainchain')
        this.mainchain.save()
    }

  }
//--------------------------------------------------------------------
//--------------------------------------------------------------------
}



module.exports=Maincore
