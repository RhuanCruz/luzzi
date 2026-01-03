"use client";

import { useSession } from "@/lib/auth-client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
    const { data: session } = useSession();

    const handleSupport = () => {
        window.open("mailto:support@luzzi.dev?subject=Luzzi Support Request", "_blank");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-white">Settings</h1>
                <p className="text-zinc-400 text-sm mt-1">
                    Manage your account settings
                </p>
            </div>

            {/* Account Info */}
            <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="text-white text-base font-medium">
                        Account
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Your account information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400">Name</p>
                            <p className="text-white">{session?.user?.name || "—"}</p>
                        </div>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400">Email</p>
                            <p className="text-white">{session?.user?.email || "—"}</p>
                        </div>
                    </div>
                    <Separator className="bg-zinc-800" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400">Account ID</p>
                            <p className="text-zinc-500 text-sm font-mono">
                                {session?.user?.id || "—"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Support */}
            <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="text-white text-base font-medium">
                        Support
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Get help with Luzzi
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white">Need help?</p>
                            <p className="text-zinc-400 text-sm">
                                Contact our support team for assistance
                            </p>
                        </div>
                        <Button
                            onClick={handleSupport}
                            variant="outline"
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Contact Support
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Plan */}
            <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                    <CardTitle className="text-white text-base font-medium">
                        Plan
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                        Your current subscription
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white">Free Plan</p>
                            <p className="text-zinc-400 text-sm">
                                10,000 events per month
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            disabled
                            className="border-zinc-700 text-zinc-500"
                        >
                            Upgrade (coming soon)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
