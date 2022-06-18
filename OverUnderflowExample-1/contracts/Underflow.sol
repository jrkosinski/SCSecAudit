//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0; 

/**
 * Demonstrates a very simple example of a vulnerability caused by unexpected arithmetic underflow, 
 * such that the situation can be exploited to drain a contract of funds. 
 * 
 */
contract Underflow {
    mapping(address => uint256) private balances;
    
    /**
     * Any user can deposit currency into the contract, to be retrieved later. 
     */
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    /**
     * Any user who has deposited currency, can withdraw up to and including the total amount 
     * deposited by the user. 
     * @param _amount the amount to withdraw. 
     */
    function withdraw(uint256 _amount) external {
        //make sure user's balance is enough 
        require(balances[msg.sender]  - _amount >= 0, "Insufficient balance");  
        
        //debit the caller's balance first (checks-effects-interactions)
        balances[msg.sender] -= _amount; 
        
        //send the ether to caller 
        (bool success, ) = payable(msg.sender).call{value:_amount}(""); 
        
        //revert if call failed 
        require(success); 
    }
}