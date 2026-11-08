import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { CreateMeetingForm } from '@/components/meetings/CreateMeetingForm';

export default function CreateMeeting() {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-['Instrument_Sans']">
            <Header
                title="Create Meeting"
                breadcrumbAction={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>
                }
            />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-12">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <DialogHeader className="p-8 border-b border-slate-100 bg-white">
                            <DialogTitle className="text-2xl font-bold text-slate-800 font-['Instrument_Sans'] flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full bg-[#0B64F4]" />
                                Create Meeting
                            </DialogTitle>
                        </DialogHeader>
                        <CreateMeetingForm
                            entityId={id || ""}
                            entityType="customer"
                            onSuccess={() => navigate(`/meeting-schedule/${id}`)}
                            onCancel={() => navigate(-1)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DialogHeader({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={className}>{children}</div>;
}

function DialogTitle({ children, className }: { children: React.ReactNode, className?: string }) {
    return <h2 className={className}>{children}</h2>;
}
