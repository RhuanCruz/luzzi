"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Project {
    id: string;
    name: string;
    apiKeyLive: string;
    apiKeyTest: string;
    plan: string;
    eventsCount: number;
    eventsLimit: number;
    createdAt: string;
}

export default function ApiKeysPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [newProjectName, setNewProjectName] = useState("");
    const [creating, setCreating] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [regenerating, setRegenerating] = useState<string | null>(null);

    // Fetch projects
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/v1/projects");
            const data = await res.json();
            setProjects(data.projects || []);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    };

    // Create project
    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch("/api/v1/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newProjectName.trim() }),
            });
            const data = await res.json();
            if (data.project) {
                setProjects([data.project, ...projects]);
                setNewProjectName("");
            }
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setCreating(false);
        }
    };

    // Copy to clipboard
    const handleCopy = async (key: string, keyId: string) => {
        await navigator.clipboard.writeText(key);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Regenerate key
    const handleRegenerate = async (projectId: string, keyType: "live" | "test") => {
        setRegenerating(`${projectId}-${keyType}`);
        try {
            const res = await fetch(`/api/v1/projects/${projectId}/keys`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyType }),
            });
            const data = await res.json();
            if (data.project) {
                setProjects(
                    projects.map((p) => (p.id === projectId ? data.project : p))
                );
            }
        } catch (error) {
            console.error("Failed to regenerate key:", error);
        } finally {
            setRegenerating(null);
        }
    };

    // Mask API key
    const maskKey = (key: string) => {
        if (!key) return "";
        return key.substring(0, 12) + "•".repeat(20) + key.substring(key.length - 4);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-white">API Keys</h1>
                <p className="text-zinc-400 text-sm mt-1">
                    Manage your project API keys for the SDK
                </p>
            </div>

            {/* Create New Project */}
            <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="text-white text-base font-medium">
                        Create New Project
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Each project gets unique API keys
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project name"
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                        />
                        <Button
                            onClick={handleCreateProject}
                            disabled={creating || !newProjectName.trim()}
                            className="bg-white text-black hover:bg-zinc-200"
                        >
                            {creating ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Projects List */}
            <div className="space-y-4">
                {projects.map((project) => (
                    <Card key={project.id} className="border-zinc-800 bg-zinc-900/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-white text-base font-medium">
                                        {project.name}
                                    </CardTitle>
                                    <CardDescription className="text-zinc-500">
                                        Created{" "}
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="bg-zinc-800 text-zinc-300"
                                >
                                    {project.plan}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Live Key */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-zinc-400">Live Key</span>
                                    <Badge className="bg-green-900/30 text-green-400 border-green-800">
                                        Production
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-300 text-sm font-mono">
                                        {maskKey(project.apiKeyLive)}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleCopy(project.apiKeyLive, `${project.id}-live`)
                                        }
                                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                    >
                                        {copiedKey === `${project.id}-live` ? "Copied!" : "Copy"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRegenerate(project.id, "live")}
                                        disabled={regenerating === `${project.id}-live`}
                                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                    >
                                        {regenerating === `${project.id}-live`
                                            ? "..."
                                            : "Regenerate"}
                                    </Button>
                                </div>
                            </div>

                            {/* Test Key */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-zinc-400">Test Key</span>
                                    <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-800">
                                        Development
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-300 text-sm font-mono">
                                        {maskKey(project.apiKeyTest)}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleCopy(project.apiKeyTest, `${project.id}-test`)
                                        }
                                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                    >
                                        {copiedKey === `${project.id}-test` ? "Copied!" : "Copy"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRegenerate(project.id, "test")}
                                        disabled={regenerating === `${project.id}-test`}
                                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                    >
                                        {regenerating === `${project.id}-test`
                                            ? "..."
                                            : "Regenerate"}
                                    </Button>
                                </div>
                            </div>

                            {/* Usage */}
                            <div className="pt-4 border-t border-zinc-800">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Events this month</span>
                                    <span className="text-zinc-300">
                                        {project.eventsCount.toLocaleString()} /{" "}
                                        {project.eventsLimit.toLocaleString()}
                                    </span>
                                </div>
                                <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{
                                            width: `${Math.min(
                                                (project.eventsCount / project.eventsLimit) * 100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div className="text-center py-12 text-zinc-400">
                        No projects yet. Create your first project above.
                    </div>
                )}
            </div>
        </div>
    );
}
