const hexToBinary = require('hex-to-binary')
const {GENESIS_DATA, MINE_RATE} = require("../config")
// the following comment has been made before introducing MINE_RATE --
// WRT the above import of GENESIS_DATA -- in the two below cases, console.log(GENESIS_DATA) prints
// (1) const GENESIS_DATA   = require("./config")  { GENESIS_DATA: { timestamp: 1, lastHash: '-----', hash: 'hash-one', data: [] } }
// (2) const {GENESIS_DATA} = require("./config")  { timestamp: 1, lastHash: '-----', hash: 'hash-one', data: [] }

const { cryptoHash } = require('../util')

class Block {
   constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
      this.timestamp = timestamp
      this.lastHash = lastHash
      this.hash = hash
      this.data = data
      this.nonce = nonce
      this.difficulty = difficulty
   }

   static genesis() {
      return new Block(GENESIS_DATA)  //a better way to write this would be:  return new this(GENESIS_DATA)
   }  // this here is an example of a Factory Method
      // A Factory Method is a function that creates instances of a class without directly using the constructor.
   
   static mineBlock({ lastBlock, data }) {
      // 
      // I missed the point of changing 'timestamp'on every cryptoHash calculation!
      //
      let timestamp, hash
      const lastHash = lastBlock.hash
      let { difficulty } = lastBlock // const difficulty = lastBlock.difficulty 
                                     // I had the above, but destructuring is better.
                                     // For introducing adjustDifficulty, 'difficulty'
                                     // becomes a 'let'-variable, rather then 'const'
      let nonce = 0
      while( 1 ) {
         nonce++
         timestamp = Date.now()
         //difficulty=Block.adjustDifficulty({originalBlock: lastBlock, timestamp}) --  David's version
         difficulty = Block.adjustDifficulty({block: lastBlock, curtime: timestamp})
         hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty)
         if( hexToBinary(hash).substring(0,difficulty) === '0'.repeat(difficulty) )
            break
      }

      return new this({ timestamp, lastHash, data, nonce, difficulty, hash })
   }

   // >>>>  I think that 'block' is a better name than 'originalBlock' since there is
   // no "origianal" and "resutling" here, all the work is done on one single block;
   // similarly, 'curtime' is better than 'timestamp', since the time before a minig
   // attempt is not a timestamp until the block will be successfully mined.
   //
/* ------David's version ------
   static adjustDifficulty({ originalBlock, timestamp }) {
      const {difficulty} = originalBlock
     
      if( (timestamp - originalBlock.timestamp) > MINE_RATE ) 
         return difficulty -1
      return difficulty +1
   } 
*/   
   static adjustDifficulty({ block, curtime }) {
      const {difficulty} = block
      //console.log('adjustDifficulty currtime', curtime )
      
      if ( difficulty < 1 ) return 1 // bad code: if difficulty is 1 (or less),
                                     // the result might be 0 (or negative) !

      if( (curtime - block.timestamp) > MINE_RATE ) {
         //if( difficulty <= 1 )  // this is the good code, however, it fails test
         //   return 1            // 'lowers the difficulty for a slowly mined block'
         return difficulty -1
      }
      return difficulty +1
   }
}

// lastBlock = new Block(GENESIS_DATA)
// Block.mineBlock({lastBlock, data:'somedata'})
//
// const block1 = new Block({
//    data: 'foo-data',
//    lastHash: 'foo-lastHash',
//    hash: 'foo-hash', 
//    timestamp: '01/01/01'
// })
// console.log('block1',block1)

module.exports = Block