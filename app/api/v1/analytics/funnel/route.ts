import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { events, projects } from "@/lib/db/schema";
import { eq, and, gte, sql, ilike } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/v1/analytics/funnel
 * Returns funnel data for sequential events
 * Detects events with patterns like: onboarding_step_1, onboarding_step_2, etc.
 * Or events with same prefix: paywall_viewed, paywall_started, paywall_completed
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
        const prefix = searchParams.get("prefix"); // Optional: filter by event prefix

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

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Build base conditions
        const conditions = [
            eq(events.projectId, projectId),
            gte(events.timestamp, thirtyDaysAgo),
        ];

        if (prefix) {
            conditions.push(ilike(events.eventName, `${prefix}%`));
        }

        // Get funnel data - count unique sessions per event
        const funnelData = await db
            .select({
                eventName: events.eventName,
                users: sql<number>`COUNT(DISTINCT ${events.sessionId})`.as("users"),
            })
            .from(events)
            .where(and(...conditions))
            .groupBy(events.eventName)
            .orderBy(events.eventName);

        // Auto-detect funnel patterns
        const patterns = detectFunnelPatterns(funnelData.map((d) => d.eventName));

        // Group funnels by detected patterns
        const funnels = patterns.map((pattern) => {
            const steps = funnelData
                .filter((d) => d.eventName.startsWith(pattern.prefix))
                .sort((a, b) => {
                    // Try to sort by numeric suffix if present
                    const numA = extractNumber(a.eventName);
                    const numB = extractNumber(b.eventName);
                    if (numA !== null && numB !== null) {
                        return numA - numB;
                    }
                    return a.eventName.localeCompare(b.eventName);
                });

            return {
                name: pattern.prefix,
                steps: steps.map((step, index) => ({
                    eventName: step.eventName,
                    users: step.users,
                    dropoff:
                        index > 0
                            ? ((steps[index - 1].users - step.users) / steps[index - 1].users) * 100
                            : 0,
                })),
            };
        });

        return NextResponse.json({
            funnels,
            rawData: funnelData,
        });
    } catch (error) {
        console.error("Error fetching funnel data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Detect funnel patterns from event names
 * Looks for common prefixes like "onboarding_", "paywall_", etc.
 */
function detectFunnelPatterns(
    eventNames: string[]
): Array<{ prefix: string; count: number }> {
    const prefixCounts = new Map<string, number>();

    for (const name of eventNames) {
        // Check for underscore-separated patterns
        const underscoreIndex = name.lastIndexOf("_");
        if (underscoreIndex > 0) {
            const prefix = name.substring(0, underscoreIndex + 1);
            prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
        }
    }

    // Return patterns with at least 2 events
    return Array.from(prefixCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([prefix, count]) => ({ prefix, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Extract number from end of string (e.g., "step_1" -> 1)
 */
function extractNumber(str: string): number | null {
    const match = str.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}
