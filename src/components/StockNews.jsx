import React, { useState, useEffect } from "react";
import { Newspaper, ExternalLink, User, AlertCircle, Clock } from "lucide-react";

export default function StockNews({ stock }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stock || !stock.symbol) {
      setNews([]);
      return;
    }

    const getCleanSearchQuery = (name, symbol) => {
      if (!name) return symbol;
      let query = name
        .replace(/\b(Ltd\.?|Limited|Corp\.?|Corporation|Inc\.?|Co\.?|Incorporated)\b/gi, "")
        .trim();
      return query || symbol;
    };

    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      
      const cleanName = getCleanSearchQuery(stock.name, stock.symbol);
      const apiUrl = `https://api.worldnewsapi.com/search-news?text=${encodeURIComponent(cleanName)}&number=10&sort=publish-time&sort-direction=DESC&language=en&api-key=8f98b99b2edc459f9aa20ab6adeb0328`;
      
      try {
        let response = await fetch(apiUrl);
        if (!response.ok) {
          // Fallback through CORS proxy if direct fetch is blocked
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
          response = await fetch(proxyUrl);
        }

        if (!response.ok) {
          throw new Error(`News API response error (HTTP ${response.status})`);
        }

        const data = await response.json();
        if (data && data.news) {
          setNews(data.news);
        } else {
          setNews([]);
        }
      } catch (err) {
        console.warn("[StockNews] Failed fetching news: ", err.message);
        setError("Unable to retrieve live market intelligence for this stock.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [stock?.symbol]);

  const formatPublishDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr.replace(" ", "T")); // Handle date format nicely
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (!stock) return null;

  return (
    <div className="stock-news-section glassmorphism mt-4">
      <div className="news-header flex-align">
        <Newspaper size={20} className="icon-blue" />
        <h3 style={{ marginLeft: "8px" }}>Live Market News: <span style={{ color: "var(--color-primary)" }}>{stock.name}</span></h3>
      </div>

      {loading ? (
        <div className="news-loader flex-align" style={{ justifyContent: "center", padding: "40px 20px" }}>
          <div className="spinner" style={{ marginRight: "10px" }}></div>
          <span>Parsing global press nodes...</span>
        </div>
      ) : error ? (
        <div className="ai-alert-banner warning" style={{ margin: "20px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : news.length === 0 ? (
        <div className="news-empty-state" style={{ padding: "40px 20px", textAlignment: "center" }}>
          <Newspaper size={36} className="icon-text-muted" style={{ marginBottom: "12px", opacity: 0.4 }} />
          <p>No recent news articles catalogued for this ticker.</p>
          <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Search activity remains active on secondary global nodes.
          </p>
        </div>
      ) : (
        <div className="news-list">
          {news.map((item) => (
            <div key={item.id} className="news-item glass-inset">
              <div className="news-item-content">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="news-item-title flex-align"
                >
                  <span>{item.title}</span>
                  <ExternalLink size={12} className="external-link-icon" style={{ marginLeft: "6px", flexShrink: 0 }} />
                </a>
                
                {item.summary && (
                  <p className="news-item-summary">{item.summary}</p>
                )}
                
                <div className="news-item-meta flex-align">
                  {item.publish_date && (
                    <span className="meta-tag flex-align">
                      <Clock size={11} style={{ marginRight: "4px" }} />
                      {formatPublishDate(item.publish_date)}
                    </span>
                  )}
                  {item.authors && item.authors.length > 0 && (
                    <span className="meta-tag flex-align">
                      <User size={11} style={{ marginRight: "4px" }} />
                      {item.authors[0]}
                    </span>
                  )}
                </div>
              </div>

              {item.image && (
                <div className="news-item-image-wrapper">
                  <img 
                    src={item.image} 
                    alt="News thumbnail" 
                    className="news-item-image" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
