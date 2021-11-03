const { STARTING_BALANCE } = require('../config.js')
const { ec, cryptoHash } = require('../util/index.js') // '/index.js' is not really necessary
const Transaction = require('./transaction')

class Wallet {
   constructor() {
      this.balance = STARTING_BALANCE

      this.keyPair = ec.genKeyPair()  
      //const keyPair = ec.genKeyPair()  
         // can't remain 'const': we'll be calling functions on the keyPair object,
         // - like in Wallet.sign(), - from beyond the scope of the constructor

      //this.publicKey = 0 // {"publicKey":0} passes test toHaveProperty as well
      this.publicKey = this.keyPair.getPublic().encode('hex')
         // *** Applying the 'encode' method on the publicKey ***
         // getPublic() renders a point on the elliptic curve - x, y, etc, (as might
         // be seen in a console.log(publicKey) print) - however, we need some 
         // single value to serve as the 'address' for the publicKey. Accordingly,
         // transform the pulicKey to its hex form, this is done by applying EC's 
         // method 'encode'.
   }
   sign( data ) {
      return this.keyPair.sign(cryptoHash(data))
   }
   createTransaction({ recipient, amount, chain }) {
      if( chain ) {
         this.balance = Wallet.calculateBalance({chain, address: this.publicKey})
      }
      if( amount > this.balance ) {
         throw new Error('Amount exceeds balance') // create an instance of class Error
      }
      return new Transaction({senderWallet:this, recipient, amount})
   }

   static calculateBalance({ chain, address }) { 
/*
      let hasConductedTransaction = false;
      let outputsTotal = 0;
  
      for (let i=chain.length-1; i>0; i--) {
         const block = chain[i];
  
         for (let transaction of block.data) {
            if (transaction.input.address === address) {
               hasConductedTransaction = true;
            }
  
            const addressOutput = transaction.outputMap[address];
  
            if (addressOutput) {
               outputsTotal = outputsTotal + addressOutput;
            }
         }
  
         if (hasConductedTransaction) {
            break;
         }
      }
      return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
   }
*/  
      let ret = STARTING_BALANCE
      let gotAfterGave = 0 // sum received: in last "gave" transaction (if any) + 
                           //               in all subsequent blocks (if any)
      let doAbort = false  // continue to examine more blocks

      for( let i=chain.length-1; i>0; i-- ) {   // examine blocks, from last to first
         const block = chain[i]
         
         for( let t of block.data ) {           // examine every transaction of a block - it can be
                                                // either "I'm giving", or "I'm getting", or neither
            if( t.input.address===address ) {   // "I'm giving" 
               ret = t.outputMap[address]       //    set the balance remained after giving
               doAbort = true                   //    and do not examine any more blocks
            } else if ( t.outputMap[address] ) {// "I'm getting"
               gotAfterGave += t.outputMap[address]
            }
         }
         if( doAbort ) break
      }   
      return ret + gotAfterGave
   }
}

module.exports = Wallet