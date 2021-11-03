import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import Transaction from './Transaction'

class Block extends Component {
   state = { displayTransaction: false }

   toggleTransaction = () => {
      this.setState({ displayTransaction: !this.state.displayTransaction })
   }

// get Computed Property
//
// get displayTransaction(){} --  keword (get) + Copmuted Property name (displayTransaction)
// Advantage: a Computed Property is not a function, it takes on the type of whatever ends up returning
//
// An example:
// get displayTransaction() {
//    const exampleString = 'example'        
//    return <div>Display Transaction: {exampleString}</div> 
      // since here we are returning a JSX from the Computed Property, displayTransaction() itself 
      // is returning a type JSX. 
      // Now, in 'render', rather then detailing <div>....</div>, we can do:
      // render() {
      //    console.log('this.displayTransaction', this.displayTransaction)
      //    return (
      //       <div className='Block'>
      //          <div>Hash: {hashDisplay}</div>   -- etc
      //          {this.displayTransaction}        -- here it is!
      //       </div>
      //    );
      // }      
      // Examining browser's console output shows that:
      // get displayTransaction(){}    | is a react.element, different than a JS method --
      // displayTransaction = () => {} | , however, this method is a function, it doesn't immediately
      //                               | return the JSX. BTW, to use it in the 'render' method 
      // we'd do:
      //          {this.displayTransaction()}      -- here it is!
      // This is all meant to explain why we are using a Computed Property rather than call a func.

// }

   get displayTransaction() {
      const { data } = this.props.block;

      const stringifiedData = JSON.stringify(data)

      const dataDisplay = stringifiedData.length > 35 ?
         `${stringifiedData.substring(0, 35)}...` :
         stringifiedData

      if (this.state.displayTransaction) {
         return (
            <div>
               {
                  data.map(transaction => (
                     <div key={transaction.id}>
                        <hr />
                        <Transaction transaction={transaction} />
                     </div>
                  ))
               }
               <br />
               <Button
                  bsStyle="danger"
                  bsSize="small"
                  onClick={this.toggleTransaction}
               >
                  Show Less
               </Button>
            </div>
         )
      }

      return ( 
         <div>
            <div>Data: {dataDisplay}</div> 
            <Button
               bsStyle="danger"
               bsSize="small"
               onClick={this.toggleTransaction}
            >
               Show More
            </Button>
         </div>
      )
   }

//     if (this.state.displayTransaction) {
//       return (
//         <div>
//           {
//             data.map(transaction => (
//               <div key={transaction.id}>
//                 <hr />
//                 <Transaction transaction={transaction} />
//               </div>
//             ))
//           }
//           <br />
//         </div>
//       )
//     }

//     return (
//       <div>
//         <div>Data: {dataDisplay}</div>
//         <Button
//           bsStyle="danger"
//           bsSize="small"
//           onClick={this.toggleTransaction}
//         >
//           Show More
//         </Button>
//       </div>
//     );
//}

   render() {
      //console.log('this.displayTransaction', this.displayTransaction)

      const { timestamp, hash } = this.props.block;

      const hashDisplay = `${hash.substring(0, 15)}...`;
      return (
         <div className='Block'>
            <div>Hash: {hashDisplay}</div>
            <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
            {this.displayTransaction}
         </div>
      );
   }
};

export default Block;