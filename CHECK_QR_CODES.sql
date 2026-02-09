-- Check QR code uniqueness and see which cards have which QR codes

SELECT 
  id,
  name,
  card_name,
  qr_code_id,
  SUBSTRING(qr_code_id, 1, 12) || '...' as qr_preview,
  created_by_user_id,
  is_active,
  created_at
FROM merchant_cards
WHERE is_active = true
ORDER BY created_at DESC;

-- Check for duplicate QR codes
SELECT 
  qr_code_id,
  COUNT(*) as count,
  STRING_AGG(name || ' (' || card_name || ')', ', ') as cards_with_same_qr
FROM merchant_cards
WHERE is_active = true AND qr_code_id IS NOT NULL
GROUP BY qr_code_id
HAVING COUNT(*) > 1;
