// VARIABLES
var logFile
var gameFile = 'games/game1.ADM'
var gamePlayers
var gameFlags = {}


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
        "text": text.replace(/\(id(.+?)\)/g, '').replace('(DEAD)', ''),
        "icon": "other.png"
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

function addTag(position, icon, title, player) {
    var x = calculatePosition('x', position[0])
    var y = calculatePosition('y', position[1])
    var classes = 'event'

    if(typeof player != 'undefined' && player != false) {
        classes = 'visited'
        x -= 10 + position[2]
        y -= 2 + position[3]
    }

    var tag = '<span class="tag '+classes+'" title="'+ title +'" style="left: '+ x +'px; top: '+ y +'px;">';

    if(typeof icon != 'undefined' && icon != false) {
        if(icon.indexOf('<svg ') > -1)
            tag += icon
        else
            tag += '<img src="img/'+ icon +'" />'
    }
    else {
        tag += '<span class="" style="background-color:'+gamePlayers[player].color+';"></span>'
    }

    tag += '</span>'

    document.getElementById('map').innerHTML += tag

}

function updateConsole() {
    var filters = getFilters()
    var logs = filterLogs(filters)
    var html = "" 
    var actualDate = false

    clearTags()
    setFlags()

    for (var key in logs) {

        if(actualDate != key) {
            actualDate = key
            html += "<br /><b>" + actualDate + "</b><br />"
        }
        
        for (var key2 in logs[key]) {
            html += "- " + logs[key][key2].text + "<br /><br />"

            if(typeof logs[key][key2].position !== 'undefined')
                addTag(logs[key][key2].position, logs[key][key2].icon, key + ': ' + logs[key][key2].tagTitle)

            if(logs[key][key2].type == 'flags') {
                let user = logs[key][key2].text.substr(logs[key][key2].text.indexOf('by ') + 3)
                let flag = logs[key][key2].text.match(/\((.*?),/)[1]

                if(logs[key][key2].text.indexOf('no longer controller') > - 1) {
                    gameFlags[flag].owner = ''
                }
                else {
                    gameFlags[flag].owner = user
                    if(!gameFlags[flag].visited.includes(user)) {
                        gameFlags[flag].visited.push(user)
                    }
                }
            }
        }
    }

    drawFlags()
    updatePlayers()
    
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
        let name = players[key].replace('Player ', '').replace(/"/g, '')
        gamePlayers[name] = {}

        if(colorsPlayers[name])
            gamePlayers[name].color = colorsPlayers[name]
        else
            gamePlayers[name].color = '#' + Math.floor(Math.random()*16777215).toString(16)
            // gamePlayers[key].color = colors.pop()
    }
}

function showPlayers() {

    if(typeof gamePlayers == 'undefined')
        setPlayers()

    for (var key in gamePlayers) {
        let userId = key.replace(/ /g, '_')

        document.getElementById('players').innerHTML += '\
<div class="players color_'+gamePlayers[key].color+'" style="color:'+gamePlayers[key].color+';">\
    <input type="checkbox" id="player_'+userId+'" name="players" class="player" value="'+key+'" checked="checked"\
    style="background-color:'+gamePlayers[key].color+';" />\
    <label for="player_'+userId+'">\
    ' + key + ' (points: <span id="points_'+userId+'">0</span>,\
        active: <span id="active_'+userId+'">0</span>,\
        visited: <span id="visited_'+userId+'">0</span>,\
        first: <span id="first_'+userId+'">0</span>)\
    </label>\
</div>';
    }

    bindChanges('.player')
}

function updatePlayers() {
    for (var key in gamePlayers) {
        gamePlayers[key].active = 0
        gamePlayers[key].visited = 0
        gamePlayers[key].first = 0
    }

    for (var key in gameFlags) {
        if(gameFlags[key].owner != '')
            gamePlayers[gameFlags[key].owner].active += 1

        for(var key2 in gameFlags[key].visited) {
            if(key2 == 0)
                gamePlayers[gameFlags[key].visited[key2]].first += 1

            gamePlayers[gameFlags[key].visited[key2]].visited += 1
        }
    }

    for (var key in gamePlayers) {
        let userId = key.replace(/ /g, '_')
        document.getElementById('active_'+userId).innerHTML = gamePlayers[key].active
        document.getElementById('visited_'+userId).innerHTML = gamePlayers[key].visited
        document.getElementById('first_'+userId).innerHTML = gamePlayers[key].first
        document.getElementById('points_'+userId).innerHTML = gamePlayers[key].active + gamePlayers[key].visited + gamePlayers[key].first
    }
}

function bindChanges(classes) {
    const inputs = document.querySelectorAll(classes);

    inputs.forEach(function(item) {
        item.addEventListener('change', (event) => {
            updateConsole()
        });
    });
}

function setFlags() {
    let logs = getLogs()

    for(var key in logs) {
        if(logs[key][0].indexOf('Control point statuses') > -1) {
            for(var key2 in logs[key]) {
                let flag = logs[key][key2].match(/\((.*?)\)/)
                if(flag) {
                    flag = flag[1].split(',')
                    gameFlags[flag[0].trim()] = {
                        "position": [flag[1].trim(), flag[2].trim()],
                        "owner": "",
                        "visited": []
                    }
                }
            }

            break
        }
    }
}

function drawFlags() {
    const flagPin = '\
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\
    width="100%" height="100%" viewBox="0 0 425.963 425.963" style="enable-background:new 0 0 425.963 425.963; %color%"\
    xml:space="preserve">\
<g>\
   <path d="M213.285,0h-0.608C139.114,0,79.268,59.826,79.268,133.361c0,48.202,21.952,111.817,65.246,189.081\
       c32.098,57.281,64.646,101.152,64.972,101.588c0.906,1.217,2.334,1.934,3.847,1.934c0.043,0,0.087,0,0.13-0.002\
       c1.561-0.043,3.002-0.842,3.868-2.143c0.321-0.486,32.637-49.287,64.517-108.976c43.03-80.563,64.848-141.624,64.848-181.482\
       C346.693,59.825,286.846,0,213.285,0z M274.865,136.62c0,34.124-27.761,61.884-61.885,61.884\
       c-34.123,0-61.884-27.761-61.884-61.884s27.761-61.884,61.884-61.884C247.104,74.736,274.865,102.497,274.865,136.62z"/>\
</g>\
</svg>\
</span>'

    for(var key in gameFlags) {
        if(gameFlags[key].owner != '') {
            addTag(
                gameFlags[key].position, 
                flagPin.replace('%color%', 'fill:'+gamePlayers[gameFlags[key].owner].color+';'), 
                'Owned: ' + gameFlags[key].owner
            )
        }

        if(gameFlags[key].visited.length > 0) {
            for(var key2 in gameFlags[key].visited) {
                gameFlags[key].position[2] = 0
                gameFlags[key].position[3] = key2 * 15 * -1
                
                // gameFlags[key].position[2] = key2 * 15 * -1 - 10
                // gameFlags[key].position[3] = -42

                addTag(
                    gameFlags[key].position, 
                    false, 
                    gameFlags[key].visited[key2],
                    gameFlags[key].visited[key2]
                )
            }
        }
    }
}

function showHide(id) {
    console.log(document.getElementById(id).offsetWidth)
    if(document.getElementById(id).offsetWidth > 0) 
        document.getElementById(id).style.width = '0'
    else
        document.getElementById(id).style.width = '26%'
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

setFlags()