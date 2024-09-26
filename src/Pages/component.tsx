import React, { useEffect, useRef, useState } from "react";
import "./OrderBook.css";

type Order = {
  price: number;
  size: number;
  total: number;
};

const groupPrice = (price: number, groupSize: number) => {
  return Math.floor(price / groupSize) * groupSize;
};

const OrderBook: React.FC = () => {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [groupSize, setGroupSize] = useState<number>(0.5);
  const [currentMarket, setCurrentMarket] = useState<string>("PI_XBTUSD"); // Track current market
  const [isFeedKilled, setIsFeedKilled] = useState<boolean>(false); // Track if feed is killed
  const ws = useRef<WebSocket | null>(null);

  const updateOrderBook = (
    orders: Order[],
    price: number,
    size: number,
    isBuy: boolean
  ) => {
    const groupedPrice = groupPrice(price, groupSize);
    let updatedOrders = [...orders];

    if (size === 0) {
      updatedOrders = updatedOrders.filter(
        (order) => order.price !== groupedPrice
      );
    } else {
      const orderIndex = updatedOrders.findIndex(
        (order) => order.price === groupedPrice
      );
      if (orderIndex !== -1) {
        updatedOrders[orderIndex].size += size;
      } else {
        updatedOrders.push({ price: groupedPrice, size, total: 0 });
      }
      updatedOrders.sort((a, b) =>
        isBuy ? b.price - a.price : a.price - b.price
      );
    }

    let cumulativeTotal = 0;
    updatedOrders = updatedOrders.map((order) => {
      cumulativeTotal += order.size;
      return { ...order, total: cumulativeTotal };
    });

    return updatedOrders;
  };

  const subscribeToMarket = (market: string) => {
    ws.current?.send(
      JSON.stringify({
        event: "subscribe",
        feed: "book_ui_1",
        product_ids: [market],
      })
    );
  };

  const unsubscribeFromMarket = (market: string) => {
    ws.current?.send(
      JSON.stringify({
        event: "unsubscribe",
        feed: "book_ui_1",
        product_ids: [market],
      })
    );
  };

  const toggleMarket = () => {
    const newMarket = currentMarket === "PI_XBTUSD" ? "PI_ETHUSD" : "PI_XBTUSD";

    unsubscribeFromMarket(currentMarket);

    if (newMarket === "PI_XBTUSD") {
      setGroupSize(0.5);
    } else {
      setGroupSize(0.05);
    }

    setCurrentMarket(newMarket);
    subscribeToMarket(newMarket);
  };

  // WebSocket Error Handling and Feed Setup
  const setupWebSocket = () => {
    ws.current = new WebSocket("wss://www.cryptofacilities.com/ws/v1");

    ws.current.onopen = () => {
      subscribeToMarket(currentMarket);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.feed === "book_ui_1_snapshot") {
        const buy =
          data.bids?.map(([price, size]: [number, number]) => ({
            price,
            size,
            total: 0,
          })) || [];
        const sell =
          data.asks?.map(([price, size]: [number, number]) => ({
            price,
            size,
            total: 0,
          })) || [];
        setBuyOrders(buy);
        setSellOrders(sell);
      }

      if (data.feed === "book_ui_1") {
        if (data.bids) {
          data.bids.forEach(([price, size]: [number, number]) => {
            setBuyOrders((prev) => updateOrderBook(prev, price, size, true));
          });
        }
        if (data.asks) {
          data.asks.forEach(([price, size]: [number, number]) => {
            setSellOrders((prev) => updateOrderBook(prev, price, size, false));
          });
        }
      }
    };

    // Handle WebSocket errors
    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
      alert("WebSocket Error Occurred. Please check the console for details.");
    };

    // Handle WebSocket closure
    ws.current.onclose = (event) => {
      console.log("WebSocket closed:", event);
      if (!isFeedKilled) {
        // Restart WebSocket if it wasn't manually killed
        setupWebSocket();
      }
    };
  };

  useEffect(() => {
    setupWebSocket();

    return () => {
      ws.current?.close();
    };
  }, [currentMarket]);

  // Force an error or restart the feed when the kill button is clicked
  const toggleFeed = () => {
    if (ws.current) {
      if (isFeedKilled) {
        // Restart the WebSocket feed
        setupWebSocket(); // Re-establish the WebSocket connection
      } else {
        if (ws.current.readyState === WebSocket.OPEN) {
          // Close the WebSocket with a custom valid close code
          ws.current.close(4000, "Manually forced error");
        } else {
          console.error("WebSocket is not open, unable to close.");
        }
      }
      setIsFeedKilled(!isFeedKilled); // Toggle feed killed state
    } else {
      console.error("WebSocket is not initialized.");
    }
  };

  const getMaxTotal = () => {
    const maxBuyTotal = buyOrders.length
      ? buyOrders[buyOrders.length - 1].total
      : 0;
    const maxSellTotal = sellOrders.length
      ? sellOrders[sellOrders.length - 1].total
      : 0;
    return Math.max(maxBuyTotal, maxSellTotal);
  };

  const maxTotal = getMaxTotal();

  return (
    <div className="orderbook-container">
      <h2>Order Book - {currentMarket}</h2>
      <div className="orderbook-group-select">
        <label htmlFor="group">Group:</label>
        <select
          id="group"
          value={groupSize}
          onChange={(e) => setGroupSize(parseFloat(e.target.value))}
        >
          {currentMarket === "PI_XBTUSD" ? (
            <>
              <option value={0.5}>0.50</option>
              <option value={1}>1.00</option>
              <option value={2.5}>2.50</option>
            </>
          ) : (
            <>
              <option value={0.05}>0.05</option>
              <option value={0.1}>0.10</option>
              <option value={0.25}>0.25</option>
            </>
          )}
        </select>
      </div>
      <div className="orderbook">
        <div className="orderbook-column">
          <div className="orderbook-header">
            <span>Total</span>
            <span>Size</span>
            <span>Price</span>
          </div>
          {buyOrders.map((order, index) => (
            <div
              className="orderbook-row buy"
              key={index}
              style={{
                background: `rgba(0, 255, 0, ${order.total / maxTotal})`,
              }}
            >
              <span>{order.total}</span>
              <span>{order.size}</span>
              <span>{order.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="orderbook-column">
          <div className="orderbook-header">
            <span>Price</span>
            <span>Size</span>
            <span>Total</span>
          </div>
          {sellOrders.map((order, index) => (
            <div
              className="orderbook-row sell"
              key={index}
              style={{
                background: `rgba(255, 0, 0, ${order.total / maxTotal})`,
              }}
            >
              <span>{order.price.toFixed(2)}</span>
              <span>{order.size}</span>
              <span>{order.total}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="orderbook-actions">
        <button className="toggle-feed" onClick={toggleMarket}>
          Toggle Feed
        </button>
        <button className="kill-feed" onClick={toggleFeed}>
          {isFeedKilled ? "Restart Feed" : "Kill Feed"}
        </button>
      </div>
    </div>
  );
};

export default OrderBook;
