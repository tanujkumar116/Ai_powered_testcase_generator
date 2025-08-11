const express = require("express");
const axios = require("axios"); // ✅ FIXED
require("dotenv").config();

const router = express.Router();

// Get repository contents (files and folders) - specific first
router.get("/:owner/:repo/contents", async (req, res) => {
  const { owner, repo } = req.params;
  const path = req.query.path || '';
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Authorization token is required" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const contentsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
    });

    const contents = Array.isArray(contentsResponse.data) 
      ? contentsResponse.data.map(item => ({
          name: item.name, path: item.path, sha: item.sha, size: item.size,
          url: item.url, html_url: item.html_url, git_url: item.git_url,
          download_url: item.download_url, type: item.type
        }))
      : [{
          name: contentsResponse.data.name, path: contentsResponse.data.path, sha: contentsResponse.data.sha,
          size: contentsResponse.data.size, url: contentsResponse.data.url, html_url: contentsResponse.data.html_url,
          git_url: contentsResponse.data.git_url, download_url: contentsResponse.data.download_url,
          type: contentsResponse.data.type, encoding: contentsResponse.data.encoding,
          content: contentsResponse.data.content
        }];

    res.json({ success: true, contents, path });

  } catch (error) {
    console.error('GitHub contents error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ success: false, message: "Failed to fetch repository contents" });
  }
});

// Get file content
router.get("/:owner/:repo/file", async (req, res) => { // ✅ FIXED PARAM
  const { owner, repo } = req.params;
  const filePath = req.query.path;
  const authHeader = req.headers.authorization;

  if (!filePath) return res.status(400).json({ success: false, message: "File path is required" });
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Authorization token is required" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const fileResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
    });

    const file = {
      name: fileResponse.data.name,
      path: fileResponse.data.path,
      sha: fileResponse.data.sha,
      size: fileResponse.data.size,
      encoding: fileResponse.data.encoding,
      content: fileResponse.data.content ? Buffer.from(fileResponse.data.content, 'base64').toString('utf8') : null
    };

    res.json({ success: true, file });

  } catch (error) {
    console.error('GitHub file error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ success: false, message: "Failed to fetch file content" });
  }
});

// Get repositories list
router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Authorization token is required" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { page = 1, per_page = 30, sort = 'updated', type = 'all' } = req.query;
    const reposResponse = await axios.get(`https://api.github.com/user/repos`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
      params: { page, per_page, sort, type, direction: 'desc' }
    });

    const repositories = reposResponse.data.map(repo => ({
      id: repo.id, name: repo.name, full_name: repo.full_name, description: repo.description,
      private: repo.private, html_url: repo.html_url, clone_url: repo.clone_url,
      language: repo.language, stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count, watchers_count: repo.watchers_count,
      size: repo.size, default_branch: repo.default_branch,
      created_at: repo.created_at, updated_at: repo.updated_at, pushed_at: repo.pushed_at,
      topics: repo.topics || [], has_issues: repo.has_issues, has_projects: repo.has_projects,
      has_wiki: repo.has_wiki, archived: repo.archived, disabled: repo.disabled
    }));

    res.json({ success: true, repositories, total_count: repositories.length, page, per_page });

  } catch (error) {
    console.error('GitHub repositories error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch repositories" });
  }
});

// Get specific repository details
router.get("/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Authorization token is required" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
    });

    const repository = {
      id: repoResponse.data.id, name: repoResponse.data.name, full_name: repoResponse.data.full_name,
      description: repoResponse.data.description, private: repoResponse.data.private,
      html_url: repoResponse.data.html_url, clone_url: repoResponse.data.clone_url,
      language: repoResponse.data.language, stargazers_count: repoResponse.data.stargazers_count,
      forks_count: repoResponse.data.forks_count, watchers_count: repoResponse.data.watchers_count,
      size: repoResponse.data.size, default_branch: repoResponse.data.default_branch,
      created_at: repoResponse.data.created_at, updated_at: repoResponse.data.updated_at,
      pushed_at: repoResponse.data.pushed_at, topics: repoResponse.data.topics || []
    };

    res.json({ success: true, repository });

  } catch (error) {
    console.error('GitHub repository error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ success: false, message: "Failed to fetch repository" });
  }
});

module.exports = router;
