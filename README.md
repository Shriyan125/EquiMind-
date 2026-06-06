# EquiMind — Premium Stock Intelligence Dashboard

EquiMind is a luxury, institutional-grade financial analytics dashboard combining real-time global stock tracking, high-performance interactive charting, live market intelligence news, and state-of-the-art qualitative AI opinion synthesis. Built with a pristine white-beige aesthetic, it bridges quantitative exchange metrics and hedge-fund-level qualitative reports into a unified terminal.

---

## Key Features

### 1. Market Benchmark Indices (Nifty & Bank Nifty Status)
* **Real-time Benchmarks**: Live benchmark indicators for **NIFTY 50** and **BANK NIFTY** pinned at the top of the dashboard.
* **Instant Market Status**: Displays current points, absolute change values, and percentage swings with color-coded positive/negative sentiment markers.
* **Interactive Navigation**: Clicking on NIFTY 50 or BANK NIFTY indices instantly loads their corresponding historical trend line on the main chart.

### 2. Unified Stacking & Morphing Search Console
* **Instant Autocomplete Suggestions**: Typing a query (like `"re"`) immediately filters an optimized local index of **40+ prominent Indian (NSE) and US (NASDAQ) tickers** in parallel with Yahoo Finance API lookups.
* **Cohesive Morphing Panel**: When suggestions appear, the search input and dropdown seamlessly merge. The input's bottom corners flatten while the dropdown attaches directly with no gap, creating a beautiful solid panel.
* **Tactile Hover Animations**: Options in the suggestion list slide smoothly to the right when hovered over, providing high-end feedback.
* **Stacking Context Correction**: Optimized using relative positioning and z-indexing to ensure the dropdown always renders cleanly in front of all page grids.

### 3. Multi-Timeframe AI Analytical Opinion Engine
* **Hedge-Fund Grade Intelligence**: Analyzes the stock across **three independent dimensions concurrently** to assess short-term volatility (5D), medium-term consolidation channels (1M), and long-term secular growth (1Y).
* **Groq LPU Acceleration**: Integrates with the Groq Chat Completion API using the rapid `llama-3.1-8b-instant` model to output clean, structured technical indicators, sentiment ratings (`Bullish`, `Bearish`, `Neutral`), actions (`BUY`, `SELL`, `HOLD`), pros/cons, and macro reports.
* **High-Fidelity Offline Simulator**: Implements a robust fallback engine powered by Brownian Motion mathematics that automatically generates aligned market evaluations when the network is restricted.
* **Persistent Sticking Context**: The AI report remains pinned on the screen as you switch between chart ranges, resetting only when you select a different stock.

### 4. Interactive AI Chatbot (Conversational Analyst)
* **Tabbed Interface**: Dynamically toggle between the structured **Macro Report** and a conversational **AI Chatbot** in the side panel.
* **Context-Aware Conversations**: Pre-seeds conversations with specific stock details. Automatically feeds current quote metrics (last trade, highs/lows, exchange, volume) and historical messages to the LLM.
* **Dynamic Local Responder**: Generates highly tailored mock responses using live price metrics when no API key is specified.
* **Enhanced Visual Formatting**: Custom parses markdown syntax (bolding, lists, linebreaks) to display answers in clean, readable chat bubbles.
* **Auto-Scroll HUD**: Smoothly scrolls threads downward when new messages are sent or received.

### 5. Interactive SVG Neon Charting Suite (with Technical Indicators)
* **Indicator Toggle Toolbar**: Integrated control toolbar to toggle indicators: **Volume**, **SMA (20)**, **EMA (20)**, and **RSI (14)**.
* **Volume overlay**: Semi-transparent volume bars (color-coded green/red by price direction) overlaying the bottom 15% of the price canvas.
* **SMA & EMA overlays**: Warm orange SMA and purple EMA lines calculated dynamically (scaling windows down for short histories to prevent breaks).
* **RSI Subplot Grid**: Splits layout dynamically when RSI is enabled, showing a subplot at the bottom with overbought (70), center (50), and oversold (30) limits.
* **Multi-Range Selection**: Supports timeframe ranges (`1D`, `5D`, `1M`, `6M`, `1Y`) with responsive canvas resizing.
* **Enriched Tooltip Crosshair**: Glowing crosshair overlay and circles. Tooltip displays live Price, SMA, EMA, RSI, and Volume metrics at the hovered index.

### 6. Live Ticker News Feed
* **Contextual Intelligence**: Dynamically queries and parses global press nodes using the Currents API to retrieve the latest news articles tailored to the selected stock.
* **Clean Query Parsing**: Automatically filters company names (stripping suffix abbreviations like "Ltd.", "Inc.", "Corp.") to generate precise news query keywords.
* **Rich Article Cards**: Renders news lists containing headline titles, summary descriptions, author attributes, readable relative publish times, and news thumbnail graphics.
* **Seamless Redundancy**: Falls back securely to a public proxy pipeline if direct fetch limits are reached or blocked.

### 7. Persistent Watchlist Showcase
* **NSE Live Indices Grid**: Displays live quotes of top Nifty 50 constituents (Reliance, TCS, HDFC, Infosys, SBI, etc.) directly in the header showcase.
* **LocalStorage Syncing**: Save your favorite equities to a personalized watchlist that saves automatically to browser storage.
* **Live Quotes Updating**: Watchlist entries fetch live quote updates dynamically to keep quotes in sync.

---

## Technical Stack
* **Framework**: React 19 (Functional Components, Hooks)
* **Dev Server & Bundler**: Vite 8
* **Styling System**: Pure CSS3 utilizing elegant light HSL and ivory root variables (`#F4F1EA`) with radial accent overlays
* **Iconography**: Lucide React
* **Data Layer**: Yahoo Finance API routed through a custom same-origin proxy (`/api-yahoo`), using Vite dev proxy in local development and Vercel server-side Edge Rewrites in production to bypass CORS safely.
* **News Intelligence**: Currents API client integrated with keyword sanitization and dynamic CORS proxy fallbacks.
* **AI Engine**: Groq Chat Completions API (`llama-3.1-8b-instant`) for structured reports and conversational chat assistance.

---

## File Structure

```text
├── src/
│   ├── components/
│   │   ├── AiAnalysis.jsx    # Parallel AI macro analyst & conversational chatbot
│   │   ├── StockChart.jsx    # Interactive SVG neon charting & indicators overlay
│   │   └── StockNews.jsx     # Live contextual ticker news parser
│   ├── services/
│   │   └── yahooFinance.js   # Exchange data provider & rich local listing
│   ├── App.jsx               # Dashboard grid & layout entry point
│   ├── index.css             # Unified premium white-beige design system
│   └── main.jsx              # React mounting root
├── public/
├── index.html
├── package.json
├── vercel.json               # Edge rewrite configuration for CORS bypass
└── vite.config.js
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
To unlock live Groq LPU evaluations and news fetches, create a `.env` file in the root directory:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_WORLD_NEWS_API_KEY=your_currents_news_api_key_here
```
*(If no API key is specified, the application will automatically activate its internal high-fidelity mock simulator so you can fully explore the dashboard, and use the default built-in key for news retrieval.)*

### 3. Start Development Server
```bash
npm run dev
```

### 4. Compile Production Build
```bash
npm run build
```
The production bundle will compile in a fraction of a second inside the `dist/` directory, optimized with minified styles and compressed assets.
