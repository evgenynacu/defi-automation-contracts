// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StrataSwapStrategy
 * @notice Strategy for swapping PT-srUSDe tokens through StrataSwap contract
 * @dev Simplified strategy without validation - trusts the StrataSwap contract
 */
contract StrataSwapStrategy {
    using SafeERC20 for IERC20;

    error SwapFailed(address router, string reason);

    address private immutable strataSwap;

    constructor(address _strataSwap) {
        strataSwap = _strataSwap;
    }

    /**
     * @notice Swaps token0 for token1 via StrataSwap contract
     * @dev Returns amount of tokens received. Router parameter is ignored - always uses strataSwap from constructor.
     * @param token0 Input token (PT-srUSDe)
     * @param token1 Output token
     * @param swapData Calldata for StrataSwap.swap()
     * @return output Amount of token1 received
     */
    function swap(IERC20 token0, IERC20 token1, address /* swapRouter */, bytes calldata swapData) external returns (uint output) {
        // swapRouter parameter is ignored - we always use our trusted strataSwap contract

        // 1. Get initial balance
        uint amountBefore = token1.balanceOf(address(this));

        // 2. Approve token0 to StrataSwap
        _approveSwap(token0, strataSwap);

        // 3. Execute swap via StrataSwap
        (bool success, bytes memory result) = strataSwap.call(swapData);
        if (!success) {
            string memory errorMessage = result.length > 0
                ? abi.decode(result, (string))
                : "Unknown error";

            revert SwapFailed(strataSwap, errorMessage);
        }
        token0.approve(strataSwap, 0);

        // 4. Get final balance and calculate output
        uint amountAfter = token1.balanceOf(address(this));

        output = amountAfter - amountBefore;
    }

    function _approveSwap(IERC20 token0, address exchange) internal {
        if (token0.allowance(address(this), address(exchange)) == 0) {
            token0.forceApprove(exchange, type(uint256).max);
        }
    }
}
