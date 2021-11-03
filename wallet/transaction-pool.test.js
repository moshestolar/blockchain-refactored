const TransactionPool = require('./transaction-pool')
const Transaction = require('./transaction')
const Wallet = require('./index')
const Blockchain = require('../blockchain')

describe('TransactionPool', () => {
   let transactionPool, transaction, senderWallet

   beforeEach(() => {
      senderWallet = new Wallet()
      transactionPool = new TransactionPool()
      transaction = new Transaction({
         senderWallet,
         recipient: 'fake-recipient',
         amount: 50
      })
   })

   describe('setTransaction()', () => {
      it('adds a transaction', () => {
         transactionPool.setTransaction(transaction)
         expect(transactionPool.transactionMap[transaction.id])
            .toBe(transaction) // a discussion on toBe/toEqual wrt the cryptoHash bug
      })
   })

   describe('existingTransaction()', () => {
      it('returns an existing transaction given an input address', () => {
         transactionPool.setTransaction(transaction)
         expect(
            transactionPool.existingTransaction({inputAddress: transaction.input.address})
            // note: David did:                  inputAddress: senderWallet.publicKey
            //       so at the top of the file he had to add a 'let senderWallet' +
            //       senderWallet = new Wallet()
         ).toBe(transaction)   
      })
   })

   describe('validTransactions()', () => {
      let validTransactionsArray, errorMock

      beforeEach(() => {
         errorMock = jest.fn()
         global.console.error = errorMock

         validTransactionsArray = []
         for (let i=0; i<10; i++ ) {
            transaction = new Transaction({
               senderWallet,
               recipient: 'any-recipient',
               amount: 30
            })
             if (i%3===0) {
               transaction.input.amount = 999999
            } else if (i%3===1) {
               transaction.input.signature = new Wallet().sign('foo')
            } else {
               validTransactionsArray.push(transaction)
            }
            transactionPool.setTransaction(transaction)
         }
      })

      it('returns valid transactions array', () => {
         expect(transactionPool.validTransactions()).toEqual(validTransactionsArray)
      })

      it('logs errors for invalid transactions', () => {
         transactionPool.validTransactions()
         expect(errorMock).toHaveBeenCalled()
      })

   })

   describe('clear()', () => {
      it('clears the transaction', () => {
         transactionPool.clear()
         expect(transactionPool.transactionMap).toEqual({})
      })
   })

   describe('clearBlockchainTransactions()', () => {
      it('clears the pool of any existing blockchain transactions', () => {
         // Preparations
         const blockchain = new Blockchain()
         const expectedTransactionMap = {}

         for (let i=0; i<6; i++) {
            // create a transaction
            const transaction = new Wallet().createTransaction({recipient:'foo',amount:20})
            // put it into the pool
            transactionPool.setTransaction(transaction)
            if( i%2===0 ) {
               // if it is an even one, then also add it to the blockchain
               blockchain.addBlock({data: [transaction]}) 
               //in video #74, 5:25, the above line appears as 
               // blockchain.addBlock({data: [transaction]})
               // -- why is data set to an array of one element, transaction, 
               //    not simply the transaction object?
               //console.log( '@@@@@@@@@@@@@@@@@@', transaction)
            } else {
               // if it is an odd one, then also copy it to the map object expected
               // to remain after calling the clearBlockchainTransactions ()
               expectedTransactionMap[transaction.id] = transaction
            }
         }

         // Action now - clearBlockchainTransactions() !
         transactionPool.clearBlockchainTransactions({chain:blockchain.chain})

         expect(transactionPool.transactionMap).toEqual(expectedTransactionMap)
      })
   })

})
