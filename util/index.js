const EC = require('elliptic').ec // EC stands for Elliptic Criptogrphy, we need only
                                  // the 'ec' class, not the full library
const cryptoHash = require('../util/crypto-hash.js')

const ec = new EC('secp256k1')

const verifySignature = ( {publicKey, data, signature} ) => {
   //'EC' contains a signature verification method, we are going to wratp OUR
   // verifySignature method around that of 'EC'
   // EC's verification method is available only within an instacne of a Key object
   // So we are going to create a such a Key object, a temporary one, based on
   // the public key.
   const tmpKeyPair = ec.keyFromPublic( // create temporary Key Pair
         publicKey,
         'hex' // a necessary arg for ec.keyFromPublic. It's 'hex', not other, since
               // this is how we created the public key in the Wallet's constructor
      )
      // 1. when verifying, must do cryptoHash(), like in Wallet's 'sign' method 
      // 2. tmpKeyPair.verify returns a boolean 
      return tmpKeyPair.verify( cryptoHash( data ), signature )
}

module.exports = { ec, verifySignature, cryptoHash }