import React, { useState, useEffect } from "react";

const techSubjects = [
  "Programming",
  "Databases",
  "Networking",
  "Web Development",
  "Artificial Intelligence",
];

const categories = ["Software Engineering", "Computer Science", "Information Tech"];

const studentsData = [
  {
    id: 1,
    name: "Alice Johnson",
    category: "Software Engineering",
    subscribedCourses: ["Programming", "Databases", "Web Development"],
  },
  {
    id: 2,
    name: "Bob Smith",
    category: "Computer Science",
    subscribedCourses: ["Programming", "Networking", "Artificial Intelligence"],
  },
  {
    id: 3,
    name: "Charlie Brown",
    category: "Information Tech",
    subscribedCourses: ["Databases", "Networking", "Web Development"],
  },
  // Add more students here
];

function calculateGPA(marks) {
  const total = marks.reduce((a, b) => a + b, 0);
  return total / marks.length;
}

function assignGrade(gpa) {
  if (gpa >= 90) return "A+";
  if (gpa >= 80) return "A";
  if (gpa >= 70) return "B";
  if (gpa >= 60) return "C";
  if (gpa >= 50) return "D";
  return "F";
}

export default function AdminTechResults() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  const [selectedCategory, setSelectedCategory] = useState("");
  const [filteredStudents, setFilteredStudents] = useState(studentsData);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [marks, setMarks] = useState([]);
  const [results, setResults] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("studentResults");
    if (saved) setResults(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("studentResults", JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Filter students by category only (no course filter, courses fixed techSubjects)
  useEffect(() => {
    const filtered = selectedCategory
      ? studentsData.filter((s) => s.category === selectedCategory)
      : studentsData;
    setFilteredStudents(filtered);

    if (!filtered.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(null);
      setMarks([]);
    }
  }, [selectedCategory, selectedStudentId]);

  // Init marks when student selected
  useEffect(() => {
    if (!selectedStudentId) {
      setMarks([]);
      return;
    }
    const student = studentsData.find((s) => s.id === selectedStudentId);
    if (!student) return;

    // Initialize marks to last saved or empty
    const lastResults = results[selectedStudentId];
    let lastMarks = [];
    if (lastResults && lastResults.length > 0) {
      lastMarks = lastResults[0].marks;
    } else {
      lastMarks = student.subscribedCourses.map(() => "");
    }
    setMarks(lastMarks);
  }, [selectedStudentId, results]);

  const handleMarkChange = (idx, value) => {
    if (value === "" || (/^\d+$/.test(value) && +value <= 100)) {
      const newMarks = [...marks];
      newMarks[idx] = value;
      setMarks(newMarks);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert("Please select a student.");
      return;
    }
    if (marks.some((m) => m === "")) {
      alert("Please enter marks for all subjects.");
      return;
    }

    const numericMarks = marks.map(Number);
    const gpa = calculateGPA(numericMarks);
    const grade = assignGrade(gpa);

    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      marks: numericMarks,
      gpa: gpa.toFixed(2),
      grade,
    };

    setResults((prev) => {
      const studentResults = prev[selectedStudentId] || [];
      return {
        ...prev,
        [selectedStudentId]: [newEntry, ...studentResults],
      };
    });

    alert("Results uploaded to the student's account!");
  };

  const bgClass = darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900";
  const inputClass = `border rounded px-3 py-2 w-full ${
    darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
  }`;
  const tableHeaderClass = darkMode ? "bg-gray-800" : "bg-gray-100";
  const tableRowHoverClass = darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200";

  return (
    <div className={`min-h-screen p-6 ${bgClass} transition-colors duration-300`}>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 border rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Admin - Upload Tech Results</h1>

      {/* Category Filter */}
      <div className="w-64 mb-6">
        <label className="block mb-1 font-semibold">Select Category</label>
        <select
          className={inputClass}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">-- All Categories --</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Student Selection */}
      <div className="w-64 mb-6">
        <label className="block mb-1 font-semibold">Select Student</label>
        <select
          className={inputClass}
          value={selectedStudentId || ""}
          onChange={(e) => setSelectedStudentId(Number(e.target.value))}
          disabled={filteredStudents.length === 0}
        >
          <option value="">-- Select Student --</option>
          {filteredStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      {selectedStudentId && (
        <form onSubmit={handleUpload} className="mb-8 max-w-xl space-y-4">
          <h2 className="text-xl font-semibold mb-2">
            Enter marks for{" "}
            {studentsData.find((s) => s.id === selectedStudentId)?.name}
          </h2>

          {studentsData
            .find((s) => s.id === selectedStudentId)
            ?.subscribedCourses.map((subject, idx) => (
              <div key={subject}>
                <label className="block mb-1">{subject}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={inputClass}
                  value={marks[idx] || ""}
                  onChange={(e) => handleMarkChange(idx, e.target.value)}
                  required
                />
              </div>
            ))}

          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Upload to Student's Account
          </button>
        </form>
      )}

      {/* View Previous Results */}
      {selectedStudentId && (
        <div className="max-w-4xl overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">Previous Results</h2>

          <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
            <thead className={`${tableHeaderClass} text-left`}>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Date</th>
                {studentsData
                  .find((s) => s.id === selectedStudentId)
                  ?.subscribedCourses.map((subject) => (
                    <th
                      key={subject}
                      className="border border-gray-300 px-4 py-2 text-center"
                    >
                      {subject}
                    </th>
                  ))}
                <th className="border border-gray-300 px-4 py-2 text-center">GPA</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {(results[selectedStudentId] || []).length === 0 && (
                <tr>
                  <td
                    colSpan={
                      (studentsData.find((s) => s.id === selectedStudentId)
                        ?.subscribedCourses.length || 0) + 3
                    }
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No results uploaded yet.
                  </td>
                </tr>
              )}
              {(results[selectedStudentId] || []).map((res) => (
                <tr
                  key={res.id}
                  className={`${tableRowHoverClass} transition`}
                >
                  <td className="border border-gray-300 px-4 py-2">{res.date}</td>
                  {res.marks.map((mark, i) => (
                    <td
                      key={i}
                      className="border border-gray-300 px-4 py-2 text-center"
                    >
                      {mark}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {res.gpa}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {res.grade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
