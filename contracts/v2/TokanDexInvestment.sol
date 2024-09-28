// SPDX-License-Identifier: UNLICENSED
// This code has not been professionally audited, therefore I cannot make any promises about
// safety or correctness. Use at own risk.
pragma solidity ^0.8.0;

import "./DexInvestment.sol";
import "../interfaces/tokan/TokanPair.sol";
import "../interfaces/tokan/TokanRouter.sol";
import "../interfaces/tokan/TokanGauge.sol";

contract TokanDexInvestment is DexInvestment {
    uint constant private UINT_MAX = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    TokanRouter public router;
    TokanPair public pair;
    TokanGauge public gauge;
    bool private stable;
    uint private decimalsA;
    TokanRouter.Route[] private rewardExchangeRoute;
    mapping(address account => bool) private users;

    struct TokanDexInvestmentConfig {
        TokanRouter router;
        TokanPair pair;
        TokanGauge gauge;
        uint decimalsA;
        bool stable;
        TokanRouter.Route[] rewardExchangeRoute;
    }

    function __TokanDexInvestment_init(string memory name_, string memory symbol_, IERC20 _primary, IERC20 _secondary, IERC20 _reward, TokanDexInvestmentConfig memory config) initializer external {
        __Context_init_unchained();
        __ERC20_init_unchained(name_, symbol_);
        __SingleTokenInvestment_init_unchained(_primary);
        __DexInvestment_init_unchained(_secondary, _reward);
        __TokanDexInvestment_init_unchained(config);
        approveAll();
    }

    function __TokanDexInvestment_init_unchained(TokanDexInvestmentConfig memory config) internal onlyInitializing {
        router = config.router;
        pair = config.pair;
        gauge = config.gauge;
        decimalsA = config.decimalsA;
        stable = config.stable;
        for (uint i = 0; i < config.rewardExchangeRoute.length; i++) {
            TokanRouter.Route memory route = config.rewardExchangeRoute[i];
            rewardExchangeRoute.push(route);
        }
    }

    /// @notice Deposit pooled liquidity (pair)
    function depositPooledLiquidity(uint liquidity) external onlyUser returns (uint minted) {
        pair.transferFrom(_msgSender(), address(this), liquidity);
        gauge.deposit(liquidity);

        uint liquidityValue = _calculateLiquidityValue(liquidity);
        uint toMint = _calculateToMint(liquidityValue);
        _mint(_msgSender(), toMint);
        return toMint;
    }

    /// @notice Calculates value of the pooled liquidity (in primary token A)
    function _calculateLiquidityValue(uint liquidity) internal view returns (uint amount) {
        (uint amountA, uint amountB) = _calculateLiquidityAmounts(liquidity);
        return amountA + _getPrimaryOut(amountB);
    }

    function approveAll() public {
        primary.approve(address(router), UINT_MAX);
        secondary.approve(address(router), UINT_MAX);
        pair.approve(address(gauge), UINT_MAX);
        pair.approve(address(router), UINT_MAX);
        reward.approve(address(router), UINT_MAX);
    }

    /// @notice Invoked on depeg of the stablecoin
    /// @param minOut Minimal price for the secondary -> primary conversion (e.g 1010000000000)
    /// @param maxOut Maximal price for the secondary -> primary conversion (e.g 1000100000000)
    function alarm(uint minOut, uint maxOut) external onlyUser returns (uint exchanged) {
        _withdrawFromDex(100, 100);

        uint amountB = secondary.balanceOf(address(this));
        uint amountA = _exchangeSecondary(amountB);
        //меняли 100, получили out in minPrice. in >= out * minPrice
        // price = out / in. price = in / out
        // in * maxPrice < out
        require(amountA * minOut >= amountB, "minimal price");
        require(amountA * maxOut <= amountB, "maximal price");
        return amountA;
    }

    /// @notice Gets reserves for both assets in the pool
    function _getReserves() internal override view returns (uint reserveA, uint reserveB) {
        (reserveA, reserveB,) = pair.getReserves();
    }

    /// @notice Gets 10**decimals for primary asset
    function _getDecimalsA() internal view override returns (uint) {
        return decimalsA;
    }

    /// @notice Calculates how much secondary tokens will be returned if mainAmount exchanged
    function _getSecondaryOut(uint mainAmount) internal view override returns (uint secondaryAmount) {
        return pair.getAmountOut(mainAmount, address(primary));
    }

    /// @notice Calculates how much primary tokens will be returned if secondaryAmount exchanged
    function _getPrimaryOut(uint secondaryAmount) internal view override returns (uint primaryAmount) {
        return pair.getAmountOut(secondaryAmount, address(secondary));
    }

    /// @notice Exchanges main and gets secondary token
    function _exchangePrimary(uint amount) internal override returns (uint out) {
        TokanRouter.Route[] memory route = new TokanRouter.Route[](1);
        route[0] = TokanRouter.Route({from: address(primary), to: address(secondary), stable: stable});
        uint[] memory amounts = router.swapExactTokensForTokens(amount, _getSecondaryOut(amount), route, address(this), block.timestamp);
        return amounts[1];
    }

    /// @notice Exchanges secondary token and gets primary token
    function _exchangeSecondary(uint amount) internal override returns (uint out) {
        TokanRouter.Route[] memory route = new TokanRouter.Route[](1);
        route[0] = TokanRouter.Route({from: address(secondary), to: address(primary), stable: stable});
        uint[] memory amounts = router.swapExactTokensForTokens(amount, _getPrimaryOut(amount), route, address(this), block.timestamp);
        return amounts[1];
    }

    /// @notice Exchanges secondary token and gets primary token
    function _exchangeRewards(uint amount) internal override returns (uint out) {
        uint _value = _getRewardValue(amount);
        uint[] memory amounts = router.swapExactTokensForTokens(amount, _value, rewardExchangeRoute, address(this), block.timestamp);
        return amounts[rewardExchangeRoute.length];
    }

    /// @notice Returns liquidity currently in the DEX Pool
    function _getDexLiquidity() internal view override returns (uint amountA, uint amountB) {
        // @dev liquidity - total amount of Pair tokens, deposited in Gauge for this Pool
        // @dev potentially some amount can be owned by this contract and not in the gauge, but will always put Pair tokens into the gauge, so should not happen
        uint liquidity = gauge.balanceOf(address(this));
        (amountA, amountB) = _calculateLiquidityAmounts(liquidity);
    }

    /// @notice Calculates how much A & B assets pooled
    function _calculateLiquidityAmounts(uint liquidity) view internal returns (uint amountA, uint amountB) {
        // @dev _balance0, _balance1 - how much primary and secondary tokens pair owns (total DEX liquidity)
        uint256 _balance0 = primary.balanceOf(address(pair));
        uint256 _balance1 = secondary.balanceOf(address(pair));

        // @dev _totalSupply - how much of DEX tokens issued
        uint256 _totalSupply = pair.totalSupply();
        amountA = (liquidity * _balance0) / _totalSupply;
        amountB = (liquidity * _balance1) / _totalSupply;
    }

    /// @notice Returns liquidity currently in the DEX Pool
    function _getRewards() internal view override returns (uint amount) {
        return gauge.earned(address(this));
    }

    /// @notice Adds liquidity into DEX pool
    function _putIntoDex(uint amountA, uint amountB) internal override returns (uint resultA, uint resultB) {
        bool _stable = stable;
        (uint amountAQuote, uint amountBQuote,) = router.quoteAddLiquidity(address(primary), address(secondary), _stable, amountA, amountB);
        uint amountAmin = amountAQuote * 999 / 1000;
        uint amountBmin = amountBQuote * 999 / 1000;
        (uint addedA, uint addedB, uint liquidity) = router.addLiquidity(address(primary), address(secondary), _stable, amountAQuote, amountBQuote, amountAmin, amountBmin, address(this), block.timestamp);

        resultA = addedA;
        resultB = addedB;

        gauge.deposit(liquidity);
    }

    /// @notice Calculates how much primary tokens will be returned if reward exchanged
    function _getRewardValue(uint rewardAmount) internal view override returns (uint primaryAmount) {
        uint[] memory amounts = router.getAmountsOut(rewardAmount, rewardExchangeRoute);
        return amounts[amounts.length - 1];
    }

    /// @notice Receives rewards and transfers them to this smart-contract
    function _receiveRewards() internal override {
        gauge.getReward();
    }

    /// @notice Removes part of the liquidity from DEX (amount/totalSupply)
    function _withdrawFromDex(uint amount, uint totalSupply) internal override returns (uint amountA, uint amountB) {
        uint toWithdraw = gauge.balanceOf(address(this)) * amount / totalSupply;
        gauge.withdraw(toWithdraw);
        (uint quoteA, uint quoteB) = router.quoteRemoveLiquidity(address(primary), address(secondary), stable, toWithdraw);
        uint quoteAmin = quoteA * 999 / 1000;
        uint quoteBmin = quoteB * 999 / 1000;
        (uint withdrawnA, uint withdrawnB) = router.removeLiquidity(address(primary), address(secondary), stable, toWithdraw, quoteAmin, quoteBmin, address(this), block.timestamp);
        amountA = withdrawnA;
        amountB = withdrawnB;
    }

    function _isUser() internal override view returns (bool) {
        return users[_msgSender()];
    }

    function setUser(address account, bool _user) external onlyOwner() {
        users[account] = _user;
    }
}
