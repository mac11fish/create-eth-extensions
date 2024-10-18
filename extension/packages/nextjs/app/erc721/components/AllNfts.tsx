"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export interface Collectible {
  id: number;
  uri: string;
  owner: string;
  image: string;
  name: string;
}

export const AllNfts = () => {
  const [myNfts, setMyNfts] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: se2NftContract } = useScaffoldContract({
    contractName: "SE2NFT",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "SE2NFT",
    functionName: "totalSupply",
    watch: true,
  });

  useEffect(() => {
    const updateMyNfts = async (): Promise<void> => {
      if (totalSupply === undefined || se2NftContract === undefined) return;

      setLoading(true);
      const collectibleUpdate: Collectible[] = [];
      const totalBalance = parseInt(totalSupply.toString());
      for (let tokenIndex = 0; tokenIndex < totalBalance; tokenIndex++) {
        try {
          const tokenId = await se2NftContract.read.tokenByIndex([BigInt(tokenIndex)]);

          const tokenURI = await se2NftContract.read.tokenURI([tokenId]);
          const owner = await se2NftContract.read.ownerOf([tokenId]);

          const tokenMetadata = await fetch(tokenURI);
          const metadata = await tokenMetadata.json();

          collectibleUpdate.push({
            id: parseInt(tokenId.toString()),
            uri: tokenURI,
            owner,
            image: metadata.image,
            name: metadata.name,
          });
        } catch (e) {
          notification.error("Error fetching your NTFs");
          setLoading(false);
          console.log(e);
        }
      }
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setMyNfts(collectibleUpdate);
      setLoading(false);
    };

    updateMyNfts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSupply]);

  if (loading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
        <p className="y-2 mr-2 font-bold text-2xl">Total Supply:</p>
        <p className="text-xl">{totalSupply ? totalSupply.toString() : 0} tokens</p>
      </div>
      {myNfts.length > 0 && (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {myNfts.map(item => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}
    </>
  );
};