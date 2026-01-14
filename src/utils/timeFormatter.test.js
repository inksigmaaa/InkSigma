import { formatTimeAgo } from './timeFormatter.js';

/**
 * Manual test cases for formatTimeAgo function
 * Run this in browser console or Node.js to verify behavior
 */

console.log("=== Time Formatter Tests ===\n");

const now = new Date();

// Test 1: Just now (30 seconds ago)
const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
console.log("30 seconds ago:", formatTimeAgo(thirtySecondsAgo.toISOString()));
console.log("Expected: Just now\n");

// Test 2: 5 minutes ago
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
console.log("5 minutes ago:", formatTimeAgo(fiveMinutesAgo.toISOString()));
console.log("Expected: 5 mins\n");

// Test 3: 1 hour ago
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
console.log("1 hour ago:", formatTimeAgo(oneHourAgo.toISOString()));
console.log("Expected: 1 hr\n");

// Test 4: 3 hours ago
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
console.log("3 hours ago:", formatTimeAgo(threeHoursAgo.toISOString()));
console.log("Expected: 3 hrs\n");

// Test 5: 1 day ago
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
console.log("1 day ago:", formatTimeAgo(oneDayAgo.toISOString()));
console.log("Expected: Yesterday\n");

// Test 6: 3 days ago
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
console.log("3 days ago:", formatTimeAgo(threeDaysAgo.toISOString()));
console.log("Expected: 3 days ago\n");

// Test 7: 7 days ago
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
console.log("7 days ago:", formatTimeAgo(sevenDaysAgo.toISOString()));
console.log("Expected: Last week\n");

// Test 8: Future timestamp (should warn)
const futureTime = new Date(now.getTime() + 60 * 60 * 1000);
console.log("1 hour in future:", formatTimeAgo(futureTime.toISOString()));
console.log("Expected: Just now (with console warning)\n");

// Test 9: Invalid date
console.log("Invalid date:", formatTimeAgo("not-a-date"));
console.log("Expected: Invalid date\n");

// Test 10: Null/undefined
console.log("Null:", formatTimeAgo(null));
console.log("Expected: Unknown\n");

console.log("=== Tests Complete ===");
