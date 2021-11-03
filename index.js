// *** npm modules ***
const express = require('express')
const request = require('request')
const socketio = require('socket.io')
// *** native Node.js modules ***
const http = require('http')
const path = require('path') // similar to the Node.js course, \chat-app\src\index.js, --
                             // const publicDirectoryPath = path.join(__dirname, '../public')
const bodyParser = require('body-parser') // for parsing 'req.body' of an HTTP POST endpoint
                                          // if don't need such processing - REMOVE IT!
// *** hand-made modules ***
const Blockchain = require('./blockchain')
const PubSub = require('./app/pubsub') 
const TransactionPool = require('./wallet/transaction-pool')
const Wallet = require('./wallet')
const TransactionMiner = require('./app/transaction-miner')

const app = express() // express() is a powerful object on the express lib
                      // app will be an instance of it
                      // app is set to the result of an express function.
                      // *** app is playing the role of an API configured to
                      // accept HTTP requests and serve up JSON as the response
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, 'client')

const viewsPath = path.join(__dirname, 'client')
app.set('view engine', 'hbs') // Express library has no default view engine! (template engine)
                              // A template engine is necessary for rendering html on FrontEnd
                              // On https://expressjs.com/en/resources/template-engines.html
                              // we get a list of 23! different engines (including React).
                              // I decided to use Handlebars, the one Andrew Mead taught.
                              // note: had to 'npm i hbs --save', accordingly.
app.set('views', viewsPath)

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
   // console.log(`An HTML page connected on socket ${socket.id}!`)
   // socket.emit('welcomeMessage', 'Welcome you, new client!')
   //
   // Add wallet address and balance to the welcome message
   const address = wallet.publicKey

   socket.emit('welcomeMessage', JSON.stringify({
      address,
      balance: Wallet.calculateBalance({chain:blockchain.chain, address}),
      chain: blockchain.chain
   }))

   socket.on('doTransactMessage', ({recipient, amount}, callback) => {
      /*(m) => { console.log('Server got a Belcome message: ', m) }*/

      // 'amount' is a string.  Must work with the int it represents!
      amount=parseInt(amount) // note: JS is confusing - without a 'typeof(amount)' I don't know whether I have an int or a string!)

      let transaction = transactionPool.existingTransaction({ inputAddress: address })
      try{
         if (transaction) {
            // This sender has previously sent (to whomever), update transaction
            transaction.update({senderWallet: wallet, recipient, amount }) 
         } 
         else {
            // This sender hasn`t sent anything, create a new transaction
            transaction = wallet.createTransaction({recipient, amount, chain: blockchain.chain })
         }
         transactionPool.setTransaction(transaction)
         pubsub.broadcastTransactoin(transaction)
         return callback( 'Transaction Success' )
      } catch( e ) { // alert(e) in 'catch' won't work here: alert is for the client side!
                     // error to pass over to client is 'e.message', not 'e', ref.:
                     //    console.log( 'KEYS:', Object.getOwnPropertyNames( e ) )
         return callback( e.message )
      }
   })

   socket.on('transactionPoolMessage',() => {
      socket.emit('transactionPoolMessage', JSON.stringify(transactionPool.transactionMap))
   })

   socket.on('mineNewBlockMessage', () => {
      transactionMiner.mineTransactions()
      // on success
      socket.emit('transactionPoolMessage', JSON.stringify(transactionPool.transactionMap))
   })

   socket.on('disconnect', () =>{   // 'disconnect' here is a built-in event on the socket
      //console.log(`HTML disconnecting, socket ${socket.id}`)
   })
})

const blockchain = new Blockchain()
const transactionPool = new TransactionPool()
const wallet = new Wallet()
const pubsub = new PubSub({blockchain, transactionPool})
const transactionMiner = new TransactionMiner({blockchain,transactionPool,wallet,pubsub})

// 'localhost' is the *domain* used for developing this app
const DEFAULT_PORT = 3000
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`

// Demo Code:  setTimeout( () => pubsub.broadcastChain(), 1000 )

app.use(bodyParser.json()) // configure 'app' to use bodyParser's 'json()'
                           // Note: even though bodyParser gets marked here as 'deprecated',
                           // however, processing of a req.body without this line won't work.
                           // If bodyParser is not imported - COMMENT THIS OUT!
//app.use(express.json())    // per ...\task-manager_#149(final)\src\app.js   

//express functions used here for HTTP communication are
// listen( port, cb_fun c ) 
// get( endpoint, cb_func ) |  fires of, for ex., when entering a URL in the browser
// post( endpoint, cb_func) |
//                          <- cb_func is defined with 2 argruments: (req, res)

app.get('/do-transact', (req, res) => {
   res.render('do-transact.hbs')    // The file can't have extension .html, must be .hbs only!
})

app.get('/transactions', (req, res) => {
   res.render('transactions.hbs')
})

// HTTP GET request will be used to get/read the whole blockchain
app.get('/api/blocks', (req, res) => {
   res.json(blockchain.chain)  // json is a method on app's 'res', it renders
                               // an *object* in its json form
   // FROM \web-server\src\index.js
   //
   // app.get('/help', (req, res) => {
   //    res.render('help', { // 'render('help'' renders the HTML defined in file named 'help',
   //                         // namely, in \web-server\templates\views\help.hbs
   //                         // ref.: http://expressjs.com/en/api.html#res.render
   //       helpText: 'Press the "Blue Hipo" button...', title: 'Help', name: 'Moshe Stolar'
   //    }) 
   // })
   //
   // Consider doing the same here, since res.json(blockchain.chain) doesn't show anything !
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

/* CLEANUP!  Once transactions are conducted via do-transact.hbs HTML page, 
   there is no need at all for this /api/transact endpoint and all of its code!
*/
app.post('/api/transact', (req, res) => {
   const { amount, recipient } = req.body // destructure the two from req.body
   let transaction = transactionPool
      .existingTransaction({ inputAddress: wallet.publicKey })
   try{
      if (transaction) {
         transaction.update({senderWallet: wallet, recipient, amount }) 
         console.log( 'This sender has previously sent (to whomever), transaction updated' )
      } else {
         transaction = wallet.createTransaction({ 
            recipient, 
            amount,
            chain: blockchain
         })
         console.log( 'This sender hasn`t sent anything, created a new transaction' )
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

app.get('*', (req, res) => { // The Star Endpoint: a backend will serve the frontend 
                             // application when it receives a request at any endpoint 
                             // (represented by *) that hasn't already been previously defined
   console.log('Hello from Star Endpoint!')   
   // res.sendFile(path.join(__dirname,'./client/index.html'))
   //                           // As a result of the browser making a request to '*',
   //                           // respond by sending it the HTML file specified
})             

const syncWithRootState = () => {
   request({ url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, response, body) => {
      if( !error && response.statusCode === 200 ) { 
         const rootChain = JSON.parse(body)

         //console.log('replace chain on a sync with', rootChain)
         blockchain.replaceChain(rootChain)
      }
   })

   request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`}, (error, response, body) => {
      if( !error && response.statusCode === 200 ) { 
         const rootTransactionPoolMap = JSON.parse(body)

         //console.log('set the TransactionPool on a sync with', rootTransactionPoolMap )
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

   // generateWalletTransaction({ wallet: wallet, recipient: walletBar.publicKey, amount: 1 })        // I give to Bar
   // generateWalletTransaction({ wallet: wallet, recipient: walletFoo.publicKey, amount: 49 })       // I give to Foo
   // generateWalletTransaction({ wallet: walletBar, recipient: walletFoo.publicKey, amount: 400 })
   // generateWalletTransaction({ wallet: walletFoo, recipient: walletBar.publicKey, amount: 200 })
   // generateWalletTransaction({ wallet: walletBar, recipient: wallet.publicKey, amount: 200 })      // I get from Bar
   // transactionMiner.mineTransactions();

   // const walletAction = () => generateWalletTransaction({
   //    wallet, recipient: walletFoo.publicKey, amount: 5
   // });
   // const walletFooAction = () => generateWalletTransaction({
   //    wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
   // });
   // const walletBarAction = () => generateWalletTransaction({
   //    wallet: walletBar, recipient: wallet.publicKey, amount: 15
   // });
   // for (let i = 0; i < 10; i++) {
   //    if (i % 3 === 0) {
   //       walletAction();
   //       walletFooAction();
   //    } else if (i % 3 === 1) {
   //       walletAction();
   //       walletBarAction();
   //    } else {
   //       walletFooAction();
   //       walletBarAction();
   //    }
   //    transactionMiner.mineTransactions();
   // }
//}
 
let PEER_PORT

if( process.env.GENERATE_PEER_PORT === 'true' ) {
   PEER_PORT = DEFAULT_PORT + Math.ceil( Math.random() * 1000 ) // renders 1 to 1000
}
if( process.env.PEER_PORT === '3001' ) {
   PEER_PORT = 3001
}

const PORT = PEER_PORT || DEFAULT_PORT  // PEER_PORT 'undefined' is caught by the OR
server.listen( PORT, () => {
   console.log(`Listening at localhost:${PORT}`)

   if (PORT !== DEFAULT_PORT) { // root node shouldn't sync it's own chain
      syncWithRootState()
   }
})
