// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

interface PendleMarket {
    struct MarketStorage {
        int128 totalPt;
        int128 totalSy;
        // 1 SLOT = 256 bits
        uint96 lastLnImpliedRate;
        uint16 observationIndex;
        uint16 observationCardinality;
        uint16 observationCardinalityNext;
        // 1 SLOT = 144 bits
    }

    function _storage() external view returns (MarketStorage memory);
}
