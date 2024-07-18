
window.addEventListener('DOMContentLoaded', () => {
  log("App started");
  document.getElementById('connect').addEventListener('click', async () => {

    if (document.getElementById('connect').classList.contains('connected_btn')) {
      window.electron.stopProcess();
    } else {
      window.electron.startProcess();
      log("Connecting...");
      document.getElementById('connect').innerText = "Connecting...";
      document.getElementById('connect').classList.add("connecting_btn");

      setTimeout(() => {
        if (document.getElementById('connect').classList.contains("connecting_btn")) {
          window.electron.stopProcess();
        }
      }, 10000);
    }

  });


  document.getElementById('import_config_btn').addEventListener('click', async () => {
    const filePaths = await window.electron.openFileDialog();
    if (filePaths.length > 0) {
      await window.electron.writeConfig(filePaths[0]);
      log("Config set");
    }
  });


  function log(text) {
    text = text.replace(/\n/g, "");
    let time = new Date();
    document.getElementById("logs").innerText += "[" + time.toLocaleTimeString() + "]: " + text + "\n";
    document.getElementById("logs").scroll(0, 10000000000000);
  }


  window.electron.onProcessExit((code) => {
    log("Psiphon proccess exited with code " + code);
    document.getElementById('connect').innerText = "Connect";
    document.getElementById('connect').classList.remove("connected_btn");
    document.getElementById('connect').classList.remove("connecting_btn");
  });

  window.electron.onProcessError((data) => {
    log(data);
    if (data.indexOf('{"count":1}') > 0) {
      document.getElementById('connect').classList.remove("connecting_btn");
      document.getElementById('connect').innerText = "Disconnect";
      document.getElementById('connect').classList.add("connected_btn");
      log("Connected");
    } else if (data.indexOf('{"count":0}') > 0 || data.indexOf('Error') > 0) {
      document.getElementById('connect').innerText = "Connect";
      document.getElementById('connect').classList.remove("connected_btn");
      document.getElementById('connect').classList.remove("connecting_btn");
      log("Disconnected");
    }
  });
});
