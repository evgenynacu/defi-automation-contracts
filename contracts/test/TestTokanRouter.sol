// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {TokanRouter} from "../interfaces/tokan/TokanRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TestERC20.sol";
import {TestTokanPair} from "./TestTokanPair.sol";

contract TestTokanRouter is TokanRouter {
    uint private rate;
    uint private rewardRate; // should divide reward, not multiply - e.g 50000000000000
    TestTokanPair private pair;

    /// @dev supports only one rate (for primary/secondary)
    constructor(TestTokanPair _pair, uint _rate, uint _rewardRate) {
        pair = _pair;
        rate = _rate;
        rewardRate = _rewardRate;
    }

    function swapExactTokensForTokens(uint amountIn, uint amountOutMin, Route[] calldata routes, address to, uint) external returns (uint[] memory amounts) {
        address input = routes[0].from;
        address output = routes[routes.length - 1].to;

        IERC20(input).transferFrom(msg.sender, address(this), amountIn);
        TestERC20(output).mint(to, amountOutMin);
        uint[] memory result = new uint[](routes.length + 1);
        result[0] = amountIn;
        result[routes.length] = amountOutMin;
        return result;
    }

    function quoteAddLiquidity(
        address,
        address,
        bool,
        uint256 amountADesired,
        uint256 amountBDesired
    ) external view returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        uint amountBReal = amountADesired * rate;
        if (amountBDesired > amountBReal) {
            amountA = amountADesired;
            amountB = amountBReal;
        } else {
            amountB = amountBDesired;
            amountA = amountBDesired / rate;
        }
        liquidity = amountA;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        bool,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256
    ) external override returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(amountADesired >= amountAMin);
        require(amountBDesired >= amountBMin);

        amountA = amountADesired;
        amountB = amountBDesired;
        liquidity = amountADesired;

        IERC20(tokenA).transferFrom(msg.sender, address(pair), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(pair), amountBDesired);
        pair.mint(to, liquidity);
    }

    /// @dev used to calculate reward rate - todo later more complicated case
    function getAmountsOut(uint256 amountIn, Route[] memory) external view override returns (uint256[] memory amounts) {
        amounts = new uint[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn / rewardRate;
    }

    function quoteRemoveLiquidity(
        address,
        address,
        bool,
        uint256 liquidity
    ) external view returns (uint256 amountA, uint256 amountB) {
        amountA = liquidity;
        amountB = liquidity * rate;
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        bool,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256
    ) public returns (uint256 amountA, uint256 amountB) {
        require(amountAMin == liquidity);
        require(amountBMin == liquidity * rate);

        pair.transferToken(tokenA, amountAMin, to);
        pair.transferToken(tokenB, amountBMin, to);
        pair.transferFrom(msg.sender, address(this), liquidity);
        pair.burn(liquidity);

        amountA = amountAMin;
        amountB = amountBMin;
    }
}
