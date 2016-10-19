function getFilesArray() {
    return new Promise(function (resolve) {
        var xhr = new XMLHttpRequest();
        var url = "http://localhost:9000/getFilenames";
        xhr.open("GET", url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var json = JSON.parse(xhr.responseText);
                console.log("Got files list: " + JSON.stringify(json, null, 2));
                resolve(json);
            }
        };
        xhr.send(null);
    });

}

function displayPhotos() {
    getFilesArray().then(function(fileInfos) {
        var placeholders = [];
        fileInfos.map(function(fileInfo) {
            console.log('fileInfo: ' + JSON.stringify(fileInfo, null, 2));
            placeholders.push('<li id="' + fileInfo._id.$oid + '"></li>');
        });
        document.getElementById('photos').innerHTML = '<ul>' + placeholders.join('') + '</ul>';

        fileInfos.map(function(fileInfo){
            var fileId;
            downloadAsJson(fileInfo.filename).then(function(encryptedJson) {
                console.log('Decrypting ' + encryptedJson.filename);
                fileId = encryptedJson._id.$oid;
                console.log(fileInfo.filename + "ID: " + fileId);
                return decryptContent(encryptedJson.encryptedData, 'secret stuff');
            }).then(function(decrypted) {
                console.log(fileInfo.filename + ' successfully decrypted.');
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(new Blob([decrypted]));
                console.log("image url: " + imageUrl);
                var imageBullet = document.getElementById(fileInfo._id.$oid);
                imageBullet.innerHTML = '<img src="' + imageUrl + '" />';
            });
        });
    });
}

displayPhotos();