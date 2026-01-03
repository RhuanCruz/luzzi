"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BarChart3, Key, Settings, LogOut } from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/keys", label: "API Keys", icon: Key },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, isPending } = useSession();

    const handleSignOut = async () => {
        await signOut();
        router.push("/sign-in");
    };

    // Show loading state
    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-zinc-400">Loading...</div>
            </div>
        );
    }

    // Redirect to sign-in if not authenticated
    if (!session) {
        router.push("/sign-in");
        return null;
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            {/* Minimal Toolbar */}
            <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/dashboard" className="text-xl font-semibold text-white">
                        Luzzi
                    </Link>

                    {/* Centered Navigation with Icons */}
                    <nav className="flex items-center gap-1 border border-zinc-800 rounded-full p-1">
                        {navItems.map((item) => {
                            const isActive =
                                item.href === "/dashboard"
                                    ? pathname === "/dashboard"
                                    : pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive
                                            ? "bg-white text-black"
                                            : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                        }`}
                                    title={item.label}
                                >
                                    <Icon className="w-5 h-5" />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="text-zinc-400 hover:text-white hover:bg-transparent gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </div>
    );
}
