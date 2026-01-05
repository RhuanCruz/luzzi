import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, projects } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/v1/analytics/geo
 * Get geographic distribution of users for the last 30 days
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

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get country distribution
        const countryData = await db.execute(sql`
            SELECT 
                geo->>'country' as country,
                COUNT(*) as count
            FROM events 
            WHERE project_id = ${projectId}
                AND timestamp >= ${thirtyDaysAgo}
                AND geo->>'country' IS NOT NULL
                AND geo->>'country' != ''
            GROUP BY geo->>'country'
            ORDER BY count DESC
            LIMIT 20
        `);

        // Get recent locations (last 5 minutes for real-time map)
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        const recentLocations = await db.execute(sql`
            SELECT DISTINCT ON (session_id)
                session_id,
                geo->>'country' as country,
                geo->>'city' as city,
                geo->>'latitude' as latitude,
                geo->>'longitude' as longitude,
                timestamp
            FROM events 
            WHERE project_id = ${projectId}
                AND timestamp >= ${fiveMinutesAgo}
                AND geo->>'latitude' IS NOT NULL
            ORDER BY session_id, timestamp DESC
            LIMIT 50
        `);

        return NextResponse.json({
            countries: countryData || [],
            recentLocations: recentLocations || [],
        });
    } catch (error) {
        console.error("Error fetching geo data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
