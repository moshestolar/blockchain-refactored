const Block = require('./block')
const Transaction = require('../wallet/transaction')
const Wallet = require('../wallet')
const { cryptoHash } = require('../util')
const { REWARD_INPUT, MINING_REWARD } = require('../config')

class Blockchain {
   constructor() {
      this.chain = [Block.genesis()] 
   }
   addBlock({data}) {
      const newBlock = Block.mineBlock({
         lastBlock: this.chain[this.chain.length-1],
         data
      })
      this.chain.push(newBlock)
   }

   replaceChain(chain, ForTESTSUITE_validateTransactions, onSuccess) {
      if( chain.length <= this.chain.length ) {
         console.error('The incoming chain must be longer')
         return
      }
      if( !Blockchain.isValidChain(chain)) {
         console.error('The incoming chain must be valid')
         return
      }
      if( ForTESTSUITE_validateTransactions && !this.validTransactionData({ chain })) {
         console.error('The incoming chain has invalid transaction data')
         return
      }

      if(onSuccess) onSuccess() //call only if has been passed as an argument
      console.log('Replacing chain with', chain)
      this.chain = chain
   }

   validTransactionData({ chain }) {
      for (let i=1; i<chain.length; i++) {
         const block = chain[i]
         const transactionsSet = new Set() // Set constructor lets you create Set objects that 
                                           // store unique values of any type, 
                                           // whether primitive values or object references.
         let rewardTransactionCount = 0

         for (let t of block.data) {
            if (t.input.address === REWARD_INPUT.address){ // dealing with a reward transaction
               rewardTransactionCount++
               if(rewardTransactionCount > 1) {
                  console.error('Miner rewards exceed limit')
                  return false
               }

               if (Object.values(t.outputMap)[0] // this is a reward transaction, it has
                                                 // only one key-value element in its 
                                                 // outputMap, so in the array returned by 
                                                 // 'values' we can refer to it as [0]
                  !== MINING_REWARD) {
                     console.error('Miner reward amount is invalid')
                     return false
               }
            } else { // dealing with a regular (not a reward) transaction
               if (!Transaction.validTransaction(t)) {
                  // !(sum of outputMap values equals to input balance & signature check)
                  console.error('Invalid transaction')
                  return false
               }
               // check that input.ballance in the transaction matches the sending wallet's 
               //
               const trueBalance = Wallet.calculateBalance({
                  chain: this.chain, // It's crucial to base calculation on the local chain,
                                     // not on the one passed as an argument to this function!
                  address: t.input.address
               })
               if (t.input.amount !== trueBalance) {
                  //console.log(`VIOLATION *** Sender's declared balance is ${t.input.amount } - calculated balance is ${trueBalance}`)
                  console.error('Invalid input amount')
                  return false
               }
               if (transactionsSet.has( t )) {
                  console.error('An identical transaction appears more than once in the block')
                  return false
               } else {
                  transactionsSet.add( t )
               }
            }
         }
      }
      return true
   }

   static isValidChain(chain) {
      // validate genesis block
      //   note: JSON.stringify is a static method in the global JSON class of Javascript
      if( JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis()) ) {
         return false
      }
      // validate (1) correct lastHash->hash chaining and (2) correct hash values
      for( let i=1; i<chain.length; i++ ) {
         const lastDifficulty = chain[i-1].difficulty

         if( chain[i].lastHash !== chain[i-1].hash ) return false

         const { timestamp, lastHash, hash, data, nonce, difficulty } = chain[i] // destructuring
         if( cryptoHash( timestamp, lastHash, data, nonce, difficulty ) !== hash ) return false
         //
         // my original version was without destructuring, like this --
         // if( cryptoHash(chain[i].timestamp,chain[i].lastHash,chain[i].data) !== chain[i].hash ) return false

         if(Math.abs(lastDifficulty - difficulty) > 1 ) return false
      }
      return true
   }
}

module.exports = Blockchain