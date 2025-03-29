
// This is a sample Google Apps Script code for your backend
// To use it:
// 1. Go to script.google.com and create a new project
// 2. Copy this code into the project
// 3. Deploy as a web app (Publish > Deploy as web app)
// 4. Set access to "Anyone, even anonymous"
// 5. Copy the web app URL and replace INVENTORY_API_URL in your frontend code

// Global variables
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your Google Sheet ID
const API_KEY = 'YOUR_SECRET_API_KEY'; // Replace with a secure API key
const ADMIN_USERNAME = 'admin'; // Replace with your admin username
const ADMIN_PASSWORD = 'password'; // Replace with a secure password (store hashed in production)

// Set up CORS headers for cross-origin requests
const setCorsHeaders = (response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// Open the spreadsheet and get the sheet by name or index
const getSheet = (sheetName) => {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
};

// Main function to handle HTTP requests
function doGet(e) {
  const response = { success: false, error: 'Unknown action' };
  setCorsHeaders(ContentService.createTextOutput());
  
  try {
    // Verify API key for certain actions
    const isAdminAction = e.parameter.action !== 'getBatches' && e.parameter.action !== 'getTimeSlots';
    if (isAdminAction && e.parameter.apiKey !== API_KEY) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unauthorized access'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Route to appropriate handler based on action
    switch (e.parameter.action) {
      case 'getBatches':
        response.success = true;
        response.batches = getBatchesFromSheet(e.parameter.course || 'default');
        break;
      case 'getTimeSlots':
        response.success = true;
        response.timeSlots = getTimeSlotsFromSheet(e.parameter.course || 'default');
        break;
      default:
        // Unknown action
        break;
    }
  } catch (error) {
    response.error = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests
function doPost(e) {
  const response = { success: false, error: 'Unknown action' };
  setCorsHeaders(ContentService.createTextOutput());
  
  try {
    // Parse the request body
    const requestData = JSON.parse(e.postData.contents);
    
    // Verify API key for non-authentication actions
    if (requestData.action !== 'authenticateAdmin' && requestData.apiKey !== API_KEY) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unauthorized access'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Route to appropriate handler based on action
    switch (requestData.action) {
      case 'updateInventory':
        updateInventoryInSheet(
          requestData.course || 'default',
          requestData.date,
          requestData.timeSlot,
          requestData.decrementBy || 1
        );
        response.success = true;
        // Return updated data
        response.updatedBatches = getBatchesFromSheet(requestData.course || 'default');
        response.updatedTimeSlots = getTimeSlotsFromSheet(requestData.course || 'default');
        break;
      case 'manualUpdateInventory':
        updateInventoryManually(
          requestData.course || 'default',
          requestData.date,
          requestData.timeSlot,
          requestData.newCount
        );
        response.success = true;
        // Return updated data
        response.updatedBatches = getBatchesFromSheet(requestData.course || 'default');
        response.updatedTimeSlots = getTimeSlotsFromSheet(requestData.course || 'default');
        break;
      case 'authenticateAdmin':
        response.success = true;
        response.authenticated = 
          requestData.username === ADMIN_USERNAME && 
          requestData.password === ADMIN_PASSWORD;
        break;
      default:
        // Unknown action
        break;
    }
  } catch (error) {
    response.error = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to get available batches from the sheet
function getBatchesFromSheet(course) {
  // Get the course-specific sheet or create if it doesn't exist
  const sheet = getOrCreateCourseSheet(course);
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  const batches = [];
  for (let i = 1; i < data.length; i++) {
    // Check if this is a batch row (column A is a date)
    if (data[i][0] && data[i][0] !== '' && !data[i][0].includes(':')) {
      batches.push({
        date: data[i][0],
        slotsAvailable: parseInt(data[i][1]) || 0
      });
    }
  }
  
  return batches;
}

// Function to get available time slots from the sheet
function getTimeSlotsFromSheet(course) {
  // Get the course-specific sheet or create if it doesn't exist
  const sheet = getOrCreateCourseSheet(course);
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  const timeSlots = [];
  for (let i = 1; i < data.length; i++) {
    // Check if this is a time slot row (column A contains a time with :)
    if (data[i][0] && data[i][0] !== '' && data[i][0].includes(':')) {
      timeSlots.push({
        slot: data[i][0],
        slotsAvailable: parseInt(data[i][1]) || 0
      });
    }
  }
  
  return timeSlots;
}

// Function to update inventory after a booking
function updateInventoryInSheet(course, date, timeSlot, decrementBy) {
  // Get the course-specific sheet
  const sheet = getOrCreateCourseSheet(course);
  const data = sheet.getDataRange().getValues();
  
  // Find the time slot row
  let timeSlotRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === timeSlot) {
      timeSlotRow = i + 1; // +1 because sheets are 1-indexed
      break;
    }
  }
  
  if (timeSlotRow > 0) {
    // Update the available slots
    const currentValue = sheet.getRange(timeSlotRow, 2).getValue();
    const newValue = Math.max(0, currentValue - decrementBy);
    sheet.getRange(timeSlotRow, 2).setValue(newValue);
  }
  
  // Find and update the batch date row
  let batchRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === date) {
      batchRow = i + 1; // +1 because sheets are 1-indexed
      break;
    }
  }
  
  if (batchRow > 0) {
    // Update the available slots for the batch
    const currentValue = sheet.getRange(batchRow, 2).getValue();
    const newValue = Math.max(0, currentValue - decrementBy);
    sheet.getRange(batchRow, 2).setValue(newValue);
  }
  
  // Also record the booking in the bookings sheet
  recordBooking(course, date, timeSlot);
}

// Function to manually update inventory
function updateInventoryManually(course, date, timeSlot, newCount) {
  // Get the course-specific sheet
  const sheet = getOrCreateCourseSheet(course);
  const data = sheet.getDataRange().getValues();
  
  // Find the time slot row
  let timeSlotRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === timeSlot) {
      timeSlotRow = i + 1; // +1 because sheets are 1-indexed
      break;
    }
  }
  
  if (timeSlotRow > 0) {
    // Update the available slots
    sheet.getRange(timeSlotRow, 2).setValue(newCount);
  }
  
  // Find and update the batch date row
  let batchRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === date) {
      batchRow = i + 1; // +1 because sheets are 1-indexed
      break;
    }
  }
  
  if (batchRow > 0) {
    // Update the available slots for the batch
    sheet.getRange(batchRow, 2).setValue(newCount);
  }
}

// Helper function to get or create a course-specific sheet
function getOrCreateCourseSheet(course) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(course);
  
  if (!sheet) {
    // Create a new sheet for this course
    sheet = ss.insertSheet(course);
    
    // Set up headers
    sheet.getRange('A1:B1').setValues([['Date/Time Slot', 'Available Slots']]);
    
    // Add some sample data
    const sampleDates = [
      "April 1, 2024",
      "April 2, 2024",
      "April 3, 2024",
      "April 4, 2024",
      "April 5, 2024"
    ];
    
    const sampleTimeSlots = [
      "10:00 AM - 12:00 PM",
      "2:00 PM - 4:00 PM"
    ];
    
    let row = 2;
    
    // Add dates
    for (const date of sampleDates) {
      sheet.getRange(row, 1, 1, 2).setValues([[date, 10]]);
      row++;
    }
    
    // Add time slots
    for (const slot of sampleTimeSlots) {
      sheet.getRange(row, 1, 1, 2).setValues([[slot, 10]]);
      row++;
    }
  }
  
  return sheet;
}

// Function to record bookings in a separate sheet
function recordBooking(course, date, timeSlot) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let bookingsSheet = ss.getSheetByName('Bookings');
  
  if (!bookingsSheet) {
    // Create a new sheet for bookings
    bookingsSheet = ss.insertSheet('Bookings');
    bookingsSheet.getRange('A1:D1').setValues([['Course', 'Date', 'Time Slot', 'Booking Time']]);
  }
  
  // Add the new booking
  const lastRow = bookingsSheet.getLastRow() + 1;
  bookingsSheet.getRange(lastRow, 1, 1, 4).setValues([
    [course, date, timeSlot, new Date()]
  ]);
}
