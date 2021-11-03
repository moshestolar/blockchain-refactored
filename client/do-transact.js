console.log('Client side do-transact javascript file is loaded!')

const $form = document.querySelector('form')
const $entryRecipient = document.querySelector("input[name='entry-recipient']")
const $entryAmount = document.querySelector("input[name='entry-amount']")

const socket = io()

$form.addEventListener('submit', (e) => {
   e.preventDefault()

   socket.emit(   'doTransactMessage', 
                  {  recipient: $entryRecipient.value, 
                     amount: $entryAmount.value
                  },
                  (result) => {
                     if(result === 'Transaction Success') 
                        location.href = '/transactions'
                     else  //error
                        alert(result)
                  }
               )
})
   // messageOne.textContent = 'Loading...'
   // messageTwo.textContent = ''