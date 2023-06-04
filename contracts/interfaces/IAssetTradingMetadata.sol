// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../libraries/Assets.sol";

interface IAssetTradingMetadata {
    // function balanceTokenOf(address owner, address token) external view returns(uint256);
    // function balanceETHOf(address owner) external view returns(uint256);
    // function balanceNFTOf(address owner, address token) external view returns(uint256);
    // function tokenIdOf(address token, uint256 tokenId) external view returns(address);
    function getAllPairActive() external view returns(Assets.Pair[] memory);
    function getPairsByOwner(address owner) external view returns(Assets.Pair[] memory);
    function getPairById(uint256 id) external view returns(Assets.Pair memory);
}