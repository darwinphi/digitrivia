var ghpages = require("gh-pages");

ghpages.publish(
  "public", // path to public directory
  {
    branch: "main",
    repo: "https://github.com/darwinphi/digitrivia.git",
    user: {
      name: "Darwin",
      email: "darwinmanalophi@gmail.com",
    },
  },
  () => {
    console.log("Deploy Complete!");
  }
);
