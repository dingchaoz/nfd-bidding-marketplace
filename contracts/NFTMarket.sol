//SPDX-License-Identfier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Counters.sol";


contract NFTMarket {

    using Counters for Counters.Counter;

    /* ========== STATE VARIABLES ========== */

    // counter of nft created on the market
    Counters.Counter private _itemIds;

    // counter of nft sold on the market
    Counters.Counter private _itemSold;

    // contract onwer
    address payable owner;

    // listing fee 
    uint256 listingPrice = 0.005 ether;

    // struct to store details of each bidding nft
    struct BidItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 minPrice;
        uint auctionEndTime;
        address highestBidder;
        uint highestBid;
        bool ended;
        bool sold;
    }

    mapping(uint256 => BidItem) private idToBidItem;

    /* ========== EVENTS ========== */
    event BidItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 minPrice,
        uint auctionEndTime,
        address highestBidder,
        uint highestBid,
        bool ended,
        bool sold
    );

    event HighestBidIncreased(uint indexed itemId,address bidder, uint amount);
    event AuctionEnded(uint indexed itemId,address winner, uint amount);

}