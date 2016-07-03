var constellation = $.signalR.createConstellationConsumer("http://localhost:8088",
    "734282b1a9c9a2b6fdcdf9e00e6dbdb49f36857e", "test");



$('[name*="Liked"]').click(function () {
    var s = this.name.split('|');
    var i = s[1];
    constellation.server.sendMessage({ Scope: 'Package', Args: ['AdRaterPackage'] }, 'sendRating',
    { upvotes:1, downvotes:0, comment: $("#Commentaire" + i).val(), brand: $("#Brand" + i).attr('name'), date: getNow() });

    $(this).css('color', 'green');
});

$('[name*="Disliked"]').click(function () {
    var s = this.name.split('|');
    var i = s[1];
    constellation.server.sendMessage({ Scope: 'Package', Args: ['AdRaterPackage'] }, 'sendRating',
    { upvotes: 0, downvotes: 1, comment: $("#Commentaire" + i).val(), brand: $("#Brand" + i).attr('name'), date: getNow() });

    $(this).css('color', 'red');
    var string = 'SubmitLiked' + i;
    $([name=string]).css('color', 'grey');
});


$("#brandAdder").click(function () {

    var name = $("#brandName").val();
    console.log("brand pushed : " + name);
    if (name != "") {
        constellation.server.sendMessage({ Scope: 'Package', Args: ['AdRaterPackage'] }, 'sendNewBrand', name);
    }
});

constellation.client.onUpdateStateObject(function (stateobject) {
    console.log(stateobject);
});
constellation.connection.stateChanged(function (change) {
    if (change.newState === $.signalR.connectionState.connected) {
        constellation.server.requestSubscribeStateObjects("ISENMIC-245RS5C", "AdRaterPackage", "*", "*");
    }
});

function getNow() {
    var date = new Date();
    var day = date.getDate();        
    var month = date.getMonth()+1;   
    var year = date.getFullYear(); 
    var hour = date.getHours();     
    var minute = date.getMinutes(); 
    var second = date.getSeconds(); 

    var time = day + "/" + month + "/" + year + " " + hour + ':' + minute + ':' + second;
    return time;
}

$('[name*="Liked"').on('click', function (e) { e.preventDefault(); return true; });
$('[name*="Disliked"').on('click', function (e) { e.preventDefault(); return true; });

constellation.connection.start();

