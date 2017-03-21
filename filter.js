exports.filterByCity = function(data, out, city) {
    data.forEach(function (d) {
        if (d.city == city) {
            out.push(d);
        }
    });
};

exports.filterOnline = function (data, out) {
    data.forEach(function (d) {
        if(Number(d.status) == 1) {
            out.push(d.id);
        }
    });
};