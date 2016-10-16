var openpgp = window.openpgp; // use as CommonJS, AMD, ES6 module or via window.openpgp
openpgp.initWorker({path: 'node_modules/openpgp/dist/openpgp.worker.js'}); // set the relative web worker path

openpgp.config.aead_protect = true; // activate fast AES-GCM mode (not yet OpenPGP standard)

/**
 * @param plaintextArrayBuffer an ArrayBuffer of data to encrypt
 * @param password A string containing the password used to encrypt the data
 * @return a Promise of a string containing a PGP encrypted message
 */
function encrypt(plaintextArrayBuffer, password) {
    var uint8ArrayInput = new Uint8Array(plaintextArrayBuffer);

    var options = {
        data: uint8ArrayInput,                      // input as Uint8Array (or String)
        passwords: [password],                      // multiple passwords possible
        armor: true                                 // ASCII armor (for String output)
    };

    return openpgp.encrypt(options).then(function (ciphertext) {
        return ciphertext.data; // get raw encrypted packets as string
    })
}

function decrypt(pgpMessage, password) {
    var options = {
        message: openpgp.message.readArmored(pgpMessage),   // parse encrypted string
        password: password,                                 // decrypt with password
        format: 'binary'                                    // output as Uint8Array
    };

    return openpgp.decrypt(options).then(function (decrypted) {
        return decrypted.data;
    });
}
