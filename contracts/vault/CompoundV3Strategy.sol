// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface CometRewards {
    struct RewardOwed {
        address token;
        uint owed;
    }

    function getRewardOwed(address comet, address account) external view returns (RewardOwed memory);
}

/**
 * @title IComet
 * @notice Interface for Compound V3 (Comet) interactions
 */
interface IComet {
    function supply(address asset, uint amount) external;
    function withdraw(address asset, uint amount) external;
    function borrowBalanceOf(address account) external view returns (uint);
    function collateralBalanceOf(address account, address asset) external view returns (uint);
    function baseToken() external view returns (address);
}

/**
 * @title CompoundV3Strategy
 * @notice Strategy for interacting with Compound V3 (Comet) to supply collateral and borrow tokens
 */
contract CompoundV3Strategy {
    using SafeERC20 for IERC20;

    struct StrategyState {
        uint256 collateralAmount;
        uint256 borrowAmount;
    }

    // The Comet market address this strategy interacts with
    IComet public immutable COMET;

    // The base token of the Comet market (usually USDC)
    address public immutable BASE_TOKEN;

    // Collateral tokens supported by this strategy
    address public immutable COLLATERAL_TOKEN;

    // Events
    event CollateralSupplied(address indexed token, uint256 amount);
    event CollateralWithdrawn(address indexed token, uint256 amount);
    event BaseTokenBorrowed(uint256 amount);
    event BaseTokenRepaid(uint256 amount);

    /**
     * @notice Constructor to set the Comet market address and collateral tokens
     * @param _cometAddress The Comet (Compound V3 market) address
     * @param _collateralToken Collateral token address this strategy will use
     */
    constructor(address _cometAddress, address _collateralToken) {
        require(_cometAddress != address(0), "Invalid Comet address");
        require(_collateralToken != address(0), "Must provide at least one collateral token");

        COMET = IComet(_cometAddress);
        BASE_TOKEN = COMET.baseToken();
        COLLATERAL_TOKEN = _collateralToken;
    }

    /**
     * @notice Supply token as collateral to Compound V3
     * @param token The token address to supply as collateral
     * @param amount The amount to supply. If type(uint256).max is passed, all available tokens will be supplied
     * @return loss Returns 0 as loss calculation is not applicable here
     */
    function supplyCollateral(address token, uint256 amount) external returns (int256) {
        require(_isValidCollateralToken(token), "Token not supported as collateral");

        uint256 supplyAmount;

        // If max uint is passed, supply all available tokens
        if (amount == type(uint256).max) {
            supplyAmount = IERC20(token).balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        require(supplyAmount > 0, "Amount must be greater than 0");

        // Approve Comet to transfer tokens if needed
        _approveIfNeeded(token, address(COMET), supplyAmount);

        // Supply the token as collateral
        COMET.supply(token, supplyAmount);

        emit CollateralSupplied(token, supplyAmount);

        // No loss calculation for this operation
        return 0;
    }


    /**
     * @notice Withdraw token from Compound V3 collateral
     * @param token The token address to withdraw
     * @param amount The amount to withdraw
     * @return loss Returns 0 as loss calculation is not applicable here
     */
    function withdrawCollateral(address token, uint256 amount) external returns (int256) {
        require(amount > 0, "Amount must be greater than 0");
        require(_isValidCollateralToken(token), "Token not supported as collateral");

        // Withdraw collateral
        COMET.withdraw(token, amount);

        emit CollateralWithdrawn(token, amount);

        // No loss calculation for this operation
        return 0;
    }

    /**
     * @notice Borrow base token from Compound V3 by withdrawing it
     * @dev In Compound V3, borrowing is done by withdrawing the base asset
     * @param amount The amount to borrow
     * @return loss Returns 0 as loss calculation is not applicable here
     */
    function borrowBaseToken(uint256 amount) external returns (int256) {
        require(amount > 0, "Amount must be greater than 0");

        // In Compound V3, borrowing is done by simply withdrawing the base asset
        COMET.withdraw(BASE_TOKEN, amount);

        emit BaseTokenBorrowed(amount);

        // No loss calculation for this operation
        return 0;
    }

    /**
     * @notice Repay borrowed base token to Compound V3
     * @dev In Compound V3, repaying is done by supplying the base asset
     * @param amount The amount to repay (use uint256.max for full repayment)
     * @return loss Returns 0 as loss calculation is not applicable here
     */
    function repayBaseToken(uint256 amount) external returns (int256) {
        uint256 borrowBalance = COMET.borrowBalanceOf(address(this));
        require(borrowBalance > 0, "No borrow balance to repay");

        // If amount is max uint256, repay the full balance
        uint256 repayAmount = amount;
        if (amount == type(uint256).max) {
            repayAmount = borrowBalance;
        }

        // Approve Comet to take base tokens if needed
        _approveIfNeeded(BASE_TOKEN, address(COMET), repayAmount);

        // In Compound V3, repaying is done by supplying the base asset
        COMET.supply(BASE_TOKEN, repayAmount);

        emit BaseTokenRepaid(repayAmount);

        // No loss calculation for this operation
        return 0;
    }

    /**
     * @notice Reads the current state of the strategy
     * @dev Returns encoded information about collateral and borrows
     * @return State encoded as bytes
     */
    function readState() external view returns (bytes memory) {
        // Get borrow balance
        uint256 borrowBalance = COMET.borrowBalanceOf(address(this));
        uint256 collaterAmount = COMET.collateralBalanceOf(address(this), COLLATERAL_TOKEN);

        // Create and encode the state struct
        StrategyState memory state = StrategyState({
            collateralAmount: collaterAmount,
            borrowAmount: borrowBalance
        });

        return abi.encode(state);
    }

    /**
     * @notice Initialize the strategy
     * @dev Called via delegatecall from the vault
     */
    function init() external {
        // No special initialization needed
    }

    function _isValidCollateralToken(address token) internal view returns (bool) {
        return token == COLLATERAL_TOKEN;
    }

    /**
     * @notice Approve tokens if current allowance is insufficient
     * @param token The token to approve
     * @param spender The address to approve
     * @param amount The amount to approve
     */
    function _approveIfNeeded(address token, address spender, uint256 amount) internal {
        uint256 allowance = IERC20(token).allowance(address(this), spender);
        if (allowance < amount) {
            IERC20(token).approve(spender, type(uint256).max);
        }
    }
}