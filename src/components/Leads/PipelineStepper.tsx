import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

import { LucideIcon } from "lucide-react"

interface StageConfig {
    name: string;
    color: string;
    icon: LucideIcon;
}

interface PipelineStepperProps {
    currentStep: number;
    stages?: StageConfig[];
    onStageClick?: (stage: string) => void;
}

export default function PipelineStepper({ currentStep, stages = [], onStageClick }: PipelineStepperProps) {
    return (
        <div className="flex items-center w-full bg-white border border-slate-200 rounded-lg overflow-hidden h-10">
            {stages.map((stage, index) => {
                const isCompleted = index < currentStep
                const isActive = index === currentStep
                const isFirst = index === 0
                const isLast = index === stages.length - 1

                const isReached = isCompleted || isActive
                const Icon = stage.icon

                return (
                    <div
                        key={stage.name}
                        onClick={() => onStageClick?.(stage.name)}
                        className={cn(
                            "relative flex-1 h-full flex items-center justify-center transition-all duration-200",
                            onStageClick && "cursor-pointer hover:opacity-90",
                            isReached ? `${stage.color} text-white` : "bg-slate-50 text-slate-500",
                            !isFirst && "-ml-[12px]"
                        )}
                        style={{
                            clipPath: isFirst
                                ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)"
                                : isLast
                                    ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)"
                                    : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)",
                            zIndex: stages.length - index
                        }}
                    >
                        <div className={cn(
                            "flex items-center gap-1.5 whitespace-nowrap px-4",
                            !isFirst && "pl-6"
                        )}>
                            <div
                                className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full shrink-0",
                                    isReached ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                                )}
                            >
                                {isReached ? <Icon size={14} /> : <Lock size={14} />}
                            </div>

                            <span className="text-[12px] font-medium truncate">
                                {stage.name}
                            </span>
                        </div>

                        {!isReached && !isLast && (
                            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-slate-200" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, -12px 50%)" }} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
