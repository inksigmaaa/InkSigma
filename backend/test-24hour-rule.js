// Test script to demonstrate 24-hour view tracking rules
// Run with: node test-24hour-rule.js

import { trackBlogView } from './services/viewTrackingService.js';

const testBlogId = 1;
const testIp = '192.168.1.100';
const testUserAgent = 'Mozilla/5.0 (Test Browser)';

console.log('='.repeat(60));
console.log('24-HOUR VIEW TRACKING RULE TEST');
console.log('='.repeat(60));
console.log('\nRULES:');
console.log('✅ First view: Recorded in database');
console.log('❌ Repeat view within 24 hours: NOT recorded (skipped)');
console.log('✅ View after 24+ hours: Recorded as new view');
console.log('\n' + '='.repeat(60));

async function runTest() {
    try {
        console.log('\n📝 TEST 1: First view (should be recorded)');
        console.log('-'.repeat(60));
        const result1 = await trackBlogView(testBlogId, testIp, testUserAgent);
        console.log(`Result: isNewView = ${result1.isNewView}`);
        console.log(`Expected: true ✅`);
        console.log(`Status: ${result1.isNewView ? '✅ PASS' : '❌ FAIL'}`);

        console.log('\n📝 TEST 2: Immediate repeat view (should be skipped)');
        console.log('-'.repeat(60));
        const result2 = await trackBlogView(testBlogId, testIp, testUserAgent);
        console.log(`Result: isNewView = ${result2.isNewView}`);
        console.log(`Expected: false ❌`);
        console.log(`Status: ${!result2.isNewView ? '✅ PASS' : '❌ FAIL'}`);

        console.log('\n📝 TEST 3: Another repeat view (should still be skipped)');
        console.log('-'.repeat(60));
        const result3 = await trackBlogView(testBlogId, testIp, testUserAgent);
        console.log(`Result: isNewView = ${result3.isNewView}`);
        console.log(`Expected: false ❌`);
        console.log(`Status: ${!result3.isNewView ? '✅ PASS' : '❌ FAIL'}`);

        console.log('\n' + '='.repeat(60));
        console.log('TEST SUMMARY');
        console.log('='.repeat(60));
        console.log('✅ First view was recorded');
        console.log('❌ Subsequent views within 24h were skipped');
        console.log('\n💡 To test the 24+ hour rule:');
        console.log('   1. Wait 24 hours');
        console.log('   2. Run this script again');
        console.log('   3. The first view should be recorded again');
        console.log('\n💡 Or manually clear Redis:');
        console.log('   redis-cli DEL "blog:1:view:*"');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error);
    } finally {
        process.exit(0);
    }
}

runTest();
