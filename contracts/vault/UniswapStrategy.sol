// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "../uniswap-v3-periphery/interfaces/INonfungiblePositionManager.sol";
import "../uniswap-v3-periphery/libraries/LiquidityAmounts.sol";
import {StorageUtil} from "../util/StorageUtil.sol";

contract UniswapStrategy {
    event Withdraw(
        uint indexed tokenId,
        uint fees0,
        uint fees1,
        uint amount0,
        uint amount1
    );

    event Deposit(
        uint indexed tokenId,
        int24 tickLower,
        int24 tickUpper,
        uint amount0,
        uint amount1,
        uint balance0,
        uint balance1
    );

    string private constant _NAMESPACE = "UniswapStrategy";
    uint256 private constant MINT_BURN_SLIPPAGE = 100; // 1%

    // ------ immutable vars ----- //

    IUniswapV3Pool private immutable POOL;
    INonfungiblePositionManager private immutable NFT_MANAGER;
    IERC20 private immutable TOKEN0;
    IERC20 private immutable TOKEN1;
    uint24 private immutable FEE;

    // ------ slots for state vars ----- //
    bytes32 private constant TOKEN_ID_SLOT = keccak256("_tokenId");

    // ----- message types ----- //

    struct State {
        uint256 id;            // tokenId
        address token0;        // token0 address
        address token1;        // token1 address
        uint24 fee;            // pool fee
        uint160 sqrtPriceX96;  // current sqrt price
        uint8 decimals0;       // token0 decimals
        uint8 decimals1;       // token1 decimals
        uint256 balance0;      // token0 balance
        uint256 balance1;      // token1 balance
        uint256 staked0;       // token0 staked in position
        uint256 staked1;       // token1 staked in position
        uint256 fees0;         // token0 uncollected fees
        uint256 fees1;         // token1 uncollected fees
    }

    struct DepositParams {
        uint test;
    }

    struct WithdrawParams {
        uint test;
    }

    constructor(address pool, address nftManager) {
        POOL = IUniswapV3Pool(pool);
        TOKEN0 = IERC20(POOL.token0());
        TOKEN1 = IERC20(POOL.token1());
        NFT_MANAGER = INonfungiblePositionManager(nftManager);
        FEE = POOL.fee();
    }

    // ----- init ----- //

    function init() external {
        TOKEN0.approve(address(NFT_MANAGER), type(uint256).max);
        TOKEN1.approve(address(NFT_MANAGER), type(uint256).max);
    }

    // ----- view functions ----- //

    function readState() external returns (State memory) {
        State memory state;
        state.id = _readTokenId();

        // Get current price
        state.sqrtPriceX96 = getPoolPriceFromPool();

        // Get token addresses and decimals
        state.token0 = address(TOKEN0);
        state.token1 = address(TOKEN1);
        state.fee = FEE;
        state.decimals0 = ERC20(address(TOKEN0)).decimals();
        state.decimals1 = ERC20(address(TOKEN1)).decimals();

        // Get balances
        state.balance0 = TOKEN0.balanceOf(address(this));
        state.balance1 = TOKEN1.balanceOf(address(this));

        if (state.id != 0) {
            (int24 tickLower, int24 tickUpper, uint128 liquidity) = readPosition(state.id);

            // Calculate staked amounts
            (state.staked0, state.staked1) = getAmountsForLiquidity(
                liquidity,
                state.sqrtPriceX96,
                tickLower,
                tickUpper
            );

            // Get uncollected fees
            (state.fees0, state.fees1) = NFT_MANAGER.collect(INonfungiblePositionManager.CollectParams({
                tokenId: state.id,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            }));
        }
        return state;
    }

    // ----- main strategy functions ----- //

    // @notice Deposits funds into the strategy
    function deposit(
        int24 newTickLower,
        int24 newTickUpper
    ) external {
        require(_readTokenId() == 0, "PosExists");

        (uint tokenId, uint amount0, uint amount1) = _estimateAndCreatePosition(
            getPoolPriceFromPool(),
            newTickLower,
            newTickUpper
        );
        _setTokenId(tokenId);

        uint balance0 = TOKEN0.balanceOf(address(this));
        uint balance1 = TOKEN1.balanceOf(address(this));
        emit Deposit(tokenId, newTickLower, newTickUpper, amount0, amount1, balance0, balance1);
    }

    // @notice withdraws funds from the strategy
    function withdraw() external {
        uint tokenId = _readTokenId();
        require(tokenId != 0, "PosNotExists");
        (int24 tickLower, int24 tickUpper, uint128 liquidity) = readPosition(tokenId);

        (uint256 _collected0, uint256 _collected1, uint256 _amount0, uint256 _amount1) = _withdrawPositionWithFees(
            getPoolPriceFromPool(), tokenId, liquidity, tickLower, tickUpper
        );
        NFT_MANAGER.burn(tokenId);
        _setTokenId(0);

        emit Withdraw(tokenId, _collected0, _collected1, _amount0, _amount1);
    }

    // ----- uniswap-related helper functions ----- //

    /**
     * @dev Withdraws all current liquidity from the position
     */
    function _withdrawPositionWithFees(
        uint160 poolPrice,
        uint tokenId,
        uint128 liqudity,
        int24 tickLower,
        int24 tickUpper
    ) private returns (uint256 _collected0, uint256 _collected1, uint256 _amount0, uint256 _amount1) {
        (_collected0, _collected1) = _collect(type(uint128).max, type(uint128).max, tokenId);
        (_amount0, _amount1) = _decreasePositionLiquidity(poolPrice, tokenId, liqudity, tickLower, tickUpper);
        _collect(uint128(_amount0), uint128(_amount1), tokenId);
    }

    /**
      *  @dev Collect token amounts from pool position
     */
    function _collect(
        uint128 _amount0,
        uint128 _amount1,
        uint256 _positionId
    ) private returns (uint256 collected0, uint256 collected1) {
        (collected0, collected1) = NFT_MANAGER.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: _positionId,
                recipient: address(this),
                amount0Max: _amount0,
                amount1Max: _amount1
            })
        );
    }

    /**
     * @dev Removes all liquidity from the Uni V3 position
     * @return amount0 token0 amount unstaked
     * @return amount1 token1 amount unstaked
     */
    function _decreasePositionLiquidity(
        uint160 poolPrice,
        uint256 tokenId,
        uint128 liquidity,
        int24 tickLower,
        int24 tickUpper
    ) private returns (uint256 amount0, uint256 amount1) {
        // calculate amounts to withdraw
        (uint256 _amount0, uint256 _amount1) = getAmountsForLiquidity(liquidity, poolPrice, tickLower, tickUpper);
        // withdraw liquidity
        (amount0, amount1) = NFT_MANAGER.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidity,
                amount0Min: _amount0,
                amount1Min: _amount1,
                deadline: block.timestamp
            })
        );
    }

    function _estimateAndCreatePosition(
        uint160 poolPrice,
        int24 newTickLower,
        int24 newTickUpper
    ) internal returns (uint tokenId, uint amount0, uint amount1) {
        (uint256 amount0Minted, uint256 amount1Minted) = calculatePoolMintedAmounts(
            TOKEN0.balanceOf(address(this)),
            TOKEN1.balanceOf(address(this)),
            poolPrice,
            getPriceFromTick(newTickLower),
            getPriceFromTick(newTickUpper)
        );

        (tokenId, amount0, amount1) = createPosition(
            amount0Minted,
            amount1Minted,
            newTickLower,
            newTickUpper
        );
    }

    /**
     * @dev Creates the NFT token representing the pool position
     * @dev Mint initial liquidity
     */
    function createPosition(
        uint256 amount0,
        uint256 amount1,
        int24 newTickLower,
        int24 newTickUpper
    ) private returns (uint _tokenId, uint _amount0, uint _amount1) {
        (_tokenId,, _amount0, _amount1) = NFT_MANAGER.mint(
            INonfungiblePositionManager.MintParams({
                token0: address(TOKEN0),
                token1: address(TOKEN1),
                fee: FEE,
                tickLower: newTickLower,
                tickUpper: newTickUpper,
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: amount0 - amount0 / MINT_BURN_SLIPPAGE,
                amount1Min: amount1 - amount1 / MINT_BURN_SLIPPAGE,
                recipient: address(this),
                deadline: block.timestamp
            })
        );
    }

    /**
     * @dev Calculates the amounts deposited/withdrawn from the pool
     * amount0, amount1 - amounts to deposit/withdraw
     * amount0Minted, amount1Minted - actual amounts which can be deposited
     */
    function calculatePoolMintedAmounts(
        uint256 amount0,
        uint256 amount1,
        uint160 poolPrice,
        uint160 priceLower,
        uint160 priceUpper
    ) public pure returns (uint256 amount0Minted, uint256 amount1Minted) {
        uint128 liquidityAmount = getLiquidityForAmounts(
            amount0,
            amount1,
            poolPrice,
            priceLower,
            priceUpper
        );
        (amount0Minted, amount1Minted) = getAmountsForLiquidity(
            liquidityAmount,
            poolPrice,
            priceLower,
            priceUpper
        );
    }

    /**
     * @dev Calculate pool liquidity for given token amounts
     */
    function getLiquidityForAmounts(
        uint256 amount0,
        uint256 amount1,
        uint160 poolPrice,
        uint160 priceLower,
        uint160 priceUpper
    ) public pure returns (uint128 liquidity) {
        liquidity = LiquidityAmounts.getLiquidityForAmounts(
            poolPrice,
            priceLower,
            priceUpper,
            amount0,
            amount1
        );
    }

    /**
     * @dev Calculate token amounts for given pool liquidity
     */
    function getAmountsForLiquidity(
        uint128 liquidity,
        uint160 poolPrice,
        int24 tickLower,
        int24 tickUpper
    ) public pure returns (uint256 amount0, uint256 amount1) {
        (amount0, amount1) = getAmountsForLiquidity(
            liquidity,
            poolPrice,
            getPriceFromTick(tickLower),
            getPriceFromTick(tickUpper)
        );
    }

    /**
     * @dev Calculate token amounts for given pool liquidity
     */
    function getAmountsForLiquidity(
        uint128 liquidity,
        uint160 poolPrice,
        uint160 priceLower,
        uint160 priceUpper
    ) public pure returns (uint256 amount0, uint256 amount1) {
        (amount0, amount1) = LiquidityAmounts.getAmountsForLiquidity(
            poolPrice,
            priceLower,
            priceUpper,
            liquidity
        );
    }

    /**
     * @dev Get a pool's price from pool address
     */
    function getPoolPriceFromPool() public view returns (uint160 sqrtPriceX96) {
        (sqrtPriceX96, , , , , ,) = POOL.slot0();
    }

    /**
     * @dev get price from tick
     */
    function getPriceFromTick(int24 tick) public pure returns (uint160) {
        return TickMath.getSqrtRatioAtTick(tick);
    }

    /**
     * @dev Returns the parameters needed for reposition function
     * @param _positionId the nft id of the position
     */
    function readPosition(uint256 _positionId) public view returns (int24 tickLower, int24 tickUpper, uint128 liquidity) {
        (
        ,
        ,
        ,
        ,
        ,
            tickLower,
            tickUpper,
            liquidity,
        ,
        ,
        ,

        ) = NFT_MANAGER.positions(_positionId);
    }

    // ----- low-level util functions ----- //

    function _setTokenId(uint _tokenId) internal {
        StorageUtil.setUintSlot(TOKEN_ID_SLOT, _tokenId);
    }

    function _readTokenId() internal view returns (uint) {
        return StorageUtil.readUintSlot(TOKEN_ID_SLOT);
    }
}