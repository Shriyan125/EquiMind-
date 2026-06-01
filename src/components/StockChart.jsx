import React, { useState, useRef, useEffect } from "react";

export default function StockChart({ history, prevClose, onHoverPrice }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoverX, setHoverX] = useState(null);

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

  // Determine overall color based on period return
  const firstPrice = history[0].price;
  const lastPrice = history[history.length - 1].price;
  const isPositive = lastPrice >= firstPrice;
  const chartColor = isPositive ? "#10B981" : "#EF4444"; // emerald vs crimson

  // Map history points to SVG coordinates
  const points = history.map((item, index) => {
    const x = paddingLeft + (index / (history.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((item.price - yMin) / yScaleRange) * chartHeight;
    return { x, y, data: item };
  });

  // Construct SVG Path definitions
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `
    ${linePath} 
    L ${points[points.length - 1].x} ${paddingTop + chartHeight} 
    L ${points[0].x} ${paddingTop + chartHeight} 
    Z
  `;

  // Handle cursor hover interactions
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Check if mouse is within chart horizontal boundaries
    if (mouseX >= paddingLeft && mouseX <= width - paddingRight) {
      // Find the closest data point based on X coordinate
      let closestPoint = points[0];
      let minDiff = Math.abs(points[0].x - mouseX);
      
      for (let i = 1; i < points.length; i++) {
        const diff = Math.abs(points[i].x - mouseX);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = points[i];
        }
      }
      
      setHoveredPoint(closestPoint);
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
    const y = paddingTop + chartHeight - (i / (yTicksCount - 1)) * chartHeight;
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
    // If it's 1D, format as time, otherwise as date
    if (history.length > 0 && (new Date() - new Date(history[0].date)) < 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  return (
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
            y1={paddingTop + chartHeight - ((prevClose - yMin) / yScaleRange) * chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight - ((prevClose - yMin) / yScaleRange) * chartHeight}
            stroke="#6B7280"
            strokeWidth="1"
            strokeDasharray="3,6"
            opacity="0.5"
          />
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
            {/* Vertical crosshair line */}
            <line
              x1={hoverX}
              y1={paddingTop}
              x2={hoverX}
              y2={height - paddingBottom}
              stroke="rgba(0, 0, 0, 0.15)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            {/* Outer glowing pulsing circle */}
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
          <div className="tooltip-price">
            ₹{hoveredPoint.data.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="tooltip-date">
            {new Date(hoveredPoint.data.date).toLocaleString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            })}
          </div>
        </div>
      )}
    </div>
  );
}
