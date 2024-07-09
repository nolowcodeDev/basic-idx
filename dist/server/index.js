const doGet = (e) => {
  if (e.parameter.path) {
    if (e.parameter.path === "/getdata") {
      return sendJson({ status: 200, message: "success" });
    }
  }

  return HtmlService.createTemplateFromFile("client/index")
    .evaluate()
    .setTitle("IDX GAS")
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};

const doPost = (e) => {
  if (e.parameter.path) {
    if (e.parameter.path === "/login") {
      const { username, password } = JSON.parse(e.postData.contents);
      const data = {
        username,
        password,
      };
      return sendJson({ status: 200, message: "login success", data });
    }
  }
};

const sendJson = (myJson) =>
  ContentService.createTextOutput(JSON.stringify(myJson)).setMimeType(
    ContentService.MimeType.JSON
  );
