// This file handles communication with the Pabbly webhook and Google Apps Script

const PABBLY_WEBHOOK_URL = 'https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjYwNTY5MDYzMzA0MzM1MjZhNTUzYzUxMzEi_pc';
// Replace this with your published Google Apps Script web app URL
const INVENTORY_API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Add LocalStorage keys for caching inventory data
const LS_BATCHES_KEY = 'form_embed_batches';
const LS_TIMESLOTS_KEY = 'form_embed_timeslots';
const LS_LAST_FETCH_KEY = 'form_embed_last_fetch';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Add new constants for storing course configuration in localStorage
const LS_COURSE_VISIBILITY_KEY = 'form_embed_course_visibility';
const LS_COURSE_ELIGIBILITY_KEY = 'form_embed_course_eligibility';
const LS_COURSE_MODES_KEY = 'form_embed_course_modes';
const LS_COURSE_CENTRES_KEY = 'form_embed_course_centres';

// Default eligibility configuration
export const DEFAULT_ELIGIBILITY = {
  "ai-lvl1": ["junior", "senior", "senior-secondary"],
  "robotics-lvl1": ["junior", "senior", "senior-secondary"],
  "python-lvl1": ["junior", "senior", "senior-secondary"],
  "python-lvl2": ["senior", "senior-secondary"],
  "ai-lvl2": ["senior", "senior-secondary"],
  "drone": ["senior", "senior-secondary"],
};

// Add functions to get and set course visibility
export const getCourseVisibility = (): Record<string, boolean> => {
  try {
    const storedVisibility = localStorage.getItem(LS_COURSE_VISIBILITY_KEY);
    if (storedVisibility) {
      return JSON.parse(storedVisibility);
    }
  } catch (e) {
    console.error('Error getting course visibility from localStorage:', e);
  }
  
  // Default all courses to visible
  return {
    "ai-lvl1": true,
    "robotics-lvl1": true,
    "python-lvl1": true,
    "python-lvl2": true,
    "ai-lvl2": true,
    "drone": true,
  };
};

export const setCourseVisibility = (visibility: Record<string, boolean>): void => {
  try {
    localStorage.setItem(LS_COURSE_VISIBILITY_KEY, JSON.stringify(visibility));
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('courseConfigChanged'));
  } catch (e) {
    console.error('Error saving course visibility to localStorage:', e);
  }
};

// Add functions to get and set course eligibility by grade
export const getCourseEligibility = (): Record<string, string[]> => {
  try {
    const storedEligibility = localStorage.getItem(LS_COURSE_ELIGIBILITY_KEY);
    if (storedEligibility) {
      return JSON.parse(storedEligibility);
    }
  } catch (e) {
    console.error('Error getting course eligibility from localStorage:', e);
  }
  
  // Return default eligibility
  return DEFAULT_ELIGIBILITY;
};

export const setCourseEligibility = (eligibility: Record<string, string[]>): void => {
  try {
    localStorage.setItem(LS_COURSE_ELIGIBILITY_KEY, JSON.stringify(eligibility));
    // Trigger storage event for other tabs/components
    window.dispatchEvent(new Event('courseConfigChanged'));
  } catch (e) {
    console.error('Error saving course eligibility to localStorage:', e);
  }
};

// Add functions to get and set course modes
export const getCourseModes = (): Record<string, string[]> => {
  try {
    const storedModes = localStorage.getItem(LS_COURSE_MODES_KEY);
    if (storedModes) {
      return JSON.parse(storedModes);
    }
  } catch (e) {
    console.error('Error getting course modes from localStorage:', e);
  }
  
  // Default all courses to have both online and offline modes
  return {
    "ai-lvl1": ["online", "offline"],
    "robotics-lvl1": ["online", "offline"],
    "python-lvl1": ["online", "offline"],
    "python-lvl2": ["online", "offline"],
    "ai-lvl2": ["online", "offline"],
    "drone": ["online", "offline"],
  };
};

export const setCourseModes = (modes: Record<string, string[]>): void => {
  try {
    localStorage.setItem(LS_COURSE_MODES_KEY, JSON.stringify(modes));
    
    // For debugging
    console.log('Course modes updated in localStorage:', modes);
    
    // No need to manually trigger the event here as it should be done by the component
  } catch (e) {
    console.error('Error saving course modes to localStorage:', e);
  }
};

// Add functions to get and set course centres
export const getCourseCentres = (): Record<string, string[]> => {
  try {
    const storedCentres = localStorage.getItem(LS_COURSE_CENTRES_KEY);
    if (storedCentres) {
      return JSON.parse(storedCentres);
    }
  } catch (e) {
    console.error('Error getting course centres from localStorage:', e);
  }
  
  // Default all courses to have both centers
  return {
    "ai-lvl1": ["delhi", "gurugram"],
    "robotics-lvl1": ["delhi", "gurugram"],
    "python-lvl1": ["delhi", "gurugram"],
    "python-lvl2": ["delhi", "gurugram"],
    "ai-lvl2": ["delhi", "gurugram"],
    "drone": ["delhi", "gurugram"],
  };
};

export const setCourseCentres = (centres: Record<string, string[]>): void => {
  try {
    localStorage.setItem(LS_COURSE_CENTRES_KEY, JSON.stringify(centres));
    
    // For debugging
    console.log('Course centres updated in localStorage:', centres);
    
    // No need to manually trigger the event here as it should be done by the component
  } catch (e) {
    console.error('Error saving course centres to localStorage:', e);
  }
};

// Convert class grade to category (junior, senior, senior-secondary)
export const getGradeCategory = (grade: string): string => {
  const gradeNum = parseInt(grade, 10);
  if (gradeNum >= 1 && gradeNum <= 5) {
    return "junior";
  } else if (gradeNum >= 6 && gradeNum <= 8) {
    return "senior";
  } else if (gradeNum >= 9 && gradeNum <= 12) {
    return "senior-secondary";
  }
  return "";
};

export interface FormData {
  name: string;
  email: string;
  phone: string;
  userId: string;
  grade?: string;
  course?: string;
  batchDate?: string;
  timeSlot?: string;
}

export interface InventoryItem {
  date: string;
  slot: string;
  slotsAvailable: number;
}

// Add a global config object that can be set by embedding sites
interface EmbedConfig {
  pabblyWebhookUrl?: string;
  inventoryApiUrl?: string;
  containerSelector?: string;
  apiKey?: string; // Add API key for authentication with Google Apps Script
}

// Global embed config that can be overridden by the embedding site
let embedConfig: EmbedConfig = {};

// Function to configure the embed
export const configureEmbed = (config: EmbedConfig): void => {
  embedConfig = config;
  console.log('Form embed configured with:', config);
};

// Get the actual webhook URL (either default or from embed config)
const getPabblyWebhookUrl = (): string => {
  return embedConfig.pabblyWebhookUrl || PABBLY_WEBHOOK_URL;
};

// Get the actual inventory API URL (either default or from embed config)
const getInventoryApiUrl = (): string => {
  return embedConfig.inventoryApiUrl || INVENTORY_API_URL;
};

// Get API key for authentication
const getApiKey = (): string | undefined => {
  return embedConfig.apiKey;
};

// Helper function to get course-specific cache keys
const getCourseSpecificKey = (baseKey: string, course: string): string => {
  return `${baseKey}_${course || 'default'}`;
};

// Local in-memory cache for batch and timeslot data
const batchesCache: Record<string, Array<{date: string, slotsAvailable: number}>> = {};
const timeSlotsCache: Record<string, Array<{slot: string, slotsAvailable: number}>> = {};

// Function to update local caches after a booking
export const updateLocalCacheAfterBooking = (course: string, date: string, timeSlot: string): void => {
  const courseKey = course || 'default';
  
  if (batchesCache[courseKey]) {
    batchesCache[courseKey] = batchesCache[courseKey].map(batch => 
      batch.date === date
        ? { ...batch, slotsAvailable: Math.max(0, batch.slotsAvailable - 1) }
        : batch
    );
    
    // Update localStorage
    localStorage.setItem(
      getCourseSpecificKey(LS_BATCHES_KEY, courseKey), 
      JSON.stringify(batchesCache[courseKey])
    );
  }
  
  if (timeSlotsCache[courseKey]) {
    timeSlotsCache[courseKey] = timeSlotsCache[courseKey].map(slot => 
      slot.slot === timeSlot
        ? { ...slot, slotsAvailable: Math.max(0, slot.slotsAvailable - 1) }
        : slot
    );
    
    // Update localStorage
    localStorage.setItem(
      getCourseSpecificKey(LS_TIMESLOTS_KEY, courseKey), 
      JSON.stringify(timeSlotsCache[courseKey])
    );
  }
};

export const submitToPabblyWebhook = async (data: FormData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Sending data to Pabbly webhook:', data);
    
    // Create a flattened data structure that ensures all fields are at the root level
    const formattedData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      userId: data.userId,
      grade: data.grade || '',
      course: data.course || '',
      batchDate: data.batchDate || '',
      timeSlot: data.timeSlot || '',
      // Add inventory management field
      requestType: 'booking', // Indicate this is a booking request
    };
    
    // First submit to Pabbly webhook
    const pabblyResponse = await fetch(getPabblyWebhookUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData)
    });
    
    const pabblyResult = await pabblyResponse.json();
    console.log('Pabbly webhook response:', pabblyResult);
    
    // Update our local cache immediately for better UX
    if (data.course && data.batchDate && data.timeSlot) {
      updateLocalCacheAfterBooking(data.course, data.batchDate, data.timeSlot);
      
      // Then try to update inventory via Google Apps Script
      try {
        await updateInventory(data.course, data.batchDate, data.timeSlot);
      } catch (inventoryError) {
        console.error('Failed to update inventory, but booking was submitted:', inventoryError);
        // We still return success since the booking went through and we updated the local cache
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending to Pabbly webhook:', error);
    return {
      success: false,
      error: 'Failed to send data to booking system. Please try again.'
    };
  }
};

// Function to update inventory after a booking
const updateInventory = async (course: string, date: string, timeSlot: string): Promise<void> => {
  const updateData = {
    action: 'updateInventory',
    course,
    date,
    timeSlot,
    decrementBy: 1,
    apiKey: getApiKey(), // Add API key for authentication
  };
  
  try {
    const response = await fetch(getInventoryApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update inventory');
    }
    
    // Parse response to get updated data
    const result = await response.json();
    
    // If the server returned updated inventory, update our cache
    if (result.success && result.updatedBatches && result.updatedTimeSlots) {
      const courseKey = course || 'default';
      batchesCache[courseKey] = result.updatedBatches;
      timeSlotsCache[courseKey] = result.updatedTimeSlots;
      
      // Update localStorage
      localStorage.setItem(
        getCourseSpecificKey(LS_BATCHES_KEY, courseKey), 
        JSON.stringify(batchesCache[courseKey])
      );
      
      localStorage.setItem(
        getCourseSpecificKey(LS_TIMESLOTS_KEY, courseKey), 
        JSON.stringify(timeSlotsCache[courseKey])
      );
      
      localStorage.setItem(
        getCourseSpecificKey(LS_LAST_FETCH_KEY, courseKey), 
        Date.now().toString()
      );
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
    // Still throw the error so the caller can decide what to do
    throw error;
  }
};

// Function to load initial inventory data from localStorage cache
const loadFromLocalStorage = (course: string) => {
  const courseKey = course || 'default';
  
  try {
    const lastFetchStr = localStorage.getItem(getCourseSpecificKey(LS_LAST_FETCH_KEY, courseKey));
    const lastFetch = lastFetchStr ? parseInt(lastFetchStr, 10) : 0;
    const now = Date.now();
    
    // Check if cached data is still valid (less than 5 minutes old)
    if (now - lastFetch < CACHE_DURATION) {
      const batchesStr = localStorage.getItem(getCourseSpecificKey(LS_BATCHES_KEY, courseKey));
      const timeSlotsStr = localStorage.getItem(getCourseSpecificKey(LS_TIMESLOTS_KEY, courseKey));
      
      if (batchesStr) batchesCache[courseKey] = JSON.parse(batchesStr);
      if (timeSlotsStr) timeSlotsCache[courseKey] = JSON.parse(timeSlotsStr);
      
      console.log(`Loaded inventory data for course '${courseKey}' from localStorage cache`);
      return { 
        batchesCache: batchesCache[courseKey], 
        timeSlotsCache: timeSlotsCache[courseKey] 
      };
    }
  } catch (e) {
    console.error('Error loading from localStorage:', e);
  }
  
  return { batchesCache: null, timeSlotsCache: null };
};

// Function to save inventory data to localStorage
const saveToLocalStorage = (course: string, batches: any, timeSlots: any) => {
  const courseKey = course || 'default';
  
  try {
    localStorage.setItem(getCourseSpecificKey(LS_BATCHES_KEY, courseKey), JSON.stringify(batches));
    localStorage.setItem(getCourseSpecificKey(LS_TIMESLOTS_KEY, courseKey), JSON.stringify(timeSlots));
    localStorage.setItem(getCourseSpecificKey(LS_LAST_FETCH_KEY, courseKey), Date.now().toString());
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
};

// Function to get available batches from the Google Sheet via Apps Script
export const getAvailableBatches = async (course: string = 'default'): Promise<Array<{date: string, slotsAvailable: number}>> => {
  const courseKey = course || 'default';
  
  // First check if we have cached data
  if (!batchesCache[courseKey]) {
    const { batchesCache: loadedBatches } = loadFromLocalStorage(courseKey);
    if (loadedBatches) {
      batchesCache[courseKey] = loadedBatches;
      return batchesCache[courseKey];
    }
  } else {
    return batchesCache[courseKey];
  }
  
  try {
    // Add API key to the request for authentication
    const apiKey = getApiKey();
    const apiKeyParam = apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : '';
    const response = await fetch(`${getInventoryApiUrl()}?action=getBatches&course=${encodeURIComponent(courseKey)}${apiKeyParam}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch batch data');
    }
    const data = await response.json();
    
    // Cache the data both in memory and localStorage
    batchesCache[courseKey] = data.batches;
    saveToLocalStorage(courseKey, batchesCache[courseKey], timeSlotsCache[courseKey]);
    
    return data.batches;
  } catch (error) {
    console.error('Error fetching batch data:', error);
    // Return mock data as fallback
    const mockData = generateMockBatchData(courseKey);
    
    // Cache the mock data both in memory and localStorage
    batchesCache[courseKey] = mockData;
    saveToLocalStorage(courseKey, batchesCache[courseKey], timeSlotsCache[courseKey]);
    
    return mockData;
  }
};

// Helper to generate course-specific mock batch data
const generateMockBatchData = (course: string): Array<{date: string, slotsAvailable: number}> => {
  // Generate mock time slots first
  const mockTimeSlots = generateMockTimeSlotData(course);
  
  // Create a map to track total slots per date
  const dateToTotalSlots: Record<string, number> = {
    "April 1, 2024": 0,
    "April 2, 2024": 0,
    "April 3, 2024": 0,
    "April 4, 2024": 0,
    "April 5, 2024": 0,
    "April 6, 2024": 0,
    "April 7, 2024": 0,
    "April 8, 2024": 0,
    "April 9, 2024": 0,
    "April 10, 2024": 0
  };
  
  // For each date, sum up available slots across all time slots
  // Simple mock distribution - distribute time slots across dates
  const timeSlotCount = mockTimeSlots.length;
  let slotIndex = 0;
  
  // Distribute slots across dates (in a real system, you'd have mapping between dates and slots)
  Object.keys(dateToTotalSlots).forEach(date => {
    // Each date gets some of the time slots
    dateToTotalSlots[date] = mockTimeSlots[slotIndex % timeSlotCount].slotsAvailable;
    slotIndex++;
  });
  
  // Create batch data with slot counts being the sum of time slot availability
  return Object.entries(dateToTotalSlots).map(([date, slots]) => ({
    date,
    slotsAvailable: slots
  }));
};

// Helper to generate course-specific mock time slot data
const generateMockTimeSlotData = (course: string): Array<{slot: string, slotsAvailable: number}> => {
  // Generate random slot numbers based on course
  const courseToSeedMap: Record<string, number> = {
    'python': 1,
    'webdev': 2,
    'datascience': 3,
    'machine-learning': 4,
    'robotics': 5,
    'default': 0
  };
  
  const seed = courseToSeedMap[course] || 0;
  
  // Different courses might have different time slots available
  if (course === 'python' || course === 'webdev') {
    return [
      { slot: "10:00 AM - 12:00 PM", slotsAvailable: (4 + seed) % 10 },
      { slot: "2:00 PM - 4:00 PM", slotsAvailable: (6 + seed) % 10 },
      { slot: "5:00 PM - 7:00 PM", slotsAvailable: (3 + seed) % 10 }
    ];
  } else if (course === 'robotics') {
    return [
      { slot: "9:00 AM - 12:00 PM", slotsAvailable: (5 + seed) % 10 },
      { slot: "1:00 PM - 4:00 PM", slotsAvailable: (7 + seed) % 10 }
    ];
  } else {
    return [
      { slot: "11:00 AM - 1:00 PM", slotsAvailable: (4 + seed) % 10 },
      { slot: "3:00 PM - 5:00 PM", slotsAvailable: (6 + seed) % 10 }
    ];
  }
};

// Function to get available time slots from Google Sheet via Apps Script
export const getTimeSlots = async (course: string = 'default'): Promise<Array<{slot: string, slotsAvailable: number}>> => {
  const courseKey = course || 'default';
  
  // First check if we have cached data
  if (!timeSlotsCache[courseKey]) {
    const { timeSlotsCache: loadedTimeSlots } = loadFromLocalStorage(courseKey);
    if (loadedTimeSlots) {
      timeSlotsCache[courseKey] = loadedTimeSlots;
      return timeSlotsCache[courseKey];
    }
  } else {
    return timeSlotsCache[courseKey];
  }
  
  try {
    // Add API key to the request for authentication
    const apiKey = getApiKey();
    const apiKeyParam = apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : '';
    const response = await fetch(`${getInventoryApiUrl()}?action=getTimeSlots&course=${encodeURIComponent(courseKey)}${apiKeyParam}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch time slot data');
    }
    const data = await response.json();
    
    // Cache the data both in memory and localStorage
    timeSlotsCache[courseKey] = data.timeSlots;
    saveToLocalStorage(courseKey, batchesCache[courseKey], timeSlotsCache[courseKey]);
    
    return data.timeSlots;
  } catch (error) {
    console.error('Error fetching time slot data:', error);
    // Return mock data as fallback
    const mockData = generateMockTimeSlotData(courseKey);
    
    // Cache the mock data both in memory and localStorage
    timeSlotsCache[courseKey] = mockData;
    saveToLocalStorage(courseKey, batchesCache[courseKey], timeSlotsCache[courseKey]);
    
    return mockData;
  }
};

// Export a function to manually reset the inventory for testing purposes
export const resetInventory = (course: string = 'default') => {
  const courseKey = course || 'default';
  
  if (batchesCache[courseKey]) delete batchesCache[courseKey];
  if (timeSlotsCache[courseKey]) delete timeSlotsCache[courseKey];
  
  localStorage.removeItem(getCourseSpecificKey(LS_BATCHES_KEY, courseKey));
  localStorage.removeItem(getCourseSpecificKey(LS_TIMESLOTS_KEY, courseKey));
  localStorage.removeItem(getCourseSpecificKey(LS_LAST_FETCH_KEY, courseKey));
};

// Export a function to manually update the inventory (useful for testing)
export const manuallyUpdateInventory = (course: string, date: string, slot: string, newCount: number) => {
  const courseKey = course || 'default';
  
  if (timeSlotsCache[courseKey]) {
    timeSlotsCache[courseKey] = timeSlotsCache[courseKey].map(timeSlot => 
      timeSlot.slot === slot 
        ? { ...timeSlot, slotsAvailable: newCount }
        : timeSlot
    );
    localStorage.setItem(getCourseSpecificKey(LS_TIMESLOTS_KEY, courseKey), JSON.stringify(timeSlotsCache[courseKey]));
    
    // Update batch slots based on the new time slot counts
    if (batchesCache[courseKey]) {
      // For simplicity in this mock system, we're just updating the batch with the same date
      batchesCache[courseKey] = batchesCache[courseKey].map(batch => 
        batch.date === date 
          ? { ...batch, slotsAvailable: newCount } // Set to the same count for simplicity
          : batch
      );
      localStorage.setItem(getCourseSpecificKey(LS_BATCHES_KEY, courseKey), JSON.stringify(batchesCache[courseKey]));
    }
  }
  
  // If we have a valid API URL, send the update to the server
  const apiUrl = getInventoryApiUrl();
  if (apiUrl && apiUrl !== INVENTORY_API_URL) {
    // Send the update to the Google Apps Script backend
    const apiKey = getApiKey();
    const updateData = {
      action: 'manualUpdateInventory',
      course: courseKey,
      date,
      timeSlot: slot,
      newCount,
      apiKey
    };
    
    // Use fire-and-forget approach to avoid blocking UI
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    }).catch(error => {
      console.error('Error updating inventory on server:', error);
    });
  }
};

// Add function to authenticate admin users
export const authenticateAdmin = async (username: string, password: string): Promise<boolean> => {
  try {
    const apiUrl = getInventoryApiUrl();
    const response = await fetch(`${apiUrl}?action=authenticateAdmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.success && result.authenticated;
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return false;
  }
};
