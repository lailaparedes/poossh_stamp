# Mobile App QR Code Integration Guide

## Overview
This guide explains how the PunchMe mobile app should integrate with the merchant portal backend to handle QR code scanning and stamp card creation correctly.

## Current Database State

### Merchant Cards (Active)
| Card Name   | Card ID                              | QR Code ID                           |
|-------------|--------------------------------------|--------------------------------------|
| Java Coffee | 40ce7168-0c36-44a3-8228-cd7cd902d238 | fc578051-61e2-46f3-8772-4de0c1a166f7 |
| newbuiz     | 105cbfe7-1ea8-49d8-aaad-8f4599067e44 | 3cbd7424-703d-45a5-af66-efa083ac0de0 |

**Important:** All cards share `common_merchant_id: merchant-20525f39-d567-40e7-8a5e-def9444a64cc`

## QR Code Structure

When a merchant generates a QR code, it contains:

```json
{
  "type": "PUNCHME_MERCHANT",
  "merchantId": "40ce7168-0c36-44a3-8228-cd7cd902d238",
  "qrCodeId": "fc578051-61e2-46f3-8772-4de0c1a166f7",
  "timestamp": "2026-02-07T23:00:00.000Z"
}
```

- `merchantId`: The **specific** merchant card ID (NOT common_merchant_id)
- `qrCodeId`: Unique ID that must match the database for validation
- Each card has a **unique** QR code

## Mobile App Flow

### 1. Scan QR Code
```javascript
// Customer scans QR code
const qrData = JSON.parse(scannedQRCodeString);
const { merchantId, qrCodeId } = qrData;
```

### 2. Validate QR Code
```javascript
// Call validation endpoint
const response = await fetch('http://localhost:3000/api/merchants/validate-qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ merchantId, qrCodeId })
});

const result = await response.json();

if (!result.valid) {
  // Show error to user
  alert(result.error); // e.g., "This QR code has been replaced"
  return;
}

// result.merchant contains:
// {
//   id: "40ce7168-0c36-44a3-8228-cd7cd902d238",
//   name: "Java Coffee",
//   stampsRequired: 10,
//   rewardDescription: "Free coffee",
//   ...
// }
```

### 3. Create or Update Stamp Card ⚠️ CRITICAL

**ALWAYS use `result.merchant.id` as the `merchant_id`**

```javascript
// Check if user already has a stamp card for THIS specific merchant
const { data: existingCard } = await supabase
  .from('stamp_cards')
  .select('*')
  .eq('user_id', currentUserId)
  .eq('merchant_id', result.merchant.id) // ✅ Use specific card ID
  .single();

if (existingCard) {
  // Update existing card
  await supabase
    .from('stamp_cards')
    .update({ current_stamps: existingCard.current_stamps + 1 })
    .eq('id', existingCard.id);
} else {
  // Create new stamp card
  await supabase
    .from('stamp_cards')
    .insert({
      user_id: currentUserId,
      merchant_id: result.merchant.id, // ✅ Use specific card ID from validation
      current_stamps: 1
    });
}
```

## Common Mistakes ❌

### ❌ WRONG: Using common_merchant_id
```javascript
// DON'T DO THIS
const { data: merchant } = await supabase
  .from('merchant_cards')
  .select('*')
  .eq('common_merchant_id', someCommonId)
  .single(); // This might return the wrong card!

// Create stamp card
await supabase.from('stamp_cards').insert({
  merchant_id: merchant.id // This could be the wrong card!
});
```

### ✅ CORRECT: Using validated merchantId
```javascript
// DO THIS
const validationResult = await validateQR(merchantId, qrCodeId);
if (validationResult.valid) {
  // Use the exact merchant ID from validation
  await supabase.from('stamp_cards').insert({
    merchant_id: validationResult.merchant.id // Correct specific card!
  });
}
```

## Testing Endpoints

### 1. Test QR Uniqueness
```bash
curl http://localhost:3000/api/merchants/test-qr-uniqueness
```

Returns all active cards with their QR codes and checks for duplicates.

### 2. Debug Merchant Info
```bash
curl http://localhost:3000/api/merchants/debug/40ce7168-0c36-44a3-8228-cd7cd902d238
```

Returns current QR code info for a specific merchant card.

### 3. Validate QR Code
```bash
curl -X POST http://localhost:3000/api/merchants/validate-qr \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "40ce7168-0c36-44a3-8228-cd7cd902d238",
    "qrCodeId": "fc578051-61e2-46f3-8772-4de0c1a166f7"
  }'
```

## Important Notes

1. **QR codes are unique per card** - Each merchant card has its own QR code
2. **QR codes can be regenerated** - Old QR codes become invalid when regenerated
3. **common_merchant_id is for grouping only** - Don't use it for stamp card creation
4. **Always validate before creating stamps** - Never trust the QR data alone

## Debugging Checklist

If stamps are going to the wrong card:

- [ ] Are you validating the QR code via `/validate-qr` endpoint?
- [ ] Are you using `result.merchant.id` from validation response?
- [ ] Are you checking `merchant_id` matches in the database?
- [ ] Are you using the latest QR code (not a regenerated one)?
- [ ] Check stamp_cards table to see which merchant_id is being used

## SQL Queries for Debugging

### Check which cards have stamps
```sql
SELECT 
  mc.name,
  COUNT(sc.id) as stamp_cards_count,
  SUM(sc.current_stamps) as total_stamps
FROM merchant_cards mc
LEFT JOIN stamp_cards sc ON sc.merchant_id = mc.id
WHERE mc.is_active = true
GROUP BY mc.id, mc.name;
```

### See recent stamp activity
```sql
SELECT 
  sc.id,
  mc.name as merchant_name,
  sc.current_stamps,
  sc.created_at
FROM stamp_cards sc
LEFT JOIN merchant_cards mc ON sc.merchant_id = mc.id
ORDER BY sc.created_at DESC
LIMIT 10;
```

---

## Summary

The key principle: **Use the merchant ID from the QR validation response** (`result.merchant.id`), not `common_merchant_id`, to create or update stamp cards. This ensures each card's stamps are tracked separately.
