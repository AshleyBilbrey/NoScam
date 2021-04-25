//NoScam, a project by Ashley Bilbrey

const express = require('express');
const app = express();
const port = 3000;


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
        torespond.message = "Invalid Phone Number"
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
                type: [scamtype],
                areacode: [areacode]
            })
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
                red: [phonenum],
                green: "",
                results: [result],
                pagename: [phonenum]
            });
        }
        
    }
    
});

app.get('/explore/search', function(req, res) {
    res.render('search', {
        pagename: 'Search'
    });
});

app.get('/explore', function(req, res) {
    res.render('explore', {
        pagename: 'Explore'
    });
});

app.listen(port, () => {
  console.log(`NoScam listening at http://localhost:${port}`)
});