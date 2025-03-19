// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {DelegateCall} from "../util/DelegateCall.sol";
import {HasOperation} from "./HasOperation.sol";
import {RolesUpgradeable} from "../util/RolesUpgradeable.sol";
import {StorageUtil} from "../util/StorageUtil.sol";

// @notice Vault manages funds. It can have several strategies inside
// @dev Strategy is code-only contract which is called using delegatecall
contract AutomatedVault is HasOperation, IFlashLoanSimpleReceiver, Initializable, ContextUpgradeable, RolesUpgradeable {

    // Morpho contract address
    address private immutable MORPHO_ADDRESS;
    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;

    bytes32 private constant FLASH_LOAN_OUT_SLOT = keccak256("flashLoan#output");

    // @notice list of strategies
    address[] private strategies;

    bool private rebalancing;

    constructor (address _morpho, address aaveProvider) {
        MORPHO_ADDRESS = _morpho;
        ADDRESSES_PROVIDER = IPoolAddressesProvider(aaveProvider);
        POOL = IPool(IPoolAddressesProvider(aaveProvider).getPool());
        _disableInitializers();
    }

    // @notice Initialized the vault. It can have any number of initialization calls for the strategies inside
    function __Vault_init(address[] calldata _strategies) external initializer {
        __Context_init_unchained();
        __RolesUpgradeable_init_unchained();
        __Vault_init_unchained(_strategies);
    }

    function __Vault_init_unchained(address[] calldata _strategies) internal {
        strategies = _strategies;
    }

    // @notice Updates list of strategies
    // @dev Can be called only by owner
    function setStrategies(address[] calldata _strategies) external onlyOwner {
        strategies = _strategies;
    }

    function getStrategies() external view returns (address[] memory) {
        return strategies;
    }

    // @dev Rebalances the vault
    // @return uint value returned from the swap strategy (if it's used)
    function rebalance(Operation[] calldata _operations) external operatorOrOwner returns (uint out) {
        rebalancing = true;
        out = executeOperations(_operations);
        rebalancing = false;
    }

    function executeOperations(Operation[] memory _operations) internal returns (uint out) {
        out = 0;
        for (uint256 i = 0; i < _operations.length; i++) {
            Operation memory _operation = _operations[i];
            bytes memory result = DelegateCall.doDelegateCall(strategies[_operation.position], _operation.callData);

            if (result.length > 0) {
                out = abi.decode(result, (uint256));
            }
        }
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
        OperationsWithAddress memory received = abi.decode(data, (OperationsWithAddress));
        // state timestamp was checked
        uint out = executeOperations(received.operations);
        StorageUtil.setUintSlot(FLASH_LOAN_OUT_SLOT, out);

        // Transfer tokens back to Morpho to repay the loan
        // This will automatically revert if there aren't enough tokens
        IERC20(received.token).approve(morphoAddress, amount);

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
        uint out = executeOperations(operations);
        StorageUtil.setUintSlot(FLASH_LOAN_OUT_SLOT, out);

        // Transfer tokens back to Morpho to repay the loan
        // This will automatically revert if there aren't enough tokens
        IERC20(token).approve(address(POOL), amount + premium);
        return true;
    }

    function _getMorphoAddress() internal view returns (address) {
        return MORPHO_ADDRESS;
    }
}
