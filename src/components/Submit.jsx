import React, { useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';

export default function SubmitAssignment() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    teacherEmail: '',
    course: '',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFile(files[0]);
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const templateParams = {
      student_name: formData.name,
      student_email: formData.email,
      teacher_email: formData.teacherEmail,
      course: formData.course,
      notes: formData.notes,
    };

    try {
      await emailjs.send(
        'your_service_id',
        'your_template_id',
        templateParams,
        'your_public_key'
      );
      alert("Assignment submitted successfully to your teacher's email!");
      setFormData({ name: '', email: '', teacherEmail: '', course: '', notes: '' });
      setFile(null);
    } catch (error) {
      alert("Error submitting. Try again later.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl p-10 w-full max-w-3xl relative">
        <div className="absolute -top-6 left-6 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
          Submit Portal
        </div>
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-8">Assignment Submission</h2>
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
            <div className="group">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Student Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
            <div className="group">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Teacher Email</label>
              <input
                type="email"
                name="teacherEmail"
                value={formData.teacherEmail}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
            <div className="group">
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Course</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              >
                <option value="">-- Select --</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
          </div>

          <div className="group">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Upload Assignment</label>
            <input
              type="file"
              onChange={handleChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 rounded-xl"
            />
            <p className="text-xs text-gray-400 mt-1">File won't be sent via email in free plan. You can upload to a storage & send link.</p>
          </div>

          <div className="group">
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Additional Notes</label>
            <textarea
              name="notes"
              rows="4"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              placeholder="Any additional message..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
            ) : (
              <><UploadCloud className="w-5 h-5" /> Submit Assignment</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
