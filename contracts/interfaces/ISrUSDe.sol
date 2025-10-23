// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

interface ISrUSDe {

    function previewRedeem(uint256 shares) external view returns (uint256);
}
