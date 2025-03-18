// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {HasOperation} from "./HasOperation.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/interfaces/IPool.sol";

contract AaveFlashLoanStrategy is HasOperation {
    using SafeERC20 for IERC20;

    IPoolAddressesProvider private immutable ADDRESSES_PROVIDER;
    IPool private immutable POOL;

    // Event emitted when a flash loan is executed
    event FlashLoanRequested(address token, uint256 amount);

    constructor(address provider) {
        ADDRESSES_PROVIDER = IPoolAddressesProvider(provider);
        POOL = IPool(IPoolAddressesProvider(provider).getPool());
    }

    /**
     * @notice Initializes the strategy
     * @dev Called via delegatecall from the vault
     */
    function init() external {
        // No initialization needed for this strategy
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
     */
    function executeFlashLoan(
        address token,
        uint256 amount,
        Operation[] calldata operations
    ) external {
        // Execute the flash loan with the provided raw data
        POOL.flashLoanSimple(
            address(this),
            token,
            amount,
            abi.encode(operations),
            0
        );

        emit FlashLoanRequested(token, amount);
    }

    /**
     * @notice Reads the current state of the strategy
     * @dev Called via delegatecall from the vault
     * @return Empty bytes since this strategy maintains no state
     */
    function readState() external pure returns (bytes memory) {
        // This strategy doesn't maintain any state to be preserved
        return new bytes(0);
    }
}