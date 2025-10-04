import React, { useState, useContext, useMemo } from "react";
import { ApiContext } from "../App";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";

function Admin() {
  const API_BASE = useContext(ApiContext);

  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // fetch stats
  const fetchStats = async (pwd) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin-stats`, {
        headers: { Authorization: `Bearer ${pwd}` },
      });
      if (res.status === 401) {
        setError("Unauthorized – wrong password.");
        return;
      }
      const data = await res.json();
      setUsers(data.pledges || []);
      setError(null);
      setAuthed(true);
    } catch (err) {
      setError("Error fetching admin stats: " + err.message);
    }
  };

  // handle CSV export
  const exportCSV = () => {
    if (users.length === 0) return;

    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Country",
      "Pledge",
      "Interested",
      "Looking For",
    ];
    const rows = users.map((u) => [
      u.id,
      u.name,
      u.email,
      u.phone || "",
      u.country || "",
      u.pledge ? "Yes" : "No",
      (u.interested || []).join(", "),
      (u.lookingFor || []).join(", "),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((r) => r.map((x) => `"${x}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pledges.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Chart Data ---
  const interestedData = useMemo(() => {
    const counts = { Investment: 0, Dealership: 0, Others: 0 };
    users.forEach((u) => {
      (u.interested || []).forEach((val) => {
        if (counts[val] !== undefined) counts[val]++;
      });
    });
    return Object.keys(counts).map((k) => ({ name: k, value: counts[k] }));
  }, [users]);

  const lookingForData = useMemo(() => {
    const counts = {
      "Sports courts & flooring": 0,
      "Spa and wellness products": 0,
      Padel: 0,
    };
    users.forEach((u) => {
      (u.lookingFor || []).forEach((val) => {
        if (counts[val] !== undefined) counts[val]++;
      });
    });
    return Object.keys(counts).map((k) => ({ name: k, value: counts[k] }));
  }, [users]);

  if (!authed) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Admin Dashboard 🔐</h1>
        <p style={styles.subtitle}>Enter admin password to continue.</p>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button style={styles.button} onClick={() => fetchStats(password)}>
          Login
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Admin Dashboard 📊</h1>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button style={styles.exportBtn} onClick={exportCSV}>
          Export CSV
        </button>
        <span style={{ fontWeight: "bold", fontSize: "1rem" }}>
          Total Leads: {users.length}
        </span>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Country</th>
              <th style={styles.th}>Pledge</th>
              <th style={styles.th}>Interested</th>
              <th style={{ ...styles.th, minWidth: "200px" }}>Looking For</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr
                key={u.id}
                style={{
                  background: idx % 2 === 0 ? "#f9fafb" : "white",
                  transition: "background 0.2s ease",
                }}
              >
                <td style={styles.td}>{u.id}</td>
                <td style={styles.td}>{u.name}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.phone}</td>
                <td style={styles.td}>{u.country}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  {u.pledge ? "✅" : "❌"}
                </td>
                <td style={styles.td}>{(u.interested || []).join(", ")}</td>
                <td style={styles.td}>{(u.lookingFor || []).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ textAlign: "center" }}>Interested Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={interestedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#0d9488">
              <LabelList dataKey="value" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ textAlign: "center" }}>Looking For Breakdown</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={lookingForData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#1e3a8a">
              <LabelList dataKey="value" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
    maxWidth: "95%",
    margin: "auto",
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "0.25rem",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "1rem",
    textAlign: "center",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "1rem",
    width: "100%",
    marginBottom: "1rem",
  },
  button: {
    padding: "0.75rem",
    border: "none",
    borderRadius: "8px",
    background: "#0d9488",
    color: "white",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
  error: {
    color: "red",
    marginTop: "0.5rem",
    textAlign: "center",
  },
  exportBtn: {
    background: "#1e3a8a",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    cursor: "pointer",
    border: "none",
  },
  tableWrapper: {
    maxHeight: "650px", // ~19 rows before scroll
    overflowY: "auto",
    overflowX: "auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    marginTop: "1rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
    tableLayout: "auto",
  },
  th: {
    background: "#0d9488",
    color: "white",
    padding: "0.9rem 1rem",
    textAlign: "left",
    border: "1px solid #ccc",
    minWidth: "120px",
  },
  td: {
    border: "1px solid #ccc",
    padding: "0.9rem 1rem",
    background: "white",
    wordWrap: "break-word",
    whiteSpace: "normal",
  },
};

export default Admin;
