# The Moo of Moo

## Intro 
An effective security audit of a smart contract is a process of many steps: manual scanning, poring over code and documentation, use of automated tools, collaboration, testing, and creativity. Of this process, manually scanning the code is just one of many essential steps. This article is meant to help with the initial scan of the code; there are aspects of contract programming which are slightly more likely to present openings for attack than others, and this list is meant to list just a few (of many) important things that may catch the security auditor's (or hacker's) eye and warrant further examination. 

**What this article won't cover** 
- social engineering attacks like phishing and such; this article is focused on faults in coding, and so other types of non-coding attacks are not directly addressed (but would be addressed in the broader scope of a security audit)
- mining attacks (though randomess section touches upon this) 
- front-running attacks 
- as this article is EVM and Solidity-centric, it doesn't directly cite examples from other smart contract platforms; but many of the broader concepts can easily be applied to other platforms

**Disclaimer** 
When beginning a security audit, one should not exclude any part of the system from potential scrutiny, in order to not create blind spots. However, certain points may catch one's eye as more deserving of a closer look than others. This article simply provides a few _examples_ of those in the context of Solidity/EVM smart contracts. This list is neither complete nor exhaustive, and simply scanning for these potential faults alone definitely does _not_ constitute a thorough security audit. For more info on contract security audits, check out //TODO: put some good resource(s) here. 


## code todo: 
- finish delegatecall example 
- Ethernaut CoinFlip 
- standalone Reentrancy
- 

## my list: 
- DelegateCall
- Call to outside contract 
- Sketchy Randomness
- Overflow/underflow
- Reentrancy
- Dynamic calls 
- Sketchy Rounding
- Sensitive data 
- Self-destruct 

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
**Issue: DelegateCall** The EVM currently offers three opcodes for calling to another contract: CALL, CALLCODE, and [DELEGATECALL](https://eips.ethereum.org/EIPS/eip-7). The latter is unique in that, as contract A calls into contract B, the logic of contract B is executed on the _state and memory context of contract A_. When misused it can inadvertently expose sensitive data or logic of contract A, to contract B. While _delegatecall_ in itself is not inherently 'insecure' per se, its context-preserving nature can lead to misunderstandings that can in turn lead to vulnerabilities. It can open up subtle vulnerabilities that are easy to miss. It's been the basis of many known major attacks. 

**Simple Example:** [DelegateCallExample](https://github.com/jrkosinski/SCSecAudit/tree/main/DelegateCallExample) 

**Complex Example:** [Ethernaut Preservation](https://github.com/jrkosinski/Ethernaut/tree/main/Preservation) 

**Real-life Examples:** 
- The [Parity Hack](https://hackingdistributed.com/2017/07/22/deep-dive-parity-bug/) 

**Mitigation/Fix:** It depends on the situation. Delegatecall is useful, so simply avoiding it is not necessarily desirable. One might say that first step is to _know_ what delegatecall _does_, and how it behaves, particularly in regard to its context-preserving nature. The next step would be to assess the particular situation. If either the caller or the callee, or both, are stateless, you might be safe. Or if the callee (contract B) address is fixed and cannot be changed, and the contract at that address can be audited and reasonably guaranteed to not do anything dangerous, then it likewise might be ok. If the situation is not simple, then one must attempt to consider every possibility or case in which the code could be called or used, and to develop a detailed suite of tests in an attempt to prove that malicious or accidental misuse is not feasible. 

//TODO: library use case (stateless) 



## Call to Outside Contract
**Issue:** This is a generalization of the **delegatecall** issue. Whereas delegatecall is a specific type of variety of call to an outside contract, any call to an outside contract could be a potential red flag, _especially_ when the contract address is dynamically determined. The keys here would be the nature of the contract being called, and more importantly, what assumptions are being made about that contract. 
A call to an external contract could take the form of a low-level call (like _call_, _callcode_, or _delegatecall_) or a high-level call (such as casting an address to a specific interface and calling a function). Calling an outside contract, depending on the context, can introduce some dangerous uncertainty. There is a range of insecurity associated with this type of scenario, depending on the details. 
- High-level call to a known contract whose address is either set in the contstructor, hard-coded, or created by the parent contract. This is the minimum level of risk, because assumptions about the contract can safely be made. 
- High-level call to a contract whose address is not completely under the developer's control. The number of assumptions that can safely be made is drastically reduced. 
- Any call to a contract whose address is not known until runtime, for example, calling back to the caller of a method (see example below). This is the most dangerous; essentially no assumptions can safely be made about the contract being called. 
- In the above case, if the call is a delegatecall, and the parent contract holds any state, then the contract is most likely not safe to release or use. In that case, you would be essentially inviting unwanted shenanigans. 

```
//maximum safety, assuming that the called contract has been audited thoroughly
ISwordfish sw = ISwordfish(0xa36085F69e2889c224210F603D836748e7dC00aa); 
sw.doTheThing();
```

```
//minimum safety
function veryUnsafe() public {
   //just throw all caution to the wind and hope no one notices
   msg.sender.delegatecall(funcSelector); 
}
```

It should definitely be noted that this vulnerability can occur when you think you are just sending ether to an address. The address that you're sending to may be a contract. Sending ether to an unknown (dynamic) address should always be considered as a call to an outside contract. Your _call_ or _send_ or _transfer_ to that address may be invoking a _receive_ or _fallback_ method on said contract. If the address is dynamic, then you won't know (at runtime) what sort of evil shenanigans that contract may invoke. 
//TODO: verify the above 
//TODO: can you really not know? 

**Simple Example:** []() TODO:add link 

**Complex Example:** [Ethernaut Reentrancy](https://github.com/jrkosinski/Ethernaut/tree/main/Reentrancy) 

**Real-life Examples:** TODO: real-life examples

**Mitigation/Fix:** 
This is mostly about assumptions and design. If your contract design has you calling unknown addresses, the first question to ask might be "is this necessary?". The answer might well be yes, and that's ok. But if it's a completely unknown address, completely out of the developer's control (e.g. msg.sender), then _no_ assumptions can be made about what that address might be. 
//TODO: finish this 

## Sketchy Randomness
**Issue: Sketchy Randomness** Whether or not there exists true randomness in the universe is not a settled matter. In computing, a level of randomness - while not truly random in the scientific sense - can be considered random enough for a given purpose, i.e. an acceptable 'pseudorandom' value. 
In blockchain, the quest for randomness is quite a bit more difficult, as smart contracts execute in a purposely deterministic environment. Intrinsically, there is no real source of randomness available in a smart contract's execution environment, and the search for a solution could easily be the subject of its own book. 
Block numbers and block timestamps have been used to generate randomness. These might be ok for trivial, non-critical use cases (e.g. a game or demo in which nothing of value is at stake), but they can be be both predicted and manipulated, and so are not suitable as real randomness. 
In ETH, block miners have an advantage when it comes to randomness. A hard to solve problem regarding randomness is that miners can easily manipulate the system by throwing out blocks in which the randomly generated value is not favorable to them. Imagine a blackjack game in which the hands dealt to a player are determined by a pseudorandom value. Even if a miner can't directly control the random value generated, the miner can just decline to broadcast blocks until he or she mines a block that deals him or her a favorable hand. 

![Cloudflare generates randomness with lava lamps](cloudflare-lava.png) 
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

**Complex Example:** [Ethernaut Reentrancy](https://github.com/jrkosinski/Ethernaut/tree/main/Reentrancy)

**Real-life Examples:** 
- The very well-known [DAO hack](https://thebitcoinnews.com/the-dao-hack-and-blockchain-security-vulnerabilities/) 
- The [BurgerSwap attack](https://halborn.com/explained-the-burgerswap-hack-may-2021/) 
- TODO: others? 

**Mitigation/Fix:** OpenZeppelin's ReentrancyGuard offers a robust solution. Essentially what it does is set a state flag on entering the method, and unsets it on exiting the method; so this method can be implemented organically very easily. Alternatively (or in addition), an accepted best practice is to use the _checks-effects-interactions_ pattern, wherein the _check_ (e.g. checking the caller's balance) is done first, followed by the _effects_ (e.g. in this case, debiting the caller's balance), with the _interaction_ (calling the outside contract) performed last. In the simple example case, if the _interaction_ failed, the _effects_ can be reverted so that the state stays consistent with reality. 

NOTE: you can't tell if what you're calling is a smart contract or not (reliably) 
NOTE: can happen when you're just sending money (if the target is a smart contract) 
NOTE: see also 'calls to outside contracts' 

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


## SelfDestruct 
**Issue: SelfDestruct** The [SELFDESTRUCT](https://docs.soliditylang.org/en/v0.4.21/units-and-global-variables.html?highlight=selfdestruct#contract-related) opcode used to be called _suicide_, and will apparently not be possible in the future with Verkle trees. When invoked within a contract, the SELFDESTRUCT opcode will 'destroy' the contract's state, essentially rendering it unusable, and - here's the kicker - it forwards the entirety of the contract's code to a specified address. The rationale was as sort of a 'nuclear option' or a recourse for a contract found to be vulnerable or buggy. The command could allow the administrator of the contract, for example, a way to move all of the contract's funds to a fixed version of the contract. For such a powerful operation, if you see this opcode invoked within a contract's code, it will be important to ask: who can call the code that calls self-destruct, and under what circumstances? To what address will the funds be forwarded, and can that address be changed? Would it be possible for an attacker to gain access to this code in any way? Aside from that, it raises all sorts of trust issues. Breaking the immutability principle of the contract, can you trust whomever has access to this code, to use it ethically? 

**Simple Example:** [SelfDestructExample](https://github.com/jrkosinski/SCSecAudit/tree/main/SelfDestructExample) 

**Complex Example:** [Ethernaut Motorbike](https://github.com/jrkosinski/Ethernaut/blob/main/Motorbike/)

**Real-life Examples:**
- The [Parity Hack](https://hackingdistributed.com/2017/07/22/deep-dive-parity-bug/) 

**Mitigation/Fix:** 
This is more of a trust issue than a technical issue. The use case that it is presumably trying to address is the case that the contract has become unusable, obsolete, stuck, or compromised, and self-destructing is a last-ditch effort to salvage the contract's funds to presumably move to a new contract. As a trust issue, this is more of an issue for the consumer of the contract than the provider.
For the developer, the main problem is that if any malicious actor can possibly acquire the right to execute the self-destruct code, they may just have carte blanche to steal all of the contract's funds in one step, without any further difficulty. So the developer should be asking: 
- is there any possible way that anyone could fraudulently execute the self-destruct code? 
- is there any safer way to satisfy the use case? For example, an upgradeable pattern? 
Using an upgradeable pattern (for example UUPS), while presenting no more or less of a trust issue to the consumer, could satisfy the use case of being an "ejector seat" for a troubled contract, with a lesser degree of exposure. So if the answer to the first question was a 'yes' or a 'maybe', then upgradeability could be a potential alternative. 


# Upcoming Article Ideas
- 3rd party auditing tools (Slither and Mythril) 
- broader steps in security audit 
- drill down to just one single type of attack 
- breakdown of a specfic historical attack 
