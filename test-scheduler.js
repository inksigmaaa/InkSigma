// Quick test script to check scheduler functionality
// Run with: node test-scheduler.js

const testScheduler = async () => {
    try {
        console.log('Testing scheduler endpoints...\n');
        
        // Test scheduler status
        const statusResponse = await fetch('http://localhost:5000/api/debug/scheduler');
        const statusData = await statusResponse.json();
        
        console.log('📊 Scheduler Status:');
        console.log('- Running:', statusData.scheduler.isRunning);
        console.log('- Current UTC Time:', statusData.currentTimeUTC);
        console.log('- Server Timezone:', statusData.scheduler.timezone);
        console.log('- Total Scheduled:', statusData.totalScheduled);
        console.log('- Past Due:', statusData.pastDue);
        
        if (statusData.scheduledBlogs.length > 0) {
            console.log('\n📅 Scheduled Blogs:');
            statusData.scheduledBlogs.forEach(blog => {
                console.log(`- "${blog.title}"`);
                console.log(`  Scheduled: ${blog.scheduledAtUTC}`);
                console.log(`  Past Due: ${blog.isPastDue}`);
                console.log(`  Minutes Until: ${blog.minutesUntil}`);
                console.log('');
            });
        }
        
        // Test manual check
        console.log('🔧 Triggering manual scheduler check...');
        const checkResponse = await fetch('http://localhost:5000/api/debug/scheduler/check', {
            method: 'POST'
        });
        const checkData = await checkResponse.json();
        console.log('✅', checkData.message);
        
    } catch (error) {
        console.error('❌ Error testing scheduler:', error.message);
        console.log('\nMake sure your backend server is running on http://localhost:5000');
    }
};

testScheduler();