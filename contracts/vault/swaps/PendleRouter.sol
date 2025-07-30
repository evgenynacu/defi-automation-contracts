// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./PendleTypes.sol";

interface PendleRouter {
    function swapExactTokenForPt(
        address receiver,
        address market,
        uint256 minPtOut,
        PendleTypes.ApproxParams calldata guessPtOut,
        PendleTypes.TokenInput calldata input,
        PendleTypes.LimitOrderData calldata limit
    ) external payable returns (uint256 netPtOut, uint256 netSyFee, uint256 netSyInterm);

    function swapExactPtForToken(
        address receiver,
        address market,
        uint256 exactPtIn,
        PendleTypes.TokenOutput calldata output,
        PendleTypes.LimitOrderData calldata limit
    ) external returns (uint256 netTokenOut, uint256 netSyFee, uint256 netSyInterm);
}
