// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface IPendleOracle {
    function getPtToAssetRate(address market, uint32 duration) external view returns (uint256);
}

contract PriceOracle is Ownable {

    uint8 public constant DECIMALS = 8;
    uint256 private constant WAD = 1e18;

    // Pendle Oracle address
    address private constant PENDLE_ORACLE = 0x9a9Fa8338dd5E5B2188006f1Cd2Ef26d921650C2;

    // Token addresses (Ethereum Mainnet)
    address private constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address private constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address private constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address private constant USDe = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;

    // Chainlink Price Feed addresses (Ethereum Mainnet)
    address private constant USDC_USD_FEED = 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6;
    address private constant USDT_USD_FEED = 0x3E7d1eAB13ad0104d2750B8863b489D65364e32D;
    address private constant DAI_USD_FEED = 0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9;
    address private constant USDe_USD_FEED = 0xa569d910839Ae8865Da8F8e70FfFb0cBA869F961;

    // Token decimals
    uint8 private constant USDC_DECIMALS = 6;
    uint8 private constant DAI_DECIMALS = 18;
    uint8 private constant DEFAULT_DECIMALS = 18;

    // Chainlink Price Feed addresses
    mapping(address => address) public priceFeeds;

    // Mapping for PT tokens -> market address
    mapping(address => address) public ptToMarket;

    // Mapping for PT tokens -> underlying stablecoin
    mapping(address => address) public ptToUnderlying;

    event PriceFeedUpdated(address indexed token, address indexed priceFeed);
    event PTTokenAdded(address indexed ptToken, address indexed market, address indexed underlying);

    constructor() Ownable(msg.sender) {
    }

    /**
     * @dev Main function to get USD value of tokens
     * @param token Token address
     * @param amount Amount of tokens (in wei)
     * @return usdValue Value in USD with 8 decimal places
     */
    function getUsdValue(address token, uint256 amount) external view returns (uint256 usdValue) {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        // Check if token is a PT token
        address market = ptToMarket[token];
        if (market != address(0)) {
            return _getPTTokenUsdValue(token, amount, market);
        }

        return _getChainlinkUsdValue(token, amount);
    }

    /**
     * @dev Get USD value of PT token using PendleOracle
     */
    function _getPTTokenUsdValue(address ptToken, uint256 amount, address market) private view returns (uint256) {
        address underlying = ptToUnderlying[ptToken];
        require(underlying != address(0), "PT underlying not found");

        // Get PT to asset rate from PendleOracle
        uint256 ptToAssetRate = IPendleOracle(PENDLE_ORACLE).getPtToAssetRate(market, 0);

        // Calculate PT tokens value in USD
        // PT Rate * Amount * Underlying Price
        uint256 ptValueInUnderlying = (amount * ptToAssetRate) / WAD;

        return _getChainlinkUsdValue(underlying, ptValueInUnderlying);
    }

    /**
     * @dev Get USD value via Chainlink Price Feed
     */
    function _getChainlinkUsdValue(address token, uint256 amount) private view returns (uint256) {
        address feedAddress = _getPriceFeed(token);
        require(feedAddress != address(0), "Underlying price feed not found");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);

        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();

        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt <= 3600 * 24, "Price data too old");

        uint8 tokenDecimals = _getTokenDecimals(token);
        uint8 feedDecimals = priceFeed.decimals();

        uint256 normalizedAmount = _normalizeAmount(amount, tokenDecimals, 18);
        uint256 usdValue = (normalizedAmount * uint256(price)) / (10**(18 + feedDecimals - DECIMALS));

        return usdValue;
    }

    /**
     * @dev Normalize token amount accounting for decimals
     */
    function _normalizeAmount(uint256 amount, uint8 fromDecimals, uint8 toDecimals) private pure returns (uint256) {
        if (fromDecimals == toDecimals) {
            return amount;
        } else if (fromDecimals < toDecimals) {
            return amount * (10**(toDecimals - fromDecimals));
        } else {
            return amount / (10**(fromDecimals - toDecimals));
        }

    }
    /**
     * @dev Get number of decimal places for token
     */
    function _getTokenDecimals(address token) private pure returns (uint8) {
        if (token == USDC || token == USDT) {
            return USDC_DECIMALS; // Both USDC and USDT have 6 decimals
        } else if (token == DAI) {
            return DAI_DECIMALS;
        }
        return DEFAULT_DECIMALS;
    }

    function _getPriceFeed(address token) private view returns (address) {
        if (token == USDC) {
            return USDC_USD_FEED;
        }
        if (token == USDT) {
            return USDT_USD_FEED;
        }
        if (token == DAI) {
            return DAI_USD_FEED;
        }
        if (token == USDe) {
            return USDe_USD_FEED;
        }

        return priceFeeds[token];
    }

    // === ADMIN FUNCTIONS ===

    /**
     * @dev Add Price Feed for any token
     */
    function addPriceFeed(address token, address priceFeed) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(priceFeed != address(0), "Invalid price feed");

        priceFeeds[token] = priceFeed;

        emit PriceFeedUpdated(token, priceFeed);
    }

    /**
     * @dev Add PT token
     */
    function addPTToken(
        address ptToken,
        address market,
        address underlyingToken
    ) external onlyOwner {
        require(ptToken != address(0), "Invalid PT token");
        require(market != address(0), "Invalid market");
        require(underlyingToken != address(0), "Invalid underlying");
        require(_getPriceFeed(underlyingToken) != address(0), "Underlying must have price feed");

        ptToMarket[ptToken] = market;
        ptToUnderlying[ptToken] = underlyingToken;

        emit PTTokenAdded(ptToken, market, underlyingToken);
    }
}