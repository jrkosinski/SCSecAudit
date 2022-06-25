# The Moo of Moo

What I won't cover: 
- social engineering attacks like phishing and such 
- mining attacks (though randomess section touches upon this) 
- front-running attacks 

What I will cover: 
- Marvin Margolies

## my list: 
- DelegateCall
- Call to outside contract 
- Sketchy Randomness
- Overflow/underflow
- Reentrancy
- Dynamic calls 
- Fallback methods
- Sketchy Rounding
- Sensitive data 
- Non-private fields 
- Self-destruct 
- Trust issues

#hackernoon list 
- Overflow/underflow
- Reentrancy
- Unexpected ether
- Delegatecall
- Default visibilities
- Entropy illusion 
- External Contract Referencing
- Short Address
- Unchecked CALL Return Values
- Race Conditions / Front Running
- DOS
- Block Timestamp Manipulation
- Constructors with Care
- Unintialised Storage Pointers
- Floating Points and Precision
- Tx.Origin Authentication



## DelegateCall
**Issue: DelegateCall** The EVM currently offers three opcodes for calling to another contract: CALL, CALLCODE, and [DELEGATECALL](https://eips.ethereum.org/EIPS/eip-7). The latter is unique in that, as contract A calls into contract B, the logic of contract B is executed on the _state and memory context of contract A_. When misused it can inadvertently expose sensitive data or logic of contract A, to contract B. While _delegatecall_ in itself is not inherently 'insecure' per se, its context-preserving nature can lead to misunderstandings that can in turn lead to vulnerabilities. It's been the basis of many known major vulnerabilities. 

**Simple Example:** []() for a very basic demonstration TODO:add link 

**Complex Example:** []() for a more complex and realistic demonstration. TODO:add link 

**Real-life Examples:** 
- The [Parity Hack](https://hackingdistributed.com/2017/07/22/deep-dive-parity-bug/) 

**Mitigation/Fix:** It depends on the situation. One might say that first step is to _know_ what delegatecall _does_, and how it behaves, particularly in regard to its context-preserving nature. The next step would be to assess the particular situation. If the calling contract (contract A) contains no state, it might be safe. Or if the callee (contract B) address is fixed and cannot be changed, and the contract at that address can be guaranteed to not do anything dangerous, then it likewise might be ok. If the situation is not simple, then one must attempt to consider every possibility or case in which the code could be called or used, and to develop a detailed suite of tests in an attempt to prove that malicious or accidental misuse is not feasible. 



## Call to Outside Contract
**Issue:** any call to outside unknown contract 

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** 


## Fallback Methods
**Issue: fallback methods **

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:**
- The [Parity Hack](https://hackingdistributed.com/2017/07/22/deep-dive-parity-bug/) 

**Mitigation/Fix:** 


## Sketchy Randomness
**Issue: Sketchy Randomness** Whether or not there exists true randomness in the universe is not a settled matter. In computing, a level of randomness - while not truly random in the scientific sense - can be considered random enough for a given purpose, i.e. an acceptable 'pseudorandom' value. 
In blockchain, the quest for randomness is quite a bit more difficult, as smart contracts execute in a purposely deterministic environment. Intrinsically, there is no real source of randomness available in a smart contract's execution environment, and the search for a solution could easily be the subject of its own book. 
Block numbers and block timestamps have been used to generate randomness. These might be ok for trivial, non-critical use cases (e.g. a game or demo in which nothing of value is at stake), but they can be be both predicted and manipulated, and so are not suitable as real randomness. 
In ETH, block miners have an advantage when it comes to randomness. A hard to solve problem regarding randomness is that miners can easily manipulate the system by throwing out blocks in which the randomly generated value is not favorable to them. Imagine a blackjack game in which the hands dealt to a player are determined by a pseudorandom value. Even if a miner can't directly control the random value generated, the miner can just decline to broadcast blocks until he or she mines a block that deals him or her a favorable hand. 

![Cloudflare generates randomness with lava lamps](https://etherscan.io/address/0xa7ca36f7273d4d38fc2aec5a454c497f86728a7a#code) 
Caption: Cloudflare constantly films lava lamps to generate randomness 

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** 
Need for randomness is a common use case, and perenially problematic one. Chainlink has developed [Chainlink VRF](https://blog.chain.link/chainlink-vrf-on-chain-verifiable-randomness/), "on-chain verifiable randomness". It cleverly 
//TODO: finish, test, and explain 


## Overflow/Underflow
**Overflow/Underflow** Prior to Solidity version 0.8.0, arithmetic operations on intrinsic numeric types would wrap on underflow/overflow. If not expected by the developer, this could cause unexpected data values which could in turn lead to an exploitable situation. 

Take the following code, for example: 
```
function decrementBalance(uint8 _amount) internal returns (uint8) {
   uint8 initialAmount = 0; 
   return (initialAmount - _amount); 
}
```

Prior to Solidity version 0.8.0, calling `decrementBalance(1)` would result in a return value of 255; the max value of uint8. In 0.8.0 and later, the call would be reverted. While it might not always be undesirable, an addition result that is less than the original two operands or a subtraction result that is greater than the original value, might not be what is expected. 

**Simple Example:** [OverUnderflowExample](https://github.com/jrkosinski/SCSecAudit/tree/main/OverUnderflowExample-1) 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** 
- [PoWHC - Proof of Weak Hands Coin](https://medium.com/@ebanisadr/how-800k-evaporated-from-the-powh-coin-ponzi-scheme-overnight-1b025c33b530) 
- [PoWHC code on etherscan](https://etherscan.io/address/0xa7ca36f7273d4d38fc2aec5a454c497f86728a7a#code)

**Mitigation/Fix:** The fix for this prior to Solidity 0.8.0 was to use OpenZeppelin's [SafeMath](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/math/SafeMath.sol) library. This is no longer necessary and the library might become deprecated in the future. The fix prior to _that_ was to add code to manually check each arithmetic operation for overflow/underflow. For example: 
```
function decrementBalance(uint8 _amount) internal returns (uint8) {
   uint8 initialAmount = 0; 
   require(_amount <= initialAmount, "Arithmetic underflow detected; reverting"); 
   return (initialAmount - _amount); 
}
```

Many contracts still exist which were written prior to 0.8 of course, so it's still a valid issue to look for. In 0.8 and later, arithetic operations are checked by default for over/underflow. A transaction will revert by default if overflow/underflow is detected. This behavior can be prevented by using the _unchecked_ block. So if the contract developer actually _did_ want overflow/underflow to occur, he/she could use: 
```
function decrementBalance(uint8 _amount) internal returns (uint8) {
   uint8 initialAmount = 0; 
   unchecked {
      return (initialAmount - _amount); 
   }
}
```
The above code in 0.8.0 and later, would behave exactly as the original code in 0.7.x and earlier.

So if you're auditing a contract written in Solidity 0.8.0 or later, the _unchecked_ keyword will alert you to the possibility of numerical types wrapping around to min or max values. In versions prior to 0.8.0, look for arithmetic performed without the _SafeMath_ library or explicity overflow/underflow checks. Then thouroughly test what will happen if overflow or underflow occurs.


## Reentrancy
**Issue: Reentrancy** The idea of [reentrancy](https://en.wikipedia.org/wiki/Reentrancy_(computing)) in computing is a superset of what we're discussing here in terms of EVM security vulnerabilities. This can be a vulnerability in that can lead to unexpected (by the developer) consequences, which may in some cases be exploitable. This has famously been used in exploits in which a contract method behaves as such (pseudocode): 

```
REENTRANT METHOD: {
   1. perform check: does caller have enough balance? 
   2. send requested amount to caller 
   3. deduct amount from balance 
}
```

... wherein the second step indirectly causes the method to be called again. Since the balance has not been debited, the check at step 1 will succeed again. In step 2, the method will be called again, draining the contract of funds. 

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** 
- The very well-known [DAO hack](https://thebitcoinnews.com/the-dao-hack-and-blockchain-security-vulnerabilities/) 
- The [BurgerSwap attack](https://halborn.com/explained-the-burgerswap-hack-may-2021/) 
- TODO: others? 

**Mitigation/Fix:** OpenZeppelin's ReentrancyGuard offers a robust solution. Essentially what it does is set a state flag on entering the method, and unsets it on exiting the method; so this method can be implemented organically very easily. Alternatively (or in addition), an accepted best practice is to use the _checks-effects-interactions_ pattern, wherein the _check_ (e.g. checking the caller's balance) is done first, followed by the _effects_ (e.g. in this case, debiting the caller's balance), with the _interaction_ (calling the outside contract) performed last. In the simple example case, if the _interaction_ failed, the _effects_ can be reverted so that the state stays consistent with reality. 


## Dynamic Calls
**Issue:** methods that accept dynamic calls 

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** 


## Sketchy Rounding
**Issue: Sketchy Rounding** sketchy rounding 

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** 


## Sensitive Data 
**Issue: Sensitive Data** Contract users and developers alike must be aware and remember that there are no secrets on the blockchain. Any data that should not be publicly read, must _not_ in any case be stored in the blockchain, even as 'private' variables, because that data is still readable. Any data that must be available to the contract but cannot be publicly seen must be stored off-chain, and accessible perhaps by hash only. 
This doesn't apply only to contract state, but equally to any data with which the contract interacts. Take a hypothetical case in which a contract method requires a specific secret passcode, and wisely the developer of the contract stored only the hash of the required passcode in the contract, as a private variable. An attacker could still scan transactions associated with the contract for calls in which the correct passcode was passed in by a caller; in these, the correct passcode will be stored in the transaction and clearly readable. 

**Simple Example:** [NonPrivateDataExample](https://github.com/jrkosinski/SCSecAudit/tree/main/NonPrivateDataExample) 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** Don't store non-public data in the contract, and ensure that none will be found in the contract's transactions or events. Sensitive data can be stored off-chain, and verified by hash. 



## Non-Private Fields 
**Issue: Non-private Fields** Very simply, data that is not to be edited should be private. While private variables in an EVM smart contract are not 'private' in the sense of being 'secret' (i.e., they can certainly be read), they are not publicly writable. It would be a noob mistake to accidentally publish a contract with an unintentionally public variable, it surely has happened before. An attacker scanning for vulnerabilities may notice this mistake and take advantage. 

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** Just make fields and functions as non-public as possible. Internal is the default 


## SelfDestruct 
**Issue: SelfDestruct** The [SELFDESTRUCT](https://docs.soliditylang.org/en/v0.4.21/units-and-global-variables.html?highlight=selfdestruct#contract-related) opcode used to be called _suicide_, and will apparently not be possible in the future with Verkle trees. When invoked within a contract, the SELFDESTRUCT opcode will 'destroy' the contract's state, essentially rendering it unusable, and - here's the kicker - it forwards the entirety of the contract's code to a specified address. The rationale was as sort of a 'nuclear option' or a recourse for a contract found to be vulnerable or buggy. The command could allow the administrator of the contract, for example, a way to move all of the contract's funds to a fixed version of the contract. For such a powerful operation, if you see this opcode invoked within a contract's code, it will be important to ask: who can call the code that calls self-destruct, and under what circumstances? To what address will the funds be forwarded, and can that address be changed? Would it be possible for an attacker to gain access to this code in any way? Aside from that, it raises all sorts of trust issues. Breaking the immutability principle of the contract, can you trust whomever has access to this code, to use it ethically? 

**Simple Example:** []() TODO:add link 

**Complex Example:** []() TODO:add link 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** 


# Trust Issues 


**Issue:** Upgradeability. This issue is too big to do more than just scratch the surface here, so I will try to make it as concise as I can. Upgradeability of a contract fundamentally breaks immutability. This is not to say there are not valid use cases for it; there certainly are. There are many different upgradeability patterns, not all of which completely break immutability. But to again use a comparison to a legal contract, would you enter into a contract that had a clause saying "the entire terms and content of this contract may be changed at any time, and you will remain legally bound to the new terms"? 

**Mitigation/Fix:** 

- oracles
- self-destruct
- centralization


