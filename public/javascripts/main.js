function encryptAndUpload(filename) {
    return function (fileReaderEvent) {
        var password = 'secret stuff';
        return encrypt(fileReaderEvent.target.result, password).then(function (encrypted) {
            upload(filename, encrypted);
        });
    };
}

initializeFileListeners(encryptAndUpload);