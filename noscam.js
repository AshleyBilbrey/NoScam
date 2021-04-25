//NoScam, a project by Ashley Bilbrey

const express = require('express');
const app = express();
const port = 3000;

require('dotenv').config()
const csv = require('csv-parser');
const fs = require('fs');

//Firebase Database
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


//Set Views
app.set('views', './views');
app.set('view engine', 'ejs');

//Set static file directory and json compatibility
app.use(express.json());
app.use(express.static('static'));

app.get('/', async function(req, res) {
    let count = 0;
    db.collection("reports")
    .get()
    .then((logs) => {
        res.render('index', {
            callcount: logs.size,
            pagename: "Home"
        });
    });
    
});

app.get('/report', async function(req, res) {
    let options = "";
    const typedb = await db.collection('scamtypes').get();
    for(element in typedb.docs) {
        const data = typedb.docs[element].data();
        if(data.code != "other") {
            options += "<option value='";
            options += data.code;
            options += "'>";
            options += data.name;
            options += "</option>";
        }
    }

    res.render('report', {
        options: [options],
        pagename: "Report"
    });
});

app.post('/report', async function(req, res) {
    console.log("New Report");
    console.log(req.body);
    let phonenumber = req.body.phonenumber;
    let scamtype = req.body.scamtype;
    let torespond = {
        valid: true,
        message: "Thank you! Submitted your report."
    }

    if(!phonenumber.match("[0-9]{3}-[0-9]{3}-[0-9]{4}")) {
        torespond.valid = false;
        torespond.message = "Invalid phone number.";
        res.json(torespond);
    } else if(scamtype == '') {
        torespond.valid = false;
        torespond.message = "You must select a type.";
        res.json(torespond);
    } else {

        const numberdb = db.collection('numbers').doc(phonenumber);
        const numberdbdoc = await numberdb.get();
        const typedb = db.collection('scamtypes').doc(scamtype);
        const typedbdoc = await typedb.get();
        const reportdb = db.collection('reports');

        if(typedbdoc.exists) {
            res.json(torespond);
            let currentTime = new Date();
            //Records information about the specific phone number
            if(numberdbdoc.exists) {
                if(numberdbdoc.data()[scamtype] != null) {
                    let newnum = numberdbdoc.data()[scamtype] + 1;
                    await numberdb.update({[scamtype]: newnum});
                } else {
                    await numberdb.update({[scamtype]: 1});
                }
            } else {
                await numberdb.set({
                    [scamtype]: 1,
                    "lastreport": currentTime.getTime()
                })
            }

            //Adds area code, type, and time into a database
            let areacode = phonenumber.substr(0, 3);
            await reportdb.doc(currentTime.getTime().toString()).set({
                date: currentTime.getTime(),
                type: scamtype,
                areacode: areacode
            })

            //Adds to counter
            let counter = Number(typedbdoc.data().count) + 1;
            console.log("New counter: " + counter);
            await typedb.update({count: counter});
        } else {
            torespond.valid = false;
            torespond.message = "Sorry, there was an issue with your submission."
            res.json(torespond);
        }
    }
});

app.get('/learn', async function(req, res) {

    let body = ""
    const typedb = await db.collection('scamtypes').get();
    for(element in typedb.docs) {
        const data = typedb.docs[element].data()
        
        if(data.name != "Other") {
            body += "<div class='scamtype'><div class='scamtextcontainer'><div class='typename'><span class='bold'>"
            body += data.name;
            body += "</span></div><div class='typedesc'>";
            body += data.description;
            body += "</div></div><a class='rightnavigation' href='"
            body += data.source;
            body += "'>Source</a></div>"
        }
    }

    res.render('learn', {
        body: [body],
        pagename: "Learn"
    });

    
});

app.get('/explore/search/:phonenum', async function(req, res) {
    
    let phonenum = req.params.phonenum;
    console.log("New Search");
    console.log(phonenum);

    if(!phonenum.match("[0-9]{3}-[0-9]{3}-[0-9]{4}")) {
        res.render('searchresult', {
            red: "Invalid Phone Number",
            green: "",
            results: "<span class='red'>Please try again.</span>",
            pagename: "Invalid Search"
        });
    } else {
        const numberdb = db.collection('numbers').doc(phonenum);
        const numberdbdoc = await numberdb.get();
        const typedb = db.collection('scamtypes');

        if(!numberdbdoc.exists) {
            res.render('searchresult', {
                red: "",
                green: [phonenum],
                results: "No reports found, but that doesn't mean this phone number isn't a scam! Be vigilant!",
                pagename: [phonenum]
            });
        } else {
            let result = "";
            for(property in numberdbdoc.data()) {
                if(property != "lastreport") {
                    const typedbdoc = await typedb.doc(property).get();
                    result += typedbdoc.data().name;
                    result += ": <span class='red'>";
                    result += numberdbdoc.data()[property];
                    result += " Reports</span><br>";
                }
            }
            result += "Last report for this number was ";
            let d = new Date();
            result += Math.floor((d.getTime() - numberdbdoc.data().lastreport) / 86400000);
            result += " days ago.";
            res.render('searchresult', {
                red: phonenum,
                green: "",
                results: result,
                pagename: phonenum
            });
        }
        
    }
    
});

app.get('/explore/search', function(req, res) {
    res.render('search', {
        pagename: 'Search'
    });
});

/*fs.createReadStream('us-area-code-geo.csv')
.pipe(csv())
.on('data', (row) => {
    console.log(row);
})*/

app.get('/explore/map', async function(req, res) {
    let mapcoords = "";

    //O(n^2), could be O(n)

    const csvstream = fs.createReadStream('us-area-code-geo.csv').pipe(csv())

    const reportdb = await db.collection('reports').get()

    for(element in reportdb.docs) {
        const data = reportdb.docs[element].data();

        csvstream.on('data', (row) => {
            if(row.code == data.areacode) {
                console.log("Found match with area code " + row.code);
                mapcoords += "new google.maps.LatLng(" + row.lat + ", " + row.long + "),"
            }
        })
    }

    setTimeout(() => {
        console.log("Map Coords: " + mapcoords);

        res.render('map', {
            pagename: 'Map',
            key: process.env.MAPS_KEY,
            mapdata: mapcoords
        });
    }, 500);

    
})

app.get('/explore/graphs', async function(req, res) {

    let pieLabels = "";
    let pieData = [];
    let pieColors = "";

    const typedb = await db.collection('scamtypes').get();

    for(element in typedb.docs) {
        const data = typedb.docs[element].data();
        
        pieLabels += "'" + data.name + "', ";
        pieData.push(data.count);
        pieColors += "'" + data.color + "', ";

    }

    let chartLabels = "'Today', '1 Day Ago', '2 Days Ago', '3 Days Ago', '4 Days Ago', '5 Days Ago'";
    let chartColors = "'#BB5EFF', '#BB5EFF', '#BB5EFF', '#BB5EFF', '#BB5EFF', '#BB5EFF'"
    let now = new Date();
    let times = [(now.getTime()), (now.getTime() - 86400000), (now.getTime() - 172800000), (now.getTime() - 259200000), (now.getTime() - 345600000), (now.getTime() - 432000000), (now.getTime() - 518400000)];
    let chartData = [];

    const reportref = db.collection('reports');

    for(let i = 0; i <= 5; i++) {
        let count = await reportref.where("date", "<=", times[i]).where("date", ">", times[i+1]).get();
        chartData.push(count.size);
    }

    res.render('graphs', {
        pagename: "Graphs",
        pieLabels: pieLabels,
        pieColors: pieColors,
        pieData: pieData,
        chartLabels: chartLabels,
        chartColors: chartColors,
        chartData: chartData
    })
})

app.get('/explore', function(req, res) {
    res.render('explore', {
        pagename: 'Explore'
    });
});

app.listen(port, () => {
  console.log(`NoScam listening at http://localhost:${port}`)
});