import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, projects } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface EventPayload {
    event: string;
    properties?: Record<string, unknown>;
    timestamp: string;
    session_id?: string;
    user_id?: string;
    device?: {
        os?: string;
        app_version?: string;
    };
}

interface EventsRequest {
    events: EventPayload[];
}

/**
 * POST /api/v1/events
 * Receives events from the SDK
 * Auth: API Key (x-api-key header)
 */
export async function POST(request: NextRequest) {
    try {
        // Get API key from header
        const apiKey = request.headers.get("x-api-key");

        if (!apiKey) {
            return NextResponse.json(
                { error: "Missing API key" },
                { status: 401 }
            );
        }

        // Find project by API key (supports both live and test keys)
        const project = await db.query.projects.findFirst({
            where: (projects, { or, eq }) =>
                or(
                    eq(projects.apiKeyLive, apiKey),
                    eq(projects.apiKeyTest, apiKey)
                ),
        });

        if (!project) {
            return NextResponse.json(
                { error: "Invalid API key" },
                { status: 401 }
            );
        }

        // Check event limit
        if (project.eventsCount >= project.eventsLimit) {
            return NextResponse.json(
                { error: "Event limit reached. Upgrade your plan." },
                { status: 429 }
            );
        }

        // Parse request body
        const body: EventsRequest = await request.json();

        if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
            return NextResponse.json(
                { error: "Invalid request body. 'events' array is required." },
                { status: 400 }
            );
        }

        // Calculate how many events we can accept
        const remainingQuota = project.eventsLimit - project.eventsCount;
        const eventsToInsert = body.events.slice(0, remainingQuota);

        // Prepare events for insertion
        const eventsData = eventsToInsert.map((event) => ({
            projectId: project.id,
            eventName: event.event,
            properties: event.properties || {},
            sessionId: event.session_id,
            userId: event.user_id,
            device: event.device || {},
            timestamp: new Date(event.timestamp),
        }));

        // Batch insert events
        if (eventsData.length > 0) {
            await db.insert(events).values(eventsData);

            // Update event count
            await db
                .update(projects)
                .set({
                    eventsCount: sql`${projects.eventsCount} + ${eventsData.length}`,
                    updatedAt: new Date(),
                })
                .where(eq(projects.id, project.id));
        }

        return NextResponse.json({
            success: true,
            accepted: eventsData.length,
            dropped: body.events.length - eventsData.length,
        });
    } catch (error) {
        console.error("Error processing events:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
