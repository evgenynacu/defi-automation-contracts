// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISpoke} from "../aave-v4/ISpoke.sol";
import {
    IGiverPositionManager,
    ITakerPositionManager,
    IConfigPositionManager
} from "../aave-v4/IPositionManagers.sol";

// @notice Aave v4 strategy that operates a position owned by someone else (`onBehalfOf`), rather than
//         the vault's own. The v4 counterpart of AaveOnBehalfStrategy.
//
// @dev Delegatecalled by the vault, so address(this) is the vault and it is the vault that must hold the
//      user's approvals. Calls never reach the Spoke directly: a Spoke rejects a foreign `onBehalfOf`
//      unless the caller is a governance-activated position manager, so everything routes through the
//      three managers Aave deploys for this purpose. See common/approve-aave-v4-on-behalf.ts for the
//      approvals the position owner has to grant first.
//
// @dev Unlike the v3 strategy there is no aToken transferFrom workaround — v4 has a native on-behalf
//      withdraw — and no need to approve the Spoke, since the managers pull from and pay out to the vault.
contract AaveV4OnBehalfStrategy {
    using SafeERC20 for IERC20;

    IGiverPositionManager private immutable GIVER;
    ITakerPositionManager private immutable TAKER;
    IConfigPositionManager private immutable CONFIG;

    constructor(address giver, address taker, address config) {
        require(giver != address(0), "giver is not set");
        require(taker != address(0), "taker is not set");
        require(config != address(0), "config is not set");
        GIVER = IGiverPositionManager(giver);
        TAKER = ITakerPositionManager(taker);
        CONFIG = IConfigPositionManager(config);
    }

    // @notice Enables or disables a reserve as collateral on the owner's position.
    // @dev Requires the owner to have granted canSetUsingAsCollateral on this spoke.
    function setCollateral(address spoke, uint256 reserveId, bool use, address onBehalfOf) external {
        CONFIG.setUsingAsCollateralOnBehalfOf(spoke, reserveId, use, onBehalfOf);
    }

    // ----- main strategy functions ----- //

    // @param amount Amount to supply, or type(uint256).max to supply the vault's whole balance
    function supplyCollateral(address spoke, uint256 reserveId, uint256 amount, address onBehalfOf) external {
        address underlying = _underlying(spoke, reserveId);

        uint256 supplyAmount;
        if (amount == type(uint256).max) {
            supplyAmount = IERC20(underlying).balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        require(supplyAmount > 0, "Amount must be greater than 0");
        _approveIfNeeded(underlying, address(GIVER), supplyAmount);
        GIVER.supplyOnBehalfOf(spoke, reserveId, supplyAmount, onBehalfOf);
        IERC20(underlying).forceApprove(address(GIVER), 0);
    }

    // @param amount Amount to withdraw, or type(uint256).max for the full position
    // @dev The manager checks the allowance against the raw amount before the spoke clamps it, so
    //      type(uint256).max only works when the owner granted an unlimited withdraw allowance.
    function withdrawCollateral(address spoke, uint256 reserveId, uint256 amount, address onBehalfOf) external {
        require(amount > 0, "Amount must be greater than 0");
        TAKER.withdrawOnBehalfOf(spoke, reserveId, amount, onBehalfOf);
    }

    function borrowDebt(address spoke, uint256 reserveId, uint256 amount, address onBehalfOf) external {
        require(amount > 0, "Amount must be greater than 0");
        TAKER.borrowOnBehalfOf(spoke, reserveId, amount, onBehalfOf);
    }

    // @param amount Amount to repay, or type(uint256).max for the whole debt
    // @dev The giver rejects type(uint256).max outright, so max is resolved here to the debt read at
    //      execution time. It still clamps internally, so the read cannot over-pay.
    function repayDebt(address spoke, uint256 reserveId, uint256 amount, address onBehalfOf) external {
        address underlying = _underlying(spoke, reserveId);
        uint256 debt = ISpoke(spoke).getUserTotalDebt(reserveId, onBehalfOf);
        require(debt > 0, "No borrow balance to repay");

        uint256 repayAmount = amount == type(uint256).max ? debt : amount;

        _approveIfNeeded(underlying, address(GIVER), repayAmount);
        GIVER.repayOnBehalfOf(spoke, reserveId, repayAmount, onBehalfOf);
        IERC20(underlying).forceApprove(address(GIVER), 0);
    }

    // ----- internal helpers ----- //

    function _underlying(address spoke, uint256 reserveId) internal view returns (address) {
        return ISpoke(spoke).getReserve(reserveId).underlying;
    }

    function _approveIfNeeded(address token, address spender, uint256 amount) internal {
        uint256 allowance = IERC20(token).allowance(address(this), spender);
        if (allowance < amount) {
            IERC20(token).forceApprove(spender, type(uint256).max);
        }
    }
}
