// VARIABLES
var gameFile = 'games/game1.ADM'
var logFile
var gamePlayers


// FUNCTIONS

function loadLogs(file) {
    
    var xhr = new XMLHttpRequest();
    // xhr.timeout = 4000;
    xhr.open('GET', file, false);
    xhr.send();

    if (xhr.readyState == 4 && xhr.status == 200) {

        return xhr.responseText
        
    }
}

function getLogs() {

    var logs = {}

    if(typeof logFile == 'undefined')
        logFile = loadLogs(gameFile)

    logFile.split("\n").forEach((value, index) => {

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

    var regPosition = /<(.*?)>/
    var regDelete = /\(id(.+?)\)/g
    // var regDelete = / *\([^)]*\)*/g
    var regUser = /"(.*?)"/g

    var results = {
        "type": false,
        "text": text.replace(/\(id(.+?)\)/g, '').replace('(DEAD)', '')
    }

    var actions = {
        "flags": {
            "filter": ["conquered", "longer controller"],
            "regDelete": regDelete,
            "regUser": regUser,
            "icon": "flag.png"
        },
        "deaths": {
            "filter": ["killed", "died"],
            "regDelete": regDelete,
            "regUser": regUser,
            "icon": "death.png"
        },
        "damages": {
            "filter": ["hit by Player"],
            "regDelete": regDelete,
            "regUser": regUser,
            "icon": "hit.png"
        },
        "zombies": {
            "filter": ["hit by", "consciousness", "unconscious"],
            "regDelete": regDelete,
            "regUser": regUser,
            "icon": "damage.png"
        },
        "constructions": {
            "filter": ["placed"],
            "regDelete": regDelete,
            "regUser": regUser,
            "icon": "construction.png"
        },
        "connections": {
            "filter": ["connected"],
            "regDelete": regDelete,
            "regUser": regUser,
            "icon": "connected.png"
        },
        "rest": {
            "filter": [""],
            "regDelete": regDelete,
            "regUser": regUser,
            "icon": "other.png"
        }
    }
    
    for (var key in actions) {
        for (var filter in actions[key].filter) {
            if(actions[key].filter[filter] !== '' && text.indexOf(actions[key].filter[filter]) > -1) {

                let tagTitle = ""
                if(text.match(actions[key].regUser) !== null) {
                    tagTitle = text.match(actions[key].regUser)[0]
                    if(typeof text.match(actions[key].regUser)[1] !== 'undefined')
                        tagTitle = text.match(actions[key].regUser)[1] + '-->' + text.match(actions[key].regUser)[0]

                    tagTitle = tagTitle.replace(/"/g, "")
                }

                results = {
                    "type": key,
                    "text": text.replace(actions[key].regDelete, '').replace('(DEAD)', ''),
                    "tagTitle": tagTitle, 
                    "icon": actions[key].icon
                }

                if(text.indexOf('pos=<') > -1)
                    results['position'] = text.match(regPosition)[1].split(',', 2)
                
                break;
            }
        }

        if(results.type !== false)
            break;
    }
    
    return results
}

function filterLogs(filters = []) {
    var logs = getLogs()
    var results = {}
    
    for (var key in logs) {
        logs[key].forEach(value => {
            let filteredLog = filterOneLog(value)
            
            if(
                (filters.includes(filteredLog.type) || filters.includes('rest')) 
                && textFilter(filteredLog.text) 
                && playerFilter(filteredLog.text)
            ) {
                if(typeof results[key] == 'undefined')
                    results[key] = []

                results[key].push(filteredLog)
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

function customFilter(text, search, type) {
    var test = 0
    var filterValue = document.getElementById("custom").value.trim()
    var filter = filterValue.split(';')
    
    if(search.length > 0 && search[0] != '') {
        for(var key2 in search) {
            if(text.indexOf(search[key2].trim()) > -1) {
                test += 1
            }
        }
    }
    else 
        test = 1
    
    if((test > 0 && !type) || (test == search.length && type))
        return true
    else
        return false
}

function textFilter(text) {
    return customFilter(text, document.getElementById("custom").value.trim().split(';'), document.getElementById("customAnd").checked)
}

function playerFilter(text) {

    let playerFilters = document.querySelectorAll(".player")
    let players = []
    
    playerFilters.forEach(function(item) {
        if(item.checked)
            players.push(item.value)
    });
    console.log(players)
    return customFilter(text, players, false)
}

function calculatePosition(axis, position, mapWidth=1400, mapHeight=856) {

    if(axis == 'x')
        return (parseInt(position) - 9783) * (mapWidth / 5573) - 20
    else
        return Math.abs(mapHeight - (parseInt(position) - 11973) * (mapHeight / 3382)) - 40

}

function clearTags() {
    var elements = document.getElementsByClassName("tag");
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function addTag(position, icon, title) {
    var x = calculatePosition('x', position[0])
    var y = calculatePosition('y', position[1])

    var tag = '<span class="tag" title="'+ title +'" style="left: '+ x +'px; top: '+ y +'px; background-image: url(\'img/'+ icon +'\');"></span>'

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
        
        for (var key2 in logs[key]) {
            html += "- " + logs[key][key2].text + "<br /><br />"

            if(typeof logs[key][key2].position !== 'undefined')
                addTag(logs[key][key2].position, logs[key][key2].icon, key + ': ' + logs[key][key2].tagTitle)
        }
    }
    
    document.getElementById('results').innerHTML = html
}

function setPlayers() {

    gamePlayers = {}
    let players
    let regexp = /Player "(.*?)"/g
    let colorsPlayers = {
        "MC":"blue",
        "Mardok":"green",
        "Stefan":"red",
        "Jez":"pink",
        "NieWaskiDzik":"fuchsia",
        "Superkomunista":"lime"
    }
    let colors = ['gray', 'black']

    if(typeof logFile == 'undefined')
        logFile = loadLogs(gameFile)

    players = [...new Set(logFile.match(regexp))]

    for(var key in players) {
        gamePlayers[key] = {}
        gamePlayers[key].name = players[key].replace('Player ', '').replace(/"/g, '')
        if(colorsPlayers[gamePlayers[key].name])
            gamePlayers[key].color = colorsPlayers[gamePlayers[key].name]
        else
            gamePlayers[key].color = '#' + Math.floor(Math.random()*16777215).toString(16)
            // gamePlayers[key].color = colors.pop()
    }
}

function showPlayers() {

    if(typeof gamePlayers == 'undefined')
        setPlayers()

    for (var key in gamePlayers) {
        document.getElementById('players').innerHTML += '\
<div class="players color_'+gamePlayers[key].color+'" style="color:'+gamePlayers[key].color+';">\
    <input type="checkbox" id="player_'+key+'" name="players" class="player" value="'+gamePlayers[key].name+'" checked="checked"\
    style="background-color:'+gamePlayers[key].color+';" />\
    <label for="player_'+key+'">' + gamePlayers[key].name + '</label>\
</div>';
    }

    bindChanges('.player')
}

function bindChanges(classes) {
    const inputs = document.querySelectorAll(classes);

    inputs.forEach(function(item) {
        item.addEventListener('change', (event) => {
            updateConsole()
        });
    });
}


// ACTIONS

// getLogs()

// document.querySelector('.show').addEventListener('change', (event) => {
    
//     updateConsole()

    // const result = document.getElementById('results');
    // if(event.target.checked)
    //     result.textContent = `You like ${event.target.value}`;
    // else
    //     result.textContent = `You don't like ${event.target.value}`;
// });


bindChanges('.show')

showPlayers()