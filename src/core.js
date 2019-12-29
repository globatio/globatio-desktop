const fs = require('fs');
const path = require('path');

const Jsonfile = require('jsonfile')

const Settings=require('./settings.js')

const Maincore=require('./maincore.js')

const Wallet = require('./wallet');





class Core {
    constructor() {
        this.settings= new Settings()
        this.maincore=new Maincore(this.settings.walletfilepath,path.resolve(__dirname,'../mainchain'),'globatio-mainchain')

    }
load(){
  
    this.maincore.load()
    this.maincore.mainchain.updateWalletAssets(this.maincore.wallet)
    this.maincore.wallet.updateBalance()
    console.log('Wallet balance',this.maincore.wallet.balance)
    this.settings.walletfilepath=this.maincore.wallet.filepath
    this.storeSettings()

   
}
startMining(){
    //console.log('start')
    this.maincore.mining=true
    this.maincore.miningstartdate=Date.now()
    this.maincore.wallet.storeWallet(this.settings.walletfilepath)
}
stopMining(){
    this.maincore.mining=false
    this.maincore.miningstopdate=Date.now()
    this.maincore.wallet.storeWallet(this.settings.walletfilepath)
}
setupTransaction(arg){
    this.maincore.setupTransaction(arg)
}
storeWallet(){
    this.maincore.wallet.storeWallet(this.settings.walletfilepath)
}
storeSettings(){
    this.settings.save()
}
setWalletFile(walletfilepath){
    this.storeWallet()
    this.settings.walletfilepath=walletfilepath
    this.storeSettings()
    this.maincore.wallet=new Wallet(walletfilepath)
    console.log('Wallet file path:',this.maincore.wallet.filepath)
    this.maincore.wallet.updateBalance()
    console.log('Wallet balance:',this.maincore.wallet.balance)
    
    
}
generateWalletFile(){
    this.maincore.wallet=new Wallet()
    this.settings.walletfilepath=this.maincore.wallet.filepath
    this.storeSettings()
}



}
module.exports = Core;
