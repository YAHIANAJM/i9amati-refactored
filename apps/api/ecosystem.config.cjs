// PM2 process config — used by deploy.sh to start/restart the API
module.exports = {
  apps: [
    {
      name:         'i9amati-api',
      script:       'dist/src/index.js',
      cwd:          '/var/www/i9amati/apps/api',
      instances:    1,
      exec_mode:    'fork',
      node_args:    '--experimental-vm-modules',
      env_production: {
        NODE_ENV: 'production',
        PORT:     4000,
      },
      // Restart the process if it uses more than 500MB RAM
      max_memory_restart: '500M',
      // Log to separate files for easier tailing
      out_file:  '/var/log/i9amati/api-out.log',
      error_file: '/var/log/i9amati/api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Merge stdout + stderr into one file for simplicity
      merge_logs: true,
      // Auto-restart on crash
      autorestart: true,
      restart_delay: 3000,
    },
  ],
}
