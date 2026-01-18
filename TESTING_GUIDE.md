# FurniSouq Testing Guide

## Test Accounts

### Admin Account
- **Email:** admin@furnisouq.com
- **Password:** admin123
- **Access:** Full admin dashboard with all management features

### Buyer Accounts
1. **Ahmed Al-Salem**
   - **Email:** buyer1@example.com
   - **Password:** buyer123

2. **Fatima Al-Rashid**
   - **Email:** buyer2@example.com
   - **Password:** buyer123

3. **Mohammed Al-Qahtani**
   - **Email:** buyer3@example.com
   - **Password:** buyer123

### Seller Accounts
1. **Royal Furniture House** (Riyadh)
   - **Email:** seller1@example.com
   - **Password:** seller123
   - **Status:** Approved

2. **Modern Living KSA** (Jeddah)
   - **Email:** seller2@example.com
   - **Password:** seller123
   - **Status:** Approved

## Latest Features

### Homepage Layout
✅ **Hero Section:** 3 equal-sized images in one row, same height and width
✅ **Product Grid:** Exactly 4 products per row with equal spacing
✅ **All Categories:** 9 categories displayed in header
✅ **Search Bar:** Working real-time search functionality
✅ **Filters:** English on left, Arabic on right (synchronized)

### Account System
✅ **User Icon:** Click to see dropdown menu
✅ **Buyer Account:** Separate clickable option with name, email, password, phone, city
✅ **Seller Account:** Separate clickable option with business registration

### Seller Registration (All Fields Working)
- Business Name
- Contact Email
- Contact Number
- City (dropdown)
- Commercial Registration (CR) upload ready
- Bank Account Details:
  - Bank Name
  - Account Number
  - IBAN
- Submit button fully functional
- Admin approval required

### Product Detail Page
✅ **Back Button:** Returns to home page
✅ **Large Image Gallery:** Multiple images with thumbnails
✅ **Product Info:** Full details, price, description
✅ **Quantity Selector:** +/- buttons
✅ **Add to Cart:** Functional button
✅ **Buy Now:** Creates order instantly
✅ **Seller Info Card:** Contact seller option

### All Buttons Working
✅ Category filters (all 9 categories)
✅ Product cards (clickable, navigate to detail page)
✅ Add to Cart buttons (cart counter updates)
✅ Buy Now buttons (creates order)
✅ Back buttons (on all pages)
✅ User account dropdown
✅ Search bar (real-time filtering)
✅ Filter checkboxes and radios
✅ Price range slider
✅ Quantity +/- buttons
✅ Submit registration button

## Admin Panel Features

**Full Dashboard:**
- Statistics: Sellers, Buyers, Products, Orders, Revenue
- Seller Approvals (approve/reject with notifications)
- User Management (search, suspend, delete)
- Order Monitoring
- Payment Management (9% + 15% VAT)
- Complete analytics

## Sample Data

5 Products available:
1. Elegant Living Room Set - 12,500 SR (Riyadh)
2. Modern TV Unit - 3,500 SR (Riyadh)
3. Custom Kitchen Cabinets - 25,000 SR (Jeddah)
4. Luxury Bedroom Set - 18,000 SR (Jeddah)
5. Executive Office Desk - 4,500 SR (Riyadh)

## Testing Complete Flow

### Buyer Journey
1. Click user icon → Select "Buyer Account"
2. Register with name, email, password, phone, city
3. Browse products (4 per row, equal spacing)
4. Use search bar to find products
5. Click product card to view details
6. Adjust quantity
7. Click "Buy Now" or "Add to Cart"
8. View order in dashboard

### Seller Journey
1. Click user icon → Select "Seller Account"
2. Fill complete registration form
3. Submit (status: Pending Approval)
4. Admin approves
5. Access seller dashboard
6. Add products
7. Manage orders

### Admin Journey
1. Login as admin
2. View dashboard statistics
3. Approve/reject sellers
4. Manage all users
5. Monitor orders and payments

## Layout Verified

- 3 hero images: Equal size, same row ✅
- 4 products per row: Equal spacing ✅
- Filters: English left, Arabic right ✅
- All buttons: Clickable and functional ✅
- Back buttons: On all sub-pages ✅
- Search: Working real-time ✅
- Categories: All displayed ✅

Build completed successfully!
