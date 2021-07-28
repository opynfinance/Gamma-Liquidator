import { BigNumber } from "ethers";

export interface ILatestRoundData {
  [chainlinkPriceFeedContractAddress: string]: IRoundData;
}

export interface IRoundData {
  answer: BigNumber;
  roundId: BigNumber;
  updatedAt: BigNumber;
}
