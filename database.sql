CREATE TABLE ActivityLog (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    tableName VARCHAR(50) NOT NULL,
    recordId INT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
); 