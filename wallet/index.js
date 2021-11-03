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
      // A wallets amount of currency in a blockchain is seen in the most recently mined
      // block that contains a transaction conducted by this wallet.
      // The wallets amount of currency prior to conducting this transaction is 
      // the transaction's 'input.amount' field. Find this transaction.
      // Note the amount of currency the wallet had prior to conducting it, then 
      // add all the money the wallet received from other peers afterwards and 
      // subtract all the money the wallet donated to other peers afterwards.
      
      let examinePrevBlock = true
      let received = 0
      let donated = 0
      let initBalance = STARTING_BALANCE // such init is only for the case a wallet does not appear in the blockchain at all

      for( let i=chain.length-1; i>0; i-- ) {   // examine blocks, from last to first
         const block = chain[i]
         
         for( let t of block.data ) {           // examine every transaction of the block 
            Object.keys(t.outputMap).forEach(trKey => {  // examine every transfer of the outputMap of the transaction 

               // console.log(`key=${trKey}:  value=${t.outputMap[trKey]}`) -- dump every transfer key-value pair
               // this prints lines like this:  'trKey':  value
               if( (trKey!==address)&&(t.input.address===address) ) {
                  // someone(trKey), not me(I am 'address'), is getting 'value' from me(t.input.address is me, 'address')
                  donated += t.outputMap[trKey]
                  initBalance = t.input.amount  // these two lines might happen to run repeatedly - no worry!
                  examinePrevBlock = false      //
               } else if ( (trKey===address)&&(t.input.address!==address) ) {
                  // someone(trKey), this someone being *me*(I am 'address'), is getting 'value' not from me(t.input.address is not me, I am 'address')
                  received += t.outputMap[trKey]
               }
            })
         }

         if( !examinePrevBlock ) break
      }   
      //console.log( 'initBalance + received - donated', initBalance, received, donated )
      return initBalance + received - donated
   }
}

module.exports = Wallet