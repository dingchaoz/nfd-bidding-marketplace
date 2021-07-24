//SPDX-License-Identfier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Counters.sol";


contract NFTMarket {

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