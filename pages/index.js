import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from "web3modal"

import {
  nftaddress, nftmarketaddress
} from '../config'

import NFT from '../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

export default function Home() {
  const [nfts, setNfts] = useState([])
  const [formInput, updateFormInput] = useState({ enterNewBid: '' })
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {    
    const provider = new ethers.providers.JsonRpcProvider()
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)
    const data = await marketContract.fetchBidItems()
    
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let currentHighestBid = ethers.utils.formatUnits(i.highestBid.toString(), 'ether')
      let item = {
        currentHighestBid,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }))
    setNfts(items)
    setLoadingState('loaded') 
  }
  async function bidNft(nft) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)


    const newPrice = ethers.utils.parseUnits(formInput.enterNewBid, 'ether')
    const transaction = await contract.bid(nft.tokenId, {
      value: newPrice
    })
    await transaction.wait()
    loadNFTs()
  }
  async function withdrawBid(nft) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    const transaction = await contract.withdraw(nft.tokenId)
    await transaction.wait()
    loadNFTs()
  }
  async function endBid(nft) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer)

    const transaction = await contract.auctionEnd(nftaddress,nft.tokenId)
    await transaction.wait()
    loadNFTs()
  }
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>)
  return (
<div className="flex justify-center">
   <div className="px-4" style={{ maxWidth: '1600px' }}>
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
      {
      nfts.map((nft, i) => (
      <div key={i} className="border shadow rounded-xl overflow-hidden">
         <img src={nft.image} />
         <div className="p-4">
            <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
            <div style={{ height: '70px', overflow: 'hidden' }}>
            <p className="text-gray-400">{nft.description}</p>
         </div>
      </div>
      <div className="flex flex-wrap">
         <h1 className="flex-auto text-xl font-semibold">
            Current Highest Bid
         </h1>
         <div className="text-xl font-semibold text-gray-500">
            {nft.currentHighestBid} ETH
         </div>
         <div className="w-full flex-none text-sm font-medium text-gray-500 mt-2">
            Bidding going on..
         </div>
      </div>
      <input 
         placeholder="Enter new Bid"
         className="w-full text-center bg-white-500 font-bold py-2 px-2 rounded border"
         onChange={e => updateFormInput({ ...formInput, enterNewBid: e.target.value })}
      />
      <div className="flex space-x-3 mb-4 text-sm font-medium">
         <div className="flex-auto flex space-x-3">
            <button className="w-1/2 flex py-3 bg-pink-500 items-center justify-center rounded-md bg-black text-white" onClick={() => bidNft(nft)}>Place new bid</button>
            <button className="w-1/2 flex py-3 bg-blue-400 items-center justify-center rounded-md border text-white border-gray-300" onClick={() => withdrawBid(nft)}>Withdraw bid</button>
            <button className="w-1/2 flex py-3 bg-gray-500 items-center justify-center rounded-md border  text-white border-gray-300" onClick={() => endBid(nft)}>End Auction</button>
         </div>
      </div>
   </div>
   ))
   }
</div>
</div>
</div>
    
  )
}