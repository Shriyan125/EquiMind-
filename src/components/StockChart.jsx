import React, { useState, useRef, useEffect } from "react";

export default function StockChart({ history, prevClose, onHoverPrice }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverX, setHoverX] = useState(null);

  // Indicators toggle state (default: Volume on, others off)
  const [activeIndicators, setActiveIndicators] = useState({
    sma: false,
    ema: false,
    volume: true,
    rsi: false
  });

  const toggleIndicator = (ind) => {
    setActiveIndicators((prev) => ({
      ...prev,
      [ind]: !prev[ind]
    }));
  };

  // Keep track of container size dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 200)
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  if (!history || history.length === 0) {
    return (
      <div className="chart-placeholder">
        <div className="spinner"></div>
        <p>Loading historical data...</p>
      </div>
    );
  }

  // Calculate pricing extremes to scale the Y-axis
  const prices = history.map((h) => h.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice === 0 ? 1 : maxPrice - minPrice;
  
  // Pad the chart so the line doesn't clip the top/bottom boundaries
  const paddingY = priceRange * 0.05;
  const yMax = maxPrice + paddingY;
  const yMin = Math.max(0, minPrice - paddingY);
  const yScaleRange = yMax - yMin;

  const { width, height } = dimensions;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Split-layout metrics for RSI subplot
  const hasRsi = activeIndicators.rsi;
  const rsiHeight = 55;
  const gap = 15;
  const mainChartHeight = hasRsi ? chartHeight - rsiHeight - gap : chartHeight;
  const rsiAreaTop = paddingTop + mainChartHeight + gap;

  // Determine overall color based on period return
  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const isPositive = lastPrice >= firstPrice;
  const chartColor = isPositive ? "#10B981" : "#EF4444"; // emerald vs crimson

  // Map history points to SVG coordinates inside the main price chart
  const points = history.map((item, index) => {
    const x = paddingLeft + (index / (history.length - 1)) * chartWidth;
    const y = paddingTop + mainChartHeight - ((item.price - yMin) / yScaleRange) * mainChartHeight;
    return { x, y, data: item };
  });

  // Calculate SMA (20 period, dynamically adjusted down for short timeframes)
  const smaPeriod = Math.min(20, Math.max(3, Math.floor(history.length / 2)));
  const smaData = [];
  if (activeIndicators.sma && history.length >= smaPeriod) {
    for (let i = 0; i < history.length; i++) {
      if (i >= smaPeriod - 1) {
        let sum = 0;
        for (let j = i - smaPeriod + 1; j <= i; j++) {
          sum += history[j].price;
        }
        const val = sum / smaPeriod;
        const x = paddingLeft + (i / (history.length - 1)) * chartWidth;
        const y = paddingTop + mainChartHeight - ((val - yMin) / yScaleRange) * mainChartHeight;
        smaData.push({ x, y, value: val });
      }
    }
  }

  // Calculate EMA (20 period, initialized with SMA)
  const emaPeriod = Math.min(20, Math.max(3, Math.floor(history.length / 2)));
  const emaData = [];
  if (activeIndicators.ema && history.length >= emaPeriod) {
    const k = 2 / (emaPeriod + 1);
    let currentEma = 0;
    let sum = 0;
    for (let i = 0; i < emaPeriod; i++) {
      sum += history[i].price;
    }
    currentEma = sum / emaPeriod;
    
    const firstX = paddingLeft + ((emaPeriod - 1) / (history.length - 1)) * chartWidth;
    const firstY = paddingTop + mainChartHeight - ((currentEma - yMin) / yScaleRange) * mainChartHeight;
    emaData.push({ x: firstX, y: firstY, value: currentEma });
    
    for (let i = emaPeriod; i < history.length; i++) {
      currentEma = history[i].price * k + currentEma * (1 - k);
      const x = paddingLeft + (i / (history.length - 1)) * chartWidth;
      const y = paddingTop + mainChartHeight - ((currentEma - yMin) / yScaleRange) * mainChartHeight;
      emaData.push({ x, y, value: currentEma });
    }
  }

  // Calculate RSI (14 period, dynamically adjusted)
  const rsiPeriod = Math.min(14, Math.max(3, Math.floor(history.length / 3)));
  const rsiData = [];
  if (hasRsi && history.length > rsiPeriod) {
    let gains = [];
    let losses = [];
    
    for (let i = 1; i < history.length; i++) {
      const diff = history[i].price - history[i - 1].price;
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }
    
    let avgGain = gains.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    let avgLoss = losses.slice(0, rsiPeriod).reduce((a, b) => a + b, 0) / rsiPeriod;
    
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsiVal = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    
    const firstX = paddingLeft + (rsiPeriod / (history.length - 1)) * chartWidth;
    const firstY = rsiAreaTop + rsiHeight - (rsiVal / 100) * rsiHeight;
    rsiData.push({ x: firstX, y: firstY, value: rsiVal, index: rsiPeriod });
    
    for (let i = rsiPeriod + 1; i < history.length; i++) {
      const gain = gains[i - 1];
      const loss = losses[i - 1];
      avgGain = (avgGain * (rsiPeriod - 1) + gain) / rsiPeriod;
      avgLoss = (avgLoss * (rsiPeriod - 1) + loss) / rsiPeriod;
      
      rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiVal = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
      
      const x = paddingLeft + (i / (history.length - 1)) * chartWidth;
      const y = rsiAreaTop + rsiHeight - (rsiVal / 100) * rsiHeight;
      rsiData.push({ x, y, value: rsiVal, index: i });
    }
  }

  // Calculate Volume bar coordinates
  const volumeBars = [];
  if (activeIndicators.volume) {
    const volumes = history.map((h) => h.volume || 0);
    const maxVolume = Math.max(...volumes) || 1;
    
    for (let i = 0; i < history.length; i++) {
      const vol = history[i].volume || 0;
      const barHeight = (vol / maxVolume) * (mainChartHeight * 0.15);
      const x = paddingLeft + (i / (history.length - 1)) * chartWidth;
      const barWidth = Math.max(1.5, (chartWidth / history.length) * 0.6);
      
      const isUp = i === 0 ? true : history[i].price >= history[i - 1].price;
      const barColor = isUp ? "rgba(16, 185, 129, 0.18)" : "rgba(239, 68, 68, 0.18)";
      
      volumeBars.push({
        x: x - barWidth / 2,
        y: paddingTop + mainChartHeight - barHeight,
        width: barWidth,
        height: barHeight,
        color: barColor
      });
    }
  }

  // Construct main price path definitions
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `
    ${linePath} 
    L ${points[points.length - 1].x} ${paddingTop + mainChartHeight} 
    L ${points[0].x} ${paddingTop + mainChartHeight} 
    Z
  `;

  // Construct SMA/EMA paths
  const smaLinePath = smaData.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const emaLinePath = emaData.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Handle cursor hover interactions
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    if (mouseX >= paddingLeft && mouseX <= width - paddingRight) {
      let closestPoint = points[0];
      let minDiff = Math.abs(points[0].x - mouseX);
      
      for (let i = 1; i < points.length; i++) {
        const diff = Math.abs(points[i].x - mouseX);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = points[i];
        }
      }

      // Read active indicator values for tooltip
      let smaVal = null;
      let emaVal = null;
      let rsiVal = null;
      
      if (activeIndicators.sma) {
        const match = smaData.find(p => Math.abs(p.x - closestPoint.x) < 0.1);
        if (match) smaVal = match.value;
      }
      
      if (activeIndicators.ema) {
        const match = emaData.find(p => Math.abs(p.x - closestPoint.x) < 0.1);
        if (match) emaVal = match.value;
      }
      
      if (activeIndicators.rsi) {
        const match = rsiData.find(p => Math.abs(p.x - closestPoint.x) < 0.1);
        if (match) rsiVal = match.value;
      }
      
      setHoveredPoint({
        ...closestPoint,
        sma: smaVal,
        ema: emaVal,
        rsi: rsiVal,
        volume: closestPoint.data.volume
      });
      setHoverX(closestPoint.x);
      
      if (onHoverPrice) {
        onHoverPrice(closestPoint.data);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverX(null);
    if (onHoverPrice) {
      onHoverPrice(null); // resets details back to current stock price
    }
  };

  // Generate ticks for Y axis
  const yTicksCount = 4;
  const yTicks = Array.from({ length: yTicksCount }).map((_, i) => {
    const val = yMin + (i / (yTicksCount - 1)) * yScaleRange;
    const y = paddingTop + mainChartHeight - (i / (yTicksCount - 1)) * mainChartHeight;
    return { label: val.toFixed(2), y };
  });

  // Generate ticks for X axis (dates)
  const xTicksCount = Math.min(5, history.length);
  const xTicks = [];
  const stride = Math.max(1, Math.floor(history.length / xTicksCount));
  for (let i = 0; i < history.length; i += stride) {
    if (xTicks.length < xTicksCount) {
      xTicks.push(points[i]);
    }
  }
  // Ensure the last point is always in the X labels
  if (xTicks[xTicks.length - 1] !== points[points.length - 1] && xTicks.length >= xTicksCount) {
    xTicks[xTicks.length - 1] = points[points.length - 1];
  } else if (xTicks[xTicks.length - 1] !== points[points.length - 1]) {
    xTicks.push(points[points.length - 1]);
  }

  // Format date helper for X axis ticks
  const formatXTickDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (history.length > 0 && (new Date() - new Date(history[0].date)) < 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
    <div className="stock-chart-wrapper">
      {/* 1. Technical Indicators Panel Toolbar */}
      <div className="chart-indicators-toolbar">
        <span className="toolbar-label">Indicators:</span>
        <div className="indicator-chips-container">
          <button 
            className={`indicator-chip ${activeIndicators.volume ? "active" : ""}`}
            onClick={() => toggleIndicator("volume")}
          >
            Volume
          </button>
          <button 
            className={`indicator-chip ${activeIndicators.sma ? "active" : ""}`}
            onClick={() => toggleIndicator("sma")}
          >
            SMA (20)
          </button>
          <button 
            className={`indicator-chip ${activeIndicators.ema ? "active" : ""}`}
            onClick={() => toggleIndicator("ema")}
          >
            EMA (20)
          </button>
          <button 
            className={`indicator-chip ${activeIndicators.rsi ? "active" : ""}`}
            onClick={() => toggleIndicator("rsi")}
          >
            RSI (14)
          </button>
        </div>
      </div>

      {/* 2. Chart Visual Panel */}
      <div 
        className="stock-chart-container" 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg width="100%" height="100%">
          <defs>
            {/* Gradient for area fill under the curve */}
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0.00" />
            </linearGradient>
            {/* Shadow/Glow filters for a high-end glowing neon line */}
            <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={chartColor} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal dashed Grid Lines */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="rgba(0, 0, 0, 0.05)"
                strokeDasharray="4,4"
              />
              {/* Price values on Y-axis */}
              <text
                x={paddingLeft - 10}
                y={tick.y + 4}
                fill="var(--color-text-muted)"
                fontSize="11px"
                textAnchor="end"
              >
                ₹{parseFloat(tick.label).toLocaleString("en-IN")}
              </text>
            </g>
          ))}

          {/* The Filled Area */}
          <path d={areaPath} fill="url(#chartAreaGradient)" />

          {/* Volume bars overlay (renders behind price line) */}
          {activeIndicators.volume && volumeBars.map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={bar.color}
              rx="0.5"
            />
          ))}

          {/* SMA Line Curve */}
          {activeIndicators.sma && smaData.length > 0 && (
            <path
              d={smaLinePath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          )}

          {/* EMA Line Curve */}
          {activeIndicators.ema && emaData.length > 0 && (
            <path
              d={emaLinePath}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          )}

          {/* The Sparkline curve */}
          <path
            d={linePath}
            fill="none"
            stroke={chartColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Horizontal reference line for previous close price */}
          {prevClose && prevClose >= yMin && prevClose <= yMax && (
            <line
              x1={paddingLeft}
              y1={paddingTop + mainChartHeight - ((prevClose - yMin) / yScaleRange) * mainChartHeight}
              x2={width - paddingRight}
              y2={paddingTop + mainChartHeight - ((prevClose - yMin) / yScaleRange) * mainChartHeight}
              stroke="#6B7280"
              strokeWidth="1"
              strokeDasharray="3,6"
              opacity="0.5"
            />
          )}

          {/* RSI Subplot Render */}
          {hasRsi && (
            <g>
              {/* RSI Subplot outline */}
              <rect
                x={paddingLeft}
                y={rsiAreaTop}
                width={chartWidth}
                height={rsiHeight}
                fill="rgba(0, 0, 0, 0.015)"
                stroke="rgba(139, 115, 85, 0.08)"
                strokeWidth="1"
                rx="4"
              />
              {/* Shaded Oversold/Overbought corridor (30 to 70) */}
              <rect
                x={paddingLeft}
                y={rsiAreaTop + rsiHeight - (70 / 100) * rsiHeight}
                width={chartWidth}
                height={((70 - 30) / 100) * rsiHeight}
                fill="rgba(59, 130, 246, 0.03)"
              />
              
              {/* 30 Limit Line */}
              <line
                x1={paddingLeft}
                y1={rsiAreaTop + rsiHeight - (30 / 100) * rsiHeight}
                x2={width - paddingRight}
                y2={rsiAreaTop + rsiHeight - (30 / 100) * rsiHeight}
                stroke="rgba(239, 68, 68, 0.25)"
                strokeDasharray="2,3"
                strokeWidth="1"
              />
              {/* 50 Center Reference Line */}
              <line
                x1={paddingLeft}
                y1={rsiAreaTop + rsiHeight - (50 / 100) * rsiHeight}
                x2={width - paddingRight}
                y2={rsiAreaTop + rsiHeight - (50 / 100) * rsiHeight}
                stroke="rgba(0, 0, 0, 0.06)"
                strokeDasharray="2,3"
                strokeWidth="1"
              />
              {/* 70 Limit Line */}
              <line
                x1={paddingLeft}
                y1={rsiAreaTop + rsiHeight - (70 / 100) * rsiHeight}
                x2={width - paddingRight}
                y2={rsiAreaTop + rsiHeight - (70 / 100) * rsiHeight}
                stroke="rgba(16, 185, 129, 0.25)"
                strokeDasharray="2,3"
                strokeWidth="1"
              />
              
              {/* RSI Y-Axis labels */}
              <text x={paddingLeft - 8} y={rsiAreaTop + rsiHeight - (30 / 100) * rsiHeight + 3} fill="var(--color-text-muted)" fontSize="9px" textAnchor="end">30</text>
              <text x={paddingLeft - 8} y={rsiAreaTop + rsiHeight - (50 / 100) * rsiHeight + 3} fill="var(--color-text-muted)" fontSize="9px" textAnchor="end">50</text>
              <text x={paddingLeft - 8} y={rsiAreaTop + rsiHeight - (70 / 100) * rsiHeight + 3} fill="var(--color-text-muted)" fontSize="9px" textAnchor="end">70</text>
              <text x={paddingLeft - 8} y={rsiAreaTop + 10} fill="var(--color-text-muted)" fontSize="10px" fontWeight="bold" textAnchor="end">RSI</text>

              {/* RSI Line Curve */}
              {rsiData.length > 0 && (
                <path
                  d={rsiData.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* RSI Hover crosshair dot */}
              {hoveredPoint && hoveredPoint.rsi !== null && hoveredPoint.rsi !== undefined && (
                <circle
                  cx={hoveredPoint.x}
                  cy={rsiAreaTop + rsiHeight - (hoveredPoint.rsi / 100) * rsiHeight}
                  r="3.5"
                  fill="#3B82F6"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
              )}
            </g>
          )}

          {/* X-axis tick labels (Dates/Times) */}
          {xTicks.map((tick, index) => (
            <text
              key={index}
              x={tick.x}
              y={height - paddingBottom + 20}
              fill="var(--color-text-muted)"
              fontSize="10px"
              textAnchor="middle"
            >
              {formatXTickDate(tick.data.date)}
            </text>
          ))}

          {/* Hover Crosshair Ticker & Circle indicator */}
          {hoveredPoint && (
            <g>
              {/* Vertical crosshair line (runs down through RSI chart too if active) */}
              <line
                x1={hoverX}
                y1={paddingTop}
                x2={hoverX}
                y2={hasRsi ? rsiAreaTop + rsiHeight : height - paddingBottom}
                stroke="rgba(0, 0, 0, 0.15)"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              {/* Outer glowing pulsing circle on the price line */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="7"
                fill={chartColor}
                opacity="0.3"
              />
              {/* Core focus dot */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="3.5"
                fill="#FFFFFF"
                stroke={chartColor}
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Floating HTML tooltip box inside chart */}
        {hoveredPoint && (
          <div 
            className="chart-tooltip"
            style={{
              left: `${hoverX}px`,
              top: `${hoveredPoint.y - 50}px`,
              transform: hoverX > width / 2 ? "translateX(-110%)" : "translateX(10%)"
            }}
          >
            <div className="tooltip-date">
              {new Date(hoveredPoint.data.date).toLocaleString("en-IN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
              })}
            </div>
            
            <div className="tooltip-row">
              <span className="tooltip-label">Price:</span>
              <span className="tooltip-value">₹{hoveredPoint.data.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {activeIndicators.sma && hoveredPoint.sma !== null && hoveredPoint.sma !== undefined && (
              <div className="tooltip-row sma">
                <span className="tooltip-label">SMA (20):</span>
                <span className="tooltip-value">₹{hoveredPoint.sma.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {activeIndicators.ema && hoveredPoint.ema !== null && hoveredPoint.ema !== undefined && (
              <div className="tooltip-row ema">
                <span className="tooltip-label">EMA (20):</span>
                <span className="tooltip-value">₹{hoveredPoint.ema.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {activeIndicators.rsi && hoveredPoint.rsi !== null && hoveredPoint.rsi !== undefined && (
              <div className="tooltip-row rsi">
                <span className="tooltip-label">RSI (14):</span>
                <span className="tooltip-value">{hoveredPoint.rsi.toFixed(2)}</span>
              </div>
            )}

            {activeIndicators.volume && hoveredPoint.volume !== null && hoveredPoint.volume !== undefined && (
              <div className="tooltip-row volume">
                <span className="tooltip-label">Volume:</span>
                <span className="tooltip-value">{hoveredPoint.volume.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
