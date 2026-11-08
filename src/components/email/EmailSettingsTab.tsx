
import { useEffect, useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner';
import { userSettingsService, SmtpConfig } from '@/services/userSettings';

export function EmailSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [config, setConfig] = useState<SmtpConfig>({
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromName: '',
        fromEmail: '',
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await userSettingsService.getSettings();
                if (settings?.smtp_config) {
                    setConfig(settings.smtp_config);
                }
            } catch (error) {
                console.error('Failed to load SMTP settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentSettings = await userSettingsService.getSettings() || { contact_columns: [], column_order: [] };
            const result = await userSettingsService.saveSettings({
                ...currentSettings,
                smtp_config: config
            });

            if (result.success) {
                toast.success('SMTP configuration saved successfully');
            } else {
                const errorMsg = result.error?.message || 'Failed to save SMTP configuration';
                if (errorMsg.includes('Auth session missing')) {
                    toast.error('You must be logged in to save settings.');
                } else {
                    toast.error(errorMsg);
                }
            }
        } catch (error: any) {
            console.error('Save error details:', error);
            toast.error(error.message || 'Failed to save SMTP configuration');
        } finally {
            setSaving(false);
        }
    };


    const handleDelete = async () => {
        setDeleting(true);
        try {
            const currentSettings = await userSettingsService.getSettings();
            if (currentSettings) {
                const { smtp_config, ...rest } = currentSettings;
                await userSettingsService.saveSettings(rest);
                setConfig({
                    host: '',
                    port: 587,
                    secure: false,
                    username: '',
                    password: '',
                    fromName: '',
                    fromEmail: '',
                });
                toast.success('SMTP configuration deleted successfully');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete configuration');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return null;

    return (
        <TabsContent value="email">
            <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-foreground mb-6">
                    SMTP Configuration
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Configure your email server to send emails directly from the CRM.
                    <br />
                    <span className="text-xs text-info/80 bg-info/10 px-2 py-0.5 rounded mt-1 inline-block">
                        Note: For Gmail/Outlook, use an <strong>App Password</strong>, NOT your login password.
                    </span>
                </p>

                <div className="grid gap-6 max-w-2xl">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input
                                id="smtpHost"
                                value={config.host}
                                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpPort">Port</Label>
                            <Input
                                id="smtpPort"
                                type="number"
                                value={config.port}
                                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                                placeholder="587"
                            />
                            <p className="text-[10px] text-muted-foreground">Typically 587 (TLS) or 465 (SSL).</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="secure"
                            checked={config.secure}
                            onCheckedChange={(checked) => setConfig({ ...config, secure: checked })}
                        />
                        <Label htmlFor="secure">Secure Connection (SSL/TLS)</Label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="username">Email</Label>
                            <Input
                                id="username"
                                value={config.username}
                                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                                placeholder="your.email@gmail.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">App Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={config.password || ''}
                                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                placeholder="xxxx xxxx xxxx xxxx"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Generate this in your email provider's security settings (2FA required).
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="fromName">Sender Name</Label>
                            <Input
                                id="fromName"
                                value={config.fromName}
                                onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                                placeholder="Your Name or Company"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fromEmail">Sender Email</Label>
                            <Input
                                id="fromEmail"
                                type="email"
                                value={config.fromEmail}
                                onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                                placeholder="same as username usually"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <div className="flex gap-4">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </div>

                        {config.host && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                        Delete Configuration
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete SMTP Configuration?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will remove your saved email settings. You will not be able to send emails until you configure them again.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                            {deleting ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}
