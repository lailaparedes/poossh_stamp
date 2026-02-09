# QR Code Guide - Understanding Unique QR Codes

## ✅ Issue Fixed!

**Problem:** Each loyalty card has its own **unique QR code**, but it wasn't clear which QR code belonged to which card. This caused confusion when merchants had multiple cards.

**Solution:** The dashboard and My Cards page now clearly show which QR code belongs to which card.

---

## 🔍 How QR Codes Work

### Each Card = One Unique QR Code

When you create multiple loyalty cards (e.g., "NewTest", "Yonder1", "Test10"), each card gets its **own unique QR code**.

- **NewTest** card (card_name: "first card1 finally") → Has QR code: `7c350018-ee19-40...`
- **Yonder1** card (card_name: "Card1") → Has QR code: `af6f2c0f-5bbd-46...`
- **Test10** card (card_name: "Reward1") → Has QR code: `fdba610d-1864-4c...`

### ❌ Wrong: Using the Same QR Code for All Cards

If you download the QR code for "NewTest" and try to use it for "Yonder1", it **won't work**. Each card must use its own QR code.

### ✅ Right: Each Card Has Its Own QR Code

1. Go to **My Cards** page
2. You'll see a QR code preview for each card
3. Click **"View Dashboard"** for the card you want
4. Download that specific card's QR code
5. Use that QR code ONLY for that card

---

## 📱 How to Download the Correct QR Code

### Step 1: Navigate to Your Cards
- Go to **"My Cards"** in the navigation menu
- You'll see all your loyalty cards listed
- Each card shows a small QR code preview

### Step 2: Select the Card You Want
- Click **"View Dashboard"** on the specific card
- This switches the dashboard to show that card's data
- The dashboard header will show: **"Customer QR Code for [Card Name]"**

### Step 3: Download the QR Code
- On the dashboard, find the **"Customer QR Code"** section
- It will say: "Customers scan this code to join **[Your Card Name]** loyalty program"
- Click **"Download"** button
- The file will be named: `your_card_name-qr-code.png`

### Step 4: Use the Right QR Code
- Print and display **only that specific QR code** for that card
- Don't use QR codes from other cards
- Each QR code is tied to one specific loyalty program

---

## 🎯 Your Current Cards (As of Feb 8, 2026)

Based on the database check, you have these active cards:

| Card Name | Display Name | QR Code ID (Preview) |
|-----------|--------------|----------------------|
| **Yonder1** | "Card1" | `af6f2c0f-5bbd-46...` |
| **NewTest** | "first card1 finally" | `7c350018-ee19-40...` |
| **Test10** | "Reward1" | `fdba610d-1864-4c...` |

✅ All QR codes are unique - no duplicates found!

---

## 🔄 When to Regenerate QR Codes

### Regenerate if:
- You suspect someone copied your QR code
- You want to invalidate all previously printed QR codes
- Security concerns

### ⚠️ Warning:
When you click "Regenerate QR Code" on the dashboard:
- It creates a **new unique QR code**
- All **previous QR codes become invalid**
- You must **replace all printed QR codes** with the new one

---

## 📊 How Customers Use QR Codes

1. Customer opens the PunchMe mobile app
2. Customer taps "Scan QR Code"
3. Customer scans your card's QR code
4. The app checks:
   - Does this merchant card ID exist? ✓
   - Does this QR code ID match the database? ✓
   - Is the card active? ✓
5. If all checks pass, the customer joins that specific loyalty program

---

## 🛠️ Troubleshooting

### "QR code doesn't work!"

**Check:**
1. Are you using the correct QR code for that specific card?
2. Is the card active in your dashboard?
3. Did you regenerate the QR code recently? (Old codes won't work)

**Solution:**
1. Go to My Cards page
2. Click "View Dashboard" for the problematic card
3. Check if QR code exists
4. If not, click "Generate QR Code"
5. Download and use the new QR code

### "Customers are joining the wrong card!"

**Problem:** You displayed the QR code from Card A, but customers are joining Card B.

**Solution:**
1. Check which card is currently active on your dashboard
2. Download the QR code for the specific card you want customers to join
3. Verify the QR code filename matches the card name
4. Replace the printed QR code with the correct one

---

## ✨ New Features (Feb 8, 2026)

### Dashboard Improvements
- ✓ Shows which card the QR code belongs to in the header
- ✓ Warning message: "Each card has its own unique QR code"
- ✓ QR code filename includes the card name
- ✓ Clearer success messages when downloading

### My Cards Page
- ✓ Shows QR code preview for each card
- ✓ Visual indicator showing "Unique QR Code"
- ✓ Makes it obvious that each card has its own QR code
- ✓ No more confusion about which QR belongs to which card

---

## 📝 Best Practices

1. **Label your printed QR codes** - Write the card name on the printout
2. **Keep track of which QR goes where** - Don't mix them up
3. **Test before printing** - Scan with the mobile app to verify it works
4. **Update promptly** - If you regenerate, replace all printed copies
5. **One QR per card** - Never use the same QR for multiple cards

---

## 🎉 You're All Set!

Your QR codes are working correctly. Each card has its own unique QR code, and the dashboard now makes it crystal clear which QR belongs to which card.

**Next Steps:**
1. Visit https://your-site.onrender.com/my-cards
2. You'll see all your cards with their QR previews
3. Click "View Dashboard" for each card to download its specific QR code
4. Print and display the correct QR code for each loyalty program

Need help? Check the dashboard - it now shows exactly which card you're viewing!
