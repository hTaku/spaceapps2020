"use strict";



// WorldWind.configuration.setValue(INITIAL_LATITUDE, -45.0);
// WorldWind.configuration.setValue(INITIAL_LATITUDE, -45.0);
WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

var wwd = new WorldWind.WorldWindow("canvasOne");

console.log("Config")
console.log(WorldWind.configuration);

// default is 250000000
WorldWind.configuration.gpuCacheSize = 250000000;

// 起動時の初期位置
wwd.navigator.lookAtLocation.latitude = 40;
wwd.navigator.lookAtLocation.longitude = -110;
wwd.navigator.range = 4000000; // 2 million meters above the ellipsoid
wwd.navigator.tilt = 45;
// Redraw the WorldWindow.
wwd.redraw();

// ベースとなるレイヤーの設定
var layers = [
    {layer: new WorldWind.BMNGLayer(), enabled: true},
    {layer: new WorldWind.BingAerialLayer(null), enabled: false}
];

for (var l = 0; l < layers.length; l++) {
    layers[l].layer.enabled = layers[l].enabled;
    layers[l].layer.hide = layers[l].hide;
    wwd.addLayer(layers[l].layer);
}

var viewControlsLayer = new WorldWind.ViewControlsLayer(wwd);
// コントローラーの表示位置
viewControlsLayer.alignment = new WorldWind.Offset(WorldWind.OFFSET_FRACTION, 0, WorldWind.OFFSET_FRACTION, 0.85);
viewControlsLayer.placement = new WorldWind.Offset(WorldWind.OFFSET_FRACTION, 0, WorldWind.OFFSET_FRACTION, 0.85);
//ボタンの表示・非表示
viewControlsLayer.showHeadingControl = false;
viewControlsLayer.showTiltControl = true;
viewControlsLayer.showZoomControl = false;
viewControlsLayer.showExaggerationControl = false;
wwd.addLayer(viewControlsLayer);

var updateTime = 3000;
// デブリ表示用レイヤー
var debriLayer = new WorldWind.RenderableLayer("Debri");
wwd.addLayer(debriLayer);
var debriPlacemarkAttributes = new WorldWind.PlacemarkAttributes(null);

// 自機表示用レイヤー
var playerLayer = new WorldWind.RenderableLayer("Player");
wwd.addLayer(playerLayer);

var modelScene;
var playerModel = {
    displayName: 'player',
    fileName: 'player.dae',
    path: 'player',
    initialScale: 1500,
    maxScale: 1500,
    xRotation: 0,
    yRotation: 180,
    zRotation: 0,
    useTexturePaths: true
};
var playerPosition = {
    latitude: 35,
    longitude: -110,
    altitude: 600e3
};


var wwdPlayerPosition = new WorldWind.Position(playerPosition.latitude, playerPosition.longitude, playerPosition.altitude);
var playerColladaLoader = new WorldWind.ColladaLoader(wwdPlayerPosition);
playerColladaLoader.init({dirPath: './models/'});
playerColladaLoader.load(playerModel.fileName, function (scene) {
    console.log('scene', scene);

    if (scene) {
        scene.scale = playerModel.initialScale;
        scene.altitudeMode = WorldWind.ABSOLUTE;
        scene.useTexturePaths = playerModel.useTexturePaths;

        playerLayer.removeAllRenderables();
        playerLayer.addRenderable(scene);

        modelScene = scene;
        modelScene.xRotation = playerModel.xRotation;
        modelScene.yRotation = playerModel.yRotation;
        modelScene.zRotation = playerModel.zRotation;

    }
});

// デブリの大きさ、画像など
// placemarkAttributes.imageColor = WorldWind.Color.YELLOW;
debriPlacemarkAttributes.imageScale = 0.2;
debriPlacemarkAttributes.imageSource = "image/debris.png";

var score = 0;
var keydownCount = 1;
document.addEventListener("keydown", function(e){
    switch(e.keyCode){
        case 37:
            console.log("key left: " + String(e.keyCode));
            playerPosition.longitude -= 0.5;
            break;
        case 38:
            console.log("key up: " + String(e.keyCode));
            playerPosition.latitude += 0.5;
            break;
        case 39:
            console.log("key right: " + String(e.keyCode));
            playerPosition.longitude += 0.5;
            break;
        case 40:
            console.log("key down: " + String(e.keyCode));
            playerPosition.latitude -= 0.5;
            break;
        case 65:
            console.log("key a: ") + String(e.keyCode);
            playerPosition.altitude += 0.5;
            break;
        case 70:
            console.log("key f: ") + String(e.keyCode);
            playerPosition.altitude -= 0.5;
            break;
        default:
            console.log("key: " + String(e.keyCode));
            break;
    }

    if(keydownCount % 10 == 0){
        score += 10;
        $('#score').html(score);
    }
    keydownCount += 1;

    wwdPlayerPosition.latitude = playerPosition.latitude;
    wwdPlayerPosition.longitude = playerPosition.longitude;
    wwdPlayerPosition.altitude = playerPosition.altitude;

    wwd.navigator.lookAtLocation.latitude = playerPosition.latitude;
    wwd.navigator.lookAtLocation.longitude = playerPosition.longitude;
    wwd.navigator.lookAtLocation.altitude = playerPosition.altitude;
    wwd.redraw();
});

var satVelocity = [];
function getVelocity(satrec, time) {

  var j = jday(time.getUTCFullYear(),
    time.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
    time.getUTCDate(),
    time.getUTCHours(),
    time.getUTCMinutes(),
    time.getUTCSeconds());
  j += time.getUTCMilliseconds() * 1.15741e-8;

  var m = (j - satrec.jdsatepoch) * 1440.0;
  var pv = satellite.sgp4(satrec, m);
  var vx, vy, vz;

  vx = pv.velocity.x;
  vy = pv.velocity.y;
  vz = pv.velocity.z;

  var satVelocity = Math.sqrt(
    vx * vx +
    vy * vy +
    vz * vz
  );
  return satVelocity;
}

function sanitizeSatellites(objectArray) {
    var faultySatellites = 0;
    var resultArray = [];
    var maxSats = objectArray.length;
    updateTime = performance.now();
    var now = new Date();
    var time = new Date(now.getTime());
    for (var i = 0; i < maxSats; i += 1) {
      try {
        var satrec = satellite.twoline2satrec(objectArray[i].TLE_LINE1, objectArray[i].TLE_LINE2);
        if(satrec === undefined) continue;
        var position = getPosition(satrec, time);
        var velocity = getVelocity(satrec, time);

      } catch (err) {
        console.log(err);
       // console.log(objectArray[i].OBJECT_NAME +" is a faulty sat it is " + i);
        faultySatellites += 1;
        // objectArray.splice(i,1);
        // i--;
        continue;
      }

      if(typeof objectArray[i].LAUNCH_DATE === "undefined") continue;

      resultArray.push(objectArray[i]);
    }
    updateTime = performance.now() - updateTime;
    console.log(faultySatellites);
    console.log(objectArray.length + " from uncleansed");
    console.log(resultArray.length + " from cleansed");
    return resultArray;
}


  //retrieves TLE data
var grndStationsWorker = new Worker("js/Workers/groundStationsWorker.js");

grndStationsWorker.postMessage("group work");
grndStationsWorker.addEventListener('message', function (event) {
  grndStationsWorker.postMessage('close');
  getGroundStations(event.data);
}, false);

function getGroundStations(groundStations) {
    var satParserWorker = new Worker("js/Workers/satelliteParseWorker.js");
    satParserWorker.postMessage("work, satellite parser, work!");
    //Retrieval of JSON file data from worker threads. Also, closing such threads.
    satParserWorker.addEventListener('message', function (event) {
        //var satData = event.data;
        satParserWorker.postMessage('close');
        getSatellites(event.data);
    }, false);


    function getSatellites(satellites) {
        var satPac = sanitizeSatellites(satellites);
        satPac.satDataString = JSON.stringify(satPac);

        var satNum = satPac.length;

        //初期表示
        renderSats(satPac);
        function renderSats(satData) {
            var everyCurrentPosition = [];
            var now = new Date();
            for(var j = 0; j < satNum; j++){
                var currentPositioin = null;
                var time = new Date(now.getTime());
                try {
                    // 座標のデータ 更新
                    var velocity = getVelocity(satellite.twoline2satrec(satData[j].TLE_LINE1, satData[j].TLE_LINE2), time);
                    var position = getPosition(satellite.twoline2satrec(satData[j].TLE_LINE1, satData[j].TLE_LINE2), time);
                } catch (err) {
                    console.log(err + ' in renderSats, sat ' + j +  " " + satPac[j].OBJECT_NAME);
                    continue;
                }

                try {
                    satVelocity.push(velocity);
                    currentPositioin = new WorldWind.Position(position.latitude, position.longitude, position.altitude);
                    everyCurrentPosition.push(currentPositioin);
                    satData[j] = satData[j].LAUNCH_DATE.substring(0, 4);
                } catch (err) {
                    console.log(err + ' in renderSats, sat ' + j);
                    console.log(satData[j].OBJECT_NAME);
                    continue;
                }
                var higlightPlacemarkAttributes = new WorldWind.PlacemarkAttributes(debriPlacemarkAttributes);
                higlightPlacemarkAttributes.imageScale = 0.4;

                var placemark = new WorldWind.Placemark(everyCurrentPosition[j]);
                placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
                placemark.attributes = debriPlacemarkAttributes;
                placemark.higlightAttributes = higlightPlacemarkAttributes;
                debriLayer.addRenderable(placemark);

                wwd.redraw();
            }

            // 作成中：タイマーで 一定間隔で デブリの位置を更新
            // ここが重くなっている？
//             var updatePositions = setInterval(function () {
//                 for (var indx = 0; indx < satNum; indx += 1) {
//                     var timeSlide = 1;
//                     var now = new Date();
//                     var time = new Date(now.getTime() + timeSlide * 60000);
//                     try {
//                         var data = satData[indx];
//                         // 座標データ 現在の時刻に合わせて再計算
//                         var position = getPosition(satellite.twoline2satrec(data.TLE_LINE1, data.TLE_LINE2), time);
//                         satVelocity[indx] = getVelocity(satellite.twoline2satrec(data.TLE_LINE1, data.TLE_LINE2), time);
//                     } catch (err) {
//                         console.log(err + ' in updatePositions interval, sat ' + indx + satPac[indx].OBJECT_NAME);
// //                        continue;
//                     }
//                     try {
//                         everyCurrentPosition[indx].latitude = position.latitude;
//                         everyCurrentPosition[indx].longitude = position.longitude;
//                         everyCurrentPosition[indx].altitude = position.altitude;
//                     } catch (err) {
//                         //TODO: Handle deorbited sats
//                     }
//                 }
//                 wwd.redraw();
//             }, updateTime * 1.5);
        }
    }
}
