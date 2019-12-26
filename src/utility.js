//--------------------------------------
var merkle = require('merkle-lib')
var fastRoot = require('merkle-lib/fastRoot')
const secp256k1 = require('secp256k1')
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
//--------------------------------------
class Utility {
  static generateKeyPair() {
	//return ec.genKeyPair();
	//generate privKey
	//---------------------------------------

	let privKey
	do {
	  privKey = crypto.randomBytes(32)
	} while (!secp256k1.privateKeyVerify(privKey))
 
	// get the public key in a compressed format
	const pubKey = secp256k1.publicKeyCreate(privKey)
	return {privatekey:privKey.toString('hex'),publickey:pubKey.toString('hex')}

  }


  static computeFastMerkleRoot(hashes){
    hashes.map(x => new Buffer.from(x, 'hex'))
    return fastRoot(hashes, SHA256).toString('hex')
  }
  static computeHash(data) {
      return SHA256(SHA256(JSON.stringify(data)).toString('hex')).toString('hex')
  }
  static sign(message, privatekey) {
    return secp256k1.sign(Buffer.from(message, "hex"), Buffer.from(privatekey, "hex")).signature.toString('hex')
  }
  static verifySignature(message, signature, publickey) {
	return secp256k1.verify(Buffer.from(message, "hex"), Buffer.from(signature, "hex"), Buffer.from(publickey, "hex"))
  }

  static cleanTmpDirectory(tmpdirectory){
    //let tmpdirectory='./tmp'
    fs.readdir(tmpdirectory, (err, elements) => {
        if (err) {
                console.log('Cleaning error :',err)
                throw err
                }
 
	elements.forEach(element =>{
          fs.unlink(path.join(tmpdirectory, element), err => {
            if (err) {
                console.log('Cleaning error :',err)
                throw err
                }
          })
        })
      })
  }
  static parse(txt){
    try {
      return JSON.parse(txt)
    } catch (error) {
      console.log('PARSING ERROR:',txt)
    }
  }
}

module.exports = Utility;

function SHA256 (data) {
  return crypto.createHash('sha256').update(data).digest()
}