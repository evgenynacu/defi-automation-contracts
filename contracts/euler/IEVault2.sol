// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEVault2 {
    function accountLiquidity(address account, bool liquidation) external view returns (uint256 collateralValue, uint256 liabilityValue);

    function balanceOf(address owner) external view returns (uint);

    function debtOf(address owner) external view returns (uint);

    function convertToAssets(uint256 shares) external view returns (uint256);

    function asset() external view returns (address);

    // Deposit underlying assets, mint shares to receiver
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    // Withdraw underlying assets to receiver, burning from owner
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);

    // Borrow underlying assets to receiver; debt is recorded to the EVC "account" context
    function borrow(uint256 assets, address receiver) external returns (uint256 assetsBorrowed);

    // Repay underlying assets on behalf of a specific account (debt owner)
    function repay(uint256 assets, address onBehalfOf) external returns (uint256 sharesRepaid);
}
