const Transaction = require('./transaction')

class TransactionPool {
   constructor() {
      this.transactionMap = {}
   }

   setTransaction(transaction) {
      this.transactionMap[transaction.id] = transaction
         // The benefit of a key-value map as opposite to an array is demonstrated:
         // the above (a) adds a new key (+value) in case it is a new key  AND
         //           (b) replaces the value for a key that is already in the map
   }

   setMap(transactionMap) { //for app instances on new nodes to sync with the root node
      this.transactionMap = transactionMap
   }

   existingTransaction({ inputAddress }) {
      const allTransactions = Object.values(this.transactionMap)

      return allTransactions
               .find(transaction => transaction.input.address === inputAddress)
   }

   validTransactions() {
      let returnArray = []

      // From StackOverflow:  Object.keys(obj).forEach(e => console.log(`key=${e}  value=${obj[e]}`));
      Object.keys(this.transactionMap).forEach( k => { 

         if( Transaction.validTransaction( this.transactionMap[k] ) ) {
            returnArray.push( this.transactionMap[k] )
         }
      })
      return returnArray
      
      // David's solution
      //
      //return Object.values( this.transactionMap )
      //          .filter( t => Transaction.validTransaction(t) )
   }

   clear() {
      this.transactionMap = {}
   }

   clearBlockchainTransactions({chain}){
      //console.log( 'clearBlockchainTransactions - this.transactionMap: ', this.transactionMap )
      //console.log( 'clearBlockchainTransactions - the chain: ', chain )
      for (let i=1; i<chain.length; i++) { //1, not 0, to skip the Genesis block
         const block = chain[i]
         //console.log( `clearBlockchainTransactions - block ${i}: `, block )

         // It appears that the chain is not an object.
         // It is an array of objects, namely, blocks -- this is what 
         //    pubsub delivers over the CHANNELS.BLOCKCHAIN.  chain[0] is 
         //    the GENESIS_DATA block, the other blocks are transactions
         // So my below method doesn't work ! 
         //
         //console.log( '================', block.data.id )
         // Object.keys(this.transactionMap).forEach( k => { 
         //    if( k===block.data.id ) {
         //       console.log("D  E  L  E  T  E  !  !  !") 
         //       delete this.transactionMap[k]
         //    }
         // })
         
         for (let t of block.data){
            if(this.transactionMap[t.id]) {// if it exists then delete it
               delete this.transactionMap[t.id]
            }
         }
      }
   }
}

module.exports = TransactionPool