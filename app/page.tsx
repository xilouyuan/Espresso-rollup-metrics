'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, RefreshCw, Database } from 'lucide-react'
import { formatTransactionCount, formatGasUsed, formatUserCount, getExplorerUrl, fetchBlockchainData, fetchMultipleChainData } from './utils'
import { getActiveChains, getMainnets, getTestnets, CHAIN_CONFIGS, ChainConfig, getAllChainIds, addChainConfig } from './config/chains'
import type { BlockchainData } from './utils'

interface StatData {
  title: string;
  value: string;
}

// 将时间间隔字符串转换为毫秒
const timeIntervalToMs = (interval: string): number => {
  switch (interval) {
    case '1m': return 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '8h': return 8 * 60 * 60 * 1000;
    case '1D': return 24 * 60 * 60 * 1000;
    case '1W': return 7 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
};

export default function Home() {
  const [darkMode, setDarkMode] = useState(false)
  const [chains, setChains] = useState<ChainConfig[]>(Object.values(CHAIN_CONFIGS).filter(chain => !chain.isTestnet))
  const [selectedChain, setSelectedChain] = useState(chains[0]?.id || '')
  const [chainInput, setChainInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [rpcUrlInput, setRpcUrlInput] = useState('')
  const [blockchainData, setBlockchainData] = useState<BlockchainData | null>(null)
  const [allChainsData, setAllChainsData] = useState<Record<string, BlockchainData>>({})
  const [timeInterval, setTimeInterval] = useState<string>('1m')
  const [isLoading, setIsLoading] = useState(false)

  // 获取当前选中链的统计数据
  const currentStatsData = (() => {
    if (blockchainData && selectedChain) {
      return [
        { title: 'Total Transactions', value: formatTransactionCount(blockchainData.transactions) },
        { title: 'Contract Creations', value: formatTransactionCount(blockchainData.contractCreations) },
        { title: 'Active Users', value: formatTransactionCount(blockchainData.activeUsers) },
        { title: 'Gas Used', value: formatGasUsed(blockchainData.gasUsed / 1e18, selectedChain) }
      ];
    }
    return [
      { title: 'Total Transactions', value: '0' },
      { title: 'Contract Creations', value: '0' },
      { title: 'Active Users', value: '0' },
      { title: 'Gas Used', value: '0' }
    ];
  })();

  // 加载选中链的数据
  const loadSelectedChainData = async () => {
    if (!selectedChain) return;

    try {
      setIsLoading(true);
      const data = await fetchBlockchainData(selectedChain, timeIntervalToMs(timeInterval));
      setBlockchainData(data);
      setAllChainsData(prev => ({ ...prev, [selectedChain]: data }));
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadSelectedChainData();
  }, []);

  // 当选择的链或时间间隔改变时，重新加载数据
  useEffect(() => {
    loadSelectedChainData();
  }, [selectedChain, timeInterval]);

  // 处理添加新链
  const addChain = () => {
    try {
      if (!chainInput || !nameInput || !rpcUrlInput) {
        alert('Please provide Chain ID, Name, and RPC URL.');
        return;
      }

      const newChain = {
        id: chainInput,
        name: nameInput,
        rpcUrl: rpcUrlInput,
        explorerUrl: '',
        tokenSymbol: 'ETH',
        isTestnet: false,
        active: true
      };

      addChainConfig(newChain);
      
      // 更新链列表
      setChains(Object.values(CHAIN_CONFIGS).filter(chain => !chain.isTestnet));
      
      // 清空输入
      setChainInput('');
      setNameInput('');
      setRpcUrlInput('');
      
      // 选择新添加的链
      setSelectedChain(chainInput);
    } catch (error) {
      alert(`Failed to add chain: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 切换深色模式
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode', newDarkMode);
  };

  return (
    <div className="container">
      <header>
        <div className="logo">
          <Database size={24} />
          <span>Layer2 Leaderboard</span>
        </div>
        <button onClick={toggleDarkMode} className="refresh-button">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      <section className="add-chain-section">
        <h2>Add New Chain</h2>
        <form className="add-chain-form" onSubmit={(e) => { e.preventDefault(); addChain(); }}>
          <div className="form-group">
            <label htmlFor="chainId">Chain ID</label>
            <input
              id="chainId"
              type="text"
              value={chainInput}
              onChange={(e) => setChainInput(e.target.value)}
              placeholder="Chain ID"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="chainName">Chain Name</label>
            <input
              id="chainName"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Chain Name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="rpcUrl">RPC URL</label>
            <input
              id="rpcUrl"
              type="url"
              value={rpcUrlInput}
              onChange={(e) => setRpcUrlInput(e.target.value)}
              placeholder="RPC URL"
              required
            />
          </div>
          <button type="submit">Add Chain</button>
        </form>
      </section>

      <section className="chain-selector-section">
        <h2>Select Chain</h2>
        <div className="chain-selector">
          {chains.map(chain => (
            <button
              key={chain.id}
              className={`chain-button ${selectedChain === chain.id ? 'selected' : ''}`}
              onClick={() => setSelectedChain(chain.id)}
            >
              {chain.name}
              {chain.isTestnet && <span className="testnet-badge">Testnet</span>}
            </button>
          ))}
        </div>

        <div className="interval-selector">
          <span>Time Interval:</span>
          {['1m', '1h', '4h', '8h', '1D', '1W'].map(interval => (
            <button
              key={interval}
              className={`interval-button ${timeInterval === interval ? 'selected' : ''}`}
              onClick={() => setTimeInterval(interval)}
            >
              {interval}
            </button>
          ))}
          <button className="refresh-button" onClick={loadSelectedChainData} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </section>

      {selectedChain && blockchainData && (
        <section className="blockchain-stats-section">
          <div className="section-header">
            <h2>
              {chains.find(c => c.id === selectedChain)?.name} Stats
              {chains.find(c => c.id === selectedChain)?.isTestnet && (
                <span className="testnet-badge">Testnet</span>
              )}
            </h2>
          </div>

          <div className="blockchain-stats">
            <div className="stat-card">
              <div className="stat-title">
                <Database size={16} />
                Transactions
              </div>
              <div className="stat-value">{formatTransactionCount(blockchainData.transactions)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">
                <Database size={16} />
                Contract Creations
              </div>
              <div className="stat-value">{formatTransactionCount(blockchainData.contractCreations)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">
                <Database size={16} />
                Gas Used
              </div>
              <div className="stat-value">
                0.00 {CHAIN_CONFIGS[selectedChain]?.tokenSymbol || 'ETH'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-title">
                <Database size={16} />
                Active Users
              </div>
              <div className="stat-value">{formatUserCount(blockchainData.activeUsers)}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
