// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

library PendleTypes {
    struct ApproxParams {
        uint256 guessMin;
        uint256 guessMax;
        uint256 guessOffchain;
        uint256 maxIteration;
        uint256 eps;
    }

    enum SwapType {
        NONE,
        KYBERSWAP,
        ODOS,
        // ETH_WETH not used in Aggregator
        ETH_WETH,
        OKX,
        ONE_INCH,
        RESERVE_1,
        RESERVE_2,
        RESERVE_3,
        RESERVE_4,
        RESERVE_5
    }

    struct SwapData {
        SwapType swapType;
        address extRouter;
        bytes extCalldata;
        bool needScale;
    }

    struct TokenInput {
        address tokenIn;
        uint256 netTokenIn;
        address tokenMintSy;
        address pendleSwap;
        SwapData swapData;
    }

    struct TokenOutput {
        address tokenOut;
        uint256 minTokenOut;
        address tokenRedeemSy;
        address pendleSwap;
        SwapData swapData;
    }

    enum OrderType {
        SY_FOR_PT,
        PT_FOR_SY,
        SY_FOR_YT,
        YT_FOR_SY
    }

    struct Order {
        uint256 salt;
        uint256 expiry;
        uint256 nonce;
        OrderType orderType;
        address token;
        address YT;
        address maker;
        address receiver;
        uint256 makingAmount;
        uint256 lnImpliedRate;
        uint256 failSafeRate;
        bytes permit;
    }

    struct FillOrderParams {
        Order order;
        bytes signature;
        uint256 makingAmount;
    }

    struct LimitOrderData {
        address limitRouter;
        uint256 epsSkipMarket;
        FillOrderParams[] normalFills;
        FillOrderParams[] flashFills;
        bytes optData;
    }
}