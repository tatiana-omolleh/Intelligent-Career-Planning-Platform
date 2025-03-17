import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css"; 
import api from "../../api"; 

const CareerDashboard = () => {
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); 
  const [profileData, setProfileData] = useState({}); 
  const [editProfile, setEditProfile] = useState(false); 
  const [internships, setInternships] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showInternshipModal, setShowInternshipModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false); 
  const filteredStudents = students.filter((student) =>
  `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
);
  const [newInternship, setNewInternship] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    deadline: "",
    assigned_student: "",
  });

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
  }, [navigate]);
  useEffect(() => {
    if (activeTab === "internships") {
      fetchInternships();
      fetchStudents();
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
  const fetchStudents = async () => {
    try {
      const res = await api.get("/api/users/non-career/"); // ✅ Fetch all non-career members
      setStudents(res.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newInternship };
      if (payload.assigned_student === "") delete payload.assigned_student; // ✅ Ensure optional assignment

      await api.post("/api/internships/create/", payload);
      fetchInternships();
      setShowModal(false);
      setNewInternship({ title: "", description: "", company: "", location: "", deadline: "", assigned_student: "" });
    } catch (error) {
      console.error("Error creating internship:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/internships/${id}/delete/`);
      fetchInternships();
    } catch (error) {
      console.error("Error deleting internship:", error);
    }
  };
  const handleStatusChange = (appId, newStatus) => {
    setSelectedInternship((prev) => ({
      ...prev,
      applications: prev.applications.map((app) =>
        app.id === appId ? { ...app, status: newStatus } : app
      ),
    }));
  };
  
  const handleStatusUpdate = async (appId) => {
    try {
      const updatedApp = selectedInternship.applications.find((app) => app.id === appId);
  
      if (!updatedApp) {
        alert("Application not found!");
        return;
      }
  
      await api.patch(`/api/internships/application/${appId}/`, { status: updatedApp.status });
  
      alert("Status updated successfully!");
      fetchInternships();
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update status.");
    }
  };
  const openInternshipModal = async (internship) => {
    try {
      const res = await api.get(`/api/internships/${internship.internship_id}/applications/`);
      setSelectedInternship({ ...internship, applications: res.data });
      setShowInternshipModal(true);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };
  
  const openApplicationDetails = async (applicationId) => {
    try {
      const res = await api.get(`/api/internships/applications/${applicationId}/`);
      setSelectedApplication(res.data);
      setShowInternshipModal(false); // Hide internship modal
    } catch (error) {
      console.error("Error fetching application details:", error);
    }
  };
  
  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setShowInternshipModal(true); // Reopen internship modal when closing application modal
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

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put("/api/profile/update/", profileData);
      setEditProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>KenSAP</h2>
        <ul>
          <li className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</li>
          <li className={activeTab === "careerOpportunities" ? "active" : ""} onClick={() => setActiveTab("careerOpportunities")}>Career Opportunities</li>
          <li className={activeTab === "internships" ? "active" : ""} onClick={() => setActiveTab("internships")}>Internships</li>
          <li className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>Settings</li>
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
    {activeTab === "dashboard" && "Careers Dashboard"}
    {activeTab === "internships" && "Manage Internships"}
    {activeTab === "careerOpportunities" && "Career Opportunities"}
    {activeTab === "settings" && "Settings"}
    {activeTab === "profile" && "Update Profile"}
  </h1>

  <input type="text" placeholder="Search..." className="search-bar" />

  {activeTab === "internships" ? (
    <button className="new-entry-button" onClick={() => setShowModal(true)}>+ Add Internship</button>
  ) : (
    <button className="new-entry-button">New Entry</button>
  )}

  <button className="logout-button" onClick={() => setShowLogoutModal(true)}>Logout</button>
</header>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close-btn" onClick={() => setShowLogoutModal(false)}>✖</button>
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to logout?</p>
              <div className="modal-buttons">
                <button className="confirm-btn" onClick={handleLogout}>Yes, Logout</button>
                <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content Based on Active Tab */}
        <section className="content-section">
          {activeTab === "dashboard" && <div className="dashboard-content">Dashboard Content</div>}
          {activeTab === "careerOpportunities" && <div className="career-opportunities-content">Career Opportunities</div>}
          {/* {activeTab === "internships" && <div className="internships-content">Internships</div>} */}
          {activeTab === "settings" && <div className="settings-content">Settings</div>}
          {activeTab === "internships" && (
  <div className="internships-content">
{/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}> */}
  {/* <h2>Manage Internships</h2> */}
  {/* <button className="new-entry-button" onClick={() => setShowModal(true)}>+ Add Internship</button> */}
{/* </div> */}

<table style={{ marginTop: "10px" }}>
    <thead>
      <tr>
        <th>Title</th>
        <th>Company</th>
        <th>Location</th>
        <th>Deadline</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {internships.map((internship) => (
        <tr key={internship.internship_id}>
          <td>{internship.title}</td>
          <td>{internship.company}</td>
          <td>{internship.location}</td>
          <td>{internship.deadline}</td>
          <td>
          <button onClick={() => openInternshipModal(internship)}>...</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {showInternshipModal && selectedInternship && !selectedApplication && (
  <div className="modal-overlay">
    <div className="modal-content">
      <button className="modal-close-btn" onClick={() => setShowInternshipModal(false)}>✖</button>
      <h3>{selectedInternship.title}</h3>
      <p><strong>Company:</strong> {selectedInternship.company}</p>
      <p><strong>Location:</strong> {selectedInternship.location}</p>
      <p><strong>Deadline:</strong> {selectedInternship.deadline}</p>
      <p><strong>Description:</strong> {selectedInternship.description}</p>

      {/* Applications Table */}
      <h4>Applications</h4>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {selectedInternship.applications.map((app) => (
            <tr key={app.id}>
              <td>{app.student_name}</td>
              <td>
                <select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value)}>
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Interview">Interview</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
              <td>
                <button className="confirm-btn" onClick={() => handleStatusUpdate(app.id)}>✔ Save</button>
              </td>
              <td>
                <button onClick={() => openApplicationDetails(app.id)}>📄 View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Delete Internship */}
      <button className="delete-btn" onClick={() => handleDelete(selectedInternship.internship_id)}>🗑 Delete Internship</button>
    </div>
  </div>
)}
{selectedApplication && (
  <div className="modal-overlay">
    <div className="modal-content">
      <button className="modal-close-btn" onClick={closeApplicationModal}>✖</button>
      <h3>Application Details</h3>
      <p><strong>Student:</strong> {selectedApplication.student_name}</p>
      <p><strong>Internship:</strong> {selectedApplication.internship_title}</p>
      <p><strong>Cover Letter:</strong></p>
      <textarea readOnly value={selectedApplication.cover_letter} style={{ width: "100%", height: "150px" }}></textarea>
      <p><strong>Resume:</strong></p>
{selectedApplication.resume_link ? (
  <p>
    <a href={selectedApplication.resume_link} target="_blank" rel="noopener noreferrer">
      View Resume (Link)
    </a>
  </p>
) : selectedApplication.resume_file ? (
  <p>
    <a href={selectedApplication.resume_file} target="_blank" rel="noopener noreferrer">
      View Resume (PDF)
    </a>
  </p>
) : (
  <p>No resume provided.</p>
)}
    </div>
  </div>
)}

  {showModal && (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={() => setShowModal(false)}>✖</button>
        <h3>Create Internship</h3>
        <form onSubmit={handleCreate}>
          <input type="text" placeholder="Title" value={newInternship.title} onChange={(e) => setNewInternship({ ...newInternship, title: e.target.value })} required />
          <input type="text" placeholder="Company" value={newInternship.company} onChange={(e) => setNewInternship({ ...newInternship, company: e.target.value })} required />
          <input type="text" placeholder="Location" value={newInternship.location} onChange={(e) => setNewInternship({ ...newInternship, location: e.target.value })} required />
          <textarea placeholder="Description" value={newInternship.description} onChange={(e) => setNewInternship({ ...newInternship, description: e.target.value })} required />
          <input type="date" value={newInternship.deadline} onChange={(e) => setNewInternship({ ...newInternship, deadline: e.target.value })} required />

          <label>Assign to Student (Optional)</label>
          <div className="search-dropdown">
    <input
      type="text"
      placeholder="Search for a student..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onFocus={() => setShowDropdown(true)}
      onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay closing so user can click
    />

    {showDropdown && (
      <div className="dropdown-menu">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="dropdown-item"
              onMouseDown={(e) => {
                e.preventDefault(); // ✅ Prevents onBlur from closing before selection
                setNewInternship({ ...newInternship, assigned_student: student.id });
                setSearchQuery(`${student.first_name} ${student.last_name}`);
                setShowDropdown(false);
              }}
            >
              {student.first_name} {student.last_name}
            </div>
          ))
        ) : (
          <div className="dropdown-item">No results found</div>
        )}
      </div>
    )}
  </div>
<br/><br/>
          <button type="submit" className="create-btn">Create</button>
        </form>
      </div>
    </div>
  )}
            </div>
          )}
          {/* Profile Update Section */}
          {activeTab === "profile" && (
            <div className="profile-content">
              <h2>Update Profile</h2>
              <form className="profile-form" onSubmit={handleProfileUpdate}>
                <label>First Name</label>
                <input type="text" name="first_name" value={profileData.first_name || ""} onChange={handleProfileChange} required />

                <label>Last Name</label>
                <input type="text" name="last_name" value={profileData.last_name || ""} onChange={handleProfileChange} required />

                <label>Email</label>
                <input type="email" name="email" value={profileData.email || ""} disabled />

                <label>Phone</label>
                <input type="text" name="phone" value={profileData.phone || ""} onChange={handleProfileChange} />

                <button type="submit" className="save-profile-btn">Save Changes</button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CareerDashboard;
