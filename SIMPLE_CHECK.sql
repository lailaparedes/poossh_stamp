-- What's ACTUALLY in merchant_card_analytics for your card?
SELECT 
  mc.name as card_name,
  mca.*
FROM merchant_card_analytics mca
JOIN merchant_cards mc ON mc.id = mca.merchant_card_id
WHERE mc.name = 'NewTest' OR mc.name = 'first card1 finally';

-- If empty, check if the card exists
SELECT id, name FROM merchant_cards 
WHERE name = 'NewTest' OR name = 'first card1 finally';
