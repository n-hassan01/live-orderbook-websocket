# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

### `npx create-react-app live-orderbook --template typescript`

### `npm install websocket`

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### Description

This OrderBook React component is designed to display live orderbook data for two cryptocurrency markets, PI_XBTUSD (Bitcoin to USD) and PI_ETHUSD (Ethereum to USD). It uses WebSockets to subscribe to real-time orderbook data and allows toggling between the two markets, along with dynamic price grouping. The component also handles feed errors and offers the ability to kill or restart the WebSocket feed.

Key Components and Functionality:
State Variables:

buyOrders and sellOrders: Arrays that hold the current state of buy and sell orders in the orderbook, respectively. Each order has price, size, and total.
groupSize: Stores the size of the grouping applied to the price levels (e.g., for PI_XBTUSD, group sizes are 0.5, 1, or 2.5).
currentMarket: Keeps track of the active market (either PI_XBTUSD or PI_ETHUSD).
isFeedKilled: Boolean that tracks if the WebSocket feed is manually stopped.
Utility Functions:

groupPrice(price, groupSize): Rounds the price down to the nearest group size, which consolidates the prices into fewer levels (e.g., rounding prices into buckets like 0.5, 1, or 2.5 for Bitcoin).
updateOrderBook(orders, price, size, isBuy): Updates the orderbook when new data comes in. It handles:
Grouping the price using groupPrice().
Adding or removing orders based on the size (size 0 means the order is removed).
Sorting orders in descending order for buy orders and ascending order for sell orders.
Calculating and updating cumulative totals for the total field used in depth visualization.
WebSocket Setup and Management:

setupWebSocket(): Initializes the WebSocket connection to wss://www.cryptofacilities.com/ws/v1 and sets up listeners for incoming messages, errors, and WebSocket closure events. Upon connection, it subscribes to the current market.
subscribeToMarket(market): Sends a subscription message to the WebSocket to receive live data for the specified market.
unsubscribeFromMarket(market): Sends an unsubscription message to stop receiving updates for a specific market.
toggleMarket(): Switches between the PI_XBTUSD and PI_ETHUSD markets by unsubscribing from the current market, adjusting the tick size (and grouping options), and subscribing to the new market.
toggleFeed(): Allows the user to manually kill or restart the WebSocket connection. If the WebSocket is killed, the feed can be restarted by re-establishing the WebSocket connection.
WebSocket Data Handling:

Snapshots (book_ui_1_snapshot): When a snapshot of the orderbook is received, it initializes the buyOrders and sellOrders arrays with the provided bids (buy orders) and asks (sell orders).
Deltas (book_ui_1): Incremental updates are received via this event, which adjusts the existing orders in the orderbook by calling updateOrderBook().
Rendering the OrderBook:

The orderbook is split into two columns: buy orders on the left and sell orders on the right.
Each order row displays:
Buy orders: Total, size, and price, sorted by price in descending order.
Sell orders: Price, size, and total, sorted by price in ascending order.
The background of each row is dynamically colored based on the relative total of the order compared to the largest total in the orderbook (depth visualization).
Dynamic Grouping:

Users can adjust the price grouping via a dropdown. The group options change dynamically based on the selected market:
PI_XBTUSD uses group sizes 0.5, 1, and 2.5.
PI_ETHUSD uses group sizes 0.05, 0.1, and 0.25.
When the user changes the group size, the prices are re-grouped into fewer levels according to the selected group size.
Feed Control Actions:

Toggle Market: A button to switch between the two markets.
Kill/Restart Feed: A button that either stops the WebSocket feed or restarts it if the feed has been manually killed.
Workflow:
Component Mount: When the component mounts, useEffect() initializes the WebSocket connection by calling setupWebSocket(), subscribing to the active market (currentMarket).
Receiving Data:
If the WebSocket receives a snapshot (book_ui_1_snapshot), it sets the initial state for the buy and sell orders.
If incremental updates (book_ui_1) are received, it updates the orderbook by adding, removing, or adjusting existing orders.
Toggling Markets: When the user toggles the market using the "Toggle Feed" button, the component unsubscribes from the current market and subscribes to the new one. The groupSize is updated accordingly to match the new market.
Feed Control: The "Kill Feed" button allows the user to forcefully close the WebSocket connection. When killed, the feed can be restarted by clicking the button again.
Error Handling:
The component handles WebSocket errors by logging them to the console and alerting the user.
If the WebSocket closes unexpectedly (without being manually killed), it will attempt to reconnect.
Summary:
The OrderBook component offers a dynamic, real-time display of orderbook data for two cryptocurrency markets, with the ability to group price levels, switch between markets, and manually control the WebSocket feed. It efficiently handles orderbook updates by grouping prices, sorting orders, and recalculating cumulative totals for depth visualization.
