## Getting Started

1. Clone the repo and install dependencies:

```bash
yarn install

```
2. Test contracts:
```bash
npx hardhat test

```
3. Start hardhat local development network:

```bash
npx hardhat node

```
4. Deploy contracts to local development network:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
5. Run the development server:

```bash
npm run dev

```
6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the marketplace website, import one of the private keys from hardhat local dev account into metamask

7. Now you are able to creat NFT and put them for bidding!

## Operations Demo
1. Create NFT
- ![](./images/create-nft-demo.gif)

2. Bid NFT
- ![](./images/bid-on-NFT.gif)

## Design Considerations
1. Reentrancy Attack prevention
    - 1.1 Favor pull over push
    It is better to let users withdraw funds rather than push funds to them automatically, it minimized the damage cauased by external calls into untrusted contracts, reduces the chance of problems with gas limit vs pushing payments to contracts, these contracts can themselves call other/ call back the contract that called them, or any other in the call stack, in any of the case, reentracy occured.
    Therefore sending back the money to previous highest bidder by simply using highestBidder.send(highestBid) is a security risk, a withdraw() function is created to let the recipients withdraw their money themselves.
    - 1.2 check-effects-interaction
    Checks Effects pattern is used to reduce the attack surface for malicious contracts trying to hijack control flow after an external call in the smart contracts. One example is AuctionEnded function:
    ```solidity
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

    ```

    - 1.3 reentrancy guard
    A different implemation of nonRenentrant modifier than the current version of Openzepplin is create in the contracts, it worked in the following way:
       - 1.3.1 A private counter is incremented when contract is entered 
       - 1.3.2 A copy of the value of counter is created
       - 1.3.3 Control is returned 
       - 1.3.4 If reentrancy occured, the counter would be incremented
       - 1.3.5 Check is made to ensure the copy of the counter value still equals the counter, otherwise it reverts

       ```solidity
        modifier nonReentrant() {
        _entrancyCount.increment();
        uint256 guard = _entrancyCount.current();
        _;
        require(guard == _entrancyCount.current(), "Reentrancy is not allowed"); 
        }

       ```

2. Overflow/Underflow handling

   "Checked Arithmetic" feature is introduced in Solidity 0.8.0 that by default, all arithmetic operations will perform overflow and underflow check, otherwise it will revert

3. ERC721URIStorage

    ERC721URIStorage contract is used since it is a standard implementation of ERC721 that includes all standard extensions, and particulary in our contracts, the _setTokenURI method coming from ERC721URIStorage to store an item’s metadata.


4. Storing a mapping inside a struct
   
   PendingReturnStruct is a struct containing a mapping of account address to pending bid return amount. This struct needs to be constructed with care that, since such struct containing mapping can only be used in storage in Solidity.



