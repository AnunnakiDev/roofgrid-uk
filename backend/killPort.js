const kill = require('kill-port');

const port = 5000; // Backend port

kill(port, 'tcp')
  .then(() => {
    console.log(`Port ${port} has been freed.`);
  })
  .catch(err => {
    console.error(`Error freeing port ${port}:`, err);
  });