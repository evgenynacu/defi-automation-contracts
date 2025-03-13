// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

abstract contract HasOperation {
    // @dev Operation for the rebalance
    struct Operation {
        uint16 position;
        bytes callData;
    }
}