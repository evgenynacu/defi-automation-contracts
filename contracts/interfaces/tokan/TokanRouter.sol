// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface TokanRouter {
    struct Route {
        address from;
        address to;
        bool stable;
    }

    function swapExactTokensForTokens(uint amountIn,uint amountOutMin, Route[] calldata routes,address to,uint deadline) external returns (uint[] memory amounts);

    function quoteAddLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired
    ) external view returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    function addLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);

    function getAmountsOut(uint256 amountIn, Route[] memory routes) external view returns (uint256[] memory amounts);
}
