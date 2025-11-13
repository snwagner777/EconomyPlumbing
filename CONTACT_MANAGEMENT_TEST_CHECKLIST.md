# Contact Management Testing Checklist

## **Setup & Access**
- [ ] Log into Customer Portal successfully
- [ ] Navigate to a location with existing contacts
- [ ] Click "Manage Contacts" button on a location card
- [ ] Verify "Manage Location Contacts" dialog opens

## **View Contacts (Basic Display)**
- [ ] Confirm all existing contacts are displayed
- [ ] Verify contact names are shown correctly
- [ ] Verify contact titles are shown (if present)
- [ ] Check that phone numbers display with proper formatting
- [ ] Check that email addresses display correctly
- [ ] Verify icons show correctly (phone icon for phones, envelope for emails)

## **Phone Type Support (Critical)**
- [ ] Test contact with **MobilePhone** - should display and be editable
- [ ] Test contact with **HomePhone** - should display and be editable
- [ ] Test contact with **WorkPhone** - should display and be editable
- [ ] Test contact with any other phone type variant - should work

## **Edit Contact Flow**
- [ ] Click Edit button (pencil icon) on a contact
- [ ] Verify Edit Contact dialog opens
- [ ] Confirm name field is pre-filled correctly
- [ ] Confirm phone field is pre-filled correctly
- [ ] Confirm email field is pre-filled correctly
- [ ] Modify the name and click "Save Changes"
- [ ] Verify success toast notification appears
- [ ] Verify contact list refreshes with updated name
- [ ] Edit phone number and save
- [ ] Edit email address and save
- [ ] Edit all fields at once and save
- [ ] Click "Cancel" button - verify dialog closes without saving

## **Delete Contact Flow**
- [ ] Click Delete button (alert icon) on a contact
- [ ] Verify Delete Confirmation dialog opens
- [ ] Confirm contact details are shown in confirmation
- [ ] Click "Cancel" - verify dialog closes without deleting
- [ ] Click Delete button again
- [ ] Click "Delete Contact" - verify success toast appears
- [ ] Verify contact is removed from the list
- [ ] Verify contact list refreshes

## **Business Rules**
- [ ] Try to delete the **last contact** on account - should see error message "Cannot delete the last contact"
- [ ] Verify you can delete a contact when multiple contacts exist
- [ ] Add a new contact, then delete it - should work

## **Multi-Location Scenarios (Critical)**
- [ ] Test editing a contact that appears on **multiple locations**
- [ ] Test deleting a contact linked to **multiple locations**
- [ ] Test editing a **location-only contact** (not at customer level)
- [ ] Test deleting a **location-only contact**

## **Add New Contact (Existing Feature)**
- [ ] Scroll to "Add New Contact" section at bottom of dialog
- [ ] Add a new contact with name, phone, and email
- [ ] Verify it appears in the contact list
- [ ] Verify the newly added contact can be edited
- [ ] Verify the newly added contact can be deleted

## **Loading States**
- [ ] During edit, verify "Updating..." text and spinner appear
- [ ] During delete, verify "Deleting..." text and spinner appear
- [ ] Verify buttons are disabled during mutations
- [ ] Verify rapid clicking doesn't cause duplicate submissions

## **Error Handling**
- [ ] Test with poor network connection (if possible)
- [ ] Verify error toast appears on API failures
- [ ] Verify dialog state recovers properly after errors

## **Edge Cases**
- [ ] Contact with name but no phone or email
- [ ] Contact with phone but no name
- [ ] Contact with email but no phone
- [ ] Contact with multiple phone numbers
- [ ] Contact with multiple email addresses
- [ ] Very long contact names
- [ ] International phone numbers

## **Most Critical Tests**
The following are the most important scenarios to verify, as they were the main bug fixes:

1. **Phone Type Support**: Ensure contacts with HomePhone, WorkPhone, etc. can be edited
2. **Multi-Location Scenarios**: Test editing/deleting contacts that exist across multiple locations
3. **Location-Only Contacts**: Test contacts linked to locations but not to the customer directly
