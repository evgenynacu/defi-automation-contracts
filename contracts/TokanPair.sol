// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface TokanPair is IERC20 {
    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256);
}
