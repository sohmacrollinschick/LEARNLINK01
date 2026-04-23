import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function AdminResultsPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select("id, email");
      if (error) console.error(error);
      else setUsers(data);
    }
    fetchUsers();
  }, []);

  if (selectedUser) {
    return (
      <UserResultsForm
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div>
      <h1>Admin: Select a User</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.email}{" "}
            <button onClick={() => setSelectedUser(u)}>Enter Results</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserResultsForm({ user, onBack }) {
  const [subjects, setSubjects] = useState([
    { name: "Math", mark: "" },
    { name: "English", mark: "" },
    { name: "Science", mark: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function calculateGrade(mark) {
    if (mark >= 90) return "A";
    if (mark >= 80) return "B";
    if (mark >= 70) return "C";
    if (mark >= 60) return "D";
    return "F";
  }

  function calculateGPA(mark) {
    if (mark >= 90) return 4.0;
    if (mark >= 80) return 3.0;
    if (mark >= 70) return 2.0;
    if (mark >= 60) return 1.0;
    return 0.0;
  }

  function handleMarkChange(index, value) {
    const newSubjects = [...subjects];
    newSubjects[index].mark = value;
    setSubjects(newSubjects);
  }

  function calculateOverallGPA() {
    const gpas = subjects
      .map((s) => calculateGPA(Number(s.mark)))
      .filter((g) => !isNaN(g));
    if (gpas.length === 0) return 0;
    const total = gpas.reduce((acc, cur) => acc + cur, 0);
    return (total / gpas.length).toFixed(2);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setMessage("");

    try {
      // Insert each subject result
      for (const subject of subjects) {
        const markNum = Number(subject.mark);
        if (isNaN(markNum)) throw new Error("Please enter valid marks for all subjects.");

        const grade = calculateGrade(markNum);
        const gpa = calculateGPA(markNum);

        const { error } = await supabase.from("results").insert({
          user_id: user.id,
          subject: subject.name,
          mark: markNum,
          grade,
          gpa,
        });
        if (error) throw error;
      }

      // TODO: Send email notification here, e.g. call an API or Supabase Function

      setMessage("Results uploaded successfully!");
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button onClick={onBack}>Back to user list</button>
      <h2>Enter Results for {user.email}</h2>
      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Mark</th>
            <th>Grade</th>
            <th>GPA</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject, i) => {
            const markNum = Number(subject.mark);
            return (
              <tr key={subject.name}>
                <td>{subject.name}</td>
                <td>
                  <input
                    type="number"
                    value={subject.mark}
                    onChange={(e) => handleMarkChange(i, e.target.value)}
                    min={0}
                    max={100}
                  />
                </td>
                <td>{isNaN(markNum) ? "-" : calculateGrade(markNum)}</td>
                <td>{isNaN(markNum) ? "-" : calculateGPA(markNum)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h3>Overall GPA: {calculateOverallGPA()}</h3>
      <button onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Upload Results"}
      </button>
      <p>{message}</p>
    </div>
  );
}

export default AdminResultsPage;
