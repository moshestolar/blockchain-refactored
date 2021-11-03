// App.js is capitalized per convention for files that host React components

import React, { Component } from 'react' // Exported are main React library and class Component
                                         // as a secondary export component
                                         // syntax: primary export is as is, secondary - in  { }
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

class App extends Component {
   // In this version we get real wallet info (key and balance=1000) from the backend,
   // and display it in the browser's console
   //
   // state = { walletInfo: {address: 'fooxv6', balance: 8888 } }
   //   
   // componentDidMount(){
   //    fetch('http://localhost:3000/api/wallet-info')
   //       .then(response => response.json())
   //       .then(json => console.log('json', json))
   // }

   // remove default so it that it won't flash on browser's screen refresh
   state = { walletInfo: {} }

   componentDidMount(){
      fetch(`${document.location.origin}/api/wallet-info`)
         .then(response => response.json())
         .then(json => this.setState({ walletInfo: json }))
   }

   render() {     // every Component extension needs to implement the 'render' method
      const { address, balance } = this.state.walletInfo

      return(
         <div className='App'> 
            <img className='logo' src={logo}></img>
            <br />
            <div>
               Welcome to the blockchain...
            </div>
            <br />
            <div><Link to='/blocks'>Blocks</Link></div>
            <div><Link to='/conduct-transaction'>Conduct a Transaction</Link></div>
            <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
            <br />
            <div className='WalletInfo'>
               <div>Address: {address}</div>
               <div>Balance: {balance}</div>
            </div>
         </div>
      )
   }
}

export default App // 'default' defines App as the primary, default, export of this file...