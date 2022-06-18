const { ethers } = require("hardhat");
const Runner = require("./lib/runner");
const utils = require("./lib/utils");

/**
 * Reading most variables from storage requires just knowing the storage slot index. 
 * Storage slot identifiers of mapping need to be calculated, and the mapping key must be known. 
 */
Runner.run(async (provider, owner) => {
    const contract = await utils.deployContract("NonPrivate"); 
    console.log();
    
    //deposit some funds 
    await contract.deposit({value:11}); 
    
    //read value of string storage 
    console.log(`secret password is ${ethers.utils.toUtf8String(await provider.getStorageAt(contract.address, 1)).trim()}`); 
    
    //read value of mapping 
    console.log(`balance of owner is ${
        parseInt(await provider.getStorageAt(contract.address, ethers.utils.keccak256(
            new ethers.utils.AbiCoder().encode(
                ["address", "uint256"], [owner.address, 0])
            )
        ))
    }`); 
});
