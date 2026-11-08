import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/supabase/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Users,
  Key,
  Eye,
  FileEdit,
  Download,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { log } from 'console';
import { usePermission } from '@/contexts/PermissionContext';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

// const initialRoles: Role[] = [
//   { id: '1', name: 'Admin', description: 'Full system access', permissions: allPermissions.map(p => p.id), userCount: 2 },
//   { id: '2', name: 'Sales Manager', description: 'Manage team and Leads', permissions: ['contacts.view', 'contacts.create', 'contacts.edit', 'Leads.view', 'Leads.create', 'Leads.edit', 'reports.view', 'reports.export'], userCount: 5 },
//   { id: '3', name: 'Sales Rep', description: 'Basic sales operations', permissions: ['contacts.view', 'contacts.create', 'Leads.view', 'Leads.create'], userCount: 12 },
//   { id: '4', name: 'Viewer', description: 'Read-only access', permissions: ['contacts.view', 'Leads.view', 'reports.view'], userCount: 8 },
// ];

// const users: UserWithRole[] = [
//   { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Admin', lastActive: '2024-12-05T14:30:00', avatar: "" },
//   { id: '2', name: 'Jane Doe', email: 'jane@company.com', role: 'Sales Manager', lastActive: '2024-12-05T14:25:00', avatar: "" },
//   { id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'Sales Rep', lastActive: '2024-12-05T12:00:00', avatar: "" },
//   { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Sales Rep', lastActive: '2024-12-05T10:45:00', avatar: "" },
//   { id: '5', name: 'Emily Brown', email: 'emily@company.com', role: 'Viewer', lastActive: '2024-12-04T16:30:00' },
// ];

export const RoleManagement: React.FC = () => {
  const { refreshPermissions } = usePermission();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [viewMode, setViewMode] = useState<'roles' | 'users'>('roles');

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        description,
        role_permissions(permission_id),
        user_roles(count)
      `).order('order');

    if (error) return toast.error(error.message);

    const formatted = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      permissions: r.role_permissions.map((rp: any) => rp.permission_id),
      userCount: r.user_roles?.[0]?.count || 0,
    }));

    setRoles(formatted);
  };

  const fetchPermissions = async () => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module');

    if (error) return toast.error(error.message);

    const mapped = data.map((p: any) => ({
      id: p.id,
      label: `${p.action} ${p.module}`,
      category: p.module,
    }));

    setPermissionsList(mapped);
  };

  const fetchUsers = async () => {
    // 1️⃣ Fetch auth users
    const { data: authUsers, error: userError } = await supabase.rpc('get_users');
    if (userError) {
      toast.error(userError.message);
      return;
    }

    // 2️⃣ Fetch user role mappings
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role_id');

    if (roleError) {
      toast.error(roleError.message);
      return;
    }

     // 3️⃣ CRM Profiles
  const { data: profiles, error: profileError } = await supabase
    .from('crm_profile')
    .select('id, full_name, avatar_url');

  if (profileError) {
    toast.error(profileError.message);
    return;
  }

    const formatted = authUsers.map((u: any) => {
      const roleMapping = userRoles.find((ur: any) => ur.user_id === u.id);
      const profile = profiles.find(
        (p: any) => p.id === u.id
      );
      return {
        id: u.id,
        name: profile?.full_name || u.email,
        email: u.email,
        avatar: profile?.avatar_url || "",
        role: roleMapping ? roleMapping.role_id : '', // SAFE
        lastActive: u.last_sign_in_at || '',
      };
    });

    setUsers(formatted);
  };

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent');
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setNewRoleName(role.name ?? '');
    setNewRoleDesc(role.description ?? '');
    setSelectedPermissions(role.permissions);
    setIsDialogOpen(true);
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleDesc('');
    setSelectedPermissions([]);
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    let roleId = editingRole?.id;

    if (editingRole) {
      const { error } = await supabase
        .from('roles')
        .update({
          name: newRoleName,
          description: newRoleDesc,
        })
        .eq('id', roleId);

      if (error) return toast.error(error.message);
    } else {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: newRoleName,
          description: newRoleDesc,
        })
        .select()
        .single();

      if (error) return toast.error(error.message);
      roleId = data.id;
    }

    // Remove old permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    // Insert selected permissions
    if (selectedPermissions.length > 0) {
      const rows = selectedPermissions.map(pid => ({
        role_id: roleId,
        permission_id: pid,
      }));

      await supabase.from('role_permissions').insert(rows);
    }

    toast.success('Role saved successfully');
    setIsDialogOpen(false);
    fetchRoles();
    refreshPermissions();
  };

  const handleDeleteRole = async (roleId: string) => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) return toast.error(error.message);

    toast.success('Role deleted successfully');
    fetchRoles();
  };

  const assignRole = async (userId: string, roleId: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId);

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
      });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Role assigned');

    await fetchUsers();
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permId)
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const groupedPermissions = (permissionsList || []).reduce((acc: any, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'roles' ? 'default' : 'outline'}
            onClick={() => setViewMode('roles')}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Roles
          </Button>
          <Button
            variant={viewMode === 'users' ? 'default' : 'outline'}
            onClick={() => setViewMode('users')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Users
          </Button>
        </div>
        {viewMode === 'roles' && (
          <Button onClick={handleCreateRole} className="gap-2">
            <Plus className="h-4 w-4" />
            New Role
          </Button>
        )}
      </div>

      {viewMode === 'roles' ? (
        roles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No roles created yet</p>
              <Button onClick={handleCreateRole} className="mt-4">
                Create First Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map(role => (
              <Card key={role.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{role.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Permissions</span>
                    <Badge variant="secondary">{role.permissions.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 4).map(p => {
                      const perm = permissionsList.find(ap => ap.id === p);
                      return (
                        <Badge key={p} variant="outline" className="text-xs">
                          {perm ? perm.label : 'Unknown'}
                        </Badge>
                      );
                    })}
                    {role.permissions.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{role.userCount} users</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt="Avatar"
                              className="h-full w-full object-cover rounded-full"
                            />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                          value={user.role || undefined}
                          onValueChange={(roleId) => assignRole(user.id, roleId)}
                        >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.lastActive).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(user.email)}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              Configure role name and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Sales Manager"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Permissions</Label>
              {Object.keys(groupedPermissions).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No permissions found</p>
                ) : (
                  Object.entries(groupedPermissions).map(([category, perms]: [string, any[]]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(perm => (
                      <div key={perm.id} className="flex items-center gap-2">
                        <Switch
                          checked={selectedPermissions.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <span className="text-sm">{perm.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole}>
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
