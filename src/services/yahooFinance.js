// We define a list of public proxies and a helper to rotate through them if one is blocked or rate-limited
async function fetchFromYahoo(path) {
  const targetUrl = `https://query1.finance.yahoo.com${path}`;
  const isDev = import.meta.env.DEV;
  
  const attempts = [];
  
  // 1. Prioritize Vite local dev proxy when running in development mode
  if (isDev) {
    attempts.push(`/api-yahoo${path}`);
  }
  
  // 2. Add public proxy mirrors
  attempts.push(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
  attempts.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
  attempts.push(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
  attempts.push(targetUrl); // Direct request fallback
  
  let lastError = null;
  for (const url of attempts) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        // Verify we got the actual JSON payload and not a proxy home page HTML
        if (text.includes("chart") || text.includes("quotes") || text.includes("result")) {
          return JSON.parse(text);
        }
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All Yahoo Finance proxy pipelines failed.");
}

export const TOP_NIFTY_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd.", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd.", sector: "IT Services" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd.", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys Ltd.", sector: "IT Services" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd.", sector: "Banking" },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd.", sector: "Telecom" },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd.", sector: "Construction" },
  { symbol: "ITC.NS", name: "ITC Ltd.", sector: "Consumer Goods" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd.", sector: "Consumer Goods" }
];

export const ALL_POPULAR_STOCKS = [
  ...TOP_NIFTY_STOCKS,
  { symbol: "WIPRO.NS", name: "Wipro Ltd.", sector: "IT Services", exchange: "NSE" },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors Ltd.", sector: "Automobile", exchange: "NSE" },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra Ltd.", sector: "Automobile", exchange: "NSE" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank Ltd.", sector: "Banking", exchange: "NSE" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd.", sector: "Banking", exchange: "NSE" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd.", sector: "Consumer Goods", exchange: "NSE" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India Ltd.", sector: "Automobile", exchange: "NSE" },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical Industries Ltd.", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies Ltd.", sector: "IT Services", exchange: "NSE" },
  { symbol: "ADANIENT.NS", name: "Adani Enterprises Ltd.", sector: "Conglomerate", exchange: "NSE" },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance Ltd.", sector: "Financial Services", exchange: "NSE" },
  { symbol: "BAJAJFINSV.NS", name: "Bajaj Finserv Ltd.", sector: "Financial Services", exchange: "NSE" },
  { symbol: "NTPC.NS", name: "NTPC Ltd.", sector: "Energy", exchange: "NSE" },
  { symbol: "ONGC.NS", name: "Oil & Natural Gas Corporation Ltd.", sector: "Energy", exchange: "NSE" },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation of India Ltd.", sector: "Energy", exchange: "NSE" },
  { symbol: "COALINDIA.NS", name: "Coal India Ltd.", sector: "Energy", exchange: "NSE" },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel Ltd.", sector: "Metal", exchange: "NSE" },
  { symbol: "TATASTEEL.NS", name: "Tata Steel Ltd.", sector: "Metal", exchange: "NSE" },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement Ltd.", sector: "Construction", exchange: "NSE" },
  { symbol: "GRASIM.NS", name: "Grasim Industries Ltd.", sector: "Conglomerate", exchange: "NSE" },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories Ltd.", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "CIPLA.NS", name: "Cipla Ltd.", sector: "Pharmaceuticals", exchange: "NSE" },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp Ltd.", sector: "Automobile", exchange: "NSE" },
  { symbol: "EICHERMOT.NS", name: "Eicher Motors Ltd.", sector: "Automobile", exchange: "NSE" },
  { symbol: "BPCL.NS", name: "Bharat Petroleum Corporation Ltd.", sector: "Energy", exchange: "NSE" },
  { symbol: "INDUSINDBK.NS", name: "IndusInd Bank Ltd.", sector: "Banking", exchange: "NSE" },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries Ltd.", sector: "Metal", exchange: "NSE" },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports & SEZ Ltd.", sector: "Infrastructure", exchange: "NSE" },
  { symbol: "TITAN.NS", name: "Titan Company Ltd.", sector: "Consumer Goods", exchange: "NSE" },
  { symbol: "APOLLOHOSP.NS", name: "Apollo Hospitals Enterprise Ltd.", sector: "Healthcare", exchange: "NSE" },
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automobile", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Entertainment", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", sector: "Technology", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology", exchange: "NASDAQ" }
];

/**
 * Fetch detailed quote and historical price series for a symbol
 * @param {string} symbol The stock symbol (e.g. RELIANCE.NS, AAPL)
 * @param {string} range Timeframe range (1D, 5D, 1M, 6M, 1Y)
 */
export async function fetchStockData(symbol, range = "1M") {
  let interval = "1d";
  let yRange = "1mo";
  
  const normalizedRange = range.toUpperCase();
  if (normalizedRange === "1D") {
    yRange = "1d";
    interval = "5m"; // 5 minute bars
  } else if (normalizedRange === "5D") {
    yRange = "5d";
    interval = "15m"; // 15 minute bars
  } else if (normalizedRange === "1M" || normalizedRange === "1MO") {
    yRange = "1mo";
    interval = "1d";
  } else if (normalizedRange === "6M") {
    yRange = "6mo";
    interval = "1d";
  } else if (normalizedRange === "1Y") {
    yRange = "1y";
    interval = "1d";
  }

  try {
    const path = `/v8/finance/chart/${symbol}?range=${yRange}&interval=${interval}`;
    const data = await fetchFromYahoo(path);
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error("No data returned from Yahoo Finance");
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0] || {};
    const closes = quote.close || [];
    
    // Clean up close price array and timestamps (removing null values)
    const history = timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000),
      price: closes[index] !== null && closes[index] !== undefined 
        ? parseFloat(closes[index].toFixed(2)) 
        : null
    })).filter(item => item.price !== null);

    // If history is empty but a regular market price exists, add a placeholder point
    if (history.length === 0 && meta.regularMarketPrice) {
      history.push({
        date: new Date(),
        price: meta.regularMarketPrice
      });
    }

    const latestPrice = meta.regularMarketPrice || (history.length > 0 ? history[history.length - 1].price : 0);
    const prevClose = meta.previousClose || meta.chartPreviousClose || latestPrice;
    
    return {
      symbol: meta.symbol || symbol.toUpperCase(),
      name: meta.longName || TOP_NIFTY_STOCKS.find(s => s.symbol === symbol)?.name || symbol.split('.')[0],
      price: latestPrice,
      prevClose: prevClose,
      high: meta.regularMarketDayHigh || latestPrice,
      low: meta.regularMarketDayLow || latestPrice,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || latestPrice,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || latestPrice,
      volume: meta.regularMarketVolume || 0,
      exchange: meta.fullExchangeName || (symbol.endsWith(".NS") ? "NSE" : "NASDAQ"),
      currency: meta.currency || (symbol.endsWith(".NS") ? "INR" : "USD"),
      history: history
    };
  } catch (error) {
    console.warn(`[YahooFinance Service] Failed fetching real-time data for ${symbol}, falling back to mock data:`, error.message);
    return getMockStockData(symbol, range);
  }
}

/**
 * Autocomplete search for stock symbols
 * @param {string} query Search term
 */
export async function searchStocks(query) {
  if (!query || query.trim().length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  
  // 1. Get all matches from our comprehensive local database of popular stocks
  const localMatches = ALL_POPULAR_STOCKS.filter(stock => 
    stock.symbol.toLowerCase().includes(lowerQuery) || 
    stock.name.toLowerCase().includes(lowerQuery)
  ).map(stock => ({
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.exchange || "NSE",
    type: "EQUITY"
  }));
  
  // 2. Fetch from Yahoo Finance API for global search as well
  let apiMatches = [];
  try {
    const path = `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=12&newsCount=0`;
    const data = await fetchFromYahoo(path);
    if (data.quotes) {
      apiMatches = data.quotes
        .filter(q => q.quoteType === "EQUITY" || q.quoteType === "ETF")
        .map(q => ({
          symbol: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchange: q.exchDisp || q.exchange || "NSE",
          type: q.quoteType
        }));
    }
  } catch (error) {
    console.warn("[YahooFinance Service] API search failed, relying on rich local index.");
  }
  
  // 3. Combine both lists, removing duplicates based on symbol
  const combined = [...localMatches];
  const seenSymbols = new Set(localMatches.map(m => m.symbol.toUpperCase()));
  
  for (const item of apiMatches) {
    const symUpper = item.symbol.toUpperCase();
    if (!seenSymbols.has(symUpper)) {
      seenSymbols.add(symUpper);
      combined.push(item);
    }
  }
  
  // Return the first 8-10 high-quality suggestions
  return combined.slice(0, 10);
}

/**
 * Geometric Brownian Motion generator for highly realistic fallback stock data
 */
function getMockStockData(symbol, range) {
  const stockInfo = ALL_POPULAR_STOCKS.find(s => s.symbol.toUpperCase() === symbol.toUpperCase()) || {
    symbol: symbol,
    name: symbol.split('.')[0].toUpperCase() + " Corp",
    sector: "Technology"
  };
  
  const basePrices = {
    "RELIANCE.NS": 2450.50,
    "TCS.NS": 3820.75,
    "HDFCBANK.NS": 1610.20,
    "INFY.NS": 1430.40,
    "ICICIBANK.NS": 1120.90,
    "SBIN.NS": 830.15,
    "BHARTIARTL.NS": 1380.00,
    "LT.NS": 3540.25,
    "ITC.NS": 435.60,
    "HINDUNILVR.NS": 2350.10
  };
  
  const basePrice = basePrices[symbol.toUpperCase()] || 150.00;
  
  let pointsCount = 30;
  let intervalDays = 1;
  const normalizedRange = range.toUpperCase();
  
  if (normalizedRange === "1D") {
    pointsCount = 40; 
    intervalDays = 1 / 40;
  } else if (normalizedRange === "5D") {
    pointsCount = 50;
    intervalDays = 5 / 50;
  } else if (normalizedRange === "1M" || normalizedRange === "1MO") {
    pointsCount = 30;
    intervalDays = 1;
  } else if (normalizedRange === "6M") {
    pointsCount = 90;
    intervalDays = 2;
  } else if (normalizedRange === "1Y") {
    pointsCount = 180;
    intervalDays = 365 / 180;
  }

  const history = [];
  // Give it a slightly random starting base price
  let currentPrice = basePrice * (0.95 + Math.random() * 0.1);
  const volatility = normalizedRange === "1D" ? 0.004 : 0.015;
  const drift = 0.0003; 
  const now = new Date();
  
  for (let i = pointsCount; i >= 0; i--) {
    const date = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000);
    const changePercent = drift + volatility * (Math.random() - 0.47); 
    currentPrice = currentPrice * (1 + changePercent);
    history.push({
      date: date,
      price: parseFloat(currentPrice.toFixed(2))
    });
  }

  const latestPrice = history[history.length - 1].price;
  // Get close price from index that matches yesterday
  const prevCloseIndex = history.length > 2 ? history.length - 2 : 0;
  const prevClose = history[prevCloseIndex].price;
  
  const prices = history.map(h => h.price);
  const high = Math.max(...prices) * 1.001;
  const low = Math.min(...prices) * 0.999;
  
  return {
    symbol: symbol.toUpperCase(),
    name: stockInfo.name,
    price: latestPrice,
    prevClose: prevClose,
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    fiftyTwoWeekHigh: parseFloat((basePrice * 1.3).toFixed(2)),
    fiftyTwoWeekLow: parseFloat((basePrice * 0.8).toFixed(2)),
    volume: Math.floor(500000 + Math.random() * 2500000),
    exchange: symbol.endsWith(".NS") ? "NSE" : "NASDAQ",
    currency: symbol.endsWith(".NS") ? "INR" : "USD",
    history: history
  };
}
