module.exports = {
  "apps": [
    {
      "name": "gclaude-enterprise",
      "script": "./server.js",
      "instances": "max",
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "development",
        "PORT": 3007
      },
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 3007
      },
      "log_file": "./logs/combined.log",
      "out_file": "./logs/out.log",
      "error_file": "./logs/error.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "max_memory_restart": "1G",
      "node_args": "--max-old-space-size=1024",
      "restart_delay": 4000,
      "max_restarts": 10,
      "min_uptime": "10s",
      "kill_timeout": 5000,
      "wait_ready": true,
      "listen_timeout": 8000,
      "autorestart": true,
      "watch": false,
      "ignore_watch": [
        "node_modules",
        "logs",
        "data",
        "uploads",
        ".git"
      ],
      "env_file": ".env.production"
    }
  ]
};