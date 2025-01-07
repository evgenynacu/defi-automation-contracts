// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// @notice This strategy is used just for emitting balance of token0 and token1
contract BalancesStrategy {
    IERC20 private immutable TOKEN0;
    IERC20 private immutable TOKEN1;

    event Balances(uint balance0, uint balance1);

    constructor(IERC20 token0, IERC20 token1) {
        TOKEN0 = token0;
        TOKEN1 = token1;
    }

    function emitState() external {
        uint balance0 = TOKEN0.balanceOf(address(this));
        uint balance1 = TOKEN1.balanceOf(address(this));
        emit Balances(balance0, balance1);
    }

    function readState() external view {
    }
}
