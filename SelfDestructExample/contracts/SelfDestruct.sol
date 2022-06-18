//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0; 

/**
 * Would you deposit funds into this contract?
 * 
 */
contract SelfDestruct {
    mapping(address => uint256) private balances;
    
    /**
     * Any user can deposit currency into the contract, for any reason or for no reason. 
     */
    function takeMyMoney() external payable {
        balances[msg.sender] += msg.value;
    }
    
    /**
     * Unconditionally self-destructs the contract and sends all funds to the specified address. 
     */
    function getFreeMoney(address payable _recipient) external {
        selfdestruct(_recipient); 
    }
}