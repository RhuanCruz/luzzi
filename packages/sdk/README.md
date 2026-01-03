# @luzzi/analytics

Simple, plug-and-play analytics SDK for solo builders.

## Installation

```bash
npm install @luzzi/analytics
```

## Quick Start

```typescript
import luzzi from "@luzzi/analytics";

// Initialize with your API key
luzzi.init("pk_live_xxx");

// Track events
luzzi.track("button_clicked", { button: "signup" });

// Identify users
luzzi.identify("user_123", { plan: "pro" });

// Reset on logout
luzzi.reset();
```

## API

### `init(apiKey, config?)`

Initialize the SDK. Must be called before any other method.

```typescript
luzzi.init("pk_live_xxx", {
  apiUrl: "https://api.luzzi.dev", // Custom API URL (optional)
  batchSize: 10, // Events to batch before sending (default: 10)
  flushInterval: 30000, // Flush interval in ms (default: 30s)
  debug: false, // Enable debug logging (default: false)
});
```

### `track(eventName, properties?)`

Track an event with optional properties.

```typescript
luzzi.track("purchase_completed", {
  amount: 99.99,
  currency: "USD",
  product_id: "prod_123",
});
```

### `identify(userId, traits?)`

Identify the current user with optional traits.

```typescript
luzzi.identify("user_123", {
  email: "user@example.com",
  plan: "pro",
  created_at: "2024-01-01",
});
```

### `reset()`

Reset the current user. Call this on logout.

```typescript
luzzi.reset();
```

### `flush()`

Manually flush pending events to the server.

```typescript
await luzzi.flush();
```

## Automatic Features

- **Session tracking**: Automatically generates a unique session ID
- **Device info**: Collects OS, browser, screen size, language, timezone
- **Batching**: Events are batched (10 events or 30 seconds)
- **Auto-flush**: Events are flushed on page unload/visibility change
- **Retry**: Failed events are re-queued and retried

## License

MIT
