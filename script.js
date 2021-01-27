// VARIABLES
var gameFile = 'games/game1.ADM'


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

function getLogs() {

    var logs = {}
    var file = loadLogs(gameFile)

    file.split("\n").forEach((value, index) => {

        let oneLine = value.split(" | ")
        
        if(oneLine.length > 1) {
            let group = oneLine[0]
            // delete oneLine[0]
            oneLine.splice(0, 1)

            if(typeof logs[group] == 'undefined')
                logs[group] = []

            logs[group].push(oneLine.join(" "))
        }

    });

    return logs
}

function filterText(text) {

    var results = {
        "type": false,
        "text": text.replace(/ *\([^)]*\)*/g, '')
    }
    var actions = {
        "deaths": {
            "filter": "killed",
            "regDelete": / *\([^)]*\)*/g,
            "regPosition": /<(.*?)>/
        }
    }

    for (var key in actions) {
    
        // text.filter(function (str) { return value.test(str); })
        
        if(text.indexOf(actions[key].filter) > -1) {
            results = {
                "type": key,
                "text": text.replace(actions[key].regDelete, '')
            }

            if(typeof actions[key].regPosition !== 'undefined')
                results['position'] = text.match(actions[key].regPosition)[1]
            
            break;
        }
        
    }

    return results
}

function filterLogs(filters = []) {
    var logs = getLogs()
    var results = {}
    
    for (var key in logs) {
        logs[key].forEach(value => {
            let filteredText = filterText(value)
            
            if(filters.length == 0 || filters.includes(filteredText.type)) {
                results[key] = filteredText.text
                console.log(filteredText.position)
            }
        })
    }

    return results
}

function getFilters() {
    var inputs = document.getElementsByClassName("show")
    var filters = []

    for (var i = 0; i < inputs.length; i++) {
        if(inputs.item(i).checked)
            filters.push(inputs.item(i).value)
    }
    
    return filters
}


function updateConsole() {
    var logs = filterLogs(getFilters())
    var html = "" 
    var actualDate = false

    for (var key in logs) {
        console.log(logs[key])

        if(actualDate != key) {
            actualDate = key
            html += "<br /><b>" + actualDate + "</b><br />"
        }
        
        html += logs[key] + "<br />"
    }
    
    document.getElementById('placeholder').innerHTML = html
}


// ACTIONS

// getLogs()

document.querySelector('.show').addEventListener('change', (event) => {

    updateConsole()

    // const result = document.getElementById('placeholder');
    // if(event.target.checked)
    //     result.textContent = `You like ${event.target.value}`;
    // else
    //     result.textContent = `You don't like ${event.target.value}`;
});