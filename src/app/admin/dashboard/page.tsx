import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  Calendar, 
  FileText,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  // Mock data - replace with actual API calls
  const stats = [
    { title: 'Total HRs', value: '12', icon: Users, color: 'blue' },
    { title: 'Total Employees', value: '156', icon: Users, color: 'green' },
    { title: 'Active Departments', value: '8', icon: Building, color: 'purple' },
    { title: 'Total Projects', value: '23', icon: FileText, color: 'orange' },
    { title: 'Pending Leaves', value: '7', icon: Calendar, color: 'red' },
    { title: 'Present Today', value: '142', icon: Clock, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button>Generate Report</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                +20% from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Activity log component */}
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">New employee registered</p>
                    <p className="text-sm text-muted-foreground">
                      John Doe joined the IT department
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    2 hours ago
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Holidays component */}
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Year's Day</p>
                    <p className="text-sm text-muted-foreground">
                      January 1, 2025
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Public Holiday
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
