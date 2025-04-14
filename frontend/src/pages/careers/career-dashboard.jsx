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
  const [partners, setPartners] = useState([]);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [kensapStudents, setKenSAPStudents] = useState([]);
  const [alumniAndUndergrads, setAlumniAndUndergrads] = useState([]);
  const [showPartnerActionsModal, setShowPartnerActionsModal] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [kensapSearch, setKenSAPSearch] = useState("");
  const [alumniSearch, setAlumniSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newInteraction, setNewInteraction] = useState({ interaction_type: "", notes: "" });
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
  const [newPartner, setNewPartner] = useState({
    partner_name: "",
    category: "",
    lead_type: "",
    status: "Not Contacted",
    contact_person: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    website: "",
    linkedin: "",
    notes: "",
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
    if (activeTab === "partners") {
      fetchPartners();
    }
  }, [activeTab]);

  const fetchKenSAPStudents = async () => {
    try {
      const response = await api.get("/api/useres/?role=KenSAP");
      setKenSAPStudents(response.data); // ✅ Set KenSAP Students
    } catch (error) {
      console.error("Error fetching KenSAP students:", error);
    }
  };

  // Fetch Alumni & Undergraduates
  const fetchAlumniAndUndergrads = async () => {
    try {
      const response = await api.get("/api/useres/?role=Alumni,Undergrad");
      setAlumniAndUndergrads(response.data); // ✅ Set Alumni & Undergrads
    } catch (error) {
      console.error("Error fetching Alumni and Undergrads:", error);
    }
  };
  useEffect(() => {
    if (activeTab === "kensap") {
      fetchKenSAPStudents();
    } else if (activeTab === "alumni") {
      fetchAlumniAndUndergrads();
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
    if (!window.confirm("Are you sure you want to delete this internship?")) return;

    setShowInternshipModal(false)
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
  const fetchPartners = async () => {
    try {
      const res = await api.get("/api/partners/");
      setPartners(res.data);
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  };
  const CATEGORY_MAP = {
    "Pre-University Internships": "pre_university",
    "Summer Internships": "summer_internships",
    "Full-Time Job Placements": "full_time",
    "Fundraising Dinner": "fundraising",
    "Exploratory": "exploratory",
  };

  const LEAD_TYPE_MAP = {
    "Cold": "cold",
    "Warm": "warm",
    "Hot": "hot",
  };

  const STATUS_MAP = {
    "Not Contacted": "not_contacted",
    "Contacted": "contacted",
    "Closed": "closed",
    "Follow Up": "follow_up",
    "Alan to Follow Up": "alan_to_follow",
  };
  const currentSearch = activeTab === "kensap"
    ? kensapSearch
    : activeTab === "alumni"
      ? alumniSearch
      : "";

  const setCurrentSearch = activeTab === "kensap"
    ? setKenSAPSearch
    : activeTab === "alumni"
      ? setAlumniSearch
      : () => { };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    try {
      const formattedCategory = CATEGORY_MAP[newPartner.category] || newPartner.category;
      const formattedLeadType = LEAD_TYPE_MAP[newPartner.lead_type] || newPartner.lead_type;
      const formattedStatus = STATUS_MAP[newPartner.status] || newPartner.status;

      const payload = {
        ...newPartner,
        category: formattedCategory,
        lead_type: formattedLeadType,
        status: formattedStatus
      };

      await api.post("/api/partners/", payload);
      fetchPartners();
      setShowPartnerModal(false);
      setNewPartner({
        partner_name: "",
        category: "",
        lead_type: "",
        status: "Not Contacted",
        contact_person: "",
        email: "",
        phone: "",
        city: "",
        country: "",
        website: "",
        linkedin: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating partner:", error.response?.data || error.message);
      alert(JSON.stringify(error.response?.data, null, 2)); // ✅ Show exact error for debugging
    }
  };
  const openPartnerActionsModal = async (partner) => {
    try {
      setSelectedPartner(partner);

      // Fetch interactions for the selected partner
      const res = await api.get(`/api/partners/${partner.partner_id}/interactions/`);
      setInteractions(res.data);

      setShowPartnerActionsModal(true);
    } catch (error) {
      console.error("Error fetching interactions:", error);
    }
  };
  const handleUpdatePartner = async () => {
    try {
      await api.patch(`/api/partners/${selectedPartner.partner_id}/`, {
        category: selectedPartner.category,
        lead_type: selectedPartner.lead_type,
        status: selectedPartner.status
      });

      fetchPartners(); // Refresh the partner list
      setShowPartnerActionsModal(false);
    } catch (error) {
      console.error("Error updating partner:", error);
    }
  };
  const handleDeletePartner = async () => {
    if (!window.confirm("Are you sure you want to delete this partner?")) return;

    try {
      await api.delete(`/api/partners/${selectedPartner.partner_id}/delete/`);
      fetchPartners(); // Refresh list
      setShowPartnerActionsModal(false);
    } catch (error) {
      console.error("Error deleting partner:", error);
    }
  };
  const handleAddInteraction = async () => {
    if (!selectedPartner) {
      console.error("No partner selected.");
      return;
    }

    try {
      await api.post(`/api/partners/${selectedPartner.partner_id}/interactions/`, {
        partner: selectedPartner.partner_id,
        interaction_type: newInteraction.interaction_type,
        notes: newInteraction.notes,
        interaction_date: newInteraction.interaction_date, // ✅ Allow manual date entry
      });

      openPartnerActionsModal(selectedPartner); // Refresh interactions
      setNewInteraction({ interaction_type: "", notes: "", interaction_date: "" }); // ✅ Reset form
    } catch (error) {
      console.error("Error adding interaction:", error.response?.data || error.message);
      alert(JSON.stringify(error.response?.data, null, 2)); // Show exact error
    }
  };



  // const fetchPartnerInteractions = async (partnerId) => {
  //   try {
  //     const res = await api.get(`/api/partners/${partnerId}/interactions/`);  // ✅ Correct URL
  //     setInteractions(res.data);
  //   } catch (error) {
  //     console.error("Error fetching interactions:", error);
  //   }
  // };


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

  const UserTable = ({ data, searchQuery }) => {
    const [studentPage, setStudentPage] = useState(1);
    const [studentsPerPage, setStudentsPerPage] = useState(5);

    const filtered = data.filter((s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / studentsPerPage);
    const currentPageData = filtered.slice(
      (studentPage - 1) * studentsPerPage,
      studentPage * studentsPerPage
    );

    const start = (studentPage - 1) * studentsPerPage + 1;
    const end = Math.min(start + studentsPerPage - 1, filtered.length);

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>Showing {start}–{end} of {filtered.length} students</p>
          <select
            value={studentsPerPage}
            onChange={(e) => {
              setStudentsPerPage(Number(e.target.value));
              setStudentPage(1);
            }}
            style={{ padding: "0.5rem" }}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>University</th>
              <th>Major</th>
              <th>Company</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageData.map((user) => (
              <tr key={user.id}>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.role}</td>
                <td>{user.university || "N/A"}</td>
                <td>{user.major || "N/A"}</td>
                <td>{user.company || "N/A"}</td>
                <td>
                  <button onClick={() => {
                    setSelectedStudent(user);
                    setShowStudentModal(true);
                  }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setStudentPage(idx + 1)}
              style={{
                margin: "0 5px",
                padding: "5px 10px",
                backgroundColor: studentPage === idx + 1 ? "#007bff" : "#f0f0f0",
                color: studentPage === idx + 1 ? "#fff" : "#000",
                border: "none",
                borderRadius: "4px"
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    );
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
          <li className={activeTab === "kensap" ? "active" : ""} onClick={() => setActiveTab("kensap")}>KenSAP Students</li>
          <li className={activeTab === "alumni" ? "active" : ""} onClick={() => setActiveTab("alumni")}>Alumni</li>
          {/* <li className={activeTab === "careerOpportunities" ? "active" : ""} onClick={() => setActiveTab("careerOpportunities")}>Career Opportunities</li> */}
          <li className={activeTab === "internships" ? "active" : ""} onClick={() => setActiveTab("internships")}>Internships</li>
          <li className={activeTab === "partners" ? "active" : ""} onClick={() => setActiveTab("partners")}>Partners</li>
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
            {activeTab === "dashboard"
              ? "Careers Dashboard"
              : activeTab === "internships"
                ? "Manage Internships"
                : activeTab === "careerOpportunities"
                  ? "Career Opportunities"
                  : activeTab === "settings"
                    ? "Settings"
                    : activeTab === "profile"
                      ? "Update Profile"
                      : activeTab === "kensap"
                        ? "KenSAP Students"
                        : activeTab === "alumni"
                          ? "Alumni & Undergrads"
                          : activeTab === "partners"
                            ? "Manage Partners"
                            : ""}
          </h1>
          <input
            type="text"
            placeholder="Search..."
            className="search-bar"
            value={currentSearch}
            onChange={(e) => setCurrentSearch(e.target.value)}
          />




          {activeTab === "internships" ? (
            <button className="new-entry-button" onClick={() => setShowModal(true)}>+ Add Internship</button>
          ) : activeTab === "partners" ? (
            <button className="new-entry-button" onClick={() => setShowPartnerModal(true)}>+ Add Partner</button>
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
                      <br /><br />
                      <button type="submit" className="create-btn">Create</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "kensap" && (
            <>
              {showStudentModal && selectedStudent && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <button className="modal-close-btn" onClick={() => setShowStudentModal(false)}>✖</button>
                    <h3>{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                    <p><strong>Email:</strong> {selectedStudent.email}</p>
                    <p><strong>Phone:</strong> {selectedStudent.phone || "N/A"}</p>
                    <p><strong>Role:</strong> {selectedStudent.role}</p>
                    <p><strong>Highschool:</strong> {selectedStudent.highschool || "N/A"}</p>
                    <p><strong>KenSAP Year:</strong> {selectedStudent.kensap_year || "N/A"}</p>
                    <p><strong>GPA:</strong> {selectedStudent.gpa || "N/A"}</p>
                    <p><strong>University:</strong> {selectedStudent.university || "N/A"}</p>
                    <p><strong>Major:</strong> {selectedStudent.major || "N/A"}</p>
                    <p><strong>Minor:</strong> {selectedStudent.minor || "N/A"}</p>
                    <p><strong>Graduation:</strong> {selectedStudent.graduation_month || "--"}/{selectedStudent.graduation_year || "--"}</p>
                    <p><strong>Company:</strong> {selectedStudent.company || "N/A"}</p>
                    <p><strong>City:</strong> {selectedStudent.city || "N/A"}</p>
                  </div>
                </div>
              )}

              <UserTable data={kensapStudents} searchQuery={kensapSearch} />
            </>
          )}
          {activeTab === "alumni" && (
            <>
              {showStudentModal && selectedStudent && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <button className="modal-close-btn" onClick={() => setShowStudentModal(false)}>✖</button>
                    <h3>{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                    <p><strong>Email:</strong> {selectedStudent.email}</p>
                    <p><strong>Phone:</strong> {selectedStudent.phone || "N/A"}</p>
                    <p><strong>Role:</strong> {selectedStudent.role}</p>
                    <p><strong>Highschool:</strong> {selectedStudent.highschool || "N/A"}</p>
                    <p><strong>KenSAP Year:</strong> {selectedStudent.kensap_year || "N/A"}</p>
                    <p><strong>GPA:</strong> {selectedStudent.gpa || "N/A"}</p>
                    <p><strong>University:</strong> {selectedStudent.university || "N/A"}</p>
                    <p><strong>Major:</strong> {selectedStudent.major || "N/A"}</p>
                    <p><strong>Minor:</strong> {selectedStudent.minor || "N/A"}</p>
                    <p><strong>Graduation:</strong> {selectedStudent.graduation_month || "--"}/{selectedStudent.graduation_year || "--"}</p>
                    <p><strong>Company:</strong> {selectedStudent.company || "N/A"}</p>
                    <p><strong>City:</strong> {selectedStudent.city || "N/A"}</p>
                  </div>
                </div>
              )}

              <UserTable data={alumniAndUndergrads} searchQuery={alumniSearch} />

            </>
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

          {activeTab === "partners" && (
            <div className="partners-content">
              <h2>Partners</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Lead Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.partner_id}>
                      <td>{partner.partner_name}</td>
                      <td>{partner.category}</td>
                      <td>{partner.lead_type}</td>
                      <td>{partner.status}</td>
                      <td>
                        <button onClick={() => openPartnerActionsModal(partner)}>...</button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Partner Modal */}
              {showPartnerModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <button className="modal-close-btn" onClick={() => setShowPartnerModal(false)}>✖</button>
                    <h3>Add New Partner</h3>
                    <form onSubmit={handleCreatePartner}>
                      <label>Partner Name</label>
                      <input type="text" value={newPartner.partner_name} onChange={(e) => setNewPartner({ ...newPartner, partner_name: e.target.value })} required />

                      <label>Category</label>
                      <select value={newPartner.category} onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })} required>
                        <option value="">Select Category</option>
                        <option value="Pre-University Internships">Pre-University Internships</option>
                        <option value="Summer Internships">Summer Internships</option>
                        <option value="Full-Time Job Placements">Full-Time Job Placements</option>
                        <option value="Fundraising Dinner">Fundraising Dinner</option>
                        <option value="Exploratory">Exploratory</option>
                      </select>

                      <label>Lead Type</label>
                      <select value={newPartner.lead_type} onChange={(e) => setNewPartner({ ...newPartner, lead_type: e.target.value })} required>
                        <option value="">Select Lead Type</option>
                        <option value="Cold">Cold</option>
                        <option value="Warm">Warm</option>
                        <option value="Hot">Hot</option>
                      </select>

                      <label>Status</label>
                      <select value={newPartner.status} onChange={(e) => setNewPartner({ ...newPartner, status: e.target.value })} required>
                        <option value="Not Contacted">Not Contacted</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Closed">Closed</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="Alan to Follow Up">Alan to Follow Up</option>
                      </select>

                      <label>Contact Person</label>
                      <input type="text" value={newPartner.contact_person} onChange={(e) => setNewPartner({ ...newPartner, contact_person: e.target.value })} />

                      <label>Email</label>
                      <input type="email" value={newPartner.email} onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })} />

                      <label>Phone</label>
                      <input type="text" value={newPartner.phone} onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })} />

                      <label>City</label>
                      <input type="text" value={newPartner.city} onChange={(e) => setNewPartner({ ...newPartner, city: e.target.value })} />

                      <label>Country</label>
                      <input type="text" value={newPartner.country} onChange={(e) => setNewPartner({ ...newPartner, country: e.target.value })} />

                      <label>Website</label>
                      <input type="url" value={newPartner.website} onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })} />

                      <label>LinkedIn</label>
                      <input type="url" value={newPartner.linkedin} onChange={(e) => setNewPartner({ ...newPartner, linkedin: e.target.value })} />

                      <label>Notes</label>
                      <textarea value={newPartner.notes} onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })} />

                      <button type="submit" className="confirm-btn">Save Partner</button>
                    </form>
                  </div>
                </div>
              )}
              {showPartnerActionsModal && selectedPartner && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <button className="modal-close-btn" onClick={() => setShowPartnerActionsModal(false)}>✖</button>
                    <h3>Edit Partner</h3>

                    {/* Update Partner Details */}
                    <label>Category</label>
                    <select value={selectedPartner.category} onChange={(e) => setSelectedPartner({ ...selectedPartner, category: e.target.value })}>
                      {Object.entries(CATEGORY_MAP).map(([label, value]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    <label>Lead Type</label>
                    <select value={selectedPartner.lead_type} onChange={(e) => setSelectedPartner({ ...selectedPartner, lead_type: e.target.value })}>
                      {Object.entries(LEAD_TYPE_MAP).map(([label, value]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    <label>Status</label>
                    <select value={selectedPartner.status} onChange={(e) => setSelectedPartner({ ...selectedPartner, status: e.target.value })}>
                      {Object.entries(STATUS_MAP).map(([label, value]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>

                    <button className="confirm-btn" onClick={handleUpdatePartner}>Save Changes</button>

                    {/* Delete Partner */}
                    <button className="delete-btn" onClick={handleDeletePartner}>🗑 Delete Partner</button>

                    {/* View & Add Interactions */}
                    <h3>Interactions</h3>
                    <div className="interactions-container">
                      {interactions.length > 0 ? (
                        <ul className="interactions-list">
                          {interactions.map((interaction) => (
                            <li key={interaction.interaction_id} className="interaction-item">
                              <div className="interaction-header">
                                <strong>{interaction.career_member_name}</strong>
                                <span className="interaction-date">{interaction.interaction_date}</span>
                              </div>
                              <p className="interaction-type">{interaction.interaction_type}</p>
                              <p className="interaction-notes">{interaction.notes}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-interactions">No interactions recorded yet.</p>
                      )}
                    </div>
                    <form onSubmit={handleAddInteraction}>
                      <h3>Add Interaction</h3>
                      <input type="text" placeholder="Interaction Type" value={newInteraction.interaction_type} onChange={(e) => setNewInteraction({ ...newInteraction, interaction_type: e.target.value })} />
                      <textarea placeholder="Notes" value={newInteraction.notes} onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}></textarea>
                      <label>Interaction Date</label>
                      <input
                        type="date"
                        value={newInteraction.interaction_date}
                        max={new Date().toISOString().split("T")[0]} // ✅ Restrict future dates
                        onChange={(e) => setNewInteraction({ ...newInteraction, interaction_date: e.target.value })}
                      />



                      <button className="confirm-btn">Add Interaction</button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CareerDashboard;
