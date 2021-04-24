//NoScam, a project by Ashley Bilbrey

const express = require('express')
const app = express()
const port = 3000

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('index', {
        callcount: 5,
        pagename: "Home"
    });
});

app.get('/report', function(req, res) {
    res.render('report', {
        pagename: "Report"
    })
})

app.listen(port, () => {
  console.log(`NoScam listening at http://localhost:${port}`)
})