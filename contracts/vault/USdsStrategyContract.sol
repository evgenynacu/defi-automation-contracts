// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IStakedUSD
 * @notice Interface for sUSDS (ERC4626 tokenized vault)
 */
interface IsUSDS is IERC20 {
    // Deposit USDS to receive sUSDS
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    // Redeem sUSDS to get back USDS
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

    // Preview functions to estimate outcomes
    function previewDeposit(uint256 assets) external view returns (uint256 shares);
    function previewRedeem(uint256 shares) external view returns (uint256 assets);

    // Get underlying asset address
    function asset() external view returns (address);
}

/**
 * @title USdsStrategy
 * @notice Strategy for interacting with USDS and sUSDS using deposit/redeem pattern
 */
contract USdsStrategy {
    using SafeERC20 for IERC20;

    // Create a struct with the data we want to return
    struct StrategyData {
        uint256 usdsBalance;    // Current USDS balance
        uint256 sUsdsBalance;   // Current sUSDS balance
        uint256 pricePerShare;  // Current price per share in USDS
    }

    // The USDS token address
    address public immutable USDS_TOKEN;

    // The sUSDS token address
    address public immutable S_USDS_TOKEN;

    // Events
    event USdsDeposited(uint256 usdsAmount, uint256 sUsdsReceived);
    event USdsRedeemed(uint256 sUsdsAmount, uint256 usdsReceived);

    /**
     * @notice Constructor to set the addresses for USDS and sUSDS tokens
     * @param _usdsToken The USDS token address
     * @param _sUsdsToken The sUSDS token address
     */
    constructor(
        address _usdsToken,
        address _sUsdsToken
    ) {
        require(_usdsToken != address(0), "Invalid USDS token address");
        require(_sUsdsToken != address(0), "Invalid sUSDS token address");

        USDS_TOKEN = _usdsToken;
        S_USDS_TOKEN = _sUsdsToken;

        // Verify that sUSDS's underlying asset is indeed USDS
        require(
            IsUSDS(S_USDS_TOKEN).asset() == USDS_TOKEN,
            "sUSDS underlying asset mismatch"
        );
    }

    /**
     * @notice Deposit USDS to receive sUSDS
     * @param amount The amount of USDS to deposit. If type(uint256).max is passed, all available USDS will be deposited
     * @return loss Returns 0 as loss calculation is not applicable here
     */
    function depositUSDS(uint256 amount) external returns (int256) {
        uint256 depositAmount;

        // If max uint is passed, deposit all available USDS
        if (amount == type(uint256).max) {
            depositAmount = IERC20(USDS_TOKEN).balanceOf(address(this));
        } else {
            depositAmount = amount;
        }

        require(depositAmount > 0, "Amount must be greater than 0");

        // Approve sUSDS contract to use our USDS
        _approveIfNeeded(USDS_TOKEN, S_USDS_TOKEN, depositAmount);

        // Deposit USDS to get sUSDS - receive shares to this contract
        uint256 sharesReceived = IsUSDS(S_USDS_TOKEN).deposit(depositAmount, address(this));

        emit USdsDeposited(depositAmount, sharesReceived);

        // No loss calculation for this operation
        return 0;
    }

    /**
     * @notice Redeem sUSDS for USDS
     * @param sUsdsAmount The amount of sUSDS to redeem. If type(uint256).max is passed, all available sUSDS will be redeemed
     * @return loss Returns 0 as loss calculation is not applicable here
     */
    function redeemUSDS(uint256 sUsdsAmount) external returns (int256) {
        uint256 redeemAmount;

        // If max uint is passed, redeem all available sUSDS
        if (sUsdsAmount == type(uint256).max) {
            redeemAmount = IERC20(S_USDS_TOKEN).balanceOf(address(this));
        } else {
            redeemAmount = sUsdsAmount;
        }

        require(redeemAmount > 0, "Amount must be greater than 0");

        // Redeem USDS by providing sUSDS - receive USDS to this contract
        uint256 assetsReceived = IsUSDS(S_USDS_TOKEN).redeem(
            redeemAmount,
            address(this),  // This contract as recipient
            address(this)   // This contract as owner
        );

        emit USdsRedeemed(redeemAmount, assetsReceived);

        // No loss calculation for this operation
        return 0;
    }

    /**
     * @notice Reads the current state of the strategy
     * @dev Returns information about token balances and the current price per share
     * @return State encoded as bytes with token balances and share price
     */
    function readState() external view returns (bytes memory) {
        // Get USDS balance
        uint256 usdsBalance = IERC20(USDS_TOKEN).balanceOf(address(this));

        // Get sUSDS balance
        uint256 sUsdsBalance = IERC20(S_USDS_TOKEN).balanceOf(address(this));

        // Calculate price per share using a constant amount (1e18 = 1 token with 18 decimals)
        // This represents how many USDS tokens you would get for 1 sUSDS token
        uint256 pricePerShare;
        uint256 oneShare = 1e18; // 1 sUSDS token (assuming 18 decimals)

        // Preview how many USDS tokens you would get for 1 sUSDS token
        pricePerShare = IsUSDS(S_USDS_TOKEN).previewRedeem(oneShare);

        StrategyData memory data = StrategyData({
            usdsBalance: usdsBalance,
            sUsdsBalance: sUsdsBalance,
            pricePerShare: pricePerShare
        });

        return abi.encode(data);
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

    /**
     * @notice Initialize the strategy
     * @dev Called via delegatecall from the vault
     */
    function init() external {
        // No special initialization needed
    }
}