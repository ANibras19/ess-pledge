import React, { useEffect, useState, useContext } from "react";
import { ApiContext } from "../App";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function Admin() {
  const API_BASE = useContext(ApiContext);
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({ Investment: 0, Dealership: 0, Others: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/api/admin-stats`, {
      headers: { Authorization: `Bearer ${process.env.REACT_APP_ADMIN_PASSWORD || "secret123"}` }
    })
      .then(res => res.json())
      .then(json => {
        setData(json.pledges || []);
        // count interested values
        let c = { Investment: 0, Dealership: 0, Others: 0 };
        (json.pledges || []).forEach(u => {
          if (u.interested) {
            u.interested.split(",").forEach(val => {
              if (c[val]) c[val] += 1;
            });
          }
        });
        setCounts(c);
      })
      .catch(err => console.error("Admin fetch failed", err));
  }, [API_BASE]);

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "1rem" }}>Admin Dashboard</h1>

      {/* Table */}
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: "2rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
      }}>
        <thead style={{ background: "#d6b228", color: "#fff" }}>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Country</th>
            <th style={thStyle}>Pledge</th>
            <th style={{ ...thStyle, width: "250px" }}>Interested / Looking For</th>
          </tr>
        </thead>
        <tbody>
          {data.map((u, i) => (
            <tr key={u.id} style={{ background: i % 2 === 0 ? "#fffbea" : "#ffffff" }}>
              <td style={tdStyle}>{u.id}</td>
              <td style={tdStyle}>{u.name}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>{u.phone || "-"}</td>
              <td style={tdStyle}>{u.country}</td>
              <td style={tdStyle}>{u.pledge ? "✅" : "❌"}</td>
              <td style={{ ...tdStyle, textAlign: "left" }}>
                {u.interested || "-"} {u.looking_for ? " / " + u.looking_for : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Chart */}
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Interests Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={[
          { name: "Investment", value: counts.Investment },
          { name: "Dealership", value: counts.Dealership },
          { name: "Others", value: counts.Others }
        ]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#d6b228" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "center",
  fontWeight: "bold"
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "center",
  fontSize: "14px"
};

export default Admin;
