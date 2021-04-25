var firstAuto = false;
var secondAuto = false;

document.getElementById('submit').addEventListener('click', function() {
    sendReport();
});

function reportKeyPress() {
    let phonenumber = document.getElementById('phonenumber')
        if(phonenumber.value.match("[0-9]{3}") && !firstAuto) {
            phonenumber.value += "-";
            firstAuto = true;
        }
        if(phonenumber.value.match("[0-9]{3}-[0-9]{3}") && !secondAuto) {
            phonenumber.value += "-";
            secondAuto = true;
        }
}

function sendReport() {
    let topost = {
        phonenumber: document.getElementById('phonenumber').value,
        scamtype: document.getElementById('scamtype').value
    }

    console.log("Sending:");
    console.log(topost);

    fetch("/report", {
        method: "POST",
      
        body: JSON.stringify(topost),

        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(response => response.json())
    .then(json => {
        console.log("Response:");
        console.log(json);
        if(json.valid == true) {
            document.getElementById("valid").innerText = json.message;
            document.getElementById("invalid").innerText = "";
            document.getElementById("report-form").style.display = "none";
            document.getElementById("report-submit").style.display = "none";
            document.getElementById("explore").style.display = "inline";
        } else {
            document.getElementById("valid").innerText = "";
            document.getElementById("invalid").innerText = json.message;
        }
    });
}