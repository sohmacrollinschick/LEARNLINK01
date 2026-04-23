import React, { useState } from "react";
import { CheckCircle, Search, UserCheck } from "lucide-react";

// Sample course data with videoUrl included
const coursesData = [
  {
    id: 1,
    title: "React Fundamentals",
    department: "Computer Science",
    careerPath: "Frontend Developer",
    category: "Web Development",
    type: "Lecture",
    progress: 100,
    status: "Completed",
    popularity: 90,
    description:
      "Learn the basics of React including components, hooks, and state management.",
    tags: ["React", "JavaScript", "UI"],
    videoUrl: "https://www.youtube.com/embed/dGcsHMXbSOA",
  },
  {
    id: 2,
    title: "Advanced Node.js",
    department: "Computer Science",
    careerPath: "Backend Developer",
    category: "Backend Development",
    type: "Project",
    progress: 70,
    status: "In Progress",
    popularity: 85,
    description:
      "Build scalable REST APIs and learn server-side development with Node.js.",
    tags: ["Node.js", "Express", "APIs"],
    videoUrl: "https://www.youtube.com/embed/Oe421EPjeBE",
  },
  {
    id: 3,
    title: "Docker & Kubernetes",
    department: "DevOps",
    careerPath: "DevOps Engineer",
    category: "Cloud Infrastructure",
    type: "Workshop",
    progress: 0,
    status: "Not Started",
    popularity: 75,
    description:
      "Hands-on workshop on containerization and orchestration using Docker and Kubernetes.",
    tags: ["Docker", "Kubernetes", "Containers"],
  },
  {
    id: 4,
    title: "CSS Grid & Flexbox",
    department: "Computer Science",
    careerPath: "Frontend Developer",
    category: "Web Development",
    type: "Lecture",
    progress: 100,
    status: "Completed",
    popularity: 70,
    description:
      "Master modern CSS layout techniques using Grid and Flexbox.",
    tags: ["CSS", "Grid", "Flexbox"],
  },
  {
    id: 5,
    title: "Data Structures & Algorithms",
    department: "Computer Science",
    careerPath: "Software Engineer",
    category: "Core CS",
    type: "Lecture",
    progress: 90,
    status: "In Progress",
    popularity: 95,
    description:
      "Deep dive into algorithms and data structures fundamental for coding interviews.",
    tags: ["Algorithms", "Data Structures", "Coding"],
  },
  {
    id: 6,
    title: "React Native Mobile App",
    department: "Computer Science",
    careerPath: "Mobile Developer",
    category: "Mobile Development",
    type: "Project",
    progress: 20,
    status: "In Progress",
    popularity: 80,
    description:
      "Build cross-platform mobile apps with React Native.",
    tags: ["React Native", "Mobile", "JavaScript"],
  },
  {
    id: 7,
    title: "Python for Data Science",
    department: "Data Science",
    careerPath: "Data Scientist",
    category: "Data Science",
    type: "Lecture",
    progress: 0,
    status: "Not Started",
    popularity: 88,
    description:
      "Learn Python programming and data analysis libraries for data science.",
    tags: ["Python", "Pandas", "NumPy"],
  },
  {
    id: 8,
    title: "CI/CD Pipelines",
    department: "DevOps",
    careerPath: "DevOps Engineer",
    category: "Cloud Infrastructure",
    type: "Workshop",
    progress: 50,
    status: "In Progress",
    popularity: 77,
    description:
      "Automate build, test, and deployment pipelines using CI/CD tools.",
    tags: ["CI/CD", "Jenkins", "GitHub Actions"],
  },
];

// Static filters for selects
const filterOptions = {
  type: ["Lecture", "Project", "Workshop", "Seminar"],
  department: ["Computer Science", "DevOps", "Data Science"],
  careerPath: [
    "Frontend Developer",
    "Backend Developer",
    "DevOps Engineer",
    "Software Engineer",
    "Mobile Developer",
    "Data Scientist",
  ],
};

// Badge colors by status and category
const statusColors = {
  Completed: "bg-green-100 text-green-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  "Not Started": "bg-gray-200 text-gray-600",
};

const categoryColors = {
  "Web Development": "bg-indigo-100 text-indigo-800",
  "Backend Development": "bg-pink-100 text-pink-800",
  "Cloud Infrastructure": "bg-purple-100 text-purple-800",
  "Core CS": "bg-teal-100 text-teal-800",
  "Mobile Development": "bg-blue-100 text-blue-800",
  "Data Science": "bg-amber-100 text-amber-800",
};

export default function CourseDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterCareer, setFilterCareer] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  // Courses you studied = Completed or In Progress
  const studiedCourses = coursesData.filter(
    (c) => c.status === "Completed" || c.status === "In Progress"
  );

  // Recommendations: courses NOT studied but same career path or category
  const studiedCareerPaths = new Set(studiedCourses.map((c) => c.careerPath));
  const studiedCategories = new Set(studiedCourses.map((c) => c.category));

  const recommendedCourses = coursesData.filter(
    (c) =>
      !studiedCourses.includes(c) &&
      (studiedCareerPaths.has(c.careerPath) || studiedCategories.has(c.category))
  );

  // Filter + search logic
  function filterCourse(c) {
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = filterType === "All" || c.type === filterType;
    const matchDepartment = filterDepartment === "All" || c.department === filterDepartment;
    const matchCareer = filterCareer === "All" || c.careerPath === filterCareer;

    return matchSearch && matchType && matchDepartment && matchCareer;
  }

  const filteredStudied = studiedCourses.filter(filterCourse);
  const filteredRecommended = recommendedCourses.filter(filterCourse);

  function toggleExpand(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold mb-6 text-gray-900">My Courses Dashboard</h1>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative flex-grow max-w-md">
          <input
            type="search"
            placeholder="Search courses, tags, descriptions..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            size={20}
            className="absolute left-4 top-3 text-gray-400 pointer-events-none"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter by course type"
        >
          <option value="All">All Types</option>
          {filterOptions.type.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter by department"
        >
          <option value="All">All Departments</option>
          {filterOptions.department.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={filterCareer}
          onChange={(e) => setFilterCareer(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter by career path"
        >
          <option value="All">All Career Paths</option>
          {filterOptions.careerPath.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Studied Courses */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <CheckCircle size={26} className="text-green-600" />
          Courses You’ve Studied
        </h2>
        {filteredStudied.length === 0 ? (
          <p className="text-gray-600 italic">No courses found matching the filters.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudied.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                expanded={expandedId === course.id}
                onToggle={() => toggleExpand(course.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recommended Courses */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
          <UserCheck size={26} className="text-indigo-600" />
          Recommended Courses for You
        </h2>
        {filteredRecommended.length === 0 ? (
          <p className="text-gray-600 italic">No recommendations found matching the filters.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecommended.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                expanded={expandedId === course.id}
                onToggle={() => toggleExpand(course.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CourseCard({ course, expanded, onToggle }) {
  return (
    <div
      className={`border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between
        hover:shadow-lg transition-shadow cursor-pointer relative`}
      onClick={onToggle}
    >
      <div>
        <h3 className="text-xl font-semibold mb-1 text-gray-900">{course.title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge colorClass={categoryColors[course.category]}>{course.category}</Badge>
          <Badge colorClass={statusColors[course.status]}>{course.status}</Badge>
          <Badge>{course.type}</Badge>
        </div>
        <p className="text-gray-700 mb-3 line-clamp-3">{course.description}</p>
      </div>

      <div className="flex items-center justify-between">
        <ProgressBar progress={course.progress} />
        <button
          className="text-indigo-600 font-semibold hover:underline focus:outline-none"
          aria-expanded={expanded}
          aria-controls={`course-details-${course.id}`}
        >
          {expanded ? "Hide Details ▲" : "View Details ▼"}
        </button>
      </div>

      {expanded && (
        <div
          id={`course-details-${course.id}`}
          className="mt-4 text-gray-700 space-y-4"
        >
          <p>
            <strong>Department:</strong> {course.department}
          </p>
          <p>
            <strong>Career Path:</strong> {course.careerPath}
          </p>
          <p>
            <strong>Popularity:</strong> {course.popularity}%
          </p>
          <p>
            <strong>Tags:</strong>{" "}
            {course.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </p>

          {/* Responsive YouTube video embed */}
          {course.videoUrl && (
            <div className="relative pt-[56.25%] overflow-hidden rounded-lg shadow-md">
              <iframe
                src={course.videoUrl}
                title={`Video for ${course.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ children, colorClass = "bg-gray-200 text-gray-700" }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold select-none ${colorClass}`}
    >
      {children}
    </span>
  );
}

function TagChip({ label }) {
  return (
    <span className="inline-block bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-xs font-medium mr-1 select-none">
      {label}
    </span>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="w-28 h-4 bg-gray-300 rounded-full overflow-hidden" title={`${progress}% Complete`}>
      <div
        className="h-full bg-indigo-600 transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
