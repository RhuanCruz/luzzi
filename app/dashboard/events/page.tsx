"use client";

import { useEffect, useState, useMemo } from "react";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
} from "@tanstack/react-table";
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconRefresh,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Event {
    id: string;
    eventName: string;
    sessionId: string;
    userId: string | null;
    properties: Record<string, unknown>;
    device: {
        os?: string;
        browser?: string;
        screenWidth?: number;
        screenHeight?: number;
    };
    geo?: {
        country?: string;
        city?: string;
        region?: string;
    };
    timestamp: string;
}

interface Project {
    id: string;
    name: string;
}

const columns: ColumnDef<Event>[] = [
    {
        accessorKey: "eventName",
        header: "Event",
        cell: ({ row }) => (
            <Badge variant="outline" className="text-zinc-300 border-zinc-700">
                {row.original.eventName}
            </Badge>
        ),
    },
    {
        accessorKey: "timestamp",
        header: "Time",
        cell: ({ row }) => {
            const date = new Date(row.original.timestamp);
            return (
                <span className="text-zinc-400 text-sm">
                    {date.toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })}
                </span>
            );
        },
    },
    {
        accessorKey: "sessionId",
        header: "Session",
        cell: ({ row }) => (
            <span className="text-zinc-500 text-xs font-mono">
                {row.original.sessionId?.substring(0, 8)}...
            </span>
        ),
    },
    {
        accessorKey: "userId",
        header: "User",
        cell: ({ row }) => (
            <span className="text-zinc-400 text-sm">
                {row.original.userId || "—"}
            </span>
        ),
    },
    {
        accessorKey: "device",
        header: "Device",
        cell: ({ row }) => {
            const device = row.original.device || {};
            return (
                <span className="text-zinc-500 text-xs">
                    {device.os || "Unknown"} • {device.browser || "Unknown"}
                </span>
            );
        },
    },
    {
        accessorKey: "geo",
        header: "Location",
        cell: ({ row }) => {
            const geo = row.original.geo || {};
            if (!geo.country) return <span className="text-zinc-600">—</span>;
            // Decode URL-encoded city names from Vercel headers
            let city = geo.city || "";
            try {
                city = decodeURIComponent(city);
            } catch {
                // If decoding fails, use as-is
            }
            return (
                <span className="text-zinc-400 text-sm">
                    {city ? `${city}, ` : ""}{geo.country}
                </span>
            );
        },
    },
    {
        accessorKey: "properties",
        header: "Properties",
        cell: ({ row }) => {
            const props = row.original.properties || {};
            const entries = Object.entries(props).slice(0, 2);
            if (entries.length === 0) return <span className="text-zinc-600">—</span>;
            return (
                <div className="flex gap-1 flex-wrap">
                    {entries.map(([key, value]) => (
                        <Badge
                            key={key}
                            variant="secondary"
                            className="bg-zinc-800 text-zinc-400 text-xs"
                        >
                            {key}: {String(value)}
                        </Badge>
                    ))}
                    {Object.keys(props).length > 2 && (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 text-xs">
                            +{Object.keys(props).length - 2}
                        </Badge>
                    )}
                </div>
            );
        },
    },
];

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [autoRefresh, setAutoRefresh] = useState(false);

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

    // Fetch events
    const fetchEvents = async () => {
        if (!selectedProjectId) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/v1/analytics/events?projectId=${selectedProjectId}&limit=100`
            );
            const data = await res.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [selectedProjectId]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, selectedProjectId]);

    // Unique event names for filter
    const eventNames = useMemo(() => {
        const names = new Set(events.map((e) => e.eventName));
        return Array.from(names);
    }, [events]);

    const table = useReactTable({
        data: events,
        columns,
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: {
            pagination: { pageSize: 20 },
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Events</h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Real-time event history from your SDK
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={autoRefresh ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={
                            autoRefresh
                                ? "bg-green-600 hover:bg-green-700"
                                : "border-zinc-700 text-zinc-300"
                        }
                    >
                        {autoRefresh ? "Live" : "Auto-refresh"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchEvents}
                        className="border-zinc-700 text-zinc-300"
                    >
                        <IconRefresh className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-zinc-900/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white text-base font-medium">
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        {/* Project Select */}
                        <div className="w-48">
                            <Select
                                value={selectedProjectId}
                                onValueChange={setSelectedProjectId}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    {projects.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={project.id}
                                            className="text-white focus:bg-zinc-700"
                                        >
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Event Name Filter */}
                        <div className="w-48">
                            <Select
                                value={
                                    (table.getColumn("eventName")?.getFilterValue() as string) ||
                                    "all"
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn("eventName")
                                        ?.setFilterValue(value === "all" ? "" : value)
                                }
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="All events" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="all" className="text-white focus:bg-zinc-700">
                                        All events
                                    </SelectItem>
                                    {eventNames.map((name) => (
                                        <SelectItem
                                            key={name}
                                            value={name}
                                            className="text-white focus:bg-zinc-700"
                                        >
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search */}
                        <Input
                            placeholder="Search by session or user..."
                            value={
                                (table.getColumn("sessionId")?.getFilterValue() as string) ?? ""
                            }
                            onChange={(e) =>
                                table.getColumn("sessionId")?.setFilterValue(e.target.value)
                            }
                            className="w-64 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-zinc-900/50">
                <CardContent className="p-2">
                    <div className="overflow-hidden rounded-lg">
                        <Table>
                            <TableHeader className="bg-zinc-800/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id} className="border-zinc-800">
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id} className="text-zinc-400">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center text-zinc-400"
                                        >
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="border-zinc-800 hover:bg-zinc-800/50"
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center text-zinc-400"
                                        >
                                            No events yet. Integrate the SDK to start tracking.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 border-t border-zinc-800">
                        <div className="text-zinc-500 text-sm">
                            {table.getFilteredRowModel().rows.length} events
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-zinc-700"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-zinc-700"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-zinc-400 text-sm px-2">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-zinc-700"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-zinc-700"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <IconChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
