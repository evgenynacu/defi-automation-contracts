// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReservoirPegStabilityModule} from "./ReservoirPegStabilityModule.sol";
import {ReservoirSavingModule} from "./ReservoirSavingModule.sol";
import {ReservoirCreditEnforcer} from "./ReservoirCreditEnforcer.sol";

contract ReservoirSwap {
    using SafeERC20 for IERC20;

    IERC20 private immutable token;
    IERC20 private immutable usdc;
    IERC20 private immutable savingToken;
    ReservoirSavingModule private immutable savingModule;
    ReservoirPegStabilityModule private immutable psm;
    ReservoirCreditEnforcer private immutable creditEnforcer;

    constructor(IERC20 _token, IERC20 _usdc, IERC20 _savingToken, ReservoirSavingModule _savingModule, ReservoirPegStabilityModule _psm, ReservoirCreditEnforcer _creditEnforcer) {
        token = _token;
        usdc = _usdc;
        savingToken = _savingToken;
        savingModule = _savingModule;
        psm = _psm;
        creditEnforcer = _creditEnforcer;
    }

    function swapSavingsToUSDC(uint amount) external {
        savingToken.safeTransferFrom(msg.sender, address(this), amount);

        uint price = savingModule.currentPrice();
        uint fee = savingModule.redeemFee();
        uint rUsdAmount = amount * price / (100 * (1000000 + fee));
        _approveSwap(savingToken, address(savingModule));
        savingModule.redeem(rUsdAmount);

        uint outAmount = rUsdAmount / 10 ** 12;
        _approveSwap(token, address(psm));
        psm.redeem(outAmount);

        _transferChange(usdc, 10000);
        _transferChange(token, 10000000000000000);
        _transferChange(savingToken, 10000000000000000);
    }

    function swapUSDCToSavings(uint amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _approveSwap(usdc, address(psm));
        creditEnforcer.mintStablecoin(amount);

        _approveSwap(token, address(savingModule));
        creditEnforcer.mintSavingcoin(amount * 10 ** 12);

        _transferChange(usdc, 10000);
        _transferChange(token, 10000000000000000);
        _transferChange(savingToken, 10000000000000000);
    }

    function _transferChange(IERC20 _token, uint minimal) internal {
        uint balance = _token.balanceOf(address(this));
        if (balance > minimal) {
            _token.safeTransfer(msg.sender, balance);
        }
    }

    function _approveSwap(IERC20 token0, address exchange) internal {
        if (token0.allowance(address(this), address(exchange)) == 0) {
            token0.forceApprove(exchange, type(uint256).max);
        }
    }
}
