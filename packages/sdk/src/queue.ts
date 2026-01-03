import type { EventPayload, EventsRequest } from "./types";

/**
 * Event queue with batching and auto-flush
 */
export class EventQueue {
    private queue: EventPayload[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;
    private apiKey: string = "";
    private apiUrl: string = "";
    private batchSize: number = 10;
    private flushInterval: number = 30000;
    private debug: boolean = false;

    /**
     * Initialize the queue
     */
    init(
        apiKey: string,
        apiUrl: string,
        batchSize: number,
        flushInterval: number,
        debug: boolean
    ) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.batchSize = batchSize;
        this.flushInterval = flushInterval;
        this.debug = debug;
        this.startFlushTimer();
    }

    /**
     * Add event to queue
     */
    push(event: EventPayload) {
        this.queue.push(event);
        this.log(`Event queued: ${event.event}`, event);

        if (this.queue.length >= this.batchSize) {
            this.flush();
        }
    }

    /**
     * Flush all events in queue to server
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0) {
            return;
        }

        const events = [...this.queue];
        this.queue = [];

        try {
            const payload: EventsRequest = { events };
            this.log(`Flushing ${events.length} events`, payload);

            const response = await fetch(`${this.apiUrl}/v1/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error("[Luzzi] Failed to send events:", error);
                // Re-add events to queue on failure (with limit to prevent infinite growth)
                if (this.queue.length < this.batchSize * 10) {
                    this.queue.unshift(...events);
                }
            } else {
                const result = await response.json();
                this.log(`Events sent successfully`, result);
            }
        } catch (error) {
            console.error("[Luzzi] Failed to send events:", error);
            // Re-add events on network error
            if (this.queue.length < this.batchSize * 10) {
                this.queue.unshift(...events);
            }
        }
    }

    /**
     * Start auto-flush timer
     */
    private startFlushTimer() {
        this.stopFlushTimer();
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    /**
     * Stop auto-flush timer
     */
    private stopFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Get queue length
     */
    get length(): number {
        return this.queue.length;
    }

    /**
     * Clear queue and stop timer
     */
    reset() {
        this.queue = [];
        this.stopFlushTimer();
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
