// Import testing-library/jest-dom extensions
import '@testing-library/jest-dom';

// Mock global fetch
global.fetch = jest.fn();

// Mock ethers library
jest.mock('ethers', () => {
  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => {
      return {
        getBlock: jest.fn().mockResolvedValue({
          number: 1000,
          timestamp: Math.floor(Date.now() / 1000),
          transactions: ['0x1', '0x2', '0x3'],
        }),
        getTransaction: jest.fn().mockResolvedValue({
          from: '0xabc',
          to: '0xdef',
          hash: '0x123',
        }),
        getTransactionReceipt: jest.fn().mockResolvedValue({
          gasUsed: 100000,
        }),
      };
    }),
  };
}); 