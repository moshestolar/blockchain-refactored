const Blockchain = require('../blockchain/index') // could have be ../blockchain
                                                  // since, by default, if filename
                                                  // is not specified, Node.js will
                                                  // take index.js
const blockchain = new Blockchain()

blockchain.addBlock({ data: 'initial'})

let prevTimestamp, nextTimestamp, nextBlock, timeDiff, average
const times = []

console.log('first block', blockchain.chain[blockchain.chain.length-1])

for (let i=0; i<10000; i++ ) {
   prevTimestamp = blockchain.chain[blockchain.chain.length-1].timestamp

   blockchain.addBlock({ data: `block ${i}`})
   
   nextBlock = blockchain.chain[blockchain.chain.length-1]
   nextTimestamp = nextBlock.timestamp

   timeDiff = nextTimestamp - prevTimestamp
   times.push(timeDiff)

   average = times.reduce( ( total, num) => (total + num) )/times.length
   // let len=times.length
   // let accum = 0
   // for (let i=0; i<len; i++)
   //    accum += times[i]
   // average = accum / len

   console.log(`Mining time ${timeDiff}ms, Difficulty: ${nextBlock.difficulty}, Average time: ${average}ms`)
}