module.exports = {
  apps: [
    {
      name: "bayramona-bot",
      script: "bot.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        ADMIN_PORT: 9809,
      },
      watch: false,
    },
  ],
};
