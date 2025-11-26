import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.preprocessing import StandardScaler
# We re-add django settings for production use
try:
    from django.conf import settings
    BASE_DIR = settings.BASE_DIR
except ImportError:
    # Fallback for standalone script execution (notebooks)
    BASE_DIR = os.getcwd()

class CareerRecommender:
    def __init__(self):
        self.scaler = StandardScaler()
        self.career_skill_profiles_scaled = None
        self.career_field_probs = None
        self.career_skill_profiles = None 
        self.numerical_cols = [
            'GPA', 'Extracurricular_Activities', 'Internships', 'Projects',
            'Leadership_Positions', 'Field_Specific_Courses', 'Research_Experience',
            'Coding_Skills', 'Communication_Skills', 'Problem_Solving_Skills',
            'Teamwork_Skills', 'Analytical_Skills', 'Presentation_Skills',
            'Networking_Skills', 'Industry_Certifications'
        ]
        
        self.feature_weights = {
            'Coding_Skills': 3.0,
            'Field_Specific_Courses': 2.5,
            'Industry_Certifications': 2.0,
            'Projects': 1.5,
            'Research_Experience': 1.5,
            'GPA': 1.2,
            'Analytical_Skills': 1.1,
            'Teamwork_Skills': 0.5,
            'Presentation_Skills': 0.5,
            'Extracurricular_Activities': 0.5,
            'Leadership_Positions': 0.8,
            'Communication_Skills': 0.8,
        }

        self.domain_logic = {
            'Computer Science': {
                'careers': ['Software Engineer', 'Data Scientist', 'DevOps Engineer', 'Full Stack Developer', 'AI Researcher', 'Java Developer', 'Backend Developer', 'Frontend Developer'],
                'high_skills': ['Coding_Skills', 'Problem_Solving_Skills', 'Projects'],
                'low_skills': ['Presentation_Skills']
            },
            'Art': {
                'careers': ['Graphic Designer', 'Art Director', 'Illustrator', 'UX Designer', 'Animator', 'Fashion Designer'],
                'high_skills': ['Presentation_Skills', 'Projects'],
                'low_skills': ['Coding_Skills', 'Analytical_Skills', 'Research_Experience']
            },
            'Medicine': {
                'careers': ['Surgeon', 'Nurse', 'Physician Assistant', 'Pharmacist', 'Clinical Researcher', 'Dentist'],
                'high_skills': ['Field_Specific_Courses', 'GPA', 'Internships', 'Research_Experience'],
                'low_skills': ['Coding_Skills', 'Extracurricular_Activities']
            },
            'Business': {
                'careers': ['Financial Advisor', 'Marketing Specialist', 'HR Manager', 'Project Manager', 'Consultant', 'Accountant'],
                'high_skills': ['Leadership_Positions', 'Communication_Skills', 'Networking_Skills', 'Presentation_Skills'],
                'low_skills': ['Coding_Skills', 'Research_Experience']
            },
            'Engineering': {
                'careers': ['Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Robotics Engineer', 'Chemical Engineer'],
                'high_skills': ['Problem_Solving_Skills', 'Field_Specific_Courses', 'Analytical_Skills', 'Industry_Certifications'],
                'low_skills': ['Communication_Skills']
            },
             'Law': {
                'careers': ['Lawyer', 'Legal Analyst', 'Judge', 'Paralegal'],
                'high_skills': ['Communication_Skills', 'Analytical_Skills', 'Research_Experience'],
                'low_skills': ['Coding_Skills', 'Projects']
            },
            'Psychology': {
                'careers': ['Clinical Psychologist', 'Counselor', 'Industrial-Organizational Psychologist', 'School Psychologist'],
                'high_skills': ['Communication_Skills', 'Analytical_Skills', 'Research_Experience'],
                'low_skills': ['Coding_Skills', 'Industry_Certifications']
            },
             'Education': {
                'careers': ['Teacher', 'Curriculum Developer', 'Education Administrator', 'Special Education Teacher'],
                'high_skills': ['Communication_Skills', 'Presentation_Skills', 'Leadership_Positions'],
                'low_skills': ['Coding_Skills', 'Analytical_Skills']
            },
            'Architecture': {
                'careers': ['Architect', 'Urban Planner', 'Interior Designer', 'Landscape Architect'],
                'high_skills': ['Field_Specific_Courses', 'Projects', 'Presentation_Skills'],
                'low_skills': ['Research_Experience', 'Coding_Skills'] 
            },
            'Music': {
                'careers': ['Musician', 'Music Teacher', 'Composer', 'Sound Engineer'],
                'high_skills': ['Field_Specific_Courses', 'Projects', 'Presentation_Skills'], 
                'low_skills': ['Analytical_Skills', 'Research_Experience']
            },
             'Physics': {
                'careers': ['Physicist', 'Astronomer', 'Research Scientist', 'Lab Manager'],
                'high_skills': ['Analytical_Skills', 'Problem_Solving_Skills', 'Research_Experience', 'Field_Specific_Courses'],
                'low_skills': ['Communication_Skills', 'Leadership_Positions']
            },
             'Chemistry': {
                'careers': ['Chemist', 'Toxicologist', 'Forensic Scientist', 'Chemical Technician'],
                'high_skills': ['Analytical_Skills', 'Research_Experience', 'Field_Specific_Courses'],
                'low_skills': ['Communication_Skills', 'Presentation_Skills']
            }
        }

    def generate_synthetic_data(self, n_samples=5000):
        data = []
        for _ in range(n_samples):
            field = np.random.choice(list(self.domain_logic.keys()))
            rules = self.domain_logic[field]
            career = np.random.choice(rules['careers'])
            
            profile = {'Field': field, 'Career': career, 'GPA': np.random.uniform(2.5, 4.0)}
            
            for col in self.numerical_cols:
                if col == 'GPA': continue
                base_score = np.random.normal(5, 1.5)
                if col in rules.get('high_skills', []):
                    base_score = np.random.normal(8.5, 1.0)
                elif col in rules.get('low_skills', []):
                    base_score = np.random.normal(2.0, 1.0)
                profile[col] = np.clip(base_score, 0, 10)
            data.append(profile)
        return pd.DataFrame(data)

    def convert_text_dataset_to_numeric(self, df_text):
        converted_rows = []
        tech_keywords = ['python', 'java', 'sql', 'react', 'c++', 'aws', 'node', 'html', 'css', 'ai', 'machine learning']
        comm_keywords = ['communication', 'leadership', 'management', 'hr', 'marketing']
        
        for _, row in df_text.iterrows():
            skills = str(row.get('skills', '')).lower()
            role = row.get('job_role', 'Unknown')
            qualification = str(row.get('qualification', '')).lower()
            
            new_profile = {col: 5.0 for col in self.numerical_cols}
            new_profile['GPA'] = 3.5 
            
            if any(k in skills for k in tech_keywords):
                new_profile['Coding_Skills'] = 9.0
                new_profile['Projects'] = 8.0
            else:
                new_profile['Coding_Skills'] = 2.0
                
            if any(k in skills for k in comm_keywords):
                new_profile['Communication_Skills'] = 9.0
                new_profile['Leadership_Positions'] = 7.0

            field = "General"
            if "computer science" in qualification or "software" in qualification: field = "Computer Science"
            elif "design" in qualification or "art" in qualification: field = "Art"
            elif "finance" in qualification or "business" in qualification: field = "Business"
            elif "medicine" in qualification or "nursing" in qualification: field = "Medicine"
            elif "engineering" in qualification: field = "Engineering"
            elif "law" in qualification or "legal" in qualification: field = "Law"
            elif "psychology" in qualification: field = "Psychology"
            elif "education" in qualification or "teaching" in qualification: field = "Education"
            elif "architecture" in qualification: field = "Architecture"
            elif "music" in qualification: field = "Music"
            elif "physics" in qualification: field = "Physics"
            elif "chemistry" in qualification: field = "Chemistry"
            
            new_profile['Field'] = field
            new_profile['Career'] = role
            converted_rows.append(new_profile)
            
        return pd.DataFrame(converted_rows)

    def train(self):
        print("⚙️  Training Recommender System...")
        training_data = self.generate_synthetic_data(n_samples=3000)
        
        # Look for CSV in multiple possible locations
        csv_filenames = [
            os.path.join(BASE_DIR, 'backend/api/ml_models/candidate_job_role_dataset.csv'),
            os.path.join(BASE_DIR, 'api/ml_models/candidate_job_role_dataset.csv'),
            'candidate_job_role_dataset.csv'
        ]
        
        found_path = None
        for path in csv_filenames:
            if os.path.exists(path):
                found_path = path
                break

        if found_path:
            print(f"   - Loading real-world data from {found_path}")
            try:
                df_text = pd.read_csv(found_path)
                df_converted = self.convert_text_dataset_to_numeric(df_text)
                training_data = pd.concat([training_data, df_converted], ignore_index=True)
            except Exception as e:
                print(f"   ⚠️ Error loading csv: {e}")
        
        weighted_training = training_data.copy()
        for col, weight in self.feature_weights.items():
            if col in weighted_training.columns:
                weighted_training[col] = weighted_training[col] * weight

        self.career_skill_profiles = weighted_training.groupby('Career')[self.numerical_cols].mean()
        self.career_skill_profiles_scaled = pd.DataFrame(
            self.scaler.fit_transform(self.career_skill_profiles),
            index=self.career_skill_profiles.index,
            columns=self.numerical_cols
        )

        self.career_field_probs = pd.crosstab(training_data['Career'], training_data['Field'], normalize='index')
        print(f"✅ Model trained on {len(self.career_skill_profiles)} unique careers.")

    def predict(self, student_data):
        if self.career_skill_profiles_scaled is None:
            self.train()

        student_field = student_data.get('Field', 'General')
        
        input_data = student_data.copy()
        for col, weight in self.feature_weights.items():
            if col in input_data:
                input_data[col] = float(input_data[col]) * weight

        vector_data = {col: input_data.get(col, 0) for col in self.numerical_cols}
        user_vector = pd.DataFrame([vector_data])
        user_scaled = self.scaler.transform(user_vector)
        
        skill_sim = cosine_similarity(user_scaled, self.career_skill_profiles_scaled)[0]
        
        scores_df = pd.DataFrame(index=self.career_skill_profiles.index)
        scores_df['Skill_Score'] = skill_sim
        
        if student_field in self.career_field_probs.columns:
            scores_df['Field_Score'] = self.career_field_probs[student_field]
        else:
            scores_df['Field_Score'] = 0.1 

        scores_df['Final_Score'] = scores_df['Skill_Score'] * (1 + scores_df['Field_Score'] * 3.0)

        top_results = scores_df.sort_values(by='Final_Score', ascending=False).head(6)
        
        recommendations = []
        for career, row in top_results.iterrows():
            recommendations.append({
                "career": career,
                "score": round(row['Final_Score'], 2),
                "match_rate": int(row['Skill_Score'] * 100) 
            })
            
        return recommendations

    def save_model(self, filepath='career_recommender.pkl'):
        print(f"💾 Saving model to {filepath}...")
        joblib.dump(self, filepath)
        print("✅ Model saved successfully.")

    @staticmethod
    def load_model(filepath='career_recommender.pkl'):
        print(f"📂 Loading model from {filepath}...")
        return joblib.load(filepath)