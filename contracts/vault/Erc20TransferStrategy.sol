// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Erc20TransferStrategy {
    function transferFrom(IERC20 token, address from, uint amount) external {
        require(token.transferFrom(from, address(this), amount), "!TransferError");
    }

    function transferTo(IERC20 token, address to, uint amount) external {
        require(token.transfer(to, amount), "!TransferError");
    }
}
