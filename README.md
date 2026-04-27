# 💗 Study Circle

Study Circle is a peer-to-peer study support platform designed for university students. It allows users to connect with others who can provide help in specific subjects, creating a collaborative and accessible learning environment.

Many students cannot afford private tutoring, so this system offers a free and supportive way to exchange knowledge.

---

## 🚀 Features

- User login system  
- User profiles with skills  
- Study session listings  
- Session ratings  
- In-app messaging  
- Database-driven content  

---

## 🛠️ Technology Stack

Frontend:
- HTML, CSS, JavaScript  
- PUG templating  

Backend:
- Node.js  
- Express.js  
- MySQL  

DevOps & Tools:
- Docker  
- GitHub  
- GitHub Actions (CI/CD)  

---

## ⚙️ CI/CD Pipeline

GitHub Actions is used to implement Continuous Integration. When code is pushed, a workflow runs automatically, installs dependencies using npm install, and checks that the application builds successfully. This helps maintain stability and detect errors early.

---

## 🐳 Development Environment

The application is containerised using Docker. This allows all team members to run the project consistently and ensures both the web application and database work together without setup issues.

---

## ▶️ How to Run the Project

1. Clone the repository  
2. Open the project folder  
3. Run: docker compose up  
4. Open your browser and go to: http://localhost:3000  

---

## 📂 Project Structure

/app → application logic  
/views → PUG templates  
/models → database models  
/services → database connection  
/static → styling (CSS)  
/.github → CI/CD workflows  

---

## 📊 Development Process

Sprint 1 – Planning  
- Project idea refinement  
- Personas and ethical considerations  
- GitHub setup and Kanban board  

Sprint 2 – Design  
- User stories  
- Wireframes and diagrams  

Sprint 3 – Development  
- Database integration  
- Dynamic pages (users and sessions)  
- Docker setup  

Sprint 4 – Final Features  
- Login system  
- Messaging system  
- UI improvements  
- Navigation refinement  

---

## 👥 Team Members

- Ilhan Mohamed  
- Sabrin Sa  
- Huda Abi  
- Amina Adan  

---

## 🎯 Summary

This project demonstrates full-stack web development, database integration, team collaboration using GitHub, use of Docker for environment setup, and implementation of a CI pipeline using GitHub Actions.

