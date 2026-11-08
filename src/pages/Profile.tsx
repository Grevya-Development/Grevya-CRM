import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera, Save, MapPinned, ShieldCheck, Smartphone, AtSign, User, Lock, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { toast } from "sonner";
import { supabase } from "@/supabase/supabaseClient";
import { Country, State, City } from "country-state-city";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

interface UserProfile {
    fullName: string;
    displayName: string;
    email: string;
    phone: string;
    gender: string;
    country: string;
    state: string;
    city: string;
    street: string;
    language: string;
    timezone: string;
    role: string;
    bio: string;
    avatar?: string;
    dob: string;
}

const emptyProfile: UserProfile = {
    fullName: "",
    displayName: "",
    email: "",
    phone: "",
    gender: "",
    country: "",
    state: "",
    city: "",
    street: "",
    language: "",
    timezone: "",
    role: "",
    bio: "",
    avatar: "",
    dob: "",
};

export default function Profile() {
    const [activeEditSection, setActiveEditSection] = useState<'profile' | 'location' | 'security' | 'bio' | null>(null);
    const [profile, setProfile] = useState<UserProfile>(emptyProfile);
    const [editForm, setEditForm] = useState<UserProfile>(emptyProfile);
    const [isLoading, setIsLoading] = useState(false);

    // Location states
    const countries = Country.getAllCountries();
    const [states, setStates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return;
            }

            const { data: dbProfile, error: dbError } = await supabase
                .from('crm_profile')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (dbError) {
                throw dbError;
            }

        const { data: roleData } = await supabase
                .from('user_roles')
                .select('roles(name)')
                .eq('user_id', user.id)
                .single();

                const roleName = roleData && 'roles' in roleData
                                ? (roleData.roles as any)?.name
                                : '';

            const profileData = dbProfile ? {
                fullName: dbProfile.full_name || "",
                displayName: dbProfile.display_name || "",
                email: dbProfile.email || user.email || "",
                phone: dbProfile.phone_number || user.phone || "",
                gender: dbProfile.gender || "",
                country: dbProfile.country || "",
                state: dbProfile.state || "",
                city: dbProfile.city || "",
                street: dbProfile.street_address || "",
                language: dbProfile.language || "",
                timezone: dbProfile.timezone || "",
                role: roleName || "",
                bio: dbProfile.bio || "",
                avatar: dbProfile.avatar_url || "",
                dob: dbProfile.dob || "",
            } : { ...emptyProfile, email: user.email || "", phone: user.phone || "" };

            setProfile(profileData);
            setEditForm(profileData);

            if (profileData.country) {
                const countryObj = countries.find(c => c.name === profileData.country);
                if (countryObj) {
                    const countryStates = State.getStatesOfCountry(countryObj.isoCode);
                    setStates(countryStates);

                    if (profileData.state) {
                        const stateObj = countryStates.find(s => s.name === profileData.state);
                        if (stateObj) {
                            setCities(City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode));
                        }
                    }
                }
            }



        } catch (error) {
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    };



    const handleEdit = (section: 'profile' | 'location' | 'security' | 'bio') => {
        setEditForm(profile);

        if (section === 'location' && profile.country) {
            const countryObj = countries.find(c => c.name === profile.country);
            if (countryObj) {
                const countryStates = State.getStatesOfCountry(countryObj.isoCode);
                setStates(countryStates);
                if (profile.state) {
                    const stateObj = countryStates.find(s => s.name === profile.state);
                    if (stateObj) {
                        setCities(City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode));
                    }
                }
            }
        }

        setActiveEditSection(section);
    };

    const handleCancel = () => {
        setActiveEditSection(null);
        setEditForm(profile);
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to save changes.");
                return;
            }

            const updates = {
                id: user.id,
                full_name: editForm.fullName,
                display_name: editForm.displayName,
                email: editForm.email,
                phone_number: editForm.phone,
                gender: editForm.gender,
                country: editForm.country,
                state: editForm.state,
                city: editForm.city,
                street_address: editForm.street,
                dob: editForm.dob,
                language: editForm.language,
                timezone: editForm.timezone,
                bio: editForm.bio,
                avatar_url: editForm.avatar,
                updated_at: new Date(),
            };

            const { error: dbError } = await supabase
                .from('crm_profile')
                .upsert(updates)
                .select();

            if (dbError) throw dbError;

            await supabase.auth.updateUser({
                data: {
                    full_name: editForm.fullName,
                    display_name: editForm.displayName,
                }
            });

            setProfile(editForm);
            setActiveEditSection(null);
            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to save profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("Please login to upload avatar");
                return;
            }

            // Fast preview using object URL
            const previewUrl = URL.createObjectURL(file);
            setProfile(prev => ({ ...prev, avatar: previewUrl }));
            setEditForm(prev => ({ ...prev, avatar: previewUrl }));

            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('user_profile_image')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('user_profile_image')
                .getPublicUrl(filePath);

            // Update Auth metadata
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            // Update crm_profile table immediately so it persists
            const { error: dbError } = await supabase
                .from('crm_profile')
                .update({ avatar_url: publicUrl, updated_at: new Date() })
                .eq('id', user.id);

            if (dbError) throw dbError;

            // Update state with the actual public URL
            setProfile(prev => ({ ...prev, avatar: publicUrl }));
            setEditForm(prev => ({ ...prev, avatar: publicUrl }));

            toast.success("Profile photo updated");
        } catch (error: any) {
            console.error("Profile upload error:", error);
            toast.error("Failed to upload avatar");
        }
    };

    const handleAdd = (type: string) => {
        toast.info(`Add ${type} functionality coming soon!`);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 flex flex-col font-['Instrument_Sans']">
            <Header title="My Profile" subtitle="Manage your account settings" />

            <div className="flex-1 flex flex-col py-2">
                <div className="max-w-full mx-auto px-4 w-full space-y-2">

                    {/* Header / Summary Section */}
                    <div className="flex flex-col md:flex-row items-center gap-5 pb-2 border-b border-slate-200">
                        <div className="relative group shrink-0">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-md cursor-pointer transition-transform hover:scale-105">
                                <AvatarImage src={profile.avatar || "/placeholder-avatar.jpg"} className="object-cover" />
                                <AvatarFallback className="text-xl bg-slate-900 text-white font-bold">
                                    {profile.displayName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <label
                                htmlFor="avatar-upload"
                                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                                <Camera className="text-white h-5 w-5" />
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <div className="text-center md:text-left space-y-1">
                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{profile.fullName}</h2>
                            <p className="text-slate-500 font-medium">{profile.role}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                    <AtSign className="h-3.5 w-3.5" /> {profile.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                    <Smartphone className="h-3.5 w-3.5" /> {profile.phone}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                    <MapPinned className="h-3.5 w-3.5" /> {profile.city}, {profile.country}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Details Grid - 3 Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Column 1: Personal Details */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">Personal Details</h3>
                                    {activeEditSection === 'profile' ? <EditActionButtons onSave={handleSave} onCancel={handleCancel} /> : <EditIcon section="profile" onEdit={handleEdit} />}
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4 h-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Full Name</Label>
                                            {activeEditSection === 'profile' ? (
                                                <Input name="fullName" value={editForm.fullName} onChange={handleChange} className="h-9 text-base bg-slate-50 border-slate-200 focus:ring-blue-500/20" />
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">{profile.fullName}</div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Display Name</Label>
                                            {activeEditSection === 'profile' ? (
                                                <Input name="displayName" value={editForm.displayName} onChange={handleChange} className="h-9 text-base bg-slate-50 border-slate-200 focus:ring-blue-500/20" />
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">{profile.displayName}</div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Gender</Label>
                                            {activeEditSection === 'profile' ? (
                                                <Select value={editForm.gender} onValueChange={(val) => setEditForm(prev => ({ ...prev, gender: val }))}>
                                                    <SelectTrigger className="h-9 text-base bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="I'd prefer not to say">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">{profile.gender}</div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Date of Birth</Label>
                                            {activeEditSection === 'profile' ? (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "h-9 w-full text-base bg-slate-50 border-slate-200 justify-start text-left font-normal",
                                                                !editForm.dob && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {editForm.dob ? format(parseISO(editForm.dob), "dd-MM-yyyy") : <span>Pick a date</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={editForm.dob ? parseISO(editForm.dob) : undefined}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    setEditForm(prev => ({ ...prev, dob: format(date, "yyyy-MM-dd") }));
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">
                                                    {profile.dob && isValid(parseISO(profile.dob))
                                                        ? format(parseISO(profile.dob), "dd-MM-yyyy")
                                                        : profile.dob || "Not specified"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                    <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">
                                        System Role
                                    </Label>
                                    <div className="text-base text-slate-600 font-medium">
                                        {profile.role || "Not assigned"}
                                    </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Location & Preferences */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">Location & Preferences</h3>
                                    {activeEditSection === 'location' ? <EditActionButtons onSave={handleSave} onCancel={handleCancel} /> : <EditIcon section="location" onEdit={handleEdit} />}
                                </div>

                                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4 h-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Country</Label>
                                            {activeEditSection === 'location' ? (
                                                <Select
                                                    value={editForm.country}
                                                    onValueChange={(val) => {
                                                        const countryObj = countries.find(c => c.name === val);
                                                        setEditForm(prev => ({ ...prev, country: val, state: "", city: "" }));
                                                        if (countryObj) {
                                                            const countryStates = State.getStatesOfCountry(countryObj.isoCode);
                                                            setStates(countryStates);
                                                            setCities([]);
                                                        } else {
                                                            setStates([]);
                                                            setCities([]);
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 text-base bg-slate-50 border-slate-200"><SelectValue placeholder="Select Country" /></SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map((country) => (
                                                            <SelectItem key={country.isoCode} value={country.name}>{country.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">{profile.country || "Not specified"}</div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">State / Region</Label>
                                            {activeEditSection === 'location' ? (
                                                <Select
                                                    value={editForm.state}
                                                    onValueChange={(val) => {
                                                        const countryObj = countries.find(c => c.name === editForm.country);
                                                        const stateObj = states.find(s => s.name === val);
                                                        setEditForm(prev => ({ ...prev, state: val, city: "" }));
                                                        if (countryObj && stateObj) {
                                                            setCities(City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode));
                                                        } else {
                                                            setCities([]);
                                                        }
                                                    }}
                                                    disabled={!editForm.country}
                                                >
                                                    <SelectTrigger className="h-9 text-base bg-slate-50 border-slate-200"><SelectValue placeholder="Select State" /></SelectTrigger>
                                                    <SelectContent>
                                                        {states.map((state) => (
                                                            <SelectItem key={state.isoCode} value={state.name}>{state.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">{profile.state || "Not specified"}</div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">City</Label>
                                            {activeEditSection === 'location' ? (
                                                <Select
                                                    value={editForm.city}
                                                    onValueChange={(val) => setEditForm(prev => ({ ...prev, city: val }))}
                                                    disabled={!editForm.state}
                                                >
                                                    <SelectTrigger className="h-9 text-base bg-slate-50 border-slate-200"><SelectValue placeholder="Select City" /></SelectTrigger>
                                                    <SelectContent>
                                                        {cities.map((city) => (
                                                            <SelectItem key={`${city.name}-${city.latitude}`} value={city.name}>{city.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">{profile.city || "Not specified"}</div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Language</Label>
                                            {activeEditSection === 'location' ? (
                                                <Select value={editForm.language} onValueChange={(val) => setEditForm(prev => ({ ...prev, language: val }))}>
                                                    <SelectTrigger className="h-9 text-base bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="English">English</SelectItem>
                                                        <SelectItem value="Spanish">Spanish</SelectItem>
                                                        <SelectItem value="French">French</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="text-base text-slate-600 font-medium">{profile.language}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                        <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Timezone</Label>
                                        {activeEditSection === 'location' ? (
                                            <Select value={editForm.timezone} onValueChange={(val) => setEditForm(prev => ({ ...prev, timezone: val }))}>
                                                <SelectTrigger className="h-9 text-base bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="(GMT +05:30) India Standard Time ( Asia/Kolkata )">IST (Asia/Kolkata)</SelectItem>
                                                    <SelectItem value="(GMT -05:00) Eastern Time (US & Canada)">EST (US & Canada)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-base text-slate-600 font-medium truncate">{profile.timezone}</div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Street Address</Label>
                                        {activeEditSection === 'location' ? (
                                            <Input name="street" value={editForm.street} onChange={handleChange} className="h-9 text-base bg-slate-50 border-slate-200" />
                                        ) : (
                                            <div className="text-base text-slate-600 font-medium">{profile.street}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Column 3: Account Security */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900">Account Security</h3>
                                    {activeEditSection === 'security' ? <EditActionButtons onSave={handleSave} onCancel={handleCancel} /> : <EditIcon section="security" onEdit={handleEdit} />}
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-300 space-y-4 h-full">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Email Address</Label>
                                            {activeEditSection === 'security' ? (
                                                <Input name="email" value={editForm.email} onChange={handleChange} className="h-9 text-base bg-slate-50 border-slate-200" />
                                            ) : (
                                                <div className="flex items-center gap-2.5 text-base text-slate-600 font-medium">
                                                    <AtSign className="h-4 w-4 text-slate-400" />
                                                    <span>{profile.email}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-bold uppercase text-slate-400 tracking-wider">Phone Number</Label>
                                            {activeEditSection === 'security' ? (
                                                <Input name="phone" value={editForm.phone} onChange={handleChange} className="h-9 text-base bg-slate-50 border-slate-200" />
                                            ) : (
                                                <div className="flex items-center gap-2.5 text-base text-slate-600 font-medium">
                                                    <Smartphone className="h-4 w-4 text-slate-400" />
                                                    <span>{profile.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        {/* Bio Section - Full Width */}
                        <div className="space-y-1 pt-3">
                            <div className="flex items-center justify-between pt-2">
                                <h3 className="text-lg font-bold text-slate-900">Bio</h3>
                                {activeEditSection === 'bio' ? <EditActionButtons onSave={handleSave} onCancel={handleCancel} /> : <EditIcon section="bio" onEdit={handleEdit} />}
                            </div>
                            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                                {activeEditSection === 'bio' ? (
                                    <textarea
                                        name="bio"
                                        value={editForm.bio}
                                        onChange={handleChange as any}
                                        className="w-full min-h-[120px] text-base bg-slate-50 p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans leading-relaxed"
                                        placeholder="Write a brief professional bio..."
                                    />
                                ) : (
                                    <p className="text-base text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                        {profile.bio || "No biography provided yet."}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

type EditSection = 'profile' | 'location' | 'security' | 'bio';

const EditActionButtons = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
        <Button
            onClick={onSave}
            size="sm"
            className="h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg shadow-sm shadow-blue-200 transition-all"
        >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
        </Button>
        <Button
            onClick={onCancel}
            size="sm"
            variant="secondary"
            className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-3 rounded-lg"
        >
            Cancel
        </Button>
    </div>
);

const EditIcon = ({ section, onEdit }: { section: EditSection; onEdit: (section: EditSection) => void }) => (
    <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        onClick={() => onEdit(section)}
    >
        <Pencil className="h-4 w-4" />
    </Button>
);
