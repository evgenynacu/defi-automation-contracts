// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "../vault/swaps/PendleSwapValidator.sol";

contract PendleSwapValidatorTest {
    function validate(bytes calldata swapData) public pure returns (address) {
        return PendleSwapValidator._validateSwapData(swapData);
    }
}
