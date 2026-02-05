-- Daily Analytics Aggregation Table
-- This table pre-calculates daily metrics for faster, more accurate chart display

CREATE TABLE IF NOT EXISTS daily_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  analytics_date DATE NOT NULL,
  
  -- Card metrics
  new_cards_created INTEGER DEFAULT 0,
  active_cards_total INTEGER DEFAULT 0,
  deleted_cards INTEGER DEFAULT 0,
  
  -- Stamp metrics
  stamps_given INTEGER DEFAULT 0,
  total_stamp_transactions INTEGER DEFAULT 0,
  
  -- Reward metrics
  rewards_earned INTEGER DEFAULT 0,
  rewards_redeemed INTEGER DEFAULT 0,
  rewards_pending INTEGER DEFAULT 0,
  
  -- Customer metrics
  unique_customers INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  returning_customers INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one record per merchant per day
  UNIQUE(merchant_id, analytics_date)
);

-- Indexes for fast queries
CREATE INDEX idx_daily_analytics_merchant ON daily_analytics(merchant_id);
CREATE INDEX idx_daily_analytics_date ON daily_analytics(analytics_date);
CREATE INDEX idx_daily_analytics_merchant_date ON daily_analytics(merchant_id, analytics_date);

-- Function to update daily analytics for a merchant
CREATE OR REPLACE FUNCTION update_daily_analytics(p_merchant_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
  v_new_cards INTEGER;
  v_active_cards INTEGER;
  v_stamps_given INTEGER;
  v_stamp_transactions INTEGER;
  v_rewards_earned INTEGER;
  v_rewards_redeemed INTEGER;
  v_rewards_pending INTEGER;
  v_unique_customers INTEGER;
BEGIN
  -- Calculate new cards created on this date
  SELECT COUNT(*) INTO v_new_cards
  FROM stamp_cards
  WHERE merchant_id = p_merchant_id
    AND DATE(created_at) = p_date;
  
  -- Calculate active cards at end of day
  SELECT COUNT(*) INTO v_active_cards
  FROM stamp_cards
  WHERE merchant_id = p_merchant_id
    AND DATE(created_at) <= p_date;
  
  -- Calculate stamps given on this date
  SELECT COALESCE(SUM(amount), 0), COUNT(*) INTO v_stamps_given, v_stamp_transactions
  FROM stamp_history
  WHERE merchant_id = p_merchant_id
    AND DATE(created_at) = p_date;
  
  -- Calculate rewards earned on this date
  SELECT COUNT(*) INTO v_rewards_earned
  FROM rewards
  WHERE merchant_id = p_merchant_id
    AND DATE(earned_at) = p_date;
  
  -- Calculate rewards redeemed on this date
  SELECT COUNT(*) INTO v_rewards_redeemed
  FROM rewards
  WHERE merchant_id = p_merchant_id
    AND DATE(redeemed_at) = p_date;
  
  -- Calculate pending rewards
  SELECT COUNT(*) INTO v_rewards_pending
  FROM rewards
  WHERE merchant_id = p_merchant_id
    AND earned_at <= (p_date + INTERVAL '1 day')
    AND (redeemed_at IS NULL OR redeemed_at > (p_date + INTERVAL '1 day'));
  
  -- Calculate unique customers
  SELECT COUNT(DISTINCT user_id) INTO v_unique_customers
  FROM stamp_cards
  WHERE merchant_id = p_merchant_id
    AND DATE(created_at) <= p_date;
  
  -- Insert or update the daily analytics record
  INSERT INTO daily_analytics (
    merchant_id,
    analytics_date,
    new_cards_created,
    active_cards_total,
    stamps_given,
    total_stamp_transactions,
    rewards_earned,
    rewards_redeemed,
    rewards_pending,
    unique_customers,
    updated_at
  ) VALUES (
    p_merchant_id,
    p_date,
    v_new_cards,
    v_active_cards,
    v_stamps_given,
    v_stamp_transactions,
    v_rewards_earned,
    v_rewards_redeemed,
    v_rewards_pending,
    v_unique_customers,
    NOW()
  )
  ON CONFLICT (merchant_id, analytics_date)
  DO UPDATE SET
    new_cards_created = EXCLUDED.new_cards_created,
    active_cards_total = EXCLUDED.active_cards_total,
    stamps_given = EXCLUDED.stamps_given,
    total_stamp_transactions = EXCLUDED.total_stamp_transactions,
    rewards_earned = EXCLUDED.rewards_earned,
    rewards_redeemed = EXCLUDED.rewards_redeemed,
    rewards_pending = EXCLUDED.rewards_pending,
    unique_customers = EXCLUDED.unique_customers,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update today's analytics when new stamp card is created
CREATE OR REPLACE FUNCTION trigger_update_analytics_on_card_create()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_daily_analytics(NEW.merchant_id, CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_on_new_card
AFTER INSERT ON stamp_cards
FOR EACH ROW
EXECUTE FUNCTION trigger_update_analytics_on_card_create();

-- Trigger to update today's analytics when stamps are given
CREATE OR REPLACE FUNCTION trigger_update_analytics_on_stamp()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_daily_analytics(NEW.merchant_id, CURRENT_DATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_on_stamp_given
AFTER INSERT ON stamp_history
FOR EACH ROW
EXECUTE FUNCTION trigger_update_analytics_on_stamp();

COMMENT ON TABLE daily_analytics IS 'Pre-aggregated daily analytics for faster chart rendering and accurate historical data';
