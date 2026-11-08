import { Header } from '@/components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Lead } from '@/types';
import { toast } from 'sonner';
import { Plus, User, Clock, CalendarDays, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersistentToolbar } from '@/components/shared/PersistentToolbar';
import { Separator } from '@/components/ui/separator';

export default function LeadsActivity() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 11;

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Activity types with counts
  const activityTypes = [
    { name: 'Email', count: 2, color: 'bg-red-500' },
    { name: 'Call', count: 6, color1: 'bg-yellow-500', color2: 'bg-red-500', color3: 'bg-green-500' },
    { name: 'Meeting', count: 0, color: 'bg-blue-500' },
    { name: 'Follow-up Quote', count: 0, color: 'bg-purple-500' },
    { name: 'Make Quote', count: 0, color: 'bg-pink-500' },
    { name: 'Call for Demo', count: 0, color: 'bg-orange-500' },
    { name: 'Email: Welcome Demo', count: 0, color: 'bg-teal-500' },
    { name: 'To-Do', count: 0, color: 'bg-indigo-500' },
    { name: 'Upload Document', count: 0, color: 'bg-cyan-500' },
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Qualification':
        return 'bg-amber-500';
      case 'Need Analysis':
        return 'bg-gray-200 text-gray-800';
      case 'Value Proposition':
        return 'bg-red-500';
      case 'Won':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Pipeline"
        breadcrumbAction={
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-2 px-6 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/Leads/add')}>
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <PersistentToolbar
              currentPage={currentPage}
              totalItems={leads.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              currentView="activity"
              showPagination={true}
              showViews={true}
            />
          </div>
        }
      />

      <div className="p-0">
        {/* Activity Timeline Layout */}
        <div className="bg-card overflow-x-auto">
          {/* Activity Types Header */}
          <div className="grid grid-cols-[250px_repeat(9,130px)] border-b min-w-[1420px]">
            <div className="p-4 border-r bg-muted/30"></div>
            {activityTypes.map((type, index) => (
              <div key={index} className="p-3 border-r text-center">
                <div className="text-sm font-medium mb-2">{type.name}</div>
                {type.name === 'Call' ? (
                  <div className="flex justify-center gap-1">
                    <div className="w-6 h-3 bg-yellow-500 rounded-sm"></div>
                    <div className="w-6 h-3 bg-red-500 rounded-sm"></div>
                    <div className="w-6 h-3 bg-green-500 rounded-sm"></div>
                    <span className="ml-1 text-sm font-semibold">{type.count}</span>
                  </div>
                ) : type.name === 'Email' ? (
                  <div className="flex justify-center gap-1">
                    <div className="w-6 h-3 bg-red-500 rounded-sm"></div>
                    <span className="ml-1 text-sm font-semibold">{type.count}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* Leads Timeline */}
          {leads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No activities yet
            </div>
          ) : (
            leads.map((lead) => {
              const createdDate = new Date(lead.created_at);
              const formattedDate = `${createdDate.getMonth() + 1}/${createdDate.getDate()}/${createdDate.getFullYear()}`;

              return (
                <div key={lead.id} className="grid grid-cols-[250px_repeat(9,130px)] border-b hover:bg-muted/20 transition-colors min-w-[1420px]">
                  {/* Lead Info Column */}
                  <div className="p-3 border-r flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{lead.lead_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${getStageColor(lead.lead_stage)}`}>
                          {lead.lead_stage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Date Blocks */}
                  <div className="border-r"></div>
                  <div className="border-r p-2 flex items-center justify-center">
                    {lead.lead_stage === 'Value Proposition' && (
                      <div className="bg-red-500 text-white text-xs px-3 py-8 rounded text-center w-full">
                        <div className="font-semibold">{formattedDate}</div>
                        <div className="mt-1">
                          <User className="h-4 w-4 mx-auto" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-r"></div>
                  <div className="border-r"></div>
                  <div className="border-r"></div>
                  <div className="border-r"></div>
                  <div className="border-r"></div>
                  <div className="border-r"></div>
                  <div></div>
                </div>
              );
            })
          )}

          {/* Schedule Activity Button */}
          <div className="p-4 border-t">
            <button className="text-primary text-sm flex items-center gap-2 hover:underline">
              <span className="text-lg">+</span>
              Schedule activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
