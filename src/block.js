const Utility = require('./utility');
const Transaction = require('./transaction');

class Block {
  constructor(parameters) {
    this.timestamp=parameters.timestamp
    this.id=parameters.id
    this.previoushash=parameters.previoushash
    this.nonce=parameters.nonce
    this.difficulty=parameters.difficulty
    this.root=''
    this.hash = '';
    this.transactions = parameters.transactions;// transactions[0] is a create assets transaction
    //this.transactions.outputs=parameters.transactions.outputs;
  }

  generateHash(){
    this.hash= Utility.computeHash(`${this.timestamp}${this.id}${this.previoushash}${this.nonce}${this.difficulty}${this.root}`).toString();
    return
  }
  generateMerkleRoot() {
    const hashes = this.transactions.map(transaction =>
      transaction.hash
    );
    this.root = Utility.computeFastMerkleRoot(hashes);
    //console.log('root',this.root,hashes)

  }

  static returnGenesis() {
    let genesistransaction=new Transaction({outputs:[{affix:'The Guardian 15/Aug/2017 IMF warns China over dangerous growth in debt'}]})
    genesistransaction.generateHash()

    let genesisblock= new this({
                        timestamp:1502820001120,
                        id:0,
                        previoushash:'',
                        nonce:0,
                        difficulty:1,
                        root:'',
                        hash:'',
                        transactions:[genesistransaction]
                    })
    genesisblock.generateMerkleRoot();
    genesisblock.generateHash()
    console.log('Genesis date',new Date(genesisblock.timestamp))

    return genesisblock
  }
  
}
module.exports = Block;
