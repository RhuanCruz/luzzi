import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, projects } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/v1/analytics/devices
 * Get device distribution (OS breakdown)
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

        // Get OS distribution
        const osData = await db.execute(sql`
            SELECT 
                COALESCE(device->>'os', 'unknown') as os,
                COUNT(*) as count
            FROM events 
            WHERE project_id = ${projectId}
                AND timestamp >= ${thirtyDaysAgo}
            GROUP BY device->>'os'
            ORDER BY count DESC
        `);

        // Normalize OS names for display
        const rawData = osData as unknown as Array<{ os: string; count: string }>;
        const devices = (rawData || []).map((row) => {
            let name = String(row.os).toLowerCase();
            let displayName = name;

            if (name === "ios") displayName = "iOS";
            else if (name === "android") displayName = "Android";
            else if (name === "macos" || name === "darwin") displayName = "macOS";
            else if (name === "windows") displayName = "Windows";
            else if (name === "linux") displayName = "Linux";
            else if (name === "unknown" || name === "null" || !name) displayName = "Unknown";
            else displayName = name.charAt(0).toUpperCase() + name.slice(1);

            return {
                name: displayName,
                value: Number(row.count),
            };
        });

        // Calculate totals
        const total = devices.reduce((sum: number, d: { value: number }) => sum + d.value, 0);
        const devicesWithPercent = devices.map((d: { name: string; value: number }) => ({
            ...d,
            percent: total > 0 ? Math.round((d.value / total) * 100) : 0,
        }));

        return NextResponse.json({
            devices: devicesWithPercent,
            total,
        });
    } catch (error) {
        console.error("Error fetching device data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
