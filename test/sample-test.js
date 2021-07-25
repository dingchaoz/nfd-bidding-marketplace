const { expect,assert} = require("chai");
const ether = require("@openzeppelin/test-helpers/src/ether");


describe("Marketplace contract", function() {

  let Market;
  let market;
  let marketAddress;
  let NFT;
  let nft;
  let creator;
  let addr1;
  let addr2;
  let addr3;
  let provider;

  this.beforeEach(async function () {
    Market = await ethers.getContractFactory("NFTMarket")
    market = await Market.deploy()
    await market.deployed()
    marketAddress = market.address

    NFT = await ethers.getContractFactory("NFT")
    nft = await NFT.deploy(marketAddress)
    await nft.deployed();
    [creator, addr1, addr2, addr3] = await ethers.getSigners()
    provider = ethers.provider

  });

  describe("Deployment", function () {

    it("Should has the right name and symbol", async function () {
      expect(await nft.name()).to.equal("NFT Market");
      expect(await nft.symbol()).to.equal("NMART");
    });

  });

  describe("Bidding", function(){

    it("Should be able to bid", async function() {
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()
    let nftContractAddress = nft.address
    let minPrice = ethers.utils.parseUnits('1', 'ether')
    let auctionPrice = ethers.utils.parseUnits('10', 'ether')
    await nft.createToken("https://www.mytokenlocation.com")
    await market.createBidItem(nftContractAddress, 1, minPrice, 10,{value: listingPrice })
    await market.connect(addr1).bid(1, { value: auctionPrice})
  
    });
    it("Bid failure due to insufficent amount", async function() {
      let listingPrice = await market.getListingPrice()
      listingPrice = listingPrice.toString()
      let nftContractAddress = nft.address
      let minPrice = ethers.utils.parseUnits('100', 'ether')
      let auctionPrice = ethers.utils.parseUnits('10', 'ether')
      await nft.createToken("https://www.mytokenlocation.com")
      await market.createBidItem(nftContractAddress, 1, minPrice, 10,{value: listingPrice })
      await expect(
        market.connect(addr1).bid(1, { value: auctionPrice})
      ).to.be.revertedWith("There already is a higher bid");
      });
    it("Bid failure due to bid expiration", async function() {
        let listingPrice = await market.getListingPrice()
        listingPrice = listingPrice.toString()
        let nftContractAddress = nft.address
        let minPrice = ethers.utils.parseUnits('1', 'ether')
        let auctionPrice = ethers.utils.parseUnits('10', 'ether')
        await nft.createToken("https://www.mytokenlocation.com")
        await market.createBidItem(nftContractAddress, 1, minPrice, 1,{value: listingPrice })
        await network.provider.send("evm_increaseTime", [3600])
        await expect(
          market.connect(addr1).bid(1, { value: auctionPrice})
        ).to.be.revertedWith("Auction already ended");
        })

  });

  describe("Withdraw bid", function(){

    it("Should be able to withdraw if bid is overbid by others", async function() {
    let listingPrice = await market.getListingPrice()
    listingPrice = ethers.BigNumber.from(listingPrice.toString())

    incrementalBid= ethers.BigNumber.from("1000000000000000000");
    console.log(ethers.utils.formatUnits(incrementalBid.add(listingPrice),18))

  
    let nftContractAddress = nft.address
    let minPrice = ethers.utils.parseUnits('1', 'ether')
    let auctionPrice = ethers.utils.parseUnits('10', 'ether')
    let higherAuctionPrice = ethers.utils.parseUnits('20', 'ether')

    await nft.createToken("https://www.mytokenlocation.com")
    await market.createBidItem(nftContractAddress, 1, minPrice, 10000,{value: listingPrice })
    await market.connect(addr3).bid(1, { value: auctionPrice})
    await market.connect(addr2).bid(1, { value: higherAuctionPrice})
    prev_balance = await (provider.getBalance(addr3.address))
    await market.connect(addr3).withdraw(1)
    new_balance = await provider.getBalance(addr3.address)
    new_balance = ethers.utils.formatEther(new_balance)
    prev_balance = ethers.utils.formatEther(prev_balance)
    expect(ethers.utils.parseUnits(new_balance,"ether")).to.be.above(ethers.utils.parseUnits(prev_balance,"ether"))
    });

    it("Should be not able to withdraw if bid isn't overbid by others", async function() {
      let listingPrice = await market.getListingPrice()
      listingPrice = ethers.BigNumber.from(listingPrice.toString())
  
      incrementalBid= ethers.BigNumber.from("1000000000000000000");
      console.log(ethers.utils.formatUnits(incrementalBid.add(listingPrice),18))
  
    
      let nftContractAddress = nft.address
      let minPrice = ethers.utils.parseUnits('1', 'ether')
      let auctionPrice = ethers.utils.parseUnits('10', 'ether')
      let higherAuctionPrice = ethers.utils.parseUnits('20', 'ether')
  
      await nft.createToken("https://www.mytokenlocation.com")
      await market.createBidItem(nftContractAddress, 1, minPrice, 10000,{value: listingPrice })
      await market.connect(addr3).bid(1, { value: auctionPrice})
      await market.connect(addr2).bid(1, { value: higherAuctionPrice})
      await expect(
         market.connect(addr2).withdraw(1)
      ).to.be.revertedWith("You are the highest bidder, can't withdraw");
      });

  });

  describe("Fetch market items", function(){

    it("Should be able to get all unsold items", async function() {
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()
    let nftContractAddress = nft.address
    let minPrice = ethers.utils.parseUnits('1', 'ether')
    let auctionPrice = ethers.utils.parseUnits('10', 'ether')
    let higherAuctionPrice = ethers.utils.parseUnits('20', 'ether')

    await nft.createToken("https://www.mytokenlocation.com")
    await market.createBidItem(nftContractAddress, 1, minPrice, 10000,{value: listingPrice })
    await nft.createToken("https://www.mytokenlocation2.com")
    await market.createBidItem(nftContractAddress, 2, minPrice, 10000,{value: listingPrice })
    await market.connect(addr3).bid(1, { value: auctionPrice})
    await market.connect(addr2).bid(1, { value: higherAuctionPrice})

    items = await market.fetchBidItems()
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId)
      let item = {
        price: i.minPrice.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item
    }))
    console.log('items: ', items)
    
    });

  });

  describe("Close Auction", function(){

    it("Should transfer ownership to highest bidder", async function() {
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()
    let nftContractAddress = nft.address
    let minPrice = ethers.utils.parseUnits('1', 'ether')
    let auctionPrice = ethers.utils.parseUnits('10', 'ether')
    let higherAuctionPrice = ethers.utils.parseUnits('20', 'ether')

    await nft.createToken("https://www.mytokenlocation.com")
    await market.createBidItem(nftContractAddress, 1, minPrice, 10000,{value: listingPrice })
    await market.connect(addr3).bid(1, { value: auctionPrice})
    await market.connect(addr2).bid(1, { value: higherAuctionPrice})
    await network.provider.send("evm_increaseTime", [10000])
    await market.connect(creator).auctionEnd(nftContractAddress,1)
    const tokenOwner = await nft.ownerOf(1);
    assert.equal(tokenOwner, addr2.address)
    });

  });

})
