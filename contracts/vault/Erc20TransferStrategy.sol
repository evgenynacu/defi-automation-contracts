// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Erc20TransferStrategy {
    function transferFromCaller(IERC20 token, uint amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "!TransferError");
    }

    function transferToCaller(IERC20 token, uint amount) external {
        require(token.transfer(msg.sender, amount), "!TransferError");
    }
}
