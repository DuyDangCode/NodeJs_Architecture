const packageJson = require("./package.json");
const commander = require("commander");
const chalk = require("chalk");
const process = require("process");
const envinfo = require("envinfo");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const spawn = require("cross-spawn");

let projectName = "project";

function init() {
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .arguments("<project-directory>")
    .usage(`${chalk.green("<project-directory>")} [options]`)
    .action((name) => {
      projectName = name;
      console.log(`Creating project: ${chalk.green(name)}`);
    })
    .option("--verbose", "print additional logs")
    .option("--info", "print environment debug info")
    .allowUnknownOption()
    .parse(process.argv);

  if (program.info) {
    console.log(chalk.bold("\nEnvironment Info:"));
    console.log(
      `\n  current version of ${packageJson.name}: ${packageJson.version}`
    );
    console.log(`  running from ${__dirname}`);
    return envinfo
      .run(
        {
          System: ["OS", "CPU"],
          Binaries: ["Node", "npm", "Yarn"],
          Browsers: [
            "Chrome",
            "Edge",
            "Internet Explorer",
            "Firefox",
            "Safari",
          ],
          npmPackages: ["express"],
          npmGlobalPackages: ["DuyDangCode_NodeJs"],
        },
        {
          duplicates: true,
          showNotFound: true,
        }
      )
      .then(console.log);
  }

  if (typeof projectName === "undefined") {
    console.log(chalk.red("Err: "), "please enter a project name!!!");
  } else {
    //console.log(program.verbose);
    createApp(projectName, program.verbose, program.scriptsVersion);
  }
}

function createApp(name, verbose, version) {
  const root = path.resolve(name);
  const appName = path.basename(root);

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true,
  };

  //  create folder project
  fs.ensureDirSync(name);
  fs.ensureDirSync(name + "/src");
  fs.ensureDirSync(name + "/src/v1/configs");
  fs.ensureDirSync(name + "/src/v1/controllers");
  fs.ensureDirSync(name + "/src/v1/dbs");
  fs.ensureDirSync(name + "/src/v1/helpers");
  fs.ensureDirSync(name + "/src/v1/models");
  fs.ensureDirSync(name + "/src/v1/postman");
  fs.ensureDirSync(name + "/src/v1/routes");
  fs.ensureDirSync(name + "/src/v1/services");
  fs.ensureDirSync(name + "/src/v1/utils");
  fs.writeFileSync(
    path.join(root + "/src/v1/routes/", "index.js"),
    '"use strict"; \nconst express = require("express"); \nconst router = express.Router(); \n //router.use("/v1/api", require("./access"));\nmodule.exports = router;'
  );
  fs.writeFileSync(
    path.join(root + "/src/", "app.js"),
    'const express = require("express"); \nconst app = express(); \n// init middlewares \n// init db \n// init routes \napp.use("/", require("./v1/routes")); \n// handling error \nmodule.exports = app;'
  );
  fs.writeFileSync(
    path.join(root, "server.js"),
    "const app = require('./src/app'); \nconst PORT = '3000'; \nconst server = app.listen(PORT, () => { \nconsole.log(`Server is running at ${PORT}`);}); \nprocess.on('SIGINT', () => {\n server.close(() => {\n   console.log(`Exit server express`);\n });});"
  );

  //   create file package.json
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  const originalDirectory = process.cwd();
  process.chdir(root);
  run(root, appName, version, verbose, originalDirectory);
}

function run(root, appName, version, verbose, originalDirectory) {
  const allDependencies = ["express"];
  installPackages(allDependencies).then(() => {
    console.log(chalk.green("Success: "), "Install packages");
  });
}

function installPackages(dependencies) {
  return new Promise((resolve, reject) => {
    let command;
    let args;
    command = "npm";
    args = ["install", "--save"].concat(dependencies);
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`,
        });
        return;
      }
      resolve();
    });
  });
}

module.exports.init = init;
