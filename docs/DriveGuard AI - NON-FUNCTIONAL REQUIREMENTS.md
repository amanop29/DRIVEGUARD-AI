# **DriveGuard AI - Video Analysis System**
### **Non-Functional Requirements (NFR)**
**Version:** 2.0.0
**Date:** October 10, 2025
**Document Type:** Technical Specification

---

## **1. Performance Requirements**

### **1.1 Video Processing Performance**
* **Hardware Configuration**:
    * **Processor**: Apple Silicon (ARM64)
    * **GPU**: Metal Performance Shaders (MPS)
    * **Operating System**: macOS 15.6.1

| Metric | Specification | Measured Performance |
| :--- | :--- | :--- |
| **Processing Ratio** | | |
| 1-minute video | ~2 minutes | ☐ Verified |
| 2-minute video | ~4-5 minutes | ☐ 5:14 actual |
| 5-minute video | ~10-11 minutes | Estimated |
| **GPU Acceleration** | Apple Silicon MPS | ☐ Active |
| **Concurrent Processing**| Sequential (1 video at a time) | Current limitation |


### **1.2 System Response Times**

| Operation | Target Response Time | Status |
| :--- | :--- | :--- |
| **User Login** | < 500ms | ☐ Met |
| **Dashboard Load** | < 1 second | ☐ Met |
| **API Endpoints (non-analysis)** | < 100ms | ☐ Met |
| **Video Upload** | Dependent on file size | Network-bound |
| **Analysis Status Check** | < 50ms | ☐ Met |

---

## **2. Scalability Requirements**

### **2.1 User Capacity**
* **Current Capacity**:

| Metric | Current Capacity | Notes |
| :--- | :--- | :--- |
| **Registered Users** | Unlimited (file-based) | Database migration recommended |
| **Concurrent Sessions** | Up to 10 users | Limited by server resources |
| **Analyses per User** | Unlimited | Storage-dependent |
| **Video Storage** | Local file system | ~50GB available |


### **2.2 System Throughput**
* **Future Scalability**:

| Metric | Specification |
| :--- | :--- |
| **Videos per Hour** | ~12-15 videos (2-3 min avg) |
| **Daily Processing Capacity** | ~150-200 videos |
| **Peak Load Handling** | Single sequential processing queue |


---

## **3. Reliability & Availability**

### **3.1 System Uptime**

| Requirement | Specification |
| :--- | :--- |
| **Target Uptime** | 99% during development |
| **Maximum Downtime** | Planned maintenance windows |
| **Recovery Time Objective (RTO)** | < 5 minutes |
| **Recovery Point Objective (RPO)**| Last successful analysis |


### **3.2 Data Integrity**
* **Analysis Results**: Stored in JSON format with validation.
* **Video Files**: Original files are preserved post-analysis.
* **User Data**: File-based storage with backup capability.

---

## **4. Security Requirements**

### **4.1 Authentication & Authorization**

| Feature | Implementation | Status |
| :--- | :--- | :--- |
| **User Authentication** | Password-based login | ☐ Implemented |
| **Password Encryption** | Plaintext (requires enhancement) | ☐ Implemented |
| **Session Management** | Cookie/JWT-based | Implemented |
| **Role-Based Access** | Individual/Enterprise accounts | ☐ Implemented |

---

## **5. Usability Requirements**

### **5.1 User Interface**

| Requirement | Specification |
| :--- | :--- |
| **Framework** | React 18+ TypeScript |
| **Responsive Design** | Desktop and tablet optimized |
| **Dark/Light Mode** | Toggle available |


### **5.2 User Experience**

| Feature | Target | Status |
| :--- | :--- | :--- |
| **Video Upload Flow** | < 3 clicks | ☐ Met |
| **Analysis Results Display**| < 2 seconds load | ☐ Met |
| **Dashboard Navigation** | Intuitive layout | ☐ Met |
| **Error Messages** | Clear, actionable feedback | ☐ Met |
| **Progress Indicators** | Real-time processing status | ☐ Met |


---

## **6. Portability & Compatibility**

### **6.1 Platform Requirements**

| Component | Requirement |
| :--- | :--- |
| **Operating System** | macOS 12+ (Apple Silicon optimized) |
| **Python Version** | 3.10 or higher |
| **Node.js Version** | 18.x or higher |
| **GPU Support** | Apple Silicon MPS (or CUDA for NVIDIA) |

### **6.2 Dependencies**
* **Python Dependencies**:
    * OpenCV (cv2) - Video processing
    * PyTorch - Deep learning framework
    * YOLOv8 - Object detection
    * NumPy - Numerical computations
    * Ultralytics - YOLO implementation

---

## **7. AI Model Performance**

### **7.1 Detection Accuracy**

| Model | Task | Accuracy |
| :--- | :--- | :--- |
| **YOLOv8n** | Vehicle detection | ~90% |
| **Speed Detection** | Speed estimation | ±5 $km/h$ accuracy |
| **Signal Detection** | Traffic light violations | Rule-based validation |

### **7.2 Scoring Algorithm**
* **Score Weights**:

| Score Component | Weight | Penalty Formula |
| :--- | :--- | :--- |
| **Safety Score** | 50% | $100 - (\text{close\_encounters} \times 8)$ |
| **Compliance Score** | 30% | $100 - (\text{traffic\_violations} \times 40 + \text{bus\_lane} \times 30)$ |
| **Efficiency Score** | 20% | $100 - (\text{lane\_changes} \times 0.5)$ |


* **Score Categories**:
    * **90-100**: Excellent - Outstanding performance
    * **75-89**: Good - Minor improvements needed
    * **0-74**: Needs Improvement - Safety concerns

---

## **8. Known Limitations & Future Enhancements**

### **8.1 Current Limitations**
1.  **Sequential Processing**: Only one video can be analyzed at a time.
2.  **Password Security**: Passwords are currently stored in plaintext.
3.  **File-Based Database**: Not suitable for large-scale deployment.
4.  **No Real-Time Processing**: Videos must be uploaded and queued for analysis.
5.  **GPU Dependency**: Optimal performance requires Apple Silicon MPS.

### **8.2 Recommended Enhancements**
* **Priority 1 (Critical)**:
    * Implement password hashing (e.g., bcrypt/argon2).
    * Add HTTPS/TLS support.
    * Migrate to a dedicated database (e.g., PostgreSQL/MongoDB).
* **Priority 2 (High)**:
    * Enable parallel video processing using a multi-threading or queue system.
    * Introduce real-time video stream analysis.
    * Develop an advanced analytics dashboard.
    * Implement API rate limiting and throttling.
* **Priority 3 (Medium)**:
    * Mobile app development.
    * Add support for cloud deployment.
    * Create an automated backup system.
    * Implement advanced reporting features.