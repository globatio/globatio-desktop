const Utility = require('./utility');
const { TRANSACTION_VERSION } = require('./defaults');

class Transaction {
  constructor(parameters) {
    this.version=TRANSACTION_VERSION,
    this.timestamp=Date.now(),
    this.inputs=parameters.inputs,
    this.outputs=parameters.outputs,
    this.hash='',
    this.signatures=[]
  }
  generateHash(){
    this.hash= Utility.computeHash(`${this.version}${this.timestamp}${this.inputs}${this.outputs}`).toString();
  }

}
module.exports = Transaction;