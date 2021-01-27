
// FUNCTIONS

function loadLogs(logFile) {

    var xhr = new XMLHttpRequest();
    // xhr.timeout = 4000;
    xhr.open('GET', logFile, false);
    xhr.send();

    if (xhr.readyState == 4 && xhr.status == 200) {

        return xhr.responseText
        
    }
}

function filterLogs() {

    var logs = {}
    var file = loadLogs('games/game1.ADM')

    var actions = {

    }

    file.split("\n").forEach((value, index) => {

        let oneLine = value.split(" | ")

        // console.log(oneLine)
        
        if(oneLine.length > 1) {
            let group = oneLine[0]
            // delete oneLine[0]
            oneLine.splice(0, 1)

            if(typeof logs[group] == 'undefined')
                logs[group] = []

            logs[group].push(oneLine.join(" "))
        }
        // oneLine.forEach((value2, index2) => {
        //     document.getElementById('placeholder').innerHTML += value2.trim() + ' :: ';
        // })

        // document.getElementById('placeholder').innerHTML += '<br />';
        // document.getElementById('placeholder').innerHTML += oneLine[0] + ' :: ' + oneLine[1] + '<br />';

    });

    console.log(logs)
    console.log(JSON.stringify(logs))

    // lines.forEach((value, index) => {
    //     document.getElementById('placeholder').innerHTML += '<br /><br />' + value + ': ';

    //     lines.forEach((value2, index2) => {
    //         document.getElementById('placeholder').innerHTML += '<br /> - ' + value2;
    //     })
    // })
}

function filterTypes() {

}



// ACTIONS

// filterLogs()

document.querySelector('.show').addEventListener('change', (event) => {
    const result = document.getElementById('placeholder');

    var slides = document.getElementsByClassName("slide");
    for (var i = 0; i < slides.length; i++) {
        Distribute(slides.item(i));
    }

    if(event.target.checked)
        result.textContent = `You like ${event.target.value}`;
    else
        result.textContent = `You don't like ${event.target.value}`;
});