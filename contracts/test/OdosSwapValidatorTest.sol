// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "../vault/swaps/OdosSwapValidator.sol";

contract OdosSwapValidatorTest {
    function validate(bytes calldata swapData) public pure returns (address) {
        return OdosSwapValidator._validateSwapData(swapData);
    }
}
