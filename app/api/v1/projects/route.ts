import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, generateApiKey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * GET /api/v1/projects
 * List all projects for the authenticated user
 */
export async function GET() {
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

        const userProjects = await db.query.projects.findMany({
            where: eq(projects.userId, session.user.id),
            orderBy: (projects, { desc }) => [desc(projects.createdAt)],
        });

        return NextResponse.json({ projects: userProjects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/v1/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();

        if (!body.name || typeof body.name !== "string") {
            return NextResponse.json(
                { error: "Project name is required" },
                { status: 400 }
            );
        }

        // Generate unique API keys
        const apiKeyLive = generateApiKey("pk_live");
        const apiKeyTest = generateApiKey("pk_test");

        // Calculate events reset date (first day of next month)
        const now = new Date();
        const eventsResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const [newProject] = await db
            .insert(projects)
            .values({
                name: body.name.trim(),
                userId: session.user.id,
                apiKeyLive,
                apiKeyTest,
                eventsResetAt,
            })
            .returning();

        return NextResponse.json({ project: newProject }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
