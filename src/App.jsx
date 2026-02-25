import { useState, useEffect } from 'react'
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { GasPrice } from '@cosmjs/stargate'
import './App.css'

const NETWORK_CONFIG = {
  chainId: 'columbus-5',
  chainName: 'Terra Classic',
  rpc: 'https://terra-classic-rpc.publicnode.com:443',
  lcd: 'https://terra-classic-lcd.publicnode.com',
  contractAddress: 'terra1nan8e0gda5mul82dqmf2sayh60lv5jnq82lyyy6mlp24vau5vv2st8u3zq',
  kneelToken: 'terra1genyaw32qah4544m0sfgmchegf7emft77u7hug63cc6a72mvpntsfupzmd',
  coinDenom: 'LUNC',
  coinMinimalDenom: 'uluna',
  coinDecimals: 6,
  gasPrice: '28.325uluna',
  minStake: 10000000000,
  maxStake: 1000000000000,
  burnWallet: 'terra1sk06e3dyexuq4shw77y3dsv480xv42mq73anxu',
}

// Get next month's first day for resolution
const getNextMonthDate = () => {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.toISOString().split('T')[0]
}

const PROPHECY_TEMPLATES = {
  // Football Leagues
  sports_premier: { name: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', oracle: 'England', defaultStake: 10000000000, league: 'PL', category: 'football' },
  sports_laliga: { name: 'La Liga', icon: '🇪🇸', oracle: 'Spain', defaultStake: 10000000000, league: 'LL', category: 'football' },
  sports_bundesliga: { name: 'Bundesliga', icon: '🇩🇪', oracle: 'Germany', defaultStake: 10000000000, league: 'BL', category: 'football' },
  sports_seriea: { name: 'Serie A', icon: '🇮🇹', oracle: 'Italy', defaultStake: 10000000000, league: 'SA', category: 'football' },
  sports_ligue1: { name: 'Ligue 1', icon: '🇫🇷', oracle: 'France', defaultStake: 10000000000, league: 'L1', category: 'football' },
  sports_primeira: { name: 'Primeira Liga', icon: '🇵🇹', oracle: 'Portugal', defaultStake: 10000000000, league: 'PL1', category: 'football' },
  sports_eredivisie: { name: 'Eredivisie', icon: '🇳🇱', oracle: 'Netherlands', defaultStake: 10000000000, league: 'ED', category: 'football' },
  // Crypto Predictions
  crypto_lunc_price: { name: 'LUNC Price', icon: '📈', oracle: 'CoinGecko', defaultStake: 10000000000, category: 'crypto' },
  crypto_lunc_burn: { name: 'LUNC Burn', icon: '🔥', oracle: 'On-Chain', defaultStake: 10000000000, category: 'crypto' },
}

function App() {
  const [wallet, setWallet] = useState(null)
  const [activeTab, setActiveTab] = useState('prophecy')
  const [selectedCategory, setSelectedCategory] = useState('football')
  const [selectedTemplate, setSelectedTemplate] = useState('sports_premier')
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [cryptoPrices, setCryptoPrices] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openPredictions, setOpenPredictions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({ displayName: '', avatarUrl: '' })
  const [stakeAmount, setStakeAmount] = useState('10000')
  
  // Crypto prediction specific state
  const [priceThreshold, setPriceThreshold] = useState('')
  const [burnThreshold, setBurnThreshold] = useState('')

  // Fetch crypto prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,terra-luna&vs_currencies=usd&include_24hr_change=true')
        const data = await response.json()
        setCryptoPrices({
          BTC: { price: data.bitcoin?.usd || 0, change: data.bitcoin?.usd_24h_change || 0 },
          LUNC: { price: data['terra-luna']?.usd || 0, change: data['terra-luna']?.usd_24h_change || 0 }
        })
        // Set default price threshold based on current price
        if (!priceThreshold && data['terra-luna']?.usd) {
          setPriceThreshold((data['terra-luna'].usd * 1.1).toFixed(8)) // 10% above current
        }
      } catch (err) {
        console.error('Failed to fetch prices:', err)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  // Set matches when template changes
  useEffect(() => {
    const template = PROPHECY_TEMPLATES[selectedTemplate]
    if (!template?.league) return
    
    const hardcodedMatches = {
      PL: [
        { homeTeam: { name: 'Arsenal' }, awayTeam: { name: 'Chelsea' }, utcDate: '2026-03-01T15:00:00Z' },
        { homeTeam: { name: 'Manchester United' }, awayTeam: { name: 'Liverpool' }, utcDate: '2026-03-02T17:30:00Z' },
        { homeTeam: { name: 'Manchester City' }, awayTeam: { name: 'Tottenham' }, utcDate: '2026-03-08T15:00:00Z' },
        { homeTeam: { name: 'Newcastle' }, awayTeam: { name: 'Brighton' }, utcDate: '2026-03-09T14:00:00Z' },
        { homeTeam: { name: 'West Ham' }, awayTeam: { name: 'Aston Villa' }, utcDate: '2026-03-15T15:00:00Z' },
        { homeTeam: { name: 'Everton' }, awayTeam: { name: 'Fulham' }, utcDate: '2026-03-16T14:00:00Z' },
      ],
      LL: [
        { homeTeam: { name: 'Real Madrid' }, awayTeam: { name: 'Barcelona' }, utcDate: '2026-03-01T20:00:00Z' },
        { homeTeam: { name: 'Atletico Madrid' }, awayTeam: { name: 'Sevilla' }, utcDate: '2026-03-02T18:00:00Z' },
        { homeTeam: { name: 'Real Sociedad' }, awayTeam: { name: 'Villarreal' }, utcDate: '2026-03-08T20:00:00Z' },
        { homeTeam: { name: 'Athletic Bilbao' }, awayTeam: { name: 'Valencia' }, utcDate: '2026-03-09T18:00:00Z' },
        { homeTeam: { name: 'Real Betis' }, awayTeam: { name: 'Celta Vigo' }, utcDate: '2026-03-15T20:00:00Z' },
      ],
      BL: [
        { homeTeam: { name: 'Bayern Munich' }, awayTeam: { name: 'Borussia Dortmund' }, utcDate: '2026-03-01T17:30:00Z' },
        { homeTeam: { name: 'RB Leipzig' }, awayTeam: { name: 'Bayer Leverkusen' }, utcDate: '2026-03-02T15:30:00Z' },
        { homeTeam: { name: 'Eintracht Frankfurt' }, awayTeam: { name: 'Wolfsburg' }, utcDate: '2026-03-08T17:30:00Z' },
        { homeTeam: { name: 'Borussia M\'gladbach' }, awayTeam: { name: 'Union Berlin' }, utcDate: '2026-03-09T15:30:00Z' },
        { homeTeam: { name: 'Freiburg' }, awayTeam: { name: 'Stuttgart' }, utcDate: '2026-03-15T17:30:00Z' },
      ],
      SA: [
        { homeTeam: { name: 'AC Milan' }, awayTeam: { name: 'Inter Milan' }, utcDate: '2026-03-01T20:45:00Z' },
        { homeTeam: { name: 'Juventus' }, awayTeam: { name: 'Napoli' }, utcDate: '2026-03-02T18:00:00Z' },
        { homeTeam: { name: 'Roma' }, awayTeam: { name: 'Lazio' }, utcDate: '2026-03-08T20:45:00Z' },
        { homeTeam: { name: 'Atalanta' }, awayTeam: { name: 'Fiorentina' }, utcDate: '2026-03-09T18:00:00Z' },
        { homeTeam: { name: 'Torino' }, awayTeam: { name: 'Bologna' }, utcDate: '2026-03-15T20:45:00Z' },
      ],
      L1: [
        { homeTeam: { name: 'PSG' }, awayTeam: { name: 'Marseille' }, utcDate: '2026-03-01T20:45:00Z' },
        { homeTeam: { name: 'Lyon' }, awayTeam: { name: 'Monaco' }, utcDate: '2026-03-02T17:00:00Z' },
        { homeTeam: { name: 'Lille' }, awayTeam: { name: 'Nice' }, utcDate: '2026-03-08T20:45:00Z' },
        { homeTeam: { name: 'Lens' }, awayTeam: { name: 'Rennes' }, utcDate: '2026-03-09T17:00:00Z' },
        { homeTeam: { name: 'Strasbourg' }, awayTeam: { name: 'Toulouse' }, utcDate: '2026-03-15T20:45:00Z' },
      ],
      PL1: [
        { homeTeam: { name: 'Benfica' }, awayTeam: { name: 'Porto' }, utcDate: '2026-03-01T21:00:00Z' },
        { homeTeam: { name: 'Sporting CP' }, awayTeam: { name: 'Braga' }, utcDate: '2026-03-02T19:00:00Z' },
        { homeTeam: { name: 'Vitoria SC' }, awayTeam: { name: 'Boavista' }, utcDate: '2026-03-08T21:00:00Z' },
        { homeTeam: { name: 'Rio Ave' }, awayTeam: { name: 'Gil Vicente' }, utcDate: '2026-03-09T19:00:00Z' },
        { homeTeam: { name: 'Santa Clara' }, awayTeam: { name: 'Famalicao' }, utcDate: '2026-03-15T21:00:00Z' },
      ],
      ED: [
        { homeTeam: { name: 'Ajax' }, awayTeam: { name: 'PSV' }, utcDate: '2026-03-01T20:00:00Z' },
        { homeTeam: { name: 'Feyenoord' }, awayTeam: { name: 'AZ Alkmaar' }, utcDate: '2026-03-02T16:30:00Z' },
        { homeTeam: { name: 'FC Twente' }, awayTeam: { name: 'Utrecht' }, utcDate: '2026-03-08T20:00:00Z' },
        { homeTeam: { name: 'Vitesse' }, awayTeam: { name: 'Heerenveen' }, utcDate: '2026-03-09T16:30:00Z' },
        { homeTeam: { name: 'Groningen' }, awayTeam: { name: 'Sparta Rotterdam' }, utcDate: '2026-03-15T20:00:00Z' },
      ],
    }
    
    setMatches(hardcodedMatches[template.league] || [])
    setSelectedMatch(null)
    setSelectedOption(null)
  }, [selectedTemplate])

  // Fetch open predictions
  const fetchPredictions = async () => {
    try {
      const query = btoa(JSON.stringify({ get_open_predictions: {} }))
      const response = await fetch(
        `${NETWORK_CONFIG.lcd}/cosmwasm/wasm/v1/contract/${NETWORK_CONFIG.contractAddress}/smart/${query}`
      )
      const data = await response.json()
      setOpenPredictions(data.data?.predictions || [])
    } catch (err) {
      console.error('Failed to fetch predictions:', err)
    }
  }

  useEffect(() => {
    fetchPredictions()
    const interval = setInterval(fetchPredictions, 10000)
    return () => clearInterval(interval)
  }, [])

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const query = btoa(JSON.stringify({ get_leaderboard: { limit: 10 } }))
      const response = await fetch(
        `${NETWORK_CONFIG.lcd}/cosmwasm/wasm/v1/contract/${NETWORK_CONFIG.contractAddress}/smart/${query}`
      )
      const data = await response.json()
      setLeaderboard(data.data?.entries || [])
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  // Fetch user profile when wallet connects
  const fetchUserProfile = async (address) => {
    try {
      const query = btoa(JSON.stringify({ get_user_profile: { user: address } }))
      const response = await fetch(
        `${NETWORK_CONFIG.lcd}/cosmwasm/wasm/v1/contract/${NETWORK_CONFIG.contractAddress}/smart/${query}`
      )
      const data = await response.json()
      setUserProfile(data.data?.profile || null)
      if (data.data?.profile) {
        setProfileForm({
          displayName: data.data.profile.display_name || '',
          avatarUrl: data.data.profile.avatar_url || ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  useEffect(() => {
    if (wallet) {
      fetchUserProfile(wallet)
    }
  }, [wallet])

  const connectWallet = async () => {
    if (!window.keplr) {
      alert('Please install Keplr wallet extension')
      return
    }
    
    try {
      await window.keplr.experimentalSuggestChain({
        chainId: NETWORK_CONFIG.chainId,
        chainName: NETWORK_CONFIG.chainName,
        rpc: NETWORK_CONFIG.rpc,
        rest: NETWORK_CONFIG.lcd,
        bip44: { coinType: 330 },
        bech32Config: {
          bech32PrefixAccAddr: "terra",
          bech32PrefixAccValAddr: "terravaloper",
          bech32PrefixAccPub: "terrapub",
          bech32PrefixValPub: "terravaloperpub",
          bech32PrefixConsAddr: "terravalcons",
          bech32PrefixConsPub: "terravalconspub"
        },
        currencies: [{ coinDenom: NETWORK_CONFIG.coinDenom, coinMinimalDenom: NETWORK_CONFIG.coinMinimalDenom, coinDecimals: NETWORK_CONFIG.coinDecimals }],
        feeCurrencies: [{ coinDenom: NETWORK_CONFIG.coinDenom, coinMinimalDenom: NETWORK_CONFIG.coinMinimalDenom, coinDecimals: NETWORK_CONFIG.coinDecimals, gasPriceStep: { low: 28.325, average: 28.325, high: 50 } }],
        stakeCurrency: { coinDenom: NETWORK_CONFIG.coinDenom, coinMinimalDenom: NETWORK_CONFIG.coinMinimalDenom, coinDecimals: NETWORK_CONFIG.coinDecimals },
      })
      
      await window.keplr.enable(NETWORK_CONFIG.chainId)
      const offlineSigner = window.keplr.getOfflineSigner(NETWORK_CONFIG.chainId)
      const accounts = await offlineSigner.getAccounts()
      setWallet(accounts[0].address)
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      alert('Failed to connect wallet: ' + err.message)
    }
  }

  const updateProfile = async () => {
    if (!wallet) return
    
    setIsSubmitting(true)
    try {
      const offlineSigner = window.keplr.getOfflineSigner(NETWORK_CONFIG.chainId)
      const client = await SigningCosmWasmClient.connectWithSigner(
        NETWORK_CONFIG.rpc,
        offlineSigner,
        { gasPrice: GasPrice.fromString(NETWORK_CONFIG.gasPrice) }
      )

      await client.execute(
        wallet,
        NETWORK_CONFIG.contractAddress,
        { 
          update_profile: { 
            display_name: profileForm.displayName,
            avatar_url: profileForm.avatarUrl
          } 
        },
        "auto",
        "Update KNEEL Profile"
      )

      alert('✅ Profile updated!')
      setShowProfileModal(false)
      fetchUserProfile(wallet)
      fetchLeaderboard()
    } catch (err) {
      console.error('Profile update failed:', err)
      alert('❌ Failed: ' + err.message)
    }
    setIsSubmitting(false)
  }

  const castProphecy = async () => {
    if (!wallet) {
      alert('Please connect wallet first')
      return
    }

    const template = PROPHECY_TEMPLATES[selectedTemplate]
    const stakeInMicro = (parseFloat(stakeAmount) * 1000000).toString()
    
    if (parseFloat(stakeAmount) < 10000 || parseFloat(stakeAmount) > 1000000) {
      alert('Stake must be between 10,000 and 1,000,000 LUNC')
      return
    }

    let oracleType
    let creatorPosition

    if (template.category === 'football') {
      if (!selectedMatch || selectedOption === null) {
        alert('Please select a match and make a prediction')
        return
      }
      oracleType = {
        SportsMatch: {
          event_id: `${selectedTemplate}-${selectedMatch.utcDate?.split('T')[0] || Date.now()}`,
          home_team: selectedMatch.homeTeam?.name || 'Home',
          away_team: selectedMatch.awayTeam?.name || 'Away'
        }
      }
      creatorPosition = selectedOption === 0
    } else if (selectedTemplate === 'crypto_lunc_price') {
      if (!priceThreshold || selectedOption === null) {
        alert('Please enter a price threshold and select above/below')
        return
      }
      oracleType = {
        SportsMatch: {
          event_id: `lunc-price-${getNextMonthDate()}`,
          home_team: `Above $${priceThreshold}`,
          away_team: `Below $${priceThreshold}`
        }
      }
      creatorPosition = selectedOption === 0
    } else if (selectedTemplate === 'crypto_lunc_burn') {
      if (!burnThreshold || selectedOption === null) {
        alert('Please enter a burn threshold and select above/below')
        return
      }
      oracleType = {
        SportsMatch: {
          event_id: `lunc-burn-${getNextMonthDate()}`,
          home_team: `Above ${burnThreshold}B`,
          away_team: `Below ${burnThreshold}B`
        }
      }
      creatorPosition = selectedOption === 0
    }

    const executeMsg = {
      create_prediction: {
        oracle_type: oracleType,
        creator_position: creatorPosition,
        expiry_time: Math.floor(new Date(getNextMonthDate()).getTime() / 1000) + 3 * 24 * 60 * 60 // 3 days after month start
      }
    }

    setIsSubmitting(true)
    
    try {
      const offlineSigner = window.keplr.getOfflineSigner(NETWORK_CONFIG.chainId)
      const client = await SigningCosmWasmClient.connectWithSigner(
        NETWORK_CONFIG.rpc,
        offlineSigner,
        { gasPrice: GasPrice.fromString(NETWORK_CONFIG.gasPrice) }
      )

      const result = await client.execute(
        wallet,
        NETWORK_CONFIG.contractAddress,
        executeMsg,
        "auto",
        "KNEEL Prophecy",
        [{ denom: NETWORK_CONFIG.coinMinimalDenom, amount: stakeInMicro }]
      )

      alert('✅ Prophecy Cast! TX: ' + result.transactionHash)
      fetchPredictions()
    } catch (err) {
      console.error('Prophecy failed:', err)
      alert('❌ Failed: ' + err.message)
    }
    
    setIsSubmitting(false)
  }

  const acceptChallenge = async (predictionId, stakeAmount) => {
    if (!wallet) {
      alert('Please connect wallet first')
      return
    }

    setIsSubmitting(true)
    
    try {
      const offlineSigner = window.keplr.getOfflineSigner(NETWORK_CONFIG.chainId)
      const client = await SigningCosmWasmClient.connectWithSigner(
        NETWORK_CONFIG.rpc,
        offlineSigner,
        { gasPrice: GasPrice.fromString(NETWORK_CONFIG.gasPrice) }
      )

      // Step 1: Approve KNEEL token spending (3 KNEEL = 3000000 uKNEEL)
      const kneelFee = "3000000"
      
      await client.execute(
        wallet,
        NETWORK_CONFIG.kneelToken,
        { 
          increase_allowance: { 
            spender: NETWORK_CONFIG.contractAddress, 
            amount: kneelFee 
          } 
        },
        "auto",
        "Approve KNEEL for challenge fee"
      )

      // Step 2: Accept the challenge
      const result = await client.execute(
        wallet,
        NETWORK_CONFIG.contractAddress,
        { accept_challenge: { prediction_id: predictionId } },
        "auto",
        "KNEEL Challenge Accepted",
        [{ denom: NETWORK_CONFIG.coinMinimalDenom, amount: stakeAmount }]
      )

      alert('✅ Challenge Accepted! TX: ' + result.transactionHash)
      fetchPredictions()
    } catch (err) {
      console.error('Challenge failed:', err)
      alert('❌ Failed: ' + err.message)
    }
    
    setIsSubmitting(false)
  }

  const formatStake = (amount) => {
    if (!amount) return '0'
    return (parseInt(amount) / 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`
  }

  const getDisplayName = (entry) => {
    if (entry.profile?.display_name) return entry.profile.display_name
    return formatAddress(entry.address)
  }

  const filteredTemplates = Object.entries(PROPHECY_TEMPLATES).filter(
    ([_, template]) => template.category === selectedCategory
  )

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img src="/kneel-logo.png" alt="KNEEL" className="logo-img" />
          <span className="logo-text">$KNEEL</span>
        </div>
        
        <div className="header-right">
          {cryptoPrices.LUNC && (
            <div className="price-ticker">
              <span>LUNC: ${cryptoPrices.LUNC.price?.toFixed(6)}</span>
              <span className={cryptoPrices.LUNC.change >= 0 ? 'positive' : 'negative'}>
                {cryptoPrices.LUNC.change >= 0 ? '▲' : '▼'} {Math.abs(cryptoPrices.LUNC.change || 0).toFixed(2)}%
              </span>
            </div>
          )}
          
          {wallet ? (
            <div className="wallet-card">
              {userProfile?.avatar_url && (
                <img src={userProfile.avatar_url} alt="" className="user-avatar" />
              )}
              <div className="wallet-info">
                <span className="wallet-name">{userProfile?.display_name || 'Prophet'}</span>
                <span className="wallet-address">{formatAddress(wallet)}</span>
              </div>
              <button className="edit-profile-btn" onClick={() => setShowProfileModal(true)}>✏️</button>
            </div>
          ) : (
            <button className="connect-btn" onClick={connectWallet}>
              🔗 Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="tabs">
        <button className={`tab ${activeTab === 'prophecy' ? 'active' : ''}`} onClick={() => setActiveTab('prophecy')}>
          🔮 Cast Prophecy
        </button>
        <button className={`tab ${activeTab === 'trials' ? 'active' : ''}`} onClick={() => setActiveTab('trials')}>
          ⚔️ Open Trials ({openPredictions.length})
        </button>
        <button className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          🏆 Leaderboard
        </button>
      </nav>

      {/* Main Content */}
      <div className="content">
        {activeTab === 'prophecy' && (
          <div className="card">
            {/* Category Selector */}
            <div className="category-selector">
              <button 
                className={`category-btn ${selectedCategory === 'football' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory('football')
                  setSelectedTemplate('sports_premier')
                  setSelectedMatch(null)
                  setSelectedOption(null)
                }}
              >
                ⚽ Football
              </button>
              <button 
                className={`category-btn ${selectedCategory === 'crypto' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategory('crypto')
                  setSelectedTemplate('crypto_lunc_price')
                  setSelectedOption(null)
                }}
              >
                💰 Crypto
              </button>
            </div>

            <h2 className="card-title">
              {selectedCategory === 'football' ? '🔮 Choose Your League' : '🔮 Crypto Predictions'}
            </h2>
            
            <div className={`templates-grid ${selectedCategory === 'crypto' ? 'crypto-grid' : ''}`}>
              {filteredTemplates.map(([key, template]) => (
                <div 
                  key={key} 
                  className={`template-card ${selectedTemplate === key ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTemplate(key)
                    setSelectedMatch(null)
                    setSelectedOption(null)
                  }}
                >
                  <span className="template-icon">{template.icon}</span>
                  <span className="template-name">{template.name}</span>
                  <span className="template-oracle">{template.oracle}</span>
                </div>
              ))}
            </div>

            {/* Football Matches */}
            {selectedCategory === 'football' && matches.length > 0 && (
              <>
                <h3 className="section-title">📅 Select Match</h3>
                <div className="matches-grid">
                  {matches.map((match, idx) => (
                    <div 
                      key={idx}
                      className={`match-card ${selectedMatch === match ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedMatch(match)
                        setSelectedOption(null)
                      }}
                    >
                      <div className="match-teams">{match.homeTeam.name} vs {match.awayTeam.name}</div>
                      <div className="match-date">{new Date(match.utcDate).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Football Prediction Options */}
            {selectedCategory === 'football' && selectedMatch && (
              <>
                <h3 className="section-title">🎯 Your Prediction</h3>
                <div className="options-grid">
                  <button 
                    className={`option-btn ${selectedOption === 0 ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(0)}
                  >
                    {selectedMatch.homeTeam.name} Wins
                  </button>
                  <button 
                    className={`option-btn ${selectedOption === 1 ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(1)}
                  >
                    {selectedMatch.awayTeam.name} Wins
                  </button>
                </div>
              </>
            )}

            {/* LUNC Price Prediction */}
            {selectedTemplate === 'crypto_lunc_price' && (
              <>
                <div className="crypto-prediction-box">
                  <h3 className="section-title">📈 LUNC Price Prediction</h3>
                  <p className="crypto-info">
                    Current Price: <strong>${cryptoPrices.LUNC?.price?.toFixed(8) || '...'}</strong>
                  </p>
                  <p className="crypto-info">
                    Resolution Date: <strong>{getNextMonthDate()}</strong> (1st of next month)
                  </p>
                  <p className="crypto-oracle">Oracle: CoinGecko API</p>
                  
                  <div className="threshold-input-container">
                    <label>Price Threshold ($)</label>
                    <input 
                      type="number"
                      className="threshold-input"
                      value={priceThreshold}
                      onChange={(e) => setPriceThreshold(e.target.value)}
                      placeholder="0.00010000"
                      step="0.00000001"
                    />
                  </div>
                  
                  <h3 className="section-title">🎯 Your Prediction</h3>
                  <div className="options-grid">
                    <button 
                      className={`option-btn above ${selectedOption === 0 ? 'selected' : ''}`}
                      onClick={() => setSelectedOption(0)}
                    >
                      📈 Above ${priceThreshold || '...'}
                    </button>
                    <button 
                      className={`option-btn below ${selectedOption === 1 ? 'selected' : ''}`}
                      onClick={() => setSelectedOption(1)}
                    >
                      📉 Below ${priceThreshold || '...'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* LUNC Burn Prediction */}
            {selectedTemplate === 'crypto_lunc_burn' && (
              <>
                <div className="crypto-prediction-box">
                  <h3 className="section-title">🔥 Binance Monthly LUNC Burn</h3>
                  <p className="crypto-info">
                    Last Burn (Feb 2026): <strong>1.08 Billion LUNC</strong>
                  </p>
                  <p className="crypto-info">
                    Resolution Date: <strong>{getNextMonthDate()}</strong> (after Binance publishes)
                  </p>
                  <p className="crypto-oracle">Oracle: On-Chain (Burn Wallet)</p>
                  <p className="burn-wallet-info">
                    Burn Wallet: <code>{NETWORK_CONFIG.burnWallet.slice(0, 15)}...</code>
                  </p>
                  
                  <div className="threshold-input-container">
                    <label>Burn Threshold (Billions)</label>
                    <input 
                      type="number"
                      className="threshold-input"
                      value={burnThreshold}
                      onChange={(e) => setBurnThreshold(e.target.value)}
                      placeholder="1.0"
                      step="0.1"
                    />
                  </div>
                  
                  <h3 className="section-title">🎯 Your Prediction</h3>
                  <div className="options-grid">
                    <button 
                      className={`option-btn above ${selectedOption === 0 ? 'selected' : ''}`}
                      onClick={() => setSelectedOption(0)}
                    >
                      🔥 Above {burnThreshold || '...'}B LUNC
                    </button>
                    <button 
                      className={`option-btn below ${selectedOption === 1 ? 'selected' : ''}`}
                      onClick={() => setSelectedOption(1)}
                    >
                      ❄️ Below {burnThreshold || '...'}B LUNC
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Stake Amount (shown for all) */}
            {((selectedCategory === 'football' && selectedMatch) || selectedCategory === 'crypto') && (
              <>
                <h3 className="section-title">💰 Stake Amount</h3>
                <div className="stake-input-container">
                  <input 
                    type="number" 
                    className="stake-input"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    min="10000"
                    max="1000000"
                    step="1000"
                  />
                  <span className="stake-suffix">LUNC</span>
                </div>
                <div className="stake-range">Min: 10,000 LUNC | Max: 1,000,000 LUNC</div>
              </>
            )}

            {/* Submit Button */}
            {wallet && selectedOption !== null && (
              <button 
                className="submit-btn"
                onClick={castProphecy}
                disabled={isSubmitting}
              >
                {isSubmitting ? '⏳ Casting...' : `⚡ Cast Prophecy (${parseInt(stakeAmount).toLocaleString()} LUNC)`}
              </button>
            )}
            
            {!wallet && (
              <p className="connect-prompt">Connect wallet to cast prophecies</p>
            )}
          </div>
        )}

        {activeTab === 'trials' && (
          <div className="card">
            <h2 className="card-title">⚔️ Open Trials</h2>
            <p className="card-subtitle">Challenge a prophet by prophesying the opposite outcome</p>
            
            {openPredictions.length === 0 ? (
              <p className="empty-state">No open trials available. Cast a prophecy to create one!</p>
            ) : (
              <div className="trials-list">
                {openPredictions.map((pred) => {
                  const homeTeam = pred.oracle_type?.SportsMatch?.home_team || 'Option A'
                  const awayTeam = pred.oracle_type?.SportsMatch?.away_team || 'Option B'
                  const creatorPick = pred.creator_position ? homeTeam : awayTeam
                  const challengerPick = pred.creator_position ? awayTeam : homeTeam
                  const isOwnPrediction = wallet === pred.creator
                  const eventId = pred.oracle_type?.SportsMatch?.event_id || ''
                  const isCrypto = eventId.includes('lunc-price') || eventId.includes('lunc-burn')
                  const isPricePred = eventId.includes('lunc-price')
                  const isBurnPred = eventId.includes('lunc-burn')
                  const stakePerSide = formatStake(pred.stake_amount)
                  const totalPool = formatStake((BigInt(pred.stake_amount) * 2n).toString())
                  const expiryDate = new Date(pred.expiry_time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  
                  return (
                    <div key={pred.id} className={`trial-card-versus ${isCrypto ? 'crypto-trial' : ''}`}>
                      {/* Header */}
                      <div className="trial-header-versus">
                        <div className="trial-event">
                          <span className="trial-icon-lg">
                            {isPricePred ? '📈' : isBurnPred ? '🔥' : '⚽'}
                          </span>
                          <div className="trial-event-info">
                            <span className="trial-event-name">
                              {isCrypto ? (isPricePred ? 'LUNC Price Prediction' : 'LUNC Burn Prediction') : `${homeTeam} vs ${awayTeam}`}
                            </span>
                            <span className="trial-expiry">⏰ Expires: {expiryDate}</span>
                          </div>
                        </div>
                        <div className="trial-id-badge">Trial #{pred.id}</div>
                      </div>
                      
                      {/* Pool Info */}
                      <div className="trial-pool-info">
                        <div className="pool-total">
                          <span className="pool-label">💰 Total Pool</span>
                          <span className="pool-amount">{totalPool} LUNC</span>
                        </div>
                      </div>
                      
                      {/* Versus Layout */}
                      <div className="versus-container">
                        {/* Prophet Side */}
                        <div className="versus-side prophet-side">
                          <div className="side-header">🔮 PROPHET</div>
                          <div className="side-address">{formatAddress(pred.creator)}</div>
                          <div className="side-pick">{creatorPick}</div>
                          <div className="side-stake">{stakePerSide} LUNC</div>
                        </div>
                        
                        {/* VS Divider */}
                        <div className="versus-divider">
                          <span className="vs-text">VS</span>
                        </div>
                        
                        {/* Challenger Side */}
                        <div className="versus-side challenger-side">
                          <div className="side-header">⚔️ CHALLENGER</div>
                          <div className="side-address">{isOwnPrediction ? '—' : (wallet ? 'You' : '???')}</div>
                          <div className="side-pick">{challengerPick}</div>
                          <div className="side-stake">{stakePerSide} LUNC</div>
                        </div>
                      </div>
                      
                      {/* Action Area */}
                      {!isOwnPrediction && wallet && (
                        <button 
                          className="challenge-btn-versus"
                          onClick={() => acceptChallenge(pred.id, pred.stake_amount)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? '⏳ Processing...' : `⚔️ Accept Challenge & Stake ${stakePerSide} LUNC`}
                        </button>
                      )}
                      
                      {isOwnPrediction && (
                        <div className="own-prediction-banner-versus">
                          ✨ Your Prophecy — Awaiting Challenger
                        </div>
                      )}
                      
                      {!wallet && (
                        <div className="connect-prompt-versus">
                          Connect wallet to accept this challenge
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="card">
            <h2 className="card-title">🏆 Top Prophets</h2>
            {leaderboard.length === 0 ? (
              <p className="empty-state">No prophets yet. Be the first!</p>
            ) : (
              <div className="leaderboard">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.address} className="leaderboard-entry">
                    <span className="rank">#{idx + 1}</span>
                    {entry.profile?.avatar_url && (
                      <img src={entry.profile.avatar_url} alt="" className="leaderboard-avatar" />
                    )}
                    <div className="leaderboard-info">
                      <span className="leaderboard-name">{getDisplayName(entry)}</span>
                      <span className="leaderboard-stats">
                        {entry.stats.wins}W - {entry.stats.losses}L | Won: {formatStake(entry.stats.total_won)} LUNC
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>✏️ Edit Profile</h2>
            <p className="modal-fee">Profile updates cost 3 KNEEL tokens</p>
            <div className="form-group">
              <label>Display Name (max 32 chars)</label>
              <input 
                type="text" 
                value={profileForm.displayName}
                onChange={e => setProfileForm({...profileForm, displayName: e.target.value.slice(0, 32)})}
                placeholder="Enter your prophet name..."
              />
            </div>
            <div className="form-group">
              <label>Avatar URL</label>
              <input 
                type="text" 
                value={profileForm.avatarUrl}
                onChange={e => setProfileForm({...profileForm, avatarUrl: e.target.value})}
                placeholder="https://example.com/avatar.png"
              />
              {profileForm.avatarUrl && (
                <img src={profileForm.avatarUrl} alt="preview" className="avatar-preview" />
              )}
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowProfileModal(false)}>Cancel</button>
              <button className="save-btn" onClick={updateProfile} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Profile (3 KNEEL)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
