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
         console.error('replaceChain error: The incoming chain must be longer')
         return
      }
      if( !Blockchain.isValidChain(chain)) {
         console.error('replaceChain error: The incoming chain must be valid')
         return
      }
      if( ForTESTSUITE_validateTransactions && !this.validTransactionData({ chain })) {
         console.error('replaceChain error: The incoming chain has invalid transaction data in new blocks')
         return
      }

      if(onSuccess) onSuccess() //call only if has been passed as an argument
      //console.log('Replacing chain with', chain)
      this.chain = chain
      console.log('replaceChain report: BLOCKCHAIN REPLACED!')
   }

   validTransactionData({ chain }) {
      for (let i=1; i<chain.length; i++) {
         const block = chain[i]
         const transactionsSet = new Set() // Set constructor lets you create Set objects that 
                                           // store unique values of any type, 
                                           // whether primitive values or object references.
         let rewardTransactionCount = 0

         // BUG FIX. Unlike the original code, this function should NOT validate blocks already in local chain.
         //          Such validation sure fails: sender's current balance is NOT the value it has been,
         //          as what's recorded in previous blocks we already have in the local chain.
         //          Therefore -
         // Skip examining blocks that are already in the local chain!
         let skipBlock = false
         for(let k=1; k<this.chain.length; k++){
            if(block.hash === this.chain[k].hash){
               skipBlock = true
               break;   
            }
         }
         if( skipBlock )
            continue;   // process next block of the incoming chain

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
                  console.error(`VIOLATION *** Sender's declared balance ${t.input.amount} != calculated balance ${trueBalance}`)
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
         console.log(`Block, hash=${(block.hash.substring(0,6))}.., added to local blockchain`)
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