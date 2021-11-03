This repo is my refactoring of the official sources for Udemy online course "Build a Blockchain & Cryptocurrency | Full-Stack Edition" (https://www.udemy.com/course/build-blockchain-full-stack/)

The reasoning for this effort is that the frontend of the Udemy Project is developed based on the React library.  I got rid of React in favor of Socket.IO.  I find developing the frontend with Socket.IO to be much more simple.  It is here sufficient to mention that working with Socket.IO eliminates the need to work with a distribution folder, client/dist.

While refactoring, which involved extensive testing, I pinpointed and fixed two showstopper bugs in the implementation of the blockchain.  The bugs were in the design of functions calculateBalance() and validTransactionData().
