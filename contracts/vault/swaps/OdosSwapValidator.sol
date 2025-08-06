// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./OdosRouter.sol";

library OdosSwapValidator {
    bytes4 public constant SWAP = OdosRouter.swap.selector;


    /**
     * @notice Validates swap data to ensure only allowed functions are called with correct receiver
     * @param swapData The calldata to validate
     */
    function _validateSwapData(bytes calldata swapData) internal pure returns (address) {
        require(swapData.length >= 4, "Invalid calldata length");

        bytes4 selector = bytes4(swapData[:4]);

        require(selector == SWAP, "!SELECTOR");

        bytes memory tokenInfoData = swapData[4:];
        address outputReceiver;

        assembly {
            outputReceiver := mload(add(add(tokenInfoData, 0x20), 192))
        }

        return outputReceiver;
    }
}
