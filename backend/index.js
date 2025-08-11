const express = require("express");
const authRoutes=require("./routes/githubAuth")
const repositoryRoutes=require("./routes/repositoryRoutes")
const cors = require("cors");
const dotenv=require("dotenv")
const axios = require("axios");
const openaiRoutes=require("./routes/geminiroutes")
const app = express();
const PORT = 5003;
app.use(cors());
app.use(express.json());
dotenv.config()
app.get("/", (req, res) => {
  res.send("Test Case Generator API running 🚀");
});
app.use('/auth',authRoutes)
app.use('/api/repositories',repositoryRoutes)
app.use("/api/gemini",openaiRoutes)
app.get("/api/user", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required"
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
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
      user: user
    });

  } catch (error) {
    console.error('GitHub user verification error:', error.response?.data || error.message);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: error.response?.data?.message || error.message
    });
  }
});
app.post("/api/create-pr", async (req, res) => {
  const { owner, repo, base, filePath, content, prTitle, prBody } = req.body;

  try {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is required"
    });
  }

  const token = authHeader.split(' ')[1];
    // 1️⃣ Get base branch SHA
    let refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${base}`, {
      headers: { Authorization: `token ${token}` },
    });
    const refData = await refRes.json();
    if (!refRes.ok) return res.status(refRes.status).json(refData);

    const baseSha = refData.object.sha;

    // 2️⃣ Create a new branch
    const branchName = `auto-tests-${Date.now()}`;
    let branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    });
    const branchData = await branchRes.json();
    if (!branchRes.ok) return res.status(branchRes.status).json(branchData);

    // 3️⃣ Commit the new file (Base64 encode the content)
    const encodedContent = Buffer.from(content).toString("base64");
    let fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prTitle,
        content: encodedContent,
        branch: branchName,
      }),
    });
    const fileData = await fileRes.json();
    if (!fileRes.ok) return res.status(fileRes.status).json(fileData);

    // 4️⃣ Create the Pull Request
    let prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: prTitle,
        head: branchName,
        base: base,
        body: prBody,
      }),
    });
    const prData = await prRes.json();
    if (!prRes.ok) return res.status(prRes.status).json(prData);

    res.json(prData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
