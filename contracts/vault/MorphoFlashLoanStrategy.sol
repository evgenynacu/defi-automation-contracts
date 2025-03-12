// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IMorpho
 * @notice Interface for Morpho's flash loan functionality
 */
interface IMorpho {
    function flashLoan(
        address token,
        uint256 amount,
        bytes calldata data
    ) external;
}

/**
 * @title MorphoFlashLoanStrategy
 * @notice Strategy for executing free flash loans on Morpho protocol
 * @dev This strategy passes raw bytes data to be used during the flash loan callback
 */
contract MorphoFlashLoanStrategy {
    using SafeERC20 for IERC20;

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
     * @param data Raw bytes data to pass to the flash loan callback
     * @return loss Returns 0 as loss calculation happens in the callback
     */
    function executeFlashLoan(
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (int256) {
        // Execute the flash loan with the provided raw data
        IMorpho(MORPHO_ADDRESS).flashLoan(
            token,
            amount,
            data
        );

        emit FlashLoanRequested(token, amount);

        // The actual execution of operations and loss/gain calculation
        // happens in the onMorphoFlashLoan callback
        return 0;
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