import React, { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowUpCircle, ArrowDownCircle, AlertCircle, HelpCircle, Check, X, Shield, Send, MessageSquare, FileText } from "lucide-react";
import { fetchStockData } from "../services/yahooFinance";

export default function AiAnalysis({ stock, apiKey }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  
  // Tab control state: "report" or "chat"
  const [activeTab, setActiveTab] = useState("report");
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Reset analysis when selected stock symbol or key changes
  useEffect(() => {
    setAnalysis(null);
    setError(null);
  }, [stock?.symbol, apiKey]);

  // Seed chat welcoming message when selected stock changes
  useEffect(() => {
    if (stock) {
      setMessages([
        {
          role: "assistant",
          content: `Hello! I am your **EquiMind AI Assistant**. I have analyzed **${stock.name} (${stock.symbol})** and loaded the live indicators. 
          
Ask me anything about its buying triggers, target projections, sector risks, or moving averages!`
        }
      ]);
    }
  }, [stock?.symbol]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (activeTab === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const generateAnalysis = async () => {
    if (!stock) return;
    
    setLoading(true);
    setError(null);

    // Fetch 5D, 1M, and 1Y price series in parallel for multi-timeframe analysis
    let shortTerm = null;
    let mediumTerm = null;
    let longTerm = null;
    
    try {
      const [sData, mData, lData] = await Promise.all([
        fetchStockData(stock.symbol, "5D"),
        fetchStockData(stock.symbol, "1M"),
        fetchStockData(stock.symbol, "1Y")
      ]);
      shortTerm = sData;
      mediumTerm = mData;
      longTerm = lData;
    } catch (err) {
      console.warn("Failed fetching multi-timeframe data, falling back to active dataset:", err);
      shortTerm = stock;
      mediumTerm = stock;
      longTerm = stock;
    }

    // If no Groq API Key is configured, fall back to our high-fidelity simulator!
    if (!apiKey) {
      setTimeout(() => {
        setAnalysis(getMockAnalysis(stock, shortTerm, mediumTerm, longTerm));
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const shortChange = ((shortTerm.price - shortTerm.history[0].price) / shortTerm.history[0].price) * 100;
      const mediumChange = ((mediumTerm.price - mediumTerm.history[0].price) / mediumTerm.history[0].price) * 100;
      const longChange = ((longTerm.price - longTerm.history[0].price) / longTerm.history[0].price) * 100;

      const prompt = `You are a professional financial analyst and hedge fund manager.
Perform a rigorous stock analysis for the following stock data:
- Ticker Symbol: ${stock.symbol}
- Company Name: ${stock.name}
- Current Market Price: ${stock.currency} ${stock.price}
- Daily Range: High: ${stock.high}, Low: ${stock.low}
- Trading Volume: ${stock.volume.toLocaleString()}
- Exchange: ${stock.exchange}

Multi-Timeframe Trend Performance Analysis:
1. Short-Term Performance (Last 5 Days):
   - Return: ${shortChange.toFixed(2)}%
   - 5D High: ${stock.currency} ${Math.max(...shortTerm.history.map(h => h.price))}
   - 5D Low: ${stock.currency} ${Math.min(...shortTerm.history.map(h => h.price))}
   
2. Medium-Term Performance (Last Month):
   - Return: ${mediumChange.toFixed(2)}%
   - 1M High: ${stock.currency} ${Math.max(...mediumTerm.history.map(h => h.price))}
   - 1M Low: ${stock.currency} ${Math.min(...mediumTerm.history.map(h => h.price))}
   
3. Long-Term Performance (Last Year):
   - Return: ${longChange.toFixed(2)}%
   - 1Y High: ${stock.currency} ${Math.max(...longTerm.history.map(h => h.price))}
   - 1Y Low: ${stock.currency} ${Math.min(...longTerm.history.map(h => h.price))}

Please provide a single structured, comprehensive, professional, unbiased market opinion in the following JSON format:
{
  "sentiment": "Bullish" | "Bearish" | "Neutral",
  "technicalStrength": 0-100 score (integer),
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidenceScore": 0-100 score (integer),
  "riskRating": "Low" | "Medium" | "High",
  "pros": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "cons": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "opinion": "A highly detailed, 3-4 sentence macro opinion on the stock based on its short-term momentum, medium-term consolidation channels, long-term secular growth trajectory, volume dynamics, and multi-timeframe chart alignment."
}
Return ONLY the raw JSON. Do not include markdown code block syntax (like \`\`\`json).`;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Groq API Error (HTTP ${response.status})`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      
      if (!rawText) {
        throw new Error("Empty response from Groq AI engine.");
      }

      const parsedData = JSON.parse(rawText.trim());
      setAnalysis({ ...parsedData, isMock: false });
    } catch (err) {
      console.error("Groq AI Analysis failed:", err);
      setError("Failed to generate AI opinion. Fallback to simulator loaded.");
      setAnalysis(getMockAnalysis(stock, shortTerm, mediumTerm, longTerm));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userMsg = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setChatLoading(true);

    if (!apiKey) {
      // Offline mock responses
      setTimeout(() => {
        const reply = getMockChatResponse(stock, userMsg.content);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setChatLoading(false);
      }, 1000);
      return;
    }

    try {
      const systemMessage = {
        role: "system",
        content: `You are EquiMind Assistant, a professional financial advisor and hedge fund analyst.
You are helping a client analyze the stock "${stock.name}" (${stock.symbol}) on the ${stock.exchange} exchange.
Current market price is ${stock.currency} ${stock.price}.
Daily High: ${stock.high}, Daily Low: ${stock.low}, Volume: ${stock.volume.toLocaleString()}.
Exchange: ${stock.exchange}, Currency: ${stock.currency}.
The previous close was ${stock.prevClose}.

Provide professional, accurate, and direct financial analysis. Use markdown formatting (like bold text or bullet lists) to make your answers easy to read. Be objective, highlighting both growth catalysts and risks. Avoid generic answers. Keep responses concise (under 4 sentences).`
      };

      const recentMessages = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [systemMessage, ...recentMessages, { role: "user", content: userMsg.content }],
            temperature: 0.5,
            max_tokens: 300
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Groq API Error (HTTP ${response.status})`);
      }

      const data = await response.json();
      const replyText = data.choices?.[0]?.message?.content;
      
      if (!replyText) {
        throw new Error("No response from Groq AI chat engine.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: replyText.trim() }]);
    } catch (err) {
      console.error("Chat message generation failed:", err);
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: `⚠️ Sorry, I encountered an error while connecting to the Groq LPU engine: **${err.message}**. Let me answer based on local indicators instead:\n\n${getMockChatResponse(stock, userMsg.content)}` 
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Basic markdown bold & list renderer to format replies inside JSX
  const formatMessageText = (text) => {
    if (!text) return "";
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return formatted.split("\n").map((line, index) => {
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={index} style={{ marginLeft: "14px", listStyleType: "disc", margin: "4px 0" }}
              dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }} />
        );
      }
      return (
        <p key={index} style={{ margin: "6px 0", lineHeight: "1.4" }}
           dangerouslySetInnerHTML={{ __html: line }} />
      );
    });
  };

  const getRecommendationBadgeColor = (rec) => {
    switch (rec?.toUpperCase()) {
      case "BUY":
        return "badge-buy";
      case "SELL":
        return "badge-sell";
      default:
        return "badge-hold";
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toUpperCase()) {
      case "HIGH":
        return "#EF4444";
      case "MEDIUM":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  return (
    <div className="ai-analysis-hub glassmorphism">
      {/* Tab Select Header */}
      <div className="ai-hub-tabs-header">
        <button 
          className={`ai-tab-btn ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          <FileText size={14} style={{ marginRight: "6px" }} />
          Macro Report
        </button>
        <button 
          className={`ai-tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <MessageSquare size={14} style={{ marginRight: "6px" }} />
          AI Chatbot
        </button>
      </div>

      {/* 1. REPORT TAB CONTENT */}
      {activeTab === "report" && (
        <>
          <div className="ai-hub-header" style={{ marginTop: "12px" }}>
            <div className="ai-title flex-align">
              <Sparkles size={18} className="icon-pulse icon-blue" />
              <h3 style={{ marginLeft: "8px" }}>AI Analytical Opinion</h3>
            </div>
            {!analysis && !loading && (
              <button className="btn btn-primary flex-align" onClick={generateAnalysis}>
                <Sparkles size={16} style={{ marginRight: "6px" }} /> Analyze {stock?.symbol}
              </button>
            )}
          </div>

          {loading && (
            <div className="ai-loader-container">
              <div className="ai-pulsing-circle">
                <Sparkles size={32} className="ai-loading-spark" />
              </div>
              <h4>Deep-learning Groq Models...</h4>
              <p>Synthesizing technical sparklines, moving averages, and volatility ratios at LPU speeds.</p>
            </div>
          )}

          {error && analysis && (
            <div className="ai-alert-banner warning">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {!analysis && !loading && (
            <div className="ai-empty-state">
              <Sparkles size={48} className="icon-text-muted" style={{ marginBottom: "16px" }} />
              <h4>Ready for Groq LPU Intelligence</h4>
              <p>
                Trigger our institutional Llama 3 model to extract price triggers, weigh trend momentum, 
                and output mathematical trade indicators.
              </p>
              {!apiKey && (
                <div style={{ marginTop: "12px", color: "var(--color-text-muted)", fontSize: "12px" }}>
                  Pre-configured simulator connection active.
                </div>
              )}
            </div>
          )}

          {analysis && !loading && (
            <div className="ai-opinion-results">
              {analysis.isMock && !error && (
                <div className="ai-alert-banner info">
                  <Shield size={16} />
                  <span>
                    Note: Running index trend simulation metrics for {stock?.symbol}.
                  </span>
                </div>
              )}

              <div className="ai-metrics-row">
                <div className="ai-metric-card glass-inset">
                  <span className="metric-label">Decision Recommendation</span>
                  <span className={`recommendation-badge ${getRecommendationBadgeColor(analysis.recommendation)}`}>
                    {analysis.recommendation}
                  </span>
                </div>

                <div className="ai-metric-card glass-inset">
                  <span className="metric-label">Market Sentiment</span>
                  <div className="flex-align" style={{ marginTop: "4px" }}>
                    {analysis.sentiment?.toUpperCase() === "BULLISH" ? (
                      <ArrowUpCircle size={20} stroke="#10B981" fill="rgba(16, 185, 129, 0.1)" />
                    ) : analysis.sentiment?.toUpperCase() === "BEARISH" ? (
                      <ArrowDownCircle size={20} stroke="#EF4444" fill="rgba(239, 68, 68, 0.1)" />
                    ) : (
                      <HelpCircle size={20} stroke="#9CA3AF" />
                    )}
                    <span 
                      className="sentiment-value" 
                      style={{
                        color: analysis.sentiment?.toUpperCase() === "BULLISH" ? "#10B981" : 
                               analysis.sentiment?.toUpperCase() === "BEARISH" ? "#EF4444" : "#9CA3AF",
                        marginLeft: "6px",
                        fontWeight: "700"
                      }}
                    >
                      {analysis.sentiment}
                    </span>
                  </div>
                </div>

                <div className="ai-metric-card glass-inset">
                  <span className="metric-label">Technical Strength</span>
                  <div className="gauge-container" style={{ marginTop: "8px" }}>
                    <div className="gauge-track">
                      <div 
                        className="gauge-fill" 
                        style={{ 
                          width: `${analysis.technicalStrength}%`,
                          background: `linear-gradient(to right, #EF4444, #F59E0B, #10B981)`
                        }}
                      />
                    </div>
                    <span className="gauge-value">{analysis.technicalStrength}/100</span>
                  </div>
                </div>

                <div className="ai-metric-card glass-inset">
                  <span className="metric-label">Risk Rating</span>
                  <span 
                    className="risk-rating" 
                    style={{ color: getRiskColor(analysis.riskRating), fontWeight: "800", marginTop: "4px", fontSize: "16px" }}
                  >
                    {analysis.riskRating?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="ai-opinion-narration glass-inset">
                <h4>Macro Opinion</h4>
                <p>{analysis.opinion}</p>
              </div>

              <div className="ai-pros-cons-grid">
                <div className="pc-card pros glass-inset">
                  <h5 className="flex-align">
                    <Check size={16} stroke="#10B981" style={{ marginRight: "6px" }} />
                    Key Buying Triggers
                  </h5>
                  <ul>
                    {analysis.pros?.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>

                <div className="pc-card cons glass-inset">
                  <h5 className="flex-align">
                    <X size={16} stroke="#EF4444" style={{ marginRight: "6px" }} />
                    Risk Considerations
                  </h5>
                  <ul>
                    {analysis.cons?.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="ai-opinion-results-footer" style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                <button className="btn btn-secondary flex-align" onClick={generateAnalysis}>
                  <Sparkles size={14} style={{ marginRight: "6px" }} /> Regenerate Opinion
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. CHATBOT TAB CONTENT */}
      {activeTab === "chat" && (
        <div className="ai-chat-interface">
          <div className="chat-thread-container">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message-bubble ${msg.role}`}>
                <div className="message-header-label">
                  {msg.role === "assistant" ? "EquiMind AI" : "You"}
                </div>
                <div className="message-body">
                  {formatMessageText(msg.content)}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-message-bubble assistant">
                <div className="message-header-label">EquiMind AI</div>
                <div className="typing-loader">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              className="chat-text-input"
              placeholder={`Ask about support, indicators, or targets for ${stock?.symbol}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={chatLoading}
            />
            <button 
              type="submit" 
              className="chat-send-btn"
              disabled={!inputMessage.trim() || chatLoading}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function getMockAnalysis(stock, shortTerm, mediumTerm, longTerm) {
  const shortHistory = shortTerm?.history || stock.history;
  const mediumHistory = mediumTerm?.history || stock.history;
  const longHistory = longTerm?.history || stock.history;

  const shortChange = shortHistory.length > 0 ? ((stock.price - shortHistory[0].price) / shortHistory[0].price) * 100 : 0;
  const mediumChange = mediumHistory.length > 0 ? ((stock.price - mediumHistory[0].price) / mediumHistory[0].price) * 100 : 0;
  const longChange = longHistory.length > 0 ? ((stock.price - longHistory[0].price) / longHistory[0].price) * 100 : 0;

  const isPositive = longChange >= 0;
  
  let sentiment = isPositive ? "Bullish" : "Bearish";
  let recommendation = isPositive ? "BUY" : "HOLD";
  if (Math.abs(longChange) < 3) {
    sentiment = "Neutral";
    recommendation = "HOLD";
  }
  
  const technicalStrength = Math.round(isPositive ? 65 + Math.random() * 25 : 20 + Math.random() * 30);
  const confidenceScore = Math.round(75 + Math.random() * 15);
  const riskRating = Math.random() > 0.65 ? "High" : (Math.random() > 0.35 ? "Medium" : "Low");
  
  const pros = isPositive 
    ? [
        `Strong long-term secular growth trajectory (+${longChange.toFixed(2)}% over 1Y).`,
        `Robust medium-term consolidation (+${mediumChange.toFixed(2)}% over 1M) indicating healthy support bases.`,
        `Positive short-term momentum (+${shortChange.toFixed(2)}% over 5D) suggesting near-term buying pressure.`
      ]
    : [
        `Long-term discount value (${Math.abs(longChange).toFixed(2)}% lower over 1Y) presents an attractive DCA target.`,
        `Low risk-reward consolidation phase in short-term (${shortChange.toFixed(2)}% over 5D).`,
        `Strong structural backing from exchange indexing cushions downside risk.`
      ];

  const cons = isPositive
    ? [
        `Overbought warnings on short-term indices (5D return of +${shortChange.toFixed(2)}%).`,
        `Trading near yearly resistances, suggesting potential profit-taking windows.`,
        `Short-term divergence between price gains and daily volume triggers.`
      ]
    : [
        `Negative momentum cross on long-term charts (-${Math.abs(longChange).toFixed(2)}% over 1Y).`,
        `Near-term consolidation channel (-${Math.abs(mediumChange).toFixed(2)}% over 1M) indicates high buy-side patience is required.`,
        `Volatility spikes under volume pressure could test short-term support levels.`
      ];

  const opinion = isPositive
    ? `${stock.name} (${stock.symbol}) is demonstrating a stellar multi-timeframe bullish alignment. The stock displays robust long-term growth (+${longChange.toFixed(2)}% YoY) supported by a clean, ascending medium-term channel (+${mediumChange.toFixed(2)}% MoM) and short-term accumulation momentum (+${shortChange.toFixed(2)}% 5D). A high-confidence market leader; accumulation on minor pullbacks is advised.`
    : `${stock.name} (${stock.symbol}) is currently navigating a primary downward trend on the long-term scale (-${Math.abs(longChange).toFixed(2)}% YoY). Although the short-term and medium-term ranges (${shortChange.toFixed(2)}% 5D / ${mediumChange.toFixed(2)}% 1M) point to a stabilizing accumulation phase, long-term technical indicators suggest a cautious entry. A structured Dollar-Cost-Average (DCA) strategy is recommended to accumulate at these discount valuations.`;

  return {
    sentiment,
    technicalStrength,
    recommendation,
    confidenceScore,
    riskRating,
    pros,
    cons,
    opinion,
    isMock: true
  };
}

const getMockChatResponse = (stock, userMessage) => {
  const msg = userMessage.toLowerCase();
  if (msg.includes("buy") || msg.includes("sell") || msg.includes("hold") || msg.includes("recommend")) {
    return `Based on our current trend analysis for **${stock.name}** (${stock.symbol}), the stock shows a structural pattern supporting a **HOLD** to **ACCUMULATE** rating. The price of **${stock.currency} ${stock.price}** is consolidating near historical indicators. We recommend setting a buy limit near day low: **${stock.currency} ${stock.low}** and tracking the SMA (20) level.`;
  }
  if (msg.includes("target") || msg.includes("price") || msg.includes("go up") || msg.includes("future")) {
    return `For **${stock.name}** (${stock.symbol}), short-term resistance is positioned at **${stock.currency} ${(stock.price * 1.05).toFixed(2)}** (approx +5% from current levels), while strong support is identified at **${stock.currency} ${(stock.price * 0.95).toFixed(2)}**. A breakout above resistance on high volume would validate a target projection of **${stock.currency} ${(stock.price * 1.12).toFixed(2)}**.`;
  }
  if (msg.includes("risk") || msg.includes("danger") || msg.includes("bad") || msg.includes("drop")) {
    return `Key risk factors for **${stock.name}** (${stock.symbol}) include elevated volatility on the daily chart and potential margin pressure from macroeconomic headwinds in the sector. Additionally, trading volumes have shown minor divergence from price moves, indicating potential fatigue. Keep an eye on support at **${stock.currency} ${stock.low}**.`;
  }
  return `I have analyzed **${stock.name}** (${stock.symbol}) at the current price of **${stock.currency} ${stock.price}**. The volume of **${stock.volume.toLocaleString()}** shows steady market interest. Ask me about support/resistance levels, buying triggers, sector risks, or price target projections! *(To unlock advanced deep-learning evaluations, please configure your Groq API key in the settings).*`;
};
