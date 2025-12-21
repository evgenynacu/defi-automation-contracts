// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ResetApprovalStrategy {
    function resetApproval(IERC20 token, address spender) external {
        token.approve(spender, 0);
    }
}