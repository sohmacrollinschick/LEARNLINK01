import React, { useState } from "react";
import { Archive, Search } from "lucide-react";

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
    progress: 100,
    status: "Completed",
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
    progress: 100,
    status: "Completed",
    popularity: 75,
    description:
      "Hands-on workshop on containerization and orchestration using Docker and Kubernetes.",
    tags: ["Docker", "Kubernetes", "Containers"],
    videoUrl: "https://www.youtube.com/embed/X48VuDVv0do",
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
    videoUrl: "https://www.youtube.com/embed/jV8B24rSN5o",
  },
  {
    id: 5,
    title: "Data Structures & Algorithms",
    department: "Computer Science",
    careerPath: "Software Engineer",
    category: "Core CS",
    type: "Lecture",
    progress: 100,
    status: "Completed",
    popularity: 95,
    description:
      "Deep dive into algorithms and data structures fundamental for coding interviews.",
    tags: ["Algorithms", "Data Structures", "Coding"],
    videoUrl: "https://www.youtube.com/embed/8hly31xKli0",
  },
  {
    id: 6,
    title: "React Native Mobile App",
    department: "Computer Science",
    careerPath: "Mobile Developer",
    category: "Mobile Development",
    type: "Project",
    progress: 100,
    status: "Completed",
    popularity: 80,
    description:
      "Build cross-platform mobile apps with React Native.",
    tags: ["React Native", "Mobile", "JavaScript"],
    videoUrl: "https://www.youtube.com/embed/0-S5a0eXPoc",
  },
  {
    id: 7,
    title: "Python for Data Science",
    department: "Data Science",
    careerPath: "Data Scientist",
    category: "Data Science",
    type: "Lecture",
    progress: 100,
    status: "Completed",
    popularity: 88,
    description:
      "Learn Python programming and data analysis libraries for data science.",
    tags: ["Python", "Pandas", "NumPy"],
    videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw",
  },
  {
    id: 8,
    title: "CI/CD Pipelines",
    department: "DevOps",
    careerPath: "DevOps Engineer",
    category: "Cloud Infrastructure",
    type: "Workshop",
    progress: 100,
    status: "Completed",
    popularity: 77,
    description:
      "Automate build, test, and deployment pipelines using CI/CD tools.",
    tags: ["CI/CD", "Jenkins", "GitHub Actions"],
    videoUrl: "https://www.youtube.com/embed/1fiEru6aTDw",
  },
  {
    id: 9,
    title: "Machine Learning Basics",
    department: "Data Science",
    careerPath: "Data Scientist",
    category: "Data Science",
    type: "Lecture",
    progress: 100,
    status: "Completed",
    popularity: 83,
    description:
      "Intro to machine learning concepts, supervised and unsupervised learning.",
    tags: ["Machine Learning", "AI", "Python"],
    videoUrl: "https://www.youtube.com/embed/GwIo3gDZCVQ",
  },
  {
    id: 10,
    title: "TypeScript Fundamentals",
    department: "Computer Science",
    careerPath: "Frontend Developer",
    category: "Web Development",
    type: "Lecture",
    progress: 100,
    status: "Completed",
    popularity: 78,
    description:
      "Strongly typed JavaScript with TypeScript: basics, interfaces, and generics.",
    tags: ["TypeScript", "JavaScript", "Typing"],
    videoUrl: "https://www.youtube.com/embed/BwuLxPH8IDs",
  },
  {
    id: 11,
    title: "GraphQL APIs",
    department: "Computer Science",
    careerPath: "Backend Developer",
    category: "Backend Development",
    type: "Project",
    progress: 100,
    status: "Completed",
    popularity: 79,
    description:
      "Build flexible APIs using GraphQL and Apollo Server.",
    tags: ["GraphQL", "API", "Apollo"],
    videoUrl: "https://www.youtube.com/embed/ed8SzALpx1Q",
  },
  {
    id: 12,
    title: "Cybersecurity Fundamentals",
    department: "Computer Science",
    careerPath: "Security Analyst",
    category: "Security",
    type: "Lecture",
    progress: 100,
    status: "Completed",
    popularity: 65,
    description:
      "Learn the basics of cybersecurity principles and common threats.",
    tags: ["Security", "Networking", "Encryption"],
    videoUrl: "https://www.youtube.com/embed/2I2hncNsTQU",
  },
];

const filterOptions = {
  department: ["Computer Science", "DevOps", "Data Science"],
  careerPath: [
    "Frontend Developer",
    "Backend Developer",
    "DevOps Engineer",
    "Software Engineer",
    "Mobile Developer",
    "Data Scientist",
    "Security Analyst",
  ],
  category: [
    "Web Development",
    "Backend Development",
    "Cloud Infrastructure",
    "Core CS",
    "Mobile Development",
    "Data Science",
    "Security",
  ],
};

const categoryColors = {
  "Web Development": "bg-indigo-100 text-indigo-800",
  "Backend Development": "bg-pink-100 text-pink-800",
  "Cloud Infrastructure": "bg-purple-100 text-purple-800",
  "Core CS": "bg-teal-100 text-teal-800",
  "Mobile Development": "bg-blue-100 text-blue-800",
  "Data Science": "bg-amber-100 text-amber-800",
  Security: "bg-red-100 text-red-800",
};

export default function ArchivedCoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterCareer, setFilterCareer] = useState("All");

  // Only completed courses archived
  const archivedCourses = coursesData.filter((c) => c.status === "Completed");

  function filterCourse(c) {
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory = filterCategory === "All" || c.category === filterCategory;
    const matchDepartment = filterDepartment === "All" || c.department === filterDepartment;
    const matchCareer = filterCareer === "All" || c.careerPath === filterCareer;

    return matchSearch && matchCategory && matchDepartment && matchCareer;
  }

  const filteredCourses = archivedCourses.filter(filterCourse);

  return (
    <div className="max-w-7xl mx-auto p-8 bg-white rounded-lg shadow-lg">
      <header className="flex items-center mb-8 gap-3">
        <Archive size={32} className="text-gray-700" />
        <h1 className="text-4xl font-bold text-gray-900">Archived Courses</h1>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative flex-grow max-w-md">
          <input
            type="search"
            placeholder="Search archived courses..."
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
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Filter by category"
        >
          <option value="All">All Categories</option>
          {filterOptions.category.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
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
          {filterOptions.department.map((dep) => (
            <option key={dep} value={dep}>
              {dep}
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
          {filterOptions.careerPath.map((car) => (
            <option key={car} value={car}>
              {car}
            </option>
          ))}
        </select>
      </div>

      {/* Archived courses grid */}
      {filteredCourses.length === 0 ? (
        <p className="text-gray-600 italic">No archived courses found matching the filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <ArchivedCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchivedCourseCard({ course }) {
  return (
    <div className="border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-default">
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{course.title}</h3>
      <p className="text-gray-700 mb-4 line-clamp-4">{course.description}</p>

      {/* Video embed if available */}
      {course.videoUrl && (
        <div className="relative pt-[56.25%] overflow-hidden rounded-lg shadow-md mb-4">
          <iframe
            src={course.videoUrl}
            title={`Video for ${course.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full border-0"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge colorClass={categoryColors[course.category]}>{course.category}</Badge>
        <Badge>{course.department}</Badge>
        <Badge>{course.careerPath}</Badge>
      </div>

      <ProgressBar progress={course.progress} />
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

function ProgressBar({ progress }) {
  return (
    <div
      className="w-full h-4 bg-gray-300 rounded-full overflow-hidden"
      title={`${progress}% Complete`}
    >
      <div
        className="h-full bg-indigo-600 transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
