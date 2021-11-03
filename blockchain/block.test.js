const hexToBinary = require('hex-to-binary')
const Block = require ('./block')
const { GENESIS_DATA, MINE_RATE } = require('../config') 
   //an early comment prior to introducing MINE_RATE: GENESIS_DATA is exported as an object
const { cryptoHash } = require('../util')

describe('Block', () => {
   const timestamp = 2000 // calculations introduced, can't keep this as a string, 'a-date'
   const lastHash = 'foo-hash'
   const hash = 'bar-hash'
   const data = ['blockchan', 'data']
   const nonce = 1
   const difficulty = 1
   const block = new Block({timestamp,lastHash,hash,data, nonce, difficulty})
   
   it('has a timestamp, lastHash, hash, and data property', () => {
      expect(block.timestamp).toEqual(timestamp)
      expect(block.lastHash).toEqual(lastHash)
      expect(block.hash).toEqual(hash)
      expect(block.data).toEqual(data)
      expect(block.nonce).toEqual(nonce)
      expect(block.difficulty).toEqual(difficulty)
   })

   describe('genesis()', () => {
      const genesisBlock = Block.genesis() // a static function on Block, 
                                           // we don't need to use or change data
                                           // on a specific instance of the class
      it('retuns a Block instance', () => {
         expect(genesisBlock instanceof Block).toBe(true) // toBe rather than toEqual
                                                          // for bool comparisons 
      })
      it('returns the genesis data', () => {
         expect(genesisBlock).toEqual(GENESIS_DATA)
         // Javascript implements classes as objects "under the hood",
         // this is why the instance of the Block class, genesisBlock, is 
         // expected to be equal to an object, GENESIS_DATA, even though the two
         // are of diffent types - class instance and some (hardcoded) object;
         // in this case the object has the same keys as the class.
      })
   })

   describe('mineBlock()', () => {
      const lastBlock = Block.genesis() // Surprise: the Genesis Block is ok for this test!
      const data = 'mined data'
      const minedBlock = Block.mineBlock({lastBlock, data})

      it('retuns a Block instance', () => {
         expect(minedBlock instanceof Block).toBe(true)
      })
      it('sets the `lastHash` to be the `hash` of the lastBlock', () => {
         expect(minedBlock.lastHash).toEqual(lastBlock.hash)
      })
      it('sets the `data`', () => {
         expect(minedBlock.data).toEqual(data)
      })
      it('sets a `timestamp`', () => {
         expect(minedBlock.timestamp).not.toEqual(undefined)
      })
      it('creates a SHA-256 `hash` based on the proper inputs', () => {
         expect(minedBlock.hash).toEqual(
            cryptoHash(
               minedBlock.timestamp,
               lastBlock.hash,
               data,
               minedBlock.nonce,
               minedBlock.difficulty
            )
         )
      })
      it('sets a `hash` that matches the difficulty criteria', () => {
         expect(hexToBinary(minedBlock.hash).substring(0,minedBlock.difficulty))
            .toEqual('0'.repeat(minedBlock.difficulty)) //a zero-string is made by use of 
                                                        //Javascript 'repeat' function:
                                                        //repeat a sting N times
      })
      it('adjusts the difficulty', () => {
         const possibleResults = [lastBlock.difficulty+1, lastBlock.difficulty-1]
         expect(possibleResults.includes(minedBlock.difficulty)).toBe(true)
      })
   })

   describe('adjustDifficulty', () => {
      it('raises the difficulty for a quickly mined block', () => {
         expect(Block.adjustDifficulty({
            block, curtime: block.timestamp + MINE_RATE - 100
         })).toEqual(block.difficulty+1)
      })
      it('lowers the difficulty for a slowly mined block', () => {
         expect(Block.adjustDifficulty({
            block, curtime: block.timestamp + MINE_RATE + 100
         })).toEqual(block.difficulty-1)
         // This test isn't good since for a difficulty of 1 the expected
         // result, difficulty 0, contradicts the requirement of a difficulty
         // to be not less than 1!  Ref. to adjustDifficulty() implementation.
      })
      it('has a lower limit of 1', () => {
         block.difficulty = -1 // -1 is chosen since both difficulty-1, i.e., -2,
                               // and difficulty+1, i.e., 0, are both less than 1
         expect(Block.adjustDifficulty({
            block  // per David's concept, the second argument, 
                   // 'curtime: block.timestamp + MINE_RATE + 100', is not required
         })).toEqual(1)
      })
   })
})
