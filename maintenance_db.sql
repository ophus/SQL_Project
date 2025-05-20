-- Tạo database
CREATE DATABASE IF NOT EXISTS maintenance_db;
USE maintenance_db;

-- Bảng Users
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    fullName VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Technicians
CREATE TABLE IF NOT EXISTS Technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Specialization VARCHAR(100),
    PhoneNumber VARCHAR(20),
    Address VARCHAR(255),
    HireDate DATE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Devices
CREATE TABLE IF NOT EXISTS Devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    DeviceName VARCHAR(100) NOT NULL,
    SerialNumber VARCHAR(50) UNIQUE,
    Model VARCHAR(50),
    Manufacturer VARCHAR(100),
    PurchaseDate DATE,
    WarrantyExpiry DATE,
    Status ENUM('active', 'maintenance', 'broken', 'decommissioned') DEFAULT 'active',
    Location VARCHAR(100),
    LastMaintenanceDate DATE,
    NextMaintenanceDate DATE,
    Notes TEXT,
    assignedTechnician INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignedTechnician) REFERENCES Technicians(id)
);

-- Bảng Alerts
CREATE TABLE IF NOT EXISTS Alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    DeviceID INT,
    Message TEXT,
    Severity ENUM('low', 'medium', 'high', 'critical'),
    AlertDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsResolved BOOLEAN DEFAULT FALSE,
    ResolutionNotes TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (DeviceID) REFERENCES Devices(id)
);

-- Bảng MaintenanceSchedules
CREATE TABLE IF NOT EXISTS MaintenanceSchedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    DeviceID INT,
    TechnicianID INT,
    MaintenanceType VARCHAR(50),
    ScheduledDate DATETIME,
    Status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    Description TEXT,
    Notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (DeviceID) REFERENCES Devices(id),
    FOREIGN KEY (TechnicianID) REFERENCES Technicians(id)
);

-- Thêm dữ liệu mẫu
INSERT INTO Users (username, fullName, email, password, role) 
VALUES ('admin', 'Admin User', 'admin@example.com', '$2a$10$Xo7Xz5rX8v5Y3p9kL2mQ3u8k9jN7mPqR5vX8z9mQ3u8k9jN7mPqR', 'admin');

INSERT INTO Technicians (FullName, Specialization, PhoneNumber, HireDate, Address) 
VALUES 
('John Doe', 'Electronics', '1234567890', '2023-01-01', '123 Tech Street'),
('Jane Smith', 'Mechanical', '0987654321', '2023-02-01', '456 Tech Avenue');

INSERT INTO Devices (DeviceName, SerialNumber, Model, Manufacturer, PurchaseDate, WarrantyExpiry, Status, Location, Notes, assignedTechnician) 
VALUES 
('Printer', 'SN12345', 'ModelX', 'HP', NULL, NULL, 'active', NULL, NULL, 1),
('Pump A', 'PMP001', 'X200', 'ABC Corp', '2022-03-10', '2024-03-10', 'active', 'Factory A', 'Main water pump', 1),
('Generator B', 'GEN002', 'Y500', 'XYZ Inc', '2021-07-15', '2023-07-15', 'maintenance', 'Factory B', 'Backup generator', 2);

INSERT INTO MaintenanceSchedules (DeviceID, TechnicianID, MaintenanceType, ScheduledDate, Status, Description) 
VALUES (1, 1, 'preventive', '2025-06-01 09:00:00', 'pending', 'Annual maintenance check');

INSERT INTO Alerts (DeviceID, Message, Severity) 
VALUES (1, 'High temperature detected', 'critical');