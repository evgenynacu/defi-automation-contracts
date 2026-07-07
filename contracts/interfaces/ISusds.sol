// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

// Minimal view interface for the sUSDS ERC4626 vault, used off-chain to quote amounts.
interface ISusds {
    function previewDeposit(uint256 assets) external view returns (uint256 shares);
    function previewRedeem(uint256 shares) external view returns (uint256 assets);
}
