import React, { useState, useContext } from "react";
import { ApiContext } from "../App";

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
      <button style={styles.exportBtn} onClick={exportCSV}>
        Export CSV
      </button>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th>Pledge</th>
              <th>Interested</th>
              <th style={{ minWidth: "200px" }}>Looking For</th>
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
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.country}</td>
                <td style={{ textAlign: "center" }}>
                  {u.pledge ? "✅" : "❌"}
                </td>
                <td>{(u.interested || []).join(", ")}</td>
                <td>{(u.lookingFor || []).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    overflowX: "auto",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
  },
  "table th": {
    background: "#0d9488",
    color: "white",
    padding: "0.75rem",
    textAlign: "left",
    border: "1px solid #ddd",
  },
  "table td": {
    border: "1px solid #ddd",
    padding: "0.6rem",
  },
};

export default Admin;
