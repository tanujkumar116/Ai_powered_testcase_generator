import { useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const GitHubCallback = () => {
  const [params] = useSearchParams();
  const code = params.get("code");
  const navigate = useNavigate();
  const calledRef = useRef(false); // prevent double call

  useEffect(() => {
    if (!code || calledRef.current) return;

    calledRef.current = true; // set flag to true after first call

    const fetchGitHubUser = async () => {
      try {
        console.log("GitHub code:", code);
        const res = await axios.post(`${import.meta.env.VITE_API_URL}auth/github/callback`, { code });

        const { user, accessToken } = res.data;
        localStorage.setItem("token", accessToken);
        console.log("User Info:", user);
        localStorage.setItem("userData",JSON.stringify(user));
        navigate("/dashboard");
      } catch (err) {
        console.error("Callback error:", err.response?.data || err.message);
      }
    };

    fetchGitHubUser();
  }, [code, navigate]);

  return <div>Authenticating with GitHub...</div>;
};

export default GitHubCallback;
