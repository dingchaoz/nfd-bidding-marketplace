// SPDX-License-Identfier: MIT
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

    // counter of reentrancy
    Counters.Counter private _entrancyCount;

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

    // a struct to store pending return of each address for an nft item
    struct PendingReturnStruct {
      uint itemId;
      mapping(address => uint) pendingReturns;
    }

    // a mapping from ntf item id to its pending return for each bidder
    mapping(uint256 => PendingReturnStruct) private idToPendingReturn;

    // a mapping from ntf item id to its details struct
    mapping(uint256 => BidItem) private idToBidItem;


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

     /* ========== MODIFIER ========== */

      modifier nonReentrant() {
        _entrancyCount.increment();
        uint256 guard = _entrancyCount.current();
        _;
        require(guard == _entrancyCount.current(), "Reentrancy is not allowed"); 
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


    function bid(uint256 itemId) public payable nonReentrant {

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

            PendingReturnStruct storage p = idToPendingReturn[itemId];
            p.pendingReturns[msg.sender] += msg.value;
        }
        idToBidItem[itemId].highestBidder = msg.sender;
        idToBidItem[itemId].highestBid = msg.value;
        emit HighestBidIncreased(itemId,msg.sender, msg.value);
    }


    function withdraw(uint256 itemId) public nonReentrant returns (bool){
        require(msg.sender != idToBidItem[itemId].highestBidder,"You are the highest bidder, can't withdraw");
        PendingReturnStruct storage p = idToPendingReturn[itemId];
        uint amount = p.pendingReturns[msg.sender];
        if (amount > 0) {
 
            p.pendingReturns[msg.sender] = 0;

            if (!payable(msg.sender).send(amount)) {
                // No need to call throw here, just reset the amount owing
                p.pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    function auctionEnd(
        address nftContract,
        uint256 itemId
    ) public payable nonReentrant{
        // 1. Conditions
        require(block.timestamp >= idToBidItem[itemId].auctionEndTime, "Auction not yet ended.");
        require(!idToBidItem[itemId].ended, "auctionEnd has already been called.");

        // 2. Effects
        uint tokenId = idToBidItem[itemId].tokenId;
        idToBidItem[itemId].ended = true;
        // set item to be sold
        idToBidItem[itemId].sold = true;
        // update the load mapping owner to the highest bidder
        idToBidItem[itemId].owner = payable(idToBidItem[itemId].highestBidder);
        // increment item sold by 1
        _itemSold.increment();

        emit AuctionEnded(itemId,idToBidItem[itemId].highestBidder, idToBidItem[itemId].highestBid);

        // 3. Interactions
        // transfer the highest bid to the seller of the nft
        idToBidItem[itemId].seller.transfer(idToBidItem[itemId].highestBid);
        // transfer the ownership of the nft to the highest bidder
        IERC721(nftContract).transferFrom(address(this),idToBidItem[itemId].highestBidder,tokenId);
        // pay the onwer of the marketplace contract the listigPrice (commission)
        payable(owner).transfer(listingPrice);

    }

  function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

  /* Returns all unsold market items */
  function fetchBidItems() public view returns (BidItem[] memory) {
    uint itemCount = _itemIds.current();
    uint unsoldItemCount = _itemIds.current() - _itemSold.current();
    uint currentIndex = 0;

    BidItem[] memory items = new BidItem[](unsoldItemCount);
    for (uint i = 0; i < itemCount; i++) {
      if (idToBidItem[i + 1].owner == address(0)) {
        uint currentId = i + 1;
        BidItem storage currentItem = idToBidItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  /* Returns onlyl items that a user has purchased */
  function fetchMyNFTs() public view returns (BidItem[] memory) {
    uint totalItemCount = _itemIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      if (idToBidItem[i + 1].owner == msg.sender) {
        itemCount += 1;
      }
    }

    BidItem[] memory items = new BidItem[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      if (idToBidItem[i + 1].owner == msg.sender) {
        uint currentId = i + 1;
        BidItem storage currentItem = idToBidItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

  /* Returns only items a user has created */
  function fetchItemsCreated() public view returns (BidItem[] memory) {
    uint totalItemCount = _itemIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      if (idToBidItem[i + 1].seller == msg.sender) {
        itemCount += 1;
      }
    }

    BidItem[] memory items = new BidItem[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      if (idToBidItem[i + 1].seller == msg.sender) {
        uint currentId = i + 1;
        BidItem storage currentItem = idToBidItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    return items;
  }

}
