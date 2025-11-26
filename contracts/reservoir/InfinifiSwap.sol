// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IInfiniFiGatewayV2 {
    function unstake(address _to, uint256 _stakedTokens) external returns (uint256);
    function redeem(address _to, uint256 _amount, uint256 _minAssetsOut) external returns (uint256);
    function mintAndStake(address _to, uint256 _amount) external returns (uint256);
}

contract InfinifiSwap {
    using SafeERC20 for IERC20;

    IERC20 public immutable siUSD;   // Staked infiniFi USD (siUSD)
    IERC20 public immutable iUSD;    // infiniFi USD (iUSD)
    IERC20 public immutable usdc;    // USDC
    IInfiniFiGatewayV2 public immutable gateway;

    constructor(
        IERC20 _siUSD,
        IERC20 _iUSD,
        IERC20 _usdc,
        IInfiniFiGatewayV2 _gateway
    ) {
        siUSD = _siUSD;
        iUSD = _iUSD;
        usdc = _usdc;
        gateway = _gateway;
    }

    function mintFromUsdcAndStake(uint256 usdcAmount) external returns (uint256 siUsdAmount) {
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        uint256 siUsdAmountBefore = siUSD.balanceOf(address(this));

        _approveIfNeeded(usdc, address(gateway));
        gateway.mintAndStake(address(this), usdcAmount);

        siUsdAmount = siUSD.balanceOf(address(this)) - siUsdAmountBefore;

        _sweepToken(siUSD);
        _sweepToken(iUSD);
        _sweepToken(usdc);
    }

    function unstakeAndRedeemToUsdc(
        uint256 siUsdAmount,
        uint256 minUsdcOut
    ) external returns (uint256 usdcOut) {
        require(siUsdAmount > 0, "amount = 0");

        siUSD.safeTransferFrom(msg.sender, address(this), siUsdAmount);

        _approveIfNeeded(siUSD, address(gateway));

        uint256 iUsdAmount = gateway.unstake(address(this), siUsdAmount);
        require(iUsdAmount > 0, "iUSD = 0");

        _approveIfNeeded(iUSD, address(gateway));

        usdcOut = gateway.redeem(address(this), iUsdAmount, minUsdcOut);
        require(usdcOut >= minUsdcOut, "slippage");

        _sweepToken(siUSD);
        _sweepToken(iUSD);
        _sweepToken(usdc);
    }

    function _approveIfNeeded(IERC20 token, address spender) internal {
        if (token.allowance(address(this), spender) == 0) {
            token.forceApprove(spender, type(uint256).max);
        }
    }

    function _sweepToken(IERC20 token) internal {
        uint256 bal = token.balanceOf(address(this));
        if (bal > 0) {
            token.safeTransfer(msg.sender, bal);
        }
    }
}
