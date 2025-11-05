-- PostgreSQL initialization script for car information database

-- Create main cars table
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(20),
    owner_email VARCHAR(255),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50),
    vin VARCHAR(17) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create service records table
CREATE TABLE service_records (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) REFERENCES cars(license_plate) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    mileage INTEGER,
    cost DECIMAL(10,2),
    service_provider VARCHAR(255),
    next_service_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create insurance table
CREATE TABLE insurance (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) REFERENCES cars(license_plate) ON DELETE CASCADE,
    policy_number VARCHAR(100) NOT NULL,
    insurance_company VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coverage_type VARCHAR(100),
    premium_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rental information table
CREATE TABLE rental_info (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) REFERENCES cars(license_plate) ON DELETE CASCADE,
    daily_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT true,
    current_renter_name VARCHAR(255),
    current_renter_phone VARCHAR(20),
    rental_start_date DATE,
    rental_end_date DATE,
    total_rental_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_cars_license_plate ON cars(license_plate);
CREATE INDEX idx_service_records_license_plate ON service_records(license_plate);
CREATE INDEX idx_service_records_date ON service_records(service_date);
CREATE INDEX idx_insurance_license_plate ON insurance(license_plate);
CREATE INDEX idx_rental_info_license_plate ON rental_info(license_plate);
CREATE INDEX idx_rental_info_availability ON rental_info(is_available);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rental_info_updated_at BEFORE UPDATE ON rental_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO cars (license_plate, owner_name, owner_phone, owner_email, make, model, year, color, vin) VALUES
('ABC-123', 'John Doe', '+358-40-123-4567', 'john.doe@email.com', 'Toyota', 'Camry', 2022, 'Blue', '1HGBH41JXMN109186'),
('XYZ-789', 'Jane Smith', '+358-50-987-6543', 'jane.smith@email.com', 'Honda', 'Civic', 2021, 'Red', '2HGFC2F59MH123456'),
('DEF-456', 'Mike Johnson', '+358-44-555-0123', 'mike.j@email.com', 'Ford', 'Focus', 2023, 'White', '3FADP4AJ5HM654321'),
('GHI-789', 'Anna Korhonen', '+358-45-111-2222', 'anna.k@email.com', 'Volkswagen', 'Golf', 2022, 'Black', '1VWSA7A3XHC123456'),
('JKL-012', 'Pekka Virtanen', '+358-46-333-4444', 'pekka.v@email.com', 'BMW', '320i', 2021, 'Silver', 'WBA8E1C58LC123456');

-- Insert service records
INSERT INTO service_records (license_plate, service_date, service_type, description, mileage, cost, service_provider, next_service_date) VALUES
('ABC-123', '2024-10-15', 'Regular Maintenance', 'Oil change, filter replacement, general inspection', 45000, 120.50, 'Helsinki Auto Service', '2025-04-15'),
('ABC-123', '2024-06-20', 'Tire Change', 'Summer tires installed', 42000, 350.00, 'Tire Expert', '2024-11-30'),
('XYZ-789', '2024-09-20', 'Regular Maintenance', 'Oil change, brake inspection', 38000, 95.75, 'Quick Service', '2025-03-20'),
('DEF-456', '2024-11-01', 'Annual Inspection', 'Mandatory annual vehicle inspection', 15000, 85.00, 'Official Inspection Center', '2025-11-01'),
('GHI-789', '2024-08-10', 'Air Conditioning', 'AC system maintenance and refrigerant refill', 28000, 180.00, 'Climate Control Experts', NULL),
('JKL-012', '2024-07-25', 'Regular Maintenance', 'Full service including oil, filters, and fluids', 52000, 210.25, 'BMW Service Center', '2025-01-25');

-- Insert insurance information
INSERT INTO insurance (license_plate, policy_number, insurance_company, start_date, end_date, coverage_type, premium_amount) VALUES
('ABC-123', 'POL-2024-001', 'Vakuutus Yhtiö', '2024-01-01', '2024-12-31', 'Comprehensive', 1200.00),
('XYZ-789', 'INS-2024-456', 'Turva Insurance', '2024-03-15', '2025-03-14', 'Full Coverage', 980.50),
('DEF-456', 'CAR-2024-789', 'Suomi Vakuutus', '2024-06-01', '2025-05-31', 'Comprehensive', 1450.75),
('GHI-789', 'VW-2024-012', 'Auto Protect', '2024-02-20', '2025-02-19', 'Basic Coverage', 650.00),
('JKL-012', 'BMW-2024-345', 'Premium Insurance', '2024-04-10', '2025-04-09', 'Premium Package', 1850.25);

-- Insert rental information
INSERT INTO rental_info (license_plate, daily_rate, is_available, current_renter_name, current_renter_phone, rental_start_date, rental_end_date, total_rental_days) VALUES
('ABC-123', 45.00, true, NULL, NULL, NULL, NULL, 127),
('XYZ-789', 40.00, false, 'Laura Mäkinen', '+358-41-777-8888', '2024-11-01', '2024-11-07', 89),
('DEF-456', 50.00, true, NULL, NULL, NULL, NULL, 23),
('GHI-789', 48.00, true, NULL, NULL, NULL, NULL, 156),
('JKL-012', 65.00, false, 'Jussi Heikkilä', '+358-42-999-0000', '2024-10-28', '2024-11-10', 78);

-- Create view for car summary with latest service
CREATE VIEW car_summary AS
SELECT 
    c.license_plate,
    c.owner_name,
    c.make,
    c.model,
    c.year,
    c.color,
    COALESCE(latest_service.service_date, 'No service record') as last_service,
    COALESCE(latest_service.next_service_date, 'Not scheduled') as next_service,
    r.daily_rate,
    r.is_available,
    r.current_renter_name,
    i.insurance_company,
    i.end_date as insurance_expires
FROM cars c
LEFT JOIN (
    SELECT DISTINCT ON (license_plate) 
        license_plate, 
        service_date, 
        next_service_date
    FROM service_records 
    ORDER BY license_plate, service_date DESC
) latest_service ON c.license_plate = latest_service.license_plate
LEFT JOIN rental_info r ON c.license_plate = r.license_plate
LEFT JOIN (
    SELECT DISTINCT ON (license_plate)
        license_plate,
        insurance_company,
        end_date
    FROM insurance
    ORDER BY license_plate, end_date DESC
) i ON c.license_plate = i.license_plate;

COMMENT ON TABLE cars IS 'Main table storing static car information';
COMMENT ON TABLE service_records IS 'Service history and maintenance records for cars';
COMMENT ON TABLE insurance IS 'Insurance policy information for cars';
COMMENT ON TABLE rental_info IS 'Rental availability and current rental status';
COMMENT ON VIEW car_summary IS 'Complete car overview with latest service and rental status';

-- Print initialization message
SELECT 'PostgreSQL car information database initialized successfully' AS status;