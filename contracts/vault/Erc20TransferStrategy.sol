// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Erc20TransferStrategy {
    using SafeERC20 for IERC20;

    function transferFrom(IERC20 token, address from, uint amount) external {
        token.safeTransferFrom(from, address(this), amount);
    }

    function transferTo(IERC20 token, address to, uint amount) external returns (uint) {
        uint transferAmount = amount;
        if (amount == type(uint256).max) {
            transferAmount = token.balanceOf(address(this));
        }

        token.safeTransfer(to, transferAmount);
        return transferAmount;
    }
}
