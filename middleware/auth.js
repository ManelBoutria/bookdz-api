const jwt = require("jsonwebtoken");

function getToken(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  return type === "Bearer" && token ? token : null;
}

async function verifyAuth0Token(token) {
  const domain = (process.env.AUTH0_DOMAIN || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (!domain) return null;

  const res = await fetch(`https://${domain}/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const profile = await res.json();
  return {
    id: profile.sub,
    name: profile.name || profile.nickname || profile.email,
    email: profile.email,
    role: "customer",
    provider: "auth0",
  };
}

async function verifyGithubToken(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "bookdz-api",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return null;

  const profile = await res.json();
  return {
    id: `github:${profile.id}`,
    name: profile.name || profile.login,
    role: "customer",
    provider: "github",
  };
}

async function protect(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required: missing token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role, provider: "local" };
    return next();
  } catch (err) {
    // not our JWT: maybe an OAuth2 access token
  }

  for (const verify of [verifyAuth0Token, verifyGithubToken]) {
    try {
      const oauthUser = await verify(token);
      if (oauthUser) {
        req.user = oauthUser;
        return next();
      }
    } catch (err) {
      // provider unreachable: try the next one
    }
  }

  return res.status(401).json({ message: "Invalid or expired token" });
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: admin access required" });
  }
  next();
}

module.exports = { protect, adminOnly };