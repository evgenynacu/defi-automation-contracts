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

    function hasPermission(address owner, address manager) external view returns (bool);

    function allow(address manager, bool isAllowed) external;

    function supplyFrom(address from, address dst, address asset, uint amount) external;

    function withdrawFrom(address src, address to, address asset, uint amount) external;

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

    // Events
    event CollateralSupplied(address token, uint256 amount);
    event CollateralWithdrawn(address token, uint256 amount);
    event BaseTokenBorrowed(address token, uint256 amount);
    event BaseTokenRepaid(address token, uint256 amount);

    /**
     * @notice Supply token as collateral to Compound V3
     * @param amount The amount to supply. If type(uint256).max is passed, all available tokens will be supplied
     */
    function supplyCollateral(IComet comet, address to, IERC20 collateralToken, uint256 amount) external {
        uint256 supplyAmount;

        // If max uint is passed, supply all available tokens
        if (amount == type(uint256).max) {
            supplyAmount = collateralToken.balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        require(supplyAmount > 0, "Amount must be greater than 0");

        // Approve Comet to transfer tokens if needed
        _approveIfNeeded(address(collateralToken), address(comet), supplyAmount);

        // Supply the token as collateral
        comet.supplyFrom(address(this), to, address(collateralToken), supplyAmount);

        emit CollateralSupplied(address(collateralToken), supplyAmount);
    }

    /**
     * @notice Withdraw token from Compound V3 collateral
     * @param amount The amount to withdraw
     */
    function withdrawCollateral(IComet comet, address from, IERC20 collateralToken, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        // Withdraw collateral
        comet.withdrawFrom(from, address(this), address(collateralToken), amount);

        emit CollateralWithdrawn(address(collateralToken), amount);
    }

    /**
     * @notice Borrow base token from Compound V3 by withdrawing it
     * @dev In Compound V3, borrowing is done by withdrawing the base asset
     * @param amount The amount to borrow
     */
    function borrowBaseToken(IComet comet, address from, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        address baseToken = comet.baseToken();
        // In Compound V3, borrowing is done by simply withdrawing the base asset
        comet.withdrawFrom(from, address(this), baseToken, amount);

        emit BaseTokenBorrowed(baseToken, amount);
    }

    /**
     * @notice Repay borrowed base token to Compound V3
     * @dev In Compound V3, repaying is done by supplying the base asset
     * @param amount The amount to repay (use uint256.max for full repayment)
     */
    function repayBaseToken(IComet comet, address to, uint256 amount) external {
        uint256 borrowBalance = comet.borrowBalanceOf(address(this));
        require(borrowBalance > 0, "No borrow balance to repay");

        // If amount is max uint256, repay the full balance
        uint256 repayAmount = amount;
        if (amount == type(uint256).max) {
            repayAmount = borrowBalance;
        }

        address baseToken = comet.baseToken();
        // Approve Comet to take base tokens if needed
        _approveIfNeeded(baseToken, address(comet), repayAmount);

        // In Compound V3, repaying is done by supplying the base asset
        comet.supplyFrom(address(this), to, baseToken, repayAmount);

        emit BaseTokenRepaid(baseToken, repayAmount);
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