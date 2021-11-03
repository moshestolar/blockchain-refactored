//  The CLIENT
//const chatForm = document.querySelector('form'/*'#sendchattext'*/)
//const chatText = document.querySelector('input')

console.log('A proprietary "hello" from /client/index.js !')

const socket = 
   io()     // this io() causes sending a 'connection' msg to the server

// Elements.  $-sign is a convention to let know the variable is an element from the DOM
//const $messages = document.querySelector('#messages')

const $blockchainHello = document.querySelector('#blockchain-hello')
const $allBlocks = document.querySelector('#all-blocks')

socket.on( 'welcomeMessage', (m) => {
   // console.log(m)
   //$messages.insertAdjacentText('beforeend', m)
   const startupData = JSON.parse(m)
   const chain = startupData.chain

   // Construct div $blockchainHello
   const $blockchainHelloAddress = document.querySelector('#blockchain-hello-address')
   const $blockchainHelloBalance = document.querySelector('#blockchain-hello-balance')
   $blockchainHelloAddress.insertAdjacentText('beforeend', `${startupData.address.substring(0,6)}..`)
   $blockchainHelloBalance.insertAdjacentText('beforeend', startupData.balance)

   // Construct div $allBlock
   $allBlocks.insertAdjacentText('beforeend', `Reporting ${startupData.chain.length} blocks`)
   chain.map( b => {
      let showLessInfo = true
      
      const newDivTech = document.createElement("div")
      const newTxtTechLong = document.createTextNode("· hash:"+b.hash.substring(0, 16)+"... - nonce:"+b.nonce+" - difficulty:"+b.difficulty)
      const newTxtTechShort = document.createTextNode("· hash:"+b.hash.substring(0, 8)+"...")
      const newDivTechLong = document.createElement("div")
      const newDivTechShort = document.createElement("div")

      // Fill up the technical division in short form
      newDivTechShort.appendChild(newTxtTechShort)      
      // Fill up the technical division in detailed form
      newDivTechLong.appendChild(newTxtTechLong) 
      b.data.map( t => {     // loop on transactions
         const { input, outputMap } = t
         Object.keys(outputMap).forEach( trKey => {  // examine every transfer of the outputMap of the transaction 

            if( trKey===input.address ) // the key-value pair in outputMap is:  'sender's key':amount (how much sender had before conducting transaction)
               ; // do nothing
            else {
               const hrLine = document.createElement("hr")
               const divLong = document.createElement("div")
               const txtLong = document.createTextNode( 
                  `· from: ${input.address.substring(0,6)}
                  .. | to: ${trKey.substring(0,6)}
                  .. | sent: ${outputMap[trKey]}
                   | sender had: ${input.amount}`
               )
               divLong.appendChild(hrLine)
               divLong.appendChild(txtLong)
               newDivTechLong.appendChild(divLong)
            }
         })
      })
      if( showLessInfo )
         newDivTech.appendChild(newDivTechShort)      
      else
         newDivTech.appendChild(newDivTechLong)      

      // Create the timestamp division
      const newDivTime = document.createElement("div")
      const newTxtTime = document.createTextNode("• "+new Date(b.timestamp).toUTCString())
      newDivTime.appendChild(newTxtTime)      

      // Create the button for toggling the view of the technical division - short or detailed
      const newButton = document.createElement('button')    //REMARKABLE: 'button' or "button"!
      newButton.innerHTML = (showLessInfo) ? 'show more' : 'show less'
      newButton.className = 'block-btn-style'
      newButton.onclick = () => {
         showLessInfo = !showLessInfo
         newButton.innerHTML = (showLessInfo) ? 'show more' : 'show less'
         if( showLessInfo ) 
            newDivTech.replaceChild( newDivTechShort, newDivTechLong ) //Doc: https://developer.mozilla.org/en-US/docs/Web/API/Node/replaceChild
         else
            newDivTech.replaceChild( newDivTechLong, newDivTechShort )
      }

      // Finally, populate the all-blocks area
      const newDiv = document.createElement("div")
      newDiv.className = 'block_pattern'
      newDiv.appendChild(newDivTime)      
      newDiv.appendChild(newDivTech)      
      newDiv.appendChild(newButton)
      $allBlocks.appendChild(newDiv)
   })
   // At this point both divisions, $allBlocks and $blockchainHello are ready.  Display the right one.
   //$allBlocks.replaceWith( $blockchainHost2 )
})

const toggleDiv = ()=> { // ref.: https://forums.digitalpoint.com/threads/using-javascript-to-switch-between-two-div-sections.1424493/
   if( $allBlocks.style.display == 'block' ) {
      $allBlocks.style.display = 'none'
      $blockchainHello.style.display = 'block'
   }
   else {
      $allBlocks.style.display = 'block'
      $blockchainHello.style.display = 'none'
   }
   return false  // A must! ref.: https://flaviocopes.com/links-for-javascript/
}

//  DOESN'T EXPORT.  WHY ? 
//  module.exports = toggleDiv
//  export default toggleDiv
