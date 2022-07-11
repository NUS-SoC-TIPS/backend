module.exports = {
  apps: [
    {
      name: 'tips-backend',
      script: 'yarn',
      args: 'start:prod',
      watch: false,
      interpreter: '/bin/bash',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
