import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, projects } from "@/lib/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/v1/analytics/overview
 * Returns overview metrics for the dashboard:
 * - DAU (Daily Active Users) - last 30 days
 * - Events per day - last 7 days
 * - Top 10 events - last 30 days
 * - Live feed - last 50 events
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { error: "projectId is required" },
                { status: 400 }
            );
        }

        // Verify project ownership
        const project = await db.query.projects.findFirst({
            where: and(
                eq(projects.id, projectId),
                eq(projects.userId, session.user.id)
            ),
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // DAU - Last 30 days
        const dauData = await db
            .select({
                day: sql<string>`DATE(${events.timestamp})`.as("day"),
                dau: sql<number>`COUNT(DISTINCT ${events.sessionId})`.as("dau"),
            })
            .from(events)
            .where(
                and(
                    eq(events.projectId, projectId),
                    gte(events.timestamp, thirtyDaysAgo)
                )
            )
            .groupBy(sql`DATE(${events.timestamp})`)
            .orderBy(sql`DATE(${events.timestamp})`);

        // Events per day - Last 7 days
        const eventsPerDay = await db
            .select({
                day: sql<string>`DATE(${events.timestamp})`.as("day"),
                total: sql<number>`COUNT(*)`.as("total"),
            })
            .from(events)
            .where(
                and(
                    eq(events.projectId, projectId),
                    gte(events.timestamp, sevenDaysAgo)
                )
            )
            .groupBy(sql`DATE(${events.timestamp})`)
            .orderBy(sql`DATE(${events.timestamp})`);

        // Top 10 events - Last 30 days
        const topEvents = await db
            .select({
                eventName: events.eventName,
                total: sql<number>`COUNT(*)`.as("total"),
            })
            .from(events)
            .where(
                and(
                    eq(events.projectId, projectId),
                    gte(events.timestamp, thirtyDaysAgo)
                )
            )
            .groupBy(events.eventName)
            .orderBy(sql`COUNT(*) DESC`)
            .limit(10);

        // Live feed - Last 50 events
        const liveFeed = await db
            .select({
                id: events.id,
                eventName: events.eventName,
                properties: events.properties,
                device: events.device,
                timestamp: events.timestamp,
                sessionId: events.sessionId,
                userId: events.userId,
            })
            .from(events)
            .where(eq(events.projectId, projectId))
            .orderBy(desc(events.timestamp))
            .limit(50);

        // Total events count
        const totalEventsResult = await db
            .select({
                count: sql<number>`COUNT(*)`.as("count"),
            })
            .from(events)
            .where(eq(events.projectId, projectId));

        // Total unique sessions
        const uniqueSessionsResult = await db
            .select({
                count: sql<number>`COUNT(DISTINCT ${events.sessionId})`.as("count"),
            })
            .from(events)
            .where(
                and(
                    eq(events.projectId, projectId),
                    gte(events.timestamp, thirtyDaysAgo)
                )
            );

        return NextResponse.json({
            dau: dauData,
            eventsPerDay,
            topEvents,
            liveFeed,
            summary: {
                totalEvents: totalEventsResult[0]?.count || 0,
                uniqueSessions30d: uniqueSessionsResult[0]?.count || 0,
                eventsLimit: project.eventsLimit,
                eventsCount: project.eventsCount,
            },
        });
    } catch (error) {
        console.error("Error fetching analytics overview:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
