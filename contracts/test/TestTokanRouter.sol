// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {TokanRouter} from "../interfaces/tokan/TokanRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TestERC20.sol";

contract TestTokanRouter is TokanRouter {
    function swapExactTokensForTokens(uint amountIn,uint amountOutMin, Route[] calldata routes,address to,uint deadline) external returns (uint[] memory amounts) {
        address input = routes[0].from;
        address output = routes[routes.length - 1].to;

        IERC20(input).transferFrom(msg.sender, address(this), amountIn);
        TestERC20(output).mint(to, amountOutMin);
        uint[] memory result = new uint[](routes.length);
        result[0] = amountIn;
        result[routes.length] = amountOutMin;
        return result;
    }

    function quoteAddLiquidity(
        address tokenA,
        address tokenB,
        bool stable,
        uint256 amountADesired,
        uint256 amountBDesired
    ) external view returns (uint256 amountA, uint256 amountB, uint256 liquidity) {

    }

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
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {

    }

    function getAmountsOut(uint256 amountIn, Route[] memory routes) external view returns (uint256[] memory amounts) {

    }
}
