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
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

interface Project {
    id: string;
    name: string;
    eventsCount: number;
    eventsLimit: number;
}

interface DauData {
    day: string;
    dau: number;
}

interface EventsPerDay {
    day: string;
    total: number;
}

interface TopEvent {
    eventName: string;
    total: number;
}

interface LiveEvent {
    id: string;
    eventName: string;
    timestamp: string;
    device: {
        os?: string;
        browser?: string;
    };
}

interface AnalyticsData {
    dau: DauData[];
    eventsPerDay: EventsPerDay[];
    topEvents: TopEvent[];
    liveFeed: LiveEvent[];
    summary: {
        totalEvents: number;
        uniqueSessions30d: number;
        eventsLimit: number;
        eventsCount: number;
    };
}

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatingProject, setCreatingProject] = useState(false);

    // Fetch projects
    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch("/api/v1/projects");
                const data = await res.json();
                setProjects(data.projects || []);
                if (data.projects?.length > 0) {
                    setSelectedProject(data.projects[0]);
                }
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProjects();
    }, []);

    // Fetch analytics when project selected
    useEffect(() => {
        async function fetchAnalytics() {
            if (!selectedProject) return;
            try {
                const res = await fetch(
                    `/api/v1/analytics/overview?projectId=${selectedProject.id}`
                );
                const data = await res.json();
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            }
        }
        fetchAnalytics();
    }, [selectedProject]);

    // Create first project
    const handleCreateProject = async () => {
        setCreatingProject(true);
        try {
            const res = await fetch("/api/v1/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: "My First Project" }),
            });
            const data = await res.json();
            if (data.project) {
                setProjects([data.project]);
                setSelectedProject(data.project);
            }
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setCreatingProject(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    // No projects - show create button
    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <h2 className="text-xl text-white">Welcome to Luzzi</h2>
                <p className="text-zinc-400">Create your first project to get started</p>
                <Button
                    onClick={handleCreateProject}
                    disabled={creatingProject}
                    className="bg-white text-black hover:bg-zinc-200"
                >
                    {creatingProject ? "Creating..." : "Create Project"}
                </Button>
            </div>
        );
    }

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">
                        {selectedProject?.name}
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        {analytics?.summary.eventsCount.toLocaleString() || 0} /{" "}
                        {analytics?.summary.eventsLimit.toLocaleString() || "10,000"} events
                        this month
                    </p>
                </div>
            </div>

            {/* Main Area Chart - DAU */}
            <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="text-white text-base font-medium">
                        Daily Active Users
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Unique sessions over the last 30 days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={analytics?.dau || []}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="day"
                                    tickFormatter={formatDate}
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#18181b",
                                        border: "1px solid #27272a",
                                        borderRadius: "8px",
                                    }}
                                    labelStyle={{ color: "#a1a1aa" }}
                                    itemStyle={{ color: "#3b82f6" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="dau"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorDau)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Events per Day */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-white text-base font-medium">
                            Events / Day
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Last 7 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics?.eventsPerDay || []}>
                                    <XAxis
                                        dataKey="day"
                                        tickFormatter={formatDate}
                                        stroke="#52525b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            border: "1px solid #27272a",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Events */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-white text-base font-medium">
                            Top Events
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Last 30 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics?.topEvents?.slice(0, 5).map((event, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="text-zinc-300 text-sm truncate max-w-[70%]">
                                        {event.eventName}
                                    </span>
                                    <span className="text-zinc-500 text-sm">
                                        {event.total.toLocaleString()}
                                    </span>
                                </div>
                            )) || (
                                    <p className="text-zinc-500 text-sm">No events yet</p>
                                )}
                        </div>
                    </CardContent>
                </Card>

                {/* Live Feed */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-white text-base font-medium">
                            Live Feed
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Recent events
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics?.liveFeed?.slice(0, 5).map((event) => (
                                <div key={event.id} className="flex justify-between items-center">
                                    <span className="text-zinc-300 text-sm truncate max-w-[70%]">
                                        {event.eventName}
                                    </span>
                                    <span className="text-zinc-500 text-xs">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            )) || (
                                    <p className="text-zinc-500 text-sm">No events yet</p>
                                )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
