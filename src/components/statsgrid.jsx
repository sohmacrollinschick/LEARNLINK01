import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import {
  GraduationCap, Users, BookOpen, Clock, ArrowRight
} from "lucide-react";

// Data
const barData = [
  { name: "Computer Sci", gpa: 3.6 },
  { name: "Engineering", gpa: 3.1 },
  { name: "Medicine", gpa: 3.8 },
  { name: "Law", gpa: 3.2 },
];

const pieData = [
  { name: "A (70-100)", value: 300 },
  { name: "B (60-69)", value: 400 },
  { name: "C (50-59)", value: 200 },
  { name: "F (<50)", value: 100 },
];

const COLORS = ["#10b981", "#3b82f6", "#facc15", "#ef4444"];

const topStudents = [
  { name: "Evelyn M.", gpa: 4.0 },
  { name: "John K.", gpa: 3.9 },
  { name: "Fatima S.", gpa: 3.85 },
  { name: "Lee W.", gpa: 3.8 },
  { name: "Samuel T.", gpa: 3.75 },
];

const activities = [
  "Samuel submitted assignment in Algorithms",
  "Prof. Amina uploaded new materials in Law",
  "New class scheduled: Data Science - 2PM",
];

const recentLectures = [
  { subject: "Linear Algebra", time: "10:00 AM" },
  { subject: "Software Engineering", time: "12:00 PM" },
  { subject: "Cybersecurity", time: "2:00 PM" },
];

function DashboardCard({ title, value, icon }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-4 flex items-center gap-4 dark:bg-slate-800">
      <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <h4 className="text-sm text-gray-500 dark:text-gray-300">{title}</h4>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen dark:bg-slate-900">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardCard title="Total Students" value="1,820" icon={<Users className="text-blue-600" />} />
        <DashboardCard title="Avg GPA" value="3.48" icon={<GraduationCap className="text-green-600" />} />
        <DashboardCard title="Active Classes" value="42" icon={<BookOpen className="text-purple-600" />} />
        <DashboardCard title="Lectures Today" value="12" icon={<Clock className="text-orange-500" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-md dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Average GPA by Department</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 4]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="gpa" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-md dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Performance Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking */}
        <div className="bg-white rounded-2xl p-4 shadow-md dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Top Ranked Students</h2>
          <ul className="space-y-2">
            {topStudents.map((s, i) => (
              <li key={i} className="flex justify-between text-gray-700 dark:text-white">
                <span>{i + 1}. {s.name}</span>
                <span className="font-semibold">{s.gpa}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl p-4 shadow-md dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Activity Feed</h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            {activities.map((activity, index) => (
              <li key={index}>• {activity}</li>
            ))}
          </ul>
        </div>

        {/* Recent Lectures */}
        <div className="bg-white rounded-2xl p-4 shadow-md dark:bg-slate-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recent Lectures</h2>
          <ul className="space-y-2 text-gray-700 dark:text-white">
            {recentLectures.map((lecture, index) => (
              <li key={index} className="flex justify-between">
                <span>{lecture.subject}</span>
                <span className="text-sm text-gray-500">{lecture.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

