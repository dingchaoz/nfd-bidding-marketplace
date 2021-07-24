const helper = require("../utils/utils.js")
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

})
