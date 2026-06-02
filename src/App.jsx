import React, { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Settings, 
  Plus, 
  Trash2, 
  Star, 
  RefreshCw, 
  Globe, 
  Building2,
  X
} from "lucide-react";
import { fetchStockData, searchStocks, TOP_NIFTY_STOCKS } from "./services/yahooFinance";
import StockChart from "./components/StockChart";
import AiAnalysis from "./components/AiAnalysis";
import StockNews from "./components/StockNews";
import "./index.css";

export default function App() {
  // 1. Symbol & Timeframe state
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.NS");
  const [timeframe, setTimeframe] = useState("1M");
  const [stockData, setStockData] = useState(null);
  const [loadingStock, setLoadingStock] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 2. Nifty Carousel grid state
  const [niftyStocks, setNiftyStocks] = useState([]);
  const [loadingNifty, setLoadingNifty] = useState(true);

  // 3. Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [liveIndices, setLiveIndices] = useState([]);
  const [loadingIndices, setLoadingIndices] = useState(true);

  // 4. Watchlist states
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistData, setWatchlistData] = useState([]);

  // 5. Config / API key states
  const [apiKey, setApiKey] = useState("");

  // Load API Key and Watchlist on Mount
  useEffect(() => {
    // 1. Try to load API key from environment variables
    const envKey = import.meta.env.VITE_GROQ_API_KEY;
    if (envKey) {
      setApiKey(envKey);
    }

    // 2. Load Watchlist from localStorage
    const savedWatchlist = localStorage.getItem("stock_watchlist");
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (e) {
        console.error("Failed parsing watchlist", e);
        setWatchlist(["TCS.NS", "HDFCBANK.NS"]);
      }
    } else {
      // Default watchlist on first load
      setWatchlist(["TCS.NS", "HDFCBANK.NS"]);
    }

    // 3. Parallel fetch of all Nifty 10 stocks and live indices on mount
    fetchNiftyDashboardData();
    fetchLiveIndices();
  }, []);

  // Sync Watchlist in LocalStorage and fetch their live quotes
  useEffect(() => {
    localStorage.setItem("stock_watchlist", JSON.stringify(watchlist));
    fetchWatchlistData();
  }, [watchlist]);

  // Fetch detailed stock quote & history when symbol or timeframe changes
  useEffect(() => {
    const getStockDetails = async () => {
      setLoadingStock(true);
      setHoveredPoint(null);
      try {
        const data = await fetchStockData(selectedSymbol, timeframe);
        setStockData(data);
      } catch (err) {
        console.error("Error loading selected stock data", err);
      } finally {
        setLoadingStock(false);
      }
    };
    getStockDetails();
  }, [selectedSymbol, timeframe]);

  // Fetch Nifty Carousel brief live metrics
  const fetchNiftyDashboardData = async () => {
    setLoadingNifty(true);
    try {
      const promises = TOP_NIFTY_STOCKS.map(async (stock) => {
        // Fetch 1-day range for quick live metrics
        const details = await fetchStockData(stock.symbol, "1D");
        return {
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          price: details.price,
          prevClose: details.prevClose,
          changePercent: ((details.price - details.prevClose) / details.prevClose) * 100
        };
      });
      const results = await Promise.all(promises);
      setNiftyStocks(results);
    } catch (err) {
      console.error("Error fetching Nifty carousel metrics:", err);
    } finally {
      setLoadingNifty(false);
    }
  };

  // Fetch Live Index quote details
  const fetchLiveIndices = async () => {
    setLoadingIndices(true);
    try {
      const indicesList = [
        { symbol: "^NSEI", name: "NIFTY 50" },
        { symbol: "^NSEBANK", name: "BANK NIFTY" }
      ];
      
      const promises = indicesList.map(async (idx) => {
        const details = await fetchStockData(idx.symbol, "1D");
        return {
          symbol: idx.symbol,
          name: idx.name,
          price: details.price,
          prevClose: details.prevClose,
          changePercent: ((details.price - details.prevClose) / details.prevClose) * 100
        };
      });
      
      const results = await Promise.all(promises);
      setLiveIndices(results);
    } catch (err) {
      console.error("Error fetching live indices:", err);
    } finally {
      setLoadingIndices(false);
    }
  };

  // Fetch Watchlist stocks brief live quotes
  const fetchWatchlistData = async () => {
    if (watchlist.length === 0) {
      setWatchlistData([]);
      return;
    }
    try {
      const promises = watchlist.map(async (symbol) => {
        const details = await fetchStockData(symbol, "1D");
        return {
          symbol: symbol,
          name: details.name,
          price: details.price,
          prevClose: details.prevClose,
          changePercent: ((details.price - details.prevClose) / details.prevClose) * 100
        };
      });
      const results = await Promise.all(promises);
      setWatchlistData(results);
    } catch (err) {
      console.error("Error fetching watchlist metrics:", err);
    }
  };

  // Watchlist controls
  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
    }
  };

  const removeFromWatchlist = (symbol, e) => {
    e.stopPropagation();
    setWatchlist(watchlist.filter((item) => item !== symbol));
  };

  // Search input change handler
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const searchResults = await searchStocks(query);
      setSuggestions(searchResults);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Search click selection handler
  const selectStock = (symbol) => {
    setSelectedSymbol(symbol);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Save Groq Key handler - disabled as key is pre-configured

  // Quote percentage calculation helpers
  const getChangeMetrics = (current, prev) => {
    const diff = current - prev;
    const percent = (diff / prev) * 100;
    return {
      diff: parseFloat(diff.toFixed(2)),
      percent: parseFloat(percent.toFixed(2)),
      isPositive: diff >= 0
    };
  };

  // Determine standard active values depending on chart hover state
  const displayedPrice = hoveredPoint ? hoveredPoint.price : (stockData ? stockData.price : 0);
  const priceSource = stockData ? (hoveredPoint ? "HOVERED" : "LIVE") : "LIVE";
  
  const diffMetrics = stockData 
    ? getChangeMetrics(displayedPrice, stockData.prevClose)
    : { diff: 0, percent: 0, isPositive: true };

  return (
    <div className="app-container">
      {/* 1. Nav bar Header */}
      <header className="navbar glassmorphism">
        <div className="nav-brand">
          <Globe size={24} className="icon-blue" />
          <span>Equi<span className="brand-accent">Mind</span></span>
        </div>

        {/* Floating Search Panel */}
        <div className={`search-container ${isFocused ? "focused" : ""} ${searchQuery ? "has-input" : ""} ${showSuggestions && suggestions.length > 0 ? "has-suggestions" : ""}`}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search Nifty or NASDAQ stocks..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { 
                setIsFocused(true); 
                if (suggestions.length > 0) setShowSuggestions(true); 
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                }, 200);
              }}
            />
            {searchQuery && (
              <button 
                className="close-btn" 
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}
                onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((item) => (
                <div 
                  key={item.symbol} 
                  className="suggestion-item"
                  onClick={() => selectStock(item.symbol)}
                >
                  <div>
                    <span className="sugg-symbol">{item.symbol}</span>
                    <span className="sugg-name" style={{ marginLeft: "8px" }}>{item.name}</span>
                  </div>
                  <span className="sugg-exch">{item.exchange}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nav-actions">
          <button className="btn btn-primary flex-align" onClick={() => { fetchNiftyDashboardData(); fetchLiveIndices(); }}>
            <RefreshCw size={14} style={{ marginRight: "6px" }} /> Refresh Prices
          </button>
        </div>
      </header>

      {/* Live Market Indices Section */}
      <section className="indices-panel glassmorphism">
        {loadingIndices ? (
          <div className="flex-align" style={{ justifyContent: "center", minHeight: "50px" }}>
            <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", marginRight: "10px", marginBottom: "0" }}></div>
            <span style={{ fontSize: "13px" }}>Loading Live Market Benchmarks...</span>
          </div>
        ) : (
          <div className="indices-grid">
            {liveIndices.map((idx) => (
              <div 
                key={idx.symbol}
                className={`index-card ${selectedSymbol === idx.symbol ? "active" : ""}`}
                onClick={() => setSelectedSymbol(idx.symbol)}
              >
                <div className="index-card-header flex-align" style={{ justifyContent: "space-between" }}>
                  <span className="index-name">{idx.name}</span>
                  <span className="index-symbol-tag">{idx.symbol}</span>
                </div>
                <div className="index-card-body flex-align" style={{ marginTop: "4px" }}>
                  <span className="index-price">
                    {idx.price ? idx.price.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}
                  </span>
                  <span className={`index-change flex-align ${idx.changePercent >= 0 ? "change-up" : "change-down"}`}>
                    {idx.changePercent >= 0 ? <TrendingUp size={14} style={{ marginRight: "4px" }} /> : <TrendingDown size={14} style={{ marginRight: "4px" }} />}
                    {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent ? idx.changePercent.toFixed(2) : "0.00"}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Top Nifty Showcase carousel */}
      <section className="nifty-panel glassmorphism">
        <div className="nifty-header">
          <h4>Top Nifty Index Constituents</h4>
          <span className="stock-sector">NSE Live Indices</span>
        </div>

        {loadingNifty ? (
          <div className="flex-align" style={{ justifyContent: "center", minHeight: "80px" }}>
            <div className="spinner" style={{ marginRight: "10px" }}></div>
            <span>Fetching live NSE board...</span>
          </div>
        ) : (
          <div className="nifty-grid">
            {niftyStocks.map((stock) => (
              <div 
                key={stock.symbol}
                className={`nifty-card ${selectedSymbol === stock.symbol ? "active" : ""}`}
                onClick={() => setSelectedSymbol(stock.symbol)}
              >
                <div className="nifty-card-top">
                  <span className="stock-symbol-badge">{stock.symbol.split(".")[0]}</span>
                  <span className="stock-sector">{stock.sector}</span>
                </div>
                <div className="nifty-card-price">
                  ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className={`nifty-card-change ${stock.changePercent >= 0 ? "change-up" : "change-down"}`}>
                  {stock.changePercent >= 0 ? <TrendingUp size={12} style={{ marginRight: "3px" }} /> : <TrendingDown size={12} style={{ marginRight: "3px" }} />}
                  {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Main Split-Screen Dashboard Panel */}
      <div className="dashboard-grid">
        
        {/* Left deep-dive column */}
        <main className="detail-panel glassmorphism">
          {loadingStock ? (
            <div className="ai-loader-container" style={{ minHeight: "450px", justifyContent: "center" }}>
              <div className="spinner"></div>
              <h4>Querying Exchange Nodes...</h4>
              <p>Fetching full depth transaction charts and tick metadata.</p>
            </div>
          ) : stockData ? (
            <>
              {/* Header metrics */}
              <div className="stock-title-section">
                <div className="stock-meta">
                  <h1>{stockData.name}</h1>
                  <div className="stock-meta-sub">
                    <span className="flex-align"><Building2 size={13} style={{ marginRight: "4px" }} /> {stockData.symbol}</span>
                    <span>•</span>
                    <span>Exchange: {stockData.exchange}</span>
                    <span>•</span>
                    <span>Currency: {stockData.currency}</span>
                  </div>
                </div>

                <div className="stock-price-section">
                  <div className="live-price-label">
                    {stockData.currency === "INR" ? "₹" : "$"}
                    {displayedPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`live-change-label ${diffMetrics.isPositive ? "change-up" : "change-down"}`}>
                    {diffMetrics.isPositive ? <TrendingUp size={16} style={{ marginRight: "4px" }} /> : <TrendingDown size={16} style={{ marginRight: "4px" }} />}
                    {diffMetrics.isPositive ? "+" : ""}
                    {diffMetrics.diff.toLocaleString("en-IN", { minimumFractionDigits: 2 })} 
                    ({diffMetrics.isPositive ? "+" : ""}
                    {diffMetrics.percent.toFixed(2)}%)
                    <span style={{ color: "var(--color-text-muted)", fontSize: "11px", fontWeight: "normal", marginLeft: "6px" }}>
                      {priceSource === "HOVERED" ? "[Hovered Date]" : "[Close]"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chart range switches */}
              <div className="chart-controls">
                <div className="timeframe-group">
                  {["1D", "5D", "1M", "6M", "1Y"].map((tf) => (
                    <button
                      key={tf}
                      className={`timeframe-btn ${timeframe === tf ? "active" : ""}`}
                      onClick={() => setTimeframe(tf)}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <button 
                  className="btn btn-secondary flex-align"
                  onClick={() => addToWatchlist(stockData.symbol)}
                  disabled={watchlist.includes(stockData.symbol)}
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  <Star size={12} fill={watchlist.includes(stockData.symbol) ? "#F59E0B" : "transparent"} stroke={watchlist.includes(stockData.symbol) ? "#F59E0B" : "currentColor"} style={{ marginRight: "6px" }} />
                  {watchlist.includes(stockData.symbol) ? "Saved in Watchlist" : "Pin to Watchlist"}
                </button>
              </div>

              {/* Responsive SVG Chart */}
              <StockChart 
                history={stockData.history}
                prevClose={stockData.prevClose}
                onHoverPrice={(point) => setHoveredPoint(point)}
              />

              {/* Technical indicators grid */}
              <div className="stats-grid">
                <div className="stat-card glass-inset">
                  <span className="stat-label">Previous Close</span>
                  <span className="stat-value">{stockData.currency === "INR" ? "₹" : "$"}{stockData.prevClose.toLocaleString("en-IN")}</span>
                </div>
                <div className="stat-card glass-inset">
                  <span className="stat-label">Today's High</span>
                  <span className="stat-value">{stockData.currency === "INR" ? "₹" : "$"}{stockData.high.toLocaleString("en-IN")}</span>
                </div>
                <div className="stat-card glass-inset">
                  <span className="stat-label">Today's Low</span>
                  <span className="stat-value">{stockData.currency === "INR" ? "₹" : "$"}{stockData.low.toLocaleString("en-IN")}</span>
                </div>
                <div className="stat-card glass-inset">
                  <span className="stat-label">52-Week High</span>
                  <span className="stat-value">{stockData.currency === "INR" ? "₹" : "$"}{stockData.fiftyTwoWeekHigh.toLocaleString("en-IN")}</span>
                </div>
                <div className="stat-card glass-inset">
                  <span className="stat-label">52-Week Low</span>
                  <span className="stat-value">{stockData.currency === "INR" ? "₹" : "$"}{stockData.fiftyTwoWeekLow.toLocaleString("en-IN")}</span>
                </div>
                <div className="stat-card glass-inset">
                  <span className="stat-label">Volume</span>
                  <span className="stat-value">{stockData.volume.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Live Market News Section */}
              <StockNews stock={stockData} />
            </>
          ) : (
            <div className="ai-empty-state" style={{ minHeight: "450px", justifyContent: "center" }}>
              <h4>No Stock Selected</h4>
              <p>Select a stock from the indices above or search for a custom ticker.</p>
            </div>
          )}
        </main>

        {/* Right watchlist and AI analysis column */}
        <aside className="side-panel">
          
          {/* AI Opinion Block */}
          {stockData && (
            <AiAnalysis 
              stock={stockData}
              apiKey={apiKey}
            />
          )}

          {/* Watchlist card */}
          <div className="watchlist-card glassmorphism">
            <div className="watchlist-header">
              <div className="flex-align">
                <Star size={16} fill="#F59E0B" stroke="#F59E0B" style={{ marginRight: "6px" }} />
                <h4>My Watchlist</h4>
              </div>
              <span className="stock-sector">{watchlist.length} pinned</span>
            </div>

            {watchlist.length === 0 ? (
              <div className="watchlist-empty">
                <Star size={24} className="icon-text-muted" style={{ marginBottom: "8px", opacity: 0.4 }} />
                <p>No symbols pinned yet.</p>
                <p style={{ fontSize: "10px", marginTop: "4px" }}>Click "Pin to Watchlist" on any stock.</p>
              </div>
            ) : (
              <div className="watchlist-list">
                {watchlistData.map((item) => (
                  <div 
                    key={item.symbol} 
                    className={`watchlist-item ${selectedSymbol === item.symbol ? "active" : ""}`}
                    onClick={() => setSelectedSymbol(item.symbol)}
                  >
                    <div className="watchlist-item-left">
                      <span className="watchlist-symbol">{item.symbol.split(".")[0]}</span>
                      <span className="watchlist-name">{item.name}</span>
                    </div>
                    <div className="watchlist-item-right">
                      <div>
                        <div className="watchlist-price">
                          ₹{item.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`watchlist-change ${item.changePercent >= 0 ? "change-up" : "change-down"}`}>
                          {item.changePercent >= 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
                        </div>
                      </div>
                      <button 
                        className="watchlist-remove-btn" 
                        onClick={(e) => removeFromWatchlist(item.symbol, e)}
                        title="Remove from watchlist"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

    </div>
  );
}
