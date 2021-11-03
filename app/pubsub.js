const redis = require('redis')

const CHANNELS ={
   TEST:'TEST',
   BLOCKCHAIN: 'BLOCKCHAIN',
   TRANSACTION: 'TRANSACTION'
}
class PubSub {
   constructor({blockchain, transactionPool}) {
      this.blockchain = blockchain // every pubsub instance is to have its local blockchain
      this.transactionPool = transactionPool

      this.publisher = redis.createClient()
      this.subscriber = redis.createClient()

      // this.subscriber.subscribe(CHANNELS.TEST)      | call a function to subscribe
      // this.subscriber.subscribe(CHANNELS.BLOCKCHAIN)| to all rather then one-by-one
      this.subscribeToChannels()

      this.subscriber.on(
         'message',
         (channel, message) => this.handleMessage(channel, message) 
      )
   }
   handleMessage(channel, message) {
      //console.log(`Message received. Channel: ${channel}. Message: ${message}.`)

      const parsedMessage = JSON.parse(message) // convert message from JSON to OBJECT

      switch(channel) {
         case CHANNELS.BLOCKCHAIN:
            //console.log("CHANNELS.BLOCKCHAIN - replaceChain !") 
            this.blockchain.replaceChain(parsedMessage,
                                         true, // to appease ForTESTSUITE_validateTransactions
                                         () => {
            // replaceChain checks the new chain contained in parsedMessage is valid and longer
               //console.log("CHANNELS.BLOCKCHAIN - clearBlockchainTransactions !") 
               this.transactionPool.clearBlockchainTransactions({
                  chain: parsedMessage
               })
            }) 
            break
         case CHANNELS.TRANSACTION:
            this.transactionPool.setTransaction(parsedMessage)
            break
         default:
            return
      }
   }

   subscribeToChannels() {
      // var Object: ObjectConstructor, provides functionality common to all JavaScript objects
      // values(OBJECT): renders an *array* of the values of object OBJECT
      Object.values(CHANNELS).forEach( (ch) => this.subscriber.subscribe(ch) )
   }

   publish( {channel, message} ) {
      // Why is David doing one object argument rather than two separate ones?
      // 1. When calling it is better to pass one argument than two
      // 2. When passing the parameter don't need to worry about the order
      
      //this.publisher.publish(channel, message)
      // -- in ths approach the publisher receives its own message, sloppy!

      //an alternate approach, implemented here, is to unsubscribe from the 
      // channel while broadcasting -- I'm surprised there is no better way, 
      // like 'broadcats to all except to  myself'
      this.subscriber.unsubscribe(channel, () => {
         this.publisher.publish(channel, message, () => {
            this.subscriber.subscribe(channel)
         })
      }) 
   }

   broadcastChain() { //don't need 'blockchain' argument: reference the local blockchain
      this.publish({
         channel: CHANNELS.BLOCKCHAIN,
         //message: this.blockchain.chain - wrong, since 'message' can't be an array!
         message: JSON.stringify(this.blockchain.chain)
      })
   }

   broadcastTransactoin(transaction) { //don't need 'blockchain' argument: reference the local blockchain
      this.publish({
         channel: CHANNELS.TRANSACTION,
         message: JSON.stringify(transaction)
      })
   }
}

// // ------ DEMO Code ------
// const testPubSub = new PubSub()
// setTimeout( () => {
//     testPubSub.publisher.publish(CHANNELS.TEST, 'foo')
//     console.log('PUBLISH!')
// }, 500 )

module.exports = PubSub