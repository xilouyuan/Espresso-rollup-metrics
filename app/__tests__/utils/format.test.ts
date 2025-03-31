import {
  formatTransactionCount,
  formatGasUsed,
  formatTPS,
  formatUserCount,
  getChainTokenSymbol
} from '../../utils';

// Mock the chains config
jest.mock('../../config/chains', () => ({
  getTokenSymbol: (chainId: string) => {
    if (chainId === 'mumbai') return 'MATIC';
    return 'ETH';
  }
}));

describe('Format Utility Functions', () => {
  describe('formatTransactionCount', () => {
    it('formats transaction counts with commas', () => {
      expect(formatTransactionCount(1000)).toBe('1,000');
      expect(formatTransactionCount(1000000)).toBe('1,000,000');
      expect(formatTransactionCount(0)).toBe('0');
    });
  });

  describe('formatGasUsed', () => {
    it('formats gas used with token symbol', () => {
      expect(formatGasUsed(1.2345, 'sepolia')).toBe('1.23 ETH');
      expect(formatGasUsed(0.009, 'mumbai')).toBe('0.01 MATIC');
      expect(formatGasUsed(100, 'arbitrum')).toBe('100.00 ETH');
    });

    it('uses ETH as default token symbol', () => {
      expect(formatGasUsed(1.2345)).toBe('1.23 ETH');
    });
  });

  describe('formatTPS', () => {
    it('formats TPS with one decimal place', () => {
      expect(formatTPS(1.2345)).toBe('1.2');
      expect(formatTPS(0.09)).toBe('0.1');
      expect(formatTPS(100)).toBe('100.0');
    });
  });

  describe('formatUserCount', () => {
    it('formats user counts with commas', () => {
      expect(formatUserCount(1000)).toBe('1,000');
      expect(formatUserCount(1000000)).toBe('1,000,000');
      expect(formatUserCount(0)).toBe('0');
    });
  });

  describe('getChainTokenSymbol', () => {
    it('returns the correct token symbol for known chains', () => {
      expect(getChainTokenSymbol('sepolia')).toBe('ETH');
      expect(getChainTokenSymbol('mumbai')).toBe('MATIC');
      expect(getChainTokenSymbol('arbitrum-goerli')).toBe('ETH');
    });

    it('returns ETH as default token symbol for unknown chains', () => {
      expect(getChainTokenSymbol('unknown-chain')).toBe('ETH');
    });
  });
}); 