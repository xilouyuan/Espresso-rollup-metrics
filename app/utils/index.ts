/**
 * 区块链测试网工具类
 */

// 导入需要的库
import { ethers, JsonRpcProvider } from 'ethers';
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

// 定义返回数据的类型
export interface RollupMetrics {
  transactions: number;
  contractCreations: number;
  gasUsed: bigint;
  uniqueAddresses: number;
}

// 输入验证
function validateInputs(rpcUrl: string, blockRange: number): void {
  if (!rpcUrl.startsWith('http')) {
    throw new Error('无效的 RPC URL 格式' + rpcUrl);
  }
  if (!Number.isInteger(blockRange) || blockRange <= 0) {
    throw new Error('区块范围必须为正整数');
  }
}

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 定义错误类型保护
function isRateLimitError(error: unknown): error is { code?: string; message?: string } {
  return (
      typeof error === "object" &&
      error !== null &&
      ("code" in error || "message" in error)
  );
}

// 带重试机制的异步函数
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) { // `error` 现在是 `unknown`
      lastError = error;

      // 只有 `error` 符合我们的预期格式时，才访问 `code` 和 `message`
      if (isRateLimitError(error)) {
        const errorMessage = error.message || "";

        if (error.code === "429" || errorMessage.includes("Too Many Requests")) {
          const waitTime = baseDelay * Math.pow(2, i); // 指数退避
          console.warn(`请求过多，第 ${i + 1} 次重试，等待 ${waitTime}ms`);
          await delay(waitTime);
          continue;
        }
      }

      throw error; // 非速率限制错误直接抛出
    }
  }
  throw lastError; // 达到最大重试次数仍失败
}

// 批量处理区块
async function processBlockBatch(
    provider: JsonRpcProvider,
    blocks: number[],
    metrics: RollupMetrics,
    uniqueAddresses: Set<string>
): Promise<void> {
  const batchPromises = blocks.map(blockNum =>
      withRetry(async () => {
        const block = await provider.getBlock(blockNum, true);
        if (!block || !block.transactions) return;

        for (const txHash of block.transactions as string[]) {
          const tx = await provider.getTransaction(txHash);
          if (!tx) continue;

          metrics.transactions += 1;
          if (!tx.to) metrics.contractCreations += 1;

          const receipt = await provider.getTransactionReceipt(txHash);
          if (receipt) metrics.gasUsed += BigInt(receipt.gasUsed.toString());

          uniqueAddresses.add(tx.from);
          if (tx.to) uniqueAddresses.add(tx.to);
        }
      })
  );
  await Promise.all(batchPromises);
}

/**
 * 获取Rollup的活动指标数据
 */
async function getRollupMetrics(
    rpcUrl: string,
    blockRange: number = 1000,
    batchSize: number = 1  // 减小批量大小以降低请求频率
): Promise<RollupMetrics> {
  validateInputs(rpcUrl, blockRange);

  const provider = new JsonRpcProvider(rpcUrl);
  await withRetry(() => provider.getNetwork(), 3).catch(() => {
    throw new Error(`无法连接到RPC端点: ${rpcUrl}`);
  });

  const metrics: RollupMetrics = {
    transactions: 0,
    contractCreations: 0,
    gasUsed: BigInt(0),
    uniqueAddresses: 0,
  };
  const uniqueAddresses = new Set<string>();

  const latestBlock = await withRetry(() => provider.getBlockNumber());
  const startBlock = Math.max(0, latestBlock - blockRange + 1);

  for (let blockNum = startBlock; blockNum <= latestBlock; blockNum += batchSize) {
    const endBatch = Math.min(blockNum + batchSize - 1, latestBlock);
    const batchBlocks = Array.from(
        { length: endBatch - blockNum + 1 },
        (_, i) => blockNum + i
    );

    console.log(`处理区块 ${blockNum}-${endBatch}/${latestBlock} (${
        ((blockNum - startBlock) / blockRange * 100).toFixed(1)
    }%)`);

    await processBlockBatch(provider, batchBlocks, metrics, uniqueAddresses);
    await delay(500); // 每批次间增加基础延迟
  }

  metrics.uniqueAddresses = uniqueAddresses.size;
  return metrics;
}

/**
 * 根据时间间隔获取指标
 */
export async function getRollupMetricsFromInterval(
    rpc: string,
    interval: string,
    batchSize: number = 1
): Promise<RollupMetrics> {
  const blockRange = parseInterval(interval);
  return getRollupMetrics(rpc, blockRange, batchSize);
}

/**
 * 解析时间间隔
 */
function parseInterval(interval: string): number {
  const match = interval.match(/(\d+)([smhd])/);
  if (!match) throw new Error('无效的时间间隔格式');

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    case 'W': return value * 30 * 86400;
    default: throw new Error('无效的时间单位');
  }
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
    
    // 测试连接
    // await provider.getNetwork().catch(() => {
    //   throw new Error(`无法连接到RPC端点: ${rpcUrl}`);
    // });
    
    // 获取最新区块号
    const latestBlock = await provider.getBlockNumber();
    
    // 计算起始区块号 - 假设每个区块大约15秒，计算需要查询的区块数
    const blockTimeEstimate = 15 * 1000; // 15秒，单位毫秒
    const blocksToFetch = Math.ceil(timeInterval / blockTimeEstimate);
    const startBlock = Math.max(0, latestBlock - blocksToFetch + 1);
    
    // 初始化数据
    let transactions = 0;
    let contractCreations = 0;
    const uniqueAddresses = new Set<string>();
    let totalGasUsed = 0;
    
    // 遍历区块
    for (let blockNum = startBlock; blockNum <= latestBlock; blockNum++) {
      // 获取区块
      const block = await provider.getBlock(blockNum);
      if (!block) {
        console.warn(`区块 ${blockNum} 数据为空，跳过`);
        continue;
      }
      
      // 处理交易
      for (const txHash of block.transactions) {
        // 获取交易
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
          console.warn(`交易 ${txHash} 数据为空，跳过`);
          continue;
        }
        
        // 增加交易计数
        transactions++;
        
        // 处理地址
        if (tx.from) {
          uniqueAddresses.add(tx.from.toLowerCase());
        }
        
        if (tx.to) {
          uniqueAddresses.add(tx.to.toLowerCase());
        } else {
          // 没有接收方地址的交易通常是合约创建
          contractCreations++;
        }
        
        // 获取交易回执以获取gas使用量
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.gasUsed) {
          totalGasUsed += Number(receipt.gasUsed);
        } else {
          console.warn(`交易 ${txHash} 的收据为空，跳过Gas计算`);
        }
      }
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