// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

contract MerklStrategy {
    address private immutable merkl;

    constructor(address _merkl) {
        merkl = _merkl;
    }

    function getRewards(bytes calldata data) external {
        (bool success, bytes memory result) = merkl.call(data);
        if (!success) {
            string memory errorMessage = result.length > 0
                ? abi.decode(result, (string))
                : "Unknown error";
            revert(errorMessage);
        }
    }
}
