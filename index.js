// *** native Node.js modules ***
const bodyParser = require('body-parser')
const express = require('express')
const request = require('request')
const path = require('path') // similar to the Node.js course, \chat-app\src\index.js, --
                             // const publicDirectoryPath = path.join(__dirname, '../public')
// *** hand-made modules ***
const Blockchain = require('./blockchain')
const PubSub = require('./app/pubsub') 
const TransactionPool = require('./wallet/transaction-pool')
const Wallet = require('./wallet')
const TransactionMiner = require('./app/transaction-miner')
//const { start } = require('repl')

const app = express() // express() is a powerful object on the express lib
                      // app will be an instance of it
                      // app is set to the result of an express function.
                      // *** app is playing the role of an API configured to
                      // accept HTTP requests and serve up JSON as the response
const blockchain = new Blockchain()
const transactionPool = new TransactionPool()
const wallet = new Wallet()
const pubsub = new PubSub({blockchain, transactionPool})
const transactionMiner = new TransactionMiner({blockchain,transactionPool,wallet,pubsub})

// 'localhost' is the *domain* used for developing this app
const DEFAULT_PORT = 3000
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`

// Demo Code:  setTimeout( () => pubsub.broadcastChain(), 1000 )

app.use(bodyParser.json())       // configure 'app' to use bodyParser's 'json()'
//app.use(express.json())        // per ...\task-manager_#149(final)\src\app.js
app.use(express.static( path.join(__dirname,'client/dist') )) // serve all files in './client/dist'

//express functions used here for HTTP communication are
// listen( port, cb_fun c ) 
// get( endpoint, cb_func ) |  fires of, for ex., when entering a URL in the browser
// post( endpoint, cb_func) |
//                          <- cb_func is defined with 2 argruments: (req, res)

// HTTP GET request will be used to get/read the whole blockchain
app.get('/api/blocks', (req, res) => {
   res.json(blockchain.chain)  // json is a method on app's 'res', it renders
                               // an *object* in its json form
})

app.get('/api/blocks/length', (req, res) => {
   res.json(blockchain.chain.length) 
})

app.get('/api/blocks/:id', (req, res) => {
   const { id } = req.params
   const{ length } = blockchain.chain // same as 'const length = blockchain.chain.length'

   // We will use 'slice' so as not to reverse the oribinal array
   // slice() without parameters is an exact copy of the original array
   const blocksReversed = blockchain.chain.slice().reverse()

   let startIndex = (id-1) * 5
   let endIndex = id * 5
   startIndex = startIndex < length ? startIndex : length
   endIndex = endIndex < length ? endIndex : length

   res.json(blocksReversed.slice(startIndex,endIndex))
})

// HTTP POST request sends 'data' to be used to mine a new block to the chain
app.post('/api/mine', (req, res) => {
   // console.log( req.body )

   const { data } = req.body   // destructure the data sent in the request 'body'
                               // now {data} is the object to be used for mining
   blockchain.addBlock({ data })                             
   
   pubsub.broadcastChain()

   // would be nice to show the requester the blockhain with the added block
   res.redirect('/api/blocks') // ? 'redirect': a 'get' request to the endpoint
})

app.post('/api/transact', (req, res) => {
   const { amount, recipient } = req.body // destructure the two from req.body

   let transaction = transactionPool
      .existingTransaction({ inputAddress: wallet.publicKey })

   try{
      if (transaction) {
         transaction.update({senderWallet: wallet, recipient, amount }) 
      } else {
         transaction = wallet.createTransaction({ 
            recipient, 
            amount,
            chain: blockchain
         })
      }
   } catch( err ) {
      return res.status(400).json({ type: 'error A', message: err.message })
   }

   transactionPool.setTransaction(transaction)

   pubsub.broadcastTransactoin(transaction)

   //console.log('transactionPool', transactionPool)  // for debugging only
   res.json({ type: 'success A', transaction })
})

app.get('/api/transaction-pool-map', (req, res) => {
   res.json(transactionPool.transactionMap)
})

app.get('/api/mine-transactions', (req, res) => { 
   transactionMiner.mineTransactions()
   res.redirect('/api/blocks')
})

app.get('/api/wallet-info', (req, res) => {
   const address = wallet.publicKey
   res.json({
      address,
      balance: Wallet.calculateBalance({chain:blockchain.chain, address})
   })
})

app.get('/api/known-addresses', (req, res) => {
   const addressMap = {}
 
   for (let block of blockchain.chain) {
     for (let transaction of block.data) {
       // create array of all keys (addresses) ot outputMap (it also includes the sender)
       const recipient = Object.keys(transaction.outputMap)
       // add key-values to the addressMap object, the keys and values are identical
       recipient.forEach(r => addressMap[r] = r)
     }
   }
   // return the addressMap / note: writing 'keys' or 'values' makes no difference here!
   res.json(Object.keys(addressMap)) 
 })
 
app.get('*', (req, res) => { // The Star Endpoint: a backend will serve the frontend 
                             // application when it receives a request at any endpoint 
                             // (represented by *) that hasn't already been previously defined
   res.sendFile(path.join(__dirname,'client/dist/index.html'))
                             // As a result of the browser making a request to '*',
                             // respond by sending it the HTML file specified
})             

const syncWithRootState = () => {
   request({ url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
      if( !error && response.statusCode === 200 ) { 
         const rootChain = JSON.parse(body)

         console.log('replace chain on a sync with', rootChain)
         blockchain.replaceChain(rootChain)
      }
   })

   request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`}, (error, response, body) => {
      if( !error && response.statusCode === 200 ) { 
         const rootTransactionPoolMap = JSON.parse(body)

         console.log('set the TransactionPool on a sync with', rootTransactionPoolMap )
         transactionPool.setMap(rootTransactionPoolMap)
      }
   })
}

//if (isDevelopment) {
   const walletFoo = new Wallet();
   const walletBar = new Wallet();
 
   const generateWalletTransaction = ({ wallet, recipient, amount }) => {
     const transaction = wallet.createTransaction({
       recipient, amount, chain: blockchain.chain
     });
      transactionPool.setTransaction(transaction);
   };
    const walletAction = () => generateWalletTransaction({
     wallet, recipient: walletFoo.publicKey, amount: 5
   });
    const walletFooAction = () => generateWalletTransaction({
     wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
   });
    const walletBarAction = () => generateWalletTransaction({
     wallet: walletBar, recipient: wallet.publicKey, amount: 15
   });
   for (let i=0; i<20; i++) {
     if (i%3 === 0) {
       walletAction();
       walletFooAction();
     } else if (i%3 === 1) {
       walletAction();
       walletBarAction();
     } else {
       walletFooAction();
       walletBarAction();
     }
     transactionMiner.mineTransactions();
   }
 //}
 
 let PEER_PORT

if( process.env.GENERATE_PEER_PORT === 'true' ) {
   PEER_PORT = DEFAULT_PORT + Math.ceil( Math.random() * 1000 ) // renders 1 to 1000
}

const PORT = PEER_PORT || DEFAULT_PORT  // PEER_PORT 'undefined' is caught by the OR
app.listen( PORT, () => {
   console.log(`Listening at localhost:${PORT}`)

   if (PORT !== DEFAULT_PORT) { // root node shouldn't sync it's own chain
      syncWithRootState()
   }
})
