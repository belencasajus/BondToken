import { ethers } from 'ethers';
import BondTokenArtifact from '../abi/BondToken';

export const BOND_ABI = BondTokenArtifact.abi;
export const BOND_BYTECODE = BondTokenArtifact.bytecode;

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("MetaMask no está disponible");
  }
  return new ethers.providers.Web3Provider(window.ethereum);
};

export const getSigner = () => {
  const provider = getProvider();
  return provider.getSigner();
};

export const formatEther = ethers.utils.formatEther;
export const parseEther = ethers.utils.parseEther;
export const parseUnits = ethers.utils.parseUnits;
export const BigNumber = ethers.BigNumber;

export const shortenAddress = (address: string, chars = 4) => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
};