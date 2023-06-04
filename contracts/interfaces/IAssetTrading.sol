// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./IERC721Receiver.sol";
import "./IAssetTradingMetadata.sol";
interface IAssetTrading is IAssetTradingMetadata, IERC721Receiver{
    // Token
    // function depositTokens(address token, uint256 amount) external;
    // function withdrawTokens(address token, uint256 amount) external;
    // ETH
    // function depositETH(uint256 amount) external payable;
    // function withdrawETH(uint256 amount) external;
    // NFT
    // function depositNFT(address token, uint256 tokenId) external;
    // function withdrawNFT(address token, uint256 tokenId) external;
    //TODO: Handle logic core function
    
    // Tokens To
    function createAskTokensToTokens(
        address tokenOut,
        uint256 amountOut,
        address tokenIn,
        uint256 amountIn
    ) external;
    function createAskTokensToETH(
        address tokenOut,
        uint256 amountOut,
        uint256 amountIn
    ) external;
    function createAskTokensToNFT(
        address tokenOut,
        uint256 amountOut,
        address tokenIn,
        uint256 tokenIdIn
    ) external;
    // ETH To
    function createAskETHToTokens(
        address tokenIn,
        uint256 amountIn
    ) external payable;
    function createAskETHToNFT(
        address tokenIn,
        uint256 tokenIdIn
    ) external payable;
    //NFTs To
    function createAskNFTToTokens(
        address tokenOut,
        uint256 tokenIdOut,
        address tokenIn,
        uint256 amountIn
    ) external;
    function createAskNFTToETH(
        address tokenOut,
        uint256 tokenIdOut,
        uint256 amountIn
    ) external;
    function createAskNFTToNFT(
        address tokenOut,
        uint256 tokenIdOut,
        address tokenIn,
        uint256 tokenIdIn
    ) external;


    function removeAsk(uint256 id) external;
    
    // function doBidNotToNFT(uint256 id, uint256 amount) external;
    // function doBidToNFT(uint256 id, uint256 tokenId) external;
    function doBidTokens(uint256 id, uint256 amountBidOut) external;
    function doBidETH(uint256 id) external payable;
    function doBidNFT(uint256 id, uint256 tokenIdBidOut) external;
}