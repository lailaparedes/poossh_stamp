# Card Name Feature - Implementation Summary

## Overview
Added a new `card_name` field that allows merchants to set a customer-facing name for their loyalty cards, separate from their business name.

## What Changed

### 1. Database Schema ✅
**File**: `backend/scripts/add-card-name-field.sql`

Added `card_name` column to `merchant_cards` table:
```sql
ALTER TABLE merchant_cards 
ADD COLUMN IF NOT EXISTS card_name TEXT;

UPDATE merchant_cards 
SET card_name = name 
WHERE card_name IS NULL;
```

**Status**: Run this SQL script in Supabase to add the column.

---

### 2. Backend API Updates ✅

**File**: `routes/merchants.js`

Updated endpoints to support `card_name`:

1. **POST /api/merchants/create-loyalty-program**
   - Now accepts `cardName` in request body
   - Stores as `card_name` in database
   - Falls back to `businessName` if not provided

2. **POST /api/merchants/create**
   - Now accepts `cardName` in request body
   - Stores as `card_name` in database
   - Falls back to `businessName` if not provided

3. **PUT /api/merchants/:merchantId**
   - Now accepts `cardName` in request body
   - Updates `card_name` field when provided

4. **POST /api/merchants/validate-qr**
   - Returns `card_name` as the primary name in validation response
   - Mobile app will see `card_name` when scanning QR codes
   - Falls back to `name` if `card_name` is not set

---

### 3. Frontend Updates ✅

#### Setup Page (`frontend/src/components/Setup.js`)
- Added "Card Name" input field at the top of the form
- Shows placeholder based on business name
- Helper text: "This is what customers see when they scan your QR code"
- Required field

#### My Cards Page (`frontend/src/components/MyCards.js`)
- **Card List Display**: Shows `card_name` instead of `name` in card tiles
- **Create Form**: Added "Card Name" field with helper text
- Falls back to `name` if `card_name` is not set

#### Dashboard Page (`frontend/src/components/Dashboard.js`)
- **Header**: Displays `card_name` as the primary card name
- **Edit Form**: Added "Card Name" input field
- Populates form with existing `card_name` value
- Falls back to `name` if `card_name` is not set

---

## User Experience

### For Merchants:
1. **Creating a Card**: First field is "Card Name" - what customers will see
2. **Viewing Cards**: Card list shows the customer-facing name
3. **Editing Cards**: Can update the card name anytime
4. **Dashboard**: Shows the card name at the top

### For Customers (Mobile App):
- When scanning a QR code, they see the `card_name`
- Example: "Coffee Rewards" instead of "Java Coffee Shop LLC"
- More friendly and marketing-focused names

---

## Field Hierarchy

```
card_name (Customer-facing)
   ↓
   Falls back to:
   ↓
name (Business name)
```

**Example**:
- Business Name: "Java Coffee Shop"
- Card Name: "☕ Coffee Rewards Card"
- Customers see: "☕ Coffee Rewards Card"

---

## API Response Format

### Before:
```json
{
  "id": "uuid",
  "name": "Java Coffee Shop",
  "logo": "☕",
  ...
}
```

### After:
```json
{
  "id": "uuid",
  "name": "Java Coffee Shop",           // Business name
  "card_name": "Coffee Rewards Card",   // Customer-facing name
  "logo": "☕",
  ...
}
```

---

## Mobile App Integration

The QR validation endpoint now returns:
```json
{
  "success": true,
  "valid": true,
  "merchant": {
    "id": "uuid",
    "name": "Coffee Rewards Card",  // This is card_name (customer sees this)
    "businessName": "Java Coffee Shop",  // Internal business name
    "logo": "☕",
    "stampsRequired": 10,
    ...
  }
}
```

**Mobile app should display**: `merchant.name` (which is the card_name)

---

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Create a new card and set a custom Card Name
- [ ] Verify card name appears in My Cards list
- [ ] Verify card name appears in Dashboard header
- [ ] Edit an existing card and update the Card Name
- [ ] Scan QR code in mobile app - verify card name appears
- [ ] Check that old cards without card_name fallback to name correctly

---

## Files Modified

### Backend:
- ✅ `routes/merchants.js` - Added card_name support to all endpoints
- ✅ `backend/scripts/add-card-name-field.sql` - Database migration

### Frontend:
- ✅ `frontend/src/components/Setup.js` - Added Card Name field
- ✅ `frontend/src/components/MyCards.js` - Added Card Name field and display
- ✅ `frontend/src/components/Dashboard.js` - Added Card Name field and display

### Status:
- ✅ Backend deployed
- ✅ Frontend built and deployed
- ⚠️ Database migration pending (run SQL script)

---

## Next Steps

1. **Run the SQL migration** in Supabase SQL Editor
2. **Test creating a new card** with a custom card name
3. **Update mobile app** to use the card_name from validation response
4. **Test QR scanning** to verify customers see the card name

---

## Benefits

✅ **Marketing Freedom**: Merchants can use creative, customer-friendly names  
✅ **Branding**: Better control over how cards appear to customers  
✅ **Flexibility**: Business name stays formal, card name can be casual  
✅ **Backward Compatible**: Falls back gracefully for existing cards  
✅ **Multi-Card Support**: Each card can have its own unique customer-facing name
