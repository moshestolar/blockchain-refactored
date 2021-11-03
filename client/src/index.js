// In the land of frontend the syntax for requiring code is different. In Node.js we use keyword
// 'require' which is part of a system called "The Common JS Project".  The 2015 version of
// JavaScript, called ES6, added support for loading content through an 'import' syntax.
//
import React from 'react'        // import React module from its location in \node_modules\'react'
import {render} from 'react-dom' // import the render-function from the React-dom library
                                 // (render-function is not the default export of React-dom module)
// Without npm parcel-bundler the above import does not, in fact, upload React to the browser!

import { Router, Switch, Route } from 'react-router-dom'
import history from './history'
import App from './components/App'
import Blocks from './components/Blocks'
import ConductTransaction from './components/ConductTransaction'
import TransactionPool from './components/TransactionPool'
import './index.css'
                                 
console.log('JavaScript hello!')
// render( <App></App>,
//         // another way to do this is <App />
//         //
//         // this was here temprorary and is now replaced by the <App></App>:
//         // <div>Cryptochain in React!</div>, 
//                                         // this is JSX: Javascript XML-like syntax
//                                         // XML is an HTML-like language that uses > and <.
//                                         // 'render' takes two arguments (first one is above)
//         document                        // 'document' is an object provided by the browser
//                 .getElementById(        // details - in React's on-line documentation
//                                 'root') // 'root' - most commonly used here, "the convention"
//       )  
render(
   <Router history={history}>
      <Switch>
         <Route exact path='/' component={App} />
         <Route path='/blocks' component={Blocks} />
         <Route path='/conduct-transaction' component={ConductTransaction} />
         <Route path='/transaction-pool' component={TransactionPool} />
      </Switch>
   </Router>,
   document.getElementById('root')
)
