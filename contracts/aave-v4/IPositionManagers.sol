// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// @notice Minimal subset of the Aave v4 position managers.
// @dev Vendored from aave/aave-v4 (src/position-manager/interfaces/*).
//
//      A Spoke only accepts an `onBehalfOf` different from msg.sender when the caller is an active
//      position manager approved by that user. Activation is governance-gated, so arbitrary contracts
//      cannot self-register — but Aave deploys and activates these three general-purpose managers, which
//      expose the same actions behind approvals the user grants directly. That is the same trust model as
//      v3 credit delegation, and it is how a vault operates a user's position on v4.

// @notice Actions that add value to a position, so they need no approval from the target user.
interface IGiverPositionManager {
    // @dev Pulls the underlying from msg.sender.
    function supplyOnBehalfOf(
        address spoke,
        uint256 reserveId,
        uint256 amount,
        address onBehalfOf
    ) external returns (uint256, uint256);

    // @dev Pulls the underlying from msg.sender. Reverts on type(uint256).max — it clamps to the
    //      outstanding debt internally, so an over-quote is the way to repay in full.
    function repayOnBehalfOf(
        address spoke,
        uint256 reserveId,
        uint256 amount,
        address onBehalfOf
    ) external returns (uint256, uint256);
}

// @notice Actions that take value out of a position, gated by per-(spoke, reserve) allowances.
interface ITakerPositionManager {
    // @dev Sends the withdrawn underlying to msg.sender.
    function withdrawOnBehalfOf(
        address spoke,
        uint256 reserveId,
        uint256 amount,
        address onBehalfOf
    ) external returns (uint256, uint256);

    // @dev Sends the borrowed underlying to msg.sender.
    function borrowOnBehalfOf(
        address spoke,
        uint256 reserveId,
        uint256 amount,
        address onBehalfOf
    ) external returns (uint256, uint256);

    // @notice Granted by the position owner to a spender. The v4 analogue of an aToken approval.
    function approveWithdraw(address spoke, uint256 reserveId, address spender, uint256 amount) external;

    // @notice Granted by the position owner to a spender. The v4 analogue of credit delegation.
    function approveBorrow(address spoke, uint256 reserveId, address spender, uint256 amount) external;

    function withdrawAllowance(
        address spoke,
        uint256 reserveId,
        address owner,
        address spender
    ) external view returns (uint256);

    function borrowAllowance(
        address spoke,
        uint256 reserveId,
        address owner,
        address spender
    ) external view returns (uint256);
}

// @notice Position configuration on behalf of a user, gated by per-spoke boolean permissions.
interface IConfigPositionManager {
    struct ConfigPermissionValues {
        bool canSetUsingAsCollateral;
        bool canUpdateUserRiskPremium;
        bool canUpdateUserDynamicConfig;
    }

    function setUsingAsCollateralOnBehalfOf(
        address spoke,
        uint256 reserveId,
        bool usingAsCollateral,
        address onBehalfOf
    ) external;

    // @notice Granted by the position owner. Spoke-wide, not per reserve.
    function setCanSetUsingAsCollateralPermission(address spoke, address delegatee, bool status) external;

    function getConfigPermissions(
        address spoke,
        address delegatee,
        address onBehalfOf
    ) external view returns (ConfigPermissionValues memory);
}
