const fs = require('fs')
const Jsonfile = require('jsonfile')
const path = require('path');

const settingsfilepath=path.resolve(__dirname,'../usersettings')

class Settings {
    constructor() {
        //this.settingsfilepath=settingsfile
    if ((settingsfilepath != null)&&(fs.existsSync(settingsfilepath ))){
        let storedsettings=Jsonfile.readFileSync(settingsfilepath)

        this.walletfilepath=storedsettings.walletfilepath

      } else {

        //this.generateWalletFilePath()
        this.walletfilepath=''


      }
    }

save(){

    Jsonfile.writeFileSync(settingsfilepath,this) 
}

}
module.exports = Settings;