import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";
import api from "../../api"; // Ensure this is the correct API wrapper

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // Track active section
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profileData, setProfileData] = useState({}); 
  const [editProfile, setEditProfile] = useState(false); 
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumeLink, setResumeLink] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get("/api/user/"); 
        setUser(res.data);
        setProfileData(res.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/"); 
      }
    };

    fetchUserData();
  }, [navigate], [editProfile]);

  useEffect(() => {
    if (activeTab === "internships") {
      fetchInternships();
      fetchApplications();
    }
    if (activeTab === "internships" || activeTab === "dashboard") {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchInternships = async () => {
    try {
      const res = await api.get("/api/internships/");
      setInternships(res.data);
    } catch (error) {
      console.error("Error fetching internships:", error);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get("/api/internships/myapplications/");
      setApplications(res.data);
      console.log("Fetched Applications:", res.data); // ✅ Debugging log
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const openApplyModal = (internship) => {
    setSelectedInternship(internship);
    setShowApplyModal(true);
    setResumeLink("");
    setCoverLetter("");
  };
  const handleApply = async (e) => {
    e.preventDefault();
  
    if (!resumeLink && !resumeFile) {
      alert("Please provide either a resume link or upload a resume file.");
      return;
    }
  
    const formData = new FormData();
    formData.append("internship", selectedInternship.internship_id);
    formData.append("cover_letter", coverLetter);
    
    if (resumeFile) {
      formData.append("resume_file", resumeFile);
    } else {
      formData.append("resume_link", resumeLink);
    }
  
    try {
      await api.post("/api/internships/apply/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      setShowApplyModal(false);
      fetchInternships();
      fetchApplications();
      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error applying for internship:", error);
      alert("Failed to apply. You might have already applied.");
    }
  };
  

  const handleWithdraw = async (applicationId) => {
    try {
      await api.delete(`/api/internships/applications/${applicationId}/withdraw/`);
      fetchApplications();
      alert("Application withdrawn successfully.");
    } catch (error) {
      console.error("Error withdrawing application:", error);
      alert("Cannot withdraw an accepted application.");
    }
  };
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
  
    let updatedProfile = { ...profileData };
  
    if (profileData.role === "KenSAP" && profileData.university) {
      updatedProfile.graduation_month = updatedProfile.graduation_month || 1;
      updatedProfile.graduation_year = updatedProfile.graduation_year || new Date().getFullYear() + 4;
    }
  
    try {
      await api.put("/api/profile/update/", updatedProfile);
      
      // ✅ Update local state so the page updates immediately
      setUser(updatedProfile); 
      setProfileData(updatedProfile);
      
      // ✅ Show success message
      alert("Profile updated successfully!");
      
      setEditProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };
  
  
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    return names.map((n) => n[0].toUpperCase()).join("").slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>KenSAP</h2>
        <ul>
          <li 
            className={activeTab === "dashboard" ? "active" : ""} 
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </li>
          <li 
            className={activeTab === "mentorship" ? "active" : ""} 
            onClick={() => setActiveTab("mentorship")}
          >
            Mentorship
          </li>
          <li 
            className={activeTab === "e-learning" ? "active" : ""} 
            onClick={() => setActiveTab("e-learning")}
          >
            E-Learning
          </li>
          <li 
            className={activeTab === "internships" ? "active" : ""} 
            onClick={() => setActiveTab("internships")}
          >
            Internships
          </li>
          <li 
            className={activeTab === "settings" ? "active" : ""} 
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </li>
        </ul>

        {/* User Profile - Clickable */}
        {user && (
          <div className={`user-profile ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
            <div className="profile-pic">{getInitials(user.first_name + " " + user.last_name)}</div>
            <div className="user-info">
              <p className="user-name">{user.first_name} {user.last_name}</p>
              <p className="user-role">{user.role}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1>
        {activeTab === "profile" && "Update Profile"}
        </h1>
          {/* <h1>{activeTab.replace(/([A-Z])/g, " $1").trim()}</h1> */}
          <input type="text" placeholder="Search..." className="search-bar-student" />
          {/* <button className="new-entry-button">New Entry</button> */}
          <button className="logout-button" onClick={() => setShowLogoutModal(true)}>Logout</button>
        </header>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout?</p>
              <div className="modal-buttons">
                <button className="confirm-btn" onClick={handleLogout}>Yes, Logout</button>
                <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {showApplyModal && selectedInternship && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close-btn" onClick={() => setShowApplyModal(false)}>✖</button>
              <h3>Apply for {selectedInternship.title}</h3>
              <form onSubmit={handleApply}>
  <label>Resume</label>
  <input
    type="url"
    placeholder="Enter resume link"
    value={resumeLink}
    onChange={(e) => {
      setResumeLink(e.target.value);
      setResumeFile(null); // Reset file if link is entered
    }}
  />

  <label>Or Upload Resume (PDF)</label>
  <input
    type="file"
    accept="application/pdf"
    onChange={(e) => {
      setResumeFile(e.target.files[0]);
      setResumeLink(""); // Reset link if file is uploaded
    }}
  />

  <label>Cover Letter</label>
  <textarea
    placeholder="Write your cover letter..."
    value={coverLetter}
    onChange={(e) => setCoverLetter(e.target.value)}
    required
  />

  <button type="submit" className="confirm-btn">Submit Application</button>
</form>

            </div>
          </div>
        )}
        {/* Dynamic Content Based on Active Tab */}
        <section className="content-section">
          {activeTab === "dashboard" && (
            <div className="dashboard-grid">
  <div className="card">Enrolled Courses: 4</div>
  <div className="card">Active Mentorships: 2</div>
  <div className="card">Internship Applications: {applications?.length || 0}</div>

</div>

          )}

          {activeTab === "internships" && (
            <div className="internships-content">
              <h2>Available Internships</h2>
              <div className="internships-grid">
                {internships.map((internship) => (
                  <div key={internship.internship_id} className="internship-card">
                    <h3>{internship.title}</h3>
                     <p><strong>Company:</strong> {internship.company}</p>
          <p><strong>Location:</strong> {internship.location}</p>
          <p><strong>Deadline:</strong> {internship.deadline}</p>
          <button className="apply-btn" onClick={() => openApplyModal(internship)}>
  Apply
</button>
        </div>
      ))}
    </div>

              <h2>My Applications</h2>
              <table>
                <thead>
                  <tr>
                    <th>Internship</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.internship_title}</td>
                      <td>{app.status}</td>
                      <td>
                        {app.status !== "Accepted" && (
                          <button className="withdraw-btn" onClick={() => handleWithdraw(app.id)}>Withdraw</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "mentorship" && (
            <div className="mentorship-content">
              <h2>Mentorship</h2>
              <p>Find mentors and track mentorship progress.</p>
            </div>
          )}

          {activeTab === "e-learning" && (
            <div className="e-learning-content">
              <h2>E-Learning</h2>
              <p>Access your courses and track progress.</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="settings-content">
              <h2>Settings</h2>
              <p>Manage your profile and preferences.</p>
            </div>
          )}
          {/* Profile Update Section */}
          {activeTab === "profile" && (
  <div className="profile-content">
    <form className="profile-form" onSubmit={handleProfileUpdate}>
      {/* Basic Info */}
      <label>First Name</label>
      <input type="text" name="first_name" value={profileData.first_name || ""} onChange={handleProfileChange} required />

      <label>Last Name</label>
      <input type="text" name="last_name" value={profileData.last_name || ""} onChange={handleProfileChange} required />

      <label>Email</label>
      <input type="email" name="email" value={profileData.email || ""} disabled />

      <label>Phone</label>
      <input type="text" name="phone" value={profileData.phone || ""} onChange={handleProfileChange} />

      {/* Role-Specific Fields */}
      {profileData.role === "KenSAP" && (
        <>
          <label>High School</label>
          <input type="text" name="highschool" value={profileData.highschool || ""} onChange={handleProfileChange} required />

          <label>Kensap Year</label>
          <input type="number" name="kensap_year" value={profileData.kensap_year || ""} onChange={handleProfileChange} required />
        </>
      )}
      {(profileData.role === "KenSAP" || profileData.role === "Undergrad" || profileData.role === "Alumni") && (
  <>
    <label>University</label>
    <input
      type="text"
      name="university"
      value={profileData.university || ""}
      onChange={handleProfileChange}
      required
    />
  </>
)}


      {(profileData.role === "Undergrad" || profileData.role === "Alumni") && (
        <>
          <label>Major</label>
          <input type="text" name="major" value={profileData.major || ""} onChange={handleProfileChange} />

          <label>Minor</label>
          <input type="text" name="minor" value={profileData.minor || ""} onChange={handleProfileChange} />

          <label>GPA</label>
          <input type="number" step="0.01" name="gpa" value={profileData.gpa || ""} onChange={handleProfileChange} />
        </>
      )}

      {profileData.role === "Undergrad" && (
        <>
          <label>Graduation Month</label>
          <select name="graduation_month" value={profileData.graduation_month || ""} onChange={handleProfileChange}>
            <option value="">Select Month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>

          <label>Graduation Year</label>
          <input type="number" name="graduation_year" value={profileData.graduation_year || ""} onChange={handleProfileChange} required />
        </>
      )}

      {profileData.role === "Alumni" && (
        <>
          <label>Company</label>
          <input type="text" name="company" value={profileData.company || ""} onChange={handleProfileChange} required />

          <label>City</label>
          <input type="text" name="city" value={profileData.city || ""} onChange={handleProfileChange} />
        </>
      )}

      <button type="submit" className="save-profile-btn">Save Changes</button>
    </form>
  </div>
)}

        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
