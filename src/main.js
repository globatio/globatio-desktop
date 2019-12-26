const {app, BrowserWindow} = require('electron')
const path = require('path')

let mainWindow

const {MAINCHAIN_BLOCK_TIME}=require('./defaults');

const Core=require('./core.js')
let core=new Core()

core.load()





const { ipcMain } = require('electron')
ipcMain.on('start-mining-request', (event, arg) => {
  console.log('miner starting') // prints "ping"
  core.startMining()
  //event.reply('asynchronous-reply', 'pong')
})

ipcMain.on('stop-mining-request', (event, arg) => {
  console.log('miner stopping') // prints "ping"
  core.stopMining()
  //event.reply('asynchronous-reply', 'pong')
})

ipcMain.on('get-mining-information-request', (event,arg) => {
  //console.log('miner stopping') // prints "ping"
  //core.stopMining()
  let duration
  let durationstring
  if (core.maincore.mining){
    duration=Date.now()-core.maincore.miningstartdate
  }else{
    duration=core.maincore.miningstopdate-core.maincore.miningstartdate
  }
  if (duration<1000){
    durationstring=duration+' miliseconds'
  } else if (duration<60000) {
    durationstring=parseInt(duration/1000)+' seconds'
  }else if (duration<60*60000) {
    durationstring=parseInt(duration/1000/60)+' minutes'
  }else {
    durationstring=parseInt(duration/1000/60/60)+' hours'
  }


  let mininginformation={
    miningstatus:core.maincore.mining,
    duration:durationstring,
    miningreward:core.maincore.miningreward,
    walletbalance:core.maincore.wallet.balance
  }
  event.returnValue = mininginformation
  //event.reply('asynchronous-get-mining-information-reply', mininginformation)
})


ipcMain.on('return-wallet-file-request', (event, arg) => {
  //console.log('Setting file wallet',arg) // prints "ping"
  event.returnValue = core.maincore.wallet.filepath
  //event.reply('asynchronous-return-wallet-file-reply', core.settings.walletfilepath)
})

ipcMain.on('set-wallet-file-request', (event, arg) => {

  const {dialog} = require('electron')




  let walletfile=dialog.showOpenDialog({
    title: "Choose wallet", 
    defaultPath: core.settings.walletfilepath, // Default Path 
          properties: ['openFile']
        })/*.then(result => {
          event.returnValue =result.filePaths[0]
          //document.getElementById("wallet-file-location-id").value=result.filePaths[0]
          //ipcRenderer.sendSync('asynchronous-set-wallet-file-request', result.filePaths[0])
          ipcRenderer.on('asynchronous-set-wallet-file-reply', (event, arg) => {
              //console.log('wallet file opened',arg) // prints "pong"
              document.getElementById("wallet-file-location-id").value= arg
            })
            //console.log('wallet file opened', result.filePaths[0]) // prints "pong"
        }).catch(err => {
          console.log(err)
        })*/
  //console.log(path)
  //console.log('test')




      console.log('Setting file wallet',walletfile[0]) 
      if (walletfile[0]!=null){
        //core.settings.walletfilepath=arg
        core.setWalletFile(walletfile[0])
      }
      //event.reply('asynchronous-set-wallet-file-reply', core.settings.walletfilepath)
      console.log(core.settings.walletfilepath)
      event.returnValue =walletfile[0]
})

ipcMain.on('generate-wallet-file-request', (event, arg) => {
  console.log('Generating file wallet') // prints "ping"
  core.generateWalletFile()

  //event.reply('asynchronous-generate-wallet-file-reply', core.settings.walletfilepath)
  event.returnValue =core.settings.walletfilepath
})

ipcMain.on('setup-transaction-request', (event, arg) => {
  console.log('Setup transaction to ',arg.publickey,'amount',arg.amount) // prints "ping"
  core.setupTransaction(arg)

  //core.storeWallet()
  //event.reply('asynchronous-generate-wallet-file-reply', core.settings.walletfilepath)

})



//---------------------------------------------------
function createWindow () {

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    icon:'./icons/logo.png',
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js')
      nodeIntegration: true
    }
  })
  mainWindow.setMenuBarVisibility(false)
  mainWindow.loadFile('index.html')

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}
//---------------------------------------------------
app.on('ready', createWindow)

app.on('window-all-closed', function () {
  console.log('App closing')
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})
