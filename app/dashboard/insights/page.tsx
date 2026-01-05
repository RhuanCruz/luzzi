"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";

interface CountryData {
    country: string;
    count: string;
}

interface LocationData {
    session_id: string;
    country: string;
    city: string;
    latitude: string;
    longitude: string;
}

interface DeviceData {
    name: string;
    value: number;
    percent: number;
}

interface Project {
    id: string;
    name: string;
}

// Country code to emoji flag
const countryToFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return "🌍";
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};

// Colors for device pie chart
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function InsightsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);
    const [devices, setDevices] = useState<DeviceData[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch projects
    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch("/api/v1/projects");
                const data = await res.json();
                setProjects(data.projects || []);
                if (data.projects?.length > 0) {
                    setSelectedProjectId(data.projects[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        }
        fetchProjects();
    }, []);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!selectedProjectId) return;
        setLoading(true);
        try {
            const [geoRes, devicesRes] = await Promise.all([
                fetch(`/api/v1/analytics/geo?projectId=${selectedProjectId}`),
                fetch(`/api/v1/analytics/devices?projectId=${selectedProjectId}`),
            ]);

            const geoData = await geoRes.json();
            const devicesData = await devicesRes.json();

            setCountries(geoData.countries || []);
            setRecentLocations(geoData.recentLocations || []);
            setDevices(devicesData.devices || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedProjectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const totalUsers = countries.reduce((sum, c) => sum + Number(c.count), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Insights</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Geographic and device analytics
                    </p>
                </div>
                {projects.length > 1 && (
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                    >
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* World Map / Country Distribution */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-white text-base font-medium">
                            User Locations
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Geographic distribution (last 30 days)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center text-zinc-400">
                                Loading...
                            </div>
                        ) : countries.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-zinc-500">
                                No location data yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {countries.slice(0, 10).map((country, idx) => {
                                    const percent = totalUsers > 0
                                        ? Math.round((Number(country.count) / totalUsers) * 100)
                                        : 0;
                                    return (
                                        <div key={idx} className="flex items-center gap-3">
                                            <span className="text-2xl">
                                                {countryToFlag(country.country)}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-zinc-300">{country.country}</span>
                                                    <span className="text-zinc-500">{percent}%</span>
                                                </div>
                                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-zinc-400 text-sm w-12 text-right">
                                                {Number(country.count).toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <CardTitle className="text-white text-base font-medium">
                            Devices
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            Platform breakdown (last 30 days)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center text-zinc-400">
                                Loading...
                            </div>
                        ) : devices.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-zinc-500">
                                No device data yet
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <div className="w-48 h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={devices as unknown as Array<Record<string, unknown>>}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {devices.map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#18181b',
                                                    border: '1px solid #3f3f46',
                                                    borderRadius: '8px',
                                                }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {devices.map((device, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                />
                                                <span className="text-zinc-300">{device.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-zinc-400 text-sm">
                                                    {device.value.toLocaleString()}
                                                </span>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-zinc-800 text-zinc-400"
                                                >
                                                    {device.percent}%
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Live Users */}
            {recentLocations.length > 0 && (
                <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-white text-base font-medium">
                                    Live Users
                                </CardTitle>
                                <CardDescription className="text-zinc-500">
                                    Active in the last 5 minutes
                                </CardDescription>
                            </div>
                            <Badge className="bg-green-600 text-white animate-pulse">
                                {recentLocations.length} online
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {recentLocations.map((loc, idx) => (
                                <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-zinc-300 border-zinc-700"
                                >
                                    {countryToFlag(loc.country)}{" "}
                                    {loc.city || loc.country}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
