import React, { useState, useContext, useEffect } from "react";
import { ApiContext } from "../App";
import CameraModal from "../components/CameraModal";

function Landing() {
  const API_BASE = useContext(ApiContext);

  const initialForm = {
    name: "",
    email: "",
    phone: "",
    country: "",
    pledge: false,
    interested: [],
    lookingFor: [],
    photo_base64: "",
  };

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  // countries.json
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);

  useEffect(() => {
    fetch("/countries.json")
      .then((res) => res.json())
      .then((data) => {
        setCountries(data);
        setFilteredCountries(data);
      })
      .catch((err) => console.error("Failed to load countries:", err));
  }, []);

  const interestedOptions = ["Investment", "Dealership", "Others"];
  const lookingOptions = [
    "Padel",
    "Sports courts & flooring",
    "Spa and wellness products",
  ];

  // --- handle field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "country") {
      const val = value.toLowerCase();
      setFilteredCountries(
        countries.filter((c) => c.toLowerCase().includes(val))
      );
    }
  };

  // --- toggle pills
  const handleToggle = (field, value) => {
    setForm((prev) => {
      const already = (prev[field] || []).includes(value);
      return {
        ...prev,
        [field]: already
          ? prev[field].filter((s) => s !== value)
          : [...prev[field], value],
      };
    });
  };

  // --- handle pledge pill
  const togglePledge = () => {
    setForm((prev) => ({ ...prev, pledge: !prev.pledge }));
  };

  // --- submit (with consent)
  const handleSubmit = (e) => {
    e.preventDefault();
    setConsentOpen(true);
  };

  const confirmSubmit = async () => {
    setConsentOpen(false);
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "✅ Thank you! Your pledge has been recorded.",
        });
        setForm(initialForm);
      } else {
        setMessage({
          type: "error",
          text: "❌ Something went wrong: " + (data.error || data.message),
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "❌ Network error: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>THE PFS PLEDGE</h1>
      <img
        src="/logo.png"
        alt="Logo"
        style={{ height: "80px", margin: "1rem auto", display: "block" }}
      />

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Pledge Pill */}
        <div
          onClick={togglePledge}
          style={{
            ...styles.pledgePill,
            background: form.pledge ? "#d6b228" : "#fff",
          }}
        >
          I pledge to make every game greener, every facility cleaner, and every
          investment smarter — for the future of sports and our planet
        </div>

        {/* Name */}
        <input
          style={styles.input}
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        {/* Email */}
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        {/* Phone */}
        <input
          style={styles.input}
          type="text"
          name="phone"
          placeholder="Phone / WhatsApp"
          value={form.phone}
          onChange={handleChange}
          required
        />

        {/* Country with search */}
        <input
          style={styles.input}
          type="text"
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={handleChange}
          autoComplete="off"
        />
        {form.country && (
          <div style={styles.dropdown}>
            {filteredCountries.slice(0, 6).map((c) => (
              <div
                key={c}
                style={styles.dropdownItem}
                onClick={() => setForm((prev) => ({ ...prev, country: c }))}
              >
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Interested In */}
        <div style={styles.section}>
          <p style={styles.label}>I am Interested in (you may select more than one) :</p>
          <div style={styles.sports}>
            {interestedOptions.map((opt) => {
              const active = (form.interested || []).includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleToggle("interested", opt)}
                  style={{
                    ...styles.sportPill,
                    background: active ? "#d6b228" : "#fff",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Looking For */}
        <div style={styles.section}>
          <p style={styles.label}>I am looking for (you may select more than one) :</p>
          <div style={styles.sports}>
            {lookingOptions.map((opt) => {
              const active = (form.lookingFor || []).includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleToggle("lookingFor", opt)}
                  style={{
                    ...styles.sportPill,
                    background: active ? "#d6b228" : "#fff",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selfie */}
        <div style={styles.section}>
          <p style={styles.label}>Add a selfie (optional):</p>
          <button
            type="button"
            style={styles.buttonAlt}
            onClick={() => setCameraOpen(true)}
          >
            📷 Use Camera
          </button>
          {form.photo_base64 && (
            <img src={form.photo_base64} alt="preview" style={styles.preview} />
          )}
        </div>

        <CameraModal
          isOpen={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={(dataUrl) =>
            setForm((prev) => ({ ...prev, photo_base64: dataUrl }))
          }
        />

        {/* Contact Cards */}
        <div style={styles.contactsSection}>
          <h3 style={styles.contactsTitle}>Connect with Our Team at FSB 2025</h3>
          <div style={styles.contactCards}>
            {/* Member 1 */}
            <a href="/contacts/member1.vcf" download style={styles.contactCard}>
              <img src="/member1.jpeg" alt="Mr. Shadab Karim" style={styles.contactPhoto} />
              <div style={styles.contactInfo}>
                <p style={styles.contactName}><b>Mr. Shadab Karim</b></p>
                <p style={styles.contactDesignation}>Director</p>
                <p style={styles.contactCompany}>PFS Group of Companies</p>
                <p style={styles.contactPhone}>📞 +971553406451</p>
                <p style={styles.contactEmail}>✉️ export@pfs-eu.pl</p>
              </div>
            </a>
            {/* Member 2 */}
            <a href="/contacts/member2.vcf" download style={styles.contactCard}>
              <img src="/member2.jpeg" alt="Mr. Fahad Mon" style={styles.contactPhoto} />
              <div style={styles.contactInfo}>
                <p style={styles.contactName}><b>Mr. Fahad Mon</b></p>
                <p style={styles.contactDesignation}>Intl. Sales Consultant</p>
                <p style={styles.contactCompany}>PFS Group of Companies</p>
                <p style={styles.contactPhone}>📞 +971582761390</p>
                <p style={styles.contactEmail}>✉️ sales@pfs-eu.pl</p>
              </div>
            </a>
          </div>
        </div>

        {/* Submit */}
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Pledge"}
        </button>
      </form>

      {/* Consent Modal */}
      {showConsent && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2>Consent for Data Use</h2>
            <ul style={{ textAlign: "left", padding: "1rem" }}>
              <li>Data Collection – Your name, email, phone/WhatsApp, country, and optional selfie are collected only for pledge verification and communication purposes.</li>
              <li>Purpose of Use – The data may be used to share updates, offers, and information about sustainable sports, investments, and related products.</li>
              <li>Marketing Communications – We may contact you via email, WhatsApp, or phone with relevant updates and marketing content, in line with your expressed interests.</li>
              <li>Data Sharing & Storage – Your information will not be sold. It may be securely shared only with our group companies and official partners for the stated purposes. Data is stored in compliance with GDPR and international data protection standards.</li>
              <li>Your Rights – You can withdraw consent or request deletion of your data at any time by contacting us.</li>
            </ul>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button style={styles.button} onClick={handleSubmit}>Yes, I Consent</button>
              <button style={{ ...styles.button, background: "#991b1b", color: "white" }} onClick={() => setShowConsent(false)}>No, Cancel</button>
            </div>
          </div>
        </div>
      )}
      {message && (
        <div
          style={{
            ...styles.message,
            background: message.type === "success" ? "#fef9c3" : "#fee2e2",
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem 1rem",
    maxWidth: "600px",
    margin: "2rem auto",
    fontFamily: "system-ui, sans-serif",
    color: "#040707",
    background: "#fffbea", // light yellow background for contrast
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
    textAlign: "center",
    color: "#040707",
  },
  subtitle: {
    fontSize: "1.1rem",
    marginBottom: "2rem",
    textAlign: "center",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.85rem",
    border: "1px solid #ccc",
    borderRadius: "10px",
    fontSize: "1rem",
    color: "#040707",
    background: "#fff",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
  },
  pledgePill: {
    padding: "1rem",
    border: "2px solid #040707",
    borderRadius: "14px",
    fontSize: "1rem",
    fontWeight: "600",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "1rem",
    background: "#fff",
    color: "#040707",
    transition: "all 0.2s ease",
  },
  pledgePillActive: {
    background: "#d6b228",
    color: "#040707",
    borderColor: "#d6b228",
  },
  section: {
    marginTop: "1rem",
  },
  label: {
    marginBottom: "0.5rem",
    fontWeight: "600",
    fontSize: "1rem",
    color: "#040707",
  },
  sports: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  sportPill: {
    padding: "0.6rem 1.2rem",
    borderRadius: "9999px",
    border: "1px solid #040707",
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#040707",
    background: "#fff",
  },
  sportPillActive: {
    background: "#d6b228",
    borderColor: "#d6b228",
    color: "#040707",
    fontWeight: "600",
  },
  checkbox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
    fontSize: "0.95rem",
    fontWeight: "500",
    color: "#040707",
    marginTop: "1rem",
  },
  preview: {
    marginTop: "0.75rem",
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "12px",
    border: "2px solid #d6b228",
  },
  button: {
    marginTop: "1.5rem",
    padding: "0.9rem",
    border: "none",
    borderRadius: "10px",
    background: "#d6b228",
    color: "#040707",
    fontSize: "1.05rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 3px 6px rgba(0,0,0,0.15)",
    transition: "background 0.2s ease, transform 0.1s ease",
  },
  buttonAlt: {
    padding: "0.85rem 1.2rem",
    borderRadius: "10px",
    background: "#fff",
    border: "1px solid #040707",
    color: "#040707",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  buttonHover: {
    background: "#c5a322",
    transform: "translateY(-1px)",
  },
  message: {
    marginTop: "1.2rem",
    padding: "0.85rem",
    borderRadius: "10px",
    fontWeight: "500",
    textAlign: "center",
    background: "#fef9c3", // soft yellow
    color: "#040707",
  },
  // Consent Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "14px",
    maxWidth: "550px",
    width: "100%",
    color: "#040707",
    textAlign: "left",
    boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
    lineHeight: "1.5",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    marginBottom: "1rem",
    color: "#040707",
  },
  modalList: {
    margin: "0 0 1.5rem 1.2rem",
    padding: 0,
    listStyle: "disc",
    color: "#333",
    fontSize: "0.95rem",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
  },
  // Contact Cards
  contactsSection: {
    marginTop: "2rem",
    padding: "1.5rem",
    background: "#fff8dc", // light yellow card background
    borderRadius: "14px",
    boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
  },
  contactsTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "1rem",
    textAlign: "center",
    color: "#040707",
  },
  contactCards: {
    display: "flex",
    gap: "1rem",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  contactCard: {
    flex: "1 1 45%",
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: "12px",
    padding: "1rem",
    textDecoration: "none",
    color: "#040707",
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  contactCardHover: {
    transform: "translateY(-3px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  },
  contactPhoto: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "0.5rem",
    border: "2px solid #d6b228",
  },
  contactName: {
    fontSize: "1rem",
    fontWeight: "600",
    margin: "0.25rem 0",
  },
  contactDesignation: {
    fontSize: "0.9rem",
    fontStyle: "italic",
    margin: "0.25rem 0",
  },
  contactCompany: {
    fontSize: "0.9rem",
    margin: "0.25rem 0",
    color: "#333",
  },
  contactPhone: {
    fontSize: "0.9rem",
    margin: "0.25rem 0",
  },
  contactEmail: {
    fontSize: "0.9rem",
    margin: "0.25rem 0",
  },
};

export default Landing;
