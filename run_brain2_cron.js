const cron = require('node-cron');
const { exec } = require('child_process');

// Schedule: every 10 minutes
cron.schedule('*/10 * * * *', () => {
  console.log(`[${new Date().toISOString()}] Running brain2.py...`);
  exec('python brain2.py', (err, stdout, stderr) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] Error running brain2.py:`, err);
    } else {
      console.log(`[${new Date().toISOString()}] brain2.py output:\n`, stdout);
      if (stderr) {
        console.error(`[${new Date().toISOString()}] brain2.py stderr:\n`, stderr);
      }
    }
  });
});

console.log('Scheduled brain2.py to run every 10 minutes.');
