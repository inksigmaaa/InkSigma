"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function StatsPopup({ isOpen, onClose, stats }) {
    if (!stats) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-3xl p-6" showClose={false}>
                <DialogTitle className="sr-only">Article Statistics</DialogTitle>
                <div className="flex items-center gap-4 w-full">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-center border border-gray-300 rounded-md p-6 bg-gray-50 min-h-24">
                            <div className="text-4xl font-bold text-gray-900 mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
