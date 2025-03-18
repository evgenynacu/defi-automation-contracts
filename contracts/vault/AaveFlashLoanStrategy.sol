// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../util/StorageUtil.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {HasOperation} from "./HasOperation.sol";

contract AaveFlashLoanStrategy is HasOperation {
    using SafeERC20 for IERC20;

    bytes32 private constant FLASH_LOAN_OUT_SLOT = keccak256("flashLoan#output");

    IPoolAddressesProvider private immutable ADDRESSES_PROVIDER;
    IPool private immutable POOL;

    // Event emitted when a flash loan is executed
    event FlashLoanRequested(address token, uint256 amount);

    constructor(address provider) {
        ADDRESSES_PROVIDER = IPoolAddressesProvider(provider);
        POOL = IPool(IPoolAddressesProvider(provider).getPool());
    }

    function getAaveAddressProvider() external view returns (address) {
        return address(ADDRESSES_PROVIDER);
    }

    function getAavePool() external view returns (address) {
        return address(POOL);
    }

    /**
     * @notice Execute a flash loan and pass through the raw callback data
     * @dev Called via delegatecall from the vault
     * @param token The token to flash loan
     * @param amount The amount to borrow
     * @param operations operation list for the vault (when flashloan received)
     * @return out output which was got during flash loan operation
     */
    function executeFlashLoan(
        address token,
        uint256 amount,
        Operation[] calldata operations
    ) external returns (uint out) {
        // Execute the flash loan with the provided raw data
        POOL.flashLoanSimple(
            address(this),
            token,
            amount,
            abi.encode(operations),
            0
        );
        out = StorageUtil.readUintSlot(FLASH_LOAN_OUT_SLOT);
        StorageUtil.setUintSlot(FLASH_LOAN_OUT_SLOT, 0);

        emit FlashLoanRequested(token, amount);
    }
}