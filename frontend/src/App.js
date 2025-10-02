import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing";
import Admin from "./pages/Admin";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:5000";
export const ApiContext = React.createContext(API_BASE);

function App() {
  return (
    <ApiContext.Provider value={API_BASE}>
      <Router>
        <header style={styles.header}>
          <nav style={styles.nav}>
            <Link to="/" style={styles.link}>Home</Link>
            <Link to="/admin" style={styles.link}>Admin</Link>
          </nav>
        </header>

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </Router>
    </ApiContext.Provider>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    background: "#d6b228",   // ✅ Yellow bar
    color: "#040707",        // ✅ Black text
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    color: "#040707",        // ✅ Black if fallback text is shown
    fontWeight: "bold",
    fontSize: "1.25rem",
  },
  nav: {
    display: "flex",
    gap: "1rem",
  },
  link: {
    color: "#040707",        // ✅ Black text
    textDecoration: "none",
    fontWeight: "600",
    padding: "0.25rem 0.5rem",
    borderRadius: "6px",
    transition: "all 0.2s ease",
  },
  main: {
    padding: "1rem",
    maxWidth: "640px",
    margin: "auto",
    fontFamily: "system-ui, sans-serif",
  },
};

export default App;
