// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "../vault/swaps/KyberSwapValidator.sol";

contract KyberSwapValidatorTest {
    function validate(bytes calldata swapData) public pure returns (address) {
        return KyberSwapValidator._validateSwapData(swapData);
    }
}
