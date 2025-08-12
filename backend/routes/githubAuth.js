// routes/githubAuth.js
const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.FRONTEND_URL}auth/callback`;

// Step 1 - Get GitHub OAuth URL
router.get("/github", (req, res) => {
  const scope = "repo read:user user:email";
  const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}`;

  res.json({
    success: true,
    authUrl: githubAuthURL
  });
});

// Step 2 - GitHub Callback (exchange code for token)
router.post("/github/callback", async (req, res) => {
  const { code } = req.body;
  console.log("backend", code);

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Authorization code is required"
    });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Failed to get access token"
      });
    }

    // Get user info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    const user = {
      id: userResponse.data.id,
      login: userResponse.data.login,
      name: userResponse.data.name,
      email: userResponse.data.email,
      avatar_url: userResponse.data.avatar_url,
      bio: userResponse.data.bio,
      public_repos: userResponse.data.public_repos,
      followers: userResponse.data.followers,
      following: userResponse.data.following
    };

    res.json({
      success: true,
      user,
      accessToken
    });

  } catch (error) {
    console.error("GitHub OAuth error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "GitHub authentication failed",
      error: error.response?.data?.error_description || error.message
    });
  }
});

module.exports = router;
