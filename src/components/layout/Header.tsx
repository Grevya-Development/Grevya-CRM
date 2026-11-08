import { useState, useEffect } from 'react';
import { Bell, Search, Plus, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from '@/supabase/supabaseClient';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GlobalSearch } from './GlobalSearch';
import { AppBreadcrumb } from '../shared/AppBreadcrumb';
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showAddButton?: boolean;
  onAdd?: () => void;
  addButtonLabel?: string;
  extra?: React.ReactNode;
  breadcrumbAction?: React.ReactNode;
  titleClassName?: string;
  hideBreadcrumbs?: boolean;
  isSticky?: boolean;
  children?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  showAddButton,
  onAdd,
  addButtonLabel = 'Add New',
  extra,
  breadcrumbAction,
  hideBreadcrumbs,
  isSticky = true,
  children
}: HeaderProps) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { toggleMobileSidebar } = useLayout();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from('crm_profile')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .single();

    if (data) {
      setUserProfile(data);
    }
  };

  if (isMobileSearchOpen) {
    return (
      <header className={cn(
        "z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur px-4",
        isSticky && "sticky top-0"
      )}>
        <GlobalSearch className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setIsMobileSearchOpen(false)}>
          Cancel
        </Button>
      </header>
    );
  }

  return (
    <>
      <header className={cn(
        "z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4 md:px-6",
        isSticky && "sticky top-0"
      )}>
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-1 h-9 w-9 shrink-0"
            onClick={toggleMobileSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
            {children}
            {subtitle && <p className="text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {extra}

          {/* Inline Global Search - Desktop */}
          <GlobalSearch className="hidden md:block w-96" />

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Add Button */}
          {showAddButton && (
            <Button onClick={onAdd} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {addButtonLabel}
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {/* <AvatarFallback className="bg-primary text-primary-foreground">
                    JS
                  </AvatarFallback> */}
                  <Avatar className="h-9 w-9">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Avatar"
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userProfile?.full_name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('') || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {userProfile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.email || ''}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {!hideBreadcrumbs && (
        <div className="flex justify-between items-start pb-2 w-full">
          <AppBreadcrumb />
          {breadcrumbAction && (
            <div className="pr-6 pt-2">
              {breadcrumbAction}
            </div>
          )}
        </div>
      )}
    </>
  );
}
