//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0; 

/**
 * This contract contains some private data that isn't really private. 
 * 
 */
contract NonPrivate {
    mapping(address => uint256) private balances;
    string private secretValue;
    
    /**
     * Sets the 'secret' value. This value will be retrievable by either reading the contract's 
     * public memory, or by examining the transaction which created the contract. 
     */
    constructor() {
        secretValue = "hodl";
    }
    
    /**
     * Any user can deposit currency into the contract. 
     */
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
}