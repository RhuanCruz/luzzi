import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, projects } from "@/lib/db/schema";
import { eq, and, desc, ilike, gte, lte } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/v1/analytics/events
 * Returns paginated list of events with filtering options
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
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
        const eventName = searchParams.get("eventName");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

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

        // Build conditions
        const conditions = [eq(events.projectId, projectId)];

        if (eventName) {
            conditions.push(ilike(events.eventName, `%${eventName}%`));
        }

        if (startDate) {
            conditions.push(gte(events.timestamp, new Date(startDate)));
        }

        if (endDate) {
            conditions.push(lte(events.timestamp, new Date(endDate)));
        }

        const offset = (page - 1) * limit;

        // Get events
        const eventsList = await db
            .select()
            .from(events)
            .where(and(...conditions))
            .orderBy(desc(events.timestamp))
            .limit(limit)
            .offset(offset);

        // Get total count for pagination
        const countResult = await db
            .select({
                count: events.id,
            })
            .from(events)
            .where(and(...conditions));

        const totalCount = countResult.length;
        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            events: eventsList,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
