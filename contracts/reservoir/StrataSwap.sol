// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interface for srUSDe contract (ERC4626-like)
interface ISrUSDe {
    function redeem(address token, uint256 shares, address receiver, address owner) external returns (uint256);
}

/**
 * @title StrataSwap
 * @notice Contract for swapping PT tokens through srUSDe to final token
 * @dev Flow: PT-srUSDe -> srUSDe -> sUSDe -> final token
 */
contract StrataSwap {
    using SafeERC20 for IERC20;

    error InsufficientOutput(uint256 expected, uint256 actual);
    error SwapFailed(string reason);

    // Pendle Router address (mainnet)
    address public immutable pendleRouter;

    // srUSDe contract address
    address public immutable srUSDe;

    // sUSDe contract address
    address public immutable sUSDe;

    /**
     * @notice Constructor
     * @param _pendleRouter Address of Pendle Router
     * @param _srUSDe Address of srUSDe contract (0x3d7d6fdf07ee548b939a80edbc9b2256d0cdc003)
     * @param _sUSDe Address of sUSDe contract
     */
    constructor(address _pendleRouter, address _srUSDe, address _sUSDe) {
        pendleRouter = _pendleRouter;
        srUSDe = _srUSDe;
        sUSDe = _sUSDe;
    }

    /**
     * @notice Main swap function: PT-srUSDe -> srUSDe -> sUSDe -> final token
     * @param ptToken Address of PT token (e.g., PT-srUSDe)
     * @param ptAmount Amount of PT tokens to swap
     * @param pendleSwapData Calldata for Pendle Router swap (PT -> srUSDe)
     * @param finalSwapRouter Router address for final swap (sUSDe -> final token)
     * @param finalSwapData Calldata for final swap
     * @param finalToken Address of the final token to receive
     * @param minFinalOutput Minimum amount of final token expected
     * @return finalAmount Amount of final token received
     */
    function swap(
        address ptToken,
        uint256 ptAmount,
        bytes calldata pendleSwapData,
        address finalSwapRouter,
        bytes calldata finalSwapData,
        address finalToken,
        uint256 minFinalOutput
    ) external returns (uint256 finalAmount) {
        // Step 1: Transfer PT tokens from sender
        IERC20(ptToken).safeTransferFrom(msg.sender, address(this), ptAmount);

        // Step 2: Swap PT-srUSDe -> srUSDe via Pendle Router
        uint256 srUSDeAmount = _swapPtToSrUSDe(ptToken, pendleSwapData);

        // Step 3: Redeem srUSDe -> sUSDe
        uint256 sUSDeAmount = _redeemSrUSDe(srUSDeAmount);

        // Step 4: Swap sUSDe -> final token
        finalAmount = _swapToFinalToken(
            sUSDeAmount,
            finalSwapRouter,
            finalSwapData,
            finalToken
        );

        // Step 5: Validate minimum output
        if (finalAmount < minFinalOutput) {
            revert InsufficientOutput(minFinalOutput, finalAmount);
        }

        // Step 6: Transfer final token to sender
        IERC20(finalToken).safeTransfer(msg.sender, finalAmount);

        return finalAmount;
    }

    /**
     * @notice Swap PT tokens to srUSDe via Pendle Router
     * @param ptToken PT token address
     * @param swapData Calldata for Pendle Router
     * @return srUSDeAmount Amount of srUSDe received
     */
    function _swapPtToSrUSDe(
        address ptToken,
        bytes calldata swapData
    ) internal returns (uint256 srUSDeAmount) {
        // Get balance before swap
        uint256 balanceBefore = IERC20(srUSDe).balanceOf(address(this));

        // Approve PT token to Pendle Router
        IERC20(ptToken).forceApprove(pendleRouter, type(uint256).max);

        // Execute swap: PT -> srUSDe
        (bool success, bytes memory result) = pendleRouter.call(swapData);
        if (!success) {
            string memory errorMessage = result.length > 0
                ? string(result)
                : "Pendle swap failed";
            revert SwapFailed(errorMessage);
        }

        // Calculate amount received
        uint256 balanceAfter = IERC20(srUSDe).balanceOf(address(this));
        srUSDeAmount = balanceAfter - balanceBefore;

        return srUSDeAmount;
    }

    /**
     * @notice Redeem srUSDe to sUSDe
     * @param srUSDeAmount Amount of srUSDe to redeem
     * @return sUSDeAmount Amount of sUSDe received
     */
    function _redeemSrUSDe(uint256 srUSDeAmount) internal returns (uint256 sUSDeAmount) {
        // Redeem srUSDe -> sUSDe
        // The function signature is: redeem(shares, receiver, owner)
        sUSDeAmount = ISrUSDe(srUSDe).redeem(
            sUSDe,
            srUSDeAmount,
            address(this), // receiver
            address(this)  // owner
        );

        return sUSDeAmount;
    }

    /**
     * @notice Swap sUSDe to final token via external DEX
     * @param sUSDeAmount Amount of sUSDe to swap
     * @param router DEX router address
     * @param swapData Calldata for the swap
     * @param finalToken Address of final token
     * @return finalAmount Amount of final token received
     */
    function _swapToFinalToken(
        uint256 sUSDeAmount,
        address router,
        bytes calldata swapData,
        address finalToken
    ) internal returns (uint256 finalAmount) {
        // Get balance before swap
        uint256 balanceBefore = IERC20(finalToken).balanceOf(address(this));

        // Approve sUSDe to router
        IERC20(sUSDe).forceApprove(router, sUSDeAmount);

        // Execute swap
        (bool success, bytes memory result) = router.call(swapData);
        if (!success) {
            string memory errorMessage = result.length > 0
                ? string(result)
                : "Final swap failed";
            revert SwapFailed(errorMessage);
        }

        // Calculate amount received
        uint256 balanceAfter = IERC20(finalToken).balanceOf(address(this));
        finalAmount = balanceAfter - balanceBefore;

        return finalAmount;
    }

    /**
     * @notice Rescue tokens stuck in contract
     * @param token Token address
     * @param amount Amount to rescue
     * @param to Recipient address
     */
    function rescueTokens(address token, uint256 amount, address to) external {
        // TODO: Add access control (onlyOwner or similar)
        IERC20(token).safeTransfer(to, amount);
    }
}
