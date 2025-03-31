import { isChainActive, getExplorerUrl } from '../../utils';

// Mock the chains config
jest.mock('../../config/chains', () => ({
  getExplorerUrl: (chainId: string) => {
    const explorers: Record<string, string> = {
      'sepolia': 'https://sepolia.etherscan.io',
      'mumbai': 'https://mumbai.polygonscan.com',
      'arbitrum-goerli': 'https://goerli.arbiscan.io',
    };
    return explorers[chainId] || '';
  }
}));

describe('Status Utility Functions', () => {
  describe('isChainActive', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2023, 0, 1, 12, 0, 0)); // Jan 1, 2023, 12:00:00
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns true if the last block is within the threshold', () => {
      // Current time is mocked to 12:00:00, and the threshold is 3 minutes
      // So any timestamp after 11:57:00 should be active
      const activeTime = new Date(2023, 0, 1, 11, 58, 0).getTime(); // 11:58:00
      expect(isChainActive(activeTime)).toBe(true);
    });

    it('returns false if the last block is older than the threshold', () => {
      const inactiveTime = new Date(2023, 0, 1, 11, 56, 0).getTime(); // 11:56:00
      expect(isChainActive(inactiveTime)).toBe(false);
    });
  });

  describe('getExplorerUrl', () => {
    it('returns the correct explorer URL for known chains', () => {
      expect(getExplorerUrl('sepolia')).toBe('https://sepolia.etherscan.io');
      expect(getExplorerUrl('mumbai')).toBe('https://mumbai.polygonscan.com');
      expect(getExplorerUrl('arbitrum-goerli')).toBe('https://goerli.arbiscan.io');
    });

    it('returns empty string for unknown chains', () => {
      expect(getExplorerUrl('unknown-chain')).toBe('');
    });
  });
}); 