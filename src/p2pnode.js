const crypto = require('crypto')
const Swarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')
const getPort = require('get-port')

const {MAINCHAIN_MESSAGE_MAX_SEIZE}=require('./defaults');

let nbconnection = 0
const peers = {}



const instanceid = crypto.randomBytes(32)
console.log('Your identity: ' + instanceid.toString('hex'))


var instanceconfig = defaults({
  id: instanceid
})
var swarm = Swarm(instanceconfig)

//console.log(instanceconfig)

class P2PNode {
constructor(channel) {
  this.channel=channel;

}
async start(){

    const self=this
    setInterval( this.mines , 10);

    const port = await getPort()

    swarm.listen(port)
    console.log('Connecting to channel:',this.channel)
    console.log('Listening to port: ',port)

  
    swarm.join(this.channel)

    swarm.on('connection', function(connection, info) {

      let swarmsequence

      const peerid = info.id.toString('hex')
      console.log('Connected to peer: id',peerid,'ip',connection.remoteAddress)
      if (info.initiator) {
        try {
          connection.setKeepAlive(true, 1000)
        } catch (exception) {
          console.log('exception', exception)
        }
      }

      connection.on('data',function(data){
        if (peers[peerid].data.length<MAINCHAIN_MESSAGE_MAX_SEIZE)
              peers[peerid].data += data
            else
            {
              console.log('ERROR: peer data MESSAGE MAX SEIZE EXCEEDED',peers[peerid].data.length,MAINCHAIN_MESSAGE_MAX_SEIZE)
              peers[peerid].data =''
            }
            
        let str= peers[peerid].data
        while(str.indexOf('END')>=0){
          let message=str.substring(0,str.indexOf('END'))
          str=str.substring(str.indexOf('END')+3,str.length)
          if (message!=''){

          self.handleMessage(message,{id:peerid,ip:peers[peerid].connection.remoteAddress})
          //console.log(data.length,peerid,peers[peerid].connection.remoteAddress)
          }
          }
          peers[peerid].data=str

      }) 
      //------------------------------
    
      connection.on('close', function() {
        console.log('Connection closed with peer: id ',peerid,' ip ',connection.remoteAddress)
      })
      /*
      connection.on('close', () => {
        // peer disconnection
        //console.log(`Connection ${seq} closed, peer id: ${peerid}`)
        // removing the last peer
        if (peers[peerid].sequence === swarmsequence) {
          delete peers[peerid]
        }
      })*/

      //------------------------------
      if (!peers[peerid]) {
        peers[peerid] = {}
      }
      peers[peerid].data=''
      peers[peerid].connection = connection
      peers[peerid].sequence = swarmsequence
      swarmsequence++

    })   



}

//----------------------------------------

sendPeer(message,peerinfo){
if (peerinfo==undefined){
  return
}
if (peers[peerinfo.id]!=undefined){
console.log('---------> sendPeer',message,peerinfo.id)
  peers[peerinfo.id].connection.write(message)
}

  
}
//----------------------------------------
sendSwarm(text){
//console.log('sendSwarm',text)
    for (let id in peers) {
      peers[id].connection.write(text)
    }
}
//----------------------------------------

relaySwarm(text,peerinfo){
console.log('sendRelay',text,peerinfo.id)
   // Broadcast to all peers except the peer from which the message come from
    for (let id in peers) {
    	if (id!=peerinfo.id) {
      		peers[id].connection.write(text)
    	}
    }
}


}
module.exports=P2PNode

