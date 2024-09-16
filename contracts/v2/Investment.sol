// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/// @dev Represents on-chain investment. This covers any investment where you deposit single token -> you get another ERC-20 in return.
/// @dev Later you can redeem original investment token
abstract contract Investment is ERC20Upgradeable {

    IERC20 public primary;

    function __SingleTokenInvestment_init_unchained(IERC20 _primary) internal onlyInitializing {
        primary = _primary;
    }

    /// @notice calculates value for the wallet denominated in primary tokens
    function calculateValue(address wallet) public view returns (uint value) {
        uint _totalSupply = totalSupply();
        uint _balance = balanceOf(wallet);
        uint _totalValue = _calculateTotalValue();
        return _totalValue * _balance / _totalSupply;
    }

    /// @notice Calculates total assets denominated in primary tokens
    function _calculateTotalValue() internal view virtual returns (uint total);

    /// @dev Deposits primary token and issues this token
    function deposit(uint amount) external returns (uint issued) {
        require(amount > 0, "Zero amount");
        require(primary.transferFrom(_msgSender(), address(this), amount), "Transfer failed");
        uint toMint = _deposit(amount);
        _mint(_msgSender(), toMint);
        return toMint;
    }

    /// @dev Burns this token and withdraws primary investment token
    function withdraw(uint amount) external returns (uint withdrawn) {
        require(amount > 0, "Zero amount");

        uint _totalSupply = totalSupply();
        _burn(_msgSender(), amount);

        uint toWithdraw = _prepareWithdraw(amount, _totalSupply);
        require(primary.transfer(_msgSender(), toWithdraw), "Transfer failed");
        return toWithdraw;
    }

    /// @dev Prepares liquidity to be withdrawn. Returns amount of tokens to withdraw
    function _prepareWithdraw(uint amount, uint totalSupply) internal virtual returns (uint readyToWithdraw);

    function _deposit(uint amount) internal virtual returns (uint toMint);
}
