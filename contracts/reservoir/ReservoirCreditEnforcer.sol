// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ReservoirCreditEnforcer {
    function mintStablecoin(uint256 amount) external returns (uint256);
    function mintSavingcoin(uint256 amount) external returns (uint256);
}