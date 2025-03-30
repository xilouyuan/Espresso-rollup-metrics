/**
 * 区块链配置文件
 * 集中管理所有区块链相关的配置信息
 */

// 区块链链接信息接口
export interface ChainConfig {
  id: string;         // 链ID
  name: string;       // 显示名称
  rpcUrl: string;     // RPC节点URL
  explorerUrl: string; // 区块浏览器URL
  tokenSymbol: string; // 代币符号
  active: boolean;    // 是否活跃
  iconUrl?: string;   // 可选的图标URL
  chainId?: number;   // 链ID(数字)
  isTestnet: boolean; // 是否是测试网
}

// 默认区块链配置
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  // 主网
  'ethereum': {
    id: 'ethereum',
    name: 'Ethereum',
    rpcUrl: 'https://ethereum.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 1,
    isTestnet: false
  },
  'arbitrum': {
    id: 'arbitrum',
    name: 'Arbitrum',
    rpcUrl: 'https://arbitrum-one.publicnode.com',
    explorerUrl: 'https://arbiscan.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 42161,
    isTestnet: false
  },
  'optimism': {
    id: 'optimism',
    name: 'Optimism',
    rpcUrl: 'https://optimism.publicnode.com',
    explorerUrl: 'https://optimistic.etherscan.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 10,
    isTestnet: false
  },
  'base': {
    id: 'base',
    name: 'Base',
    rpcUrl: 'https://base.publicnode.com',
    explorerUrl: 'https://basescan.org',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 8453,
    isTestnet: false
  },
  'polygon': {
    id: 'polygon',
    name: 'Polygon',
    rpcUrl: 'https://polygon-bor.publicnode.com',
    explorerUrl: 'https://polygonscan.com',
    tokenSymbol: 'MATIC',
    active: true,
    chainId: 137,
    isTestnet: false
  },
  'zksync': {
    id: 'zksync',
    name: 'zkSync Era',
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 324,
    isTestnet: false
  },
  'linea': {
    id: 'linea',
    name: 'Linea',
    rpcUrl: 'https://linea.blockpi.network/v1/rpc/public',
    explorerUrl: 'https://lineascan.build',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 59144,
    isTestnet: false
  },
  'scroll': {
    id: 'scroll',
    name: 'Scroll',
    rpcUrl: 'https://rpc.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 534352,
    isTestnet: false
  },
  
  // 测试网
  'sepolia': {
    id: 'sepolia',
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 11155111,
    isTestnet: true
  },
  'mumbai': {
    id: 'mumbai',
    name: 'Mumbai',
    rpcUrl: 'https://polygon-mumbai-bor.publicnode.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    tokenSymbol: 'MATIC',
    active: true,
    chainId: 80001,
    isTestnet: true
  },
  'arbitrum-goerli': {
    id: 'arbitrum-goerli',
    name: 'Arbitrum Goerli',
    rpcUrl: 'https://arbitrum-goerli.publicnode.com',
    explorerUrl: 'https://goerli.arbiscan.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 421613,
    isTestnet: true
  },
  'optimism-goerli': {
    id: 'optimism-goerli',
    name: 'Optimism Goerli',
    rpcUrl: 'https://optimism-goerli.publicnode.com',
    explorerUrl: 'https://goerli-optimism.etherscan.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 420,
    isTestnet: true
  },
  'base-goerli': {
    id: 'base-goerli',
    name: 'Base Goerli',
    rpcUrl: 'https://base-goerli.publicnode.com',
    explorerUrl: 'https://goerli.basescan.org',
    tokenSymbol: 'ETH',
    active: false,
    chainId: 84531,
    isTestnet: true
  }
};

// 获取所有支持的链ID列表
export const getAllChainIds = (): string[] => {
  return Object.keys(CHAIN_CONFIGS);
};

// 获取所有主网链配置
export const getMainnets = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => !chain.isTestnet);
};

// 获取所有测试网链配置
export const getTestnets = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.isTestnet);
};

// 获取所有活跃链的配置
export const getActiveChains = (): ChainConfig[] => {
  return Object.values(CHAIN_CONFIGS).filter(chain => chain.active);
};

// 获取单个链的配置，如果不存在返回undefined
export const getChainConfig = (chainId: string): ChainConfig | undefined => {
  return CHAIN_CONFIGS[chainId];
};

// 获取RPC URL
export const getRpcUrl = (chainId: string): string => {
  return CHAIN_CONFIGS[chainId]?.rpcUrl || '';
};

// 获取浏览器URL
export const getExplorerUrl = (chainId: string): string => {
  return CHAIN_CONFIGS[chainId]?.explorerUrl || '';
};

// 获取代币符号
export const getTokenSymbol = (chainId: string): string => {
  return CHAIN_CONFIGS[chainId]?.tokenSymbol || 'ETH';
};

// 添加新的链配置
export const addChainConfig = (config: ChainConfig): void => {
  if (!config.id) {
    throw new Error('Chain ID is required');
  }
  
  CHAIN_CONFIGS[config.id] = config;
}; 