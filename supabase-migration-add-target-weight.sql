-- Add target_weight column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN clients.target_weight IS 'Hedef kilo (kg) - Danışanın hedeflediği kilo hedefi';




