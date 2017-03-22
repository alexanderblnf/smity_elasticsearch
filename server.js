var path = require('path');
var uradHeaders = {
    'Content-Type': 'application/json',
    'X-User-id': '494',
    'X-User-hash': '0abd4356b71d9b36d741c592e66080f5'
};
var http = require('http');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: [
	{
	type: 'file',
	level: 'trace',
	path: './elasticsearch.log'
    	},
	{
	type: 'file',
	level: 'error',
	path: './elasticsearch.err'
	}
	]
});
var filter = require('./filter');

//app.set('view engine', 'ejs'); // set up ejs for templating
// required for passport

// routes ======================================================================
var parameters = ["temperature", "humidity", "pressure", "voc", "co2", "ch2o", "pm25", "cpm"];
var online = [];

function showOnlineinAlba() {
    var inCity = [];
    online = [];
    var options = {
        headers: uradHeaders,
        host: 'data.uradmonitor.com',
        path: '/api/v1/devices/',
        method: 'GET'
    };

    http.get(options, function (response) {
        var full = "";
        response.on('data', function (data) {
            full += data;
        });

        response.on('end', function () {
            var data = JSON.parse(full);
            filter.filterByCity(data, inCity, 'Alba Iulia');
            filter.filterOnline(inCity, online);
            setTimeout(showOnlineinAlba, 3600000);
        });
    });
}

function addData(device, parameter) {
    var options = {
        headers: uradHeaders,
        host: 'data.uradmonitor.com',
        path: '/api/v1/devices/' + device + '/' + parameter + '/60',
        method: 'GET'
    };
    http.get(options, function (response) {
        var full = "";
        response.on('data', function (data) {
            full += data;
        });

        response.on('end', function () {
            var data = JSON.parse(full);
            if (data.success == null && data.error == null) {
                var urad = {
                    time: Number(data[0].time),
                    lat: Number(data[0].latitude),
                    long: Number(data[0].longitude)
                };
                urad[parameter] = Number(data[0][parameter]);

                client.create({
                    index: device.toLowerCase(),
                    type: parameter,
                    id: urad.time,
                    body: urad
                }, function (error, responseE) {
                    if (error) {
                        console.log('Error: ' + error);
                        console.log('Creation error');
                    }
                });
            } else {
                console.log('Sensor does not function');
            }
        });
    });

}

function addAll() {
    if (online.length > 0) {
        online.forEach(function (d) {
            parameters.forEach(function(p) {
                addData(d, p);
            });
        });
	setTimeout(addAll, 180000);
    } else {
        setTimeout(addAll, 10000);
    }
}

showOnlineinAlba();
setTimeout(addAll, 10000);

