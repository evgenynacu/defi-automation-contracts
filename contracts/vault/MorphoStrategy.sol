// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../morpho/MorphoBlue.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MorphoStrategy {
    using SafeERC20 for IERC20;

    // Events
    event CollateralSupplied(address token, uint256 amount);
    event CollateralWithdrawn(address token, uint256 amount);
    event BaseTokenBorrowed(address token, uint256 amount);
    event BaseTokenRepaid(address token, uint256 amount);

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
        MorphoBlue.MarketParams memory params = _getMarketParams(marketId);

        // If max uint is passed, supply all available tokens
        uint256 supplyAmount;
        if (amount == type(uint256).max) {
            supplyAmount = IERC20(params.collateralToken).balanceOf(address(this));
        } else {
            supplyAmount = amount;
        }

        require(supplyAmount > 0, "Amount must be greater than 0");

        // Approve Comet to transfer tokens if needed
        _approveIfNeeded(params.collateralToken, address(MORPHO), supplyAmount);

        // Supply the token as collateral
        MORPHO.supplyCollateral(params, supplyAmount, to, "");

        emit CollateralSupplied(params.collateralToken, supplyAmount);
    }

    function borrowFromMarket(bytes32 marketId, address from, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        MorphoBlue.MarketParams memory params = _getMarketParams(marketId);
        MORPHO.borrow(params, amount, 0, from, address(this));

        emit BaseTokenBorrowed(params.loanToken, amount);
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

    function _getMarketParams(bytes32 id) internal view returns (MorphoBlue.MarketParams memory params) {
        (params.loanToken, params.collateralToken, params.oracle, params.irm, params.lltv) = MORPHO.idToMarketParams(id);
    }
}