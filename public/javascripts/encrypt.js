var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp
openpgp.initWorker({path: 'node_modules/openpgp/dist/openpgp.worker.js'}); // set the relative web worker path

openpgp.config.aead_protect = true; // activate fast AES-GCM mode (not yet OpenPGP standard)


// File selection

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('The File APIs are not fully supported in this browser.');
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
    console.log('files: ' + JSON.stringify(files, null, 2));

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        console.log('file: ' + JSON.stringify(f.lastModifiedDate, null, 2));
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

    var reader = new FileReader();

    reader.onload = function (readerEvt) {
        var uint8ArrayInput = new Uint8Array(readerEvt.target.result);
        console.log("input: " + JSON.stringify(uint8ArrayInput, null, 2));

        var options;

        options = {
            data: uint8ArrayInput,                       // input as Uint8Array (or String)
            passwords: ['secret stuff'],              // multiple passwords possible
            armor: true                               // don't ASCII armor (for Uint8Array output)
        };

        // Encrypt
        openpgp.encrypt(options).then(function (ciphertext) {
            return ciphertext.data; // get raw encrypted packets as string
        }).then(function (encrypted) {

            document.getElementById("base64textarea").value = encrypted;

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
                    "filename": files[0].name,
                    "encryptedData": encrypted
                };
                console.log("Posting file " + data.filename);
                xhr.send(JSON.stringify(data));
            });
        }).then(function () {
            // Download
            return new Promise(function (resolve) {
                var xhr = new XMLHttpRequest();
                var url = "http://localhost:9000/download?filename=" + files[0].name;
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
        }).then(function (json) {
            // Decrypt and show
            console.log("Decrypting " + json.encryptedData);
            options = {
                message: openpgp.message.readArmored(json.encryptedData), // parse encrypted bytes
                password: 'secret stuff',                  // decrypt with password
                format: 'binary'                          // output as Uint8Array
            };

            openpgp.decrypt(options).then(function (decrypted) {
                var output = decrypted.data;

                // now that we have the byte array, construct the blob from it
                var blob1 = new Blob([output], {type: "application/octet-stream"});

                var fileName1 = json.filename;
                debugger;
                saveAs(blob1, fileName1);
            });

        });
    };

    reader.readAsArrayBuffer(files[0]);
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
