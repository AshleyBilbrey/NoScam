var firstAuto = false;
var secondAuto = false;

document.getElementById('submit').addEventListener('click', function() {
    search();
});

function searchKeyPress() {
    
    if (event.keyCode == 13) {
        search();
    } else {
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
        
}

function search() {
    let phonenumber = document.getElementById('phonenumber');
    if(!phonenumber.value.match("[0-9]{3}-[0-9]{3}-[0-9]{4}")) {
        document.getElementById("invalid").innerText = "Invalid Phone Number";
    } else {
        window.location.href = "/explore/search/" + phonenumber.value;
    }
}