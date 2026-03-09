// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../util/StorageUtil.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {HasOperation} from "./HasOperation.sol";

interface IInstaFlash {
    function flashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        uint256 route,
        bytes calldata data,
        bytes calldata instaData
    ) external;
}

contract InstaFlashLoanStrategy is HasOperation {
    using SafeERC20 for IERC20;

    bytes32 private constant FLASH_LOAN_OUT_SLOT = keccak256("flashLoan#output");
    address private immutable INSTA_FLASH;

    constructor(address _instaFlash) {
        INSTA_FLASH = _instaFlash;
    }

    function executeFlashLoan(
        address token,
        uint256 amount,
        Operation[] calldata operations
    ) external returns (uint out) {
        address[] memory tokens = new address[](1);
        tokens[0] = token;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        IInstaFlash(INSTA_FLASH).flashLoan(
            tokens, amounts, 9,
            abi.encode(operations), ""
        );

        out = StorageUtil.readUintSlot(FLASH_LOAN_OUT_SLOT);
        StorageUtil.setUintSlot(FLASH_LOAN_OUT_SLOT, 0);
    }
}
