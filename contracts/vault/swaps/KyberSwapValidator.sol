// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./KyberSwapRouter.sol";

library KyberSwapValidator {
    bytes4 public constant SWAP = KyberSwapRouter.swap.selector;

    /**
     * @notice Validates swap data to ensure only allowed functions are called with correct receiver
     * @param swapData The calldata to validate
     */
    function _validateSwapData(bytes calldata swapData) internal pure returns (address) {
        require(swapData.length >= 4, "Invalid calldata length");

        bytes4 selector = bytes4(swapData[:4]);

        require(selector == SWAP, "!SELECTOR");

        bytes memory paramsData = swapData[4:];

        address dstReceiver;

        assembly {
            let descOffset := mload(add(add(paramsData, 0x20), 96))
            dstReceiver := mload(add(add(add(paramsData, 0x20), descOffset), 192))
        }

        return dstReceiver;
    }
}
