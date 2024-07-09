const fs = require("fs");
const path = require("path");

const clientDir = path.join(__dirname, "src/client");
const serverDir = path.join(__dirname, "src/server");
const appsscriptJson = path.join(__dirname, "src/appsscript.json");

const distDir = path.join(__dirname, "dist", "client");
const distServerDir = path.join(__dirname, "dist", "server");
const distAppsscriptJson = path.join(__dirname, "dist", "appsscript.json");

// Function to delete a directory recursively
function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

// Ensure the dist/build directory is clean
deleteFolderRecursive(distDir);
deleteFolderRecursive(distServerDir);
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(distServerDir, { recursive: true });

// Function to process an HTML file
function processHTMLFile(filePath, relativePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading ${filePath}:`, err);
      return;
    }

    // Find all script tags
    const scriptTagRegex = /<script\s+src="([^"]+)"><\/script>/g;
    data = replaceTags(data, scriptTagRegex, "script", relativePath);

    // Find all link tags
    const linkTagRegex = /<link\s+href="([^"]+)"\s+rel="stylesheet"\s*\/?>/g;
    data = replaceTags(data, linkTagRegex, "link", relativePath);

    // Write the updated HTML file to dist/client
    const newHTMLPath = path.join(distDir, relativePath);
    fs.mkdirSync(path.dirname(newHTMLPath), { recursive: true });
    fs.writeFile(newHTMLPath, data, "utf8", (writeErr) => {
      if (writeErr) {
        console.error(`Error writing ${newHTMLPath}:`, writeErr);
        return;
      }
      console.log(`Processed ${newHTMLPath}`);
    });
  });
}

// Function to replace tags and convert JS/CSS to HTML
function replaceTags(data, regex, tagType, relativePath) {
  let match;
  while ((match = regex.exec(data)) !== null) {
    const src = match[1];
    const fileName = path.basename(src);
    const sourcePath = path.join(clientDir, src);
    const destPath = path.join(distDir, src + ".html");

    // Read and convert JS/CSS file to HTML
    fs.readFile(sourcePath, "utf8", (readErr, fileData) => {
      if (readErr) {
        // console.error(`Error reading ${sourcePath}:`, readErr);
        return;
      }

      let htmlContent;
      if (tagType === "script") {
        htmlContent = `<script>${fileData}</script>`;
      } else if (tagType === "link") {
        htmlContent = `<style>${fileData}</style>`;
      }

      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFile(destPath, htmlContent, "utf8", (writeErr) => {
        if (writeErr) {
          console.error(`Error writing ${destPath}:`, writeErr);
          return;
        }
        console.log(`Processed ${destPath}`);
      });
    });

    // Replace the tag with <?include(...)?>
    const includeTag = `<?!=HtmlService.createHtmlOutputFromFile('${path
      .relative(clientDir, sourcePath)
      .replace(/^src\//, "")}').getContent()?>`;
    data = data.replace(match[0], includeTag);
  }
  return data;
}

// Function to copy server files
function copyServerFiles() {
  fs.readdir(serverDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${serverDir}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(serverDir, file);
      const destPath = path.join(distServerDir, file);

      if (fs.lstatSync(filePath).isDirectory()) {
        // If it's a directory, recursively copy
        fs.mkdirSync(destPath, { recursive: true });
        copyFolderRecursive(filePath, destPath);
      } else {
        // If it's a file, copy it
        fs.copyFile(filePath, destPath, (copyErr) => {
          if (copyErr) {
            console.error(`Error copying ${filePath} to ${destPath}:`, copyErr);
            return;
          }
          console.log(`Copied ${filePath} to ${destPath}`);
        });
      }
    });
  });
}

// Function to copy appsscript.json to dist
function copyAppsscriptJson() {
  fs.copyFile(appsscriptJson, distAppsscriptJson, (err) => {
    if (err) {
      console.error(
        `Error copying ${appsscriptJson} to ${distAppsscriptJson}:`,
        err
      );
      return;
    }
    console.log(`Copied ${appsscriptJson} to ${distAppsscriptJson}`);
  });
}

// Function to copy folders recursively
function copyFolderRecursive(source, target) {
  const targetFolder = path.basename(source);
  const targetPath = path.join(target, targetFolder);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  const files = fs.readdirSync(source);
  files.forEach((file) => {
    const curSource = path.join(source, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursive(curSource, targetPath);
    } else {
      fs.copyFileSync(curSource, path.join(targetPath, file));
    }
  });
}

// Function to process files recursively in client directory
function processFilesRecursively(directory, relativePath = "") {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${directory}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const fileRelativePath = path.join(relativePath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        processFilesRecursively(filePath, fileRelativePath);
      } else if (file.endsWith(".html")) {
        processHTMLFile(filePath, fileRelativePath);
      } else if (file.endsWith(".js") || file.endsWith(".css")) {
        const destPath = path.join(distDir, fileRelativePath + ".html");
        fs.readFile(filePath, "utf8", (readErr, fileData) => {
          if (readErr) {
            console.error(`Error reading ${filePath}:`, readErr);
            return;
          }

          let htmlContent;
          if (file.endsWith(".js")) {
            htmlContent = `<script>${fileData}</script>`;
          } else if (file.endsWith(".css")) {
            htmlContent = `<style>${fileData}</style>`;
          }

          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFile(destPath, htmlContent, "utf8", (writeErr) => {
            if (writeErr) {
              console.error(`Error writing ${destPath}:`, writeErr);
              return;
            }
            console.log(`Processed ${destPath}`);
          });
        });
      }
    });
  });
}

// Process all files in the client directory
processFilesRecursively(clientDir);

// Copy all files in the server directory
copyServerFiles();

// Copy appsscript.json to dist
copyAppsscriptJson();
