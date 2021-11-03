// search Google for 'sha256 generator', 1st hit is "SHA256 Online" - 
// https://emn178.github.io/online-tools/sha256.html
// feed it 'foo' as input (without the apostrophes)

const cryptoHash = require('./crypto-hash')

describe('cryptoHash()', () => {
   it('generates a SHA-256 hashed output', () => {
      //Due to making a bug fix in cryptoHash,
      // re-generate the 'toEqual' reference value (at the above mentioned URL) 
      // by entering not 'foo' (without the apostrophes, 3 chars), but "foo" (5 chars)
      //
      // note: in chrome console:
      // > "B2213295D564916F89A6A42455567C87C3F480FCD7A1C15E220F17D7169A790B".toLowerCase()
      //
      expect(cryptoHash('foo'))
      //   .toEqual('2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae')
           .toEqual('b2213295d564916f89a6a42455567c87c3f480fcd7a1c15e220f17d7169a790b')
   }) 
   it('produces the same hash with the same input arguments in any order', () => {
      expect(cryptoHash('one', 'two', 'three'))
         .toEqual(cryptoHash('three', 'one', 'two'))
   }) 
   it('produces a unique hash when the properties of the input have changed', () => {
      const foo = {}
      const originalHash = cryptoHash(foo)
      foo['a'] = 'a'  // now foo is { a: "a" }
      
      // Fails, since the reference to the *object*, 'foo', did not change!
      // The above comment was made before fixing cryptoHash, after the fix it wokrs!
      expect(cryptoHash(foo)).not.toEqual(originalHash) 
   }) 
})