import type { LuzziConfig, DeviceInfo, UserTraits } from "./types";
import { EventQueue } from "./queue";

const DEFAULT_API_URL = "https://luzzi.vercel.app/api";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL = 30000; // 30 seconds

/**
 * Luzzi Analytics Core
 */
class LuzziCore {
    private apiKey: string = "";
    private apiUrl: string = DEFAULT_API_URL;
    private sessionId: string = "";
    private userId: string | undefined;
    private userTraits: UserTraits = {};
    private deviceInfo: DeviceInfo = {};
    private queue: EventQueue;
    private initialized: boolean = false;
    private debug: boolean = false;

    constructor() {
        this.queue = new EventQueue();
    }

    /**
     * Initialize the SDK
     * Must be called before any other method
     */
    init(apiKey: string, config: LuzziConfig = {}): void {
        try {
            if (!apiKey) {
                console.error("[Luzzi] API key is required");
                return;
            }

            this.apiKey = apiKey;
            this.apiUrl = config.apiUrl || DEFAULT_API_URL;
            this.debug = config.debug || false;

            // Generate new session ID
            this.sessionId = this.generateSessionId();

            // Collect device info (merge config with auto-detected)
            try {
                const autoDetected = this.collectDeviceInfo();
                this.deviceInfo = { ...autoDetected, ...config.deviceInfo };
            } catch {
                this.deviceInfo = config.deviceInfo || {};
            }

            // Initialize queue
            this.queue.init(
                this.apiKey,
                this.apiUrl,
                config.batchSize || DEFAULT_BATCH_SIZE,
                config.flushInterval || DEFAULT_FLUSH_INTERVAL,
                this.debug
            );

            this.initialized = true;
            this.log("Initialized", { apiKey: apiKey.slice(0, 10) + "...", sessionId: this.sessionId });

            // Flush on page unload (browser only - not React Native)
            if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
                window.addEventListener("beforeunload", () => {
                    this.flush();
                });

                if (typeof document !== "undefined") {
                    window.addEventListener("visibilitychange", () => {
                        if (document.visibilityState === "hidden") {
                            this.flush();
                        }
                    });
                }
            }
        } catch (error) {
            console.warn("[Luzzi] Failed to initialize:", error);
            // Still mark as initialized so track() calls don't spam warnings
            this.initialized = true;
        }
    }

    /**
     * Track an event
     */
    track(eventName: string, properties?: Record<string, unknown>): void {
        if (!this.initialized) {
            console.warn("[Luzzi] SDK not initialized. Call luzzi.init() first.");
            return;
        }

        if (!eventName || typeof eventName !== "string") {
            console.warn("[Luzzi] Event name is required and must be a string");
            return;
        }

        this.queue.push({
            event: eventName,
            properties: properties || {},
            timestamp: new Date().toISOString(),
            session_id: this.sessionId,
            user_id: this.userId,
            device: this.deviceInfo,
        });
    }

    /**
     * Identify the current user
     */
    identify(userId: string, traits?: UserTraits): void {
        if (!this.initialized) {
            console.warn("[Luzzi] SDK not initialized. Call luzzi.init() first.");
            return;
        }

        if (!userId || typeof userId !== "string") {
            console.warn("[Luzzi] User ID is required and must be a string");
            return;
        }

        this.userId = userId;
        this.userTraits = { ...this.userTraits, ...traits };

        this.log("User identified", { userId, traits });

        // Track identify event
        this.track("$identify", {
            ...this.userTraits,
            $user_id: userId,
        });
    }

    /**
     * Reset the current user (logout)
     */
    reset(): void {
        this.log("Resetting user");

        // Flush pending events before reset
        this.flush();

        // Clear user data
        this.userId = undefined;
        this.userTraits = {};

        // Generate new session
        this.sessionId = this.generateSessionId();

        this.log("Reset complete", { newSessionId: this.sessionId });
    }

    /**
     * Manually flush the event queue
     */
    async flush(): Promise<void> {
        if (!this.initialized) {
            return;
        }
        await this.queue.flush();
    }

    /**
     * Get the current session ID
     */
    getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Get the current user ID
     */
    getUserId(): string | undefined {
        return this.userId;
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        // Use crypto.randomUUID if available
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        // Fallback to timestamp + random
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Collect device information
     */
    private collectDeviceInfo(): DeviceInfo {
        const info: DeviceInfo = {};

        // Browser environment
        if (typeof window !== "undefined" && typeof navigator !== "undefined") {
            // Detect OS from user agent (with null check)
            const ua = navigator.userAgent || "";
            if (ua && typeof ua === "string") {
                if (ua.includes("Windows")) info.os = "windows";
                else if (ua.includes("Mac")) info.os = "macos";
                else if (ua.includes("Linux")) info.os = "linux";
                else if (ua.includes("Android")) info.os = "android";
                else if (ua.includes("iPhone") || ua.includes("iPad")) info.os = "ios";

                // Detect browser
                if (ua.includes("Chrome") && !ua.includes("Edg")) info.browser = "chrome";
                else if (ua.includes("Firefox")) info.browser = "firefox";
                else if (ua.includes("Safari") && !ua.includes("Chrome")) info.browser = "safari";
                else if (ua.includes("Edg")) info.browser = "edge";
            }

            // Screen dimensions
            info.screen_width = window.screen?.width;
            info.screen_height = window.screen?.height;

            // Language
            info.language = navigator.language;

            // Timezone
            try {
                info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch {
                // Ignore
            }
        }

        // Node.js environment
        if (typeof process !== "undefined" && process.versions?.node) {
            info.os = process.platform;
            info.app_version = process.versions.node;
        }

        return info;
    }

    /**
     * Debug log
     */
    private log(message: string, data?: unknown) {
        if (this.debug) {
            console.log(`[Luzzi] ${message}`, data || "");
        }
    }
}

// Export singleton instance
export const luzziCore = new LuzziCore();
