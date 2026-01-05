/**
 * Luzzi Analytics SDK Types
 */
interface LuzziConfig {
    /** API endpoint URL (defaults to https://api.luzzi.dev) */
    apiUrl?: string;
    /** Batch size before auto-flush (default: 10) */
    batchSize?: number;
    /** Flush interval in milliseconds (default: 30000 = 30s) */
    flushInterval?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Device info (useful for React Native where auto-detection doesn't work) */
    deviceInfo?: DeviceInfo;
}
interface DeviceInfo {
    os?: string;
    app_version?: string;
    browser?: string;
    screen_width?: number;
    screen_height?: number;
    language?: string;
    timezone?: string;
}
interface EventPayload {
    event: string;
    properties?: Record<string, unknown>;
    timestamp: string;
    session_id: string;
    user_id?: string;
    device: DeviceInfo;
}
interface UserTraits {
    [key: string]: unknown;
}

/**
 * Luzzi Analytics SDK
 *
 * Simple, plug-and-play analytics for solo builders.
 *
 * @example
 * ```typescript
 * import luzzi from "@luzzi/analytics";
 *
 * // Initialize with your API key
 * luzzi.init("pk_live_xxx");
 *
 * // Track events
 * luzzi.track("button_clicked", { button: "signup" });
 *
 * // Identify users
 * luzzi.identify("user_123", { plan: "pro" });
 *
 * // Reset on logout
 * luzzi.reset();
 * ```
 */

/**
 * Luzzi Analytics SDK
 */
declare const luzzi: {
    /**
     * Initialize the SDK with your API key
     * Must be called before any other method
     *
     * @param apiKey - Your Luzzi API key (pk_live_xxx or pk_test_xxx)
     * @param config - Optional configuration
     */
    init: (apiKey: string, config?: LuzziConfig) => void;
    /**
     * Track an event
     *
     * @param eventName - Name of the event (e.g., "button_clicked", "page_viewed")
     * @param properties - Optional event properties
     *
     * @example
     * luzzi.track("purchase_completed", { amount: 99.99, currency: "USD" });
     */
    track: (eventName: string, properties?: Record<string, unknown>) => void;
    /**
     * Identify the current user
     *
     * @param userId - Unique user identifier
     * @param traits - Optional user traits/properties
     *
     * @example
     * luzzi.identify("user_123", { email: "user@example.com", plan: "pro" });
     */
    identify: (userId: string, traits?: UserTraits) => void;
    /**
     * Reset the current user (call on logout)
     * Clears user ID and generates a new session
     */
    reset: () => void;
    /**
     * Manually flush pending events to the server
     * Events are automatically flushed on a timer and on page unload
     */
    flush: () => Promise<void>;
    /**
     * Get the current session ID
     */
    getSessionId: () => string;
    /**
     * Get the current user ID (if identified)
     */
    getUserId: () => string | undefined;
};

declare const init: (apiKey: string, config?: LuzziConfig) => void;
declare const track: (eventName: string, properties?: Record<string, unknown>) => void;
declare const identify: (userId: string, traits?: UserTraits) => void;
declare const reset: () => void;
declare const flush: () => Promise<void>;
declare const getSessionId: () => string;
declare const getUserId: () => string | undefined;

export { type DeviceInfo, type EventPayload, type LuzziConfig, type UserTraits, luzzi as default, flush, getSessionId, getUserId, identify, init, reset, track };
