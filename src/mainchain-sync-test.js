//synchronizing test
/*

const P2PNode=require('./p2pnode.js')


P2PNode.prototype.handleMessage=function (data,peerId){
    let messages=data.toString().split(';')
    messages.forEach(function(message) {
        console.log(element);*
        console.log('received message :',message,'from peerId',peerId)
        let arg=message.split(' ')
        if (message==='request mainchain length'){
            self.sendPeer('reply mainchain length '+self.mainchain.chainLength(),peerId)
        }
        if (arg[0]==='reply'){
            if (arg[1]==='mainchain'){
                if (arg[2]==='length'){
            //self.sendPeer('reply mainchain length '+self.mainchain.chainLength(),peerId)
                console.log()
                }
            }
        }

      });

    //-----------------------------------------------
    //-----------------------------------------------

}
P2PNode.prototype.mines=function mines (){
  console.log('mining coolo')
  
  }

const p2pnode=new P2PNode('globatio-mainchain')


p2pnode.start()*/

const Utility = require('./utility');
const Maincore=require('./maincore.js')
var maincore=new Maincore('./wallet/wallet16','./mainchain300','globatio-mainchain')
maincore.load()


Utility.cleanTmpDirectory('./mainchain300'+'/sync')

/*
setTimeout(function (){
  maincore.sendSwarm('REQUEST_MAINCHAINLENGTH;END;')
  //console.log(core)
  //console.log('confirmation layer',core.maincore)
}, 1000);

*/


  setTimeout(function (){
    maincore.sendSwarm('REQUEST_MAINCHAINLENGTH;END;')
    //console.log('confirmation layer',core.maincore)
  }, 1000);
  setTimeout(function (){
    console.log('longest chain peer',maincore.longestchainpeer)
  }, 5000);
  
  setTimeout(function (){
    maincore.getLongestMainchainHeaders()
  }, 10000);


//-----------------------
/*
  setTimeout(function (){
    core.addLongestMainchainHeaders()
    
  }, 20000);*/
