const { time } = require('@openzeppelin/test-helpers');
const { expect,assert} = require("chai");
const ether = require("@openzeppelin/test-helpers/src/ether");
const DAY = 86400;

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

})
