// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface TokanPair is IERC20 {

    function getReserves() external view returns (uint _reserve0, uint _reserve1, uint _blockTimestampLast);
    function getAmountOut(uint, address) external view returns (uint);
}
