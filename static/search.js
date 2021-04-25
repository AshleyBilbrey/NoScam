document.getElementById('submit').addEventListener('click', function() {
    search();
});

function search() {
    phonenumber = document.getElementById('phonenumber');
    if(!phonenumber.value.match("[0-9]{3}-[0-9]{3}-[0-9]{4}")) {
        document.getElementById("invalid").innerText = "Invalid Phone Number";
    } else {
        window.location.href = "/explore/search/" + phonenumber.value;
    }
}