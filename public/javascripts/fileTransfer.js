function upload(filename, contents) {
    document.getElementById("base64textarea").value = contents;

    // Upload
    return new Promise(function(resolve) {
        var xhr = new XMLHttpRequest();
        var url = "http://localhost:9000/upload";
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                console.log("Upload response: " + xhr.responseText);
                resolve();
            }
        };
        var data = {
            "filename": filename,
            "encryptedData": contents
        };
        console.log("Posting file " + data.filename);
        xhr.send(JSON.stringify(data));
    });
}

function downloadAsJson(filename) {
    return new Promise(function (resolve) {
        var xhr = new XMLHttpRequest();
        var url = "http://localhost:9000/download?filename=" + filename;
        console.log("Downloading file " + url);
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var json = JSON.parse(xhr.responseText);
                console.log("Downloaded: " + JSON.stringify(json, null, 2));
                resolve(json);
            }
        };
        xhr.send(null);
    });
}