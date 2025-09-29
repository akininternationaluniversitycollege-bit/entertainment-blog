// server.js
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { OAuth2Client } = require("google-auth-library");

const app = express();
const PORT = 3000;

// Google OAuth Client
const GOOGLE_CLIENT_ID = "506317870201-dmijf1kredosu9cejs3754slfh2gt086.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// reCAPTCHA secret key
const RECAPTCHA_SECRET = "6Ldb3tgrAAAAAARDCU6DtyM40fcm_U_II2ouFb2I";

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve HTML directly
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sokpah Family Database</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Google Sign-In -->
  <meta name="google-signin-client_id" content="${GOOGLE_CLIENT_ID}">
  <script src="https://accounts.google.com/gsi/client" async defer></script>

  <!-- Google reCAPTCHA -->
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>

  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      background: #f2f2f2;
      padding: 50px;
    }
    .container {
      max-width: 400px;
      margin: auto;
      padding: 20px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .g_id_signin {
      margin-top: 20px;
    }
    button {
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      border: none;
      background: #4285f4;
      color: white;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background: #3367d6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Sokpah Family Database</h2>
    <p>Signup with Google</p>

    <!-- Google Sign-In button -->
    <div id="g_id_onload"
      data-client_id="${GOOGLE_CLIENT_ID}"
      data-callback="handleCredentialResponse">
    </div>
    <div class="g_id_signin" data-type="standard"></div>

    <!-- reCAPTCHA -->
    <form id="verifyForm" method="POST" action="/verify">
      <div class="g-recaptcha" data-sitekey="6Ldb3tgrAAAAABLcnMwLjkIV5B2YUNTp68JAPAdr"></div>
      <button type="submit">Verify & Submit</button>
    </form>
  </div>

  <script>
    // Handle Google Sign-In
    function handleCredentialResponse(response) {
      console.log("Google ID token:", response.credential);

      fetch("/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential })
      })
      .then(res => res.json())
      .then(data => {
        alert("Google Login: " + JSON.stringify(data));
      });
    }
  </script>
</body>
</html>
  `);
});

// ✅ Google login verification
app.post("/google-login", async (req, res) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    res.json({ success: true, user: payload });
  } catch (err) {
    res.json({ success: false, message: "Invalid Google token" });
  }
});

// ✅ reCAPTCHA verification
app.post("/verify", async (req, res) => {
  const response = req.body["g-recaptcha-response"];
  if (!response) {
    return res.send("❌ reCAPTCHA missing");
  }

  const verifyUrl = \`https://www.google.com/recaptcha/api/siteverify?secret=\${RECAPTCHA_SECRET}&response=\${response}\`;

  try {
    const googleRes = await fetch(verifyUrl, { method: "POST" });
    const data = await googleRes.json();

    if (data.success) {
      res.send("✅ Human verified successfully!");
    } else {
      res.send("❌ Verification failed. You might be a robot!");
    }
  } catch (err) {
    res.send("⚠️ Error verifying reCAPTCHA");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running at http://localhost:\${PORT}\`);
});
