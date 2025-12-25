// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ResetApprovalStrategy {
    using SafeERC20 for IERC20;

    function resetApproval(IERC20 token, address spender) external {
        token.forceApprove(spender, 0);
    }
}