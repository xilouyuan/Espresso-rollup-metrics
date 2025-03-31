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
  latestBlock: number;  // 添加最新区块高度
}

// 定义返回数据的类型
export interface RollupMetrics {
  transactions: number;
  contractCreations: number;
  gasUsed: bigint;
  uniqueAddresses: number;
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
  provider: ethers.JsonRpcProvider,
  blocks: number[],
  metrics: {
    transactions: number;
    contractCreations: number;
    uniqueAddresses: Set<string>;
    totalGasUsed: bigint;
  }
): Promise<void> {
  const batchPromises = blocks.map(async (blockNum) => {
    try {
      // 获取区块
      const block = await provider.getBlock(blockNum);
      if (!block) {
        console.warn(`区块 ${blockNum} 数据为空，跳过`);
        return;
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
        metrics.transactions++;

        // 处理地址
        if (tx.from) {
          metrics.uniqueAddresses.add(tx.from.toLowerCase());
        }

        if (tx.to) {
          metrics.uniqueAddresses.add(tx.to.toLowerCase());
        } else {
          // 没有接收方地址的交易通常是合约创建
          metrics.contractCreations++;
        }

        // 获取交易回执以获取gas使用量和gas价格
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.gasUsed) {
          // 计算实际消耗的ETH
          const gasUsed = BigInt(receipt.gasUsed.toString());
          const gasPrice = tx.gasPrice ? BigInt(tx.gasPrice.toString()) : BigInt(0);
          const gasCost = gasUsed * gasPrice;
          metrics.totalGasUsed += gasCost;
        } else {
          console.warn(`交易 ${txHash} 的收据为空，跳过Gas计算`);
        }
      }
    } catch (error) {
      console.error(`处理区块 ${blockNum} 时出错:`, error);
    }
  });

  await Promise.all(batchPromises);
}

export const fetchBlockchainData = async (
    chainId: string,
    blockRange: number = 1000
): Promise<BlockchainData> => {
  try {
    const rpcUrl = getRpcUrl(chainId);
    if (!rpcUrl) {
      throw new Error(`No RPC URL available for chain: ${chainId}`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    await provider.getNetwork().catch(() => {
      throw new Error(`无法连接到RPC端点: ${rpcUrl}`);
    });

    // 使用 `withRetry` 获取最新区块号，避免 RPC 失败
    const latestBlock = await withRetry(() => provider.getBlockNumber());
    const startBlock = Math.max(0, latestBlock - blockRange + 1);

    const metrics = {
      transactions: 0,
      contractCreations: 0,
      uniqueAddresses: new Set<string>(),
      totalGasUsed: BigInt(0)
    };

    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES = 500;

    for (let blockNum = startBlock; blockNum <= latestBlock; blockNum += BATCH_SIZE) {
      const endBatch = Math.min(blockNum + BATCH_SIZE - 1, latestBlock);
      const batchBlocks = Array.from({ length: endBatch - blockNum + 1 }, (_, i) => blockNum + i);

      console.log(`处理区块 ${blockNum}-${endBatch}/${latestBlock} (${((blockNum - startBlock) / blockRange * 100).toFixed(1)}%)`);

      // 使用 `withRetry` 处理区块数据，防止批量请求失败
      await withRetry(() => processBlockBatch(provider, batchBlocks, metrics));

      if (endBatch < latestBlock) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    return {
      transactions: metrics.transactions,
      contractCreations: metrics.contractCreations,
      activeUsers: metrics.uniqueAddresses.size,
      gasUsed: Number(metrics.totalGasUsed),
      latestBlock
    };
  } catch (error) {
    console.error(`Error fetching blockchain data for ${chainId}:`, error);
    return {
      transactions: 0,
      contractCreations: 0,
      activeUsers: 0,
      gasUsed: 0,
      latestBlock: 0
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
  console.log(`Gas cost calculation: ${value} ${symbol}`);
  return `${value.toFixed(6)} ${symbol}`;
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






