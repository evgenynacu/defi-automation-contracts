// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;


contract PendleSwapAdapter {
    address private immutable pendleRouter;

    constructor(address _router) {
        pendleRouter = _router;
    }

    function checkCall(address _router, bytes calldata _data) external returns (uint) {
        return 0;
    }
}
