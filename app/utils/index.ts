/**
 * 区块链测试网工具类
 */

// 导入需要的库
import { ethers } from 'ethers';
import { 
  getRpcUrl, 
  getExplorerUrl as getConfigExplorerUrl, 
  getTokenSymbol 
} from '../config/chains';

// 区块链数据接口
export interface BlockchainData {
  transactions: number;
  contractCreations: number;
  activeUsers: number;
  gasUsed: number;
}

/**
 * 获取区块链数据
 * @param chainId 链ID
 * @param timeInterval 时间间隔(毫秒)
 * @returns 区块链数据
 */
export const fetchBlockchainData = async (
  chainId: string,
  timeInterval: number = 24 * 60 * 60 * 1000 // 默认为24小时
): Promise<BlockchainData> => {
  try {
    // 获取RPC URL
    const rpcUrl = getRpcUrl(chainId);
    if (!rpcUrl) {
      throw new Error(`No RPC URL available for chain: ${chainId}`);
    }
    
    // 创建provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // 获取当前区块
    const latestBlock = await provider.getBlock('latest');
    if (!latestBlock) {
      throw new Error('Failed to fetch latest block');
    }
    
    // 计算起始区块时间
    const startTime = Date.now() - timeInterval;
    
    // 初始化数据
    let transactions = 0;
    let contractCreations = 0;
    const uniqueAddresses = new Set<string>();
    let totalGasUsed = 0;
    
    // 开始遍历区块
    let currentBlockNumber = latestBlock.number;
    let currentBlock = latestBlock;
    
    while (currentBlock && currentBlock.timestamp * 1000 > startTime && currentBlockNumber > 0) {
      // 获取区块交易数
      transactions += currentBlock.transactions.length;
      
      // 逐个处理交易
      for (const txHash of currentBlock.transactions) {
        const tx = await provider.getTransaction(txHash);
        if (tx) {
          // 记录发送方地址
          if (tx.from) {
            uniqueAddresses.add(tx.from.toLowerCase());
          }
          
          // 记录接收方地址
          if (tx.to) {
            uniqueAddresses.add(tx.to.toLowerCase());
          } else {
            // 没有接收方地址的交易通常是合约创建
            contractCreations++;
          }
        }
        
        // 获取交易回执以获取gas使用量
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.gasUsed) {
          totalGasUsed += Number(receipt.gasUsed);
        }
      }
      
      // 获取前一个区块
      currentBlockNumber--;
      const nextBlock = await provider.getBlock(currentBlockNumber);
      if (nextBlock === null) break;
      currentBlock = nextBlock;
    }
    
    // 返回结果
    return {
      transactions,
      contractCreations,
      activeUsers: uniqueAddresses.size,
      gasUsed: totalGasUsed
    };
  } catch (error) {
    console.error('Error fetching blockchain data:', error);
    // 返回默认值
    return {
      transactions: 0,
      contractCreations: 0,
      activeUsers: 0,
      gasUsed: 0
    };
  }
};

/**
 * 格式化交易数量
 * @param value 原始交易数量
 * @returns 格式化后的交易数量字符串
 */
export const formatTransactionCount = (value: number): string => {
  return value.toLocaleString();
};

/**
 * 格式化 Gas 消耗
 * @param value 原始 Gas 消耗量（以 ETH 为单位）
 * @param chainId 可选的链ID，用于确定代币符号
 * @returns 格式化后的 Gas 消耗字符串
 */
export const formatGasUsed = (value: number, chainId?: string): string => {
  const symbol = chainId ? getTokenSymbol(chainId) : 'ETH';
  return `${value.toFixed(2)} ${symbol}`;
};

/**
 * 格式化 TPS (每秒交易量)
 * @param value 原始 TPS 值
 * @returns 格式化后的 TPS 字符串
 */
export const formatTPS = (value: number): string => {
  return value.toFixed(1);
};

/**
 * 格式化用户数量
 * @param value 原始用户数量
 * @returns 格式化后的用户数量字符串
 */
export const formatUserCount = (value: number): string => {
  return value.toLocaleString();
};

/**
 * 获取测试网的浏览器链接
 * @param chainId 测试网ID
 * @returns 区块浏览器URL
 */
export const getExplorerUrl = (chainId: string): string => {
  return getConfigExplorerUrl(chainId);
};

/**
 * 获取测试网的代币符号
 * @param chainId 测试网ID
 * @returns 代币符号
 */
export const getChainTokenSymbol = (chainId: string): string => {
  const symbols: Record<string, string> = {
    'sepolia': 'ETH',
    'mumbai': 'MATIC',
    'arbitrum-goerli': 'ETH',
    'optimism-goerli': 'ETH',
    'base-goerli': 'ETH'
  };
  
  return symbols[chainId] || 'ETH';
};

/**
 * 检查链是否在线活跃
 * @param lastBlockTime 最后区块时间戳（毫秒）
 * @returns 是否活跃
 */
export const isChainActive = (lastBlockTime: number): boolean => {
  // 如果最后区块时间在3分钟内，认为是活跃的
  const threeMinutesAgo = Date.now() - 3 * 60 * 1000;
  return lastBlockTime > threeMinutesAgo;
};

/**
 * 批量获取多个链的区块链数据
 * @param chainIds 链ID数组
 * @param timeInterval 时间间隔(毫秒)
 * @returns 每个链对应的区块链数据
 */
export const fetchMultipleChainData = async (
  chainIds: string[],
  timeInterval: number = 24 * 60 * 60 * 1000
): Promise<Record<string, BlockchainData>> => {
  const results: Record<string, BlockchainData> = {};
  
  // 创建所有链的请求数组
  const promises = chainIds.map(async (chainId) => {
    try {
      const data = await fetchBlockchainData(chainId, timeInterval);
      results[chainId] = data;
    } catch (error) {
      console.error(`Error fetching data for chain ${chainId}:`, error);
      // 设置默认值
      results[chainId] = {
        transactions: 0,
        contractCreations: 0,
        activeUsers: 0,
        gasUsed: 0
      };
    }
  });
  
  // 等待所有请求完成
  await Promise.all(promises);
  
  return results;
}; 