// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/// @dev Represents on-chain investment. This covers any investment where you deposit single token -> you get another ERC-20 in return.
/// @dev Later you can redeem original investment token
abstract contract Investment is ERC20Upgradeable {

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    IERC20 public primary;

    function __SingleTokenInvestment_init_unchained(IERC20 _primary) internal onlyInitializing {
        primary = _primary;
    }

    /// @notice calculates value for the wallet denominated in primary tokens
    function calculateValue(address wallet) external view returns (uint value) {
        uint _totalSupply = totalSupply();
        uint _balance = balanceOf(wallet);
        uint _totalValue = _calculateTotalValue();
        return _totalValue * _balance / _totalSupply;
    }

    function calculateValue(uint _balance) external view returns (uint value) {
        uint _totalSupply = totalSupply();
        uint _totalValue = _calculateTotalValue();
        return _totalValue * _balance / _totalSupply;
    }

    /// @notice Calculates total assets denominated in primary tokens
    function _calculateTotalValue() internal view virtual returns (uint total);

    /// @dev Deposits primary token and mints this token
    function deposit(uint amount) external onlyUser returns (uint minted) {
        require(amount > 0, "Zero amount");
        require(primary.transferFrom(_msgSender(), address(this), amount), "Transfer failed");
        uint toMint = _deposit(amount);
        _mint(_msgSender(), toMint);
        return toMint;
    }

    /// @dev Burns this token and withdraws primary investment token
    function withdraw(uint amount) external onlyUser returns (uint withdrawn) {
        require(amount > 0, "Zero amount");

        uint _totalSupply = totalSupply();
        _burn(_msgSender(), amount);

        uint toWithdraw = _prepareWithdraw(amount, _totalSupply);
        require(primary.transfer(_msgSender(), toWithdraw), "Transfer failed");
        return toWithdraw;
    }

    /// @dev Prepares liquidity to be withdrawn. Returns amount of tokens to withdraw
    function _prepareWithdraw(uint amount, uint totalSupply) internal virtual returns (uint readyToWithdraw);

    function _deposit(uint amount) internal virtual returns (uint toMint);

    modifier onlyUser() {
        require(_isUser(), "NotUser");
        _;
    }

    function _isUser() internal virtual view returns (bool);

    modifier onlyOwner() {
        require(_msgSender() == _owner(), "NOT_AUTHORIZED");
        _;
    }

    function _owner() internal view returns (address adminAddress) {
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            adminAddress := sload(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103)
        }
    }

    function claimOwner() external {
        require(_owner() == 0x0000000000000000000000000000000000000000, "owner already set");
        _setOwner(_msgSender());
    }

    function _setOwner(address newOwner) internal {
        address previousOwner = _owner();
        // solhint-disable-next-line security/no-inline-assembly
        assembly {
            sstore(0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103, newOwner)
        }
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
