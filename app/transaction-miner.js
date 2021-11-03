const Transaction = require('../wallet/transaction')

class TransactionMiner {
   constructor ({ blockchain, transactionPool, wallet, pubsub }) {
      // set local instances
      this.blockchain = blockchain,
      this.transactionPool = transactionPool,
      this.wallet = wallet,
      this.pubsub = pubsub
   }

   mineTransactions() {
      // Step 1/5 - get the transaction pool's valid transactions
      const validTransactions = this.transactionPool.validTransactions()

      // Step 2/5 - generate a reward transaction (and add it validTransactions array)
      validTransactions.push(Transaction.rewardTransaction({minerWallet:this.wallet}))

      // Step 3/5 - add a block consisting of these transactions + reward to the blockchain
      //
      // My comment - I didn't realize that the {data} of a block (that is added to
      // the  blockchain), is not a transaction, specifically. {data} is virtually 
      // anything, an array of transactions, in this case. 
      // Therefore, my first implementation is wrong:
      //   validTransactions.forEach( (t) => { this.blockchain.addBlock({data:t})} )
      this.blockchain.addBlock({data: validTransactions })

      // Step 4/5 - broadcast the updated blockchain
      this.pubsub.broadcastChain()

      // Step 5/5 - clear the local pool
      this.transactionPool.clear()
   }
}

module.exports = TransactionMiner