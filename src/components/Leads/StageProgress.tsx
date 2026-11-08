import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(relativeTime);

export interface Stage {
    key: string;
    label: string;
    activeColor?: string;
}

interface Log {
    created_at: string;
    action: string;
    details: string;
}

interface StageProgressProps {
    currentStage: string;
    onStageChange: (stage: string) => void;
    logs: Log[];
    stages: Stage[];
    readOnly?: boolean;
}

export const StageProgress: React.FC<StageProgressProps> = ({
    currentStage,
    onStageChange,
    logs,
    stages,
    readOnly = false,
}) => {

    const stageDurations = useMemo(() => {
        const durations: Record<string, number> = {};

        const sortedLogs = [...logs].sort((a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf());

        if (sortedLogs.length === 0) return {};

        let currentStageKey = 'qualification';
        let stageStartTime = dayjs(sortedLogs[0].created_at);

        const createdLog = sortedLogs.find(l => l.action === 'CREATED');
        if (createdLog) {
            stageStartTime = dayjs(createdLog.created_at);
        }

        sortedLogs.forEach(log => {
            const logTime = dayjs(log.created_at);

            if (log.action === 'STAGE_CHANGE' && log.details) {

                const parts = log.details.split('→');
                if (parts.length === 2) {
                    const newLabel = parts[1].trim();

                    let newStageObj = stages.find(s => s.label === newLabel);

                    if (!newStageObj) {
                        newStageObj = stages.find(s => s.key === newLabel);
                    }

                    if (newStageObj) {

                        const duration = logTime.diff(stageStartTime);
                        durations[currentStageKey] = (durations[currentStageKey] || 0) + duration;

                        currentStageKey = newStageObj.key;
                        stageStartTime = logTime;
                    }
                }
            }
        });

        const now = dayjs();
        const finalDuration = now.diff(stageStartTime);
        durations[currentStageKey] = (durations[currentStageKey] || 0) + finalDuration;

        return durations;
    }, [logs, stages]);

    // Format duration helper
    const formatDuration = (ms: number) => {
        if (!ms) return '';
        const d = dayjs.duration(ms);
        if (d.asYears() >= 1) return `${Math.floor(d.asYears())}Y`;
        if (d.asMonths() >= 1) return `${Math.floor(d.asMonths())}M`;
        if (d.asDays() >= 1) return `${Math.floor(d.asDays())}d`;
        if (d.asHours() >= 1) return `${Math.floor(d.asHours())}h`;
        if (d.asMinutes() >= 1) return `${Math.floor(d.asMinutes())}m`;
        return '1m';
    };

    const currentIndex = stages.findIndex(s => s.key === currentStage);

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="flex items-center min-w-max border rounded-md overflow-hidden bg-slate-100 border-slate-200">
                {stages.map((stage, index) => {
                    const isActive = stage.key === currentStage;
                    const isPast = index < currentIndex;
                    const isFuture = index > currentIndex;

                    let bgClass = "bg-slate-50 text-slate-500 hover:bg-slate-100";
                    if (isPast) bgClass = "bg-slate-50 text-slate-600 hover:bg-slate-100";

                    const activeBgStyle = isActive ? { backgroundColor: stage.activeColor || '#1d4ed8' } : {};
                    const activeTextClass = isActive ? "text-white shadow-md z-10" : "";

                    return (
                        <div
                            key={stage.key}
                            onClick={() => !readOnly && onStageChange(stage.key)}
                            className={`
                                group relative leading-normal
                                flex items-center justify-center
                                px-4 py-2 transition-all duration-200
                                ${readOnly ? '' : 'cursor-pointer'}
                                ${isActive ? activeTextClass : bgClass}
                                ${index !== 0 ? 'pl-8' : ''} 
                            `}
                            style={{
                                ...activeBgStyle,
                                clipPath: "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 8% 50%)",
                                marginLeft: index === 0 ? 0 : "-14px",
                                paddingLeft: index === 0 ? "16px" : "28px",
                                paddingRight: "20px",
                                minWidth: "120px"
                            }}
                        >
                            <span className="text-[13px] font-semibold whitespace-nowrap flex items-center gap-2">
                                {stage.label}
                                {stageDurations[stage.key] ? (
                                    <span className={`text-[11px] opacity-80 font-normal ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {formatDuration(stageDurations[stage.key])}
                                    </span>
                                ) : null}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
