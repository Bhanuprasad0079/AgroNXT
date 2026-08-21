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
