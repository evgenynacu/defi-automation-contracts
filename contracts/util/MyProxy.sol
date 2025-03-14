// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat-deploy/solc_0.8/proxy/EIP173Proxy.sol";

contract MyProxy is EIP173Proxy {
    constructor(address _implementation, address _admin, bytes memory _data) EIP173Proxy(_implementation, _admin, _data) {}

    receive() external payable override {
    }
}