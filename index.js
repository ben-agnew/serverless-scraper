const app = require("express")();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("@sparticuz/chromium");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
  require("dotenv").config();
}

app.get("/api", async (req, res) => {

  const {auth, url} = req.query;
  
  if (auth !== process.env.AUTH_TOKEN) {
    res.send("Not authorized");
    return;
  }

  if (!url) {
    res.send("No URL provided");
    return;
  }

  const decodedUrl = decodeURIComponent(url);



  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);

    let page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      accept: "application/json, text/plain, */*",
      "accept-language": "en-US,en;q=0.9",
      "sec-ch-ua":
        '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    })
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36"
    )
    await page.goto(decodedUrl);

    // select the pre element on the page and return the content

    const data = await page.evaluate(() => {
      return document.getElementsByTagName("body")[0].innerHTML;
    });

    // close the browser
    await browser.close();

    // send the response



    res.send(data);

  } catch (err) {
    console.error(err);
    return res.send("Error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;