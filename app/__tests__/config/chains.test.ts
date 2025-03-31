import {
  CHAIN_CONFIGS,
  getActiveChains,
  getAllChainIds,
  getMainnets,
  getTestnets,
  getRpcUrl,
  getExplorerUrl,
  getTokenSymbol
} from '../../config/chains';

describe('Blockchain Chain Configuration', () => {
  describe('CHAIN_CONFIGS', () => {
    it('contains mainnet chains configuration', () => {
      expect(CHAIN_CONFIGS).toBeDefined();
      expect(Object.keys(CHAIN_CONFIGS).length).toBeGreaterThan(0);
      
      // Check for key mainnet chains
      expect(CHAIN_CONFIGS['arbitrum']).toBeDefined();
      expect(CHAIN_CONFIGS['optimism']).toBeDefined();
      expect(CHAIN_CONFIGS['base']).toBeDefined();
      expect(CHAIN_CONFIGS['zksync']).toBeDefined();
      expect(CHAIN_CONFIGS['polygon']).toBeDefined();
    });

    it('has correct structure for each chain', () => {
      // Get the first chain to test
      const firstChain = Object.values(CHAIN_CONFIGS)[0];
      
      // Check that it has all required properties
      expect(firstChain).toHaveProperty('id');
      expect(firstChain).toHaveProperty('name');
      expect(firstChain).toHaveProperty('rpcUrl');
      expect(firstChain).toHaveProperty('explorerUrl');
      expect(firstChain).toHaveProperty('tokenSymbol');
      expect(firstChain).toHaveProperty('active');
      expect(firstChain).toHaveProperty('isTestnet');
    });

    it('all chains are marked as mainnet', () => {
      // All chains should have isTestnet=false
      const allChains = Object.values(CHAIN_CONFIGS);
      expect(allChains.every(chain => chain.isTestnet === false)).toBe(true);
    });
  });

  describe('getActiveChains', () => {
    it('returns only active chains', () => {
      const activeChains = getActiveChains();
      
      // All returned chains should have active=true
      expect(activeChains.every(chain => chain.active === true)).toBe(true);
      
      // Should not include any inactive chains
      const inactiveChainIds = Object.values(CHAIN_CONFIGS)
        .filter(chain => !chain.active)
        .map(chain => chain.id);
      
      const activeChainIds = activeChains.map(chain => chain.id);
      
      inactiveChainIds.forEach(id => {
        expect(activeChainIds).not.toContain(id);
      });
    });
  });

  describe('getAllChainIds', () => {
    it('returns all chain IDs', () => {
      const chainIds = getAllChainIds();
      const expectedIds = Object.keys(CHAIN_CONFIGS);
      
      expect(chainIds.length).toEqual(expectedIds.length);
      expectedIds.forEach(id => {
        expect(chainIds).toContain(id);
      });
    });
  });

  describe('getMainnets and getTestnets', () => {
    it('returns all chains for getMainnets', () => {
      const mainnets = getMainnets();
      
      // Should match all chains in CHAIN_CONFIGS
      expect(mainnets.length).toEqual(Object.keys(CHAIN_CONFIGS).length);
      
      // Should include key mainnets
      const mainnetIds = mainnets.map(chain => chain.id);
      expect(mainnetIds).toContain('arbitrum');
      expect(mainnetIds).toContain('optimism');
      expect(mainnetIds).toContain('base');
    });

    it('returns empty array for getTestnets', () => {
      const testnets = getTestnets();
      
      // Should be empty since we only have mainnets
      expect(testnets.length).toEqual(0);
    });
  });

  describe('getRpcUrl', () => {
    it('returns correct RPC URL for known chains', () => {
      expect(getRpcUrl('arbitrum')).toBe(CHAIN_CONFIGS['arbitrum'].rpcUrl);
      expect(getRpcUrl('polygon')).toBe(CHAIN_CONFIGS['polygon'].rpcUrl);
    });

    it('returns empty string for unknown chains', () => {
      expect(getRpcUrl('non-existent-chain')).toBe('');
    });
  });

  describe('getExplorerUrl', () => {
    it('returns correct explorer URL for known chains', () => {
      expect(getExplorerUrl('arbitrum')).toBe(CHAIN_CONFIGS['arbitrum'].explorerUrl);
      expect(getExplorerUrl('polygon')).toBe(CHAIN_CONFIGS['polygon'].explorerUrl);
    });

    it('returns empty string for unknown chains', () => {
      expect(getExplorerUrl('non-existent-chain')).toBe('');
    });
  });

  describe('getTokenSymbol', () => {
    it('returns correct token symbol for known chains', () => {
      expect(getTokenSymbol('arbitrum')).toBe(CHAIN_CONFIGS['arbitrum'].tokenSymbol);
      expect(getTokenSymbol('base')).toBe(CHAIN_CONFIGS['base'].tokenSymbol);
      expect(getTokenSymbol('polygon')).toBe(CHAIN_CONFIGS['polygon'].tokenSymbol);
    });

    it('returns ETH as default for unknown chains', () => {
      expect(getTokenSymbol('non-existent-chain')).toBe('ETH');
    });

    it('returns MATIC for Polygon', () => {
      expect(getTokenSymbol('polygon')).toBe('MATIC');
    });
  });
}); 