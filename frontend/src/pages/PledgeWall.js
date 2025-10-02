import React, { useEffect, useState, useContext } from "react";
import { ApiContext } from "../App";

function PledgeWall() {
  const API_BASE = useContext(ApiContext);

  const [pledges, setPledges] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPledges = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pledges`);
        const data = await res.json();
        setPledges(data.pledges || []);
        setCount(data.count || 0);
      } catch (err) {
        console.error("Error fetching pledges:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPledges();
  }, [API_BASE]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Pledge Wall 🌿</h1>
      <p style={styles.subtitle}>
        {loading ? "Loading..." : `${count} people have pledged so far!`}
      </p>

      <div style={styles.grid}>
        {pledges.map((p, idx) => (
          <div key={idx} style={styles.card}>
            {p.photo_url ? (
              <img
                src={p.photo_url}
                alt={p.name}
                style={styles.photo}
              />
            ) : (
              <div style={styles.avatar}>
                {p.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={styles.name}>{p.name}</span>
          </div>
        ))}
        {!loading && pledges.length === 0 && (
          <p style={{ color: "#555", marginTop: "1rem" }}>
            No pledges yet. Be the first! ✨
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
    maxWidth: "700px",
    margin: "auto",
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "0.25rem",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#555",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "1rem",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    padding: "0.75rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    background: "#0d9488",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "1.25rem",
    marginBottom: "0.5rem",
  },
  photo: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "0.5rem",
  },
  name: {
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#333",
    wordBreak: "break-word",
  },
};

export default PledgeWall;
