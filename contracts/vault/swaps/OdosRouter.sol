// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

interface OdosRouter {
    /// @dev Contains all information needed to describe the input and output for a swap
    struct swapTokenInfo {
        address inputToken;
        uint256 inputAmount;
        address inputReceiver;
        address outputToken;
        uint256 outputQuote;
        uint256 outputMin;
        address outputReceiver;
    }

    function swap(
        swapTokenInfo memory tokenInfo,
        bytes calldata pathDefinition,
        address executor,
        uint32 referralCode
    )
    external
    payable
    returns (uint256 amountOut);
}
