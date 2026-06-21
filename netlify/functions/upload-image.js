exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (body.password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: "パスワードが違います" }) };
  }

  var token = process.env.GITHUB_TOKEN;
  var repo = process.env.GITHUB_REPO;
  var branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    return { statusCode: 500, body: JSON.stringify({ error: "サーバー設定(GITHUB_TOKEN / GITHUB_REPO)が未完了です" }) };
  }

  var safeName = String(body.filename || "upload.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  var path = "images/uploads/" + Date.now() + "-" + safeName;
  var apiBase = "https://api.github.com/repos/" + repo + "/contents/" + path;

  try {
    var putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "User-Agent": "yamato-cosmos-admin",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "管理者ページから画像をアップロード: " + path,
        content: body.dataBase64,
        branch: branch
      })
    });

    if (!putRes.ok) {
      var errText = await putRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: "アップロードに失敗しました: " + errText }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, path: path }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
