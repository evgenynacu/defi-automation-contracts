// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {DelegateCall} from "../util/DelegateCall.sol";
import {HasOperation} from "./HasOperation.sol";
import {RolesUpgradeable} from "../util/RolesUpgradeable.sol";

// @notice Vault manages funds. It can have several strategies inside
// @notice Strategy is responsible for depositing/withdrawing funds from it and estimating real value
// @dev Strategy is code-only contract which is called using delegatecall
contract AutomatedVault is HasOperation, IFlashLoanSimpleReceiver, Initializable, ContextUpgradeable, RolesUpgradeable {
    using SafeERC20 for IERC20;

    // @notice list of strategies
    address[] private strategies;
    // @notice Timestamp of the last rebalance operation
    uint256 public lastRebalanceTimestamp;

    event Init();
    event Loss(int256 loss);
    event Deposit(address token, uint amount);
    event Withdraw(address token, uint amount);

    bool private rebalancing;

    struct State {
        uint timestamp;
        bytes[] states;
    }

    // @notice Initialized the vault. It can have any number of initialization calls for the strategies inside
    function __Vault_init(address[] calldata _strategies, Operation[] calldata _initOperations) external initializer {
        __Context_init_unchained();
        __RolesUpgradeable_init_unchained();
        __Vault_init_unchained(_strategies, _initOperations);
        emit Init();
    }

    function __Vault_init_unchained(address[] calldata _strategies, Operation[] calldata _initOperations) internal {
        strategies = _strategies;
        executeOperations(_initOperations);
    }

    // @notice Updates list of strategies
    // @dev Can be called only by owner
    function setStrategies(address[] calldata _strategies) external onlyOwner {
        strategies = _strategies;
    }

    function getStrategies() external view returns (address[] memory) {
        return strategies;
    }

    function deposit(IERC20 token, uint amount) external onlyOwner {
        require(token.transferFrom(_msgSender(), address(this), amount));
        emit Deposit(address(token), amount);
    }

    function withdraw(IERC20 token, uint amount) external onlyOwner {
        require(token.transfer(_msgSender(), amount));
        emit Withdraw(address(token), amount);
    }

    // @dev Rebalances the vault
    function rebalance(uint256 stateTimestamp, int256 _maxLoss, Operation[] calldata _operations) external operatorOrOwner returns (int256 loss) {
        rebalancing = true;
        require(stateTimestamp > lastRebalanceTimestamp, "StaleState!");
        loss = executeOperations(_operations);
        emit Loss(loss);
        require(loss <= _maxLoss, "!LossExceeds");
        lastRebalanceTimestamp = block.timestamp;
        rebalancing = false;
    }

    function executeOperations(Operation[] memory _operations) internal returns (int256 totalLoss) {
        totalLoss = 0;
        for (uint256 i = 0; i < _operations.length; i++) {
            Operation memory _operation = _operations[i];
            bytes memory result = DelegateCall.doDelegateCall(strategies[_operation.position], _operation.callData);

            if (result.length > 0) {
                int256 loss = abi.decode(result, (int256));
                totalLoss += loss;
            }
        }
    }

    /**
     * @notice Reads state from all strategies
     * @dev this is not a view function because some strategies can't have view functions (uniswap)
     */
    function readState() external returns (State memory) {
        require(_msgSender() == address(this) || _msgSender() == _owner());

        uint256 length = strategies.length;
        bytes[] memory states = new bytes[](length);

        for (uint256 i = 0; i < length; i++) {
            address _strategy = strategies[i];
            // Call readState on each strategy using delegatecall
            bytes memory result = DelegateCall.doDelegateCall(_strategy, abi.encodePacked(AutomatedVault.readState.selector));
            states[i] = result;
        }

        return State({
            states: states,
            timestamp: block.timestamp
        });
    }

    /**
     * @notice Callback function for Morpho flash loans
     * @dev Called by Morpho after sending flash loaned tokens to this contract
     * @param amount The amount that was borrowed
     * @param data Raw bytes data to be used for operations
     */
    function onMorphoFlashLoan(
        uint256 amount,
        bytes calldata data
    ) external {
        // Ensure the caller is the Morpho contract
        address morphoAddress = _getMorphoAddress();
        require(rebalancing, "!NotRebalancing");
        require(msg.sender == morphoAddress, "Caller must be Morpho");

        // Execute operations with the borrowed funds
        // data should be encoded as Operation[] by the caller
        Operation[] memory operations = abi.decode(data, (Operation[]));
        // state timestamp was checked
        executeOperations(operations);

        // Transfer tokens back to Morpho to repay the loan
        // This will automatically revert if there aren't enough tokens
        IERC20(_getBaseToken()).approve(morphoAddress, amount);

        // Any profit stays in the vault
    }

    function executeOperation(
        address token,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(rebalancing, "!NotRebalancing");

        require(initiator == address(this));
        // Execute operations with the borrowed funds
        // data should be encoded as Operation[] by the caller
        Operation[] memory operations = abi.decode(params, (Operation[]));
        // state timestamp was checked
        executeOperations(operations);

        // Transfer tokens back to Morpho to repay the loan
        // This will automatically revert if there aren't enough tokens
        IERC20(token).approve(address(POOL()), amount + premium);
        return true;
    }

    /**
     * @notice Helper function to get the Morpho address from a strategy
     * @dev Finds a strategy that implements getMorphoAddress and calls it
     * @return The Morpho contract address
     */
    function _getMorphoAddress() internal view returns (address) {
        // In a real implementation, you might store this address or implement
        // a more efficient lookup mechanism

        for (uint16 i = 0; i < strategies.length; i++) {
            // Try to call getMorphoAddress on each strategy
            (bool success, bytes memory returnData) = strategies[i].staticcall(
                abi.encodeWithSignature("getMorphoAddress()")
            );

            if (success && returnData.length == 32) {
                return abi.decode(returnData, (address));
            }
        }

        revert("Morpho address not found");
    }

    function _getBaseToken() internal view returns (address) {
        for (uint16 i = 0; i < strategies.length; i++) {
            // Try to call getMorphoAddress on each strategy
            (bool success, bytes memory returnData) = strategies[i].staticcall(
                abi.encodeWithSignature("BASE_TOKEN()")
            );

            if (success && returnData.length == 32) {
                return abi.decode(returnData, (address));
            }
        }

        revert("Base token not found");
    }

    function ADDRESSES_PROVIDER() external override view returns (IPoolAddressesProvider) {
        for (uint16 i = 0; i < strategies.length; i++) {
            // Try to call getMorphoAddress on each strategy
            (bool success, bytes memory returnData) = strategies[i].staticcall(
                abi.encodeWithSignature("getAaveAddressProvider()")
            );

            if (success && returnData.length == 32) {
                return IPoolAddressesProvider(abi.decode(returnData, (address)));
            }
        }

        revert("Morpho address not found");
    }

    function POOL() public override view returns (IPool) {
        for (uint16 i = 0; i < strategies.length; i++) {
            // Try to call getMorphoAddress on each strategy
            (bool success, bytes memory returnData) = strategies[i].staticcall(
                abi.encodeWithSignature("getAavePool()")
            );

            if (success && returnData.length == 32) {
                return IPool(abi.decode(returnData, (address)));
            }
        }

        revert("Morpho address not found");
    }

}
