module.exports = {
  apps: [{
    name: 'integrator',
    script: './server/src/bin/www',
    watch: ['./server/src'],
    ignore_watch: ['./node_modules', './logs'],
    instances: 1,
    max_memory_restart: '200M',
    wait_ready: true,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    merge_logs: true,
    env: {},
    env_production: {
      NODE_ENV: 'production',
      PORT: 3005
    },
  }],
};
