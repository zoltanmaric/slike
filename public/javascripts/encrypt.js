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
        var binaryString = readerEvt.target.result;
        var base64 = btoa(binaryString);

        document.getElementById("base64textarea").value = base64;

        var options;

        options = {
            data: base64,                          // input as Uint8Array (or String)
            passwords: ['secret stuff'],              // multiple passwords possible
            armor: false                              // don't ASCII armor (for Uint8Array output)
        };

        // Encrypt
        openpgp.encrypt(options).then(function (ciphertext) {
            return ciphertext.message.packets.write(); // get raw encrypted packets as Uint8Array
        }).then(function (encrypted) {
            // Convert to base64
            var encryptedBase64 = btoa(String.fromCharCode.apply(null, encrypted));
            console.log('encryptedBase64: ' + JSON.stringify(encryptedBase64));

            document.getElementById("encryptedBase64textarea").value = encryptedBase64;
            console.log("Encrypted length is " + encryptedBase64.length);

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
                    "encryptedData": encryptedBase64
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
            var encryptedUint8Array = new Uint8Array(atob(json.encryptedData).split("").map(function(c) {
                return c.charCodeAt(0); }));
            options = {
                message: openpgp.message.read(encryptedUint8Array), // parse encrypted bytes
                password: 'secret stuff'                  // decrypt with password
                // format: 'binary'                          // output as Uint8Array
            };

            openpgp.decrypt(options).then(function (plaintext) {
                // console.log('plaintext: ' + JSON.stringify(plaintext.data, null, 4));
                document.getElementById("decryptedBase64textarea").value = plaintext.data;

                var byteCharacters = atob(plaintext.data);
                var byteNumbers = new Array(byteCharacters.length);
                for (var i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                var byteArray = new Uint8Array(byteNumbers);

                // now that we have the byte array, construct the blob from it
                var blob1 = new Blob([byteArray], {type: "application/octet-stream"});

                var fileName1 = json.filename;
                saveAs(blob1, fileName1);

                return plaintext.data; // Uint8Array([0x01, 0x01, 0x01])
            });

        });
    };

    reader.readAsBinaryString(files[0]);
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
