import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, BarChart3, TrendingUp, Users, CalendarDays } from 'lucide-react';

const lineData = [
  { name: 'Jan', users: 400 },
  { name: 'Feb', users: 600 },
  { name: 'Mar', users: 800 },
  { name: 'Apr', users: 700 },
  { name: 'May', users: 900 },
  { name: 'Jun', users: 1200 },
];

const barData = [
  { name: 'Courses', count: 32 },
  { name: 'Exams', count: 19 },
  { name: 'Quizzes', count: 14 },
  { name: 'Assignments', count: 22 },
];

const pieData = [
  { name: 'Passed', value: 65 },
  { name: 'Failed', value: 15 },
  { name: 'Incomplete', value: 20 },
];

const COLORS = ['#34D399', '#F87171', '#FBBF24'];

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl shadow-md bg-white dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export default function Analytics() {
  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      <div className="text-2xl font-semibold">Analytics Dashboard</div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <Users className="text-blue-500" />
            <div>
              <div className="text-lg font-bold">1,200</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <TrendingUp className="text-green-500" />
            <div>
              <div className="text-lg font-bold">87%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Growth Rate</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <BarChart3 className="text-yellow-500" />
            <div>
              <div className="text-lg font-bold">450</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completed Sessions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <CalendarDays className="text-purple-500" />
            <div>
              <div className="text-lg font-bold">July 2025</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Month</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <div className="text-md font-semibold mb-4">User Growth</div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-md font-semibold mb-4">Activity Distribution</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-md font-semibold mb-4">Student Outcome</div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-md font-semibold mb-4">Real-time Engagement</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>Chat Activity</span>
                <span>78%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Video Watch Time</span>
                <span>64%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '64%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
