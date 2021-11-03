const MINE_RATE = 1000  // ms
const INITIAL_DIFFICULTY = 3

const GENESIS_DATA = { // this is screamcase syntax used for hardcoded global vaules
   timestamp: 1,
   lastHash: '-----',
   hash: 'hash-one',
   // -- this has been my original version, worked ok. 
   // data: [],
   // nonce: 1,
   // difficulty: 1
   // -- now, David's version:
   difficulty: INITIAL_DIFFICULTY,
   nonce: 0, // this could be anything
   data: []
}

const STARTING_BALANCE = 1000

const REWARD_INPUT = { address: '*authorized-reward*' } //field 'input' of Reward transaction

const MINING_REWARD = 50

module.exports = { 
   GENESIS_DATA, 
   MINE_RATE, 
   STARTING_BALANCE,
   REWARD_INPUT,
   MINING_REWARD
}