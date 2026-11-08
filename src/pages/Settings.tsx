import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Bell, Shield, Palette, Users, Building2, IndianRupee, FileText, Settings2, Tags, Mail, Grid3x3, Activity, Calendar, XCircle, Target, CreditCard, Lightbulb } from 'lucide-react';
import { CurrencySettings } from '@/components/currency/CurrencySettings';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { DataTools } from '@/components/admin/DataTools';
import CategoriesList from '@/components/categories/CategoriesList';
import { AiAssistantSettings } from '@/components/settings/AiAssistantSettings';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLayout } from '@/contexts/LayoutContext';
import { EmailSettings } from '@/components/admin/EmailSettings';
import { PaymentTermsSettings } from '@/components/settings/PaymentTermsSettings';
import { GstTreatmentSettings } from '@/components/settings/GstTreatmentSettings';

import { supabase } from '@/supabase/supabaseClient';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Settings() {
  const { aiEnabled } = useLayout();
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // helper that inspects both query params and path segment to determine active tab
  const determineTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const queryTab = urlParams.get('tab');
    if (queryTab) return queryTab;

    const segments = location.pathname.split('/').filter(Boolean);
    if (segments[0] === 'settings' && segments.length >= 2) {
      // second segment is the tab name (e.g. /settings/profile)
      return segments[1];
    }

    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(determineTab());
  const [loadingProfile, setLoadingProfile] = useState(true);

  // keep tab state in sync when URL changes
  useEffect(() => {
    setActiveTab(determineTab());
  }, [location]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoadingProfile(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from('crm_profile')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      setProfile(data);
    }
    console.log('User Profile:', data);

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single();

    const roleName = roleData && 'roles' in roleData
      ? (roleData.roles as any)?.name
      : '';

    setProfile({ ...data, role: roleName });

    setLoadingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from('crm_profile')
      .update({
        full_name: profile.full_name,
        display_name: profile.display_name,
        phone_number: profile.phone_number,
        city: profile.city,
        state: profile.state,
        country: profile.country,
      })
      .eq('id', profile.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated successfully');
    }
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}.${fileExt}`;

    // 1️⃣ Upload (replace existing)
    const { error: uploadError } = await supabase.storage
      .from('user_profile_image')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }

    // 2️⃣ Get Public URL
    const { data } = supabase.storage
      .from('user_profile_image')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    // 3️⃣ Save to profile
    const { error: updateError } = await supabase
      .from('crm_profile')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setProfile({ ...profile, avatar_url: publicUrl });

    toast.success('Avatar updated successfully');
  };

  return (
    <div className="min-h-screen">
      <Header title="Settings" />
      <div className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            if (v === 'overview') {
              navigate('/settings');
            } else {
              navigate(`/settings/${v}`);
            }
          }}
          className="space-y-6"
        >
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="gap-2">
              <span className="h-4 w-4 inline-block text-center">🤖</span>
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="currency" className="gap-2">
              <IndianRupee className="h-4 w-4" />
              Currency
            </TabsTrigger>
            <TabsTrigger value="payment-terms" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Terms
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="gst-treatment" className="gap-2">
              <FileText className="h-4 w-4" />
              GST Treatment
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Roles & Access
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <FileText className="h-4 w-4" />
              Data Tools
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <SettingsOverview />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Profile Information
              </h3>
              <div className="flex items-start gap-6 mb-6">
                <Avatar className="h-20 w-20">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {profile?.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('') || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="avatarUpload"
                    onChange={handleAvatarUpload}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatarUpload')?.click()}
                  >
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, GIF or PNG. Max size 2MB.
                  </p>
                </div>
              </div>
              <div className="grid gap-6 max-w-2xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      value={profile?.full_name || ''}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Smith" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    value={profile?.phone_number || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, phone_number: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input value={profile?.role || ''} disabled />
                </div>
                <Separator />
                <Button className="w-fit" onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Notification Preferences
              </h3>
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your Leads
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Leads Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when Leads status changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Task Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Receive reminders for upcoming tasks
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Weekly Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Get weekly summary of your performance
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Browser Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Show desktop notifications
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Security Settings
              </h3>
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <Separator />
                <Button>Update Password</Button>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Appearance Settings
              </h3>
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select defaultValue="light">
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="asia-kolkata">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia-kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="america-new-york">
                        America/New York (EST)
                      </SelectItem>
                      <SelectItem value="america-los-angeles">
                        America/Los Angeles (PST)
                      </SelectItem>
                      <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                      <SelectItem value="asia-tokyo">Asia/Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select defaultValue="dmy">
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <Button>Save Preferences</Button>
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                <Button>Invite Member</Button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'John Smith', email: 'john@company.com', role: 'Admin' },
                  { name: 'Jane Doe', email: 'jane@company.com', role: 'Sales Rep' },
                  { name: 'Mike Johnson', email: 'mike@company.com', role: 'Sales Rep' },
                ].map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{member.role}</span>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Company Settings
              </h3>
              <div className="grid gap-6 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" defaultValue="Acme Corporation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select defaultValue="technology">
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="https://acme.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    defaultValue="123 Business Ave, San Francisco, CA 94102"
                  />
                </div>
                <Separator />
                <Button className="w-fit">Save Company Settings</Button>
              </div>
            </div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant">
            <AiAssistantSettings />
          </TabsContent>

          {/* Currency Tab */}
          <TabsContent value="currency">
            <CurrencySettings />
          </TabsContent>

          {/* Payment Terms Tab */}
          <TabsContent value="payment-terms">
            <PaymentTermsSettings />
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
              <CategoriesList />
            </div>
          </TabsContent>

          {/* GST Treatment Tab */}
          <TabsContent value="gst-treatment">
            <GstTreatmentSettings />
          </TabsContent>

          {/* Roles & Access Tab */}
          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>

          {/* Data Tools Tab */}
          <TabsContent value="data">
            <DataTools />
          </TabsContent>
          <TabsContent value="email">
            <EmailSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}



function SettingsOverview() {
  const navigate = useNavigate();

  const settingsCategories = [
    {
      title: 'Sales Teams',
      description: 'Manage sales teams and members',
      icon: Users,
      path: '/sales-teams',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Activity Types',
      description: 'Configure activity types and categories',
      icon: Activity,
      path: '/settings/activity-types',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Activity Plans',
      description: 'Manage activity plans and templates',
      icon: Calendar,
      path: '/settings/activity-plans',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Tags',
      description: 'Manage tags and labels',
      icon: Tags,
      path: '/settings/tags',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Lost Reasons',
      description: 'Configure reasons for lost opportunities',
      icon: XCircle,
      path: '/settings/lost-reasons',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Lead Mining Requests',
      description: 'Manage lead mining and generation requests',
      icon: Target,
      path: '/settings/lead-mining',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Pipeline Settings',
      description: 'Configure pipeline stages and settings',
      icon: Grid3x3,
      path: '/settings/pipeline',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Leads Settings',
      description: 'Configure leads settings and fields',
      icon: FileText,
      path: '/settings/leads',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Payment Terms',
      description: 'Manage invoice payment terms',
      icon: CreditCard,
      path: '/settings/payment-terms',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'GST Treatment',
      description: 'Manage GST treatments',
      icon: FileText,
      path: '/settings/gst-treatment',
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      title: 'AI Assistant',
      description: 'Enable or disable the AI assistant feature',
      icon: Lightbulb,
      path: '/settings/ai-assistant',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Email Settings',
      description: 'Manage SMTP and IMAP configurations',
      icon: Mail,
      path: '/settings/email',
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    }
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Settings Overview
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage all your CRM settings and configurations from here
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          const handleClick = () => {
            // ensure we clear any existing query params so the new tab is reflected correctly
            const [pathname] = category.path.split('?');
            navigate({ pathname, search: '' });
          };
          return (
            <Card
              key={category.path}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={handleClick}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <CardTitle className="text-base">{category.title}</CardTitle>
                <CardDescription className="text-xs">
                  {category.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}