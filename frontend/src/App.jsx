import { useState, useEffect } from "react";
import { Hero } from "./components/Hero";
import { LoginRegister } from "./components/LoginRegister";
import { Header } from "./components/Header";
import AdminDashboard from "./components/AdminDashboard";
import AssessmentForm from "./components/AssessmentForm";
import { MentorshipChatbot } from "./components/MentorshipChatbot";
import ProfilePage from "./components/ProfilePage"; // ✅ import the new ProfilePage
import api from "./api/api";
import Results from "./components/Results";
import { InternshipsPage } from "./components/InternshipsPage";
import JobManagement from "./components/JobManagement";

function App() {
  const [page, setPage] = useState("hero");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [assessment, setAssessment] = useState(null);

  // ✅ Load user and check assessment when app loads
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setIsLoggedIn(true);
      setUser(storedUser);
      setRole(storedUser.role || "Graduand");

      if (storedUser.role === "Admin") {
        setPage("admin");
      } else {
        checkAssessment(storedUser);
      }
    }
  }, []);

  // ✅ Check if the user has an assessment
  const checkAssessment = async () => {
    try {
      const res = await api.get("assessment/");
      if (res.data) {
        setAssessment(res.data);
        setPage("profile"); // redirect to profile if assessment exists
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setPage("assessment"); // go to assessment form if missing
      } else {
        console.error("Error checking assessment:", err);
      }
    }
  };

  // ✅ Handle successful login
  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    setRole(userData.role);
    localStorage.setItem("user", JSON.stringify(userData));

    if (userData.role === "Admin") {
      setPage("admin");
    } else {
      checkAssessment(userData);
    }
  };

  // ✅ Logout user
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUser(null);
    setRole("");
    setAssessment(null);
    setPage("hero");
  };

  return (
    <>
      {/* Show Header on all pages except Admin Dashboard */}
      {page !== "admin" && (
        <Header
          currentPage={page}
          isLoggedIn={isLoggedIn}
          userName={user?.first_name || user?.email || "User"}
          role={role}
          onNavigate={setPage}
          onLogout={handleLogout}
        />
      )}

      {/* Landing Page */}
      {page === "hero" && (
        <Hero
          onGetStarted={() => setPage("register")}
          onLogin={() => setPage("login")}
        />
      )}

      {/* Login */}
      {page === "login" && (
        <LoginRegister
          mode="login"
          onSuccess={handleLoginSuccess}
          onToggleMode={() => setPage("register")}
          onBack={() => setPage("hero")}
        />
      )}

      {/* Register */}
      {page === "register" && (
        <LoginRegister
          mode="register"
          onSuccess={handleLoginSuccess}
          onToggleMode={() => setPage("login")}
          onBack={() => setPage("hero")}
        />
      )}

      {/* Assessment Form */}
      {page === "assessment" && (
        <AssessmentForm
          onComplete={(data) => {
            setAssessment(data);
            setPage("profile"); // redirect once done
          }}
          onBack={() => setPage("hero")}
        />
      )}

      {/* ✅ Profile Page (new version) */}
      {page === "profile" && <ProfilePage />}

      {/* Results Page */}
      {page === "results" && <Results />}

      {/* Mentorship Chatbot */}
      {page === "chatbot" && <MentorshipChatbot />}

      {/* Internships Page */}
      {page === "internships" && <InternshipsPage />}

      {/* Admin Dashboard */}
      {page === "admin" && role === "Admin" && (
        <AdminDashboard
          onLogout={handleLogout}
          onManageJobs={() => setPage("jobs")}
        />
      )}

      {/* Job Management */}
      {page === "jobs" && role === "Admin" && (
        <JobManagement onBack={() => setPage("admin")} />
      )}
    </>
  );
}

export default App;
