'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, RefreshCw, Database } from 'lucide-react'
import { formatTransactionCount, formatGasUsed, formatTPS, formatUserCount, getExplorerUrl } from './utils'
import { getActiveChains, getMainnets, getTestnets, CHAIN_CONFIGS, ChainConfig, getAllChainIds } from './config/chains'
import type { BlockchainData } from './utils'

// 内联定义TransactionChart组件
const TransactionChart = ({ chainId }: { chainId: string }) => {
  return (
    <div className="chart-container">
      <div className="chart-placeholder">
        {chainId} transaction chart will be displayed here
      </div>
    </div>
  )
}

interface StatData {
  title: string;
  value: string;
}

interface TableData {
  name: string;
  id: string;
  contractCreations: string;
  gasUsed: string;
  transactions: string;
  users: string;
  active: boolean;
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(false)
  const [chains, setChains] = useState<ChainConfig[]>(Object.values(CHAIN_CONFIGS))
  const [selectedChain, setSelectedChain] = useState(chains[0]?.id || '')
  const [chainInput, setChainInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [blockchainData, setBlockchainData] = useState<BlockchainData | null>(null)
  const [allChainsData, setAllChainsData] = useState<Record<string, BlockchainData>>({})
  const [timeInterval, setTimeInterval] = useState<string>('1h')
  const [networkType, setNetworkType] = useState<'all' | 'mainnet' | 'testnet'>('all')

  // Filter chains based on network type
  const filteredChains = (() => {
    switch (networkType) {
      case 'mainnet':
        return chains.filter(chain => !chain.isTestnet);
      case 'testnet':
        return chains.filter(chain => chain.isTestnet);
      default:
        return chains;
    }
  })();

  // 所有链的数据
  const allStatsData: Record<string, StatData[]> = {
    sepolia: [
      { title: 'Total Transactions', value: blockchainData ? formatTransactionCount(blockchainData.transactions) : '246,853' },
      { title: 'Contract Creations', value: blockchainData ? formatTransactionCount(blockchainData.contractCreations) : '1,245' },
      { title: 'Active Users', value: blockchainData ? formatTransactionCount(blockchainData.activeUsers) : '8,721' },
      { title: 'Gas Used', value: blockchainData ? formatGasUsed(blockchainData.gasUsed / 1e18, 'sepolia') : '12.45 ETH' }
    ],
    mumbai: [
      { title: 'Total Transactions', value: '187,654' },
      { title: 'Contract Creations', value: '987' },
      { title: 'Active Users', value: '7,432' },
      { title: 'Gas Used', value: '8.76 MATIC' }
    ],
    'arbitrum-goerli': [
      { title: 'Total Transactions', value: '156,432' },
      { title: 'Contract Creations', value: '654' },
      { title: 'Active Users', value: '6,543' },
      { title: 'Gas Used', value: '5.67 ETH' }
    ],
    'optimism-goerli': [
      { title: 'Total Transactions', value: '87,654' },
      { title: 'Contract Creations', value: '432' },
      { title: 'Active Users', value: '4,321' },
      { title: 'Gas Used', value: '3.21 ETH' }
    ],
    'base-goerli': [
      { title: 'Total Transactions', value: '65,432' },
      { title: 'Contract Creations', value: '321' },
      { title: 'Active Users', value: '2,987' },
      { title: 'Gas Used', value: '1.87 ETH' }
    ]
  }

  // 生成表格数据
  const generateTableData = (): TableData[] => {
    return chains.map(chain => {
      const data = allChainsData[chain.id];
      return {
        name: chain.name,
        id: chain.id,
        contractCreations: data ? formatTransactionCount(data.contractCreations) : '0',
        gasUsed: data ? formatGasUsed(data.gasUsed / 1e18, chain.id) : `0 ${chain.tokenSymbol}`,
        transactions: data ? formatTransactionCount(data.transactions) : '0',
        users: data ? formatTransactionCount(data.activeUsers) : '0',
        active: chain.active
      };
    });
  };
  
  // 获取表格数据
  const tableData = generateTableData();

  // 获取当前选中链的数据
  const filteredTableData = tableData.filter(item => item.id === selectedChain)
  
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
    return allStatsData[selectedChain] || allStatsData.sepolia;
  })();

  const handleBlockchainDataLoaded = (data: BlockchainData) => {
    setBlockchainData(data);
    setAllChainsData(prev => ({
      ...prev,
      [selectedChain]: data
    }));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  const addChain = (e: React.FormEvent) => {
    e.preventDefault()
    if (chainInput && nameInput) {
      const newChain: ChainConfig = {
        id: chainInput.toLowerCase(),
        name: nameInput,
        rpcUrl: '',  // 用户需要在另一个界面设置详细信息
        explorerUrl: '',
        tokenSymbol: 'ETH',
        active: true,
        isTestnet: networkType === 'testnet' // 根据当前选择的网络类型设置
      };
      
      setChains([...chains, newChain]);
      setChainInput('');
      setNameInput('');
    }
  }

  // Set the selected chain when networkType changes
  useEffect(() => {
    const availableChains = filteredChains;
    if (availableChains.length > 0) {
      // Check if currently selected chain is in the filtered list
      const currentChainStillAvailable = availableChains.some(chain => chain.id === selectedChain);
      if (!currentChainStillAvailable) {
        setSelectedChain(availableChains[0].id);
      }
    }
  }, [networkType, filteredChains, selectedChain]);

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

      <form className="add-chain-form" onSubmit={addChain}>
        <div className="form-group">
          <label htmlFor="chain-id">Chain ID</label>
          <input
            id="chain-id"
            type="text"
            placeholder="e.g. holesky"
            value={chainInput}
            onChange={(e) => setChainInput(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="chain-name">Display Name</label>
          <input
            id="chain-name"
            type="text"
            placeholder="e.g. Holesky"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </div>
        <button type="submit">Add Chain</button>
      </form>

      <div className="network-type-selector">
        <div 
          className={`network-type-item ${networkType === 'all' ? 'active' : ''}`} 
          onClick={() => setNetworkType('all')}
        >
          All Networks
        </div>
        <div 
          className={`network-type-item ${networkType === 'mainnet' ? 'active' : ''}`} 
          onClick={() => setNetworkType('mainnet')}
        >
          Mainnets
        </div>
        <div 
          className={`network-type-item ${networkType === 'testnet' ? 'active' : ''}`} 
          onClick={() => setNetworkType('testnet')}
        >
          Testnets
        </div>
      </div>

      <div className="chain-selector">
        {filteredChains.map((chain) => (
          <div
            key={chain.id}
            className={`chain-item ${selectedChain === chain.id ? 'active' : ''}`}
            onClick={() => setSelectedChain(chain.id)}
          >
            {chain.name}
          </div>
        ))}
      </div>

      <div className="section-header">
        <h2 className="section-title">
          {chains.find(c => c.id === selectedChain)?.name || ''} Overview
          {getExplorerUrl(selectedChain) && (
            <a 
              href={getExplorerUrl(selectedChain)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="explorer-link"
            >
              Explorer
            </a>
          )}
        </h2>
        <div className="header-actions">
          <div className="time-interval-selector">
            {['1h', '4h', '8h', '1D', '1W'].map((interval) => (
              <div
                key={interval}
                className={`interval-item ${timeInterval === interval ? 'active' : ''}`}
                onClick={() => setTimeInterval(interval)}
              >
                {interval}
              </div>
            ))}
          </div>
          <button className="refresh-button">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="card-container">
        {currentStatsData.map((stat, index) => (
          <div className="card" key={index}>
            <div className="card-title">{stat.title}</div>
            <div className="card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h2 className="section-title">Performance Chart</h2>
      </div>

      <TransactionChart chainId={selectedChain} />

      <div className="section-header">
        <h2 className="section-title">Testnet Comparison</h2>
      </div>

      <div className="rollup-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contract Creations</th>
              <th>Gas Used</th>
              <th>Transactions</th>
              <th>Users</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTableData.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                <td>{row.contractCreations}</td>
                <td>{row.gasUsed}</td>
                <td>{row.transactions}</td>
                <td>{row.users}</td>
                <td>
                  <span className={`status-indicator ${row.active ? 'status-active' : 'status-inactive'}`}></span>
                  {row.active ? 'Active' : 'Inactive'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
