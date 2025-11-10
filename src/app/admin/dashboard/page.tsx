// app/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  UsersIcon,
  UserGroupIcon,
  CheckCircleIcon,
  FolderIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalEmployees: number;
  totalHRManagers: number;
  presentToday: number;
  activeProjects: number;
  pendingLeaves: number;
  todayBirthdays: number;
  departmentDistribution: { name: string; count: number }[];
  attendanceTrend: { date: string; present: number; absent: number }[];
  recentActivities: {
    id: string;
    action: string;
    user: string;
    time: string;
    type: 'success' | 'warning' | 'info' | 'error';
  }[];
  upcomingEvents: {
    id: string;
    event: string;
    date: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  performanceMetrics: {
    attendanceRate: number;
    projectCompletion: number;
    employeeSatisfaction: number;
    revenueGrowth: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalHRManagers: 0,
    presentToday: 0,
    activeProjects: 0,
    pendingLeaves: 0,
    todayBirthdays: 0,
    departmentDistribution: [],
    attendanceTrend: [],
    recentActivities: [],
    upcomingEvents: [],
    performanceMetrics: {
      attendanceRate: 0,
      projectCompletion: 0,
      employeeSatisfaction: 0,
      revenueGrowth: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/admin/dashboard?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Employees',
      value: stats.totalEmployees,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      description: 'Active workforce',
    },
    {
      name: 'HR Managers',
      value: stats.totalHRManagers,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      change: '+3%',
      description: 'Management team',
    },
    {
      name: 'Present Today',
      value: stats.presentToday,
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
      change: '95%',
      description: 'Attendance rate',
    },
    {
      name: 'Active Projects',
      value: stats.activeProjects,
      icon: FolderIcon,
      color: 'bg-yellow-500',
      change: '+8%',
      description: 'In progress',
    },
    {
      name: 'Pending Leaves',
      value: stats.pendingLeaves,
      icon: CalendarIcon,
      color: 'bg-orange-500',
      change: '5 requests',
      description: 'Awaiting approval',
    },
    {
      name: "Today's Birthdays",
      value: stats.todayBirthdays,
      icon: ClockIcon,
      color: 'bg-pink-500',
      change: 'Celebrations',
      description: 'Birthdays today',
    },
  ];

  const performanceMetrics = [
    {
      name: 'Attendance Rate',
      value: stats.performanceMetrics.attendanceRate,
      target: 95,
      color: 'bg-green-500',
    },
    {
      name: 'Project Completion',
      value: stats.performanceMetrics.projectCompletion,
      target: 85,
      color: 'bg-blue-500',
    },
    {
      name: 'Employee Satisfaction',
      value: stats.performanceMetrics.employeeSatisfaction,
      target: 90,
      color: 'bg-purple-500',
    },
    {
      name: 'Revenue Growth',
      value: stats.performanceMetrics.revenueGrowth,
      target: 15,
      color: 'bg-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Here's an overview of your organization.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <div className="mt-1 flex items-center">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Metrics
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {performanceMetrics.map((metric) => (
            <div key={metric.name} className="text-center">
              <div className="relative inline-block">
                <svg className="w-20 h-20" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={metric.color.replace('bg-', '').split('-')[0] === 'green' ? '#10B981' : 
                           metric.color.replace('bg-', '').split('-')[0] === 'blue' ? '#3B82F6' :
                           metric.color.replace('bg-', '').split('-')[0] === 'purple' ? '#8B5CF6' : '#6366F1'}
                    strokeWidth="3"
                    strokeDasharray={`${metric.value}, 100`}
                  />
                  <text x="18" y="20.5" textAnchor="middle" className="text-sm font-bold fill-gray-900">
                    {metric.value}%
                  </text>
                </svg>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900">{metric.name}</p>
              <p className="text-xs text-gray-500">Target: {metric.target}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts and Analytics Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Attendance Trend
            </h2>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span>Absent</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <AttendanceChart data={stats.attendanceTrend} />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Department Distribution
          </h2>
          <div className="space-y-4">
            {stats.departmentDistribution.map((dept, index) => {
              const percentage = (dept.count / stats.totalEmployees) * 100;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500'];
              return (
                <div key={dept.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${colors[index % colors.length]} rounded-full mr-2`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {dept.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {dept.count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activities and Upcoming Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activities
          </h2>
          <div className="space-y-4">
            {stats.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'success' ? 'bg-green-100' :
                    activity.type === 'warning' ? 'bg-yellow-100' :
                    activity.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <ArrowTrendingUpIcon className={`w-4 h-4 ${
                      activity.type === 'success' ? 'text-green-600' :
                      activity.type === 'warning' ? 'text-yellow-600' :
                      activity.type === 'error' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Events
          </h2>
          <div className="space-y-4">
            {stats.upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.priority === 'high' ? 'bg-red-100' :
                    event.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    <CalendarIcon className={`w-4 h-4 ${
                      event.priority === 'high' ? 'text-red-600' :
                      event.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {event.event}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} • {event.type}
                  </p>
                </div>
                <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  event.priority === 'high' ? 'bg-red-100 text-red-800' :
                  event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {event.priority.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats and System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* System Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            System Health
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Uptime</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response</span>
              <span className="text-sm font-medium text-green-600">Fast</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage</span>
              <span className="text-sm font-medium text-yellow-600">65% Used</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors group">
              <UsersIcon className="w-8 h-8 mx-auto text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">Add Employee</p>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
              <UserGroupIcon className="w-8 h-8 mx-auto text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">Add HR</p>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
              <FolderIcon className="w-8 h-8 mx-auto text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">New Project</p>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group">
              <ChartBarIcon className="w-8 h-8 mx-auto text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-900">View Reports</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Attendance Chart Component
function AttendanceChart({ data }: { data: DashboardStats['attendanceTrend'] }) {
  // If no data, show sample data for demonstration
  const chartData = data.length > 0 ? data : [
    { date: 'Mon', present: 85, absent: 15 },
    { date: 'Tue', present: 92, absent: 8 },
    { date: 'Wed', present: 78, absent: 22 },
    { date: 'Thu', present: 95, absent: 5 },
    { date: 'Fri', present: 88, absent: 12 },
    { date: 'Sat', present: 65, absent: 35 },
    { date: 'Sun', present: 70, absent: 30 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.present + d.absent));

  return (
    <div className="h-64 flex items-end justify-around space-x-2">
      {chartData.map((day, index) => {
        const presentPercentage = (day.present / (day.present + day.absent)) * 100;
        const absentPercentage = (day.absent / (day.present + day.absent)) * 100;
        
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col justify-end h-48">
              <div
                className="w-full bg-green-500 rounded-t transition-all duration-500 hover:opacity-90 cursor-pointer"
                style={{ height: `${(day.present / maxValue) * 100}%` }}
                title={`Present: ${day.present}`}
              ></div>
              <div
                className="w-full bg-red-500 rounded-t transition-all duration-500 hover:opacity-90 cursor-pointer"
                style={{ height: `${(day.absent / maxValue) * 100}%` }}
                title={`Absent: ${day.absent}`}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-600 font-medium">{day.date}</p>
            <p className="text-xs font-semibold text-gray-900">
              {presentPercentage.toFixed(0)}%
            </p>
          </div>
        );
      })}
    </div>
  );
}