module.exports = {
  apps: [
    {
      name: "yangi-bot",
      script: "bot.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        BOT_PORT: 9808,
      },
      watch: false,
    },
    {
      name: "yangi-admin",
      script: "admin.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        ADMIN_PORT: 9809,
      },
      watch: false,
    },
  ],
};
