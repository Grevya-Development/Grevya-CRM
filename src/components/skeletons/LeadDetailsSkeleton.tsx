import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function LeadDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-[#f8fafc] pb-10 animate-pulse">
            {/* Header Placeholder */}
            <div className="z-30 h-16 w-full border-b border-border bg-card/95 backdrop-blur px-4 md:px-6 flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Profile Header Card Skeleton */}
                <Card className="p-6 border border-slate-200 shadow-sm bg-white rounded-xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <Skeleton className="w-20 h-20 rounded-full border-4 border-white shadow-sm" />
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            </div>
                        </div>
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>
                </Card>

                {/* Tabs Skeleton */}
                <div className="flex gap-1 border-b border-slate-200">
                    <Skeleton className="h-[46px] w-36 rounded-t-[6px] rounded-b-none" />
                    <Skeleton className="h-[46px] w-36 rounded-t-[6px] rounded-b-none" />
                </div>

                {/* Content Skeleton */}
                <div className="bg-white border border-slate-200 rounded-lg rounded-tl-none shadow-sm p-6 -mt-[1px] space-y-8">
                    {/* General Information Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="h-6 w-6 rounded" />
                            <Skeleton className="h-6 w-48" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="h-6 w-6 rounded" />
                            <Skeleton className="h-6 w-48" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
