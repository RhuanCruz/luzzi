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

import { luzziCore } from "./core";
import type { LuzziConfig, UserTraits } from "./types";

/**
 * Luzzi Analytics SDK
 */
const luzzi = {
    /**
     * Initialize the SDK with your API key
     * Must be called before any other method
     *
     * @param apiKey - Your Luzzi API key (pk_live_xxx or pk_test_xxx)
     * @param config - Optional configuration
     */
    init: (apiKey: string, config?: LuzziConfig): void => {
        luzziCore.init(apiKey, config);
    },

    /**
     * Track an event
     *
     * @param eventName - Name of the event (e.g., "button_clicked", "page_viewed")
     * @param properties - Optional event properties
     *
     * @example
     * luzzi.track("purchase_completed", { amount: 99.99, currency: "USD" });
     */
    track: (eventName: string, properties?: Record<string, unknown>): void => {
        luzziCore.track(eventName, properties);
    },

    /**
     * Identify the current user
     *
     * @param userId - Unique user identifier
     * @param traits - Optional user traits/properties
     *
     * @example
     * luzzi.identify("user_123", { email: "user@example.com", plan: "pro" });
     */
    identify: (userId: string, traits?: UserTraits): void => {
        luzziCore.identify(userId, traits);
    },

    /**
     * Reset the current user (call on logout)
     * Clears user ID and generates a new session
     */
    reset: (): void => {
        luzziCore.reset();
    },

    /**
     * Manually flush pending events to the server
     * Events are automatically flushed on a timer and on page unload
     */
    flush: (): Promise<void> => {
        return luzziCore.flush();
    },

    /**
     * Get the current session ID
     */
    getSessionId: (): string => {
        return luzziCore.getSessionId();
    },

    /**
     * Get the current user ID (if identified)
     */
    getUserId: (): string | undefined => {
        return luzziCore.getUserId();
    },
};

export default luzzi;

// Named exports
export const { init, track, identify, reset, flush, getSessionId, getUserId } = luzzi;

// Type exports
export type { LuzziConfig, DeviceInfo, UserTraits, EventPayload } from "./types";
