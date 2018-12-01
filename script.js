    function crawl(data, startindex, exitchar, shouldwarn = true) {
        // General spliting and extraction
        let char = data[startindex],
            index = startindex,
            out = {},
            outstring = ''
        while (char != exitchar && char != undefined) {
            outstring += char
            index += 1
            char = data[index]
        }
        if (char == undefined) {
            if (shouldwarn) {
              alert("Ouch! looks like a problem occurred, this might happen if you input invalid code into the tool")
              console.log('Terminated with: ' + outstring)
            }
            throw "Invalid Request"
        }
        out.data = outstring
        out.endIndex = index
        return out
    }

    function guncrawl(gun2) {
        try {
        // convert the code to valid JSON then return the data (as a dictionary)
        var gun = '{' 
        gun += gun2.slice(0, -1)
        gun = gun.replace('{{', '{')
        if (gun[gun.length-1] != '}') gun += '}'
        return JSON.parse(gun)
        } catch(e) {
          console.log(gun2, gun)
          throw e
        }
    }

    function round1000(number) {
        // rounds things to the thousands place
        return Math.round(number * 1000) / 1000
    }

    function gunExtract(crawledGun) {
        // here we take that JSONd data and scale it
      
        let out = {}

        out.angle = round1000(crawledGun.angle)
        out.shoots = crawledGun.disabled
        out.xOffset = round1000(crawledGun.xoffset * (18/65))
        out.yOffset = (round1000(crawledGun.yoffset * (18/65))) * -1
        out.width = round1000(crawledGun.width * 8/25)
        out.length = round1000(crawledGun.length * (18 / 65))
        out.reload = round1000(crawledGun.basereload * (1 / 3))
        out.delay = round1000(crawledGun.basedelay * (1 / 3))
        if (isNaN(out.delay)) out.delay = 0
        out.bullet = {}
        out.bullet.speed = round1000(crawledGun.b[1] * (4.5 / 5))
        out.bullet.range = round1000(round1000(crawledGun.b[2]) * (1 / 60) / 2)
        out.recoil = crawledGun.knockback * 10
        out.spray = crawledGun.spread * 1000
        if (out.spray == 0) {
          out.spray = '0.00001'
        }
        let propReload = out.reload / 20,
            propDelay = out.delay / 20
        out.delay = round1000(propDelay / propReload)
        switch (crawledGun.type) {
            case 0:
                out.shotType = 'bullet'
                out.aspect = 1
                out.type = 'bullet'
                break;
            case 1:
                out.shotType = 'trap'
                out.aspect = 1
                out.type = 'trap'
                break;
            case 2:
                out.shotType = 'drone'
                out.aspect = 2.7
                out.length = round1000(crawledGun.length * (8 / 65))
                out.width = round1000(crawledGun.width * (3.5 / 25))
                out.xOffset += 8
                out.type = 'drone'
                break;
            case 3:
                out.shotType = 'sunchip'
                out.aspect = 2.7
                out.length = round1000(crawledGun.length * (8 / 65))
                out.width = round1000(crawledGun.width * (3.5 / 25))
                out.xOffset += 8
                out.type = 'sunchip'
                break;
            case 4:
                out.shotType = 'autoTurret'
                out.aspect = -2
                break;
        }
        return out
    }

    // Begin

    // This is a placeholder so that we can handle auto turrets seperatly from standard guns
    let turrets = [],
        // Code is passed in window URI
        winloc = decodeURIComponent(window.location)
    
    // Seperate code from rest of the URI
    let code = winloc.split('=')[1].trim(),
        // Here we set up the data to pull from, defaults are also set up here
        tank = {
            shape: 0,
            size: 1
        }

    // Remove comment strings
    if (code != undefined) {
        code += '|'
        code = code.replace(/(comment":"[\w*\s*\- _+]*")/gi, 'comment":""')
    }

    // Easier to understand later, writes to the page
    function write(string) {
        document.getElementById("output").innerHTML += string
        document.getElementById("output").innerHTML += '</br>'
    }

    // only run if a code has been supplied
    if (code != undefined) {
        console.log("A tank was passed with code length:", code.length)
        tank.size = crawl(code, 0, '*').data
        tank.size = round1000((tank.size * (12 / 32)))
        
        try {
          var tempindex = crawl(code, 0, '*', false).endIndex + 1,
              shapeData = crawl(code, tempindex, "*", false)

          var shapeString = shapeData.data
          tempindex = shapeData.endIndex
          tempindex = crawl(code, tempindex + 1, '"').endIndex
        } catch(e) {
          var tempindex = crawl(code, 0, '[').endIndex + 1,
              shapeData = crawl(code, tempindex, "[")

          var shapeString = shapeData.data
        }

        let gunsData = crawl(code, tempindex, '|').data

        let gunsDataA = gunsData.split('+'),
            gunsDataAE = []

        switch (shapeString) {
            case 'circle':
                tank.shape = 0
                break;
            case 'square':
                tank.shape = 4
                break;
            case 'triangle':
                tank.shape = 3
                break;
            case 'pentagon':
                tank.shape = 5
        }
        write('exports.hongtank = {')
        write('PARENT: [exports.genericTank],')
        write('LABEL: "EASY TANK (by hong)",')
        write('SIZE: ' + tank.size + ',')
        write('SHAPE: ' + tank.shape + ',')
        write('GUNS: [')
        
        gunsDataA.forEach(function(element) {
          if (element.length > 2) {
            let out = guncrawl(element)
            gunsDataAE.push(out)
          }
        })

        console.log('Guns:', gunsDataAE.length)

        gunsDataAE.forEach(function(newgun) {
            let gun = gunExtract(newgun)
            if (gun.shotType != 'autoTurret') {
                if (gun.type == 'trap') {
                    write('{')
                    write('POSITION: [' + gun.length + ',' + gun.width + ',' + gun.aspect + ',' + gun.xOffset + ',' + gun.yOffset + ',' + gun.angle + ',' + gun.delay + ']' + ',')
                    write('},')
                }
                write('{')
                if (gun.type != 'trap') {
                    write('POSITION: [' + gun.length + ',' + gun.width + ',' + gun.aspect + ',' + gun.xOffset + ',' + gun.yOffset + ',' + gun.angle + ',' + gun.delay + '],')
                } else {
                    write('POSITION: [' + round1000((gun.length * (4 / 24))) + ', ' + gun.width + ', 1.3, ' + (gun.xOffset + gun.length) + ', ' + gun.yOffset + ', ' + gun.angle + ', ' + gun.delay + ' ],')
                }
                if (gun.shoots == true) {
                    write('PROPERTIES: {')
                    let stats = function() {
                        switch (gun.type) {
                            case 'bullet':
                                return '[' + gun.reload + ', ' + gun.recoil + ', 0.001, 1, 1, 0.75, 1, ' + gun.bullet.speed + ', 1, ' + gun.bullet.range + ', 1, ' + gun.spray + ', 1]'
                                break;
                            case 'trap':
                                return '[' + gun.reload + ', ' + gun.recoil + ', 0.001, 0.45, 0.6, 0.39, 1.25, ' + gun.bullet.speed + ', 0.8, ' + gun.bullet.range + ', 1.25, ' + gun.spray + ', 1]'
                                break;
                            case 'drone':
                                return '[' + gun.reload + ', ' + gun.recoil + ', 0.001, 1.54, 1.02, 1.26, 1, ' + gun.bullet.speed + ', 0.9, ' + gun.bullet.range + ', 2, ' + gun.spray + ', 1]'
                                break;
                            case 'sunchip':
                                return '[' + gun.reload + ', ' + gun.recoil + ', 0.001, 1.84, 0.6, 0.6, 0.6, ' + gun.bullet.speed + ', 0.8, ' + gun.bullet.range + ', 0.8, ' + gun.spray + ', 1]'
                                break;
                        }
                    }
                    write('SHOOT_SETTINGS: combineStats([' + stats() + ']),')
                    write('TYPE: exports.' + gun.shotType)
                    write('}, }, ')
                } else {
                    write('},')
                }
            } else {
                turrets.push(gun)
            }
        })
        write('], };')
    }
