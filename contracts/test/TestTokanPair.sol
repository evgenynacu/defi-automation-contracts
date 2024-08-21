// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TokanPair} from "../interfaces/tokan/TokanPair.sol";
import "./TestERC20.sol";

contract TestTokanPair is ERC20, TokanPair {
    address private token0;
    address private token1;
    uint private rate;

    constructor(address _token0, address _token1, uint _rate) ERC20("TestTokanPair", "TTP") {
        token0 = _token0;
        token1 = _token1;
        rate = _rate;
    }

    function getReserves() external view returns (uint _reserve0, uint _reserve1, uint _blockTimestampLast) {
        _reserve0 = IERC20(token0).balanceOf(address(this));
        _reserve1 = IERC20(token1).balanceOf(address(this));
        _blockTimestampLast = block.timestamp;
    }

    function initialize() external {
        TestERC20(token0).mint(address(this), 1000000 * 10**6);
        TestERC20(token1).mint(address(this), 1000000 * 10**18);
        _mint(0x1111111111111111111111111111111111111111, 1000000 * 10**6);
    }

    function getAmountOut(uint amount, address tokenIn) external view returns (uint) {
        if (tokenIn == token0) {
            return amount * rate;
        } else {
            return amount / rate;
        }
    }

    function mint(address to, uint amount) public {
        _mint(to, amount);
    }

    function transferToken(address token, uint amount, address to) public {
        require(IERC20(token).transfer(to, amount));
    }
}
