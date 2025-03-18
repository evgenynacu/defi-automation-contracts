// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

/**
 * @title SwapStrategy
 * @notice Strategy for swapping assets to other assets
 */
contract SwapStrategy {
    error SwapFailed(address router, string reason);

    function readState() external view {
    }

    /**
     * @notice Swaps token0 for token1
     * @dev Returns amount of tokens received
     */
    function swap(IERC20 token0, IERC20 token1, address swapRouter, bytes calldata swapData) external returns (uint output) {
        // 1. Get initial value
        uint amountBefore = token1.balanceOf(address(this));

        // 2. Do swap via router
        _approveSwap(token0, swapRouter);
        (bool success, bytes memory result) = swapRouter.call(swapData);
        if (!success) {
            string memory errorMessage = result.length > 0
                ? abi.decode(result, (string))
                : "Unknown error";

            revert SwapFailed(swapRouter, errorMessage);
        }

        // 3. Get final value and calculate output
        uint amountAfter = token0.balanceOf(address(this));

        output = amountAfter - amountBefore;
    }

    function _approveSwap(IERC20 token0, address exchange) internal {
        if (token0.allowance(address(this), address(exchange)) == 0) {
            token0.approve(exchange, type(uint256).max);
        }
    }
}