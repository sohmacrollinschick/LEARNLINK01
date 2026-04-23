import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUp, ArrowDown, Minus, Download } from "lucide-react";
import logoImage from "../assets/image/learn.png";

const subjects = [
  { name: "Frontend Development", performance: 92, mean: 80, change: "↑", grade: "A+" },
  { name: "Backend Development", performance: 85, mean: 75, change: "↑", grade: "A" },
  { name: "UI/UX Design", performance: 78, mean: 68, change: "↑", grade: "B+" },
  { name: "Data Structures", performance: 82, mean: 70, change: "↑", grade: "A" },
  { name: "Algorithms", performance: 65, mean: 60, change: "→", grade: "B" },
  { name: "DevOps", performance: 59, mean: 55, change: "↓", grade: "C+" },
  { name: "Machine Learning", performance: 74, mean: 65, change: "↑", grade: "B+" },
  { name: "Cloud Computing", performance: 70, mean: 63, change: "↑", grade: "B" },
];

const chartData = [
  { name: "Term 1", mean: 60 },
  { name: "Term 2", mean: 72 },
  { name: "Term 3", mean: 85 },
];

function TrendIcon({ change }) {
  if (change === "↑") return <ArrowUp className="text-green-500 w-4 h-4" />;
  if (change === "↓") return <ArrowDown className="text-red-500 w-4 h-4" />;
  return <Minus className="text-gray-500 w-4 h-4" />;
}

function downloadReport() {
  const reportWindow = window.open('', 'Report Card');
  reportWindow.document.write(`
    <html>
      <head>
        <title>LearnLink Report Card</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { text-align: center; color: #2b6cb0; }
          .decorated { border: 5px solid #3182ce; padding: 20px; border-radius: 12px; background-color: #f7fafc; }
          .logo { display: block; margin: 0 auto 20px; width: 80px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="decorated">
          <img src="${logoImage}" class="logo" alt="LearnLink Logo" />
          <h2>LearnLink Tech Career Report Card</h2>
          <table>
            <tr><th>Subject</th><th>Performance</th><th>Mean</th><th>Change</th><th>Grade</th></tr>
            ${subjects.map(subj => `
              <tr>
                <td>${subj.name}</td>
                <td>${subj.performance}%</td>
                <td>${subj.mean}</td>
                <td>${subj.change}</td>
                <td>${subj.grade}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.print();
}

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              📚 LearnLink Tech Career Report Card
            </h2>
            <button
              onClick={downloadReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg">
            <table className="w-full table-auto text-sm text-left text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Performance</th>
                  <th className="p-3">Mean</th>
                  <th className="p-3">Change</th>
                  <th className="p-3">Trend</th>
                  <th className="p-3">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subj, index) => (
                  <tr key={index}>
                    <td className="p-3 font-medium text-gray-900">{subj.name}</td>
                    <td className="p-3">
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-1">
                        <div
                          className={`h-4 rounded-full ${subj.performance >= 70 ? "bg-green-500" : subj.performance >= 50 ? "bg-yellow-400" : "bg-red-500"}`}
                          style={{ width: `${subj.performance}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{subj.performance}%</span>
                    </td>
                    <td className="p-3">{subj.mean}</td>
                    <td className="p-3">{subj.change}</td>
                    <td className="p-3">
                      <TrendIcon change={subj.change} />
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-1 rounded text-white text-xs font-semibold bg-indigo-500">
                        {subj.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📈 Performance Trend Over Terms</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="mean" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
