const {MAINCHAIN_GENESIS_BLOCK_REWARD,MAINCHAIN_BLOCK_TIME,
    MAINCHAIN_DIFFICULTY_TUNING_INTERVAL,
    MAINCHAIN_REWARD_TUNING_INTERVAL,
    MAINCHAIN_BLOCK_MAX_SEIZE}=require('./defaults');
  
  
const Utility = require('./utility');
const Transaction =require('./transaction')
const Block = require('./block');
const Wallet = require('./wallet');
const Mainchain = require('./mainchain');
  
//const AppendableFile = require('./appendablefile');
  
//const Jsonfile = require('jsonfile')
//const Bson = require('bson');
//const fs = require('fs');

let mainchain=new Mainchain('./mainchain');
console.log(mainchain.getBlock(1).transactions[0])
