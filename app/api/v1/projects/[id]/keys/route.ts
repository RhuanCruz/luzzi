import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, generateApiKey } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/projects/:id/keys
 * Regenerate API keys for a project
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const { id } = await params;
        const body = await request.json();
        const keyType = body.keyType as "live" | "test" | "both";

        // Verify ownership
        const project = await db.query.projects.findFirst({
            where: and(
                eq(projects.id, id),
                eq(projects.userId, session.user.id)
            ),
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Generate new keys based on type
        const updates: Partial<{ apiKeyLive: string; apiKeyTest: string; updatedAt: Date }> = {
            updatedAt: new Date(),
        };

        if (keyType === "live" || keyType === "both") {
            updates.apiKeyLive = generateApiKey("pk_live");
        }
        if (keyType === "test" || keyType === "both") {
            updates.apiKeyTest = generateApiKey("pk_test");
        }

        const [updatedProject] = await db
            .update(projects)
            .set(updates)
            .where(eq(projects.id, id))
            .returning();

        return NextResponse.json({
            project: updatedProject,
            regenerated: keyType,
        });
    } catch (error) {
        console.error("Error regenerating keys:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
