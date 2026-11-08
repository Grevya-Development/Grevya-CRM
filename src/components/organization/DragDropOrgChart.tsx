import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OrgMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  level: 'executive' | 'director' | 'manager' | 'individual';
  reportsTo: string | null;
}

const initialMembers: OrgMember[] = [
  { id: '1', name: 'James Anderson', role: 'CEO', department: 'Executive', avatar: 'JA', level: 'executive', reportsTo: null },
  { id: '2', name: 'Sarah Mitchell', role: 'VP Sales', department: 'Sales', avatar: 'SM', level: 'director', reportsTo: '1' },
  { id: '3', name: 'David Chen', role: 'VP Marketing', department: 'Marketing', avatar: 'DC', level: 'director', reportsTo: '1' },
  { id: '4', name: 'John Smith', role: 'Sales Manager', department: 'Sales', avatar: 'JS', level: 'manager', reportsTo: '2' },
  { id: '5', name: 'Jane Doe', role: 'Marketing Manager', department: 'Marketing', avatar: 'JD', level: 'manager', reportsTo: '3' },
  { id: '6', name: 'Mike Wilson', role: 'Sales Rep', department: 'Sales', avatar: 'MW', level: 'individual', reportsTo: '4' },
  { id: '7', name: 'Emily Brown', role: 'Sales Rep', department: 'Sales', avatar: 'EB', level: 'individual', reportsTo: '4' },
];

const levelColors = {
  executive: { border: 'border-purple-500', bg: 'bg-purple-500', text: 'text-purple-500' },
  director: { border: 'border-primary', bg: 'bg-primary', text: 'text-primary' },
  manager: { border: 'border-green-500', bg: 'bg-green-500', text: 'text-green-500' },
  individual: { border: 'border-orange-500', bg: 'bg-orange-500', text: 'text-orange-500' },
};

interface OrgNodeProps {
  member: OrgMember;
  allMembers: OrgMember[];
  onDragStart: (member: OrgMember) => void;
  onDrop: (targetMember: OrgMember) => void;
  onEdit: (member: OrgMember) => void;
  onDelete: (memberId: string) => void;
  isDragging: boolean;
  draggedMember: OrgMember | null;
  level?: number;
}

const OrgNode: React.FC<OrgNodeProps> = ({
  member,
  allMembers,
  onDragStart,
  onDrop,
  onEdit,
  onDelete,
  isDragging,
  draggedMember,
  level = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [isDragOver, setIsDragOver] = useState(false);
  const directReports = allMembers.filter(m => m.reportsTo === member.id);
  const hasReports = directReports.length > 0;
  const colors = levelColors[member.level];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedMember && draggedMember.id !== member.id) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedMember && draggedMember.id !== member.id) {
      onDrop(member);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        draggable
        onDragStart={() => onDragStart(member)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative p-4 bg-card border-2 rounded-lg w-56 shadow-sm transition-all cursor-grab active:cursor-grabbing',
          colors.border,
          isDragging && draggedMember?.id === member.id && 'opacity-50',
          isDragOver && 'ring-2 ring-primary ring-offset-2 scale-105'
        )}
      >
        <div className="absolute top-2 left-2 cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex flex-col items-center text-center pt-2">
          <Avatar className={cn('h-12 w-12 border-2', colors.bg)}>
            <AvatarFallback className="bg-transparent text-white font-semibold">
              {member.avatar}
            </AvatarFallback>
          </Avatar>
          <h4 className="font-semibold text-sm mt-2">{member.name}</h4>
          <p className="text-xs text-muted-foreground">{member.role}</p>
          <Badge variant="outline" className="text-xs mt-1">{member.department}</Badge>

          <div className="flex gap-1 mt-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(member)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            {member.level !== 'executive' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onDelete(member.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {hasReports && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-background border shadow-sm p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {hasReports && isExpanded && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="relative flex gap-6">
            {directReports.length > 1 && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                style={{ width: `calc(${(directReports.length - 1) * 100}% + ${(directReports.length - 1) * 24}px)` }}
              />
            )}
            {directReports.map(report => (
              <div key={report.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border" />
                <OrgNode
                  member={report}
                  allMembers={allMembers}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDragging={isDragging}
                  draggedMember={draggedMember}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const DragDropOrgChart: React.FC = () => {
  const [members, setMembers] = useState<OrgMember[]>(initialMembers);
  const [draggedMember, setDraggedMember] = useState<OrgMember | null>(null);
  const [editingMember, setEditingMember] = useState<OrgMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  const ceo = members.find(m => m.reportsTo === null);

  const handleDragStart = (member: OrgMember) => {
    setDraggedMember(member);
  };

  const handleDrop = (targetMember: OrgMember) => {
    if (!draggedMember || draggedMember.id === targetMember.id) return;

    // Prevent circular hierarchy
    const isDescendant = (parentId: string, childId: string): boolean => {
      const children = members.filter(m => m.reportsTo === parentId);
      if (children.some(c => c.id === childId)) return true;
      return children.some(c => isDescendant(c.id, childId));
    };

    if (isDescendant(draggedMember.id, targetMember.id)) {
      toast.error('Cannot move a member under their own subordinate');
      setDraggedMember(null);
      return;
    }

    setMembers(members.map(m =>
      m.id === draggedMember.id ? { ...m, reportsTo: targetMember.id } : m
    ));
    toast.success(`${draggedMember.name} now reports to ${targetMember.name}`);
    setDraggedMember(null);
  };

  const handleEdit = (member: OrgMember) => {
    setEditingMember(member);
    setIsAddMode(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMember({
      id: '',
      name: '',
      role: '',
      department: '',
      avatar: '',
      level: 'individual',
      reportsTo: ceo?.id || null,
    });
    setIsAddMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (memberId: string) => {
    // Move subordinates to the deleted member's manager
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    setMembers(prev => prev
      .filter(m => m.id !== memberId)
      .map(m => m.reportsTo === memberId ? { ...m, reportsTo: member.reportsTo } : m)
    );
    toast.success('Member removed from org chart');
  };

  const handleSave = () => {
    if (!editingMember) return;

    if (isAddMode) {
      const newMember: OrgMember = {
        ...editingMember,
        id: Date.now().toString(),
        avatar: editingMember.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      };
      setMembers([...members, newMember]);
      toast.success('New member added');
    } else {
      setMembers(members.map(m =>
        m.id === editingMember.id ? editingMember : m
      ));
      toast.success('Member updated');
    }
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Drag & Drop Organization Chart
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Member
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Drag and drop members to reorganize the hierarchy
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-8">
        <div className="flex justify-center min-w-max pt-4">
          {ceo && (
            <OrgNode
              member={ceo}
              allMembers={members}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDragging={!!draggedMember}
              draggedMember={draggedMember}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-8 text-sm">
          {Object.entries(levelColors).map(([level, colors]) => (
            <div key={level} className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', colors.bg)} />
              <span className="capitalize">{level}</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddMode ? 'Add New Member' : 'Edit Member'}</DialogTitle>
            <DialogDescription>
              {isAddMode ? 'Add a new member to the organization' : 'Update member details'}
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    placeholder="Job title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={editingMember.department}
                    onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value })}
                    placeholder="Department"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select
                    value={editingMember.level}
                    onValueChange={(v: any) => setEditingMember({ ...editingMember, level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reports To</Label>
                <Select
                  value={editingMember.reportsTo || 'none'}
                  onValueChange={(v) => setEditingMember({ ...editingMember, reportsTo: v === 'none' ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {members
                      .filter(m => m.id !== editingMember.id)
                      .map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} - {m.role}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
