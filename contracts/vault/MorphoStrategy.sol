// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../morpho/MorphoBlue.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MorphoStrategy {
    using SafeERC20 for IERC20;

    // Morpho contract address
    MorphoBlue public immutable MORPHO;

    /**
     * @notice Constructor for the strategy
     * @param _morphoAddress The Morpho contract address
     */
    constructor(address _morphoAddress) {
        require(_morphoAddress != address(0), "Invalid Morpho address");
        MORPHO = MorphoBlue(_morphoAddress);
    }

    /**
     * @notice Supply token as collateral to Compound V3
     * @param amount The amount to supply. If type(uint256).max is passed, all available tokens will be supplied
     */
    function supplyCollateral(bytes32 marketId, address to, uint256 amount) external {
        MorphoBlue.MarketParams memory params = MORPHO.idToMarketParams(marketId);

        // If max uint is passed, supply all available tokens
        uint256 supplyAmount;
        if (amount == type(uint256).max) {
            supplyAmount = IERC20(params.collateralToken).balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        // Approve Comet to transfer tokens if needed
        _approveIfNeeded(params.collateralToken, address(MORPHO), supplyAmount);

        // Supply the token as collateral
        MORPHO.supplyCollateral(params, supplyAmount, to, "");
    }

    function withdrawCollateral(bytes32 marketId, address from, uint amount) external {
        MorphoBlue.MarketParams memory params = MORPHO.idToMarketParams(marketId);

        MORPHO.withdrawCollateral(params, amount, from, address(this));
    }

    function borrowFromMarket(bytes32 marketId, address from, uint256 amount) external {
        MorphoBlue.MarketParams memory params = MORPHO.idToMarketParams(marketId);
        MORPHO.borrow(params, amount, 0, from, address(this));
    }

    function repayDebt(bytes32 marketId, address to, uint256 assets, uint256 shares) external {
        MorphoBlue.MarketParams memory params = MORPHO.idToMarketParams(marketId);

        _approveIfNeeded(params.loanToken, address(MORPHO), type(uint128).max);
        MORPHO.repay(params, assets, shares, to, "");
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