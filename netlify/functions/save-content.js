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
  var repo = process.env.GITHUB_REPO; // e.g. "yourname/yamato-cosmos-site"
  var branch = process.env.GITHUB_BRANCH || "main";
  var path = "content.json";

  if (!token || !repo) {
    return { statusCode: 500, body: JSON.stringify({ error: "サーバー設定(GITHUB_TOKEN / GITHUB_REPO)が未完了です" }) };
  }

  var apiBase = "https://api.github.com/repos/" + repo + "/contents/" + path;

  try {
    var getRes = await fetch(apiBase + "?ref=" + branch, {
      headers: { Authorization: "Bearer " + token, "User-Agent": "yamato-cosmos-admin" }
    });
    if (!getRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: "現在のcontent.jsonの取得に失敗しました" }) };
    }
    var getData = await getRes.json();
    var sha = getData.sha;

    var newContent = JSON.stringify(body.content, null, 2);
    var encoded = Buffer.from(newContent, "utf-8").toString("base64");

    var putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "User-Agent": "yamato-cosmos-admin",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "管理者ページからサイト内容を更新",
        content: encoded,
        sha: sha,
        branch: branch
      })
    });

    if (!putRes.ok) {
      var errText = await putRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: "保存に失敗しました: " + errText }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
