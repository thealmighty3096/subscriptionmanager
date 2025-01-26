-- First drop the other migration if it exists
DROP MIGRATION IF EXISTS "20250126000000_add_billing_details";

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add is_shared column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='subscriptions' AND column_name='is_shared') THEN
        ALTER TABLE subscriptions 
        ADD COLUMN is_shared boolean NOT NULL DEFAULT false;
    END IF;

    -- Add total_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='subscriptions' AND column_name='total_amount') THEN
        ALTER TABLE subscriptions 
        ADD COLUMN total_amount decimal(10,2);
    END IF;

    -- Add shared_with column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='subscriptions' AND column_name='shared_with') THEN
        ALTER TABLE subscriptions 
        ADD COLUMN shared_with integer;
    END IF;
END $$;

-- Update existing rows to set total_amount equal to actual_amount where is_shared is false
UPDATE subscriptions 
SET total_amount = actual_amount 
WHERE is_shared = false AND total_amount IS NULL; 