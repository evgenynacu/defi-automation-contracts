// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../euler/IEVault.sol";
import "../euler/IEVC.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract EulerV2Strategy {
    using SafeERC20 for IERC20;

    IEVC public immutable evc;

    constructor(IEVC _evc) {
        require(address(_evc) != address(0), "evc is not set");
        evc = _evc;
    }

    // Enable EVC settings required to borrow:
    // - mark collateralVault as collateral
    // - mark borrowVault as controller
    // Requires the strategy to be authorized in EVC to act for positionOwner.
    function enableInEVC(
        address positionOwner,
        address collateralVault,
        address borrowVault
    ) external {
        require(positionOwner != address(0), "positionOwner is zero");
        require(collateralVault != address(0), "collateralVault is zero");
        require(borrowVault != address(0), "borrowVault is zero");

        IEVC(evc).enableCollateral(positionOwner, collateralVault);
        IEVC(evc).enableController(positionOwner, borrowVault);
    }

    // Supply collateral and mint shares to positionOwner.
    // Requirements:
    // - collateralAsset tokens must be approved and transferred to this strategy beforehand (or via transferFrom in this call).
    // - This function will pull collateralAmount from msg.sender if pullFromSender is true.
    function supplyCollateral(
        address positionOwner,
        address collateralVault,
        uint256 amount
    ) external {
        require(positionOwner != address(0), "positionOwner is zero");
        require(collateralVault != address(0), "collateralVault is zero");
        require(amount > 0, "collateralAmount is zero");

        address collateralAsset = IEVault(collateralVault).asset();

        uint256 supplyAmount;
        if (amount == type(uint256).max) {
            supplyAmount = IERC20(collateralAsset).balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        // Approve vault to pull collateral
        _approveIfNeeded(collateralAsset, collateralVault, supplyAmount);

        // Deposit to vault, crediting shares to positionOwner (not to this contract)
        IEVault(collateralVault).deposit(supplyAmount, positionOwner);
        IERC20(collateralAsset).approve(collateralVault, 0);
    }

    // Withdraw collateral that belongs to positionOwner.
    function withdrawCollateral(
        address positionOwner,
        address collateralVault,
        uint256 withdrawAmount
    ) public {
        require(positionOwner != address(0), "positionOwner is zero");
        require(collateralVault != address(0), "collateralVault is zero");
        require(withdrawAmount > 0, "withdrawAmount is zero");

        bytes memory ret = IEVC(evc).call(
            collateralVault,
            positionOwner,
            0,
            abi.encodeWithSelector(IEVault.withdraw.selector, withdrawAmount, address(this), positionOwner)
        );

        require(ret.length == 32, "!ret.length");
    }

    // Borrow on behalf of positionOwner; debt is attributed to positionOwner by calling via EVC.
    function borrowDebt(
        address positionOwner,
        address borrowVault,
        uint256 borrowAmount
    ) external {
        require(positionOwner != address(0), "positionOwner is zero");
        require(borrowVault != address(0), "borrowVault is zero");
        require(borrowAmount > 0, "borrowAmount is zero");

        // Make the borrow call through EVC to attribute the debt to positionOwner
        bytes memory ret = IEVC(evc).call(
            borrowVault,
            positionOwner,
            0,
            abi.encodeWithSelector(IEVault.borrow.selector, borrowAmount, address(this))
        );

        require(ret.length == 32, "!ret.length");
    }

    // Repay debt on behalf of positionOwner using tokens held by this contract (or pulled from msg.sender).
    // This avoids EVC for token sourcing convenience by using onBehalfOf.
    function repayDebt(
        address positionOwner,
        address borrowVault,
        uint256 repayAmount
    ) public {
        require(positionOwner != address(0), "positionOwner is zero");
        require(borrowVault != address(0), "borrowVault is zero");
        require(repayAmount > 0, "repayAmount is zero");

        address borrowAsset = IEVault(borrowVault).asset();

        _approveIfNeeded(borrowAsset, borrowVault, repayAmount);
        IEVault(borrowVault).repay(repayAmount, positionOwner);
        IERC20(borrowAsset).approve(borrowVault, 0);
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
            IERC20(token).forceApprove(spender, type(uint256).max);
        }
    }
}