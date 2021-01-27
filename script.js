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

function filterOneLog(text) {

    var results = {
        "type": false,
        "text": text.replace(/ *\([^)]*\)*/g, '')
    }

    var actions = {
        "death": {
            "filter": ["killed", "died"],
            "regDelete": / *\([^)]*\)*/g,
            "regPosition": /<(.*?)>/,
            "regUser": /"(.*?)"/g,
            "icon": "death"
        }
    }

    for (var key in actions) {
        
        for (var filter in actions[key].filter) {
            if(text.indexOf(actions[key].filter[filter]) > -1) {
                
                let tagTitle = text.match(actions[key].regUser)[0]
                if(typeof text.match(actions[key].regUser)[1] !== 'undefined')
                    tagTitle = text.match(actions[key].regUser)[1] + '-->' + text.match(actions[key].regUser)[0]

                results = {
                    "type": key,
                    "text": text.replace(actions[key].regDelete, ''),
                    "tagTitle": tagTitle.replace(/"/g, ""), 
                    "icon": actions[key].icon
                }

                if(typeof actions[key].regPosition !== 'undefined')
                    results['position'] = text.match(actions[key].regPosition)[1].split(',', 2)
                
                break;
            }
        }
    }

    return results
}

function filterLogs(filters = []) {
    var logs = getLogs()
    var results = {}
    
    for (var key in logs) {
        logs[key].forEach(value => {
            let filteredLog = filterOneLog(value)
            
            if(filters.length == 0 || filters.includes(filteredLog.type)) {
                results[key] = filteredLog
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

function clearTags() {
    var elements = document.getElementsByClassName("tag");
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function addTag(position, icon, title) {
    // var x_mod = 0.27
    // var y_mod = -13770
    // var x_mod = document.getElementById('x').value
    // var y_mod = document.getElementById('y').value

    // var x = parseInt(position[0]) * parseFloat(0.27) + parseFloat(-2700)
    // var y = parseInt(position[1]) * parseFloat(x_mod) + parseFloat(y_mod)

    var x = (parseInt(position[0]) - 9783) * (1400 / 5573) - 20
    var y = Math.abs(856 - (parseInt(position[1]) - 11973) * (856 / 3382)) - 40

    var tag = '<span class="tag icon_'+ icon +'" title="'+ title +'" style="left: '+ x +'px; top: '+ y +'px;"></span>'

    document.getElementById('map').innerHTML += tag

}

function updateConsole() {
    var logs = filterLogs(getFilters())
    var html = "" 
    var actualDate = false

    clearTags()

    for (var key in logs) {

        if(actualDate != key) {
            actualDate = key
            html += "<br /><b>" + actualDate + "</b><br />"
        }
        
        html += logs[key].text + "<br />"

        if(typeof logs[key].position !== 'undefined')
            addTag(logs[key].position, logs[key].icon, key + ': ' + logs[key].tagTitle)
    }
    
    document.getElementById('results').innerHTML = html
}


// ACTIONS

// getLogs()

document.querySelector('.show').addEventListener('change', (event) => {

    updateConsole()

    // const result = document.getElementById('results');
    // if(event.target.checked)
    //     result.textContent = `You like ${event.target.value}`;
    // else
    //     result.textContent = `You don't like ${event.target.value}`;
});