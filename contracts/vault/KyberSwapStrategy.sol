// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {KyberSwapValidator} from "./swaps/KyberSwapValidator.sol";

/**
 * @title SafeSwapStrategy
 * @notice Strategy for swapping assets to other assets
 * @notice this strategy allows only some calls (validates router and recipient)
 */
contract KyberSwapStrategy {
    using SafeERC20 for IERC20;

    error SwapFailed(address router, string reason);

    address private immutable router;

    constructor(address _router) {
        router = _router;
    }

    /**
     * @notice Swaps token0 for token1
     * @dev Returns amount of tokens received
     */
    function swap(IERC20 token0, IERC20 token1, address swapRouter, bytes calldata swapData) external returns (uint output) {
        require(swapRouter == router, "incorrect router");

        // Validate function signature and receiver
        _validateSwapData(swapData);

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
        token0.approve(swapRouter, 0);

        // 3. Get final value and calculate output
        uint amountAfter = token1.balanceOf(address(this));

        output = amountAfter - amountBefore;
    }

    /**
     * @notice Validates swap data to ensure only allowed functions are called with correct receiver
     * @param swapData The calldata to validate
     */
    function _validateSwapData(bytes calldata swapData) internal view {
        address receiver = KyberSwapValidator._validateSwapData(swapData);
        require(receiver == address(this), "!RECEIVER");
    }

    function _approveSwap(IERC20 token0, address exchange) internal {
        if (token0.allowance(address(this), address(exchange)) == 0) {
            token0.forceApprove(exchange, type(uint256).max);
        }
    }
}