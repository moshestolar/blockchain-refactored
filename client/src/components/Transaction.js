import React from 'react'
//import Blocks from './Blocks'

// The Component class will not be imported, an alternative syntax to create the component will 
// be used this time. The syntax is called "the statelets functional style of creating a component".
// A component in this syntax has to be stateless. The syntax only works if the component 
// doesn't need to modify any state throughout the life of its component.

// const Transaction = () => {
//    const { input, outputMap } = transaction
// }
// // Where are we going to get 'transaction' from?  Answer: 
// // from Block.js, line const "{ data } = this.props.block" in "get displayTransaction()", meaning,
// // "from parent"
// const Transaction = props => {
//    const { input, outputMap } = props.transaction
// }
// // Now do destructuring, getting rid of props and thus rendering the final result:

const Transaction = ({transaction }) => {
   const { input, outputMap } = transaction
   const recipients = Object.keys(outputMap)

   return (
      <div className='Transaction'>
         <div>From: {`${input.address.substring(0, 20)}...`} | Balance: {input.amount}</div>
         {
            recipients.map(recipient => (
               <div key={recipient}>
                  To: {`${recipient.substring(0, 20)}...`} | Sent: {outputMap[recipient]}
               </div>
            ))
         }
      </div>
   )
}

export default Transaction