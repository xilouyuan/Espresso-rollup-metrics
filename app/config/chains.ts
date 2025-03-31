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

// 默认区块链配置 - 只保留主网
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'espresso-rollup': {
    id: 'espresso-rollup',
    name: 'Espresso Rollup',
    rpcUrl: 'http://43.133.35.225:8547',
    explorerUrl: '',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 77777,
    isTestnet: false
  },
  'arbitrum': {
    id: 'arbitrum',
    name: 'Arbitrum',
    rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/9aa3e0c1b5f74215ac48fd2fde07d5ea',
    explorerUrl: 'https://arbiscan.io',
    tokenSymbol: 'ETH',
    active: true,
    chainId: 42161,
    isTestnet: false
  },
  // 'optimism': {
  //   id: 'optimism',
  //   name: 'Optimism',
  //   rpcUrl: 'https://optimism-mainnet.infura.io/v3/eb2453eac5754c27aca1e4c97c0bb204',
  //   explorerUrl: 'https://optimistic.etherscan.io',
  //   tokenSymbol: 'ETH',
  //   active: true,
  //   chainId: 10,
  //   isTestnet: false
  // },
  // 'base': {
  //   id: 'base',
  //   name: 'Base',
  //   rpcUrl: 'https://base-mainnet.infura.io/v3/eb2453eac5754c27aca1e4c97c0bb204',
  //   explorerUrl: 'https://basescan.org',
  //   tokenSymbol: 'ETH',
  //   active: true,
  //   chainId: 8453,
  //   isTestnet: false
  // },
  // 'zksync': {
  //   id: 'zksync',
  //   name: 'zkSync Era',
  //   rpcUrl: 'https://zksync-mainnet.infura.io/v3/eb2453eac5754c27aca1e4c97c0bb204',
  //   explorerUrl: 'https://explorer.zksync.io',
  //   tokenSymbol: 'ETH',
  //   active: true,
  //   chainId: 324,
  //   isTestnet: false
  // }
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
  
  if (!config.name) {
    throw new Error('Chain name is required');
  }
  
  if (!config.rpcUrl) {
    throw new Error('RPC URL is required');
  }
  
  // 确保链ID是唯一的
  if (CHAIN_CONFIGS[config.id]) {
    throw new Error(`Chain with ID ${config.id} already exists`);
  }
  
  // 设置默认值
  const newConfig: ChainConfig = {
    ...config,
    explorerUrl: config.explorerUrl || '',
    tokenSymbol: config.tokenSymbol || 'ETH',
    active: config.active !== undefined ? config.active : true,
    isTestnet: config.isTestnet !== undefined ? config.isTestnet : false
  };
  
  CHAIN_CONFIGS[config.id] = newConfig;
}; 