document.getElementById('submit').addEventListener('click', function() {
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
});