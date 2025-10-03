import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Admin() {
  const [data, setData] = useState([]);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authed) return;

    fetch("/api/admin-stats", {
      headers: { Authorization: `Bearer ${password}` },
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json();
      })
      .then((json) => {
        setData(json.pledges || []);
        setError("");
      })
      .catch((err) => {
        setError("Failed to fetch admin data: " + err.message);
      });
  }, [authed, password]);

  // --- Chart preprocessing ---
  const chartData = [
    {
      name: "Investment",
      count: data.filter((d) =>
        d.interested?.toLowerCase().includes("investment")
      ).length,
    },
    {
      name: "Dealership",
      count: data.filter((d) =>
        d.interested?.toLowerCase().includes("dealership")
      ).length,
    },
    {
      name: "Others",
      count: data.filter((d) =>
        d.interested?.toLowerCase().includes("others")
      ).length,
    },
  ];

  if (!authed) {
    return (
      <div style={styles.container}>
        <h2>Admin Login</h2>
        <input
          type="password"
          placeholder="Enter Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={() => setAuthed(true)} style={styles.button}>
          Login
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Admin Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Debug JSON */}
      <h3>Debug (Raw Data):</h3>
      <pre style={styles.debugBox}>
        {JSON.stringify(data, null, 2)}
      </pre>

      {/* Table */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Country</th>
            <th>Pledge</th>
            <th style={{ width: "250px" }}>Interested</th>
            <th>Looking For</th>
          </tr>
        </thead>
        <tbody>
          {data.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.country}</td>
              <td>{u.pledge ? "✅" : "❌"}</td>
              <td>{u.interested || "-"}</td>
              <td>{u.looking_for || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Chart */}
      <h3 style={{ marginTop: "2rem" }}>Interest Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#0d9488" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
  },
  input: {
    padding: "0.7rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    marginRight: "1rem",
  },
  button: {
    padding: "0.7rem 1.2rem",
    border: "none",
    borderRadius: "6px",
    background: "#0d9488",
    color: "white",
    cursor: "pointer",
  },
  debugBox: {
    background: "#f3f4f6",
    padding: "1rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    maxHeight: "200px",
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  th: {
    border: "1px solid #ccc",
    padding: "8px",
    background: "#e2e8f0",
    textAlign: "left",
  },
  td: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "left",
  },
};

export default Admin;
