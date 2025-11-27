module.exports = {
  apps: [
    {
      name: "yangi-backend",
      script: "admin.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        ADMIN_PORT: 9808
      },
      watch: false
    },
    {
      name: "yangi-frontend",
      script: "serve-frontend.js",
      cwd: "./",
      env: {
        NODE_ENV: "production"
      },
      watch: false
    }
  ]
};
