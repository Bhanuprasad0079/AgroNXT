# AgroNXT — AI-Driven Smart Agriculture & Farm Intelligence Platform

AgroNXT is a full-stack, machine-learning-enabled agricultural intelligence platform designed to optimize crop yields, predict financial returns on investment (ROI), and provide real-time advisory services for modern farmers. 

The platform leverages supervised predictive modeling, relational cloud databases, and decoupled cloud architectures to deliver scalable, low-latency decision support.

---

## Live Links & Deployment

- **Live Application (Frontend):** [Insert your Vercel URL here]
- **API Documentation & Swagger UI (Backend):** [Insert your Render URL here]/docs
- **Project Repository:** https://github.com/Bhanuprasad0079/AgroNXT

---

## System Architecture

AgroNXT utilizes a decoupled, monorepo microservice-style architecture designed for high availability and performance:

1. **Client Tier (Frontend):** Built with Next.js (React) and Tailwind CSS, deployed on Vercel's global edge network.
2. **Application Tier (Backend):** High-performance asynchronous REST API built using FastAPI (Python), deployed on Render.
3. **Database Tier:** Managed PostgreSQL instance hosted on Supabase, supporting transactional integrity, relational schema design, and secure persistent user data storage.
4. **Media & Assets:** Cloudinary integration for scalable cloud image management.
5. **Machine Learning Pipeline:** Pre-trained Scikit-Learn models and serialized feature scalers for low-latency inference.


```text
[ Next.js Client (Vercel) ]
             |
       (HTTPS / JSON)
             v
[ FastAPI Backend (Render) ] <---> [ Scikit-Learn ML Models ]
             |
    +--------+--------+
    |                 |
    v                 v
[ Supabase ]     [ Cloudinary ]
(PostgreSQL)      (Media CDN)
```

## Core Features & Capabilities

### 1. Precision Crop Recommendation Engine
- Recommends optimal crops based on soil composition (Nitrogen, Phosphorus, Potassium, pH) and atmospheric conditions (Temperature, Humidity, Rainfall).
- Powered by a trained Multi-Class Classification model utilizing feature scaling pipelines.

### 2. Crop Yield Forecasting & ROI Estimator
- Predicts expected harvest yields per acre based on location, state metrics, and historical crop cycles.
- Computes comprehensive financial ROI, estimated revenue generation, and cost-benefit breakdowns per acre to assist in operational planning.

### 3. Season & Regional Advisory System
- Dynamic agronomic calendar offering localized seasonal recommendations, harvest scheduling, and region-specific best practices across states.

### 4. Secure Authentication & Session Management
- OAuth2 with JWT (JSON Web Tokens) for stateless authentication.
- Password hashing utilizing `passlib` (Bcrypt) and secure SMTP integration for automated password recovery workflows.

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 / React
- **Styling:** Tailwind CSS, PostCSS
- **State & Data Fetching:** Native Async/Await, Axios

### Backend & Machine Learning
- **Framework:** FastAPI (Python 3.10+)
- **ORM / Driver:** SQLAlchemy 2.0, Psycopg2-binary
- **ML / Data Science:** Scikit-Learn, Pandas, NumPy, Joblib
- **Authentication:** PyJWT, Passlib (Bcrypt), Python-Multipart
- **Server:** Uvicorn (ASGI)

### Cloud Infrastructure & DevOps
- **Hosting (Frontend):** Vercel Edge Platform
- **Hosting (Backend):** Render Web Services
- **Database:** Supabase (Cloud PostgreSQL)
- **Media Storage:** Cloudinary REST API
- **Version Control:** Git / GitHub Monorepo

---

## API Reference (Core Endpoints)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/token` | Authenticates user and returns JWT bearer token | Public |
| `POST` | `/register` | Registers a new user account | Public |
| `POST` | `/forgot-password` | Dispatches reset password email via SMTP | Public |
| `GET` | `/users/me` | Fetches authenticated user profile | Private |
| `POST` | `/predict-crop` | Computes ML-based crop recommendation | Public / Private |
| `POST` | `/calculate-roi` | Computes dynamic financial ROI and cost projections | Public / Private |

---

## Local Development Setup

### Prerequisites
- Node.js (v18.0 or later)
- Python (v3.10 or later)
- PostgreSQL database instance

### 1. Clone the Repository
```bash
git clone [https://github.com/Bhanuprasad0079/AgroNXT.git](https://github.com/Bhanuprasad0079/AgroNXT.git)
cd AgroNXT
```


cd agronxt_backend/agronxt-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000


cd ../../agronxt_frontend/agronxt-frontend

# Install dependencies
npm install

# Run development server
npm run dev


DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SENDER_EMAIL=your_smtp_email
SENDER_PASSWORD=your_smtp_app_password

NEXT_PUBLIC_API_URL=[https://your-deployed-backend-url.onrender.com](https://your-deployed-backend-url.onrender.com)
