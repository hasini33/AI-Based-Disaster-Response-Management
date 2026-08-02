# AI-Based Disaster Response Management System for Resource Allocation and Relief Coordination

## 📌 Project Overview

The AI-Based Disaster Response Management System is designed to support disaster management authorities by collecting real-time disaster information, analyzing the impact using geospatial datasets, and assisting in resource allocation.

The system integrates multiple external data sources such as GDACS, USGS, NDMA, OpenStreetMap, WorldPop, and Sentinel Hub to estimate disaster severity and provide data-driven insights.

---

## 🚀 Features

- Real-time GDACS disaster data integration
- Real-time USGS earthquake data integration
- NDMA disaster alert feed integration
- Sentinel Hub satellite imagery integration
- Population density analysis using WorldPop raster
- Building footprint integration using OpenStreetMap
- Resource inventory management
- Disaster severity score calculation
- REST APIs using FastAPI
- PostgreSQL + PostGIS geospatial database

---

## 🛠 Tech Stack

### Backend
- FastAPI
- Python
- SQLAlchemy
- GeoAlchemy2
- Alembic

### Database
- PostgreSQL
- PostGIS

### Geospatial Libraries
- GeoPandas
- Rasterio
- Shapely

### External APIs
- GDACS
- USGS Earthquake API
- NDMA SACHET RSS Feed
- Sentinel Hub API
- OpenStreetMap (Overpass API)

### Data Processing
- Pandas
- NumPy

---

## 📂 Project Structure

```
backend/
│
├── app/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── db/
│   ├── main.py
│
├── alembic/
├── data/
├── requirements.txt
├── README.md
└── .env
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone <repository-url>
```

Move into the project

```bash
cd backend
```

Create virtual environment

```bash
python -m venv venv
```

Activate environment

Windows

```bash
venv\Scripts\activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create a `.env` file

```env
DATABASE_URL=postgresql://username:password@localhost/disaster_db

SENTINEL_CLIENT_ID=your_client_id
SENTINEL_CLIENT_SECRET=your_client_secret
```

---

## Run the Server

```bash
uvicorn app.main:app --reload
```

Swagger UI

```
http://127.0.0.1:8000/docs
```

---

## Implemented APIs

### GDACS

```
GET /gdacs
```

### USGS

```
GET /earthquake
```

### NDMA

```
GET /ndma
```

### Satellite

```
GET /satellite/{earthquake_id}
```

### Severity

```
POST /severity/sample
```

### Resources

```
GET /resources
POST /resources
PUT /resources/{id}
DELETE /resources/{id}
```

---

## Data Sources

- GDACS
- USGS Earthquake API
- NDMA SACHET RSS
- Sentinel Hub
- OpenStreetMap
- WorldPop Population Raster

---

## Future Enhancements

- AI-based disaster prediction
- Automatic damage detection using satellite imagery
- Route optimization using OR-Tools
- Resource allocation optimization
- Interactive GIS dashboard
- Machine Learning severity prediction

---

## Authors

Infosys Springboard Internship Project

AI-Based Disaster Response Management System Team