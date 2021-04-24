//NoScam, a project by Ashley Bilbrey

const express = require('express');
const app = express();
const port = 3000;

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render('index', {
        callcount: 5,
        pagename: "Home"
    });
});

app.get('/report', function(req, res) {
    res.render('report', {
        pagename: "Report"
    });
});

app.post('/report', function(req, res) {
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
    }

    if(false) {
        //Check if valid selection
    }

    //Record report in database
    res.json(torespond);
});

app.get('/learn', function(req, res) {
    res.render('learn', {
        pagename: "Learn"
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