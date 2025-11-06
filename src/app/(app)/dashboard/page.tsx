'use client';

import { useAuth, User } from '@/app/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function UserGreeting({ user }: { user: User }) {
  return (
    <h1 className="text-3xl font-bold font-headline tracking-tight">
      Welcome back, {user.firstName || 'User'}!
    </h1>
  );
}

function UserRoleInfo({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Role</CardTitle>
        <CardDescription>Your permissions are based on this role.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold capitalize">{user.role}</p>
        {user.role === 'employee' && user.employee && (
            <div className="mt-2 text-sm text-muted-foreground">
                <p><strong>Department:</strong> {user.employee.department}</p>
                <p><strong>Designation:</strong> {user.employee.designation}</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <p>Redirecting to login...</p>;
  }

  return (
    <div className="space-y-8">
      <UserGreeting user={user} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UserRoleInfo user={user} />
        {/* Future widgets will be added here */}
      </div>
    </div>
  );
}
