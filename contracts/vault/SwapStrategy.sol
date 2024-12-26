// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

contract SwapStrategy {
    enum ValueSide {
        TOKEN0,
        TOKEN1
    }

    IUniswapV3Pool private immutable PRICE_POOL;
    IERC20 private immutable TOKEN0;
    IERC20 private immutable TOKEN1;
    ValueSide private immutable VALUE_SIDE;

    error SwapFailed(address router, string reason);

    constructor(address pricePool, ValueSide valueSide) {
        PRICE_POOL = IUniswapV3Pool(pricePool);
        TOKEN0 = IERC20(PRICE_POOL.token0());
        TOKEN1 = IERC20(PRICE_POOL.token1());
        VALUE_SIDE = valueSide;
    }

    function swap(address swapRouter, bytes calldata swapData) external returns (int256 loss) {
        // 1. Get initial value
        uint256 initialValue = _calculateValue();

        // 2. Do swap via router
        (bool success, bytes memory result) = swapRouter.call(swapData);
        if (!success) {
            string memory errorMessage = result.length > 0
                ? abi.decode(result, (string))
                : "Unknown error";

            revert SwapFailed(swapRouter, errorMessage);
        }

        // 3. Get final value and calculate loss
        uint256 finalValue = _calculateValue();

        // Return loss in millionths (-1e6 = -100%, 0 = 0%, 1e6 = 100%)
        return int256(1000000) * int256(initialValue - finalValue) / int256(initialValue);
    }

    function _calculateValue() internal view returns (uint256) {
        (uint160 sqrtPriceX96,,,,,,) = PRICE_POOL.slot0();
        uint256 balance0 = TOKEN0.balanceOf(address(this));
        uint256 balance1 = TOKEN1.balanceOf(address(this));

        if (VALUE_SIDE == ValueSide.TOKEN0) {
            // Convert everything to token0
            uint256 valueToken1InToken0 = balance1 * 2**192 / (uint256(sqrtPriceX96) * uint256(sqrtPriceX96));
            return balance0 + valueToken1InToken0;
        } else {
            // Convert everything to token1
            uint256 valueToken0InToken1 = balance0 * uint256(sqrtPriceX96) * uint256(sqrtPriceX96) / 2**192;
            return valueToken0InToken1 + balance1;
        }
    }
}