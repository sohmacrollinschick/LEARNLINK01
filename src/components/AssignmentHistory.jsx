import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
  CalendarCheck,
  Clock,
  FileCheck,
  Download,
  User,
  Tags,
} from "lucide-react";

const techAssignments = [
  {
    id: 1,
    title: "React Hooks Project",
    course: "Frontend Development",
    submittedDate: "2025-07-20T14:30:00Z",
    status: "Graded",
    grade: "A",
    teacherEmail: "mrs.jones@school.edu",
    comments: "Excellent use of hooks and clean code.",
    duration: "4h 30m",
    assignmentType: "Project",
    submissionFile: "react-hooks-project.zip",
  },
  {
    id: 2,
    title: "Node.js API Quiz",
    course: "Backend Development",
    submittedDate: "2025-07-18T10:00:00Z",
    status: "Submitted",
    grade: null,
    teacherEmail: "mr.smith@school.edu",
    comments: null,
    duration: "30m",
    assignmentType: "Quiz",
    submissionFile: null,
  },
  {
    id: 3,
    title: "Database Design Lab",
    course: "Database Systems",
    submittedDate: "2025-07-15T16:00:00Z",
    status: "Late",
    grade: "B-",
    teacherEmail: "dr.williams@school.edu",
    comments: "Late but good normalization.",
    duration: "2h 15m",
    assignmentType: "Lab",
    submissionFile: "db-design-lab.pdf",
  },
  {
    id: 4,
    title: "CSS Grid Layout Assignment",
    course: "Frontend Development",
    submittedDate: "2025-07-14T12:45:00Z",
    status: "Graded",
    grade: "A+",
    teacherEmail: "mrs.jones@school.edu",
    comments: "Very creative grid designs!",
    duration: "3h",
    assignmentType: "Assignment",
    submissionFile: "css-grid-layout.zip",
  },
  {
    id: 5,
    title: "Docker Container Setup",
    course: "DevOps",
    submittedDate: "2025-07-10T09:30:00Z",
    status: "Graded",
    grade: "B+",
    teacherEmail: "mr.smith@school.edu",
    comments: "Good understanding of containers.",
    duration: "5h",
    assignmentType: "Project",
    submissionFile: "docker-setup.tar.gz",
  },
  // Add more if you want
];

const assignmentTypeColors = {
  Project: "bg-indigo-200 text-indigo-900",
  Quiz: "bg-yellow-200 text-yellow-900",
  Lab: "bg-pink-200 text-pink-900",
  Assignment: "bg-green-200 text-green-900",
};

const statusColors = {
  Submitted: "bg-yellow-200 text-yellow-800",
  Graded: "bg-green-200 text-green-800",
  Late: "bg-red-200 text-red-800",
};

export default function TechAssignmentHistory() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("submittedDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const assignmentsPerPage = 3;

  // Filter, search, sort
  const filteredSorted = useMemo(() => {
    let filtered = techAssignments.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.course.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "All" || a.assignmentType === filterType;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      if (sortField === "submittedDate") {
        return sortDirection === "asc"
          ? new Date(a.submittedDate) - new Date(b.submittedDate)
          : new Date(b.submittedDate) - new Date(a.submittedDate);
      }
      if (sortField === "status") {
        return sortDirection === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      if (sortField === "assignmentType") {
        return sortDirection === "asc"
          ? a.assignmentType.localeCompare(b.assignmentType)
          : b.assignmentType.localeCompare(a.assignmentType);
      }
      return 0;
    });

    return filtered;
  }, [search, filterType, sortField, sortDirection]);

  // Pagination slice
  const lastIndex = currentPage * assignmentsPerPage;
  const firstIndex = lastIndex - assignmentsPerPage;
  const paginated = filteredSorted.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredSorted.length / assignmentsPerPage);

  function toggleSort(field) {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  function downloadFile(fileName) {
    alert(`Downloading: ${fileName}`);
    // Here you can implement real download logic or link to file URL
  }

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Tech Assignments Submission History</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-grow max-w-sm">
          <input
            type="search"
            placeholder="Search assignments or courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>

        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          aria-label="Filter by assignment type"
        >
          <option value="All">All Types</option>
          {Object.keys(assignmentTypeColors).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <button
          onClick={() => toggleSort("submittedDate")}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          title="Sort by Date"
        >
          <CalendarCheck size={20} />
          <span>Date</span>
          {sortField === "submittedDate" &&
            (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
        </button>

        <button
          onClick={() => toggleSort("status")}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          title="Sort by Status"
        >
          <Clock size={20} />
          <span>Status</span>
          {sortField === "status" &&
            (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
        </button>

        <button
          onClick={() => toggleSort("assignmentType")}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          title="Sort by Assignment Type"
        >
          <Tags size={20} />
          <span>Type</span>
          {sortField === "assignmentType" &&
            (sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left table-auto border-collapse">
          <thead className="bg-indigo-50">
            <tr>
              <th className="py-4 px-6">Assignment</th>
              <th className="py-4 px-6">Course</th>
              <th className="py-4 px-6 cursor-pointer" onClick={() => toggleSort("submittedDate")}>
                Submitted Date {sortField === "submittedDate" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="py-4 px-6">Duration</th>
              <th className="py-4 px-6 cursor-pointer" onClick={() => toggleSort("status")}>
                Status {sortField === "status" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="py-4 px-6 cursor-pointer" onClick={() => toggleSort("assignmentType")}>
                Type {sortField === "assignmentType" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="py-4 px-6">Teacher</th>
              <th className="py-4 px-6">Download</th>
              <th className="py-4 px-6">Details</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  No assignments found.
                </td>
              </tr>
            ) : (
              paginated.map((a) => (
                <React.Fragment key={a.id}>
                  <tr
                    className="border-b hover:bg-indigo-100 cursor-pointer transition"
                    onClick={() => toggleExpand(a.id)}
                    title="Click row to expand"
                  >
                    <td className="py-4 px-6 font-semibold">{a.title}</td>
                    <td className="py-4 px-6">{a.course}</td>
                    <td className="py-4 px-6">{new Date(a.submittedDate).toLocaleString()}</td>
                    <td className="py-4 px-6">{a.duration}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          statusColors[a.status]
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          assignmentTypeColors[a.assignmentType]
                        }`}
                      >
                        {a.assignmentType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <User
                        size={20}
                        className="inline-block text-indigo-600 cursor-help"
                        title={`Teacher email: ${a.teacherEmail}`}
                      />
                    </td>
                    <td className="py-4 px-6 text-center">
                      {a.submissionFile ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(a.submissionFile);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                          title="Download submission file"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-indigo-700 hover:underline font-semibold">
                      {expandedId === a.id ? "▲ Hide" : "▼ View"}
                    </td>
                  </tr>
                  {expandedId === a.id && (
                    <tr className="bg-indigo-50">
                      <td colSpan={9} className="px-8 py-6 text-gray-700 space-y-2">
                        <p>
                          <strong>Grade:</strong> {a.grade || "Not graded yet"}
                        </p>
                        <p>
                          <strong>Comments:</strong> {a.comments || "No comments"}
                        </p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex justify-center mt-8 space-x-2" aria-label="Pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-indigo-100"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                currentPage === i + 1
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-gray-300 hover:bg-indigo-100"
              }`}
              aria-current={currentPage === i + 1 ? "page" : undefined}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-indigo-100"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
