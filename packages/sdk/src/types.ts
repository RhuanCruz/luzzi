/**
 * Luzzi Analytics SDK Types
 */

export interface LuzziConfig {
    /** API endpoint URL (defaults to https://api.luzzi.dev) */
    apiUrl?: string;
    /** Batch size before auto-flush (default: 10) */
    batchSize?: number;
    /** Flush interval in milliseconds (default: 30000 = 30s) */
    flushInterval?: number;
    /** Enable debug logging */
    debug?: boolean;
}

export interface DeviceInfo {
    os?: string;
    app_version?: string;
    browser?: string;
    screen_width?: number;
    screen_height?: number;
    language?: string;
    timezone?: string;
}

export interface EventPayload {
    event: string;
    properties?: Record<string, unknown>;
    timestamp: string;
    session_id: string;
    user_id?: string;
    device: DeviceInfo;
}

export interface UserTraits {
    [key: string]: unknown;
}

export interface EventsRequest {
    events: EventPayload[];
}

export interface EventsResponse {
    success: boolean;
    accepted: number;
    dropped: number;
}
