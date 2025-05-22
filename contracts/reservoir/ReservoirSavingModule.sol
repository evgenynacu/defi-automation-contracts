// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ReservoirSavingModule {
    function redeem(uint256 amount) external;
    function previewRedeem(uint256 amount) external view returns (uint256);
    function currentPrice() external view returns (uint256);
    function redeemFee() external view returns (uint256);
}