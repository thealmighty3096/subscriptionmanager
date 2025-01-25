ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS actual_amount decimal(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_frequency text NOT NULL DEFAULT 'monthly';

-- Update existing rows to set actual_amount equal to amount for existing subscriptions
UPDATE subscriptions 
SET actual_amount = amount 
WHERE actual_amount = 0; 