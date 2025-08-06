// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./PendleRouter.sol";

library PendleSwapValidator {

    // Function selectors for allowed PendleRouter functions
    bytes4 public constant SWAP_EXACT_TOKEN_FOR_PT = PendleRouter.swapExactTokenForPt.selector;
    bytes4 public constant SWAP_EXACT_PT_FOR_TOKEN = PendleRouter.swapExactPtForToken.selector;

    function _validateSwapData(bytes calldata swapData) internal pure returns (address) {
        require(swapData.length >= 4, "Invalid calldata length");

        bytes4 selector = bytes4(swapData[:4]);

        // Check if function selector is allowed
        require(selector == SWAP_EXACT_TOKEN_FOR_PT || selector == SWAP_EXACT_PT_FOR_TOKEN, "!SELECTOR");

        return abi.decode(swapData[4:36], (address));
    }

}
