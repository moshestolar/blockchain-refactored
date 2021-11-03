const uuid = require('uuid/v1') // There are quite some different algorithms in uuid
                                // for generating the unique id. No reasoning has been
                                // given to explain why verision 1, /v1, will be used
const { verifySignature } = require('../util')
const { REWARD_INPUT, MINING_REWARD } = require('../config')

class Transaction {
   constructor({ senderWallet, recipient, amount, outputMap, input }) {
         // Attention: arguments 'outputMap' and 'input' are optional!
      this.id = uuid() // the v1 uuid function is timestamp-based
      this.outputMap = outputMap || this.createOutputMap({senderWallet, recipient, amount})
      this.input = input || this.createInput({senderWallet, outputMap:this.outputMap})
   }

   createOutputMap({senderWallet, recipient, amount}) {
      const outputMap = {}
      outputMap[recipient] = amount           // only money key-value pairs in this object
      outputMap[senderWallet.publicKey] = senderWallet.balance - amount
         // IMPORTANT:  for some funny reason, the sum that remains after a transaction
         // is refered to as:  transaction.outputMap[senderWallet.publicKey]
      return outputMap
   }
   createInput({senderWallet,outputMap}) {
      return { 
         timestamp: Date.now(),
         amount: senderWallet.balance,       // the only money key-value pair in this object
         address: senderWallet.publicKey,
         signature: senderWallet.sign(outputMap)
      }
   }
   static validTransaction(transaction) {
      // The key-value pairs on the Transaction objects are:
      //  sender's balance before transaction: on key  transaction.input.amount
      //  sender's balance after transaction:  on key  transaction.outputMap[recipient]
      //  transaction amount:                  on key  transaction.outputMap[senderWallet.publicKey]

      // The long way to do it:
      // const array = Object.values(transaction.outputMap)
      // console.log('Sender had:',transaction.input.amount,', after sending', array[0],
      //             'sender still has', array[1] )
      // A better way to do it:
      const sumOfSentAndRemainder = 
         Object.values(transaction.outputMap).reduce( (sum,value) => (sum + value), 0 ) 
         // note:  the 2nd argument in 'reduce', 0, is to ensure initial 'sum' is 0
      // console.log('Sender had',transaction.input.amount,':: sent+remainder is', sumOfSentAndRemainder)

      if( sumOfSentAndRemainder !== transaction.input.amount ) {
         console.error(`ERROR: Invalid transaction from ${transaction.input.address}`)
         return false
      }

      if( !verifySignature({  publicKey: transaction.input.address,
                              data: transaction.outputMap,
                              signature: transaction.input.signature
                          }) ) {
         console.error(`ERROR: Transaction from ${transaction.input.address} fails signature verification`)
         return false
      }
      return true
      // David did this as follows:
      // 1. in the beginning of this function David added a destructure line:
      //    const { input: { address, amount, signature }, outputMap } = transaction
      // 2. the arguments in the verifySignature call are now
      //    verifySignature({ publickey: address, data: outputMap, signature })
   }
   update({senderWallet, recipient, amount}) {

      if( amount > this.outputMap[senderWallet.publicKey] ) {
         throw new Error('(update) Amount exceeds balance')
      }
      
      if( !this.outputMap[recipient] ) {    // Does key [recipient] exist in the object?
         this.outputMap[recipient] = amount  // NO, create new key-value pair
      } else {
         this.outputMap[recipient] += amount // YES, add new value pair
      }
      this.outputMap[senderWallet.publicKey] -= amount

      this.input = this.createInput({senderWallet, outputMap: this.outputMap})
   }
   // I considered two approaches:
   //   1. return wallet.minerWallet.createTransaction({ recipient:REWARD_INPUT, amount:MINING_REWARD })
   //   2. return new Transaction({senderWallet:minerWallet, recipient:REWARD_INPUT, amount:MINING_REWARD })
   // It appears both are ok.  However, since the Reward Transaction has special values in its
   //   input/outputMap fields, providing extra parameters will be done by expanding the list of 
   //   arguments of the Transaction class.  Therefore, approach (2) will be adopted.
   //
   static rewardTransaction({minerWallet}) {
      return new this({// might as well have written 'return new Transaction({' here!
         input: REWARD_INPUT,
         outputMap: { [minerWallet.publicKey]: MINING_REWARD }
      })
   }
}

module.exports = Transaction