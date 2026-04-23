import React, { useState } from 'react';
import { supabase } from "../supabaseClient";
import { useUser } from "./Usercontext";
import { Flame, GaugeCircle, User, Bell, Trophy, Clock3, CalendarClock, MessageSquareText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Courses({ darkMode }) {
  const { user } = useUser();

  const bg = darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const card = darkMode ? 'bg-gray-800' : 'bg-white';
  const textSubtle = darkMode ? 'text-gray-400' : 'text-gray-500';

  const [searchTerm, setSearchTerm] = useState('');

  const courses = [
    {
      id: 1,
      title: 'Complete Health Care App',
      author: 'Amst Tech',
      rating: '4.7 (32)',
      price: '12,000 FCFA',
      video: '/assets/video/healthcare-app.mp4',
    },
    {
      id: 2,
      title: 'Glassmorphism Login Form',
      author: 'Albi Tech',
      rating: '4.7 (540)',
      price: '6,000 FCFA',
      video: '/assets/video/login-tutorial.mp4',
    },
    {
      id: 3,
      title: 'Complete JavaScript Course',
      author: 'Mac Tech',
      rating: '4.9 (230)',
      price: '20,000 FCFA',
      video: '/assets/video/javascript-course.mp4',
    },
  ];

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ===========================
     🔥 SAVE VIDEO COMPLETION
  ============================ */
  async function markVideoCompleted(courseId) {
    if (!user) return;

    console.log("Video completed. Saving progress...");

    await supabase
      .from("course_progress")
      .upsert({
        user_id: user.id,
        video_id: courseId,
        completed_parts: 1,
        total_parts: 1,
        progress_percentage: 100,
        updated_at: new Date()
      }, { onConflict: ["user_id", "video_id"] });
  }

  const COLORS = ['#FFA500', '#FF8042', '#FFBB28'];

  const pieData = [
    { name: 'Assignments', value: 10 },
    { name: 'Exams', value: 4 },
    { name: 'Projects', value: 3 },
  ];

  return (
    <div className={`p-6 min-h-screen grid grid-cols-1 lg:grid-cols-3 gap-6 ${bg}`}>

      {/* === LEFT SIDE === */}
      <div className="col-span-2 space-y-6">

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search course by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        {/* Available Courses */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Available Courses</h2>
            <span className="text-sm text-orange-500">{filteredCourses.length} found</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className={`rounded-lg overflow-hidden shadow ${card}`}>
                <video
                  src={course.video}
                  className="w-full h-40 object-cover"
                  controls
                  onEnded={() => markVideoCompleted(course.id)}  // 🔥 IMPORTANT
                />
                <div className="p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className={`${textSubtle} text-sm`}>{course.author}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span>⭐ {course.rating}</span>
                    <span>{course.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chart */}
        <section>
          <h2 className="text-xl font-bold mb-4">Course Activity</h2>
          <div className={`rounded-xl shadow ${card} p-4 h-64`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#FFA500"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

      </div>

      {/* === RIGHT SIDE (UNCHANGED UI) === */}
      <aside className="space-y-6">
        <div className={`p-4 rounded-xl shadow ${card}`}>
          <div className="flex items-center space-x-4">
            <User className="w-10 h-10 text-orange-500" />
            <div>
              <h3 className="font-semibold text-lg">
                {user?.email?.split("@")[0]}
              </h3>
              <p className={`${textSubtle} text-sm`}>Student</p>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}