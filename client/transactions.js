const $allTransactions = document.querySelector('#all-transactions')
const $miningButton = document.querySelector('#mining-button')

const socket = io()

socket.emit('transactionPoolMessage')     // when no polling, need only this one line
const intervalObj = setInterval( () => {  // poll again in 5 seconds
      socket.emit('transactionPoolMessage')
   }, 
   5000
)

socket.on('transactionPoolMessage', (m) => {
   //console.log(m)   
   const allTransactionsObject = JSON.parse(m)
   $allTransactions.innerHTML = ""  // remove all <div> elements for redrawing on poll
   $allTransactions.insertAdjacentText( 'beforeend', 
         `Transactions - Reporting ${
         Object.keys(allTransactionsObject).length} transactions`)
   
   Object.keys(allTransactionsObject).forEach( t => {

      const transactionDiv = document.createElement("div")
      const hrLine = document.createElement("hr")

      const trFromDivPlaceHolder = document.createElement("div")
      transactionDiv.appendChild(trFromDivPlaceHolder)

      Object.keys(allTransactionsObject[t].outputMap).forEach( k => {
   
         if( k === allTransactionsObject[t].input.address ){
            // this is the outputMap element 'sender':'remaining-amount' 
            const trFromDiv = document.createElement("div")
            const trFromTxt = document.createTextNode( 
                  `From: ${allTransactionsObject[t].input.address.substring(0,6)
                  }.. | Balance: ${allTransactionsObject[t].input.amount
                  } | Remaining: ${allTransactionsObject[t].outputMap[k]}` )
            trFromDiv.appendChild(hrLine)
            trFromDiv.appendChild(trFromTxt)
            transactionDiv.replaceChild(trFromDiv,trFromDivPlaceHolder)
         } else {
            const trToDiv = document.createElement("div")
            const trToTxt = document.createTextNode( 
               `To: ${k.substring(0,6)}.. | Amount: ${allTransactionsObject[t].outputMap[k]}` )
            trToDiv.appendChild(trToTxt)
            transactionDiv.appendChild(trToDiv)
         }
      })
      $allTransactions.appendChild(transactionDiv)
   })
})

socket.on('disconnect', () => {
   clearInterval(intervalObj)
})

$miningButton.onclick = () => {
   socket.emit('mineNewBlockMessage')
}
 
