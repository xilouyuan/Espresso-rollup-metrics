'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, RefreshCw, Database } from 'lucide-react'
import { formatTransactionCount, getRollupMetricsFromInterval, formatUserCount} from './utils'
import { CHAIN_CONFIGS, ChainConfig, addChainConfig } from './config/chains'
import type {RollupMetrics } from './utils'





export default function Home() {
  const [darkMode, setDarkMode] = useState(false)
  const [chains, setChains] = useState<ChainConfig[]>(Object.values(CHAIN_CONFIGS).filter(chain => !chain.isTestnet))
  const [selectedChain, setSelectedChain] = useState(chains[0]?.id || '')
  const [chainInput, setChainInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [rpcUrlInput, setRpcUrlInput] = useState('')
  const [rollupMetrics, setRollupMetrics] = useState<RollupMetrics | null>(null)
  const [timeInterval, setTimeInterval] = useState<string>('1m')
  const [isLoading, setIsLoading] = useState(false)


  // 加载选中链的数据
  const loadSelectedChainData = async () => {
    if (!selectedChain) return;

    try {
      setIsLoading(true);
      const data = await getRollupMetricsFromInterval(CHAIN_CONFIGS[selectedChain].rpcUrl, timeInterval);
      setRollupMetrics(data);
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

      {selectedChain && rollupMetrics && (
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
              <div className="stat-value">{formatTransactionCount(rollupMetrics.transactions)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">
                <Database size={16} />
                Contract Creations
              </div>
              <div className="stat-value">{formatTransactionCount(rollupMetrics.contractCreations)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">
                <Database size={16} />
                Gas Used
              </div>
              <div className="stat-value">
                {rollupMetrics.gasUsed}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-title">
                <Database size={16} />
                Active Users
              </div>
              <div className="stat-value">{formatUserCount(rollupMetrics.uniqueAddresses)}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
