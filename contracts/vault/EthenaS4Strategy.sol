// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

contract EthenaS4Strategy {
    address private immutable distributor;

    constructor(address _distributor) {
        distributor = _distributor;
    }

    function getRewards(bytes calldata data) external {
        (bool success, bytes memory result) = distributor.call(data);
        if (!success) {
            string memory errorMessage = result.length > 0
                ? abi.decode(result, (string))
                : "Unknown error";
            revert(errorMessage);
        }
    }
}
