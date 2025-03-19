// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../morpho/IMorpho.sol";
import "./HasOperation.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {HasOperation} from "./HasOperation.sol";
import {StorageUtil} from "../util/StorageUtil.sol";

/**
 * @title MorphoFlashLoanStrategy
 * @notice Strategy for executing free flash loans on Morpho protocol
 * @dev This strategy passes raw bytes data to be used during the flash loan callback
 */
contract MorphoFlashLoanStrategy is HasOperation {
    using SafeERC20 for IERC20;

    bytes32 private constant FLASH_LOAN_OUT_SLOT = keccak256("flashLoan#output");

    // Morpho contract address
    address public immutable MORPHO_ADDRESS;

    // Event emitted when a flash loan is executed
    event FlashLoanRequested(address token, uint256 amount);

    /**
     * @notice Constructor for the strategy
     * @param _morphoAddress The Morpho contract address
     */
    constructor(address _morphoAddress) {
        require(_morphoAddress != address(0), "Invalid Morpho address");
        MORPHO_ADDRESS = _morphoAddress;
    }

    /**
     * @notice Initializes the strategy
     * @dev Called via delegatecall from the vault
     */
    function init() external {
        // No initialization needed for this strategy
    }

    /**
     * @notice Returns the Morpho contract address
     * @dev Used by the vault to verify the caller in onMorphoFlashLoan
     * @return The Morpho contract address
     */
    function getMorphoAddress() external view returns (address) {
        return MORPHO_ADDRESS;
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
        OperationsWithAddress memory toSend = OperationsWithAddress(token, operations);
        IMorpho(MORPHO_ADDRESS).flashLoan(
            token,
            amount,
            abi.encode(toSend)
        );
        out = StorageUtil.readUintSlot(FLASH_LOAN_OUT_SLOT);
        StorageUtil.setUintSlot(FLASH_LOAN_OUT_SLOT, 0);

        emit FlashLoanRequested(token, amount);
    }
}