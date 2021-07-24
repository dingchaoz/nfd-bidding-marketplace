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

    // a mapping from ntf item id to its details struct
    mapping(uint256 => BidItem) private idToBidItem;

    // store each bidder's bidding amount so they can withdraw if their bids were overbid
    mapping(address => uint) pendingReturns;

    /* ========== EVENTS ========== */

    // broadcast details of newly created nft bid
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

    // broadcast a higher bid 
    event HighestBidIncreased(uint indexed itemId,address bidder, uint amount);

    // broadcast bid ended
    event AuctionEnded(uint indexed itemId,address winner, uint amount);

    /* ========== CONSTRUCTOR ========== */
    constructor() {
        owner = payable(msg.sender);
    }


    /* ========== FUNCTIONS ========== */
    function createBidItem(
        address nftContract,
        uint256 tokenId,
        uint256 minPrice,
        uint biddingTime
    ) public payable {
        require(minPrice>=0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
        uint auctionEndTime = block.timestamp + biddingTime;

        idToBidItem[itemId] = BidItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            minPrice,
            auctionEndTime,
            payable(address(0)),
            minPrice,
            false,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender,address(this),tokenId);

        emit BidItemCreated(itemId, nftContract, tokenId, msg.sender, address(0), minPrice,auctionEndTime,payable(address(0)),minPrice,false,false);


    }


    function bid(uint256 itemId) public payable entrancyGuard{

        // Revert the call if the bidding
        // period is over.
        require(
            block.timestamp <= idToBidItem[itemId].auctionEndTime,
            "Auction already ended."
        );

        // If the bid is not higher, send the
        // money back.
        require(
            msg.value > idToBidItem[itemId].highestBid,
            "There already is a higher bid."
        );

        if (idToBidItem[itemId].highestBid != 0) {
            pendingReturns[idToBidItem[itemId].highestBidder] += idToBidItem[itemId].highestBid;
        }
        idToBidItem[itemId].highestBidder = msg.sender;
        idToBidItem[itemId].highestBid = msg.value;
        emit HighestBidIncreased(itemId,msg.sender, msg.value);
    }


    function withdraw() public entrancyGuard returns (bool) {
        uint amount = pendingReturns[msg.sender];
        if (amount > 0) {
 
            pendingReturns[msg.sender] = 0;

            if (!payable(msg.sender).send(amount)) {
                // No need to call throw here, just reset the amount owing
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

}
