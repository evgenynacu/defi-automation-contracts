// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../util/StorageUtil.sol";
import {IPoolManager} from "../uniswap-v4/IPoolManager.sol";
import {HasOperation} from "./HasOperation.sol";

// @notice Flash loan sourced from the Uniswap v4 PoolManager, which charges nothing for taking and
//         settling the same amount within one unlock.
// @dev Delegatecalled by the vault, so the unlock and the IUnlockCallback the PoolManager calls back into
//      are both the vault. The callback itself lives on AutomatedVault, next to the Morpho and Aave ones.
contract UniswapV4FlashLoanStrategy is HasOperation {
    bytes32 private constant FLASH_LOAN_OUT_SLOT = keccak256("flashLoan#output");

    IPoolManager private immutable POOL_MANAGER;

    event FlashLoanRequested(address token, uint256 amount);

    constructor(address poolManager) {
        require(poolManager != address(0), "poolManager is not set");
        POOL_MANAGER = IPoolManager(poolManager);
    }

    function getPoolManager() external view returns (address) {
        return address(POOL_MANAGER);
    }

    /**
     * @notice Take a flash loan from the v4 PoolManager and run the operations against it
     * @dev Called via delegatecall from the vault
     * @param token The token to borrow
     * @param amount The amount to borrow, capped by the PoolManager's balance of that token
     * @param operations operation list for the vault, executed while holding the borrowed funds
     * @return out output produced during the flash loan operation
     */
    function executeFlashLoan(
        address token,
        uint256 amount,
        Operation[] calldata operations
    ) external returns (uint out) {
        POOL_MANAGER.unlock(abi.encode(token, amount, operations));

        out = StorageUtil.readUintSlot(FLASH_LOAN_OUT_SLOT);
        StorageUtil.setUintSlot(FLASH_LOAN_OUT_SLOT, 0);

        emit FlashLoanRequested(token, amount);
    }
}
