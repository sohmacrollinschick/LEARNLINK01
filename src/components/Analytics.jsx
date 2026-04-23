// ResultsAnalytics.jsx
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from "lucide-react";

/* =========================
   STUDENT ACADEMIC DATA
   (CAMEROON SECONDARY)
   ========================= */

// Student's average per subject
const subjectPerformance = [
  { subject: "Mathematics", average: 68 },
  { subject: "English Language", average: 74 },
  { subject: "Biology", average: 71 },
  { subject: "Chemistry", average: 66 },
  { subject: "Physics", average: 64 },
];

// Student pass/fail summary (based on subjects)
const passFailData = [
  { name: "Pass", value: 4 },
  { name: "Fail", value: 1 },
];

// Student progress by term
const termTrendData = [
  { term: "1st Term", score: 62 },
  { term: "2nd Term", score: 68 },
  { term: "3rd Term", score: 73 },
];

const COLORS = ["#10B981", "#EF4444"];

export default function ResultsAnalytics() {
  const [selectedTerm, setSelectedTerm] = useState("All Terms");

  return (
    <div className="p-6 bg-gray-50 min-h-screen dark:bg-gray-900 dark:text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Academic Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview of your academic performance (Form 4)
          </p>
        </div>
        <select
          className="px-4 py-2 rounded-lg border dark:bg-gray-800"
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
        >
          <option>All Terms</option>
          <option>1st Term</option>
          <option>2nd Term</option>
          <option>3rd Term</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center space-x-4">
          <TrendingUp className="text-green-500" size={32} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              My Term Average
            </p>
            <p className="text-xl font-bold">71%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center space-x-4">
          <CheckCircle className="text-green-600" size={32} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Subjects Passed
            </p>
            <p className="text-xl font-bold">4 / 5</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center space-x-4">
          <TrendingUp className="text-indigo-500" size={32} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Best Subject
            </p>
            <p className="text-xl font-bold">English (74%)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center space-x-4">
          <TrendingDown className="text-red-500" size={32} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Weakest Subject
            </p>
            <p className="text-xl font-bold">Physics (64%)</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Pass / Fail */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4">
            My Pass / Fail Distribution
          </h2>
          <PieChart width={250} height={250}>
            <Pie
              data={passFailData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {passFailData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        {/* Subject Performance */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4">
            My Subject Performance
          </h2>
          <BarChart width={300} height={250} data={subjectPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="average" fill="#3B82F6" />
          </BarChart>
        </div>

        {/* Term Trend */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h2 className="text-lg font-bold mb-4">
            My Progress Trend (By Term)
          </h2>
          <LineChart width={300} height={250} data={termTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="term" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10B981"
            />
          </LineChart>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold mb-4">
          My Detailed Results
        </h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-2">Subject</th>
              <th className="p-2">Score (%)</th>
              <th className="p-2">Remark</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">Mathematics</td>
              <td className="p-2">68%</td>
              <td className="p-2">Good</td>
              <td className="p-2 text-green-600">Pass</td>
            </tr>
            <tr>
              <td className="p-2">English Language</td>
              <td className="p-2">74%</td>
              <td className="p-2">Very Good</td>
              <td className="p-2 text-green-600">Pass</td>
            </tr>
            <tr>
              <td className="p-2">Biology</td>
              <td className="p-2">71%</td>
              <td className="p-2">Good</td>
              <td className="p-2 text-green-600">Pass</td>
            </tr>
            <tr>
              <td className="p-2">Chemistry</td>
              <td className="p-2">66%</td>
              <td className="p-2">Fair</td>
              <td className="p-2 text-green-600">Pass</td>
            </tr>
            <tr>
              <td className="p-2">Physics</td>
              <td className="p-2">64%</td>
              <td className="p-2">Fair</td>
              <td className="p-2 text-red-600">Fail</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
