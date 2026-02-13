# 🎓 Kazìni: AI-Powered Career Mentorship Platform

> **Smart Career Guidance for the Modern Student**

**Kazìni** is an intelligent career mentorship platform designed to bridge the gap between academic theory and industry reality. By combining **Machine Learning (Cosine Similarity)** with **Rule-Based Logic**, Kazìni analyzes a student's skills, interests, and academic background to recommend realistic career paths, internships, and skill-gap analysis.

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Tech Stack](https://img.shields.io/badge/Stack-Django%20%7C%20React%20%7C%20AI-blue)

---

## 📌 Description

Traditional career advice is often generic or outdated. **Kazìni** changes this by offering a data-driven approach:

- **Students** take a granular assessment (rating skills like Coding, Leadership, etc. on a 0–10 scale).
- **The AI Engine** computes a mathematical similarity score against 90+ career profiles.
- **The Guardrail System** applies domain logic (e.g., ensuring a Law student isn’t recommended _“Surgeon”_ simply because they have high analytical skills).
- **The Feedback Loop** instantly recalculates recommendations when a user updates their profile or adds a new internship.

### ⭐ Key Features

- **🧠 Hybrid Recommendation Engine:** Content-Based Filtering (Vectors) + Knowledge-Based Rules  
- **🔄 Real-Time Feedback Loop:** Updates recommendations instantly as users edit data  
- **💬 Mentorship Chatbot:** Powered by **Google Gemini AI**  
- **📊 Admin Dashboard:** User, job, and analytics management  
- **💼 Job Matching:** Matches internships to predicted career paths  

---

## 🧩 Technologies Used

| Category        | Tech Stack |
|----------------|------------|
| **Frontend**   | React.js (Vite), Tailwind CSS, Shadcn/ui, Framer Motion |
| **Backend**    | Django, Django REST Framework |
| **AI / ML**    | Scikit-Learn, Pandas, NumPy, Google Gemini API |
| **Database**   | SQLite (Dev), PostgreSQL (Prod) |
| **Auth**       | JWT (SimpleJWT) |
| **Model Store**| Joblib `.pkl` serialization |

---

## 🚀 Installation & Setup

### **1. Clone the Repository**
```bash
git clone https://github.com/tatiana-omolleh/Intelligent-Career-Planning-Platform
cd Kazini 
```

### **2. Backend Setup (Django)** 

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start backend server
python manage.py runserver
```
App runs at: http://localhost:5173

💡 **Note:** On the first run, the system automatically trains the AI model and saves **career_recommender.pkl**.

---

### **3. Frontend Setup (React)**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
## 📱 Usage

### **For Students**

- **Register & Assess:** Complete a quick 2-minute skills assessment  
- **View Results:** See your **Top 5 career matches**, including:  
  - Skill gaps  
  - Salary estimates (KES)  
  - Required competencies  
- **Chat With AI:** Ask mentorship and career-development questions  
- **Find Jobs:** Explore internships aligned with predicted career paths  

---

### **For Admins**

- View system analytics  
- Manage users & roles  
- Post, edit, and categorize job listings  
- Monitor job → career path mapping logic  

---

## 🧠 The AI Logic (How It Works)

Core engine file:  
`backend/api/ml_models/recommender_engine.py`

### **1. Data Vectorization**
User profile is converted into a numerical vector using fields such as:

- GPA  
- Skill ratings  
- Internship count  
- Certifications  
- Projects  

### **2. Cosine Similarity**
Calculates how close the student's profile vector is to each **Career Ideal Vector**.

### **3. Field Logic Gate (Guardrail System)**

Ensures logical career matches:

If Student_Field != Career_Field → Apply 50% penalty

This prevents mismatches (e.g., **Education major → Toxicologist**).

### **4. Count Normalization**

The model assumes:

1 Internship = "Good" (normalized mean)


This prevents unfair penalties for users with limited experience.

---

## 📊 Project Structure
```bash
Kazini/
│
├── backend/ # Django Backend
│ ├── api/
│ │ ├── ml_models/ # AI Engine (Recommender System)
│ │ ├── views.py # API Views / Controllers
│ │ ├── models.py # Database Models
│ │ └── urls.py # API Routes
│ ├── kazini_backend/ # Django project settings & configs
│ └── manage.py
│
└── frontend/ # React Frontend
├── src/
│ ├── components/ # Reusable UI Components
│ ├── pages/ # Main Screens / Views
│ ├── api/ # Axios API configuration
│ ├── context/ # Auth & App State Management
│ └── App.jsx # App Router Logic
├── public/ # Static public assets
└── package.json
```
---

## 🧪 Model Performance

*(Evaluated on 500 synthetic test cases)*

| Metric          | Score   |
|-----------------|---------|
| **Confusion Matrix**     | 98.8%   |
| **Top-5 Hit Rate**    | 85.6%    |
| **Inference Time** | < 50ms |

---

## ⚠️ Known Limitations

- **Cold Start:** Salary estimates use generic ranges (KES 80k–150k) until more job data is collected.  
- **Chatbot Limits:** Google Gemini Free Tier allows **15 requests/minute**.  

---

## 🙏 Acknowledgements

- Google Gemini API  
- Lucide React Icons  
- Shadcn/ui Components  

---

## 📬 Contact

📧 **tatianaomolleh12@gmail.com**

For issues or contributions, please open a GitHub Issue.
